'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, Eye, RefreshCw, X, Percent, DollarSign, Clock, Ticket, Search } from 'lucide-react';
import { api, PromotionResponse, PromotionStatsResponse } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'เปอร์เซ็นต์',
  FIXED_AMOUNT: 'จำนวนเงิน',
  COUPON: 'คูปอง',
  HAPPY_HOUR: 'Happy Hour',
};

const TYPE_COLORS: Record<string, string> = {
  PERCENTAGE: 'bg-blue-100 text-blue-800',
  FIXED_AMOUNT: 'bg-green-100 text-green-800',
  COUPON: 'bg-purple-100 text-purple-800',
  HAPPY_HOUR: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'ใช้งาน',
  INACTIVE: 'ปิดใช้งาน',
  EXPIRED: 'หมดอายุ',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

type TabType = 'all' | 'active' | 'expired' | 'coupon';

const EMPTY_FORM = {
  name: '',
  description: '',
  type: 'PERCENTAGE' as string,
  discountValue: 0,
  maxDiscount: undefined as number | undefined,
  couponCode: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  minOrderAmount: undefined as number | undefined,
  categories: [] as string[],
  maxUses: undefined as number | undefined,
};

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [stats, setStats] = useState<PromotionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionResponse | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionResponse | null>(null);

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [promos, promoStats, cats] = await Promise.all([
        api.getPromotions(),
        api.getPromotionStats(),
        api.getMenuCategories(),
      ]);
      setPromotions(promos);
      setStats(promoStats);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPromotions = promotions.filter((p) => {
    if (activeTab === 'active') return p.status === 'ACTIVE';
    if (activeTab === 'expired') return p.status === 'EXPIRED' || p.status === 'INACTIVE';
    if (activeTab === 'coupon') return p.type === 'COUPON';
    return true;
  });

  const openCreateModal = () => {
    setEditingPromotion(null);
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      ...EMPTY_FORM,
      startDate: now.toISOString().slice(0, 10),
      endDate: nextMonth.toISOString().slice(0, 10),
    });
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (promo: PromotionResponse) => {
    setEditingPromotion(promo);
    setForm({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      discountValue: promo.discountValue,
      maxDiscount: promo.maxDiscount ?? undefined,
      couponCode: promo.couponCode || '',
      startDate: promo.startDate.slice(0, 10),
      endDate: promo.endDate.slice(0, 10),
      startTime: promo.startTime || '',
      endTime: promo.endTime || '',
      minOrderAmount: promo.minOrderAmount ?? undefined,
      categories: promo.categories || [],
      maxUses: promo.maxUses ?? undefined,
    });
    setFormError('');
    setShowFormModal(true);
  };

  const openDetailModal = (promo: PromotionResponse) => {
    setSelectedPromotion(promo);
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('กรุณาระบุชื่อโปรโมชัน');
      return;
    }
    if (form.discountValue <= 0) {
      setFormError('กรุณาระบุมูลค่าส่วนลด');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError('กรุณาระบุวันเริ่มต้นและสิ้นสุด');
      return;
    }
    if (form.type === 'COUPON' && !form.couponCode.trim()) {
      setFormError('กรุณาระบุรหัสคูปอง');
      return;
    }
    if (form.type === 'HAPPY_HOUR' && (!form.startTime || !form.endTime)) {
      setFormError('กรุณาระบุเวลาเริ่มต้นและสิ้นสุดสำหรับ Happy Hour');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        discountValue: form.discountValue,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
        maxDiscount: form.maxDiscount || undefined,
        couponCode: form.type === 'COUPON' ? form.couponCode.toUpperCase() : undefined,
        startTime: form.type === 'HAPPY_HOUR' ? form.startTime : undefined,
        endTime: form.type === 'HAPPY_HOUR' ? form.endTime : undefined,
        minOrderAmount: form.minOrderAmount || undefined,
        categories: form.categories.length > 0 ? form.categories : undefined,
        maxUses: form.maxUses || undefined,
      };

      if (editingPromotion) {
        await api.updatePromotion(editingPromotion.id, payload);
      } else {
        await api.createPromotion(payload);
      }

      setShowFormModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการปิดใช้งานโปรโมชันนี้?')) return;
    try {
      await api.deletePromotion(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete promotion:', err);
    }
  };

  const handleToggleStatus = async (promo: PromotionResponse) => {
    try {
      const newStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.updatePromotion(promo.id, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const formatDiscountDisplay = (promo: PromotionResponse) => {
    if (promo.type === 'PERCENTAGE' || promo.type === 'HAPPY_HOUR') {
      let text = `${promo.discountValue}%`;
      if (promo.maxDiscount) text += ` (สูงสุด ${promo.maxDiscount}฿)`;
      return text;
    }
    return `${promo.discountValue.toLocaleString()} บาท`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: promotions.length },
    { key: 'active', label: 'ใช้งานอยู่', count: promotions.filter((p) => p.status === 'ACTIVE').length },
    { key: 'expired', label: 'หมดอายุ/ปิด', count: promotions.filter((p) => p.status !== 'ACTIVE').length },
    { key: 'coupon', label: 'คูปอง', count: promotions.filter((p) => p.type === 'COUPON').length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tag className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Promotion Management</h1>
              <p className="text-orange-100">จัดการโปรโมชันและส่วนลด</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BranchSelector />
            <button
              onClick={loadData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">โปรโมชันที่ใช้งาน</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalActive}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">ใช้งานวันนี้</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsesToday} ครั้ง</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
              <p className="text-sm text-gray-500">ส่วนลดวันนี้</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalDiscountToday.toLocaleString()} ฿</p>
            </div>
          </div>
        )}

        {/* Tabs + Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            สร้างโปรโมชัน
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">กำลังโหลด...</div>
          ) : filteredPromotions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">ไม่มีโปรโมชัน</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">ชื่อ</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">ประเภท</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">ส่วนลด</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">ระยะเวลา</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">การใช้งาน</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">สถานะ</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{promo.name}</p>
                        {promo.couponCode && (
                          <p className="text-sm text-purple-600 font-mono mt-1">
                            <Ticket className="w-3 h-3 inline mr-1" />
                            {promo.couponCode}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[promo.type]}`}>
                        {TYPE_LABELS[promo.type]}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-medium">
                      {formatDiscountDisplay(promo)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>{formatDate(promo.startDate)}</div>
                      <div className="text-gray-400">ถึง {formatDate(promo.endDate)}</div>
                      {promo.startTime && promo.endTime && (
                        <div className="text-orange-600 text-xs mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {promo.startTime} - {promo.endTime}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {promo.currentUses}{promo.maxUses ? ` / ${promo.maxUses}` : ' / ไม่จำกัด'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(promo)}
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${STATUS_COLORS[promo.status]}`}
                      >
                        {STATUS_LABELS[promo.status]}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailModal(promo)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ปิดใช้งาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPromotion ? 'แก้ไขโปรโมชัน' : 'สร้างโปรโมชันใหม่'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรโมชัน *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="เช่น ลด 10% ทุกเมนู"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['PERCENTAGE', 'FIXED_AMOUNT', 'COUPON', 'HAPPY_HOUR'] as const).map((t) => {
                    const icons = { PERCENTAGE: Percent, FIXED_AMOUNT: DollarSign, COUPON: Ticket, HAPPY_HOUR: Clock };
                    const Icon = icons[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          form.type === t
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {TYPE_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Value + Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === 'PERCENTAGE' || form.type === 'HAPPY_HOUR' ? 'ส่วนลด (%) *' : 'ส่วนลด (บาท) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue || ''}
                    onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                {(form.type === 'PERCENTAGE' || form.type === 'HAPPY_HOUR') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนลดสูงสุด (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.maxDiscount ?? ''}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ไม่จำกัด"
                    />
                  </div>
                )}
              </div>

              {/* Coupon Code (COUPON type only) */}
              {form.type === 'COUPON' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสคูปอง *</label>
                  <input
                    type="text"
                    value={form.couponCode}
                    onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 font-mono uppercase focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="เช่น WELCOME50"
                  />
                </div>
              )}

              {/* Time Range (HAPPY_HOUR only) */}
              {form.type === 'HAPPY_HOUR' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม *</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด *</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Min Order + Max Uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ยอดสั่งซื้อขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderAmount ?? ''}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ไม่มี"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนครั้งสูงสุด</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses ?? ''}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ไม่จำกัด"
                  />
                </div>
              </div>

              {/* Categories Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ (เว้นว่าง = ทุกหมวด)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const newCats = form.categories.includes(cat)
                          ? form.categories.filter((c) => c !== cat)
                          : [...form.categories, cat];
                        setForm({ ...form, categories: newCats });
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        form.categories.includes(cat)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'กำลังบันทึก...' : editingPromotion ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">รายละเอียดโปรโมชัน</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${TYPE_COLORS[selectedPromotion.type]}`}>
                  {TYPE_LABELS[selectedPromotion.type]}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedPromotion.status]}`}>
                  {STATUS_LABELS[selectedPromotion.status]}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-800">{selectedPromotion.name}</h3>
              {selectedPromotion.description && (
                <p className="text-gray-600">{selectedPromotion.description}</p>
              )}

              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600">ส่วนลด</p>
                <p className="text-3xl font-bold text-orange-700">
                  {formatDiscountDisplay(selectedPromotion)}
                </p>
              </div>

              {selectedPromotion.couponCode && (
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-purple-600">รหัสคูปอง</p>
                  <p className="text-2xl font-bold font-mono text-purple-700">
                    {selectedPromotion.couponCode}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">วันเริ่มต้น</p>
                  <p className="font-medium text-gray-800">{formatDate(selectedPromotion.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">วันสิ้นสุด</p>
                  <p className="font-medium text-gray-800">{formatDate(selectedPromotion.endDate)}</p>
                </div>
                {selectedPromotion.startTime && (
                  <div>
                    <p className="text-gray-500">เวลาเริ่ม</p>
                    <p className="font-medium text-gray-800">{selectedPromotion.startTime}</p>
                  </div>
                )}
                {selectedPromotion.endTime && (
                  <div>
                    <p className="text-gray-500">เวลาสิ้นสุด</p>
                    <p className="font-medium text-gray-800">{selectedPromotion.endTime}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">ยอดขั้นต่ำ</p>
                  <p className="font-medium text-gray-800">
                    {selectedPromotion.minOrderAmount ? `${selectedPromotion.minOrderAmount.toLocaleString()} บาท` : 'ไม่มี'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">การใช้งาน</p>
                  <p className="font-medium text-gray-800">
                    {selectedPromotion.currentUses} / {selectedPromotion.maxUses ?? 'ไม่จำกัด'}
                  </p>
                </div>
              </div>

              {selectedPromotion.categories.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">หมวดหมู่ที่ใช้ได้</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPromotion.categories.map((cat) => (
                      <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedPromotion);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                แก้ไข
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
