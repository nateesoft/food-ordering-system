'use client';

import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { MenuCard } from '@/components/MenuCard';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderHistory } from '@/components/OrderHistory';
import { menuItems } from '@/data/menuItems';
import { MenuItem, CartItem, Order } from '@/types';

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [showCart, setShowCart] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // คำนวณหมวดหมู่
  const categories = useMemo(() => {
    const cats = ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, []);

  // กรองเมนูตามหมวดหมู่
  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'ทั้งหมด') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  // คำนวณยอดรวม
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (menuItem: MenuItem, specialInstructions?: string) => {
    setCart(prevCart => {
      // หารายการที่ตรงกันทั้ง id และ specialInstructions
      const existingItem = prevCart.find(
        item => item.id === menuItem.id && item.specialInstructions === specialInstructions
      );

      if (existingItem) {
        // ถ้าเจอรายการที่ตรงกันทุกอย่าง ให้เพิ่มจำนวน
        return prevCart.map(item =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // ถ้าไม่เจอ หรือ specialInstructions ต่างกัน ให้สร้างรายการใหม่
      const cartItemId = `${menuItem.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, { ...menuItem, quantity: 1, specialInstructions, cartItemId }];
    });
  };

  // เพิ่มจำนวนสินค้า
  const increaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // ลดจำนวนสินค้า
  const decreaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  // อัปเดตคำขอพิเศษ
  const updateSpecialInstructions = (cartItemId: string, instructions: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, specialInstructions: instructions } : item
      )
    );
  };

  // ยืนยันการสั่งซื้อ
  const confirmOrder = () => {
    // สร้าง order ใหม่
    const newOrder: Order = {
      orderId: `ORD-${Date.now()}`,
      items: [...cart],
      totalAmount,
      totalItems,
      orderDate: new Date(),
      status: 'preparing',
    };

    // เพิ่มลงประวัติการสั่งซื้อ
    setOrderHistory(prev => [newOrder, ...prev]);

    setOrderConfirmed(true);
    setTimeout(() => {
      setCart([]);
      setOrderConfirmed(false);
      setShowCart(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header
        totalItems={totalItems}
        onCartClick={() => setShowCart(true)}
        onHistoryClick={() => setShowOrderHistory(true)}
        orderCount={orderHistory.length}
      />
      
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenu.map(item => (
            <MenuCard key={item.id} item={item} onAddToCart={addToCart} />
          ))}
        </div>
      </main>

      <CartSidebar
        isOpen={showCart}
        cart={cart}
        totalAmount={totalAmount}
        totalItems={totalItems}
        orderConfirmed={orderConfirmed}
        onClose={() => setShowCart(false)}
        onIncreaseQuantity={increaseQuantity}
        onDecreaseQuantity={decreaseQuantity}
        onRemoveFromCart={removeFromCart}
        onUpdateSpecialInstructions={updateSpecialInstructions}
        onConfirmOrder={confirmOrder}
      />

      {/* Order History Sidebar */}
      <OrderHistory
        isOpen={showOrderHistory}
        orders={orderHistory}
        onClose={() => setShowOrderHistory(false)}
      />

      {/* Order Confirmation Toast */}
      {orderConfirmed && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center space-x-3">
            <Check className="w-6 h-6" />
            <span className="font-bold text-lg">สั่งอาหารสำเร็จแล้ว! ขอบคุณครับ</span>
          </div>
        </div>
      )}
    </div>
  );
}
