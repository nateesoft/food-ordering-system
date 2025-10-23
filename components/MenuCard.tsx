'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MenuItem } from '@/types';
import StarRating from './StarRating';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, specialInstructions?: string, diningOption?: 'dine-in' | 'takeaway') => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [diningOption, setDiningOption] = useState<'dine-in' | 'takeaway'>('dine-in');

  const handleAddToCart = () => {
    setShowInstructionsModal(true);
  };

  const handleConfirmAdd = () => {
    const allInstructions = [...selectedInstructions];
    if (customInstruction.trim()) {
      allInstructions.push(customInstruction.trim());
    }
    const finalInstructions = allInstructions.join(', ');
    onAddToCart(item, finalInstructions, diningOption);
    setSelectedInstructions([]);
    setCustomInstruction('');
    setDiningOption('dine-in');
    setShowInstructionsModal(false);
  };

  const handleCancelAdd = () => {
    setSelectedInstructions([]);
    setCustomInstruction('');
    setShowInstructionsModal(false);
  };

  // คำแนะนำที่ใช้บ่อย
  const commonInstructions = [
    'เผ็ดมาก',
    'เผ็ดน้อย',
    'ไม่เผ็ด',
    'ไม่ใส่ผัก',
    'ไม่ใส่ผักชี',
    'แยกน้ำจิ้ม',
  ];

  // Toggle การเลือกคำขอพิเศษ
  const toggleInstruction = (instruction: string) => {
    setSelectedInstructions(prev => {
      if (prev.includes(instruction)) {
        return prev.filter(item => item !== instruction);
      } else {
        return [...prev, instruction];
      }
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
        <div className="relative overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            ฿{item.price}
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-500 mb-1">{item.category}</p>
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
          {item.rating && (
            <div className="mb-4">
              <StarRating rating={item.rating} reviewCount={item.reviewCount} />
            </div>
          )}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่มลงตะกร้า</span>
          </button>
        </div>
      </div>

      {/* Modal สำหรับกรอกคำขอพิเศษ */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancelAdd}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <button
              onClick={handleCancelAdd}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
            <p className="text-sm text-gray-500 mb-4">คำขอพิเศษ (ถ้าต้องการ)</p>

            {/* ปุ่มคำแนะนำที่ใช้บ่อย */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">เลือกคำขอที่ใช้บ่อย (เลือกได้หลายรายการ):</p>
              <div className="flex flex-wrap gap-2">
                {commonInstructions.map((instruction) => (
                  <button
                    key={instruction}
                    onClick={() => toggleInstruction(instruction)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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
              <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800 font-medium mb-1">คำขอที่เลือก:</p>
                <p className="text-sm text-orange-900">{selectedInstructions.join(', ')}</p>
              </div>
            )}

            {/* ช่องกรอกข้อความเพิ่มเติม */}
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="หรือพิมพ์คำขอพิเศษเพิ่มเติม..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
              rows={2}
            />

            {/* ตัวเลือกทานในร้านหรือรับกลับบ้าน */}
            <div className="mt-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">ต้องการ:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiningOption('dine-in')}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    diningOption === 'dine-in'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🍽️ ทานในร้าน
                </button>
                <button
                  type="button"
                  onClick={() => setDiningOption('takeaway')}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    diningOption === 'takeaway'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🥡 รับกลับบ้าน
                </button>
              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
