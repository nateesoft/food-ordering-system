'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { api, OrderResponse } from '@/lib/api';
import { Payment, PaymentSummary, Member } from '@/types';
import BranchSelector from '@/components/BranchSelector';

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
  onClose,
}: {
  payment: Payment;
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
          {payment.order && (
            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-gray-600">
                Order: {payment.order.orderId}
                {payment.order.tableNumber && ` | โต๊ะ ${payment.order.tableNumber}`}
              </p>
              <div className="space-y-1">
                {payment.order.items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.menuItem?.name || 'Unknown'} x{item.quantity}
                    </span>
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
                <span>ส่วนลด ({payment.discountPoints} แต้ม)</span>
                <span>-฿{payment.discountAmount.toFixed(2)}</span>
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

// ===== Main POS Page =====
export default function POSPage() {
  // Auth state
  const [cashierName, setCashierName] = useState<string | null>(null);

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

  // UI state
  const [processing, setProcessing] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
  useEffect(() => {
    setPaymentMethod(null);
    setPaidAmount('');
    setMember(null);
    setMemberSearch('');
    setMemberError('');
    setUsePoints(false);
    setDiscountPoints('');
  }, [selectedOrder?.id]);

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

  // Calculate amounts
  const subtotal = selectedOrder?.totalAmount || 0;
  const pointsToUse = usePoints && member
    ? Math.min(parseInt(discountPoints) || 0, member.points, Math.floor(subtotal))
    : 0;
  const discountAmount = pointsToUse;
  const totalAmount = subtotal - discountAmount;
  const changeAmount =
    paymentMethod === 'CASH' ? Math.max(0, (parseFloat(paidAmount) || 0) - totalAmount) : 0;
  const pointsEarned = member ? Math.floor(totalAmount / 25) : 0;

  // Quick amount buttons
  const quickAmounts = [20, 50, 100, 500, 1000];

  // Handle payment
  const handlePayment = async () => {
    if (!selectedOrder || !paymentMethod) return;

    const paid = parseFloat(paidAmount) || 0;
    if (paymentMethod === 'CASH' && paid < totalAmount) {
      alert('จำนวนเงินไม่เพียงพอ');
      return;
    }

    setProcessing(true);
    try {
      const result = await api.createPayment({
        orderId: selectedOrder.id,
        paymentMethod,
        paidAmount: paymentMethod === 'CASH' ? paid : totalAmount,
        memberId: member?.memberId,
        discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
        cashierName: cashierName || undefined,
      });

      setReceiptPayment(result);
      setSelectedOrder(null);
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
        <div className="w-1/3 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              ออเดอร์รอชำระ ({unpaidOrders.length})
            </h2>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
          ) : unpaidOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่มีออเดอร์รอชำระ</p>
            </div>
          ) : (
            <div className="divide-y">
              {unpaidOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${
                    selectedOrder?.id === order.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-blue-600">
                      {order.orderId}
                    </span>
                    <span className="text-lg font-bold">
                      ฿{order.totalAmount.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {order.tableNumber ? (
                        <>
                          <Hash className="w-3 h-3" />
                          โต๊ะ {order.tableNumber}
                        </>
                      ) : (
                        'Kiosk'
                      )}
                    </span>
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
                      .map(
                        (item: any) =>
                          `${item.menuItem?.name} x${item.quantity}`
                      )
                      .join(', ')}
                    {order.items?.length > 3 && ` +${order.items.length - 3} รายการ`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Payment Panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedOrder ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <ArrowLeft className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl">เลือกออเดอร์จากรายการด้านซ้าย</p>
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-2xl mx-auto">
              {/* Order Details */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    {selectedOrder.orderId}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedOrder.tableNumber
                      ? `โต๊ะ ${selectedOrder.tableNumber}`
                      : 'Kiosk'}
                  </span>
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
          onClose={() => setReceiptPayment(null)}
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
    </div>
  );
}
