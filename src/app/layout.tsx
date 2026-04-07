import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Pharma CI - Trouvez vos médicaments en Côte d'Ivoire",
  description:
    "Application de recherche de pharmacies et médicaments en Côte d'Ivoire. Trouvez les pharmacies de garde, vérifiez la disponibilité des médicaments et comparez les prix.",
  keywords: [
    "pharmacie",
    "Côte d'Ivoire",
    "Abidjan",
    "médicaments",
    "pharmacie de garde",
    "santé",
    "Bouaké",
    "San Pedro",
  ],
  authors: [{ name: "Pharma CI" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { rel: "icon", url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Pharma CI",
    description:
      "Trouvez vos médicaments et pharmacies en Côte d'Ivoire",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" />
        <link rel="icon" href="/favicon-64x64.png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
