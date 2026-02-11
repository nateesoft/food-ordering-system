'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, TrendingUp, ShoppingCart, UtensilsCrossed, Users,
  ArrowLeft, Calendar, DollarSign, Home, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type TabType = 'revenue' | 'orders' | 'menu' | 'members';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [revenueData, setRevenueData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any[]>([]);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [revenue, orders, menu, members, daily] = await Promise.all([
        api.getRevenueReport(startDate, endDate),
        api.getOrdersReport(startDate, endDate),
        api.getMenuPerformanceReport(startDate, endDate),
        api.getMemberAnalytics(),
        api.getDailySummary(startDate, endDate),
      ]);
      setRevenueData(revenue);
      setOrdersData(orders);
      setMenuData(menu);
      setMemberData(members);
      setDailySummary(daily);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) fetchData();
  }, [startDate, endDate, fetchData]);

  const setQuickRange = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (days - 1));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const setThisMonth = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(first.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'revenue', label: 'รายได้', icon: DollarSign },
    { key: 'orders', label: 'ออเดอร์', icon: ShoppingCart },
    { key: 'menu', label: 'เมนูขายดี', icon: UtensilsCrossed },
    { key: 'members', label: 'สมาชิก', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="w-8 h-8" /> Reports & Analytics
              </h1>
              <p className="text-indigo-100 mt-1">รายงานและวิเคราะห์ข้อมูลร้านอาหาร</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Date Range Picker */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">ช่วงวันที่:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-500">ถึง</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 ml-2">
              <button onClick={() => setQuickRange(1)} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">วันนี้</button>
              <button onClick={() => setQuickRange(7)} className="px-3 py-1.5 text-sm rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium">7 วัน</button>
              <button onClick={() => setQuickRange(30)} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">30 วัน</button>
              <button onClick={setThisMonth} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">เดือนนี้</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'revenue' && revenueData && <RevenueTab data={revenueData} daily={dailySummary} />}
            {activeTab === 'orders' && ordersData && <OrdersTab data={ordersData} daily={dailySummary} />}
            {activeTab === 'menu' && menuData && <MenuTab data={menuData} />}
            {activeTab === 'members' && memberData && <MembersTab data={memberData} />}
          </>
        )}
      </div>
    </div>
  );
}

