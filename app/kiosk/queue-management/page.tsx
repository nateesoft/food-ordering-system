'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Bell } from 'lucide-react';
import { QueueTicket } from '@/types';

export default function QueueManagementPage() {
  const [queues, setQueues] = useState<QueueTicket[]>([]);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'preparing' | 'ready'>('all');

  // Load queues from localStorage
  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueues = () => {
    const stored = localStorage.getItem('queueTickets');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      const queuesWithDates = parsed.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        calledAt: q.calledAt ? new Date(q.calledAt) : undefined,
        completedAt: q.completedAt ? new Date(q.completedAt) : undefined,
      }));
      setQueues(queuesWithDates);
    }
  };

  const updateQueueStatus = (queueId: string, newStatus: QueueTicket['status']) => {
    const updatedQueues = queues.map(q => {
      if (q.queueId === queueId) {
        const updated = { ...q, status: newStatus };
        if (newStatus === 'ready') {
          updated.calledAt = new Date();
        } else if (newStatus === 'completed') {
          updated.completedAt = new Date();
        }
        return updated;
      }
      return q;
    });

    setQueues(updatedQueues);
    localStorage.setItem('queueTickets', JSON.stringify(updatedQueues));
  };

  const deleteQueue = (queueId: string) => {
    const updatedQueues = queues.filter(q => q.queueId !== queueId);
    setQueues(updatedQueues);
    localStorage.setItem('queueTickets', JSON.stringify(updatedQueues));
  };

  const getStatusColor = (status: QueueTicket['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: QueueTicket['status']) => {
    switch (status) {
      case 'waiting':
        return 'รอดำเนินการ';
      case 'preparing':
        return 'กำลังเตรียม';
      case 'ready':
        return 'พร้อมเสิร์ฟ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  const filteredQueues = filter === 'all'
    ? queues.filter(q => q.status !== 'completed' && q.status !== 'cancelled')
    : queues.filter(q => q.status === filter);

  const waitingCount = queues.filter(q => q.status === 'waiting').length;
  const preparingCount = queues.filter(q => q.status === 'preparing').length;
  const readyCount = queues.filter(q => q.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📋 จัดการคิว</h1>
              <p className="text-xl text-indigo-100">Queue Management System</p>
            </div>
            <button
              onClick={loadQueues}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transform transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              รีเฟรช
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">รอดำเนินการ</p>
                  <p className="text-3xl font-bold">{waitingCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">กำลังเตรียม</p>
                  <p className="text-3xl font-bold">{preparingCount}</p>
                </div>
                <RefreshCw className="w-10 h-10 text-blue-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">พร้อมเสิร์ฟ</p>
                  <p className="text-3xl font-bold">{readyCount}</p>
                </div>
                <Bell className="w-10 h-10 text-green-300 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-4 mb-6">
          {['all', 'waiting', 'preparing', 'ready'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' : getStatusText(f as any)}
            </button>
          ))}
        </div>

        {/* Queue List */}
        {filteredQueues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Clock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-500">ไม่มีคิวในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQueues.map(queue => (
              <div
                key={queue.queueId}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                {/* Queue Header */}
                <div className={`p-6 border-l-8 ${
                  queue.status === 'waiting' ? 'border-yellow-500' :
                  queue.status === 'preparing' ? 'border-blue-500' :
                  queue.status === 'ready' ? 'border-green-500' : 'border-gray-500'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-4xl font-bold text-gray-800">{queue.queueId}</h3>
                        <span className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(queue.status)}`}>
                          {getStatusText(queue.status)}
                        </span>
                      </div>
                      <p className="text-lg text-gray-600 mt-2">
                        {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(queue.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {queue.totalItems} รายการ
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {queue.items.map((item, idx) => (
                        <div key={item.cartItemId} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {idx + 1}. {item.name} x{item.quantity}
                          </span>
                          <span className="font-bold text-gray-800">
                            ฿{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-300 mt-3 pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-800">ยอดรวม</span>
                        <span className="text-orange-600">฿{queue.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {queue.status === 'waiting' && (
                      <button
                        onClick={() => updateQueueStatus(queue.queueId, 'preparing')}
                        className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                      >
                        เริ่มเตรียม
                      </button>
                    )}
                    {queue.status === 'preparing' && (
                      <button
                        onClick={() => updateQueueStatus(queue.queueId, 'ready')}
                        className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Bell className="w-5 h-5" />
                        เรียกคิว
                      </button>
                    )}
                    {queue.status === 'ready' && (
                      <button
                        onClick={() => updateQueueStatus(queue.queueId, 'completed')}
                        className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        เสร็จสิ้น
                      </button>
                    )}
                    <button
                      onClick={() => updateQueueStatus(queue.queueId, 'cancelled')}
                      className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
