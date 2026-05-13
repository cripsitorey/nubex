"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Opcional: Persistir el carrito en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nubex_cart");
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nubex_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (vape) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === vape.id);
      if (existing) {
        return prev.map(item => item.id === vape.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...vape, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.precio * item.quantity), 0);

  const handleFinalizarPedido = () => {
    if (cart.length === 0) return;
    
    const WHATSAPP_NUMBER = "593962736099";
    let text = "Hola Nubex Lab! Me gustaría realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
      text += `• ${item.quantity}x ${item.nombre} ${item.sabor ? `(${item.sabor})` : ""} - $${(item.precio * item.quantity).toFixed(2)}\n`;
    });
    text += `\n*TOTAL A PAGAR: $${cartTotal.toFixed(2)}*`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartTotal,
      handleFinalizarPedido
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
