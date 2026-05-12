import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import TableOrderClient from './TableOrderClient';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api';

async function getTable(branchId: string, tableNumber: string) {
  try {
    const res = await fetch(`${API_URL}/tables/number/${tableNumber}`, {
      headers: { 'x-branch-id': branchId },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function checkTableAccess(branchId: string, tableNumber: string, sessionId: string) {
  try {
    const res = await fetch(
      `${API_URL}/tables/number/${tableNumber}/check-access?sessionId=${sessionId}`,
      {
        headers: { 'x-branch-id': branchId },
        cache: 'no-store',
      },
    );
    if (!res.ok) return { canAccess: true };
    return await res.json();
  } catch {
    return { canAccess: true };
  }
}

export default async function TableOrderPage({
  params,
  searchParams,
}: {
  params: { branchId: string; tableNumber: string };
  searchParams: { sessionId?: string };
}) {
  const { branchId, tableNumber } = params;
  const sessionId = searchParams.sessionId;

  if (!sessionId) {
    const cookieStore = await cookies();
    const cookieSessionId =
      cookieStore.get(`sessionId_${branchId}_${tableNumber}`)?.value ??
      cookieStore.get('session_id')?.value ??
      randomUUID();
    redirect(`/${branchId}/table/${tableNumber}?sessionId=${cookieSessionId}`);
  }

  const [table, accessCheck] = await Promise.all([
    getTable(branchId, tableNumber),
    checkTableAccess(branchId, tableNumber, sessionId),
  ]);

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบโต๊ะนี้</h2>
          <p className="text-gray-500 mb-2">
            ไม่พบโต๊ะ <span className="font-semibold text-gray-700">{tableNumber}</span> ในระบบ
          </p>
          <p className="text-gray-400 text-sm">กรุณาตรวจสอบหมายเลขโต๊ะหรือติดต่อพนักงาน</p>
        </div>
      </div>
    );
  }

  if (!accessCheck.canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่สามารถเข้าใช้งานได้</h2>
          <p className="text-gray-500 mb-1">โต๊ะ <span className="font-semibold text-gray-700">{tableNumber}</span></p>
          <p className="text-gray-500 mb-6">
            โต๊ะนี้ยังมีรายการที่ยังไม่ได้ชำระเงินอยู่
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">การเข้าใช้งานไม่ถูกต้อง</p>
            <p className="text-red-600 text-xs mt-1">
              กรุณาติดต่อพนักงานเพื่อดำเนินการต่อ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <TableOrderClient branchId={branchId} tableNumber={tableNumber} sessionId={sessionId} />;
}
