'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export type ServiceHealthStatus = 'checking' | 'connected' | 'degraded' | 'disconnected';

export interface ServiceDependency {
  name: string;
  status: string;
}

export interface ServiceHealth {
  status: ServiceHealthStatus;
  lastChecked: Date | null;
  httpStatus: number | null;
  latencyMs: number | null;
  /** Base origin the app talks to, e.g. `http://localhost:5555` */
  target: string;
  /** Full URL that was probed */
  endpoint: string;
  /** Per-dependency status reported by the service (database / broker / ...) */
  dependencies: ServiceDependency[];
  refresh: () => void;
}

const POLL_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;

function deriveTarget(): string {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host || u.hostname}`;
  } catch {
    return API_BASE_URL;
  }
}

function deriveEndpoint(): string {
  try {
    return new URL(`${API_BASE_URL}/health`).toString();
  } catch {
    return `${API_BASE_URL}/health`;
  }
}

function parseDependencies(body: unknown): ServiceDependency[] {
  const record = body as { details?: Record<string, { status?: string }>; info?: Record<string, { status?: string }> } | null;
  const src = record?.details ?? record?.info;
  if (!src || typeof src !== 'object') return [];
  return Object.entries(src).map(([name, value]) => ({
    name,
    status: value?.status ?? 'unknown',
  }));
}

const TARGET = deriveTarget();
const ENDPOINT = deriveEndpoint();

/**
 * Polls the food-ordering-service health endpoint and reports whether the
 * customer web app can reach the backend, plus where it is pointed.
 *
 * - `connected`    — service replied 200 / `status: "ok"`
 * - `degraded`     — service is reachable but a dependency (DB / broker) is down (HTTP 503)
 * - `disconnected` — the request failed / timed out (service unreachable)
 */
export function useServiceHealth(): ServiceHealth {
  const [status, setStatus] = useState<ServiceHealthStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [dependencies, setDependencies] = useState<ServiceDependency[]>([]);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const res = await fetch(ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      let body: { status?: string } | null = null;
      try {
        body = await res.json();
      } catch {
        /* health check may return a non-JSON body */
      }

      setHttpStatus(res.status);
      setLatencyMs(Math.round(performance.now() - startedAt));
      setDependencies(parseDependencies(body));

      if (res.ok && (!body || body.status === 'ok')) {
        setStatus('connected');
      } else if (res.status >= 500 || body?.status === 'error') {
        setStatus('degraded');
      } else {
        setStatus('connected');
      }
    } catch {
      setHttpStatus(null);
      setLatencyMs(null);
      setDependencies([]);
      setStatus('disconnected');
    } finally {
      clearTimeout(timer);
      setLastChecked(new Date());
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    const recheck = () => check();
    window.addEventListener('focus', recheck);
    window.addEventListener('online', recheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('online', recheck);
    };
  }, [check]);

  return {
    status,
    lastChecked,
    httpStatus,
    latencyMs,
    target: TARGET,
    endpoint: ENDPOINT,
    dependencies,
    refresh: check,
  };
}
