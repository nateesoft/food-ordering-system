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
  Clock,
  Star,
  X,
  Gift,
  BadgeCheck,
  Tag,
  Ticket,
  Layers,
  Scissors,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  Hash,
  CheckSquare,
  Check,
} from 'lucide-react';
import { api, OrderResponse, ShiftResponse, PromotionResponse, CouponValidationResponse } from '@/lib/api';
import { Payment, PaymentSummary, Member } from '@/types';

// ===== Props =====

interface POSPaymentProps {
  branchId?: string;
  tableNumber?: string;
  cashierName: string;
  activeShift: ShiftResponse | null;
  onPaymentComplete: (payment: Payment, mergedOrders?: any[] | null) => void;
  onBack: () => void;
}

// ===== Tier Colors =====

const tierColors: Record<string, string> = {
  bronze: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200/50',
  silver: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50',
  gold: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200/50',
};

// ===== Quick Amounts =====

const quickAmounts = [20, 50, 100, 500, 1000];

// ===== Helper: Promotion Discount =====

function calcPromoDiscount(promo: PromotionResponse, subtotal: number): number {
  if (promo.type === 'PERCENTAGE' || promo.type === 'HAPPY_HOUR') {
    const d = (subtotal * promo.discountValue) / 100;
    return promo.maxDiscount ? Math.min(d, promo.maxDiscount) : Math.round(d * 100) / 100;
  }
  return Math.min(promo.discountValue, subtotal);
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
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-gradient-to-r from-green-500 to-green-600',
    'bg-gradient-to-r from-purple-500 to-purple-600',
    'bg-gradient-to-r from-orange-500 to-orange-600',
  ];

  const billBorderColors = [
    'border-blue-400',
    'border-green-400',
    'border-purple-400',
    'border-orange-400',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/50 animate-slide-up">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              แยกออเดอร์ - {order.orderId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
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
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    billCount === n
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
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
                  className="flex items-center justify-between bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-200/50"
                >
                  <div className="flex-1 min-w-0">
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
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {Array.from({ length: billCount }, (_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setItemBills((prev) => ({
                            ...prev,
                            [item.id]: i,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          itemBills[item.id] === i
                            ? `${billColors[i]} text-white shadow-md`
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.index}
                className={`rounded-2xl p-4 border-2 transition-all duration-300 ${
                  bill.items.length === 0
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100/50'
                    : `${billBorderColors[bill.index]} bg-gradient-to-br from-gray-50 to-gray-100/50`
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${billColors[bill.index]} shadow-sm`}
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
                    <div className="border-t border-gray-200/50 mt-2 pt-2 flex justify-between font-bold text-gray-800">
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
        <div className="p-5 md:p-6 border-t border-gray-200/50 flex gap-3 bg-white/80">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200/50 text-gray-700 rounded-xl font-medium hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSplit}
            disabled={!canSplit || processing}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all duration-300"
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

// ===== Main Component =====

export default function POSPayment({
  tableNumber,
  cashierName,
  activeShift,
  onPaymentComplete,
  onBack,
}: POSPaymentProps) {
  // Data state
  const [unpaidOrders, setUnpaidOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Mode state
  const [posMode, setPosMode] = useState<'normal' | 'merge'>('normal');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

  // Payment state — split payment support
  const [splitPayments, setSplitPayments] = useState<{ method: string; amount: string }[]>([]);
  const [processing, setProcessing] = useState(false);

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

  // Split modal state
  const [showSplitModal, setShowSplitModal] = useState(false);

  // ===== Load Orders =====

  const loadOrders = useCallback(async () => {
    try {
      const orders = await api.getUnpaidOrders();
      const filtered = tableNumber
        ? orders.filter((o) => o.tableNumber === tableNumber)
        : orders;
      setUnpaidOrders(filtered);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [tableNumber]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // ===== Reset Payment State =====

  const resetPaymentState = useCallback(() => {
    setSplitPayments([]);
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
    if (selectedOrder) {
      api.getAvailablePromotions(selectedOrder.totalAmount)
        .then(setAvailablePromotions)
        .catch(() => setAvailablePromotions([]));
    } else {
      setAvailablePromotions([]);
    }
  }, [selectedOrder?.id]);

  // Reset when merge selection changes
  const mergeKey = Array.from(selectedOrderIds).sort().join(',');
  useEffect(() => {
    if (posMode === 'merge' && selectedMergeOrders.length >= 2) {
      resetPaymentState();
      api.getAvailablePromotions(mergedSubtotal)
        .then(setAvailablePromotions)
        .catch(() => setAvailablePromotions([]));
    }
  }, [mergeKey]);

  // ===== Group Orders By Table =====

  const ordersByTable = useMemo(() => {
    const grouped: Record<string, OrderResponse[]> = {};
    for (const order of unpaidOrders) {
      const key = order.tableNumber || 'Kiosk';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(order);
    }
    return grouped;
  }, [unpaidOrders]);

  // ===== Merge Mode =====

  const selectedMergeOrders = useMemo(
    () => unpaidOrders.filter((o) => selectedOrderIds.has(o.id)),
    [unpaidOrders, selectedOrderIds],
  );
  const mergedSubtotal = selectedMergeOrders.reduce((s, o) => s + o.totalAmount, 0);

  const handleMergeOrderClick = (order: OrderResponse) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
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

  // ===== Split Order =====

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

  // ===== Member Search =====

  const handleMemberSearch = async () => {
    if (!memberSearch.trim()) return;
    setMemberError('');
    setMember(null);

    try {
      let found: Member | null = null;

      if (memberSearch.startsWith('M')) {
        try {
          found = await api.getMemberByMemberId(memberSearch.trim());
        } catch {
          // Try by phone
        }
      }

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

  // ===== Promotion / Coupon =====

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

  // ===== Calculate Amounts =====

  const subtotal = posMode === 'merge' && selectedMergeOrders.length >= 2
    ? mergedSubtotal
    : selectedOrder?.totalAmount || 0;

  const serviceCharge = subtotal * 0.10;
  const vat = (subtotal + serviceCharge) * 0.07;

  const pointsToUse = usePoints && member
    ? Math.min(parseInt(discountPoints) || 0, member.points, Math.floor(subtotal))
    : 0;
  const discountAmount = pointsToUse;

  const totalAmount = Math.max(0, subtotal + serviceCharge + vat - discountAmount - promotionDiscount);

  // Split payment derived values
  const activeMethods = splitPayments.map((sp) => sp.method);
  const totalPaid = splitPayments.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const cashSplit = splitPayments.find((sp) => sp.method === 'CASH');
  const cashAmount = cashSplit ? (parseFloat(cashSplit.amount) || 0) : 0;
  const nonCashTotal = splitPayments
    .filter((sp) => sp.method !== 'CASH')
    .reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const cashNeeded = Math.max(0, totalAmount - nonCashTotal);
  const changeAmount = cashSplit ? Math.max(0, cashAmount - cashNeeded) : 0;
  const pointsEarned = member ? Math.floor(totalAmount / 25) : 0;

  // Helpers for split payment management
  const togglePaymentMethod = (method: string) => {
    setSplitPayments((prev) => {
      const existing = prev.find((sp) => sp.method === method);
      if (existing) {
        return prev.filter((sp) => sp.method !== method);
      }
      if (method === 'CASH') {
        return [...prev, { method, amount: '' }];
      }
      // Non-cash: default to remaining amount
      const currentPaid = prev.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
      const remaining = Math.max(0, totalAmount - currentPaid);
      return [...prev, { method, amount: remaining > 0 ? String(Math.round(remaining * 100) / 100) : String(totalAmount) }];
    });
  };

  const updateSplitAmount = (method: string, amount: string) => {
    setSplitPayments((prev) =>
      prev.map((sp) => (sp.method === method ? { ...sp, amount } : sp)),
    );
  };

  const addToCashAmount = (addAmount: number) => {
    setSplitPayments((prev) =>
      prev.map((sp) => {
        if (sp.method === 'CASH') {
          const current = parseFloat(sp.amount) || 0;
          return { ...sp, amount: String(current + addAmount) };
        }
        return sp;
      }),
    );
  };

  // ===== Handle Payment =====

  const handlePayment = async () => {
    if (splitPayments.length === 0) return;

    if (totalPaid < totalAmount) {
      alert('จำนวนเงินไม่เพียงพอ');
      return;
    }

    const primaryMethod = splitPayments[0].method;
    const splitPaymentsPayload = splitPayments.length > 1
      ? splitPayments.map((sp) => ({ method: sp.method, amount: parseFloat(sp.amount) || 0 }))
      : undefined;

    // For single cash payment, send actual cash amount; otherwise send totalAmount
    const effectivePaidAmount = splitPayments.length === 1 && primaryMethod === 'CASH'
      ? totalPaid
      : splitPaymentsPayload
        ? totalPaid
        : totalAmount;

    setProcessing(true);
    try {
      if (posMode === 'merge' && selectedMergeOrders.length >= 2) {
        const result = await api.createMergedPayment({
          orderIds: Array.from(selectedOrderIds),
          paymentMethod: primaryMethod,
          paidAmount: effectivePaidAmount,
          memberId: member?.memberId,
          discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
          cashierName: cashierName || undefined,
          shiftId: activeShift?.id,
          promotionId: selectedPromotion?.id,
          couponCode: couponResult?.valid ? couponCode.toUpperCase() : undefined,
          splitPayments: splitPaymentsPayload,
        });
        onPaymentComplete(result.payment, result.mergedOrders);
      } else {
        if (!selectedOrder) return;
        const result = await api.createPayment({
          orderId: selectedOrder.id,
          paymentMethod: primaryMethod,
          paidAmount: effectivePaidAmount,
          memberId: member?.memberId,
          discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
          cashierName: cashierName || undefined,
          shiftId: activeShift?.id,
          serviceCharge: Math.round(serviceCharge * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          promotionId: selectedPromotion?.id,
          couponCode: couponResult?.valid ? couponCode.toUpperCase() : undefined,
          splitPayments: splitPaymentsPayload,
        });
        onPaymentComplete(result, null);
      }
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการชำระเงิน');
    } finally {
      setProcessing(false);
    }
  };

  // ===== Determine if payment panel should show =====

  const hasActiveSelection =
    (posMode === 'merge' && selectedMergeOrders.length >= 2) ||
    (posMode === 'normal' && selectedOrder);

  // ===== Render =====

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">ชำระเงิน</h1>
            <p className="text-xs md:text-sm text-gray-500">
              แคชเชียร์: {cashierName}
              {activeShift && (
                <span className="ml-2 text-violet-600">| กะ: {activeShift.shiftNumber}</span>
              )}
              {tableNumber && (
                <span className="ml-2 text-blue-600">| โต๊ะ {tableNumber}</span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - responsive: stack on mobile, side-by-side on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Orders List */}
        <div className="w-full lg:w-[360px] xl:w-[400px] bg-white/90 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-gray-200/50 flex flex-col max-h-[45vh] lg:max-h-none">
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">ออเดอร์รอชำระ</span>
                <span className="sm:hidden">ออเดอร์</span>
                <span className="text-blue-600">({unpaidOrders.length})</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPosMode('normal');
                  setSelectedOrderIds(new Set());
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  posMode === 'normal'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                }`}
              >
                ปกติ
              </button>
              <button
                onClick={() => {
                  setPosMode('merge');
                  setSelectedOrder(null);
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                  posMode === 'merge'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                รวมออเดอร์
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingOrders ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                กำลังโหลด...
              </div>
            ) : unpaidOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 animate-fade-in">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ไม่มีออเดอร์รอชำระ</p>
              </div>
            ) : (
              <div>
                {Object.entries(ordersByTable).map(([table, orders]) => (
                  <div key={table}>
                    {/* Table group header */}
                    <div className="px-4 py-2 bg-gradient-to-r from-gray-100/80 to-gray-50/80 border-b border-gray-200/50 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                      <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {table === 'Kiosk' ? 'Kiosk' : `โต๊ะ ${table}`}
                        <span className="text-gray-400 font-normal ml-1">
                          ({orders.length})
                        </span>
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ฿{orders.reduce((s, o) => s + o.totalAmount, 0).toFixed(0)}
                      </span>
                    </div>
                    {/* Orders in table */}
                    <div className="divide-y divide-gray-100">
                      {orders.map((order) => {
                        const isSelected =
                          posMode === 'merge'
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
                            className={`w-full text-left p-4 transition-all duration-300 ${
                              isSelected
                                ? posMode === 'merge'
                                  ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-l-4 border-indigo-500'
                                  : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-blue-500'
                                : 'hover:bg-blue-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {posMode === 'merge' && (
                                  <div
                                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-600 shadow-md shadow-indigo-500/30'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                                    )}
                                  </div>
                                )}
                                <span className="font-mono font-semibold text-blue-600">
                                  {order.orderId}
                                </span>
                              </div>
                              <span className="text-lg font-bold text-gray-800">
                                ฿{order.totalAmount.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString(
                                  'th-TH',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              {order.items
                                ?.slice(0, 3)
                                .map(
                                  (item: any) =>
                                    `${item.menuItem?.name} x${item.quantity}`,
                                )
                                .join(', ')}
                              {order.items?.length > 3 &&
                                ` +${order.items.length - 3} รายการ`}
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
            <div className="p-3 border-t border-gray-200/50 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
              <div className="text-center text-sm text-indigo-700 font-medium">
                เลือก {selectedOrderIds.size} ออเดอร์ | รวม ฿
                {mergedSubtotal.toFixed(0)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment Panel */}
        <div className="flex-1 overflow-y-auto">
          {!hasActiveSelection ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-gray-400 animate-fade-in">
              <div className="text-center">
                {posMode === 'merge' ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-indigo-200/50 rounded-3xl flex items-center justify-center">
                      <Layers className="w-10 h-10 text-indigo-300" />
                    </div>
                    <p className="text-xl font-medium text-gray-500">เลือกออเดอร์ 2 รายการขึ้นไป</p>
                    <p className="text-sm mt-1 text-gray-400">
                      จากโต๊ะเดียวกัน เพื่อรวมชำระ
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200/50 rounded-3xl flex items-center justify-center">
                      <ArrowLeft className="w-10 h-10 text-blue-300" />
                    </div>
                    <p className="text-xl font-medium text-gray-500">เลือกออเดอร์จากรายการ{' '}
                      <span className="hidden lg:inline">ด้านซ้าย</span>
                      <span className="lg:hidden">ด้านบน</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
              {/* Order Details */}
              {posMode === 'merge' && selectedMergeOrders.length >= 2 ? (
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 md:p-6 mb-4 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-1.5 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      รวม {selectedMergeOrders.length} ออเดอร์
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      โต๊ะ {selectedMergeOrders[0]?.tableNumber || 'Kiosk'}
                    </span>
                  </div>
                  {selectedMergeOrders.map((order) => (
                    <div key={order.id} className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        {order.orderId}
                      </p>
                      <div className="divide-y divide-gray-100">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div>
                              <span className="font-medium text-gray-800">
                                {item.menuItem?.name || 'Unknown'}
                              </span>
                              <span className="text-gray-400 ml-2">
                                x{item.quantity}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-700">
                              ฿{(item.price * item.quantity).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                selectedOrder && (
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 md:p-6 mb-4 border border-gray-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-1.5 rounded-lg">
                          <Receipt className="w-4 h-4" />
                        </div>
                        {selectedOrder.orderId}
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedOrder.items &&
                          selectedOrder.items.length >= 2 && (
                            <button
                              onClick={() => setShowSplitModal(true)}
                              className="flex items-center gap-1 text-sm text-purple-600 bg-gradient-to-r from-purple-50 to-purple-100/50 px-3 py-1.5 rounded-lg hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/50 transition-all duration-300"
                            >
                              <Scissors className="w-4 h-4" />
                              แยกออเดอร์
                            </button>
                          )}
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {selectedOrder.tableNumber
                            ? `โต๊ะ ${selectedOrder.tableNumber}`
                            : 'Kiosk'}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {item.menuItem?.name || 'Unknown'}
                            </span>
                            <span className="text-gray-400 ml-2">
                              x{item.quantity}
                            </span>
                            {item.selectedAddOns &&
                              JSON.parse(
                                typeof item.selectedAddOns === 'string'
                                  ? item.selectedAddOns
                                  : JSON.stringify(item.selectedAddOns),
                              )?.length > 0 && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  + Add-ons
                                </div>
                              )}
                          </div>
                          <span className="font-semibold text-gray-700">
                            ฿{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Member Section */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-md p-5 md:p-6 mb-4 border border-gray-200/50">
                <h3 className="font-bold text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  สมาชิก (ไม่บังคับ)
                </h3>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleMemberSearch()
                    }
                    placeholder="เบอร์โทร หรือ Member ID"
                    className="flex-1 border border-gray-200/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                  />
                  <button
                    onClick={handleMemberSearch}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all duration-300"
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
                      className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-200 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {memberError && (
                  <p className="text-red-500 text-sm mb-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200/50">{memberError}</p>
                )}

                {member && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-200/50 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">{member.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            tierColors[member.tier] ||
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {member.tier.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-gray-800">{member.points}</span>
                        <span className="text-gray-500">แต้ม</span>
                      </div>
                    </div>

                    {member.points > 0 && (
                      <div className="mt-3 border-t border-blue-200/50 pt-3">
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
                          <span className="text-sm">
                            ใช้แต้มแลกส่วนลด (1 แต้ม = 1 บาท)
                          </span>
                        </label>

                        {usePoints && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              value={discountPoints}
                              onChange={(e) =>
                                setDiscountPoints(e.target.value)
                              }
                              max={Math.min(
                                member.points,
                                Math.floor(subtotal),
                              )}
                              min={0}
                              placeholder={`สูงสุด ${Math.min(
                                member.points,
                                Math.floor(subtotal),
                              )}`}
                              className="w-32 border border-gray-200/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() =>
                                setDiscountPoints(
                                  String(
                                    Math.min(
                                      member.points,
                                      Math.floor(subtotal),
                                    ),
                                  ),
                                )
                              }
                              className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1.5 rounded-lg hover:from-green-200 hover:to-emerald-200 border border-green-200/50 transition-all duration-300"
                            >
                              ใช้สูงสุด
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {pointsEarned > 0 && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50/50 px-2 py-1 rounded-lg inline-block">
                        จะได้รับ +{pointsEarned} แต้มจากรายการนี้
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Promotion / Coupon Section */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-md p-5 md:p-6 mb-4 border border-gray-200/50">
                <h3 className="font-bold text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  โปรโมชัน / คูปอง
                </h3>

                {/* Available Promotions */}
                {availablePromotions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-500">โปรโมชันที่ใช้ได้:</p>
                    {availablePromotions.map((promo) => {
                      const isSelected =
                        selectedPromotion?.id === promo.id &&
                        !couponResult?.valid;
                      const discountText =
                        promo.type === 'PERCENTAGE' ||
                        promo.type === 'HAPPY_HOUR'
                          ? `ลด ${promo.discountValue}%${
                              promo.maxDiscount
                                ? ` (สูงสุด ${promo.maxDiscount}฿)`
                                : ''
                            }`
                          : `ลด ${promo.discountValue}฿`;
                      return (
                        <button
                          key={promo.id}
                          onClick={() =>
                            handleSelectPromotion(isSelected ? null : promo)
                          }
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-300 text-sm ${
                            isSelected
                              ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md shadow-orange-500/10'
                              : 'border-gray-200/50 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag
                                className={`w-3.5 h-3.5 ${
                                  isSelected
                                    ? 'text-orange-600'
                                    : 'text-gray-400'
                                }`}
                              />
                              <span className="font-medium">{promo.name}</span>
                            </div>
                            <span
                              className={`font-semibold ${
                                isSelected
                                  ? 'text-orange-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {discountText}
                            </span>
                          </div>
                          {promo.type === 'HAPPY_HOUR' &&
                            promo.startTime &&
                            promo.endTime && (
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
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleValidateCoupon()
                      }
                      placeholder="เช่น WELCOME50"
                      className="flex-1 border border-gray-200/50 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim()}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1 shadow-md shadow-orange-500/20 transition-all duration-300"
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
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-200 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {couponResult && (
                    <div
                      className={`mt-2 px-3 py-2 rounded-xl text-sm border animate-fade-in ${
                        couponResult.valid
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50'
                          : 'bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border-red-200/50'
                      }`}
                    >
                      {couponResult.message}
                    </div>
                  )}
                </div>

                {/* Selected Promotion Summary */}
                {selectedPromotion && promotionDiscount > 0 && (
                  <div className="mt-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 flex items-center justify-between border border-orange-200/50 animate-fade-in">
                    <span className="text-sm text-orange-700 font-medium">
                      {selectedPromotion.name}
                    </span>
                    <span className="text-orange-700 font-bold">
                      -฿{promotionDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-xl rounded-2xl shadow-md p-5 md:p-6 mb-4 border border-blue-200/30">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ยอดรวม</span>
                    <span>฿{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ค่าบริการ (10%)</span>
                    <span>฿{serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ภาษีมูลค่าเพิ่ม (7%)</span>
                    <span>฿{vat.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>ส่วนลดแต้ม ({pointsToUse} แต้ม)</span>
                      <span>-฿{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {promotionDiscount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>
                        ส่วนลดโปรโมชัน ({selectedPromotion?.name})
                      </span>
                      <span>-฿{promotionDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold border-t border-blue-200/30 pt-3">
                    <span className="text-gray-800">ยอดสุทธิ</span>
                    <span className="text-blue-600">
                      ฿{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-md p-5 md:p-6 mb-4 border border-gray-200/50">
                <h3 className="font-bold text-sm text-gray-600 mb-3">
                  เลือกวิธีชำระเงิน
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { method: 'CASH', label: 'เงินสด', Icon: Banknote, activeColor: 'green', activeBorder: 'border-green-400', activeBg: 'from-green-50 to-emerald-100/50', activeShadow: 'shadow-green-500/20', iconActiveBg: 'from-green-500 to-green-600', iconActiveShadow: 'shadow-green-500/30', activeText: 'text-green-700' },
                    { method: 'TRANSFER', label: 'เงินโอน', Icon: Building2, activeColor: 'blue', activeBorder: 'border-blue-400', activeBg: 'from-blue-50 to-indigo-100/50', activeShadow: 'shadow-blue-500/20', iconActiveBg: 'from-blue-500 to-blue-600', iconActiveShadow: 'shadow-blue-500/30', activeText: 'text-blue-700' },
                    { method: 'CREDIT_CARD', label: 'บัตรเครดิต', Icon: CreditCard, activeColor: 'purple', activeBorder: 'border-purple-400', activeBg: 'from-purple-50 to-violet-100/50', activeShadow: 'shadow-purple-500/20', iconActiveBg: 'from-purple-500 to-purple-600', iconActiveShadow: 'shadow-purple-500/30', activeText: 'text-purple-700' },
                  ].map(({ method, label, Icon, activeBorder, activeBg, activeShadow, iconActiveBg, iconActiveShadow, activeText }) => {
                    const isActive = activeMethods.includes(method);
                    return (
                      <button
                        key={method}
                        onClick={() => togglePaymentMethod(method)}
                        className={`p-4 rounded-xl border-2 text-center transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 relative ${
                          isActive
                            ? `${activeBorder} bg-gradient-to-br ${activeBg} shadow-lg ${activeShadow}`
                            : 'border-gray-200/50 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                          isActive
                            ? `bg-gradient-to-br ${iconActiveBg} text-white shadow-md ${iconActiveShadow}`
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-sm font-semibold ${isActive ? activeText : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Cash Input */}
                {activeMethods.includes('CASH') && (
                  <div className="mt-4 animate-fade-in">
                    <label className="text-sm text-gray-600 mb-2 block">
                      จำนวนเงินสด
                    </label>
                    <input
                      type="number"
                      value={cashSplit?.amount || ''}
                      onChange={(e) => updateSplitAmount('CASH', e.target.value)}
                      placeholder="0.00"
                      className="w-full text-2xl font-bold text-center border-2 border-gray-200/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50/30"
                    />

                    {/* Quick Amount Buttons — accumulating (+=) */}
                    <div className="flex gap-2 mt-3">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => addToCashAmount(amount)}
                          className="flex-1 bg-gradient-to-br from-gray-100 to-gray-150 hover:from-gray-200 hover:to-gray-250 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                        >
                          +฿{amount}
                        </button>
                      ))}
                      <button
                        onClick={() => updateSplitAmount('CASH', String(Math.ceil(cashNeeded / 100) * 100 || Math.ceil(totalAmount / 100) * 100))}
                        className="flex-1 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md border border-green-200/50 active:scale-95"
                      >
                        พอดี
                      </button>
                    </div>

                    {/* Change Display */}
                    {cashAmount >= cashNeeded && cashNeeded > 0 && (
                      <div className="mt-3 bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-4 text-center border border-green-200/50 animate-scale-in">
                        <p className="text-sm text-green-600">เงินทอน</p>
                        <p className="text-3xl font-bold text-green-700">
                          ฿{changeAmount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Cash Amount Inputs */}
                {splitPayments.filter((sp) => sp.method !== 'CASH').map((sp) => (
                  <div key={sp.method} className="mt-4 animate-fade-in">
                    <label className="text-sm text-gray-600 mb-2 block">
                      จำนวนเงิน ({sp.method === 'TRANSFER' ? 'เงินโอน' : 'บัตรเครดิต'})
                    </label>
                    <input
                      type="number"
                      value={sp.amount}
                      onChange={(e) => updateSplitAmount(sp.method, e.target.value)}
                      placeholder="0.00"
                      className="w-full text-2xl font-bold text-center border-2 border-gray-200/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>
                ))}

                {/* Split Payment Summary */}
                {splitPayments.length > 1 && (
                  <div className="mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200/50 animate-fade-in">
                    <p className="text-sm font-semibold text-gray-700 mb-2">สรุปการแบ่งจ่าย</p>
                    {splitPayments.map((sp) => (
                      <div key={sp.method} className="flex justify-between text-sm text-gray-600">
                        <span>{sp.method === 'CASH' ? 'เงินสด' : sp.method === 'TRANSFER' ? 'เงินโอน' : 'บัตรเครดิต'}</span>
                        <span>฿{(parseFloat(sp.amount) || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-indigo-200/50 pt-1.5 mt-1.5 text-gray-800">
                      <span>รวมรับ</span>
                      <span className={totalPaid >= totalAmount ? 'text-green-600' : 'text-red-500'}>฿{totalPaid.toFixed(2)}</span>
                    </div>
                    {totalPaid < totalAmount && (
                      <p className="text-xs text-red-500 mt-1">ขาดอีก ฿{(totalAmount - totalPaid).toFixed(2)}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={
                  splitPayments.length === 0 ||
                  processing ||
                  totalPaid < totalAmount
                }
                className={`w-full py-4 rounded-2xl text-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
                  splitPayments.length === 0 ||
                  processing ||
                  totalPaid < totalAmount
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 active:scale-[0.98] shadow-2xl shadow-green-500/40'
                }`}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    กำลังดำเนินการ...
                  </>
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

      {/* Split Order Modal */}
      {showSplitModal && selectedOrder && (
        <SplitOrderModal
          order={selectedOrder}
          onClose={() => setShowSplitModal(false)}
          onSplit={handleSplitOrder}
        />
      )}
    </div>
  );
}
