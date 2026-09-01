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

// Contentful wiring — same shape as `DiageoBrandPromoterCaseStudy`'s own,
// minus the gallery: `entry.fields.elements` may hold up to 4
// `contentDetail` entries. `[0]` supplies this case study's own hero
// photo (`heroImage`) only — "what we built"'s 3 rows mix a diagram, a
// photo and a variety grid (see `BuiltRow`'s own `visual` discriminant
// below), so there's no single uniform per-row photo slot for a gallery
// entry to override. `[1]`–`[3]` each become one `RelatedSection` card
// (see `resolveRelatedItem`). Everything here works exactly as before
// when `entry` is omitted or those fields are unset — each piece falls
// back to its own hardcoded default individually.
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
 * `RedMirchiCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/oxytal-case-study-red-mirchi.html`. Same treatment as its
 * siblings in this folder (`TinyIslandCaseStudy`/`KaneffCaseStudy`/
 * `CasaFamosaCaseStudy`/`StoopDayzCaseStudy`/`TaffersCaseStudy`): keeps
 * the reference's own colour identity (`--ink` `#18100D`, `--body`
 * `#655650`, `--accent` `#C43D1E`, `--accent-2` `#F0855F`, the
 * `--deep-1`/`--deep-2` `#140C09`/`#2A1A13` near-black-to-umber gradient,
 * `--leaf` `#4E7C39` for the catalogue's variety-type labels) rather than
 * the site's per-page `themeColor` accent, and typography stays the
 * site's own inherited `Poppins`. Every heading size, lede size, and
 * section container width (`max-w-*`) matches its siblings exactly —
 * 12px eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8
 * ledes, `max-w-7xl` for the wide sections, `max-w-5xl` for the narrow
 * prose ones, `max-w-6xl` for "what we built" — rather than the numbers
 * baked into the reference's own stylesheet. Content is still the
 * reference's own hardcoded copy/photography; the only genuine
 * Contentful wiring is the optional `entry` prop (see the doc comment
 * above the `isEntry` helper): a `contentDetail` entry's own `heroImage`
 * can override the hero photo, and up to 3 more `contentDetail` entries
 * can override the related-case-study cards — each falls back to its own
 * hardcoded default individually when unset.
 *
 * One thing unique to this one: "What we built"'s 3 rows mix all 3 visual
 * treatments its siblings only use separately — row 1 ("Provenance")
 * keeps the reference's own hand-drawn inline SVG diagram (ported as
 * literal `<svg>` markup, same idiom `KaneffCaseStudy`'s diagrams use),
 * row 2 ("Six businesses") uses a real photo like `TinyIslandCaseStudy`'s
 * rows, and row 3 ("Catalogue") replaces the media column entirely with
 * the reference's own 2×2 variety-card grid — the reference's actual
 * layout for that row (`.built` with `.varieties` standing in for
 * `.b-shot`), unlike `TinyIslandCaseStudy`'s `drinks` grid, which nests
 * *inside* the text column alongside a reused photo. `BuiltRow` picks
 * between the three via a `visual` discriminant instead of the optional-
 * flag shape its siblings use, since here all three are mutually
 * exclusive per row — and it's also why this case study has no gallery
 * wiring, unlike its photo-uniform siblings.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `redMirchi`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/media fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-red-mirchi.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Red Mirchi Associates" },
  { k: "Sector", v: "Horticulture & floriculture · India" },
  { k: "Services", v: "Experience Design · Engineering · Support" },
  { k: "Location", v: "Jind, Haryana · established 2009" },
  { k: "Status", v: "Built from scratch, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "2009", l: "Trading history the site had to make visible" },
  { v: "100K+", l: "Square metres of quarantine facility, evidenced" },
  { v: "6", l: "Distinct business lines under one roof" },
  { v: "3", l: "Ways to reach a person, from every page" },
  { v: "—", l: "Enquiries per month since launch" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The customer is holding a phone, not sitting at a desk",
    text: "Farmers and horticulture buyers in Haryana are on mobile, often on a variable connection, often between other work. A page designed for a desktop browser and a leisurely read is a page that doesn't get read.",
  },
  {
    n: "02",
    title: "A contact form is the wrong ending",
    text: "Filling in a form and waiting is not how this business is done. The natural next step is a call or a WhatsApp message — and if the site makes someone hunt for a number, they've already gone back to whoever they used last year.",
  },
  {
    n: "03",
    title: "It's six businesses, not one",
    text: "Bulb import, plantation, polyhouse construction, irrigation, fertilisers and consulting, and tissue culture. Each has a different buyer with a different question, and flattening them into one list would serve none of them.",
  },
];

