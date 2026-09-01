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
import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton, ContentDetailSkeleton, DataLinkSkeleton } from "@/app/types/contentful";
import { getAssetUrl } from "@/app/lib/contentfulAsset";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// Contentful wiring — same shape as `BundabergRumCaseStudy`'s own:
// `entry.fields.elements` may hold up to 4 `contentDetail` entries. `[0]`
// supplies this case study's own hero photo (`heroImage`) and gallery
// (`gallery`, matched to `BUILT_ROWS` by position — see `galleryImages`
// in the default export below). Row 1 ("Handover") renders a hand-drawn
// SVG diagram, not a photo, so it has nothing for a gallery entry to
// override and is left untouched regardless of what's in that position;
// rows 2–3 each hold a real photo and take the override when one
// resolves (see `BuiltRow`'s own `visual` discriminant below). `[1]`–
// `[3]` each become one `RelatedSection` card (see `resolveRelatedItem`).
// Everything here works exactly as before when `entry` is omitted or
// those fields are unset — each piece falls back to its own hardcoded
// default individually.
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

interface AnyEntry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: Record<string, unknown>;
}

function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

/**
 * `AviationGinCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-aviation-gin.html`. Same
 * treatment as its siblings in this folder (`BundabergRumCaseStudy`/
 * `RedMirchiCaseStudy`/`KaneffCaseStudy`): keeps the reference's own
 * colour identity (`--ink` `#0D1826`, `--body` `#546376`, `--muted`
 * `#8794A6`, `--accent` `#2F6FA8`, `--accent-2` `#3879B2`, `--accent-soft`
 * `#EAF2FA`, the `--deep-1`/`--deep-2` `#070D17`/`#132132` near-black
 * gradient) rather than the site's per-page `themeColor` accent, and
 * typography stays the site's own inherited `Poppins`. Every heading
 * size, lede size, and section container width (`max-w-*`) matches its
 * siblings exactly — 12px eyebrows, `clamp(28px,3.2vw,40px)`/
 * `leading-[1.2]` h2s, 16px/1.8 ledes, `max-w-7xl` for the wide sections,
 * `max-w-5xl` for the narrow prose ones, `max-w-6xl` for "what we built"
 * — rather than the numbers baked into the reference's own stylesheet.
 * Content is still the reference's own hardcoded copy/photography; the
 * only genuine Contentful wiring is the optional `entry` prop (see the
 * doc comment above the `isEntry` helper) — a `contentDetail` entry's
 * own `heroImage` can override the hero photo, its `gallery` can override
 * the two photo rows in "what we built", and up to 3 more `contentDetail`
 * entries can override the related-case-study cards, each falling back
 * to its own hardcoded default individually when unset.
 *
 * Two things unique to this one:
 * - "What we built"'s 3 rows mix a hand-drawn inline SVG diagram for row
 *   1 ("Handover", same idiom `KaneffCaseStudy`'s/`RedMirchiCaseStudy`'s/
 *   `BundabergRumCaseStudy`'s diagrams use) with real photography for
 *   rows 2–3, via `BuiltRow`'s own `visual` discriminant — same shape
 *   `BundabergRumCaseStudy` uses, and the photo rows are gallery-
 *   overridable the same way (`galleryImages` matched by position,
 *   consulted only inside `BuiltRow`'s `"photo"` branch).
 * - "The detail that mattered" carries the reference's own in-world
 *   vocabulary table (`LexTable`) — 5 plain-English → brand-vocabulary
 *   rows ("Cocktail recipes → In-Flight Menu" and so on) — that none of
 *   its siblings have, built fresh here rather than reused from another
 *   section's shape. "How we worked" also labels its 5 phases by role in
 *   the support relationship (Handover/Standing/Campaigns/Between/Always)
 *   rather than the usual `01`–`05` sequence, same device
 *   `BundabergRumCaseStudy`'s trading-rhythm labels use.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `aviationGin`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/media fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-aviation-gin.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Aviation American Gin" },
  { k: "Sector", v: "Drinks & FMCG" },
  { k: "Services", v: "Application Support · Engineering · Experience Design" },
  { k: "Engagement", v: "Inherited platform, ongoing enhancement" },
  { k: "Status", v: "Live, supported and evolving" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "Inherited", l: "Platform taken over, not rebuilt" },
  { v: "Seasonal", l: "Limited editions shipped as campaign moments" },
  { v: "Zero", l: "Rebuilds proposed — the existing platform earned its keep" },
  { v: "—", l: "Enhancements delivered since handover" },
  { v: "—", l: "Average time from brief to live" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "You don't know what you're allowed to touch",
    text: "Every codebase contains decisions that look wrong and aren't. A strange workaround usually exists because of a browser bug, a compliance requirement or a deadline nobody documented. Changing it confidently requires understanding why it's there.",
  },
  {
    n: "02",
    title: "There is no learning period",
    text: "A brand that moves at cultural speed doesn't pause while a new supplier reads the code. The first campaign after handover arrives on the same timeline as the last one — and being new is not an explanation anyone wants.",
  },
  {
    n: "03",
    title: "The metaphor is load-bearing",
    text: "Aviation's aviation theme isn't decoration — it runs through every label on the site. Add anything without finding its in-world word and the seam shows immediately, in a way a bug never would.",
  },
];

/* =========================================================
   WHAT WE BUILT — handover diagram
========================================================= */

function HandoverDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="An inherited platform is mapped and documented before any change is made.">
      <rect x="24" y="60" width="150" height="180" rx="14" fill="#F2F5F9" stroke="#E3E9F1" />
      <text x="99" y="46" fill="#8794A6" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        INHERITED
      </text>
      <g fill="#D6DFEA">
        <rect x="44" y="82" width="110" height="10" rx="5" />
        <rect x="44" y="102" width="86" height="10" rx="5" />
        <rect x="44" y="122" width="102" height="10" rx="5" />
        <rect x="44" y="142" width="72" height="10" rx="5" />
        <rect x="44" y="162" width="110" height="10" rx="5" />
        <rect x="44" y="182" width="94" height="10" rx="5" />
        <rect x="44" y="202" width="64" height="10" rx="5" />
      </g>
      <text x="99" y="262" fill="#8794A6" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        SOMEONE ELSE&apos;S DECISIONS
      </text>
      <path d="M190 150h44" stroke="#2F6FA8" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M228 144l8 6-8 6" fill="none" stroke="#2F6FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="248" y="60" width="118" height="180" rx="14" fill="#EAF2FA" stroke="#2F6FA8" />
      <text x="307" y="46" fill="#2F6FA8" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        READ &amp; MAP
      </text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10" fill="#546376">
        <text x="268" y="90">content model</text>
        <text x="268" y="116">integrations</text>
        <text x="268" y="142">compliance</text>
        <text x="268" y="168">animation layer</text>
        <text x="268" y="194">deploy path</text>
      </g>
      <g fill="#2F6FA8">
        <circle cx="258" cy="86" r="3" />
        <circle cx="258" cy="112" r="3" />
        <circle cx="258" cy="138" r="3" />
        <circle cx="258" cy="164" r="3" />
        <circle cx="258" cy="190" r="3" />
      </g>
      <text x="307" y="222" fill="#2F6FA8" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        DOCUMENTED
      </text>
      <path d="M382 150h30" stroke="#2F6FA8" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M406 144l8 6-8 6" fill="none" stroke="#2F6FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="426" y="104" width="70" height="92" rx="14" fill="#fff" stroke="#2F6FA8" />
      <text x="461" y="146" fill="#0D1826" fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" fontWeight="600" textAnchor="middle">
        Ship
      </text>
      <text x="461" y="166" fill="#2F6FA8" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        safely
      </text>
    </svg>
  );
}

type BuiltRow =
  | { n: string; title: string; desc: string; bullets: string[]; visual: "diagram" }
  | { n: string; title: string; desc: string; bullets: string[]; visual: "photo"; img: string; alt: string };

