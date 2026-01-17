'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart, Home, Utensils, Package, ArrowLeft } from 'lucide-react';
import { menuItems } from '@/data/menuItems';
import { MenuItem, CartItem, QueueTicket, AddOn, AddOnGroup, SelectedNestedOption } from '@/types';
import { calculateNestedMenuPrice } from '@/data/nestedMenuOptions';
import { useLanguage } from '@/contexts/LanguageContext';

export default function KioskPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<'welcome' | 'order-type' | 'menu' | 'cart' | 'queue'>('welcome');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [currentQueue, setCurrentQueue] = useState<QueueTicket | null>(null);

  // Calculate categories
  const categories = useMemo(() => {
    return ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];
  }, []);

  // Filter menu by category
  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'ทั้งหมด') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Add to cart
  const addToCart = (menuItem: MenuItem, specialInstructions?: string, selectedAddOns?: AddOn[], selectedAddOnGroups?: AddOnGroup[], selectedNestedOptions?: SelectedNestedOption[]) => {
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

  // Confirm order and generate queue
  const confirmOrder = () => {
    const queueNumber = Math.floor(Math.random() * 900) + 100;
    const queueId = `${orderType === 'dine-in' ? 'A' : 'B'}${queueNumber.toString().padStart(3, '0')}`;

    const newQueue: QueueTicket = {
      queueId,
      queueNumber,
      orderType,
      items: [...cart],
      totalAmount,
      totalItems,
      status: 'waiting',
      createdAt: new Date(),
      estimatedTime: 15,
    };

    // Save to localStorage
    const existingQueues = localStorage.getItem('queueTickets');
    const queues = existingQueues ? JSON.parse(existingQueues) : [];
    const updatedQueues = [newQueue, ...queues];
    localStorage.setItem('queueTickets', JSON.stringify(updatedQueues));

    setCurrentQueue(newQueue);
    setStep('queue');
  };

  // Reset to welcome
  const resetKiosk = () => {
    setStep('welcome');
    setOrderType('dine-in');
    setCart([]);
    setSelectedCategory('ทั้งหมด');
    setCurrentQueue(null);
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-8 animate-bounce">
            <Utensils className="w-32 h-32 text-white mx-auto" />
          </div>
          <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-lg">
            ยินดีต้อนรับ
          </h1>
          <p className="text-3xl text-white mb-12 drop-shadow-md">
            สั่งอาหารง่ายๆ ด้วยตัวเอง
          </p>
          <button
            onClick={() => setStep('order-type')}
            className="bg-white text-orange-600 px-16 py-8 rounded-3xl text-4xl font-bold shadow-2xl hover:scale-110 transform transition-all duration-300 hover:shadow-orange-300"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setStep('welcome')}
            className="mb-8 flex items-center gap-3 text-gray-600 hover:text-gray-800 text-2xl"
          >
            <ArrowLeft className="w-8 h-8" />
            ย้อนกลับ
          </button>

          <h2 className="text-6xl font-bold text-center mb-4 text-gray-800">
            เลือกประเภทการสั่ง
          </h2>
          <p className="text-3xl text-center text-gray-600 mb-16">
            คุณต้องการทานที่ร้านหรือซื้อกลับบ้าน?
          </p>

          <div className="grid grid-cols-2 gap-12">
            {/* Dine In */}
            <button
              onClick={() => {
                setOrderType('dine-in');
                setStep('menu');
              }}
              className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-12 rounded-3xl shadow-2xl hover:scale-105 transform transition-all duration-300 hover:shadow-orange-300"
            >
              <Home className="w-32 h-32 mx-auto mb-6" />
              <h3 className="text-5xl font-bold mb-4">ทานที่ร้าน</h3>
              <p className="text-2xl text-orange-100">Dine In</p>
            </button>

            {/* Takeaway */}
            <button
              onClick={() => {
                setOrderType('takeaway');
                setStep('menu');
              }}
              className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-12 rounded-3xl shadow-2xl hover:scale-105 transform transition-all duration-300 hover:shadow-blue-300"
            >
              <Package className="w-32 h-32 mx-auto mb-6" />
              <h3 className="text-5xl font-bold mb-4">ซื้อกลับบ้าน</h3>
              <p className="text-2xl text-blue-100">Takeaway</p>
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
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep('order-type')}
                className="text-white hover:bg-white/20 p-3 rounded-xl"
              >
                <ArrowLeft className="w-8 h-8" />
              </button>
              <div>
                <h2 className="text-3xl font-bold">เมนูอาหาร</h2>
                <p className="text-orange-100 text-lg">
                  {orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(step === 'menu' ? 'cart' : 'menu')}
              className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold text-2xl shadow-lg hover:scale-105 transform transition-all flex items-center gap-3"
            >
              <ShoppingCart className="w-8 h-8" />
              {step === 'menu' ? `ตะกร้า (${totalItems})` : 'กลับไปเลือกเมนู'}
            </button>
          </div>
        </div>

        {step === 'menu' ? (
          <div className="p-8">
            {/* Categories */}
            <div className="max-w-7xl mx-auto mb-8">
              <div className="flex gap-4 overflow-x-auto pb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-8 py-4 rounded-2xl text-2xl font-bold whitespace-nowrap transition-all ${
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

            {/* Menu Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
                  onClick={() => addToCart(item)}
                >
                  <div className="relative h-64 bg-gray-200">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-lg mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-orange-600">฿{item.price}</span>
                      <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
                        เพิ่ม
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Cart View
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-5xl font-bold text-gray-800 mb-8">ตะกร้าสินค้า</h2>

              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="w-32 h-32 text-gray-300 mx-auto mb-6" />
                  <p className="text-3xl text-gray-500">ตะกร้าว่างเปล่า</p>
                  <p className="text-2xl text-gray-400 mt-2">กรุณาเลือกเมนูที่ต้องการ</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-6">
                          <div className="relative w-24 h-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-800">{item.name}</h3>
                            <p className="text-xl text-orange-600 font-bold">฿{item.price}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => decreaseQuantity(item.cartItemId)}
                              className="bg-gray-200 text-gray-800 w-12 h-12 rounded-xl font-bold text-2xl hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="text-3xl font-bold w-16 text-center">{item.quantity}</span>
                            <button
                              onClick={() => increaseQuantity(item.cartItemId)}
                              className="bg-orange-500 text-white w-12 h-12 rounded-xl font-bold text-2xl hover:bg-orange-600"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-red-500 hover:text-red-700 text-xl font-bold ml-4"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Confirm */}
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-3xl font-bold text-gray-700">ยอดรวม</span>
                      <span className="text-5xl font-bold text-orange-600">฿{totalAmount}</span>
                    </div>
                    <button
                      onClick={confirmOrder}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 rounded-2xl text-3xl font-bold hover:scale-105 transform transition-all shadow-xl"
                    >
                      ยืนยันการสั่งซื้อ
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

  // Queue Ticket Display
  if (step === 'queue' && currentQueue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full text-center">
          <div className="mb-8">
            <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-6xl font-bold text-green-600 mb-4">สั่งอาหารสำเร็จ!</h2>
            <p className="text-3xl text-gray-600">กรุณารอรับบัตรคิว</p>
          </div>

          {/* Queue Number */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-3xl p-12 mb-8">
            <p className="text-3xl mb-4">หมายเลขคิวของคุณ</p>
            <div className="text-9xl font-bold mb-4">{currentQueue.queueId}</div>
            <p className="text-2xl text-orange-100">
              {currentQueue.orderType === 'dine-in' ? '🏠 ทานที่ร้าน' : '📦 ซื้อกลับบ้าน'}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 text-left">
            <h3 className="text-3xl font-bold text-gray-800 mb-6">รายการสั่งซื้อ</h3>
            <div className="space-y-4 mb-6">
              {currentQueue.items.map(item => (
                <div key={item.cartItemId} className="flex justify-between text-xl">
                  <span className="text-gray-700">{item.name} x{item.quantity}</span>
                  <span className="font-bold text-gray-800">฿{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between text-3xl font-bold">
                <span className="text-gray-800">ยอดรวม</span>
                <span className="text-orange-600">฿{currentQueue.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="text-2xl text-gray-600 mb-8">
            <p>⏱️ เวลาโดยประมาณ: {currentQueue.estimatedTime} นาที</p>
            <p className="mt-2">กรุณารอรับอาหารที่เคาน์เตอร์</p>
          </div>

          <button
            onClick={resetKiosk}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-12 py-6 rounded-2xl text-3xl font-bold hover:scale-105 transform transition-all shadow-xl"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    );
  }

  return null;
}
