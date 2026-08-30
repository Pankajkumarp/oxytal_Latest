"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `DiageoBrandPromoterCaseStudy` — a standalone, static case-study
 * one-pager ported from
 * `Refrence/oxytal-case-study-diageo-brand-promoter.html`. Same treatment
 * as its siblings in this folder (`SamVaultCaseStudy`/
 * `ActionPulseCaseStudy`/`ForgePipelineCaseStudy`/`KollabryCaseStudy`): no
 * Contentful wiring, keeps the reference's own colour identity (`--ink`
 * `#0B1B2B`, `--accent` `#0E9BC4`, `--amber` `#E08A2C`, the `--deep-1`/
 * `--deep-2` navy gradient) rather than the site's per-page `themeColor`
 * accent, and typography stays the site's own inherited `Poppins`
 * instead of the reference's Google Fonts (`Bricolage Grotesque`/`IBM
 * Plex Sans`/`IBM Plex Mono`) — tracking/size/weight/uppercase alone
 * carry the reference's own mono/display feel. Unlike Kollabry/Forge
 * Pipeline, the reference's own screenshots are real, already-hosted
 * photography (Oxytal's S3 bucket), so they're plain `<img>` tags
 * pointing at the same URLs rather than `ShotPlaceholder` cards.
 *
 * Registered in `ComposableElementRenderer` as subtype
 * `diageoBrandPromoter`, same as its siblings.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings. Every section `<h2>` gets the
 * word-split reveal; the hero's own `<h1>` plays on mount instead of on
 * scroll (same as every sibling's hero); single-block content (the
 * challenge copy, the "why it was hard" intro, the still-running panel,
 * the technology intro) fades up as one unit via `useFadeUp`, mirroring
 * how the reference tags each of those with its own `.reveal`; card/row
 * grids where the reference tags every item individually (the outcomes
 * strip, the "why it was hard" cards, the "detail that mattered" cards,
 * the phases list, the related cards) stagger in via `useListStagger`.
 * The built/dive rows (like Kollabry's) fade up as two independent
 * halves per row rather than one shared reveal, since the reference
 * tags the whole `.built` block as a single `.reveal` but its own two
 * halves visually read as separate beats.
 */

/* =========================================================
   CONTENT — transcribed from
   Refrence/oxytal-case-study-diageo-brand-promoter.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Corporate Relations" },
  { k: "Sector", v: "Drinks & FMCG" },
  { k: "Services", v: "Experience Design · Software Engineering · Support" },
  { k: "Languages", v: "17" },
  { k: "Live since", v: "September 2022" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "17", l: "Languages, each with its own managed content" },
  { v: "4 yrs", l: "Continuously live and supported since launch" },
  { v: "—", l: "Promoters trained to date" },
  { v: "—", l: "Markets using the platform" },
  { v: "100%", l: "Completion evidenced and exportable" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Seventeen languages, not one translated site",
    text: "Translation is the easy half. Each market needed its own managed content, its own review cycle and the ability to reflect local law and local sensitivity — while the core standard stayed identical everywhere. Adding an eighteenth market had to be a content task, not a development project.",
  },
  {
    n: "02",
    title: "No corporate identity to log in with",
    text: "These users have no company account. Access had to be straightforward for someone with a personal phone, possibly on mobile data, possibly in a venue with poor signal — while still producing a reliable record of who completed what.",
  },
  {
    n: "03",
    title: "Subject matter that demands care",
    text: "Modules covering harassment and incident reporting aren't ordinary content. Someone may be reading them because something has already happened. Tone, clarity and the visibility of the reporting route mattered more than any visual decision on the project.",
  },
];

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  flip?: boolean;
  img: string;
  alt: string;
}[] = [
  {
    n: "01 · Learner experience",
    title: "Standards training that works on a phone in a bar",
    desc: "The training walks promoters through Diageo's core values, principles and guidelines, then through the situations they'll actually meet — a difficult customer, a colleague behaving badly, a moment where they need to say no.",
    bullets: [
      "Short modules that survive being completed in a break, not a training room",
      "Progress preserved between sessions, so a dropped connection costs nothing",
      "Language chosen by the person, not assumed from their location",
      "Assessment that confirms understanding rather than attendance",
    ],
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/brandpromotor/s-1.webp",
    alt: "Brand Promoter training module interface",
  },
  {
    n: "02 · Multilingual delivery",
    title: "Seventeen markets, one standard",
    desc: "Every market team manages its own content in its own language, working from a shared structure. The standard doesn't drift between markets, but the wording, examples and local reporting routes are theirs to control.",
    bullets: [
      "Content managed per language without touching the application",
      "Layouts built to absorb text that expands or contracts by a third",
      "A new market added as a content exercise, not a release",
    ],
    flip: true,
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/brandpromotor/s-2.webp",
    alt: "Multilingual content within the Brand Promoter platform",
  },
  {
    n: "03 · Admin module",
    title: "The half nobody sees, and the reason it works",
    desc: "Market and Corporate Relations teams manage promoters, publish content and see completion across their region. Without this, the training would be a website — with it, it's a system the business can rely on and evidence.",
    bullets: [
      "Promoter records managed by the teams who actually work with the agencies",
      "Completion visible per market, per campaign, per person",
      "Records exportable as evidence when someone asks for proof",
      "Roles and permissions that keep market content in market hands",
    ],
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/brandpromotor/s-3.webp",
    alt: "Administration module for managing brand promoters and tracking completion",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "The reporting route is never more than one step away",
    text: "Someone who needs it shouldn't have to navigate a course to find it. It stays reachable throughout, not parked at the end of a module.",
  },
  {
    title: "Plain language, in their own language",
    text: "Policy wording protects the organisation. Clear wording protects the person. Every market reviewed this content in its own language rather than accepting a translation of the English.",
  },
  {
    title: "No dead ends",
    text: "Every path through this material ends with something the person can actually do, and who they can contact in their own market — never with a definition and nothing else.",
  },
  {
    title: "Nothing that rushes the reader",
    text: "No timers, no progress pressure, no gamification anywhere near this content. It's read at the reader's pace, and it can be revisited without restarting anything.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Understand the standard",
    text: "Working sessions with the brand team to learn what the training genuinely had to achieve — and where existing material was being misread, skipped or quietly ignored in the field.",
  },
  {
    n: "02",
    title: "Design for the actual conditions",
    text: "Not a training room with a laptop. A phone, between shifts, in a second language, on a connection that may drop. Every interface decision was tested against that reality.",
  },
  {
    n: "03",
    title: "Build for seventeen from the first line",
    text: "Multilingual structure designed in at the start rather than retrofitted. Retrofitting language support is one of the most expensive corrections in software, and it always shows.",
  },
  {
    n: "04",
    title: "Test across real devices",
    text: "Verified across current browsers and the range of devices promoters actually carry — including older Android handsets, which is where this kind of platform usually fails.",
  },
  {
    n: "05",
    title: "Support and improve, continuously",
    text: "Live since 2022 and still ours. New markets, content updates, platform maintenance and enhancements delivered on an ongoing basis rather than through a change request process.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Application",
    items: [
      "React single-page application",
      "Responsive, mobile-first",
      "Progressive content loading",
      "Session persistence",
    ],
  },
  {
    title: "Content",
    items: [
      "Managed content per language",
      "Structured module model",
      "Market-level publishing",
      "Versioned updates",
    ],
  },
  {
    title: "Administration",
    items: [
      "Role-based access",
      "Promoter records",
      "Completion reporting",
      "Exportable evidence",
    ],
  },
  {
    title: "Assurance",
    items: [
      "Cross-browser verification",
      "Real-device testing",
      "Accessibility considerations",
      "Ongoing maintenance",
    ],
  },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/aviation-gin",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/aviationgin.webp",
    alt: "Aviation American Gin website",
    k: "Diageo · Brand",
    title: "Aviation American Gin",
    text: "Brand experience with consent-aware sign-up into Klaviyo and Salesforce.",
  },
  {
    href: "/case-studies/taffers",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/taffers.webp",
    alt: "Taffer's Browned Butter Bourbon website",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "Persuading people to try an unfamiliar product, with awards and recipes.",
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

/** The reference's `.eyebrow` — small dash + mono-style label, in this case study's own accent color (cyan by default, amber inside `CareSection`). */
function Eyebrow({ children, color = "#0E9BC4" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color }}>
      <span aria-hidden className="h-0.5 w-[22px] rounded-sm" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

/** The reference's `h2` + optional eyebrow/lede combo, shared by every content section below. */
function SectionHead({
  eyebrow,
  eyebrowColor,
  title,
  lede,
  dark,
  narrow = true,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  lede?: ReactNode;
  dark?: boolean;
  narrow?: boolean;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={narrow ? "max-w-[620px]" : undefined}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <h2
        ref={titleRef}
        className={cx(
          "max-w-[20ch] text-[clamp(28px,3.2vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#0B1B2B]"
        )}
      >
        {title}
      </h2>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A9BACE]" : "text-[#546A7E]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#0E9BC4" }: { color?: string }) {
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
            <span aria-current="page">Diageo Brand Promoter</span>
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

  // Everything else in the hero fades/rises in on mount too, staggered
  // just behind the heading — same "no scrollTrigger, plays immediately"
  // treatment as Kollabry/Forge Pipeline's own heroes.
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
        style={{ background: "radial-gradient(circle, rgba(22,185,232,.22), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-mono text-[12px] tracking-[0.18em] text-[#16B9E8] uppercase">
          Case study · Diageo
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[20ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Training a workforce you don&apos;t employ.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[60ch] text-[16px] leading-[1.85] text-[#A9BACE]">
          Brand promoters represent Diageo at events and points of sale — but they work for third-party agencies.
          No company email, no induction day, no HR system. We built the platform that makes sure every one of
          them understands the standards, in their own language, before they represent the brand. It has been
          running since 2022.
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
          href="https://www.diageobrandpromoter.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#16B9E8] hover:bg-[#16B9E8]/10 sm:mb-12"
        >
          Visit the live platform
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
            src="https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/brandpromotor/desktop.webp"
            alt="The Diageo Brand Promoter Standard training platform shown on desktop"
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
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E3ECF2] bg-[#E3ECF2] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#0E9BC4]">
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
        <SectionHead eyebrow="The challenge" title="Accountability without an employment relationship." narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0B1B2B]">
          Brand promoters are the people pouring the drink, running the tasting, staffing the stand. To a customer
          at an event they <em>are</em> the brand. But they&apos;re employed by third-party agencies, often for a
          single campaign, across dozens of markets and many languages.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546A7E]">
          That creates a gap most large organisations recognise. Diageo carries the reputational and ethical
          responsibility for how these people behave — and for their safety while they&apos;re doing it — without
          any of the usual mechanisms. There&apos;s no corporate login to assign, no onboarding week, no line
          manager inside the business. Turnover is high by design, because campaigns end.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546A7E]">
          Diageo&apos;s Corporate Relations team needed every promoter to understand the company&apos;s values,
          principles and guidelines before an event — and, just as importantly, to know how to handle a difficult
          situation, what harassment looks like, and exactly how to report an incident. In whatever language they
          actually think in.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0B1B2B]">
            Training that only works for employees doesn&apos;t solve this. The platform had to reach someone
            hired last week, by another company, who may never log in from a laptop.
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
    <section className="bg-gradient-to-b from-[#F1F7FB] to-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three constraints shaped every decision."
            lede="None of them are visible in a screenshot, and all three would have sunk the project if they'd been treated as details."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3ECF2] bg-[#E3ECF2] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-mono text-[12px] tracking-[0.1em] text-[#0E9BC4]">{card.n}</span>
              <h3 className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0B1B2B]">
                {card.title}
              </h3>
              <p className="text-[14px] leading-[1.65] text-[#546A7E]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
            title="A training platform and the admin system behind it."
            lede="Two halves that had to work as one: the experience the promoter sees, and the tooling the market teams use to run it."
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

  return (
    <div
  className={cx(
    "grid grid-cols-1 items-center gap-8 lg:gap-14",
    row.flip
      ? "lg:grid-cols-[2fr_3fr]"
      : "lg:grid-cols-[3fr_2fr]"
  )}
>
  <div
    ref={textRef}
    className={row.flip ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1"}
  >
    <span className="mb-3.5 block font-mono text-[12px] tracking-[0.11em] text-[#0E9BC4]">
      {row.n}
    </span>

    <h3 className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0B1B2B]">
      {row.title}
    </h3>

    <p className="mb-1 text-[16px] leading-[1.8] text-[#546A7E]">
      {row.desc}
    </p>

    <ul className="mt-5 list-none">
      {row.bullets.map((bullet, index) => (
        <li
          key={bullet}
          className={cx(
            "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#546A7E]",
            index > 0 && "border-t border-[#F1F6F9]"
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
    className={cx(
      "overflow-hidden rounded-[18px] border border-[#E3ECF2] bg-[#F1F6F9] shadow-[0_20px_46px_-22px_rgba(11,27,43,0.24)]",
      row.flip
        ? "lg:col-start-1 lg:row-start-1"
        : "lg:col-start-2 lg:row-start-1"
    )}
  >
    {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
    <img
      src={row.img}
      alt={row.alt}
      width={400}
      height={750}
      loading="lazy"
      className="block w-full"
    />
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1408] to-[#241A0A] px-5 py-14 text-[#F5EEE3] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(224,138,44,.24), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#E08A2C"
            title="Designing the part of a product you hope nobody needs."
            dark
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#C9BCA8]">
            Most of this platform is ordinary training. One part isn&apos;t. The modules covering difficult
            situations, harassment and incident reporting carry a different weight, because{" "}
            <strong className="font-semibold text-white">
              someone may be reading them after something has already happened to them
            </strong>{" "}
            — at an event, far from anyone they work for directly, unsure whether it&apos;s their place to say
            anything.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#C9BCA8]">
            That changed how we designed it. Not the visual language, the behaviour.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#1A1408] p-6.5">
              <h3 className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white">
                {card.title}
              </h3>
              <p className="text-[14.6px] leading-[1.65] text-[#C0B2A0]">{card.text}</p>
            </div>
          ))}
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
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Built with the brand team, not for them."
            lede="Corporate Relations knew the standard inside out. We knew how to make it reach people who'd never seen a Diageo system. The work happened in the overlap."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E3ECF2] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[82px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E3ECF2]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#0E9BC4]">{phase.n}</span>
              <div>
                <h3 className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0B1B2B]">
                  {phase.title}
                </h3>
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
   STILL RUNNING
========================================================= */

function StillRunningSection() {
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
            style={{ background: "radial-gradient(circle, rgba(22,185,232,.22), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead eyebrow="In production" eyebrowColor="#16B9E8" title="Launched in 2022. Still ours." dark narrow={false} />
            <p className="mt-4 text-[16px] leading-[1.8] text-[#A9BACE]">
              Plenty of agencies could have built this. The measure we&apos;d rather be judged on is that it has
              been running continuously ever since, supported by the same team, absorbing new markets and content
              changes without a rebuild. A training platform that quietly stops being maintained is worse than
              none at all — it gives an organisation false confidence in a record it can no longer trust.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(2.4rem,4.6vw,3.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#16B9E8]">
              2022
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9DB2C4]">
              Live since September, continuously supported
            </div>
            <hr className="my-5 border-white/[0.09]" />
            <p className="text-[13.5px] leading-[1.6] text-[#9DB2C4]">
              Ongoing content updates, new market onboarding, platform maintenance and enhancements — delivered
              by the team that built it.
            </p>
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
    <section className="bg-gradient-to-b from-[#F1F7FB] to-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Chosen for a decade, not a launch."
            lede="A platform that has to be maintained across many markets for years rewards conventional, well-understood choices over interesting ones."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 font-mono text-[16px] font-medium tracking-[0.12em] text-[#0E9BC4] uppercase">
                {group.title}
              </h4>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li
                    key={item}
                    className={cx(
                      "py-1.75 text-[15px] text-[#546A7E]",
                      index > 0 && "border-t border-[#F1F6F9]"
                    )}
                  >
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
          <SectionHead eyebrow="More of our work" title="Related case studies." narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E3ECF2] bg-white hover:-translate-y-1 hover:border-[#BCDCE9] hover:shadow-[0_20px_44px_-20px_rgba(11,27,43,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} width={800} height={500} loading="lazy" className="aspect-16/10 block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-mono text-[12px] tracking-[0.11em] text-[#8598AA] uppercase">{item.k}</span>
                <h3 className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0B1B2B]">{item.title}</h3>
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

export default function DiageoBrandPromoterCaseStudy() {
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
      <div data-nav-contrast="dark"><DetailThatMatteredSection /></div>
      <HowWeWorkedSection />
      <StillRunningSection />
      <TechnologySection />
      <RelatedSection />
    </div>
  );
}
