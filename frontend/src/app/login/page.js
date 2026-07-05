'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      const routes = { ADMIN: '/admin', VENDEDOR: '/vendedor', CLIENTE: '/cliente' };
      router.replace(routes[user.role] || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-primary">Nubex</h1>
            <p className="text-base-content/60 text-sm">Labs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Email, teléfono o cédula</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="usuario@nubex.com"
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Contraseña</span></label>
              <input
                type="password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert alert-error text-sm py-2">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
