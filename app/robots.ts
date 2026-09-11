import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ar', '/en', '/login', '/ar/login', '/en/login'],
        disallow: [
          '/api/',
          '/teacher/',
          '/ar/teacher/',
          '/en/teacher/',
          '/student/',
          '/ar/student/',
          '/en/student/',
          '/admin/',
          '/ar/admin/',
          '/en/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
