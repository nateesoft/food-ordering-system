import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import TableOrderClient from './TableOrderClient';

export const dynamic = 'force-dynamic';

async function getTable(branchId: string, tableNumber: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api';
  try {
    const res = await fetch(`${apiUrl}/tables/number/${tableNumber}`, {
      headers: { 'x-branch-id': branchId },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
    const newSessionId = randomUUID();
    redirect(`/${branchId}/table/${tableNumber}?sessionId=${newSessionId}`);
  }

  const table = await getTable(branchId, tableNumber);

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

  return <TableOrderClient branchId={branchId} tableNumber={tableNumber} sessionId={sessionId} />;
}
