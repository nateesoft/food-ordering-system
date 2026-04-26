'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, LogOut, Clock, CheckCircle, Truck, User, ChevronDown, ChevronUp, Bell, BellRing, Utensils, CreditCard, Users, QrCode, Settings, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, OrderResponse, ServiceRequestResponse } from '@/lib/api';
import BranchSelector from '@/components/BranchSelector';

interface StaffUser {
  pin: string;
  name: string;
  role: 'chef' | 'staff' | 'admin';
}

interface CartItem {
  id: number;
  dbId: number;
  name: string;
  price: number;
  quantity: number;
  cartItemId: string;
  specialInstructions?: string;
  diningOption: 'dine-in' | 'takeaway';
  itemStatus?: 'preparing' | 'completed' | 'delivered';
}

interface Order {
  dbId: number;
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  orderDate: Date;
  status: 'preparing' | 'completed' | 'delivered';
  branchId?: string;
  tableNumber?: string;
}

interface ServiceRequest {
  id: string;
  type: 'staff' | 'utensils' | 'payment';
  timestamp: Date;
  details?: string;
  items?: string[];
  status: 'pending' | 'completed';
  branchId?: string;
  tableNumber?: string;
}

// Mock users
const MOCK_USERS: StaffUser[] = [
  { pin: '1234', name: 'พ่อครัวหลัก', role: 'chef' },
  { pin: '2345', name: 'พนักงาน 1', role: 'staff' },
  { pin: '9999', name: 'Admin', role: 'admin' },
];

