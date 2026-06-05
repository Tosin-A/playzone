import { redirect } from "next/navigation";

/**
 * Hero game funnel.
 *
 * Cold visitors (TikTok, iMessage, QR scans) hit `/` and go straight
 * into Rizz Rater — single URL, single mental model, dopamine on first
 * paint. The platform/directory lives at `/all` for return visitors
 * and post-game "try another" traffic.
 *
 * Change HERO_GAME to swap the front-door game without touching
 * routing elsewhere.
 */
const HERO_GAME = "rizz";

export default function Home() {
  redirect(`/play/${HERO_GAME}`);
}
