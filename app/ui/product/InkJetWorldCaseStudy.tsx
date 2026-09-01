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

// Contentful wiring — related cards only. `entry.fields.elements` may
// hold up to 4 `contentDetail` entries; `[0]` is reserved for this case
// study's own hero source elsewhere in the sibling files, but this
// `Hero` has no `.hero-shot` photo to override (see the doc comment
// below), so it's left untouched here. `[1]`–`[3]` each become one
// `RelatedSection` card (see `resolveRelatedItem`) — everything falls
// back to the hardcoded `RELATED` list individually when `entry` is
// omitted or those fields are unset.
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
 * `InkJetWorldCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-inkjet-world.html`. Same
 * treatment as its siblings in this folder (`LoneRiverCaseStudy`/
 * `RedMirchiCaseStudy`/`KaneffCaseStudy`): keeps the reference's own
 * colour identity (`--ink` `#0C1614`, `--body` `#4F6560`, `--accent`
 * `#0F8560`, `--accent-2` `#0F8560`, `--warm` `#C97A2B`, the
 * `--deep-1`/`--deep-2` `#08110F`/`#12241F` near-black-green gradient)
 * rather than the site's per-page `themeColor` accent, and typography
 * stays the site's own inherited `Poppins`. Every heading size, lede
 * size, and section container width (`max-w-*`) matches its siblings
 * exactly — 12px eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s,
 * 16px/1.8 ledes, `max-w-7xl` for the wide sections, `max-w-5xl` for the
 * narrow prose ones, `max-w-6xl` for "what we built" — rather than the
 * numbers baked into the reference's own stylesheet. Content is still
 * the reference's own hardcoded copy/photography; the only genuine
 * Contentful wiring is the optional `entry` prop (see the doc comment
 * above the `isEntry` helper) — up to 3 `contentDetail` entries can
 * override the related-case-study cards, each falling back to its own
 * hardcoded default individually when unset. Unlike its siblings there's
 * no hero-photo or gallery override here — see below.
 *
 * Two things unique to this one:
 * - The hero has no `.hero-shot` photo — the reference's own hero is
 *   text-and-facts only, so unlike every other sibling's `Hero`, this one
 *   renders no image at all rather than inventing one, and there's
 *   nothing here for Contentful to override.
 * - A "The structure" section (`CategoriesSection`) between "what we
 *   built" and "the detail that mattered" that none of its siblings
 *   have — the reference's own 5-card category grid plus a second pull
 *   quote about the Thesis Center category, built fresh here rather than
 *   reusing another section's shape.
 *
 * "What we built"'s 3 rows all illustrate with the reference's own
 * hand-drawn inline SVG diagrams (two-paths triage → configuration steps
 * → account/order-tracking), same `DIAGRAMS` map idiom `KaneffCaseStudy`/
 * `LoneRiverCaseStudy` use. "The detail that mattered"'s 4 cards each
 * carry an extra small "who" label above the heading (e.g. "The
 * bereaved family") — the reference's own device for naming which
 * customer that card is about — so `CARE_CARDS` here has a `who` field
 * its siblings' care-card shapes don't.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `inkjetWorld`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/diagram fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-inkjet-world.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "InkJet World, Maynooth" },
  { k: "Sector", v: "Print & retail · Irish SME" },
  { k: "Services", v: "Experience Design · Digital Commerce · Support" },
  { k: "Catalogue", v: "~45 product types, five categories" },
  { k: "Status", v: "Built from scratch, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "~45", l: "Product types, from business cards to hi-vis" },
  { v: "5", l: "Categories, each with its own buying behaviour" },
  { v: "2", l: "Routes to a price — checkout, or a conversation" },
  { v: "—", l: "Orders placed online since launch" },
  { v: "—", l: "Share of revenue now self-serve" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The customer isn't a designer",
    text: "Most people ordering print have a rough idea, a deadline, and no vocabulary for paper weights or finishes. The configuration has to guide someone to a good decision without requiring them to already know the answer.",
  },
  {
    n: "02",
    title: "The price has to be honest all the way through",
    text: "Irish shoppers expect the number they see to be the number they pay. Tax-inclusive pricing that moves as options are chosen, with nothing appearing at the last step — otherwise the checkout becomes the place trust is lost.",
  },
  {
    n: "03",
    title: "Five categories, five different customers",
    text: "A construction firm buying hi-vis, a student binding a thesis, an architect printing plans, a family ordering memorial cards. Same shop, same checkout, entirely different needs and states of mind.",
  },
];

