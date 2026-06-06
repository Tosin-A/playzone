import type { Metadata } from "next";
import PlatformLanding from "@/components/landing/PlatformLanding";
import { GAMES } from "@/lib/games";
import { getCanonical, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All games — PlayZone | Webcam mini-games in your browser",
  description:
    "Browse every PlayZone game. Camera-controlled mini-games that play in any browser — no signup, no app, no download.",
  alternates: { canonical: getCanonical("/all") },
  openGraph: {
    type: "website",
    url: getCanonical("/all"),
    title: "All games — PlayZone",
    description:
      "Camera-controlled mini-games that play in any browser. Pick a game and start in seconds.",
    siteName: "PlayZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "All games — PlayZone",
    description: "Camera-controlled mini-games. Plays in any browser.",
  },
};

const collectionLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "All PlayZone games",
  url: getCanonical("/all"),
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
