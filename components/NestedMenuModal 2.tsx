'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { NestedMenuOption, SelectedNestedOption } from '@/types';

interface NestedMenuModalProps {
  isOpen: boolean;
  options: NestedMenuOption[]; // ตัวเลือกชั้นแรก
  onClose: () => void;
  onConfirm: (selections: SelectedNestedOption[]) => void;
  minSelections?: number; // เลือกได้อย่างน้อย
  maxSelections?: number; // เลือกได้สูงสุด
  requireSelection?: boolean; // บังคับให้เลือกหรือไม่
}

interface BreadcrumbItem {
  level: number;
  option: NestedMenuOption | null;
  parentSelection: SelectedNestedOption | null;
}

export const NestedMenuModal: React.FC<NestedMenuModalProps> = ({
  isOpen,
  options,
  onClose,
  onConfirm,
  minSelections = 1,
  maxSelections = 1,
  requireSelection = true,
}) => {
  // เก็บการเลือกทั้งหมด
  const [rootSelections, setRootSelections] = useState<SelectedNestedOption[]>([]);

  // เก็บ breadcrumb navigation (ประวัติการเลือก)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 0, option: null, parentSelection: null }
  ]);

  // ตัวเลือกปัจจุบันที่แสดง
  const [currentOptions, setCurrentOptions] = useState<NestedMenuOption[]>(options);
  const [currentParent, setCurrentParent] = useState<SelectedNestedOption | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Reset state เมื่อเปิด modal
      setRootSelections([]);
      setBreadcrumbs([{ level: 0, option: null, parentSelection: null }]);
      setCurrentOptions(options);
      setCurrentParent(null);
      setCurrentLevel(0);
    }
  }, [isOpen, options]);

  // ฟังก์ชันเลือก option
  const handleSelectOption = (option: NestedMenuOption) => {
    if (currentLevel === 0) {
      // ชั้นที่ 1 (root level)
      const exists = rootSelections.find(s => s.optionId === option.id);

      if (exists) {
        // ถ้าเลือกแล้ว ให้ยกเลิก
        setRootSelections(prev => prev.filter(s => s.optionId !== option.id));
      } else {
        // เลือกใหม่
        if (maxSelections === 1) {
          // ถ้าเลือกได้ 1 อย่าง ให้แทนที่
          const newSelection: SelectedNestedOption = {
            optionId: option.id,
            option: option,
            childSelections: [],
          };
          setRootSelections([newSelection]);

          // ถ้ามี child options ให้ไปชั้นถัดไป
          if (option.requireChildSelection && option.childOptions && option.childOptions.length > 0) {
            navigateToChild(option, newSelection);
          }
        } else {
          // เลือกได้หลายอย่าง
          if (rootSelections.length < maxSelections) {
            const newSelection: SelectedNestedOption = {
              optionId: option.id,
              option: option,
              childSelections: [],
            };
            setRootSelections(prev => [...prev, newSelection]);
          }
        }
      }
    } else {
      // ชั้นที่ 2 ขึ้นไป (child levels)
      if (!currentParent) return;

      const exists = currentParent.childSelections?.find(s => s.optionId === option.id);
      const currentChildCount = currentParent.childSelections?.length || 0;
      const minChild = option.minChildSelections || currentParent.option.minChildSelections || 0;
      const maxChild = option.maxChildSelections || currentParent.option.maxChildSelections || 1;

      if (exists) {
        // ยกเลิกการเลือก
        updateParentChildSelections(
          currentParent.childSelections?.filter(s => s.optionId !== option.id) || []
        );
      } else {
        // เลือกใหม่
        if (maxChild === 1) {
          // เลือกได้ 1 อย่าง
          const newSelection: SelectedNestedOption = {
            optionId: option.id,
            option: option,
            childSelections: [],
          };
          updateParentChildSelections([newSelection]);

          // ถ้ามี child options ให้ไปชั้นถัดไป
          if (option.requireChildSelection && option.childOptions && option.childOptions.length > 0) {
            navigateToChild(option, newSelection);
          }
        } else {
          // เลือกได้หลายอย่าง
          if (currentChildCount < maxChild) {
            const newSelection: SelectedNestedOption = {
              optionId: option.id,
              option: option,
              childSelections: [],
            };
            updateParentChildSelections([...(currentParent.childSelections || []), newSelection]);
          }
        }
      }
    }
  };

  // อัพเดต child selections ของ parent
  const updateParentChildSelections = (newChildSelections: SelectedNestedOption[]) => {
    if (!currentParent) return;

    const updateSelections = (selections: SelectedNestedOption[]): SelectedNestedOption[] => {
      return selections.map(sel => {
        if (sel.optionId === currentParent.optionId) {
          return { ...sel, childSelections: newChildSelections };
        }
        if (sel.childSelections && sel.childSelections.length > 0) {
          return { ...sel, childSelections: updateSelections(sel.childSelections) };
        }
        return sel;
      });
    };

    setRootSelections(prev => updateSelections(prev));
    setCurrentParent({ ...currentParent, childSelections: newChildSelections });
  };

  // ไปยังชั้นถัดไป
  const navigateToChild = (option: NestedMenuOption, selection: SelectedNestedOption) => {
    if (!option.childOptions || option.childOptions.length === 0) return;

    setBreadcrumbs(prev => [...prev, { level: currentLevel + 1, option, parentSelection: selection }]);
    setCurrentOptions(option.childOptions);
    setCurrentParent(selection);
    setCurrentLevel(currentLevel + 1);
  };

  // กลับไปชั้นก่อนหน้า
  const navigateBack = () => {
    if (breadcrumbs.length <= 1) return;

    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    const previousBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];

    setBreadcrumbs(newBreadcrumbs);

    if (previousBreadcrumb.level === 0) {
      setCurrentOptions(options);
      setCurrentParent(null);
      setCurrentLevel(0);
    } else if (previousBreadcrumb.option?.childOptions) {
      setCurrentOptions(previousBreadcrumb.option.childOptions);
      setCurrentParent(previousBreadcrumb.parentSelection);
      setCurrentLevel(previousBreadcrumb.level);
    }
  };

  // ตรวจสอบว่าเลือกครบตามเงื่อนไขหรือยัง
  const isSelectionValid = (): boolean => {
    if (currentLevel === 0) {
      // ตรวจสอบชั้นที่ 1
      if (requireSelection && rootSelections.length < minSelections) {
        return false;
      }

      // ตรวจสอบว่าทุก selection ที่ต้องมี child ได้เลือก child แล้วหรือยัง
      for (const sel of rootSelections) {
        if (sel.option.requireChildSelection) {
          const minChild = sel.option.minChildSelections || 1;
          if (!sel.childSelections || sel.childSelections.length < minChild) {
            return false;
          }

          // ตรวจสอบซ้ำในชั้นลึกลงไป
          if (!validateChildSelections(sel)) {
            return false;
          }
        }
      }
      return true;
    } else {
      // ตรวจสอบชั้นถัดไป
      if (!currentParent) return false;

      const minChild = currentParent.option.minChildSelections || 0;
      const currentChildCount = currentParent.childSelections?.length || 0;

      if (currentParent.option.requireChildSelection && currentChildCount < minChild) {
        return false;
      }

      return true;
    }
  };

  // ตรวจสอบ child selections แบบ recursive
  const validateChildSelections = (selection: SelectedNestedOption): boolean => {
    if (!selection.option.requireChildSelection) return true;

    const minChild = selection.option.minChildSelections || 1;
    if (!selection.childSelections || selection.childSelections.length < minChild) {
      return false;
    }

    // ตรวจสอบชั้นลึกลงไป
    for (const child of selection.childSelections) {
      if (!validateChildSelections(child)) {
        return false;
      }
    }

    return true;
  };

  // ยืนยันการเลือก
  const handleConfirm = () => {
    if (!isSelectionValid()) {
      alert('กรุณาเลือกตัวเลือกให้ครบถ้วน');
      return;
    }

    onConfirm(rootSelections);
    onClose();
  };

  // คำนวณราคารวม
  const calculateTotalPrice = (): number => {
    let total = 0;

    const addPrice = (sel: SelectedNestedOption) => {
      total += sel.option.price;
      if (sel.childSelections && sel.childSelections.length > 0) {
        sel.childSelections.forEach(child => addPrice(child));
      }
    };

    rootSelections.forEach(sel => addPrice(sel));
    return total;
  };

  // ตรวจสอบว่า option นี้ถูกเลือกหรือไม่
  const isOptionSelected = (option: NestedMenuOption): boolean => {
    if (currentLevel === 0) {
      return rootSelections.some(s => s.optionId === option.id);
    } else {
      return currentParent?.childSelections?.some(s => s.optionId === option.id) || false;
    }
  };

  if (!isOpen) return null;

  const totalPrice = calculateTotalPrice();
  const currentMinSelections = currentLevel === 0 ? minSelections : (currentParent?.option.minChildSelections || 0);
  const currentMaxSelections = currentLevel === 0 ? maxSelections : (currentParent?.option.maxChildSelections || 1);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl transform transition-transform flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">เลือกตัวเลือก</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-purple-100">
            <button
              onClick={() => {
                if (currentLevel > 0) {
                  navigateBack();
                }
              }}
              className={`flex items-center gap-1 ${currentLevel > 0 ? 'hover:text-white cursor-pointer' : 'opacity-50'}`}
              disabled={currentLevel === 0}
            >
              {currentLevel > 0 && <ArrowLeft className="w-4 h-4" />}
              <span>ชั้นที่ {currentLevel + 1}</span>
            </button>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">{crumb.option?.name}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Selection Info */}
          <div className="mt-3 text-sm">
            {currentMaxSelections === 1 ? (
              <p>เลือกได้ 1 รายการ {currentMinSelections > 0 && '(บังคับ)'}</p>
            ) : (
              <p>เลือกได้ {currentMinSelections}-{currentMaxSelections} รายการ</p>
            )}
          </div>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {currentOptions.map((option) => {
              const isSelected = isOptionSelected(option);
              const hasChildren = option.childOptions && option.childOptions.length > 0;

              return (
                <div key={option.id} className="relative">
                  <button
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox/Radio */}
                        <div className={`mt-1 w-6 h-6 rounded ${currentMaxSelections === 1 ? 'rounded-full' : ''} border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800">{option.name}</h3>
                            {option.type === 'group' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium uppercase">
                                Group
                              </span>
                            )}
                          </div>

                          {option.description && (
                            <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          )}

                          {option.image && (
                            <img
                              src={option.image}
                              alt={option.name}
                              className="w-full h-32 object-cover rounded-lg mt-2"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-3">
                        <span className={`text-lg font-bold ${isSelected ? 'text-purple-600' : 'text-gray-700'}`}>
                          {option.price > 0 ? `+฿${option.price}` : 'ฟรี'}
                        </span>

                        {hasChildren && option.requireChildSelection && (
                          <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                            ต้องเลือกต่อ <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Navigate to children button */}
                  {isSelected && hasChildren && option.requireChildSelection && (
                    <button
                      onClick={() => {
                        const selection = currentLevel === 0
                          ? rootSelections.find(s => s.optionId === option.id)!
                          : currentParent?.childSelections?.find(s => s.optionId === option.id)!;
                        navigateToChild(option, selection);
                      }}
                      className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-6 space-y-4">
          {/* Summary */}
          {rootSelections.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-800 font-medium mb-2">ตัวเลือกที่เลือก:</p>
              {rootSelections.map((sel, idx) => (
                <div key={idx} className="text-sm text-purple-900 mb-1">
                  • {sel.option.name}
                  {sel.childSelections && sel.childSelections.length > 0 && (
                    <span className="text-xs text-purple-700 ml-2">
                      (+{sel.childSelections.length} ตัวเลือก)
                    </span>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-purple-200">
                <span className="text-sm font-medium text-purple-800">ราคาเพิ่มเติม:</span>
                <span className="text-lg font-bold text-purple-600">+฿{totalPrice}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isSelectionValid()}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                isSelectionValid()
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
