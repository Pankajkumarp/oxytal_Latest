/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-digital-commerce_1.html` into
 * a single component. The reference page's `<style>` block (custom CSS
 * variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties — an orange/blue/teal scheme) is NOT
 * reproduced either; this file keeps the site's own orange (`#fe7f52`)
 * brand colour already established by the sibling `DigitalStrategyPage`/
 * `UiExperiencePage`/`SoftwareDevelopmentPage`/`CloudDigitaPage`/
 * `EnterpriseSystemPage` conversions in this folder, so every accent below
 * is orange regardless of what colour the reference document used for it.
 * The one exception is the platform-version checker's ok/warn/stop status
 * colours (green/amber/red) — that's a semantic traffic-light indicator,
 * not branding, so it keeps the reference's own colours the same way
 * `CloudDigitaPage`'s before/after markers kept their red/green.
 *
 * This reference's section list is its own shape again: a dark "Why
 * Oxytal" (like `SoftwareDevelopmentPage`/`DigitalCommercePage`'s own),
 * an "Evidence" stats + work-cards section (same pattern as
 * `SoftwareDevelopmentPage`'s), but no "Stack" section and no three-client
 * "Proof". The section unique to this page is the two-step "Platform" ➜
 * "Version" cascading picker (`PlatformChecker`) — a genuinely different
 * interaction from every other page's single-select `DecisionHelper`, so
 * it's a new component rather than a reuse.
 *
 * The reference's own `IntersectionObserver`-driven `.reveal`/`.reveal.in`
 * fade-ins are replaced by this folder's shared GSAP reveal hooks (see
 * `useReveal.ts`), the same ones `DigitalCommerce.tsx` (the hero) uses.
 *
 * The reference hero's large inline decorative illustration (a single
 * ~40KB `<svg>` of bespoke line art) is approximated with a few blurred
 * gradient blobs instead of being transcribed — everything else is a
 * faithful, section-by-section copy of the reference's copy and structure.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TrendingDown, Settings, Globe, ShieldAlert } from "lucide-react";
import { cx } from "@/app/lib/cx";
import {
  prefersReducedMotion,
  useCardHover,
  useDrawPath,
  useFadeUp,
  useSplitReveal,
  useStaggerReveal,
} from "./useReveal";
import { ComposableElementSkeleton, DataImageSkeleton } from "@/app/types/contentful";
import { Entry, EntrySkeletonType } from "contentful";
import { getAssetUrl } from "@/app/lib/contentfulAsset";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// Contentful wiring — same shape as `DigitalCommerce.tsx`'s hero: the page
// only reads a `backgroundImage` field off the composable-element entry, so
// this is a trimmed copy of that file's `PlainEntry`/`AnyEntry`/`isEntry`.
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

// Hex values used only as raw `<svg>` `stroke`/`fill` attributes below —
// SVG presentation attributes aren't CSS, so Tailwind has no class for
// them; everywhere else in this file uses Tailwind arbitrary-value
// classes instead (`text-[#1A1220]`, `bg-[#fe7f52]`, ...).
const SVG_INK = "#1A1220";
const SVG_BODY = "#5C6072";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#fe7f52";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#5C6072]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#fe7f52] text-white hover:-translate-y-px hover:bg-[#f56937]");
const BTN_SECONDARY = cx(BTN_BASE, "border-[#EDE5E9] bg-white text-[#1A1220] hover:-translate-y-px hover:border-[#8D8E9E]");

