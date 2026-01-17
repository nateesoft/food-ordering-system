'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { QueueTicket } from '@/types';

export default function QueueDisplayPage() {
  const [queues, setQueues] = useState<QueueTicket[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAnimation, setShowAnimation] = useState(false);
  const [calledQueue, setCalledQueue] = useState<string | null>(null);

  // Load queues from localStorage
  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

      // Check for newly ready queues
      const newlyReady = queuesWithDates.find(
        (q: QueueTicket) => q.status === 'ready' && !queues.find(old => old.queueId === q.queueId && old.status === 'ready')
      );

      if (newlyReady) {
        setCalledQueue(newlyReady.queueId);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 5000);
      }

      setQueues(queuesWithDates);
    }
  };

  const readyQueues = queues.filter(q => q.status === 'ready');
  const preparingQueues = queues.filter(q => q.status === 'preparing');
  const waitingQueues = queues.filter(q => q.status === 'waiting');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold mb-2 flex items-center gap-4">
              🍽️ ระบบคิวอาหาร
            </h1>
            <p className="text-3xl text-purple-200">Queue Display System</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">
              {currentTime.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="text-2xl text-purple-200 mt-2">
              {currentTime.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Animation Overlay */}
      {showAnimation && calledQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-center animate-scale-up">
            <div className="mb-8 animate-bounce">
              <Bell className="w-40 h-40 text-yellow-400 mx-auto drop-shadow-2xl" />
            </div>
            <h2 className="text-8xl font-bold mb-8 text-yellow-400 drop-shadow-2xl animate-pulse">
              เรียกคิว
            </h2>
            <div className="text-[12rem] font-bold text-white drop-shadow-2xl mb-8">
              {calledQueue}
            </div>
            <p className="text-6xl text-yellow-200 drop-shadow-lg">
              กรุณามารับอาหารที่เคาน์เตอร์
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8">
          {/* Ready Queues */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-500 p-4 rounded-2xl">
                <Bell className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-5xl font-bold">พร้อมเสิร์ฟ</h2>
                <p className="text-2xl text-green-300">Ready to Serve ({readyQueues.length})</p>
              </div>
            </div>

            {readyQueues.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center">
                <p className="text-3xl text-gray-300">ยังไม่มีคิวที่พร้อมเสิร์ฟ</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {readyQueues.map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-center shadow-2xl animate-pulse-slow border-4 border-white"
                  >
                    <div className="text-8xl font-bold mb-4 drop-shadow-lg">
                      {queue.queueId}
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      {queue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 กลับบ้าน'}
                    </p>
                    <p className="text-xl opacity-90">
                      {queue.totalItems} รายการ
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preparing Queues */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-500 p-4 rounded-2xl">
                <Clock className="w-12 h-12 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-5xl font-bold">กำลังเตรียม</h2>
                <p className="text-2xl text-blue-300">Preparing ({preparingQueues.length})</p>
              </div>
            </div>

            {preparingQueues.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
                <p className="text-2xl text-gray-300">ไม่มีคิวที่กำลังเตรียม</p>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {preparingQueues.slice(0, 12).map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-6 text-center shadow-xl border-2 border-blue-300"
                  >
                    <div className="text-5xl font-bold mb-2">
                      {queue.queueId}
                    </div>
                    <p className="text-base opacity-90">
                      {queue.orderType === 'dine-in' ? '🏠' : '📦'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiting Queues */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-yellow-500 p-4 rounded-2xl">
                <Clock className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-5xl font-bold">รอดำเนินการ</h2>
                <p className="text-2xl text-yellow-300">Waiting ({waitingQueues.length})</p>
              </div>
            </div>

            {waitingQueues.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
                <p className="text-2xl text-gray-300">ไม่มีคิวรอดำเนินการ</p>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-3">
                {waitingQueues.slice(0, 16).map(queue => (
                  <div
                    key={queue.queueId}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-center shadow-lg border-2 border-yellow-300"
                  >
                    <div className="text-3xl font-bold mb-1">
                      {queue.queueId}
                    </div>
                    <p className="text-xs opacity-90">
                      {queue.orderType === 'dine-in' ? '🏠' : '📦'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-6 text-center">
        <p className="text-3xl font-bold text-yellow-300">
          กรุณาสังเกตหมายเลขคิวของท่านบนจอ
        </p>
        <p className="text-xl text-gray-300 mt-2">
          Please check your queue number on the screen
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-up {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-up {
          animation: scale-up 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
