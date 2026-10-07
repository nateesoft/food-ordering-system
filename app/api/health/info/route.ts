import { NextResponse } from 'next/server';
import { checkConfig, getRuntimeInfo, probeBackend } from '@/lib/health-info';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';

export const dynamic = 'force-dynamic';

/**
 * Installation / runtime details: port, build, config sanity and reachability
 * of food-ordering-service. Always 200 — read `status` ('ok' | 'degraded').
 * Secrets are only reported as set / not set.
 */
export async function GET() {
  const backend = await probeBackend(API_URL);

  // NEXT_PUBLIC_* are written literally so this reports the values baked into the build.
  const config = checkConfig([
    { name: 'NEXT_PUBLIC_API_URL', value: process.env.NEXT_PUBLIC_API_URL, required: true },
    {
      name: 'SESSION_SECRET',
      value: process.env.SESSION_SECRET,
      required: true,
      secret: true,
      insecureDefaults: ['change-this-to-a-random-secret-in-production', 'dev-secret-change-in-production'],
    },
    { name: 'NEXT_PUBLIC_MINIO_URL', value: process.env.NEXT_PUBLIC_MINIO_URL },
    { name: 'NEXT_PUBLIC_MINIO_HOST', value: process.env.NEXT_PUBLIC_MINIO_HOST },
    { name: 'NEXT_PUBLIC_MINIO_PORT', value: process.env.NEXT_PUBLIC_MINIO_PORT },
  ]);

  const configOk = config.every((c) => !c.issue);

  return NextResponse.json({
    status: backend.status === 'up' && configOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    app: getRuntimeInfo('/food-ordering'),
    config,
    backend,
  });
}
