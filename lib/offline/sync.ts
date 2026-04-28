import {
  getUnsyncedOrders,
  markOrderSynced,
  markOrderError,
  getUnsyncedPayments,
  markPaymentSynced,
} from './db';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

function getBranchId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selectedBranchId');
  }
  return null;
}

export async function syncOfflineOrders(): Promise<{ synced: number; failed: number }> {
  const unsyncedOrders = await getUnsyncedOrders();
  let synced = 0;
  let failed = 0;

  for (const order of unsyncedOrders) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getBranchId() ? { 'x-branch-id': getBranchId()! } : {}),
        },
        body: JSON.stringify(order.data),
      });

      if (response.ok) {
        await markOrderSynced(order.id!);
        synced++;
      } else {
        const errorText = await response.text();
        await markOrderError(order.id!, errorText);
        failed++;
      }
    } catch (err: any) {
      await markOrderError(order.id!, err.message);
      failed++;
    }
  }

  return { synced, failed };
}

export async function syncOfflinePayments(): Promise<{ synced: number; failed: number }> {
  const unsyncedPayments = await getUnsyncedPayments();
  let synced = 0;
  let failed = 0;

  for (const payment of unsyncedPayments) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getBranchId() ? { 'x-branch-id': getBranchId()! } : {}),
        },
        body: JSON.stringify(payment.data),
      });

      if (response.ok) {
        await markPaymentSynced(payment.id!);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export async function syncAll(): Promise<{ orders: { synced: number; failed: number }; payments: { synced: number; failed: number } }> {
  const orders = await syncOfflineOrders();
  const payments = await syncOfflinePayments();
  return { orders, payments };
}

// Listen for service worker sync messages
export function setupSyncListener() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_OFFLINE_ORDERS') {
      syncAll();
    }
  });
}
