'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, ShoppingBag, CreditCard, Plus, RefreshCw, ChefHat } from 'lucide-react';
import { api, OrderResponse } from '@/lib/api';
import { TableSession } from '@/types';

interface POSOrderStatusProps {
  tableId: number;
  tableNumber: string;
  session: TableSession | null;
  onAddMore: () => void;
  onPayment: () => void;
}

const statusLabels: Record<string, { label: string; color: string; borderColor: string }> = {
  PENDING: { label: 'รอยืนยัน', color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-l-yellow-500' },
  CONFIRMED: { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-700', borderColor: 'border-l-blue-500' },
  PREPARING: { label: 'กำลังทำ', color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30', borderColor: 'border-l-orange-500' },
  READY: { label: 'พร้อมเสิร์ฟ', color: 'bg-green-100 text-green-700', borderColor: 'border-l-green-500' },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-700', borderColor: 'border-l-gray-400' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', borderColor: 'border-l-red-500' },
};

export default function POSOrderStatus({ tableId, tableNumber, session, onAddMore, onPayment }: POSOrderStatusProps) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const allOrders = await api.getUnpaidOrders();
      const tableOrders = allOrders.filter((o: OrderResponse) => o.tableNumber === tableNumber);
      setOrders(tableOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [tableNumber]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

  const sessionDuration = session
    ? Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 60000)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100/50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Session Info */}
      {session && (
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">โต๊ะ {tableNumber}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {session.customerCount} คน
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {sessionDuration} นาที
                </span>
                {session.orderType && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200/50">
                    {session.orderType === 'dine_in' ? 'ทานที่ร้าน' : session.orderType === 'takeaway' ? 'สั่งกลับบ้าน' : session.orderType}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{orders.length} ออเดอร์ / {totalItems} รายการ</p>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-1 rounded-xl border border-blue-200/50 mt-1 inline-block">
                <p className="text-2xl font-bold text-blue-600">฿{totalAmount.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">ยังไม่มีออเดอร์</p>
            <p className="text-sm">กดปุ่มด้านล่างเพื่อสั่งอาหาร</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {orders.map((order) => {
              const orderStatus = statusLabels[order.status] || statusLabels.PENDING;
              return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${orderStatus.borderColor}`}>
                  {/* Order Header */}
                  <div className="px-5 py-3 border-b border-gray-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-blue-600">{order.orderId}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${orderStatus.color}`}>
                        {orderStatus.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="px-5 py-3 divide-y divide-gray-100">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                            <ChefHat className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{item.menuItem?.name || 'Unknown'}</span>
                            <span className="text-gray-400 ml-2">x{item.quantity}</span>
                            {item.specialInstructions && (
                              <p className="text-xs text-gray-400 mt-0.5">{item.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700">฿{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="px-5 py-3 bg-gradient-to-br from-gray-50 to-gray-100/50 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{order.items?.length || 0} รายการ</span>
                    <span className="font-bold text-gray-800">฿{order.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-4 md:px-6 py-4 flex gap-4">
        <button
          onClick={onAddMore}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          สั่งเพิ่ม
        </button>
        <button
          onClick={onPayment}
          disabled={orders.length === 0}
          className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-xl active:scale-[0.98] transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          ชำระเงิน ฿{totalAmount.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
