import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir la IP de LAN de desarrollo para HMR en el móvil
  allowedDevOrigins: ['192.168.100.146'],
};

export default withPWA(nextConfig);
