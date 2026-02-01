// Add-on/Topping interface
export interface AddOn {
  id: number;
  name: string;
  price: number;
  category: string; // e.g., 'topping', 'side', 'sauce', 'extra'
}

// Add-on Group (กลุ่มของ Add-on)
export interface AddOnGroup {
  id: number;
  name: string;
  description?: string;
  price: number; // ราคาของกลุ่ม (อาจถูกกว่าซื้อทีละตัว)
  addOnIds: number[]; // รายการ Add-on ID ที่อยู่ในกลุ่มนี้
  category: string; // e.g., 'beverage-set', 'dessert-set', 'combo'
  image?: string;
}

// Set item component (for set meals)
export interface SetComponent {
  id: number;
  name: string;
  description?: string;
  quantity: number;
}

// Nested Menu System - สำหรับเมนูที่มีการเลือกหลายชั้น
export interface NestedMenuOption {
  id: number;
  name: string;
  description?: string;
  price: number; // ราคาเพิ่มเติมจากการเลือกตัวเลือกนี้
  image?: string;
  type: 'single' | 'group'; // ประเภทของตัวเลือก
  // ถ้ามี childOptions แสดงว่ายังมีชั้นถัดไป
  childOptions?: NestedMenuOption[];
  // กำหนดว่าต้องเลือกชั้นถัดไปหรือไม่
  requireChildSelection?: boolean;
  // กำหนดจำนวนที่เลือกได้ในชั้นถัดไป
  minChildSelections?: number; // เลือกได้อย่างน้อย (default: 0 = ไม่บังคับ)
  maxChildSelections?: number; // เลือกได้สูงสุด (default: 1 = เลือกได้ 1 อย่าง)
}

export interface NestedMenuConfig {
  enabled: boolean; // เปิดใช้งาน Nested Menu หรือไม่
  rootOptions: number[]; // IDs ของตัวเลือกชั้นแรก (for static data compatibility)
  rootOptionObjects?: NestedMenuOption[]; // Full nested option objects from API
  requireSelection: boolean; // บังคับให้เลือกหรือไม่
  minSelections?: number; // เลือกได้อย่างน้อย
  maxSelections?: number; // เลือกได้สูงสุด
}

// ใช้เก็บตัวเลือกที่ลูกค้าเลือก
export interface SelectedNestedOption {
  optionId: number;
  option: NestedMenuOption;
  childSelections?: SelectedNestedOption[]; // ตัวเลือกในชั้นถัดไป
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  // New fields for menu management
  type: 'single' | 'set' | 'group'; // Type of menu item
  setComponents?: SetComponent[]; // For set meals, list of items included
  availableAddOns?: number[]; // IDs of add-ons available for this item
  availableAddOnGroups?: number[]; // IDs of add-on groups available for this item
  nestedMenuConfig?: NestedMenuConfig; // Configuration for nested menu
  isActive?: boolean; // Whether this item is currently available
}

export interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
  cartItemId: string;
  diningOption: 'dine-in' | 'takeaway';
  itemStatus?: 'preparing' | 'completed' | 'delivered';
  selectedAddOns?: AddOn[]; // Add-ons selected by customer
  selectedAddOnGroups?: AddOnGroup[]; // Add-on groups selected by customer
  selectedNestedOptions?: SelectedNestedOption[]; // Nested menu selections
}

export interface Order {
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  orderDate: Date;
  status: 'completed' | 'preparing' | 'delivered';
  tableNumber?: string;
}

export interface ServiceRequest {
  id: string;
  type: 'staff' | 'utensils' | 'payment';
  timestamp: Date;
  details?: string;
  items?: string[];
  status: 'pending' | 'completed';
  tableNumber?: string;
}

export interface Table {
  id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  currentGuests?: number;
  mergedWith?: number[];
}

export type Category = string;

// Queue System for Kiosk
export interface QueueTicket {
  queueId: string; // รหัสคิว เช่น "A001"
  queueNumber: number; // หมายเลขคิว เช่น 1, 2, 3
  orderType: 'dine-in' | 'takeaway'; // ประเภทการสั่ง
  items: CartItem[]; // รายการอาหารที่สั่ง
  totalAmount: number; // ยอดรวม
  totalItems: number; // จำนวนรายการ
  status: 'waiting' | 'preparing' | 'ready' | 'completed' | 'cancelled'; // สถานะคิว
  createdAt: Date; // วันเวลาที่สร้าง
  estimatedTime?: number; // เวลาโดยประมาณ (นาที)
  calledAt?: Date; // วันเวลาที่เรียกคิว
  completedAt?: Date; // วันเวลาที่เสร็จสิ้น
  customerName?: string; // ชื่อลูกค้า (optional)
  memberId?: string; // รหัสสมาชิก (optional)
  paymentMethod?: 'cash' | 'credit-card' | 'qr-code' | 'mobile-banking'; // วิธีการชำระเงิน
}