/* =========================================================
   WHAT WE BUILT — diagrams
========================================================= */

function TwoPathsDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="Products split into two routes: straightforward jobs go to checkout, complex jobs go to an enquiry that reaches a person."
    >
      <rect x="18" y="112" width="128" height="76" rx="14" fill="#F1F7F4" stroke="#E0EAE6" />
      <text x="82" y="146" fill="#0C1614" fontFamily="IBM Plex Sans, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">
        A product
      </text>
      <text x="82" y="166" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        ~45 types
      </text>
      <path d="M154 150h44" stroke="#0F8560" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M192 144l8 6-8 6" fill="none" stroke="#0F8560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="206" y="118" width="104" height="64" rx="14" fill="#0F8560" />
      <text x="258" y="145" fill="#fff" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="600" textAnchor="middle">
        Can we price
      </text>
      <text x="258" y="163" fill="#C8EFDF" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="600" textAnchor="middle">
        it honestly?
      </text>
      <g stroke="#0F8560" strokeWidth="2" fill="none" opacity=".6">
        <path d="M318 138h34c18 0 26-10 26-26V78" />
        <path d="M318 164h34c18 0 26 10 26 26v28" />
      </g>
      <g fill="#0F8560" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">
        <text x="332" y="106">YES</text>
        <text x="332" y="204">NOT YET</text>
      </g>
      <rect x="378" y="40" width="126" height="72" rx="14" fill="#fff" stroke="#0F8560" />
      <text x="441" y="70" fill="#0C1614" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" textAnchor="middle">
        Add to cart
      </text>
      <text x="441" y="90" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        price inc. VAT
      </text>
      <rect x="378" y="188" width="126" height="72" rx="14" fill="#FDF6EC" stroke="#C97A2B" />
      <text x="441" y="218" fill="#0C1614" fontFamily="IBM Plex Sans, sans-serif" fontSize="12.5" fontWeight="600" textAnchor="middle">
        Ask about it
      </text>
      <text x="441" y="238" fill="#C97A2B" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        reaches a person
      </text>
    </svg>
  );
}

function ConfigurationDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="Product options chosen in sequence, with the price updating as each choice is made."
    >
      <rect x="30" y="30" width="300" height="240" rx="16" fill="#fff" stroke="#E0EAE6" />
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5">
        <text x="54" y="62" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">STEP 1</text>
        <text x="54" y="82" fill="#0C1614" fontWeight="600">Pages</text>
        <rect x="150" y="66" width="156" height="24" rx="7" fill="#F1F7F4" stroke="#E0EAE6" />
        <text x="164" y="83" fill="#4F6560">142</text>
        <text x="54" y="126" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">STEP 2</text>
        <text x="54" y="146" fill="#0C1614" fontWeight="600">Colour pages</text>
        <rect x="150" y="130" width="156" height="24" rx="7" fill="#F1F7F4" stroke="#E0EAE6" />
        <text x="164" y="147" fill="#4F6560">18</text>
        <text x="54" y="190" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5">STEP 3</text>
        <text x="54" y="210" fill="#0C1614" fontWeight="600">Binding</text>
        <rect x="150" y="194" width="156" height="24" rx="7" fill="#E4F6EF" stroke="#0F8560" />
        <text x="164" y="211" fill="#0F8560">Hard cover</text>
      </g>
      <path d="M54 238h252" stroke="#E0EAE6" />
      <text x="54" y="260" fill="#0C1614" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="600">Total</text>
      <text x="306" y="260" fill="#0F8560" fontFamily="IBM Plex Sans, sans-serif" fontSize="14" fontWeight="600" textAnchor="end">
        €38.60
      </text>
      <text x="306" y="276" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="end">
        inc. VAT
      </text>
      <g stroke="#0F8560" strokeWidth="1.6" fill="none" opacity=".5" strokeDasharray="4 5">
        <path d="M340 78h58v170h-58" />
        <path d="M340 142h30" />
        <path d="M340 206h44" />
      </g>
      <rect x="404" y="130" width="94" height="42" rx="10" fill="#0F8560" />
      <text x="451" y="150" fill="#fff" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">PRICE</text>
      <text x="451" y="164" fill="#C8EFDF" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">UPDATES</text>
    </svg>
  );
}

function AccountDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Customer account showing saved designs, order history and tracking.">
      <rect x="26" y="34" width="176" height="232" rx="14" fill="#fff" stroke="#E0EAE6" />
      <text x="114" y="62" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        MY DESIGNS
      </text>
      <g fill="#F1F7F4" stroke="#E0EAE6">
        <rect x="48" y="76" width="60" height="42" rx="7" />
        <rect x="120" y="76" width="60" height="42" rx="7" />
        <rect x="48" y="128" width="60" height="42" rx="7" />
        <rect x="120" y="128" width="60" height="42" rx="7" />
      </g>
      <g fill="#0F8560" opacity=".55">
        <rect x="58" y="90" width="40" height="6" rx="3" />
        <rect x="130" y="90" width="40" height="6" rx="3" />
        <rect x="58" y="142" width="40" height="6" rx="3" />
        <rect x="130" y="142" width="40" height="6" rx="3" />
      </g>
      <rect x="48" y="188" width="132" height="30" rx="8" fill="#E4F6EF" stroke="#0F8560" />
      <text x="114" y="207" fill="#0F8560" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        REORDER IN 1 MIN
      </text>
      <rect x="226" y="34" width="268" height="232" rx="14" fill="#fff" stroke="#E0EAE6" />
      <text x="360" y="62" fill="#82968F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        ORDER TRACKING
      </text>
      <g stroke="#0F8560" strokeWidth="2.4" fill="none">
        <path d="M258 130h204" />
      </g>
      <g fill="#0F8560">
        <circle cx="258" cy="130" r="9" />
        <circle cx="326" cy="130" r="9" />
        <circle cx="394" cy="130" r="9" />
      </g>
      <circle cx="462" cy="130" r="9" fill="#fff" stroke="#C6D8D2" strokeWidth="2.4" />
      <g fill="#4F6560" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        <text x="258" y="160">Received</text>
        <text x="326" y="160">Proofing</text>
        <text x="394" y="160">Printing</text>
        <text x="462" y="160">Ready</text>
      </g>
      <g fill="#F1F7F4" stroke="#E0EAE6">
        <rect x="258" y="188" width="204" height="26" rx="7" />
        <rect x="258" y="222" width="204" height="26" rx="7" />
      </g>
      <g fill="#C6D8D2">
        <rect x="272" y="198" width="90" height="7" rx="3.5" />
        <rect x="272" y="232" width="118" height="7" rx="3.5" />
      </g>
    </svg>
  );
}

const DIAGRAMS = {
  twoPaths: TwoPathsDiagram,
  configuration: ConfigurationDiagram,
  account: AccountDiagram,
} as const;

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  diagram: keyof typeof DIAGRAMS;
}[] = [
  {
    n: "01 · Two paths",
    title: "Buy it, or ask about it",
    desc: "Every product was assessed for whether it could be honestly priced without a conversation. Straightforward jobs go through the cart. Complex ones offer an enquiry instead — name, contact, and what you're trying to do — so the highest-value work reaches a person rather than bouncing off a checkout that couldn't quote it.",
    bullets: [
      "Self-serve where the price is genuinely knowable up front",
      "An enquiry route on the product page itself for jobs that need scoping",
      "Neither treated as the lesser path — an enquiry is a lead, not a failed sale",
    ],
    diagram: "twoPaths",
  },
  {
    n: "02 · Configuration",
    title: "Options in the order a person decides them",
    desc: "Not the order they sit in the supplier's system. Someone ordering thesis binding thinks about page count before cover material, and the price updates as they go — tax included — so nothing changes when they reach the checkout.",
    bullets: [
      "Variable pricing driven by the choices that actually change cost",
      "Tax-inclusive throughout, with a visible range before options are chosen",
      "Plain language rather than trade terms nobody outside print uses",
      "Free delivery threshold stated up front, not discovered at the end",
    ],
    diagram: "configuration",
  },
  {
    n: "03 · The account",
    title: "Print is repeat business, so the account matters",
    desc: "Almost nobody orders business cards once. The account layer turns a transaction into a relationship — saved artwork, previous orders, order tracking and a wishlist — so the second order takes a minute rather than starting from nothing.",
    bullets: [
      "Saved designs, so reordering doesn't mean re-uploading",
      "Order history and tracking — print has a lead time, and people check",
      "Wishlist and comparison for people specifying before they buy",
      'Fewer "can you send my file again" calls into the shop',
    ],
    diagram: "account",
  },
];

