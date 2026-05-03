"use client";

import { useState, useEffect } from "react";
import { getUsers } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import ClientRegistration from "@/components/vendedor/ClientRegistration";
import { Users, UserPlus, Search } from "lucide-react";

export default function ClientesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("list");
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role === "CLIENTE") router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && activeTab === "list") {
      loadClients();
    }
  }, [user, activeTab]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      const usersArray = Array.isArray(data) ? data : data.data || [];
      // Filtrar solo los de rol CLIENTE
      const clientesSolo = usersArray.filter(u => u.role === "CLIENTE");
      setClients(clientesSolo);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user || user.role === "CLIENTE") return null;

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (c.cedula && c.cedula.includes(search)) ||
    (c.telefono && c.telefono.includes(search))
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Gestión de Clientes</h1>
      </div>

      <div className="flex bg-base-200 p-1 rounded-2xl mb-6">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'list' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
          onClick={() => setActiveTab("list")}
        >
          <Users className="w-4 h-4" /> Lista de Clientes
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'register' ? 'bg-primary text-primary-content shadow-lg' : 'text-neutral-content/60'}`}
          onClick={() => setActiveTab("register")}
        >
          <UserPlus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" />
            <input 
              type="text"
              placeholder="Buscar por nombre, cédula o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-base-200 border-0 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map(cliente => (
                <div key={cliente.id} className="glass-card p-4 rounded-2xl flex flex-col gap-2 border border-white/5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white truncate">{cliente.nombre}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cliente.suscripcion?.activa ? 'bg-success/20 text-success' : 'bg-base-300 text-neutral-content'}`}>
                      {cliente.suscripcion?.activa ? 'Suscrito' : 'Casual'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-neutral-content/80 flex flex-col gap-1">
                    <p>📱 {cliente.telefono || "No registrado"}</p>
                    <p>🪪 {cliente.cedula || "No registrada"}</p>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-neutral-content/60">Vapes comprados:</span>
                    <span className="font-mono text-primary font-bold">{cliente.totalVapesComprados || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 glass-card rounded-2xl text-neutral-content/60">
              No se encontraron clientes.
            </div>
          )}
        </div>
      )}

      {activeTab === "register" && (
        <div className="max-w-lg mx-auto">
          <ClientRegistration standalone={true} />
        </div>
      )}
    </div>
  );
}
