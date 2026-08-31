"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";
import type { HeadingLevel } from "@/app/lib/headingLevel";
import DynamicHeading from "@/app/ui/DynamicHeading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `KaneffCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/oxytal-case-study-kaneff-sharepoint.html`. Same
 * treatment as its siblings in this folder
 * (`DiageoBrandPromoterCaseStudy`/`TaffersCaseStudy`): no Contentful
 * wiring, keeps the reference's own colour identity (`--ink` `#0B1B2B`,
 * `--accent` `#2C87CC`, `--accent-2` `#7FC4F3`, the `--deep-1`/
 * `--deep-2` navy gradient) rather than the site's per-page `themeColor`
 * accent, and typography stays the site's own inherited `Poppins`.
 * Every heading size, lede size, and section container width (`max-w-*`)
 * matches its two siblings exactly (12px eyebrows, `clamp(28px,3.2vw,
 * 40px)`/`leading-[1.2]` h2s, 16px/1.8 ledes, `max-w-7xl` for the wide
 * sections, `max-w-5xl` for the narrow prose ones, `max-w-6xl` for "what
 * we built") — this case study reuses the same scale rather than the
 * numbers baked into its own reference stylesheet, per this file's own
 * "same size as the others" brief.
 *
 * Two things this reference has that its siblings don't:
 * - "What we built"'s 3 rows illustrate with hand-drawn inline SVG
 *   diagrams (reading → sorting → governing) instead of photography —
 *   ported as literal `<svg>` markup (camelCased attributes), same
 *   diagrams, not photos invented to replace them.
 * - A "before / after" comparison section (two bordered columns, a
 *   centered arrow, ×/✓ markers) that neither `DiageoBrandPromoterCaseStudy`
 *   nor `TaffersCaseStudy` has — built fresh here as `BeforeAfterSection`.
 *
 * Like `TaffersCaseStudy`, the reference's own stylesheet has no
 * `:nth-of-type(even)` flip rule for `.built`, so `BuiltRow` doesn't take
 * a `flip` option — all three rows keep text-left/diagram-right.
 *
 * Registered in `ComposableElementRenderer` as subtype
 * `kaneffSharepoint`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every
 * section `<h2>` gets the word-split reveal via `SectionHead`; the
 * hero's own `<h1>` plays on mount instead of on scroll; single-block
 * intros fade up as one unit; card/row grids stagger in per item; each
 * built row's text/diagram fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from
   Refrence/oxytal-case-study-kaneff-sharepoint.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Kaneff Group" },
  { k: "Sector", v: "Real estate & property management" },
  { k: "Services", v: "Cloud & Transformation · AI Engineering" },
  { k: "Volume", v: "7 TB+ of documents" },
  { k: "Outcome", v: "Delivered on time, nothing lost" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "7 TB+", l: "Documents migrated to SharePoint Online" },
  { v: "100%", l: "Searchable, including scanned drawings and PDFs" },
  { v: "20%", l: "Less storage used than before the move" },
  { v: "15–20%", l: "Duplicate files identified and removed" },
  { v: "Zero", l: "Documents lost, across every phase" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Nobody could tell us what was in it",
    text: "There was no inventory. You can't plan a migration against an unknown estate, and you certainly can't promise nothing will be lost. Everything downstream depended on understanding the 7 TB first — which is work most migrations skip.",
  },
  {
    n: "02",
    title: "A large share of it couldn't be read by software",
    text: "Scanned drawings, signed contracts and photographed documents are images as far as a computer is concerned. Moving them to a modern platform changes nothing — they arrive just as invisible as they left.",
  },
  {
    n: "03",
    title: "The business couldn't pause",
    text: "Property management runs on those documents every working day. There was no window in which the estate could be frozen, so people had to keep working while it moved beneath them.",
  },
];

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  diagram: "reading" | "sorting" | "governing";
  diagramLabel: string;
}[] = [
  {
    n: "01 · Reading",
    title: "Making the unreadable searchable",
    desc: "Text recognition ran across every scanned file, turning images of documents back into text a search can reach. That single step is why a drawing filed in 2009 can now be found by typing the property name.",
    bullets: [
      "Scanned PDFs, drawings and photographed documents processed",
      "Full-text search across the entire estate, not just recent files",
      "Low-confidence results routed to a person rather than guessed",
    ],
    diagram: "reading",
    diagramLabel: "A scanned document being read and turned into searchable text.",
  },
  {
    n: "02 · Sorting",
    title: "Every document to the department that owns it",
    desc: "The engine classified each file by type and by owning department, then applied consistent naming at a scale no manual process could reach. SharePoint sites were designed around how Kaneff's departments actually work, not around a generic template.",
    bullets: [
      "Department-specific sites, structured to match real workflows",
      "Consistent naming applied automatically across the whole estate",
      "Labels and properties applied as files landed, not added afterwards",
      "Access limited to the departments that should hold each document",
    ],
    diagram: "sorting",
    diagramLabel: "Mixed documents sorted into department-specific SharePoint sites.",
  },
  {
    n: "03 · Governing",
    title: "Rules that enforce themselves",
    desc: "Retention rules and archival workflows were applied as part of the move, so the platform stays clean without depending on anyone remembering. An audit trail is generated as a by-product of normal use rather than assembled when someone asks.",
    bullets: [
      "Retention applied automatically by document type",
      "Archival workflows that run without manual intervention",
      "A record of what exists, who changed it and when",
      "Storage that scales without buying hardware",
    ],
    diagram: "governing",
    diagramLabel: "Retention rules applied automatically, with an audit record generated.",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "Understand, then decide",
    text: "Duplicates were identified by reading the documents, not by comparing file names — the same lease saved four ways has four different names.",
  },
  {
    title: "Nothing deleted silently",
    text: "Every removal appeared in the validation report for that phase, with the retained version named. Kaneff signed off before the next phase began.",
  },
  {
    title: "One authoritative version",
    text: "The confusion wasn't only cost. When four versions of a contract exist, someone eventually acts on the wrong one. That risk left with the duplicates.",
  },
  {
    title: "Paid for itself",
    text: "Around a fifth of the storage bill, permanently removed — on an estate that had been growing every year with no plan to stop.",
  },
];

