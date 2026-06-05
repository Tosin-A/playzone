import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES } from "@/lib/games";
import { getGameSeo, getCanonical, getSiteUrl } from "@/lib/seo";
import { CameraProvider } from "@/lib/CameraProvider";
import RizzGame from "@/games/rizz";
import SixSevenGame from "@/games/six-seven";
import ShadowBoxingGame from "@/games/shadow-boxing";
import PoseOffGame from "@/games/pose-off";
import DontSmileGame from "@/games/dont-smile";
import StareOffGame from "@/games/stare-off";
import JutsuGame from "@/games/jutsu";
import MirrorGame from "@/games/mirror";
import SubwayRunGame from "@/games/subway-run";
import RequestCameraOnMount from "./RequestCameraOnMount";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function renderGame(slug: string) {
  switch (slug) {
    case "rizz": return <RizzGame />;
    case "six-seven": return <SixSevenGame />;
    case "shadow-boxing": return <ShadowBoxingGame />;
    case "pose-off": return <PoseOffGame />;
    case "dont-smile": return <DontSmileGame />;
    case "stare-off": return <StareOffGame />;
    case "jutsu": return <JutsuGame />;
    case "mirror": return <MirrorGame />;
    case "subway-run": return <SubwayRunGame />;
    default: return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return {};

  const seo = getGameSeo(game);
  const canonical = getCanonical(`/play/${slug}`);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: seo.title,
      description: seo.description,
      siteName: "PlayZone",
      // Per-game OG image auto-discovered from
      // app/play/[slug]/opengraph-image.tsx
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}

export async function generateStaticParams() {
  return GAMES.filter((g) => g.available).map((g) => ({ slug: g.slug }));
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;

  const game = GAMES.find((g) => g.slug === slug);
  if (!game || !game.available) {
    notFound();
  }

  const rendered = renderGame(slug);
  if (!rendered) notFound();

  const seo = getGameSeo(game);
  const canonical = getCanonical(`/play/${slug}`);

  // JSON-LD VideoGame schema (drives rich results / Knowledge Graph hints)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    alternateName: seo.title,
    description: seo.description,
    url: canonical,
    image: `${canonical}/opengraph-image`,
    genre: ["Arcade", "Webcam", "Browser game"],
    gamePlatform: ["Web browser"],
    operatingSystem: "Any (browser)",
    applicationCategory: "Game",
    inLanguage: "en",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "PlayZone",
      url: getSiteUrl(),
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <CameraProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RequestCameraOnMount />
      {rendered}
    </CameraProvider>
  );
}
