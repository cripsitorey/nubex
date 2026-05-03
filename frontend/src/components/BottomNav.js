"use client";

import { Home, ScanLine, UserCircle, RefreshCw, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNetwork } from "./NetworkProvider";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNav() {
  const pathname = usePathname();
  const { pendingCount, isSyncing, triggerSync, isOnline } = useNetwork();
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  let navItems = [];

  if (user.role === "ADMIN") {
    navItems = [
      { name: "Inicio", href: "/admin", icon: Home },
      { name: "Vender", href: "/vender", icon: ScanLine },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Perfil", href: "/perfil", icon: UserCircle },
    ];
  } else if (user.role === "VENDEDOR") {
    navItems = [
      { name: "Vender", href: "/vender", icon: ScanLine },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Perfil", href: "/perfil", icon: UserCircle },
    ];
  } else {
    navItems = [
      { name: "Inicio", href: "/cliente", icon: Home },
      { name: "Tienda", href: "/tienda", icon: ShoppingBag },
      { name: "Perfil", href: "/perfil", icon: UserCircle },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/5 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-primary" : "text-neutral-content/60 hover:text-neutral-content"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wider">{item.name}</span>
            </Link>
          );
        })}

        {/* Sync indicator button */}
        {pendingCount > 0 && (
          <button
            onClick={() => { if (isOnline) triggerSync(); }}
            disabled={isSyncing || !isOnline}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-warning hover:text-warning-content disabled:opacity-50 relative"
          >
            <div className="relative">
              <RefreshCw className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="absolute -top-1.5 -right-2.5 bg-warning text-warning-content text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                {pendingCount}
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wider">
              {isSyncing ? "Sync..." : "Sync"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
