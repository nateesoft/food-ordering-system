'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Edit2, Trash2, RefreshCw, X, Play, Eye, CheckCircle, XCircle, Clock, Copy, Search } from 'lucide-react';
import { api, WebhookEndpointResponse, WebhookDeliveryResponse, WebhookEventInfo, WebhookEvent } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

const EVENT_COLORS: Record<string, string> = {
  ORDER_CREATED: 'bg-blue-100 text-blue-800',
  ORDER_STATUS_CHANGED: 'bg-indigo-100 text-indigo-800',
  ORDER_CANCELLED: 'bg-red-100 text-red-800',
  PAYMENT_COMPLETED: 'bg-green-100 text-green-800',
  PAYMENT_REFUNDED: 'bg-orange-100 text-orange-800',
  QUEUE_CREATED: 'bg-purple-100 text-purple-800',
  QUEUE_STATUS_CHANGED: 'bg-violet-100 text-violet-800',
  MEMBER_REGISTERED: 'bg-teal-100 text-teal-800',
  SHIFT_OPENED: 'bg-cyan-100 text-cyan-800',
  SHIFT_CLOSED: 'bg-slate-100 text-slate-800',
  LOW_STOCK_ALERT: 'bg-amber-100 text-amber-800',
};

type TabType = 'webhooks' | 'deliveries';

const EMPTY_FORM = {
  name: '',
  url: '',
  events: [] as WebhookEvent[],
  isActive: true,
  description: '',
  headers: '',
};

