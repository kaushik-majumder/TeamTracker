import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pin runtime-needed env vars into the build because Amplify Hosting Compute
  // doesn't pass console-defined env vars through to the SSR Lambda at runtime.
  // These are baked into the server bundle only; nothing here is shipped to
  // the browser unless prefixed with NEXT_PUBLIC_.
  env: {
    APP_URL: process.env.APP_URL ?? '',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    DIRECT_URL: process.env.DIRECT_URL ?? '',
    SESSION_SECRET: process.env.SESSION_SECRET ?? '',
    CRON_SECRET: process.env.CRON_SECRET ?? '',
    SMTP_HOST: process.env.SMTP_HOST ?? '',
    SMTP_PORT: process.env.SMTP_PORT ?? '',
    SMTP_USER: process.env.SMTP_USER ?? '',
    SMTP_PASS: process.env.SMTP_PASS ?? '',
    EMAIL_FROM: process.env.EMAIL_FROM ?? '',
  },

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
