'use client';

import React, { forwardRef } from 'react';
import { QueueTicket } from '@/types';

interface QueueTicketPrintProps {
  queue: QueueTicket;
}

export const QueueTicketPrint = forwardRef<HTMLDivElement, QueueTicketPrintProps>(
  ({ queue }, ref) => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-md mx-auto" style={{ fontFamily: 'monospace' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-6 mb-6">
          <h1 className="text-4xl font-bold mb-2">🍽️ ร้านอาหาร</h1>
          <p className="text-xl text-gray-600">บัตรคิว / Queue Ticket</p>
        </div>

        {/* Queue Number */}
        <div className="text-center bg-gray-100 rounded-xl p-8 mb-6">
          <p className="text-2xl text-gray-600 mb-2">หมายเลขคิว</p>
          <div className="text-8xl font-bold text-orange-600 mb-2">{queue.queueId}</div>
          <p className="text-xl text-gray-500">
            {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
          </p>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4 border-b border-gray-300 pb-2">รายการสั่งซื้อ</h3>
          <div className="space-y-3">
            {queue.items.map((item, index) => (
              <div key={item.cartItemId} className="flex justify-between text-lg">
                <div className="flex-1">
                  <span className="text-gray-700">
                    {index + 1}. {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  )}
                  {item.specialInstructions && (
                    <div className="text-sm text-gray-500 ml-4 mt-1">
                      📝 {item.specialInstructions}
                    </div>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <div className="text-sm text-gray-500 ml-4 mt-1">
                      + {item.selectedAddOns.map(a => a.name).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-bold text-gray-800 ml-4">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 border-gray-400 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-800">ยอดรวม</span>
            <span className="text-3xl font-bold text-orange-600">
              ฿{queue.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center border-t border-dashed border-gray-400 pt-6 space-y-2">
          <p className="text-lg text-gray-600">
            ⏱️ เวลาโดยประมาณ: {queue.estimatedTime} นาที
          </p>
          <p className="text-sm text-gray-500">
            วันที่: {formatDate(queue.createdAt)}
          </p>
          <p className="text-sm text-gray-500">
            จำนวน: {queue.totalItems} รายการ
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 border-t border-dashed border-gray-400 pt-6">
          <p className="text-lg font-bold text-gray-700">กรุณารอรับอาหารที่เคาน์เตอร์</p>
          <p className="text-base text-gray-500 mt-2">ขอบคุณที่ใช้บริการ</p>
          <p className="text-sm text-gray-400 mt-4">Powered by Food Ordering System</p>
        </div>

        {/* Barcode Placeholder */}
        <div className="flex justify-center mt-6">
          <div className="bg-gray-900 h-20 w-64 flex items-center justify-center rounded">
            <span className="text-white text-xs">{queue.queueId}</span>
          </div>
        </div>
      </div>
    );
  }
);

QueueTicketPrint.displayName = 'QueueTicketPrint';
