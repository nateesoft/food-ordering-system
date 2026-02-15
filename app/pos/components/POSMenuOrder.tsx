'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiMenuItem, ApiNestedMenuOption } from '@/lib/api';
import { AddOn, AddOnGroup, SelectedNestedOption, NestedMenuOption } from '@/types';
import { addOns as availableAddOnsData } from '@/data/addOns';
import { addOnGroups as availableAddOnGroupsData } from '@/data/addOnGroups';
import { nestedMenuOptions, calculateNestedMenuPrice } from '@/data/nestedMenuOptions';
import { NestedMenuModal } from '@/components/NestedMenuModal';
import {
  Search, Plus, Minus, X, ShoppingCart, Send, CreditCard,
  ChevronDown, ChevronUp, UtensilsCrossed, ImageOff,
} from 'lucide-react';

interface POSMenuOrderProps {
  tableNumber: string;
  tableId: number;
  sessionId?: number;
  cashierName: string;
  onOrderSent: () => void;
  onGoToPayment: () => void;
}

interface CartItemLocal {
  cartItemId: string;
  id: number;
  name: string;
  price: number;
  basePrice: number;
  quantity: number;
  image: string | null;
  specialInstructions: string;
  diningOption: 'dine-in' | 'takeaway';
  selectedAddOns: AddOn[];
  selectedAddOnGroups: AddOnGroup[];
  selectedNestedOptions: SelectedNestedOption[];
}

type MenuItemWithStock = ApiMenuItem & { isOutOfStock?: boolean };

const COMMON_INSTRUCTIONS = [
  'เผ็ดมาก', 'เผ็ดน้อย', 'ไม่เผ็ด',
  'ไม่ใส่ผัก', 'ไม่ใส่ผักชี', 'ซอสแยก',
];

function mapApiToNestedOption(opt: ApiNestedMenuOption): NestedMenuOption {
  return {
    id: opt.id,
    name: opt.name,
    description: opt.description || undefined,
    price: opt.price,
    image: opt.image || undefined,
    type: opt.type as 'single' | 'group',
    requireChildSelection: opt.requireChildSelection,
    minChildSelections: opt.minChildSelections ?? undefined,
    maxChildSelections: opt.maxChildSelections ?? undefined,
    childOptions: opt.children?.map(mapApiToNestedOption),
  };
}

