'use client';

import React from 'react';
import { X, Clock, CheckCircle, Package } from 'lucide-react';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderHistoryProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, orders, onClose }) => {
  const { t, language } = useLanguage();

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
        return t.orderHistory.statusPreparing;
      case 'completed':
        return t.orderHistory.statusCompleted;
      case 'delivered':
        return t.orderHistory.statusDelivered;
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
              {t.orderHistory.totalOrders} {orders.length} {t.orderHistory.orders}
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
                      {order.items.map((item) => (
                        <div key={item.cartItemId} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <p className="font-medium text-gray-700">
                              {item.name} x{item.quantity}
                            </p>
                            {item.specialInstructions && (
                              <p className="text-xs text-orange-600 mt-0.5">
                                • {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <p className="text-gray-600 font-medium">
                            {t.common.baht}{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
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
