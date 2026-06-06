import type { Metadata } from "next";
import PlatformLanding from "@/components/landing/PlatformLanding";
import { GAMES } from "@/lib/games";
import { getCanonical, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "PlayZone — Ten games. One webcam. No download.",
  description:
    "Ten browser-based webcam mini-games. Your camera is the controller. Score, screenshot, share. Plays in any browser — no signup, no app.",
  alternates: { canonical: getCanonical("/") },
  openGraph: {
    type: "website",
    url: getCanonical("/"),
    title: "PlayZone — Ten games. One webcam. No download.",
    description:
      "Your camera is the controller. Ten webcam mini-games that play in any browser. No signup, no app.",
    siteName: "PlayZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayZone — Ten games. One webcam.",
    description:
      "Camera-controlled mini-games. Plays in any browser. No signup.",
  },
};

const collectionLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "PlayZone games",
  url: getCanonical("/"),
  isPartOf: {
    "@type": "WebSite",
    name: "PlayZone",
    url: getSiteUrl(),
  },
  hasPart: GAMES.filter((g) => g.available).map((g) => ({
    "@type": "VideoGame",
    name: g.title,
    url: getCanonical(`/play/${g.slug}`),
    description: g.description,
    isAccessibleForFree: true,
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <PlatformLanding />
    </>
  );
}
