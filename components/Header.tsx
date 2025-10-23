'use client';

import React from 'react';
import { ShoppingCart, UtensilsCrossed } from 'lucide-react';

interface HeaderProps {
  totalItems: number;
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalItems, onCartClick }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ร้านอาหารไทย</h1>
              <p className="text-sm text-gray-500">สั่งอาหารออนไลน์</p>
            </div>
          </div>
          <button
            onClick={onCartClick}
            className="relative bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">ตะกร้า</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
