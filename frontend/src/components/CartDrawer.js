"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, X, Trash2, MessageCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal, 
    handleFinalizarPedido 
  } = useCart();

  return (
    <>
      {/* CARRITO FLOTANTE */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-8 right-8 z-[80] w-16 h-16 bg-primary text-primary-content rounded-full shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 animate-in zoom-in duration-500 ${cart.length === 0 ? 'scale-0' : 'scale-100'}`}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary shadow-lg animate-bounce">
          {cart.reduce((acc, item) => acc + item.quantity, 0)}
        </span>
      </button>

      {/* DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCartOpen(false)} />
          <div className="w-full max-w-md bg-[#0B0F19]/95 backdrop-blur-2xl border-l border-white/10 h-full relative z-10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Tu Pedido</h2>
                <p className="text-[10px] text-primary font-mono tracking-widest uppercase">Nubex Lab Checkout</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-error transition-colors"><X className="w-5 h-5 text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <ShoppingBag className="w-16 h-16" />
                  <p className="text-sm font-bold uppercase tracking-widest">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5 group">
                    <div className="w-20 h-20 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center shrink-0">
                      <img src={resolveImageUrl(item.imagenUrl) || resolveImageUrl(item.media?.[0]?.url)} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold truncate text-sm uppercase italic">{item.nombre}</h4>
                      <p className="text-primary font-black text-lg">${item.precio}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-black/50 rounded-lg border border-white/10 overflow-hidden">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors">-</button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-error hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white/5 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-content/40 text-xs font-bold uppercase tracking-widest">Subtotal Estimado</span>
                  <span className="text-2xl font-black text-white italic tracking-tighter">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleFinalizarPedido}
                  className="w-full bg-primary text-primary-content font-black py-5 rounded-[2rem] shadow-[0_15px_40px_rgba(0,229,255,0.3)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="uppercase tracking-tight">Finalizar Pedido vía WhatsApp</span>
                </button>
                <p className="text-[9px] text-center text-neutral-content/30 uppercase tracking-[0.2em]">Confirmarás disponibilidad en el chat</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
