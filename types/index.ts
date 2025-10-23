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
}

export interface Order {
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  orderDate: Date;
  status: 'completed' | 'preparing' | 'delivered';
}

export interface ServiceRequest {
  id: string;
  type: 'staff' | 'utensils' | 'payment';
  timestamp: Date;
  details?: string;
  items?: string[];
  status: 'pending' | 'completed';
}

export type Category = string;
