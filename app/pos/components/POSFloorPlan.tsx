'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Armchair } from 'lucide-react';
import { api } from '@/lib/api';

interface TableData {
  id: number;
  number: string;
  capacity: number;
  status: string;
  zone: string | null;
  currentGuests: number | null;
}

interface POSFloorPlanProps {
  onSelectTable: (table: TableData) => void;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  AVAILABLE: { color: 'text-green-700', bg: 'bg-green-50 hover:bg-green-100', border: 'border-green-300', label: 'ว่าง' },
  OCCUPIED: { color: 'text-red-700', bg: 'bg-red-50 hover:bg-red-100', border: 'border-red-300', label: 'มีลูกค้า' },
  RESERVED: { color: 'text-yellow-700', bg: 'bg-yellow-50 hover:bg-yellow-100', border: 'border-yellow-300', label: 'จอง' },
  BILLING: { color: 'text-purple-700', bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-300', label: 'รอชำระ' },
  CLEANING: { color: 'text-gray-600', bg: 'bg-gray-100 hover:bg-gray-200', border: 'border-gray-300', label: 'ทำความสะอาด' },
};

export default function POSFloorPlan({ onSelectTable }: POSFloorPlanProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ available: number; occupied: number; reserved: number; total: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tablesData, statsData, zonesData] = await Promise.all([
        api.getTables(activeZone ? { zone: activeZone } : undefined),
        api.getTableStats(),
        api.getTableZones(),
      ]);
      setTables(tablesData);
      setStats(statsData);
      setZones(zonesData);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  }, [activeZone]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTableClick = (table: TableData) => {
    onSelectTable(table);
  };

  const handleSetAvailable = async (tableId: number) => {
    try {
      await api.updateTableStatus(tableId, 'AVAILABLE');
      loadData();
    } catch (err) {
      console.error('Failed to update table status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center gap-4 px-6 py-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">ว่าง <span className="font-bold">{stats.available}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">มีลูกค้า <span className="font-bold">{stats.occupied}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm">จอง <span className="font-bold">{stats.reserved}</span></span>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            รวม {stats.total} โต๊ะ
          </div>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Zone Tabs */}
      {zones.length > 0 && (
        <div className="flex gap-2 px-6 py-3 bg-white border-b overflow-x-auto">
          <button
            onClick={() => setActiveZone(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              !activeZone ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด
          </button>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeZone === zone ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Armchair className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">ไม่มีโต๊ะ</p>
            <p className="text-sm">กรุณาเพิ่มโต๊ะในระบบจัดการ</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tables.map((table) => {
              const config = statusConfig[table.status] || statusConfig.AVAILABLE;
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    if (table.status === 'CLEANING') {
                      handleSetAvailable(table.id);
                    } else {
                      handleTableClick(table);
                    }
                  }}
                  className={`relative p-4 rounded-2xl border-2 ${config.border} ${config.bg} transition-all active:scale-95 min-h-[120px] flex flex-col items-center justify-center`}
                >
                  <span className="text-2xl font-bold text-gray-800">{table.number}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {table.currentGuests ?? 0}/{table.capacity}
                    </span>
                  </div>
                  <span className={`text-xs font-medium mt-2 px-2 py-0.5 rounded-full ${config.color} bg-white/50`}>
                    {config.label}
                  </span>
                  {table.zone && (
                    <span className="absolute top-2 right-2 text-[10px] text-gray-400">{table.zone}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
