'use client';

import React, { useState } from 'react';
import { X, Check, Users, ArrowLeftRight } from 'lucide-react';
import { Table } from '@/types';

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
        return 'w-16 h-16';
      case 'medium':
        return 'w-20 h-20';
      case 'large':
        return 'w-24 h-24';
      default:
        return 'w-20 h-20';
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
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">ผังโต๊ะ</h2>
                <p className="text-orange-100 mt-1">
                  โต๊ะปัจจุบัน: {currentTable?.number}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('view')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                ดูผัง
              </button>
              <button
                onClick={() => setMode('change')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'change'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                เปลี่ยนโต๊ะ
              </button>
              <button
                onClick={() => setMode('merge')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'merge'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                รวมโต๊ะ
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-3 text-sm text-gray-600">
              {mode === 'view' && <p>💡 ดูตำแหน่งโต๊ะปัจจุบันของคุณ (สีส้ม)</p>}
              {mode === 'change' && <p>💡 เลือกโต๊ะว่าง (สีเขียว) เพื่อเปลี่ยนที่นั่ง</p>}
              {mode === 'merge' && (
                <p>💡 เลือกโต๊ะที่มีคนนั่ง (สีน้ำเงิน) เพื่อรวมบิลกับเพื่อน</p>
              )}
            </div>
          </div>

          {/* Floor Plan */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="relative bg-gray-100 rounded-xl p-8 min-h-[500px] border-2 border-gray-300">
              {/* Restaurant Layout */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-700">ร้านอาหารไทย</h3>
                <p className="text-sm text-gray-500">ชั้น 1</p>
              </div>

              {/* Tables */}
              <div className="relative" style={{ minHeight: '400px' }}>
                {tables.map((table) => (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`absolute flex flex-col items-center justify-center ${getTableSize(
                      table.size
                    )} border-2 rounded-lg shadow-md transition-all ${getTableColor(table)} ${
                      ((mode === 'change' && table.status === 'available' && table.id !== currentTableId) ||
                        (mode === 'merge' && table.status === 'occupied'))
                        ? 'hover:scale-110'
                        : ''
                    }`}
                    style={{
                      left: `${table.position.x}%`,
                      top: `${table.position.y}%`,
                    }}
                  >
                    <span className="font-bold text-lg">{table.number}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity}</span>
                    </div>
                    {table.id === currentTableId && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-white rounded-full p-1 shadow-lg">
                          <Check className="w-4 h-4 text-orange-500" />
                        </div>
                      </div>
                    )}
                    {mode === 'merge' && selectedTablesForMerge.includes(table.id) && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-white rounded-full p-1 shadow-lg">
                          <Check className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-2">สัญลักษณ์:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-600"></div>
                    <span>โต๊ะของคุณ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded border-2 border-green-300"></div>
                    <span>โต๊ะว่าง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded border-2 border-red-300"></div>
                    <span>มีคนนั่ง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded border-2 border-yellow-300"></div>
                    <span>จองไว้</span>
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
                  รวมโต๊ะ {selectedTablesForMerge.length} โต๊ะ
                </span>
              </div>
              <div className="text-sm text-blue-800 mb-3">
                โต๊ะที่เลือก:{' '}
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
                ยืนยันรวมโต๊ะ
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">ยืนยันการดำเนินการ</h3>

            {mode === 'change' && selectedTableForChange !== null && (
              <>
                <p className="text-gray-600 mb-4">
                  คุณต้องการเปลี่ยนจากโต๊ะ <strong>{currentTable?.number}</strong> ไปโต๊ะ{' '}
                  <strong>{tables.find(t => t.id === selectedTableForChange)?.number}</strong>{' '}
                  ใช่หรือไม่?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmChangeTable}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold"
                  >
                    ยืนยัน
                  </button>
                </div>
              </>
            )}

            {mode === 'merge' && selectedTablesForMerge.length > 1 && (
              <>
                <p className="text-gray-600 mb-4">
                  คุณต้องการรวมบิลของโต๊ะ{' '}
                  <strong>
                    {selectedTablesForMerge
                      .map(id => tables.find(t => t.id === id)?.number)
                      .join(', ')}
                  </strong>{' '}
                  เข้าด้วยกันใช่หรือไม่?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900">
                    💡 บิลจะถูกรวมเป็นบิลเดียว และคำสั่งซื้อทั้งหมดจะอยู่ในบิลเดียวกัน
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmMergeTables}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                  >
                    ยืนยัน
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
