'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '@/types';
import StarRating from './StarRating';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          ฿{item.price}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-1">{item.category}</p>
        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
        {item.rating && (
          <div className="mb-4">
            <StarRating rating={item.rating} reviewCount={item.reviewCount} />
          </div>
        )}
        <button
          onClick={() => onAddToCart(item)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มลงตะกร้า</span>
        </button>
      </div>
    </div>
  );
};
