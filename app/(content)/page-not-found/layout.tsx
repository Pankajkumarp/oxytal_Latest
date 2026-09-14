/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../../globals.css";
import { SITE_URL } from "@/app/lib/siteUrl";
import CookieConsentBanner from "@/app/ui/CookieConsent";
import { GoogleTagManagerScript, GoogleTagManagerNoScript } from "@/app/ui/GoogleTagManager";
import GTMPageView from "@/app/ui/GTMPageView";
import GTMLinkTracking from "@/app/ui/GTMLinkTracking";
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});
const APP_NAME = 'Oxytal';
const APP_DESCRIPTION = 'At Oxytal, we focus on driving youthful innovation and empowering future experts through cutting-edge digital solutions. We deliver cutting-edge digital solutions tailored for growth and success.';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: "%s",
  },
  description: APP_DESCRIPTION,

  applicationName: APP_NAME,

  metadataBase: new URL(SITE_URL),

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },

  formatDetection: {
    telephone: false,
  },

  openGraph: {
    type: "website",
    siteName: APP_NAME,
    description: APP_DESCRIPTION,
  },

  twitter: {
    card: "summary_large_image",
    description: APP_DESCRIPTION,
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement<any>> {

  return (
    <html
      className={`${poppins.variable}`}
    >
      <head>
        {/* No manual favicon <link> here anymore — app/favicon.ico,
            app/icon.png and app/apple-icon.png (the site-wide, top-level
            app/ favicon images — Next's file-based icon convention) are
            inherited by this route automatically; the previous hardcoded
            /favicon.png links pointed at a file that was never in
            public/, so they always 404ed. */}
        <link crossOrigin="" href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <meta content="yes" name="mobile-web-app-capable" />
      </head>
      <body className="mx-auto w-full" role="region" aria-label="Page content">
        {/* `role`/`aria-label` here give `<body>` a named ARIA landmark
            so Next's route announcer (appended straight to
            `document.body` on client-side navigations — see
            `app/(content)/[locale]/layout.tsx`'s own doc comment on this
            same attribute) ends up contained in a landmark instead of
            tripping automated accessibility scanners' "text not in a
            landmark" check. */}
        <GoogleTagManagerNoScript />
        {children}
        <CookieConsentBanner />
        <GoogleTagManagerScript />
        <GTMPageView />
        <GTMLinkTracking />
      </body>
    </html>
  );
}
