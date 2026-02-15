'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Payment } from '@/types';

interface POSReceiptProps {
  payment: Payment;
  mergedOrders?: any[] | null;
  onClose: () => void;
}

export default function POSReceipt({ payment, mergedOrders, onClose }: POSReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const paymentMethodLabel: Record<string, string> = {
    CASH: 'เงินสด',
    TRANSFER: 'เงินโอน',
    CREDIT_CARD: 'บัตรเครดิต',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 print:p-4" id="receipt-content">
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold">ร้านอาหาร</h2>
            <p className="text-sm text-gray-500">Food Ordering System</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>เลขที่: {payment.receiptNumber}</p>
              <p>วันที่: {payment.paidAt ? new Date(payment.paidAt).toLocaleString('th-TH') : '-'}</p>
              {payment.cashierName && <p>แคชเชียร์: {payment.cashierName}</p>}
            </div>
          </div>

          {mergedOrders && mergedOrders.length > 0 ? (
            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-gray-600">
                รวม {mergedOrders.length} ออเดอร์
                {mergedOrders[0]?.tableNumber && ` | โต๊ะ ${mergedOrders[0].tableNumber}`}
              </p>
              {mergedOrders.map((order: any) => (
                <div key={order.id} className="mb-2">
                  <p className="text-xs text-gray-400 font-medium">{order.orderId}</p>
                  <div className="space-y-1">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.menuItem?.name || 'Unknown'} x{item.quantity}</span>
                        <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : payment.order && (
            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-gray-600">
                Order: {payment.order.orderId}
                {payment.order.tableNumber && ` | โต๊ะ ${payment.order.tableNumber}`}
              </p>
              <div className="space-y-1">
                {payment.order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.menuItem?.name || 'Unknown'} x{item.quantity}</span>
                    <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <div className="flex justify-between text-sm">
              <span>ยอดรวม</span>
              <span>฿{payment.subtotal.toFixed(2)}</span>
            </div>
            {(payment.serviceCharge || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service Charge 10%</span>
                <span>฿{payment.serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {(payment.vat || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT 7%</span>
                <span>฿{payment.vat.toFixed(2)}</span>
              </div>
            )}
            {payment.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>ส่วนลดแต้ม ({payment.discountPoints} แต้ม)</span>
                <span>-฿{payment.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {payment.promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>โปรโมชัน: {payment.promotionName || 'ส่วนลด'}</span>
                <span>-฿{payment.promotionDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดสุทธิ</span>
              <span>฿{payment.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ชำระด้วย: {paymentMethodLabel[payment.paymentMethod]}</span>
              <span>฿{payment.paidAmount.toFixed(2)}</span>
            </div>
            {payment.changeAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-blue-600">
                <span>เงินทอน</span>
                <span>฿{payment.changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {payment.memberId && (
            <div className="text-center text-sm text-gray-600 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p>สมาชิก: {payment.memberName} ({payment.memberId})</p>
              {payment.pointsEarned > 0 && (
                <p className="text-green-600">ได้รับแต้ม: +{payment.pointsEarned} แต้ม</p>
              )}
            </div>
          )}

          <div className="text-center text-sm text-gray-400">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>Thank you!</p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t print:hidden">
          <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" /> พิมพ์ใบเสร็จ
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2">
            <X className="w-5 h-5" /> ปิด
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 80mm; }
        }
      `}</style>
    </div>
  );
}
