import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

export interface OfflineOrder {
  id?: number;
  data: any;
  createdAt: string;
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

export interface OfflinePayment {
  id?: number;
  data: any;
  createdAt: string;
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

export interface CachedMenuItem {
  id: number;
  data: any;
  cachedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Offline orders store
        if (!db.objectStoreNames.contains('offlineOrders')) {
          const orderStore = db.createObjectStore('offlineOrders', {
            keyPath: 'id',
            autoIncrement: true,
          });
          orderStore.createIndex('synced', 'synced');
        }

        // Offline payments store
        if (!db.objectStoreNames.contains('offlinePayments')) {
          const paymentStore = db.createObjectStore('offlinePayments', {
            keyPath: 'id',
            autoIncrement: true,
          });
          paymentStore.createIndex('synced', 'synced');
        }

        // Cached menu items
        if (!db.objectStoreNames.contains('cachedMenu')) {
          db.createObjectStore('cachedMenu', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// === Offline Orders ===
export async function addOfflineOrder(orderData: any): Promise<number> {
  const db = await getDB();
  return db.add('offlineOrders', {
    data: orderData,
    createdAt: new Date().toISOString(),
    synced: false,
  }) as Promise<number>;
}

export async function getUnsyncedOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  const all = await db.getAll('offlineOrders');
  return all.filter((o) => !o.synced);
}

export async function markOrderSynced(id: number): Promise<void> {
  const db = await getDB();
  const order = await db.get('offlineOrders', id);
  if (order) {
    order.synced = true;
    order.syncedAt = new Date().toISOString();
    await db.put('offlineOrders', order);
  }
}

export async function markOrderError(id: number, error: string): Promise<void> {
  const db = await getDB();
  const order = await db.get('offlineOrders', id);
  if (order) {
    order.error = error;
    await db.put('offlineOrders', order);
  }
}

// === Offline Payments ===
export async function addOfflinePayment(paymentData: any): Promise<number> {
  const db = await getDB();
  return db.add('offlinePayments', {
    data: paymentData,
    createdAt: new Date().toISOString(),
    synced: false,
  }) as Promise<number>;
}

export async function getUnsyncedPayments(): Promise<OfflinePayment[]> {
  const db = await getDB();
  const all = await db.getAll('offlinePayments');
  return all.filter((p) => !p.synced);
}

export async function markPaymentSynced(id: number): Promise<void> {
  const db = await getDB();
  const payment = await db.get('offlinePayments', id);
  if (payment) {
    payment.synced = true;
    payment.syncedAt = new Date().toISOString();
    await db.put('offlinePayments', payment);
  }
}

// === Cached Menu ===
export async function cacheMenuItems(items: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cachedMenu', 'readwrite');
  await Promise.all([
    ...items.map((item) =>
      tx.store.put({ id: item.id, data: item, cachedAt: new Date().toISOString() })
    ),
    tx.done,
  ]);
}

export async function getCachedMenuItems(): Promise<any[]> {
  const db = await getDB();
  const items = await db.getAll('cachedMenu');
  return items.map((i) => i.data);
}

export async function clearCachedMenu(): Promise<void> {
  const db = await getDB();
  await db.clear('cachedMenu');
}
