import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#101624'};

export const metadata: Metadata = {
  title: "RIFT//BREAKERS — Interdimensional Brawler",
  description: "Four fighters. One fracture in reality. A browser platform brawler with handheld touch controls.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "./favicon.svg",
    shortcut: "./favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
