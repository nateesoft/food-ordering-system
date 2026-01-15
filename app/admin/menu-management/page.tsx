'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Home, Settings, X, Save } from 'lucide-react';
import { MenuItem, AddOn, SetComponent } from '@/types';
import { menuItems as initialMenuItems } from '@/data/menuItems';
import { addOns as initialAddOns } from '@/data/addOns';

export default function MenuManagementPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [addOns, setAddOns] = useState<AddOn[]>(initialAddOns);
  const [categories, setCategories] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'addons' | 'categories'>('menu');

  useEffect(() => {
    // Extract unique categories from menu items
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    setCategories(uniqueCategories);
  }, [menuItems]);

  // Menu Item Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: '',
    price: 0,
    image: '',
    description: '',
    type: 'single',
    availableAddOns: [],
    setComponents: [],
    isActive: true,
  });

  // Add-on Form State
  const [addOnFormData, setAddOnFormData] = useState<Partial<AddOn>>({
    name: '',
    price: 0,
    category: 'topping',
  });

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: categories[0] || 'อาหารจานเดียว',
      price: 0,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      description: '',
      type: 'single',
      availableAddOns: [],
      setComponents: [],
      isActive: true,
    });
    setShowEditModal(true);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.category) {
      alert('กรุณากรอกชื่อเมนูและหมวดหมู่');
      return;
    }

    if (editingItem) {
      // Update existing item
      setMenuItems(prev => prev.map(item =>
        item.id === editingItem.id ? { ...formData, id: item.id } as MenuItem : item
      ));
    } else {
      // Create new item
      const newId = Math.max(...menuItems.map(i => i.id), 0) + 1;
      setMenuItems(prev => [...prev, { ...formData, id: newId } as MenuItem]);
    }
    setShowEditModal(false);
  };

  const handleDeleteItem = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเมนูนี้?')) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEditAddOn = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setAddOnFormData(addOn);
    setShowAddOnModal(true);
  };

  const handleCreateAddOn = () => {
    setEditingAddOn(null);
    setAddOnFormData({
      name: '',
      price: 0,
      category: 'topping',
    });
    setShowAddOnModal(true);
  };

  const handleSaveAddOn = () => {
    if (!addOnFormData.name) {
      alert('กรุณากรอกชื่อ Add-on');
      return;
    }

    if (editingAddOn) {
      setAddOns(prev => prev.map(item =>
        item.id === editingAddOn.id ? { ...addOnFormData, id: item.id } as AddOn : item
      ));
    } else {
      const newId = Math.max(...addOns.map(i => i.id), 0) + 1;
      setAddOns(prev => [...prev, { ...addOnFormData, id: newId } as AddOn]);
    }
    setShowAddOnModal(false);
  };

  const handleDeleteAddOn = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบ Add-on นี้?')) {
      setAddOns(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      alert('หมวดหมู่นี้มีอยู่แล้ว');
      return;
    }
    setCategories(prev => [...prev, newCategory.trim()]);
    setNewCategory('');
  };

  const handleDeleteCategory = (category: string) => {
    const itemsInCategory = menuItems.filter(item => item.category === category);
    if (itemsInCategory.length > 0) {
      alert(`ไม่สามารถลบได้ เพราะมีเมนู ${itemsInCategory.length} รายการในหมวดหมู่นี้`);
      return;
    }
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${category}"?`)) {
      setCategories(prev => prev.filter(c => c !== category));
    }
  };

  const addSetComponent = () => {
    const newComponent: SetComponent = {
      id: 0,
      name: '',
      description: '',
      quantity: 1,
    };
    setFormData(prev => ({
      ...prev,
      setComponents: [...(prev.setComponents || []), newComponent],
    }));
  };

  const removeSetComponent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      setComponents: prev.setComponents?.filter((_, i) => i !== index),
    }));
  };

  const updateSetComponent = (index: number, field: keyof SetComponent, value: any) => {
    setFormData(prev => ({
      ...prev,
      setComponents: prev.setComponents?.map((comp, i) =>
        i === index ? { ...comp, [field]: value } : comp
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">จัดการเมนูอาหาร</h1>
                <p className="text-xs sm:text-sm text-gray-600">เพิ่ม แก้ไข ลบเมนูและ Add-ons</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/orders')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>ออเดอร์</span>
              </button>

              <button
                onClick={() => router.push('/')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>หน้าหลัก</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            รายการเมนู ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'addons'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Add-ons / Toppings ({addOns.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            หมวดหมู่ ({categories.length})
          </button>
        </div>

        {/* Menu Items Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">รายการเมนูทั้งหมด</h2>
              <button
                onClick={handleCreateItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                เพิ่มเมนูใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ฿{item.price}
                    </div>
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold uppercase">
                      {item.type}
                    </div>
                    {!item.isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">ปิดใช้งาน</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    {item.type === 'set' || item.type === 'group' ? (
                      <div className="mb-3 text-xs text-gray-600">
                        <p className="font-semibold">ประกอบด้วย:</p>
                        <ul className="list-disc list-inside">
                          {item.setComponents?.slice(0, 3).map((comp, idx) => (
                            <li key={idx}>{comp.name} x{comp.quantity}</li>
                          ))}
                          {(item.setComponents?.length || 0) > 3 && <li>และอื่นๆ...</li>}
                        </ul>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Tab */}
        {activeTab === 'addons' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add-ons / Toppings ทั้งหมด</h2>
              <button
                onClick={handleCreateAddOn}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                เพิ่ม Add-on
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {addOns.map((addOn) => (
                <div key={addOn.id} className="bg-white rounded-xl shadow-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{addOn.name}</h3>
                      <p className="text-xs text-gray-500 uppercase">{addOn.category}</p>
                    </div>
                    <span className="text-orange-500 font-bold text-lg">฿{addOn.price}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditAddOn(addOn)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteAddOn(addOn.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">เพิ่มหมวดหมู่ใหม่</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="ชื่อหมวดหมู่"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  เพิ่ม
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const itemCount = menuItems.filter(item => item.category === category).length;
                return (
                  <div key={category} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{category}</h3>
                        <p className="text-sm text-gray-500">{itemCount} เมนู</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Menu Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเมนู *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="เช่น ผัดไทย"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่ *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ราคา (บาท) *</label>
                <input
                  type="number"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL รูปภาพ</label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="อธิบายเมนูอาหาร"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท *</label>
                <select
                  value={formData.type || 'single'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'single' | 'set' | 'group' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="single">เมนูเดี่ยว (Single)</option>
                  <option value="set">เซ็ตอาหาร (Set)</option>
                  <option value="group">เซ็ตกรุ๊ป (Group)</option>
                </select>
              </div>

              {/* Set Components (if type is set or group) */}
              {(formData.type === 'set' || formData.type === 'group') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">รายการในเซ็ต</label>
                    <button
                      onClick={addSetComponent}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มรายการ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.setComponents?.map((comp, index) => (
                      <div key={index} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => updateSetComponent(index, 'name', e.target.value)}
                          placeholder="ชื่อรายการ"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={comp.quantity}
                          onChange={(e) => updateSetComponent(index, 'quantity', Number(e.target.value))}
                          placeholder="จำนวน"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="1"
                        />
                        <button
                          onClick={() => removeSetComponent(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Add-ons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons ที่สามารถเลือกได้</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {addOns.map((addOn) => (
                    <label key={addOn.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availableAddOns?.includes(addOn.id) || false}
                        onChange={(e) => {
                          const currentAddOns = formData.availableAddOns || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, availableAddOns: [...currentAddOns, addOn.id] });
                          } else {
                            setFormData({ ...formData, availableAddOns: currentAddOns.filter(id => id !== addOn.id) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{addOn.name} (+฿{addOn.price})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Is Active */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium text-gray-700">เปิดใช้งานเมนูนี้</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Add-on Modal */}
      {showAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAddOnModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowAddOnModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingAddOn ? 'แก้ไข Add-on' : 'เพิ่ม Add-on ใหม่'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ Add-on *</label>
                <input
                  type="text"
                  value={addOnFormData.name || ''}
                  onChange={(e) => setAddOnFormData({ ...addOnFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="เช่น ไข่ดาว"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ราคา (บาท) *</label>
                <input
                  type="number"
                  value={addOnFormData.price || 0}
                  onChange={(e) => setAddOnFormData({ ...addOnFormData, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท *</label>
                <select
                  value={addOnFormData.category || 'topping'}
                  onChange={(e) => setAddOnFormData({ ...addOnFormData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="topping">Topping (ท็อปปิ้ง)</option>
                  <option value="side">Side (เครื่องเคียง)</option>
                  <option value="sauce">Sauce (น้ำจิ้ม)</option>
                  <option value="extra">Extra (เพิ่มเติม)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddOnModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveAddOn}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