const BEFORE_ITEMS: string[] = [
  "No naming standards or structure across departments",
  "Duplicates everywhere, with no authoritative version",
  "Scanned drawings and contracts invisible to search",
  "No retention rules and no record of changes",
  "On-premise storage costs climbing every year",
  "Documents siloed on servers, hard to reach remotely",
];

const AFTER_ITEMS: string[] = [
  "One filing structure, aligned to how each department works",
  "Duplicates removed before migration, one version retained",
  "Every document searchable, scanned files included",
  "Retention applied automatically, audit record generated",
  "A fifth less storage, and no hardware ceiling ahead",
  "Available wherever people work, with access controlled",
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "Phase 01",
    title: "Discovery and file analysis",
    text: "We analysed real files from multiple departments to map what document types existed, how they were named, what had to be kept and for how long, and where the compliance exposure sat across the full estate.",
  },
  {
    n: "Phase 02",
    title: "Design and engine build",
    text: "A target SharePoint structure designed around department workflows, and a classification engine built specifically for Kaneff's document types rather than adapted from a generic tool.",
  },
  {
    n: "Phase 03",
    title: "Migration, one department at a time",
    text: "Files read, classified, renamed, deduplicated and given their retention rule automatically — with a validation report after each department showing exactly what moved, what was removed and what needed a decision.",
  },
  {
    n: "Phase 04",
    title: "Governance and handover",
    text: "Retention and archival workflows switched on, audit record established, and the team trained to run it themselves. Documentation written as we went rather than assembled at the end.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Platform", items: ["SharePoint Online", "Microsoft 365", "Power Automate", "Secure cloud execution"] },
  {
    title: "Intelligence",
    items: ["Custom classification engine", "Text recognition for scans", "Duplicate detection", "Automated naming"],
  },
  { title: "Governance", items: ["Retention rules by type", "Archival workflows", "Access control", "Audit reporting"] },
  {
    title: "Assurance",
    items: ["Per-phase validation reports", "Parallel running", "Sign-off between phases", "Handover documentation"],
  },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/diageo-brand-promoter",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/brandpromotor.webp",
    alt: "Diageo Brand Promoter training platform",
    k: "Diageo · Compliance",
    title: "Brand Promoter Standard",
    text: "Conduct and safeguarding training in 17 languages, live since 2022.",
  },
  {
    href: "/case-studies/aviation-gin",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/aviationgin.webp",
    alt: "Aviation American Gin website",
    k: "Diageo · Brand",
    title: "Aviation American Gin",
    text: "Consent-aware sign-up flowing into Klaviyo and Salesforce.",
  },
  {
    href: "/case-studies/skolrup",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/skolrup.webp",
    alt: "Skolrup platform",
    k: "Education",
    title: "Skolrup",
    text: "A product of our own, built and operated by Oxytal.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#2C87CC" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color }}>
      <span aria-hidden className="h-0.5 w-[22px] rounded-sm" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  eyebrowColor,
  title,
  lede,
  dark,
  narrow = true,
  headingLevel = "h2",
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  lede?: ReactNode;
  dark?: boolean;
  narrow?: boolean;
  /** Which heading tag to render — `h1`–`h6` (see app/lib/headingLevel.ts). Defaults to `h2`, this component's original fixed level, so every existing call site renders unchanged. */
  headingLevel?: HeadingLevel;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={narrow ? "max-w-[620px]" : undefined}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-[20ch] text-[clamp(28px,3.2vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#0B1B2B]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A9BACE]" : "text-[#546A7E]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#2C87CC" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* =========================================================
   BREADCRUMB
========================================================= */

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="bg-[#061223] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.09em] text-[#6E8398] uppercase">
          <li>
            <Link href="/" className="text-[#9DB2C4] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9DB2C4] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Kaneff Group</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLParagraphElement>(null);
  const standRef = useRef<HTMLParagraphElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);

  // Hero's own `<h1>` plays on mount rather than on scroll — it's
  // already in view the instant the page loads, same as every sibling
  // case study's own hero.
  useLayoutEffect(() => {
    if (!titleRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(titleRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(titleRef.current!, {
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
            stagger: 0.05,
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const targets = [clientRef.current, standRef.current, factsRef.current, visitRef.current, shotRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(clientRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(standRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.5)
        .from(factsRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(visitRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.7)
        .from(shotRef.current, { opacity: 0, y: 24, duration: 0.7 }, 0.8);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#061223] to-[#0C2138] pt-12 text-[#EAF2F8] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(44,135,204,.28), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-mono text-[12px] tracking-[0.18em] text-[#7FC4F3] uppercase">
          Case study · Kaneff Group
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[19ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Moving seven terabytes was the easy part.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A9BACE]">
          Kaneff Group held more than 7 TB of documents across on-premise servers — no naming standards, large
          volumes of duplicates, and thousands of scanned drawings and PDFs that no search could reach. Any
          supplier could have copied it all to the cloud. We read it first, then decided what deserved to move.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#061223] px-5 py-4.5">
              <dt className="mb-1.5 font-mono text-[11px] tracking-[0.12em] text-[#7690A6] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#EAF2F8]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://kaneff.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#7FC4F3] hover:bg-[#7FC4F3]/10 sm:mb-12"
        >
          About Kaneff Group
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>

        <div
          ref={shotRef}
          className="overflow-hidden rounded-t-[20px] border border-b-0 border-white/12 shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.6)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src="https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp"
            alt="Kaneff Group document platform on SharePoint Online after migration"
            width={1600}
            height={900}
            className="block w-full"
          />
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   OUTCOMES
========================================================= */

function OutcomesSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E2EAF3] bg-[#E2EAF3] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#2C87CC]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#546A7E]">{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE CHALLENGE
========================================================= */

function ChallengeSection() {
  const bodyRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="Twenty years of documents, and no map." headingLevel="h2" narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0B1B2B]">
          Kaneff Group runs real estate and property management. Leases, drawings, contracts, inspections,
          correspondence — the business runs on paperwork, and two decades of it had accumulated across
          on-premise servers, department by department, with nobody responsible for the whole.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546A7E]">
          There were no naming standards, so the same lease might be filed four different ways. Duplicates had
          multiplied to the point where nobody could say which version was authoritative. Thousands of scanned
          drawings and PDFs held no readable text at all, so no search would ever find them — people rebuilt work
          that already existed because finding it took longer.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546A7E]">
          Behind that sat two quieter problems. Storage costs were rising every year with no plan to change it.
          And with no retention rules and no record of who changed what, the organisation couldn&apos;t have
          evidenced its position if anyone had asked.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#2C87CC] bg-[#E6F2FB] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0B1B2B]">
            The obvious project was to copy it all into the cloud. That would have relocated the problem, added a
            monthly bill, and spent the only budget anyone was ever going to get for fixing it.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHY IT WAS HARD
========================================================= */

function WhyItWasHardSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-gradient-to-b from-[#F0F6FD] to-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three things made this more than a file move."
            headingLevel="h2"
            lede="Each one would have derailed the programme if it had been treated as a detail to sort out later."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E2EAF3] bg-[#E2EAF3] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-mono text-[12px] tracking-[0.1em] text-[#2C87CC]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0B1B2B] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#546A7E]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE BUILT — diagrams
========================================================= */

function ReadingDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="A scanned document being read and turned into searchable text.">
      <rect x="24" y="40" width="180" height="220" rx="10" fill="#F1F5FA" stroke="#E2EAF3" />
      <g fill="#C6D3E0">
        <rect x="46" y="66" width="136" height="8" rx="4" />
        <rect x="46" y="84" width="112" height="8" rx="4" />
        <rect x="46" y="102" width="128" height="8" rx="4" />
        <rect x="46" y="128" width="136" height="60" rx="6" />
        <rect x="46" y="202" width="96" height="8" rx="4" />
        <rect x="46" y="220" width="120" height="8" rx="4" />
      </g>
      <text x="114" y="30" fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="11" textAnchor="middle">
        SCANNED IMAGE
      </text>
      <path d="M224 150h64" stroke="#2C87CC" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M282 144l8 6-8 6" fill="none" stroke="#2C87CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="256" cy="112" r="18" fill="#E6F2FB" stroke="#2C87CC" />
      <path d="M250 112l4 4 8-9" fill="none" stroke="#2C87CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="308" y="40" width="188" height="220" rx="10" fill="#fff" stroke="#2C87CC" />
      <g fill="#2C87CC" opacity=".85">
        <rect x="330" y="66" width="120" height="8" rx="4" />
        <rect x="330" y="84" width="144" height="8" rx="4" />
        <rect x="330" y="102" width="98" height="8" rx="4" />
      </g>
      <g fill="#A9BACE">
        <rect x="330" y="128" width="144" height="8" rx="4" />
        <rect x="330" y="146" width="120" height="8" rx="4" />
        <rect x="330" y="164" width="136" height="8" rx="4" />
        <rect x="330" y="182" width="88" height="8" rx="4" />
      </g>
      <rect x="330" y="212" width="144" height="30" rx="8" fill="#E6F2FB" stroke="#2C87CC" />
      <text x="402" y="231" fill="#2C87CC" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        SEARCHABLE
      </text>
      <text x="402" y="30" fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="11" textAnchor="middle">
        TEXT EXTRACTED
      </text>
    </svg>
  );
}

function SortingDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Mixed documents sorted into department-specific SharePoint sites.">
      <g fill="#E2EAF3" stroke="#CBD8E6">
        <rect x="20" y="60" width="52" height="34" rx="6" />
        <rect x="20" y="104" width="52" height="34" rx="6" />
        <rect x="20" y="148" width="52" height="34" rx="6" />
        <rect x="20" y="192" width="52" height="34" rx="6" />
      </g>
      <text x="46" y="46" fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        MIXED
      </text>
      <rect x="196" y="112" width="120" height="66" rx="14" fill="#2C87CC" />
      <text x="256" y="141" fill="#fff" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="600" textAnchor="middle">
        Classification
      </text>
      <text x="256" y="159" fill="#CDE6F8" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        type · department
      </text>
      <g stroke="#2C87CC" strokeWidth="1.8" fill="none" opacity=".55">
        <path d="M76 77h60c22 0 30 12 30 30v8" />
        <path d="M76 121h90" />
        <path d="M76 165h90" />
        <path d="M76 209h60c22 0 30-12 30-30v-8" />
      </g>
      <g stroke="#2C87CC" strokeWidth="1.8" fill="none" opacity=".55">
        <path d="M316 132h44c20 0 26-10 26-26V78" />
        <path d="M316 145h72" />
        <path d="M316 158h44c20 0 26 10 26 26v26" />
      </g>
      <g fill="#fff" stroke="#2C87CC">
        <rect x="386" y="46" width="114" height="52" rx="10" />
        <rect x="386" y="119" width="114" height="52" rx="10" />
        <rect x="386" y="192" width="114" height="52" rx="10" />
      </g>
      <g fill="#2C87CC" fontFamily="IBM Plex Sans, sans-serif" fontSize="11" fontWeight="600" textAnchor="middle">
        <text x="443" y="70">Leases</text>
        <text x="443" y="143">Drawings</text>
        <text x="443" y="216">Inspections</text>
      </g>
      <g fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        <text x="443" y="85">department site</text>
        <text x="443" y="158">department site</text>
        <text x="443" y="231">department site</text>
      </g>
    </svg>
  );
}

function GoverningDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Retention rules applied automatically, with an audit record generated.">
      <rect x="40" y="52" width="200" height="196" rx="14" fill="#F1F5FA" stroke="#E2EAF3" />
      <text x="140" y="38" fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        DOCUMENT TYPES
      </text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11" fill="#546A7E">
        <rect x="60" y="72" width="160" height="34" rx="8" fill="#fff" stroke="#E2EAF3" />
        <text x="76" y="93">Lease</text>
        <text x="204" y="93" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#2C87CC">10 yrs</text>
        <rect x="60" y="114" width="160" height="34" rx="8" fill="#fff" stroke="#E2EAF3" />
        <text x="76" y="135">Drawing</text>
        <text x="204" y="135" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#2C87CC">permanent</text>
        <rect x="60" y="156" width="160" height="34" rx="8" fill="#fff" stroke="#E2EAF3" />
        <text x="76" y="177">Inspection</text>
        <text x="204" y="177" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#2C87CC">7 yrs</text>
        <rect x="60" y="198" width="160" height="34" rx="8" fill="#fff" stroke="#E2EAF3" />
        <text x="76" y="219">Correspondence</text>
        <text x="204" y="219" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#2C87CC">3 yrs</text>
      </g>
      <path d="M252 150h44" stroke="#2C87CC" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M290 144l8 6-8 6" fill="none" stroke="#2C87CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="312" y="52" width="176" height="196" rx="14" fill="#fff" stroke="#2C87CC" />
      <text x="400" y="38" fill="#8598AA" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        APPLIED AUTOMATICALLY
      </text>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#546A7E">
        <text x="334" y="88">14:02 · rule applied</text>
        <text x="334" y="114">14:02 · archived</text>
        <text x="334" y="140">14:03 · rule applied</text>
        <text x="334" y="166">14:03 · retained</text>
        <text x="334" y="192">14:04 · rule applied</text>
      </g>
      <rect x="334" y="206" width="132" height="28" rx="8" fill="#E6F2FB" stroke="#2C87CC" />
      <text x="400" y="224" fill="#2C87CC" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
        AUDIT RECORD
      </text>
    </svg>
  );
}

const DIAGRAMS = {
  reading: ReadingDiagram,
  sorting: SortingDiagram,
  governing: GoverningDiagram,
} as const;

/* =========================================================
   WHAT WE BUILT
========================================================= */

function WhatWeBuiltSection() {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="A classification engine made for Kaneff's documents."
            headingLevel="h2"
            lede="Not an off-the-shelf migration tool. We built software that understood what a Kaneff lease, drawing or inspection report looks like — because generic classification on twenty years of specific paperwork produces confident nonsense."
            narrow={false}
          />
        </div>

        <div className="mt-10 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          {BUILT_ROWS.map((row) => (
            <BuiltRow key={row.n} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltRow({ row }: { row: (typeof BUILT_ROWS)[number] }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();
  const Diagram = DIAGRAMS[row.diagram];

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-mono text-[12px] tracking-[0.11em] text-[#2C87CC]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0B1B2B] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#546A7E]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#546A7E]",
                index > 0 && "border-t border-[#F1F5FA]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div
        ref={mediaRef}
        className="rounded-[18px] border border-[#E2EAF3] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(11,27,43,0.2)] sm:p-7"
      >
        <Diagram />
      </div>
    </div>
  );
}

/* =========================================================
   THE DETAIL THAT MATTERED
========================================================= */

function DetailThatMatteredSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1826] to-[#12293F] px-5 py-14 text-[#EAF2F8] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(44,135,204,.3), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead eyebrow="The detail that mattered" eyebrowColor="#7FC4F3" headingLevel="h3" title="We deleted before we moved." dark />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A9BACE]">
            Almost every migration copies everything first and promises to tidy up afterwards. It never happens —
            once the business is running on the new platform, nobody gets budget to go back and sort out files
            that appear to be working fine.{" "}
            <strong className="font-semibold text-white">So you pay to store two decades of duplicates, forever.</strong>
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A9BACE]">
            We found and removed the duplicates before anything moved. That is harder. It requires understanding
            the estate first, agreeing what counts as authoritative, and taking responsibility for a decision to
            delete. It&apos;s also the entire reason Kaneff&apos;s storage went{" "}
            <strong className="font-semibold text-white">down</strong> by a fifth after a migration, rather than
            up.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#0A1826] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9DB2C4]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   BEFORE / AFTER
========================================================= */

function BeforeAfterSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="What changed" title="The same documents. A different organisation."  headingLevel="h3" narrow={false} />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 items-stretch gap-4 sm:gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8"
        >
          <div className="rounded-2xl border border-[#E2EAF3] bg-white p-6.5">
            <span className="mb-4 font-mono text-[10px] font-medium tracking-[0.13em] text-[#D6412F] uppercase block">
              Before
            </span>
            <ul className="list-none">
              {BEFORE_ITEMS.map((item, index) => (
                <li
                  key={item}
                  className={cx(
                    "flex gap-3 py-2.5 text-[14.5px] leading-[1.55] text-[#546A7E]",
                    index > 0 && "border-t border-[#F1F5FA]"
                  )}
                >
                  <span aria-hidden className="mt-0.5 font-mono text-[14.5px] text-[#D6412F]">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden className="grid place-items-center py-2 text-[#2C87CC] lg:rotate-0">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 lg:rotate-0">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>

          <div className="rounded-2xl border border-[#E2EAF3] bg-white p-6.5">
            <span className="mb-4 font-mono text-[10px] font-medium tracking-[0.13em] text-[#12A67C] uppercase block">
              After
            </span>
            <ul className="list-none">
              {AFTER_ITEMS.map((item, index) => (
                <li
                  key={item}
                  className={cx(
                    "flex gap-3 py-2.5 text-[14.5px] leading-[1.55] text-[#546A7E]",
                    index > 0 && "border-t border-[#F1F5FA]"
                  )}
                >
                  <span aria-hidden className="mt-0.5 font-mono text-[14.5px] text-[#12A67C]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW WE WORKED
========================================================= */

function HowWeWorkedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-gradient-to-b from-[#F0F6FD] to-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Department by department, proven each time."
            headingLevel="h3"
            lede="No single cutover, no batch move run overnight and hoped for. Each phase was verified before the next one started, and the old environment stayed available throughout."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E2EAF3] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[76px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E2EAF3]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#2C87CC]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0B1B2B] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#546A7E]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HANDOVER
========================================================= */

function HandoverSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#061223] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(44,135,204,.26), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#7FC4F3"
              headingLevel="h4"
              title="The best outcome was that they didn't need us afterwards."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A9BACE]">
              Kaneff runs the platform independently. The rules apply themselves, the structure holds because it
              matches how the departments actually work, and adding a new document type doesn&apos;t require a
              phone call to us.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A9BACE]">
              We&apos;d rather say that plainly than imply an ongoing dependency. A migration that leaves the
              client needing the supplier to keep it tidy hasn&apos;t finished — it has just moved the problem
              into a support contract.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#7FC4F3]">
              {"Handed over\nclean"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9DB2C4]">
              Structure, rules, documentation and training delivered with the platform. Available if they want us,
              not required.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECHNOLOGY
========================================================= */

function TechnologySection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("x", 16);

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Conventional platform, custom intelligence."
            headingLevel="h4"
            lede="The destination was deliberately mainstream — Kaneff's team already knew Microsoft, and a document platform has to be maintainable for a decade. The custom work went where it earned its place: understanding the documents."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-mono text-[16px] font-medium tracking-[0.12em] text-[#2C87CC] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#546A7E]", index > 0 && "border-t border-[#F1F5FA]")}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   RELATED
========================================================= */

function RelatedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E2EAF3] bg-white hover:-translate-y-1 hover:border-[#BCD8EE] hover:shadow-[0_20px_44px_-20px_rgba(11,27,43,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} width={800} height={500} loading="lazy" className="aspect-16/10 block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-mono text-[12px] tracking-[0.11em] text-[#8598AA] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0B1B2B] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#546A7E]">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function KaneffCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#FBFDFE]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection />
      <div data-nav-contrast="dark">
        <DetailThatMatteredSection />
      </div>
      <BeforeAfterSection />
      <HowWeWorkedSection />
        <HandoverSection />
      <TechnologySection />
      <RelatedSection />
    </div>
  );
}
