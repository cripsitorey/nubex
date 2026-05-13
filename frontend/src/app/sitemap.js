import { getVapes } from "@/services/api";

const URL = "https://nubex.rondira.com";

export default async function sitemap() {
  const routes = [
    {
      url: `${URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${URL}/tienda`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const data = await getVapes();
    const vapes = Array.isArray(data) ? data : data.data || [];

    const productRoutes = vapes.map((vape) => ({
      url: `${URL}/tienda/${vape.id}`,
      lastModified: new Date(vape.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return routes;
  }
}
