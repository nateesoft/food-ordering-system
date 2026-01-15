'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SearchBar } from '@/components/SearchBar';
import { MenuCard } from '@/components/MenuCard';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderHistory } from '@/components/OrderHistory';
import { FloatingActionMenu } from '@/components/FloatingActionMenu';
import { menuItems } from '@/data/menuItems';
import { MenuItem, CartItem, Order, ServiceRequest, AddOn, AddOnGroup } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface TableOrderClientProps {
  tableNumber: string;
}

export default function TableOrderClient({ tableNumber }: TableOrderClientProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(t.categories.all);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showOrderAnimation, setShowOrderAnimation] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<CartItem[]>([]);

  // Filter menu
  const filteredMenu = React.useMemo(() => {
    let filtered = menuItems;

    if (selectedCategory !== t.categories.all && selectedCategory !== 'ทั้งหมด') {
      const categoryMap: Record<string, string> = {
        [t.foodCategories.singleDish]: 'อาหารจานเดียว',
        [t.foodCategories.appetizers]: 'อาหารว่าง',
        [t.foodCategories.desserts]: 'ของหวาน',
        [t.foodCategories.beverages]: 'เครื่องดื่ม',
      };
      const thaiCategory = categoryMap[selectedCategory] || selectedCategory;
      filtered = filtered.filter(item => item.category === thaiCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, t]);

  const totalAmount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (menuItem: MenuItem, specialInstructions?: string, diningOption: 'dine-in' | 'takeaway' = 'dine-in', selectedAddOns?: AddOn[], selectedAddOnGroups?: AddOnGroup[]) => {
    setCart(prevCart => {
      // Serialize add-ons and groups for comparison
      const addOnsKey = selectedAddOns?.map(a => a.id).sort().join(',') || '';
      const addOnGroupsKey = selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';

      const existingItem = prevCart.find(item => {
        const itemAddOnsKey = item.selectedAddOns?.map(a => a.id).sort().join(',') || '';
        const itemAddOnGroupsKey = item.selectedAddOnGroups?.map(g => g.id).sort().join(',') || '';
        return item.id === menuItem.id &&
               item.specialInstructions === specialInstructions &&
               item.diningOption === diningOption &&
               itemAddOnsKey === addOnsKey &&
               itemAddOnGroupsKey === addOnGroupsKey;
      });

      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // คำนวณราคารวมกับ add-ons และ groups
      const addOnsTotal = selectedAddOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
      const addOnGroupsTotal = selectedAddOnGroups?.reduce((sum, group) => sum + group.price, 0) || 0;
      const finalPrice = menuItem.price + addOnsTotal + addOnGroupsTotal;

      const cartItemId = `${menuItem.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, {
        ...menuItem,
        price: finalPrice,
        quantity: 1,
        specialInstructions,
        cartItemId,
        diningOption,
        selectedAddOns,
        selectedAddOnGroups
      }];
    });
  };

  const increaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (cartItemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  const updateSpecialInstructions = (cartItemId: string, instructions: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, specialInstructions: instructions } : item
      )
    );
  };

  const updateDiningOption = (cartItemId: string, option: 'dine-in' | 'takeaway') => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, diningOption: option } : item
      )
    );
  };

  const confirmOrder = () => {
    // Store items for animation
    setAnimatingItems([...cart]);
    setShowOrderAnimation(true);

    const newOrder: Order = {
      orderId: `ORD-${Date.now()}`,
      items: [...cart],
      totalAmount,
      totalItems,
      orderDate: new Date(),
      status: 'preparing',
      tableNumber: tableNumber,
    };

    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);

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
    }, 4500);
  };

  const handleServiceRequest = (type: 'staff' | 'utensils' | 'payment', details?: string, items?: string[]) => {
    const newRequest: ServiceRequest = {
      id: `REQ-${Date.now()}`,
      type,
      timestamp: new Date(),
      details,
      items,
      status: 'pending',
      tableNumber: tableNumber,
    };

    const existingRequests = localStorage.getItem('serviceRequests');
    const requests = existingRequests ? JSON.parse(existingRequests) : [];
    const updatedRequests = [newRequest, ...requests];
    localStorage.setItem('serviceRequests', JSON.stringify(updatedRequests));

    console.log('Service Request:', newRequest);
  };

  const categories = React.useMemo(() => {
    return ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Table Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">โต๊ะ {tableNumber}</h1>
                <p className="text-orange-100 text-sm">สั่งอาหารและเครื่องดื่ม</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Table Number</p>
              <p className="text-3xl font-bold">{tableNumber}</p>
            </div>
          </div>
        </div>
      </div>

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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

      <OrderHistory
        isOpen={showOrderHistory}
        orders={orderHistory}
        onClose={() => setShowOrderHistory(false)}
      />

      <FloatingActionMenu
        currentTableNumber={tableNumber}
        onServiceRequest={handleServiceRequest}
        onOpenFloorPlan={() => {}}
        onOpenWelcome={() => {}}
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
