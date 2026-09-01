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
 * `TinyIslandCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/oxytal-case-study-tiny-island.html`. Same treatment as its
 * siblings in this folder (`CasaFamosaCaseStudy`/`StoopDayzCaseStudy`/
 * `TaffersCaseStudy`/`KaneffCaseStudy`): no Contentful wiring, keeps the
 * reference's own colour identity (`--ink` `#0C1D20`, `--body` `#4C6467`,
 * `--accent` `#9C6A0D`, `--accent-2` `#9C6A0D`, the `--deep-1`/`--deep-2`
 * `#061518`/`#0E2E32` teal-black gradient) rather than the site's per-page
 * `themeColor` accent, and typography stays the site's own inherited
 * `Poppins`. Every heading size, lede size, and section container width
 * (`max-w-*`) matches its siblings exactly — 12px eyebrows,
 * `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8 ledes, `max-w-7xl`
 * for the wide sections, `max-w-5xl` for the narrow prose ones, `max-w-6xl`
 * for "what we built".
 *
 * Shape-wise this is closest to `CasaFamosaCaseStudy`/`StoopDayzCaseStudy`:
 * 4 photo "built" rows (not `KaneffCaseStudy`'s SVG diagrams — the
 * reference's own `.b-visual` SVG diagrams for rows 1 and 3 are skipped in
 * favour of real product photography, same simplification every other
 * photo-led case study in this folder already makes), and a "still ours"
 * box holding a two-line value (`whitespace-pre-line`). Two things unique
 * to this one, both carried over from the reference because they *are* the
 * argument of the page: the first built row ("The rebuttal") renders the
 * reference's own `.specs` pill chips (Flavor Full / Non-Carbonated / 10%
 * ABV) instead of a checklist, and the second row ("The four") nests the
 * reference's `.drinks` product grid — four cocktails, each linking out to
 * its own page on the live site — inside its text column, same "nested
 * grid inside one built row" idiom `StoopDayzCaseStudy`'s flavour grid
 * uses.
 *
 * Registered in `ComposableElementRenderer` as subtype `tinyIsland`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/photo fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-tiny-island.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Tiny Island Cocktails" },
  { k: "Sector", v: "Drinks & FMCG · ready-to-drink" },
  { k: "Services", v: "Experience Design · Engineering · Integration · Support" },
  { k: "Range", v: "Four Caribbean rum cocktails" },
  { k: "Status", v: "Built from scratch, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "4", l: "Cocktails, each with its own page and link" },
  { v: "2", l: "Specifications carrying the entire argument" },
  { v: "10%", l: "ABV, stated before anything is sold" },
  { v: "—", l: "Retailer lookups since launch" },
  { v: "—", l: "Sign-ups captured with consent" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Familiarity removes the easy content",
    text: "With an unusual product you can explain it and the page writes itself. With a Mojito there's nothing to explain, so every word has to earn its place or the page is padding — and padding reads as a brand with nothing to say.",
  },
  {
    n: "02",
    title: '"Tiny" must not read as "less"',
    text: "A brand built on smallness has to be careful. Small format, small moments, small choices — all charming until a shopper hears \"you get less for your money\". The generosity has to be visible somewhere.",
  },
  {
    n: "03",
    title: "Compliance arrives before the brand does",
    text: "An age check first, then mandatory legal elements on every page. On a site with only four pages, that footer is a large proportion of what's on screen — it can't be allowed to outweigh the product.",
  },
];

const SPECS: { label: string; icon: ReactNode }[] = [
  {
    label: "Flavor Full",
    icon: (
      <path d="M6 4h12l-1.5 7a4.5 4.5 0 01-9 0z M12 11v7M8 21h8" />
    ),
  },
  {
    label: "Non-Carbonated",
    icon: <path d="M4 6l16 12M8 4h8l-1 6a4 4 0 01-6 0z" />,
  },
  {
    label: "10% ABV",
    icon: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M8 15l8-6" />,
  },
];

function SpecIcon({ path }: { path: ReactNode }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9C6A0D"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path}
    </svg>
  );
}

const DRINKS: { name: string; note: string; img: string; href: string }[] = [
  {
    name: "Hurricane",
    note: "Passionfruit, strawberry, pineapple",
    img: "https://images.ctfassets.net/wodp1h6ezq96/I2AUaZkjNDrudPa2HPDYy/9c897aad0711e316b88cf0d0a2cb7bc0/hurricane-product.webp",
    href: "https://www.tinyislandcocktails.com/hurricane",
  },
  {
    name: "Mojito",
    note: "Zesty lime and fresh mint",
    img: "https://images.ctfassets.net/wodp1h6ezq96/5VWPJ1HjY79wWwuKvkNP0N/c51c3f60d47e9a44249a5d9d605a6d37/mojito.webp",
    href: "https://www.tinyislandcocktails.com/mojito",
  },
  {
    name: "Mai Tai",
    note: "Light rum, lime, almond, orange",
    img: "https://images.ctfassets.net/wodp1h6ezq96/6vsB5xHgRWyPiTupPwkZLC/a35faaeefce4ca732eec3a2dd2f5dc11/Maitai.webp",
    href: "https://www.tinyislandcocktails.com/mai-tai",
  },
  {
    name: "Daiquiri",
    note: "Juicy lime, subtle orange",
    img: "https://images.ctfassets.net/wodp1h6ezq96/3tXgE8m8StFfiISwDAwKTc/d9dca860b8d9c6d7b6549ed53010ebe9/Daiquiri.webp",
    href: "https://www.tinyislandcocktails.com/daiquiri",
  },
];

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets?: string[];
  img: string;
  alt: string;
  chips?: boolean;
  drinks?: boolean;
}[] = [
  {
    n: "01 · The rebuttal",
    title: "Two specifications, above everything",
    desc: 'Before a single product appears, three attributes sit under the welcome: Flavor Full, Non-Carbonated, 10% ABV. Two of those are the entire answer to "is this just another seltzer" — and putting them first was the most important layout decision on the site.',
    img: "https://images.ctfassets.net/wodp1h6ezq96/5yvC9NqXcvwcEd4H9nZz8G/b724865e217bb082261b82f89f5c8383/HeroPacking.webp",
    alt: "Tiny Island Cocktails packaging carrying the three attributes shown under the welcome",
    chips: true,
  },
  {
    n: "02 · The four",
    title: "A page each, because people have a favourite",
    desc: "Somebody is a Mai Tai person. Somebody else has never got on with a Daiquiri. Each cocktail has its own page and its own link, so a recommendation lands where it was meant to and a campaign can point at one drink rather than the homepage.",
    bullets: [
      "Tasting notes written properly — passionfruit and strawberry, lime and mint, almond and orange",
      "Direct links from the navigation, so nobody navigates to find their drink",
      "Structured so a fifth cocktail is a content addition, not a rebuild",
    ],
    img: "https://images.ctfassets.net/wodp1h6ezq96/5yvC9NqXcvwcEd4H9nZz8G/b724865e217bb082261b82f89f5c8383/HeroPacking.webp",
    alt: "Tiny Island Cocktails packaging across the four-cocktail range",
    drinks: true,
  },
  {
    n: "03 · Tiny, made generous",
    title: "Small format, large everything else",
    desc: "The counterweight to a brand about smallness is the way the site is drawn. Big type, full-width imagery, generous space and a short journey — so the experience feels expansive even though the product is deliberately little.",
    bullets: [
      "The brand line does the reframing — tiny choices that make your world bigger",
      "Occasion over quantity — little escapes, quick detours, unplanned moments",
      "A short site treated as confidence, not as a lack of content",
    ],
    img: "https://images.ctfassets.net/wodp1h6ezq96/5VWPJ1HjY79wWwuKvkNP0N/c51c3f60d47e9a44249a5d9d605a6d37/mojito.webp",
    alt: "Tiny Island Mojito cocktail, shown at generous scale",
  },
  {
    n: "04 · The handoff",
    title: "Where to buy, and the list for next time",
    desc: "The site doesn't sell. Its job ends at a retailer, and at capturing the people who aren't ready yet — with permission recorded properly and carried into the systems behind it.",
    bullets: [
      "Where to Buy reachable from every page, never buried",
      "Join Us as its own destination, chosen rather than imposed",
      "Permission captured at source, with the region attached",
      "Withdrawal flowing back to every system holding that person",
    ],
    img: "https://images.ctfassets.net/wodp1h6ezq96/I2AUaZkjNDrudPa2HPDYy/9c897aad0711e316b88cf0d0a2cb7bc0/hurricane-product.webp",
    alt: "Tiny Island Hurricane, one of four cocktails in the range",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "Non-carbonated separates the category",
    text: "It says this is a cocktail rather than a seltzer with flavouring, in two words, to someone who is scrolling and not reading.",
  },
  {
    title: "Strength stated openly",
    text: "10% is high for the format and it's declared up front rather than buried. Being direct about strength reads as confidence — and it's the responsible thing to do.",
  },
  {
    title: "Icons, not a specification table",
    text: "Three glass marks and three short labels. Read in a second, at a glance, before any decision has formed.",
  },
  {
    title: "Repeated where the choice happens",
    text: "The same attributes carry through to the individual cocktail pages, so the reassurance is present at the moment somebody picks a favourite.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Name the objection out loud",
    text: 'Not "communicate the brand" but something testable: a shopper assumes a canned cocktail is thin and fizzy. Everything on the page was measured against whether it addressed that.',
  },
  {
    n: "02",
    title: "Promote the specifications",
    text: "Two product facts moved from a details section to the top of the homepage. The single highest-leverage change on the project, and it cost nothing.",
  },
  {
    n: "03",
    title: "Make small feel deliberate",
    text: "Large type, generous space and full-width imagery, so the format reads as a considered choice rather than a compromise.",
  },
  {
    n: "04",
    title: "Give each cocktail its own address",
    text: "Four pages, four links, so a favourite can be shared and a campaign can target a single drink.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. New cocktails, seasonal campaigns, performance work and platform maintenance delivered as ongoing work.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Optimised imagery", "Mobile-first layouts"] },
  {
    title: "Content",
    items: ["Contentful", "A content type per cocktail", "Brand-team publishing", "Locale-aware routing"],
  },
  {
    title: "Integration",
    items: ["Marketing platform sign-up", "Customer record creation", "Consent captured at source", "Retailer locator"],
  },
  {
    title: "Compliance",
    items: ["Age verification", "Cookie consent management", "US privacy request route", "Accessibility standards"],
  },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/casa-famosa",
    img: "https://images.ctfassets.net/twkb5au85wu1/13bmqpOiBCkRHLCLuSNOtx/5bcaf0edb499aea0cd9bc070fefd6c0d/banner-product-img.webp",
    alt: "Casa Famosa Hard Agua Frescas",
    k: "Diageo · Brand",
    title: "Casa Famosa",
    text: "Nobody searches for a brand they've never heard of.",
  },
  {
    href: "/case-studies/taffers-browned-butter-bourbon",
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "An unfamiliar product, and the doubt a site has to answer.",
  },
  {
    href: "/case-studies/stoop-dayz",
    img: "https://images.ctfassets.net/gyddm6ym9nek/3oTZSzB4d1pAtCMmqqRJuv/f9581570b66bc9710a10b7af1179609d/stoop-dayz-4-canes-desktop.webp",
    alt: "Stoop Dayz Hard Soda",
    k: "Diageo · Brand",
    title: "Stoop Dayz",
    text: "A brand about slowing down, built without a single pushy pattern.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#9C6A0D" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#0C1D20]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A6BBBA]" : "text-[#4C6467]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#9C6A0D" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#061518] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.09em] text-[#6C8688] uppercase">
          <li>
            <Link href="/" className="text-[#9BB2B3] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9BB2B3] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Tiny Island Cocktails</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#061518] to-[#0E2E32] pt-12 text-[#E9F3F1] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,206,92,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-mono text-[12px] tracking-[0.18em] text-[#9C6A0D] uppercase">
          Case study · Diageo · Tiny Island Cocktails
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Everyone knows what a Mojito tastes like. The doubt is the can.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A6BBBA]">
          Tiny Island makes mini Caribbean rum cocktails — Hurricane, Mojito, Mai Tai, Daiquiri. Nobody needs those
          explained, which sounds like an easy brief and isn&apos;t. When the drink is familiar, the scepticism
          moves to the format: can a pre-mixed cocktail in a small can actually be worth drinking? We designed and
          built the site that answers that, and we still work on it.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#061518] px-5 py-4.5">
              <dt className="mb-1.5 font-mono text-[11px] tracking-[0.12em] text-[#6C8688] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#E9F3F1]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.tinyislandcocktails.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#9C6A0D] hover:bg-[#9C6A0D]/12 sm:mb-12"
        >
          Visit the live site
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
          className="overflow-hidden rounded-t-[20px] border border-b-0 border-white/12 shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src="https://images.ctfassets.net/wodp1h6ezq96/5yvC9NqXcvwcEd4H9nZz8G/b724865e217bb082261b82f89f5c8383/HeroPacking.webp"
            alt="Tiny Island Cocktails mini Caribbean rum cocktail packaging"
            width={1600}
            height={700}
            className="block aspect-16/7 w-full object-cover"
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
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E1EBE9] bg-[#E1EBE9] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#9C6A0D]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#4C6467]">{item.l}</div>
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
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="A familiar drink in a doubted format." narrow={false} headingLevel="h2" />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0C1D20]">
          Hurricane, Mojito, Mai Tai, Daiquiri. Four cocktails that need no introduction — which removes the usual
          job of a drinks brand site and replaces it with a harder one.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4C6467]">
          Because the flavours are known, the shopper isn&apos;t wondering what it tastes like. They&apos;re
          wondering whether this version is any good. Ready-to-drink has spent years training people to expect
          something thin, fizzy and disappointing, and every canned cocktail now inherits that suspicion whether it
          deserves it or not.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4C6467]">
          There&apos;s a second complication in the name. &quot;Tiny&quot; is the brand&apos;s whole idea — tiny
          choices that make your world bigger, mini cocktails for little escapes and unplanned moments. Charming
          positioning, and a risk: small can read as less. The design had to make smallness feel generous rather
          than mean.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#9C6A0D] bg-[#FDF3DF] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0C1D20]">
            Most brand sites exist to explain the product. This one exists to defend the format — and it has to do
            it in the few seconds before somebody decides a canned Mojito isn&apos;t for them.
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
    <section className="bg-gradient-to-b from-[#F0F8F6] to-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            headingLevel="h2"
            title="Three tensions in a four-page site."
            lede="The brief looks small. Each of these would have quietly undermined it."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E1EBE9] bg-[#E1EBE9] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-mono text-[12px] tracking-[0.1em] text-[#9C6A0D]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0C1D20] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#4C6467]">{card.text}</p>
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
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="Four pages, and two facts doing most of the work."
            headingLevel="h2"
            lede="Home, the four cocktails, About, Where to Buy, Join Us. Short by design — when there's little to explain, length is a liability."
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

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-mono text-[12px] tracking-[0.11em] text-[#9C6A0D]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0C1D20] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#4C6467]">{row.desc}</p>

        {row.bullets && (
          <ul className="mt-5 list-none">
            {row.bullets.map((bullet, index) => (
              <li
                key={bullet}
                className={cx(
                  "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#4C6467]",
                  index > 0 && "border-t border-[#F2F8F6]"
                )}
              >
                <CheckSvg />
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {row.chips && (
          <div className="mt-6.5 flex flex-wrap gap-3">
            {SPECS.map((spec) => (
              <span
                key={spec.label}
                className="flex items-center gap-2.5 rounded-full border border-[#E1EBE9] bg-white py-2.5 pr-5 pl-3.5"
              >
                <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-[#FDF3DF]">
                  <SpecIcon path={spec.icon} />
                </span>
                <span className="text-[15px] font-bold tracking-[-0.02em] text-[#0C1D20]">{spec.label}</span>
              </span>
            ))}
          </div>
        )}

        {row.drinks && (
          <div className="mt-6.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DRINKS.map((drink) => (
              <a
                key={drink.name}
                href={drink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-2xl border border-[#E1EBE9] bg-white transition-transform duration-300 hover:-translate-y-1 hover:border-[#EBD9A8] hover:shadow-[0_16px_34px_-18px_rgba(12,29,32,0.24)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
                <img
                  src={drink.img}
                  alt={`Tiny Island ${drink.name} cocktail`}
                  width={500}
                  height={500}
                  loading="lazy"
                  className="aspect-square w-full bg-[#F2F8F6] object-contain p-3"
                />
                <div className="px-3.5 py-3">
                  <span className="text-[15px] font-extrabold tracking-[-0.02em] text-[#0C1D20] block">{drink.name}</span>
                  <span className="mt-1 text-[13px] leading-[1.5] text-[#4C6467] block">{drink.note}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      <div
        ref={mediaRef}
        className="overflow-hidden rounded-[18px] border border-[#E1EBE9] bg-[#F2F8F6] shadow-[0_20px_46px_-22px_rgba(12,29,32,0.22)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
        <img
          src={row.img}
          alt={row.alt}
          width={1200}
          height={900}
          loading="lazy"
          className="block aspect-4/3 w-full object-cover"
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#061518] to-[#0E2E32] px-5 py-14 text-[#E9F3F1] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,206,92,.16), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#9C6A0D"
            headingLevel="h3"
            title="Two words and a number, placed before anything else."
            dark
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A6BBBA]">
            Most brand sites put specifications on a product page, below the photography, where the people who care
            can find them. Here,{" "}
            <strong className="font-semibold text-white">
              Non-Carbonated and 10% ABV appear before a single product does
            </strong>{" "}
            — under the welcome, as icons, in the first screenful.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A6BBBA]">
            That looks like a small layout choice. It&apos;s the argument. Ready-to-drink taught shoppers to expect
            fizzy and weak, so those two facts do more persuading than any amount of copy about Caribbean rum.
            Putting them lower down would have meant only the already-convinced ever saw them.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#061518] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9BB2B3]">{card.text}</p>
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
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Find the doubt, then design against it."
            headingLevel="h3"
            lede="With a familiar product, the useful question isn't what to say about it. It's what somebody is silently worried about."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E1EBE9] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E1EBE9]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#9C6A0D]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0C1D20] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#4C6467]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STILL OURS
========================================================= */

function StillOursSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#061518] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,206,92,.16), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#9C6A0D"
              headingLevel="h3"
              title="A four-cocktail range rarely stays at four."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A6BBBA]">
              Ready-to-drink moves quickly. Ranges extend, formats change, campaigns arrive with their own
              requirements, and privacy rules shift underneath. A site built tightly around exactly today&apos;s
              products is a site that needs rebuilding the first time the range grows.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A6BBBA]">
              This one was structured so a new cocktail is a content task. We&apos;re still on it — publishing,
              extending and maintaining, so the brand team isn&apos;t waiting on a release every time something
              changes.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#9C6A0D]">
              {"Designed,\nbuilt, supported"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9BB2B3]">
              From the first workshop to the enhancement shipped last month — the same team throughout, across
              London, Dublin and Chandigarh.
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
    <section className="bg-gradient-to-b from-[#F0F8F6] to-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Fast on a phone, editable in an afternoon."
            headingLevel="h4"
            lede="The same two tests as every brand site we build: does it appear before someone's thumb moves on, and can the brand team change it without booking developer time."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-mono text-[16px] font-medium tracking-[0.12em] text-[#9C6A0D] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#4C6467]", index > 0 && "border-t border-[#F2F8F6]")}>
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
    <section className="bg-[#FCFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E1EBE9] bg-white hover:-translate-y-1 hover:border-[#C6E0DC] hover:shadow-[0_20px_44px_-20px_rgba(12,29,32,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} width={800} height={500} loading="lazy" className="aspect-16/10 block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-mono text-[12px] tracking-[0.11em] text-[#849799] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0C1D20] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#4C6467]">{item.text}</p>
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

export default function TinyIslandCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#FCFDFC]">
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
      <HowWeWorkedSection />
      <div data-nav-contrast="dark">
        <StillOursSection />
      </div>
      <TechnologySection />
      <RelatedSection />
    </div>
  );
}
