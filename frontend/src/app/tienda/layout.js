import { CartProvider } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";

export const metadata = {
  title: "Catálogo Nubex Lab",
};

export default function TiendaLayout({ children }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
