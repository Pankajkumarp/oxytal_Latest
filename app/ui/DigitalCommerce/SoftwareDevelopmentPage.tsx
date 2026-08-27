/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-software-engineering_1.html`
 * into a single component. The reference page's `<style>` block (custom
 * CSS variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties — a blue/teal scheme) is NOT reproduced either;
 * this file keeps the site's own orange (`#1651f5`) brand colour already
 * established by the sibling `DigitalStrategyPage`/`UiExperiencePage`
 * conversions in this folder, so every accent below is orange regardless
 * of what colour the reference document used for it.
 *
 * Unlike those two sibling pages, this reference's section list itself
 * differs from theirs — no three-client "proof" case studies here, and two
 * section types (`EvidenceSection`'s stats/work cards, `StackSection`'s
 * tech columns) that don't exist on the other pages — so the component
 * breakdown below follows this reference's own section order rather than
 * mirroring the other two pages' structure.
 *
 * The reference's evidence numbers (`—` placeholders and a labelled
 * "Placeholder — replace with real client") are kept as literal
 * placeholders rather than invented, exactly as the reference has them.
 *
 * Two interactive bits from the reference couldn't stay as inline vanilla
 * JS and were re-implemented as React:
 *  - the "what this usually means" challenge helper (a `<select>` + result
 *    panel driven by a plain object lookup) is now `DecisionHelper`, a
 *    `useState`-backed panel;
 *  - the reference's own `IntersectionObserver`-driven `.reveal`/`.reveal.in`
 *    fade-ins are replaced by this folder's shared GSAP reveal hooks (see
 *    `useReveal.ts`), the same ones `DigitalCommerce.tsx` (the hero) uses.
 *
 * The reference hero's large inline decorative illustration (a single
 * ~50KB `<svg>` of bespoke line art) is approximated with a few blurred
 * gradient blobs instead of being transcribed — everything else is a
 * faithful, section-by-section copy of the reference's copy and structure.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Clock, ShieldAlert, Archive, Server, TrendingUp } from "lucide-react";
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
// classes instead (`text-[#0D1B2A]`, `bg-[#1651f5]`, ...).
const SVG_INK = "#0D1B2A";
const SVG_BODY = "#55677f";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#1651f5";
const SVG_BRAND_2 = "#1651f5"; 
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#55677f]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#1651f5] text-white hover:-translate-y-px hover:bg-[#0a3ac0]");
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
        variant === "brand" ? "text-[#1651f5]" : "text-[#1651f5]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#1651f5]" : "bg-[#1651f5]")}
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
  /** Dark sections only — sits on the `#0D1B2A` background. */
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
          dark ? "text-white" : "text-[#0D1B2A]",
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
          <Eyebrow>Software Engineering &amp; Application Services</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#0D1B2A]"
          >
            From idea to software that performs.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#1651f5]">
            Anyone can launch version one. We build for the versions after it.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#55677f]">
            We design, engineer, modernise and support digital products that businesses depend on &mdash; bringing
            together product thinking, experience design, engineering, cloud, integration and AI under one team.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Talk to our engineering team <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#work" className={BTN_SECONDARY}>
              See the outcomes
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            A 60-minute conversation with the people who would do the work.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Trusted by</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Diageo", "Aviation Gin", "Casa Famosa", "Lone River", "Bundaberg Rum"].map((name) => (
              <li key={name} className="text-[0.98rem] font-semibold text-[#7d7d7e]">
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
    Icon: Clock,
    title: "Ideas take months to reach customers.",
    body: "Small changes queue behind big releases. The team is busy, the backlog grows, and the business starts routing around IT entirely.",
    say: '"Why does everything take a quarter?"',
  },
  {
    Icon: ShieldAlert,
    title: "Every release feels like a risk.",
    body: "Testing is manual, going live involves steps someone has to remember, and the plan for when it goes wrong lives in one person's head. So changes get bundled together, which makes each release bigger and riskier still.",
    say: '"We only deploy on Thursday mornings."',
  },
  {
    Icon: Archive,
    title: "Legacy systems are holding you back.",
    body: "Critical systems work, but nobody wants to touch them — and the people who built them may be gone.",
    say: '"We’ve been meaning to replace that for years."',
  },
  {
    Icon: Server,
    title: "Technology costs keep increasing.",
    body: "Infrastructure, licences and maintenance consume more of the budget every year.",
    say: '"Most of our budget is maintenance."',
  },
  {
    Icon: TrendingUp,
    title: "Growth is exposing old assumptions.",
    body: "Systems that worked at yesterday's scale struggle when customers, traffic and data increase.",
    say: '"It worked before we grew."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#e4e9f6] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#e4e9f6]">
        <Icon size={20} strokeWidth={1.9} className="text-[#1651f5]" />
      </div>
      <h3 className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#0D1B2A]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#55677f]">{body}</p>
      <p className="mt-[14px] border-t border-[#e8edfc] pt-[13px] text-[0.85rem] italic text-[#8D8E9E]">{say}</p>
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
          title="Software rarely fails loudly. It slows down first."
          lede="By the time a system is a boardroom topic, the warning signs have usually been there for two years. These are the four conversations we're brought into most often."
        />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <ProblemCard key={problem.title} {...problem} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────── 2. engineering capability ───────────────────────
const LIFECYCLE_STEPS = [
  { x: 40, label: "Discover" },
  { x: 256, label: "Design" },
  { x: 472, label: "Engineer" },
  { x: 688, label: "Assure" },
  { x: 904, label: "Launch" },
];

const CAPABILITIES = [
  { n: "01", title: "Product & platform engineering", body: "Custom web, mobile and enterprise applications built around your business, not around a template." },
  { n: "02", title: "Application modernisation", body: "Legacy systems moved forward incrementally, so the business keeps running throughout." },
  { n: "03", title: "Quality & assurance", body: "Automated testing and release processes that make going live routine rather than an event." },
  { n: "04", title: "Cloud architecture", body: "Scalable foundations sized to the demand you actually have, not the worst case someone imagined." },
  { n: "05", title: "Integration engineering", body: "Systems connected so each one can change without waiting for all the others to catch up." },
  { n: "06", title: "Support & optimisation", body: "Monitoring, security updates, fast response and continuous improvement — from the team that built it." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#1651f5]">{n}</span>
      <h3 className="mb-[7px] text-[1rem] font-bold text-[#0D1B2A]">{title}</h3>
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
          eyebrow="Engineering capability"
          title="One team from strategy and architecture through to continuous improvement."
          lede="Product thinking, design, engineering, quality and ongoing improvement sit in the same team — so the people who made the decisions are the ones who live with them."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous engineering lifecycle: discover, design, engineer, assure, launch, optimise — then looping back into discovery. We do not disappear at launch."
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
              We don&rsquo;t disappear at launch.
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
    title: "New products & platforms",
    body: "From a validated idea to something in production, with the smallest version that proves the thesis shipped first rather than last.",
    best: "You have a business case but nothing built yet — a new revenue line, a customer portal, or an internal system replacing spreadsheets and email.",
    items: ["Discovery & architecture", "MVP to scale", "Web & mobile", "Cloud-native", "Design partnership"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "Modernising what you have",
    body: "Step-by-step replacement rather than a single risky rebuild. We put safeguards and monitoring around what exists first, then move it forward one piece at a time.",
    best: "A system matters to the business but has become fragile — unsupported technology, little automated testing, too much knowledge held by too few people, or a compliance deadline it can't meet as built.",
    items: ["System assessment", "Step-by-step migration", "Automated testing", "Re-platforming", "Knowledge transfer"],
  },
];

type DecisionKey = "slow" | "fear" | "legacy" | "cost" | "scale" | "people";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "slow", label: "Changes take too long to reach customers" },
  { value: "fear", label: "Releasing changes feels risky" },
  { value: "legacy", label: "An old system nobody wants to touch" },
  { value: "cost", label: "Running costs keep climbing" },
  { value: "scale", label: "It struggles when demand peaks" },
  { value: "people", label: "Too much depends on one or two people" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  slow: {
    title: "It's usually the process, not the people",
    body: "Long delays almost always come from the steps between finishing work and getting it live — setting up environments, waiting on hand-offs, an approval meeting that only happens once a fortnight. The work itself is rarely the hold-up.",
    approach: "We measure how long each stage really takes, find where things queue, and automate the steps that add delay without adding safety.",
  },
  fear: {
    title: "Low confidence, not low skill",
    body: "Hesitating before a release is a reasonable response to limited automated testing. Bundling changes together feels safer and makes each release bigger, which makes the next one feel riskier still.",
    approach: "We add automated testing around the most important parts first, then simplify the release process. The aim is to make going live unremarkable.",
  },
  legacy: {
    title: "A knowledge problem wearing a technical disguise",
    body: "When one system is untouchable, the real exposure is usually understanding rather than technology — rules that live in one or two people's heads and were never written down.",
    approach: "We document and test what the system actually does before changing anything, then move it forward in pieces. No single risky rebuild.",
  },
  cost: {
    title: "Architecture, showing up as a finance problem",
    body: "Rising running costs usually mean infrastructure sized for a worst case that never arrives, or duplicated systems nobody switched off after the last migration.",
    approach: "We map what you're paying against what you actually use, retire what's redundant and right-size the rest. It often pays for the work itself.",
  },
  scale: {
    title: "A design assumption that has expired",
    body: "Systems that struggle at peak usually work exactly as designed — the design simply assumed a level of demand that stopped being true. Often it comes down to one slow database query or a single point everything waits on.",
    approach: "We test against realistic peak demand, find the actual limit, and fix that specific constraint rather than rebuilding around it.",
  },
  people: {
    title: "The most common risk, and the least discussed",
    body: "If one person's absence would stop progress, that's a business risk with a technical fix — documentation, shared working, and automated tests that capture what they know.",
    approach: "We write down what's in their head as guides and automated checks, then widen the group of people who can safely make changes.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when a challenge is picked — so it gets
  // its own small pop-in here instead of one of `useReveal.ts`'s hooks.
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
          <h4 className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#0D1B2A]">
            What&rsquo;s slowing your technology down?
          </h4>
          <p className="text-[0.87rem] text-[#55677f]">
            Choose the challenge closest to yours. We&rsquo;ll show you where we&rsquo;d start.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Your challenge
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
          <div ref={answerRef} className="rounded-xl border border-[#c9d5f8] bg-[#1651f512] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#1651f5]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#1651f5]" />
              What this usually means
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#0D1B2A]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#55677f]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#0D1B2A]">Where we&rsquo;d start:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#1651f5]">
                Book a review &rarr;
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
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#1651f5]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#1651f5]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <h3 className="mb-3 text-[1.42rem] font-bold text-[#0D1B2A]">{title}</h3>
      <p className="text-[0.95rem] leading-[1.65] text-[#55677f]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#e8edfc] p-[16px_18px] text-[0.89rem] text-[#55677f]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#1651f5]" : "text-[#4351E6]")}>
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
          title="Something new, or something that already exists."
          lede="These two need different disciplines. Building greenfield rewards speed and small bets. Modernising rewards patience and a sequence that never takes the business offline. Most agencies are honestly only good at one."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#1651f5] bg-[#1651f512] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#0D1B2A]">
            <strong>A full rebuild is usually the wrong answer.</strong> It takes longer than anyone estimates,
            delivers nothing to the business until the very end, and quietly throws away years of hard-won rules
            that nobody ever wrote down. We&rsquo;ll propose one only when the numbers genuinely support it &mdash;
            and we&rsquo;ll show you the numbers.
          </p>
        </div>

        <div ref={utilRef}>
          <DecisionHelper />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 4. why oxytal (dark) ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "Agent-accelerated delivery", body: "Forge, our own AI platform, handles the repetitive parts of delivery — drafting requirements, generating tests, running security checks. ", em: "You get enterprise rigour at a pace that doesn't match the price tag", tail: ", with a person approving every release and a full record of what happened." },
  { n: "02", title: "We run our own software too", body: "Oxytal builds and operates its own products, not just client projects. ", em: "We support software we wrote ourselves, at three in the morning if it comes to that", tail: " — which is why our decisions are careful in the places that matter and quick everywhere else." },
  { n: "03", title: "You own everything", body: "The software, the documentation, the accounts and the access are yours from day one, held in your own systems. ", em: "No private framework of ours, no hosting you can't walk away from", tail: ", and a handover plan written at the start rather than negotiated at the end." },
  { n: "04", title: "Engineering isn't a silo here", body: "Design, cloud, data, integration and AI are in-house practices. ", em: "The specialist you need in week six is already in the building", tail: " — no subcontracting to a partner you never meet and can't hold accountable." },
  { n: "05", title: "We're still there after go-live", body: "Most partners hand over and move on, taking everything they learned with them. ", em: "The people who built it are the people who support it", tail: ", with cover hours and escalation routes agreed in writing before launch." },
  { n: "06", title: "Dublin and Chandigarh, one team", body: "Senior accountability in your timezone, engineering depth and genuine overnight cover. ", em: "Not a handover at 6pm to people you've never spoken to", tail: " — one team, two locations, working to the same plan." },
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
      className="relative overflow-hidden bg-[#0D1B2A] p-[30px_28px] pl-[31px] transition-colors duration-200 hover:bg-[#241a28]"
    >
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#1651f5]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#1651f5]">{n}</span>
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
    <section className={cx(SECTION, "relative overflow-hidden bg-[#0D1B2A]")}>
      <div className="pointer-events-none absolute -right-[25%] -top-[35%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(45,92,235,.32),transparent_66%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Why Oxytal"
          eyebrowVariant="brand2"
          title="Why us and not any other development partner?"
          lede="A fair question, and one you should put to everyone on your shortlist. Here's our honest answer."
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
  { value: "—", label: "Applications in production" },
  { value: "—", label: "Average time from idea to live" },
  { value: "—", label: "Availability of systems we run" },
  { value: "—", label: "Years supporting live software" },
];

