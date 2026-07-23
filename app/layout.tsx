import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GoogleTagManagerBody, GoogleTagManagerHead } from "@/app/components/GoogleTagManager";
import { Caveat, Inter } from "next/font/google";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-highlight",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} Events`,
  description: "Register for events and manage your pass",
  icons: {
    icon: BRAND_LOGO_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() || "G-4801XNSKV8";
const GA_MEASUREMENT_ID_SECONDARY = "G-0BT2JXWMK1";
const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18043603754";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleTagManagerHead />
      </head>
      <body className={`${inter.className} ${caveat.variable} antialiased min-h-screen`}>
        <GoogleTagManagerBody />
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID_SECONDARY}');
              gtag('config', '${GA_MEASUREMENT_ID}');
              gtag('config', '${GOOGLE_ADS_ID}');
            `,
          }}
        />
        {/* LinkedIn Insight Tag is mounted inside the <footer> element — see
            app/components/Footer.tsx. Do not add a second mount here. */}
      </body>
    </html>
  );
}
