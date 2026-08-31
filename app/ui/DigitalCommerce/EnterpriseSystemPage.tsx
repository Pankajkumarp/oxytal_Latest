/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-enterprise-integration.html`
 * into a single component. The reference page's `<style>` block (custom
 * CSS variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties — a violet/pink scheme) is NOT reproduced
 * either; this file keeps the site's own orange (`#8b3fc4`) brand colour
 * already established by the sibling `DigitalStrategyPage`/
 * `UiExperiencePage`/`SoftwareDevelopmentPage`/`CloudDigitaPage`
 * conversions in this folder, so every accent below is orange regardless
 * of what colour the reference document used for it.
 *
 * This reference's section list is its own shape again (closest to
 * `CloudDigitaPage`'s: a single featured case rather than a three-client
 * "Proof" or a generic "Evidence" grid, plus the "Stack" tech-columns
 * section, no "Deliverables" grid). The featured case here is a data-flow
 * diagram (a Diageo brand-site sign-up reaching Klaviyo and Salesforce
 * correctly, with consent travelling both ways) rather than Cloud's
 * KPI/before-after — `FlowDiagram` is a simplified redraw of the
 * reference's own inline `<svg>` (same nodes and arrows, this project's
 * orange instead of the reference's violet/pink) rather than a pixel copy
 * of its bespoke path geometry.
 *
 * Two interactive bits from the reference couldn't stay as inline vanilla
 * JS and were re-implemented as React:
 *  - the "where the real problem usually is" gap helper (a `<select>` +
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
import { GitCompare, ArrowLeftRight, ShieldCheck, Server } from "lucide-react";
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
// classes instead (`text-[#0D1B2A]`, `bg-[#8b3fc4]`, ...).
const SVG_INK = "#0D1B2A";
const SVG_BODY = "#5a6379";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#8b3fc4";
const SVG_BRAND_2 = "#8b3fc4";
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#5a6379]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#8b3fc4] text-white hover:-translate-y-px hover:bg-[#5e1495]");
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
        variant === "brand" ? "text-[#8b3fc4]" : "text-[#8b3fc4]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#8b3fc4]" : "bg-[#8b3fc4]")}
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
  /** Featured-work section only — sits on the dark `#0D1B2A` background. */
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
          <Eyebrow>Enterprise Integration &amp; Modernisation</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#0D1B2A]"
          >
            Your systems hold the answers. They just can&rsquo;t agree on them.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#8b3fc4]">
            Integration isn&rsquo;t plumbing. It decides whether the business can trust its own numbers.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#5a6379]">
            We connect the platforms you already run &mdash; customer records, marketing, commerce, finance, content
            &mdash; so information moves once, correctly, and with permission respected at every step. And we
            modernise the system that&rsquo;s holding the rest back.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Book an integration review <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#work" className={BTN_SECONDARY}>
              See how it works in practice
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            A 60-minute conversation about where your data disagrees with itself.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Integration clients</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Diageo", "Aviation Gin", "Taffer's", "Lone River", "Casa Famosa"].map((name) => (
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
    Icon: GitCompare,
    title: "The same fact lives in four places.",
    body: "Marketing has one customer count, finance has another, and the commerce platform has a third. Every meeting starts by deciding which number to believe.",
    say: '"Which figure do I take to the board?"',
  },
  {
    Icon: ArrowLeftRight,
    title: "People move data by hand.",
    body: "Exporting from one system, reformatting, importing into another. It works until someone is on leave, and every pass introduces a small error nobody catches.",
    say: '"We hired someone to copy and paste."',
  },
  {
    Icon: ShieldCheck,
    title: "We can't prove what a customer agreed to.",
    body: "Someone signed up on one site, opted out somewhere else, and the two systems never spoke. Privacy rules differ by country and state, and you'd struggle to evidence any of it.",
    say: '"If a regulator asked, we’d be guessing."',
  },
  {
    Icon: Server,
    title: "One old system holds everything up.",
    body: "Every new project routes around the same platform because changing it is too risky. It has quietly become the reason nothing else can move quickly.",
    say: '"Everything waits on that one system."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#f2ebf8] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#f2ebf8]">
        <Icon size={20} strokeWidth={1.9} className="text-[#8b3fc4]" />
      </div>
      <span className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.9rem] leading-[1.6] text-[#5a6379]">{body}</p>
      <p className="mt-[14px] border-t border-[#f4ecfa] pt-[13px] text-[0.85rem] italic text-[#8D8E9E]">{say}</p>
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
          title="Nobody buys an integration. They buy the end of an argument."
          headingLevel="h1"
          lede="The request is usually technical. The reason behind it almost never is — it's a number two teams can't agree on, or a person spending their week moving information between screens. These are the four conversations we're brought into most often."
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

// ─────────────────────── 2. integration capability ───────────────────────
const LIFECYCLE_STEPS = [
  { x: 40, label: "Map" },
  { x: 256, label: "Design" },
  { x: 472, label: "Build" },
  { x: 688, label: "Prove" },
  { x: 904, label: "Govern" },
];

const CAPABILITIES = [
  { n: "01", title: "Estate mapping", body: "What systems you run, what data each one owns, and exactly where they disagree today." },
  { n: "02", title: "Connection engineering", body: "Reliable links between platforms, built to keep working when one side changes underneath." },
  { n: "03", title: "Customer & marketing data", body: "Sign-ups, profiles and permissions flowing correctly between your website, marketing and customer records." },
  { n: "04", title: "Application modernisation", body: "The system everything routes around, moved forward step by step without stopping the business." },
  { n: "05", title: "Data quality & permission", body: "One trusted record per customer, with what they agreed to travelling alongside it everywhere." },
  { n: "06", title: "Monitor & maintain", body: "Connections fail quietly. We watch them, alert on them, and fix them before anyone notices." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#8b3fc4]">{n}</span>
      <span className="mb-[7px] text-[1rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.875rem] leading-[1.58] text-[#5a6379]">{body}</p>
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
          eyebrow="Integration capability"
          title="One team from mapping the estate through to continuous improvement."
          headingLevel="h2"
          lede="Strategy, design, engineering, governance and ongoing monitoring sit in the same team — so the connections have an owner long after the project closes."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous integration lifecycle: map, design, build, prove, govern, evolve — then looping back to map. Systems keep changing and the connections have to survive it."
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
                <text x={1120} y={99} fill={SVG_INK}>Evolve</text>
              </g>
            </g>
            <text x={580} y={188} fontWeight={600} fontSize={17} fill={SVG_INK} textAnchor="middle" letterSpacing="-.3">
              Systems keep changing. The connections have to survive it.
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
    title: "Connecting your platforms",
    body: "Information moving between the systems you already own — automatically, in the right order, and recoverable when one of them is unavailable.",
    best: "Each system does its job well but they don't talk, so people bridge the gap manually and the numbers drift apart.",
    items: ["Customer records", "Marketing platforms", "Commerce & finance", "Content systems", "Partner and supplier data"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "Modernising what's in the way",
    body: "Replacing or rebuilding the platform every project has to work around — in stages, with the old one running until the new one has proven itself.",
    best: "A system genuinely can't support what the business needs next, and connecting to it would only preserve the limitation for another five years.",
    items: ["System assessment", "Step-by-step replacement", "Data migration", "Parallel running", "Knowledge transfer"],
  },
];

type DecisionKey = "crm" | "mkt" | "fin" | "consent" | "legacy" | "report";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "crm", label: "Website and customer records" },
  { value: "mkt", label: "Marketing and customer data" },
  { value: "fin", label: "Commerce and finance" },
  { value: "consent", label: "Privacy and permissions" },
  { value: "legacy", label: "One old system in the middle" },
  { value: "report", label: "Reports that never match" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  crm: {
    title: "The website is usually right. The record isn't",
    body: "Sign-ups reach the customer system, but with fields missing, formatted differently, or duplicated because someone entered a second email. The connection works; what it agreed to send was never fully specified.",
    approach: "We define exactly what a complete record looks like, then make the connection reject and report anything that doesn't meet it — rather than silently storing something half-formed.",
  },
  mkt: {
    title: "Two systems, two versions of the same person",
    body: "Marketing platforms and customer records identify people differently, so the same person becomes two profiles and the campaign numbers stop matching the sales numbers.",
    approach: "We agree one way of identifying a person across both, then reconcile what already exists. The clean-up is usually bigger than the connection, and it's the part that makes the numbers agree.",
  },
  fin: {
    title: "The gap is in the exceptions",
    body: "Ordinary orders flow. Refunds, part-shipments, currency differences and cancellations are where finance and commerce diverge — and those are exactly the ones nobody specified.",
    approach: "We map the awkward cases first, because the straightforward ones take care of themselves. That's where reconciliation time disappears.",
  },
  consent: {
    title: "Almost always a design gap, not a legal one",
    body: "Permission is captured on the website and then not carried anywhere, so no system can prove what was agreed or apply a withdrawal consistently. Rules differ by country and by US state, which multiplies it.",
    approach: "We record permission at the point of capture with the region attached, carry it with the record, and make withdrawal flow back to every system. This is the pattern we built for Diageo brand sites.",
  },
  legacy: {
    title: "The connection may not be the answer",
    body: "If everything routes around one system, connecting more things to it extends its life rather than reducing your risk. Sometimes that's the right call for now — but it should be a decision, not a default.",
    approach: "We assess what that system genuinely still does that nothing else can. Often it's less than everyone assumes, and replacement is closer than it looks.",
  },
  report: {
    title: "Different definitions, not different data",
    body: "When two reports disagree it's rarely because a number is wrong. It's because each team defines a customer, an order or a month slightly differently, and nobody wrote those definitions down.",
    approach: "We document the definitions first and get them agreed. Only then is it worth connecting anything — otherwise you automate the disagreement.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when a gap is picked — so it gets its
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
            What isn&rsquo;t connecting?
          </span>
          <p className="text-[0.87rem] text-[#5a6379]">
            Choose the gap closest to yours. We&rsquo;ll show you where the real problem usually turns out to be.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Your gap
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
          <div ref={answerRef} className="rounded-xl border border-[#F0CBD6] bg-[#f4ecfa] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#8b3fc4]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#8b3fc4]" />
              Where the real problem usually is
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#0D1B2A]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#5a6379]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#0D1B2A]">Where we&rsquo;d start:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#8b3fc4]">
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
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#8b3fc4]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#8b3fc4]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <span className="mb-3 text-[1.42rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.95rem] leading-[1.65] text-[#5a6379]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#f4ecfa] p-[16px_18px] text-[0.89rem] text-[#5a6379]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#8b3fc4]" : "text-[#4351E6]")}>
          Best when
        </b>
        {best}
      </div>
      <ul className="mt-[18px] flex flex-wrap gap-[7px]">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[#EDE5E9] bg-white px-3 py-[5px] text-[0.8rem] text-[#5a6379]">
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
          title="Connect what you have, or replace what's blocking it."
          headingLevel="h2"
          lede="Most requests are for the first. A good number turn out to need the second — because no connection can rescue a system that fundamentally can't do what the business now needs. We'll tell you which one you're facing before you spend anything."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#8b3fc4] bg-[#f4ecfa] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#0D1B2A]">
            <strong>An integration built to hide a broken process makes it permanent.</strong> If two teams keep
            exchanging a spreadsheet because nobody agreed who owns the data, automating that exchange just makes
            the disagreement run faster. Sometimes the right answer is to fix the process, or retire one of the
            systems entirely &mdash; and that&rsquo;s a cheaper project than the one you came to us for.
          </p>
        </div>

        <div ref={utilRef}>
          <DecisionHelper />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 4. featured work (flow diagram) ───────────────────────────
function FlowNode({
  x,
  y,
  w,
  h,
  title,
  lines,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={accent ? "rgba(254,127,82,.12)" : "#241a28"}
        stroke={accent ? SVG_BRAND : "#3a2c40"}
      />
      <text x={x + w / 2} y={y + 34} fill="#fff" fontFamily="IBM Plex Sans, sans-serif" fontSize={14} fontWeight={600} textAnchor="middle">
        {title}
      </text>
      {lines.map((line, i) => (
        <text
          key={line}
          x={x + w / 2}
          y={y + 56 + i * 18}
          fill={accent ? "#ffcbb0" : "#B4ABB6"}
          fontFamily="IBM Plex Mono, monospace"
          fontSize={10.5}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function FlowDiagram() {
  return (
    <svg
      viewBox="0 0 1120 320"
      className="block h-auto w-full"
      aria-label="Data flow: a sign-up on the brand site passes through consent capture, then to the marketing platform and customer records in parallel, with opt-out and suppression flowing back to the site."
    >
      <defs>
        <marker id="flow-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1L10 6L1 11" fill="none" stroke={SVG_BRAND} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <g fill="none" strokeLinecap="round">
        <path d="M232 108H352" stroke={SVG_BRAND} strokeWidth={2} markerEnd="url(#flow-arrow)" />
        <path d="M552 108h60c22 0 34 12 34 32v10" stroke={SVG_BRAND} strokeWidth={2} markerEnd="url(#flow-arrow)" />
        <path d="M552 108h60c22 0 34-12 34-32V66" stroke={SVG_BRAND} strokeWidth={2} markerEnd="url(#flow-arrow)" />
        <path
          d="M960 250c0 34-22 46-56 46H176c-34 0-56-14-56-46v-84"
          stroke={SVG_BRAND}
          strokeWidth={2}
          strokeDasharray="6 8"
          opacity={0.6}
          markerEnd="url(#flow-arrow)"
        />
      </g>

      <FlowNode x={40} y={62} w={192} h={92} title="Brand site" lines={['"Join Us" sign-up', "age verified"]} />
      <FlowNode x={352} y={62} w={200} h={92} title="Permission captured" lines={["what, when, which region", "recorded before anything moves"]} accent />
      <FlowNode x={648} y={20} w={200} h={80} title="Klaviyo" lines={["marketing profile"]} />
      <FlowNode x={648} y={150} w={200} h={80} title="Salesforce" lines={["customer record"]} />
      <FlowNode x={880} y={214} w={160} h={72} title="Opt-out" lines={["applied everywhere"]} accent />

      <text x={560} y={312} fill="#8B849F" fontFamily="IBM Plex Mono, monospace" fontSize={10.5} textAnchor="middle">
        One sign-up. Two platforms. Permission travels with the record, and withdrawal travels back.
      </text>
    </svg>
  );
}

const FEATURED_NOTES = [
  { n: "01", title: "Permission before profile", body: "What someone agreed to is recorded at the moment they agree, with the region they were in — before their details reach any marketing platform. Reconstructing that afterwards is impossible." },
  { n: "02", title: "Withdrawal travels backwards", body: "An opt-out anywhere has to reach every system holding that person. A connection that only runs one way creates a compliance problem the day someone unsubscribes." },
  { n: "03", title: "Built to survive a failure", body: "If one platform is unavailable, the sign-up isn't lost and isn't sent twice when it returns. That behaviour is designed in, not hoped for." },
  { n: "04", title: "Multiple brands, one pattern", body: "Each brand keeps its own identity and content while sharing the same connection design — so a privacy rule change is one piece of work, not one per site." },
];

const FEATURED_SITES = [
  { label: "Aviation American Gin", href: "https://www.aviationgin.com/" },
  { label: "Taffer's Browned Butter Bourbon", href: "https://www.taffersbrownedbutterbourbon.com/" },
];

function FeaturedNoteCard({ n, title, body }: (typeof FEATURED_NOTES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ shadow: "0 20px 40px -16px rgba(254,127,82,.28)" });
  return (
    <div ref={cardRef} className="bg-[#0D1B2A] p-[26px_24px]">
      <span className="mb-3 block text-[10.5px] tracking-[0.1em] text-[#8b3fc4]">{n}</span>
      <span className="mb-2 text-[1.02rem] font-bold leading-[1.3] text-white block">{title}</span>
      <p className="text-[0.89rem] leading-[1.6] text-[#B4ABB6]">{body}</p>
    </div>
  );
}

function FeaturedWorkSection() {
  const flowRef = useFadeUp<HTMLDivElement>();
  const notesRef = useStaggerReveal<HTMLDivElement>();
  const sitesRef = useFadeUp<HTMLDivElement>();

  return (
    <div data-nav-contrast="dark">
    <section id="work" className={cx(SECTION, "relative overflow-hidden bg-[#0D1B2A]")}>
      <div className="pointer-events-none absolute -right-[24%] -top-[38%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(126,102,225,.34),transparent_66%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Proof · Diageo brand sites"
          eyebrowVariant="brand2"
          title="Sign up on a brand site. Four systems have to agree on what just happened."
          headingLevel="h2"
          lede="We build and integrate consumer brand sites for multiple clients and brands. Every 'Join Us' sign-up has to reach the marketing platform and the customer record correctly, carry what the person agreed to, respect age verification, and honour privacy rules that differ by country and by US state. Getting that wrong isn't a bug. In a regulated category it's a compliance incident."
        />

        <div ref={flowRef} className="mt-11 overflow-x-auto rounded-[18px] border border-[#332434] bg-white/[0.02] p-5 sm:p-8">
          <div className="min-w-[720px]">
            <FlowDiagram />
          </div>
        </div>

        <div ref={notesRef} className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-[#332434] bg-[#332434] sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_NOTES.map((n) => (
            <FeaturedNoteCard key={n.n} {...n} />
          ))}
        </div>

        <div ref={sitesRef} className="mt-7 flex flex-wrap gap-3">
          {FEATURED_SITES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-[9px] rounded-[10px] border border-[#332434] px-[18px] py-[12px] text-[0.9rem] font-medium text-[#EDE9F7] transition-colors duration-150 hover:border-[#8b3fc4] hover:text-white"
            >
              {s.label} <span aria-hidden>&#8599;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
    </div>
  );
}

// ─────────────────────────── 5. why oxytal ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "We've done this where mistakes are expensive", body: "Consumer sign-ups for a global drinks group, under age verification and privacy rules that change by country and by US state. ", em: "When getting permission wrong is a compliance incident rather than a bug", tail: ", you build differently — and that habit doesn't switch off." },
  { n: "02", title: "Permission travels with the data", body: "Most integrations move the record and treat consent as somebody else's problem. ", em: "We design the permission trail first and the data flow around it", tail: ", because retrofitting that is the single most expensive thing we get called in to fix." },
  { n: "03", title: "We build for the day it fails", body: "Platforms go down, change their rules, and rate-limit you without warning. ", em: "Our connections queue, retry and never send the same thing twice", tail: " — so an outage at their end doesn't become lost data at yours." },
  { n: "04", title: "Connect or replace, honestly", body: "A firm that only does integration will always recommend integration. ", em: "We modernise systems too, so we can tell you when connecting to something is preserving a problem", tail: " rather than solving one." },
  { n: "05", title: "We watch them afterwards", body: "Connections fail silently — nothing breaks visibly, records just stop arriving. ", em: "We monitor and alert, so you find out from us rather than from a gap in next quarter's numbers", tail: "." },
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
      className="relative overflow-hidden bg-white p-[30px_28px] pl-[31px] transition-colors duration-200 hover:bg-[#FFFCFD]"
    >
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#8b3fc4]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#8b3fc4]">{n}</span>
      <span className="mb-[9px] text-[1.1rem] font-bold leading-[1.3] text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.9rem] leading-[1.62] text-[#5a6379]">
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
          title="Why us and not a specialist integration firm?"
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
  { heading: "Customer & marketing", items: ["Salesforce", "Klaviyo", "HubSpot", "Braze", "Consent platforms", "Customer data platforms"] },
  { heading: "Commerce & finance", items: ["Shopify & Adobe Commerce", "NetSuite", "SAP", "Dynamics 365", "Payment providers", "Tax and compliance services"] },
  { heading: "Content & experience", items: ["Contentful", "Sanity", "SharePoint", "Digital asset libraries", "Search platforms", "Localisation services"] },
  { heading: "Connection methods", items: ["Direct platform connections", "Event-driven messaging", "Scheduled transfers", "Integration platforms", "Custom connectors", "Partner and supplier feeds"] },
  { heading: "Assurance", items: ["Monitoring and alerting", "Automated testing", "Retry and recovery", "Access control", "GDPR and CCPA alignment", "Audit reporting"] },
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
          lede="We choose based on the systems you already run, what your team can maintain, your security obligations and long-term cost — not technology trends."
        />
        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-x-[18px] gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STACK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <span className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#8b3fc4] block">{col.heading}</span>
              <ul className="m-0 list-none p-0">
                {col.items.map((item) => (
                  <li key={item} className="border-b border-[#f4ecfa] py-[6px] text-[0.89rem] text-[#5a6379]">
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
  { k: "Start here", title: "Integration review", body: "Two to three weeks. We map the systems, the data each one owns and where they currently disagree, then come back with costed options and an order of work. Most clients find at least one connection nobody knew had stopped.", meta: ["2–3 weeks · fixed fee", "Credited against a build"], featured: false },
  { k: "Most common", title: "Build or modernise", body: "Delivered in stages, highest-value connection first, each one proven with real data before the next begins. The manual process stays running in parallel until the automated one has earned its place.", meta: ["6–20 weeks typical", "Fixed-price stages"], featured: true },
  { k: "Ongoing", title: "Managed connections", body: "We watch what's live — alerting when something stops, handling platform changes at either end, and adapting connections as your business changes. Reported monthly.", meta: ["Monthly retainer", "Cover agreed upfront"], featured: false },
];

function EngagementCard({ k, title, body, meta, featured }: (typeof ENGAGEMENT_MODES)[number]) {
  // The featured mode sits on a dark card — same brand-tinted-glow-on-dark
  // reasoning as `FeaturedNoteCard`/`WhyCard`.
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
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#8b3fc4]">{k}</span>
      <span className={cx("mb-[9px] text-[1.18rem] font-bold block", featured ? "text-white" : "text-[#0D1B2A]")}>{title}</span>
      <p className={cx("flex-1 text-[0.9rem] leading-[1.62]", featured ? "text-[#B4ABB6]" : "text-[#5a6379]")}>{body}</p>
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
        <SectionHeading eyebrow="How we engage" title="Three ways in. All start with mapping what you actually have." headingLevel="h3" />
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
    q: "Do we need to buy an integration platform?",
    a: "Often not. For a handful of connections, buying a platform adds a licence, a skill your team doesn't have, and another thing that can break. Direct connections are simpler and cheaper to run. A platform earns its place when you have many connections, several teams building them, or a genuine need for non-technical people to change how data flows. If you already own one we'll use it rather than sell you a replacement.",
  },
  {
    q: "What happens when one of the systems is unavailable?",
    a: "Nothing is lost, and nothing arrives twice when it comes back. Records are held, retried on a sensible schedule, and each one carries a marker so the receiving system can recognise a repeat. This matters more than people expect: the most common cause of duplicate customer records isn't bad data, it's a retry after a timeout that nobody designed for.",
  },
  {
    q: "How do you handle customer permissions across systems?",
    a: "We record what someone agreed to at the moment they agreed, along with when and which region they were in, and that record travels with their details into every system that receives them. Withdrawal flows the same way in reverse — an opt-out anywhere reaches everywhere. It's harder than sending the data alone, and it's the part that matters when someone asks you to prove it.",
  },
  {
    q: "Can you work with the connections we already have?",
    a: "Yes, and we'd usually rather improve them than replace them. Part of the review is establishing which existing connections are sound, which are fragile but fixable, and which are genuinely beyond saving. Replacing something that works is spending your budget on activity rather than outcome.",
  },
  {
    q: "How will we know it's still working in a year?",
    a: "Because we watch it. Connections fail quietly — nothing errors visibly, records just stop arriving, and it surfaces weeks later as a gap in a report. Everything we build reports whether it ran, how many records moved and whether anything was rejected, with alerts when the pattern changes. On a review we frequently find a connection that stopped months ago and nobody noticed.",
  },
  {
    q: "Who actually does the work?",
    a: "A named team across Dublin and Chandigarh — the same people from mapping through to ongoing support. No account-management layer between you and the people doing the work. You'll meet them before anything is agreed.",
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
                <span aria-hidden className="text-[1.35rem] font-normal text-[#8b3fc4] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[76ch] pb-5 text-[0.93rem] leading-[1.7] text-[#5a6379]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── related + final CTA ─────────────────────────
const RELATED = [
  { k: "03", title: "Software Engineering", body: "The custom pieces an integration always needs.", href: "/service/software-development" },
  { k: "04", title: "Cloud & Transformation", body: "Moving the systems you're connecting.", href: "/service/cloud-digital-transformation" },
  { k: "06", title: "Digital Commerce", body: "Where orders meet finance and fulfilment.", href: "/service/digital-commerce" },
  { k: "07", title: "AI & Agentic Engineering", body: "Automating the work the data creates.", href: "/service/ai-and-intelligent-automation" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#8D8E9E]">{k}</span>
      <span className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#0D1B2A] block">{title}</span>
      <p className="text-[0.85rem] leading-[1.55] text-[#5a6379]">{body}</p>
    </Link>
  );
}

function RelatedAndCtaSection() {
  const relRef = useStaggerReveal<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Related services" title="Integration rarely stands alone." headingLevel="h4" />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#0D1B2A)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(126,102,225,.34),transparent_66%)]" />
          <div className="relative">
            <h4 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with where the numbers disagree.
            </h4>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with the engineers who build these connections. Bring the report two teams argue about,
              the spreadsheet someone rebuilds every Monday, or the system everything has to work around.
              We&rsquo;ll tell you what we&rsquo;d do and what it&rsquo;s worth doing.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Book an integration review <span aria-hidden>&rarr;</span>
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
export default function EnterpriseSystemPage({ entry }: Props) {
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
      <FeaturedWorkSection />
      <WhySection />
      <StackSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
