'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Home, Utensils, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { MenuItem, CartItem, QueueTicket, AddOn, AddOnGroup, SelectedNestedOption, NestedMenuOption } from '@/types';
import { calculateNestedMenuPrice, findNestedOptionById } from '@/data/nestedMenuOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import { NestedMenuModal } from '@/components/NestedMenuModal';
import { api, ApiMenuItem, ApiNestedMenuOption } from '@/lib/api';

// Helper function to convert API nested option to frontend NestedMenuOption
const convertNestedOption = (apiOption: ApiNestedMenuOption): NestedMenuOption => ({
  id: apiOption.id,
  name: apiOption.name,
  description: apiOption.description || undefined,
  price: apiOption.price,
  image: apiOption.image || undefined,
  type: apiOption.type as 'single' | 'group',
  requireChildSelection: apiOption.requireChildSelection,
  minChildSelections: apiOption.minChildSelections || undefined,
  maxChildSelections: apiOption.maxChildSelections || undefined,
  childOptions: apiOption.children?.map(convertNestedOption),
});

// Helper function to convert API menu item to frontend MenuItem
const convertApiMenuItem = (apiItem: ApiMenuItem): MenuItem => {
  // Convert nested menu config if exists
  let nestedMenuConfig = undefined;
  if (apiItem.nestedMenuConfig && apiItem.nestedMenuConfig.enabled) {
    const rootOptionObjects = apiItem.nestedMenuConfig.rootOptions.map(
      opt => convertNestedOption(opt.nestedMenuOption)
    );
    nestedMenuConfig = {
      enabled: apiItem.nestedMenuConfig.enabled,
      requireSelection: apiItem.nestedMenuConfig.requireSelection,
      minSelections: apiItem.nestedMenuConfig.minSelections,
      maxSelections: apiItem.nestedMenuConfig.maxSelections,
      rootOptions: rootOptionObjects.map(opt => opt.id),
      rootOptionObjects: rootOptionObjects,
    };
  }

  return {
    id: apiItem.id,
    name: apiItem.name,
    category: apiItem.category,
    price: apiItem.price,
    image: apiItem.image || '',
    description: apiItem.description || '',
    rating: apiItem.rating || undefined,
    reviewCount: apiItem.reviewCount,
    type: apiItem.type.toLowerCase() as 'single' | 'set' | 'group',
    setComponents: apiItem.setComponents,
    availableAddOns: apiItem.availableAddOns?.map((a: any) => a.addOnId || a.id) || [],
    availableAddOnGroups: apiItem.availableAddOnGroups?.map((g: any) => g.addOnGroupId || g.id) || [],
    nestedMenuConfig,
    isActive: apiItem.isActive,
  };
};

