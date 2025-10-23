'use client';

import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Check, ChevronRight, Edit2, X } from 'lucide-react';
import { CartItem } from '@/types';

interface CartSidebarProps {
  isOpen: boolean;
  cart: CartItem[];
  totalAmount: number;
  totalItems: number;
  orderConfirmed: boolean;
  onClose: () => void;
  onIncreaseQuantity: (cartItemId: string) => void;
  onDecreaseQuantity: (cartItemId: string) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onUpdateSpecialInstructions: (cartItemId: string, instructions: string) => void;
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
  onUpdateSpecialInstructions,
  onConfirmOrder,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');

  const commonInstructions = [
    'เผ็ดมาก',
    'เผ็ดน้อย',
    'ไม่เผ็ด',
    'ไม่ใส่ผัก',
    'ไม่ใส่ผักชี',
    'แยกน้ำจิ้ม',
  ];

  const handleEditClick = (item: CartItem) => {
    setEditingItemId(item.cartItemId);

    // แยกคำขอพิเศษที่มีอยู่แล้ว
    if (item.specialInstructions) {
      const instructions = item.specialInstructions.split(',').map(s => s.trim());
      const selected = instructions.filter(inst => commonInstructions.includes(inst));
      const custom = instructions.filter(inst => !commonInstructions.includes(inst)).join(', ');

      setSelectedInstructions(selected);
      setCustomInstruction(custom);
    } else {
      setSelectedInstructions([]);
      setCustomInstruction('');
    }
  };

  const handleSaveInstructions = (cartItemId: string) => {
    const allInstructions = [...selectedInstructions];
    if (customInstruction.trim()) {
      allInstructions.push(customInstruction.trim());
    }
    const finalInstructions = allInstructions.join(', ');
    onUpdateSpecialInstructions(cartItemId, finalInstructions);
    setEditingItemId(null);
    setSelectedInstructions([]);
    setCustomInstruction('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setSelectedInstructions([]);
    setCustomInstruction('');
  };

  const toggleInstruction = (instruction: string) => {
    setSelectedInstructions(prev => {
      if (prev.includes(instruction)) {
        return prev.filter(item => item !== instruction);
      } else {
        return [...prev, instruction];
      }
    });
  };

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
                  <div key={item.cartItemId} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-orange-600 font-semibold">฿{item.price}</p>
                      </div>
                      <button
                        onClick={() => onRemoveFromCart(item.cartItemId)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* แสดงคำขอพิเศษ */}
                    {item.specialInstructions && editingItemId !== item.cartItemId && (
                      <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-800 font-medium">คำขอพิเศษ:</p>
                        <p className="text-sm text-orange-900">{item.specialInstructions}</p>
                      </div>
                    )}

                    {/* ปุ่มแก้ไขคำขอพิเศษ */}
                    {editingItemId !== item.cartItemId && (
                      <button
                        onClick={() => handleEditClick(item)}
                        className="mb-3 text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        {item.specialInstructions ? 'แก้ไขคำขอพิเศษ' : 'เพิ่มคำขอพิเศษ'}
                      </button>
                    )}

                    {/* ฟอร์มแก้ไขคำขอพิเศษ */}
                    {editingItemId === item.cartItemId && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-orange-300">
                        <p className="text-xs text-gray-600 mb-2">คำขอพิเศษ (เลือกได้หลายรายการ):</p>

                        {/* ปุ่มคำแนะนำที่ใช้บ่อย */}
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {commonInstructions.map((instruction) => (
                              <button
                                key={instruction}
                                onClick={() => toggleInstruction(instruction)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  selectedInstructions.includes(instruction)
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {instruction}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* แสดงรายการที่เลือก */}
                        {selectedInstructions.length > 0 && (
                          <div className="mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                            <p className="text-xs text-orange-800 font-medium">คำขอที่เลือก: {selectedInstructions.join(', ')}</p>
                          </div>
                        )}

                        <textarea
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          placeholder="พิมพ์คำขอพิเศษเพิ่มเติม..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all font-medium"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleSaveInstructions(item.cartItemId)}
                            className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all font-medium"
                          >
                            บันทึก
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm">
                        <button
                          onClick={() => onDecreaseQuantity(item.cartItemId)}
                          className="p-2 hover:bg-gray-100 rounded-l-lg transition-all"
                        >
                          <Minus className="w-4 h-4 text-orange-500" />
                        </button>
                        <span className="font-bold text-gray-800 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onIncreaseQuantity(item.cartItemId)}
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
