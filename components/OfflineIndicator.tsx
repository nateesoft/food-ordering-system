'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { syncAll } from '@/lib/offline/sync';
import { getUnsyncedOrders } from '@/lib/offline/db';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
    }
  }, [isOnline]);

  // Check for pending items
  useEffect(() => {
    const check = async () => {
      try {
        const orders = await getUnsyncedOrders();
        setPendingCount(orders.length);
      } catch { /* idb not available */ }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline, pendingCount]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAll();
      const synced = result.orders.synced + result.payments.synced;
      if (synced > 0) {
        setPendingCount(0);
      }
    } catch { /* ignore */ }
    setSyncing(false);
  };

  // Auto-hide "back online" message
  useEffect(() => {
    if (isOnline && pendingCount === 0 && visible) {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, visible]);

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0) {
    if (visible) {
      return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white text-center py-1.5 text-sm font-medium animate-slide-up">
          กลับมาออนไลน์แล้ว
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] text-white text-center py-1.5 text-sm font-medium ${
      isOnline ? 'bg-amber-500' : 'bg-red-600'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829" />
            </svg>
            <span>Offline Mode - ข้อมูลจะถูกบันทึกในเครื่องและ sync เมื่อกลับมาออนไลน์</span>
          </>
        ) : (
          <>
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>กำลัง sync ข้อมูล...</span>
              </>
            ) : (
              <>
                <span>มี {pendingCount} รายการรอ sync</span>
                <button onClick={handleSync} className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs hover:bg-white/30">
                  Sync now
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
