"use client";

import { useCart } from "@/hooks/useCart";
import { ShoppingBag } from "lucide-react";

export default function AddToCartButton({ vape }) {
  const { addToCart, setIsCartOpen } = useCart();

  return (
    <button 
      onClick={() => { addToCart(vape); setIsCartOpen(true); }} 
      className="flex-1 bg-primary/10 text-primary border border-primary/20 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,229,255,0.1)]"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="uppercase tracking-widest text-xs">Añadir al Carrito</span>
    </button>
  );
}
