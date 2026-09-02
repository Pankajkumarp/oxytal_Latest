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

// Contentful wiring — same shape as `DiageoBrandPromoterCaseStudy`'s/
// `TaffersCaseStudy`'s/`CasaFamosaCaseStudy`'s own: `entry.fields.elements`
// may hold up to 4 `contentDetail` entries. `[0]` supplies this case
// study's own hero photo (`heroImage`) and "what we built" gallery
// (`gallery`); `[1]`–`[3]` each become one `RelatedSection` card (see
// `resolveRelatedItem`). Everything here works exactly as before when
// `entry` is omitted or those fields are unset — each piece falls back
// to its own hardcoded default individually.
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
 * `StoopDayzCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-stoop-dayz.html`. Same
 * treatment as its siblings in this folder
 * (`DiageoBrandPromoterCaseStudy`/`TaffersCaseStudy`/`KaneffCaseStudy`/
 * `CasaFamosaCaseStudy`): keeps the reference's own colour identity
 * (`--ink` `#15171C`, `--accent` `#D9502B`, `--accent-2` `#F2895F`, the
 * `--deep-1`/`--deep-2` `#0F1114`/`#1E2229` charcoal gradient) rather
 * than the site's per-page `themeColor` accent, and typography stays the
 * site's own inherited `Poppins`. Every heading size, lede size, and
 * section container width (`max-w-*`) matches its siblings exactly (same
 * "same size as the others" brief as `KaneffCaseStudy`/
 * `CasaFamosaCaseStudy`) — 12px eyebrows, `clamp(28px,3.2vw,40px)`/
 * `leading-[1.2]` h2s, 16px/1.8 ledes, `max-w-7xl` for the wide sections,
 * `max-w-5xl` for the narrow prose ones, `max-w-6xl` for "what we built".
 * Content is still the reference's own hardcoded copy/photography; the
 * only genuine Contentful wiring is the optional `entry` prop (see the
 * doc comment above the `isEntry` helper): a `contentDetail` entry's own
 * `heroImage`/`gallery` can override the hero photo and the "what we
 * built" row photos, and up to 3 more `contentDetail` entries can
 * override the related-case-study cards — each falls back to its own
 * hardcoded default individually when unset.
 *
 * Shape-wise this is closest to `CasaFamosaCaseStudy`: 4 photo "built"
 * rows, no `:nth-of-type(even)` flip rule in the reference, and a "still
 * ours" box holding a two-line value (`whitespace-pre-line`). Unique to
 * this one: the 2nd built row ("The flavours") nests its own 4-up
 * flavour grid (Cherry/Orange/Grape/Root Beer, each a coloured top bar +
 * name + tasting note + ABV) inside its text column, same "nested grid
 * inside one built row" idiom `TaffersCaseStudy`'s awards grid uses.
 *
 * Registered in `ComposableElementRenderer` as subtype `stoopDayz`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every
 * section `<h2>` gets the word-split reveal via `SectionHead`; the
 * hero's own `<h1>` plays on mount instead of on scroll; single-block
 * intros fade up as one unit; card/row grids stagger in per item; each
 * built row's text/photo fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-stoop-dayz.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Stoop Dayz Hard Soda" },
  { k: "Sector", v: "Drinks & FMCG" },
  { k: "Services", v: "Experience Design · Engineering · Integration · Support" },
  { k: "Scope", v: "Designed and built from scratch" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "Built\nfrom scratch", l: "Design, build and launch delivered end to end" },
  { v: "4", l: "Flavours, each with its own shareable link" },
  { v: "Zero", l: "Pop-ups, countdowns or interruption patterns" },
  { v: "—", l: "Retailer lookups since launch" },
  { v: "—", l: "Subscribers captured with consent" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Restraint has to be designed, not just avoided",
    text: "Removing pushy patterns is easy. Still converting afterwards is not. If the site doesn't interrupt anyone, every route to a shop and every reason to subscribe has to be genuinely well placed rather than forced into view.",
  },
  {
    n: "02",
    title: "Here, the flavour is the decision",
    text: "Cherry, orange, grape and root beer are childhood flavours, so the choice is personal and often nostalgic. Unlike a variety pack brand, \"which one\" is the conversation people actually have — and the site had to support it at that level.",
  },
  {
    n: "03",
    title: "Nostalgia is easy to overplay",
    text: "Retro references are one degree away from costume. The design had to feel like an old soda fountain without becoming a pastiche of one, because a brand built on being unpretentious can't afford to look like it's trying.",
  },
];

