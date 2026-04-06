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
  },
  openGraph: {
    title: "Pharma CI",
    description:
      "Trouvez vos médicaments et pharmacies en Côte d'Ivoire",
    type: "website",
  },
  // Optimisation du preloading et performance
  prefetch: true,
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
