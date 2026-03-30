'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface TaxInvoiceModalProps {
  paymentId: number;
  receiptNumber: string;
  totalAmount: number;
  onClose: () => void;
  onCreated: (invoice: any) => void;
}

export default function TaxInvoiceModal({
  paymentId,
  receiptNumber,
  totalAmount,
  onClose,
  onCreated,
}: TaxInvoiceModalProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxId, setBuyerTaxId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerBranch, setBuyerBranch] = useState('00000');
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const vatRate = 0.07;
  const subtotalBeforeVat = totalAmount / (1 + vatRate);
  const vatAmount = totalAmount - subtotalBeforeVat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerTaxId.trim() || !buyerAddress.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (buyerTaxId.replace(/\D/g, '').length !== 13) {
      setError('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const invoice = await api.createTaxInvoice({
        paymentId,
        buyerName,
        buyerTaxId: buyerTaxId.replace(/\D/g, ''),
        buyerAddress,
        buyerBranch: isHeadOffice ? '00000' : buyerBranch,
      });
      onCreated(invoice);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถออกใบกำกับภาษีได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">ออกใบกำกับภาษี</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Receipt Reference */}
          <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
            <span className="text-gray-500">ใบเสร็จ: {receiptNumber}</span>
            <span className="font-bold">฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
          )}

          {/* Buyer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ซื้อ / บริษัท *</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="บริษัท ตัวอย่าง จำกัด"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก) *</label>
            <input
              type="text"
              value={buyerTaxId}
              onChange={(e) => setBuyerTaxId(e.target.value.replace(/[^\d-]/g, '').slice(0, 17))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="0-0000-00000-00-0"
              maxLength={17}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ *</label>
            <textarea
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isHeadOffice}
                  onChange={() => setIsHeadOffice(true)}
                  className="text-blue-600"
                />
                <span className="text-sm">สำนักงานใหญ่</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isHeadOffice}
                  onChange={() => setIsHeadOffice(false)}
                  className="text-blue-600"
                />
                <span className="text-sm">สาขา</span>
              </label>
              {!isHeadOffice && (
                <input
                  type="text"
                  value={buyerBranch}
                  onChange={(e) => setBuyerBranch(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24"
                  placeholder="00001"
                  maxLength={5}
                />
              )}
            </div>
          </div>

          {/* Tax Summary */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ราคาก่อน VAT</span>
              <span>฿{subtotalBeforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7%</span>
              <span>฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-blue-200">
              <span>ยอดรวมทั้งสิ้น</span>
              <span>฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'กำลังออกใบกำกับภาษี...' : 'ออกใบกำกับภาษี'}
          </button>
        </form>
      </div>
    </div>
  );
}