export default function POSMenuOrder({
  tableNumber,
  tableId,
  sessionId,
  cashierName,
  onOrderSent,
  onGoToPayment,
}: POSMenuOrderProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemWithStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItemLocal[]>([]);
  const [sending, setSending] = useState(false);
  const [expandedCartItem, setExpandedCartItem] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Item detail modal state
  const [selectedItem, setSelectedItem] = useState<MenuItemWithStock | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showNestedMenuModal, setShowNestedMenuModal] = useState(false);
  const [modalInstructions, setModalInstructions] = useState<string[]>([]);
  const [modalCustomInstruction, setModalCustomInstruction] = useState('');
  const [modalDiningOption, setModalDiningOption] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [modalAddOns, setModalAddOns] = useState<AddOn[]>([]);
  const [modalAddOnGroups, setModalAddOnGroups] = useState<AddOnGroup[]>([]);
  const [modalNestedOptions, setModalNestedOptions] = useState<SelectedNestedOption[]>([]);
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(true);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);

  // Fetch categories and menu items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items, availability] = await Promise.all([
          api.getMenuCategories(),
          api.getMenuItems({ isActive: true }),
          api.getMenuAvailability().catch(() => []),
        ]);
        setCategories(cats);
        const availMap = new Map(availability.map((a) => [a.menuItemId, a.available]));
        setMenuItems(items.map((item) => ({
          ...item,
          isOutOfStock: availMap.has(item.id) ? !availMap.get(item.id) : false,
        })));
      } catch (err) {
        console.error('Failed to fetch menu data:', err);
      }
    };
    fetchData();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = !activeCategory || item.category === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ===== Item Click → Open Modal =====
  const handleItemClick = (item: MenuItemWithStock) => {
    if (item.isOutOfStock) return;
    setSelectedItem(item);
    resetModalState();

    const hasNested = item.nestedMenuConfig?.enabled &&
      item.nestedMenuConfig.rootOptions && item.nestedMenuConfig.rootOptions.length > 0;

    if (hasNested) {
      setShowNestedMenuModal(true);
    } else {
      setShowItemModal(true);
    }
  };

  const resetModalState = () => {
    setModalInstructions([]);
    setModalCustomInstruction('');
    setModalDiningOption('dine-in');
    setModalAddOns([]);
    setModalAddOnGroups([]);
    setModalNestedOptions([]);
    setIsAddOnsExpanded(true);
    setIsGroupsExpanded(true);
  };

  const handleNestedMenuConfirm = (selections: SelectedNestedOption[]) => {
    setModalNestedOptions(selections);
    setShowNestedMenuModal(false);
    setShowItemModal(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;
    const allInstructions = [...modalInstructions];
    if (modalCustomInstruction.trim()) allInstructions.push(modalCustomInstruction.trim());

    const addOnsTotal = modalAddOns.reduce((s, a) => s + a.price, 0);
    const groupsTotal = modalAddOnGroups.reduce((s, g) => s + g.price, 0);
    const nestedTotal = calculateNestedMenuPrice(modalNestedOptions);
    const finalPrice = selectedItem.price + addOnsTotal + groupsTotal + nestedTotal;

    const newItem: CartItemLocal = {
      cartItemId: `${selectedItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      id: selectedItem.id,
      name: selectedItem.name,
      price: finalPrice,
      basePrice: selectedItem.price,
      quantity: 1,
      image: selectedItem.image,
      specialInstructions: allInstructions.join(', '),
      diningOption: modalDiningOption,
      selectedAddOns: [...modalAddOns],
      selectedAddOnGroups: [...modalAddOnGroups],
      selectedNestedOptions: [...modalNestedOptions],
    };

    setCart((prev) => [...prev, newItem]);
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const handleCancelModal = () => {
    setShowItemModal(false);
    setShowNestedMenuModal(false);
    setSelectedItem(null);
  };

  // ===== Cart Operations =====
  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.cartItemId === cartItemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.cartItemId !== cartItemId));
    setExpandedCartItem((prev) => prev === cartItemId ? null : prev);
  }, []);

  // ===== Calculations =====
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const serviceCharge = subtotal * 0.1;
  const vat = (subtotal + serviceCharge) * 0.07;
  const grandTotal = subtotal + serviceCharge + vat;
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  // ===== Send Order =====
  const handleSendOrder = async () => {
    if (cart.length === 0 || sending) return;
    setSending(true);
    try {
      await api.createOrder({
        tableNumber,
        totalAmount: grandTotal,
        totalItems,
        serviceCharge,
        vat,
        sessionId,
        items: cart.map((c) => ({
          menuItemId: c.id,
          quantity: c.quantity,
          price: c.price,
          diningOption: c.diningOption,
          ...(c.specialInstructions ? { specialInstructions: c.specialInstructions } : {}),
          ...(c.selectedAddOns.length > 0 ? { selectedAddOns: JSON.stringify(c.selectedAddOns) } : {}),
          ...(c.selectedAddOnGroups.length > 0 ? { selectedAddOnGroups: JSON.stringify(c.selectedAddOnGroups) } : {}),
          ...(c.selectedNestedOptions.length > 0 ? { selectedNestedOptions: JSON.stringify(c.selectedNestedOptions) } : {}),
        })),
      });
      setCart([]);
      setExpandedCartItem(null);
      setIsCartOpen(false);
      onOrderSent();
    } catch (err) {
      console.error('Failed to send order:', err);
      alert('ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
  };

  // ===== Modal Helpers =====
  const itemAddOns = selectedItem?.availableAddOns
    ? availableAddOnsData.filter((a) => selectedItem.availableAddOns?.includes(a.id))
    : [];

  const itemAddOnGroups = selectedItem?.availableAddOnGroups
    ? availableAddOnGroupsData.filter((g) => selectedItem.availableAddOnGroups?.includes(g.id))
    : [];

  const itemNestedOptions: NestedMenuOption[] = selectedItem?.nestedMenuConfig?.enabled
    ? selectedItem.nestedMenuConfig.rootOptions.map((ro) => mapApiToNestedOption(ro.nestedMenuOption))
    : [];

  const modalAddOnsTotal = modalAddOns.reduce((s, a) => s + a.price, 0);
  const modalGroupsTotal = modalAddOnGroups.reduce((s, g) => s + g.price, 0);
  const modalNestedTotal = calculateNestedMenuPrice(modalNestedOptions);
  const modalTotalPrice = (selectedItem?.price || 0) + modalAddOnsTotal + modalGroupsTotal + modalNestedTotal;

  const toggleAddOn = (addOn: AddOn) => {
    setModalAddOns((prev) => prev.find((a) => a.id === addOn.id)
      ? prev.filter((a) => a.id !== addOn.id)
      : [...prev, addOn]);
  };

  const toggleAddOnGroup = (group: AddOnGroup) => {
    setModalAddOnGroups((prev) => prev.find((g) => g.id === group.id)
      ? prev.filter((g) => g.id !== group.id)
      : [...prev, group]);
  };

  const toggleInstruction = (inst: string) => {
    setModalInstructions((prev) => prev.includes(inst)
      ? prev.filter((i) => i !== inst)
      : [...prev, inst]);
  };

  const getOptionsLabel = (item: CartItemLocal): string | null => {
    const parts: string[] = [];
    if (item.selectedNestedOptions.length > 0) {
      parts.push(item.selectedNestedOptions.map((s) => s.option.name).join(', '));
    }
    if (item.selectedAddOns.length > 0) {
      parts.push(item.selectedAddOns.map((a) => a.name).join(', '));
    }
    if (item.selectedAddOnGroups.length > 0) {
      parts.push(item.selectedAddOnGroups.map((g) => g.name).join(', '));
    }
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  // ===== Cart Content (shared between sidebar and drawer) =====
  const renderCartItems = () => (
    <>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
          <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">ยังไม่มีรายการ</p>
        </div>
      ) : (
        cart.map((item) => {
          const optionsLabel = getOptionsLabel(item);
          return (
            <div key={item.cartItemId} className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-3 space-y-2 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {optionsLabel && (
                    <p className="text-[11px] text-orange-600 mt-0.5 truncate">{optionsLabel}</p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.specialInstructions}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    ฿{item.price.toFixed(0)}{item.diningOption === 'takeaway' ? ' (กลับบ้าน)' : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:shadow-sm active:scale-95 transition-all duration-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:shadow-sm active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-800">฿{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            </div>
          );
        })
      )}
    </>
  );

  const renderCartSummary = () => (
    <div className="border-t border-gray-200/50 p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white">
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>ยอดรวม</span>
          <span>฿{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ค่าบริการ (10%)</span>
          <span>฿{serviceCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>VAT (7%)</span>
          <span>฿{vat.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-300">
          <span>ยอดสุทธิ</span>
          <span className="text-blue-600">฿{grandTotal.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <button
          onClick={handleSendOrder}
          disabled={cart.length === 0 || sending}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
            cart.length === 0 || sending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98]'
          }`}
        >
          <Send className="w-4 h-4" />
          {sending ? 'กำลังส่ง...' : 'ส่งออเดอร์'}
        </button>
        <button
          onClick={onGoToPayment}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:shadow-xl active:scale-[0.98] transition-all duration-300"
        >
          <CreditCard className="w-4 h-4" />
          ชำระเงิน
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Categories - Horizontal scroll on mobile/tablet */}
      <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-gray-200/50 overflow-x-auto scrollbar-hide px-3 py-2.5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeCategory === null
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Categories Sidebar */}
      <div className="hidden lg:flex w-48 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 flex-col overflow-y-auto">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">หมวดหมู่</h3>
        </div>
        <div className="flex-1 p-2 space-y-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeCategory === null
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Center Column - Menu Items */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="p-3 md:p-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
              <UtensilsCrossed className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">ไม่พบเมนู</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.isOutOfStock}
                  className={`relative bg-white rounded-2xl border border-gray-200/50 overflow-hidden text-left transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98] ${
                    item.isOutOfStock ? 'opacity-60 cursor-not-allowed hover:scale-100 hover:translate-y-0 hover:shadow-md' : 'cursor-pointer'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ImageOff className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {item.isOutOfStock && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/40 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">หมดสต็อก</span>
                      </div>
                    )}
                    {item.type && item.type !== 'SINGLE' && (
                      <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase shadow-md">
                        {item.type}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">฿{item.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-80 bg-white/95 backdrop-blur-xl border-l border-gray-200/50 flex-col">
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg shadow-md">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">รายการสั่ง</h3>
          </div>
          {totalItems > 0 && (
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">{totalItems}</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {renderCartItems()}
        </div>
        {renderCartSummary()}
      </div>

      {/* Mobile/Tablet: Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/40 z-30 active:scale-95 transition-all duration-300 hover:shadow-blue-500/60"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
            {totalItems}
          </span>
        )}
      </button>

      {/* Mobile/Tablet: Cart Drawer Backdrop */}
      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in" onClick={() => setIsCartOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile/Tablet: Cart Bottom Drawer */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
        isCartOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-center py-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg shadow-md">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800">รายการสั่ง</h3>
              {totalItems > 0 && (
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">{totalItems}</span>
              )}
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {renderCartItems()}
          </div>
          {renderCartSummary()}
        </div>
      </div>

      {/* ===== Item Detail Modal ===== */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelModal} />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[95vh] md:max-h-[90vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex-shrink-0 p-5 border-b border-gray-200/50">
              <button onClick={handleCancelModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-bold text-gray-800">{selectedItem.name}</h3>
              <p className="text-sm text-gray-500 mt-1">฿{selectedItem.price.toFixed(0)} | เลือกตัวเลือกเพิ่มเติม</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Common Instructions */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">คำขอพิเศษ</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_INSTRUCTIONS.map((inst) => (
                    <button
                      key={inst}
                      onClick={() => toggleInstruction(inst)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        modalInstructions.includes(inst)
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instruction */}
              <textarea
                value={modalCustomInstruction}
                onChange={(e) => setModalCustomInstruction(e.target.value)}
                placeholder="คำขอพิเศษเพิ่มเติม เช่น ไม่ใส่หอม..."
                className="w-full px-4 py-2.5 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-gray-50/50 transition-all duration-300"
                rows={2}
              />

              {/* Set Components */}
              {selectedItem.setComponents && selectedItem.setComponents.length > 0 && (
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                  <p className="text-xs text-blue-800 font-medium mb-2">รายการในเซ็ต:</p>
                  <ul className="space-y-1">
                    {selectedItem.setComponents.map((comp: any, idx: number) => (
                      <li key={idx} className="text-sm text-blue-900 flex justify-between">
                        <span>• {comp.name}</span>
                        <span className="font-medium">x{comp.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nested Options Summary */}
              {modalNestedOptions.length > 0 && (
                <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 shadow-sm">
                  <p className="text-xs text-purple-800 font-medium mb-1">ตัวเลือกเมนู:</p>
                  {modalNestedOptions.map((sel, idx) => (
                    <p key={idx} className="text-sm text-purple-900">• {sel.option.name} {sel.option.price > 0 ? `+฿${sel.option.price}` : ''}</p>
                  ))}
                </div>
              )}

              {/* Add-ons */}
              {itemAddOns.length > 0 && (
                <div>
                  <button
                    onClick={() => setIsAddOnsExpanded(!isAddOnsExpanded)}
                    className="w-full flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded-lg transition-all duration-300"
                  >
                    <p className="text-sm font-medium text-gray-700">เพิ่มเติม (Add-ons)</p>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isAddOnsExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isAddOnsExpanded && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto animate-fade-in">
                      {itemAddOns.map((addOn) => {
                        const isSelected = modalAddOns.some((a) => a.id === addOn.id);
                        return (
                          <button
                            key={addOn.id}
                            onClick={() => toggleAddOn(addOn)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all duration-300 text-sm ${
                              isSelected ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10' : 'border-gray-200/50 hover:border-gray-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                                isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-medium text-gray-800">{addOn.name}</span>
                            </div>
                            <span className={`font-bold ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>+฿{addOn.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Add-on Groups */}
              {itemAddOnGroups.length > 0 && (
                <div>
                  <button
                    onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
                    className="w-full flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded-lg transition-all duration-300"
                  >
                    <p className="text-sm font-medium text-gray-700">เซ็ตพิเศษ (Groups)</p>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isGroupsExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isGroupsExpanded && (
                    <div className="space-y-2 max-h-48 overflow-y-auto animate-fade-in">
                      {itemAddOnGroups.map((group) => {
                        const isSelected = modalAddOnGroups.some((g) => g.id === group.id);
                        const groupAddOns = availableAddOnsData.filter((a) => group.addOnIds.includes(a.id));
                        return (
                          <button
                            key={group.id}
                            onClick={() => toggleAddOnGroup(group)}
                            className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                              isSelected ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md shadow-green-500/10' : 'border-gray-200/50 hover:border-gray-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-gray-800">{group.name}</span>
                              </div>
                              <span className={`text-sm font-bold ${isSelected ? 'text-green-600' : 'text-gray-600'}`}>฿{group.price}</span>
                            </div>
                            {group.description && <p className="text-xs text-gray-500 ml-7">{group.description}</p>}
                            <div className="flex flex-wrap gap-1 mt-1 ml-7">
                              {groupAddOns.map((a) => (
                                <span key={a.id} className="text-[10px] bg-white/80 text-gray-600 px-1.5 py-0.5 rounded shadow-sm">
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200/50 bg-white p-5 space-y-3 rounded-b-2xl">
              {/* Price Summary */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                <span className="text-sm font-medium text-blue-800">ราคารวม:</span>
                <span className="text-xl font-bold text-blue-600">฿{modalTotalPrice.toFixed(0)}</span>
              </div>

              {/* Dining Option */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModalDiningOption('dine-in')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    modalDiningOption === 'dine-in'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                  }`}
                >
                  ทานที่ร้าน
                </button>
                <button
                  onClick={() => setModalDiningOption('takeaway')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    modalDiningOption === 'takeaway'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'
                  }`}
                >
                  สั่งกลับบ้าน
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelModal}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm transition-all duration-300 shadow-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmAdd}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
                >
                  เพิ่มลงรายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Nested Menu Modal ===== */}
      {selectedItem && (
        <NestedMenuModal
          isOpen={showNestedMenuModal}
          options={itemNestedOptions}
          onClose={handleCancelModal}
          onConfirm={handleNestedMenuConfirm}
          minSelections={selectedItem.nestedMenuConfig?.minSelections}
          maxSelections={selectedItem.nestedMenuConfig?.maxSelections}
          requireSelection={selectedItem.nestedMenuConfig?.requireSelection}
        />
      )}
    </div>
  );
}
