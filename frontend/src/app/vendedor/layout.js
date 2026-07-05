'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { ShoppingCart, Package, ClipboardList, UserPlus } from 'lucide-react';

const navItems = [
  { href: '/vendedor', label: 'Punto de venta', icon: ShoppingCart },
  { href: '/vendedor/inventario', label: 'Mi inventario', icon: Package },
  { href: '/vendedor/ventas', label: 'Mis ventas', icon: ClipboardList },
  { href: '/vendedor/clientes', label: 'Registrar cliente', icon: UserPlus },
];

export default function VendedorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role === 'CLIENTE')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar title="Vendedor" />
      <div className="flex">
        <Sidebar items={navItems} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
