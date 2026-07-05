'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/shared/Navbar';

export default function ClienteLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar title="Mi cuenta" />
      <main className="p-4 max-w-lg mx-auto">{children}</main>
    </div>
  );
}
