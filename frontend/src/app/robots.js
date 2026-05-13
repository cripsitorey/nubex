export default function robots() {
  const isDev = (process.env.APP_ENV || process.env.NODE_ENV) !== "production";

  if (isDev) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/vender",
        "/cliente",
        "/clientes",
        "/perfil",
        "/historial",
        "/fidelidad",
        "/api",
      ],
    },
    sitemap: "https://nubex.rondira.com/sitemap.xml",
  };
}
