"use client";

import { useState } from "react";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import PlanesManager from "@/components/admin/PlanesManager";
import VendedoresManager from "@/components/admin/VendedoresManager";
import StockCentral from "@/components/admin/StockCentral";
import LiquidationManager from "@/components/admin/LiquidationManager";
import { BarChart3, Layers, Users, Package, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TABS = [
  { key: "analytics", label: "Métricas", icon: BarChart3 },
  { key: "planes", label: "Planes", icon: Layers },
  { key: "vendedores", label: "Vendedores", icon: Users },
  { key: "stock", label: "Stock", icon: Package },
  { key: "liquidaciones", label: "Cierres", icon: Wallet },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "ADMIN") router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Centro de Control</h1>
        <span className="text-[10px] text-neutral-content/40 font-mono uppercase tracking-wider">Admin Panel</span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-content shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  : "bg-base-200 text-neutral-content/60 hover:text-white hover:bg-base-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh]">
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "planes" && <PlanesManager />}
        {activeTab === "vendedores" && <VendedoresManager />}
        {activeTab === "stock" && <StockCentral />}
        {activeTab === "liquidaciones" && <LiquidationManager />}
      </div>
    </div>
  );
}
