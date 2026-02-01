'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, Users, TrendingUp, Package, Home, RefreshCw, Eye } from 'lucide-react';
import { QueueTicket } from '@/types';

export default function KioskDashboard() {
  const [queues, setQueues] = useState<QueueTicket[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    avgWaitTime: 0,
    dineInCount: 0,
    takeawayCount: 0
  });

  // Load queues from localStorage
  useEffect(() => {
    loadQueues();

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queueTickets') {
        loadQueues();
      }
    };

    // Listen for custom events from same tab
    const handleQueueUpdate = (e: Event) => {
      loadQueues();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('queueUpdated', handleQueueUpdate);

    // Fallback polling every 2 seconds
    const interval = setInterval(loadQueues, 2000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('queueUpdated', handleQueueUpdate);
    };
  }, []);

  const loadQueues = () => {
    const stored = localStorage.getItem('queueTickets');
    if (stored) {
      const parsed = JSON.parse(stored);
      const queuesWithDates = parsed.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        calledAt: q.calledAt ? new Date(q.calledAt) : undefined,
        completedAt: q.completedAt ? new Date(q.completedAt) : undefined,
      }));
      setQueues(queuesWithDates);

      // Calculate stats
      const today = new Date().setHours(0, 0, 0, 0);
      const todayQueues = queuesWithDates.filter((q: QueueTicket) =>
        new Date(q.createdAt).setHours(0, 0, 0, 0) === today
      );

      const completedQueues = todayQueues.filter((q: QueueTicket) => q.status === 'completed');
      const avgTime = completedQueues.length > 0
        ? completedQueues.reduce((sum: number, q: QueueTicket) => {
            if (q.completedAt && q.createdAt) {
              return sum + (q.completedAt.getTime() - q.createdAt.getTime());
            }
            return sum;
          }, 0) / completedQueues.length / 60000 // Convert to minutes
        : 0;

      setStats({
        totalToday: todayQueues.length,
        avgWaitTime: Math.round(avgTime),
        dineInCount: todayQueues.filter((q: QueueTicket) => q.orderType === 'dine-in').length,
        takeawayCount: todayQueues.filter((q: QueueTicket) => q.orderType === 'takeaway').length,
      });
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

    // Dispatch custom event for same-tab listening
    window.dispatchEvent(new CustomEvent('queueUpdated', { detail: updatedQueues }));
  };

  // Group queues by status
  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const preparingQueues = queues.filter(q => q.status === 'preparing');
  const readyQueues = queues.filter(q => q.status === 'ready');

  const getTimeSinceCreated = (createdAt: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - createdAt.getTime()) / 60000); // minutes
    if (diff < 1) return 'เพิ่งสั่ง';
    if (diff < 60) return `${diff} นาที`;
    const hours = Math.floor(diff / 60);
    return `${hours} ชม.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 shadow-2xl sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-2 flex items-center gap-3">
                <ChefHat className="w-12 h-12" />
                Kitchen Dashboard
              </h1>
              <p className="text-xl text-slate-300">ระบบจัดการคิวอาหาร • Queue Management</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadQueues}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                รีเฟรช
              </button>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {new Date().toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-sm text-slate-300">
                  {new Date().toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">ออเดอร์วันนี้</p>
                  <p className="text-4xl font-bold">{stats.totalToday}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">เวลารอเฉลี่ย</p>
                  <p className="text-4xl font-bold">{stats.avgWaitTime}<span className="text-xl ml-1">นาที</span></p>
                </div>
                <Clock className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">ทานที่ร้าน</p>
                  <p className="text-4xl font-bold">{stats.dineInCount}</p>
                </div>
                <Home className="w-10 h-10 text-orange-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">กลับบ้าน</p>
                  <p className="text-4xl font-bold">{stats.takeawayCount}</p>
                </div>
                <Package className="w-10 h-10 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Lane 1: Waiting */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  <div>
                    <h2 className="text-2xl font-bold">รอทำอาหาร</h2>
                    <p className="text-sm text-yellow-100">Waiting</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold">{waitingQueues.length}</span>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-b-2xl p-4 flex-1 overflow-y-auto space-y-3">
              {waitingQueues.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-yellow-300 mx-auto mb-3" />
                  <p className="text-xl text-yellow-600">ไม่มีคิวรอ</p>
                </div>
              ) : (
                waitingQueues.map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-l-4 border-yellow-500 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-3xl font-bold text-gray-800">{queue.queueId}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            queue.orderType === 'dine-in'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 กลับบ้าน'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {getTimeSinceCreated(queue.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">จำนวน</p>
                        <p className="text-xl font-bold text-gray-800">{queue.totalItems} รายการ</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto">
                      {queue.items.slice(0, 3).map((item, idx) => (
                        <div key={item.cartItemId} className="text-sm text-gray-700 flex justify-between">
                          <span>• {item.name} x{item.quantity}</span>
                        </div>
                      ))}
                      {queue.items.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">+{queue.items.length - 3} รายการ</p>
                      )}
                    </div>

                    <button
                      onClick={() => updateQueueStatus(queue.queueId, 'preparing')}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <ChefHat className="w-5 h-5" />
                      เริ่มทำอาหาร
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lane 2: Preparing */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-6 h-6 animate-pulse" />
                  <div>
                    <h2 className="text-2xl font-bold">กำลังทำ</h2>
                    <p className="text-sm text-blue-100">Preparing</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold">{preparingQueues.length}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-b-2xl p-4 flex-1 overflow-y-auto space-y-3">
              {preparingQueues.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="w-16 h-16 text-blue-300 mx-auto mb-3" />
                  <p className="text-xl text-blue-600">ไม่มีคิวกำลังทำ</p>
                </div>
              ) : (
                preparingQueues.map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-3xl font-bold text-gray-800">{queue.queueId}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            queue.orderType === 'dine-in'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 กลับบ้าน'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {getTimeSinceCreated(queue.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">จำนวน</p>
                        <p className="text-xl font-bold text-gray-800">{queue.totalItems} รายการ</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto">
                      {queue.items.slice(0, 3).map((item, idx) => (
                        <div key={item.cartItemId} className="text-sm text-gray-700 flex justify-between">
                          <span>• {item.name} x{item.quantity}</span>
                        </div>
                      ))}
                      {queue.items.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">+{queue.items.length - 3} รายการ</p>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full animate-progress"></div>
                      </div>
                    </div>

                    <button
                      onClick={() => updateQueueStatus(queue.queueId, 'ready')}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      เสร็จแล้ว - เรียกคิว
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lane 3: Ready */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  <div>
                    <h2 className="text-2xl font-bold">นำมาเสิร์ฟแล้ว</h2>
                    <p className="text-sm text-green-100">Ready to Serve</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold">{readyQueues.length}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-b-2xl p-4 flex-1 overflow-y-auto space-y-3">
              {readyQueues.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-3" />
                  <p className="text-xl text-green-600">ไม่มีคิวพร้อมเสิร์ฟ</p>
                </div>
              ) : (
                readyQueues.map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-l-4 border-green-500 p-4 animate-pulse-slow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-3xl font-bold text-gray-800">{queue.queueId}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            queue.orderType === 'dine-in'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 กลับบ้าน'}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          พร้อมเสิร์ฟ!
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">จำนวน</p>
                        <p className="text-xl font-bold text-gray-800">{queue.totalItems} รายการ</p>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto border-2 border-green-200">
                      {queue.items.slice(0, 3).map((item, idx) => (
                        <div key={item.cartItemId} className="text-sm text-gray-700 flex justify-between">
                          <span>✓ {item.name} x{item.quantity}</span>
                        </div>
                      ))}
                      {queue.items.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">+{queue.items.length - 3} รายการ</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateQueueStatus(queue.queueId, 'completed')}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        เสร็จสิ้น
                      </button>
                      <a
                        href="/kiosk/display"
                        target="_blank"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        ดูจอแสดงผล
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .animate-progress {
          animation: progress 15s linear infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
