import type { Metadata, Viewport } from "next";
import { BRAND_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} Events`,
  description: "Register for events and manage your pass",
  icons: {
    icon: "https://nexuseslink2024.s3.us-east-2.amazonaws.com/eventsad_1781265936890_1rs2.svg"
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
