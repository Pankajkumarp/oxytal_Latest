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
 * `LoneRiverCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/oxytal-case-study-lone-river.html`. Same treatment as its
 * siblings in this folder (`RedMirchiCaseStudy`/`TinyIslandCaseStudy`/
 * `KaneffCaseStudy`): no Contentful wiring, keeps the reference's own
 * colour identity (`--ink` `#0D1719`, `--body` `#4E6265`, `--accent`
 * `#12808F`, `--accent-2` `#267F87`, `--sand` `#C9964A`, the `--deep-1`/
 * `--deep-2` `#081214`/`#12262A` near-black-teal gradient) rather than the
 * site's per-page `themeColor` accent, and typography stays the site's
 * own inherited `Poppins`. Every heading size, lede size, and section
 * container width (`max-w-*`) matches its siblings exactly — 12px
 * eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8 ledes,
 * `max-w-7xl` for the wide sections, `max-w-5xl` for the narrow prose
 * ones, `max-w-6xl` for "what we built" — rather than the numbers baked
 * into the reference's own stylesheet.
 *
 * Shape-wise this is closest to `KaneffCaseStudy`: all 3 "what we built"
 * rows illustrate with the reference's own hand-drawn inline SVG diagrams
 * (find-us search → flavours grid → subscribe consent flow) rather than
 * photography, ported as literal `<svg>` markup (camelCased attributes),
 * same `DIAGRAMS` map idiom Kaneff's `ReadingDiagram`/`SortingDiagram`/
 * `GoverningDiagram` use.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `loneRiver`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/diagram fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-lone-river.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Lone River Beverage Company" },
  { k: "Sector", v: "Drinks & FMCG · ready-to-drink" },
  { k: "Services", v: "Engineering · Experience Design · Integration · Support" },
  { k: "Range", v: "Ranch Water · Ranch Rita · Lemonade Splash" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "Zip-code", l: "Search returning nearby stockists and online options" },
  { v: "Both", l: "In-store and online purchase routes from one search" },
  { v: "3 × 4", l: "Product families, four flavours in each" },
  { v: "Rebrand", l: "A full identity refresh absorbed without a rebuild" },
  { v: "—", l: "Subscribers captured with consent" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Availability is genuinely uneven",
    text: "A national brand isn't nationally stocked. Somebody in a well-served city and somebody two hours from anywhere need the same page to be useful — and the second person must never reach a dead end.",
  },
  {
    n: "02",
    title: "Two purchase routes, one question",
    text: 'People don\'t think "in-store or online", they think "how do I get some". The answer has to hold both without turning a simple search into a decision the visitor didn\'t ask to make.',
  },
  {
    n: "03",
    title: "The atmosphere can't cost the speed",
    text: "Landscape photography is the brand. It's also weight, and most visitors arrive from social on a phone. The imagery had to stay and the page still had to appear quickly.",
  },
];

/* =========================================================
   WHAT WE BUILT — diagrams
========================================================= */

function FindUsDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="A zip code search returning both nearby stores and online delivery options together."
    >
      <rect x="28" y="52" width="180" height="52" rx="12" fill="#fff" stroke="#12808F" />
      <text x="48" y="76" fill="#84979A" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">ZIP CODE</text>
      <text x="48" y="94" fill="#0D1719" fontFamily="IBM Plex Sans, sans-serif" fontSize="15" fontWeight="600">79830</text>
      <rect x="170" y="64" width="28" height="28" rx="8" fill="#12808F" />
      <path d="M178 78l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M118 116v34" stroke="#12808F" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M112 144l6 8 6-8" fill="none" stroke="#12808F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="164" width="180" height="108" rx="12" fill="#E3F5F6" stroke="#12808F" />
      <text x="48" y="188" fill="#12808F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">NEARBY STORES</text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10.5" fill="#4E6265">
        <text x="48" y="212">Store, 1.2 mi</text>
        <text x="48" y="234">Store, 3.8 mi</text>
        <text x="48" y="256">Store, 6.1 mi</text>
      </g>
      <path d="M222 218h44" stroke="#DFEAEA" strokeWidth="2" />
      <text x="244" y="210" fill="#84979A" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">AND</text>
      <rect x="284" y="164" width="208" height="108" rx="12" fill="#fff" stroke="#DFEAEA" />
      <text x="306" y="188" fill="#C9964A" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">SHIPS TO YOU</text>
      <g fill="#F0F7F6" stroke="#DFEAEA">
        <rect x="306" y="200" width="164" height="24" rx="7" />
        <rect x="306" y="230" width="164" height="24" rx="7" />
      </g>
      <g fill="#BFD5D6">
        <rect x="320" y="209" width="76" height="7" rx="3.5" />
        <rect x="320" y="239" width="98" height="7" rx="3.5" />
      </g>
      <text x="388" y="80" fill="#0D1719" fontFamily="IBM Plex Sans, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">
        One question
      </text>
      <text x="388" y="100" fill="#84979A" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" textAnchor="middle">
        &quot;How do I get some?&quot;
      </text>
      <path d="M388 112v40" stroke="#DFEAEA" strokeWidth="2" strokeDasharray="4 5" />
    </svg>
  );
}

function FlavoursDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="Three product families — Ranch Water, Ranch Rita and Lemonade Splash — each holding four flavours, with room to add more."
    >
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" fill="#0D1719" textAnchor="middle">
        <text x="94" y="46">Ranch Water</text>
        <text x="260" y="46">Ranch Rita</text>
        <text x="426" y="46">Lemonade Splash</text>
      </g>
      <rect x="26" y="60" width="136" height="200" rx="14" fill="#fff" stroke="#12808F" />
      <rect x="192" y="60" width="136" height="200" rx="14" fill="#fff" stroke="#C9964A" />
      <rect x="358" y="60" width="136" height="200" rx="14" fill="#fff" stroke="#267F87" />
      <g fill="#E3F5F6">
        <rect x="46" y="78" width="96" height="38" rx="8" />
        <rect x="46" y="122" width="96" height="38" rx="8" />
        <rect x="46" y="166" width="96" height="38" rx="8" />
        <rect x="46" y="210" width="96" height="38" rx="8" />
      </g>
      <g fill="#FDF8EC">
        <rect x="212" y="78" width="96" height="38" rx="8" />
        <rect x="212" y="122" width="96" height="38" rx="8" />
        <rect x="212" y="166" width="96" height="38" rx="8" />
        <rect x="212" y="210" width="96" height="38" rx="8" />
      </g>
      <g fill="#EAF9FA">
        <rect x="378" y="78" width="96" height="38" rx="8" />
        <rect x="378" y="122" width="96" height="38" rx="8" />
        <rect x="378" y="166" width="96" height="38" rx="8" />
        <rect x="378" y="210" width="96" height="38" rx="8" />
      </g>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10" fill="#4E6265" textAnchor="middle">
        <text x="94" y="102">Original</text>
        <text x="94" y="146">Spicy</text>
        <text x="94" y="190">Rio Red</text>
        <text x="94" y="234">Blackberry</text>
        <text x="260" y="102">Classic</text>
        <text x="260" y="146">Spicy</text>
        <text x="260" y="190">Mango</text>
        <text x="260" y="234">Blood Orange</text>
        <text x="426" y="102">Original</text>
        <text x="426" y="146">Blueberry</text>
        <text x="426" y="190">Hot Honey</text>
        <text x="426" y="234">Prickly Pear</text>
      </g>
      <text x="260" y="286" fill="#84979A" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        ADD A FLAVOUR WITHOUT A RELEASE
      </text>
    </svg>
  );
}

function SubscribeDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="A sign-up flowing into marketing and customer systems with consent attached, and opt-out flowing back."
    >
      <rect x="26" y="106" width="150" height="88" rx="14" fill="#fff" stroke="#DFEAEA" />
      <text x="101" y="140" fill="#0D1719" fontFamily="IBM Plex Sans, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">
        Subscribe
      </text>
      <text x="101" y="162" fill="#84979A" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        a chosen page
      </text>
      <rect x="204" y="106" width="118" height="88" rx="14" fill="#FDF8EC" stroke="#C9964A" />
      <text x="263" y="140" fill="#0D1719" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" textAnchor="middle">
        Permission
      </text>
      <text x="263" y="160" fill="#C9964A" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        what · when · where
      </text>
      <g fill="#fff" stroke="#12808F">
        <rect x="356" y="44" width="140" height="72" rx="14" />
        <rect x="356" y="184" width="140" height="72" rx="14" />
      </g>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" fill="#0D1719" textAnchor="middle">
        <text x="426" y="76">Marketing</text>
        <text x="426" y="216">Customer record</text>
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#84979A" textAnchor="middle">
        <text x="426" y="96">profile</text>
        <text x="426" y="236">single record</text>
      </g>
      <g stroke="#12808F" strokeWidth="2" fill="none">
        <path d="M186 150h8" strokeDasharray="5 6" />
        <path d="M332 142h10c8 0 12-6 12-14V90" strokeDasharray="5 6" />
        <path d="M332 158h10c8 0 12 6 12 14v38" strokeDasharray="5 6" />
      </g>
      <path d="M188 144l8 6-8 6" fill="none" stroke="#12808F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M426 268c0 12-10 18-24 18H120c-14 0-24-8-24-20v-52" stroke="#C9964A" strokeWidth="2" strokeDasharray="6 7" fill="none" />
      <path d="M90 220l6-8 6 8" fill="none" stroke="#C9964A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="262" y="294" fill="#C9964A" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        OPT-OUT TRAVELS BACK
      </text>
    </svg>
  );
}

