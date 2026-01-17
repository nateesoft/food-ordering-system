'use client';

import React, { useState } from 'react';
import { X, ChefHat, Soup, Salad, UtensilsCrossed, Coffee, Cake, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  tableNumber?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  tableNumber = 'B1',
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!isOpen) return null;

  const categoryData = [
    {
      category: 'อาหารจานเดียว',
      translatedName: t.foodCategories['อาหารจานเดียว'] || 'อาหารจานเดียว',
      icon: ChefHat,
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
      iconColor: 'text-orange-600',
      description: 'ผัดไทย ข้าวผัด ก๋วยเตี๋ยว',
    },
    {
      category: 'ต้ม/แกง',
      translatedName: t.foodCategories['ต้ม/แกง'] || 'ต้ม/แกง',
      icon: Soup,
      color: 'from-red-400 to-pink-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
      iconColor: 'text-red-600',
      description: 'ต้มยำ แกงเขียวหวาน ต้มข่าไก่',
    },
    {
      category: 'ยำ/สลัด',
      translatedName: t.foodCategories['ยำ/สลัด'] || 'ยำ/สลัด',
      icon: Salad,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      description: 'ยำวุ้นเส้น ส้มตำ ลาบ',
    },
    {
      category: 'อาหารจานหลัก',
      translatedName: t.foodCategories['อาหารจานหลัก'] || 'อาหารจานหลัก',
      icon: UtensilsCrossed,
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      description: 'ผัดกะเพรา ผัดพริกแกง ปลาราดพริก',
    },
    {
      category: 'ของหวาน',
      translatedName: t.foodCategories['ของหวาน'] || 'ของหวาน',
      icon: Cake,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      iconColor: 'text-purple-600',
      description: 'ข้าวเหนียวมะม่วง ทับทิมกรอบ',
    },
    {
      category: 'เครื่องดื่ม',
      translatedName: t.foodCategories['เครื่องดื่ม'] || 'เครื่องดื่ม',
      icon: Coffee,
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
      iconColor: 'text-amber-600',
      description: 'ชาเย็น กาแฟ น้ำผลไม้ปั่น',
    },
  ];

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onClose();
  };

  const handleViewAll = () => {
    onSelectCategory(t.categories.all);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all">

          {/* Header */}
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-t-3xl">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="inline-block mb-4">
                <ChefHat className="w-16 h-16 mx-auto" />
              </div>
              <h1 className="text-4xl font-bold mb-2">{t.header.restaurantName}</h1>
              <p className="text-xl text-orange-100 mb-2">{t.header.orderOnline}</p>
              <div className="inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold">
                  {t.floatingMenu.table} {tableNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Header with View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                เลือกหมวดหมู่เมนูที่ต้องการ
              </h2>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {categoryData.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.category}
                      onClick={() => handleCategoryClick(cat.category)}
                      className={`${cat.bgColor} p-6 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 text-left border-2 border-transparent hover:border-gray-200`}
                    >
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md mb-4`}>
                        <Icon className={`w-8 h-8 ${cat.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {cat.translatedName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {cat.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3 mb-6">
                {categoryData.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.category}
                      onClick={() => handleCategoryClick(cat.category)}
                      className={`w-full ${cat.bgColor} p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] border-2 border-transparent hover:border-gray-200 flex items-center gap-4`}
                    >
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md flex-shrink-0`}>
                        <Icon className={`w-7 h-7 ${cat.iconColor}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {cat.translatedName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cat.description}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* View All Button */}
            <button
              onClick={handleViewAll}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              🍽️ ดูเมนูทั้งหมด
            </button>

            {/* Footer Note */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>💡 คุณสามารถเปลี่ยนหมวดหมู่ได้ตลอดเวลาหลังเข้าสู่หน้าเมนู</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
