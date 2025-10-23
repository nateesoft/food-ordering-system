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
}

export type Category = string;
