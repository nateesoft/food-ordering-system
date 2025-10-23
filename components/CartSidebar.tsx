'use client';

import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Check, ChevronRight } from 'lucide-react';
import { CartItem } from '@/types';

interface CartSidebarProps {
  isOpen: boolean;
  cart: CartItem[];
  totalAmount: number;
  totalItems: number;
  orderConfirmed: boolean;
  onClose: () => void;
  onIncreaseQuantity: (id: number) => void;
  onDecreaseQuantity: (id: number) => void;
  onRemoveFromCart: (id: number) => void;
  onConfirmOrder: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  cart,
  totalAmount,
  totalItems,
  orderConfirmed,
  onClose,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveFromCart,
  onConfirmOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">ตะกร้าสินค้า</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <p className="text-orange-100 mt-1">
              {totalItems} รายการ
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="w-20 h-20 mb-4" />
                <p className="text-lg">ตะกร้าว่างเปล่า</p>
                <p className="text-sm">เพิ่มสินค้าเพื่อเริ่มสั่งอาหาร</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-orange-600 font-semibold">฿{item.price}</p>
                      </div>
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm">
                        <button
                          onClick={() => onDecreaseQuantity(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-l-lg transition-all"
                        >
                          <Minus className="w-4 h-4 text-orange-500" />
                        </button>
                        <span className="font-bold text-gray-800 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onIncreaseQuantity(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-r-lg transition-all"
                        >
                          <Plus className="w-4 h-4 text-orange-500" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-800">
                        ฿{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t bg-white p-6 space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-gray-700">ยอดรวมทั้งหมด</span>
                <span className="font-bold text-2xl text-orange-500">฿{totalAmount}</span>
              </div>
              <button
                onClick={onConfirmOrder}
                disabled={orderConfirmed}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                  orderConfirmed
                    ? 'bg-green-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {orderConfirmed ? (
                  <>
                    <Check className="w-6 h-6" />
                    <span>สั่งอาหารสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    <span>ยืนยันการสั่งซื้อ</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