type BuiltRow =
  | { n: string; title: string; desc: string; bullets: string[]; visual: "diagram" }
  | { n: string; title: string; desc: string; bullets: string[]; visual: "photo"; img: string; alt: string }
  | { n: string; title: string; desc: string; bullets: string[]; visual: "varieties" };

const BUILT_ROWS: BuiltRow[] = [
  {
    n: "01 · Provenance",
    title: "Proving the supply chain, not describing it",
    desc: "The credibility markers are specific and checkable rather than adjectival. A named Dutch partner. A quantified quarantine facility. A founding year. Any supplier can call their bulbs premium; far fewer can name who they import from.",
    bullets: [
      "The Holland partner named in full — Derck Schipper Bloembollen/Export B.V.",
      "The post-quarantine facility given a number, not an adjective",
      "Established 2009 stated in the first line, because longevity is the strongest signal in this trade",
      "A physical address in Jind — a supplier you could drive to is a different proposition",
    ],
    visual: "diagram",
  },
  {
    n: "02 · Six businesses",
    title: "Each offering, its own entry point",
    desc: "A farmer looking for drip irrigation and a grower planning contract farming are not the same visitor. The offerings are presented as six distinct capabilities with their own framing, so each buyer recognises their own problem rather than scanning a list of everything the company can do.",
    bullets: [
      "Polyhouse and greenhouse — design, build and commission",
      "Seeds and plantation, irrigation systems, fertilizers and nutrients",
      "Agronomic consulting and contract farming that connects growers to markets",
      "Tissue culture propagation and post-harvest processing",
    ],
    visual: "photo",
    img: "https://www.redmirchi.org/images/2-1.jpg",
    alt: "Inside a Red Mirchi Associates polyhouse, showing controlled-environment growing",
  },
  {
    n: "03 · Catalogue",
    title: "Varieties named the way growers name them",
    desc: "Pot Lily, Asiatic Lily, Oriental Lily, LA Lily, Tulip, Hyacinthus — organised by type, then by named variety, because that is the vocabulary of the trade. A grower asking for a specific cultivar should find it, not a page of general photographs of flowers.",
    bullets: [
      "Grouped by flower type, then by named variety",
      "Photographed rather than illustrated, because colour is the purchase",
      "No prices — bulb pricing moves with season, volume and import cost, and a wrong number is worse than none",
      "Structured so new varieties are added each season without a rebuild",
    ],
    visual: "varieties",
  },
];

