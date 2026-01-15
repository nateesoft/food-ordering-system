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
import { MenuItem, CartItem, Order, ServiceRequest } from '@/types';
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

  const addToCart = (menuItem: MenuItem, specialInstructions?: string, diningOption: 'dine-in' | 'takeaway' = 'dine-in') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.id === menuItem.id &&
                item.specialInstructions === specialInstructions &&
                item.diningOption === diningOption
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      const cartItemId = `${menuItem.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, { ...menuItem, quantity: 1, specialInstructions, cartItemId, diningOption }];
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

    setOrderConfirmed(true);
    setTimeout(() => {
      setCart([]);
      setOrderConfirmed(false);
      setShowCart(false);
    }, 3000);
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
