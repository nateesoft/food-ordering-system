'use client';

import React from 'react';
import { Category } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { t } = useLanguage();

  // Map Thai categories to translated versions
  const translateCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      'ทั้งหมด': t.categories.all,
      'อาหารจานเดียว': t.foodCategories.singleDish,
      'อาหารว่าง': t.foodCategories.appetizers,
      'ของหวาน': t.foodCategories.desserts,
      'เครื่องดื่ม': t.foodCategories.beverages,
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-[88px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => {
            const translatedCategory = translateCategory(category);
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(translatedCategory)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  selectedCategory === translatedCategory || selectedCategory === category
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {translatedCategory}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
