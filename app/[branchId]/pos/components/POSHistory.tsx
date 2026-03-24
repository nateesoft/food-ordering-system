'use client';

import React, { useState, useEffect } from 'react';
import { History, X, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { Payment, PaymentSummary } from '@/types';

interface POSHistoryProps {
  onClose: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export default function POSHistory({ onClose, onViewReceipt }: POSHistoryProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-gray-200/50 mx-4 md:mx-0">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">ประวัติการชำระเงินวันนี้</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {summary && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 border border-green-200/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-600">รายได้รวม</p>
                  <p className="text-xl font-bold text-green-700">฿{summary.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 border border-blue-200/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600">จำนวนรายการ</p>
                  <p className="text-xl font-bold text-blue-700">{summary.totalTransactions}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-100/50 border border-orange-200/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-orange-600">ส่วนลดรวม</p>
                  <p className="text-xl font-bold text-orange-700">฿{summary.totalDiscount.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-100/50 border border-purple-200/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-purple-600">แต้มที่ให้</p>
                  <p className="text-xl font-bold text-purple-700">{summary.totalPointsEarned}</p>
                </div>
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(Object.entries(summary.byMethod) as [string, { count: number; amount: number }][]).map(([method, data]) => (
                  <div key={method} className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{paymentMethodLabel[method]}</p>
                    <p className="font-bold">{data.count} รายการ / ฿{data.amount.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}

            {payments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">ยังไม่มีรายการชำระเงินวันนี้</div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <button
                    key={payment.id}
                    onClick={() => onViewReceipt(payment)}
                    className="w-full text-left bg-white hover:bg-blue-50/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">{payment.receiptNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                          payment.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.paymentStatus === 'PAID' ? 'ชำระแล้ว' : payment.paymentStatus === 'REFUNDED' ? 'คืนเงิน' : 'รอชำระ'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {paymentMethodLabel[payment.paymentMethod]} | {payment.paidAt ? new Date(payment.paidAt).toLocaleTimeString('th-TH') : '-'}
                        {payment.memberName && ` | ${payment.memberName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">฿{payment.totalAmount.toFixed(0)}</p>
                      <p className="text-xs text-gray-400"><Receipt className="w-3 h-3 inline" /> ดูใบเสร็จ</p>
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
