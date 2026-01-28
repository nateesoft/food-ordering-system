'use client';

import React from 'react';
import { ShoppingCart, UtensilsCrossed, ClipboardList, Languages, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  totalItems: number;
  onCartClick: () => void;
  onHistoryClick: () => void;
  onQrClick?: () => void;
  orderCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalItems,
  onCartClick,
  onHistoryClick,
  onQrClick,
  orderCount = 0
}) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Desktop Layout - Single Row */}
        <div className="hidden sm:flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.header.restaurantName}</h1>
              <p className="text-sm text-gray-500">{t.header.orderOnline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full hover:bg-gray-200 transition-all shadow hover:shadow-md flex items-center space-x-1"
              title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">{language === 'th' ? 'EN' : 'TH'}</span>
            </button>

            {/* Order history button */}
            <button
              onClick={onHistoryClick}
              className="relative bg-gray-100 text-gray-700 px-4 py-3 rounded-full hover:bg-gray-200 transition-all shadow hover:shadow-md flex items-center space-x-2"
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-semibold">{t.header.history}</span>
              {orderCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {orderCount}
                </span>
              )}
            </button>

            {/* QR Share button */}
            {onQrClick && (
              <button
                onClick={onQrClick}
                className="bg-indigo-100 text-indigo-600 p-3 rounded-full hover:bg-indigo-200 transition-all shadow hover:shadow-md"
                title="แชร์โต๊ะ"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}

            {/* Cart button */}
            <button
              onClick={onCartClick}
              className="relative bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{t.header.cart}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Layout - Two Rows */}
        <div className="sm:hidden space-y-3">
          {/* Row 1: Logo and Restaurant Name */}
          <div className="flex items-center space-x-3">
            <UtensilsCrossed className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-800 truncate">{t.header.restaurantName}</h1>
              <p className="text-xs text-gray-500 truncate">{t.header.orderOnline}</p>
            </div>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full hover:bg-gray-200 transition-all shadow hover:shadow-md flex items-center space-x-1"
              title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">{language === 'th' ? 'EN' : 'TH'}</span>
            </button>

            {/* Order history button */}
            <button
              onClick={onHistoryClick}
              className="relative bg-gray-100 text-gray-700 px-3 py-2 rounded-full hover:bg-gray-200 transition-all shadow hover:shadow-md flex items-center"
            >
              <ClipboardList className="w-5 h-5" />
              {orderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {orderCount}
                </span>
              )}
            </button>

            {/* QR Share button */}
            {onQrClick && (
              <button
                onClick={onQrClick}
                className="bg-indigo-100 text-indigo-600 p-2 rounded-full hover:bg-indigo-200 transition-all shadow hover:shadow-md"
                title="แชร์โต๊ะ"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}

            {/* Cart button */}
            <button
              onClick={onCartClick}
              className="relative bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center space-x-1"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold text-sm">{t.header.cart}</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