const WORK = [
  {
    brand: "Placeholder — replace with real client",
    title: "Enterprise platform, built and run",
    body: "A workforce platform serving tens of thousands of employees, taken from first conversation to live and supported ever since — with the same team on it throughout.",
    outputs: [
      { value: "—", label: "Users served" },
      { value: "—", label: "Uptime" },
    ],
  },
  {
    brand: "Placeholder — replace with real client",
    title: "Legacy content estate modernised",
    body: "Years of accumulated documents migrated and reorganised with AI assistance, with every record traceable to where it came from and nothing lost along the way.",
    outputs: [
      { value: "—", label: "Records migrated" },
      { value: "—", label: "Manual effort saved" },
    ],
  },
  {
    brand: "Placeholder — replace with real client",
    title: "From quarterly releases to weekly",
    body: "Automated testing and release processes introduced around a fragile system, turning going live from a scheduled event requiring sign-off into something the team does on an ordinary Tuesday.",
    outputs: [
      { value: "—", label: "Release frequency" },
      { value: "—", label: "Issues after release" },
    ],
  },
];

function StatTile({ value, label }: (typeof STATS)[number]) {
  return (
    <div className="bg-white p-[28px_24px]">
      <div className="text-[clamp(1.9rem,3.2vw,2.5rem)] font-bold tracking-[-0.03em] text-[#1651f5] leading-none">
        {value}
      </div>
      <div className="mt-[9px] text-[0.87rem] leading-[1.45] text-[#55677f]">{label}</div>
    </div>
  );
}

