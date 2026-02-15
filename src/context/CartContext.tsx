import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product, CartItem } from "@/types/product";
import { toast } from "@/hooks/use-toast";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "cart_items_v1";

function parseCartItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        const id = typeof item.id === "string" ? item.id : null;
        const name = typeof item.name === "string" ? item.name : null;
        const price = typeof item.price === "number" ? item.price : null;
        const quantity = typeof item.quantity === "number" ? item.quantity : null;

        if (!id || !name || price === null || quantity === null) return null;
        if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity < 1) return null;

        return {
          id,
          name,
          description: typeof item.description === "string" ? item.description : "",
          price,
          originalPrice: typeof item.originalPrice === "number" ? item.originalPrice : undefined,
          image: typeof item.image === "string" ? item.image : "",
          category: typeof item.category === "string" ? item.category : "",
          rating: typeof item.rating === "number" ? item.rating : 0,
          reviewCount: typeof item.reviewCount === "number" ? item.reviewCount : 0,
          inStock: typeof item.inStock === "boolean" ? item.inStock : true,
          freeShipping: typeof item.freeShipping === "boolean" ? item.freeShipping : undefined,
          badge: typeof item.badge === "string" ? item.badge : undefined,
          quantity: Math.floor(quantity),
        } satisfies CartItem;
      })
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return parseCartItems(localStorage.getItem(STORAGE_KEY));
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setItems(parseCartItems(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...currentItems, { ...product, quantity }];
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