function Eyebrow({
  children,
  variant = "brand",
  center = false,
}: {
  children: React.ReactNode;
  variant?: "brand" | "brand2";
  center?: boolean;
}) {
  return (
    <p
      className={cx(
        "mb-4 flex items-center gap-[9px] text-[12px] font-extrabold uppercase tracking-[0.16em]",
        variant === "brand" ? "text-[#fe7f52]" : "text-[#fe7f52]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#fe7f52]" : "bg-[#fe7f52]")}
      />
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  eyebrowVariant,
  title,
  lede,
  center = false,
  dark = false,
}: {
  eyebrow: string;
  eyebrowVariant?: "brand" | "brand2";
  title: string;
  lede?: string;
  center?: boolean;
  /** Why-Oxytal section only — sits on the dark `#1A1220` background. */
  dark?: boolean;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  return (
    <div className={center ? "text-center" : undefined}>
      <Eyebrow variant={eyebrowVariant} center={center}>
        {eyebrow}
      </Eyebrow>
      <h2
        ref={titleRef}
        className={cx(
          "max-w-2xl text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[34px] md:text-[40px]",
          dark ? "text-white" : "text-[#1A1220]",
          center && "mx-auto"
        )}
      >
        {title}
      </h2>
      {lede && (
        <p className={cx(LEDE, "text-[15.5px] leading-relaxed md:text-[17px] mt-4", dark && "text-[#B4ABB6]", center && "mx-auto")}>{lede}</p>
      )}
    </div>
  );
}

// ────────────────────────────── hero ──────────────────────────────
function Hero({ backgroundUrl }: { backgroundUrl?: string }) {
  const copyRef = useFadeUp<HTMLDivElement>();
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  const logosRef = useFadeUp<HTMLDivElement>();

  return (
    <section
      className={cx(
        "relative isolate min-h-[700px] overflow-hidden",
        "py-16 sm:py-20 md:min-h-[720px] md:py-24  bg-[linear-gradient(155deg,#FDF4F7_0%,#F8F5FE_55%,#FCFBFD_100%)]"
      )}
    >
      {/* Contentful-supplied background image, when set — falls back to the
          decorative bloom below (a stand-in for the reference's bespoke
          inline art) when no image is configured. */}
      {backgroundUrl && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 lg:left-[38%] right-0 z-[-1] overflow-hidden">
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      )}

      <div className="container relative mx-auto px-5 md:px-10">
        <div ref={copyRef} className="relative z-10 max-w-[720px] pt-4 md:pt-6">
          <Eyebrow>Digital Commerce</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#1A1220]"
          >
            Commerce experiences built to perform.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#fe7f52]">
            We don&rsquo;t sell a platform. We solve a commerce problem.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#5C6072]">
            Every commerce project starts as a business question &mdash; why aren&rsquo;t we converting, why does
            every order cost us three manual steps, why can&rsquo;t we launch in a new market without a six-month
            project. We answer that first. The platform decision comes second, and sometimes the answer is the one
            you already have.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Talk to our commerce team <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#work" className={BTN_SECONDARY}>
              See the outcomes
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            A 60-minute conversation. No pitch deck, no platform agenda.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Commerce clients</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Aviation Gin", "Bundaberg Rum", "Lone River", "Casa Famosa", "Taffer's Mixologist"].map((name) => (
              <li key={name} className="text-[0.98rem] font-semibold text-[#95919F]">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────── 1. business problem ──────────────────────────
const PROBLEMS = [
  {
    Icon: TrendingDown,
    title: "Traffic is fine. Revenue isn't.",
    body: "Spend is working and the funnel isn't. Usually it's checkout friction, page weight or a merchandising model that doesn't match how people actually buy.",
    say: '"We’re paying more for the same orders."',
  },
  {
    Icon: Settings,
    title: "Every order costs you people.",
    body: "Orders re-keyed into the ERP, stock reconciled by hand, invoices chased in a spreadsheet. Growth makes it worse rather than better.",
    say: '"We can’t scale without hiring."',
  },
  {
    Icon: Globe,
    title: "New markets take too long.",
    body: "A new region, currency, language or B2B channel turns into a six-month project because the platform was built for one way of selling.",
    say: '"Every expansion is a rebuild."',
  },
  {
    Icon: ShieldAlert,
    title: "The platform has become a risk.",
    body: "An unsupported version, a checkout customisation nobody dares touch, a developer who left. It works — until the day it doesn't.",
    say: '"Nobody wants to be the one who breaks it."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#fef1ed] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#fef1ed]">
        <Icon size={20} strokeWidth={1.9} className="text-[#fe7f52]" />
      </div>
      <h3 className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#1A1220]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#5C6072]">{body}</p>
      <p className="mt-[14px] border-t border-[#F8F3F5] pt-[13px] text-[0.85rem] italic text-[#8D8E9E]">{say}</p>
    </div>
  );
}

function ProblemsSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="The business problem"
          title="Commerce rarely fails at the storefront."
          lede="It fails in the gap between the storefront and everything behind it — the systems, the manual work, the rules nobody wrote down. These are the four conversations we're brought into most often."
        />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => (
            <ProblemCard key={problem.title} {...problem} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────── 2. commerce capability ───────────────────────
// This reference's lifecycle diagram has no loop-back arrow or bottom
// caption (unlike every other page's) — just the straight line, six nodes
// and a small "we stay here" annotation over the final one.
const LIFECYCLE_STEPS = [
  { x: 40, label: "Strategy" },
  { x: 256, label: "Experience" },
  { x: 472, label: "Build" },
  { x: 688, label: "Integrate" },
  { x: 904, label: "Optimise" },
];

const CAPABILITIES = [
  { n: "01", title: "Commerce strategy", body: "Where the revenue actually leaks, what fixing it is worth, and the order to do it in." },
  { n: "02", title: "Experience & conversion", body: "Merchandising, product discovery and checkout designed against your real catalogue." },
  { n: "03", title: "Storefront engineering", body: "Themed or headless builds, replatforms and migrations that keep SEO equity intact." },
  { n: "04", title: "Systems integration", body: "ERP, PIM, 3PL, tax and CRM connected so orders stop being re-typed by people." },
  { n: "05", title: "B2B & expansion", body: "Company accounts, contract pricing and new markets without a rebuild each time." },
  { n: "06", title: "Run & optimise", body: "Patching, monitoring, peak-season cover and a roadmap — not a ticket queue." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#fe7f52]">{n}</span>
      <h3 className="mb-[7px] text-[1rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.875rem] leading-[1.58] text-[#5C6072]">{body}</p>
    </div>
  );
}

function CapabilitySection() {
  const lifeRef = useFadeUp<HTMLDivElement>();
  const linePathRef = useDrawPath<SVGPathElement>();
  const capsRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section className={cx(SECTION, "bg-[#F7F3F7]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          center
          eyebrow="Commerce capability"
          title="One team across the whole commerce lifecycle."
          lede="Strategy, design, engineering, integration and support sit in the same practice — so the person who scoped it is accountable for how it runs."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 130"
            className="block h-auto min-w-[720px] w-full"
            aria-label="Commerce lifecycle: strategy, experience, build, integrate, optimise, support — a continuous loop."
          >
            <defs>
              <linearGradient id="lifecycle-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffb268" />
                <stop offset=".5" stopColor={SVG_BRAND} />
                <stop offset="1" stopColor="#ff7fa6" />
              </linearGradient>
            </defs>
            <path d="M40 70H1120" stroke={SVG_LINE} strokeWidth={3} strokeLinecap="round" />
            <path
              ref={linePathRef}
              d="M40 70H1120"
              stroke="url(#lifecycle-gradient)"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <g fontSize={11.5} fill={SVG_BODY} textAnchor="middle">
              {LIFECYCLE_STEPS.map((s) => (
                <g key={s.label}>
                  <circle cx={s.x} cy={70} r={9} fill="#fff" stroke={SVG_BRAND} strokeWidth={3} />
                  <text x={s.x} y={105}>{s.label}</text>
                </g>
              ))}
              <g>
                <circle cx={1120} cy={70} r={12} fill={SVG_BRAND} />
                <text x={1120} y={105} fill={SVG_INK}>Support</text>
              </g>
            </g>
            <text x={1120} y={38} fontSize={10.5} fill={SVG_BODY} textAnchor="middle">
              we stay here
            </text>
          </svg>
        </div>

        <div ref={capsRef} className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE5E9] bg-[#EDE5E9] sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.n} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 3. platforms ───────────────────────────
const PLATFORMS = [
  {
    variant: "brand" as const,
    tag: "Platform",
    title: "Shopify & Shopify Plus",
    body: "Fast to market, cheap to operate, and a checkout that converts because Shopify spends more on optimising it than any single merchant could.",
    best: "Your complexity is commercial rather than structural — merchandising, promotions, multi-market, DTC growth — and you'd rather spend engineering budget on selling than on hosting.",
    items: ["Storefront & headless", "Checkout engineering", "B2B", "Markets & expansion", "App development"],
  },
  {
    variant: "indigo" as const,
    tag: "Platform",
    title: "Adobe Commerce & Magento",
    body: "Control over everything, including the parts you'd rather not own. Still the right answer when your rules genuinely can't be expressed in a SaaS platform.",
    best: "Complexity lives in the catalogue, in ERP-driven pricing, or in B2B rules with real approval hierarchies — and you need backend control that a managed platform won't give you.",
    items: ["Upgrades & security", "Performance", "B2B", "Cloud strategy", "Replatform assessment"],
  },
];

function PlatformCard({ variant, tag, title, body, best, items }: (typeof PLATFORMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  const isBrand = variant === "brand";
  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-[18px] border border-[#EDE5E9] bg-white p-[26px] sm:p-[34px]"
    >
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#fe7f52]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#fe7f52]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <h3 className="mb-3 text-[1.42rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.95rem] leading-[1.65] text-[#5C6072]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#F8F3F5] p-[16px_18px] text-[0.89rem] text-[#5C6072]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#fe7f52]" : "text-[#4351E6]")}>
          Best when
        </b>
        {best}
      </div>
      <ul className="mt-[18px] flex flex-wrap gap-[7px]">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[#EDE5E9] bg-white px-3 py-[5px] text-[0.8rem] text-[#5C6072]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Platform-version status checker. Two chained selects rather than the
// single-select `DecisionHelper` every other page uses, so it's its own
// component: `PLATFORM_VERSIONS` maps a platform key to its version
// options, each carrying an "ok" / "warn" / "stop" status plus a
// headline and body for the result panel.
type PlatformKey = "mos" | "ac" | "shopify";

interface VersionOption {
  label: string;
  status: "ok" | "warn" | "stop";
  headline: string;
  body: string;
}

const PLATFORM_OPTIONS: { value: PlatformKey; label: string }[] = [
  { value: "mos", label: "Magento Open Source" },
  { value: "ac", label: "Adobe Commerce" },
  { value: "shopify", label: "Shopify / Plus" },
];

const PLATFORM_VERSIONS: Record<PlatformKey, VersionOption[]> = {
  mos: [
    { label: "2.4.6 or earlier", status: "stop", headline: "Outside the supported window", body: "Security patching has ended for these lines on Open Source. Worth reviewing before it becomes a compliance question." },
    { label: "2.4.7", status: "warn", headline: "Supported, worth planning", body: "You have runway, but the upgrade belongs in this budget cycle rather than the next one." },
    { label: "2.4.8 or 2.4.9", status: "ok", headline: "Current", body: "You're on a supported line. Keep to the patch cadence and revisit in 2027." },
    { label: "Magento 1 / not sure", status: "stop", headline: "Needs a review", body: "Magento 1 has been unsupported since 2020. This is worth a conversation soon." },
  ],
  ac: [
    { label: "2.4.6 or earlier", status: "warn", headline: "Check your entitlement", body: "Licensed Adobe Commerce carries extended cover that Open Source doesn't. Teams get this wrong in both directions — verify before deciding." },
    { label: "2.4.7", status: "warn", headline: "Supported, worth planning", body: "Plan the upgrade in this cycle, and confirm your PHP version separately." },
    { label: "2.4.8 or 2.4.9", status: "ok", headline: "Current", body: "Supported line. Maintain the patch cadence." },
    { label: "On Cloud, not sure", status: "warn", headline: "Quick check needed", body: "Cloud carries its own upgrade enforcement timeline. Worth confirming against your contract." },
  ],
  shopify: [
    { label: "Plus, migrated to Extensibility", status: "ok", headline: "Current", body: "You're on the supported path. Worth confirming your tracking survived the migration — silent pixel loss is common." },
    { label: "Plus, not sure", status: "warn", headline: "Worth verifying", body: "Shopify has been auto-upgrading stores without opt-in. Yours may already have moved." },
    { label: "Basic / Grow / Advanced", status: "warn", headline: "Worth a check", body: "Some checkout deadlines apply below Plus too. A short audit settles it." },
    { label: "Not on Shopify yet", status: "ok", headline: "Nothing at risk", body: "No deadline pressure — the question is fit, not urgency." },
  ],
};

const STATUS_LABEL: Record<VersionOption["status"], string> = {
  ok: "Supported",
  warn: "Worth a look",
  stop: "Action needed",
};

// Semantic traffic-light colours (not the site's orange brand accent) —
// see the file-level doc comment above for why these stay as the
// reference has them.
const STATUS_STYLE: Record<VersionOption["status"], { bg: string; border: string; text: string }> = {
  ok: { bg: "#E4F7F1", border: "#BEE9DC", text: "#12A67C" },
  warn: { bg: "#FDF2DF", border: "#F5DDAE", text: "#D9820A" },
  stop: { bg: "#FDECEA", border: "#F6C7C0", text: "#D6412F" },
};

function PlatformChecker() {
  const [platform, setPlatform] = useState<PlatformKey | "">("");
  const [versionIndex, setVersionIndex] = useState<number | "">("");

  const versions = platform ? PLATFORM_VERSIONS[platform] : undefined;
  const selected = versions && versionIndex !== "" ? versions[versionIndex] : undefined;
  const style = selected ? STATUS_STYLE[selected.status] : undefined;

  return (
    <div className="mt-6 rounded-2xl border border-[#EDE5E9] bg-white p-6">
      <div className="grid grid-cols-1 items-end gap-[16px] lg:grid-cols-[1fr_auto_auto]">
        <div>
          <h4 className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#1A1220]">
            Not sure where your platform stands?
          </h4>
          <p className="text-[0.87rem] text-[#5C6072]">Version support windows move. Check yours in two clicks.</p>
        </div>
        <div>
          <label htmlFor="platform" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Platform
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value as PlatformKey | "");
              setVersionIndex("");
            }}
            className="min-w-full cursor-pointer rounded-[9px] border border-[#EDE5E9] bg-white px-3 py-[11px] text-[0.9rem] text-[#1A1220] lg:min-w-[190px]"
          >
            <option value="">Select…</option>
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="version" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Version
          </label>
          <select
            id="version"
            value={versionIndex}
            disabled={!versions}
            onChange={(e) => setVersionIndex(e.target.value === "" ? "" : Number(e.target.value))}
            className="min-w-full cursor-pointer rounded-[9px] border border-[#EDE5E9] bg-white px-3 py-[11px] text-[0.9rem] text-[#1A1220] disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[190px]"
          >
            {versions ? (
              <>
                <option value="">Select…</option>
                {versions.map((v, i) => (
                  <option key={v.label} value={i}>{v.label}</option>
                ))}
              </>
            ) : (
              <option>Select platform first</option>
            )}
          </select>
        </div>

        {selected && style && (
          <div
            className="rounded-xl border p-[17px_19px] lg:col-span-3"
            style={{ backgroundColor: style.bg, borderColor: style.border }}
          >
            <div className="mb-[7px] flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em]" style={{ color: style.text }}>
              <b aria-hidden className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: style.text }} />
              {STATUS_LABEL[selected.status]}
            </div>
            <strong className="mb-[5px] block text-[1rem] tracking-[-0.02em] text-[#1A1220]">{selected.headline}</strong>
            <p className="text-[0.88rem] leading-[1.58] text-[#5C6072]">
              {selected.body}{" "}
              <Link href="/contact-us" className="font-medium text-[#1A1220]">
                Book a review &rarr;
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformsSection() {
  const platformsRef = useStaggerReveal<HTMLDivElement>();
  const neutralRef = useFadeUp<HTMLDivElement>();
  const checkerRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Platforms"
          title="We build on both. That's the point."
          lede="An agency that only builds on one platform will always find a reason it's the right one. We've delivered on Shopify and Adobe Commerce for years, so the recommendation follows your catalogue, your operating model and your three-year cost — not our bench."
        />

        <div ref={platformsRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {PLATFORMS.map((p) => (
            <PlatformCard key={p.title} {...p} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#fe7f52] bg-[#fe7f520f] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#1A1220]">
            <strong>And sometimes we tell you to stay put.</strong> A replatform is the most expensive answer to
            most commerce problems. If your issue is checkout friction or a missing integration, we&rsquo;ll say
            so &mdash; even though the smaller project is the less profitable one for us.
          </p>
        </div>

        <div ref={checkerRef}>
          <PlatformChecker />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 4. why oxytal (dark) ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "We're platform-neutral by construction", body: "Two established practices, not one plus a landing page. ", em: "Our recommendation costs us money when it's the smaller project", tail: " — which is exactly why you can trust it." },
  { n: "02", title: "We build products, not just projects", body: "Oxytal ships and supports applications in the Shopify ecosystem. ", em: "We've been through app review, performance budgets and merchant support from the other side", tail: " — so our advice comes from operating software, not just delivering it." },
  { n: "03", title: "Commerce isn't a silo here", body: "Integration, cloud, data and AI are in-house practices at Oxytal. ", em: "Your ERP work doesn't get subcontracted to a partner you never meet", tail: ", and the people doing it sit in the same standups." },
  { n: "04", title: "Agent-accelerated delivery", body: "Forge, our own agent platform, runs our delivery lifecycle — requirements, test generation, security scanning. ", em: "You get enterprise rigour at a pace that doesn't match the price tag", tail: ", with a human approving every release." },
  { n: "05", title: "We're still there after go-live", body: "Most agencies hand over the keys and move on. ", em: "The engineers who built it run the support rota", tail: ", with peak-season cover agreed in writing before the season starts." },
  { n: "06", title: "Dublin and Chandigarh, one team", body: "Senior accountability in your timezone, engineering depth and genuine overnight cover. ", em: "Not an offshore handoff at 6pm", tail: " — one team, two hubs, continuous coverage." },
];

// This section deliberately doesn't reuse `useCardHover`'s lift-and-shadow
// — every other card grid on the page already does that, and "why us"
// reads better as a reveal than a pop. Hovering draws in a left accent
// rule and pops the numeral, instead of moving the card.
function WhyCard({ n, title, body, em, tail }: (typeof WHY_CARDS)[number]) {
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const bar = barRef.current;
    const number = numberRef.current;
    if (!card || !bar || !number || prefersReducedMotion()) {
      return;
    }

    const tl = gsap
      .timeline({ paused: true })
      .to(bar, { scaleY: 1, duration: 0.35, ease: "power2.out" }, 0)
      .to(number, { scale: 1.2, x: 2, duration: 0.35, ease: "back.out(2.5)" }, 0);

    const onEnter = () => tl.play();
    const onLeave = () => tl.reverse();
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden bg-[#1A1220] p-[30px_28px] pl-[31px] transition-colors duration-200 hover:bg-[#241a28]"
    >
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#fe7f52]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#fe7f52]">{n}</span>
      <h3 className="mb-[9px] text-[1.1rem] font-bold leading-[1.3] text-white">{title}</h3>
      <p className="text-[0.9rem] leading-[1.62] text-[#B4ABB6]">
        {body}
        <em className="font-medium not-italic text-white">{em}</em>
        {tail}
      </p>
    </div>
  );
}

function WhySection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <div data-nav-contrast="dark">
    <section className={cx(SECTION, "relative overflow-hidden bg-[#1A1220]")}>
      <div className="pointer-events-none absolute -right-[25%] -top-[35%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(254,127,82,.24),transparent_65%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Why Oxytal"
          eyebrowVariant="brand2"
          title="Why us and not another Shopify or Magento agency?"
          lede="A fair question, and one you should ask everyone on your shortlist. Here's our honest answer."
        />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#332434] bg-[#332434] sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CARDS.map((c) => (
            <WhyCard key={c.n} {...c} />
          ))}
        </div>
      </div>
    </section>
    </div>
  );
}

// ─────────────────────────── 5. evidence ───────────────────────────
const STATS = [
  { value: "—", label: "Commerce builds delivered" },
  { value: "—", label: "Average conversion lift" },
  { value: "—", label: "Peak-season uptime" },
  { value: "—", label: "Years supporting live stores" },
];

const WORK = [
  {
    brand: "Placeholder — replace with real client",
    title: "DTC launch with compliant age gating",
    body: "Age verification, restricted-region logic and carrier rules enforced at checkout rather than bolted on afterwards — so compliance stopped being a manual review step.",
    outputs: [
      { value: "—", label: "Conversion lift" },
      { value: "—", label: "Weeks to launch" },
    ],
  },
  {
    brand: "Placeholder — replace with real client",
    title: "Replatform without losing rankings",
    body: "Catalogue, customer accounts and a decade of order history migrated, with organic search equity held through cutover and trading uninterrupted.",
    outputs: [
      { value: "—", label: "Downtime" },
      { value: "—", label: "Orders migrated" },
    ],
  },
  {
    brand: "Placeholder — replace with real client",
    title: "Order operations, automated",
    body: "ERP and 3PL integration that removed manual re-keying from every order — the team stopped growing headcount to keep pace with volume.",
    outputs: [
      { value: "—", label: "Manual steps removed" },
      { value: "—", label: "Hours saved monthly" },
    ],
  },
];

function StatTile({ value, label }: (typeof STATS)[number]) {
  return (
    <div className="bg-white p-[28px_24px]">
      <div className="text-[clamp(1.9rem,3.2vw,2.5rem)] font-bold tracking-[-0.03em] text-[#fe7f52] leading-none">
        {value}
      </div>
      <div className="mt-[9px] text-[0.87rem] leading-[1.45] text-[#5C6072]">{label}</div>
    </div>
  );
}

function WorkCard({ brand, title, body, outputs }: (typeof WORK)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="flex flex-col overflow-hidden rounded-2xl border border-[#EDE5E9] bg-white">
      <div aria-hidden className="h-[6px] bg-[linear-gradient(90deg,#fe7f52,#ffb1c8)]" />
      <div className="flex flex-1 flex-col p-[26px]">
        <span className="mb-[13px] text-[10.5px] uppercase tracking-[0.12em] text-[#8D8E9E]">{brand}</span>
        <h3 className="mb-[10px] text-[1.06rem] font-bold leading-[1.32] text-[#1A1220]">{title}</h3>
        <p className="flex-1 text-[0.89rem] leading-[1.6] text-[#5C6072]">{body}</p>
        <div className="mt-[18px] flex gap-6 border-t border-[#EDE5E9] pt-[15px]">
          {outputs.map((o) => (
            <div key={o.label}>
              <div className="text-[1.25rem] font-bold tracking-[-0.02em] text-[#fe7f52]">{o.value}</div>
              <div className="mt-[3px] text-[9.5px] uppercase tracking-[0.08em] text-[#8D8E9E]">{o.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvidenceSection() {
  const statsRef = useStaggerReveal<HTMLDivElement>();
  const workRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section id="work" className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Evidence"
          title="Outcomes, not screenshots."
          lede="Drinks and DTC brands are a harder commerce problem than they look — age verification, region-restricted shipping, allocation, and demand that spikes twentyfold in December. We've built for enough of them to know where it breaks."
        />

        <div ref={statsRef} className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE5E9] bg-[#EDE5E9] sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>

        <div ref={workRef} className="mt-6 grid grid-cols-1 gap-[22px] lg:grid-cols-3">
          {WORK.map((w) => (
            <WorkCard key={w.title} {...w} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 6. engagement ───────────────────────────
const ENGAGEMENT_MODES = [
  { k: "Start here", title: "Commerce review", body: "Two weeks. We look at the store, the systems behind it and where revenue is actually leaking, then give you a costed set of options with a recommendation and the reasoning.", meta: ["2 weeks · fixed fee", "Credited against a build"], featured: false },
  { k: "Most common", title: "Build or replatform", body: "Staged delivery with a stabilisation bridge, so you stay supported while the new platform is built. Cutover is rehearsed, not attempted, and designed around your trading calendar.", meta: ["8–24 weeks typical", "Fixed-price phases"], featured: true },
  { k: "Ongoing", title: "Support & growth", body: "A named engineering pod on retainer — the people who built it. Patching, monitoring, conversion work and a quarterly roadmap you set.", meta: ["Monthly retainer", "Peak cover agreed upfront"], featured: false },
];

function EngagementCard({ k, title, body, meta, featured }: (typeof ENGAGEMENT_MODES)[number]) {
  // The featured mode sits on a dark card — same brand-tinted-glow-on-dark
  // reasoning as `WorkCard`/`WhyCard` above.
  const cardRef = useCardHover<HTMLDivElement>(
    featured ? { shadow: "0 20px 40px -16px rgba(254,127,82,.35)" } : {}
  );
  return (
    <div
      ref={cardRef}
      className={cx(
        "flex flex-col rounded-2xl border p-7",
        featured ? "border-[#1A1220] bg-[#1A1220]" : "border-[#EDE5E9] bg-white"
      )}
    >
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#fe7f52]">{k}</span>
      <h3 className={cx("mb-[9px] text-[1.18rem] font-bold", featured ? "text-white" : "text-[#1A1220]")}>{title}</h3>
      <p className={cx("flex-1 text-[0.9rem] leading-[1.62]", featured ? "text-[#B4ABB6]" : "text-[#5C6072]")}>{body}</p>
      <div
        className={cx(
          "mt-[18px] flex flex-col gap-[5px] border-t pt-[15px] text-[11px]",
          featured ? "border-[#332434] text-[#9A8F9C]" : "border-[#EDE5E9] text-[#8D8E9E]"
        )}
      >
        {meta.map((line) => <span key={line}>{line}</span>)}
      </div>
    </div>
  );
}

function EngagementSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="How we engage" title="Three ways in. All start with thinking, not a quote." />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {ENGAGEMENT_MODES.map((m) => (
            <EngagementCard key={m.title} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────── faq ───────────────────────────────
const FAQS = [
  {
    q: "Should we replatform or fix what we have?",
    a: "Usually fix. A replatform is the most expensive answer to most commerce problems, and it resets a lot of institutional knowledge along with the code. If your issue is conversion, page speed or a missing integration, that's a project measured in weeks. We'll only recommend replatforming when the three-year cost of staying genuinely exceeds the cost of moving — and we'll show you the arithmetic.",
  },
  {
    q: "How do you decide between Shopify and Adobe Commerce?",
    a: "By where your complexity lives. If it's commercial — merchandising, promotions, markets, DTC growth — Shopify usually wins on total cost once you price in hosting, patching and the engineering hours a self-managed platform quietly consumes. If it's structural — catalogue depth, ERP-driven pricing, B2B approval hierarchies — Adobe Commerce is often cheaper over three years than rebuilding those rules in SaaS. We model both before recommending either.",
  },
  {
    q: "What does a commerce project actually cost?",
    a: "We won't quote a range on a web page, because the honest answer depends on catalogue size, integration count and how much of your process is currently undocumented. What we will do is fix the price of the first two weeks, so you get a costed plan before committing to a build. Most clients find the review pays for itself by removing one bad assumption from the scope.",
  },
  {
    q: "Who actually does the work?",
    a: "A named pod across Dublin and Chandigarh — the same engineers from build through to support. No account-manager layer between you and the people writing the code, and no reassignment after go-live. You'll meet them before you sign anything.",
  },
];

function FaqSection() {
  const listRef = useFadeUp<HTMLDivElement>();
  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Straight answers" title="What clients ask first." />
        <div ref={listRef} className="mt-[30px] max-w-[880px]">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="group border-b border-[#EDE5E9]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[19px] pr-1 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#1A1220] marker:content-none">
                {f.q}
                <span aria-hidden className="text-[1.35rem] font-normal text-[#fe7f52] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[76ch] pb-5 text-[0.93rem] leading-[1.7] text-[#5C6072]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── related + final CTA ─────────────────────────
const RELATED = [
  { k: "05", title: "Enterprise Integration", body: "ERP, PIM and 3PL connected to the storefront.", href: "/service/enterprise-system-integrations" },
  { k: "07", title: "AI & Agentic Engineering", body: "Automating the operational work behind each order.", href: "/service/ai-and-intelligent-automation" },
  { k: "04", title: "Cloud & Transformation", body: "Infrastructure that holds through peak trading.", href: "/service/cloud-digital-transformation" },
  { k: "02", title: "Experience Design", body: "The research behind why people don't convert.", href: "/service/ui-ux-design" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#8D8E9E]">{k}</span>
      <h3 className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.85rem] leading-[1.55] text-[#5C6072]">{body}</p>
    </Link>
  );
}

function RelatedAndCtaSection() {
  const relRef = useStaggerReveal<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Related services" title="Commerce rarely travels alone." />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#1A1220)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(254,127,82,.42),transparent_66%)]" />
          <div className="relative">
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with the business problem.
            </h2>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes. Bring the thing that&rsquo;s actually worrying you &mdash; the number that won&rsquo;t
              move, the process that needs three people, the platform nobody wants to touch. We&rsquo;ll tell you
              what we&rsquo;d do, and whether we&rsquo;re the right people to do it.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Talk to our commerce team <span aria-hidden>&rarr;</span>
            </Link>
            <a href="mailto:info@oxytal.com" className={cx(BTN_SECONDARY, "justify-center")}>
              Email info@oxytal.com
            </a>
            <p className="mt-[2px] text-center text-[10.5px] text-[#9A8F9C]">Reply within one business day</p>
          </div>
        </div>
      </div>
    </section>
  );
}
// ────────────────────────────── page ──────────────────────────────
export default function DigitalCommercePage({ entry }: Props) {
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
    )
    : undefined;

  return (
    <main className="bg-[#FDFBFC]">
      <Hero backgroundUrl={backgroundUrl} />
      <ProblemsSection />
      <CapabilitySection />
      <PlatformsSection />
      <WhySection />
      <EvidenceSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
