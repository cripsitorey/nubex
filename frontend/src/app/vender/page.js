"use client";

import { useState } from "react";
import ScannerQR from "@/components/vendedor/ScannerQR";
import ClientRegistration from "@/components/vendedor/ClientRegistration";
import PointOfSale from "@/components/vendedor/PointOfSale";
import MyStock from "@/components/vendedor/MyStock";
import MySales from "@/components/vendedor/MySales";
import { UserPlus, ScanLine, ArrowLeft, Package, Receipt } from "lucide-react";
import { getUsers } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VendedorDashboard() {
  const [activeTab, setActiveTab] = useState("SCAN"); // SCAN, REGISTER, POS
  const [selectedClient, setSelectedClient] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "VENDEDOR" && user.role !== "ADMIN") router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== "VENDEDOR" && user.role !== "ADMIN")) return null;

  const handleScanSuccess = async (decodedText) => {
    try {
      let decoded = decodedText;
      if (!decodedText.startsWith("nubex-client:")) {
        decoded = atob(decodedText);
      }
      
      if (decoded.startsWith("nubex-client:")) {
        const clientId = parseInt(decoded.split(":")[1]);
        
        // Intentar obtener datos reales del cliente
        let clientData = {
          id: clientId,
          nombre: `Cliente #${clientId}`,
          suscripcion: null,
        };

        if (navigator.onLine) {
          try {
            const users = await getUsers();
            const data = Array.isArray(users) ? users : users.data || [];
            const found = data.find(u => u.id === clientId);
            if (found) {
              clientData = {
                id: found.id,
                nombre: found.nombre,
                suscripcion: found.suscripcion,
                totalVapesComprados: found.totalVapesComprados || 0,
              };
            }
          } catch {
            // Usar datos placeholder si falla
          }
        }

        setSelectedClient(clientData);
        setScannerError("");
        setActiveTab("POS");
      } else {
        setScannerError("Formato de QR no reconocido.");
      }
    } catch (e) {
      setScannerError("QR inválido o no soportado.");
    }
  };

  const handleRegisterSuccess = (clientData) => {
    setSelectedClient(clientData);
    setActiveTab("POS");
  };

  const handleSaleComplete = () => {
    setSelectedClient(null);
    setActiveTab("SCAN");
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Portal Vendedor</h1>
        
        {activeTab === "POS" && (
          <button 
            onClick={() => { setSelectedClient(null); setActiveTab("SCAN"); }}
            className="btn btn-sm btn-ghost text-neutral-content"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </button>
        )}
      </div>

      {activeTab !== "POS" && (
        <div className="flex bg-base-200 p-1 rounded-2xl mb-8">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'SCAN' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
            onClick={() => setActiveTab("SCAN")}
          >
            <ScanLine className="w-4 h-4" /> Escanear QR
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'REGISTER' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
            onClick={() => setActiveTab("REGISTER")}
          >
            <UserPlus className="w-4 h-4" /> Nuevo Cliente
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'STOCK' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
            onClick={() => setActiveTab("STOCK")}
          >
            <Package className="w-4 h-4" /> Mi Stock
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'SALES' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
            onClick={() => setActiveTab("SALES")}
          >
            <Receipt className="w-4 h-4" /> Mis Ventas
          </button>
        </div>
      )}

      <div className="relative">
        {activeTab === "SCAN" && (
          <div className="space-y-4">
            {scannerError && (
              <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 text-center">
                {scannerError}
              </div>
            )}
            <ScannerQR onScanSuccess={handleScanSuccess} />
          </div>
        )}

        {activeTab === "REGISTER" && (
          <ClientRegistration onRegistered={handleRegisterSuccess} />
        )}

        {activeTab === "POS" && selectedClient && (
          <PointOfSale 
            client={selectedClient} 
            onSaleComplete={handleSaleComplete} 
          />
        )}

        {activeTab === "STOCK" && (
          <MyStock />
        )}

        {activeTab === "SALES" && (
          <MySales />
        )}
      </div>
    </div>
  );
}
