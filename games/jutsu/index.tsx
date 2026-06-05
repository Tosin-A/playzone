"use client";

import { getGameShareUrl } from "@/lib/share/url";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processFrame, JutsuState, JUTSUS, ActiveEffect } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import BackToResultsButton from "@/components/shell/BackToResultsButton";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import JutsuOnline from "./online";

type GamePhase = "ready" | "countdown" | "playing" | "result";
const GAME_DURATION = 30000; // 30 seconds

export default function JutsuGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Jutsu" howToPlay="Perform Naruto-style jutsus with your body. Rasengan, Chidori, Fireballs, Shadow Clones, and Summoning!">
        <div className="flex items-center justify-center min-h-[60vh]">
          {status === "denied" ? (
            <p className="text-red-400">Camera access required.</p>
          ) : (
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Jutsu" howToPlay="Perform jutsus: push forward (Rasengan), thrust down (Chidori), hands from face outward (Fireball), cross arms (Shadow Clone), slam hand low (Summoning). Chain different jutsus for combo multipliers!">
      <OnlineGameWrapper
        gameSlug="jutsu"
        gameName="Jutsu"
        unit=" pts"
        renderSoloGame={() => <JutsuInner stream={stream} />}
      >
        {(props) => (
          <JutsuOnline
            manager={props.manager}
            opponentScore={props.opponentScore}
            onScoreUpdate={props.onScoreUpdate}
            onGameFinished={props.onGameFinished}
          />
        )}
      </OnlineGameWrapper>
    </GameShell>
  );
}

function JutsuInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<JutsuState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<JutsuState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    setShareImage(null);
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPhase("playing");
    const initial = createInitialState();
    const now = performance.now();
    initial.startTime = now;
    setState(initial);
    stateRef.current = initial;
    startTimeRef.current = now;

    const landmarker = await getPoseLandmarker();

    const runFrame = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

      if (elapsed >= GAME_DURATION) {
        setPhase("result");
        const s = stateRef.current;
        const topJutsu = Object.entries(s.jutsuCounts).sort((a, b) => b[1] - a[1])[0];
        const topName = JUTSUS.find((j) => j.type === topJutsu[0])?.name ?? "";
        generateShareCard({
          title: "Jutsu Master",
          score: s.score,
          subtitle: `${s.totalJutsus} jutsus • Best combo: ${s.bestCombo}x • Fav: ${topName}`,
          gameUrl: getGameShareUrl("jutsu"),
        }).then(setShareImage);
        return;
      }

      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        try {
          const poseResult = landmarker.detectForVideo(video, now);
          const newState = processFrame(poseResult, stateRef.current, now);
          stateRef.current = newState;
          setState(newState);
        } catch {
          /* skip frame */
        }
      }

      animFrameRef.current = requestAnimationFrame(runFrame);
    };

    animFrameRef.current = requestAnimationFrame(runFrame);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // state + shareImage preserved so the last result can be re-opened.
  // startGame() re-initialises both at the start of the next round.
  const reset = useCallback(() => {
    setPhase("ready");
  }, []);

  if (phase === "result") {
    return (
      <ShareScreen
        score={state.score}
        subtitle={`${state.totalJutsus} jutsus performed • ${state.bestCombo}x best combo`}
        shareImage={shareImage}
        gameUrl={getGameShareUrl("jutsu")}
        onPlayAgain={reset}
      />
    );
  }

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          phase === "playing" ? (
            <JutsuOverlay state={state} timeLeft={timeLeft} />
          ) : phase === "countdown" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent"
              >
                {countdown}
              </motion.span>
            </div>
          ) : undefined
        }
      />

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          {/* Move list */}
          <div className="grid grid-cols-2 gap-2 text-xs max-w-xs">
            {JUTSUS.map((j) => (
              <div key={j.type} className="bg-white/5 rounded-xl px-3 py-2">
                <span className="font-semibold" style={{ color: j.chakraColor }}>{j.name}</span>
                <p className="text-white/50 mt-0.5">{j.description}</p>
              </div>
            ))}
          </div>
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Begin Jutsu"}
          </button>
          {shareImage && <BackToResultsButton onClick={() => setPhase("result")} />}
        </div>
      )}
    </>
  );
}

function JutsuOverlay({ state, timeLeft }: { state: JutsuState; timeLeft: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {timeLeft}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-bold text-accent">
          {state.score} pts
        </div>
      </div>

      {/* Combo indicator */}
      {state.combo > 1 && (
        <motion.div
          key={state.combo}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-14 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-xl"
        >
          <span className="text-xs font-bold text-yellow-400">{state.combo}x COMBO</span>
        </motion.div>
      )}

      {/* Active jutsu effects */}
      <AnimatePresence>
        {state.activeEffects.map((effect) => (
          <JutsuEffect key={effect.id} effect={effect} />
        ))}
      </AnimatePresence>

      {/* Last jutsu name flash */}
      {state.lastJutsu && (
        <motion.div
          key={state.totalJutsus}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 1.25 }}
          className="absolute bottom-20 left-0 right-0 text-center"
        >
          <span
            className="text-lg font-bold font-[family-name:var(--font-display)] uppercase"
            style={{ color: JUTSUS.find((j) => j.type === state.lastJutsu)?.chakraColor }}
          >
            {JUTSUS.find((j) => j.type === state.lastJutsu)?.name}
          </span>
        </motion.div>
      )}

      {/* Jutsu count bar */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        {JUTSUS.map((j) => (
          <div key={j.type} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold tabular-nums" style={{ color: j.chakraColor }}>
              {state.jutsuCounts[j.type]}
            </span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: j.chakraColor, opacity: state.jutsuCounts[j.type] > 0 ? 1 : 0.3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function JutsuEffect({ effect }: { effect: ActiveEffect }) {
  const jutsu = JUTSUS.find((j) => j.type === effect.type)!;

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute w-24 h-24 -ml-12 -mt-12 rounded-full"
      style={{
        left: `${effect.x * 100}%`,
        top: `${effect.y * 100}%`,
        background: `radial-gradient(circle, ${jutsu.chakraColor}80 0%, transparent 70%)`,
        boxShadow: `0 0 40px ${jutsu.chakraColor}60`,
      }}
    />
  );
}
