import type { Metadata, Viewport } from "next";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
