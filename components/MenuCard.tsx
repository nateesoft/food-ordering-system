'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { MenuItem, AddOn, AddOnGroup } from '@/types';
import StarRating from './StarRating';
import { useLanguage } from '@/contexts/LanguageContext';
import { addOns as availableAddOns } from '@/data/addOns';
import { addOnGroups as availableAddOnGroups } from '@/data/addOnGroups';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, specialInstructions?: string, diningOption?: 'dine-in' | 'takeaway', selectedAddOns?: AddOn[], selectedAddOnGroups?: AddOnGroup[]) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  const { t } = useLanguage();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [diningOption, setDiningOption] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnGroups, setSelectedAddOnGroups] = useState<AddOnGroup[]>([]);
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(true);
  const [isAddOnGroupsExpanded, setIsAddOnGroupsExpanded] = useState(true);

  const handleAddToCart = () => {
    setShowInstructionsModal(true);
  };

  const handleConfirmAdd = () => {
    const allInstructions = [...selectedInstructions];
    if (customInstruction.trim()) {
      allInstructions.push(customInstruction.trim());
    }
    const finalInstructions = allInstructions.join(', ');
    onAddToCart(item, finalInstructions, diningOption, selectedAddOns, selectedAddOnGroups);
    setSelectedInstructions([]);
    setCustomInstruction('');
    setDiningOption('dine-in');
    setSelectedAddOns([]);
    setSelectedAddOnGroups([]);
    setShowInstructionsModal(false);
  };

  const handleCancelAdd = () => {
    setSelectedInstructions([]);
    setCustomInstruction('');
    setSelectedAddOns([]);
    setSelectedAddOnGroups([]);
    setShowInstructionsModal(false);
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.id === addOn.id);
      if (exists) {
        return prev.filter(a => a.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const toggleAddOnGroup = (group: AddOnGroup) => {
    setSelectedAddOnGroups(prev => {
      const exists = prev.find(g => g.id === group.id);
      if (exists) {
        return prev.filter(g => g.id !== group.id);
      } else {
        return [...prev, group];
      }
    });
  };

  // Get available add-ons for this item
  const itemAddOns = item.availableAddOns
    ? availableAddOns.filter(addOn => item.availableAddOns?.includes(addOn.id))
    : [];

  // Get available add-on groups for this item
  const itemAddOnGroups = item.availableAddOnGroups
    ? availableAddOnGroups.filter(group => item.availableAddOnGroups?.includes(group.id))
    : [];

  // Calculate total price with add-ons and groups
  const addOnsTotalPrice = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const addOnGroupsTotalPrice = selectedAddOnGroups.reduce((sum, group) => sum + group.price, 0);
  const totalPrice = item.price + addOnsTotalPrice + addOnGroupsTotalPrice;

  // Common instructions - using translations
  const commonInstructions = [
    t.commonInstructions.verySpicy,
    t.commonInstructions.lessSpicy,
    t.commonInstructions.noSpicy,
    t.commonInstructions.noVegetables,
    t.commonInstructions.noCoriander,
    t.commonInstructions.sauceSeparate,
  ];

  // Toggle การเลือกคำขอพิเศษ
  const toggleInstruction = (instruction: string) => {
    setSelectedInstructions(prev => {
      if (prev.includes(instruction)) {
        return prev.filter(item => item !== instruction);
      } else {
        return [...prev, instruction];
      }
    });
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showInstructionsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showInstructionsModal]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
        <div className="relative overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            ฿{item.price}
          </div>
          {item.type && item.type !== 'single' && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold uppercase">
              {item.type}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-500 mb-1">{item.category}</p>
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
          {item.rating && (
            <div className="mb-4">
              <StarRating rating={item.rating} reviewCount={item.reviewCount} />
            </div>
          )}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t.menuCard.addToCart}</span>
          </button>
        </div>
      </div>

      {/* Modal สำหรับกรอกคำขอพิเศษ */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancelAdd}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <button
              onClick={handleCancelAdd}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{t.menuCard.specialInstructions}</p>

            {/* Common instruction buttons */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">{t.menuCard.selectCommonRequests}</p>
              <div className="flex flex-wrap gap-2">
                {commonInstructions.map((instruction) => (
                  <button
                    key={instruction}
                    onClick={() => toggleInstruction(instruction)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedInstructions.includes(instruction)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {instruction}
                  </button>
                ))}
              </div>
            </div>

            {/* Show selected items */}
            {selectedInstructions.length > 0 && (
              <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800 font-medium mb-1">{t.menuCard.selectedRequests}</p>
                <p className="text-sm text-orange-900">{selectedInstructions.join(', ')}</p>
              </div>
            )}

            {/* Custom instructions textarea */}
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder={t.menuCard.customInstructions}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
              rows={2}
            />

            {/* Set Components Display (if type is set or group) */}
            {(item.type === 'set' || item.type === 'group') && item.setComponents && item.setComponents.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-2">
                  {item.type === 'set' ? '🍱 รายการในเซ็ต:' : '👥 รายการในเซ็ตกรุ๊ป:'}
                </p>
                <ul className="space-y-1">
                  {item.setComponents.map((comp, idx) => (
                    <li key={idx} className="text-sm text-blue-900 flex justify-between">
                      <span>• {comp.name}</span>
                      <span className="font-medium">x{comp.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add-ons Selection */}
            {itemAddOns.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setIsAddOnsExpanded(!isAddOnsExpanded)}
                  className="w-full flex items-center justify-between mb-3 p-2 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <p className="text-sm font-medium text-gray-700">🍔 เพิ่มเติม (Add-ons)</p>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${isAddOnsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isAddOnsExpanded && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {itemAddOns.map((addOn) => {
                      const isSelected = selectedAddOns.some(a => a.id === addOn.id);
                      return (
                        <button
                          key={addOn.id}
                          onClick={() => toggleAddOn(addOn)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{addOn.name}</span>
                          </div>
                          <span className={`text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-gray-600'}`}>
                            +฿{addOn.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add-on Groups Selection */}
            {itemAddOnGroups.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setIsAddOnGroupsExpanded(!isAddOnGroupsExpanded)}
                  className="w-full flex items-center justify-between mb-3 p-2 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <p className="text-sm font-medium text-gray-700">🎁 เซ็ตพิเศษ (Add-on Groups)</p>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${isAddOnGroupsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isAddOnGroupsExpanded && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {itemAddOnGroups.map((group) => {
                      const isSelected = selectedAddOnGroups.some(g => g.id === group.id);
                      // Get add-on names in this group
                      const groupAddOns = availableAddOns.filter(addon => group.addOnIds.includes(addon.id));

                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleAddOnGroup(group)}
                          className={`w-full p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="text-base font-bold text-gray-800">{group.name}</p>
                                {group.description && (
                                  <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                                )}
                              </div>
                            </div>
                            <span className={`text-lg font-bold flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-700'}`}>
                              ฿{group.price}
                            </span>
                          </div>
                          {/* Show items in group */}
                          <div className="mt-2 pl-8">
                            <p className="text-xs text-gray-500 mb-1">ประกอบด้วย:</p>
                            <div className="flex flex-wrap gap-1">
                              {groupAddOns.map((addon, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                  • {addon.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Show selected add-ons and groups and total */}
            {(selectedAddOns.length > 0 || selectedAddOnGroups.length > 0) && (
              <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                {selectedAddOns.length > 0 && (
                  <>
                    <p className="text-xs text-orange-800 font-medium mb-1">Add-ons ที่เลือก:</p>
                    <p className="text-sm text-orange-900 mb-2">{selectedAddOns.map(a => a.name).join(', ')}</p>
                  </>
                )}
                {selectedAddOnGroups.length > 0 && (
                  <>
                    <p className="text-xs text-green-800 font-medium mb-1 mt-2">เซ็ตที่เลือก:</p>
                    <p className="text-sm text-green-900 mb-2">{selectedAddOnGroups.map(g => g.name).join(', ')}</p>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                  <span className="text-sm font-medium text-orange-800">ราคารวม:</span>
                  <span className="text-lg font-bold text-orange-600">฿{totalPrice}</span>
                </div>
              </div>
            )}

            {/* Dining preference selection */}
            <div className="mt-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">{t.menuCard.diningPreference}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiningOption('dine-in')}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    diningOption === 'dine-in'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.menuCard.dineIn}
                </button>
                <button
                  type="button"
                  onClick={() => setDiningOption('takeaway')}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    diningOption === 'takeaway'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.menuCard.takeaway}
                </button>
              </div>
            </div>

            {/* Confirm buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
              >
                {t.menuCard.cancel}
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {t.menuCard.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