const BUILT_ROWS: BuiltRow[] = [
  {
    n: "01 · Handover",
    title: "The first thing we did was change nothing",
    desc: "Before a single enhancement, we mapped the system: the content model and how the brand team uses it, the integrations, the compliance wiring, the animation layer, and the deployment path. Documenting an inherited platform is unglamorous and it's the reason the first campaign after handover went out without incident.",
    bullets: [
      "Content model mapped against how the brand team actually publishes",
      "Compliance elements traced end to end before anything near them moved",
      "Written down as we went, so knowledge lives in the project rather than one head",
      "No rebuild proposed — the platform was sound and saying so cost us the bigger project",
    ],
    visual: "diagram",
  },
  {
    n: "02 · Campaigns",
    title: "Limited editions, shipped at campaign pace",
    desc: "Aviation runs seasonal and limited releases — Cranberry Blood Orange is the one live now, taking over the navigation and the homepage. Each one needs its own space, its own art direction and its own route to purchase, without disturbing the permanent brand content underneath.",
    bullets: [
      "Campaign pages that take priority placement, then step back when the season ends",
      "Navigation that reorders for the moment without breaking the permanent structure",
      "Brand-managed content, so a launch date isn't dependent on a developer being free",
      "Every campaign carrying the same compliance elements as the rest of the site",
    ],
    visual: "photo",
    img: "https://images.ctfassets.net/sl666vhlv2bs/16kReiJPVVzhDqsdWc07T7/1e632455fa394c66a363fca8f8a04d5d/RR_Drink_V2.jpg",
    alt: "Cranberry Blood Orange limited edition campaign for Aviation American Gin",
  },
  {
    n: "03 · The craft story",
    title: "Four steps, told properly",
    desc: "Aviation's production section is unusually detailed for a drinks site — botanicals named individually, an eighteen-hour maceration, a seven-hour distillation run, the heart cut at 142 proof brought down to 84. That level of specificity is the brand's answer to the celebrity association, and it earns its length.",
    bullets: [
      "Infusion, distillation, the cut, blending — each given room rather than compressed",
      "Real numbers kept in — they're what separate a craft claim from a craft story",
      "Cocktails treated as a proper section, because that's what people search for",
    ],
    visual: "photo",
    img: "https://images.ctfassets.net/sl666vhlv2bs/310T6d6Tkac1txQAEvNLWj/eccb80c877c0d408a6d608b0f6f3bd28/items-3.png",
    alt: "Aviation American Gin in-flight entertainment section",
  },
];

