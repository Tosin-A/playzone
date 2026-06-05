import type { Metadata } from "next";
import Link from "next/link";
import { getCanonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Weekly £30 Prize Draw Rules — PlayZone",
  description:
    "Official terms for the PlayZone weekly £30 Amazon voucher prize draw. Free to enter, drawn every Monday.",
  alternates: { canonical: getCanonical("/rules") },
  robots: { index: true, follow: true },
};

const PROMOTER = "PlayZone";
const CONTACT_EMAIL = "ayanfex@icloud.com";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        <Link
          href="/"
          className="inline-block text-xs text-white/50 hover:text-white/80 mb-6"
        >
          ← Back to PlayZone
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] mb-2">
          Weekly £30 Prize Draw — Rules
        </h1>
        <p className="text-sm text-white/50 mb-8">
          Last updated: 5 June 2026
        </p>

        <div className="prose-invert max-w-none space-y-6 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Promoter</h2>
            <p>
              The Promoter is {PROMOTER}. Contact: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Open to UK and Republic of Ireland residents aged 18 or over.</li>
              <li>Employees of the Promoter and their immediate families are excluded.</li>
              <li>One person, one valid email address.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. How to enter (free)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Play any game on PlayZone.</li>
              <li>
                On the results screen, tap <em>&ldquo;Enter the weekly £30 draw&rdquo;</em> and submit
                your display name, email address, and the required confirmations.
              </li>
              <li>
                Optionally include a link to a public social post of your gameplay tagged
                <span className="text-accent"> #PlayZone</span> or
                <span className="text-accent"> @playzone</span>.
                A valid linked post counts as a second entry for that week&apos;s draw.
              </li>
            </ol>
            <p className="mt-2">
              No purchase is necessary. There is no cost to enter beyond standard data
              charges from your internet provider.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Entry period &amp; draw</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Each draw week runs from 00:00 Monday to 23:59 Sunday (UK time).</li>
              <li>The winner of each week is drawn at random the following Monday.</li>
              <li>Entries roll into the current week only — they do not carry over.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Prize</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>One (1) £30 Amazon UK digital gift voucher per draw week.</li>
              <li>The voucher is delivered by email and is subject to Amazon&apos;s terms.</li>
              <li>No cash alternative. The prize is non-transferable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Winner notification</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Winners are contacted by email at the address used to enter within
                24 hours of the draw.
              </li>
              <li>
                If a winner does not claim their prize within 7 days of notification,
                the Promoter reserves the right to redraw.
              </li>
              <li>
                Winners&apos; first names and game scores may be announced publicly
                on PlayZone&apos;s social channels. Full names, emails, and any other
                personal data will not be published.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. User-generated content (social posts)</h2>
            <p>
              If you submit a public social post link with your entry, you confirm that:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>You created the content and have the right to share it.</li>
              <li>The post is on a public account.</li>
              <li>
                You grant PlayZone a non-exclusive, royalty-free licence to repost, embed,
                or reference your post in promotional materials for the duration of the
                promotion. You may revoke this licence by emailing us at
                {" "}<a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Data &amp; privacy</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Your email is used only to contact you if you win and to verify your entry.
                It is not used for marketing.
              </li>
              <li>
                Entries are deleted 30 days after the draw they relate to, except for
                winners&apos; records which are retained for 12 months for accounting.
              </li>
              <li>
                You may request deletion of your data at any time by emailing
                {" "}<a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </li>
              <li>
                All in-browser camera processing on PlayZone stays on your device.
                We do not upload, store, or process your camera feed on our servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">9. General</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                The Promoter reserves the right to disqualify entries that are
                fraudulent, automated, or breach these rules.
              </li>
              <li>
                The Promoter may cancel, suspend, or amend the promotion if circumstances
                outside its reasonable control require it.
              </li>
              <li>
                These rules are governed by the laws of England and Wales. By entering,
                you agree to be bound by them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">10. Contact</h2>
            <p>
              Questions about the draw? Email{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
