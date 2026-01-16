'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SearchBar } from '@/components/SearchBar';
import { MenuCard } from '@/components/MenuCard';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderHistory } from '@/components/OrderHistory';
import { FloatingActionMenu } from '@/components/FloatingActionMenu';
import { FloorPlan } from '@/components/FloorPlan';
import { WelcomeModal } from '@/components/WelcomeModal';
import { menuItems } from '@/data/menuItems';
import { MenuItem, CartItem, Order, ServiceRequest, Table, AddOn, AddOnGroup, SelectedNestedOption } from '@/types';
import { calculateNestedMenuPrice } from '@/data/nestedMenuOptions';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { t, language } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(t.categories.all);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [currentTableId, setCurrentTableId] = useState(5);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showOrderAnimation, setShowOrderAnimation] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<CartItem[]>([]);
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

  // Calculate categories - use Thai category names internally
  const categories = useMemo(() => {
    const cats = ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, []);

  // Filter menu by category and search - using Thai category names for filtering
  const filteredMenu = useMemo(() => {
    const allCategoryInThai = 'ทั้งหมด';
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== t.categories.all && selectedCategory !== allCategoryInThai) {
      // Map translated category back to Thai for filtering
      const categoryMap: Record<string, string> = {
        [t.foodCategories.singleDish]: 'อาหารจานเดียว',
        [t.foodCategories.appetizers]: 'อาหารว่าง',
        [t.foodCategories.desserts]: 'ของหวาน',
        [t.foodCategories.beverages]: 'เครื่องดื่ม',
      };
      const thaiCategory = categoryMap[selectedCategory] || selectedCategory;
      filtered = filtered.filter(item => item.category === thaiCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, t]);

  // คำนวณยอดรวม
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (menuItem: MenuItem, specialInstructions?: string, diningOption: 'dine-in' | 'takeaway' = 'dine-in', selectedAddOns?: AddOn[], selectedAddOnGroups?: AddOnGroup[], selectedNestedOptions?: SelectedNestedOption[]) => {
    setCart(prevCart => {
      // Serialize add-ons, groups, and nested options for comparison
      const addOnsKey = selectedAddOns?.map(a => a.id).sort().join(',') || '';
      const addOnGroupsKey = selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';
      const nestedOptionsKey = JSON.stringify(selectedNestedOptions || []);

      // หารายการที่ตรงกันทั้ง id, specialInstructions, diningOption, selectedAddOns, selectedAddOnGroups และ selectedNestedOptions
      const existingItem = prevCart.find(item => {
        const itemAddOnsKey = item.selectedAddOns?.map(a => a.id).sort().join(',') || '';
        const itemAddOnGroupsKey = item.selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';
        const itemNestedOptionsKey = JSON.stringify(item.selectedNestedOptions || []);
        return item.id === menuItem.id &&
               item.specialInstructions === specialInstructions &&
               item.diningOption === diningOption &&
               itemAddOnsKey === addOnsKey &&
               itemAddOnGroupsKey === addOnGroupsKey &&
               itemNestedOptionsKey === nestedOptionsKey;
      });

      if (existingItem) {
        // ถ้าเจอรายการที่ตรงกันทุกอย่าง ให้เพิ่มจำนวน
        return prevCart.map(item =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // คำนวณราคารวมกับ add-ons, groups และ nested menu
      const addOnsTotal = selectedAddOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
      const addOnGroupsTotal = selectedAddOnGroups?.reduce((sum, group) => sum + group.price, 0) || 0;
      const nestedMenuTotal = calculateNestedMenuPrice(selectedNestedOptions || []);
      const finalPrice = menuItem.price + addOnsTotal + addOnGroupsTotal + nestedMenuTotal;

      // ถ้าไม่เจอ หรือมีอะไรต่างกัน ให้สร้างรายการใหม่
      const cartItemId = `${menuItem.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, {
        ...menuItem,
        price: finalPrice, // Update price to include add-ons, groups, and nested menu
        quantity: 1,
        specialInstructions,
        cartItemId,
        diningOption,
        selectedAddOns,
        selectedAddOnGroups,
        selectedNestedOptions
      }];
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

  // อัปเดตประเภทการรับประทาน
  const updateDiningOption = (cartItemId: string, option: 'dine-in' | 'takeaway') => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, diningOption: option } : item
      )
    );
  };

  // ยืนยันการสั่งซื้อ
  const confirmOrder = () => {
    // Store items for animation
    setAnimatingItems([...cart]);
    setShowOrderAnimation(true);

    // สร้าง order ใหม่
    const newOrder: Order = {
      orderId: `ORD-${Date.now()}`,
      items: [...cart],
      totalAmount,
      totalItems,
      orderDate: new Date(),
      status: 'preparing',
      tableNumber: currentTable?.number,
    };

    // เพิ่มลงประวัติการสั่งซื้อ
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);

    // บันทึกลง localStorage สำหรับหน้า /orders
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));

    // Hide animation after items fly away
    setTimeout(() => {
      setShowOrderAnimation(false);
      setOrderConfirmed(true);
    }, 2000);

    // Clear cart and close
    setTimeout(() => {
      setCart([]);
      setOrderConfirmed(false);
      setShowCart(false);
      setAnimatingItems([]);
      // แสดง Welcome Modal อีกครั้งหลังสั่งอาหารเสร็จ
      setShowWelcome(true);
    }, 4500);
  };

  // เลือกหมวดหมู่จาก Welcome Modal
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
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
      tableNumber: currentTable?.number,
    };

    // Save to state
    setServiceRequests(prev => [newRequest, ...prev]);

    // Save to localStorage for staff/kitchen to see
    const existingRequests = localStorage.getItem('serviceRequests');
    const requests = existingRequests ? JSON.parse(existingRequests) : [];
    const updatedRequests = [newRequest, ...requests];
    localStorage.setItem('serviceRequests', JSON.stringify(updatedRequests));

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

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-20 h-20 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.search.noResults}</h3>
            <p className="text-gray-500">{t.search.tryDifferentKeyword}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenu.map(item => (
              <MenuCard key={item.id} item={item} onAddToCart={addToCart} />
            ))}
          </div>
        )}
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
        onUpdateDiningOption={updateDiningOption}
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

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onSelectCategory={handleCategorySelect}
        tableNumber={currentTable?.number}
      />

      {/* Floating Action Menu */}
      <FloatingActionMenu
        currentTableNumber={currentTable?.number || 'N/A'}
        onServiceRequest={handleServiceRequest}
        onOpenFloorPlan={() => setShowFloorPlan(true)}
        onOpenWelcome={() => setShowWelcome(true)}
      />

      {/* Order Flying Animation */}
      {showOrderAnimation && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Kitchen Icon at top */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
            <div className="bg-orange-500 text-white p-6 rounded-full shadow-2xl animate-pulse">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-center text-orange-600 font-bold mt-2 text-xl">ห้องครัว</p>
          </div>

          {/* Flying Food Items */}
          {animatingItems.map((item, index) => (
            <div
              key={item.cartItemId}
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2"
              style={{
                animation: `flyToKitchen 2s ease-in-out ${index * 0.15}s forwards`,
                animationDelay: `${index * 0.15}s`,
              }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-orange-500 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600">จำนวน: {item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-xs text-orange-600 mt-1">📝 {item.specialInstructions}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Trail particles */}
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-orange-400 rounded-full"
                style={{
                  animation: `sparkle 1.5s ease-out ${i * 0.05}s forwards`,
                  left: `${Math.random() * 40 - 20}px`,
                  bottom: `${Math.random() * 40 - 20}px`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {orderConfirmed && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center space-x-3">
            <Check className="w-6 h-6" />
            <div>
              <p className="font-bold text-lg">สั่งอาหารสำเร็จแล้ว!</p>
              <p className="text-sm text-green-100">ห้องครัวได้รับออเดอร์แล้วครับ ขอบคุณครับ</p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flyToKitchen {
          0% {
            transform: translate(-50%, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -200px) scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -500px) scale(0.3) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              ${Math.random() * 200 - 100}px,
              ${Math.random() * -300 - 100}px
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
