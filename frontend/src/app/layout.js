import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'Nubex Labs',
  description: 'Sistema de gestión Nubex Labs',
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
