'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Armchair, LayoutGrid, Map } from 'lucide-react';
import { api } from '@/lib/api';

interface TableData {
  id: number;
  number: string;
  capacity: number;
  status: string;
  zone: string | null;
  currentGuests: number | null;
  positionX: number;
  positionY: number;
  size: string;
  shape: string;
}

interface POSFloorPlanProps {
  onSelectTable: (table: TableData) => void;
}

type ViewMode = 'grid' | 'floorplan';

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; shadow: string }> = {
  AVAILABLE: { color: 'text-green-700', bg: 'bg-gradient-to-br from-green-50 to-emerald-100/80 hover:from-green-100 hover:to-emerald-200/80', border: 'border-green-300', label: 'ว่าง', shadow: 'shadow-green-500/10 hover:shadow-green-500/20' },
  OCCUPIED: { color: 'text-red-700', bg: 'bg-gradient-to-br from-red-50 to-red-100/80 hover:from-red-100 hover:to-red-200/80', border: 'border-red-300', label: 'มีลูกค้า', shadow: 'shadow-red-500/10 hover:shadow-red-500/20' },
  RESERVED: { color: 'text-yellow-700', bg: 'bg-gradient-to-br from-yellow-50 to-amber-100/80 hover:from-yellow-100 hover:to-amber-200/80', border: 'border-yellow-300', label: 'จอง', shadow: 'shadow-yellow-500/10 hover:shadow-yellow-500/20' },
  BILLING: { color: 'text-purple-700', bg: 'bg-gradient-to-br from-purple-50 to-purple-100/80 hover:from-purple-100 hover:to-purple-200/80', border: 'border-purple-300', label: 'รอชำระ', shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20' },
  CLEANING: { color: 'text-gray-600', bg: 'bg-gradient-to-br from-gray-100 to-gray-200/80 hover:from-gray-200 hover:to-gray-300/80', border: 'border-gray-300', label: 'ทำความสะอาด', shadow: 'hover:shadow-gray-500/20' },
};

const getShapeClasses = (shape: string): string => {
  switch (shape) {
    case 'circle': return 'rounded-full';
    case 'rectangle': return 'rounded-xl';
    case 'counter': return 'rounded-lg';
    case 'square':
    default: return 'rounded-2xl';
  }
};

const getSizeDimensions = (size: string, shape: string): { w: number; h: number } => {
  const base: Record<string, number> = { small: 64, medium: 80, large: 100 };
  const px = base[size] || 80;
  if (shape === 'rectangle') return { w: Math.round(px * 1.8), h: px };
  if (shape === 'counter') return { w: Math.round(px * 2.5), h: Math.round(px * 0.6) };
  return { w: px, h: px };
};

// Normalize positions: if values look like pixel coords (>100), scale them to 0-100% range
const normalizePositions = (tables: TableData[]): TableData[] => {
  if (tables.length === 0) return tables;
  const maxX = Math.max(...tables.map(t => t.positionX));
  const maxY = Math.max(...tables.map(t => t.positionY));
  if (maxX <= 100 && maxY <= 100) return tables;
  const minX = Math.min(...tables.map(t => t.positionX));
  const minY = Math.min(...tables.map(t => t.positionY));
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  return tables.map(t => ({
    ...t,
    positionX: Math.round((10 + ((t.positionX - minX) / rangeX) * 80) * 100) / 100,
    positionY: Math.round((10 + ((t.positionY - minY) / rangeY) * 80) * 100) / 100,
  }));
};

export default function POSFloorPlan({ onSelectTable }: POSFloorPlanProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ available: number; occupied: number; reserved: number; total: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pos-floor-view') as ViewMode) || 'grid';
    }
    return 'grid';
  });

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('pos-floor-view', mode);
  };

  const loadData = useCallback(async () => {
    try {
      const [tablesData, statsData, zonesData] = await Promise.all([
        api.getTables(activeZone ? { zone: activeZone } : undefined),
        api.getTableStats(),
        api.getTableZones(),
      ]);
      setTables(normalizePositions(tablesData));
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100/50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const renderTableContent = (table: TableData, config: typeof statusConfig[string]) => (
    <>
      {table.status === 'OCCUPIED' && (
        <>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        </>
      )}
      <span className="text-lg font-bold text-gray-800 leading-tight">{table.number}</span>
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3 text-gray-500" />
        <span className="text-[11px] text-gray-500">
          {table.currentGuests ?? 0}/{table.capacity}
        </span>
      </div>
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.color} bg-white/70 backdrop-blur-sm shadow-sm`}>
        {config.label}
      </span>
    </>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Stats Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-3 md:gap-4 px-4 md:px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-md shadow-green-500/30" />
            <span className="text-sm">ว่าง <span className="font-bold">{stats.available}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/30" />
            <span className="text-sm">มีลูกค้า <span className="font-bold">{stats.occupied}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-md shadow-yellow-500/30" />
            <span className="text-sm">จอง <span className="font-bold">{stats.reserved}</span></span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">รวม {stats.total} โต๊ะ</span>
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => toggleView('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleView('floorplan')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'floorplan'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Floor Plan View"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
            <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:rotate-180">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Zone Tabs */}
      {zones.length > 0 && (
        <div className="flex gap-2 px-4 md:px-6 py-3 bg-white/60 backdrop-blur-sm border-b border-gray-200/50 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveZone(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              !activeZone
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
            }`}
          >
            ทั้งหมด
          </button>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeZone === zone
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* Tables Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
            <Armchair className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">ไม่มีโต๊ะ</p>
            <p className="text-sm">กรุณาเพิ่มโต๊ะในระบบจัดการ</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ===== GRID VIEW ===== */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
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
                  className={`relative p-4 rounded-2xl border-2 ${config.border} ${config.bg} transition-all duration-300 active:scale-95 hover:scale-[1.03] hover:-translate-y-1 min-h-[120px] flex flex-col items-center justify-center shadow-md ${config.shadow} hover:shadow-xl`}
                >
                  {table.status === 'OCCUPIED' && (
                    <>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                    </>
                  )}
                  <span className="text-2xl font-bold text-gray-800">{table.number}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {table.currentGuests ?? 0}/{table.capacity}
                    </span>
                  </div>
                  <span className={`text-xs font-medium mt-2 px-2 py-0.5 rounded-full ${config.color} bg-white/70 backdrop-blur-sm shadow-sm`}>
                    {config.label}
                  </span>
                  {table.zone && (
                    <span className="absolute top-2 right-2 text-[10px] text-gray-400">{table.zone}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* ===== FLOOR PLAN VIEW ===== */
          <div className="relative w-full bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden" style={{ paddingBottom: '65%' }}>
            {/* Grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
            {tables.map((table) => {
              const config = statusConfig[table.status] || statusConfig.AVAILABLE;
              const shapeClass = getShapeClasses(table.shape || 'square');
              const dims = getSizeDimensions(table.size || 'medium', table.shape || 'square');

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
                  className={`absolute border-2 ${config.border} ${config.bg} ${shapeClass} transition-all duration-200 active:scale-95 hover:scale-110 hover:z-10 flex flex-col items-center justify-center shadow-md ${config.shadow} hover:shadow-xl`}
                  style={{
                    left: `${table.positionX}%`,
                    top: `${table.positionY}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${dims.w}px`,
                    height: `${dims.h}px`,
                  }}
                >
                  {renderTableContent(table, config)}
                </button>
              );
            })}
            {/* Zone labels */}
            {!activeZone && zones.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {zones.map((zone) => (
                  <span key={zone} className="text-[10px] px-2 py-0.5 bg-white/80 rounded-full text-gray-500 border border-gray-200 backdrop-blur-sm">
                    {zone}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
