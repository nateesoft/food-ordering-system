'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  Search,
  User,
  Receipt,
  LogOut,
  Clock,
  ShoppingBag,
  Star,
  X,
  Printer,
  History,
  ArrowLeft,
  Hash,
  Gift,
  BadgeCheck,
  Play,
  Square,
  AlertTriangle,
  RefreshCw,
  Tag,
  Ticket,
  Layers,
  Scissors,
  CheckSquare,
} from 'lucide-react';
import { api, OrderResponse, ShiftResponse, PromotionResponse, CouponValidationResponse } from '@/lib/api';
import { Payment, PaymentSummary, Member } from '@/types';
import BranchSelector from '@/components/BranchSelector';

const DENOMINATIONS = [1000, 500, 100, 50, 20, 10, 5, 2, 1];

// ===== PIN Login Screen =====
function PinLogin({ onLogin }: { onLogin: (name: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('กรุณาใส่ PIN อย่างน้อย 4 หลัก');
      return;
    }

    setLoading(true);
    try {
      const result = await api.verifyStaffPin(pin);
      onLogin(result.staff.name);
    } catch {
      setError('PIN ไม่ถูกต้อง');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">POS System</h1>
          <p className="text-gray-500 mt-1">ใส่ PIN เพื่อเข้าสู่ระบบ</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${
                pin.length > i
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center text-sm mb-4">{error}</div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map(
            (key) => (
              <button
                key={key || 'empty'}
                onClick={() => {
                  if (key === 'DEL') handleDelete();
                  else if (key) handlePinInput(key);
                }}
                disabled={loading || !key}
                className={`h-14 rounded-xl text-xl font-semibold transition-all ${
                  !key
                    ? 'invisible'
                    : key === 'DEL'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 active:scale-95'
                }`}
              >
                {key === 'DEL' ? '⌫' : key}
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="text-center mt-4 text-blue-600">กำลังตรวจสอบ...</div>
        )}
      </div>
    </div>
  );
}

// ===== Receipt Modal =====
function ReceiptModal({
  payment,
  mergedOrders,
  onClose,
}: {
  payment: Payment;
  mergedOrders?: any[] | null;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const paymentMethodLabel: Record<string, string> = {
    CASH: 'เงินสด',
    TRANSFER: 'เงินโอน',
    CREDIT_CARD: 'บัตรเครดิต',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Print-only receipt content */}
        <div className="p-6 print:p-4" id="receipt-content">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold">ร้านอาหาร</h2>
            <p className="text-sm text-gray-500">Food Ordering System</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>เลขที่: {payment.receiptNumber}</p>
              <p>
                วันที่:{' '}
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleString('th-TH')
                  : '-'}
              </p>
              {payment.cashierName && (
                <p>แคชเชียร์: {payment.cashierName}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          {mergedOrders && mergedOrders.length > 0 ? (
            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-gray-600">
                รวม {mergedOrders.length} ออเดอร์
                {mergedOrders[0]?.tableNumber && ` | โต๊ะ ${mergedOrders[0].tableNumber}`}
              </p>
              {mergedOrders.map((order: any) => (
                <div key={order.id} className="mb-2">
                  <p className="text-xs text-gray-400 font-medium">{order.orderId}</p>
                  <div className="space-y-1">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.menuItem?.name || 'Unknown'} x{item.quantity}</span>
                        <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : payment.order && (
            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-gray-600">
                Order: {payment.order.orderId}
                {payment.order.tableNumber && ` | โต๊ะ ${payment.order.tableNumber}`}
              </p>
              <div className="space-y-1">
                {payment.order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.menuItem?.name || 'Unknown'} x{item.quantity}</span>
                    <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <div className="flex justify-between text-sm">
              <span>ยอดรวม</span>
              <span>฿{payment.subtotal.toFixed(2)}</span>
            </div>
            {payment.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>ส่วนลดแต้ม ({payment.discountPoints} แต้ม)</span>
                <span>-฿{payment.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {payment.promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>โปรโมชัน: {payment.promotionName || 'ส่วนลด'}</span>
                <span>-฿{payment.promotionDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดสุทธิ</span>
              <span>฿{payment.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ชำระด้วย: {paymentMethodLabel[payment.paymentMethod]}</span>
              <span>฿{payment.paidAmount.toFixed(2)}</span>
            </div>
            {payment.changeAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-blue-600">
                <span>เงินทอน</span>
                <span>฿{payment.changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Member Info */}
          {payment.memberId && (
            <div className="text-center text-sm text-gray-600 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p>สมาชิก: {payment.memberName} ({payment.memberId})</p>
              {payment.pointsEarned > 0 && (
                <p className="text-green-600">
                  ได้รับแต้ม: +{payment.pointsEarned} แต้ม
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>Thank you!</p>
          </div>
        </div>

        {/* Action Buttons (hidden in print) */}
        <div className="flex gap-3 p-4 border-t print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            ปิด
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
    </div>
  );
}

// ===== History Modal =====
function HistoryModal({
  onClose,
  onViewReceipt,
}: {
  onClose: () => void;
  onViewReceipt: (payment: Payment) => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [paymentsData, summaryData] = await Promise.all([
          api.getPayments({ today: true }),
          api.getPaymentSummary(),
        ]);
        setPayments(paymentsData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const paymentMethodLabel: Record<string, string> = {
    CASH: 'เงินสด',
    TRANSFER: 'เงินโอน',
    CREDIT_CARD: 'บัตรเครดิต',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">ประวัติการชำระเงินวันนี้</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-600">รายได้รวม</p>
                  <p className="text-xl font-bold text-green-700">
                    ฿{summary.totalRevenue.toFixed(0)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600">จำนวนรายการ</p>
                  <p className="text-xl font-bold text-blue-700">
                    {summary.totalTransactions}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-orange-600">ส่วนลดรวม</p>
                  <p className="text-xl font-bold text-orange-700">
                    ฿{summary.totalDiscount.toFixed(0)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-purple-600">แต้มที่ให้</p>
                  <p className="text-xl font-bold text-purple-700">
                    {summary.totalPointsEarned}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Method Breakdown */}
            {summary && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(
                  Object.entries(summary.byMethod) as [string, { count: number; amount: number }][]
                ).map(([method, data]) => (
                  <div
                    key={method}
                    className="bg-gray-50 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs text-gray-500">
                      {paymentMethodLabel[method]}
                    </p>
                    <p className="font-bold">
                      {data.count} รายการ / ฿{data.amount.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Payment List */}
            {payments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                ยังไม่มีรายการชำระเงินวันนี้
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <button
                    key={payment.id}
                    onClick={() => onViewReceipt(payment)}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {payment.receiptNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            payment.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-green-700'
                              : payment.paymentStatus === 'REFUNDED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {payment.paymentStatus === 'PAID'
                            ? 'ชำระแล้ว'
                            : payment.paymentStatus === 'REFUNDED'
                            ? 'คืนเงิน'
                            : 'รอชำระ'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {paymentMethodLabel[payment.paymentMethod]} |{' '}
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleTimeString('th-TH')
                          : '-'}
                        {payment.memberName && ` | ${payment.memberName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ฿{payment.totalAmount.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        <Receipt className="w-3 h-3 inline" /> ดูใบเสร็จ
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Open Shift Modal =====
function OpenShiftModal({
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
}: {
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
}) {
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

// ===== Close Shift Modal =====
function CloseShiftModal({
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
}: {
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
}) {
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

          {/* Summary */}
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

// ===== Split Order Modal =====
function SplitOrderModal({
  order,
  onClose,
  onSplit,
}: {
  order: OrderResponse;
  onClose: () => void;
  onSplit: (groups: { itemIds: number[] }[]) => void;
}) {
  const [billCount, setBillCount] = useState(2);
  const [itemBills, setItemBills] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const assignments: Record<number, number> = {};
    order.items?.forEach((item: any) => {
      assignments[item.id] = 0;
    });
    setItemBills(assignments);
  }, [order, billCount]);

  const bills = Array.from({ length: billCount }, (_, i) => {
    const items =
      order.items?.filter((item: any) => itemBills[item.id] === i) || [];
    const total = items.reduce(
      (s: number, item: any) => s + item.price * item.quantity,
      0,
    );
    return { index: i, items, total };
  });

  const canSplit = bills.every((b) => b.items.length > 0);

  const handleSplit = () => {
    if (!canSplit) return;
    setProcessing(true);
    const groups = Array.from({ length: billCount }, (_, i) => ({
      itemIds:
        order.items
          ?.filter((item: any) => itemBills[item.id] === i)
          .map((item: any) => item.id) || [],
    })).filter((g) => g.itemIds.length > 0);
    onSplit(groups);
  };

  const billColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">
              แยกออเดอร์ - {order.orderId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Bill count selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              จำนวนบิล:
            </p>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setBillCount(n)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    billCount === n
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n} บิล
                </button>
              ))}
            </div>
          </div>

          {/* Items with bill assignment */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              เลือกบิลสำหรับแต่ละรายการ:
            </p>
            <div className="space-y-2">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">
                      {item.menuItem?.name || 'Unknown'}
                    </span>
                    <span className="text-gray-400 ml-2">
                      x{item.quantity}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ฿{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: billCount }, (_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setItemBills((prev) => ({
                            ...prev,
                            [item.id]: i,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          itemBills[item.id] === i
                            ? `${billColors[i]} text-white`
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        บิล {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill previews */}
          <div className="grid grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.index}
                className={`rounded-xl p-4 border-2 ${
                  bill.items.length === 0
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${billColors[bill.index]}`}
                  />
                  <h4 className="font-bold text-gray-800">
                    บิล {bill.index + 1}
                  </h4>
                </div>
                {bill.items.length === 0 ? (
                  <p className="text-sm text-red-500">
                    ยังไม่มีรายการ (ต้องมีอย่างน้อย 1)
                  </p>
                ) : (
                  <>
                    {bill.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="text-sm text-gray-600 flex justify-between"
                      >
                        <span>
                          {item.menuItem?.name} x{item.quantity}
                        </span>
                        <span>
                          ฿{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-gray-800">
                      <span>รวม</span>
                      <span>฿{bill.total.toFixed(0)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSplit}
            disabled={!canSplit || processing}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Scissors className="w-5 h-5" />
            )}
            แยกเป็น {billCount} บิล
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Main POS Page =====
export default function POSPage() {
  // Auth state
  const [cashierName, setCashierName] = useState<string | null>(null);

  // Shift state
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftOpeningAmount, setShiftOpeningAmount] = useState(0);
  const [shiftOpeningCashCount, setShiftOpeningCashCount] = useState<Record<string, number>>({});
  const [shiftClosingAmount, setShiftClosingAmount] = useState(0);
  const [shiftClosingCashCount, setShiftClosingCashCount] = useState<Record<string, number>>({});
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftError, setShiftError] = useState('');
  const [shiftProcessing, setShiftProcessing] = useState(false);
  const [shiftSummaryData, setShiftSummaryData] = useState<any>(null);

  // Data state
  const [unpaidOrders, setUnpaidOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>('');

  // Member state
  const [memberSearch, setMemberSearch] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [memberError, setMemberError] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [discountPoints, setDiscountPoints] = useState<string>('');

  // Promotion state
  const [availablePromotions, setAvailablePromotions] = useState<PromotionResponse[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionResponse | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResponse | null>(null);
  const [promotionDiscount, setPromotionDiscount] = useState(0);

  // UI state
  const [processing, setProcessing] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptMergedOrders, setReceiptMergedOrders] = useState<any[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Merge / Split state
  const [posMode, setPosMode] = useState<'normal' | 'merge'>('normal');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Check active shift after login
  const checkActiveShift = useCallback(async () => {
    setShiftLoading(true);
    try {
      const shift = await api.getActiveShift();
      setActiveShift(shift);
      if (!shift) {
        setShowOpenShiftModal(true);
      }
    } catch (err) {
      console.error('Failed to check active shift:', err);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cashierName) {
      checkActiveShift();
    }
  }, [cashierName, checkActiveShift]);

  const handleOpenShiftWithPin = async (pin: string) => {
    setShiftProcessing(true);
    setShiftError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (shiftOpeningCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : shiftOpeningAmount;
      const shift = await api.openShift({
        pin,
        openingAmount: amount,
        openingCashCount: Object.keys(shiftOpeningCashCount).length > 0 ? shiftOpeningCashCount : undefined,
        notes: shiftNotes || undefined,
      });
      setActiveShift(shift);
      setShowOpenShiftModal(false);
      setShiftOpeningAmount(0);
      setShiftOpeningCashCount({});
      setShiftNotes('');
    } catch (err: any) {
      setShiftError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setShiftProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setShiftProcessing(true);
    setShiftError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (shiftClosingCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : shiftClosingAmount;
      await api.closeShift(activeShift.id, {
        closingAmount: amount,
        closingCashCount: Object.keys(shiftClosingCashCount).length > 0 ? shiftClosingCashCount : undefined,
        notes: shiftNotes || undefined,
      });
      setShowCloseShiftModal(false);
      setActiveShift(null);
      setShiftClosingAmount(0);
      setShiftClosingCashCount({});
      setShiftNotes('');
      handleLogout();
    } catch (err: any) {
      setShiftError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setShiftProcessing(false);
    }
  };

  const prepareCloseShift = async () => {
    if (!activeShift) return;
    try {
      const summary = await api.getShiftSummary(activeShift.id);
      setShiftSummaryData(summary);
      setShiftError('');
      setShiftNotes('');
      setShiftClosingAmount(0);
      setShiftClosingCashCount({});
      setShowCloseShiftModal(true);
    } catch (err) {
      console.error('Failed to load shift summary:', err);
    }
  };

  // Load unpaid orders
  const loadOrders = useCallback(async () => {
    try {
      const [orders, summaryData] = await Promise.all([
        api.getUnpaidOrders(),
        api.getPaymentSummary(),
      ]);
      setUnpaidOrders(orders);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!cashierName) return;

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [cashierName, loadOrders]);

  // Reset payment state when order changes
  const resetPaymentState = useCallback(() => {
    setPaymentMethod(null);
    setPaidAmount('');
    setMember(null);
    setMemberSearch('');
    setMemberError('');
    setUsePoints(false);
    setDiscountPoints('');
    setSelectedPromotion(null);
    setCouponCode('');
    setCouponResult(null);
    setPromotionDiscount(0);
  }, []);

  useEffect(() => {
    resetPaymentState();

    // Load available promotions for selected order
    if (selectedOrder) {
      api.getAvailablePromotions(selectedOrder.totalAmount)
        .then(setAvailablePromotions)
        .catch(() => setAvailablePromotions([]));
    } else {
      setAvailablePromotions([]);
    }
  }, [selectedOrder?.id]);

  // Reset payment state when merge selection changes
  const mergeKey = Array.from(selectedOrderIds).sort().join(',');
  useEffect(() => {
    if (posMode === 'merge' && selectedMergeOrders.length >= 2) {
      resetPaymentState();
      api.getAvailablePromotions(mergedSubtotal)
        .then(setAvailablePromotions)
        .catch(() => setAvailablePromotions([]));
    }
  }, [mergeKey]);

  // Search member
  const handleMemberSearch = async () => {
    if (!memberSearch.trim()) return;
    setMemberError('');
    setMember(null);

    try {
      let found: Member | null = null;

      // Try by member ID first
      if (memberSearch.startsWith('M')) {
        try {
          found = await api.getMemberByMemberId(memberSearch.trim());
        } catch {
          // Try by phone
        }
      }

      // Try by phone
      if (!found) {
        found = await api.getMemberByPhone(memberSearch.trim());
      }

      if (found) {
        setMember(found);
      } else {
        setMemberError('ไม่พบสมาชิก');
      }
    } catch {
      setMemberError('ไม่พบสมาชิก');
    }
  };

  // Group orders by table
  const ordersByTable = useMemo(() => {
    const grouped: Record<string, OrderResponse[]> = {};
    for (const order of unpaidOrders) {
      const key = order.tableNumber || 'Kiosk';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(order);
    }
    return grouped;
  }, [unpaidOrders]);

  // Merge mode: selected orders and combined data
  const selectedMergeOrders = useMemo(
    () => unpaidOrders.filter((o) => selectedOrderIds.has(o.id)),
    [unpaidOrders, selectedOrderIds],
  );
  const mergedSubtotal = selectedMergeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const mergedItems = selectedMergeOrders.flatMap((o) => o.items || []);

  // Handle merge mode order click
  const handleMergeOrderClick = (order: OrderResponse) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      // If selecting from a different table, clear and start new
      if (next.size > 0) {
        const existingTable = unpaidOrders.find((o) => next.has(o.id))?.tableNumber;
        if (existingTable !== order.tableNumber) {
          return new Set([order.id]);
        }
      }
      if (next.has(order.id)) {
        next.delete(order.id);
      } else {
        next.add(order.id);
      }
      return next;
    });
  };

  // Handle split order
  const handleSplitOrder = async (groups: { itemIds: number[] }[]) => {
    if (!selectedOrder) return;
    try {
      await api.splitOrder(selectedOrder.id, groups);
      setShowSplitModal(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถแยกออเดอร์ได้');
    }
  };

  // Calculate amounts (supports both normal and merge mode)
  const subtotal = posMode === 'merge' && selectedMergeOrders.length >= 2
    ? mergedSubtotal
    : selectedOrder?.totalAmount || 0;
  const pointsToUse = usePoints && member
    ? Math.min(parseInt(discountPoints) || 0, member.points, Math.floor(subtotal))
    : 0;
  const discountAmount = pointsToUse;
  const totalAmount = Math.max(0, subtotal - discountAmount - promotionDiscount);
  const changeAmount =
    paymentMethod === 'CASH' ? Math.max(0, (parseFloat(paidAmount) || 0) - totalAmount) : 0;
  const pointsEarned = member ? Math.floor(totalAmount / 25) : 0;

  // Helper: calculate promotion discount amount
  const calcPromoDiscount = (promo: PromotionResponse, sub: number) => {
    if (promo.type === 'PERCENTAGE' || promo.type === 'HAPPY_HOUR') {
      const d = (sub * promo.discountValue) / 100;
      return promo.maxDiscount ? Math.min(d, promo.maxDiscount) : Math.round(d * 100) / 100;
    }
    return Math.min(promo.discountValue, sub);
  };

  const handleSelectPromotion = (promo: PromotionResponse | null) => {
    setCouponCode('');
    setCouponResult(null);
    if (promo) {
      setSelectedPromotion(promo);
      setPromotionDiscount(calcPromoDiscount(promo, subtotal));
    } else {
      setSelectedPromotion(null);
      setPromotionDiscount(0);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await api.validateCoupon(couponCode, subtotal);
      setCouponResult(result);
      if (result.valid && result.promotion) {
        setSelectedPromotion(result.promotion);
        setPromotionDiscount(result.discountAmount || 0);
      } else {
        setSelectedPromotion(null);
        setPromotionDiscount(0);
      }
    } catch {
      setCouponResult({ valid: false, message: 'ไม่สามารถตรวจสอบคูปองได้' });
      setSelectedPromotion(null);
      setPromotionDiscount(0);
    }
  };

  // Quick amount buttons
  const quickAmounts = [20, 50, 100, 500, 1000];

  // Handle payment (supports both normal and merge mode)
  const handlePayment = async () => {
    if (!paymentMethod) return;

    const paid = parseFloat(paidAmount) || 0;
    if (paymentMethod === 'CASH' && paid < totalAmount) {
      alert('จำนวนเงินไม่เพียงพอ');
      return;
    }

    setProcessing(true);
    try {
      if (posMode === 'merge' && selectedMergeOrders.length >= 2) {
        // Merged payment
        const result = await api.createMergedPayment({
          orderIds: Array.from(selectedOrderIds),
          paymentMethod,
          paidAmount: paymentMethod === 'CASH' ? paid : totalAmount,
          memberId: member?.memberId,
          discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
          cashierName: cashierName || undefined,
          shiftId: activeShift?.id,
          promotionId: selectedPromotion?.id,
          couponCode: couponResult?.valid ? couponCode.toUpperCase() : undefined,
        });
        setReceiptPayment(result.payment);
        setReceiptMergedOrders(result.mergedOrders);
        setSelectedOrderIds(new Set());
        setPosMode('normal');
      } else {
        // Normal single-order payment
        if (!selectedOrder) return;
        const result = await api.createPayment({
          orderId: selectedOrder.id,
          paymentMethod,
          paidAmount: paymentMethod === 'CASH' ? paid : totalAmount,
          memberId: member?.memberId,
          discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
          cashierName: cashierName || undefined,
          shiftId: activeShift?.id,
          promotionId: selectedPromotion?.id,
          couponCode: couponResult?.valid ? couponCode.toUpperCase() : undefined,
        });
        setReceiptPayment(result);
        setReceiptMergedOrders(null);
        setSelectedOrder(null);
      }
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการชำระเงิน');
    } finally {
      setProcessing(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setCashierName(null);
    setSelectedOrder(null);
    setUnpaidOrders([]);
    setActiveShift(null);
    setShiftSummaryData(null);
  };

  // PIN Login
  if (!cashierName) {
    return <PinLogin onLogin={setCashierName} />;
  }

  const tierColors: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-gray-100 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">POS System</h1>
            <p className="text-sm text-gray-500">
              แคชเชียร์: {cashierName}
              {activeShift && <span className="ml-2 text-violet-600">| กะ: {activeShift.shiftNumber}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BranchSelector />
          {/* Today Summary */}
          {summary && (
            <div className="flex items-center gap-4 text-sm">
              <div className="bg-green-50 px-4 py-2 rounded-xl">
                <span className="text-green-600">รายได้วันนี้ </span>
                <span className="font-bold text-green-700">
                  ฿{summary.totalRevenue.toFixed(0)}
                </span>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <span className="text-blue-600">รายการ </span>
                <span className="font-bold text-blue-700">
                  {summary.totalTransactions}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
          >
            <History className="w-4 h-4" />
            ประวัติ
          </button>

          {activeShift && (
            <button
              onClick={prepareCloseShift}
              className="bg-violet-50 text-violet-600 px-4 py-2 rounded-xl hover:bg-violet-100 flex items-center gap-2 text-sm font-medium"
            >
              <Square className="w-4 h-4" />
              ปิดกะ
            </button>
          )}

          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 flex items-center gap-2 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            ออก
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex print:hidden">
        {/* Left: Orders List */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                ออเดอร์รอชำระ ({unpaidOrders.length})
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setPosMode('normal'); setSelectedOrderIds(new Set()); }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  posMode === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                ปกติ
              </button>
              <button
                onClick={() => { setPosMode('merge'); setSelectedOrder(null); }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  posMode === 'merge' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                รวมออเดอร์
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingOrders ? (
              <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
            ) : unpaidOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ไม่มีออเดอร์รอชำระ</p>
              </div>
            ) : (
              <div>
                {Object.entries(ordersByTable).map(([table, orders]) => (
                  <div key={table}>
                    {/* Table group header */}
                    <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between sticky top-0">
                      <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {table === 'Kiosk' ? 'Kiosk' : `โต๊ะ ${table}`}
                        <span className="text-gray-400 font-normal ml-1">({orders.length})</span>
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ฿{orders.reduce((s, o) => s + o.totalAmount, 0).toFixed(0)}
                      </span>
                    </div>
                    {/* Orders in table */}
                    <div className="divide-y">
                      {orders.map((order) => {
                        const isSelected = posMode === 'merge'
                          ? selectedOrderIds.has(order.id)
                          : selectedOrder?.id === order.id;
                        return (
                          <button
                            key={order.id}
                            onClick={() => {
                              if (posMode === 'merge') {
                                handleMergeOrderClick(order);
                              } else {
                                setSelectedOrder(order);
                              }
                            }}
                            className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${
                              isSelected
                                ? posMode === 'merge'
                                  ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                  : 'bg-blue-50 border-l-4 border-blue-500'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {posMode === 'merge' && (
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                )}
                                <span className="font-mono font-semibold text-blue-600">
                                  {order.orderId}
                                </span>
                              </div>
                              <span className="text-lg font-bold">
                                ฿{order.totalAmount.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              {order.items
                                ?.slice(0, 3)
                                .map((item: any) => `${item.menuItem?.name} x${item.quantity}`)
                                .join(', ')}
                              {order.items?.length > 3 && ` +${order.items.length - 3} รายการ`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Merge mode info bar */}
          {posMode === 'merge' && selectedOrderIds.size >= 2 && (
            <div className="p-3 border-t bg-indigo-50">
              <div className="text-center text-sm text-indigo-700 font-medium">
                เลือก {selectedOrderIds.size} ออเดอร์ | รวม ฿{mergedSubtotal.toFixed(0)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment Panel */}
        <div className="flex-1 overflow-y-auto">
          {!((posMode === 'merge' && selectedMergeOrders.length >= 2) || (posMode === 'normal' && selectedOrder)) ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                {posMode === 'merge' ? (
                  <>
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-xl">เลือกออเดอร์ 2 รายการขึ้นไป</p>
                    <p className="text-sm mt-1">จากโต๊ะเดียวกัน เพื่อรวมชำระ</p>
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-xl">เลือกออเดอร์จากรายการด้านซ้าย</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-2xl mx-auto">
              {/* Order Details */}
              {posMode === 'merge' && selectedMergeOrders.length >= 2 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      รวม {selectedMergeOrders.length} ออเดอร์
                    </h3>
                    <span className="text-sm text-gray-500">
                      โต๊ะ {selectedMergeOrders[0]?.tableNumber || 'Kiosk'}
                    </span>
                  </div>
                  {selectedMergeOrders.map((order) => (
                    <div key={order.id} className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 mb-1">{order.orderId}</p>
                      <div className="divide-y">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-1.5">
                            <div>
                              <span className="font-medium">{item.menuItem?.name || 'Unknown'}</span>
                              <span className="text-gray-400 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-semibold">฿{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedOrder && (
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      {selectedOrder.orderId}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedOrder.items && selectedOrder.items.length >= 2 && (
                        <button
                          onClick={() => setShowSplitModal(true)}
                          className="flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
                        >
                          <Scissors className="w-4 h-4" />
                          แยกออเดอร์
                        </button>
                      )}
                      <span className="text-sm text-gray-500">
                        {selectedOrder.tableNumber ? `โต๊ะ ${selectedOrder.tableNumber}` : 'Kiosk'}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2"
                      >
                        <div>
                          <span className="font-medium">
                            {item.menuItem?.name || 'Unknown'}
                          </span>
                          <span className="text-gray-400 ml-2">
                            x{item.quantity}
                          </span>
                          {item.selectedAddOns &&
                            JSON.parse(
                              typeof item.selectedAddOns === 'string'
                                ? item.selectedAddOns
                                : JSON.stringify(item.selectedAddOns)
                            )?.length > 0 && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                + Add-ons
                              </div>
                            )}
                        </div>
                        <span className="font-semibold">
                          ฿{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <h3 className="font-bold text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  สมาชิก (ไม่บังคับ)
                </h3>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()}
                    placeholder="เบอร์โทร หรือ Member ID"
                    className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleMemberSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  {member && (
                    <button
                      onClick={() => {
                        setMember(null);
                        setMemberSearch('');
                        setUsePoints(false);
                        setDiscountPoints('');
                      }}
                      className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {memberError && (
                  <p className="text-red-500 text-sm mb-2">{memberError}</p>
                )}

                {member && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">{member.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            tierColors[member.tier] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {member.tier.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold">{member.points}</span>
                        <span className="text-gray-500">แต้ม</span>
                      </div>
                    </div>

                    {member.points > 0 && (
                      <div className="mt-3 border-t border-blue-200 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={usePoints}
                            onChange={(e) => {
                              setUsePoints(e.target.checked);
                              if (!e.target.checked) setDiscountPoints('');
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Gift className="w-4 h-4 text-green-600" />
                          <span className="text-sm">ใช้แต้มแลกส่วนลด (1 แต้ม = 1 บาท)</span>
                        </label>

                        {usePoints && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              value={discountPoints}
                              onChange={(e) =>
                                setDiscountPoints(e.target.value)
                              }
                              max={Math.min(member.points, Math.floor(subtotal))}
                              min={0}
                              placeholder={`สูงสุด ${Math.min(member.points, Math.floor(subtotal))}`}
                              className="w-32 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() =>
                                setDiscountPoints(
                                  String(Math.min(member.points, Math.floor(subtotal)))
                                )
                              }
                              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200"
                            >
                              ใช้สูงสุด
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {pointsEarned > 0 && (
                      <div className="mt-2 text-xs text-green-600">
                        จะได้รับ +{pointsEarned} แต้มจากรายการนี้
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Promotion / Coupon Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <h3 className="font-bold text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  โปรโมชัน / คูปอง
                </h3>

                {/* Available Promotions */}
                {availablePromotions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-500">โปรโมชันที่ใช้ได้:</p>
                    {availablePromotions.map((promo) => {
                      const isSelected = selectedPromotion?.id === promo.id && !couponResult?.valid;
                      const discountText = promo.type === 'PERCENTAGE' || promo.type === 'HAPPY_HOUR'
                        ? `ลด ${promo.discountValue}%${promo.maxDiscount ? ` (สูงสุด ${promo.maxDiscount}฿)` : ''}`
                        : `ลด ${promo.discountValue}฿`;
                      return (
                        <button
                          key={promo.id}
                          onClick={() => handleSelectPromotion(isSelected ? null : promo)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                              <span className="font-medium">{promo.name}</span>
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-orange-600' : 'text-gray-600'}`}>
                              {discountText}
                            </span>
                          </div>
                          {promo.type === 'HAPPY_HOUR' && promo.startTime && promo.endTime && (
                            <p className="text-xs text-orange-500 mt-1 ml-5">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {promo.startTime} - {promo.endTime}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Coupon Input */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">กรอกรหัสคูปอง:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (couponResult) setCouponResult(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      placeholder="เช่น WELCOME50"
                      className="flex-1 border rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim()}
                      className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                    >
                      <Ticket className="w-4 h-4" />
                      ใช้
                    </button>
                    {(selectedPromotion || couponResult) && (
                      <button
                        onClick={() => {
                          setSelectedPromotion(null);
                          setCouponCode('');
                          setCouponResult(null);
                          setPromotionDiscount(0);
                        }}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {couponResult && (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                      couponResult.valid
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {couponResult.message}
                    </div>
                  )}
                </div>

                {/* Selected Promotion Summary */}
                {selectedPromotion && promotionDiscount > 0 && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-orange-700 font-medium">
                      {selectedPromotion.name}
                    </span>
                    <span className="text-orange-700 font-bold">-฿{promotionDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ยอดรวม</span>
                    <span>฿{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>ส่วนลดแต้ม ({pointsToUse} แต้ม)</span>
                      <span>-฿{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {promotionDiscount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>ส่วนลดโปรโมชัน ({selectedPromotion?.name})</span>
                      <span>-฿{promotionDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold border-t pt-2">
                    <span>ยอดสุทธิ</span>
                    <span className="text-blue-600">฿{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <h3 className="font-bold text-sm text-gray-600 mb-3">
                  เลือกวิธีชำระเงิน
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setPaidAmount('');
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'CASH'
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMethod === 'CASH'
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }`}
                    >
                      เงินสด
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod('TRANSFER');
                      setPaidAmount(String(totalAmount));
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'TRANSFER'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMethod === 'TRANSFER'
                          ? 'text-blue-700'
                          : 'text-gray-600'
                      }`}
                    >
                      เงินโอน
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod('CREDIT_CARD');
                      setPaidAmount(String(totalAmount));
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'text-purple-700'
                          : 'text-gray-600'
                      }`}
                    >
                      บัตรเครดิต
                    </span>
                  </button>
                </div>

                {/* Cash Input */}
                {paymentMethod === 'CASH' && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600 mb-2 block">
                      จำนวนเงินที่รับ
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-2xl font-bold text-center border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2 mt-3">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setPaidAmount(String(amount))}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          ฿{amount}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setPaidAmount(String(Math.ceil(totalAmount / 100) * 100))
                        }
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        พอดี
                      </button>
                    </div>

                    {/* Change Display */}
                    {parseFloat(paidAmount) >= totalAmount && (
                      <div className="mt-3 bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-green-600">เงินทอน</p>
                        <p className="text-3xl font-bold text-green-700">
                          ฿{changeAmount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Transfer/Credit Card Confirmation */}
                {(paymentMethod === 'TRANSFER' ||
                  paymentMethod === 'CREDIT_CARD') && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600">
                      {paymentMethod === 'TRANSFER'
                        ? 'ยืนยันว่าได้รับเงินโอนแล้ว'
                        : 'ยืนยันว่ารับชำระด้วยบัตรเครดิตแล้ว'}
                    </p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      ฿{totalAmount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={
                  !paymentMethod ||
                  processing ||
                  (paymentMethod === 'CASH' &&
                    (parseFloat(paidAmount) || 0) < totalAmount)
                }
                className={`w-full py-4 rounded-2xl text-xl font-bold transition-all flex items-center justify-center gap-3 ${
                  !paymentMethod ||
                  processing ||
                  (paymentMethod === 'CASH' &&
                    (parseFloat(paidAmount) || 0) < totalAmount)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-lg'
                }`}
              >
                {processing ? (
                  'กำลังดำเนินการ...'
                ) : (
                  <>
                    <DollarSign className="w-6 h-6" />
                    ชำระเงิน ฿{totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          mergedOrders={receiptMergedOrders}
          onClose={() => { setReceiptPayment(null); setReceiptMergedOrders(null); }}
        />
      )}

      {/* Split Order Modal */}
      {showSplitModal && selectedOrder && (
        <SplitOrderModal
          order={selectedOrder}
          onClose={() => setShowSplitModal(false)}
          onSplit={handleSplitOrder}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onViewReceipt={(payment) => {
            setShowHistory(false);
            setReceiptPayment(payment);
          }}
        />
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <OpenShiftModal
          onOpenShift={handleOpenShiftWithPin}
          onSkip={() => setShowOpenShiftModal(false)}
          openingAmount={shiftOpeningAmount}
          onOpeningAmountChange={setShiftOpeningAmount}
          openingCashCount={shiftOpeningCashCount}
          onOpeningCashCountChange={setShiftOpeningCashCount}
          notes={shiftNotes}
          onNotesChange={setShiftNotes}
          error={shiftError}
          processing={shiftProcessing}
        />
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && activeShift && shiftSummaryData && (
        <CloseShiftModal
          shift={activeShift}
          summary={shiftSummaryData}
          onClose={() => setShowCloseShiftModal(false)}
          onCloseShift={handleCloseShift}
          closingAmount={shiftClosingAmount}
          onClosingAmountChange={setShiftClosingAmount}
          closingCashCount={shiftClosingCashCount}
          onClosingCashCountChange={setShiftClosingCashCount}
          notes={shiftNotes}
          onNotesChange={setShiftNotes}
          error={shiftError}
          processing={shiftProcessing}
        />
      )}
    </div>
  );
}
