import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import CommandCenterProvider from "@/components/CommandCenterProvider";
import NetworkProvider from "@/components/NetworkProvider";
import { AuthProvider } from "@/hooks/useAuth";
import SeoCanonical from "@/components/SeoCanonical";

const isDev = (process.env.APP_ENV || process.env.NODE_ENV) !== "production";
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nubex Vape Inventory",
  description: "Sistema offline-first para Nubex Vapes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nubex",
  },
  robots: isDev ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-theme="nubexTheme"
    >
      <body className="h-full flex flex-col bg-base-100 text-base-content overflow-hidden">
        {isDev && <SeoCanonical />}
        <AuthProvider>
          <NetworkProvider>
            <CommandCenterProvider>
              <main className="flex-1 overflow-y-auto pb-16">
                {children}
              </main>
              <BottomNav />
            </CommandCenterProvider>
          </NetworkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

