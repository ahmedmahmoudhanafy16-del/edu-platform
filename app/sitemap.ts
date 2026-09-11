import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.example.com';
  const currentDate = new Date().toISOString();

  const publicRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/ar', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/en', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/ar/login', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/en/login', priority: 0.8, changeFrequency: 'monthly' as const },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
