import type { Metadata, Viewport } from "next";
import { Teko, Barlow } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const teko = Teko({
  weight: ["400", "500", "600", "700"],
  variable: "--font-teko",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow({
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://play67.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PlayZone — Ten games. One webcam. No download.",
  description:
    "Ten browser-based webcam mini-games. Your camera is the controller. Score, screenshot, share. Plays in any browser — no signup, no app.",
  applicationName: "PlayZone",
  authors: [{ name: "Tosin" }],
  keywords: [
    "webcam game",
    "browser game",
    "camera game",
    "pose detection",
    "mini games",
    "67 speed",
    "shadow boxing",
    "playzone",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "PlayZone — Ten games. One webcam. No download.",
    description:
      "Your camera is the controller. Ten webcam mini-games that play in any browser. No signup, no app.",
    siteName: "PlayZone",
    // Image auto-discovered from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayZone — Ten games. One webcam.",
    description:
      "Camera-controlled mini-games. Plays in any browser. No signup.",
    // Image auto-discovered from app/opengraph-image.tsx
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0d10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: "PlayZone",
      url: SITE_URL,
      description:
        "Camera-controlled mini-games that play in any browser. No signup, no app.",
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/all?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "PlayZone",
      url: SITE_URL,
      logo: `${SITE_URL}/icon`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${teko.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
