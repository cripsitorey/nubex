"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { loginUser, logoutUser, getCurrentUser, isAuthenticated } from "@/services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Leer usuario persistido en localStorage
    const stored = getCurrentUser();
    if (stored && isAuthenticated()) {
      setUser(stored);
      
      // Fetch silencioso para actualizar datos frescos (fidelidad, historial)
      import("@/services/api").then(({ getMe }) => {
        getMe().then(freshUser => {
          setUser(freshUser);
          localStorage.setItem("nubex_user", JSON.stringify(freshUser));
        }).catch(err => {
          console.error("Error refreshing profile:", err);
        });
      });
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await loginUser(identifier, password);
    setUser(data.user);

    // Redirigir según rol
    switch (data.user.role) {
      case "ADMIN":
        router.push("/admin");
        break;
      case "VENDEDOR":
        router.push("/vender");
        break;
      case "CLIENTE":
      default:
        router.push("/cliente");
        break;
    }

    return data;
  }, [router]);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
