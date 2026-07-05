import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { NetworkProvider } from '@/components/NetworkProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata = {
  title: 'Nubex Labs',
  description: 'Sistema de gestión Nubex Labs',
  manifest: '/manifest.json',
  icons: {
    icon: ['/icon-192x192.png', '/icon-512x512.png'],
    apple: '/icon-192x192.png',
  },
};

export const viewport = {
  themeColor: '#0b0f19',
};

const themeInitScript = `
(function () {
  var stored = localStorage.getItem('nubex_theme');
  document.documentElement.setAttribute('data-theme', stored === 'light' ? 'light' : 'dark');
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ServiceWorkerRegister />
        <AuthProvider>
          <NetworkProvider>{children}</NetworkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