function WorkCard({ brand, title, body, outputs }: (typeof WORK)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="flex flex-col overflow-hidden rounded-2xl border border-[#EDE5E9] bg-white">
      <div aria-hidden className="h-[6px] bg-[linear-gradient(90deg,#1651f5,#ffb199)]" />
      <div className="flex flex-1 flex-col p-[26px]">
        <span className="mb-[13px] text-[10.5px] uppercase tracking-[0.12em] text-[#8D8E9E]">{brand}</span>
        <h3 className="mb-[10px] text-[1.06rem] font-bold leading-[1.32] text-[#0D1B2A]">{title}</h3>
        <p className="flex-1 text-[0.89rem] leading-[1.6] text-[#55677f]">{body}</p>
        <div className="mt-[18px] flex gap-6 border-t border-[#EDE5E9] pt-[15px]">
          {outputs.map((o) => (
            <div key={o.label}>
              <div className="text-[1.25rem] font-bold tracking-[-0.02em] text-[#1651f5]">{o.value}</div>
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
          lede="The measures that matter aren't hours billed or features shipped. They're how quickly an idea reaches your customers, how rarely something goes wrong, and how fast it's put right when it does."
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

// ─────────────────────────── stack ───────────────────────────
const STACK_COLUMNS = [
  { heading: "Languages", items: ["TypeScript & Node", "Python", "Java & Kotlin", "C# / .NET", "PHP", "Go"] },
  { heading: "Frontend & mobile", items: ["React & Next.js", "Vue & Nuxt", "React Native", "Swift & Kotlin native", "Design systems", "Accessibility (WCAG)"] },
  { heading: "Cloud & platform", items: ["AWS", "Azure", "Google Cloud", "Kubernetes & Docker", "Terraform", "GitHub Actions"] },
  { heading: "Data & integration", items: ["PostgreSQL & MySQL", "MongoDB", "Redis & Valkey", "Kafka", "GraphQL & REST", "Event-driven patterns"] },
  { heading: "Assurance & operations", items: ["Monitoring & alerting", "Automated testing", "Automated security checks", "Performance & load testing", "SOC 2 & ISO alignment", "Delivery performance reporting"] },
];

function StackSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={cx(SECTION, "bg-[#F7F3F7]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Stack"
          title="What we build with."
          lede="We choose technology based on your business, your team, your security requirements and long-term maintainability — not technology trends. If your people know .NET, we'd rather hand you excellent .NET than something fashionable they'll struggle to look after."
        />
        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-x-[18px] gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STACK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#1651f5]">{col.heading}</h4>
              <ul className="m-0 list-none p-0">
                {col.items.map((item) => (
                  <li key={item} className="border-b border-[#e8edfc] py-[6px] text-[0.89rem] text-[#55677f]">
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
  { k: "Start here", title: "Discovery & architecture review", body: "Two to three weeks. We review the software, talk to the people who run it day to day, and come back with costed options, a recommended order of work and the reasoning behind both.", meta: ["2–3 weeks · fixed fee", "Credited against a build"], featured: false },
  { k: "Most common", title: "Dedicated engineering team", body: "A named team covering engineering, testing, architecture and delivery, working in fixed-price stages against a plan you control. You meet them before you commit, and they don't get swapped out afterwards.", meta: ["3 months minimum", "Fixed-price phases"], featured: true },
  { k: "Ongoing", title: "Managed application services", body: "We take on running software you already have — monitoring, security updates, fast response when something breaks, and a set number of improvement days each month against your priorities.", meta: ["Monthly retainer", "SLA-backed, agreed upfront"], featured: false },
];

function EngagementCard({ k, title, body, meta, featured }: (typeof ENGAGEMENT_MODES)[number]) {
  // The featured mode sits on a dark card — same brand-tinted-glow-on-dark
  // reasoning as `WorkCard`/`WhyCard`.
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
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#1651f5]">{k}</span>
      <h3 className={cx("mb-[9px] text-[1.18rem] font-bold", featured ? "text-white" : "text-[#0D1B2A]")}>{title}</h3>
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
    q: "You use AI to write code. Is our intellectual property safe?",
    a: "Fair question, and it should be your first one. The AI runs inside our environment or yours under enterprise agreements, and your information is never used to train anyone's model. Every action is recorded and timestamped, and nothing reaches your systems without a person reviewing and approving it — the process stops and waits for that approval every time. If your security team wants to see how it works in detail before we start, we'll walk them through it and put the commitments in the contract.",
  },
  {
    q: "Fixed price or time and materials?",
    a: "Fixed price per stage, which we think is the honest middle ground. Fixing the price of a whole project means pretending we both know things neither of us knows yet, and it makes changing your mind expensive — so the scope gets defended instead of improved. Charging purely by the hour puts all the risk on you. We fix the price of the first stage, then fix each one after it from a scope you've seen and agreed. You can stop at the end of any stage.",
  },
  {
    q: "What if we want to bring it in-house later?",
    a: "Then we'll help you do it, and we plan for it from the start. Everything sits in your own accounts from day one. Documentation and operating guides are written as we go rather than assembled in a rush at the end, and handing over knowledge to your team is a scheduled part of the work, not a favour at the finish. A partner who makes leaving difficult is telling you something about how confident they are in the work.",
  },
  {
    q: "How do you measure whether it's going well?",
    a: "Four things: how long an idea takes to reach your customers, how often we can safely release, how often something goes wrong afterwards, and how quickly it's put right. These come straight from the system itself rather than from a slide we've prepared. Alongside them, whatever business number the project exists to move — and if we can't name that number at the start, that's usually a sign the project isn't ready to begin.",
  },
  {
    q: "Who actually does the work?",
    a: "A named team across Dublin and Chandigarh — the same people from the first conversation through to ongoing support. No account-management layer between you and the people doing the work, and no quiet reassignment once the contract is signed. You'll meet them before anything is agreed.",
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[19px] pr-1 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#0D1B2A] marker:content-none">
                {f.q}
                <span aria-hidden className="text-[1.35rem] font-normal text-[#1651f5] transition-transform duration-200 group-open:rotate-45">
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
  { k: "04", title: "Cloud & Transformation", body: "The infrastructure the application runs on.", href: "/service/cloud-digital-transformation" },
  { k: "05", title: "Enterprise Integration", body: "Connecting it to everything else you run.", href: "/service/enterprise-system-integrations" },
  { k: "07", title: "AI & Agentic Engineering", body: "Automating the work the application creates.", href: "/service/ai-and-intelligent-automation" },
  { k: "02", title: "Experience Design", body: "Making sure people can actually use it.", href: "/service/ui-ux-design" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#8D8E9E]">{k}</span>
      <h3 className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#0D1B2A]">{title}</h3>
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
        <SectionHeading eyebrow="Related services" title="Engineering rarely travels alone." />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#0D1B2A)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(45,92,235,.32),transparent_66%)]" />
          <div className="relative">
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with the system that worries you.
            </h2>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with engineers rather than salespeople. Bring the system you&rsquo;d rather not talk
              about, the deadline you&rsquo;re not confident of, or the idea you haven&rsquo;t costed yet.
              We&rsquo;ll tell you what we&rsquo;d do and whether we&rsquo;re the right people to do it.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Talk to our engineering team <span aria-hidden>&rarr;</span>
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
export default function SoftwareDevelopmentPage({ entry }: Props) {
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
      <WhySection />
      <EvidenceSection />
      <StackSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
