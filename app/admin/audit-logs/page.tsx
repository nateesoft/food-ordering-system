'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, X, ChevronLeft, ChevronRight, Filter, RotateCcw, Clock, ArrowLeft, Activity } from 'lucide-react';
import { api, AuditLogEntry } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

type TabType = 'all' | 'timeline';

const ACTION_LABELS: Record<string, string> = {
  ORDER_CREATED: 'สร้างออเดอร์',
  ORDER_STATUS_CHANGED: 'เปลี่ยนสถานะออเดอร์',
  ORDER_CANCELLED: 'ยกเลิกออเดอร์',
  ORDER_ITEM_STATUS_CHANGED: 'เปลี่ยนสถานะรายการ',
  ORDER_SPLIT: 'แยกออเดอร์',
  PAYMENT_CREATED: 'ชำระเงิน',
  PAYMENT_MERGED: 'รวมชำระเงิน',
  PAYMENT_REFUNDED: 'คืนเงิน',
};

const ACTION_COLORS: Record<string, string> = {
  ORDER_CREATED: 'bg-green-100 text-green-800',
  ORDER_STATUS_CHANGED: 'bg-blue-100 text-blue-800',
  ORDER_CANCELLED: 'bg-red-100 text-red-800',
  ORDER_ITEM_STATUS_CHANGED: 'bg-blue-100 text-blue-800',
  ORDER_SPLIT: 'bg-amber-100 text-amber-800',
  PAYMENT_CREATED: 'bg-green-100 text-green-800',
  PAYMENT_MERGED: 'bg-amber-100 text-amber-800',
  PAYMENT_REFUNDED: 'bg-red-100 text-red-800',
};

