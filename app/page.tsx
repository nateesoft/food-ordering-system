'use client';

import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { MenuCard } from '@/components/MenuCard';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderHistory } from '@/components/OrderHistory';
import { FloatingActionMenu } from '@/components/FloatingActionMenu';
import { FloorPlan } from '@/components/FloorPlan';
import { menuItems } from '@/data/menuItems';
import { MenuItem, CartItem, Order, ServiceRequest, Table } from '@/types';

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [showCart, setShowCart] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [currentTableId, setCurrentTableId] = useState(5);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [tables, setTables] = useState<Table[]>([
    // ด้านหน้าร้าน
    { id: 1, number: 'A1', capacity: 2, status: 'available', position: { x: 10, y: 10 }, size: 'small' },
    { id: 2, number: 'A2', capacity: 2, status: 'occupied', position: { x: 30, y: 10 }, size: 'small' },
    { id: 3, number: 'A3', capacity: 4, status: 'available', position: { x: 50, y: 10 }, size: 'medium' },
    { id: 4, number: 'A4', capacity: 4, status: 'reserved', position: { x: 70, y: 10 }, size: 'medium' },

    // กลางร้าน
    { id: 5, number: 'B1', capacity: 4, status: 'occupied', position: { x: 10, y: 40 }, size: 'medium' },
    { id: 6, number: 'B2', capacity: 4, status: 'available', position: { x: 35, y: 40 }, size: 'medium' },
    { id: 7, number: 'B3', capacity: 6, status: 'occupied', position: { x: 60, y: 40 }, size: 'large' },

    // ด้านหลัง
    { id: 8, number: 'C1', capacity: 2, status: 'available', position: { x: 10, y: 70 }, size: 'small' },
    { id: 9, number: 'C2', capacity: 2, status: 'available', position: { x: 30, y: 70 }, size: 'small' },
    { id: 10, number: 'C3', capacity: 4, status: 'occupied', position: { x: 50, y: 70 }, size: 'medium' },
    { id: 11, number: 'C4', capacity: 8, status: 'available', position: { x: 70, y: 70 }, size: 'large' },
  ]);

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

  // จัดการ Service Request
  const handleServiceRequest = (type: 'staff' | 'utensils' | 'payment', details?: string, items?: string[]) => {
    const newRequest: ServiceRequest = {
      id: `REQ-${Date.now()}`,
      type,
      timestamp: new Date(),
      details,
      items,
      status: 'pending',
    };

    setServiceRequests(prev => [newRequest, ...prev]);
    console.log('Service Request:', newRequest);
  };

  // เปลี่ยนโต๊ะ
  const handleChangeTable = (newTableId: number) => {
    // อัปเดตสถานะโต๊ะเก่า
    setTables(prev =>
      prev.map(table => {
        if (table.id === currentTableId) {
          return { ...table, status: 'available' as const };
        }
        if (table.id === newTableId) {
          return { ...table, status: 'occupied' as const };
        }
        return table;
      })
    );
    setCurrentTableId(newTableId);
  };

  // รวมโต๊ะ
  const handleMergeTables = (tableIds: number[]) => {
    setTables(prev =>
      prev.map(table => {
        if (tableIds.includes(table.id)) {
          return { ...table, mergedWith: tableIds.filter(id => id !== table.id) };
        }
        return table;
      })
    );
    console.log('Merged tables:', tableIds);
  };

  const currentTable = tables.find(t => t.id === currentTableId);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
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

      {/* Floor Plan */}
      <FloorPlan
        isOpen={showFloorPlan}
        currentTableId={currentTableId}
        tables={tables}
        onClose={() => setShowFloorPlan(false)}
        onChangeTable={handleChangeTable}
        onMergeTables={handleMergeTables}
      />

      {/* Floating Action Menu */}
      <FloatingActionMenu
        currentTableNumber={currentTable?.number || 'N/A'}
        onServiceRequest={handleServiceRequest}
        onOpenFloorPlan={() => setShowFloorPlan(true)}
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
