"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVapes } from "@/services/api";
import { getCachedCatalog } from "@/lib/syncService";
import { 
  PackageSearch, 
  Search, 
  X, 
  MessageCircle, 
  Info, 
  ShieldAlert, 
  ChevronRight, 
  Camera, 
  Globe, 
  Zap,
  ShoppingBag,
  Trash2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";
const LOGO_URL = "/icon-512x512.png";
const WHATSAPP_NUMBER = "593962736099";

export default function TiendaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [vapes, setVapes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [selectedVape, setSelectedVape] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [puffFilter, setPuffFilter] = useState("");
  const [infoModal, setInfoModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "CLIENTE" && user.role !== "ADMIN" && user.role !== "VENDEDOR") {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const accepted = localStorage.getItem("nubex_disclaimer_accepted");
    if (!accepted) {
      setShowDisclaimer(true);
    }

    const fetchData = async () => {
      await loadCatalog();
      setTimeout(() => setShowSplash(false), 1500);
    };
    fetchData();

    // Listener para tecla ESC
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedVape(null);
        setInfoModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function loadCatalog() {
    let finalVapes = [];
    
    try {
      const testModule = await import("./test-data.js").catch(() => null);
      if (testModule && testModule.LOCAL_TEST_VAPES) {
        finalVapes = [...testModule.LOCAL_TEST_VAPES];
      }
    } catch (e) {
      console.log("No se encontraron datos de prueba locales.");
    }

    try {
      if (navigator.onLine) {
        const data = await getVapes();
        const vapesFromAPI = Array.isArray(data) ? data : data.data || [];
        finalVapes = [...finalVapes, ...vapesFromAPI];
      }
    } catch (err) {
      console.log("Error cargando API, usando caché/local...");
    }

    if (finalVapes.length === 0) {
      try {
        const cached = await getCachedCatalog().catch(() => ({ vapes: [] }));
        finalVapes = cached?.vapes || [];
      } catch (e) {
        console.error("Error definitivo cargando catálogo:", e);
        finalVapes = [];
      }
    }

    setVapes(finalVapes);
    setIsLoading(false);
  }

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  const filteredVapes = useMemo(() => {
    return vapes.filter(vape => {
      const nombre = (vape.nombre || "").toLowerCase();
      const sabor = (vape.sabor || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      
      const matchesSearch = nombre.includes(term) || sabor.includes(term);
      const matchesPuffs = !puffFilter || (vape.puffs && vape.puffs.toString().includes(puffFilter));
      return matchesSearch && matchesPuffs;
    });
  }, [vapes, searchTerm, puffFilter]);

  const uniquePuffs = useMemo(() => {
    const puffs = vapes.map(v => v.puffs).filter(p => p !== null && p !== undefined);
    return [...new Set(puffs)].sort((a, b) => parseInt(a) - parseInt(b));
  }, [vapes]);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("nubex_disclaimer_accepted", "true");
    setShowDisclaimer(false);
  };

  const handleConsultar = (vape) => {
    const text = `Hola! Me interesa el producto: ${vape.nombre} ${vape.sabor ? `(${vape.sabor})` : ""}. ¿Este vape sigue disponible?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleConsultaGeneral = () => {
    const text = "Hola Nubex! Estoy viendo su catálogo y tengo una duda sobre los productos.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSoporteTecnico = () => {
    const text = "Hola Nubex! Necesito soporte técnico o ayuda con una compra.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const addToCart = (vape) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === vape.id);
      if (existing) {
        return prev.map(item => item.id === vape.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...vape, quantity: 1 }];
    });
    // Feedback visual o abrir carrito opcionalmente
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
    
    let text = "Hola Nubex Lab! Me gustaría realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
      text += `• ${item.quantity}x ${item.nombre} ${item.sabor ? `(${item.sabor})` : ""} - $${(item.precio * item.quantity).toFixed(2)}\n`;
    });
    text += `\n*TOTAL A PAGAR: $${cartTotal.toFixed(2)}*`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen bg-base-100 overflow-x-hidden custom-scrollbar">
      {/* ANCLA PARA SCROLL TOP */}
      <div id="top-anchor" className="absolute top-0 left-0 w-px h-px pointer-events-none" />

      {/* DISCLAIMER POPUP */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="glass-card max-w-lg w-full rounded-[3rem] p-10 border-2 border-primary/20 shadow-[0_0_100px_rgba(0,229,255,0.1)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
              <ShieldAlert className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Verificación de Edad</h2>
            <div className="space-y-4 text-neutral-content/70 text-sm leading-relaxed mb-10">
              <p>Este sitio web contiene productos destinados exclusivamente a adultos mayores de edad (<span className="font-bold text-white">+18</span>).</p>
              <p className="bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                "El consumo de productos con nicotina es perjudicial para la salud y crea adicción."
              </p>
              <p>Al hacer clic en aceptar, confirmas que tienes la edad legal para comprar productos de vapeo en tu jurisdicción.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAcceptDisclaimer}
                className="w-full bg-primary text-primary-content font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(0,229,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,229,255,0.5)] transition-all active:scale-95"
              >
                SOY MAYOR DE EDAD - ENTRAR
              </button>
              <button 
                onClick={() => window.location.href = "https://www.google.com"}
                className="text-neutral-content/40 text-xs font-bold hover:text-error transition-colors tracking-widest uppercase py-2"
              >
                SALIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLASH LOADER CON ANIMACIÓN DE LABORATORIO */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-base-100 flex flex-col items-center justify-center animate-out fade-out duration-1000 fill-mode-forwards" style={{ animationDelay: '2s' }}>
          <div className="relative flex flex-col items-center gap-12">
            {/* Logo con Anillos de Carga */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              {/* Anillos Dinámicos */}
              <div className="absolute inset-0 rounded-full border border-primary/10" />
              <div className="absolute inset-[-15px] rounded-full border-t-2 border-primary/40 animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-[-30px] rounded-full border-b-2 border-primary/20 animate-[spin_5s_linear_infinite_reverse]" />
              
              {/* Logo Central */}
              <div className="w-32 h-32 md:w-44 md:h-44 relative animate-in zoom-in-50 duration-700 ease-out">
                 <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(0,229,255,0.5)]" />
              </div>
              
              {/* Glow de Fondo */}
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-[80px] -z-10 animate-pulse" />
            </div>

            {/* Texto y Progreso */}
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Nubex <span className="text-primary">Lab</span></h1>
                <p className="text-neutral-content/40 font-mono text-[10px] tracking-[0.5em] uppercase">Iniciando Protocolos</p>
              </div>
              
              {/* Barra de Progreso Minimalista */}
              <div className="w-48 h-[2px] bg-white/5 rounded-full mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-primary animate-[loading_2.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className={`transition-all duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[1.2rem] bg-base-200 flex items-center justify-center shadow-2xl border border-white/5 overflow-hidden group">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Tienda <span className="text-primary">Nubex</span></h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-content/40">Exclusive Vape Collection</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!user ? (
                <button onClick={() => router.push('/login')} className="btn btn-primary btn-sm shadow-lg px-8 rounded-xl font-black uppercase tracking-tighter text-[10px]">Iniciar Sesión</button>
              ) : (
                <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(157,255,0,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-content/60">Sistema Online</span>
                </div>
              )}
              <button onClick={handleConsultaGeneral} className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success hover:bg-success hover:text-success-content transition-all shadow-lg border border-success/20">
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* FILTROS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-white/5 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
            <div className="sm:col-span-2 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/30 group-focus-within:text-primary transition-colors" />
              <input type="text" placeholder="¿Qué sabor buscas hoy?..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-base-200/50 border-0 rounded-2xl py-4 pl-12 pr-10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-neutral-content/20" />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-content/20 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            <div className="relative">
              <select value={puffFilter} onChange={(e) => setPuffFilter(e.target.value)} className="w-full bg-base-200/50 border-0 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer font-bold">
                <option value="">Capacidad (Puffs)</option>
                {uniquePuffs.map(p => <option key={p} value={p}>{p} puffs</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-content/30">▼</div>
            </div>
          </div>

          {/* GRID DE PRODUCTOS */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="glass-card rounded-[2.5rem] h-80 animate-pulse" />)}
              </div>
            ) : filteredVapes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {filteredVapes.map((vape, idx) => {
                  const mainImg = vape.media && vape.media.length > 0 ? (vape.media[0].type === 'image' ? resolveImageUrl(vape.media[0].url) : resolveImageUrl(vape.imagenUrl)) : resolveImageUrl(vape.imagenUrl);
                  return (
                  <Link 
                    href={`/tienda/${vape.id || idx}`}
                    key={vape.id || idx} 
                    className="glass-card p-5 rounded-[3rem] flex flex-col justify-between hover:border-primary/40 transition-all cursor-pointer group hover:shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_20px_rgba(0,229,255,0.15)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity z-10 scanlines" />
                    <div className="w-full h-48 bg-black/40 rounded-[2.5rem] mb-5 flex items-center justify-center overflow-hidden relative border border-white/5">
                      {mainImg ? <img src={mainImg} alt={`Foto de ${vape.nombre}`} loading={idx > 4 ? "lazy" : "eager"} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out" /> : <PackageSearch className="w-12 h-12 text-neutral-content/10" />}
                      {vape.stockTotal !== undefined && vape.stockTotal <= 0 && (
                        <div className="absolute inset-0 bg-base-100/60 backdrop-blur-[4px] flex items-center justify-center z-20">
                          <span className="bg-error/90 text-white text-[9px] uppercase tracking-[0.3em] font-black px-4 py-1.5 rounded-full shadow-2xl">Agotado</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 scale-50 group-hover:scale-100 transition-transform">
                          <ChevronRight className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="px-1">
                      <h4 className="font-black text-base truncate text-white mb-1 tracking-tight" title={vape.nombre}>{vape.nombre}</h4>
                      <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-3">{vape.sabor || "Premium Flavor"}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-neutral-content/30 tracking-widest">Desde</span>
                          <p className="text-xl text-white font-black tracking-tighter">
                            {vape.mostrarPrecio !== false ? `$${parseFloat(vape.precio || 0).toFixed(2)}` : "—"}
                          </p>
                        </div>
                        <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary group-hover:text-primary-content transition-all shadow-lg group-hover:shadow-primary/30">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                )})}
              </div>
            ) : (
              <div className="glass-card p-32 rounded-[4rem] text-center flex flex-col items-center justify-center border-dashed border-2 border-white/5 relative overflow-hidden animate-in zoom-in duration-500">
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center"><h1 className="text-[20rem] font-black">404</h1></div>
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative z-10"><PackageSearch className="w-12 h-12 text-neutral-content/10" /></div>
                <p className="text-3xl text-white font-black mb-4 relative z-10 tracking-tight">Sin stock disponible</p>
                <p className="text-sm text-neutral-content/40 max-w-sm mb-10 relative z-10">No hemos encontrado lo que buscas, pero nuestro laboratorio está siempre creando nuevos sabores.</p>
                <button onClick={() => { setSearchTerm(""); setPuffFilter(""); }} className="px-10 py-4 bg-white/5 text-primary text-xs font-black tracking-[0.2em] uppercase rounded-full hover:bg-primary hover:text-primary-content transition-all relative z-10">Reiniciar Filtros</button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 pt-20 pb-10 px-8 border-t border-white/5 bg-black/20 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 p-1 flex items-center justify-center border border-white/10"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">NUBEX <span className="text-primary">LAB</span></h3>
              </div>
              <p className="text-neutral-content/40 text-sm leading-relaxed">Líderes en la distribución de vapes premium. Calidad, sabor y tecnología en cada calada. Solo para adultos.</p>
              <div className="flex gap-4">
                {[Camera, Globe, X].map((IconComp, i) => (
                  <button key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-content/40 hover:text-primary hover:bg-primary/10 transition-all">
                    {IconComp ? <IconComp className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Navegación</h4>
              <ul className="space-y-4 text-sm text-neutral-content/40">
                <li><button onClick={() => document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-all cursor-pointer block text-left">Catálogo</button></li>
                <li><button onClick={() => window.location.href = '/suscripciones'} className="hover:text-primary transition-all cursor-pointer block text-left">Suscripciones</button></li>
                <li><button onClick={handleSoporteTecnico} className="hover:text-primary transition-all cursor-pointer block text-left">Soporte</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Legal</h4>
              <ul className="space-y-4 text-sm text-neutral-content/40">
                <li><button onClick={() => setInfoModal({ 
                  title: "Términos y Condiciones", 
                  content: (
                    <div className="text-justify space-y-4">
                      <p className="text-neutral-content/60 leading-relaxed italic">Bienvenido a <span className="text-primary font-bold">Nubex Lab</span>. Al acceder a nuestro catálogo, aceptas lo siguiente:</p>
                      <ul className="space-y-4">
                        <li><span className="text-primary font-bold">• MAYORÍA DE EDAD:</span> El acceso es <span className="text-error font-bold uppercase">EXCLUSIVO</span> para personas mayores de <span className="text-primary font-bold">18 AÑOS</span>.</li>
                        <li><span className="text-primary font-bold">• USO RESPONSABLE:</span> Los dispositivos de vapeo son para adultos. Nubex Lab <span className="text-error font-bold uppercase">NO SE RESPONSABILIZA</span> por el mal uso.</li>
                        <li><span className="text-primary font-bold">• RIESGO:</span> Reconoces que la nicotina es adictiva. El uso es <span className="text-error font-bold uppercase">BAJO TU PROPIO RIESGO</span>.</li>
                        <li><span className="text-primary font-bold">• GARANTÍAS:</span> Solo defectos de fábrica en las primeras <span className="text-primary font-bold">48H</span> con el <span className="text-error font-bold uppercase">SELLO INTACTO</span>.</li>
                      </ul>
                    </div>
                  )
                })} className="hover:text-primary transition-all cursor-pointer block text-left">Términos y Condiciones</button></li>
                <li><button onClick={() => setInfoModal({ 
                  title: "Política de Privacidad", 
                  content: (
                    <div className="text-justify space-y-4">
                      <p className="text-primary font-black uppercase tracking-widest text-[10px]">Protección de Datos Nivel Lab</p>
                      <ul className="space-y-4">
                        <li><span className="text-primary font-bold">• PRIVACIDAD:</span> Tu información es nuestra <span className="text-primary font-bold uppercase">PRIORIDAD ABSOLUTA</span>.</li>
                        <li><span className="text-primary font-bold">• SEGURIDAD:</span> Utilizamos <span className="text-primary font-bold italic">CIFRADO DE GRADO MILITAR</span> para proteger tus pedidos.</li>
                        <li><span className="text-primary font-bold">• COMPROMISO:</span> Nubex Lab <span className="text-error font-bold uppercase">NUNCA VENDERÁ</span> tus datos a terceros.</li>
                        <li><span className="text-primary font-bold">• CONTROL:</span> Tienes derecho a solicitar la <span className="text-error font-bold">ELIMINACIÓN TOTAL</span> de tu historial.</li>
                      </ul>
                    </div>
                  )
                })} className="hover:text-primary transition-all cursor-pointer block text-left">Política de Privacidad</button></li>
                <li><button onClick={() => setInfoModal({ 
                  title: "Aviso de Salud", 
                  content: (
                    <div className="text-justify space-y-4">
                      <p className="text-error font-black uppercase tracking-tighter">ADVERTENCIA DE SEGURIDAD Y SALUD PÚBLICA:</p>
                      <ul className="space-y-4">
                        <li><span className="text-primary font-bold">ADICCIÓN:</span> Este producto contiene <span className="text-error font-bold">NICOTINA</span>, una sustancia química altamente adictiva que puede afectar el sistema nervioso.</li>
                        <li><span className="text-primary font-bold">RESTRICCIONES MÉDICAS:</span> El uso está estrictamente <span className="text-error font-bold">CONTRAINDICADO</span> para mujeres embarazadas, personas con afecciones cardíacas o hipertensión.</li>
                        <li><span className="text-primary font-bold">MENORES DE EDAD:</span> La venta y consumo están <span className="text-error font-bold">PROHIBIDOS</span> para menores de <span className="text-primary font-bold">18 AÑOS</span>.</li>
                        <li><span className="text-primary font-bold">ALMACENAMIENTO:</span> Mantener fuera del alcance de niños y mascotas. La ingestión accidental puede ser <span className="text-error font-bold">TÓXICA</span>.</li>
                      </ul>
                      <p className="text-[10px] text-neutral-content/40 italic pt-4 border-t border-white/5">Nubex Lab promueve un consumo responsable y consciente.</p>
                    </div>
                  )
                })} className="hover:text-primary transition-all cursor-pointer block text-left">Aviso de Salud</button></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-10 border-t border-white/5"><p className="text-[10px] uppercase font-bold tracking-[0.3em] text-neutral-content/20 italic">© 2026 NUBEX LAB · DESIGNED FOR THE ELITE VAPER</p></div>
        </footer>
      </div>

      {/* MODAL ULTRA-COMPACTO CON ANIMACIÓN DINÁMICA */}
      {selectedVape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop independiente para fade smooth */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-700 ease-out" 
            onClick={() => setSelectedVape(null)} 
          />
          
          {/* Contenido del Modal con Zoom y Blur dinámico */}
          <div 
            className="glass-card max-w-[420px] w-full rounded-[3.5rem] overflow-hidden relative shadow-[0_0_120px_rgba(0,0,0,0.9)] border border-white/15 animate-modal-enter z-10 max-h-[96vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Botón de Cierre con delay */}
            <button 
              onClick={() => setSelectedVape(null)} 
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-error transition-all hover:rotate-90 border border-white/10 animate-in fade-in zoom-in duration-500 delay-300 fill-mode-both"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-5 sm:p-7 flex flex-col items-center">
              {/* Imagen con entrada suave */}
              <div className="w-full aspect-square relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-black/40 shadow-2xl flex items-center justify-center p-5 group/modalimg mb-4 animate-in fade-in zoom-in-90 duration-700 delay-100 fill-mode-both">
                <div className="w-full h-full flex snap-x snap-mandatory overflow-x-auto hide-scrollbar">
                  {selectedVape.media && selectedVape.media.length > 0 ? selectedVape.media.map((m, i) => (
                    <div key={i} className="min-w-full h-full snap-center flex items-center justify-center relative">
                      {m.type === 'video' || m.mimetype?.startsWith('video') ? <video src={resolveImageUrl(m.url)} controls className="max-w-full max-h-full object-contain rounded-2xl" autoPlay muted loop /> : <img src={resolveImageUrl(m.url)} alt={selectedVape.nombre} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover/modalimg:scale-105" />}
                    </div>
                  )) : <img src={resolveImageUrl(selectedVape.imagenUrl)} alt={selectedVape.nombre} className="max-w-full max-h-full object-contain group-hover/modalimg:scale-105 transition-transform duration-700" />}
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-5 scanlines" />
              </div>

              {/* Bloque de Información escalonado */}
              <div className="w-full space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                <div className="flex flex-wrap justify-center gap-1.5">
                  <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border border-primary/30">{selectedVape.sabor}</span>
                  <span className="bg-white/5 text-neutral-content/40 px-2.5 py-1 rounded-lg text-[7px] font-mono font-bold border border-white/10 uppercase tracking-widest">{selectedVape.puffs} PUFFS</span>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase mb-2">{selectedVape.nombre}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-primary text-xl font-mono font-black">$</span>
                      <p className="text-4xl font-black text-primary tracking-tighter">
                        {selectedVape.mostrarPrecio !== false ? `${parseFloat(selectedVape.precio || 0).toFixed(2)}` : "—"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-[#d1ff4d15] px-3 py-1.5 rounded-lg border border-[#d1ff4d20]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d1ff4d] shadow-[0_0_8px_#d1ff4d]" />
                      <span className="text-[9px] font-black text-[#d1ff4d] uppercase tracking-widest">Disponible</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <p className="text-[13px] text-neutral-content/60 leading-relaxed text-justify px-2">
                    {selectedVape.descripcion || "Fórmula premium diseñada para ofrecer una experiencia sensorial inigualable con cada calada. Pureza garantizada por Nubex Lab."}
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { addToCart(selectedVape); setIsCartOpen(true); setSelectedVape(null); }} className="bg-primary/10 text-primary border border-primary/20 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-95">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-tighter">Al Carrito</span>
                    </button>
                    <button onClick={() => handleConsultar(selectedVape)} className="bg-primary text-primary-content font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2 hover:shadow-[0_15px_30px_rgba(0,229,255,0.3)] transition-all active:scale-95">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-tighter">Comprar Ya</span>
                    </button>
                  </div>
                  <button onClick={() => setSelectedVape(null)} className="w-full text-neutral-content/20 hover:text-white transition-colors text-[8px] font-bold uppercase tracking-[0.4em] py-1">Volver al catálogo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INFORMACIÓN LEGAL INTEGRADO */}
      {infoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setInfoModal(null)} />
          <div className="glass-card max-w-sm w-full p-8 rounded-[2.5rem] relative z-10 border border-white/10 animate-modal-enter text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 italic shrink-0">{infoModal.title}</h3>
            <div className="overflow-y-auto custom-scrollbar pr-2 mb-8">
              <div className="text-sm text-neutral-content/60 leading-relaxed whitespace-pre-wrap">
                {infoModal.content}
              </div>
            </div>
            <button onClick={() => setInfoModal(null)} className="w-full bg-primary text-primary-content font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform shrink-0">
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* CARRITO FLOTANTE Y DRAWER */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-8 right-8 z-[80] w-16 h-16 bg-primary text-primary-content rounded-full shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 animate-in zoom-in duration-500 ${cart.length === 0 ? 'scale-0' : 'scale-100'}`}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary shadow-lg animate-bounce">
          {cart.reduce((acc, item) => acc + item.quantity, 0)}
        </span>
      </button>

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
                      <img src={resolveImageUrl(item.imagenUrl)} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
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

    </div>
  );
}
