'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/lib/offline/sw-register';
import { setupSyncListener } from '@/lib/offline/sync';
import OfflineIndicator from '@/components/OfflineIndicator';

export default function PWAProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    registerServiceWorker();
    setupSyncListener();
  }, []);

  // Only render after mount to avoid hydration mismatch
  if (!mounted) return null;

  return <OfflineIndicator />;
}
