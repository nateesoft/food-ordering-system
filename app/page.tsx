import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session-jwt';
import TableOrderClient from '@/app/[branchId]/table/[tableNumber]/TableOrderClient';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';

async function validateRedisSession(branchId: string, sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/tables/validate-session/${sessionId}`, {
      headers: { 'x-branch-id': branchId },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

type SessionOrderStatus = 'NO_ORDERS' | 'HAS_ACTIVE' | 'ALL_ENDED';

async function checkSessionOrders(
  branchId: string,
  tableNumber: string,
  sessionId: string,
): Promise<SessionOrderStatus> {
  try {
    const res = await fetch(
      `${API_URL}/orders?tableNumber=${encodeURIComponent(tableNumber)}&sessionId=${encodeURIComponent(sessionId)}`,
      {
        headers: { 'x-branch-id': branchId },
        cache: 'no-store',
      },
    );
    if (!res.ok) return 'NO_ORDERS';
    const orders: Array<{ status: string }> = await res.json();

    // ยังไม่มี Order เลย = ลูกค้าเพิ่ง scan QR ยังไม่ได้สั่ง
    if (orders.length === 0) return 'NO_ORDERS';

    // มี Order ที่ยัง active อยู่อย่างน้อย 1 รายการ
    const hasActive = orders.some((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED');
    return hasActive ? 'HAS_ACTIVE' : 'ALL_ENDED';
  } catch {
    return 'NO_ORDERS';
  }
}

function TableNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลโต๊ะ</h2>
        <p className="text-gray-500 mb-2">ไม่พบข้อมูลโต๊ะในระบบ</p>
        <p className="text-gray-400 text-sm">
          กรุณาสแกน QR Code ใหม่อีกครั้ง หรือติดต่อพนักงาน
        </p>
      </div>
    </div>
  );
}

export default async function MenuPage() {
  // 2.1 ตรวจสอบ JWT ใน Cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('food_session')?.value;
  if (!token) return <TableNotFound />;

  const payload = verifySession(token);
  if (!payload) return <TableNotFound />;

  const { branchId, tableNumber, sessionId } = payload;

  // 2.2 ตรวจสอบ sessionId ใน Redis
  const sessionValid = await validateRedisSession(branchId, sessionId);
  if (!sessionValid) return <TableNotFound />;

  // 2.3/2.4 ตรวจสอบสถานะ Order ของ session นี้
  const orderStatus = await checkSessionOrders(branchId, tableNumber, sessionId);

  // ถ้า Order ทั้งหมดจบแล้ว (ชำระเงิน/ยกเลิก) ไม่อนุญาตให้เข้าใช้งาน
  if (orderStatus === 'ALL_ENDED') return <TableNotFound />;

  // NO_ORDERS = ยังไม่เคยสั่ง (session ใหม่), HAS_ACTIVE = มี Order ที่ยัง active
  return <TableOrderClient branchId={branchId} tableNumber={tableNumber} sessionId={sessionId} />;
}
