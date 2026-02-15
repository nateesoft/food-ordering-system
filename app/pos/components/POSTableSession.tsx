'use client';

import React, { useState } from 'react';
import { Users, ArrowLeft, Globe, UserCircle, ShoppingBag, Plus, Minus } from 'lucide-react';
import { api } from '@/lib/api';

interface TableData {
  id: number;
  number: string;
  capacity: number;
  status: string;
  zone: string | null;
  currentGuests: number | null;
}

interface POSTableSessionProps {
  table: TableData;
  cashierName: string;
  onSessionOpened: (session: any) => void;
  onBack: () => void;
}

export default function POSTableSession({ table, cashierName, onSessionOpened, onBack }: POSTableSessionProps) {
  const [customerCount, setCustomerCount] = useState(1);
  const [orderType, setOrderType] = useState('dine_in');
  const [gender, setGender] = useState<string | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const session = await api.openTableSession(table.id, {
        openedBy: cashierName,
        customerCount,
        customerGender: gender || undefined,
        customerNationality: nationality || undefined,
        orderType,
      });
      onSessionOpened(session);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเปิดโต๊ะได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">เปิดโต๊ะ {table.number}</h2>
            <p className="text-sm text-gray-500">
              {table.zone && `โซน: ${table.zone} | `}ที่นั่ง: {table.capacity}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
        )}

        {/* Customer Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            จำนวนลูกค้า
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
              className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95"
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-3xl font-bold text-gray-800 w-16 text-center">{customerCount}</span>
            <button
              onClick={() => setCustomerCount(Math.min(table.capacity * 2, customerCount + 1))}
              className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Order Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ShoppingBag className="w-4 h-4 inline mr-1" />
            ประเภท
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'dine_in', label: 'ทานที่ร้าน' },
              { value: 'takeaway', label: 'สั่งกลับบ้าน' },
              { value: 'delivery', label: 'จัดส่ง' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrderType(opt.value)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  orderType === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserCircle className="w-4 h-4 inline mr-1" />
            เพศ (ไม่บังคับ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: 'ชาย' },
              { value: 'female', label: 'หญิง' },
              { value: 'mixed', label: 'คละ' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGender(gender === opt.value ? null : opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  gender === opt.value
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nationality */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            สัญชาติ (ไม่บังคับ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'thai', label: 'ไทย' },
              { value: 'foreign', label: 'ต่างชาติ' },
              { value: 'mixed', label: 'คละ' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNationality(nationality === opt.value ? null : opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  nationality === opt.value
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'กำลังเปิดโต๊ะ...' : `เปิดโต๊ะ ${table.number}`}
        </button>
      </div>
    </div>
  );
}
