import createNextIntlPlugin from 'next-intl/plugin';

// Point to the NEW request config location (next-intl 3.22+ convention)
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db', './prisma/schema.prisma'],
    },
  },
};

export default withNextIntl(nextConfig);
