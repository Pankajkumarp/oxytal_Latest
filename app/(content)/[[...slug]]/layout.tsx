import type { Metadata } from "next";
import "../../globals.css";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
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

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" role="region" aria-label="Page content">
        {/* `role`/`aria-label` here aren't decorative — they give `<body>`
            itself a named ARIA landmark, so Next's built-in route
            announcer (`next-route-announcer`, appended straight to
            `document.body` by the framework on every client-side
            navigation — see that file's own doc comment) ends up
            contained in a landmark like everything else on the page,
            rather than tripping automated accessibility scanners' "text
            not in a landmark" check. No JSX inside this file can wrap
            that announcer node directly, since Next attaches it as a
            sibling of whatever this layout renders, not a child of it —
            `<body>` is the one element both share. */}
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
