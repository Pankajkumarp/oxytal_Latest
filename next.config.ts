import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets app/global-not-found.tsx handle genuinely unmatched URLs. This
    // app has two independent root layouts (app/(content)/[locale]/layout.tsx
    // and app/(content)/page-not-found/layout.tsx), and Next.js can't compose
    // a normal app/(content)/not-found.tsx boundary across multiple root
    // layouts — it silently falls back to its own generic built-in 404 UI
    // instead (see node_modules/next/dist/docs/.../not-found.md, "This can
    // happen in two cases: Your app has multiple root layouts..."). This flag
    // is the documented workaround for exactly that case.
    globalNotFound: true,
  },
};

export default nextConfig;
