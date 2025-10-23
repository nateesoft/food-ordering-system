'use client';

import React, { useState } from 'react';
import { X, Check, Users, ArrowLeftRight } from 'lucide-react';
import { Table } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloorPlanProps {
  isOpen: boolean;
  currentTableId: number;
  tables: Table[];
  onClose: () => void;
  onChangeTable: (newTableId: number) => void;
  onMergeTables: (tableIds: number[]) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
  isOpen,
  currentTableId,
  tables,
  onClose,
  onChangeTable,
  onMergeTables,
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'view' | 'change' | 'merge'>('view');
  const [selectedTableForChange, setSelectedTableForChange] = useState<number | null>(null);
  const [selectedTablesForMerge, setSelectedTablesForMerge] = useState<number[]>([currentTableId]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const currentTable = tables.find(t => t.id === currentTableId);

  const handleChangeTable = (newTableId: number) => {
    setSelectedTableForChange(newTableId);
    setShowConfirmation(true);
  };

  const confirmChangeTable = () => {
    if (selectedTableForChange !== null) {
      onChangeTable(selectedTableForChange);
      setShowConfirmation(false);
      setMode('view');
      onClose();
    }
  };

  const toggleTableForMerge = (tableId: number) => {
    setSelectedTablesForMerge(prev => {
      if (prev.includes(tableId)) {
        return prev.filter(id => id !== tableId);
      } else {
        return [...prev, tableId];
      }
    });
  };

  const confirmMergeTables = () => {
    if (selectedTablesForMerge.length > 1) {
      onMergeTables(selectedTablesForMerge);
      setShowConfirmation(false);
      setMode('view');
      setSelectedTablesForMerge([currentTableId]);
      onClose();
    }
  };

  const getTableColor = (table: Table) => {
    if (table.id === currentTableId) {
      return 'bg-orange-500 text-white border-orange-600';
    }
    if (mode === 'change' && table.status === 'available') {
      return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
    }
    if (mode === 'merge' && selectedTablesForMerge.includes(table.id)) {
      return 'bg-blue-500 text-white border-blue-600';
    }
    if (mode === 'merge' && table.status === 'occupied') {
      return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 cursor-pointer';
    }

    switch (table.status) {
      case 'available':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getTableSize = (size: Table['size']) => {
    switch (size) {
      case 'small':
        return 'w-14 h-14 sm:w-16 sm:h-16';
      case 'medium':
        return 'w-16 h-16 sm:w-20 sm:h-20';
      case 'large':
        return 'w-20 h-20 sm:w-24 sm:h-24';
      default:
        return 'w-16 h-16 sm:w-20 sm:h-20';
    }
  };

  const handleTableClick = (table: Table) => {
    if (mode === 'change' && table.status === 'available' && table.id !== currentTableId) {
      handleChangeTable(table.id);
    } else if (mode === 'merge' && table.status === 'occupied') {
      toggleTableForMerge(table.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full sm:w-[600px] bg-white shadow-2xl transform transition-transform overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 sm:p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{t.floorPlan.title}</h2>
                <p className="text-orange-100 mt-1 text-sm sm:text-base">
                  {t.floorPlan.currentTable} {currentTable?.number}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="p-3 sm:p-4 bg-gray-50 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('view')}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.floorPlan.viewMode}
              </button>
              <button
                onClick={() => setMode('change')}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  mode === 'change'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.floorPlan.changeMode}
              </button>
              <button
                onClick={() => setMode('merge')}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  mode === 'merge'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.floorPlan.mergeMode}
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-3 text-xs sm:text-sm text-gray-600">
              {mode === 'view' && <p>{t.floorPlan.viewInstruction}</p>}
              {mode === 'change' && <p>{t.floorPlan.changeInstruction}</p>}
              {mode === 'merge' && (
                <p>{t.floorPlan.mergeInstruction}</p>
              )}
            </div>
          </div>

          {/* Floor Plan */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="relative bg-gray-100 rounded-xl p-4 sm:p-8 border-2 border-gray-300">
              {/* Restaurant Layout */}
              <div className="text-center mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-700">{t.header.restaurantName}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{t.floorPlan.floor1}</p>
              </div>

              {/* Tables Grid Layout - Responsive */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
                {/* แถวที่ 1: โซนหน้า */}
                {tables.slice(0, 4).map((table) => (
                  <div key={table.id} className="flex justify-center">
                    <button
                      onClick={() => handleTableClick(table)}
                      className={`relative flex flex-col items-center justify-center ${getTableSize(
                        table.size
                      )} border-2 rounded-lg shadow-md transition-all ${getTableColor(table)} ${
                        ((mode === 'change' && table.status === 'available' && table.id !== currentTableId) ||
                          (mode === 'merge' && table.status === 'occupied'))
                          ? 'hover:scale-110 active:scale-105'
                          : ''
                      }`}
                    >
                      <span className="font-bold text-sm sm:text-lg">{table.number}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity}</span>
                      </div>
                      {table.id === currentTableId && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                          </div>
                        </div>
                      )}
                      {mode === 'merge' && selectedTablesForMerge.includes(table.id) && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}

                {/* แถวที่ 2: โซนกลาง */}
                {tables.slice(4, 7).map((table) => (
                  <div key={table.id} className="flex justify-center">
                    <button
                      onClick={() => handleTableClick(table)}
                      className={`relative flex flex-col items-center justify-center ${getTableSize(
                        table.size
                      )} border-2 rounded-lg shadow-md transition-all ${getTableColor(table)} ${
                        ((mode === 'change' && table.status === 'available' && table.id !== currentTableId) ||
                          (mode === 'merge' && table.status === 'occupied'))
                          ? 'hover:scale-110 active:scale-105'
                          : ''
                      }`}
                    >
                      <span className="font-bold text-sm sm:text-lg">{table.number}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity}</span>
                      </div>
                      {table.id === currentTableId && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                          </div>
                        </div>
                      )}
                      {mode === 'merge' && selectedTablesForMerge.includes(table.id) && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
                {/* Placeholder สำหรับ desktop */}
                <div className="hidden sm:block"></div>

                {/* แถวที่ 3: โซนหลัง */}
                {tables.slice(7, 11).map((table) => (
                  <div key={table.id} className="flex justify-center">
                    <button
                      onClick={() => handleTableClick(table)}
                      className={`relative flex flex-col items-center justify-center ${getTableSize(
                        table.size
                      )} border-2 rounded-lg shadow-md transition-all ${getTableColor(table)} ${
                        ((mode === 'change' && table.status === 'available' && table.id !== currentTableId) ||
                          (mode === 'merge' && table.status === 'occupied'))
                          ? 'hover:scale-110 active:scale-105'
                          : ''
                      }`}
                    >
                      <span className="font-bold text-sm sm:text-lg">{table.number}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity}</span>
                      </div>
                      {table.id === currentTableId && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                          </div>
                        </div>
                      )}
                      {mode === 'merge' && selectedTablesForMerge.includes(table.id) && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-white rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-2">{t.floorPlan.legend}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-600"></div>
                    <span>{t.floorPlan.yourTable}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded border-2 border-green-300"></div>
                    <span>{t.floorPlan.available}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded border-2 border-red-300"></div>
                    <span>{t.floorPlan.occupied}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded border-2 border-yellow-300"></div>
                    <span>{t.floorPlan.reserved}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merge Tables Action */}
          {mode === 'merge' && selectedTablesForMerge.length > 1 && (
            <div className="p-4 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {t.floorPlan.mergeTables} {selectedTablesForMerge.length} {t.floorPlan.tables}
                </span>
              </div>
              <div className="text-sm text-blue-800 mb-3">
                {t.floorPlan.selectedTables}{' '}
                {selectedTablesForMerge
                  .map(id => tables.find(t => t.id === id)?.number)
                  .join(', ')}
              </div>
              <button
                onClick={() => {
                  setShowConfirmation(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md"
              >
                {t.floorPlan.confirmMerge}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowConfirmation(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t.floorPlan.confirmAction}</h3>

            {mode === 'change' && selectedTableForChange !== null && (
              <>
                <p className="text-gray-600 mb-4">
                  {t.floorPlan.changeConfirmMsg} <strong>{currentTable?.number}</strong> {t.floorPlan.to}{' '}
                  <strong>{tables.find(t => t.id === selectedTableForChange)?.number}</strong>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={confirmChangeTable}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold"
                  >
                    {t.common.confirm}
                  </button>
                </div>
              </>
            )}

            {mode === 'merge' && selectedTablesForMerge.length > 1 && (
              <>
                <p className="text-gray-600 mb-4">
                  {t.floorPlan.mergeConfirmMsg}{' '}
                  <strong>
                    {selectedTablesForMerge
                      .map(id => tables.find(t => t.id === id)?.number)
                      .join(', ')}
                  </strong>?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900">
                    {t.floorPlan.mergeNote}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={confirmMergeTables}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                  >
                    {t.common.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
