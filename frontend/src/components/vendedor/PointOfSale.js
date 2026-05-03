"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Camera, Image as ImageIcon, Receipt, Wifi, WifiOff } from "lucide-react";
import { getCachedCatalog, addToSyncQueue } from "@/lib/syncService";
import { createSale, ApiError } from "@/services/api";
import { useNetwork } from "@/components/NetworkProvider";

export default function PointOfSale({ client, onSaleComplete, userRole }) {
  const { isOnline } = useNetwork();
  const [vapes, setVapes] = useState([]);
  const [selectedVapeId, setSelectedVapeId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioFinal, setPrecioFinal] = useState("");
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobanteBase64, setComprobanteBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pagadoA, setPagadoA] = useState("VENDEDOR");

  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    async function loadCatalog() {
      const { vapes } = await getCachedCatalog();
      setVapes(vapes || []);
    }
    loadCatalog();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComprobanteFile(file);
      setPreview(URL.createObjectURL(file));

      // También guardar Base64 para fallback offline
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobanteBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearComprobante = () => {
    setPreview(null);
    setComprobanteFile(null);
    setComprobanteBase64(null);
  };

  const selectedVape = vapes.find(v => v.id === parseInt(selectedVapeId));

  // Cuando se selecciona un vape, pre-llenar el precio sugerido
  useEffect(() => {
    if (selectedVape) {
      setPrecioFinal(parseFloat(selectedVape.precio).toFixed(2));
    } else {
      setPrecioFinal("");
    }
  }, [selectedVapeId]);

  const precioUnitario = parseFloat(precioFinal) || 0;
  const subtotal = precioUnitario * cantidad;

  const hasPlan = client?.suscripcion || client?.asignarSuscripcion;
  let multaSugerida = 0;
  const total = subtotal + multaSugerida;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVapeId || (!comprobanteFile && !comprobanteBase64)) {
      alert("Selecciona un vape y sube el comprobante de pago.");
      return;
    }
    if (!precioFinal || precioUnitario <= 0) {
      alert("Introduce un precio de venta válido.");
      return;
    }

    setIsSubmitting(true);

    // Intentar envío online directo
    if (isOnline && comprobanteFile) {
      try {
        const formData = new FormData();
        if (client.id > 0) formData.append("clienteId", client.id);
        formData.append("vapeId", parseInt(selectedVapeId));
        formData.append("cantidad", parseInt(cantidad));
        formData.append("precioVenta", precioUnitario);
        formData.append("pagadoA", isAdmin ? "ADMIN" : pagadoA);
        formData.append("comprobante", comprobanteFile);

        const result = await createSale(formData);
        setIsSubmitting(false);

        let msg = "¡Venta registrada exitosamente!";
        if (result.alertaFidelidad) {
          msg += `\n\n🎉 ${result.alertaFidelidad}`;
        }
        alert(msg);
        onSaleComplete();
        return;
      } catch (err) {
        if (err.name === 'ApiError' && err.status >= 400 && err.status < 500) {
          setIsSubmitting(false);
          alert(`La venta no se pudo procesar: ${err.message}`);
          return;
        }

        console.warn("Envío online falló por error de red/servidor, encolando offline:", err.message);
      }
    }

    // Fallback: encolar para sincronización offline
    const payload = {
      clienteId: client.id > 0 ? client.id : null,
      vapeId: parseInt(selectedVapeId),
      cantidad: parseInt(cantidad),
      costoAdquisicion: selectedVape.costo,
      precioVenta: precioUnitario,
      pagadoA: isAdmin ? "ADMIN" : pagadoA,
      comprobanteBase64,
    };

    await addToSyncQueue("SALE", payload);
    setIsSubmitting(false);
    alert("Venta encolada offline. Se sincronizará al reconectar.");
    onSaleComplete();
  };

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white">Registrar Venta</h3>
        <div className="ml-auto">
          {isOnline
            ? <Wifi className="w-4 h-4 text-success" />
            : <WifiOff className="w-4 h-4 text-warning" />
          }
        </div>
      </div>

      <div className="mb-6 p-4 bg-base-200/50 rounded-2xl flex items-center justify-between border border-white/5">
        <div>
          <p className="text-xs text-neutral-content/60 font-mono">CLIENTE</p>
          <p className="text-sm font-bold text-white">{client.nombre}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-content/60 font-mono">TIPO</p>
          <p className={`text-xs font-bold ${hasPlan ? 'text-success' : 'text-primary'}`}>
            {hasPlan ? 'Suscrito' : 'Casual'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Producto (Vape)</label>
          <select 
            className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none"
            value={selectedVapeId}
            onChange={(e) => setSelectedVapeId(e.target.value)}
            required
          >
            <option value="">Seleccione un vape...</option>
            {vapes.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}{v.sabor ? ` — ${v.sabor}` : ''}{v.puffs ? ` (${v.puffs}p)` : ''} - ${parseFloat(v.precio).toFixed(2)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Cantidad</label>
          <input
            type="number"
            min="1"
            className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Precio de Venta (por unidad)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none"
            value={precioFinal}
            onChange={(e) => setPrecioFinal(e.target.value)}
            required
            placeholder="Precio al que se vendió"
          />
          {selectedVape && precioUnitario !== parseFloat(selectedVape.precio) && (
            <p className="text-xs text-warning mt-1">Sugerido: ${parseFloat(selectedVape.precio).toFixed(2)} — Modificado</p>
          )}
        </div>

        {/* Solo mostrar selector de pagadoA para vendedores */}
        {!isAdmin && (
          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">¿Quién recibió el pago?</label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setPagadoA("VENDEDOR")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${pagadoA === "VENDEDOR" ? "bg-primary text-primary-content shadow-lg" : "bg-base-200 text-neutral-content/60"}`}
              >Vendedor</button>
              <button type="button" onClick={() => setPagadoA("ADMIN")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${pagadoA === "ADMIN" ? "bg-primary text-primary-content shadow-lg" : "bg-base-200 text-neutral-content/60"}`}
              >Admin</button>
            </div>
          </div>
        )}

        <div className="py-2 border-t border-b border-white/10 my-4">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-neutral-content/80">Subtotal:</span>
            <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
          </div>
          {/* Solo mostrar desglose para vendedores */}
          {!isAdmin && selectedVape && selectedVape.precioVendedor && (
            <div className="flex justify-between items-center text-sm mb-1 text-warning">
              <span>Entregas al admin:</span>
              <span className="font-mono">${(parseFloat(selectedVape.precioVendedor) * cantidad).toFixed(2)}</span>
            </div>
          )}
          {!isAdmin && selectedVape && selectedVape.precioVendedor && (
            <div className="flex justify-between items-center text-sm mb-1 text-success">
              <span>Tu ganancia:</span>
              <span className="font-mono">${(subtotal - (parseFloat(selectedVape.precioVendedor) * cantidad)).toFixed(2)}</span>
            </div>
          )}
          {multaSugerida > 0 && (
            <div className="flex justify-between items-center text-sm mb-1 text-warning">
              <span>Multa sugerida:</span>
              <span className="font-mono">+${multaSugerida.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold mt-2">
            <span className="text-primary">Total:</span>
            <span className="font-mono text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4" /> Comprobante de Pago
          </label>
          
          {preview ? (
            <div className="relative mb-3">
              <img src={preview} alt="Comprobante" className="w-full h-32 object-cover rounded-xl border border-white/20" />
              <button 
                type="button" 
                onClick={clearComprobante}
                className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
              >✕</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center h-24 bg-base-200 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:bg-base-300 hover:border-primary transition-colors text-neutral-content hover:text-white">
                <Camera className="w-6 h-6 mb-2" />
                <span className="text-xs font-bold">Cámara</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
              <label className="flex flex-col items-center justify-center h-24 bg-base-200 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:bg-base-300 hover:border-primary transition-colors text-neutral-content hover:text-white">
                <ImageIcon className="w-6 h-6 mb-2" />
                <span className="text-xs font-bold">Galería</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || (!comprobanteFile && !comprobanteBase64) || !selectedVapeId}
          className="w-full bg-success text-success-content font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(157,255,0,0.2)] hover:shadow-[0_0_30px_rgba(157,255,0,0.4)] disabled:opacity-50 disabled:shadow-none transition-all mt-6"
        >
          {isSubmitting ? "Enviando..." : (isOnline ? "Registrar Venta" : "Encolar Venta Offline")}
        </button>
      </form>
    </div>
  );
}
