export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  videos?: string[];
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  freeShipping?: boolean;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  video?: string;
  productCount: number;
}

export interface CartItem extends Product {
  quantity: number;
}
