'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Package, Users, BarChart2,
  CreditCard, Star, Repeat, Wallet, UserCircle,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/venta', label: 'Vender', icon: ShoppingCart },
  { href: '/admin/ventas', label: 'Ventas', icon: ShoppingBag },
  { href: '/admin/catalogo', label: 'Catálogo', icon: Package },
  { href: '/admin/inventario', label: 'Inventario', icon: BarChart2 },
  { href: '/admin/vendedores', label: 'Vendedores', icon: Users },
  { href: '/admin/clientes', label: 'Clientes', icon: UserCircle },
  { href: '/admin/suscripciones', label: 'Suscripciones', icon: Repeat },
  { href: '/admin/liquidaciones', label: 'Liquidaciones', icon: CreditCard },
  { href: '/admin/caja', label: 'Caja', icon: Wallet },
  { href: '/admin/fidelidad', label: 'Fidelidad', icon: Star },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar title="Admin" />
      <div className="flex">
        <Sidebar items={navItems} />
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
