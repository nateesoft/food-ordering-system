'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/lib/hooks/useSocket';
import { useKDSUpdates } from '@/lib/hooks/useKDSUpdates';
import KDSOrderCard from './components/KDSOrderCard';

export default function KDSPage({ params }: { params: { branchId: string } }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { isConnected } = useSocket();

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getKDSOrders(selectedStation || undefined);
      setOrders(data || []);
    } catch { /* ignore */ }
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      const data = await api.getKDSStations();
      setStations(data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  // Real-time updates via WebSocket
  useKDSUpdates({
    onNewOrder: useCallback(() => {
      loadOrders();
      playAlert();
    }, [loadOrders]),
    onOrderStatusChanged: useCallback(() => loadOrders(), [loadOrders]),
    onOrderCancelled: useCallback(() => loadOrders(), [loadOrders]),
    onItemStatusChanged: useCallback(() => loadOrders(), [loadOrders]),
  });

  // Fallback polling (in case WebSocket disconnects)
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [isConnected, loadOrders]);

  // Audio alert
  const playAlert = () => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 250);
    } catch { /* audio not available */ }
  };

  const handleBumpItem = async (orderId: number, itemId: number) => {
    try {
      await api.bumpKDSItem(orderId, itemId, 'COMPLETED');
      loadOrders();
    } catch { /* ignore */ }
  };

  const handleBumpAll = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const pendingItems = order.items?.filter((i: any) => i.status !== 'COMPLETED') || [];
    for (const item of pendingItems) {
      try {
        await api.bumpKDSItem(orderId, item.id, 'COMPLETED');
      } catch { /* ignore */ }
    }
    loadOrders();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Group orders by status
  const waitingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const alertTimeout = selectedStation
    ? stations.find((s) => s.id === selectedStation)?.alertTimeout || 300
    : 300;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">KDS</h1>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Polling'}</span>
          </div>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStation(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              !selectedStation ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {stations.map((station) => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedStation === station.id ? 'text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              style={selectedStation === station.id ? { backgroundColor: station.color } : undefined}
            >
              {station.name}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg ${audioEnabled ? 'text-green-400' : 'text-gray-500'}`}
            title={audioEnabled ? 'Sound ON' : 'Sound OFF'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {audioEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              )}
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-gray-400 hover:text-white"
            title="Fullscreen (F11)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={loadOrders}
            className="p-2 rounded-lg text-gray-400 hover:text-white"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800/50 px-4 py-2 flex items-center gap-6 text-sm border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">Waiting:</span>
          <span className="font-bold text-yellow-400">{waitingOrders.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-400">Preparing:</span>
          <span className="font-bold text-blue-400">{preparingOrders.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400">Ready:</span>
          <span className="font-bold text-green-400">{completedOrders.length}</span>
        </div>
        <div className="text-gray-500">|</div>
        <div className="text-gray-400">
          Total: <span className="font-bold text-white">{orders.length}</span>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 p-4 h-[calc(100vh-120px)] overflow-hidden">
          {/* Waiting Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <h2 className="text-lg font-bold text-yellow-400">Waiting</h2>
              <span className="ml-auto bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {waitingOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {waitingOrders.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  alertTimeout={alertTimeout}
                  onBumpItem={handleBumpItem}
                  onBumpAll={handleBumpAll}
                />
              ))}
              {waitingOrders.length === 0 && (
                <div className="text-center text-gray-500 py-8">No orders</div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-lg font-bold text-blue-400">Preparing</h2>
              <span className="ml-auto bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {preparingOrders.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  alertTimeout={alertTimeout}
                  onBumpItem={handleBumpItem}
                  onBumpAll={handleBumpAll}
                />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center text-gray-500 py-8">No orders</div>
              )}
            </div>
          </div>

          {/* Completed/Ready Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <h2 className="text-lg font-bold text-green-400">Ready</h2>
              <span className="ml-auto bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {completedOrders.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {completedOrders.map((order) => (
                <KDSOrderCard
                  key={order.id}
                  order={order}
                  alertTimeout={alertTimeout}
                  onBumpItem={handleBumpItem}
                  onBumpAll={handleBumpAll}
                />
              ))}
              {completedOrders.length === 0 && (
                <div className="text-center text-gray-500 py-8">No orders</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
