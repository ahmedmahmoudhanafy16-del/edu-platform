import createNextIntlPlugin from 'next-intl/plugin';

// Point to the NEW request config location (next-intl 3.22+ convention)
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

export default withNextIntl(nextConfig);
