import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import { toast } from "@/hooks/use-toast";

interface WishlistContextType {
  ids: string[];
  totalItems: number;
  isWishlisted: (productId: string) => boolean;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (product: Product) => void;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "wishlist_ids_v1";

const safeGetItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode / blocked storage).
  }
};

function parseWishlistIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parseWishlistIds(safeGetItem(STORAGE_KEY));
  });

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setIds(parseWishlistIds(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const idSet = useMemo(() => new Set(ids), [ids]);

  const isWishlisted = useCallback((productId: string) => idSet.has(productId), [idSet]);

  const addToWishlist = useCallback((product: Product) => {
    setIds((current) => {
      if (current.includes(product.id)) return current;
      toast({
        title: "Saved to wishlist",
        description: `${product.name} was added to your wishlist.`,
      });
      return [product.id, ...current];
    });
  }, []);

  const removeFromWishlist = useCallback((product: Product) => {
    setIds((current) => {
      if (!current.includes(product.id)) return current;
      toast({
        title: "Removed from wishlist",
        description: `${product.name} was removed from your wishlist.`,
      });
      return current.filter((id) => id !== product.id);
    });
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setIds((current) => {
        const exists = current.includes(product.id);
        toast({
          title: exists ? "Removed from wishlist" : "Saved to wishlist",
          description: `${product.name} was ${exists ? "removed from" : "added to"} your wishlist.`,
        });
        return exists ? current.filter((id) => id !== product.id) : [product.id, ...current];
      });
    },
    [],
  );

  const clearWishlist = useCallback(() => {
    setIds([]);
    toast({ title: "Wishlist cleared", description: "Your wishlist is now empty." });
  }, []);

  const value = useMemo<WishlistContextType>(
    () => ({
      ids,
      totalItems: ids.length,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [ids, isWishlisted, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