const FLAVOURS: { name: string; text: string; abv: string; color: string }[] = [
  { name: "Cherry", text: "Classic soda fountain. Maraschino aroma, lemon-lime fizz, notes of pomegranate.", abv: "4.5% ABV", color: "#C4324A" },
  { name: "Orange", text: "Zingy and bright. Ripe orange and citrus peel, zesty and tangy.", abv: "4.5% ABV", color: "#E28A1E" },
  { name: "Grape", text: "Sweet up front, tart on the tail. Big juicy Concord grape throughout.", abv: "4.5% ABV", color: "#7B4B9E" },
  { name: "Root Beer", text: "Creamy vanilla, a little sassafras, a hint of spice. A fizzy throwback.", abv: "4.5% ABV", color: "#8A5A2B" },
];

const BUILT_ROWS: { n: string; title: string; desc: string; bullets: string[]; img: string; alt: string; flavours?: boolean }[] = [
  {
    n: "01 · The arrival",
    title: "The point of view comes first",
    desc: "Most drinks sites open with a product shot and a buy button. This one opens with what the brand actually thinks — a short piece of writing about scheduled lives and unscheduled evenings — because the position is the product differentiator, not the flavour list.",
    bullets: [
      "Copy given room to be read rather than compressed into a strapline",
      "Photography of people on stoops, playing basketball, sharing pizza — the occasion, not the product",
      "A single route onward, offered once, in the place it's wanted",
    ],
    img: "https://images.ctfassets.net/gyddm6ym9nek/1J6skYRtfmon8xQBkWnFyQ/1737f309f17467767983db4940a44cd0/Enjoying_Pizza.webp",
    alt: "A group of people sitting on a stoop with pizza and Stoop Dayz",
  },
  {
    n: "02 · The flavours",
    title: "Four flavours, four addresses",
    desc: "Each flavour has real tasting notes, its own colour and — crucially — its own link. Someone recommending \"the root beer one\" can send a link that lands on root beer, rather than a homepage their friend then has to navigate.",
    bullets: [
      "Direct links to each flavour, reachable from the main navigation",
      "Tasting notes written properly — sassafras, Concord grape, citrus peel",
      "Strength shown plainly on every flavour, not tucked into a footnote",
      "Structured so a fifth flavour is a content addition, not a rebuild",
    ],
    img: "https://images.ctfassets.net/gyddm6ym9nek/um4s3SCNICRlshekyNdHp/78cabc3e0c1b18507ab155b80a475f19/Cherry-hard-soda-optimized.webp",
    alt: "A glass of Cherry Stoop Dayz Hard Soda with ice",
    flavours: true,
  },
  {
    n: "03 · The shop",
    title: "Grab a case, no plans required",
    desc: "The route to purchase carries the brand's own voice rather than switching to transactional language at the last moment. It's reachable from anywhere, offered rather than pushed, and hands people to the retail channel that actually sells the product.",
    bullets: [
      "Retailer lookup in the navigation, present on every page",
      "No competing checkout to build, maintain or split effort across",
      "Tone held all the way to the last screen",
    ],
    img: "https://images.ctfassets.net/gyddm6ym9nek/5AWuuw57Foxx0j9rD2IjaV/b533978ca00e05f9d9aef9c63e7c8c71/Cane-Stack.webp",
    alt: "A stack of Stoop Dayz Hard Soda cans",
  },
  {
    n: "04 · The audience",
    title: "Subscribe, as a page rather than an ambush",
    desc: "The email list still matters — it's the audience for the next flavour and the summer campaign. So it gets a proper page that someone chooses to visit, instead of a dialogue that lands on top of what they were reading. Fewer sign-ups per visit, from people who actually meant it.",
    bullets: [
      "Its own destination in the navigation, never an interruption",
      "Permission recorded at the moment it's given, with the region attached",
      "Marketing profile and customer record created together, consent attached",
      "Withdrawal flowing back to every system holding that person",
    ],
    img: "https://images.ctfassets.net/gyddm6ym9nek/6Mb68wdtmh7PUwCCOgV79S/11c3bd2c35219ebf4f12aed0bc0aa9dd/Sitting-all-together-party-hard.webp",
    alt: "A group of people sitting together with Stoop Dayz",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "No dialogue arrives uninvited",
    text: "Subscribing is a page you choose to visit. It converts a smaller share of visits, from people who genuinely wanted it — which is a better list for the campaigns that follow.",
  },
  {
    title: "Nothing follows you down the page",
    text: "No sticky bars, no re-appearing prompts. The navigation is always there, which is enough. Someone who wants a shop can find one in one tap from anywhere.",
  },
  {
    title: "Language without pressure",
    text: "\"Grab a case, no plans required\" instead of limited time, don't miss out, act now. The invitation does the work that urgency usually does, and it fits the brand rather than fighting it.",
  },
  {
    title: "Motion that relaxes",
    text: "The gallery drifts rather than snapping between slides. It's a small thing that sets the pace of the whole page, and it's the difference between a site that feels calm and one that just looks calm.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Agree what the brand won't do",
    text: "Before wireframes, an explicit list of patterns ruled out — pop-ups, urgency language, anything that interrupts. Agreeing that upfront stopped it being relitigated every time a conversion number came up.",
  },
  {
    n: "02",
    title: "Design the routes instead",
    text: "With interruption off the table, every path to a shop or a sign-up had to be well placed rather than forced. That's harder, and it's the actual craft of the project.",
  },
  {
    n: "03",
    title: "Give each flavour an address",
    text: "Direct links into each flavour so recommendations land where they were meant to, and so a campaign can point at cherry without sending everyone to the homepage.",
  },
  {
    n: "04",
    title: "Build for phones and for the brand team",
    text: "Art-directed imagery for each screen size rather than one crop squeezed down, and content the brand team publishes themselves — new flavours, campaign assets, seasonal updates.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. Campaign moments, new content, performance work and platform maintenance delivered as ongoing work rather than a change request each time.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Art-directed responsive images", "Mobile-first layouts"] },
  { title: "Content", items: ["Contentful", "Structured flavour content", "Brand-team publishing", "Locale-aware routing"] },
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
    href: "/case-studies/diageo-brand-promoter",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/brandpromotor.webp",
    alt: "Diageo Brand Promoter platform",
    k: "Diageo · Compliance",
    title: "Brand Promoter Standard",
    text: "Conduct and safeguarding training in 17 languages.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#D9502B" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#15171C]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#AEB5C2]" : "text-[#5C6270]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#D9502B" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#0F1114] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#767C89] uppercase">
          <li>
            <Link href="/" className="text-[#A8AEBB] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#A8AEBB] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Stoop Dayz</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#0F1114] to-[#1E2229] pt-12 text-[#EDEFF3] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(242,137,95,.22), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#F2895F] uppercase">
          Case study · Diageo · Stoop Dayz Hard Soda
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          The brand says take it easy. Websites are built to push.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#AEB5C2]">
          Stoop Dayz is hard soda for people with no plans — &ldquo;all flavor, no fuss&rdquo;, built on the idea
          that the best moments were never scheduled. Almost every default move in web marketing works against
          that. Pop-ups, countdowns, urgency, sign-up interruptions. We designed the site without any of them, and
          made it earn attention rather than demand it.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#0F1114] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#767C89] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#EDEFF3]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.stoopdayzhardsoda.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#F2895F] hover:bg-[#F2895F]/12 sm:mb-12"
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
          className="overflow-hidden aspect-[1672/941] rounded-t-[10px] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src={mainBanner ?? ""}
            alt="Stoop Dayz Hard Soda cans in cherry, orange, grape and root beer"
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
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E9E5DD] bg-[#E9E5DD] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#D9502B]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#5C6270]">{item.l}</div>
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
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="Selling &quot;no plans required&quot; without pushing." headingLevel="h2" narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#15171C]">
          Stoop Dayz has a genuine point of view. The world is obsessed with being busy — more plans, more
          pressure, more noise — and the best times usually started with none of it. Just people on a stoop and a
          couple of cold ones.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#5C6270]">
          That&apos;s a real position, and it puts the brand at odds with how commercial websites normally behave.
          The standard toolkit is built on manufactured urgency: an email pop-up two seconds after arrival, a
          banner that follows you down the page, language designed to make you act now. Every one of those would
          have told a visitor that this brand doesn&apos;t mean what it says.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#5C6270]">
          Underneath sat the ordinary commercial requirements. It still has to explain four flavours, get people
          to a shop, collect an audience for the next campaign, and satisfy Diageo&apos;s compliance rules on
          every page. None of that goes away because the tone is relaxed.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#D9502B] bg-[#FDEFE9] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#15171C]">
            A brand about slowing down can&apos;t have a site that hurries you. That sounds like a copy decision.
            It&apos;s actually a structural one, and it had to be made before anything was designed.
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
    <section className="bg-gradient-to-b from-[#FBF6EF] to-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three problems hiding behind a simple brief."
            headingLevel="h2"
            lede="&quot;Build a site for a hard soda brand&quot; is a two-line brief. These are the parts that actually took the thinking."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E9E5DD] bg-[#E9E5DD] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#D9502B]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#15171C] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#5C6270]">{card.text}</p>
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

function WhatWeBuiltSection({ galleryImages = [] }: { galleryImages?: string[] }) {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="A site that gets out of the way."
            headingLevel="h2"
            lede="Home, Flavors, Where to Buy, Subscribe, Contact. Each one does a job, and none of them chase anybody."
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

/** `image` overrides `row.img` when a matching Contentful gallery entry resolved (see `galleryImages` in the default export below); falls back to the row's own static photo otherwise. */
function BuiltRow({ row, image }: { row: (typeof BUILT_ROWS)[number]; image?: string }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-semibold text-[12px] text-[#D9502B]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#15171C] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#5C6270]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#5C6270]",
                index > 0 && "border-t border-[#F6F3ED]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>

        {row.flavours && (
          <div className="mt-7.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FLAVOURS.map((flavour) => (
              <div
                key={flavour.name}
                className="overflow-hidden rounded-2xl border border-[#E9E5DD] bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(21,23,28,0.22)]"
              >
                <div aria-hidden className="h-[5px]" style={{ backgroundColor: flavour.color }} />
                <div className="p-5.5">
                  <span className="mb-2 text-[17px] font-bold tracking-[-0.02em] text-[#15171C] block">{flavour.name}</span>
                  <p className="mb-3 text-[14px] leading-[1.6] text-[#5C6270]">{flavour.text}</p>
                  <span className="font-semibold text-[10px] text-[#8D93A1]">{flavour.abv}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        ref={mediaRef}
        className="overflow-hidden rounded-[15px] aspect-[1373/1146] shadow-[0_20px_46px_-22px_rgba(21,23,28,0.22)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
        <img
          src={image ?? row.img}
          alt={row.alt}
          aria-hidden
            className="h-full w-full object-cover"
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1114] to-[#1E2229] px-5 py-14 text-[#EDEFF3] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(242,137,95,.2), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead eyebrow="The detail that mattered" eyebrowColor="#F2895F" headingLevel="h3" title="Every pattern we didn't use." dark />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#AEB5C2]">
            There is a standard set of moves for a consumer brand site, and they&apos;re standard because in
            aggregate they work. An email dialogue after a few seconds. A sticky banner. A second banner when the
            cursor moves toward the tab bar. Copy engineered to create a small amount of anxiety.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#AEB5C2]">
            <strong className="font-semibold text-white">
              Used here, every one of them would have contradicted the product.
            </strong>{" "}
            A brand telling you the best moments aren&apos;t scheduled cannot interrupt you eight seconds in to
            ask for your email. So the constraint we set at the start was that nothing on this site would demand
            attention — and everything had to still work anyway.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#0F1114] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#A8AEBB]">{card.text}</p>
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
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="The tone was a requirement, not a finish."
            headingLevel="h3"
            lede="On most projects, brand voice is applied to a structure that already exists. Here it had to shape the structure, which meant settling it before anything was designed."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E9E5DD] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E9E5DD]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#D9502B]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#15171C] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#5C6270]">{phase.text}</p>
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
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#0F1114] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(242,137,95,.2), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead eyebrow="What happened next" eyebrowColor="#F2895F" headingLevel="h3" title="Restraint is easy to erode." dark narrow={false} />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#AEB5C2]">
              A decision not to interrupt people is only as durable as the team defending it. Six months after
              launch, someone will suggest a pop-up because a number needs moving — and if nobody remembers why it
              was ruled out, it goes in and the brand quietly stops meaning what it says.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#AEB5C2]">
              We&apos;re still on the site. The team that designed it is the team that publishes to it, which is
              how a position taken at the start survives contact with the second year.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#F2895F]">
              {"Designed,\nbuilt, supported"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#A8AEBB]">
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
    <section className="bg-gradient-to-b from-[#FBF6EF] to-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Fast on a phone, editable in an afternoon."
            headingLevel="h4"
            lede="A brand site is judged on two things: whether it appears before someone's thumb moves on, and whether the marketing team can change it without booking developer time."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#D9502B] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#5C6270]", index > 0 && "border-t border-[#F6F3ED]")}>
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

const RELATED_DESCRIPTION_MAX_LENGTH = 400;

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
    <section className="bg-[#FDFBF7] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E9E5DD] bg-white hover:-translate-y-1 hover:border-[#E5C7B8] hover:shadow-[0_20px_44px_-20px_rgba(21,23,28,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="text-[12px] font-semibold text-[#D9502B] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[20px] font-extrabold text-[#15171C] block">{item.title}</span>
                <p className="text-[15px] leading-[1.75] text-[#5C6270]">{item.text}</p>
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

export default function StoopDayzCaseStudy({ entry }: Props) {
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
  // overrides `BUILT_ROWS[0].img`, the second overrides
  // `BUILT_ROWS[1].img`, and so on — a row with no corresponding
  // gallery entry keeps its own static `img` unchanged (see
  // `WhatWeBuiltSection`/`BuiltRow`'s own `image` prop above).
  const galleryImages = (heromainEntry?.fields.gallery ?? [])
    .map((image) => (image && "fields" in image ? getAssetUrl(image.fields.image) : undefined))
    .filter((url): url is string => Boolean(url));

  // The 3 related-case-study cards, one per entry — `[0]` stays this
  // case study's own hero/gallery source above, so the related cards
  // start at `[1]`. `resolveRelatedItem` drops any that don't resolve
  // (missing entry, or no `heroImage`), and `RelatedSection` falls back
  // to its own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FDFBF7]">
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
