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

// Contentful wiring — same shape as `AviationGinCaseStudy`'s own:
// `entry.fields.elements` may hold up to 4 `contentDetail` entries. `[0]`
// supplies this case study's own hero photo (`heroImage`) and gallery
// (`gallery`, matched to `BUILT_ROWS` by position — see `galleryImages`
// in the default export below). Row 1 ("The move") renders a hand-drawn
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
 * `JohnnieWalkerStyleCaseStudy` — a standalone, static case-study
 * one-pager ported from
 * `Refrence/oxytal-case-study-johnnie-walker-style.html`. Same treatment
 * as its siblings in this folder (`AviationGinCaseStudy`/
 * `BundabergRumCaseStudy`/`RedMirchiCaseStudy`): keeps the reference's
 * own colour identity (`--ink` `#160D10`, `--body` `#645257`, `--muted`
 * `#9B868C`, `--accent` `#A8253F`, `--accent-2` `#E8798F`,
 * `--accent-soft` `#FBECEF`, the `--deep-1`/`--deep-2`
 * `#120A0D`/`#2A141B` near-black gradient) rather than the site's
 * per-page `themeColor` accent, and typography stays the site's own
 * inherited `Poppins` (the reference's own `Noto Sans Thai` face is
 * dropped for the same reason every sibling drops its own Google Fonts —
 * see `single-site-font-poppins` — but the Thai strings themselves are
 * kept verbatim in `ThaiStringsTable`, since they're content, not a font
 * choice). Every heading size, lede size, and section container width
 * (`max-w-*`) matches its siblings exactly — 12px eyebrows,
 * `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s, 16px/1.8 ledes,
 * `max-w-7xl` for the wide sections, `max-w-5xl` for the narrow prose
 * ones, `max-w-6xl` for "what we did" — rather than the numbers baked
 * into the reference's own stylesheet. Content is still the reference's
 * own hardcoded copy/photography; the only genuine Contentful wiring is
 * the optional `entry` prop (see the doc comment above the `isEntry`
 * helper) — a `contentDetail` entry's own `heroImage` can override the
 * hero photo, its `gallery` can override the two photo rows in "what we
 * did", and up to 3 more `contentDetail` entries can override the
 * related-case-study cards, each falling back to its own hardcoded
 * default individually when unset.
 *
 * Things unique to this one:
 * - The hero shot is a product PNG on a transparent background (not a
 *   photograph), so unlike every sibling's `object-cover` hero image,
 *   this one sits on its own dark panel with `object-contain` and
 *   padding — matching the reference's own `.hero-shot img{object-fit:
 *   contain}` treatment rather than cropping the artwork.
 * - "What we did"'s 3 rows mix a hand-drawn inline SVG diagram for row 1
 *   ("The move", same idiom `KaneffCaseStudy`'s/`AviationGinCaseStudy`'s
 *   diagrams use) with real photography for rows 2–3, via `BuiltRow`'s
 *   own `visual` discriminant — same shape `AviationGinCaseStudy` uses,
 *   and the photo rows are gallery-overridable the same way
 *   (`galleryImages` matched by position, consulted only inside
 *   `BuiltRow`'s `"photo"` branch). Row 2 ("The catalogue") additionally
 *   nests the reference's own small 2×2 product grid (`ProductCard`)
 *   inside its text column, alongside the row's own photo — the
 *   reference's actual layout for that row, not something invented here.
 * - "The detail that mattered" carries the reference's own Thai
 *   system-message table (`ThaiStringsTable` — Thai text paired with its
 *   English gloss) instead of the vocabulary-table device
 *   `AviationGinCaseStudy` uses, since this reference's own point is
 *   translated system strings rather than an in-world lexicon. "How we
 *   worked" keeps the reference's own numeric `01`–`05` phase sequence
 *   plus a final `Since` phase for ongoing work, rather than the
 *   role-based labels `AviationGinCaseStudy`/`BundabergRumCaseStudy` use.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype
 * `johnnieWalkerStyle`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/media fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from
   Refrence/oxytal-case-study-johnnie-walker-style.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Johnnie Walker Style Thailand" },
  { k: "Sector", v: "Brand merchandise · direct-to-consumer" },
  { k: "Work", v: "PHP → Shopify migration, then support" },
  { k: "Market", v: "Thailand · Thai language · THB" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "PHP → Shopify", l: "Custom build replaced with a supported platform" },
  { v: "100%", l: "Interface in Thai, including every system message" },
  { v: "฿350–฿3,990", l: "Catalogue range, all merchandise" },
  { v: "—", l: "Products migrated with history intact" },
  { v: "—", l: "Downtime during cutover" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The store couldn't pause",
    text: "Orders arrive daily and campaigns don't stop for infrastructure. The old store had to keep trading while the new one was built, with a cutover short enough that no customer met a maintenance page.",
  },
  {
    n: "02",
    title: "Every string is in Thai",
    text: "Not just the content — the confirmations, the warnings, the validation messages. Custom PHP puts those in the code. Missing one leaves an English error in a Thai checkout, which is exactly where a customer stops trusting a store.",
  },
  {
    n: "03",
    title: "The old URLs are somebody's bookmark",
    text: "Product links live in social posts, messages and search results going back years. A new platform means a new URL structure, and every one of the old addresses has to land somewhere sensible.",
  },
];

/* =========================================================
   WHAT WE DID — migration diagram
========================================================= */

function MigrationDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="A custom PHP store migrated onto Shopify with catalogue, customers and URLs carried across."
    >
      <rect x="20" y="66" width="150" height="168" rx="14" fill="#F8F2F3" stroke="#EDE2E4" />
      <text x="95" y="52" fill="#9B868C" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        CUSTOM PHP
      </text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10" fill="#645257">
        <text x="40" y="96">catalogue</text>
        <text x="40" y="122">variants</text>
        <text x="40" y="148">Thai strings</text>
        <text x="40" y="174">URLs</text>
        <text x="40" y="200">payments</text>
      </g>
      <g fill="#C9B4B9">
        <circle cx="30" cy="92" r="3" />
        <circle cx="30" cy="118" r="3" />
        <circle cx="30" cy="144" r="3" />
        <circle cx="30" cy="170" r="3" />
        <circle cx="30" cy="196" r="3" />
      </g>
      <text x="95" y="256" fill="#9B868C" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        AGEING, BESPOKE
      </text>
      <g stroke="#A8253F" strokeWidth="2" fill="none" strokeDasharray="5 6">
        <path d="M186 92h44" />
        <path d="M186 118h44" />
        <path d="M186 144h44" />
        <path d="M186 170h44" />
      </g>
      <g fill="none" stroke="#A8253F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M224 86l8 6-8 6M224 112l8 6-8 6M224 138l8 6-8 6M224 164l8 6-8 6" />
      </g>
      <text x="208" y="216" fill="#A8253F" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        VERIFIED
      </text>
      <text x="208" y="230" fill="#A8253F" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        ITEM BY ITEM
      </text>
      <rect x="248" y="66" width="150" height="168" rx="14" fill="#FBECEF" stroke="#A8253F" />
      <text x="323" y="52" fill="#A8253F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        SHOPIFY
      </text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10" fill="#645257">
        <text x="268" y="96">products</text>
        <text x="268" y="122">options</text>
        <text x="268" y="148">locale file</text>
        <text x="268" y="174">redirects</text>
        <text x="268" y="200">managed checkout</text>
      </g>
      <g fill="#A8253F">
        <circle cx="258" cy="92" r="3" />
        <circle cx="258" cy="118" r="3" />
        <circle cx="258" cy="144" r="3" />
        <circle cx="258" cy="170" r="3" />
        <circle cx="258" cy="196" r="3" />
      </g>
      <rect x="418" y="112" width="82" height="76" rx="14" fill="#fff" stroke="#A8253F" />
      <text x="459" y="146" fill="#160D10" fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" fontWeight="600" textAnchor="middle">
        Customer
      </text>
      <text x="459" y="166" fill="#A8253F" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" textAnchor="middle">
        notices nothing
      </text>
      <path d="M406 150h6" stroke="#A8253F" strokeWidth="2" />
    </svg>
  );
}

const CATALOGUE_PRODUCTS: { href: string; img: string; name: string; price: string }[] = [
  {
    href: "https://www.johnniewalkerstyle.com/products/blue-bucket-hat",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770941.jpg?v=1783420977&width=500",
    name: '"BLUE" Bucket Hat',
    price: "590.00 ฿",
  },
  {
    href: "https://www.johnniewalkerstyle.com/products/blue-sweater",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770928.jpg?v=1783420976&width=500",
    name: '"BLUE" Sweater',
    price: "1,290.00 ฿",
  },
  {
    href: "https://www.johnniewalkerstyle.com/products/johnnie-walker-quote-t-shirt-black",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770583.jpg?v=1783420973&width=500",
    name: "Quote T-Shirt (Black)",
    price: "350.00 ฿",
  },
  {
    href: "https://www.johnniewalkerstyle.com/products/johnnie-walker-quote-t-shirt-white",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770633.jpg?v=1783420973&width=500",
    name: "Quote T-Shirt (White)",
    price: "350.00 ฿",
  },
];

type BuiltRow =
  | { n: string; title: string; desc: string; bullets: string[]; visual: "diagram" }
  | {
      n: string;
      title: string;
      desc: string;
      bullets: string[];
      visual: "photo";
      img: string;
      alt: string;
      products?: typeof CATALOGUE_PRODUCTS;
    };

const BUILT_ROWS: BuiltRow[] = [
  {
    n: "01 · The move",
    title: "Rebuilt on Shopify, mapped from the old store",
    desc: "Products, variants, imagery, pricing in baht and the collection structure carried across and verified against the original. The theme rebuilt to match the existing storefront rather than taking the opportunity to redesign — one change at a time is how a migration stays reviewable.",
    bullets: [
      "Catalogue reconciled item by item, not counted in bulk",
      "Variants and size options rebuilt as Shopify options rather than custom fields",
      "Redirects from every old product and category address",
      "Design held constant through cutover, so any difference was a defect rather than a decision",
    ],
    visual: "diagram",
  },
  {
    n: "02 · The catalogue",
    title: "Merchandise as the brand's presence",
    desc: 'Collections built around how the range actually works — the 100 Years Collection, the "BLUE" line, artist collaborations like Black Ruby × VINN PATARARIN at ฿3,990, and everyday pieces from ฿350. Sold-out items stay visible rather than disappearing, because a sold-out collaboration is evidence of demand.',
    bullets: [
      "Apparel, headwear, barware and collectibles across one range",
      "Collaboration pieces given the prominence their price implies",
      "Sold-out states shown honestly instead of hidden",
      "Predictive search with imagery, because people shop by looking",
    ],
    visual: "photo",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770928_c4b1606e-db81-4172-8f24-7b47a90bdd40.jpg?v=1783420976&width=1200",
    alt: "Johnnie Walker Style BLUE collection sweater",
    products: CATALOGUE_PRODUCTS,
  },
  {
    n: "03 · The market",
    title: "Built for how Thailand actually shops",
    desc: "A store here isn't a smaller version of a Western one. Payment preferences differ, mobile share is very high, and LINE is the channel customers expect to use when they want to ask something — not email, and not a contact form nobody answers.",
    bullets: [
      "LINE presented as a primary contact route, not buried with social links",
      "Pricing and checkout in baht throughout, no conversion moments",
      "Mobile-first, because that is overwhelmingly how the store is used",
      "Merchandise only — the store carries the brand without carrying the product",
    ],
    visual: "photo",
    img: "https://www.johnniewalkerstyle.com/cdn/shop/files/1684770633_b6fd9819-fa54-4429-b7af-e7b34d87cc16.jpg?v=1783420973&width=1200",
    alt: "Johnnie Walker Style merchandise",
  },
];

const THAI_STRINGS: { t: string; e: string }[] = [
  { t: "คุณแน่ใจหรือไม่?", e: "Are you sure?" },
  { t: "เมื่อลบแล้วจะไม่สามารถกู้คืนได้!", e: "Once deleted, this cannot be recovered." },
  { t: "ลบสินค้าเรียบร้อยแล้ว", e: "Item removed successfully." },
  { t: "กรุณาเลือกคุณสมบัติสินค้า", e: "Please select the product options." },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "Found by walking the store",
    text: "System messages don't appear in a content export. They were found by using the old store the way a customer does — including the paths where things go wrong.",
  },
  {
    title: "Rebuilt as translations, not hard-coded",
    text: "On Shopify they live in the theme's locale file rather than scattered through templates, so the next person can change a word without touching code.",
  },
  {
    title: "Thai typography set properly",
    text: "Thai script needs more line height than Latin and breaks differently. Type set for the language rather than inherited from an English theme.",
  },
  {
    title: "Tested in the failure paths",
    text: "Empty carts, removed items, missing size selections, payment declines. The unhappy paths are where a half-translated store gives itself away.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Inventory the old store",
    text: "Catalogue, variants, pricing, URLs, integrations — and the system messages nobody documents. You can't verify a migration against a system you only partly understand.",
  },
  {
    n: "02",
    title: "Rebuild in parallel",
    text: "The Shopify store built and populated while the PHP store carried on taking orders. Nothing switched until the new one had been checked against the old, page by page.",
  },
  {
    n: "03",
    title: "Match, don't improve",
    text: "Deliberately no redesign during the move. Migrating and redesigning at once means that when something looks wrong, nobody can tell whether it's a bug or the new design.",
  },
  {
    n: "04",
    title: "Map every address",
    text: "Redirects from the old URL structure so links in years of social posts, messages and search results still reach the right product.",
  },
  {
    n: "05",
    title: "Switch, then watch",
    text: "A short cutover, then close monitoring of orders, search behaviour and errors — because the first week after a migration is when anything missed surfaces.",
  },
  {
    n: "Since",
    title: "Improve on the new platform",
    text: "With the store on Shopify, the enhancements that used to need a development project became routine. Collections, campaigns, search and merchandising changes now ship without one.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Platform", items: ["Shopify", "Custom theme", "Liquid templates", "Managed checkout"] },
  { title: "Localisation", items: ["Thai locale file", "THB pricing", "Thai typography", "System messages translated"] },
  { title: "Migration", items: ["Catalogue & variants", "URL redirect map", "Parallel build", "Page-by-page verification"] },
  { title: "Since launch", items: ["Collections & campaigns", "Predictive search", "Performance work", "Ongoing support"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/bundaberg-rum",
    img: "https://www.bundabergrum.com.au/cdn/shop/files/Home_Page_Banner_-_Desktop_Bundy_Bear.jpg?v=1781082719&width=800",
    alt: "Bundaberg Rum store",
    k: "Shopify · Commerce",
    title: "Bundaberg Rum",
    text: "Selling rum online is a licensing problem before it's a commerce problem.",
  },
  {
    href: "/case-studies/kaneff-sharepoint-migration",
    img: "https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp",
    alt: "Kaneff Group migration",
    k: "Migration",
    title: "Kaneff Group",
    text: "7 TB read, cleaned and moved — with 20% less storage after.",
  },
  {
    href: "/case-studies/aviation-american-gin",
    img: "https://images.ctfassets.net/sl666vhlv2bs/730yUEymNTlERXBbgHACb8/f958b3b6e606e688ffad71ab60a65a39/desktop-banner.webp",
    alt: "Aviation American Gin",
    k: "Diageo · Support",
    title: "Aviation American Gin",
    text: "The hardest platform to change is one you didn't build.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#A8253F" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#160D10]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#B7A2A8]" : "text-[#645257]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#A8253F" }: { color?: string }) {
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

/** The reference's `.pr` — a small square product card used inside row 2's ("The catalogue") 2×2 grid. */
function ProductCard({ product }: { product: (typeof CATALOGUE_PRODUCTS)[number] }) {
  return (
    <a
      href={product.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-[14px] border border-[#EDE2E4] bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#E4C3CB] hover:shadow-[0_16px_34px_-18px_rgba(22,13,16,0.24)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
      <img src={product.img} alt={product.name} width={500} height={500} loading="lazy" className="aspect-square block w-full bg-[#F8F2F3] object-cover" />
      <span className="block px-3.5 pt-3 pb-3.5">
        <span className="block text-[13.5px] leading-[1.4] font-medium text-[#160D10]">{product.name}</span>
        <span className="mt-1.5 block text-[15px] font-extrabold text-[#A8253F]">{product.price}</span>
      </span>
    </a>
  );
}

/** The reference's `.strings` — Thai system-message text paired with its English gloss. */
function ThaiStringsTable() {
  return (
    <div className="mt-6.5 overflow-hidden rounded-2xl border border-white/[0.14] bg-white/[0.03]">
      {THAI_STRINGS.map((row, index) => (
        <div
          key={row.t}
          className={cx(
            "grid grid-cols-1 gap-1.5 px-5 py-3.5 sm:grid-cols-2 sm:gap-4",
            index > 0 && "border-t border-white/[0.09]"
          )}
        >
          <span className="text-[15.5px] leading-[1.6] text-white">{row.t}</span>
          <span className="self-center text-[13.5px] leading-[1.6] text-[#9B868C]">{row.e}</span>
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
    <nav aria-label="Breadcrumb" className="bg-[#120A0D] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#8B767C] uppercase">
          <li>
            <Link href="/" className="text-[#B7A2A8] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#B7A2A8] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Johnnie Walker Style Thailand</span>
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
      className="relative overflow-hidden bg-gradient-to-br from-[#120A0D] to-[#2A141B] pt-12 text-[#F3EBED] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,121,143,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#E8798F] uppercase">
          Case study · Diageo · Johnnie Walker Style Thailand
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          The best replatform is the one nobody notices.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#B7A2A8]">
          Johnnie Walker Style is a Thai-language merchandise store trading in baht. We moved it off a custom PHP
          build onto Shopify — same products, same customers, same URLs where it mattered, a different engine
          underneath. Since then we&apos;ve supported and extended it. A migration that generates a story for the
          customer has usually gone wrong.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#120A0D] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#8B767C] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#F3EBED]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.johnniewalkerstyle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#E8798F] hover:bg-[#E8798F]/12 sm:mb-12"
        >
          Visit the live store
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
          className="overflow-hidden rounded-t-[20px] border border-b-0 border-white/12 bg-[#1A0F13] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.75)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src={
              mainBanner ??
              "https://www.johnniewalkerstyle.com/cdn/shop/files/1681747566_a98695df-17a5-4c13-9eff-7e0b10dc0045.png?v=1782897231&width=1600"
            }
            alt="Johnnie Walker Style Thailand"
            width={1600}
            height={700}
            className="block aspect-16/7 w-full object-contain p-6 sm:p-10 lg:p-14"
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
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EDE2E4] bg-[#EDE2E4] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#A8253F]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#645257]">{item.l}</div>
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
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead
          eyebrow="The challenge"
          title="A working store on a platform nobody could safely change."
          headingLevel="h2"
          narrow={false}
        />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#160D10]">
          The store worked. That&apos;s what makes this kind of project difficult to justify and easy to postpone —
          a custom PHP build that takes orders every day looks fine from the outside, right up until it becomes the
          reason something can&apos;t be done.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#645257]">
          Bespoke commerce ages in a particular way. The payment integrations drift out of support. The security
          patching depends on somebody remembering. Adding a feature that Shopify would give you as a checkbox
          becomes a development project with a quote attached. And the number of people who understand the
          codebase only ever goes down.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#645257]">
          There&apos;s a second layer here that shapes everything. Johnnie Walker Style sells{" "}
          <strong className="font-semibold text-[#160D10]">no whisky</strong> — the catalogue is apparel, glassware
          and collectibles. In Thailand, alcohol advertising is tightly restricted, so a brand&apos;s presence has
          to be built through style, collaboration and culture rather than the product itself. That makes the
          merchandise store unusually important. It isn&apos;t a gift shop attached to the marketing; in this
          market it <em>is</em> a substantial part of the marketing.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#A8253F] bg-[#FBECEF] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#160D10]">
            A store carrying that much of a brand&apos;s presence in a market can&apos;t be down, can&apos;t lose
            its customers, and can&apos;t suddenly start speaking English. Which narrows the acceptable outcomes
            considerably.
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
    <section className="bg-gradient-to-b from-[#FBF2F4] to-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three things that decide whether a migration is felt."
            headingLevel="h2"
            lede="The data move is the part everyone plans for. These are the parts that produce the complaints."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE2E4] bg-[#EDE2E4] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#A8253F]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#160D10] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#645257]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE DID
========================================================= */

function WhatWeBuiltSection({ galleryImages = [] }: { galleryImages?: string[] }) {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we did"
            title="Move the store, keep the shop."
            headingLevel="h2"
            lede="The work divides into the migration itself, and everything we've added since it landed."
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
        <span className="mb-3.5 block font-semibold text-[12px] text-[#A8253F]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#160D10] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#645257]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#645257]",
                index > 0 && "border-t border-[#F8F2F3]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>

        {row.visual === "photo" && row.products && (
          <div className="mt-5.5 grid grid-cols-2 gap-3">
            {row.products.map((product) => (
              <ProductCard key={product.href} product={product} />
            ))}
          </div>
        )}
      </div>

      {row.visual === "diagram" && (
        <div
          ref={mediaRef}
          className="rounded-[18px] border border-[#EDE2E4] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(22,13,16,0.2)] sm:p-7"
        >
          <MigrationDiagram />
        </div>
      )}

      {row.visual === "photo" && (
        <div
          ref={mediaRef}
          className="overflow-hidden rounded-[18px] border border-[#EDE2E4] bg-[#F8F2F3] shadow-[0_20px_46px_-22px_rgba(22,13,16,0.24)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img src={image ?? row.img} alt={row.alt} loading="lazy" className="block aspect-[1672/941] w-full object-cover" />
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#120A0D] to-[#2A141B] px-5 py-14 text-[#F3EBED] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,121,143,.16), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#E8798F"
            headingLevel="h3"
            title="Every string, including the ones you hope nobody sees."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#B7A2A8]">
            A content migration moves the words customers read. The harder job is the words the <em>system</em>{" "}
            says — the confirmation before deleting a cart item, the warning that a choice can&apos;t be undone,
            the reminder to pick a size before adding to the bag.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#B7A2A8]">
            On a bespoke PHP store those live in the code, often written by hand, sometimes years apart.{" "}
            <strong className="font-semibold text-white">
              Every one of them had to be found and rebuilt in Thai on the new platform
            </strong>{" "}
            — because a store that switches to English at the exact moment something goes wrong is a store people
            stop trusting.
          </p>
          <ThaiStringsTable />
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#120A0D] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#B7A2A8]">{card.text}</p>
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
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Build alongside, then switch."
            headingLevel="h3"
            lede="The old store kept trading until the moment the new one took over. No maintenance window, no freeze, no period where the brand was offline in its market."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#EDE2E4] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#EDE2E4]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#A8253F]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#160D10] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#645257]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT IT UNLOCKED
========================================================= */

function StillOursSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#120A0D] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(232,121,143,.16), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What it unlocked"
              eyebrowColor="#E8798F"
              headingLevel="h3"
              title="The point of a migration is what becomes easy afterwards."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#B7A2A8]">
              Moving platforms isn&apos;t an achievement in itself. The value shows up the first time the brand
              team wants something that used to be a quote and a fortnight — a new collection, a campaign page, a
              payment method, a promotion — and it takes an afternoon.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#B7A2A8]">
              Security patching, platform updates and payment compliance stopped being Diageo&apos;s problem and
              became Shopify&apos;s. We stayed on to do the rest: campaigns, merchandising, search, performance,
              and the collaborations the store exists to sell.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#E8798F]">
              {"Migrated,\nthen extended"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#B7A2A8]">
              Off bespoke PHP, onto a supported platform — with the same team continuing to build on it.
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
    <section className="bg-gradient-to-b from-[#FBF2F4] to-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="From something we maintain to something we build on."
            headingLevel="h4"
            lede="The clearest argument for this migration is the difference between the two columns of work — one of them is nobody's job now."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#A8253F] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#645257]", index > 0 && "border-t border-[#F8F2F3]")}>
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
    <section className="bg-[#FDFBFB] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#EDE2E4] bg-white hover:-translate-y-1 hover:border-[#E4C3CB] hover:shadow-[0_20px_44px_-20px_rgba(22,13,16,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-semibold text-[12px] text-[#a8253f] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#160D10] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#645257]">{item.text}</p>
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

export default function JohnnieWalkerStyleCaseStudy({ entry }: Props) {
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
    <div className="relative overflow-hidden bg-[#FDFBFB]">
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
