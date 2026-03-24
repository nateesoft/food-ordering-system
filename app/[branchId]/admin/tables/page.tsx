'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Armchair, Plus, Edit, Trash2, Save, X, ArrowLeft, Search,
  LayoutGrid, Map, RefreshCw, Users, Move, Copy, Check
} from 'lucide-react';
import { DndContext, useDraggable, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

// ===== Types =====

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

type TabType = 'tables' | 'zones' | 'floorplan' | 'batch';

const SHAPES = [
  { value: 'square', label: 'สี่เหลี่ยม', icon: '◻️' },
  { value: 'circle', label: 'วงกลม', icon: '⬤' },
  { value: 'rectangle', label: 'สี่เหลี่ยมผืนผ้า', icon: '▬' },
  { value: 'counter', label: 'บาร์เคาน์เตอร์', icon: '━' },
];

const SIZES = [
  { value: 'small', label: 'เล็ก (2 ที่นั่ง)' },
  { value: 'medium', label: 'กลาง (4 ที่นั่ง)' },
  { value: 'large', label: 'ใหญ่ (6+ ที่นั่ง)' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'ว่าง', color: 'bg-green-100 text-green-800' },
  OCCUPIED: { label: 'มีลูกค้า', color: 'bg-red-100 text-red-800' },
  RESERVED: { label: 'จอง', color: 'bg-yellow-100 text-yellow-800' },
  BILLING: { label: 'รอชำระ', color: 'bg-purple-100 text-purple-800' },
  CLEANING: { label: 'ทำความสะอาด', color: 'bg-gray-100 text-gray-800' },
};

// ===== Shape Helpers =====

const getShapeClasses = (shape: string): string => {
  switch (shape) {
    case 'circle': return 'rounded-full';
    case 'rectangle': return 'rounded-xl';
    case 'counter': return 'rounded-lg';
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
  // If all values are within 0-100, assume already percentage
  if (maxX <= 100 && maxY <= 100) return tables;
  // Otherwise, normalize to fit within 10-90% range
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

// ===== Draggable Table Component =====

const EDITOR_STATUS_COLORS: Record<string, { border: string; bg: string }> = {
  AVAILABLE: { border: 'border-green-400', bg: 'bg-gradient-to-br from-green-100 to-emerald-200' },
  OCCUPIED: { border: 'border-red-400', bg: 'bg-gradient-to-br from-red-100 to-red-200' },
  RESERVED: { border: 'border-yellow-400', bg: 'bg-gradient-to-br from-yellow-100 to-amber-200' },
  BILLING: { border: 'border-purple-400', bg: 'bg-gradient-to-br from-purple-100 to-purple-200' },
  CLEANING: { border: 'border-gray-400', bg: 'bg-gradient-to-br from-gray-200 to-gray-300' },
};

function DraggableTable({ table }: { table: TableData }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `table-${table.id}`,
    data: table,
  });

  const shapeClass = getShapeClasses(table.shape || 'square');
  const dims = getSizeDimensions(table.size || 'medium', table.shape || 'square');
  const colors = EDITOR_STATUS_COLORS[table.status] || EDITOR_STATUS_COLORS.AVAILABLE;
  const statusLabel = STATUS_CONFIG[table.status]?.label || 'ว่าง';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${table.positionX}%`,
    top: `${table.positionY}%`,
    width: `${dims.w}px`,
    height: `${dims.h}px`,
    transform: CSS.Translate.toString(transform) ? `translate(-50%, -50%) ${CSS.Translate.toString(transform)}` : 'translate(-50%, -50%)',
    zIndex: transform ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`border-2 ${colors.border} ${colors.bg} ${shapeClass} flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-shadow select-none ring-2 ring-white`}
    >
      <span className="text-sm font-bold text-gray-800 leading-tight drop-shadow-sm">{table.number}</span>
      <span className="text-[10px] text-gray-600 font-medium">{table.capacity} คน</span>
      <span className="text-[8px] text-gray-500 mt-0.5">{statusLabel}</span>
    </div>
  );
}

// ===== Main Page =====

export default function TableManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tables');

  // Tables state
  const [tables, setTables] = useState<TableData[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterZone, setFilterZone] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Table modal
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [tableForm, setTableForm] = useState({
    number: '', capacity: 4, size: 'medium', shape: 'square',
    positionX: 50, positionY: 50, zone: '',
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<TableData | null>(null);

  // Zone management
  const [newZoneName, setNewZoneName] = useState('');
  const [renameZone, setRenameZone] = useState<{ old: string; new: string } | null>(null);

  // Floor plan editor
  const [floorTables, setFloorTables] = useState<TableData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [floorFilterZone, setFloorFilterZone] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Batch add
  const [batchForm, setBatchForm] = useState({
    prefix: 'T', startNum: 1, endNum: 10, capacity: 4,
    size: 'medium', shape: 'square', zone: '',
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ===== Data Loading =====

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const [tablesData, zonesData] = await Promise.all([
        api.getTables(),
        api.getTableZones(),
      ]);
      const normalized = normalizePositions(tablesData);
      setTables(normalized);
      setZones(zonesData);
      setFloorTables(normalized.map((t: any) => ({ ...t })));
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ===== Table CRUD =====

  const openCreateModal = () => {
    setEditingTable(null);
    setTableForm({ number: '', capacity: 4, size: 'medium', shape: 'square', positionX: 50, positionY: 50, zone: '' });
    setShowTableModal(true);
  };

  const openEditModal = (table: TableData) => {
    setEditingTable(table);
    setTableForm({
      number: table.number,
      capacity: table.capacity,
      size: table.size || 'medium',
      shape: table.shape || 'square',
      positionX: table.positionX,
      positionY: table.positionY,
      zone: table.zone || '',
    });
    setShowTableModal(true);
  };

  const handleSaveTable = async () => {
    try {
      setLoading(true);
      const data = {
        number: tableForm.number,
        capacity: tableForm.capacity,
        size: tableForm.size,
        shape: tableForm.shape,
        positionX: tableForm.positionX,
        positionY: tableForm.positionY,
        zone: tableForm.zone || undefined,
      };

      if (editingTable) {
        await api.updateTable(editingTable.id, data);
        setSuccessMsg(`อัพเดทโต๊ะ ${tableForm.number} สำเร็จ`);
      } else {
        await api.createTable(data as any);
        setSuccessMsg(`สร้างโต๊ะ ${tableForm.number} สำเร็จ`);
      }
      setShowTableModal(false);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (table: TableData) => {
    try {
      setLoading(true);
      await api.deleteTable(table.id);
      setSuccessMsg(`ลบโต๊ะ ${table.number} สำเร็จ`);
      setDeleteConfirm(null);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ===== Zone Management =====

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    // Zone is just a string on tables - inform user they need to assign tables
    setSuccessMsg(`โซน "${newZoneName}" พร้อมใช้งาน - กรุณากำหนดโต๊ะเข้าโซนนี้`);
    if (!zones.includes(newZoneName.trim())) {
      setZones([...zones, newZoneName.trim()]);
    }
    setNewZoneName('');
  };

  const handleRenameZone = async () => {
    if (!renameZone || !renameZone.new.trim()) return;
    try {
      setLoading(true);
      const zoneTables = tables.filter(t => t.zone === renameZone.old);
      await Promise.all(
        zoneTables.map(t => api.updateTable(t.id, { zone: renameZone.new.trim() }))
      );
      setSuccessMsg(`เปลี่ยนชื่อโซนจาก "${renameZone.old}" เป็น "${renameZone.new}" สำเร็จ`);
      setRenameZone(null);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneName: string) => {
    if (!confirm(`ลบโซน "${zoneName}"? โต๊ะในโซนนี้จะถูกตั้งค่าเป็นไม่มีโซน`)) return;
    try {
      setLoading(true);
      const zoneTables = tables.filter(t => t.zone === zoneName);
      await Promise.all(
        zoneTables.map(t => api.updateTable(t.id, { zone: null }))
      );
      setSuccessMsg(`ลบโซน "${zoneName}" สำเร็จ`);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ===== Floor Plan Editor =====

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const tableId = Number(String(active.id).replace('table-', ''));
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    setFloorTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        positionX: Math.max(2, Math.min(98, t.positionX + deltaXPercent)),
        positionY: Math.max(2, Math.min(98, t.positionY + deltaYPercent)),
      };
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePositions = async () => {
    try {
      setLoading(true);
      const updates = floorTables.map(t => ({
        id: t.id,
        positionX: Math.round(t.positionX * 100) / 100,
        positionY: Math.round(t.positionY * 100) / 100,
      }));
      await api.bulkUpdateTablePositions(updates);
      setSuccessMsg('บันทึกตำแหน่งโต๊ะสำเร็จ');
      setHasUnsavedChanges(false);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const filteredFloorTables = floorFilterZone
    ? floorTables.filter(t => t.zone === floorFilterZone)
    : floorTables;

  // ===== Batch Add =====

  const handleBatchAdd = async () => {
    if (batchForm.startNum > batchForm.endNum) {
      alert('หมายเลขเริ่มต้นต้องน้อยกว่าหมายเลขสิ้นสุด');
      return;
    }

    try {
      setLoading(true);
      const count = batchForm.endNum - batchForm.startNum + 1;
      const cols = Math.ceil(Math.sqrt(count));

      for (let i = batchForm.startNum; i <= batchForm.endNum; i++) {
        const idx = i - batchForm.startNum;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const posX = 10 + (col / Math.max(cols - 1, 1)) * 80;
        const posY = 10 + (row / Math.max(Math.ceil(count / cols) - 1, 1)) * 80;

        const num = `${batchForm.prefix}${String(i).padStart(2, '0')}`;
        try {
          await api.createTable({
            number: num,
            capacity: batchForm.capacity,
            size: batchForm.size,
            shape: batchForm.shape,
            positionX: Math.round(posX * 100) / 100,
            positionY: Math.round(posY * 100) / 100,
            zone: batchForm.zone || undefined,
          });
        } catch {
          // skip if table already exists
        }
      }
      setSuccessMsg(`สร้างโต๊ะ ${batchForm.prefix}${String(batchForm.startNum).padStart(2, '0')} - ${batchForm.prefix}${String(batchForm.endNum).padStart(2, '0')} สำเร็จ`);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ===== Filtered tables for list =====

  const filteredTables = tables.filter(t => {
    if (filterZone && t.zone !== filterZone) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (searchQuery && !t.number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ===== Tab Config =====

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'tables', label: 'รายการโต๊ะ', icon: <Armchair className="w-4 h-4" /> },
    { key: 'zones', label: 'จัดการโซน', icon: <LayoutGrid className="w-4 h-4" /> },
    { key: 'floorplan', label: 'แผนผังร้าน', icon: <Map className="w-4 h-4" /> },
    { key: 'batch', label: 'เพิ่มหลายโต๊ะ', icon: <Copy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>กลับ Admin</span>
            </button>
            <BranchSelector />
          </div>
          <div className="flex items-center gap-3">
            <Armchair className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Table Management</h1>
              <p className="text-sky-100">จัดการโต๊ะ แผนผังร้าน โซน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMsg}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ========== TAB 1: Tables List ========== */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาโต๊ะ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                />
              </div>
              <select
                value={filterZone}
                onChange={e => setFilterZone(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">ทุกโซน</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">ทุกสถานะ</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                เพิ่มโต๊ะ
              </button>
            </div>

            {/* Table List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">โต๊ะ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ความจุ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ขนาด</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">รูปทรง</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">โซน</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ตำแหน่ง</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTables.map(table => {
                      const statusCfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
                      const shapeCfg = SHAPES.find(s => s.value === table.shape) || SHAPES[0];
                      return (
                        <tr key={table.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-800">{table.number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{table.capacity}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{SIZES.find(s => s.value === table.size)?.label || table.size}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{shapeCfg.icon} {shapeCfg.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {table.zone ? (
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{table.zone}</span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            ({Math.round(table.positionX)}%, {Math.round(table.positionY)}%)
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(table)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                title="แก้ไข"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(table)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTables.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                          <Armchair className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>ไม่พบโต๊ะ</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                แสดง {filteredTables.length} จาก {tables.length} โต๊ะ
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB 2: Zone Management ========== */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            {/* Add Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มโซนใหม่</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="ชื่อโซน เช่น ในร้าน, นอกร้าน, ชั้น 2..."
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  onKeyDown={e => e.key === 'Enter' && handleAddZone()}
                />
                <button
                  onClick={handleAddZone}
                  disabled={!newZoneName.trim()}
                  className="px-6 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zone List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map(zone => {
                const zoneTableCount = tables.filter(t => t.zone === zone).length;
                const isRenaming = renameZone?.old === zone;
                return (
                  <div key={zone} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    {isRenaming ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={renameZone.new}
                          onChange={e => setRenameZone({ ...renameZone, new: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRenameZone}
                            className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setRenameZone(null)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-gray-800">{zone}</h4>
                          <span className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                            {zoneTableCount} โต๊ะ
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tables.filter(t => t.zone === zone).slice(0, 8).map(t => (
                            <span key={t.id} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{t.number}</span>
                          ))}
                          {zoneTableCount > 8 && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">+{zoneTableCount - 8}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRenameZone({ old: zone, new: zone })}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            เปลี่ยนชื่อ
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {/* No zone tables */}
              {(() => {
                const noZoneTables = tables.filter(t => !t.zone);
                if (noZoneTables.length === 0) return null;
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-400">ไม่มีโซน</h4>
                      <span className="text-sm px-2 py-1 bg-gray-50 text-gray-500 rounded-full">
                        {noZoneTables.length} โต๊ะ
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {noZoneTables.slice(0, 8).map(t => (
                        <span key={t.id} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{t.number}</span>
                      ))}
                      {noZoneTables.length > 8 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">+{noZoneTables.length - 8}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
              {zones.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>ยังไม่มีโซน</p>
                  <p className="text-sm">เพิ่มโซนเพื่อจัดกลุ่มโต๊ะตามพื้นที่ร้าน</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB 3: Floor Plan Editor ========== */}
        {activeTab === 'floorplan' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <Move className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">ลากโต๊ะเพื่อจัดวางตำแหน่ง</span>
              <div className="flex-1" />
              <select
                value={floorFilterZone}
                onChange={e => setFloorFilterZone(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">ทุกโซน</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">มีการเปลี่ยนแปลง</span>
              )}
              <button
                onClick={handleSavePositions}
                disabled={!hasUnsavedChanges || loading}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                บันทึกตำแหน่ง
              </button>
              <button
                onClick={() => { setFloorTables(tables.map(t => ({ ...t }))); setHasUnsavedChanges(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                รีเซ็ต
              </button>
            </div>

            {/* Canvas */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div
                ref={canvasRef}
                className="relative w-full bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm"
                style={{ paddingBottom: '65%' }}
              >
                {/* Grid background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />
                {/* Zone labels */}
                {zones.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {(floorFilterZone ? [floorFilterZone] : zones).map(zone => (
                      <span key={zone} className="text-[10px] px-2 py-0.5 bg-white/90 rounded-full text-gray-500 border border-gray-200 shadow-sm">
                        {zone}
                      </span>
                    ))}
                  </div>
                )}
                {/* Tables */}
                {filteredFloorTables.map(table => (
                  <DraggableTable key={table.id} table={table} />
                ))}
                {filteredFloorTables.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Armchair className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">ไม่มีโต๊ะ</p>
                    </div>
                  </div>
                )}
              </div>
            </DndContext>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">รูปทรง:</span>
                {SHAPES.map(s => (
                  <span key={s.value} className="flex items-center gap-1">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB 4: Batch Add ========== */}
        {activeTab === 'batch' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Copy className="w-6 h-6 text-sky-600" />
                <h3 className="text-lg font-bold text-gray-800">เพิ่มหลายโต๊ะพร้อมกัน</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
                  <input
                    type="text"
                    value={batchForm.prefix}
                    onChange={e => setBatchForm({ ...batchForm, prefix: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                    placeholder="T"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขเริ่มต้น</label>
                  <input
                    type="number"
                    value={batchForm.startNum}
                    onChange={e => setBatchForm({ ...batchForm, startNum: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขสิ้นสุด</label>
                  <input
                    type="number"
                    value={batchForm.endNum}
                    onChange={e => setBatchForm({ ...batchForm, endNum: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความจุ (คน)</label>
                <input
                  type="number"
                  value={batchForm.capacity}
                  onChange={e => setBatchForm({ ...batchForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  min={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด</label>
                  <select
                    value={batchForm.size}
                    onChange={e => setBatchForm({ ...batchForm, size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รูปทรง</label>
                  <select
                    value={batchForm.shape}
                    onChange={e => setBatchForm({ ...batchForm, shape: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {SHAPES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โซน (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={batchForm.zone}
                  onChange={e => setBatchForm({ ...batchForm, zone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น ในร้าน"
                  list="zone-suggestions"
                />
                <datalist id="zone-suggestions">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>

              <div className="bg-sky-50 rounded-xl p-4 text-sm text-sky-800">
                จะสร้างโต๊ะ: <span className="font-bold">{batchForm.prefix}{String(batchForm.startNum).padStart(2, '0')}</span> ถึง <span className="font-bold">{batchForm.prefix}{String(batchForm.endNum).padStart(2, '0')}</span>
                {' '}= <span className="font-bold">{Math.max(0, batchForm.endNum - batchForm.startNum + 1)}</span> โต๊ะ
                {batchForm.zone && <> ในโซน <span className="font-bold">{batchForm.zone}</span></>}
              </div>

              <button
                onClick={handleBatchAdd}
                disabled={loading || !batchForm.prefix || batchForm.startNum > batchForm.endNum}
                className="w-full py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  `สร้าง ${Math.max(0, batchForm.endNum - batchForm.startNum + 1)} โต๊ะ`
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== Create/Edit Table Modal ========== */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingTable ? `แก้ไขโต๊ะ ${editingTable.number}` : 'เพิ่มโต๊ะใหม่'}
                </h3>
                <button onClick={() => setShowTableModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขโต๊ะ</label>
                <input
                  type="text"
                  value={tableForm.number}
                  onChange={e => setTableForm({ ...tableForm, number: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น T01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความจุ (คน)</label>
                <input
                  type="number"
                  value={tableForm.capacity}
                  onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  min={1}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด</label>
                  <select
                    value={tableForm.size}
                    onChange={e => setTableForm({ ...tableForm, size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รูปทรง</label>
                  <select
                    value={tableForm.shape}
                    onChange={e => setTableForm({ ...tableForm, shape: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {SHAPES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Shape Preview */}
              <div className="flex justify-center py-3">
                <div
                  className={`border-2 border-sky-300 bg-sky-50 ${getShapeClasses(tableForm.shape)} flex items-center justify-center`}
                  style={{
                    width: `${getSizeDimensions(tableForm.size, tableForm.shape).w}px`,
                    height: `${getSizeDimensions(tableForm.size, tableForm.shape).h}px`,
                  }}
                >
                  <span className="text-xs font-bold text-sky-600">{tableForm.number || '?'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โซน</label>
                <input
                  type="text"
                  value={tableForm.zone}
                  onChange={e => setTableForm({ ...tableForm, zone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น ในร้าน"
                  list="modal-zone-suggestions"
                />
                <datalist id="modal-zone-suggestions">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง X (%)</label>
                  <input
                    type="number"
                    value={tableForm.positionX}
                    onChange={e => setTableForm({ ...tableForm, positionX: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                    min={0} max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง Y (%)</label>
                  <input
                    type="number"
                    value={tableForm.positionY}
                    onChange={e => setTableForm({ ...tableForm, positionY: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                    min={0} max={100}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowTableModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveTable}
                disabled={loading || !tableForm.number}
                className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : editingTable ? 'อัพเดท' : 'สร้างโต๊ะ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Delete Confirmation Modal ========== */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
              <p className="text-gray-600 mb-6">
                ต้องการลบโต๊ะ <span className="font-bold">{deleteConfirm.number}</span> ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDeleteTable(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'ลบโต๊ะ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
