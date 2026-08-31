import type { Metadata } from "next";
import "../../globals.css";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { SITE_URL } from "@/app/lib/siteUrl";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