export default function KioskPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<'welcome' | 'order-type' | 'menu' | 'cart' | 'confirm' | 'queue'>('welcome');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [currentQueue, setCurrentQueue] = useState<QueueTicket | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ item: MenuItem; position: { x: number; y: number } } | null>(null);
  const [showAddNotification, setShowAddNotification] = useState(false);

  // API data state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nested Menu Modal state
  const [showNestedMenuModal, setShowNestedMenuModal] = useState(false);
  const [currentNestedMenuItem, setCurrentNestedMenuItem] = useState<MenuItem | null>(null);

  // Special instructions state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [specialInstructionsInput, setSpecialInstructionsInput] = useState<string>('');

  // Payment info state
  const [memberId, setMemberId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit-card' | 'qr-code' | 'mobile-banking'>('cash');

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiItems = await api.getMenuItems({ isActive: true });
        const convertedItems = apiItems.map(convertApiMenuItem);
        setMenuItems(convertedItems);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('ไม่สามารถโหลดเมนูได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Calculate categories
  const categories = useMemo(() => {
    return ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];
  }, [menuItems]);

  // Filter menu by category
  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'ทั้งหมด') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory, menuItems]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle menu item click - check if has nested options
  const handleMenuItemClick = (menuItem: MenuItem, event?: React.MouseEvent) => {
    // Check if this menu item has nested menu configuration
    if (menuItem.nestedMenuConfig && menuItem.nestedMenuConfig.enabled) {
      setCurrentNestedMenuItem(menuItem);
      setShowNestedMenuModal(true);
    } else {
      // No nested menu, add directly to cart
      addToCart(menuItem, undefined, undefined, undefined, undefined, event);
    }
  };

  // Handle nested menu confirmation
  const handleNestedMenuConfirm = (selections: SelectedNestedOption[]) => {
    if (!currentNestedMenuItem) return;

    // Add to cart with nested selections
    addToCart(currentNestedMenuItem, undefined, undefined, undefined, selections);
    setShowNestedMenuModal(false);
    setCurrentNestedMenuItem(null);
  };

  // Add to cart with animation
  const addToCart = (menuItem: MenuItem, specialInstructions?: string, selectedAddOns?: AddOn[], selectedAddOnGroups?: AddOnGroup[], selectedNestedOptions?: SelectedNestedOption[], event?: React.MouseEvent) => {
    // Trigger flying animation
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      setFlyingItem({
        item: menuItem,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      });

      // Remove flying item after animation
      setTimeout(() => setFlyingItem(null), 1000);
    }

    // Show notification
    setShowAddNotification(true);
    setTimeout(() => setShowAddNotification(false), 2000);

    setCart(prevCart => {
      const addOnsKey = selectedAddOns?.map(a => a.id).sort().join(',') || '';
      const addOnGroupsKey = selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';
      const nestedOptionsKey = JSON.stringify(selectedNestedOptions || []);

      const existingItem = prevCart.find(item => {
        const itemAddOnsKey = item.selectedAddOns?.map(a => a.id).sort().join(',') || '';
        const itemAddOnGroupsKey = item.selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';
        const itemNestedOptionsKey = JSON.stringify(item.selectedNestedOptions || []);
        return item.id === menuItem.id &&
               item.specialInstructions === specialInstructions &&
               item.diningOption === orderType &&
               itemAddOnsKey === addOnsKey &&
               itemAddOnGroupsKey === addOnGroupsKey &&
               itemNestedOptionsKey === nestedOptionsKey;
      });

      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      const addOnsTotal = selectedAddOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
      const addOnGroupsTotal = selectedAddOnGroups?.reduce((sum, group) => sum + group.price, 0) || 0;
      const nestedMenuTotal = calculateNestedMenuPrice(selectedNestedOptions || []);
      const finalPrice = menuItem.price + addOnsTotal + addOnGroupsTotal + nestedMenuTotal;

      const cartItemId = `${menuItem.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, {
        ...menuItem,
        price: finalPrice,
        quantity: 1,
        specialInstructions,
        cartItemId,
        diningOption: orderType,
        selectedAddOns,
        selectedAddOnGroups,
        selectedNestedOptions
      }];
    });
  };

  // Increase quantity
  const increaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Decrease quantity
  const decreaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  // Remove from cart
  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  // Update special instructions for an item
  const updateSpecialInstructions = (cartItemId: string, instructions: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
    setEditingItemId(null);
    setSpecialInstructionsInput('');
  };

  // Go to confirmation page
  const goToConfirmation = () => {
    setStep('confirm');
  };

  // Confirm order and generate queue
  const confirmOrder = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare items for Queue API
      const queueItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
        diningOption: item.diningOption,
        specialInstructions: item.specialInstructions,
        selectedAddOns: item.selectedAddOns ? JSON.stringify(item.selectedAddOns) : undefined,
        selectedAddOnGroups: item.selectedAddOnGroups ? JSON.stringify(item.selectedAddOnGroups) : undefined,
        selectedNestedOptions: item.selectedNestedOptions ? JSON.stringify(item.selectedNestedOptions) : undefined,
      }));

      // Prepare items for Order API
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
        diningOption: item.diningOption,
        specialInstructions: item.specialInstructions,
        selectedAddOns: item.selectedAddOns,
        selectedAddOnGroups: item.selectedAddOnGroups,
        selectedNestedOptions: item.selectedNestedOptions,
      }));

      // Create both Queue and Order in parallel
      const [queueResponse, orderResponse] = await Promise.all([
        api.createQueueTicket({
          orderType,
          totalAmount,
          totalItems,
          memberId: memberId || undefined,
          paymentMethod,
          items: queueItems,
        }),
        api.createOrder({
          tableNumber: 'KIOSK',
          totalAmount,
          totalItems,
          items: orderItems,
        }),
      ]);

      const response = queueResponse;
      console.log('Order created:', orderResponse.orderId);

      // Convert response to QueueTicket format
      const newQueue: QueueTicket = {
        queueId: response.queueId,
        queueNumber: response.queueNumber,
        orderType: response.orderType as 'dine-in' | 'takeaway',
        items: [...cart],
        totalAmount: response.totalAmount,
        totalItems: response.totalItems,
        status: response.status as 'waiting' | 'preparing' | 'ready' | 'completed' | 'cancelled',
        createdAt: new Date(response.createdAt),
        estimatedTime: response.estimatedTime || 15,
        memberId: response.memberId || undefined,
        paymentMethod: response.paymentMethod as 'cash' | 'credit-card' | 'qr-code' | 'mobile-banking' | undefined,
      };

      // Also save to localStorage for backward compatibility
      const existingQueues = localStorage.getItem('queueTickets');
      const queues = existingQueues ? JSON.parse(existingQueues) : [];
      const updatedQueues = [newQueue, ...queues];
      localStorage.setItem('queueTickets', JSON.stringify(updatedQueues));

      // Dispatch custom event for same-tab listening
      window.dispatchEvent(new CustomEvent('queueUpdated', { detail: updatedQueues }));

      setCurrentQueue(newQueue);
      setStep('queue');
    } catch (err) {
      console.error('Failed to create queue ticket:', err);
      setError('ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to welcome
  const resetKiosk = () => {
    setStep('welcome');
    setOrderType('dine-in');
    setCart([]);
    setSelectedCategory('ทั้งหมด');
    setCurrentQueue(null);
  };

  // Render main content
  const renderContent = () => {
    // Welcome Screen
    if (step === 'welcome') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4 sm:p-8">
          <div className="text-center">
            <div className="mb-6 sm:mb-8 animate-bounce">
              <Utensils className="w-20 h-20 sm:w-24 md:w-32 sm:h-24 md:h-32 text-white mx-auto" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
              ยินดีต้อนรับ
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-white mb-8 sm:mb-12 drop-shadow-md">
              สั่งอาหารง่ายๆ ด้วยตัวเอง
            </p>
            <button
              onClick={() => setStep('order-type')}
              className="bg-white text-orange-600 px-8 sm:px-12 md:px-16 py-5 sm:py-6 md:py-8 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl md:text-4xl font-bold shadow-2xl hover:scale-110 transform transition-all duration-300 hover:shadow-orange-300"
            >
              เริ่มสั่งอาหาร 🍽️
            </button>
          </div>
        </div>
      );
    }

    // Order Type Selection
    if (step === 'order-type') {
      return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setStep('welcome')}
            className="mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-gray-800 text-lg sm:text-xl md:text-2xl"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            ย้อนกลับ
          </button>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 sm:mb-4 text-gray-800">
            เลือกประเภทการสั่ง
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-center text-gray-600 mb-8 sm:mb-12 md:mb-16">
            คุณต้องการทานที่ร้านหรือซื้อกลับบ้าน?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            {/* Dine In */}
            <button
              onClick={() => {
                setOrderType('dine-in');
                setStep('menu');
              }}
              className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl hover:scale-105 transform transition-all duration-300 hover:shadow-orange-300"
            >
              <Home className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 lg:w-32 md:h-24 lg:h-32 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">ทานที่ร้าน</h3>
              <p className="text-lg sm:text-xl md:text-2xl text-orange-100">Dine In</p>
            </button>

            {/* Takeaway */}
            <button
              onClick={() => {
                setOrderType('takeaway');
                setStep('menu');
              }}
              className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl hover:scale-105 transform transition-all duration-300 hover:shadow-blue-300"
            >
              <Package className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 lg:w-32 md:h-24 lg:h-32 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">ซื้อกลับบ้าน</h3>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100">Takeaway</p>
            </button>
          </div>
        </div>
        </div>
      );
    }

    // Menu & Cart View
    if (step === 'menu' || step === 'cart') {
      return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 sm:p-4 md:p-6 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => setStep('order-type')}
                className="text-white hover:bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">เมนูอาหาร</h2>
                <p className="text-orange-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  {orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(step === 'menu' ? 'cart' : 'menu')}
              className="bg-white text-orange-600 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-sm sm:text-base md:text-lg lg:text-2xl shadow-lg hover:scale-105 transform transition-all flex items-center gap-1 sm:gap-2 md:gap-3"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
              <span className="hidden sm:inline">{step === 'menu' ? `ตะกร้า (${totalItems})` : 'กลับไปเลือกเมนู'}</span>
              <span className="sm:hidden">{step === 'menu' ? `(${totalItems})` : 'เมนู'}</span>
            </button>
          </div>
        </div>

        {step === 'menu' ? (
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-4" />
                <p className="text-xl text-gray-600">กำลังโหลดเมนู...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-xl text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600"
                >
                  ลองใหม่
                </button>
              </div>
            )}

            {/* Categories */}
            {!isLoading && !error && (
            <div className="max-w-7xl mx-auto mb-4 sm:mb-6 md:mb-8">
              <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-3 sm:pb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg lg:text-2xl font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Menu Grid */}
            {!isLoading && !error && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] sm:hover:scale-105"
                >
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuItemClick(item, e);
                    }}
                  >
                    <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-gray-200">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Badge for nested menu items */}
                      {item.nestedMenuConfig && item.nestedMenuConfig.enabled && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-purple-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                          มีตัวเลือก
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{item.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3 md:mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-orange-600">
                          {item.price > 0 ? `฿${item.price}` : <span className="text-sm sm:text-base">ราคาตามตัวเลือก</span>}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuItemClick(item, e);
                          }}
                          className="bg-orange-500 text-white px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold hover:bg-orange-600 transition-all active:scale-95"
                        >
                          {item.nestedMenuConfig && item.nestedMenuConfig.enabled ? 'เลือก' : 'เพิ่ม'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        ) : (
          // Cart View
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8">ตะกร้าสินค้า</h2>

              {cart.length === 0 ? (
                <div className="text-center py-10 sm:py-16 md:py-20">
                  <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-gray-300 mx-auto mb-4 sm:mb-6" />
                  <p className="text-xl sm:text-2xl md:text-3xl text-gray-500">ตะกร้าว่างเปล่า</p>
                  <p className="text-base sm:text-lg md:text-2xl text-gray-400 mt-2">กรุณาเลือกเมนูที่ต้องการ</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6">
                          <div className="relative w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 bg-gray-200 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 truncate">{item.name}</h3>

                            {/* Display nested options if available */}
                            {item.selectedNestedOptions && item.selectedNestedOptions.length > 0 && (
                              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                                {item.selectedNestedOptions.map((sel, idx) => {
                                  const renderSelection = (s: typeof sel, depth = 0): string => {
                                    let result = s.option.name;
                                    if (s.childSelections && s.childSelections.length > 0) {
                                      result += ' → ' + s.childSelections.map(child => renderSelection(child, depth + 1)).join(', ');
                                    }
                                    return result;
                                  };
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      <span className="text-purple-600">•</span>
                                      <span className="truncate">{renderSelection(sel)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <p className="text-base sm:text-lg md:text-xl text-orange-600 font-bold mt-1 sm:mt-2">฿{item.price}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 md:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                              <button
                                onClick={() => decreaseQuantity(item.cartItemId)}
                                className="bg-gray-200 text-gray-800 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl md:text-2xl hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="text-xl sm:text-2xl md:text-3xl font-bold w-8 sm:w-12 md:w-16 text-center">{item.quantity}</span>
                              <button
                                onClick={() => increaseQuantity(item.cartItemId)}
                                className="bg-orange-500 text-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl md:text-2xl hover:bg-orange-600"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="text-red-500 hover:text-red-700 text-sm sm:text-base md:text-lg lg:text-xl font-bold ml-2 sm:ml-4"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>

                        {/* Special Instructions Section */}
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                          {editingItemId === item.cartItemId ? (
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <input
                                type="text"
                                value={specialInstructionsInput}
                                onChange={(e) => setSpecialInstructionsInput(e.target.value)}
                                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-orange-300 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg focus:outline-none focus:border-orange-500"
                                autoFocus
                              />
                              <div className="flex gap-2 sm:gap-3">
                                <button
                                  onClick={() => updateSpecialInstructions(item.cartItemId, specialInstructionsInput)}
                                  className="flex-1 sm:flex-none bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-green-600"
                                >
                                  บันทึก
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItemId(null);
                                    setSpecialInstructionsInput('');
                                  }}
                                  className="flex-1 sm:flex-none bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-gray-400"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {item.specialInstructions ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📝</span>
                                    <span className="text-gray-700 text-xs sm:text-sm md:text-base truncate">{item.specialInstructions}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs sm:text-sm">ไม่มีข้อความพิเศษ</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingItemId(item.cartItemId);
                                  setSpecialInstructionsInput(item.specialInstructions || '');
                                }}
                                className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm md:text-base lg:text-lg font-medium ml-2 sm:ml-4 whitespace-nowrap"
                              >
                                {item.specialInstructions ? 'แก้ไข' : '+ เพิ่มข้อความ'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Confirm */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700">ยอดรวม</span>
                      <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-600">฿{totalAmount}</span>
                    </div>
                    <button
                      onClick={goToConfirmation}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold hover:scale-105 transform transition-all shadow-xl"
                    >
                      ดำเนินการต่อ →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        </div>
      );
    }

    // Confirmation Page (Payment & Member ID)
    if (step === 'confirm') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setStep('cart')}
              className="mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
              ย้อนกลับ
            </button>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-2 sm:mb-3 md:mb-4 text-gray-800">
              ยืนยันการสั่งซื้อ
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-center text-gray-600 mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              กรุณากรอกข้อมูลเพิ่มเติม
            </p>

            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Member ID Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2 sm:gap-3">
                  <span className="bg-purple-100 text-purple-600 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0">
                    1
                  </span>
                  รหัสสมาชิก (ถ้ามี)
                </h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 ml-10 sm:ml-12 md:ml-14 lg:ml-16">ใส่รหัสเพื่อรับส่วนลดและสะสมแต้ม</p>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="กรอกรหัสสมาชิก (ไม่บังคับ)"
                  className="ml-10 sm:ml-12 md:ml-14 lg:ml-16 w-[calc(100%-2.5rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-3.5rem)] lg:w-[calc(100%-4rem)] px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 border-2 border-gray-300 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl lg:text-2xl focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Payment Method Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="bg-green-100 text-green-600 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0">
                    2
                  </span>
                  เลือกวิธีการชำระเงิน
                </h3>

                <div className="ml-0 sm:ml-12 md:ml-14 lg:ml-16 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  {/* Cash */}
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">💵</div>
                    <h4 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-800">เงินสด</h4>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">Cash</p>
                  </button>

                  {/* Credit Card */}
                  <button
                    onClick={() => setPaymentMethod('credit-card')}
                    className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all ${
                      paymentMethod === 'credit-card'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">💳</div>
                    <h4 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-800">บัตรเครดิต</h4>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">Credit Card</p>
                  </button>

                  {/* QR Code */}
                  <button
                    onClick={() => setPaymentMethod('qr-code')}
                    className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all ${
                      paymentMethod === 'qr-code'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">📱</div>
                    <h4 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-800">QR Code</h4>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">PromptPay</p>
                  </button>

                  {/* Mobile Banking */}
                  <button
                    onClick={() => setPaymentMethod('mobile-banking')}
                    className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all ${
                      paymentMethod === 'mobile-banking'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">🏦</div>
                    <h4 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-800">Mobile Banking</h4>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">โอนผ่านแอป</p>
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 md:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-5 md:mb-6">สรุปคำสั่งซื้อ</h3>
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="flex justify-between text-sm sm:text-base md:text-lg lg:text-xl">
                    <span>ประเภท:</span>
                    <span className="font-bold">
                      {orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base md:text-lg lg:text-xl">
                    <span>จำนวนรายการ:</span>
                    <span className="font-bold">{totalItems} รายการ</span>
                  </div>
                  {memberId && (
                    <div className="flex justify-between text-sm sm:text-base md:text-lg lg:text-xl">
                      <span>รหัสสมาชิก:</span>
                      <span className="font-bold">{memberId}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base md:text-lg lg:text-xl">
                    <span>วิธีชำระเงิน:</span>
                    <span className="font-bold">
                      {paymentMethod === 'cash' && '💵 เงินสด'}
                      {paymentMethod === 'credit-card' && '💳 บัตรเครดิต'}
                      {paymentMethod === 'qr-code' && '📱 QR Code'}
                      {paymentMethod === 'mobile-banking' && '🏦 Mobile Banking'}
                    </span>
                  </div>
                </div>
                <div className="border-t-2 border-white/30 pt-4 sm:pt-5 md:pt-6 mb-4 sm:mb-5 md:mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">ยอดรวมทั้งหมด</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">฿{totalAmount}</span>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}
                <button
                  onClick={confirmOrder}
                  disabled={isSubmitting}
                  className="w-full bg-white text-orange-600 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-2xl lg:text-3xl font-bold hover:scale-105 transform transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                      กำลังสร้างคำสั่งซื้อ...
                    </>
                  ) : (
                    'ยืนยันการสั่งซื้อ ✓'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Queue Ticket Display
    if (step === 'queue' && currentQueue) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-3xl w-full text-center">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="bg-green-100 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-green-600 mb-2 sm:mb-3 md:mb-4">สั่งอาหารสำเร็จ!</h2>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600">กรุณารอรับบัตรคิว</p>
          </div>

          {/* Queue Number */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 mb-4 sm:mb-6 md:mb-8">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 sm:mb-3 md:mb-4">หมายเลขคิวของคุณ</p>
            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-2 sm:mb-3 md:mb-4">{currentQueue.queueId}</div>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-orange-100">
              {currentQueue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8 text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6">รายการสั่งซื้อ</h3>
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
              {currentQueue.items.map(item => (
                <div key={item.cartItemId}>
                  <div className="flex justify-between text-sm sm:text-base md:text-lg lg:text-xl">
                    <span className="text-gray-700">{item.name} x{item.quantity}</span>
                    <span className="font-bold text-gray-800">฿{item.price * item.quantity}</span>
                  </div>
                  {/* Show special instructions */}
                  {item.specialInstructions && (
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-blue-600 mt-1 ml-2 sm:ml-4">
                      <span>📝</span>
                      <span>{item.specialInstructions}</span>
                    </div>
                  )}
                  {/* Show nested options */}
                  {item.selectedNestedOptions && item.selectedNestedOptions.length > 0 && (
                    <div className="text-xs sm:text-sm text-purple-600 mt-1 ml-2 sm:ml-4">
                      {item.selectedNestedOptions.map((sel, idx) => {
                        const renderSelection = (s: typeof sel): string => {
                          let result = s.option.name;
                          if (s.childSelections && s.childSelections.length > 0) {
                            result += ' → ' + s.childSelections.map(child => renderSelection(child)).join(', ');
                          }
                          return result;
                        };
                        return <div key={idx}>• {renderSelection(sel)}</div>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t-2 border-gray-300 pt-3 sm:pt-4 space-y-1 sm:space-y-2">
              {currentQueue.memberId && (
                <div className="flex justify-between text-sm sm:text-base md:text-lg text-purple-700">
                  <span>รหัสสมาชิก:</span>
                  <span className="font-bold">{currentQueue.memberId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base md:text-lg text-gray-600">
                <span>วิธีชำระเงิน:</span>
                <span className="font-bold">
                  {currentQueue.paymentMethod === 'cash' && '💵 เงินสด'}
                  {currentQueue.paymentMethod === 'credit-card' && '💳 บัตรเครดิต'}
                  {currentQueue.paymentMethod === 'qr-code' && '📱 QR Code'}
                  {currentQueue.paymentMethod === 'mobile-banking' && '🏦 Mobile Banking'}
                </span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 sm:pt-4 mt-3 sm:mt-4">
                <div className="flex justify-between text-xl sm:text-2xl md:text-3xl font-bold">
                  <span className="text-gray-800">ยอดรวม</span>
                  <span className="text-orange-600">฿{currentQueue.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-4 sm:mb-6 md:mb-8">
            <p>⏱️ เวลาโดยประมาณ: {currentQueue.estimatedTime} นาที</p>
            <p className="mt-1 sm:mt-2">กรุณารอรับอาหารที่เคาน์เตอร์</p>
          </div>

          <button
            onClick={resetKiosk}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-2xl lg:text-3xl font-bold hover:scale-105 transform transition-all shadow-xl"
          >
            เสร็จสิ้น
          </button>
        </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Main Content */}
      {renderContent()}

      {/* Flying Item Animation */}
      {flyingItem && (
        <div
          className="fixed z-[200] pointer-events-none"
          style={{
            left: flyingItem.position.x,
            top: flyingItem.position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="animate-fly-to-cart">
            <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl">
              <span className="text-3xl">🍽️</span>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Notification */}
      {showAddNotification && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[150] animate-bounce-in">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-xl font-bold">เพิ่มลงตะกร้าแล้ว!</p>
              <p className="text-sm text-green-100">Added to cart</p>
            </div>
          </div>
        </div>
      )}

      {/* Nested Menu Modal */}
      {showNestedMenuModal && currentNestedMenuItem && currentNestedMenuItem.nestedMenuConfig && (
        <NestedMenuModal
          isOpen={showNestedMenuModal}
          options={
            currentNestedMenuItem.nestedMenuConfig.rootOptions
              .map(id => findNestedOptionById(id))
              .filter(Boolean) as any[]
          }
          onClose={() => {
            setShowNestedMenuModal(false);
            setCurrentNestedMenuItem(null);
          }}
          onConfirm={handleNestedMenuConfirm}
          minSelections={currentNestedMenuItem.nestedMenuConfig.minSelections || 1}
          maxSelections={currentNestedMenuItem.nestedMenuConfig.maxSelections || 1}
          requireSelection={currentNestedMenuItem.nestedMenuConfig.requireSelection}
        />
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fly-to-cart {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(calc(100vw - 50%), calc(-100vh + 50%)) scale(0.5) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(calc(100vw - 50%), calc(-100vh + 50%)) scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: translate(-50%, -100px);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, 10px);
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        .animate-fly-to-cart {
          animation: fly-to-cart 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </>
  );
}