export default function WebhooksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookEndpointResponse[]>([]);
  const [availableEvents, setAvailableEvents] = useState<WebhookEventInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpointResponse | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpointResponse | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryResponse[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Test
  const [testing, setTesting] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  // Secret display
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [wh, events] = await Promise.all([
        api.getWebhooks(),
        api.getWebhookEvents(),
      ]);
      setWebhooks(wh);
      setAvailableEvents(events);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingWebhook(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowFormModal(true);
  };

  const handleEdit = (webhook: WebhookEndpointResponse) => {
    setEditingWebhook(webhook);
    setForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      description: webhook.description || '',
      headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '',
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('กรุณากรอกชื่อ Webhook'); return; }
    if (!form.url.trim()) { setFormError('กรุณากรอก URL'); return; }
    if (form.events.length === 0) { setFormError('กรุณาเลือกอย่างน้อย 1 event'); return; }

    let headers: Record<string, string> | undefined;
    if (form.headers.trim()) {
      try {
        headers = JSON.parse(form.headers);
      } catch {
        setFormError('Headers ต้องเป็น JSON ที่ถูกต้อง');
        return;
      }
    }

    try {
      setSaving(true);
      const data = {
        name: form.name.trim(),
        url: form.url.trim(),
        events: form.events,
        isActive: form.isActive,
        description: form.description.trim() || undefined,
        headers,
      };

      if (editingWebhook) {
        await api.updateWebhook(editingWebhook.id, data);
      } else {
        const result = await api.createWebhook(data);
        // Show secret to user only on creation
        setCreatedSecret(result.secret);
        setShowSecretModal(true);
      }

      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบ Webhook นี้?')) return;
    try {
      await api.deleteWebhook(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const handleToggleActive = async (webhook: WebhookEndpointResponse) => {
    try {
      await api.updateWebhook(webhook.id, { isActive: !webhook.isActive });
      loadData();
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  const handleTest = async (id: number) => {
    try {
      setTesting(id);
      const result = await api.testWebhook(id);
      setTestResult(result);
      setShowTestResult(true);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
      setShowTestResult(true);
    } finally {
      setTesting(null);
    }
  };

  const handleViewDeliveries = async (webhook: WebhookEndpointResponse) => {
    setSelectedWebhook(webhook);
    setDeliveriesLoading(true);
    setShowDeliveryModal(true);
    try {
      const data = await api.getWebhookDeliveries(webhook.id, 50);
      setDeliveries(data);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const toggleEvent = (event: WebhookEvent) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Webhook className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-800">Webhooks</h1>
          </div>
          <div className="flex items-center gap-3">
            <BranchSelector onBranchChange={loadData} />
            <button onClick={loadData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === 'webhooks' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Endpoints ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === 'deliveries' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Delivery Logs
          </button>
        </div>

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">จัดการ webhook endpoints สำหรับ integrate กับระบบอื่น</p>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                เพิ่ม Webhook
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">ยังไม่มี Webhook</p>
                <p className="text-sm text-gray-400 mt-1">สร้าง webhook เพื่อเชื่อมต่อกับระบบอื่น</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800">{webhook.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono mb-2">{webhook.url}</p>
                        {webhook.description && (
                          <p className="text-sm text-gray-400 mb-2">{webhook.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${EVENT_COLORS[event] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Secret: {webhook.secret}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleTest(webhook.id)}
                          disabled={testing === webhook.id}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                          title="ทดสอบ"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDeliveries(webhook)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Delivery Logs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(webhook)}
                          className={`p-2 rounded-lg ${
                            webhook.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={webhook.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        >
                          {webhook.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(webhook)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deliveries Tab (overview across all webhooks) */}
        {activeTab === 'deliveries' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">เลือก webhook เพื่อดู delivery logs</p>
            {webhooks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <p className="text-gray-500">ยังไม่มี Webhook</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {webhooks.map((webhook) => (
                  <button
                    key={webhook.id}
                    onClick={() => handleViewDeliveries(webhook)}
                    className="bg-white rounded-xl border p-4 text-left hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{webhook.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{webhook.url}</p>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editingWebhook ? 'แก้ไข Webhook' : 'สร้าง Webhook ใหม่'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Webhook</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="เช่น Kitchen Display System"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <label
                      key={event.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${
                        form.events.includes(event.value)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded text-indigo-600"
                      />
                      <span className="truncate">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="เช่น ส่งข้อมูลออร์เดอร์ไปยัง KDS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Headers (JSON, ไม่บังคับ)</label>
                <textarea
                  value={form.headers}
                  onChange={(e) => setForm({ ...form, headers: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  rows={3}
                  placeholder='{"Authorization": "Bearer token123"}'
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">เปิดใช้งาน</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : editingWebhook ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Modal (shown after creation) */}
      {showSecretModal && createdSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Webhook Secret</h2>
              <p className="text-sm text-gray-500 mb-4">
                กรุณาคัดลอก secret นี้เก็บไว้ จะแสดงเพียงครั้งเดียวเท่านั้น ใช้สำหรับ verify HMAC-SHA256 signature
              </p>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                <code className="flex-1 text-sm font-mono break-all">{createdSecret}</code>
                <button
                  onClick={() => copyToClipboard(createdSecret)}
                  className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0"
                  title="คัดลอก"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end p-5 border-t">
              <button
                onClick={() => { setShowSecretModal(false); setCreatedSecret(null); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Modal */}
      {showTestResult && testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">ผลการทดสอบ</h2>
              <button onClick={() => setShowTestResult(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.success ? 'สำเร็จ' : 'ล้มเหลว'}
                </span>
              </div>
              {testResult.responseStatus && (
                <div className="text-sm">
                  <span className="text-gray-500">HTTP Status:</span>{' '}
                  <span className="font-mono">{testResult.responseStatus}</span>
                </div>
              )}
              {testResult.duration !== null && (
                <div className="text-sm">
                  <span className="text-gray-500">Duration:</span>{' '}
                  <span className="font-mono">{testResult.duration}ms</span>
                </div>
              )}
              {testResult.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-mono break-all">
                  {testResult.error}
                </div>
              )}
              {testResult.responseBody && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Response:</p>
                  <pre className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-auto max-h-40">
                    {testResult.responseBody}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end p-5 border-t">
              <button
                onClick={() => setShowTestResult(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Logs Modal */}
      {showDeliveryModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold">Delivery Logs</h2>
                <p className="text-sm text-gray-500">{selectedWebhook.name}</p>
              </div>
              <button onClick={() => setShowDeliveryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {deliveriesLoading ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
              ) : deliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">ยังไม่มี delivery logs</div>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {delivery.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${EVENT_COLORS[delivery.event] || 'bg-gray-100 text-gray-600'}`}>
                            {delivery.event}
                          </span>
                          {delivery.responseStatus && (
                            <span className={`text-xs font-mono ${delivery.success ? 'text-green-600' : 'text-red-600'}`}>
                              {delivery.responseStatus}
                            </span>
                          )}
                          {delivery.duration !== null && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {delivery.duration}ms
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(delivery.createdAt)}</span>
                      </div>
                      {delivery.error && (
                        <p className="text-xs text-red-600 font-mono mt-1">{delivery.error}</p>
                      )}
                      {delivery.attempts > 1 && (
                        <p className="text-xs text-gray-400 mt-1">Attempts: {delivery.attempts}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