const LEXICON: { a: string; b: string }[] = [
  { a: "Cocktail recipes", b: "In-Flight Menu" },
  { a: "Brand content", b: "In-Flight Entertainment" },
  { a: "Where to buy", b: "Find your Gate" },
  { a: "Drink responsibly", b: "Please Fly Responsibly" },
  { a: "Smooth finish", b: "Non-Stop Smooth" },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "Voice is part of the codebase",
    text: "Reading an inherited system means reading its language as carefully as its architecture. The vocabulary is a specification, even though nobody wrote it down as one.",
  },
  {
    title: "The plane earns its keep",
    text: "A parallax aircraft moving through the page sounds like decoration. On a brand whose whole promise is flight, it's the thing that makes the metaphor physical rather than written.",
  },
  {
    title: "Restraint in the right places",
    text: "The theme stops where it should. The production section states botanicals and proof plainly, because craft credibility is undermined by wordplay.",
  },
  {
    title: "Compliance stays literal",
    text: 'The mandatory legal elements are exactly as required, unstyled by the metaphor. "Please Fly Responsibly" sits alongside them rather than replacing anything it shouldn\'t.',
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "Handover",
    title: "Learn before touching",
    text: "Map the system, document it, and identify the parts nobody should change without understanding why they're there. Ask the previous team the questions only they can answer, while they're still reachable.",
  },
  {
    n: "Standing",
    title: "Same people, every time",
    text: "The engineers who learned the platform are the ones who work on it. Rotating people through an inherited codebase means paying the learning cost repeatedly, and the client pays it in mistakes.",
  },
  {
    n: "Campaigns",
    title: "Ready before the brief arrives",
    text: "Seasonal moments are known in advance even when the creative isn't. Structure and capacity are arranged ahead of the date rather than in response to it.",
  },
  {
    n: "Between",
    title: "The maintenance nobody briefs",
    text: "Dependency updates, performance, accessibility, privacy rule changes, platform deprecations. The work that prevents the emergency rather than responding to it.",
  },
  {
    n: "Always",
    title: "Improve without being asked",
    text: "An inherited site accumulates small debts. We fix them as we pass through, so the platform gets steadily better rather than steadily older.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Parallax & scroll effects", "Responsive layouts"] },
  { title: "Content", items: ["Contentful", "Campaign content types", "Brand-team publishing", "Cocktail recipe library"] },
  { title: "Compliance", items: ["Age verification", "Cookie consent management", "US privacy request route", "Accessibility standards"] },
  { title: "Support", items: ["Campaign delivery", "Dependency & security updates", "Performance monitoring", "Documented handover"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/taffers-browned-butter-bourbon",
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "An unfamiliar product, and the doubt a site has to answer.",
  },
  {
    href: "/case-studies/tiny-island-cocktails",
    img: "https://images.ctfassets.net/wodp1h6ezq96/5yvC9NqXcvwcEd4H9nZz8G/b724865e217bb082261b82f89f5c8383/HeroPacking.webp",
    alt: "Tiny Island Cocktails",
    k: "Diageo · Brand",
    title: "Tiny Island Cocktails",
    text: "Everyone knows what a Mojito tastes like. The doubt is the can.",
  },
  {
    href: "/case-studies/lone-river",
    img: "https://images.ctfassets.net/gjrhdo7lk84j/6V2YCRZ1XxL5GnOOsvfxJp/dabbf010cac7d50f3dd5bd47621a88e0/Inspired-Section-homepage.webp",
    alt: "Lone River Beverage Company",
    k: "Drinks · Brand",
    title: "Lone River",
    text: "The store locator is the product page.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#2F6FA8" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold uppercase" style={{ color }}>
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
          dark ? "text-white" : "text-[#0D1826]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A3B0C2]" : "text-[#546376]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#2F6FA8" }: { color?: string }) {
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

/** The reference's `.lex` — a small table mapping ordinary interface words to Aviation's own in-world vocabulary. */
function LexTable() {
  return (
    <div className="mt-6.5 overflow-hidden rounded-2xl border border-[#E3E9F1] bg-white">
      {LEXICON.map((row, index) => (
        <div
          key={row.a}
          className={cx(
            "grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 px-5 py-3.5",
            index > 0 && "border-t border-[#F2F5F9]"
          )}
        >
          <span className="text-[14.5px] text-[#8794A6]">{row.a}</span>
          <span aria-hidden className="text-[#2F6FA8]/60">
            →
          </span>
          <span className="text-right text-[15.5px] font-extrabold tracking-[-0.02em] text-[#0D1826]">{row.b}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   BREADCRUMB
========================================================= */

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="bg-[#070D17] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E7C8E] uppercase">
          <li>
            <Link href="/" className="text-[#9EACBD] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9EACBD] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Aviation American Gin</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ mainBanner }: { mainBanner?: string }) {
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
      className="relative overflow-hidden bg-gradient-to-br from-[#070D17] to-[#132132] pt-12 text-[#E9EEF5] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(143,184,220,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#3879B2] uppercase">
          Case study · Diageo · Aviation American Gin
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          The hardest platform to change is one you didn&apos;t build.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A3B0C2]">
          Aviation came to us already live. We&apos;re the team that keeps it current — seasonal launches, limited
          editions and campaign moments shipped into a codebase we inherited, at the pace a brand famous for fast
          marketing actually moves. Taking over someone else&apos;s platform well is a different discipline from
          building your own, and it&apos;s the one this project is about.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#070D17] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#6E7C8E] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#E9EEF5]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.aviationgin.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#3879B2] hover:bg-[#3879B2]/12 sm:mb-12"
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
          className="overflow-hidden rounded-t-[10px] aspect-[1672/941] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src={
              mainBanner ??
              ""
            }
            alt="Aviation American Gin — the official gin of your favorite cocktail"
            aria-hidden
            className="h-full w-full object-cover"
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
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E3E9F1] bg-[#E3E9F1] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#2F6FA8]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#546376]">{item.l}</div>
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
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="A fast brand on a platform we didn't write." headingLevel="h2" narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0D1826]">
          Aviation American Gin built its reputation on speed. The marketing moves at cultural pace — a moment
          happens, and the brand responds while it still matters. That&apos;s a rare thing for a drinks company,
          and it sets an unusual expectation of everything downstream, including the website.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546376]">
          We came to it after launch. Somebody else made the architectural decisions, chose the content model,
          wired the integrations and wrote the animation layer. Our job wasn&apos;t to admire it or replace it —
          it was to understand it well enough to change it safely, quickly, and without a settling-in period the
          brand couldn&apos;t afford.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546376]">
          There&apos;s a reason most agencies quietly propose a rebuild in this situation. It&apos;s easier to
          start again than to learn someone else&apos;s system, and it&apos;s far more profitable. It&apos;s also
          almost always the wrong advice.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#2F6FA8] bg-[#EAF2FA] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0D1826]">
            The platform worked. It didn&apos;t need replacing — it needed a team who could move confidently inside
            it. That was the whole brief, and it&apos;s harder than it sounds.
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
    <section className="bg-gradient-to-b from-[#EFF4FA] to-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three things that make inherited work different."
            headingLevel="h2"
            lede="None of these appear when you build something yourself, and all three decide whether a handover succeeds."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3E9F1] bg-[#E3E9F1] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#2F6FA8]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0D1826] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#546376]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE DO
========================================================= */

function WhatWeBuiltSection({ galleryImages = [] }: { galleryImages?: string[] }) {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we do"
            title="Read first, then ship continuously."
            headingLevel="h2"
            lede="The work divides into two halves — the disciplined start, and everything since."
            narrow={false}
          />
        </div>

        <div className="mt-10 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          {BUILT_ROWS.map((row, index) => (
            <BuiltRow key={row.n} row={row} image={galleryImages[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** `image` overrides `row.img` when a matching Contentful gallery entry resolved (see `galleryImages` in the default export below) — but only for a `"photo"` row; the `"diagram"` row ignores it entirely, since there's no photo slot there for a gallery entry to fill. */
function BuiltRow({ row, image }: { row: BuiltRow; image?: string }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-semibold text-[12px] text-[#2F6FA8]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0D1826] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#546376]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#546376]",
                index > 0 && "border-t border-[#F2F5F9]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {row.visual === "diagram" && (
        <div
          ref={mediaRef}
          className="rounded-[18px] border border-[#E3E9F1] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(13,24,38,0.2)] sm:p-7"
        >
          <HandoverDiagram />
        </div>
      )}

      {row.visual === "photo" && (
        <div
          ref={mediaRef}
          className="overflow-hidden rounded-[15px] shadow-[0_20px_46px_-22px_rgba(13,24,38,0.22)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img src={image ?? row.img} alt={row.alt} loading="lazy" className="block aspect-[1162/1353] w-full object-cover" />
        </div>
      )}
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#070D17] to-[#132132] px-5 py-14 text-[#E9EEF5] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(143,184,220,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px] mx-auto">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#3879B2"
            headingLevel="h3"
            title="Every new thing needs its aviation word."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A3B0C2]">
            Most brand sites keep the theme in the imagery and use ordinary words for the interface. Aviation
            doesn&apos;t. The cocktails page is the <strong className="font-semibold text-white">In-Flight Menu</strong>.
            The content section is <strong className="font-semibold text-white">In-Flight Entertainment</strong>.
            Where to buy asks you to <strong className="font-semibold text-white">find your Gate</strong>. Even the
            legally required responsibility message is{" "}
            <strong className="font-semibold text-white">Please Fly Responsibly</strong>.
          </p>
          <p className="mb-4.5 text-[16px] leading-[1.8] text-[#A3B0C2]">
            That commitment is why the brand feels like itself. It also means{" "}
            <strong className="font-semibold text-white">
              you cannot add anything to this site in plain English.
            </strong>{" "}
            Every new section, button and label has to find its place in the metaphor — and getting it slightly
            wrong is more visible to a visitor than a bug would be.
          </p>
          <LexTable />
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#070D17] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9EACBD]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW WE WORK
========================================================= */

function HowWeWorkedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we work"
            title="A support model, not a project plan."
            headingLevel="h3"
            lede="Ongoing work has a different shape from a build. There's no kickoff and no launch — just a standing capability that has to be reliable in both directions."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E3E9F1] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[86px_1fr] gap-4 p-6 sm:grid-cols-[110px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E3E9F1]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#2F6FA8]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0D1826] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#546376]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT THIS PROVES
========================================================= */

function StillOursSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#070D17] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(143,184,220,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What this proves"
              eyebrowColor="#3879B2"
              headingLevel="h3"
              title="Not every good outcome starts with a rebuild."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A3B0C2]">
              The most profitable advice we could have given was that the platform needed replacing. It
              didn&apos;t. It needed a team willing to learn it properly and then move quickly inside it — which is
              less lucrative, less visible, and considerably more useful to the client.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A3B0C2]">
              If you&apos;re carrying a platform that works but has no team behind it, that&apos;s a situation we
              recognise. Inheriting well is a skill, and we&apos;d rather be judged on how confidently we move in
              someone else&apos;s code than on how quickly we suggest starting again.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#3879B2]">
              {"Inherited,\nthen improved"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9EACBD]">
              Campaign delivery, seasonal launches, maintenance and steady improvement — from a team that learned
              the platform rather than replacing it.
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
    <section className="bg-gradient-to-b from-[#EFF4FA] to-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Someone else's choices, well understood."
            headingLevel="h4"
            lede="We didn't select this stack. Part of taking a platform on is being fluent in decisions you'd perhaps have made differently, and honest about which ones are worth revisiting."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#2F6FA8] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#546376]", index > 0 && "border-t border-[#F2F5F9]")}>
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

