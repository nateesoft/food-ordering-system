'use client';

import React from 'react';
import {
  DollarSign,
  History,
  LogOut,
  Square,
  LayoutGrid,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { ShiftResponse } from '@/lib/api';
import { PaymentSummary } from '@/types';
import BranchSelector from '@/components/BranchSelector';

export type POSView = 'floor-plan' | 'menu-order' | 'payment' | 'order-status';

interface POSHeaderProps {
  cashierName: string;
  activeShift: ShiftResponse | null;
  summary: PaymentSummary | null;
  currentView: POSView;
  selectedTableNumber?: string | null;
  onViewChange: (view: POSView) => void;
  onShowHistory: () => void;
  onCloseShift: () => void;
  onLogout: () => void;
}

export default function POSHeader({
  cashierName,
  activeShift,
  summary,
  currentView,
  selectedTableNumber,
  onViewChange,
  onShowHistory,
  onCloseShift,
  onLogout,
}: POSHeaderProps) {
  const navItems: { view: POSView; label: string; icon: React.ReactNode }[] = [
    { view: 'floor-plan', label: 'แผนผังโต๊ะ', icon: <LayoutGrid className="w-4 h-4" /> },
    { view: 'menu-order', label: 'สั่งอาหาร', icon: <ShoppingBag className="w-4 h-4" /> },
    { view: 'payment', label: 'ชำระเงิน', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
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
            {selectedTableNumber && <span className="ml-2 text-blue-600">| โต๊ะ {selectedTableNumber}</span>}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 ml-6 bg-gray-100 p-1 rounded-xl">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === item.view
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <BranchSelector />
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
          onClick={onShowHistory}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
        >
          <History className="w-4 h-4" />
          ประวัติ
        </button>

        {activeShift && (
          <button
            onClick={onCloseShift}
            className="bg-violet-50 text-violet-600 px-4 py-2 rounded-xl hover:bg-violet-100 flex items-center gap-2 text-sm font-medium"
          >
            <Square className="w-4 h-4" />
            ปิดกะ
          </button>
        )}

        <button
          onClick={onLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          ออก
        </button>
      </div>
    </header>
  );
}
