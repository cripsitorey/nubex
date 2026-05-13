import { getVapeById } from "@/services/api";
import { notFound } from "next/navigation";
import { PackageSearch, ChevronLeft, ShoppingBag, MessageCircle } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";
const WHATSAPP_NUMBER = "593962736099";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

// Generar Metadatos dinámicos para SEO
export async function generateMetadata({ params }) {
  try {
    const data = await getVapeById(params.id);
    const vape = data.data || data;

    if (!vape) return {};

    const title = `${vape.nombre} - ${vape.sabor} | Nubex Lab`;
    const description = vape.descripcion || `Compra el ${vape.nombre} sabor ${vape.sabor} en Nubex Lab. Dispositivo premium de ${vape.puffs || 'alta'} caladas.`;
    const image = resolveImageUrl(vape.imagenUrl) || resolveImageUrl(vape.media?.[0]?.url);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : [],
      },
    };
  } catch (error) {
    return { title: "Producto No Encontrado | Nubex Lab" };
  }
}

export default async function ProductPage({ params }) {
  let vape = null;

  try {
    const data = await getVapeById(params.id);
    vape = data.data || data;
  } catch (error) {
    return notFound();
  }

  if (!vape) return notFound();

  const mainImg = resolveImageUrl(vape.imagenUrl) || resolveImageUrl(vape.media?.[0]?.url);

  // Esquema de Datos Estructurados JSON-LD (Schema.org/Product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": vape.nombre,
    "image": mainImg ? [mainImg] : [],
    "description": vape.descripcion || `Vape premium ${vape.nombre} sabor ${vape.sabor}.`,
    "sku": vape.id,
    "brand": {
      "@type": "Brand",
      "name": "Nubex Lab"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://nubex.rondira.com/tienda/${vape.id}`,
      "priceCurrency": "USD",
      "price": parseFloat(vape.precio || 0).toFixed(2),
      "availability": vape.stockTotal > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Nubex Lab"
      }
    }
  };

  return (
    <main className="min-h-screen bg-base-100 p-4 sm:p-8 pt-20">
      {/* Script JSON-LD inyectado para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto">
        <Link href="/tienda" className="inline-flex items-center gap-2 text-neutral-content/60 hover:text-primary transition-colors mb-8 font-bold uppercase tracking-widest text-xs">
          <ChevronLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <article className="glass-card rounded-[3rem] p-6 sm:p-10 border border-white/5 flex flex-col md:flex-row gap-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />

          {/* Imagen del Producto */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <div className="w-full aspect-square bg-black/40 rounded-[2rem] flex items-center justify-center p-8 border border-white/5 shadow-inner relative">
              {mainImg ? (
                <img 
                  src={mainImg} 
                  alt={`Foto de ${vape.nombre}`} 
                  className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
                />
              ) : (
                <PackageSearch className="w-20 h-20 text-white/10" />
              )}
              {vape.stockTotal <= 0 && (
                <div className="absolute top-4 right-4 bg-error text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Agotado</div>
              )}
            </div>
          </div>

          {/* Detalles del Producto */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex gap-2 mb-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/30">
                {vape.sabor || 'Premium'}
              </span>
              {vape.puffs && (
                <span className="bg-white/5 text-neutral-content/40 px-3 py-1 rounded-lg text-[10px] font-mono font-bold border border-white/10 uppercase tracking-widest">
                  {vape.puffs} Puffs
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
              {vape.nombre}
            </h1>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-primary text-2xl font-mono">$</span>
              <span className="text-5xl font-black text-primary tracking-tighter">
                {parseFloat(vape.precio || 0).toFixed(2)}
              </span>
            </div>

            <p className="text-neutral-content/70 text-sm leading-relaxed mb-10 text-justify">
              {vape.descripcion || `Experimenta la intensidad de ${vape.nombre} en sabor ${vape.sabor}. Diseñado por Nubex Lab para los usuarios más exigentes que buscan calidad y un diseño excepcional.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <Link 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Me interesa el producto: ${vape.nombre} (${vape.sabor}). ¿Sigue disponible?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-content font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,229,255,0.3)]"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs">Comprar en WhatsApp</span>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