const CATEGORIES: { c: string; n: string; text: string }[] = [
  { c: "Largest", n: "Business Printing", text: "Cards, letterheads, banners, menus, signage, branded items. The everyday commercial work." },
  { c: "Trade", n: "Garment Printing", text: "Work shirts, hi-vis, embroidery, school hoodies. Bought by organisations, not individuals." },
  { c: "Stock", n: "Inks & Toners", text: "Straightforward physical goods. The only genuinely conventional part of the catalogue." },
  { c: "Specialist", n: "Quick Print", text: "Fine art, architectural drawings, memorial cards. Small volume, high care, mostly scoped." },
  { c: "Local", n: "Thesis Center", text: "A whole top-level category for one product — because Maynooth is a university town." },
];

const CARE_CARDS: { who: string; title: string; text: string }[] = [
  {
    who: "The bereaved family",
    title: "Quieter, shorter, no upsell",
    text: "Memorial cards sit in the same catalogue as snow globes. That route is deliberately plain, doesn't suggest related products and doesn't ask anyone to compare options. It's the clearest example of design as restraint on this project.",
  },
  {
    who: "The student",
    title: "Fast, priced, self-serve at midnight",
    text: "Deadline pressure and a small budget. Page count in, price out, order placed at two in the morning without needing anyone to be awake. Speed and certainty matter more than anything else here.",
  },
  {
    who: "The trade buyer",
    title: "Reorder, don't rediscover",
    text: "A site manager buying hi-vis wants exactly what they bought last time. Saved designs, order history and a short path to repeat — no browsing, no reconsidering.",
  },
  {
    who: "The specifier",
    title: "Detail before decision",
    text: "Architects and photographers care about sizes, materials and line quality. They get real specification detail and a comparison tool, because for them the choice genuinely is technical.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Learn what the counter actually does",
    text: 'Which questions staff ask, in what order, and where a job stops being standard. That conversation became the structure of the product pages.',
  },
  {
    n: "02",
    title: "Sort the catalogue by how it sells",
    text: "Every product assessed for whether it could be priced honestly online. That single decision shaped the whole shop and protected the high-value work from a checkout that couldn't quote it.",
  },
  {
    n: "03",
    title: "Design the configuration around the customer",
    text: "Options sequenced the way someone decides them, in plain language, with the price moving as they choose and tax included throughout.",
  },
  {
    n: "04",
    title: "Build the repeat-purchase layer",
    text: "Accounts, saved artwork, order history and tracking — the parts that make the second order easy and take routine calls away from the shop.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. New products, seasonal ranges, pricing changes and platform maintenance delivered as ongoing work rather than a project each time.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Platform", items: ["WordPress", "WooCommerce", "Variable products", "Tax-inclusive pricing"] },
  { title: "Shopping", items: ["Configurable options", "Quote enquiry route", "Wishlist & comparison", "Quick view"] },
  { title: "Accounts", items: ["Saved designs", "Order history", "Order tracking", "Customer accounts"] },
  { title: "Operations", items: ["Irish delivery rules", "Payment methods", "Product management by staff", "Ongoing maintenance"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/Kaneff",
    img: "https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp",
    alt: "Kaneff Group document platform on SharePoint Online",
    k: "Real estate",
    title: "Kaneff Group",
    text: "7 TB read, cleaned and moved — with 20% less storage after.",
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

function Eyebrow({ children, color = "#0F8560" }: { children: ReactNode; color?: string }) {
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
          dark ? "text-white" : "text-[#0C1614]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A4BAB3]" : "text-[#4F6560]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#0F8560" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#08110F] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#6F8A82] uppercase">
          <li>
            <Link href="/" className="text-[#9DB5AD] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9DB5AD] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">InkJet World</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO — no `.hero-shot` photo in the reference, so none rendered here
========================================================= */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLParagraphElement>(null);
  const standRef = useRef<HTMLParagraphElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);

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
    const targets = [clientRef.current, standRef.current, factsRef.current, visitRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(clientRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(standRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.5)
        .from(factsRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(visitRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.7);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#08110F] to-[#12241F] pt-12 pb-12 text-[#E8F3EF] sm:pt-16 sm:pb-16 lg:pt-[88px] lg:pb-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,207,163,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#0F8560] uppercase">
          Case study · InkJet World · Maynooth, Co. Kildare
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[20ch] text-[clamp(34px,4.7vw,58px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          You can&apos;t put &quot;a poster&quot; in a shopping cart.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A4BAB3]">
          Print has no fixed product. The price depends on size, material, quantity, finish, page count and how many
          of those pages are colour. Some jobs can be sold from a shelf; others don&apos;t have a price until
          someone has understood them. We designed and built the shop that holds both — for a print business in a
          Kildare university town — and we still support it.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#08110F] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px] text-[#6F8A82] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#E8F3EF]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://staginginkjet.oxytalapps.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#0F8560] hover:bg-[#0F8560]/12"
        >
          Visit the site
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E0EAE6] bg-[#E0EAE6] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#0F8560]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#4F6560]">{item.l}</div>
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead
          eyebrow="The challenge"
          title="A counter business, and everything the counter did."
          headingLevel="h2"
          narrow={false}
        />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0C1614]">
          InkJet World is a print and design business on Mill Street in Maynooth. Someone walks in, describes what
          they need, and a person works out what&apos;s possible and what it costs. That conversation is the product
          — and it&apos;s the thing a website has to either replace or deliberately preserve.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4F6560]">
          The catalogue is enormous for a business this size. Business cards, letterheads, roll-up banners,
          restaurant menus, ID cards, stickers, snow globes, canvas prints, embroidery, work shirts, hi-vis vests,
          inks and toners, architectural drawings, fine art prints, memorial cards, thesis binding. Around forty-five
          distinct product types across five categories, most of them configurable.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#4F6560]">
          And almost none of them have a single price. A thesis is priced on page count and how many of those pages
          are colour. Architectural drawings depend on size. A banner depends on material and finish. Putting one
          fixed number next to any of that is either wrong or unprofitable.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#0F8560] bg-[#E4F6EF] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0C1614]">
            The temptation with a catalogue like this is to force everything into a cart, because a cart is what an
            online shop has. That would have quietly lost the highest-value work — the jobs that need a conversation
            before they need a price.
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
    <section className="bg-gradient-to-b from-[#F0F8F5] to-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three problems a template shop can't solve."
            headingLevel="h2"
            lede="Any theme will give you a catalogue and a checkout. None of them decide which of your products belong in it."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E0EAE6] bg-[#E0EAE6] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#0F8560]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0C1614] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#4F6560]">{card.text}</p>
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="A shop that knows what it can't sell by itself."
            headingLevel="h2"
            lede={
              <>
                The structural decisions came before the design work, because on a catalogue this varied the
                structure <em>is</em> the design work.
              </>
            }
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
        <span className="mb-3.5 block font-semibold text-[12px] text-[#0F8560]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0C1614] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#4F6560]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#4F6560]",
                index > 0 && "border-t border-[#F1F7F4]"
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
        className="rounded-[18px] border border-[#E0EAE6] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(12,22,20,0.2)] sm:p-7"
      >
        <Diagram />
      </div>
    </div>
  );
}

/* =========================================================
   THE STRUCTURE — categories
========================================================= */

function CategoriesSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);
  const pullRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-gradient-to-b from-[#F0F8F5] to-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="The structure"
            title="Five categories, because there are five kinds of customer."
            headingLevel="h2"
            lede="The catalogue isn't organised the way a printer thinks about presses. It's organised the way customers arrive — and one of those categories exists purely because of where the shop is."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <div key={cat.n} className="rounded-2xl border border-[#E0EAE6] bg-white p-5.5">
              <span className="mb-2.5 block font-semibold text-[10px] text-[#0F8560] uppercase">
                {cat.c}
              </span>
              <div className="mb-1.5 text-[16px] font-extrabold tracking-[-0.02em] text-[#0C1614]">{cat.n}</div>
              <p className="text-[13.5px] leading-[1.55] text-[#4F6560]">{cat.text}</p>
            </div>
          ))}
        </div>

        <div
          ref={pullRef}
          className="mt-8.5 rounded-r-[14px] border-l-[3px] border-[#0F8560] bg-[#E4F6EF] py-6.5 pr-7 pl-7.5"
        >
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0C1614]">
            Thesis Center only makes sense if you know the shop is minutes from Maynooth University. It&apos;s one
            product given the same billing as thirty-seven — because for a few weeks a year it&apos;s the busiest
            thing in the building.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE DETAIL THAT MATTERED
