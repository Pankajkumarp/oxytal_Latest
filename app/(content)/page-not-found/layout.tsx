/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../../globals.css";
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

  metadataBase: new URL("https://www.oxytal.com"),

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
        {/* No manual favicon <link> here anymore — app/icon.tsx and
            app/apple-icon.tsx (the site-wide, top-level app/ favicon,
            see that file's own doc comment) are inherited by this route
            automatically; the previous hardcoded /favicon.png links
            pointed at a file that was never in public/, so they always
            404ed. */}
        <link crossOrigin="" href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <meta content="yes" name="mobile-web-app-capable" />
      </head>
      <body className="mx-auto w-full">
        {children}
      </body>
    </html>
  );
}
