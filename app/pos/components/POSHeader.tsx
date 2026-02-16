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
    <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 px-4 lg:px-6 py-3 print:hidden sticky top-0 z-40">
      {/* Row 1: Logo + Nav + Actions */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo + Info */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base lg:text-xl font-bold text-gray-800">POS System</h1>
            <p className="text-xs lg:text-sm text-gray-500">
              {cashierName}
              {activeShift && <span className="ml-1.5 text-violet-600">| กะ {activeShift.shiftNumber}</span>}
              {selectedTableNumber && <span className="ml-1.5 text-blue-600">| โต๊ะ {selectedTableNumber}</span>}
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex gap-1 bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                currentView === item.view
                  ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <div className="hidden xl:block">
            <BranchSelector />
          </div>

          {summary && (
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100/80 px-3 py-1.5 rounded-xl border border-green-200/50 shadow-sm">
                <span className="text-green-600 text-xs">รายได้ </span>
                <span className="font-bold text-green-700">
                  ฿{summary.totalRevenue.toFixed(0)}
                </span>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100/80 px-3 py-1.5 rounded-xl border border-blue-200/50 shadow-sm">
                <span className="text-blue-600 text-xs">รายการ </span>
                <span className="font-bold text-blue-700">
                  {summary.totalTransactions}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onShowHistory}
            className="bg-gray-100 text-gray-600 p-2 lg:px-3 lg:py-2 rounded-xl hover:bg-gray-200 hover:shadow-md transition-all duration-300 flex items-center gap-1.5 text-sm font-medium"
          >
            <History className="w-4 h-4" />
            <span className="hidden lg:inline">ประวัติ</span>
          </button>

          {activeShift && (
            <button
              onClick={onCloseShift}
              className="bg-violet-50 text-violet-600 p-2 lg:px-3 lg:py-2 rounded-xl hover:bg-violet-100 hover:shadow-md shadow-sm transition-all duration-300 flex items-center gap-1.5 text-sm font-medium"
            >
              <Square className="w-4 h-4" />
              <span className="hidden lg:inline">ปิดกะ</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 lg:px-3 lg:py-2 rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 flex items-center gap-1.5 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">ออก</span>
          </button>
        </div>
      </div>
    </header>
  );
}