========================================================= */

function DetailThatMatteredSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#08110F] to-[#12241F] px-5 py-14 text-[#E8F3EF] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(79,207,163,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#0F8560"
            headingLevel="h3"
            title="One shop, four very different people."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A4BAB3]">
            A supermarket sells to one kind of shopper in roughly one kind of mood. This shop doesn&apos;t. The same
            checkout serves a student who left the thesis until Tuesday, a family choosing memorial cards, a site
            manager restocking hi-vis, and an architect who needs drawings by lunchtime.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A4BAB3]">
            <strong className="font-semibold text-white">
              Designing one experience for all four is the actual problem
            </strong>{" "}
            — and the answer isn&apos;t a single tone that averages them out. It&apos;s letting each route feel
            appropriate while sharing one system underneath.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#08110F] p-6.5">
              <span className="mb-2.5 block font-semibold text-[9.5px] text-[#0F8560] uppercase">
                {card.who}
              </span>
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9DB5AD]">{card.text}</p>
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Started at the counter."
            headingLevel="h3"
            lede='The most useful research on this project wasn&apos;t a survey. It was understanding what happens when someone walks in and says "I need something printed."'
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E0EAE6] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E0EAE6]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#0F8560]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0C1614] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#4F6560]">{phase.text}</p>
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#08110F] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(79,207,163,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#0F8560"
              headingLevel="h3"
              title="A catalogue this size is never finished."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A4BAB3]">
              Forty-five product types means new lines every season, prices that move with paper costs, and a
              Christmas range that has to be up in October. A shop like this doesn&apos;t get built once — it gets
              tended.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A4BAB3]">
              We&apos;re still on it. The team that built it adds the products, adjusts the pricing and keeps the
              platform current, so the business isn&apos;t waiting on a supplier every time it wants to sell
              something new.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#0F8560]">
              {"Built,\nthen tended"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9DB5AD]">
              Ongoing product additions, pricing updates, seasonal ranges and platform maintenance — from the team
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
    <section className="bg-gradient-to-b from-[#F0F8F5] to-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Chosen so the shop can run itself."
            headingLevel="h4"
            lede="A small business shouldn't need a developer to add a product or change a price. Everything here was picked for what the InkJet World team can maintain without us — a different test from what we'd enjoy building."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#0F8560] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#4F6560]", index > 0 && "border-t border-[#F1F7F4]")}>
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
 * `[0]` stays reserved for a hero source this file doesn't use, see the
 * default export below) to one `RelatedSection` card. Same field
 * convention `CaseStudiesListing`'s own card mapping uses elsewhere in
 * this app: `heroImage` for the photo, `category` for the small tag,
 * `title`/`shortDescription` for the copy (capped at
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
    <section className="bg-[#FBFDFC] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E0EAE6] bg-white hover:-translate-y-1 hover:border-[#BEE0D2] hover:shadow-[0_20px_44px_-20px_rgba(12,22,20,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-semibold text-[12px] text-[#0F8560] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0C1614] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#4F6560]">{item.text}</p>
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

export default function InkJetWorldCaseStudy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );

  // `[0]` stays reserved for a hero source, matching the sibling files'
  // convention, but this case study's `Hero` has no photo to override —
  // so only the 3 related-case-study cards are wired here, starting at
  // `[1]`. `resolveRelatedItem` drops any that don't resolve (missing
  // entry, or no `heroImage`), and `RelatedSection` falls back to its
  // own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2], contentDetailEntries[3]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FBFDFC]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection />
      <CategoriesSection />
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
