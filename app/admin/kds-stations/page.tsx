'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function KDSStationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  // Form state
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [color, setColor] = useState('#3B82F6');
  const [alertTimeout, setAlertTimeout] = useState(300);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    loadStations();
    loadCategories();
  }, []);

  const loadStations = async () => {
    try {
      const data = await api.getKDSStations();
      setStations(data || []);
    } catch { /* ignore */ }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.getMenuCategories();
      setCategories(cats || []);
    } catch { /* ignore */ }
  };

  const openCreateModal = () => {
    setEditingStation(null);
    setName('');
    setSelectedCategories([]);
    setColor('#3B82F6');
    setAlertTimeout(300);
    setSortOrder(stations.length);
    setShowModal(true);
  };

  const openEditModal = (station: any) => {
    setEditingStation(station);
    setName(station.name);
    setSelectedCategories(station.categories || []);
    setColor(station.color || '#3B82F6');
    setAlertTimeout(station.alertTimeout || 300);
    setSortOrder(station.sortOrder || 0);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (editingStation) {
        await api.updateKDSStation(editingStation.id, {
          name, categories: selectedCategories, color, alertTimeout, sortOrder,
        });
      } else {
        await api.createKDSStation({
          name, categories: selectedCategories, color, alertTimeout,
        });
      }
      setShowModal(false);
      loadStations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบ station นี้?')) return;
    try {
      await api.deleteKDSStation(id);
      loadStations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const PRESET_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">จัดการ KDS Station</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/kds" target="_blank" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
              เปิด KDS Display
            </Link>
            <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + เพิ่ม Station
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-700">
          <p className="font-medium">KDS Station คืออะไร?</p>
          <p className="mt-1">แต่ละ Station เป็นหน้าจอครัวแยกตามหมวดหมู่อาหาร เช่น Station ปิ้งย่าง จะแสดงเฉพาะเมนูหมวด "ปิ้งย่าง" เท่านั้น หากไม่เลือก Station บนหน้า KDS จะแสดงทุกเมนู</p>
        </div>

        {/* Stations List */}
        <div className="space-y-3">
          {stations.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <p>ยังไม่มี Station</p>
              <p className="text-sm mt-1">สร้าง Station เพื่อแยกหมวดหมู่อาหารตาม station ครัว</p>
            </div>
          ) : stations.map((station) => (
            <div key={station.id} className="bg-white rounded-xl border p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className="w-4 h-12 rounded-full" style={{ backgroundColor: station.color }} />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{station.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {station.categories?.map((cat: string) => (
                    <span key={cat} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                      {cat}
                    </span>
                  ))}
                  {(!station.categories || station.categories.length === 0) && (
                    <span className="text-xs text-gray-400">ไม่ได้กำหนดหมวดหมู่</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Timeout: {Math.floor(station.alertTimeout / 60)} min
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(station)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(station.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">{editingStation ? 'แก้ไข Station' : 'เพิ่ม Station'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Station *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="เช่น ปิ้งย่าง, เครื่องดื่ม" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่อาหาร</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {categories.map((cat: any) => {
                    const catName = typeof cat === 'string' ? cat : cat.name || cat.category;
                    return (
                      <button key={catName} onClick={() => toggleCategory(catName)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        selectedCategories.includes(catName) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                        {catName}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <p className="text-xs text-gray-400">ไม่มีหมวดหมู่ในระบบ</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Timeout (วินาที)</label>
                <input type="number" value={alertTimeout} onChange={(e) => setAlertTimeout(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min={60} step={60} />
                <p className="text-xs text-gray-400 mt-1">ออเดอร์จะเปลี่ยนสีเป็นแดงเมื่อเกินเวลาที่กำหนด ({Math.floor(alertTimeout / 60)} นาที)</p>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                {editingStation ? 'บันทึก' : 'สร้าง Station'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
