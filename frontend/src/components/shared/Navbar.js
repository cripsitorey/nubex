'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LogOut, User, WifiOff, RefreshCw } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useNetwork } from '@/components/NetworkProvider';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const net = useNetwork();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40">
      <div className="navbar-start">
        <img src="/logo.png" alt="Nubex Labs" className="h-11 w-auto" />
        {title && <span className="ml-2 text-base-content/50 hidden sm:inline">/ {title}</span>}
      </div>
      <div className="navbar-end gap-2">
        {net && !net.online && (
          <span className="badge badge-warning badge-sm gap-1" title="Sin conexión">
            <WifiOff size={12} /> Sin conexión
          </span>
        )}
        {net && net.online && net.pendingCount > 0 && (
          <button
            className="badge badge-info badge-sm gap-1"
            onClick={net.sync}
            disabled={net.syncing}
            title="Ventas pendientes de sincronizar"
          >
            <RefreshCw size={12} className={net.syncing ? 'animate-spin' : ''} /> {net.pendingCount} pendiente{net.pendingCount === 1 ? '' : 's'}
          </button>
        )}
        <span className="text-sm text-base-content/60 hidden sm:inline">{user?.nombre}</span>
        <ThemeToggle />
        <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-square" title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