const VARIETIES: { name: string; type: string; img: string }[] = [
  { name: "Orange Joy", type: "Pot Lily", img: "https://www.redmirchi.org/images/flowers/orange-joy-pot-lily.jpg" },
  { name: "Brindisi", type: "Asiatic Lily", img: "https://www.redmirchi.org/images/flowers/brindisi-asiatic-lily.jpg" },
  { name: "Labrador", type: "Oriental Lily", img: "https://www.redmirchi.org/images/flowers/labrador-oriental-lily.jpg" },
  { name: "Nashville", type: "LA Lily", img: "https://www.redmirchi.org/images/flowers/nashville-la-lily.jpg" },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: '"Call Us" is a navigation item',
    text: "Not a footer line. It sits alongside Home and Catalogue, because for this business it's as important a destination as any page.",
  },
  {
    title: "Every number is tappable",
    text: "Two numbers, both as direct dial links, because a number you have to memorise and retype on a phone is a number that doesn't get called.",
  },
  {
    title: "WhatsApp as a real channel",
    text: "Placed with the social links but doing entirely different work — it's the channel where a photograph of a struggling crop gets sent and answered.",
  },
  {
    title: '"Free consultation", not "submit"',
    text: "The invitation matches what actually happens next: a conversation with someone who knows the crop, offered without obligation.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Establish what a buyer actually needs to believe",
    text: 'Not "what should the site say" but "what makes a grower confident enough to place an order". Provenance, scale and longevity — in that order, and all above the fold.',
  },
  {
    n: "02",
    title: "Separate six businesses without fragmenting one company",
    text: "Distinct offerings that each speak to their own buyer, held together by a single credible operation rather than reading as an unfocused list of services.",
  },
  {
    n: "03",
    title: "Design mobile-first, genuinely",
    text: "Not a desktop layout that reflows. Built for a phone on a variable connection, with the routes to a human never more than a tap away.",
  },
  {
    n: "04",
    title: "Build it to be found",
    text: "Structured for the searches that matter — flower bulbs, lily varieties, polyhouse, the district and the state — because a business invisible outside its own region was the problem we were hired to solve.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. Seasonal varieties, new offerings, content updates and platform maintenance delivered as ongoing work.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Optimised imagery", "Mobile-first layouts"] },
  { title: "Content", items: ["Structured catalogue", "Variety-level entries", "Seasonal updates", "Extendable offerings"] },
  { title: "Contact routes", items: ["Direct dial links", "WhatsApp", "Email", "Enquiry form"] },
  { title: "Findability", items: ["Indexed and crawlable", "Regional search terms", "Descriptive page titles", "Social preview cards"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/tiny-island-cocktails",
    img: "https://images.ctfassets.net/wodp1h6ezq96/5yvC9NqXcvwcEd4H9nZz8G/b724865e217bb082261b82f89f5c8383/HeroPacking.webp",
    alt: "Tiny Island Cocktails packaging",
    k: "Diageo · Brand",
    title: "Tiny Island Cocktails",
    text: "Everyone knows what a Mojito tastes like. The doubt is the can.",
  },
  {
    href: "/case-studies/Kaneff",
    img: "https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp",
    alt: "Kaneff Group document platform on SharePoint Online",
    k: "Real estate",
    title: "Kaneff Group",
    text: "7 TB read, cleaned and moved — with 20% less storage after.",
  },
  {
    href: "/case-studies/casa-famosa-hard-agua-frescas",
    img: "https://images.ctfassets.net/twkb5au85wu1/13bmqpOiBCkRHLCLuSNOtx/5bcaf0edb499aea0cd9bc070fefd6c0d/banner-product-img.webp",
    alt: "Casa Famosa Hard Agua Frescas",
    k: "Diageo · Brand",
    title: "Casa Famosa",
    text: "Nobody searches for a brand they've never heard of.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#C43D1E" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#18100D]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#BDACA4]" : "text-[#655650]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#C43D1E" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#140C09] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#8A7871] uppercase">
          <li>
            <Link href="/" className="text-[#B7A69E] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#B7A69E] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Red Mirchi Associates</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#140C09] to-[#2A1A13] pt-12 text-[#F2EBE7] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(240,133,95,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#F0855F] uppercase">
          Case study · Red Mirchi Associates · Jind, Haryana
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[20ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          You can&apos;t tell a good bulb from a bad one by looking at it.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#BDACA4]">
          A farmer planting Holland lily bulbs is committing land, labour and a season&apos;s income to something
          they cannot inspect. By the time a bad batch shows itself, the year is gone. Red Mirchi has imported and
          grown premium bulbs from Jind since 2009 — and the job of their website is to prove where the stock comes
          from, then get the conversation onto the phone.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#140C09] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#8A7871] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#F2EBE7]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.redmirchi.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#F0855F] hover:bg-[#F0855F]/12 sm:mb-12"
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
            src={mainBanner ?? "https://images.ctfassets.net/ygo6iu959zk9/5FFlZsqcIjUHeDz1iTkczU/2c942bc230e44957ab775d760cd1322f/Four-Panel-Lily-Garden.webp"}
            alt="Asiatic lilies grown by Red Mirchi Associates in Jind, Haryana"
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
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EDE3DD] bg-[#EDE3DD] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#C43D1E]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#655650]">{item.l}</div>
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
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead
          eyebrow="The challenge"
          title="Sixteen years of reputation, and no way to see it."
          headingLevel="h2"
          narrow={false}
        />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#18100D]">
          Red Mirchi Associates has operated from Jind, Haryana since 2009 — importing Holland flower bulbs, growing
          them, building polyhouses, supplying irrigation and advising farmers on what to plant. In the districts
          where they work, the reputation is established. Outside them, it was invisible.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#655650]">
          That matters because of what they sell. A bulb looks like a bulb. A farmer choosing between a certified
          Holland lily and a cheaper alternative is making a decision they cannot verify by inspection, on a crop
          that will take a season to prove them right or wrong. The same is true of a polyhouse — a substantial
          capital commitment to a supplier who might be excellent or might disappear.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#655650]">
          So the website was never going to be a shop. It had to do the thing the reputation does in person:
          establish that this is a serious operation with a real supply chain, a real facility and sixteen years
          behind it. And then hand over to a phone call, because that is how the business actually closes.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#C43D1E] bg-[#FCEDE7] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#18100D]">
            Nobody buys a polyhouse online, and nobody should buy bulbs from a supplier they haven&apos;t spoken to.
            The site&apos;s job is to make that call worth making — and then to make it easy.
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
    <section className="bg-gradient-to-b from-[#FBF4F0] to-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three things a standard business site gets wrong here."
            headingLevel="h2"
            lede="The template answers — a contact form, a product grid, a gallery — would all have failed for the same underlying reason."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE3DD] bg-[#EDE3DD] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#C43D1E]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#18100D] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#655650]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE BUILT — provenance diagram
========================================================= */

function ProvenanceDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="The chain of provenance from a named Holland partner, through a quantified quarantine facility, to the farmer."
    >
      <g fill="#fff" stroke="#EDE3DD">
        <rect x="20" y="98" width="140" height="104" rx="14" />
        <rect x="190" y="98" width="140" height="104" rx="14" />
      </g>
      <rect x="360" y="98" width="140" height="104" rx="14" fill="#FCEDE7" stroke="#C43D1E" />
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" fill="#18100D" textAnchor="middle">
        <text x="90" y="140">Holland partner</text>
        <text x="260" y="140">PQ facility, Jind</text>
        <text x="430" y="140">The farmer</text>
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#9A8880" textAnchor="middle">
        <text x="90" y="162">named, not implied</text>
        <text x="260" y="162">100,000+ sq. mtr.</text>
      </g>
      <text x="430" y="162" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#C43D1E" textAnchor="middle">
        a season on the line
      </text>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="8.5" fill="#4E7C39" textAnchor="middle">
        <text x="90" y="182">certified stock</text>
        <text x="260" y="182">strict SOPs</text>
        <text x="430" y="182">verifiable</text>
      </g>
      <g stroke="#C43D1E" strokeWidth="2" fill="none" strokeDasharray="5 6">
        <path d="M168 150h14" />
        <path d="M338 150h14" />
      </g>
      <path
        d="M172 144l8 6-8 6M342 144l8 6-8 6"
        fill="none"
        stroke="#C43D1E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="260" y="252" fill="#655650" fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" textAnchor="middle">
        Every link in the chain has a name and a number
      </text>
      <path d="M90 214v14h340v-14" stroke="#EDE3DD" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

/* =========================================================
   WHAT WE BUILT
========================================================= */

function WhatWeBuiltSection() {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="Four pages, arranged around one decision."
            headingLevel="h2"
            lede='Home, About, Catalogue, Contact. Everything on them is there to move a visitor from "who are these people" to "I&apos;ll ring them".'
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

function BuiltRow({ row }: { row: BuiltRow }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-semibold text-[12px] text-[#C43D1E]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#18100D] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#655650]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#655650]",
                index > 0 && "border-t border-[#F8F2EE]"
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
          className="rounded-[18px] border border-[#EDE3DD] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(24,16,13,0.22)] sm:p-7"
        >
          <ProvenanceDiagram />
        </div>
      )}

      {row.visual === "photo" && (
        <div
          ref={mediaRef}
          className="overflow-hidden rounded-[18px] border border-[#EDE3DD] bg-[#F8F2EE] shadow-[0_20px_46px_-22px_rgba(24,16,13,0.22)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img src={row.img} alt={row.alt} width={1200} height={900} loading="lazy" className="block aspect-4/3 w-full object-cover" />
        </div>
      )}

      {row.visual === "varieties" && (
        <div ref={mediaRef} className="grid grid-cols-2 gap-3">
          {VARIETIES.map((variety) => (
            <figure key={variety.name} className="m-0 overflow-hidden rounded-[14px] border border-[#EDE3DD] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img
                src={variety.img}
                alt={`${variety.name} ${variety.type.toLowerCase()}`}
                width={600}
                height={600}
                loading="lazy"
                className="block aspect-square w-full object-cover"
              />
              <figcaption className="px-3.5 py-3">
                <span className="text-[15px] font-bold tracking-[-0.02em] text-[#18100D] block">{variety.name}</span>
                <span className="mt-1 font-semibold text-[9.5px]  text-[#4E7C39] uppercase block">
                  {variety.type}
                </span>
              </figcaption>
            </figure>
          ))}
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#140C09] to-[#2A1A13] px-5 py-14 text-[#F2EBE7] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(240,133,95,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#F0855F"
            headingLevel="h3"
            title="The conversion is a phone call."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#BDACA4]">
            Almost every site we build ends in a form. This one shouldn&apos;t. In this trade a buyer wants to hear
            a voice, ask three specific questions, and judge the answers — and a form that promises a reply within
            two working days loses to a competitor who picks up.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#BDACA4]">
            <strong className="font-semibold text-white">
              So the phone number is treated as the primary interface,
            </strong>{" "}
            not a courtesy in the footer. It sits in the main navigation, it&apos;s tappable everywhere, and
            WhatsApp — which is how business is actually conducted across much of India — is a first-class route
            rather than an afterthought.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#140C09] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#B7A69E]">{card.text}</p>
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
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Designed for a field, not a boardroom."
            headingLevel="h3"
            lede="The temptation with a business this established is to build something corporate. The buyer would not have recognised themselves in it."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#EDE3DD] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#EDE3DD]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#C43D1E]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#18100D] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#655650]">{phase.text}</p>
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
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#140C09] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(240,133,95,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#F0855F"
              headingLevel="h3"
              title="Horticulture runs on a calendar."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#BDACA4]">
              Bulb varieties change with each import season. Availability shifts. New offerings get added as the
              business grows into them. A site that reflects last season&apos;s catalogue is worse than useless to
              a grower planning this one.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#BDACA4]">
              We&apos;re still on it — updating varieties, extending the site as the business extends, and keeping
              the platform current. For a company whose credibility rests on being current and precise, a stale
              website would undo the very thing the site was built to prove.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#F0855F]">
              {"Season\nby season"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#B7A69E]">
              Ongoing catalogue updates, new offerings, content changes and platform maintenance — from the team
              that built it.
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
    <section className="bg-gradient-to-b from-[#FBF4F0] to-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Light enough for a rural connection."
            headingLevel="h4"
            lede="The decisive constraint wasn't features. It was whether a page loads quickly on a mid-range phone somewhere with two bars of signal."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#C43D1E] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#655650]", index > 0 && "border-t border-[#F8F2EE]")}>
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
 * `[0]` is this case study's own hero-photo source, see the default
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
    <section className="bg-[#FDFBF9] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#EDE3DD] bg-white hover:-translate-y-1 hover:border-[#E5C6B8] hover:shadow-[0_20px_44px_-20px_rgba(24,16,13,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="text-[12px] font-semibold text-[#C43D1E] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#18100D] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#655650]">{item.text}</p>
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

export default function RedMirchiCaseStudy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const heromainEntry = contentDetailEntries[0];
  const heroImageEntry = heromainEntry?.fields.heroImage;
  const mainBanner =
    heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  // The 3 related-case-study cards, one per entry — `[0]` stays this
  // case study's own hero-photo source above, so the related cards
  // start at `[1]`. `resolveRelatedItem` drops any that don't resolve
  // (missing entry, or no `heroImage`), and `RelatedSection` falls back
  // to its own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2], contentDetailEntries[3]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FDFBF9]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero mainBanner={mainBanner} />
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
      <RelatedSection related={relatedItems} />
    </div>
  );
}
