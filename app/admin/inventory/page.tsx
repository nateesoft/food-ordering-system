'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Edit, Trash2, Save, X, Home, AlertTriangle,
  ArrowUpDown, History, ChefHat, TrendingDown, TrendingUp,
  ArrowLeft, Search, Check
} from 'lucide-react';
import { api, ApiMenuItem } from '@/lib/api';
import {
  Ingredient, IngredientUnit, MenuItemIngredient, InventoryTransaction,
  TransactionType, MenuAvailability
} from '@/types';

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'GRAM', label: 'กรัม (g)' },
  { value: 'KILOGRAM', label: 'กิโลกรัม (kg)' },
  { value: 'MILLILITER', label: 'มิลลิลิตร (ml)' },
  { value: 'LITER', label: 'ลิตร (L)' },
  { value: 'PIECE', label: 'ชิ้น' },
  { value: 'TABLESPOON', label: 'ช้อนโต๊ะ' },
  { value: 'TEASPOON', label: 'ช้อนชา' },
  { value: 'CUP', label: 'ถ้วย' },
];

const UNIT_LABELS: Record<string, string> = {
  GRAM: 'g', KILOGRAM: 'kg', MILLILITER: 'ml', LITER: 'L',
  PIECE: 'ชิ้น', TABLESPOON: 'ช้อนโต๊ะ', TEASPOON: 'ช้อนชา', CUP: 'ถ้วย',
};

const TRANSACTION_LABELS: Record<string, { label: string; color: string }> = {
  STOCK_IN: { label: 'เพิ่มสต็อก', color: 'bg-green-100 text-green-800' },
  STOCK_OUT: { label: 'ลดสต็อก', color: 'bg-red-100 text-red-800' },
  ORDER_DEDUCTION: { label: 'ตัดจาก Order', color: 'bg-orange-100 text-orange-800' },
  ADJUSTMENT: { label: 'ปรับปรุง', color: 'bg-blue-100 text-blue-800' },
};

