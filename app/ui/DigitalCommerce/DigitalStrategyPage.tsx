/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-digital-strategy.html` into a
 * single component. The reference page's `<style>` block (custom CSS
 * variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties) is reproduced via Tailwind arbitrary-value
 * classes (`text-[#FF704D]`, `bg-[#171122`, ...) rather than a `style`
 * prop, so there's no hand-written CSS anywhere in this file — the only
 * `style` attributes left are on raw `<svg>` presentation attributes
 * (`stroke`/`fill`), which aren't CSS and Tailwind has no utility for.
 *
 * Two interactive bits from the reference couldn't stay as inline vanilla
 * JS and were re-implemented as React:
 *  - the "what usually settles it" decision helper (a `<select>` + result
 *    panel driven by a plain object lookup) is now `DecisionHelper`, a
 *    `useState`-backed panel;
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
import { AlignLeft, LayoutGrid, LineChart, HelpCircle } from "lucide-react";
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
// classes instead (`text-[#171122`, `bg-[#FF704D]`, ...).
const SVG_INK = "#1A1220";
const SVG_BODY = "#5F647F";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#FF704D";
const SVG_BRAND_2 = "#FF704D";
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#5F647F]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#FF704D] text-white hover:-translate-y-px hover:bg-[#f56937]");
const BTN_SECONDARY = cx(BTN_BASE, "border-[#21172B] bg-[#21172B] text-[#8C8AA6] hover:-translate-y-px hover:bg-[#50415f] hover:text-[#ffffff]");

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
        variant === "brand" ? "text-[#FF704D]" : "text-[#FF704D]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#FF704D]" : "bg-[#FF704D]")}
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
  /** Proof section only — sits on the dark `#1A1220` background. */
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
          dark ? "text-white" : "text-[#171122]",
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
          <Eyebrow>Digital Strategy &amp; Consulting</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#171122]"
          >
            The most valuable thing we do is tell you what not to build.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#FF704D]">
            Strategy from people who have to live with the answer.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#5F647F]">
            We help you decide where to invest, in what order, and what it&rsquo;s worth &mdash; then we&rsquo;re
            accountable for delivering it. Advice from a firm that never builds anything is easy to give. Ours has
            to survive contact with production, which is a very different discipline.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Book a discovery conversation <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#proof" className={BTN_SECONDARY}>
              See how we decide scope
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#817D9A]">
            Sixty minutes. No deck, no diagnosis dressed up as a proposal.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#817D9A]">We advise</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Diageo", "Aviation Gin", "Casa Famosa", "Taffer's", "InkJet World"].map((name) => (
              <li key={name} className="text-[0.98rem] font-semibold text-[#656566]">
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
    Icon: AlignLeft,
    title: "More ideas than budget.",
    body: "Six credible initiatives, funding for two, and no agreed basis for choosing. So the loudest sponsor wins, or the list gets split evenly and nothing lands properly.",
    say: '"Everything is a priority, so nothing is."',
  },
  {
    Icon: LayoutGrid,
    title: "Every proposal is for something different.",
    body: "Three suppliers, three scopes, three prices, and no way to compare them — because nobody wrote down what the thing actually needs to achieve.",
    say: '"We can’t compare these quotes."',
  },
  {
    Icon: LineChart,
    title: "The last project didn’t move anything.",
    body: "It shipped roughly on time, everyone was reasonably pleased, and the number it was meant to change didn’t. Nobody can say precisely why.",
    say: '"We built it and nothing happened."',
  },
  {
    Icon: HelpCircle,
    title: "Nobody can say what we’re running.",
    body: "Systems accumulated over a decade, subscriptions nobody reviews, and an annual spend that no single person can account for line by line.",
    say: '"What are we actually paying for?"',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#fef1ed] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#fef1ed]">
        <Icon size={20} strokeWidth={1.9} className="text-[#FF704D]" />
      </div>
      <h3 className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#171122]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#5F647F]">{body}</p>
      <p className="mt-[14px] border-t border-[#F8F3F5] pt-[13px] text-[0.85rem] italic text-[#817D9A]">{say}</p>
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
          title="The hard part was never generating ideas."
          lede="Every organisation we meet has a longer list of things to do than budget to do them with. What's usually missing is a defensible way to choose. These are the four conversations we're brought into most often."
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

// ─────────────────────── 2. strategy capability ───────────────────────
const LIFECYCLE_STEPS = [
  { x: 40, label: "Understand" },
  { x: 256, label: "Frame" },
  { x: 472, label: "Evaluate" },
  { x: 688, label: "Decide" },
  { x: 904, label: "Sequence" },
];

const CAPABILITIES = [
  { n: "01", title: "Discovery & assessment", body: "What you're running, what it costs, what works and what everyone quietly works around." },
  { n: "02", title: "Opportunity & business case", body: "What each option is worth in money and when, with the assumptions stated so they can be argued with." },
  { n: "03", title: "Platform & build-or-buy decisions", body: "Whether to build, buy, extend or retire — costed over three years rather than at purchase." },
  { n: "04", title: "Roadmap & sequencing", body: "The order that delivers value earliest and keeps your options open longest." },
  { n: "05", title: "Team & delivery model", body: "What to keep in-house, what to partner on, and what shape the team needs to be." },
  { n: "06", title: "Measurement & review", body: "The numbers that say whether it worked, agreed before anyone starts building." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#FF704D]">{n}</span>
      <h3 className="mb-[7px] text-[1rem] font-bold text-[#171122]">{title}</h3>
      <p className="text-[0.875rem] leading-[1.58] text-[#5F647F]">{body}</p>
    </div>
  );
}

function CapabilitySection() {
  const lifeRef = useFadeUp<HTMLDivElement>();
  const linePathRef = useDrawPath<SVGPathElement>();
  const capsRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section className={cx(SECTION, "bg-[#F8EEF1]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          center
          eyebrow="Strategy capability"
          title="One team from the first question through to continuous improvement."
          lede="The people who frame the decision are the people who deliver against it — which is why our recommendations tend to be shorter and more specific than the ones you'll get elsewhere."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous strategy lifecycle: understand, frame, evaluate, decide, sequence, review — then looping back to understand. A strategy you never revisit is a document, not a plan."
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
                <text x={1120} y={99} fill={SVG_INK}>Review</text>
              </g>
            </g>
            <text x={580} y={188} fontWeight={600} fontSize={17} fill={SVG_INK} textAnchor="middle" letterSpacing="-.3">
              A strategy you never revisit is a document, not a plan.
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
    title: "A decision that's stuck",
    body: "One question, properly answered — with the options costed, the assumptions written down, and a recommendation someone is willing to put their name to.",
    best: "The debate has been circling for months, the proposals aren't comparable, or the decision keeps being deferred because nobody has enough information to be confident.",
    items: ["Build or buy", "Platform selection", "Replatform or improve", "Supplier evaluation", "Second opinion"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "A list you can't rank",
    body: "Every candidate sized for value and effort, sequenced so the early work funds and de-risks what follows, and cut down to what you can genuinely staff.",
    best: "You have a budget cycle to plan, a new leader taking stock, or a backlog that's grown faster than the ability to deliver it.",
    items: ["Portfolio review", "Three-year roadmap", "Spend assessment", "Delivery capacity", "Board-ready case"],
  },
];

type DecisionKey = "bb" | "rp" | "pl" | "inv" | "team" | "ai";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "bb", label: "Build it or buy it" },
  { value: "rp", label: "Replatform or improve what we have" },
  { value: "pl", label: "Which platform to choose" },
  { value: "inv", label: "How much to invest" },
  { value: "team", label: "In-house team or partner" },
  { value: "ai", label: "Where to start with AI" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  bb: {
    title: "How unusual you really are",
    body: "Buy when your need is genuinely common, even if it feels specific — most organisations overestimate how different they are. Build when the process is a real advantage over competitors, or when no product reaches inside the systems you already run.",
    approach: "We list what you'd have to change to fit a product. If that list is short, buying wins. If it removes something customers actually value, it doesn't.",
  },
  rp: {
    title: "The three-year cost, not the quote",
    body: "Replatforming is the most expensive answer to most problems and resets years of knowledge along with the code. It wins only when staying costs more over three years, which is less often than suppliers suggest.",
    approach: "We cost both paths properly, including the hours your team currently loses to the existing system. Often the honest answer is targeted fixes and another two years.",
  },
  pl: {
    title: "Where your complexity actually lives",
    body: "Platform choices are usually decided by things nobody puts in the comparison: what your team can maintain, what your existing systems assume, and what the switching cost looks like in three years.",
    approach: "We evaluate against your real requirements rather than a feature grid, and we score the ones you'd notice losing.",
  },
  inv: {
    title: "What the option is worth, not what it costs",
    body: "The unanswerable question is always framed as cost. The answerable one is value: what changes if this works, when, and how confident are we? Once that's on paper the budget conversation resolves quickly.",
    approach: "We size the value of each candidate before pricing anything. It reorders the list surprisingly often.",
  },
  team: {
    title: "Whether it's core or temporary",
    body: "Build the team for work that's permanent and central to how you compete. Partner for work with a defined end, or where the skill is needed intensely now and rarely afterwards. Getting this backwards is expensive in both directions.",
    approach: "We map which work is which, then design the shape — including which roles to hire first and what they should be accountable for.",
  },
  ai: {
    title: "Where the work is repetitive and checkable",
    body: "Start where the process is high volume, the rules are clear even if the inputs are messy, and a person can verify the output. Avoid starting anywhere the consequence of being wrong is severe.",
    approach: "We size the two or three strongest candidates in your operation and build one properly. Proving it once is worth more than five pilots.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when a decision is picked — so it gets
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
          <h4 className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#171122]">
            What decision are you facing?
          </h4>
          <p className="text-[0.87rem] text-[#5F647F]">
            Choose the one closest to yours. We&rsquo;ll show you what usually settles it.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#817D9A]">
            Your decision
          </label>
          <select
            id="decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as DecisionKey | "")}
            className="min-w-full cursor-pointer rounded-[9px] border border-[#EDE5E9] bg-white px-3 py-[11px] text-[0.9rem] text-[#171122] lg:min-w-[320px]"
          >
            <option value="">Select…</option>
            {DECISION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {answer && (
          <div ref={answerRef} className="rounded-xl border border-[#F0CBD6] bg-[#fe7f520f] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#FF704D]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#FF704D]" />
              What usually settles it
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#171122]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#5F647F]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#171122]">How we&rsquo;d approach it:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#FF704D]">
                Book a conversation &rarr;
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
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#FF704D]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#FF704D]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <h3 className="mb-3 text-[1.42rem] font-bold text-[#171122]">{title}</h3>
      <p className="text-[0.95rem] leading-[1.65] text-[#5F647F]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#F8F3F5] p-[16px_18px] text-[0.89rem] text-[#5F647F]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#FF704D]" : "text-[#4351E6]")}>
          Best when
        </b>
        {best}
      </div>
      <ul className="mt-[18px] flex flex-wrap gap-[7px]">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[#EDE5E9] bg-white px-3 py-[5px] text-[0.8rem] text-[#5F647F]">
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
          title="One decision, or the order of many."
          lede="Some clients arrive with a single question that has stalled — build or buy, replatform or fix, which supplier. Others have a list they can't rank. The work is different, and so is the length of it."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#FF704D] bg-[#fe7f520f] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#171122]">
            <strong>We will price ourselves out of work, regularly.</strong> A meaningful share of our reviews end
            with &ldquo;do less than you planned&rdquo;, &ldquo;keep the platform you have&rdquo;, or &ldquo;this
            is a process problem and no software will fix it&rdquo;. That costs us the larger project every time.
            It&rsquo;s also the only reason our advice is worth paying for &mdash; a recommendation that always
            concludes in favour of the recommender isn&rsquo;t a recommendation.
          </p>
        </div>

        <div ref={utilRef}>
          <DecisionHelper />
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────── 4. proof ──────────────────────────────
const CASE_STUDIES = [
  {
    who: "InkJet World · Maynooth, Ireland",
    title: "An offline print business, sold online",
    question: "Which parts of a print business can sell themselves online, and which will always need a conversation?",
    built:
      "A full shop across five categories and dozens of product types, with variable pricing, a self-serve design tool, order tracking and a dedicated section for a distinct student segment.",
    cutLabel: "What we deliberately kept",
    cut: "A quote-and-enquiry path alongside the checkout. Complex jobs don't have a price until someone has understood them — forcing those through a cart would have lost the highest-value work.",
    href: "https://staginginkjet.oxytalapps.com/",
  },
  {
    who: "Casa Famosa · new brand launch",
    title: "A launch that needed reach, not a checkout",
    question: "A brand-new drink with no awareness. What does the site actually have to achieve in year one?",
    built: "Six pages. The product, the flavours, the story, a retailer finder, an email sign-up and a contact route. Fast, visual, built to be found and shared.",
    cutLabel: "What we deliberately left out",
    cut: "Any commerce at all. The brand sells through retail and distribution — a shop would have competed with the channel doing the actual selling, and consumed the budget that awareness needed.",
    href: "https://www.drinkcasafamosa.com/",
  },
  {
    who: "Taffer's Browned Butter Bourbon",
    title: "An established brand that needed proof",
    question: "The product is unusual and award-winning. What convinces someone to try an unfamiliar bourbon?",
    built: "Origin story, competition awards shown prominently, a recipe collection giving people a reason to buy, a retailer finder and a clear hand-off to the shop.",
    cutLabel: "What we deliberately left out",
    cut: "A checkout on the brand site. An existing shop already handled that well, so rebuilding it would have split the effort and added nothing a customer could feel.",
    href: "https://www.taffersbrownedbutterbourbon.com/",
  },
];

function CaseStudyCard({ who, title, question, built, cutLabel, cut, href }: (typeof CASE_STUDIES)[number]) {
  // Dark background here, so the default ink shadow `useCardHover` uses
  // elsewhere wouldn't read — a brand-tinted glow instead.
  const cardRef = useCardHover<HTMLDivElement>({ y: -5, shadow: "0 20px 40px -16px rgba(254,127,82,.35)" });
  return (
    <div ref={cardRef} className="flex flex-col bg-[#171122] p-[30px_26px]">
      <span className="mb-[6px] text-[10.5px] uppercase tracking-[0.11em] text-[#FF704D]">{who}</span>
      <h3 className="mb-4 text-[1.14rem] font-bold leading-[1.28] text-white">{title}</h3>
      <dl className="m-0">
        <dt className="mt-[18px] text-[9.5px] uppercase tracking-[0.11em] text-[#8A8093]">The question</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#C4BCC7]">{question}</dd>
        <dt className="mt-[18px] text-[9.5px] uppercase tracking-[0.11em] text-[#8A8093]">What we built</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#C4BCC7]">{built}</dd>
      </dl>
      <div className="mt-5 rounded-[11px] border border-[#f8a68947] bg-[#fe7f5212] p-[14px_16px]">
        <dt className="text-[9.5px] uppercase tracking-[0.11em] text-[#FF704D]">{cutLabel}</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#E7D3DB]">{cut}</dd>
      </div>
      <p className="mt-auto pt-5">
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="border-b border-[#4A3A4C] text-[0.86rem] text-[#B4ABB6] transition-colors duration-200 hover:border-[#FF704D] hover:text-white"
        >
          View the build &#8599;
        </a>
      </p>
    </div>
  );
}

function ProofSection() {
  const cardsRef = useStaggerReveal<HTMLDivElement>();
  const plineRef = useFadeUp<HTMLDivElement>();

  return (
    <div data-nav-contrast="dark">
    <section id="proof" className={cx(SECTION, "relative overflow-hidden bg-[#171122]")}>
      <div className="pointer-events-none absolute -right-[24%] -top-[40%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(255,112,77,.28),transparent_65%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Proof · three clients, three scopes"
          eyebrowVariant="brand2"
          title="Three digital projects. Three completely different sizes. Because they had three different jobs."
          lede="The clearest evidence of strategy isn't a document — it's what got built, and more tellingly what didn't. These three ran at the same firm, with the same team, and look nothing alike. That's the point."
        />

        <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-[#332434] bg-[#332434] sm:grid-cols-3" ref={cardsRef}>
          {CASE_STUDIES.map((c) => (
            <CaseStudyCard key={c.who} {...c} />
          ))}
        </div>

        <div ref={plineRef} className="mt-[26px] rounded-2xl border border-[#332434] p-[22px_26px]">
          <p className="m-0 text-[1rem] leading-[1.62] text-[#EFE9EE]">
            <strong className="text-white">A firm with one template would have built the same site three times.</strong>{" "}
            The scope came out of the business question in each case, not from a menu — and in two of the three, the
            most valuable decision was something we talked the client out of.
          </p>
        </div>
      </div>
    </section>
    </div>
  );
}

// ─────────────────────────── 5. why oxytal ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "Our advice has to survive delivery", body: "We build what we recommend, which means an unrealistic estimate becomes our problem within months. ", em: "Consultancies that never deliver are never corrected by reality", tail: " — that feedback loop is the whole difference." },
  { n: "02", title: "We know what things actually cost", body: "Not from a benchmark database, but because we quoted and delivered similar work last quarter. ", em: "Business cases built on real recent numbers hold up in front of a finance director", tail: "; ones built on industry averages usually don't." },
  { n: "03", title: "We'll tell you to do less", body: 'Reviews that end in "keep what you have" or "this is a process problem" cost us the bigger project. ', em: "We do it often enough that it's a stated part of how we work", tail: ", rather than a claim on a page." },
  { n: "04", title: "Neutral by construction", body: "Two commerce practices, three cloud platforms, both build and buy. ", em: "We have no single product to protect", tail: ", so the recommendation follows your situation rather than our bench." },
  { n: "05", title: "Strategy that comes with a team", body: "You don't get a roadmap and a handshake, then start the supplier search from scratch. ", em: "The people who wrote the plan can deliver it, or hand it over cleanly to whoever does", tail: " — including your own team." },
  { n: "06", title: "Small enough to get senior people", body: "The person in your workshop is the person doing the thinking. ", em: "No pyramid where the experienced partner sells and juniors deliver", tail: " — across Dublin and Chandigarh, you get the same faces throughout." },
];

// This section deliberately doesn't reuse `useCardHover`'s lift-and-shadow
// — every other card grid on the page already does that, and "why us"
// reads better as a reveal than a pop. Hovering draws in a left accent
// rule (mirroring the reference's `.plat::before` top rule) and pops the
// numeral, instead of moving the card.
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

    const tl = gsap.timeline({ paused: true })
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
    <div ref={cardRef} className="relative overflow-hidden bg-white p-[30px_28px] pl-[31px] transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#FF704D]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#FF704D]">{n}</span>
      <h3 className="mb-[9px] text-[1.1rem] font-bold leading-[1.3] text-[#171122]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.62] text-[#5F647F]">
        {body}
        <em className="font-medium not-italic text-[#171122]">{em}</em>
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
          title="Why us and not a management consultancy?"
          lede="A fair question, and the answer isn't that we're cheaper. Here's the honest version."
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

// ───────────────────────────── deliverables ─────────────────────────────
const DELIVERABLES = [
  { title: "The current picture", body: "What you're running, what it costs, where the effort and money actually go today." },
  { title: "Costed options", body: "Two or three genuine paths with three-year costs, risks and trade-offs stated plainly." },
  { title: "A recommendation", body: "One of them chosen, with the reasoning and the assumptions written down so you can challenge them." },
  { title: "A sequenced plan", body: "What happens first, what it depends on, and where the natural stopping points are." },
  { title: "The measures", body: "The numbers that will show whether it worked, agreed before anyone builds anything." },
];

function DeliverableCard({ title, body }: (typeof DELIVERABLES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-[24px_22px]">
      <h4 className="mb-[7px] text-[1rem] font-bold tracking-[-0.02em] text-[#171122]">{title}</h4>
      <p className="text-[0.875rem] leading-[1.58] text-[#5F647F]">{body}</p>
    </div>
  );
}

function DeliverablesSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={cx(SECTION, "bg-[#F8EEF1]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="What you get"
          title="Short documents that get decisions made."
          lede="Not a hundred-page report nobody finishes. The test we apply: could a board approve funding from this, and could a delivery team start from it? If either answer is no, it isn't finished."
        />
        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE5E9] bg-[#EDE5E9] sm:grid-cols-2 lg:grid-cols-5">
          {DELIVERABLES.map((d) => (
            <DeliverableCard key={d.title} {...d} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 6. engagement ───────────────────────────
const ENGAGEMENT_MODES = [
  { k: "Start here", title: "Discovery & assessment", body: "Two to three weeks. We talk to the people doing the work, look at what's running, and come back with a clear picture of where you are and the two or three options worth considering.", meta: ["2–3 weeks · fixed fee", "Credited against delivery"], featured: false },
  { k: "Most common", title: "Roadmap & business case", body: "Four to six weeks. Options costed over three years, a recommendation with its reasoning, a sequenced plan and the measures to judge it by — in a form your board can approve and a team can start from.", meta: ["4–6 weeks · fixed fee", "Board-ready output"], featured: true },
  { k: "Ongoing", title: "Advisory", body: "Regular senior time for organisations without a full-time technology leader — architecture calls, supplier reviews, hiring input and a standing second opinion when something significant comes up.", meta: ["Monthly, set days", "Cancel with notice"], featured: false },
];

function EngagementCard({ k, title, body, meta, featured }: (typeof ENGAGEMENT_MODES)[number]) {
  // The featured mode sits on a dark card — same brand-tinted-glow-on-dark
  // reasoning as `CaseStudyCard`.
  const cardRef = useCardHover<HTMLDivElement>(
    featured ? { shadow: "0 20px 40px -16px rgba(254,127,82,.35)" } : {}
  );
  return (
    <div
      ref={cardRef}
      className={cx(
        "flex flex-col rounded-2xl border p-7",
        featured ? "border-[#171122 bg-[#171122]" : "border-[#EDE5E9] bg-white"
      )}
    >
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#FF704D]">{k}</span>
      <h3 className={cx("mb-[9px] text-[1.18rem] font-bold", featured ? "text-white" : "text-[#171122]")}>{title}</h3>
      <p className={cx("flex-1 text-[0.9rem] leading-[1.62]", featured ? "text-[#B4ABB6]" : "text-[#5F647F]")}>{body}</p>
      <div
        className={cx(
          "mt-[18px] flex flex-col gap-[5px] border-t pt-[15px] text-[11px]",
          featured ? "border-[#332434] text-[#9A8F9C]" : "border-[#EDE5E9] text-[#817D9A]"
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
        <SectionHeading eyebrow="How we engage" title="Three ways in. All of them fixed price." />
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
    q: "Isn't your advice biased, since you also build?",
    a: "It's the right question and you should ask it directly. Two things make it manageable. First, strategy is priced and delivered as its own piece of work with its own fee, so we're not funding it by winning the build. Second, we make the assumptions explicit — every recommendation states what it depends on, so you can test the logic rather than trust the conclusion. And the honest counterweight: a firm that never delivers has its own bias, towards recommendations that sound impressive and are somebody else's problem to cost. Judge us on whether we've ever told you to spend less.",
  },
  {
    q: "What do we actually get at the end?",
    a: "A short document — usually twenty to thirty pages — containing where you are today, two or three costed options, a recommendation with its reasoning, a sequenced plan and the measures to judge it by. Plus a working session where we present it and you argue with it, which is where most of the value is. If it can't get funding approved and can't be handed to a delivery team as a starting point, we haven't finished.",
  },
  {
    q: "Do we have to use you to deliver it?",
    a: "No, and we write the output so you don't have to. The plan is specific enough for another supplier or your own team to work from — that's what makes it useful. Some clients take the roadmap and run a competitive process with it, which is a perfectly reasonable outcome and occasionally the one we'd recommend. If the delivery needs skills we don't have, we'll say so.",
  },
  {
    q: 'What if the answer is "do nothing"?',
    a: "Then that's the answer, and we'll say it in writing with the reasoning. It happens — usually when the real problem is a process or an organisational one that software would only encode. Knowing not to spend six figures is worth considerably more than the fee, and it's the outcome clients remember longest. It's also, bluntly, why they come back.",
  },
  {
    q: "How do you price it?",
    a: "Fixed fee, agreed before we start, based on the size of the estate and the number of people we need to talk to. It's credited against delivery if you go on to build with us, which removes the awkwardness of paying twice to get started. If the scope changes materially we'll tell you before doing the work, not after.",
  },
  {
    q: "Who actually does the work?",
    a: "Senior people, and the same ones throughout — the person in your first workshop is the person writing the recommendation. We're deliberately not structured as a pyramid where experienced people sell and less experienced people deliver. You'll meet them before anything is agreed.",
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[19px] pr-1 text-[1.02rem] font-semibold tracking-[-0.015em] text-[#171122] marker:content-none">
                {f.q}
                <span aria-hidden className="text-[1.35rem] font-normal text-[#FF704D] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[76ch] pb-5 text-[0.93rem] leading-[1.7] text-[#5F647F]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── related + final CTA ─────────────────────────
const RELATED = [
  { k: "02", title: "Experience Design", body: "Testing the idea with people before building it.", href: "/service/ui-ux-design" },
  { k: "03", title: "Software Engineering", body: "Building what the plan decided was worth building.", href: "/service/software-development" },
  { k: "04", title: "Cloud & Transformation", body: "Moving off what the plan decided to retire.", href: "/service/cloud-digital-transformation" },
  { k: "07", title: "AI & Agentic Engineering", body: "Where automation genuinely pays back.", href: "/service/ai-and-intelligent-automation" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#817D9A]">{k}</span>
      <h3 className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#171122]">{title}</h3>
      <p className="text-[0.85rem] leading-[1.55] text-[#5F647F]">{body}</p>
    </Link>
  );
}

function RelatedAndCtaSection() {
  const relRef = useStaggerReveal<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Related services" title="Where the plan usually goes next." />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#1A1220)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(110,113,230,.24),transparent_65%)]" />
          <div className="relative">
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with the decision you keep deferring.
            </h2>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with the people who&rsquo;d do the thinking. Bring the business case you can&rsquo;t
              finish, the proposals you can&rsquo;t compare, or the list nobody can rank. We&rsquo;ll tell you how
              we&rsquo;d approach it &mdash; and if it&rsquo;s a twenty-minute answer, you&rsquo;ll get it on the
              call.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Book a discovery conversation <span aria-hidden>&rarr;</span>
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
export default function DigitalStrategyPage({ entry }: Props) {
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
      <ProofSection />
      <WhySection />
      <DeliverablesSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
