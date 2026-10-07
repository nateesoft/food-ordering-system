import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Helpers for `GET <basePath>/api/health/info` — installation / runtime details
 * of this Next.js app. Server-only (reads files from the deploy dir).
 */

export type ComponentStatus = 'up' | 'down';

export interface ConfigCheck {
  name: string;
  value: string | undefined;
  required?: boolean;
  /** Never echo the value; only report whether it is set. */
  secret?: boolean;
  /** Values that mean "still the example/default" — flagged as an issue. */
  insecureDefaults?: string[];
}

export interface ConfigResult {
  name: string;
  set: boolean;
  value?: string;
  issue?: string;
}

const PROBE_TIMEOUT_MS = 5_000;

// fs paths are written inline as path.join(process.cwd(), '<literal>') so the bundler
// (Turbopack) can analyse them — passing a path through a helper triggers TP1004.
function readBuildInfo(): { id: string | null; builtAt: string | null } {
  try {
    return {
      id: fs.readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim(),
      builtAt: fs.statSync(path.join(process.cwd(), '.next', 'BUILD_ID')).mtime.toISOString(),
    };
  } catch {
    return { id: null, builtAt: null };
  }
}

function readPackageVersions(): { name?: string; version?: string; nextVersion?: string } {
  let pkg: { name?: string; version?: string } = {};
  let nextPkg: { version?: string } = {};
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  } catch {}
  try {
    nextPkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'node_modules', 'next', 'package.json'), 'utf8'),
    );
  } catch {}
  return { name: pkg.name, version: pkg.version, nextVersion: nextPkg.version };
}

export function getRuntimeInfo(basePath: string) {
  const pkg = readPackageVersions();

  return {
    name: pkg.name ?? 'unknown',
    version: pkg.version ?? 'unknown',
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT) || null,
    basePath,
    nextVersion: pkg.nextVersion ?? null,
    build: readBuildInfo(),
    hostname: os.hostname(),
    platform: `${process.platform} ${os.release()} (${process.arch})`,
    nodeVersion: process.version,
    pid: process.pid,
    pm2:
      process.env.pm_id !== undefined
        ? { id: Number(process.env.pm_id), name: process.env.name ?? null }
        : null,
    cwd: process.cwd(),
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}

export function checkConfig(checks: ConfigCheck[]): ConfigResult[] {
  return checks.map(({ name, value, required, secret, insecureDefaults }) => {
    const set = value !== undefined && value !== '';
    const result: ConfigResult = { name, set };
    if (set && !secret) result.value = value;
    if (!set && required) result.issue = 'missing';
    else if (set && insecureDefaults?.includes(value as string)) result.issue = 'using example/default value';
    return result;
  });
}

/** Strip credentials from a URL before echoing it. */
export function safeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.username = '';
    url.password = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}

/**
 * Probe food-ordering-service. Prefers `/api/health/info` (rich report) and
 * falls back to `/api/health` for older service builds.
 */
export async function probeBackend(apiBaseUrl: string) {
  const base = apiBaseUrl.replace(/\/$/, '');
  const startedAt = Date.now();

  for (const endpoint of [`${base}/health/info`, `${base}/health`]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
      if (res.status === 404 && endpoint.endsWith('/info')) continue;

      const body = (await res.json().catch(() => null)) as Record<string, any> | null;
      const reportedStatus: string | undefined = body?.status;
      const healthy = res.ok && (reportedStatus === undefined || reportedStatus === 'ok');

      return {
        status: (healthy ? 'up' : 'down') as ComponentStatus,
        endpoint: safeUrl(endpoint),
        httpStatus: res.status,
        latencyMs: Date.now() - startedAt,
        reportedStatus: reportedStatus ?? null,
        version: body?.service?.version ?? null,
        database: body?.database
          ? {
              status: body.database.status ?? null,
              name: body.database.name ?? null,
              migrationsComplete: body.database.migrations?.complete ?? null,
            }
          : null,
      };
    } catch (error) {
      return {
        status: 'down' as ComponentStatus,
        endpoint: safeUrl(endpoint),
        httpStatus: null,
        latencyMs: Date.now() - startedAt,
        error: (error as Error).name === 'AbortError' ? `timeout after ${PROBE_TIMEOUT_MS}ms` : String((error as Error).message ?? error),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return { status: 'down' as ComponentStatus, endpoint: safeUrl(base), httpStatus: 404, latencyMs: Date.now() - startedAt };
}
