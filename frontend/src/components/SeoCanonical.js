"use client";

import { usePathname } from "next/navigation";

export default function SeoCanonical() {
  const pathname = usePathname();
  const domain = "https://nubex.rondira.com";

  return <link rel="canonical" href={`${domain}${pathname === "/" ? "" : pathname}`} />;
}
