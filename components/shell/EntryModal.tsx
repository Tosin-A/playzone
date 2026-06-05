"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  submitGiveawayEntry,
  type SocialPlatform,
} from "@/lib/giveaway";

interface EntryModalProps {
  open: boolean;
  onClose: () => void;
  gameSlug: string;
  score: number | null;
  scoreDisplay: string;
  faceShown: boolean;
  initialName?: string;
}

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "other", label: "Other" },
];

export default function EntryModal({
  open,
  onClose,
  gameSlug,
  score,
  scoreDisplay,
  faceShown,
  initialName = "",
}: EntryModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("tiktok");
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC to close, focus trap on open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "loading") onClose();
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, state]);

  const handleSubmit = useCallback(async () => {
    setState("loading");
    setError("");
    const res = await submitGiveawayEntry({
      gameSlug,
      playerName: name,
      email,
      socialUrl: socialUrl || undefined,
      socialPlatform: socialUrl ? platform : undefined,
      score,
      scoreDisplay,
      faceShown,
      ageConfirmed: age,
      consentConfirmed: consent,
    });
    if (res.ok) {
      setState("done");
    } else {
      setState("error");
      setError(res.error ?? "Something went wrong.");
    }
  }, [name, email, socialUrl, platform, age, consent, gameSlug, score, scoreDisplay, faceShown]);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    age &&
    consent &&
    state !== "loading";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && state !== "loading") onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] outline-none"
          >
            {state === "done" ? (
              <div className="text-center space-y-4 py-2">
                <div className="text-5xl">🎟️</div>
                <h2 id="entry-modal-title" className="text-2xl font-bold font-[family-name:var(--font-display)]">
                  You&apos;re in.
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Weekly draw happens every Monday. Winners are emailed within
                  24 hours of the draw.
                </p>
                {socialUrl ? null : (
                  <p className="text-white/50 text-xs leading-relaxed">
                    Tip: post your clip on socials with{" "}
                    <span className="text-accent">#PlayZone</span> for an extra
                    chance — DM us the link if you forgot.
                  </p>
                )}
                <button
                  onClick={onClose}
                  className="w-full mt-2 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2
                      id="entry-modal-title"
                      className="text-xl font-bold font-[family-name:var(--font-display)] leading-tight"
                    >
                      Enter the weekly £30 draw
                    </h2>
                    <p className="text-white/50 text-xs mt-1">
                      Amazon voucher. Drawn every Monday.{" "}
                      <Link href="/rules" className="underline hover:text-white/80">
                        Rules
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={state === "loading"}
                    className="text-white/40 hover:text-white/80 text-xl leading-none p-1 disabled:opacity-30"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Display name / handle</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. tosin or @tosin"
                      maxLength={40}
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                    />
                    <p className="text-[10px] text-white/40 mt-1">
                      Only used to contact you if you win. We won&apos;t send marketing.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-1 block">
                      Your post link <span className="text-white/40">(optional, doubles your chances)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-2 py-2.5 text-sm text-white outline-none focus:border-white/20"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <input
                        value={socialUrl}
                        onChange={(e) => setSocialUrl(e.target.value)}
                        placeholder="https://…"
                        inputMode="url"
                        className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      Tag <span className="text-accent">#PlayZone</span> or <span className="text-accent">@playzone</span> in your post.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 text-xs text-white/70 leading-snug cursor-pointer">
                      <input
                        type="checkbox"
                        checked={age}
                        onChange={(e) => setAge(e.target.checked)}
                        className="mt-0.5 accent-[var(--accent)]"
                      />
                      <span>I&apos;m 18 or over and a UK / ROI resident.</span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-white/70 leading-snug cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 accent-[var(--accent)]"
                      />
                      <span>
                        I agree to the{" "}
                        <Link href="/rules" className="underline hover:text-white">prize draw rules</Link>{" "}
                        and to PlayZone contacting me by email if I win.
                      </span>
                    </label>
                  </div>

                  {state === "error" && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full mt-2 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {state === "loading" ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      "Enter the draw"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