export default function OrdersPage({ params }: { params: { branchId: string } }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const isUpdatingRef = React.useRef(false);

  useEffect(() => {
    const authData = localStorage.getItem('staff_auth');
    if (authData) {
      const { user, expiry } = JSON.parse(authData);
      if (Date.now() < expiry) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadOrders();
        loadServiceRequests();
      } else {
        localStorage.removeItem('staff_auth');
      }
    }
  }, []);

  // Poll for new orders and service requests every 3 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!isUpdatingRef.current) {
        loadOrders();
      }
      loadServiceRequests();
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      // Fetch orders and menu items from API in parallel
      const [apiOrders, menuItems] = await Promise.all([
        api.getAllOrders(),
        api.getMenuItems(),
      ]);

      // Create a map of menuItemId to name for quick lookup
      const menuNameMap = new Map(menuItems.map(item => [item.id, item.name]));

      // Transform API orders to match local Order interface
      const transformedOrders: Order[] = apiOrders.map((apiOrder: OrderResponse) => {
        const items = Array.isArray(apiOrder.items) ? apiOrder.items : [];
        return {
          dbId: apiOrder.id,
          orderId: apiOrder.orderId,
          branchId: apiOrder.branchId,
          tableNumber: apiOrder.tableNumber,
          totalAmount: apiOrder.totalAmount,
          totalItems: apiOrder.totalItems,
          orderDate: new Date(apiOrder.createdAt),
          status: (apiOrder.status?.toLowerCase() || 'preparing') as 'preparing' | 'completed' | 'delivered',
          items: items.map((item: any, index: number) => ({
            dbId: item.id,
            id: item.menuItemId || item.id || index,
            name: item.menuItem?.name || item.name || menuNameMap.get(item.menuItemId) || `เมนู #${item.menuItemId || index + 1}`,
            price: item.price || 0,
            quantity: item.quantity || 1,
            cartItemId: item.cartItemId || `${apiOrder.orderId}-${index}`,
            specialInstructions: item.specialInstructions,
            diningOption: item.diningOption || 'dine-in',
            itemStatus: (item.status || item.itemStatus || 'preparing').toLowerCase(),
          })),
        };
      });

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Failed to load orders from API:', error);
    }
  };

  const loadServiceRequests = async () => {
    try {
      const apiRequests = await api.getPendingServiceRequests();
      const transformed: ServiceRequest[] = apiRequests.map((req: ServiceRequestResponse) => ({
        id: String(req.id),
        type: req.type.toLowerCase() as 'staff' | 'utensils' | 'payment',
        timestamp: new Date(req.createdAt),
        details: req.details || undefined,
        items: req.items?.length ? req.items : undefined,
        status: req.status === 'PENDING' ? 'pending' as const : 'completed' as const,
        branchId: req.branchId || undefined,
        tableNumber: req.tableNumber || undefined,
      }));
      setServiceRequests(transformed);

      const pendingCount = transformed.filter(req => req.status === 'pending').length;
      if (pendingCount > unreadCount && unreadCount !== 0) {
        playNotificationSound();
      }
      setUnreadCount(pendingCount);
    } catch (error) {
      console.error('Failed to load service requests from API:', error);
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not available');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = (pinCode: string) => {
    const user = MOCK_USERS.find(u => u.pin === pinCode);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setError('');
      const authData = {
        user,
        expiry: Date.now() + (8 * 60 * 60 * 1000),
      };
      localStorage.setItem('staff_auth', JSON.stringify(authData));
      loadOrders();
    } else {
      setError('รหัส PIN ไม่ถูกต้อง');
      setPin('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_auth');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPin('');
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const computeOrderStatus = (items: CartItem[]): 'preparing' | 'completed' | 'delivered' => {
    const allDelivered = items.every(i => i.itemStatus === 'delivered');
    const allCompleted = items.every(i => i.itemStatus === 'completed' || i.itemStatus === 'delivered');
    if (allDelivered) return 'delivered';
    if (allCompleted) return 'completed';
    return 'preparing';
  };

  const updateItemStatus = async (orderId: string, cartItemId: string, newStatus: 'preparing' | 'completed' | 'delivered') => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const item = order.items.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    // Optimistic update — update UI immediately
    const updatedItems = order.items.map(i =>
      i.cartItemId === cartItemId ? { ...i, itemStatus: newStatus } : i
    );
    const newOrderStatus = computeOrderStatus(updatedItems);

    setOrders(prev => prev.map(o =>
      o.orderId === orderId
        ? { ...o, items: updatedItems, status: newOrderStatus }
        : o
    ));

    // Sync with API in background
    isUpdatingRef.current = true;
    try {
      await api.updateOrderItemStatus(order.dbId, item.dbId, newStatus);
      if (newOrderStatus !== order.status) {
        await api.updateOrderStatus(order.dbId, newOrderStatus.toUpperCase() as 'PREPARING' | 'COMPLETED' | 'DELIVERED');
      }
    } catch (error) {
      console.error('Failed to update item status:', error);
      await loadOrders();
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const updateAllItemsStatus = async (orderId: string, newStatus: 'preparing' | 'completed' | 'delivered') => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    // Optimistic update — update UI immediately
    const updatedItems = order.items.map(item => ({ ...item, itemStatus: newStatus }));

    setOrders(prev => prev.map(o =>
      o.orderId === orderId
        ? { ...o, items: updatedItems, status: newStatus }
        : o
    ));

    // Sync with API in background
    isUpdatingRef.current = true;
    try {
      await Promise.all(
        order.items.map(item =>
          api.updateOrderItemStatus(order.dbId, item.dbId, newStatus)
        )
      );
      await api.updateOrderStatus(order.dbId, newStatus.toUpperCase() as 'PREPARING' | 'COMPLETED' | 'DELIVERED');
    } catch (error) {
      console.error('Failed to update all items status:', error);
      await loadOrders();
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'delivered':
        return <Truck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'กำลังเตรียม';
      case 'completed':
        return 'เสร็จแล้ว';
      case 'delivered':
        return 'ส่งแล้ว';
      default:
        return '';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chef':
        return 'bg-orange-500';
      case 'staff':
        return 'bg-blue-500';
      case 'admin':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const markRequestAsCompleted = async (requestId: string) => {
    const request = serviceRequests.find(req => req.id === requestId);

    try {
      await api.updateServiceRequestStatus(Number(requestId), 'COMPLETED');
    } catch (err) {
      console.error('Failed to update service request status:', err);
    }

    // Update local state immediately (remove from pending list)
    const updatedRequests = serviceRequests.filter(req => req.id !== requestId);
    setServiceRequests(updatedRequests);
    setUnreadCount(updatedRequests.filter(req => req.status === 'pending').length);

    // If this is a payment request, clear those table orders from local state
    if (request && request.type === 'payment' && request.tableNumber) {
      const updatedOrders = orders.filter(order => order.tableNumber !== request.tableNumber);
      setOrders(updatedOrders);
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'staff':
        return <Users className="w-5 h-5" />;
      case 'utensils':
        return <Utensils className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getRequestLabel = (type: string) => {
    switch (type) {
      case 'staff':
        return 'เรียกพนักงาน';
      case 'utensils':
        return 'ขอเครื่องใช้';
      case 'payment':
        return 'ขอชำระเงิน';
      default:
        return 'อื่นๆ';
    }
  };

  const getWaitingMinutesForOrder = (orderDate: Date) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    return Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
  };

  const getEmotionForItem = (orderDate: Date, itemStatus?: 'preparing' | 'completed' | 'delivered') => {
    if (itemStatus === 'delivered') {
      return null; // Don't show emotion for delivered items
    }

    const waitingMinutes = getWaitingMinutesForOrder(orderDate);

    if (waitingMinutes <= 5) {
      return { emoji: '😊', color: 'text-green-600' };
    } else if (waitingMinutes <= 10) {
      return { emoji: '😐', color: 'text-yellow-600' };
    } else if (waitingMinutes <= 20) {
      return { emoji: '😕', color: 'text-orange-600' };
    } else if (waitingMinutes <= 30) {
      return { emoji: '😤', color: 'text-red-600' };
    } else {
      return { emoji: '😡', color: 'text-red-700' };
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
              <ChefHat className="w-12 h-12 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ระบบจัดการออเดอร์</h1>
            <p className="text-gray-600">กรุณาใส่รหัส PIN 4 หลัก</p>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${
                  pin.length > index
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {pin.length > index ? '●' : '○'}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="p-4 text-lg font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all"
            >
              ลบ
            </button>
            <button
              onClick={() => handlePinInput('0')}
              className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              0
            </button>
            <button
              onClick={() => router.push('/')}
              className="p-4 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
            >
              กลับ
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-semibold mb-2">รหัส PIN ทดสอบ:</p>
            <p>• พ่อครัว: 1234</p>
            <p>• พนักงาน: 2345</p>
            <p>• Admin: 9999</p>
          </div>
        </div>
      </div>
    );
  }

  // Orders Management Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${getRoleColor(currentUser?.role || 'staff')} rounded-lg`}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">{currentUser?.name}</h2>
              <p className="text-sm text-gray-600">
                {currentUser?.role === 'chef' && 'พ่อครัว'}
                {currentUser?.role === 'staff' && 'พนักงานเสิร์ฟ'}
                {currentUser?.role === 'admin' && 'ผู้ดูแลระบบ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BranchSelector />

            {/* Menu Management Button - Only for Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/menu-management')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
              >
                <Settings className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">จัดการเมนู</span>
              </button>
            )}

            {/* Inventory Management Button - Only for Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/inventory')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
              >
                <Package className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">สต็อก</span>
              </button>
            )}

            {/* QR Code Management Button - Only for Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/qr-codes')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
              >
                <QrCode className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">QR Code</span>
              </button>
            )}

            {/* Notification Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
            >
              {unreadCount > 0 ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
              <span className="font-semibold hidden sm:inline">แจ้งเตือน</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Sidebar */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">การแจ้งเตือน</h2>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
              <p className="text-orange-100 mt-2">
                {unreadCount > 0 ? `มี ${unreadCount} รายการรอดำเนินการ` : 'ไม่มีการแจ้งเตือนใหม่'}
              </p>
            </div>

            <div className="p-4">
              {serviceRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceRequests
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((request) => (
                      <div
                        key={request.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          request.status === 'pending'
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${request.status === 'pending' ? 'bg-orange-500' : 'bg-gray-400'} text-white`}>
                              {getRequestIcon(request.type)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">{getRequestLabel(request.type)}</h3>
                              <p className="text-sm text-gray-600">
                                สาขา {request.branchId || 'N/A'} - โต๊ะ {request.tableNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(request.timestamp).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {request.details && (
                          <p className="text-sm text-gray-700 mb-2">📝 {request.details}</p>
                        )}

                        {request.items && request.items.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-1">รายการที่ขอ:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.items.map((item, index) => (
                                <span key={index} className="text-xs bg-white px-2 py-1 rounded-full border">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.status === 'pending' ? (
                          <button
                            onClick={() => markRequestAsCompleted(request.id)}
                            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm"
                          >
                            ✓ ดำเนินการเสร็จสิ้น
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-gray-200 text-gray-600 rounded-lg text-center font-semibold text-sm">
                            ✓ เสร็จสิ้นแล้ว
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">รายการออเดอร์</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'active' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ยังไม่ชำระเงิน
            {orders.filter(o => o.status === 'preparing' || o.status === 'completed').length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white text-orange-500' : 'bg-gray-300 text-gray-700'}`}>
                {orders.filter(o => o.status === 'preparing' || o.status === 'completed').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'history' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ประวัติ (ชำระแล้ว/ยกเลิก)
            {orders.filter(o => o.status === 'delivered').length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white text-orange-500' : 'bg-gray-300 text-gray-700'}`}>
                {orders.filter(o => o.status === 'delivered').length}
              </span>
            )}
          </button>
        </div>

        {orders.filter(o => activeTab === 'active' ? (o.status === 'preparing' || o.status === 'completed') : o.status === 'delivered').length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีออเดอร์</h3>
            <p className="text-gray-500">รอลูกค้าสั่งอาหาร...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.filter(o => activeTab === 'active' ? (o.status === 'preparing' || o.status === 'completed') : o.status === 'delivered').map((order) => {
              const isExpanded = expandedOrders.has(order.orderId);
              const allItemsCompleted = order.items.every(item =>
                item.itemStatus === 'completed' || item.itemStatus === 'delivered'
              );

              return (
                <div key={order.orderId} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                  {/* Order Header */}
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-800">#{order.orderId.slice(-6)}</h3>
                          <p className="text-sm text-gray-600">
                            สาขา {order.branchId || 'N/A'} - โต๊ะ {order.tableNumber || 'N/A'} • {new Date(order.orderDate).toLocaleTimeString('th-TH')}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full border-2 ${getStatusColor(order.status)} flex items-center gap-2 text-sm font-semibold`}>
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{order.totalItems} รายการ</p>
                          <p className="text-xl font-bold text-orange-600">{order.totalAmount} ฿</p>
                        </div>
                        <button
                          onClick={() => toggleOrderExpand(order.orderId)}
                          className="p-2 hover:bg-white rounded-lg transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Items (Expandable) */}
                  {isExpanded && (
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span>รายการอาหาร</span>
                        <span className="text-sm text-gray-500">({order.items.length} รายการ)</span>
                      </h4>

                      <div className="space-y-3 mb-6">
                        {order.items.map((item) => {
                          const emotion = getEmotionForItem(order.orderDate, item.itemStatus);
                          const waitingMinutes = getWaitingMinutesForOrder(order.orderDate);

                          return (
                          <div key={item.cartItemId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h5 className="font-semibold text-gray-800">{item.name}</h5>
                                <span className="text-sm text-gray-600">x{item.quantity}</span>
                                <div className={`px-2 py-1 rounded-full border ${getStatusColor(item.itemStatus || 'preparing')} flex items-center gap-1 text-xs font-semibold`}>
                                  {getStatusIcon(item.itemStatus || 'preparing')}
                                  {getStatusText(item.itemStatus || 'preparing')}
                                </div>
                                {emotion && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-300 rounded-full">
                                    <span className="text-lg">{emotion.emoji}</span>
                                    <span className={`text-xs font-bold ${emotion.color}`}>
                                      {waitingMinutes} นาที
                                    </span>
                                  </div>
                                )}
                              </div>
                              {item.specialInstructions && (
                                <p className="text-sm text-gray-600">📝 {item.specialInstructions}</p>
                              )}
                              <p className="text-sm text-gray-500">
                                {item.diningOption === 'dine-in' ? '🍽️ ทานในร้าน' : '🥡 รับกลับบ้าน'}
                              </p>
                            </div>

                            {/* Item Status Actions */}
                            <div className="flex gap-2">
                              {item.itemStatus === 'preparing' && (
                                <button
                                  onClick={() => updateItemStatus(order.orderId, item.cartItemId, 'completed')}
                                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-semibold whitespace-nowrap"
                                >
                                  ✓ เสร็จ
                                </button>
                              )}
                              {item.itemStatus === 'completed' && (
                                <button
                                  onClick={() => updateItemStatus(order.orderId, item.cartItemId, 'delivered')}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold whitespace-nowrap"
                                >
                                  🚚 ส่ง
                                </button>
                              )}
                              {item.itemStatus === 'delivered' && (
                                <div className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold whitespace-nowrap">
                                  เสร็จสมบูรณ์
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {/* Bulk Actions - only show for active orders */}
                      {activeTab === 'active' && (
                        <div className="flex gap-3 pt-4 border-t">
                          <button
                            onClick={() => updateAllItemsStatus(order.orderId, 'completed')}
                            className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold"
                          >
                            ✓ ทำเสร็จทั้งหมด
                          </button>
                          {allItemsCompleted && (
                            <button
                              onClick={() => updateAllItemsStatus(order.orderId, 'delivered')}
                              className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
                            >
                              🚚 ส่งทั้งหมด
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
