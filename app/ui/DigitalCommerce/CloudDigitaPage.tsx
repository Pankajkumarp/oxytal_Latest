/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-cloud-transformation.html`
 * into a single component. The reference page's `<style>` block (custom
 * CSS variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties — a blue/violet scheme) is NOT reproduced
 * either; this file keeps the site's own orange (`#2c87cc`) brand colour
 * already established by the sibling `DigitalStrategyPage`/
 * `UiExperiencePage`/`SoftwareDevelopmentPage` conversions in this folder,
 * so every accent below is orange regardless of what colour the reference
 * document used for it. The one exception is the featured case study's
 * before/after list markers, which keep the reference's red/green — that's
 * a semantic "problem vs. fixed" colour, not a brand accent.
 *
 * This reference's section list is its own shape again (like
 * `SoftwareDevelopmentPage`, unlike `DigitalStrategyPage`/
 * `UiExperiencePage`): no five/six-item "Deliverables" grid here, no
 * three-client "Proof" case studies either — instead a single detailed
 * featured case study (Kaneff Group, with real KPI numbers and a
 * before/after comparison, kept as-is rather than genericised) plus the
 * "Stack" tech-columns section this project already built for
 * `SoftwareDevelopmentPage`. The component breakdown below follows this
 * reference's own section order.
 *
 * Two interactive bits from the reference couldn't stay as inline vanilla
 * JS and were re-implemented as React:
 *  - the "where the real work usually is" driver helper (a `<select>` +
 *    result panel driven by a plain object lookup) is now `DecisionHelper`,
 *    a `useState`-backed panel;
 *  - the reference's own `IntersectionObserver`-driven `.reveal`/`.reveal.in`
 *    fade-ins are replaced by this folder's shared GSAP reveal hooks (see
 *    `useReveal.ts`), the same ones `DigitalCommerce.tsx` (the hero) uses.
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
import { TrendingUp, Search, ShieldAlert, RotateCw, ArrowRight, Check, X } from "lucide-react";
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
import type { HeadingLevel } from "@/app/lib/headingLevel";
import DynamicHeading from "@/app/ui/DynamicHeading";

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
// classes instead (`text-[#0D1B2A]`, `bg-[#2c87cc]`, ...).
const SVG_INK = "#0D1B2A";
const SVG_BODY = "#55677f";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#2c87cc";
const SVG_BRAND_2 = "#2c87cc";
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#55677f]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#2c87cc] text-white hover:-translate-y-px hover:bg-[#065ea2]");
const BTN_SECONDARY = cx(BTN_BASE, "border-[#EDE5E9] bg-white text-[#0D1B2A] hover:-translate-y-px hover:border-[#8D8E9E]");

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
        variant === "brand" ? "text-[#2c87cc]" : "text-[#2c87cc]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#2c87cc]" : "bg-[#2c87cc]")}
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
  headingLevel = "h2",
}: {
  eyebrow: string;
  eyebrowVariant?: "brand" | "brand2";
  title: string;
  lede?: string;
  center?: boolean;
  /** Featured-case section only — sits on the dark `#0D1B2A` background. */
  dark?: boolean;
  /** Which heading tag to render — `h1`–`h6` (see app/lib/headingLevel.ts). Defaults to `h2`, this component's original fixed level, so every existing call site renders unchanged. */
  headingLevel?: HeadingLevel;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  return (
    <div className={center ? "text-center" : undefined}>
      <Eyebrow variant={eyebrowVariant} center={center}>
        {eyebrow}
      </Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-2xl text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[34px] md:text-[40px]",
          dark ? "text-white" : "text-[#0D1B2A]",
          center && "mx-auto"
        )}
      >
        {title}
      </DynamicHeading>
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
          <Eyebrow>Cloud &amp; Digital Transformation</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#0D1B2A]"
          >
            Move off legacy. Without taking the mess with you.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#2c87cc]">
            A migration is your one chance to fix what you&rsquo;re carrying. Most organisations waste it.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#55677f]">
            We move systems, data and documents from on-premise infrastructure to the cloud &mdash; and use AI to
            clean, classify and govern everything that moves. You land on something genuinely better, not the same
            problems at a higher monthly cost.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Book a cloud assessment <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#kaneff" className={BTN_SECONDARY}>
              See how we did it for Kaneff
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            A 60-minute conversation about what you&rsquo;re actually carrying.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Partners &amp; standards</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Microsoft Solutions Partner", "AWS Qualified", "Google Cloud Partner", "GDPR Compliant"].map((name) => (
              <li key={name} className="flex items-center gap-[8px] text-[0.9rem] font-medium text-[#66798F]">
                <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#2c87cc]" />
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
    Icon: TrendingUp,
    title: "Infrastructure costs climb every year.",
    body: "Hardware ages, storage grows, licences renew, and someone spends their week keeping it alive. There's no ceiling in sight and no plan to change it.",
    say: '"We’re paying more to stand still."',
  },
  {
    Icon: Search,
    title: "Nobody can find anything.",
    body: "Files scattered across departments with no consistent naming, duplicates everywhere, and scanned documents that no search will ever reach. People rebuild work that already exists.",
    say: '"It’s quicker to redo it than find it."',
  },
  {
    Icon: ShieldAlert,
    title: "We'd struggle in an audit.",
    body: "No retention rules, no record of who changed what, no way to prove anything was deleted when it should have been. It hasn't been tested yet — which isn't the same as being fine.",
    say: '"Nobody’s asked us to prove it. Yet."',
  },
  {
    Icon: RotateCw,
    title: "We started a transformation. It stalled.",
    body: "A programme began, some of it moved, and then it stopped somewhere in the middle. Now you're running two environments and paying for both.",
    say: '"We’re halfway to the cloud and it’s costing double."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#e4eff8] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#e4eff8]">
        <Icon size={20} strokeWidth={1.9} className="text-[#2c87cc]" />
      </div>
      <span className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.9rem] leading-[1.6] text-[#55677f]">{body}</p>
      <p className="mt-[14px] border-t border-[#f2f7fc] pt-[13px] text-[0.85rem] italic text-[#8D8E9E]">{say}</p>
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
          title="Legacy infrastructure rarely fails. It just quietly costs you more every year."
          headingLevel="h1"
          lede="Servers keep running, files keep saving, and the bill keeps climbing. By the time it reaches the board it's usually four problems at once. These are the conversations we're brought into most often."
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

// ─────────────────────── 2. cloud capability ───────────────────────
const LIFECYCLE_STEPS = [
  { x: 40, label: "Assess" },
  { x: 256, label: "Design" },
  { x: 472, label: "Migrate" },
  { x: 688, label: "Validate" },
  { x: 904, label: "Govern" },
];

const CAPABILITIES = [
  { n: "01", title: "Assessment & roadmap", body: "What you're actually running, what it costs today, and the order to move it in." },
  { n: "02", title: "Migration & modernisation", body: "Systems and workloads moved in phases, each one validated before the next begins." },
  { n: "03", title: "Document & data transformation", body: "Content classified, deduplicated and made searchable with AI as it moves — not left as it was." },
  { n: "04", title: "Microsoft 365 & SharePoint", body: "Structure, permissions and workflows designed around how your departments actually work." },
  { n: "05", title: "Governance & compliance", body: "Retention rules, access control and audit records applied automatically and kept that way." },
  { n: "06", title: "Run & optimise", body: "Watching cost, security and usage after the move — which is where most of the savings come from." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#2c87cc]">{n}</span>
      <span className="mb-[7px] text-[1rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.875rem] leading-[1.58] text-[#55677f]">{body}</p>
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
          eyebrow="Cloud capability"
          title="One team from assessment through to continuous improvement."
          headingLevel="h2"
          lede="Strategy, architecture, migration, governance and ongoing operation sit in the same team — so the people who designed the target are the ones who have to live in it."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous cloud lifecycle: assess, design, migrate, validate, govern, optimise — then looping back to assess. The savings arrive after the move, not during it."
          >
            <defs>
              <linearGradient id="lifecycle-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={SVG_BRAND_2} />
                <stop offset=".5" stopColor={SVG_BRAND} />
                <stop offset="1" stopColor={SVG_INDIGO} />
              </linearGradient>
              <marker id="lifecycle-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M1 1L10 6L1 11" fill="none" stroke={SVG_BRAND} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <path d="M40 62H1120" stroke={SVG_LINE} strokeWidth={3} strokeLinecap="round" />
            <path
              ref={linePathRef}
              d="M40 62H1120"
              stroke="url(#lifecycle-gradient)"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <path
              d="M1120 76C1163 120 1138 152 1086 152H74C22 152 18 118 40 84"
              fill="none"
              stroke={SVG_BRAND}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6 8"
              opacity={0.55}
              markerEnd="url(#lifecycle-arrow)"
            />
            <g fontSize={11.5} fill={SVG_BODY} textAnchor="middle">
              {LIFECYCLE_STEPS.map((s) => (
                <g key={s.label}>
                  <circle cx={s.x} cy={62} r={9} fill="#fff" stroke={SVG_BRAND} strokeWidth={3} />
                  <text x={s.x} y={99}>{s.label}</text>
                </g>
              ))}
              <g>
                <circle cx={1120} cy={62} r={12} fill={SVG_BRAND} />
                <text x={1120} y={99} fill={SVG_INK}>Optimise</text>
              </g>
            </g>
            <text x={580} y={188} fontWeight={600} fontSize={17} fill={SVG_INK} textAnchor="middle" letterSpacing="-.3">
              The savings arrive after the move, not during it.
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

// ─────────────────────────── 3. two shapes ───────────────────────────
const SHAPES = [
  {
    variant: "brand" as const,
    tag: "Shape one",
    title: "Infrastructure & workload migration",
    body: "Applications, servers and databases moved to Azure, AWS or Google Cloud — phased, tested, and sized to the demand you actually have rather than the peak someone once imagined.",
    best: "Hardware is reaching end of life, a data centre contract is ending, costs are climbing, or an acquisition has left you running two of everything.",
    items: ["Estate assessment", "Target design", "Phased migration", "Cost right-sizing", "Security baseline"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "Document & content transformation",
    body: "Years of accumulated files understood before they move — classified by AI, stripped of duplicates, made searchable including scanned pages, and landed under retention rules that keep them clean.",
    best: "Files are scattered with no consistent naming, scanned documents can't be searched, storage keeps growing, or you couldn't currently prove what you hold and why.",
    items: ["AI classification", "Text recognition", "Duplicate removal", "Filing structure", "Retention automation"],
  },
];

type DecisionKey = "cost" | "hw" | "comp" | "find" | "ma" | "stall";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "cost", label: "Costs are climbing" },
  { value: "hw", label: "Hardware or contract is ending" },
  { value: "comp", label: "Compliance or audit pressure" },
  { value: "find", label: "People can't find information" },
  { value: "ma", label: "Merger or acquisition" },
  { value: "stall", label: "A programme that stalled" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  cost: {
    title: "The saving is in what you don't move",
    body: "Cost rarely comes down just by changing where things are hosted. It comes down when duplicated, superseded and expired content is removed first, and when the new environment is sized for real demand rather than a peak someone once assumed.",
    approach: "We measure what you're holding and what it costs before designing anything. For Kaneff, removing duplicates alone cut storage by around a fifth.",
  },
  hw: {
    title: "A deadline, and an opportunity",
    body: "An expiring contract or ageing hardware forces the timeline, which is why these moves so often become a straight copy. Understandable, and it wastes the only budget you'll get for fixing the underlying mess.",
    approach: "We work back from your deadline and split the work: what must move by the date, and what gets cleaned up as it goes. Rarely does everything need to be in the first group.",
  },
  comp: {
    title: "Usually a records problem, not a security one",
    body: "Most organisations facing audit pressure have adequate security and no evidence. What's missing is retention rules, a record of who changed what, and the ability to prove something was disposed of when it should have been.",
    approach: "We apply retention and audit automatically as part of the move, so compliance is enforced by the platform rather than by people remembering.",
  },
  find: {
    title: "The problem is structure, not search",
    body: "Better search doesn't help when files have no consistent naming, duplicates compete for the same answer, and scanned pages contain no readable text at all. The content has to be understood before it can be found.",
    approach: "AI classification, text recognition on scanned files and duplicate removal — applied as content moves. This is exactly what took Kaneff to fully searchable.",
  },
  ma: {
    title: "Two of everything, and no agreed truth",
    body: "After an acquisition the technical work is usually the easy part. The hard part is deciding whose structure wins, what the combined organisation is obliged to keep, and who has access to what.",
    approach: "We map both estates first and design one target structure, then migrate into it. Consolidating afterwards costs considerably more than consolidating during.",
  },
  stall: {
    title: "Almost always scope, not capability",
    body: "Stalled programmes usually tried to move everything at once, hit something unexpected in the middle, and lost sponsor confidence. Meanwhile you're paying for both environments.",
    approach: "We assess what's already moved, finish the highest-value part first to restore confidence, then sequence the rest. Getting off the double bill is normally the fastest win available.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when a driver is picked — so it gets its
  // own small pop-in here instead of one of `useReveal.ts`'s hooks.
  useEffect(() => {
    if (!answer || !answerRef.current || prefersReducedMotion()) {
      return;
    }
    gsap.fromTo(
      answerRef.current,
      { opacity: 0, y: 10, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
    );
  }, [answer]);

  return (
    <div className="mt-6 rounded-2xl border border-[#EDE5E9] bg-white p-6">
      <div className="grid grid-cols-1 items-end gap-[18px] lg:grid-cols-[1fr_auto]">
        <div>
          <span className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#0D1B2A] block">
            What&rsquo;s driving your move?
          </span>
          <p className="text-[0.87rem] text-[#55677f]">
            Choose the reason closest to yours. We&rsquo;ll show you where the real work usually turns out to be.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Your driver
          </label>
          <select
            id="decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as DecisionKey | "")}
            className="min-w-full cursor-pointer rounded-[9px] border border-[#EDE5E9] bg-white px-3 py-[11px] text-[0.9rem] text-[#0D1B2A] lg:min-w-[320px]"
          >
            <option value="">Select…</option>
            {DECISION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {answer && (
          <div ref={answerRef} className="rounded-xl border border-[#c8e6fc] bg-[#e4eff899] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#2c87cc]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#2c87cc]" />
              Where the real work usually is
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#0D1B2A]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#55677f]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#0D1B2A]">Where we&rsquo;d start:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#2c87cc]">
                Book an assessment &rarr;
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShapeCard({ variant, tag, title, body, best, items }: (typeof SHAPES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  const isBrand = variant === "brand";
  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-[18px] border border-[#EDE5E9] bg-white p-[26px] sm:p-[34px]"
    >
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#2c87cc]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#2c87cc]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <span className="mb-3 text-[1.42rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.95rem] leading-[1.65] text-[#55677f]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#f2f7fc] p-[16px_18px] text-[0.89rem] text-[#55677f]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#2c87cc]" : "text-[#4351E6]")}>
          Best when
        </b>
        {best}
      </div>
      <ul className="mt-[18px] flex flex-wrap gap-[7px]">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[#EDE5E9] bg-white px-3 py-[5px] text-[0.8rem] text-[#55677f]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TwoShapesSection() {
  const shapesRef = useStaggerReveal<HTMLDivElement>();
  const neutralRef = useFadeUp<HTMLDivElement>();
  const utilRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="How the work usually arrives"
          title="Move the systems, or transform what's inside them."
          headingLevel="h2"
          lede="Most organisations ask for the first and need both. Moving a server is an infrastructure exercise. Moving twenty years of documents is a data problem wearing an infrastructure costume — and it's the one that decides whether anyone's life actually improves."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#2c87cc] bg-[#e4eff899] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#0D1B2A]">
            <strong>Moving everything as-is is not a strategy.</strong> Copying an unstructured estate into the
            cloud relocates the problem and adds a monthly bill to it. You still can&rsquo;t find anything,
            you&rsquo;re still paying to store duplicates, and you&rsquo;ve spent the budget that would have fixed
            it. The move is the only moment when cleaning it up is affordable.
          </p>
        </div>

        <div ref={utilRef}>
          <DecisionHelper />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 4. featured case (kaneff) ───────────────────────────
const KANEFF_KPIS = [
  { value: "7 TB+", label: "Documents migrated to SharePoint Online" },
  { value: "100%", label: "Full-text searchable, scanned files included" },
  { value: "20%", label: "Reduction in storage used" },
  { value: "15–20%", label: "Duplicate files removed" },
];

const KANEFF_BEFORE = [
  "No naming standards or folder structure across departments",
  "Large volumes of duplicates, with no authoritative version",
  "Scanned drawings and PDFs invisible to search",
  "No retention policies and no audit trail",
  "On-premise storage costs rising year on year",
];

const KANEFF_AFTER = [
  "One filing structure aligned to how each department works",
  "Duplicates identified and removed before anything moved",
  "Every document searchable, including scanned pages",
  "Retention rules applied automatically, audit trail generated",
  "A cloud platform that scales without new hardware",
];

function KpiTile({ value, label }: (typeof KANEFF_KPIS)[number]) {
  return (
    <div className="bg-[#0D1B2A] p-[28px_24px]">
      <div className="text-[clamp(1.9rem,3.2vw,2.6rem)] font-bold tracking-[-0.03em] text-[#2c87cc] leading-none">
        {value}
      </div>
      <div className="mt-[9px] text-[0.87rem] leading-[1.45] text-[#B4ABB6]">{label}</div>
    </div>
  );
}

function BeforeAfterColumn({
  heading,
  items,
  variant,
}: {
  heading: string;
  items: string[];
  variant: "before" | "after";
}) {
  const isBefore = variant === "before";
  const Marker = isBefore ? X : Check;
  return (
    <div className="rounded-2xl border border-[#332434] bg-white/[0.03] p-[26px]">
      <span
        className={cx(
          "mb-4 text-[10px] font-medium uppercase tracking-[0.13em] block",
          isBefore ? "text-[#F09080]" : "text-[#7FD8B6]"
        )}
      >
        {heading}
      </span>
      <ul className="m-0 list-none p-0">
        {items.map((item, i) => (
          <li
            key={item}
            className={cx(
              "flex gap-[10px] py-[9px] text-[0.9rem] leading-[1.5] text-[#B7C6D8]",
              i !== items.length - 1 && "border-b border-[#20304A]"
            )}
          >
            <Marker
              aria-hidden
              size={15}
              strokeWidth={2.4}
              className={cx("mt-[3px] shrink-0", isBefore ? "text-[#F09080]" : "text-[#7FD8B6]")}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturedCaseSection() {
  const kpiRef = useStaggerReveal<HTMLDivElement>();
  const baRef = useFadeUp<HTMLDivElement>();
  const howRef = useFadeUp<HTMLDivElement>();

  return (
    <div data-nav-contrast="dark">
    <section id="kaneff" className={cx(SECTION, "relative overflow-hidden bg-[#0D1B2A]")}>
      <div className="pointer-events-none absolute -right-[22%] -top-[40%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(125,185,239,.30),transparent_66%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Proof · Kaneff Group"
          eyebrowVariant="brand2"
          title="7 TB of documents. Zero data loss. Delivered on time."
          headingLevel="h2"
          lede="Kaneff Group, a real estate and property management business, held more than 7 TB of documents across on-premise servers — no consistent naming, large volumes of duplicates, thousands of scanned drawings and PDFs that no search could reach, and no retention rules behind any of it. We treated it as a data problem rather than a file move."
        />

        <div ref={kpiRef} className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-[#332434] bg-[#332434] sm:grid-cols-2 lg:grid-cols-4">
          {KANEFF_KPIS.map((k) => (
            <KpiTile key={k.label} {...k} />
          ))}
        </div>

        <div ref={baRef} className="mt-7 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <BeforeAfterColumn heading="Before" items={KANEFF_BEFORE} variant="before" />
          <div aria-hidden className="hidden items-center justify-center text-[#2c87cc] lg:flex">
            <ArrowRight size={28} strokeWidth={1.8} />
          </div>
          <BeforeAfterColumn heading="After" items={KANEFF_AFTER} variant="after" />
        </div>

        <div ref={howRef} className="mt-7 rounded-2xl border border-[#332434] p-[24px_26px]">
          <span className="mb-[10px] text-[1.06rem] font-bold text-white block">Where the AI actually did the work</span>
          <p className="max-w-[78ch] text-[0.92rem] leading-[1.65] text-[#B4ABB6]">
            We built a classification engine specifically for Kaneff&rsquo;s document types. It read scanned files
            using text recognition to make them searchable, sorted every document by type and owning department,
            found and removed duplicates before migration rather than after, and applied naming and retention rules
            at a scale no manual process could reach. Migration ran department by department, with a validation
            report after each phase &mdash; no blind batch moves, and nothing lost.
          </p>
          <Link
            href="/case-studies/sharepoint-migration"
            className="mt-[22px] inline-flex items-center gap-[9px] text-[0.92rem] font-medium text-[#2c87cc] transition-colors duration-150 hover:text-white"
          >
            Read the full case study <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
    </div>
  );
}

// ─────────────────────────── 5. why oxytal ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "We use AI inside the migration, not after it", body: "Most migration work moves your content and leaves the sorting to you. ", em: "We built a classification engine that read, sorted and deduplicated 7 TB before it landed", tail: " — which is why Kaneff arrived somewhere better rather than somewhere identical." },
  { n: "02", title: "Phased, validated, never blind", body: "Migration runs department by department with a validation report after each phase. ", em: "You see what moved and what didn't before the next phase starts", tail: ". That's how a 7 TB move finishes with nothing lost." },
  { n: "03", title: "Governance from the first week", body: "Retention rules, permissions and audit records are designed in at the start, not added when someone asks. ", em: "The platform stays clean after we leave", tail: ", because the rules enforce themselves rather than depending on discipline." },
  { n: "04", title: "All three clouds, no favourite", body: "Microsoft Solutions Partner, AWS Qualified and Google Cloud Partner. ", em: "Our recommendation follows your estate and your team's skills", tail: ", not the one badge we happen to hold." },
  { n: "05", title: "Engineering, not just infrastructure", body: "When a migration needs something custom built — and it usually does — ", em: "we build it in-house rather than telling you it's out of scope", tail: ". Software, integration, data and AI are all practices here." },
  { n: "06", title: "We stay after the move", body: "The savings come from what happens next: right-sizing, retiring what's redundant, watching security and spend. ", em: "The team that moved you is the team that tunes it", tail: ", from Dublin and Chandigarh." },
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
      className="relative overflow-hidden bg-white p-[30px_28px] pl-[31px] transition-colors duration-200 hover:bg-[#FFFCFD]"
    >
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#2c87cc]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#2c87cc]">{n}</span>
      <span className="mb-[9px] text-[1.1rem] font-bold leading-[1.3] text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.9rem] leading-[1.62] text-[#55677f]">
        {body}
        <em className="font-medium not-italic text-[#0D1B2A]">{em}</em>
        {tail}
      </p>
    </div>
  );
}

function WhySection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Why Oxytal"
          title="Why us and not a specialist migration firm?"
          headingLevel="h3"
          lede="A fair question, and worth putting to everyone on your shortlist. Here's our honest answer."
        />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE5E9] bg-[#EDE5E9] sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CARDS.map((c) => (
            <WhyCard key={c.n} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── stack ───────────────────────────
const STACK_COLUMNS = [
  { heading: "Microsoft", items: ["Microsoft 365", "SharePoint Online", "Power Automate", "Azure", "Entra ID", "Purview"] },
  { heading: "Cloud platforms", items: ["Microsoft Azure", "Amazon Web Services", "Google Cloud", "Hybrid environments", "Private hosting", "Disaster recovery"] },
  { heading: "Document intelligence", items: ["Custom classification engines", "Text recognition for scans", "Duplicate detection", "Automated naming", "Metadata and labelling", "Retention automation"] },
  { heading: "Security & compliance", items: ["Access and identity control", "Data residency", "GDPR alignment", "Retention and archival", "Audit reporting", "Backup and recovery"] },
  { heading: "Run & optimise", items: ["Cost monitoring", "Usage reporting", "Right-sizing reviews", "Performance monitoring", "Patching and updates", "Incident response"] },
];

function StackSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={cx(SECTION, "bg-[#F7F3F7]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="What we work with"
          title="Chosen for your estate, not for our convenience."
          headingLevel="h3"
          lede="We choose based on where your systems already live, what your team can maintain, your security obligations and long-term cost — not technology trends."
        />
        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-x-[18px] gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STACK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <span className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#2c87cc] block">{col.heading}</span>
              <ul className="m-0 list-none p-0">
                {col.items.map((item) => (
                  <li key={item} className="border-b border-[#f2f7fc] py-[6px] text-[0.89rem] text-[#55677f]">
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

// ─────────────────────────── 6. engagement ───────────────────────────
const ENGAGEMENT_MODES = [
  { k: "Start here", title: "Cloud & content assessment", body: "Two to three weeks. We analyse real files and systems from across departments, map what you're holding and what it costs today, and come back with a costed plan and an order of work.", meta: ["2–3 weeks · fixed fee", "Credited against the programme"], featured: false },
  { k: "Most common", title: "Migration programme", body: "Phased delivery, department by department, with validation after each phase and the old environment kept running until the new one is proven. Designed around your calendar, not ours.", meta: ["10–24 weeks typical", "Fixed-price phases"], featured: true },
  { k: "Ongoing", title: "Managed cloud operations", body: "We run what you've moved to — monitoring cost and security, right-sizing as usage settles, handling updates, and reporting monthly against the numbers we agreed at the start.", meta: ["Monthly retainer", "Cover agreed upfront"], featured: false },
];

function EngagementCard({ k, title, body, meta, featured }: (typeof ENGAGEMENT_MODES)[number]) {
  // The featured mode sits on a dark card — same brand-tinted-glow-on-dark
  // reasoning as `KpiTile`/`WhyCard` above.
  const cardRef = useCardHover<HTMLDivElement>(
    featured ? { shadow: "0 20px 40px -16px rgba(254,127,82,.35)" } : {}
  );
  return (
    <div
      ref={cardRef}
      className={cx(
        "flex flex-col rounded-2xl border p-7",
        featured ? "border-[#0D1B2A] bg-[#0D1B2A]" : "border-[#EDE5E9] bg-white"
      )}
    >
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#2c87cc]">{k}</span>
      <span className={cx("mb-[9px] text-[1.18rem] font-bold block", featured ? "text-white" : "text-[#0D1B2A]")}>{title}</span>
      <p className={cx("flex-1 text-[0.9rem] leading-[1.62]", featured ? "text-[#B4ABB6]" : "text-[#55677f]")}>{body}</p>
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
        <SectionHeading eyebrow="How we engage" title="Three ways in. All start with understanding what you hold." headingLevel="h3" />
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
    q: "Will we lose anything during the migration?",
    a: "Not if it's done in phases with validation. We move department by department and produce a report after each one showing exactly what moved, what was identified as a duplicate, and what needs a decision from you. The original environment stays running until the new one is verified. That's how we moved more than 7 TB for Kaneff Group without losing anything — not because nothing ever goes wrong, but because you find out at the end of a phase rather than at the end of a project.",
  },
  {
    q: "Do we have to move everything?",
    a: "No, and you probably shouldn't. A meaningful share of most document estates is duplicated, superseded or past the point where you're obliged to keep it. Moving it costs money twice — once to migrate, then every month to store. Part of the assessment is deciding what moves, what gets archived, and what can be disposed of under your retention rules. For Kaneff that alone reduced storage by around a fifth.",
  },
  {
    q: "How long does something like this take?",
    a: "The assessment is two to three weeks. A migration programme is typically ten to twenty-four weeks depending on volume, how many systems connect to it, and how much of the structure needs designing rather than copying. Phasing means you see value from the first department rather than waiting for the last one — which also means you can pause between phases if the business needs you to.",
  },
  {
    q: "Which cloud should we be on?",
    a: "Usually the one your organisation already leans towards, unless there's a good reason to change. If you run Microsoft 365, SharePoint and Azure are the path of least friction and lowest retraining cost. If your engineering team already knows AWS, moving them to something unfamiliar buys you very little. We hold partner status with Microsoft, AWS and Google, so we have no commercial reason to push you towards one of them.",
  },
  {
    q: "What will it cost to run once we've moved?",
    a: "Less than the on-premise equivalent if it's sized properly, and more if it isn't — which is the honest answer most people don't get. Cloud costs rise when environments are provisioned for a peak that never arrives and nobody revisits it. We model the running cost before you commit, set spending alerts, and review actual usage after the first few months when real patterns emerge. That review is usually where the largest savings are found.",
  },
  {
    q: "Who actually does the work?",
    a: "A named team across Dublin and Chandigarh — the same people from assessment through to ongoing support. No account-management layer between you and the people doing the work. You'll meet them before anything is agreed.",
  },
];

function FaqSection() {
  const listRef = useFadeUp<HTMLDivElement>();
  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Straight answers" title="What clients ask first." headingLevel="h4" />
        <div ref={listRef} className="mt-[30px] max-w-[880px]">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="group border-b border-[#EDE5E9]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[19px] pr-1 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#0D1B2A] marker:content-none">
                {f.q}
                <span aria-hidden className="text-[1.35rem] font-normal text-[#2c87cc] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[76ch] pb-5 text-[0.93rem] leading-[1.7] text-[#55677f]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── related + final CTA ─────────────────────────
const RELATED = [
  { k: "07", title: "AI & Agentic Engineering", body: "The intelligence that made 7 TB searchable.", href: "/service/ai-and-intelligent-automation" },
  { k: "05", title: "Enterprise Integration", body: "Connecting what you moved to what stayed.", href: "/service/enterprise-system-integrations" },
  { k: "03", title: "Software Engineering", body: "The custom pieces a migration always needs.", href: "/service/software-development" },
  { k: "01", title: "Digital Strategy", body: "Deciding what's worth moving before moving it.", href: "/service/digital-strategy" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#8D8E9E]">{k}</span>
      <span className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.85rem] leading-[1.55] text-[#55677f]">{body}</p>
    </Link>
  );
}

function RelatedAndCtaSection() {
  const relRef = useStaggerReveal<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Related services" title="A move rarely stands alone." headingLevel="h4" />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#0D1B2A)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(125,185,239,.30),transparent_66%)]" />
          <div className="relative">
            <h4 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with what you&rsquo;re actually holding.
            </h4>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with the people who did the Kaneff migration. Bring the storage bill that keeps growing,
              the audit you&rsquo;d rather not face, or the programme that stopped halfway. We&rsquo;ll tell you
              what we&rsquo;d do and what it&rsquo;s worth doing.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Book a cloud assessment <span aria-hidden>&rarr;</span>
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
export default function CloudDigitaPage({ entry }: Props) {
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
      <TwoShapesSection />
      <FeaturedCaseSection />
      <WhySection />
      <StackSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
