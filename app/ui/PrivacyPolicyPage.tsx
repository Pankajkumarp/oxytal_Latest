"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import * as CookieConsent from "vanilla-cookieconsent";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import ThemePattern from "./ThemePattern";
import { ComposableElementSkeleton, DataImageSkeleton } from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface AnyEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}

/** True for a resolved Contentful entry; false for an unresolved link (`{ sys: { type: "Link" } }`) or anything else. */
function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

/** One numbered clause of the document. Drives both the sticky table of contents and each `<section id>` anchor below it, so the two can never drift out of sync. */
const TOC_ITEMS: Array<{ id: string; label: string }> = [
  { id: "who", label: "Who we are" },
  { id: "what", label: "What we collect" },
  { id: "why", label: "Why we use it" },
  { id: "basis", label: "Legal basis" },
  { id: "share", label: "Who we share it with" },
  { id: "transfer", label: "International transfers" },
  { id: "keep", label: "How long we keep it" },
  { id: "secure", label: "How we protect it" },
  { id: "rights", label: "Your rights" },
  { id: "cookies", label: "Cookies" },
  { id: "candidates", label: "Job applicants" },
  { id: "clients", label: "Client data" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact & complaints" },
];

/** A `.cblk` info card from the reference — a bordered block of label/value rows (entity/contact details). Used twice below ("Who we are", "Contact & complaints"). */
function InfoBlock({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="my-5 rounded-2xl border border-[#E3ECF2] bg-white p-6">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 border-t border-[#F1F6F9] py-2.5 first:border-t-0 first:pt-0 sm:flex-row sm:gap-3"
        >
          <span className="min-w-[130px] shrink-0 font-semibold text-[10px] tracking-[0.1em] text-[#8598AA] uppercase">
            {row.label}
          </span>
          <span className="text-[14px] leading-[1.6] text-[#546A7E]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A `.tbl` data table from the reference — a bordered card of two-column rows (purpose/lawful-basis, data/retention) with a shaded header row. Collapses each row to a single stacked column below `sm`, matching the reference's own `@media (max-width:880px){.tbl .r{grid-template-columns:1fr}}` rule. */
function DataTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: Array<{ a: string; b: React.ReactNode }>;
}) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[#E3ECF2] bg-white">
      <div className="grid grid-cols-1 gap-1 bg-[#F1F6F9] px-[18px] py-3.5 sm:grid-cols-[1fr_1.3fr] sm:gap-4">
        {headers.map((header) => (
          <span
            key={header}
            className="font-semibold text-[11px] tracking-[0.11em] text-[#8598AA] uppercase"
          >
            {header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.a}
          className="grid grid-cols-1 gap-1 border-t border-[#F1F6F9] px-[18px] py-3.5 sm:grid-cols-[1fr_1.3fr] sm:gap-4"
        >
          <span className="text-[14px] leading-[1.5] font-medium text-[#546A7E]">
            {row.a}
          </span>
          <span className="text-[14px] leading-[1.6] text-[#3F5468]">
            {row.b}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The `/privacy-policy` page's document section — a `composableElement`
 * section (`subType: "privacyPolicy"` — see `ComposableElementRenderer`),
 * ported from `Refrence/oxytal-privacy-policy.html`. A standalone
 * component, deliberately not sharing code with `TermsOfUsePage` (its
 * closest sibling — same dark hero + sticky numbered table of contents +
 * bordered clauses shape) even though the two are visually near-
 * identical: this codebase's convention for bespoke, page-specific
 * sections (see every `app/ui/product/*CaseStudy.tsx`) is one
 * self-contained file per page rather than a shared base component, so a
 * future edit to one document's layout can never accidentally change the
 * other's.
 *
 * Fully static/hardcoded, same reasoning as `TermsOfUsePage`/
 * `ContactFormInfo`: this is reviewed legal copy, not a field an editor
 * should be able to freely rewrite. `entry` is read for exactly
 * `backgroundImage` and `pattern`/`patternColor` on the hero — same
 * "photo/pattern still wins" convention every composableElement section
 * uses.
 *
 * Two content shapes this document needs that `TermsOfUsePage` didn't:
 * - `DataTable`, for the "lawful basis"/"retention" tables (a bordered
 *   card of two-column rows with a shaded header row, collapsing to a
 *   single stacked column below `sm`)
 * - a real, working "Cookie Settings" trigger in the cookies clause —
 *   the reference's own markup calls a raw
 *   `window.CookieConsent.show()` global; this instead imports
 *   `vanilla-cookieconsent` directly (the same library
 *   `CookieConsent.tsx` already runs sitewide) and calls its actual
 *   `showPreferences()` API, so the link genuinely reopens the same
 *   preferences modal the footer/banner use instead of silently doing
 *   nothing
 *
 * Responsive: the 250px sticky table of contents disappears entirely
 * below `lg` (no room for a sidebar once the content column would have
 * to shrink below a readable width), same breakpoint `TermsOfUsePage`
 * uses.
 *
 * Animation (skipped under `prefers-reduced-motion`): the `h1` gets the
 * same GSAP split-text word reveal every hero on this site uses; each of
 * the 15 clause headings then fades + rises in individually as it
 * scrolls into view. The sticky table of contents also runs a scroll-spy
 * (an `IntersectionObserver` watching a thin band near the top of the
 * viewport) that highlights whichever clause is currently in view.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function PrivacyPolicyPage({ entry }: Props) {
  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL, same
  // pattern every sibling composableElement section uses.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const heroRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  /** Which clause's TOC entry is highlighted — kept in sync with scroll position by the SCROLL SPY effect below. Starts on the first clause. */
  const [activeId, setActiveId] = useState<string>(TOC_ITEMS[0].id);

  /** Opens the site's real cookie-preferences modal — see the component doc's "Cookie Settings" note above. */
  const handleOpenCookiePreferences = () => {
    CookieConsent.showPreferences();
  };

  /* =========================================================
     HERO HEADING REVEAL — the h1 splits into words and rises in as soon
     as it mounts (already in view on first paint, no scroll trigger),
     same GSAP split-text vocabulary every other section's own heading
     uses. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!headingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(headingRef.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 3,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.06,
          }),
      });
    }, heroRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     CLAUSE HEADING REVEAL — each of the 15 clause `<h2>`s fades + rises
     in individually as it scrolls into view — a lighter per-heading
     treatment than the hero's split-text pass, since there are 15 of
     them spread down a long document. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!articleRef.current) {
      return;
    }

    const headings = articleRef.current.querySelectorAll("h2");

    if (!headings.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headings, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      headings.forEach((heading) => {
        gsap.from(heading, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
          },
        });
      });
    }, articleRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     SCROLL SPY — highlights whichever clause is currently in view in the
     sticky table of contents. Watches a thin horizontal band near the
     top of the viewport (`rootMargin`'s negative top/bottom shrink the
     observed area down to roughly the top 15%–30% of the screen) rather
     than the whole viewport, so the active link switches right as a
     clause's heading crosses that band. Not gated behind
     `prefers-reduced-motion` — this is a state update, not a motion
     effect.
  ========================================================= */
  useLayoutEffect(() => {
    if (!articleRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections = articleRef.current.querySelectorAll("section[id]");

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <div data-nav-contrast="dark">
      <section
        ref={heroRef}
        className={cx(
          "relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-16 md:pt-28 md:pb-24",
          !backgroundUrl && "bg-gradient-to-br from-[#020617] via-[#041C32] to-[#003B5C]"
        )}
        style={
          backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Decorative radial glow — fixed regardless of any background
            photo, same "flourish stays fixed" convention every other
            section's own decorative accents use. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[46%] -right-[16%] z-0 h-[480px] w-[480px] rounded-full opacity-70 sm:h-[620px] sm:w-[620px] md:h-[760px] md:w-[760px]"
          style={{
            background: "radial-gradient(circle, rgba(22,185,232,.20), transparent 64%)",
          }}
        />

        <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern
            pattern={entry?.fields.pattern}
            patternColor={entry?.fields.patternColor}
          />
        </div>

        <div className="relative z-2 mx-auto max-w-7xl px-5 md:px-10 lg:px-14">
          <p className="mb-4 text-xs font-semibold tracking-[0.1em] text-cyan-400 uppercase">
            Legal
          </p>
          <h1
            ref={headingRef}
            className="max-w-xl text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[42px] lg:text-[50px] text-white"
          >
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] md:text-[16px] text-slate-300">
            How we collect, use, store and protect personal data — written
            to be read, not to be survived.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["Effective [02 Sep 2026]", "Last updated [02 Sep 2026]", "Version 1.0"].map(
              (date) => (
                <span
                  key={date}
                  className="rounded-full border border-white/18 px-3.5 py-[7px]  text-[10px] tracking-[0.1em] text-[#C3D3DF] uppercase"
                >
                  {date}
                </span>
              )
            )}
          </div>
        </div>
      </section>
</div>
      {/* ═══ CONTENTS + ARTICLE ═══ */}
      <div className="bg-[#FBFDFE]">
      <div className="mx-auto max-w-7xl px-5 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-10 py-11 sm:py-14 md:py-16 lg:grid-cols-[250px_1fr] lg:gap-16 lg:py-20">
          {/* Sticky table of contents — desktop/large screens only. */}
          <nav aria-label="Contents" className="hidden lg:sticky lg:top-7 lg:block">
            <p className="mb-3.5 font-bold text-[13px] tracking-[0.05em] text-[#8598AA] uppercase">
              Contents
            </p>
            <ol className="flex flex-col gap-0.5">
              {TOC_ITEMS.map((item, index) => {
                const isActive = item.id === activeId;

                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={cx(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-[12px] text-[14px] leading-[1.45] transition-colors",
                        isActive
                          ? "bg-[#E5F5FB] font-semibold text-[#0E9BC4]"
                          : "text-[#3F5468] hover:bg-[#F1F6F9] hover:text-[#546A7E]"
                      )}
                    >
                      <span
                        className={cx(
                          "pt-[3px] font-extrabold text-[13.6px]",
                          isActive ? "text-[#0E9BC4]" : "text-[#8598AA]"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <article ref={articleRef} className="max-w-[70ch]">
            <section id="who" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                1. Who we are
              </h2>
              <p className="mb-4 text-[16px] leading-[1.72] text-[#546A7E]">
                Oxytal is a digital consultancy with offices in London,
                Dublin and Chandigarh. This policy explains what we do with
                personal data collected through this website and in the
                course of our business.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                For the purposes of the EU General Data Protection
                Regulation (GDPR) and the UK GDPR, the{" "}
                <strong className="font-semibold text-[#0f172b]">
                  data controller
                </strong>{" "}
                for information collected through this website is:
              </p>
              <InfoBlock
                rows={[
                  { label: "Entity", value: "Oxytal Limited" },
                  { label: "Registered", value: "Ireland, company number: 705743" },
                  { label: "Address", value: "Ballydeague, Ballyhooly, Co Cork, Ireland" },
                  {
                    label: "Privacy contact",
                    value: (
                      <a href="mailto:privacy@oxytal.com" className="text-[#0E9BC4]">
                        privacy@oxytal.com
                      </a>
                    ),
                  },
                ]}
              />
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Our group also includes{" "}
                <strong className="font-semibold text-[#0f172b]">
                  Oxytal UK Limited
                </strong>{" "}
                (registered in England and Wales, company number
                16848238) and{" "}
                <strong className="font-semibold text-[#0f172b]">
                  Oxytal India Private Limited
                </strong>{" "}
                (CIN: U72900HR2022FTC100829, Panipat, India). Where these
                entities process personal data they do so under the same
                standards set out in this policy.
              </p>
            </section>

            <section id="what" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                2. What information we collect
              </h2>

              <span className="mt-6 mb-2.5 text-[16px] font-semibold text-[#546A7E] block">
                Information you give us
              </span>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                When you complete the contact form on this website, we
                collect the details you enter:
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li><strong className="font-semibold text-[#0f172b]">Your name</strong> — so we know who we&apos;re replying to</li>
                <li><strong className="font-semibold text-[#0f172b]">Your organisation</strong> — optional, and only used to understand the context of your enquiry</li>
                <li><strong className="font-semibold text-[#0f172b]">Your work email address</strong> — this is how we reply</li>
                <li><strong className="font-semibold text-[#0f172b]">Your telephone number</strong> — optional, used only if you&apos;d prefer a call</li>
                <li><strong className="font-semibold text-[#0f172b]">The service area you selected</strong> — so your enquiry reaches the right team</li>
                <li><strong className="font-semibold text-[#0f172b]">Your message</strong> — whatever you choose to tell us about what you need</li>
                <li><strong className="font-semibold text-[#0f172b]">Your consent</strong> — a record that you agreed to us using these details to reply, and when</li>
              </ul>
              <div className="my-5 rounded-r-xl border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] p-5 md:p-6">
                <p className="text-[14.5px] leading-[1.7] text-[#546A7E]">
                  <strong className="font-semibold">What happens to it.</strong>{" "}
                  The details you submit are stored in our secure customer
                  relationship database and used by our team to respond to
                  your enquiry and, if a conversation develops, to manage
                  that relationship. A person reads every enquiry. We do
                  not add you to a marketing mailing list on the basis of a
                  contact form submission, and we do not sell or rent your
                  details to anyone.
                </p>
              </div>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We also collect information you give us by email,
                telephone, at events, or in the course of working together
                — for example the names and contact details of people at a
                client organisation who are involved in a project.
              </p>

              <span className="mt-6 mb-2.5 text-[16px] font-semibold text-[#546A7E] block">
                Information collected automatically
              </span>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                When you visit this website we may collect technical
                information including your IP address, browser type and
                version, device type, operating system, the pages you
                visit and how long you spend on them, and the page or
                search that referred you. Some of this is collected
                through cookies and similar technologies — see section 10.
              </p>

              <span className="mt-6 mb-2.5 text-[16px] font-semibold text-[#546A7E] block">
                Information from other sources
              </span>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                We may receive your business contact details from publicly
                available professional sources such as a company website
                or LinkedIn, or from a mutual contact who has introduced
                us.
              </p>
            </section>

            <section id="why" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                3. Why we use your information
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We use personal data for the following purposes and no
                others:
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li><strong className="font-semibold text-[#546A7E]">To respond to your enquiry.</strong> Reading what you sent, replying to you, and arranging a call if that&apos;s the sensible next step.</li>
                <li><strong className="font-semibold text-[#546A7E]">To manage a business relationship.</strong> If we start working together, to deliver the work, communicate about it, and handle contracts and invoicing.</li>
                <li><strong className="font-semibold text-[#546A7E]">To keep our own records.</strong> Maintaining an accurate record of who contacted us and about what, so that a colleague can pick up a conversation and so we don&apos;t ask you the same question twice.</li>
                <li><strong className="font-semibold text-[#546A7E]">To improve this website.</strong> Understanding in aggregate which pages are useful and where people give up.</li>
                <li><strong className="font-semibold text-[#546A7E]">To meet legal and regulatory obligations.</strong> Including accounting, tax and, where relevant, responding to lawful requests.</li>
                <li><strong className="font-semibold text-[#546A7E]">To consider job applications.</strong> See section 11.</li>
              </ul>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                <strong className="font-semibold text-[#0f172b]">
                  We do not use your data for automated decision-making
                  that produces legal or similarly significant effects,
                  and we do not carry out profiling of website visitors.
                </strong>
              </p>
            </section>

            <section id="basis" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                4. Our legal basis for using it
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Under the GDPR we must have a lawful basis for each
                purpose. Ours are:
              </p>
              <DataTable
                headers={["Purpose", "Lawful basis"]}
                rows={[
                  {
                    a: "Replying to your contact form enquiry",
                    b: <>Your <strong className="font-semibold text-[#0f172b]">consent</strong>, given when you tick the box on the form.</>,
                  },
                  {
                    a: "Managing a live client relationship",
                    b: <><strong className="font-semibold text-[#0f172b]">Performance of a contract</strong>, or steps taken at your request before entering into one.</>,
                  },
                  {
                    a: "Keeping business records and improving our website",
                    b: <>Our <strong className="font-semibold text-[#0f172b]">legitimate interests</strong> in running and improving the business, balanced against your rights.</>,
                  },
                  {
                    a: "Accounting, tax and regulatory records",
                    b: <strong className="font-semibold text-[#0f172b]">Legal obligation</strong>,
                  },
                  {
                    a: "Analytics and non-essential cookies",
                    b: <>Your <strong className="font-semibold text-[#0f172b]">consent</strong>, given through the cookie banner.</>,
                  },
                  {
                    a: "Assessing a job application",
                    b: <>Steps taken at your request prior to a contract, and our <strong className="font-semibold text-[#0f172b]">legitimate interests</strong> in recruiting.</>,
                  },
                ]}
              />
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Where we rely on legitimate interests, we have considered
                whether those interests are overridden by your rights and
                freedoms. You can ask us for details of that assessment,
                and you have the right to object — see section 9.
              </p>
            </section>

            <section id="share" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                5. Who we share it with
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                <strong className="font-semibold text-[#0f172b]">
                  We do not sell personal data. We do not rent it, and we
                  do not share it for anyone else&apos;s marketing
                  purposes.
                </strong>
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We share personal data only with:
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li><strong className="font-semibold text-[#0f172b]">Our own team.</strong> Colleagues across our Ireland, United Kingdom and India offices who need it to respond to you or deliver work.</li>
                <li><strong className="font-semibold text-[#0f172b]">Service providers who process data on our behalf.</strong> These include our website hosting, content management, email, customer relationship and analytics providers. Each is bound by a written agreement requiring them to process data only on our instructions and to keep it secure.</li>
                <li><strong className="font-semibold text-[#0f172b]">Professional advisers.</strong> Accountants, auditors and lawyers, where genuinely necessary.</li>
                <li><strong className="font-semibold text-[#0f172b]">Authorities.</strong> Where we are legally required to disclose information.</li>
                <li><strong className="font-semibold text-[#0f172b]">A purchaser.</strong> If our business or part of it is sold or reorganised, in which case the recipient is bound by this policy.</li>
              </ul>
            </section>

            <section id="transfer" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                6. International transfers
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We operate from Ireland, the United Kingdom and India, so
                personal data may be accessed by colleagues in any of
                those locations. Some of our service providers are also
                located outside the European Economic Area.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Where personal data is transferred outside the EEA or the
                UK, we make sure an appropriate safeguard is in place. In
                practice this means either the destination country has an
                adequacy decision, or the transfer is covered by{" "}
                <strong className="font-semibold text-[#0f172b]">
                  Standard Contractual Clauses
                </strong>{" "}
                approved by the European Commission (and the UK
                International Data Transfer Addendum where the UK GDPR
                applies), together with any additional measures the
                circumstances require.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Transfers to our Indian entity are covered by intra-group
                data transfer arrangements incorporating those clauses.
                You can request a copy of the relevant safeguards by
                emailing{" "}
                <a href="mailto:privacy@oxytal.com" className="text-[#0E9BC4]">
                  privacy@oxytal.com
                </a>
                .
              </p>
            </section>

            <section id="keep" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                7. How long we keep it
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We keep personal data only as long as we need it for the
                purpose it was collected, or as long as the law requires.
              </p>
              <DataTable
                headers={["Data", "Retention"]}
                rows={[
                  { a: "Enquiry that doesn't progress", b: "[24] months from your last contact with us, then deleted" },
                  { a: "Client relationship records", b: "For the duration of the relationship and [7] years afterwards, for contractual and tax purposes" },
                  { a: "Contracts and financial records", b: "[7] years, as required by Irish and UK company and tax law" },
                  { a: "Unsuccessful job applications", b: "[12] months, unless you ask us to keep them longer for future roles" },
                  { a: "Website analytics", b: "[14] months in aggregated form" },
                ]}
              />
            </section>

            <section id="secure" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                8. How we protect it
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We take security seriously — it&apos;s part of what
                we&apos;re hired to build for other people.
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li>Data is encrypted in transit using TLS, and encrypted at rest in our systems</li>
                <li>Access is limited to colleagues who need it for their role, and controlled by individual accounts with multi-factor authentication</li>
                <li>Our systems are patched and monitored, and access is logged</li>
                <li>Our team receives data protection training, and confidentiality obligations are in every employment and contractor agreement</li>
                <li>We maintain procedures for identifying, containing and reporting personal data breaches</li>
              </ul>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                If a breach occurs that is likely to result in a risk to
                your rights and freedoms, we will notify the relevant
                supervisory authority within 72 hours of becoming aware of
                it, and notify you directly where the risk is high.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                No system is perfectly secure, and we won&apos;t pretend
                otherwise. What we can commit to is that we take
                reasonable and appropriate measures, and that we&apos;ll
                tell you promptly if something goes wrong.
              </p>
            </section>

            <section id="rights" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                9. Your rights
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                If you are in the EEA or the UK, you have the following
                rights over your personal data. These are free to
                exercise, and using them will never disadvantage you.
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li><strong className="font-semibold text-[#0f172b]">Access.</strong> Ask for a copy of the personal data we hold about you.</li>
                <li><strong className="font-semibold text-[#0f172b]">Rectification.</strong> Ask us to correct anything inaccurate or incomplete.</li>
                <li><strong className="font-semibold text-[#0f172b]">Erasure.</strong> Ask us to delete your data where there&apos;s no good reason for us to keep it.</li>
                <li><strong className="font-semibold text-[#0f172b]">Restriction.</strong> Ask us to pause using your data while a concern is resolved.</li>
                <li><strong className="font-semibold text-[#0f172b]">Portability.</strong> Ask for the data you gave us in a structured, machine-readable format.</li>
                <li><strong className="font-semibold text-[#0f172b]">Objection.</strong> Object to processing based on our legitimate interests, and to direct marketing at any time.</li>
                <li><strong className="font-semibold text-[#0f172b]">Withdraw consent.</strong> Where we rely on consent, withdraw it at any time. This doesn&apos;t affect anything done before you withdrew it.</li>
              </ul>
              <div className="my-5 rounded-r-xl border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] p-5 md:p-6">
                <p className="text-[14.5px] leading-[1.7] text-[#546A7E]">
                  <strong className="font-semibold">How to exercise them.</strong>{" "}
                  Email{" "}
                  <a href="mailto:privacy@oxytal.com" className="text-[#0E9BC4]">
                    privacy@oxytal.com
                  </a>{" "}
                  and tell us what you&apos;d like. We&apos;ll respond
                  within{" "}
                  <strong className="font-semibold">one month</strong>. We
                  may ask you to confirm your identity first — only so we
                  don&apos;t disclose your data to somebody else.
                </p>
              </div>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If you are in India, you have comparable rights under the
                Digital Personal Data Protection Act 2023, including
                access, correction, erasure and grievance redressal. The
                same email address reaches us.
              </p>
            </section>

            <section id="cookies" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                10. Cookies and similar technologies
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Cookies are small files stored on your device. We use them
                for two purposes.
              </p>
              <span className="mt-6 mb-2.5 text-[16px] font-semibold text-[#546A7E] block">
                Strictly necessary cookies
              </span>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                These make the website work — remembering your cookie
                choices, keeping the site secure, and balancing traffic.
                They can&apos;t be switched off and don&apos;t require
                your consent.
              </p>
              <span className="mt-6 mb-2.5 text-[16px] font-semibold text-[#546A7E] block">
                Analytics cookies
              </span>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                These help us understand which pages are useful and where
                people leave. They are only set{" "}
                <strong className="font-semibold text-[#0f172b]">
                  after you consent
                </strong>{" "}
                through the cookie banner. If you decline, they are not
                set.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                You can change your choice at any time using the{" "}
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="cursor-pointer text-[#0E9BC4] underline underline-offset-2"
                >
                  Cookie Settings
                </button>{" "}
                link in the footer, or by clearing cookies in your
                browser. Most browsers also let you block cookies
                entirely, though parts of the site may then not work as
                intended.
              </p>
            </section>

            <section id="candidates" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                11. If you apply for a job
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Applications are handled through our candidate portal at{" "}
                <a
                  href="https://career.oxyem.io/"
                  target="_blank"
                  rel="noopener"
                  className="text-[#0E9BC4]"
                >
                  career.oxyem.io
                </a>
                . When you register and apply we collect your name,
                contact details, CV, work history, and anything else you
                choose to provide, along with notes and assessments made
                during the process.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We use this only to assess your application, communicate
                with you about it, and meet our obligations as an
                employer. It is shared only with the colleagues involved
                in hiring for that role.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If your application is unsuccessful we keep your details
                for [12] months in case a suitable role opens, unless you
                ask us to delete them sooner. You can ask us to do that at
                any time by emailing{" "}
                <a href="mailto:careers@oxytal.com" className="text-[#0E9BC4]">
                  careers@oxytal.com
                </a>
                .
              </p>
            </section>

            <section id="clients" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                12. Data we handle for clients
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                When we deliver projects, we sometimes process personal
                data that belongs to our clients — for example during a
                data migration, or while supporting a system that holds
                customer records.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                In those situations the client is the{" "}
                <strong className="font-semibold text-[#0f172b]">
                  data controller
                </strong>{" "}
                and Oxytal acts as a{" "}
                <strong className="font-semibold text-[#0f172b]">
                  data processor
                </strong>
                . We process that data only on the client&apos;s
                documented instructions, under a written data processing
                agreement that sets out the subject matter, duration,
                purpose, security measures and the obligations of both
                parties.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If your data has been processed by us on behalf of one of
                our clients, please contact that organisation directly —
                they control it and are best placed to answer. If
                you&apos;re not sure who to ask, email us and we&apos;ll
                help you find out.
              </p>
            </section>

            <section id="children" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                13. Children
              </h2>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                This website is intended for business audiences and is not
                directed at children. We do not knowingly collect personal
                data from anyone under 16. If you believe a child has
                provided us with personal data, contact us and we will
                delete it.
              </p>
            </section>

            <section id="changes" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                14. Changes to this policy
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We may update this policy as our business, the technology
                or the law changes. The version and dates at the top of
                this page always show when it was last revised.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If we make a change that materially affects how we use
                your data, we will take reasonable steps to tell you — and
                where the law requires it, we will ask for your consent
                again rather than assuming it.
              </p>
            </section>

            <section id="contact">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                15. Contact and complaints
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                For any question about this policy or about how we handle
                your data:
              </p>
              <InfoBlock
                rows={[
                  {
                    label: "Email",
                    value: (
                      <a href="mailto:dpo@oxytal.com" className="text-[#0E9BC4]">
                        dpo@oxytal.com
                      </a>
                    ),
                  },
                  {
                    label: "Post",
                    value: "Data Protection, Oxytal Limited, Ballydeague, Ballyhooly, Co Cork, Ireland",
                  },
                  { label: "Response", value: "Within one month of your request" },
                ]}
              />
            </section>
          </article>
        </div>
      </div>
      </div>
    </>
  );
}
