"use client";

import { Home, ScanLine, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Vender", href: "/vender", icon: ScanLine },
    { name: "Perfil", href: "/perfil", icon: UserCircle },
  ];

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
      </div>
    </div>
  );
}