const ENTITY_COLORS: Record<string, string> = {
  ORDER: 'bg-indigo-100 text-indigo-800',
  ORDER_ITEM: 'bg-purple-100 text-purple-800',
  PAYMENT: 'bg-emerald-100 text-emerald-800',
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getSummary(log: AuditLogEntry): string {
  const oldVal = log.oldValues;
  const newVal = log.newValues;

  if (log.action === 'ORDER_CREATED' && newVal) {
    return `${newVal.orderId} - ฿${newVal.totalAmount?.toLocaleString()} (${newVal.totalItems} รายการ)`;
  }
  if ((log.action === 'ORDER_STATUS_CHANGED' || log.action === 'ORDER_CANCELLED') && oldVal && newVal) {
    return `${oldVal.status} → ${newVal.status}`;
  }
  if (log.action === 'ORDER_ITEM_STATUS_CHANGED' && oldVal && newVal) {
    return `${oldVal.status} → ${newVal.status}`;
  }
  if (log.action === 'ORDER_SPLIT' && newVal?.splitInto) {
    return `แยกเป็น ${newVal.splitInto.length} ออเดอร์`;
  }
  if (log.action === 'PAYMENT_CREATED' && newVal) {
    return `${newVal.receiptNumber} - ฿${newVal.totalAmount?.toLocaleString()} (${newVal.paymentMethod})`;
  }
  if (log.action === 'PAYMENT_MERGED' && newVal) {
    return `${newVal.receiptNumber} - ฿${newVal.totalAmount?.toLocaleString()} (${newVal.mergedOrderIds?.length} ออเดอร์)`;
  }
  if (log.action === 'PAYMENT_REFUNDED') {
    return `คืนเงิน ฿${oldVal?.totalAmount?.toLocaleString() || '-'}`;
  }
  return '-';
}

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [stats, setStats] = useState<{ total: number; byAction: { action: string; count: number }[] } | null>(null);

  // Filters
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterPerformedBy, setFilterPerformedBy] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Timeline tab
  const [timelineEntityType, setTimelineEntityType] = useState('ORDER');
  const [timelineEntityId, setTimelineEntityId] = useState('');
  const [timelineLogs, setTimelineLogs] = useState<AuditLogEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await api.getAuditLogs({
        entityType: filterEntityType || undefined,
        action: filterAction || undefined,
        performedBy: filterPerformedBy || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        page,
        limit: 25,
      });
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filterEntityType, filterAction, filterPerformedBy, filterStartDate, filterEndDate]);

  const loadStats = useCallback(async () => {
    try {
      const result = await api.getAuditStats(filterStartDate || undefined, filterEndDate || undefined);
      setStats(result);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    if (activeTab === 'all') {
      loadLogs(1);
      loadStats();
    }
  }, [activeTab, loadLogs, loadStats]);

  const handleSearch = () => {
    loadLogs(1);
    loadStats();
  };

  const handleClearFilters = () => {
    setFilterEntityType('');
    setFilterAction('');
    setFilterPerformedBy('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleTimelineSearch = async () => {
    if (!timelineEntityId) return;
    setTimelineLoading(true);
    try {
      const result = await api.getAuditLogsByEntity(timelineEntityType, parseInt(timelineEntityId));
      setTimelineLogs(result);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const orderActions = stats?.byAction.filter(s =>
    s.action.startsWith('ORDER_')
  ).reduce((sum, s) => sum + s.count, 0) || 0;

  const paymentActions = stats?.byAction.filter(s =>
    s.action.startsWith('PAYMENT_')
  ).reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-slate-700 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Audit Logs</h1>
              <p className="text-gray-300">ติดตามประวัติการดำเนินการ ออเดอร์ และการชำระเงิน</p>
            </div>
          </div>
          <BranchSelector />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5">
              <p className="text-sm text-gray-500 mb-1">Log ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5">
              <p className="text-sm text-gray-500 mb-1">Order Actions</p>
              <p className="text-2xl font-bold text-indigo-600">{orderActions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5">
              <p className="text-sm text-gray-500 mb-1">Payment Actions</p>
              <p className="text-2xl font-bold text-emerald-600">{paymentActions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5">
              <p className="text-sm text-gray-500 mb-1">ประเภท Action</p>
              <p className="text-2xl font-bold text-amber-600">{stats.byAction.length}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'all' as TabType, label: 'ประวัติทั้งหมด', icon: FileText },
            { key: 'timeline' as TabType, label: 'ไทม์ไลน์', icon: Activity },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: All Logs */}
        {activeTab === 'all' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">ตัวกรอง</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">ทุกประเภท</option>
                  <option value="ORDER">ORDER</option>
                  <option value="ORDER_ITEM">ORDER_ITEM</option>
                  <option value="PAYMENT">PAYMENT</option>
                </select>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">ทุก Action</option>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="ผู้ดำเนินการ"
                  value={filterPerformedBy}
                  onChange={(e) => setFilterPerformedBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 transition"
                  >
                    <Search className="w-4 h-4" />
                    ค้นหา
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">กำลังโหลด...</div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มี Audit Log</h3>
                  <p className="text-gray-500">Log จะถูกบันทึกเมื่อมีการสร้าง/แก้ไขออเดอร์ หรือชำระเงิน</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">เวลา</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">ประเภท</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัสอ้างอิง</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">ผู้ดำเนินการ</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">สรุป</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => setSelectedLog(log)}
                          >
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(log.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                                {ACTION_LABELS[log.action] || log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ENTITY_COLORS[log.entityType] || 'bg-gray-100 text-gray-800'}`}>
                                {log.entityType}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-700">{log.entityRef || `#${log.entityId}`}</td>
                            <td className="px-4 py-3 text-gray-600">{log.performedBy || 'System'}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{getSummary(log)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                    <span className="text-sm text-gray-500">
                      แสดง {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => loadLogs(pagination.page - 1)}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-gray-700">
                        หน้า {pagination.page} / {pagination.totalPages}
                      </span>
                      <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => loadLogs(pagination.page + 1)}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Tab: Timeline */}
        {activeTab === 'timeline' && (
          <div>
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex items-center gap-3">
                <select
                  value={timelineEntityType}
                  onChange={(e) => setTimelineEntityType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="ORDER">ORDER</option>
                  <option value="ORDER_ITEM">ORDER_ITEM</option>
                  <option value="PAYMENT">PAYMENT</option>
                </select>
                <input
                  type="number"
                  placeholder="Entity ID"
                  value={timelineEntityId}
                  onChange={(e) => setTimelineEntityId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 w-32"
                />
                <button
                  onClick={handleTimelineSearch}
                  disabled={!timelineEntityId}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  <Search className="w-4 h-4" />
                  ค้นหา
                </button>
              </div>
            </div>

            {timelineLoading ? (
              <div className="text-center text-gray-500 py-12">กำลังโหลด...</div>
            ) : timelineLogs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีข้อมูล</h3>
                <p className="text-gray-500">กรุณาระบุ Entity Type และ ID เพื่อดูไทม์ไลน์</p>
              </div>
            ) : (
              <div className="space-y-0">
                {timelineLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        log.action.includes('CREATED') ? 'bg-green-500' :
                        log.action.includes('CANCELLED') || log.action.includes('REFUNDED') ? 'bg-red-500' :
                        log.action.includes('SPLIT') || log.action.includes('MERGED') ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      {idx < timelineLogs.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 min-h-[40px]" />
                      )}
                    </div>
                    {/* Content */}
                    <div
                      className="bg-white rounded-xl shadow-md p-4 mb-3 flex-1 cursor-pointer hover:shadow-lg transition"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                        {log.performedBy && (
                          <span className="text-xs text-gray-500">โดย {log.performedBy}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{getSummary(log)}</p>
                      {log.oldValues && log.newValues && (
                        <div className="mt-2 flex gap-4 text-xs">
                          <div className="bg-red-50 rounded px-2 py-1">
                            <span className="font-semibold text-red-600">Before: </span>
                            <span className="text-red-700">{JSON.stringify(log.oldValues)}</span>
                          </div>
                          <div className="bg-green-50 rounded px-2 py-1">
                            <span className="font-semibold text-green-600">After: </span>
                            <span className="text-green-700">{JSON.stringify(log.newValues)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Audit Log Detail</h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Header info */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-800'}`}>
                  {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ENTITY_COLORS[selectedLog.entityType] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedLog.entityType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500 font-semibold">เวลา</label>
                  <p className="text-gray-800">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-gray-500 font-semibold">ผู้ดำเนินการ</label>
                  <p className="text-gray-800">{selectedLog.performedBy || 'System'}</p>
                </div>
                <div>
                  <label className="text-gray-500 font-semibold">Entity ID</label>
                  <p className="text-gray-800">#{selectedLog.entityId}</p>
                </div>
                <div>
                  <label className="text-gray-500 font-semibold">รหัสอ้างอิง</label>
                  <p className="text-gray-800 font-mono">{selectedLog.entityRef || '-'}</p>
                </div>
              </div>

              {/* Old Values */}
              {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-red-600 mb-1 block">ค่าก่อนเปลี่ยน (Old Values)</label>
                  <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-x-auto text-red-800">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Values */}
              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-green-600 mb-1 block">ค่าหลังเปลี่ยน (New Values)</label>
                  <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs overflow-x-auto text-green-800">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">ข้อมูลเพิ่มเติม (Metadata)</label>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto text-gray-700">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
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
