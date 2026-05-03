"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Redirigir según rol
    switch (user.role) {
      case "ADMIN":
        router.push("/admin");
        break;
      case "VENDEDOR":
        router.push("/vender");
        break;
      case "CLIENTE":
      default:
        router.push("/cliente");
        break;
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)] animate-pulse">
        <Zap className="w-8 h-8 text-primary" />
      </div>
      <p className="text-neutral-content/60 text-sm">Cargando Nubex...</p>
    </div>
  );
}
