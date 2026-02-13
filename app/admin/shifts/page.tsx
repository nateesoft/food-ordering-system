'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Play, Square, Eye, RefreshCw, DollarSign, CreditCard, Banknote, ArrowRightLeft, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { api, ShiftResponse, ShiftSummaryResponse } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

const DENOMINATIONS = [1000, 500, 100, 50, 20, 10, 5, 2, 1];

function CashCountGrid({
  counts,
  onChange,
}: {
  counts: Record<string, number>;
  onChange: (counts: Record<string, number>) => void;
}) {
  const total = DENOMINATIONS.reduce((sum, d) => sum + (counts[String(d)] || 0) * d, 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {DENOMINATIONS.map((d) => (
          <div key={d} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <span className="text-sm font-medium w-12 text-right text-gray-700">{d >= 20 ? `${d}฿` : `${d}฿`}</span>
            <input
              type="number"
              min="0"
              value={counts[String(d)] || 0}
              onChange={(e) => onChange({ ...counts, [String(d)]: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm text-gray-800"
            />
            <span className="text-xs text-gray-500 w-16 text-right">
              = {((counts[String(d)] || 0) * d).toLocaleString()}฿
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-indigo-50 rounded-lg p-3 text-center">
        <span className="text-sm text-indigo-600">รวมเงินสด:</span>
        <span className="text-xl font-bold text-indigo-800 ml-2">{total.toLocaleString()} บาท</span>
      </div>
    </div>
  );
}

export default function ShiftsPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummaryResponse | null>(null);
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftSummaryResponse | null>(null);

  // Open shift form
  const [pin, setPin] = useState('');
  const [openingAmount, setOpeningAmount] = useState(0);
  const [openingCashCount, setOpeningCashCount] = useState<Record<string, number>>({});
  const [openNotes, setOpenNotes] = useState('');
  const [openError, setOpenError] = useState('');
  const [opening, setOpening] = useState(false);

  // Close shift form
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingCashCount, setClosingCashCount] = useState<Record<string, number>>({});
  const [closeNotes, setCloseNotes] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closing, setClosing] = useState(false);

  const isFirstLoad = useRef(true);

  const loadActiveShift = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const shift = await api.getActiveShift();
      setActiveShift(shift);
      if (shift) {
        const summary = await api.getShiftSummary(shift.id);
        setShiftSummary(summary);
      } else {
        setShiftSummary(null);
      }
    } catch (err) {
      console.error('Failed to load active shift:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadShiftHistory = useCallback(async () => {
    try {
      const data = await api.getShifts();
      setShifts(data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  }, []);

  useEffect(() => {
    loadActiveShift(isFirstLoad.current);
    loadShiftHistory();
    isFirstLoad.current = false;

    const interval = setInterval(() => {
      loadActiveShift(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadActiveShift, loadShiftHistory]);

  const handleOpenShift = async () => {
    if (!pin) { setOpenError('กรุณากรอก PIN'); return; }
    setOpening(true);
    setOpenError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (openingCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : openingAmount;
      await api.openShift({
        pin,
        openingAmount: amount,
        openingCashCount: Object.keys(openingCashCount).length > 0 ? openingCashCount : undefined,
        notes: openNotes || undefined,
      });
      setShowOpenModal(false);
      setPin('');
      setOpeningAmount(0);
      setOpeningCashCount({});
      setOpenNotes('');
      await loadActiveShift();
      await loadShiftHistory();
    } catch (err: any) {
      setOpenError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setOpening(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setClosing(true);
    setCloseError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (closingCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : closingAmount;
      await api.closeShift(activeShift.id, {
        closingAmount: amount,
        closingCashCount: Object.keys(closingCashCount).length > 0 ? closingCashCount : undefined,
        notes: closeNotes || undefined,
      });
      setShowCloseModal(false);
      setClosingAmount(0);
      setClosingCashCount({});
      setCloseNotes('');
      await loadActiveShift();
      await loadShiftHistory();
    } catch (err: any) {
      setCloseError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setClosing(false);
    }
  };

  const openShiftDetail = async (shift: ShiftResponse) => {
    try {
      const summary = await api.getShiftSummary(shift.id);
      setSelectedShift(summary);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load shift detail:', err);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const formatDateTime = (date: string) => `${formatDate(date)} ${formatTime(date)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">จัดการกะ (Shift Management)</h1>
                <p className="text-violet-200">เปิด/ปิดกะ, นับเงินในลิ้นชัก, สรุปยอดประจำกะ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BranchSelector />
              <button
                onClick={() => { loadActiveShift(); loadShiftHistory(); }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> รีเฟรช
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { key: 'current' as const, label: 'กะปัจจุบัน' },
              { key: 'history' as const, label: 'ประวัติกะ' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-white text-violet-700' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : activeTab === 'current' ? (
          /* Current Shift Tab */
          <div>
            {!activeShift ? (
              /* No active shift */
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Clock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">ไม่มีกะที่เปิดอยู่</h2>
                <p className="text-gray-500 mb-8">กรุณาเปิดกะเพื่อเริ่มทำรายการ</p>
                <button
                  onClick={() => setShowOpenModal(true)}
                  className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center gap-3 mx-auto"
                >
                  <Play className="w-6 h-6" /> เปิดกะ
                </button>
              </div>
            ) : (
              /* Active shift display */
              <div className="space-y-6">
                {/* Shift Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-xl">
                        <Play className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{activeShift.shiftNumber}</h2>
                        <p className="text-gray-500">
                          เปิดโดย: {activeShift.cashierName} | เวลา: {formatDateTime(activeShift.openedAt)}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">OPEN</span>
                    </div>
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Square className="w-5 h-5" /> ปิดกะ
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">เงินเปิดลิ้นชัก</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-800">{activeShift.openingAmount.toLocaleString()}฿</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">ยอดขายรวม</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">{(shiftSummary?.totalRevenue || 0).toLocaleString()}฿</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Banknote className="w-4 h-4" />
                        <span className="text-sm">เงินสด</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">{(shiftSummary?.cashTotal || 0).toLocaleString()}฿</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span className="text-sm">โอนเงิน</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800">{(shiftSummary?.transferTotal || 0).toLocaleString()}฿</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">บัตรเครดิต</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-800">{(shiftSummary?.creditCardTotal || 0).toLocaleString()}฿</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-sm text-gray-500">จำนวนออเดอร์</span>
                      <p className="text-2xl font-bold text-gray-800">{shiftSummary?.totalOrders || 0} รายการ</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <span className="text-sm text-yellow-600">เงินสดที่ควรมีในลิ้นชัก</span>
                      <p className="text-2xl font-bold text-yellow-800">
                        {((activeShift.openingAmount || 0) + (shiftSummary?.cashTotal || 0)).toLocaleString()}฿
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Payments */}
                {shiftSummary?.payments && shiftSummary.payments.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">รายการชำระเงินในกะ ({shiftSummary.payments.length})</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-gray-500">เลขที่ใบเสร็จ</th>
                            <th className="text-left py-2 px-3 text-gray-500">เวลา</th>
                            <th className="text-left py-2 px-3 text-gray-500">วิธีชำระ</th>
                            <th className="text-right py-2 px-3 text-gray-500">ยอดเงิน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftSummary.payments.map((p: any) => (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono text-xs text-gray-700">{p.receiptNumber}</td>
                              <td className="py-2 px-3 text-gray-600">{formatTime(p.createdAt)}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' :
                                  p.paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                  'bg-purple-100 text-purple-700'
                                }`}>
                                  {p.paymentMethod === 'CASH' ? 'เงินสด' : p.paymentMethod === 'TRANSFER' ? 'โอนเงิน' : 'บัตรเครดิต'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-gray-800">{p.totalAmount.toLocaleString()}฿</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">ประวัติกะทั้งหมด</h2>
            </div>
            {shifts.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">ยังไม่มีประวัติกะ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">เลขที่กะ</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">แคชเชียร์</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">เปิดกะ</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">ปิดกะ</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">สถานะ</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">ยอดขาย</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">ออเดอร์</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">ส่วนต่างเงินสด</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">ดู</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm font-medium text-gray-800">{shift.shiftNumber}</td>
                        <td className="py-3 px-4 text-gray-700">{shift.cashierName}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{formatDateTime(shift.openedAt)}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{shift.closedAt ? formatDateTime(shift.closedAt) : '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            shift.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {shift.status === 'OPEN' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                          {shift.totalRevenue != null ? `${shift.totalRevenue.toLocaleString()}฿` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {shift.totalOrders != null ? shift.totalOrders : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {shift.cashDifference != null ? (
                            <span className={`font-bold ${
                              shift.cashDifference === 0 ? 'text-green-600' :
                              shift.cashDifference > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {shift.cashDifference > 0 ? '+' : ''}{shift.cashDifference.toLocaleString()}฿
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openShiftDetail(shift)}
                            className="text-violet-600 hover:text-violet-800 p-1"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">เปิดกะ</h2>
              <button onClick={() => setShowOpenModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              {openError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {openError}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงินเปิดลิ้นชัก *</label>
                <input
                  type="number"
                  value={openingAmount || ''}
                  onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">หรือนับธนบัตร/เหรียญด้านล่าง (จะแทนที่ยอดด้านบน)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">นับธนบัตร/เหรียญ (ไม่บังคับ)</label>
                <CashCountGrid counts={openingCashCount} onChange={setOpeningCashCount} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
                  placeholder="เช่น กะเช้า"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleOpenShift}
                disabled={opening || !pin}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {opening ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                เปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && shiftSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">ปิดกะ - {activeShift.shiftNumber}</h2>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              {closeError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {closeError}
                </div>
              )}

              {/* Summary Preview */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">เงินเปิดลิ้นชัก</span>
                  <span className="font-medium text-gray-800">{activeShift.openingAmount.toLocaleString()}฿</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ยอดขายเงินสด</span>
                  <span className="font-medium text-gray-800">{(shiftSummary.cashTotal || 0).toLocaleString()}฿</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ยอดขายโอนเงิน</span>
                  <span className="font-medium text-gray-800">{(shiftSummary.transferTotal || 0).toLocaleString()}฿</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ยอดขายบัตรเครดิต</span>
                  <span className="font-medium text-gray-800">{(shiftSummary.creditCardTotal || 0).toLocaleString()}฿</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                  <span className="text-gray-700">ยอดขายรวม</span>
                  <span className="text-green-700">{(shiftSummary.totalRevenue || 0).toLocaleString()}฿</span>
                </div>
                <div className="flex justify-between font-bold text-yellow-700">
                  <span>เงินสดที่ควรมีในลิ้นชัก</span>
                  <span>{(activeShift.openingAmount + (shiftSummary.cashTotal || 0)).toLocaleString()}฿</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเงินจริงในลิ้นชัก *</label>
                <input
                  type="number"
                  value={closingAmount || ''}
                  onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">หรือนับธนบัตร/เหรียญด้านล่าง (จะแทนที่ยอดด้านบน)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">นับธนบัตร/เหรียญ</label>
                <CashCountGrid counts={closingCashCount} onChange={setClosingCashCount} />
              </div>

              {/* Difference Preview */}
              {(() => {
                const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (closingCashCount[String(d)] || 0) * d, 0);
                const actual = cashCountTotal > 0 ? cashCountTotal : closingAmount;
                const expected = activeShift.openingAmount + (shiftSummary.cashTotal || 0);
                const diff = actual - expected;
                if (actual > 0) {
                  return (
                    <div className={`rounded-xl p-4 ${diff === 0 ? 'bg-green-50' : diff > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {diff === 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                        <span className={`font-bold ${diff === 0 ? 'text-green-700' : diff > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          ส่วนต่าง: {diff > 0 ? '+' : ''}{diff.toLocaleString()}฿
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {diff === 0 ? 'เงินสดตรงกัน' : diff > 0 ? 'เงินสดเกิน' : 'เงินสดขาด'}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
                  placeholder="หมายเหตุการปิดกะ"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCloseShift}
                disabled={closing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {closing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                ปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Detail Modal */}
      {showDetailModal && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">รายละเอียดกะ - {selectedShift.shiftNumber}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Shift Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">แคชเชียร์</span>
                  <p className="font-bold text-gray-800">{selectedShift.cashierName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">สถานะ</span>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      selectedShift.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedShift.status === 'OPEN' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">เปิดกะ</span>
                  <p className="font-medium text-gray-700">{formatDateTime(selectedShift.openedAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ปิดกะ</span>
                  <p className="font-medium text-gray-700">{selectedShift.closedAt ? formatDateTime(selectedShift.closedAt) : '-'}</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-gray-700 mb-3">สรุปยอดขาย</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white rounded-lg p-3">
                    <Banknote className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">เงินสด</p>
                    <p className="font-bold text-gray-800">{(selectedShift.cashTotal || 0).toLocaleString()}฿</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">โอนเงิน</p>
                    <p className="font-bold text-gray-800">{(selectedShift.transferTotal || 0).toLocaleString()}฿</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3">
                    <CreditCard className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">บัตรเครดิต</p>
                    <p className="font-bold text-gray-800">{(selectedShift.creditCardTotal || 0).toLocaleString()}฿</p>
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-3 flex justify-between font-bold text-lg">
                  <span className="text-gray-700">ยอดขายรวม</span>
                  <span className="text-green-700">{(selectedShift.totalRevenue || 0).toLocaleString()}฿</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">จำนวนออเดอร์</span>
                  <span className="font-medium text-gray-800">{selectedShift.totalOrders || 0} รายการ</span>
                </div>
              </div>

              {/* Cash Drawer */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-gray-700 mb-3">เงินสดในลิ้นชัก</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">เงินเปิดลิ้นชัก</span>
                  <span className="font-medium text-gray-800">{selectedShift.openingAmount.toLocaleString()}฿</span>
                </div>
                {selectedShift.closingAmount != null && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">เงินปิดลิ้นชัก (จริง)</span>
                      <span className="font-medium text-gray-800">{selectedShift.closingAmount.toLocaleString()}฿</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">เงินที่ควรมี</span>
                      <span className="font-medium text-gray-800">{(selectedShift.expectedCashAmount || 0).toLocaleString()}฿</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                      <span className="text-gray-700">ส่วนต่าง</span>
                      <span className={`${
                        (selectedShift.cashDifference || 0) === 0 ? 'text-green-600' :
                        (selectedShift.cashDifference || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {(selectedShift.cashDifference || 0) > 0 ? '+' : ''}{(selectedShift.cashDifference || 0).toLocaleString()}฿
                        {(selectedShift.cashDifference || 0) === 0 ? ' (ตรง)' : (selectedShift.cashDifference || 0) > 0 ? ' (เกิน)' : ' (ขาด)'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Denomination Details */}
              {(selectedShift.openingCashCount || selectedShift.closingCashCount) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-3">รายละเอียดธนบัตร/เหรียญ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedShift.openingCashCount && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">เปิดกะ</p>
                        {DENOMINATIONS.map((d) => {
                          const count = (selectedShift.openingCashCount as Record<string, number>)?.[String(d)];
                          if (!count) return null;
                          return (
                            <div key={d} className="flex justify-between text-xs text-gray-600">
                              <span>{d}฿ x {count}</span>
                              <span>{(d * count).toLocaleString()}฿</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {selectedShift.closingCashCount && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">ปิดกะ</p>
                        {DENOMINATIONS.map((d) => {
                          const count = (selectedShift.closingCashCount as Record<string, number>)?.[String(d)];
                          if (!count) return null;
                          return (
                            <div key={d} className="flex justify-between text-xs text-gray-600">
                              <span>{d}฿ x {count}</span>
                              <span>{(d * count).toLocaleString()}฿</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedShift.notes || selectedShift.closingNotes) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-2">หมายเหตุ</h3>
                  {selectedShift.notes && <p className="text-sm text-gray-600">เปิดกะ: {selectedShift.notes}</p>}
                  {selectedShift.closingNotes && <p className="text-sm text-gray-600">ปิดกะ: {selectedShift.closingNotes}</p>}
                </div>
              )}

              {/* Payments List */}
              {selectedShift.payments && selectedShift.payments.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-3">รายการชำระเงิน ({selectedShift.payments.length})</h3>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-500">ใบเสร็จ</th>
                          <th className="text-left py-2 px-3 text-gray-500">เวลา</th>
                          <th className="text-left py-2 px-3 text-gray-500">วิธีชำระ</th>
                          <th className="text-right py-2 px-3 text-gray-500">ยอดเงิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedShift.payments.map((p: any) => (
                          <tr key={p.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 font-mono text-xs text-gray-700">{p.receiptNumber}</td>
                            <td className="py-2 px-3 text-gray-600">{formatTime(p.createdAt)}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' :
                                p.paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {p.paymentMethod === 'CASH' ? 'เงินสด' : p.paymentMethod === 'TRANSFER' ? 'โอนเงิน' : 'บัตรเครดิต'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-gray-800">{p.totalAmount.toLocaleString()}฿</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
