import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/session-jwt';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';

function menuUrl(request: NextRequest): string {
  // ใช้ Host header จาก browser แทน request.nextUrl.origin
  // เพราะ server bind บน 0.0.0.0 ทำให้ origin กลายเป็น http://0.0.0.0:PORT
  const host = request.headers.get('host') ?? 'localhost:3333';
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}/food-ordering`;
}

function errorResponse(message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem">
      <h2>ไม่พบข้อมูลโต๊ะ</h2><p>${message}</p>
    </body></html>`,
    { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string; tableNumber: string } },
) {
  const { branchId, tableNumber } = params;
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  // 1.1 ตรวจสอบว่ามีข้อมูลครบ
  if (!branchId || !tableNumber || !sessionId) {
    return errorResponse('กรุณาสแกน QR Code ใหม่อีกครั้ง หรือติดต่อพนักงาน');
  }

  // 1.3 บันทึก sessionId ไว้ที่ Redis
  try {
    await fetch(`${API_URL}/tables/register-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-branch-id': branchId },
      body: JSON.stringify({ sessionId, tableNumber }),
    });
  } catch {
    // ดำเนินการต่อ — หน้าเมนูจะแสดงข้อผิดพลาดหากไม่มี session ใน Redis
  }

  // หมายเหตุ: ไม่สร้าง Order ที่นี่ เพื่อไม่ให้เสีย Order เปล่า
  // Order จะถูกสร้างเมื่อลูกค้ากด "สั่งอาหาร" จริงๆ เท่านั้น

  // 1.2 สร้าง JWT และเก็บใน Cookie
  const token = signSession({ branchId, tableNumber, sessionId });

  // 1.5 Redirect ไปหน้าเมนู
  const response = NextResponse.redirect(menuUrl(request));
  response.cookies.set('food_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 3, // 3 ชั่วโมง
  });
  return response;
}
