"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const CommandCenterContext = createContext();

export const useCommandCenter = () => useContext(CommandCenterContext);

export default function CommandCenterProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAction = (path) => {
    setIsOpen(false);
    setSearch("");
    router.push(path);
  };

  const options = [
    { name: "Vender producto", path: "/vender" },
    { name: "Ver Inventario", path: "/admin/inventario" },
    { name: "Configuración", path: "/perfil" },
  ];

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CommandCenterContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      
      {/* Command Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-base-100/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg glass-card rounded-2xl shadow-2xl overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center border-b border-white/10 px-4">
              <Search className="w-5 h-5 text-neutral-content/50" />
              <input
                autoFocus
                className="w-full bg-transparent border-0 h-14 px-4 text-lg text-white placeholder-neutral-content/50 focus:ring-0 focus:outline-none"
                placeholder="Buscar comandos o productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-1">
                <kbd className="kbd kbd-sm bg-base-200 text-neutral-content/60 border-white/10">ESC</kbd>
              </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredOptions.length > 0 ? (
                <ul className="space-y-1">
                  {filteredOptions.map((option, idx) => (
                    <li key={idx}>
                      <button
                        className="w-full flex items-center px-4 py-3 text-left text-sm text-neutral-content hover:bg-white/5 hover:text-white rounded-xl transition-colors group"
                        onClick={() => handleAction(option.path)}
                      >
                        {option.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm text-neutral-content/60">
                  No se encontraron resultados para "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CommandCenterContext.Provider>
  );
}