// ===== Stat Card Component =====
function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ===== Revenue Tab =====
function RevenueTab({ data, daily }: { data: any; daily: any[] }) {
  const METHOD_LABELS: Record<string, string> = {
    CASH: 'เงินสด',
    TRANSFER: 'โอนเงิน',
    CREDIT_CARD: 'บัตรเครดิต',
  };

  const methodChartData = data.methodBreakdown.map((m: any) => ({
    name: METHOD_LABELS[m.method] || m.method,
    amount: m.amount,
    count: m.count,
  }));

  const peakHours = [...data.revenueByHour].sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="รายได้รวม" value={formatCurrency(data.totalRevenue)} color="text-green-600" />
        <StatCard title="จำนวนรายการ" value={`${data.totalTransactions} รายการ`} color="text-blue-600" />
        <StatCard title="ยอดเฉลี่ย/บิล" value={formatCurrency(data.avgOrderValue)} color="text-purple-600" />
        <StatCard title="ส่วนลดรวม" value={formatCurrency(data.totalDiscount)} subtitle={`แต้มใช้ ${data.totalPointsRedeemed} | ได้ ${data.totalPointsEarned}`} color="text-orange-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-4">รายได้แยกตามวิธีชำระ</h3>
          {methodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" name="ยอดเงิน" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* Daily Revenue Trend */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-4">แนวโน้มรายได้รายวัน</h3>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip labelFormatter={(label) => `วันที่: ${formatDate(label)}`} formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" name="รายได้" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      {/* Revenue by Hour */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-2">รายได้ตามช่วงเวลา (24 ชม.)</h3>
        <p className="text-sm text-gray-500 mb-4">
          ช่วง Peak: {peakHours.map((h: any) => `${h.hour}:00`).join(', ')}
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.revenueByHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip labelFormatter={(h) => `เวลา ${h}:00 น.`} formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="revenue" name="รายได้" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ===== Orders Tab =====
function OrdersTab({ data, daily }: { data: any; daily: any[] }) {
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PREPARING: { label: 'กำลังทำ', color: '#f59e0b' },
    COMPLETED: { label: 'เสร็จแล้ว', color: '#10b981' },
    DELIVERED: { label: 'ส่งแล้ว', color: '#6366f1' },
    CANCELLED: { label: 'ยกเลิก', color: '#ef4444' },
  };

  const statusChartData = data.statusCount.map((s: any) => ({
    name: STATUS_LABELS[s.status]?.label || s.status,
    value: s.count,
    color: STATUS_LABELS[s.status]?.color || '#94a3b8',
  }));

  const peakHours = [...data.ordersByHour].sort((a: any, b: any) => b.count - a.count).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ออเดอร์ทั้งหมด" value={`${data.totalOrders} รายการ`} color="text-blue-600" />
        <StatCard title="อัตราการยกเลิก" value={`${data.cancellationRate}%`} color="text-red-600" />
        <StatCard title="เฉลี่ยรายการ/บิล" value={`${data.avgItemsPerOrder} รายการ`} color="text-purple-600" />
        <StatCard title="Dine-in / Kiosk" value={`${data.dineInCount} / ${data.kioskCount}`} color="text-teal-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-4">สัดส่วนสถานะออเดอร์</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {statusChartData.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} รายการ`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* Orders by Hour */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-2">จำนวนออเดอร์ตามช่วงเวลา</h3>
          <p className="text-sm text-gray-500 mb-4">
            ช่วง Peak: {peakHours.map((h: any) => `${h.hour}:00`).join(', ')}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis />
              <Tooltip labelFormatter={(h) => `เวลา ${h}:00 น.`} formatter={(value) => `${value} ออเดอร์`} />
              <Bar dataKey="count" name="ออเดอร์" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Order Trend */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-4">แนวโน้มออเดอร์รายวัน</h3>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip labelFormatter={(label) => `วันที่: ${formatDate(label)}`} formatter={(value) => `${value} ออเดอร์`} />
              <Line type="monotone" dataKey="orderCount" name="ออเดอร์" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
}

// ===== Menu Performance Tab =====
function MenuTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Revenue by Category Chart */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-4">รายได้แยกตามหมวดหมู่</h3>
        {data.revenueByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="category" type="category" width={120} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" name="รายได้" fill="#6366f1" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
        )}
      </div>

      {/* Top 20 Items Table */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-4">Top 20 เมนูขายดี</h3>
        {data.top20.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">เมนู</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">จำนวนขาย</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">รายได้</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {data.top20.map((item: any, index: number) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatCurrency(item.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
        )}
      </div>

      {/* Bottom 10 Items Table */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-2">Bottom 10 เมนูขายน้อย</h3>
        <p className="text-sm text-gray-500 mb-4">พิจารณาปรับปรุงหรือถอดออกจากเมนู</p>
        {data.bottom10.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">เมนู</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">จำนวนขาย</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">รายได้</th>
                </tr>
              </thead>
              <tbody>
                {data.bottom10.map((item: any, index: number) => (
                  <tr key={index} className="border-t hover:bg-red-50/50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
}

// ===== Members Tab =====
function MembersTab({ data }: { data: any }) {
  const TIER_COLORS: Record<string, string> = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
  };

  const TIER_LABELS: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
  };

  const tierChartData = data.tierCount.map((t: any) => ({
    name: TIER_LABELS[t.tier] || t.tier,
    value: t.count,
    color: TIER_COLORS[t.tier] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="สมาชิกทั้งหมด" value={`${data.totalMembers} คน`} color="text-blue-600" />
        <StatCard title="สมาชิกใหม่เดือนนี้" value={`${data.newMembersThisMonth} คน`} color="text-green-600" />
        <StatCard title="แต้มทั้งหมดในระบบ" value={`${data.totalPoints.toLocaleString()} แต้ม`} color="text-purple-600" />
        <StatCard title="แต้มที่ใช้ไป" value={`${data.totalPointsUsed.toLocaleString()} แต้ม`} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-4">สัดส่วน Tier สมาชิก</h3>
          {tierChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierChartData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {tierChartData.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} คน`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* Top 10 Members Table */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-4">Top 10 สมาชิกแต้มสูงสุด</h3>
          {data.top10.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">ชื่อ</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Tier</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">แต้ม</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">โทร</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top10.map((m: any, index: number) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">{m.name}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                          backgroundColor: `${TIER_COLORS[m.tier]}20`,
                          color: TIER_COLORS[m.tier],
                        }}>
                          {TIER_LABELS[m.tier] || m.tier}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-purple-600">{m.points.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-500">{m.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">ไม่มีข้อมูล</p>
          )}
        </div>
      </div>
    </div>
  );
}