type RelatedItem = (typeof RELATED)[number];

const RELATED_DESCRIPTION_MAX_LENGTH = 150;

/**
 * Truncates to at most `max` characters, trimmed back to the nearest word
 * boundary so a cut never lands mid-word, and suffixed with "…". Text
 * already at or under the limit passes through unchanged, no ellipsis
 * added.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Maps one `contentDetail` entry (`contentDetailEntries[1]`/`[2]`/`[3]` —
 * `[0]` is this case study's own hero/gallery source, see the default
 * export below) to one `RelatedSection` card. Same field convention
 * `CaseStudiesListing`'s own card mapping uses elsewhere in this app:
 * `heroImage` for the photo, `category` for the small tag, `title`/
 * `shortDescription` for the copy (capped at
 * `RELATED_DESCRIPTION_MAX_LENGTH` characters, via `truncate`, so a long
 * editor-written description can't unbalance the 3-up card grid), and a
 * link resolved from `cta` (preferred) or else `/case-studies/<slug>`.
 * Returns `undefined` for a missing entry or one with no `heroImage` — a
 * related card with no photo would look broken here, so it's dropped
 * rather than shown empty.
 */
function resolveRelatedItem(entry: PlainEntry<ContentDetailSkeleton> | undefined): RelatedItem | undefined {
  if (!entry) {
    return undefined;
  }

  const heroImageEntry = entry.fields.heroImage;
  const img = heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  if (!img) {
    return undefined;
  }

  const ctaEntry = entry.fields.cta?.find((link) => link && "fields" in link) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref = ctaEntry
    ? ctaEntry.fields.externalUrl || (ctaEntry.fields.linkedPage ? `/${ctaEntry.fields.linkedPage}` : undefined)
    : undefined;

  return {
    href: ctaHref ?? (entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#"),
    img,
    alt: entry.fields.title ?? "",
    k: entry.fields.category ?? entry.fields.clientName ?? "",
    title: entry.fields.title ?? "",
    text: entry.fields.shortDescription ? truncate(entry.fields.shortDescription, RELATED_DESCRIPTION_MAX_LENGTH) : "",
  };
}

/** Falls back to the static `RELATED` list when `related` is unset or empty — i.e. until a page's composableElement actually has `contentDetailEntries[1]`/`[2]`/`[3]` set (see `resolveRelatedItem`/the default export below). */
function RelatedSection({ related }: { related?: RelatedItem[] }) {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);
  const items = related?.length ? related : RELATED;

  return (
    <section className="bg-[#FBFCFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E3E9F1] bg-white hover:-translate-y-1 hover:border-[#C2D5E7] hover:shadow-[0_20px_44px_-20px_rgba(13,24,38,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-semibold text-[12px] text-[#2F6FA8] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0D1826] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#546376]">{item.text}</p>
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

export default function AviationGinCaseStudy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const heromainEntry = contentDetailEntries[0];
  const heroImageEntry = heromainEntry?.fields.heroImage;
  const mainBanner =
    heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  // `gallery` is an array of `dataImage` *entries*, not raw assets — same
  // "resolve the entry, then its own `image` field" two-step
  // `heroImageEntry` above already uses. One resolved entry becomes one
  // `BuiltRow`'s photo, matched by position: the first gallery image
  // overrides `BUILT_ROWS[0].img` (the diagram row — `BuiltRow` never
  // reads it there), the second overrides `BUILT_ROWS[1].img`, and so
  // on. A photo row with no corresponding gallery entry keeps its own
  // static `img` unchanged (see `WhatWeBuiltSection`/`BuiltRow`'s own
  // `image` prop above).
  const galleryImages = (heromainEntry?.fields.gallery ?? [])
    .map((image) => (image && "fields" in image ? getAssetUrl(image.fields.image) : undefined))
    .filter((url): url is string => Boolean(url));

  // The 3 related-case-study cards, one per entry — `[0]` stays this
  // case study's own hero/gallery source above, so the related cards
  // start at `[1]`. `resolveRelatedItem` drops any that don't resolve
  // (missing entry, or no `heroImage`), and `RelatedSection` falls back
  // to its own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2], contentDetailEntries[3]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FBFCFE]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero mainBanner={mainBanner} />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection galleryImages={galleryImages} />
      <div data-nav-contrast="dark">
        <DetailThatMatteredSection />
      </div>
      <HowWeWorkedSection />
      <div data-nav-contrast="dark">
        <StillOursSection />
      </div>
      <TechnologySection />
      <RelatedSection related={relatedItems} />
    </div>
  );
}
