import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Packages that should not be bundled by Turbopack/webpack — they're loaded
  // at runtime from node_modules. Required for native modules and DB drivers
  // when deploying to Lambda-style runtimes (Vercel, Amplify SSR Compute).
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'pg-cloudflare',
    'bcryptjs',
    'nodemailer',
  ],
}

export default nextConfig
