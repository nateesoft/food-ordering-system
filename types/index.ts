// Add-on/Topping interface
export interface AddOn {
  id: number;
  name: string;
  price: number;
  category: string; // e.g., 'topping', 'side', 'sauce', 'extra'
}

// Set item component (for set meals)
export interface SetComponent {
  id: number;
  name: string;
  description?: string;
  quantity: number;
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
  isActive?: boolean; // Whether this item is currently available
}

export interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
  cartItemId: string;
  diningOption: 'dine-in' | 'takeaway';
  itemStatus?: 'preparing' | 'completed' | 'delivered';
  selectedAddOns?: AddOn[]; // Add-ons selected by customer
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
