import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "lebville_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, opts = {}) => {
    const size = opts.size || (product.sizes && product.sizes[0]) || "One Size";
    const qty = opts.qty || 1;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id && i.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: qty,
          size,
        },
      ];
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback((product_id, size, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product_id === product_id && i.size === size ? { ...i, quantity: Math.max(1, quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((product_id, size) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.size === size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const value = { items, open, setOpen, addItem, updateQty, removeItem, clear, subtotal, totalQty };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
