'use client';

import { useState } from 'react';
import { useServiceHealth, type ServiceHealthStatus } from '@/lib/hooks/useServiceHealth';

const CONFIG: Record<ServiceHealthStatus, { dot: string; ping: string; label: string; text: string }> = {
  checking: { dot: 'bg-gray-400', ping: 'bg-gray-400/40', label: 'กำลังตรวจสอบการเชื่อมต่อ...', text: 'text-gray-600' },
  connected: { dot: 'bg-green-500', ping: 'bg-green-500/40', label: 'เชื่อมต่อระบบแล้ว', text: 'text-green-600' },
  degraded: { dot: 'bg-amber-500', ping: 'bg-amber-500/40', label: 'ระบบทำงานไม่สมบูรณ์', text: 'text-amber-600' },
  disconnected: { dot: 'bg-red-500', ping: 'bg-red-500/40', label: 'เชื่อมต่อระบบไม่ได้', text: 'text-red-600' },
};

function describeTarget(target: string): { host: string; port: string; protocol: string } {
  try {
    const u = new URL(target);
    return {
      host: u.hostname,
      port: u.port || (u.protocol === 'https:' ? '443' : '80'),
      protocol: u.protocol.replace(':', ''),
    };
  } catch {
    return { host: target || '-', port: '-', protocol: '-' };
  }
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className={`text-right text-gray-800 ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  );
}

export default function ServiceStatusIndicator() {
  const { status, lastChecked, httpStatus, latencyMs, target, endpoint, dependencies, refresh } = useServiceHealth();
  const [open, setOpen] = useState(false);
  const cfg = CONFIG[status];
  const { host, port, protocol } = describeTarget(target);

  const checkedAt = lastChecked
    ? lastChecked.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '-';

  const showLabel = open || status !== 'connected';

  return (
    <div className="fixed bottom-3 left-3 z-[100] flex flex-col items-start select-none print:hidden">
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-gray-800">การเชื่อมต่อ Service หลังบ้าน</span>
            <button
              type="button"
              onClick={() => refresh()}
              className="rounded px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-blue-50"
            >
              รีเฟรช
            </button>
          </div>
          <dl className="space-y-1">
            <Row label="สถานะ" value={cfg.label} />
            <Row label="โปรโตคอล" value={protocol} />
            <Row label="โฮสต์" value={host} mono />
            <Row label="พอร์ต" value={port} mono />
            <Row label="Endpoint" value={endpoint} mono />
            <Row label="HTTP" value={httpStatus != null ? String(httpStatus) : '—'} />
            <Row label="Latency" value={latencyMs != null ? `${latencyMs} ms` : '—'} />
            <Row label="ตรวจสอบล่าสุด" value={checkedAt} />
          </dl>
          {dependencies.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <div className="mb-1 font-semibold text-gray-700">องค์ประกอบระบบ</div>
              <dl className="space-y-1">
                {dependencies.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <dt className="text-gray-500">{d.name}</dt>
                    <dd className={d.status === 'up' ? 'text-green-600' : 'text-red-600'}>{d.status}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        title={`สถานะการเชื่อมต่อ service หลังบ้าน: ${cfg.label} — ${host}:${port} (ตรวจสอบล่าสุด ${checkedAt})`}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur transition hover:bg-white"
      >
        <span className="relative flex h-2.5 w-2.5">
          {(status === 'checking' || status === 'connected') && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.ping}`} />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        </span>
        {showLabel && <span className={cfg.text}>{cfg.label}</span>}
      </button>
    </div>
  );
}