export default function InventoryManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'stock' | 'transactions'>('ingredients');

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '', unit: 'GRAM' as IngredientUnit, currentStock: 0, minStock: 0, costPerUnit: 0, isActive: true,
  });

  // Recipes state
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{ ingredientId: number; quantityUsed: number }[]>([]);
  const [recipesMap, setRecipesMap] = useState<Record<number, any[]>>({});
  const [recipeSearch, setRecipeSearch] = useState('');

  // Stock overview state
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [menuAvailability, setMenuAvailability] = useState<MenuAvailability[]>([]);
  const [adjustForm, setAdjustForm] = useState({
    ingredientId: 0, quantity: 0, type: 'STOCK_IN' as 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT', notes: '',
  });
  const [stockOverview, setStockOverview] = useState<any>(null);

  // Transactions state
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [txFilterIngredient, setTxFilterIngredient] = useState<number | undefined>();
  const [txFilterType, setTxFilterType] = useState<TransactionType | undefined>();

  // Shared
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ===== Data Loading =====

  const loadIngredients = async () => {
    try {
      const data = await api.getIngredients();
      setIngredients(data);
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    }
  };

  const loadMenuItems = async () => {
    try {
      const data = await api.getMenuItems();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    }
  };

  const loadAllRecipes = async () => {
    try {
      const data = await api.getAllRecipes();
      const map: Record<number, any[]> = {};
      data.forEach((item: any) => {
        map[item.id] = item.ingredients || [];
      });
      setRecipesMap(map);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    }
  };

  const loadRecipeForMenuItem = async (menuItemId: number) => {
    try {
      const data = await api.getRecipe(menuItemId);
      setRecipeIngredients(
        data.map((r: any) => ({ ingredientId: r.ingredientId, quantityUsed: r.quantityUsed }))
      );
    } catch (err) {
      setRecipeIngredients([]);
    }
  };

  const loadStockOverview = async () => {
    try {
      const [overview, alerts, availability] = await Promise.all([
        api.getStockOverview(),
        api.getLowStockAlerts(),
        api.getMenuAvailability(),
      ]);
      setStockOverview(overview);
      setLowStockAlerts(alerts);
      setMenuAvailability(availability);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getInventoryTransactions({
        ingredientId: txFilterIngredient,
        type: txFilterType,
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadMenuItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'recipes') {
      loadAllRecipes();
      if (ingredients.length === 0) loadIngredients();
    } else if (activeTab === 'stock') {
      loadStockOverview();
      if (ingredients.length === 0) loadIngredients();
    } else if (activeTab === 'transactions') {
      loadTransactions();
      if (ingredients.length === 0) loadIngredients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions();
  }, [txFilterIngredient, txFilterType]);

  // ===== Ingredient CRUD =====

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const openCreateIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm({ name: '', unit: 'GRAM', currentStock: 0, minStock: 0, costPerUnit: 0, isActive: true });
    setShowIngredientModal(true);
  };

  const openEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name, unit: ing.unit, currentStock: ing.currentStock,
      minStock: ing.minStock, costPerUnit: ing.costPerUnit || 0, isActive: ing.isActive,
    });
    setShowIngredientModal(true);
  };

  const saveIngredient = async () => {
    setLoading(true);
    try {
      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, ingredientForm);
        showSuccess('แก้ไขวัตถุดิบสำเร็จ');
      } else {
        await api.createIngredient(ingredientForm);
        showSuccess('เพิ่มวัตถุดิบสำเร็จ');
      }
      setShowIngredientModal(false);
      loadIngredients();
    } catch (err) {
      console.error('Failed to save ingredient:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteIngredient = async (id: number) => {
    if (!confirm('ต้องการลบวัตถุดิบนี้?')) return;
    try {
      await api.deleteIngredient(id);
      showSuccess('ลบวัตถุดิบสำเร็จ');
      loadIngredients();
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
    }
  };

  // ===== Recipe Management =====

  const selectMenuItem = (menuItemId: number) => {
    setSelectedMenuItemId(menuItemId);
    loadRecipeForMenuItem(menuItemId);
  };

  const addRecipeRow = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: 0, quantityUsed: 0 }]);
  };

  const updateRecipeRow = (index: number, field: 'ingredientId' | 'quantityUsed', value: number) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const removeRecipeRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    if (!selectedMenuItemId) return;
    const valid = recipeIngredients.filter((r) => r.ingredientId > 0 && r.quantityUsed > 0);
    setLoading(true);
    try {
      await api.setRecipe({ menuItemId: selectedMenuItemId, ingredients: valid });
      showSuccess('บันทึกสูตรอาหารสำเร็จ');
      loadAllRecipes();
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async () => {
    if (!selectedMenuItemId) return;
    if (!confirm('ต้องการลบสูตรอาหารนี้?')) return;
    try {
      await api.deleteRecipe(selectedMenuItemId);
      setRecipeIngredients([]);
      showSuccess('ลบสูตรอาหารสำเร็จ');
      loadAllRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  // ===== Stock Adjustment =====

  const handleAdjustStock = async () => {
    if (!adjustForm.ingredientId || adjustForm.quantity <= 0) return;
    setLoading(true);
    try {
      await api.adjustStock(adjustForm);
      showSuccess('ปรับสต็อกสำเร็จ');
      setAdjustForm({ ingredientId: 0, quantity: 0, type: 'STOCK_IN', notes: '' });
      loadStockOverview();
      loadIngredients();
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Helper =====

  const getStockColor = (current: number, min: number) => {
    if (current <= 0) return 'bg-red-100 border-red-300 text-red-800';
    if (current <= min) return 'bg-orange-100 border-orange-300 text-orange-800';
    if (current <= min * 1.5) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const filteredMenuItems = menuItems.filter((m) =>
    m.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Success Message */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold animate-bounce">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">จัดการสต็อกวัตถุดิบ</h1>
                <p className="text-emerald-100 text-sm">Inventory Management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/orders')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">กลับ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'ingredients', label: 'วัตถุดิบ', icon: Package },
            { key: 'recipes', label: 'สูตรอาหาร', icon: ChefHat },
            { key: 'stock', label: 'ภาพรวมสต็อก', icon: ArrowUpDown },
            { key: 'transactions', label: 'ประวัติเคลื่อนไหว', icon: History },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ===== TAB 1: Ingredients ===== */}
        {activeTab === 'ingredients' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">รายการวัตถุดิบ ({ingredients.length})</h2>
              <button
                onClick={openCreateIngredient}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                เพิ่มวัตถุดิบ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${
                    !ing.isActive ? 'opacity-50' : ''
                  } ${ing.currentStock <= ing.minStock && ing.isActive ? 'border-red-300' : 'border-transparent'}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{ing.name}</h3>
                        <p className="text-sm text-gray-500">{UNIT_LABELS[ing.unit] || ing.unit}</p>
                      </div>
                      {!ing.isActive && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>

                    <div className={`px-3 py-2 rounded-lg border ${getStockColor(ing.currentStock, ing.minStock)} mb-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">คงเหลือ</span>
                        <span className="text-lg font-bold">{ing.currentStock.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span>ขั้นต่ำ: {ing.minStock.toLocaleString()}</span>
                        {ing.currentStock <= ing.minStock && (
                          <span className="flex items-center gap-1 text-red-600 font-bold">
                            <AlertTriangle className="w-3 h-3" /> ต่ำ!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditIngredient(ing)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold"
                      >
                        <Edit className="w-4 h-4" /> แก้ไข
                      </button>
                      <button
                        onClick={() => deleteIngredient(ing.id)}
                        className="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ingredients.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีวัตถุดิบ</h3>
                <p className="text-gray-500">กดปุ่ม "เพิ่มวัตถุดิบ" เพื่อเริ่มต้น</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 2: Recipes ===== */}
        {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Menu Item List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-gray-800 mb-3">เลือกเมนู</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาเมนู..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {filteredMenuItems.map((item) => {
                    const hasRecipe = !!recipesMap[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectMenuItem(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                          selectedMenuItemId === item.id
                            ? 'bg-emerald-500 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {hasRecipe && (
                          <Check className={`w-4 h-4 flex-shrink-0 ${selectedMenuItemId === item.id ? 'text-white' : 'text-emerald-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Recipe Editor */}
            <div className="lg:col-span-2">
              {selectedMenuItemId ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">
                      สูตร: {menuItems.find((m) => m.id === selectedMenuItemId)?.name}
                    </h3>
                    <div className="flex gap-2">
                      {recipeIngredients.length > 0 && (
                        <button
                          onClick={deleteRecipe}
                          className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
                        >
                          <Trash2 className="w-4 h-4" /> ลบสูตร
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {recipeIngredients.map((row, idx) => (
                      <div key={idx} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => updateRecipeRow(idx, 'ingredientId', Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value={0}>-- เลือกวัตถุดิบ --</option>
                          {ingredients.filter((i) => i.isActive).map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({UNIT_LABELS[ing.unit]})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={row.quantityUsed || ''}
                          onChange={(e) => updateRecipeRow(idx, 'quantityUsed', Number(e.target.value))}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => removeRecipeRow(idx)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addRecipeRow}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" /> เพิ่มวัตถุดิบ
                    </button>
                    <button
                      onClick={saveRecipe}
                      disabled={loading}
                      className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> บันทึกสูตร
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">เลือกเมนูจากรายการด้านซ้ายเพื่อจัดการสูตร</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB 3: Stock Overview ===== */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">วัตถุดิบทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-800">{stockOverview?.totalIngredients || 0}</p>
                  </div>
                  <Package className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">สต็อกต่ำ</p>
                    <p className="text-3xl font-bold text-orange-600">{stockOverview?.lowStock || 0}</p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-orange-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">หมดสต็อก</p>
                    <p className="text-3xl font-bold text-red-600">{stockOverview?.outOfStock || 0}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  แจ้งเตือนวัตถุดิบเหลือน้อย ({lowStockAlerts.length})
                </h3>
                <div className="space-y-2">
                  {lowStockAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{alert.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({UNIT_LABELS[alert.unit]})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 font-bold">{Number(alert.currentStock).toLocaleString()}</span>
                        <span className="text-gray-500 text-sm"> / {Number(alert.minStock).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Adjustment Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-emerald-500" />
                ปรับสต็อก
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={adjustForm.ingredientId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, ingredientId: Number(e.target.value) })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>-- เลือกวัตถุดิบ --</option>
                  {ingredients.filter((i) => i.isActive).map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (คงเหลือ: {ing.currentStock})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="จำนวน"
                  value={adjustForm.quantity || ''}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="STOCK_IN">เพิ่มสต็อก (STOCK_IN)</option>
                  <option value="STOCK_OUT">ลดสต็อก (STOCK_OUT)</option>
                  <option value="ADJUSTMENT">ปรับปรุง (ADJUSTMENT)</option>
                </select>
                <input
                  type="text"
                  placeholder="หมายเหตุ (ไม่บังคับ)"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleAdjustStock}
                disabled={loading || !adjustForm.ingredientId || adjustForm.quantity <= 0}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> บันทึก
              </button>
            </div>

            {/* Menu Availability */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-500" />
                สถานะเมนู (ตามวัตถุดิบ)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {menuAvailability.map((item) => {
                  const menuItem = menuItems.find((m) => m.id === item.menuItemId);
                  return (
                    <div
                      key={item.menuItemId}
                      className={`p-3 rounded-lg border ${
                        item.available
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {menuItem?.name || `Menu #${item.menuItemId}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.available
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {item.available ? 'พร้อม' : 'หมด'}
                        </span>
                      </div>
                      {!item.available && item.insufficientIngredients.length > 0 && (
                        <p className="text-xs text-red-600 mt-1 truncate">
                          ขาด: {item.insufficientIngredients.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 4: Transactions ===== */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800 mb-3">ประวัติเคลื่อนไหวสต็อก</h3>
              <div className="flex flex-wrap gap-3">
                <select
                  value={txFilterIngredient || ''}
                  onChange={(e) => setTxFilterIngredient(e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">วัตถุดิบทั้งหมด</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
                <select
                  value={txFilterType || ''}
                  onChange={(e) => setTxFilterType((e.target.value || undefined) as TransactionType | undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">ประเภททั้งหมด</option>
                  <option value="STOCK_IN">เพิ่มสต็อก</option>
                  <option value="STOCK_OUT">ลดสต็อก</option>
                  <option value="ORDER_DEDUCTION">ตัดจาก Order</option>
                  <option value="ADJUSTMENT">ปรับปรุง</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">วันที่/เวลา</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">วัตถุดิบ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ประเภท</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">จำนวน</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">ก่อน</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">หลัง</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const txInfo = TRANSACTION_LABELS[tx.type] || { label: tx.type, color: 'bg-gray-100 text-gray-800' };
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('th-TH', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold">{tx.ingredient?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${txInfo.color}`}>
                            {txInfo.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.quantity > 0 ? '+' : ''}{tx.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{tx.previousStock.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-800 font-semibold">{tx.newStock.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{tx.orderId || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{tx.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีประวัติเคลื่อนไหว</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Ingredient Modal ===== */}
      {showIngredientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowIngredientModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingIngredient ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}
              </h3>
              <button
                onClick={() => setShowIngredientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อวัตถุดิบ</label>
                <input
                  type="text"
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="เช่น ข้าวสาร, น้ำมัน, ไข่ไก่"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">หน่วย</label>
                <select
                  value={ingredientForm.unit}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value as IngredientUnit })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">สต็อกปัจจุบัน</label>
                  <input
                    type="number"
                    value={ingredientForm.currentStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, currentStock: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">สต็อกขั้นต่ำ</label>
                  <input
                    type="number"
                    value={ingredientForm.minStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, minStock: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  value={ingredientForm.costPerUnit}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, costPerUnit: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ingredientForm.isActive}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                />
                <label className="text-sm font-semibold text-gray-700">เปิดใช้งาน</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowIngredientModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveIngredient}
                disabled={loading || !ingredientForm.name}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> {editingIngredient ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
