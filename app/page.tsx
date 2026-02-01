'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Users, MapPin, UserCheck, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table } from '@/types';
import { api } from '@/lib/api';

interface StaffAssignment {
  staffId: number;
  staffName: string;
  staffRole: string;
  checkedInAt: string;
  lastSeenAt: string;
}

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [staffAssignments, setStaffAssignments] = useState<Record<string, StaffAssignment[]>>({});

  // Fetch staff assignments
  const fetchStaffAssignments = useCallback(async () => {
    try {
      const data = await api.getAllStaffAssignments();
      setStaffAssignments(data);
    } catch (err) {
      console.log('Failed to fetch staff assignments');
    }
  }, []);

  // Initial fetch and polling every 15 seconds
  useEffect(() => {
    fetchStaffAssignments();
    const interval = setInterval(fetchStaffAssignments, 15000);
    return () => clearInterval(interval);
  }, [fetchStaffAssignments]);

  const [tables] = useState<Table[]>([
    // ด้านหน้าร้าน
    { id: 1, number: 'A1', capacity: 2, status: 'available', position: { x: 10, y: 10 }, size: 'small' },
    { id: 2, number: 'A2', capacity: 2, status: 'occupied', position: { x: 30, y: 10 }, size: 'small' },
    { id: 3, number: 'A3', capacity: 4, status: 'available', position: { x: 50, y: 10 }, size: 'medium' },
    { id: 4, number: 'A4', capacity: 4, status: 'reserved', position: { x: 70, y: 10 }, size: 'medium' },

    // กลางร้าน
    { id: 5, number: 'B1', capacity: 4, status: 'available', position: { x: 10, y: 40 }, size: 'medium' },
    { id: 6, number: 'B2', capacity: 4, status: 'available', position: { x: 35, y: 40 }, size: 'medium' },
    { id: 7, number: 'B3', capacity: 6, status: 'available', position: { x: 60, y: 40 }, size: 'large' },

    // ด้านหลัง
    { id: 8, number: 'C1', capacity: 2, status: 'available', position: { x: 10, y: 70 }, size: 'small' },
    { id: 9, number: 'C2', capacity: 2, status: 'available', position: { x: 30, y: 70 }, size: 'small' },
    { id: 10, number: 'C3', capacity: 4, status: 'available', position: { x: 50, y: 70 }, size: 'medium' },
    { id: 11, number: 'C4', capacity: 8, status: 'available', position: { x: 70, y: 70 }, size: 'large' },
  ]);

  const handleSelectTable = (tableNumber: string) => {
    router.push(`/table/${tableNumber}`);
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600';
      case 'occupied':
        return 'from-red-400 to-rose-500 cursor-not-allowed opacity-60';
      case 'reserved':
        return 'from-yellow-400 to-amber-500 cursor-not-allowed opacity-60';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getTableSize = (size: string) => {
    switch (size) {
      case 'small':
        return 'w-20 h-20 sm:w-24 sm:h-24';
      case 'medium':
        return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'large':
        return 'w-28 h-28 sm:w-32 sm:h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-4 bg-gradient-to-b from-orange-500 to-orange-600">
        <div className="inline-block mb-4 animate-bounce">
          <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 text-white mx-auto" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          {t.header.restaurantName}
        </h1>
        <p className="text-lg sm:text-xl text-orange-100 mb-4">
          ยินดีต้อนรับ กรุณาเลือกโต๊ะของคุณ
        </p>
        <div className="flex items-center justify-center gap-6 text-white text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
            <span>ว่าง ({availableTables.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-white"></div>
            <span>ไม่ว่าง</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
            <span>จอง</span>
          </div>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-gray-100 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-lg">
          {/* Zone Labels */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-orange-600 mb-4">
              <MapPin className="w-5 h-5" />
              <span className="font-bold text-lg">แผนผังร้าน</span>
            </div>
          </div>

          {/* Zone A - Front */}
          <div className="mb-12 pb-4">
            <h3 className="text-gray-800 font-bold mb-4 text-lg border-b border-gray-300 pb-2">โซน A - ด้านหน้าร้าน</h3>
            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              {tables.filter(t => t.number.startsWith('A')).map(table => {
                const staff = staffAssignments[table.number];
                return (
                  <button
                    key={table.id}
                    onClick={() => table.status === 'available' && handleSelectTable(table.number)}
                    disabled={table.status !== 'available'}
                    className={`${getTableSize(table.size)} bg-gradient-to-br ${getTableColor(table.status)} rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transform transition-all duration-300 ${table.status === 'available' ? 'hover:scale-110 hover:shadow-2xl active:scale-95' : ''} relative`}
                  >
                    <span className="text-xl sm:text-2xl font-bold">{table.number}</span>
                    <div className="flex items-center gap-1 text-xs sm:text-sm mt-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{table.capacity}</span>
                    </div>
                    {staff && staff.length > 0 && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5">
                        {staff.slice(0, 2).map((s, idx) => (
                          <div
                            key={s.staffId}
                            className={`${idx === 0 ? 'bg-blue-500' : 'bg-blue-400'} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-lg`}
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{s.staffName}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{formatTime(s.checkedInAt)}</span>
                          </div>
                        ))}
                        {staff.length > 2 && (
                          <div className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                            +{staff.length - 2} คน
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone B - Middle */}
          <div className="mb-12 pb-4">
            <h3 className="text-gray-800 font-bold mb-4 text-lg border-b border-gray-300 pb-2">โซน B - กลางร้าน</h3>
            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              {tables.filter(t => t.number.startsWith('B')).map(table => {
                const staff = staffAssignments[table.number];
                return (
                  <button
                    key={table.id}
                    onClick={() => table.status === 'available' && handleSelectTable(table.number)}
                    disabled={table.status !== 'available'}
                    className={`${getTableSize(table.size)} bg-gradient-to-br ${getTableColor(table.status)} rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transform transition-all duration-300 ${table.status === 'available' ? 'hover:scale-110 hover:shadow-2xl active:scale-95' : ''} relative`}
                  >
                    <span className="text-xl sm:text-2xl font-bold">{table.number}</span>
                    <div className="flex items-center gap-1 text-xs sm:text-sm mt-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{table.capacity}</span>
                    </div>
                    {staff && staff.length > 0 && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5">
                        {staff.slice(0, 2).map((s, idx) => (
                          <div
                            key={s.staffId}
                            className={`${idx === 0 ? 'bg-blue-500' : 'bg-blue-400'} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-lg`}
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{s.staffName}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{formatTime(s.checkedInAt)}</span>
                          </div>
                        ))}
                        {staff.length > 2 && (
                          <div className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                            +{staff.length - 2} คน
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone C - Back */}
          <div className="pb-4">
            <h3 className="text-gray-800 font-bold mb-4 text-lg border-b border-gray-300 pb-2">โซน C - ด้านหลังร้าน</h3>
            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              {tables.filter(t => t.number.startsWith('C')).map(table => {
                const staff = staffAssignments[table.number];
                return (
                  <button
                    key={table.id}
                    onClick={() => table.status === 'available' && handleSelectTable(table.number)}
                    disabled={table.status !== 'available'}
                    className={`${getTableSize(table.size)} bg-gradient-to-br ${getTableColor(table.status)} rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transform transition-all duration-300 ${table.status === 'available' ? 'hover:scale-110 hover:shadow-2xl active:scale-95' : ''} relative`}
                  >
                    <span className="text-xl sm:text-2xl font-bold">{table.number}</span>
                    <div className="flex items-center gap-1 text-xs sm:text-sm mt-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{table.capacity}</span>
                    </div>
                    {staff && staff.length > 0 && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5">
                        {staff.slice(0, 2).map((s, idx) => (
                          <div
                            key={s.staffId}
                            className={`${idx === 0 ? 'bg-blue-500' : 'bg-blue-400'} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-lg`}
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{s.staffName}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{formatTime(s.checkedInAt)}</span>
                          </div>
                        ))}
                        {staff.length > 2 && (
                          <div className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                            +{staff.length - 2} คน
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kiosk Option */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">หรือสั่งอาหารแบบ Self-Service</p>
          <button
            onClick={() => router.push('/kiosk')}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-orange-600 hover:scale-105 transform transition-all duration-300 hover:shadow-2xl"
          >
            🥡 สั่งผ่าน Kiosk (ไม่ต้องเลือกโต๊ะ)
          </button>
        </div>
      </div>
    </div>
  );
}
