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
} from 'lucide-react';
import { api, OrderResponse, ShiftResponse, PromotionResponse, CouponValidationResponse } from '@/lib/api';
import { Payment, PaymentSummary, Member } from '@/types';

// ===== Props =====

interface POSPaymentProps {
  tableNumber?: string;
  cashierName: string;
  activeShift: ShiftResponse | null;
  onPaymentComplete: (payment: Payment, mergedOrders?: any[] | null) => void;
  onBack: () => void;
}

// ===== Tier Colors =====

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
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

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>('');
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
  const changeAmount =
    paymentMethod === 'CASH' ? Math.max(0, (parseFloat(paidAmount) || 0) - totalAmount) : 0;
  const pointsEarned = member ? Math.floor(totalAmount / 25) : 0;

  // ===== Handle Payment =====

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
        onPaymentComplete(result.payment, result.mergedOrders);
      } else {
        if (!selectedOrder) return;
        const result = await api.createPayment({
          orderId: selectedOrder.id,
          paymentMethod,
          paidAmount: paymentMethod === 'CASH' ? paid : totalAmount,
          memberId: member?.memberId,
          discountPoints: pointsToUse > 0 ? pointsToUse : undefined,
          cashierName: cashierName || undefined,
          shiftId: activeShift?.id,
          serviceCharge: Math.round(serviceCharge * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          promotionId: selectedPromotion?.id,
          couponCode: couponResult?.valid ? couponCode.toUpperCase() : undefined,
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">ชำระเงิน</h1>
            <p className="text-sm text-gray-500">
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Orders List (1/3) */}
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
                onClick={() => {
                  setPosMode('normal');
                  setSelectedOrderIds(new Set());
                }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  posMode === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                ปกติ
              </button>
              <button
                onClick={() => {
                  setPosMode('merge');
                  setSelectedOrder(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  posMode === 'merge'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
                        <span className="text-gray-400 font-normal ml-1">
                          ({orders.length})
                        </span>
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ฿{orders.reduce((s, o) => s + o.totalAmount, 0).toFixed(0)}
                      </span>
                    </div>
                    {/* Orders in table */}
                    <div className="divide-y">
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
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-600'
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
                              <span className="text-lg font-bold">
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
            <div className="p-3 border-t bg-indigo-50">
              <div className="text-center text-sm text-indigo-700 font-medium">
                เลือก {selectedOrderIds.size} ออเดอร์ | รวม ฿
                {mergedSubtotal.toFixed(0)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment Panel (2/3) */}
        <div className="flex-1 overflow-y-auto">
          {!hasActiveSelection ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                {posMode === 'merge' ? (
                  <>
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-xl">เลือกออเดอร์ 2 รายการขึ้นไป</p>
                    <p className="text-sm mt-1">
                      จากโต๊ะเดียวกัน เพื่อรวมชำระ
                    </p>
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
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        {order.orderId}
                      </p>
                      <div className="divide-y">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div>
                              <span className="font-medium">
                                {item.menuItem?.name || 'Unknown'}
                              </span>
                              <span className="text-gray-400 ml-2">
                                x{item.quantity}
                              </span>
                            </div>
                            <span className="font-semibold">
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
                  <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        {selectedOrder.orderId}
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedOrder.items &&
                          selectedOrder.items.length >= 2 && (
                            <button
                              onClick={() => setShowSplitModal(true)}
                              className="flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
                            >
                              <Scissors className="w-4 h-4" />
                              แยกออเดอร์
                            </button>
                          )}
                        <span className="text-sm text-gray-500">
                          {selectedOrder.tableNumber
                            ? `โต๊ะ ${selectedOrder.tableNumber}`
                            : 'Kiosk'}
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
                                  : JSON.stringify(item.selectedAddOns),
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
                )
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
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleMemberSearch()
                    }
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
                            tierColors[member.tier] ||
                            'bg-gray-100 text-gray-600'
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
                              className="w-32 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
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
                    <div
                      className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                        couponResult.valid
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
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
                    <span className="text-orange-700 font-bold">
                      -฿{promotionDiscount.toFixed(2)}
                    </span>
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
                  <div className="flex justify-between text-2xl font-bold border-t pt-2">
                    <span>ยอดสุทธิ</span>
                    <span className="text-blue-600">
                      ฿{totalAmount.toFixed(2)}
                    </span>
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
                          setPaidAmount(
                            String(Math.ceil(totalAmount / 100) * 100),
                          )
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
