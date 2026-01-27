'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Utensils, CreditCard, X, Check, MapPin, Home, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from 'qrcode';

interface FloatingActionMenuProps {
  currentTableNumber: string;
  onServiceRequest: (type: 'staff' | 'utensils' | 'payment', details?: string, items?: string[]) => void;
  onOpenFloorPlan: () => void;
  onOpenWelcome?: () => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  currentTableNumber,
  onServiceRequest,
  onOpenFloorPlan,
  onOpenWelcome,
}) => {
  const { t } = useLanguage();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showUtensilsModal, setShowUtensilsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState('');
  const [selectedUtensils, setSelectedUtensils] = useState<string[]>([]);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const utensilOptions = [
    t.utensils.chopsticks,
    t.utensils.spoon,
    t.utensils.fork,
    t.utensils.knife,
    t.utensils.teaspoon,
    t.utensils.straw,
    t.utensils.tissue,
    t.utensils.water,
    t.utensils.ice,
  ];

  const handleStaffRequest = () => {
    onServiceRequest('staff', staffMessage);
    setStaffMessage('');
    setShowStaffModal(false);
    showSuccessMessage(t.floatingMenu.callStaff);
  };

  const handleUtensilsRequest = () => {
    if (selectedUtensils.length > 0) {
      onServiceRequest('utensils', undefined, selectedUtensils);
      setSelectedUtensils([]);
      setShowUtensilsModal(false);
      showSuccessMessage(t.floatingMenu.requestUtensils);
    }
  };

  const handlePaymentRequest = () => {
    onServiceRequest('payment');
    setShowPaymentModal(false);
    showSuccessMessage(t.floatingMenu.requestPayment);
  };

  const showSuccessMessage = (type: string) => {
    setRequestSent(type);
    setTimeout(() => setRequestSent(null), 3000);
  };

  const handleShowQr = async () => {
    try {
      const url = `${window.location.origin}/table/${currentTableNumber}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
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

  // Prevent body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showStaffModal || showUtensilsModal || showPaymentModal || showQrModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showStaffModal, showUtensilsModal, showPaymentModal, showQrModal]);

  return (
    <>
      {/* Footer Menu */}
      <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-2 py-3">
          <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-x-visible">
            {/* Home / Welcome Button */}
            {onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
              >
                <Home className="w-6 h-6 text-gray-600 mb-1" />
                <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">หน้าหลัก</span>
              </button>
            )}

            {/* Table / Floor Plan Button */}
            <button
              onClick={onOpenFloorPlan}
              className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
            >
              <MapPin className="w-6 h-6 text-orange-600 mb-1" />
              <span className="text-xs font-semibold text-orange-700 whitespace-nowrap">{t.floatingMenu.table} {currentTableNumber}</span>
            </button>

            {/* QR Code Button */}
            <button
              onClick={handleShowQr}
              className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
            >
              <QrCode className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap">แชร์โต๊ะ</span>
            </button>

            {/* Call Staff Button */}
            <button
              onClick={() => setShowStaffModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
            >
              <Bell className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">{t.floatingMenu.staff}</span>
            </button>

            {/* Request Utensils Button */}
            <button
              onClick={() => setShowUtensilsModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
            >
              <Utensils className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-xs font-semibold text-green-700 whitespace-nowrap">{t.floatingMenu.utensils}</span>
            </button>

            {/* Payment Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all shadow-sm hover:shadow-md min-w-[72px] snap-start"
            >
              <CreditCard className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">{t.floatingMenu.payment}</span>
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
              <h3 className="text-xl font-bold text-gray-800">{t.floatingMenu.callStaff}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">{t.floatingMenu.staffReason}</p>

            <textarea
              value={staffMessage}
              onChange={(e) => setStaffMessage(e.target.value)}
              placeholder={t.floatingMenu.staffPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStaffModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleStaffRequest}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {t.floatingMenu.callStaff}
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
              <h3 className="text-xl font-bold text-gray-800">{t.floatingMenu.requestUtensils}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">{t.floatingMenu.selectUtensils}</p>

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
                <p className="text-xs text-green-800 font-medium mb-1">{t.floatingMenu.selectedItems}</p>
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
                {t.common.cancel}
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
                {t.common.confirm}
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
              <h3 className="text-xl font-bold text-gray-800">{t.floatingMenu.requestPayment}</h3>
            </div>

            <p className="text-gray-600 mb-6">
              {t.floatingMenu.paymentConfirm}
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-900">
                {t.floatingMenu.paymentNote}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handlePaymentRequest}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {t.floatingMenu.requestPayment}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowQrModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <QrCode className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">แชร์โต๊ะ {currentTableNumber}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              ให้เพื่อนสแกน QR Code นี้เพื่อเข้าร่วมสั่งอาหารที่โต๊ะเดียวกัน
            </p>

            <div className="flex justify-center mb-4">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 rounded-xl border-2 border-gray-200" />
              )}
            </div>

            <p className="text-xs text-center text-gray-400 mb-4 break-all">
              {typeof window !== 'undefined' && `${window.location.origin}/table/${currentTableNumber}`}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {requestSent && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span className="font-semibold">{requestSent} {t.floatingMenu.success}</span>
          </div>
        </div>
      )}
    </>
  );
};
