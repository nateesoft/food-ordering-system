export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating?: number;
  reviewCount?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
  cartItemId: string;
  diningOption: 'dine-in' | 'takeaway';
  itemStatus?: 'preparing' | 'completed' | 'delivered';
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
