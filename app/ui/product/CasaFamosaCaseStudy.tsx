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
// `TaffersCaseStudy`'s own: `entry.fields.elements` may hold up to 4
// `contentDetail` entries. `[0]` supplies this case study's own hero
// photo (`heroImage`) and "what we built" gallery (`gallery`); `[1]`–
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
 * `CasaFamosaCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-casa-famosa.html`. Same
 * treatment as its siblings in this folder
 * (`DiageoBrandPromoterCaseStudy`/`TaffersCaseStudy`/`KaneffCaseStudy`):
 * keeps the reference's own colour identity (`--ink` `#1B0E17`,
 * `--accent` `#D93A72`, `--accent-2` `#FF8FB8`, the `--deep-1`/
 * `--deep-2` `#150A12`/`#2C1224` plum gradient) rather than the site's
 * per-page `themeColor` accent, and typography stays the site's own
 * inherited `Poppins`. Every heading size, lede size, and section
 * container width (`max-w-*`) matches its siblings exactly (same "same
 * size as the others" brief as `KaneffCaseStudy`) — 12px eyebrows,
 * `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8 ledes,
 * `max-w-7xl` for the wide sections, `max-w-5xl` for the narrow prose
 * ones, `max-w-6xl` for "what we built". Content is still the
 * reference's own hardcoded copy/photography; the only genuine
 * Contentful wiring is the optional `entry` prop (see the doc comment
 * above the `isEntry` helper): a `contentDetail` entry's own
 * `heroImage`/`gallery` can override the hero photo and the "what we
 * built" row photos, and up to 3 more `contentDetail` entries can
 * override the related-case-study cards — each falls back to its own
 * hardcoded default individually when unset.
 *
 * Shape-wise this one is closest to `TaffersCaseStudy`: 4 "built" rows
 * (photography, not `KaneffCaseStudy`'s SVG diagrams), no
 * `:nth-of-type(even)` flip rule in the reference so `BuiltRow` doesn't
 * take a `flip` option, and a "still ours" box holding a two-line value
 * (`whitespace-pre-line`) rather than a single big number.
 *
 * Registered in `ComposableElementRenderer` as subtype `casaFamosa`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every
 * section `<h2>` gets the word-split reveal via `SectionHead`; the
 * hero's own `<h1>` plays on mount instead of on scroll; single-block
 * intros fade up as one unit; card/row grids stagger in per item; each
 * built row's text/photo fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-casa-famosa.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Casa Famosa" },
  { k: "Sector", v: "Drinks & FMCG · new brand launch" },
  { k: "Services", v: "Experience Design · Engineering · Integration · Support" },
  { k: "Scope", v: "Designed and built from scratch" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "Built\nfrom scratch", l: "Design, build and launch delivered end to end" },
  { v: "6", l: "Pages — deliberately, nothing more" },
  { v: "4", l: "Flavours merchandised as one pack" },
  { v: "—", l: "Retailer lookups since launch" },
  { v: "—", l: "Sign-ups captured with consent" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The brand is loud. The rules are not.",
    text: "Casa Famosa is built on colour, movement and personality. Diageo's requirements arrive first as an age check, then as mandatory legal elements on every page. Two opposite energies that had to occupy the same screen without either one losing.",
  },
  {
    n: "02",
    title: "The brand is made of pictures",
    text: "Photography, pack shots, patterns, movement — it's a visual brand and that's correct. Images are also the single biggest reason a page is slow, and a slow page loses someone arriving from social before it renders at all.",
  },
  {
    n: "03",
    title: "Cultural voice you can't approximate",
    text: "The brand speaks with a Latino inflection that has to feel authentic rather than borrowed. That's a content and structural decision as much as a copy one — it shapes what the site says and in what order.",
  },
];

const BUILT_ROWS: { n: string; title: string; desc: string; bullets: string[]; img: string; alt: string }[] = [
  {
    n: "01 · The arrival",
    title: "Say what it is before anything else",
    desc: "Someone landing from social has no idea what an agua fresca is, whether it contains alcohol, or why it isn't fizzy. So the answer arrives immediately — real juice, agave spirit, no fizz — as artwork rather than a paragraph, because nobody reads a paragraph at that moment.",
    bullets: [
      "The product proposition answered in three words, visually",
      "People in the frame from the first image — this is a drink for company",
      "A moving gallery that reads as continuous with the social feed they came from",
    ],
    img: "https://images.ctfassets.net/twkb5au85wu1/4UnLBu3yLhdaJ8dgv2F8jL/55ef0ba7581500316a87dcdd2c977398/mid-banner.webp",
    alt: "Real juice, agave spirit, no fizz — the Casa Famosa proposition shown as artwork",
  },
  {
    n: "02 · The flavours",
    title: "Four flavours, one decision",
    desc: "At launch the pack is the product. Pineapple, mango, watermelon and strawberry are shown together, because the first purchase is the variety pack and the choice a shopper makes is whether to try Casa Famosa at all — not which can to pick.",
    bullets: [
      "The pack merchandised as the hero, not four separate products",
      "Colour used to tell them apart at shelf-recognition speed",
      "Structured so a new flavour is a content addition, not a rebuild",
    ],
    img: "https://images.ctfassets.net/twkb5au85wu1/13bmqpOiBCkRHLCLuSNOtx/5bcaf0edb499aea0cd9bc070fefd6c0d/banner-product-img.webp",
    alt: "Casa Famosa cans in pineapple, mango, watermelon and strawberry",
  },
  {
    n: "03 · The shelf",
    title: "Put yourself on the map",
    desc: "This is the conversion point of the entire site. The moment someone decides they want to try it, the design's only remaining job is to tell them where — quickly, on a phone, wherever they happen to be standing.",
    bullets: [
      "Retailer lookup reachable from every page, never buried",
      "Given the brand's own voice rather than treated as a utility page",
      "No competing checkout — the retail channel does the selling",
    ],
    img: "https://images.ctfassets.net/twkb5au85wu1/1BZOtrwxsgaIEhujn3o4XZ/456e161f1342547a223fc86ca7608406/gal-3.webp",
    alt: "People enjoying Casa Famosa together",
  },
  {
    n: "04 · The relationship",
    title: "Sign-ups that carry permission with them",
    desc: "For a launch, an email address is worth more than a single sale — it's the audience for flavour two and the summer campaign. So the sign-up had to be properly wired into the marketing and customer systems, with consent travelling alongside the person.",
    bullets: [
      "Permission recorded at the moment it's given, with the region attached",
      "Marketing profile and customer record created together, not separately",
      "Withdrawal flowing back to every system holding that person",
    ],
    img: "https://images.ctfassets.net/twkb5au85wu1/7kLETvqTuzHr8d38DXWyTy/dd4369b45218968a187407287d4bedcc/gal-1.webp",
    alt: "Someone holding a Casa Famosa pack",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "The art direction was never the variable",
    text: "We didn't reduce the number of images or soften the design to hit a speed number. The photography is the product experience — it stays, and the engineering works around it.",
  },
  {
    title: "Pages arrive already rendered",
    text: "Content is served ready to read rather than assembled in the browser after arrival, so the first thing a visitor sees is the brand rather than a loading state.",
  },
  {
    title: "Every image sized for the device asking",
    text: "A phone is never sent a desktop-sized photograph. Modern formats and per-device sizing carry most of the weight saving, invisibly.",
  },
  {
    title: "Tested where it's actually used",
    text: "On real phones over mobile data, not on office broadband with a laptop — which is the condition under which almost every brand site is signed off and almost none are used.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Agree the site's actual job",
    text: "Not \"raise awareness\" — something testable. Take someone from a scroll to a shelf, and capture the ones who aren't ready to buy yet. Everything got measured against those two.",
  },
  {
    n: "02",
    title: "Cut the scope, deliberately",
    text: "No commerce, no recipes, no loyalty mechanic, no long-form content. Each was considered and dropped, because the retail channel does the selling and year one is about trial.",
  },
  {
    n: "03",
    title: "Design for a phone held in one hand",
    text: "Most visitors arrive from Instagram or Facebook, mid-scroll. Every layout decision was made at that width first and adapted upward, rather than the other way round.",
  },
  {
    n: "04",
    title: "Build so the brand team can move",
    text: "Content managed independently, so a new flavour, a campaign asset or a seasonal update happens in an afternoon. A launch brand changes constantly in its first year — the site had to keep up without us.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. Campaign moments, new content, performance work and platform maintenance delivered as ongoing work rather than a change request each time.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Optimised imagery", "Mobile-first layouts"] },
  { title: "Content", items: ["Contentful", "Structured content types", "Brand-team publishing", "Locale-aware routing"] },
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
    href: "/case-studies/taffers-browned-butter-bourbon",
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon",
    k: "Diageo · Brand",
    title: "Taffer's Browned Butter Bourbon",
    text: "An unfamiliar product, and the doubt a site has to answer.",
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

function Eyebrow({ children, color = "#D93A72" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#1B0E17]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#C9B2C0]" : "text-[#6B5A65]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#D93A72" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#150A12] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#8C7182] uppercase">
          <li>
            <Link href="/" className="text-[#BCA3B2] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#BCA3B2] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Casa Famosa</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#150A12] to-[#2C1224] pt-12 text-[#F7EDF3] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,143,184,.26), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#FF8FB8] uppercase">
          Case study · Diageo · Casa Famosa
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[20ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Nobody searches for a brand they&apos;ve never heard of.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#C9B2C0]">
          Casa Famosa Hard Agua Frescas launched into the most crowded shelf in drinks, with no reputation, no
          reviews and no awards to trade on. A launch site can&apos;t be found by name, because nobody knows the
          name yet. Its only job is to convert the moment someone <em>does</em> arrive — from a post, a friend, a
          can they spotted — into a shelf they can walk to.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#150A12] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#8C7182] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#F7EDF3]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.drinkcasafamosa.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#FF8FB8] hover:bg-[#FF8FB8]/12 sm:mb-12"
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
            alt="Friends sitting together with Casa Famosa cans on the table"
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#F0E2E9] bg-[#F0E2E9] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#D93A72]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#6B5A65]">{item.l}</div>
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="A launch has nothing to trade on." narrow={false} headingLevel="h2" />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#1B0E17]">
          Casa Famosa is a fresh take on a traditional agua fresca — premium Mexican agave spirit, real juice, no
          fizz — in four flavours built to be shared. Everything about it is designed for a moment with other
          people.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#6B5A65]">
          But it arrived into ready-to-drink, which is the most contested category in the industry. An
          established brand can lean on reviews, awards, or the fact that someone&apos;s already tried it. A
          launch has none of that. There&apos;s no reputation to borrow and no search demand for a name nobody
          has heard.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#6B5A65]">
          So the traffic doesn&apos;t come looking for the brand. It comes from a post someone scrolled past, a
          friend&apos;s recommendation, or a can spotted in a fridge — arriving on a phone, mid-scroll, with the
          patience that implies. And the actual purchase happens somewhere else entirely: in a shop, days later.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#D93A72] bg-[#FDECF3] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#1B0E17]">
            The site isn&apos;t a shop and was never going to be one. It exists to take someone from vaguely
            curious to standing in front of the right fridge. Everything else would be decoration.
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
    <section className="bg-gradient-to-b from-[#FDF2F7] to-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            headingLevel="h2"
            title="Three tensions to hold at once."
            lede="A launch site looks like the simplest kind of project. It's simple to describe and unforgiving to get wrong, because there's no existing audience to absorb the mistakes."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#F0E2E9] bg-[#F0E2E9] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#D93A72]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#1B0E17] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#6B5A65]">{card.text}</p>
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="Six pages, and a reason for every one."
            headingLevel="h2"
            lede="Home, Flavors, Our Story, Where To Buy, Join Us, Contact. Nothing was added because brand sites usually have it, and quite a lot was left out for the same reason."
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
        <span className="mb-3.5 block font-semibold text-[12px] text-[#D93A72]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#1B0E17] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#6B5A65]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#6B5A65]",
                index > 0 && "border-t border-[#FBF3F7]"
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
        className="overflow-hidden aspect-[1373/1146] rounded-[15px] shadow-[0_20px_46px_-22px_rgba(27,14,23,0.22)]"
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#150A12] to-[#2C1224] px-5 py-14 text-[#F7EDF3] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,143,184,.22), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#FF8FB8"
            headingLevel="h3"
            title="The brand is made of pictures. Pictures make pages slow."
            dark
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#C9B2C0]">
            Casa Famosa&apos;s whole identity is visual — photography of people, pack shots, patterns, colour,
            movement. Stripping that back to make the page fast would have destroyed the thing we were hired to
            build. But a visitor arriving from a social post on a mid-range phone gives a page a couple of seconds
            before their thumb moves on, and{" "}
            <strong className="font-semibold text-white">
              for a launch every one of those is a person who may never come back.
            </strong>
          </p>
          <p className="text-[16px] leading-[1.8] text-[#C9B2C0]">
            So the tension was never resolved by choosing a side. It was engineered.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#150A12] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#BCA3B2]">{card.text}</p>
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Scoped tightly, on purpose."
            headingLevel="h3"
            lede="The most valuable decisions on this project were about what not to build. A launch budget spent on features nobody uses is a launch budget not spent on being found."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#F0E2E9] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#F0E2E9]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#D93A72]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#1B0E17] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#6B5A65]">{phase.text}</p>
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#150A12] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,143,184,.22), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#FF8FB8"
              headingLevel="h3"
              title="Year one is when a launch brand changes most."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#C9B2C0]">
              New flavours, seasonal campaigns, retail partnerships, sponsorship moments — a brand in its first
              years asks more of its website than an established one ever does. A site handed over at launch and
              left alone starts falling behind the brand within months.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#C9B2C0]">
              We&apos;re still on it. The team who designed and built Casa Famosa is the team that publishes to
              it, tunes it and extends it as the brand grows.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#FF8FB8]">
              {"Designed,\nbuilt, supported"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#BCA3B2]">
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
    <section className="bg-gradient-to-b from-[#FDF2F7] to-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Fast on a phone, editable in an afternoon."
            headingLevel="h4"
            lede="Two requirements drove every choice. It has to render before someone's thumb moves on, and the brand team has to be able to change it without booking developer time."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#D93A72] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#6B5A65]", index > 0 && "border-t border-[#FBF3F7]")}>
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
    <section className="bg-[#FEFBFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#F0E2E9] bg-white hover:-translate-y-1 hover:border-[#EEC2D5] hover:shadow-[0_20px_44px_-20px_rgba(27,14,23,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="text-[12px] font-semibold text-[#D93A72] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#1B0E17] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#6B5A65]">{item.text}</p>
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

export default function CasaFamosaCaseStudy({ entry }: Props) {
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
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2], contentDetailEntries[3]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FEFBFC]">
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
        <StillOursSection />
      <TechnologySection />
      <RelatedSection related={relatedItems} />
    </div>
  );
}
