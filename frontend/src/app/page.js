export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-primary mb-4">Nubex Vapes</h1>
      <p className="text-neutral-content/80 mb-8">
        Sistema de inventario y ventas offline-first.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Presiona Ctrl + K</h2>
          <p className="text-sm text-neutral-content/60">Para abrir el Command Center y navegar rápidamente.</p>
        </div>
        
        <div className="glass-card p-6 rounded-2xl border-primary/20">
          <h2 className="text-xl font-semibold text-success mb-2">Sincronización</h2>
          <p className="text-sm text-neutral-content/60">Online - Datos actualizados.</p>
        </div>
      </div>
    </div>
  );
}
