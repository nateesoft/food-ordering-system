'use client';

import React, { useState } from 'react';
import { Play, Square, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { ShiftResponse } from '@/lib/api';

const DENOMINATIONS = [1000, 500, 100, 50, 20, 10, 5, 2, 1];

interface OpenShiftModalProps {
  onOpenShift: (pin: string) => void;
  onSkip: () => void;
  openingAmount: number;
  onOpeningAmountChange: (v: number) => void;
  openingCashCount: Record<string, number>;
  onOpeningCashCountChange: (v: Record<string, number>) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  error: string;
  processing: boolean;
}

export function OpenShiftModal({
  onOpenShift,
  onSkip,
  openingAmount,
  onOpeningAmountChange,
  openingCashCount,
  onOpeningCashCountChange,
  notes,
  onNotesChange,
  error,
  processing,
}: OpenShiftModalProps) {
  const [pin, setPin] = useState('');

  const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (openingCashCount[String(d)] || 0) * d, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">เปิดกะ</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN พนักงาน *</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest text-gray-800"
              placeholder="****"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงินเปิดลิ้นชัก</label>
            <input
              type="number"
              value={openingAmount || ''}
              onChange={(e) => onOpeningAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">นับธนบัตร/เหรียญ (ไม่บังคับ)</label>
            <div className="grid grid-cols-3 gap-2">
              {DENOMINATIONS.map((d) => (
                <div key={d} className="flex items-center gap-1 bg-gray-50 rounded-lg p-2">
                  <span className="text-xs font-medium w-10 text-right text-gray-700">{d}฿</span>
                  <input
                    type="number"
                    min="0"
                    value={openingCashCount[String(d)] || 0}
                    onChange={(e) => onOpeningCashCountChange({ ...openingCashCount, [String(d)]: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-sm text-gray-800"
                  />
                </div>
              ))}
            </div>
            {cashCountTotal > 0 && (
              <div className="mt-2 text-center text-sm text-indigo-600 font-medium">
                รวม: {cashCountTotal.toLocaleString()}฿
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
              placeholder="เช่น กะเช้า"
            />
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            ข้าม
          </button>
          <button
            onClick={() => onOpenShift(pin)}
            disabled={processing || !pin}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            เปิดกะ
          </button>
        </div>
      </div>
    </div>
  );
}

interface CloseShiftModalProps {
  shift: ShiftResponse;
  summary: any;
  onClose: () => void;
  onCloseShift: () => void;
  closingAmount: number;
  onClosingAmountChange: (v: number) => void;
  closingCashCount: Record<string, number>;
  onClosingCashCountChange: (v: Record<string, number>) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  error: string;
  processing: boolean;
}

export function CloseShiftModal({
  shift,
  summary,
  onClose,
  onCloseShift,
  closingAmount,
  onClosingAmountChange,
  closingCashCount,
  onClosingCashCountChange,
  notes,
  onNotesChange,
  error,
  processing,
}: CloseShiftModalProps) {
  const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (closingCashCount[String(d)] || 0) * d, 0);
  const actual = cashCountTotal > 0 ? cashCountTotal : closingAmount;
  const expected = shift.openingAmount + (summary?.cashTotal || 0);
  const diff = actual - expected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Square className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-800">ปิดกะ - {shift.shiftNumber}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">เงินเปิดลิ้นชัก</span><span className="font-medium text-gray-800">{shift.openingAmount.toLocaleString()}฿</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ยอดขายเงินสด</span><span className="font-medium text-gray-800">{(summary?.cashTotal || 0).toLocaleString()}฿</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ยอดขายโอนเงิน</span><span className="font-medium text-gray-800">{(summary?.transferTotal || 0).toLocaleString()}฿</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ยอดขายบัตรเครดิต</span><span className="font-medium text-gray-800">{(summary?.creditCardTotal || 0).toLocaleString()}฿</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span className="text-gray-700">ยอดขายรวม</span><span className="text-green-700">{(summary?.totalRevenue || 0).toLocaleString()}฿</span></div>
            <div className="flex justify-between font-bold text-yellow-700"><span>เงินสดที่ควรมี</span><span>{expected.toLocaleString()}฿</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงินจริงในลิ้นชัก *</label>
            <input
              type="number"
              value={closingAmount || ''}
              onChange={(e) => onClosingAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">นับธนบัตร/เหรียญ</label>
            <div className="grid grid-cols-3 gap-2">
              {DENOMINATIONS.map((d) => (
                <div key={d} className="flex items-center gap-1 bg-gray-50 rounded-lg p-2">
                  <span className="text-xs font-medium w-10 text-right text-gray-700">{d}฿</span>
                  <input
                    type="number"
                    min="0"
                    value={closingCashCount[String(d)] || 0}
                    onChange={(e) => onClosingCashCountChange({ ...closingCashCount, [String(d)]: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-sm text-gray-800"
                  />
                </div>
              ))}
            </div>
            {cashCountTotal > 0 && (
              <div className="mt-2 text-center text-sm text-indigo-600 font-medium">
                รวม: {cashCountTotal.toLocaleString()}฿
              </div>
            )}
          </div>

          {actual > 0 && (
            <div className={`rounded-xl p-3 text-center ${diff === 0 ? 'bg-green-50' : diff > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <span className={`font-bold ${diff === 0 ? 'text-green-700' : diff > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                ส่วนต่าง: {diff > 0 ? '+' : ''}{diff.toLocaleString()}฿
                {diff === 0 ? ' (ตรง)' : diff > 0 ? ' (เกิน)' : ' (ขาด)'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
              placeholder="หมายเหตุ"
            />
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">ยกเลิก</button>
          <button
            onClick={onCloseShift}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
            ปิดกะ & ออก
          </button>
        </div>
      </div>
    </div>
  );
}
