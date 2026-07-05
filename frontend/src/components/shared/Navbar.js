'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40">
      <div className="navbar-start">
        <span className="text-xl font-bold text-primary">Nubex</span>
        {title && <span className="ml-2 text-base-content/50 hidden sm:inline">/ {title}</span>}
      </div>
      <div className="navbar-end gap-2">
        <span className="text-sm text-base-content/60 hidden sm:inline">{user?.nombre}</span>
        <ThemeToggle />
        <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-square" title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
