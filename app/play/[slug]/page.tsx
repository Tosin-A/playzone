import { notFound } from "next/navigation";
import { GAMES } from "@/lib/games";
import RizzGame from "@/games/rizz";
import SixSevenGame from "@/games/six-seven";
import ShadowBoxingGame from "@/games/shadow-boxing";
import PoseOffGame from "@/games/pose-off";
import DontSmileGame from "@/games/dont-smile";
import StareOffGame from "@/games/stare-off";
import JutsuGame from "@/games/jutsu";
import MirrorGame from "@/games/mirror";
import SubwayRunGame from "@/games/subway-run";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;

  const game = GAMES.find((g) => g.slug === slug);
  if (!game || !game.available) {
    notFound();
  }

  switch (slug) {
    case "rizz":
      return <RizzGame />;
    case "six-seven":
      return <SixSevenGame />;
    case "shadow-boxing":
      return <ShadowBoxingGame />;
    case "pose-off":
      return <PoseOffGame />;
    case "dont-smile":
      return <DontSmileGame />;
    case "stare-off":
      return <StareOffGame />;
    case "jutsu":
      return <JutsuGame />;
    case "mirror":
      return <MirrorGame />;
    case "subway-run":
      return <SubwayRunGame />;
    default:
      notFound();
  }
}

export async function generateStaticParams() {
  return GAMES.filter((g) => g.available).map((g) => ({ slug: g.slug }));
}
