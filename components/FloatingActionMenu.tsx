'use client';

import React, { useState } from 'react';
import { Bell, Utensils, CreditCard, X, Check, MapPin } from 'lucide-react';

interface FloatingActionMenuProps {
  currentTableNumber: string;
  onServiceRequest: (type: 'staff' | 'utensils' | 'payment', details?: string, items?: string[]) => void;
  onOpenFloorPlan: () => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  currentTableNumber,
  onServiceRequest,
  onOpenFloorPlan,
}) => {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showUtensilsModal, setShowUtensilsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState('');
  const [selectedUtensils, setSelectedUtensils] = useState<string[]>([]);
  const [requestSent, setRequestSent] = useState<string | null>(null);

  const utensilOptions = [
    'ตะเกียบ',
    'ช้อน',
    'ส้อม',
    'มีด',
    'ช้อนกาแฟ',
    'หลอด',
    'ทิชชู่',
    'น้ำเปล่า',
    'น้ำแข็ง',
  ];

  const handleStaffRequest = () => {
    onServiceRequest('staff', staffMessage);
    setStaffMessage('');
    setShowStaffModal(false);
    showSuccessMessage('เรียกพนักงาน');
  };

  const handleUtensilsRequest = () => {
    if (selectedUtensils.length > 0) {
      onServiceRequest('utensils', undefined, selectedUtensils);
      setSelectedUtensils([]);
      setShowUtensilsModal(false);
      showSuccessMessage('ขออุปกรณ์');
    }
  };

  const handlePaymentRequest = () => {
    onServiceRequest('payment');
    setShowPaymentModal(false);
    showSuccessMessage('เรียกเก็บเงิน');
  };

  const showSuccessMessage = (type: string) => {
    setRequestSent(type);
    setTimeout(() => setRequestSent(null), 3000);
  };

  const toggleUtensil = (item: string) => {
    setSelectedUtensils(prev => {
      if (prev.includes(item)) {
        return prev.filter(u => u !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  return (
    <>
      {/* Fixed Footer Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {/* ปุ่มโต๊ะ / ผังโต๊ะ */}
            <button
              onClick={onOpenFloorPlan}
              className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <MapPin className="w-6 h-6 text-orange-600 mb-1" />
              <span className="text-xs font-semibold text-orange-700">โต๊ะ {currentTableNumber}</span>
            </button>

            {/* ปุ่มเรียกพนักงาน */}
            <button
              onClick={() => setShowStaffModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Bell className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-semibold text-blue-700">พนักงาน</span>
            </button>

            {/* ปุ่มขออุปกรณ์ */}
            <button
              onClick={() => setShowUtensilsModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Utensils className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-xs font-semibold text-green-700">อุปกรณ์</span>
            </button>

            {/* ปุ่มชำระเงิน */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <CreditCard className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs font-semibold text-purple-700">ชำระ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal เรียกพนักงาน */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowStaffModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowStaffModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">เรียกพนักงาน</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">ระบุเหตุผลที่ต้องการเรียกพนักงาน (ถ้าต้องการ)</p>

            <textarea
              value={staffMessage}
              onChange={(e) => setStaffMessage(e.target.value)}
              placeholder="เช่น ขอน้ำเปล่าเพิ่ม, สอบถามเมนู, ฯลฯ"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStaffModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleStaffRequest}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                เรียกพนักงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ขออุปกรณ์ */}
      {showUtensilsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowUtensilsModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowUtensilsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">ขออุปกรณ์</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">เลือกอุปกรณ์ที่ต้องการ (เลือกได้หลายรายการ)</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {utensilOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleUtensil(item)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedUtensils.includes(item)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {selectedUtensils.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-800 font-medium mb-1">รายการที่เลือก:</p>
                <p className="text-sm text-green-900">{selectedUtensils.join(', ')}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedUtensils([]);
                  setShowUtensilsModal(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUtensilsRequest}
                disabled={selectedUtensils.length === 0}
                className={`flex-1 px-4 py-3 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg ${
                  selectedUtensils.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ชำระเงิน */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">เรียกเก็บเงิน</h3>
            </div>

            <p className="text-gray-600 mb-6">
              คุณต้องการเรียกพนักงานมาเก็บเงินใช่หรือไม่?
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-900">
                💡 <strong>หมายเหตุ:</strong> พนักงานจะนำบิลมาให้ตรวจสอบและชำระเงินค่ะ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePaymentRequest}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                เรียกเก็บเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {requestSent && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span className="font-semibold">{requestSent}สำเร็จ!</span>
          </div>
        </div>
      )}
    </>
  );
};
