'use client';

import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, Package, Truck } from 'lucide-react';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderHistoryProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, orders: initialOrders, onClose }) => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Update orders when initialOrders changes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Poll for order updates from localStorage every 3 seconds
  useEffect(() => {
    if (!isOpen) return;

    const loadOrders = () => {
      const savedOrders = localStorage.getItem('orderHistory');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
      }
    };

    // Initial load
    loadOrders();

    // Poll every 3 seconds
    const interval = setInterval(loadOrders, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'delivered':
        return <Package className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return t.orderHistory.preparing;
      case 'completed':
        return t.orderHistory.completed;
      case 'delivered':
        return t.orderHistory.delivered;
      default:
        return '';
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      default:
        return '';
    }
  };

  const getItemStatusIcon = (status?: 'preparing' | 'completed' | 'delivered') => {
    switch (status) {
      case 'preparing':
        return <Clock className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'delivered':
        return <Truck className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getItemStatusColor = (status?: 'preparing' | 'completed' | 'delivered') => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getItemStatusText = (status?: 'preparing' | 'completed' | 'delivered') => {
    switch (status) {
      case 'preparing':
        return 'กำลังทำ';
      case 'completed':
        return 'เสร็จแล้ว';
      case 'delivered':
        return 'ส่งแล้ว';
      default:
        return 'กำลังทำ';
    }
  };

  const getWaitingMinutesForOrder = (orderDate: Date) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    return Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
  };

  const getEmotionForItem = (orderDate: Date, itemStatus?: 'preparing' | 'completed' | 'delivered') => {
    if (itemStatus === 'delivered') {
      return null; // Don't show emotion for delivered items
    }

    const waitingMinutes = getWaitingMinutesForOrder(orderDate);

    if (waitingMinutes <= 5) {
      return { emoji: '😊', color: 'text-green-600' };
    } else if (waitingMinutes <= 10) {
      return { emoji: '😐', color: 'text-yellow-600' };
    } else if (waitingMinutes <= 20) {
      return { emoji: '😕', color: 'text-orange-600' };
    } else if (waitingMinutes <= 30) {
      return { emoji: '😤', color: 'text-red-600' };
    } else {
      return { emoji: '😡', color: 'text-red-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t.orderHistory.title}</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-orange-100 mt-1">
              {orders.length} {t.orderHistory.totalOrders}
            </p>
          </div>

          {/* Orders List */}
          <div className="flex-1 p-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="w-20 h-20 mb-4" />
                <p className="text-lg">{t.orderHistory.noOrders}</p>
                <p className="text-sm">{t.orderHistory.startOrdering}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          #{order.orderId.slice(-8)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusText(order.status)}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map((item) => {
                        const emotion = getEmotionForItem(order.orderDate, item.itemStatus);
                        const waitingMinutes = getWaitingMinutesForOrder(order.orderDate);

                        return (
                        <div key={item.cartItemId} className="flex justify-between items-start text-sm gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-gray-700">
                                {item.name} x{item.quantity}
                              </p>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getItemStatusColor(item.itemStatus)}`}>
                                {getItemStatusIcon(item.itemStatus)}
                                <span>{getItemStatusText(item.itemStatus)}</span>
                              </div>
                              {emotion && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-white border-2 border-gray-200 rounded-full">
                                  <span className="text-sm">{emotion.emoji}</span>
                                  <span className={`text-xs font-bold ${emotion.color}`}>
                                    {waitingMinutes} นาที
                                  </span>
                                </div>
                              )}
                            </div>
                            {item.specialInstructions && (
                              <p className="text-xs text-orange-600 mt-0.5">
                                • {item.specialInstructions}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.diningOption === 'dine-in' ? '🍽️ ทานในร้าน' : '🥡 รับกลับบ้าน'}
                            </p>
                          </div>
                          <p className="text-gray-600 font-medium whitespace-nowrap">
                            {t.common.baht}{item.price * item.quantity}
                          </p>
                        </div>
                        );
                      })}
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {t.orderHistory.total} {order.totalItems} {t.orderHistory.items}
                      </div>
                      <div className="text-lg font-bold text-orange-500">
                        {t.common.baht}{order.totalAmount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