const DIAGRAMS = {
  findUs: FindUsDiagram,
  flavours: FlavoursDiagram,
  subscribe: SubscribeDiagram,
} as const;

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: ReactNode[];
  diagram: keyof typeof DIAGRAMS;
}[] = [
  {
    n: "01 · Find Us",
    title: "The store locator is the product page",
    desc: "Enter a zip code, get nearby stockists and the online options that ship to that area. It's treated as a first-class part of the experience rather than a utility bolted to the footer, because for a retailer-led drinks brand this is the only page that converts.",
    bullets: [
      "Zip-code search — the way an American actually describes where they are",
      "Local stores and online delivery returned together, not as separate journeys",
      "Results reflect what's actually available in that area",
      "Reachable from every page, because the question arrives at any moment",
    ],
    diagram: "findUs",
  },
  {
    n: "02 · Flavours",
    title: "Three families, twelve flavours, room for the next one",
    desc: "Ranch Water, Ranch Rita and Lemonade Splash are genuinely different propositions — a hard seltzer, a margarita-style drink and a lemonade — not variants of one thing. The navigation opens into families rather than flattening everything into a single list, and each flavour has a real page a campaign can link straight to.",
    bullets: [
      <>
        <strong className="font-semibold text-[#0D1719]">Ranch Water</strong> — Original, Spicy with muddled
        jalapeño, Rio Red Grapefruit, Blackberry
      </>,
      <>
        <strong className="font-semibold text-[#0D1719]">Ranch Rita</strong> — Classic, Spicy, Mango, Blood Orange
      </>,
      <>
        <strong className="font-semibold text-[#0D1719]">Lemonade Splash</strong> — Original, Blueberry, Hot Honey,
        Prickly Pear
      </>,
      "Variety packs merchandised as their own thing, because that's how people try a brand",
      "A new flavour is a content task — Blackberry Ranch Water arrived without a release",
    ],
    diagram: "flavours",
  },
  {
    n: "03 · Subscribe",
    title: "The audience for the next release",
    desc: "A brand that sells through retail can't see who bought a can. The subscriber list is the only direct relationship it has, so the sign-up is wired properly into the marketing and customer systems with permission travelling alongside the person.",
    bullets: [
      "Permission recorded at the moment it's given, with the region attached",
      "Marketing profile and customer record created together",
      "Withdrawal flowing back to every system holding that person",
      "Its own page in the navigation, not an interruption over the content",
    ],
    diagram: "subscribe",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "There is always another route",
    text: "If nothing is stocked nearby, online delivery options are offered in the same view. The search never terminates in an apology.",
  },
  {
    title: "Widen before you give up",
    text: "Nothing within a few miles doesn't mean nothing at all. The search reaches further out rather than reporting failure at the first radius.",
  },
  {
    title: "Capture the disappointment",
    text: "Someone who searched and found nothing is a subscriber worth having. The sign-up is right there, so a no today can become a message when that changes.",
  },
  {
    title: "Honest, not vague",
    text: "Where the brand genuinely isn't available, the page says so plainly rather than returning a list of stores that don't stock it. A wasted trip costs more goodwill than an honest no.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: 'Start at "how do I get some"',
    text: "The store locator was scoped and designed before the storytelling pages, so it got the best thinking rather than whatever attention remained at the end of the project.",
  },
  {
    n: "02",
    title: "Structure for more than one family",
    text: "Ranch Water and Ranch Rita designed as separate families from the start, so adding variants later is a content task rather than a restructure.",
  },
  {
    n: "03",
    title: "Protect the landscape, engineer the speed",
    text: "The photography is the brand and was never the variable. Server-rendered pages and per-device image sizing carry the weight instead.",
  },
  {
    n: "04",
    title: "Wire the systems behind it",
    text: "Sign-ups connected into the marketing platform and customer records with permission travelling alongside, and withdrawal flowing back.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. New flavours, seasonal campaigns, locator improvements, performance work and platform maintenance as ongoing work.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Optimised imagery", "Mobile-first layouts"] },
  { title: "Content", items: ["Contentful", "Product families & variants", "Brand-team publishing", "Locale-aware routing"] },
  { title: "Find Us", items: ["Zip-code search", "Nearby stockists", "Online delivery options", "Designed empty states"] },
  {
    title: "Integration",
    items: ["Marketing platform sign-up", "Customer record creation", "Consent captured at source", "Hand-off to the merch store"],
  },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/casa-famosa-hard-agua-frescas",
    img: "https://images.ctfassets.net/twkb5au85wu1/13bmqpOiBCkRHLCLuSNOtx/5bcaf0edb499aea0cd9bc070fefd6c0d/banner-product-img.webp",
    alt: "Casa Famosa Hard Agua Frescas",
    k: "Diageo · Brand",
    title: "Casa Famosa",
    text: "Nobody searches for a brand they've never heard of.",
  },
  {
    href: "/case-studies/stoop-dayz-all-flavor-no-fuss",
    img: "https://images.ctfassets.net/gyddm6ym9nek/3oTZSzB4d1pAtCMmqqRJuv/f9581570b66bc9710a10b7af1179609d/stoop-dayz-4-canes-desktop.webp",
    alt: "Stoop Dayz Hard Soda",
    k: "Diageo · Brand",
    title: "Stoop Dayz",
    text: "A brand about slowing down, built without a single pushy pattern.",
  },
  {
    href: "/case-studies/taffers-browned-butter-bourbon",
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "An unfamiliar product, and the doubt a site has to answer.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#12808F" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#0D1719]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A3B7B9]" : "text-[#4E6265]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#12808F" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#081214] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.09em] text-[#6C8285] uppercase">
          <li>
            <Link href="/" className="text-[#9CB2B4] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9CB2B4] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Lone River</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#081214] to-[#12262A] pt-12 text-[#E7F2F2] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,195,206,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-mono text-[12px] tracking-[0.18em] text-[#267F87] uppercase">
          Case study · Lone River Beverage Company
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          A brand about the uncharted. A customer who wants to know if it&apos;s in stock.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A3B7B9]">
          Lone River makes Ranch Water and Ranch Rita, and its identity is Far West Texas — the scale of the
          landscape, the idea of going somewhere nobody has been. Beautiful positioning. It also has to coexist with
          the least romantic question in drinks: is there any in the shop near me, today. We built the site that
          answers both, and we still work on it.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#081214] px-5 py-4.5">
              <dt className="mb-1.5 font-mono text-[11px] tracking-[0.12em] text-[#6C8285] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#E7F2F2]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.loneriverbevco.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#267F87] hover:bg-[#267F87]/12 sm:mb-12"
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
            src="https://images.ctfassets.net/gjrhdo7lk84j/6V2YCRZ1XxL5GnOOsvfxJp/dabbf010cac7d50f3dd5bd47621a88e0/Inspired-Section-homepage.webp"
            alt="Lone River Beverage Company, inspired by the landscape of Far West Texas"
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#DFEAEA] bg-[#DFEAEA] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#12808F]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#4E6265]">{item.l}</div>
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead
          eyebrow="The challenge"
          title="Romance at the top of the page, logistics at the bottom."
          headingLevel="h2"
          narrow={false}
        />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0D1719]">
          Lone River tells a proper story. A river cuts through the high desert of Far West Texas; out of it flows
          Ranch Water. Legend has it the first person to taste it followed miles of Texas stars and was found asleep
          under a piñon tree. Nobody knows what happened on that journey. That&apos;s genuinely good brand writing,
          and it&apos;s why people remember the name after seeing a can once.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4E6265]">
          But American drinks distribution doesn&apos;t care about any of that. Availability varies by state, by
          chain, and often by individual store. A person inspired by the brand on Tuesday still has to find a can on
          Saturday, and if the site can&apos;t tell them where, the inspiration expires quietly in a car park.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4E6265]">
          Add the ordinary complications. Three separate product families — Ranch Water, Ranch Rita and Lemonade
          Splash — carrying four flavours each, plus variety packs. A brand site with no checkout of its own, but a
          merchandise store living alongside it. And the compliance requirements that come with selling alcohol
          across US states.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#12808F] bg-[#E3F5F6] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0D1719]">
            On most brand sites the store locator is the page nobody designs. Here it&apos;s the page that decides
            whether the rest of the site was worth building.
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
    <section className="bg-gradient-to-b from-[#EFF8F8] to-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three problems behind a simple-looking site."
            headingLevel="h2"
            lede="A handful of pages and a search box. Underneath, the three things that actually determine whether it works."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#DFEAEA] bg-[#DFEAEA] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-mono text-[12px] tracking-[0.1em] text-[#12808F]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0D1719] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#4E6265]">{card.text}</p>
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="A short site with one page doing the heavy lifting."
            headingLevel="h2"
            lede="Flavours, Find Us, Contact, Subscribe. Four destinations, and the second one carries most of the commercial weight."
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
        <span className="mb-3.5 block font-mono text-[12px] tracking-[0.11em] text-[#12808F]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0D1719] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#4E6265]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={index}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#4E6265]",
                index > 0 && "border-t border-[#F0F7F6]"
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
        className="rounded-[18px] border border-[#DFEAEA] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(13,23,25,0.2)] sm:p-7"
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#081214] to-[#12262A] px-5 py-14 text-[#E7F2F2] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,195,206,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#267F87"
            headingLevel="h3"
            title="Never let a search end in nothing."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A3B7B9]">
            The hardest state to design on a store locator isn&apos;t the successful one. It&apos;s the search that
            comes back empty — someone in a rural county, or a state the brand hasn&apos;t reached, typing in their
            zip code and finding out the answer is no.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A3B7B9]">
            <strong className="font-semibold text-white">Handled badly, that&apos;s the end of the relationship.</strong>{" "}
            A person who was interested enough to search is the most valuable visitor the site gets, and an empty
            results page tells them to go and buy something else. So the empty state was designed as carefully as
            the successful one.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#081214] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9CB2B4]">{card.text}</p>
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Design the conversion first, then the atmosphere."
            headingLevel="h3"
            lede="The usual order on a brand site is to design the story and add the practical pages at the end. We inverted it, because on a retailer-led brand the practical page is the one that pays for the rest."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#DFEAEA] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#DFEAEA]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#12808F]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0D1719] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#4E6265]">{phase.text}</p>
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#081214] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(79,195,206,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#267F87"
              headingLevel="h3"
              title="The brand changed. The site didn't need rebuilding."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A3B7B9]">
              Lone River has grown from one product family to three, added flavours along the way, and been through
              a full identity refresh — a reimagined logo struck by a West Texas blacksmith with real branding
              irons, and packaging drawn from the stitching on cowboy boots. Most brand sites of that age would have
              been thrown away and started again.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A3B7B9]">
              This one absorbed it. Because the families, flavours and imagery were built as content rather than
              baked into pages, a new look and a new range are updates instead of a rebuild — which is the entire
              argument for structuring a site properly on day one.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#267F87]">
              {"One site,\nthree ranges"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9CB2B4]">
              A rebrand, two additional product families and a dozen flavours absorbed since launch — plus
              campaigns, performance work and platform maintenance.
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
    <section className="bg-gradient-to-b from-[#EFF8F8] to-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Fast on a phone, editable in an afternoon."
            headingLevel="h4"
            lede="Two tests decided every choice: does it appear before someone's thumb moves on, and can the brand team change it without booking developer time."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-mono text-[16px] font-medium tracking-[0.12em] text-[#12808F] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#4E6265]", index > 0 && "border-t border-[#F0F7F6]")}>
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
    <section className="bg-[#FBFDFD] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#DFEAEA] bg-white hover:-translate-y-1 hover:border-[#BADFE1] hover:shadow-[0_20px_44px_-20px_rgba(13,23,25,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} width={800} height={500} loading="lazy" className="aspect-16/10 block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-mono text-[12px] tracking-[0.11em] text-[#84979A] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0D1719] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#4E6265]">{item.text}</p>
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

export default function LoneRiverCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#FBFDFD]">
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
