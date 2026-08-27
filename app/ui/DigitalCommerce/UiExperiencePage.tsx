/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-experience-design.html` into a
 * single component. The reference page's `<style>` block (custom CSS
 * variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties) is reproduced via Tailwind arbitrary-value
 * classes (`text-[#f338b0]`, `bg-[#1A1220]`, ...) rather than a `style`
 * prop, so there's no hand-written CSS anywhere in this file — the only
 * `style` attributes left are on raw `<svg>` presentation attributes
 * (`stroke`/`fill`), which aren't CSS and Tailwind has no utility for.
 *
 * Two interactive bits from the reference couldn't stay as inline vanilla
 * JS and were re-implemented as React:
 *  - the "what this usually means" symptom helper (a `<select>` + result
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
import { TrendingDown, Scale, Eye, LayoutGrid } from "lucide-react";
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
// classes instead (`text-[#1A1220]`, `bg-[#f338b0]`, ...).
const SVG_INK = "#1A1220";
const SVG_BODY = "#5F627A";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#f338b0";
const SVG_BRAND_2 = "#f338b0";
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#5F627A]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#f338b0] text-white hover:-translate-y-px hover:bg-[#d91091]");
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
        variant === "brand" ? "text-[#f338b0]" : "text-[#f338b0]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#f338b0]" : "bg-[#f338b0]")}
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
          <Eyebrow>Experience Design &amp; UX</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#1A1220]"
          >
            The screen is where your business meets a stranger.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#f338b0]">
            They decide in seconds, on a phone, and they will not ask for help.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#5F627A]">
            We find out what people are actually trying to do, design interfaces they can use without being taught,
            and check afterwards whether it worked. Making something look good is the easy part &mdash; making it
            work under real constraints is the job.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Book a design review <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#proof" className={BTN_SECONDARY}>
              See the decisions behind three builds
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            Sixty minutes with the people who&rsquo;d do the work.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Designed for</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Diageo", "Aviation Gin", "Casa Famosa", "Taffer's", "InkJet World"].map((name) => (
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
    title: "People drop out and nobody knows where.",
    body: "The overall number is disappointing but there's no view of which step loses them. So the fix becomes guesswork, and each attempt is a full project.",
    say: '"We can see them leave. Not why."',
  },
  {
    Icon: Scale,
    title: "Design decisions come down to opinion.",
    body: "Three people, three views, and no evidence to settle it. The most senior person wins, the team disengages, and the same argument returns next quarter.",
    say: '"Whoever’s most senior decides."',
  },
  {
    Icon: Eye,
    title: "It makes sense to us and confuses customers.",
    body: "The team knows the product too well to see it fresh. Language from internal systems reaches the screen, and steps that feel obvious inside make no sense outside.",
    say: '"It was clear to everyone here."',
  },
  {
    Icon: LayoutGrid,
    title: "Every new page looks like a different product.",
    body: "Buttons behave differently, forms follow no pattern, and each addition takes longer than the last because everything is designed from scratch.",
    say: '"Nothing looks like it belongs together."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#f8ebf3] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#f8ebf3]">
        <Icon size={20} strokeWidth={1.9} className="text-[#f338b0]" />
      </div>
      <h3 className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#1A1220]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#5F627A]">{body}</p>
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
          title="Bad design rarely announces itself. It shows up as a number."
          lede="Nobody files a complaint saying the layout confused them — they leave, or they phone someone. By the time it surfaces it looks like a marketing problem or a support cost. These are the four conversations we're brought into most often."
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
  { x: 40, label: "Research" },
  { x: 256, label: "Define" },
  { x: 472, label: "Design" },
  { x: 688, label: "Test" },
  { x: 904, label: "Ship" },
];

const CAPABILITIES = [
  { n: "01", title: "User research", body: "What people are trying to do, in their words — and where the current experience gets in the way." },
  { n: "02", title: "Journeys & structure", body: "The order things happen in and how the whole thing is organised, decided before anything is drawn." },
  { n: "03", title: "Interface design", body: "Screens that look like your brand and behave the way people already expect them to." },
  { n: "04", title: "Design systems", body: "A reusable set of components so the tenth page takes an afternoon rather than a fortnight." },
  { n: "05", title: "Accessibility", body: "Designed to be usable by everyone from the start, rather than corrected after an assessment." },
  { n: "06", title: "Testing & improvement", body: "Watching real people use it, then changing what needs changing. Repeatedly." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#f338b0]">{n}</span>
      <h3 className="mb-[7px] text-[1rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.875rem] leading-[1.58] text-[#5F627A]">{body}</p>
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
          eyebrow="Design capability"
          title="One team from research through to continuous improvement."
          lede="Researchers, designers and engineers work together from the start — which is why our designs get built as drawn instead of quietly simplified during development."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous design lifecycle: research, define, design, test, ship, learn — then looping back to research. A design isn't finished when it ships."
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
                <text x={1120} y={99} fill={SVG_INK}>Learn</text>
              </g>
            </g>
            <text x={580} y={188} fontWeight={600} fontSize={17} fill={SVG_INK} textAnchor="middle" letterSpacing="-.3">
              A design isn&rsquo;t finished when it ships. That&rsquo;s when you find out.
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
    title: "Designing something new",
    body: "From understanding the people it's for through to screens ready to build — with the riskiest assumption tested on real users before it becomes expensive.",
    best: "You're launching a product, entering a new market, or building something internal that will replace how a team works day to day.",
    items: ["Research", "Journeys", "Prototypes", "Interface design", "Build-ready handover"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "Fixing what's underperforming",
    body: "Evidence first — where people leave, what they try instead, what they contact you about — then targeted changes to the specific points losing you money.",
    best: "The numbers are disappointing but nobody can say why, support keeps answering the same question, or a redesign has been proposed without a diagnosis.",
    items: ["Usability review", "Drop-off analysis", "Testing with users", "Targeted redesign", "Before-and-after measures"],
  },
];

type DecisionKey = "bounce" | "abandon" | "support" | "find" | "mobile" | "dated";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "bounce", label: "They leave almost immediately" },
  { value: "abandon", label: "They start and don't finish" },
  { value: "support", label: "They contact support instead" },
  { value: "find", label: "They can't find what they need" },
  { value: "mobile", label: "Mobile performs far worse" },
  { value: "dated", label: "It works, but it feels dated" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  bounce: {
    title: "A mismatch, usually before design is involved",
    body: "People leaving in seconds rarely means the page is ugly. It means it isn't what they expected from whatever brought them there, or it took too long to appear on a mid-range phone.",
    approach: "We check what the promise was on the way in and how fast the page becomes useful. Both are often fixable without redesigning anything.",
  },
  abandon: {
    title: "One step, not the whole journey",
    body: "Abandonment concentrates. There's normally a single point — an unexpected cost, a question people can't answer, a form asking for something they don't have to hand — where most of the loss happens.",
    approach: "We find the step, watch a few people meet it, and fix that. Far cheaper than redesigning the journey around it.",
  },
  support: {
    title: "The screen is asking the wrong question",
    body: "Repeated contacts are the most useful design evidence you already own. Every one is somebody telling you the interface didn't answer something it should have.",
    approach: "We read a month of support contacts, group them, and design out the top three causes. Results usually show in the contact volume within weeks.",
  },
  find: {
    title: "Organised the way you're organised",
    body: "Most navigation reflects the company's internal structure rather than how customers think about what they want. It's obvious to everyone inside and invisible as a problem.",
    approach: "We test the structure with real users before touching visual design. Reorganising is often cheaper than redesigning and does more.",
  },
  mobile: {
    title: "Designed on a large screen, used on a small one",
    body: "When mobile lags badly it's usually because the work was designed at desktop width and adapted afterwards. Touch targets, form length and page weight all suffer in that order.",
    approach: "We look at the journey on a real phone on a normal connection. What's wrong is usually obvious within ten minutes and specific.",
  },
  dated: {
    title: "Worth asking what dated is costing you",
    body: "Sometimes appearance genuinely undermines trust — for a considered purchase it can. Often 'dated' is the visible thing people point at when the actual problem is that something is awkward to use.",
    approach: "We check whether the appearance is costing you or just bothering you. If it's the latter, a lighter refresh gets you most of the benefit for a fraction of the cost.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when a symptom is picked — so it gets
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
          <h4 className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#1A1220]">
            Where are people struggling?
          </h4>
          <p className="text-[0.87rem] text-[#5F627A]">
            Choose the symptom closest to yours. We&rsquo;ll show you what it usually turns out to be.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            The symptom
          </label>
          <select
            id="decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as DecisionKey | "")}
            className="min-w-full cursor-pointer rounded-[9px] border border-[#EDE5E9] bg-white px-3 py-[11px] text-[0.9rem] text-[#1A1220] lg:min-w-[320px]"
          >
            <option value="">Select…</option>
            {DECISION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {answer && (
          <div ref={answerRef} className="rounded-xl border border-[#F0CBD6] bg-[#f338b017] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#f338b0]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#f338b0]" />
              What this usually means
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#1A1220]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#5F627A]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#1A1220]">Where we&rsquo;d start:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#f338b0]">
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
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#f338b0]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#f338b0]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <h3 className="mb-3 text-[1.42rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.95rem] leading-[1.65] text-[#5F627A]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#F8F3F5] p-[16px_18px] text-[0.89rem] text-[#5F627A]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#f338b0]" : "text-[#4351E6]")}>
          Best when
        </b>
        {best}
      </div>
      <ul className="mt-[18px] flex flex-wrap gap-[7px]">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[#EDE5E9] bg-white px-3 py-[5px] text-[0.8rem] text-[#5F627A]">
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
          title="Design something new, or find out why something isn't working."
          lede="These need different starting points. A new product begins with people and problems. An underperforming one begins with evidence — because the answer is usually three specific screens, not the whole thing."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#f338b0] bg-[#f338b017] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#1A1220]">
            <strong>A full redesign is the most expensive way to fix a conversion problem.</strong> It takes months,
            changes everything at once so you can&rsquo;t tell what helped, and resets the familiarity your
            existing customers have built. Most of the time the loss is concentrated in two or three screens.
            We&rsquo;d rather find those and fix them in weeks &mdash; even though the redesign is the bigger
            project for us.
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
    title: "Ordering something that doesn't exist yet",
    question: "Print has no fixed product. Size, material, quantity and finish all change the price, and most customers aren't designers — they have a rough idea and a deadline.",
    built:
      "Options revealed in the order a person actually decides them, with the price updating as they go and tax shown inclusive so nothing changes at the end. Plus a design tool for people who want to make it themselves.",
    cutLabel: "The detail that mattered",
    cut: "Memorial cards sit in the same shop as business cards. Someone ordering those is having a difficult week — that route is quieter, shorter, and doesn't try to upsell anything.",
    href: "https://staginginkjet.oxytalapps.com/",
  },
  {
    who: "Casa Famosa · new brand launch",
    title: "A gate before anyone sees anything",
    question: "Legally the first interaction has to be an age check. It's the worst possible first impression for a brand built on colour and energy — and most of the audience arrives from social, on a phone, with no patience.",
    built: "Designed the check as part of the brand rather than a barrier in front of it, kept the journey to a handful of pages, and made the whole thing work on a phone first because that's where it's found.",
    cutLabel: "The detail that mattered",
    cut: "The retailer finder is one tap from anywhere. When someone decides they want it, the last thing the design should do is make them hunt for where to buy it.",
    href: "https://www.drinkcasafamosa.com/",
  },
  {
    who: "Taffer's Browned Butter Bourbon",
    title: "Persuading someone to try the unfamiliar",
    question: "Browned butter bourbon is an unusual proposition. Curiosity brings people to the page; hesitation is what stops them buying. The design has to answer a doubt it can't hear.",
    built: "Put the competition awards where the hesitation happens rather than on a separate page, told the origin story in a few lines instead of an essay, and gave people recipes — a concrete reason to buy a bottle this week.",
    cutLabel: "The detail that mattered",
    cut: "Recipes are what people search for. They're treated as proper content with their own route in, not decoration on the way to a buy button.",
    href: "https://www.taffersbrownedbutterbourbon.com/",
  },
];

function CaseStudyCard({ who, title, question, built, cutLabel, cut, href }: (typeof CASE_STUDIES)[number]) {
  // Dark background here, so the default ink shadow `useCardHover` uses
  // elsewhere wouldn't read — a brand-tinted glow instead.
  const cardRef = useCardHover<HTMLDivElement>({ y: -5, shadow: "0 20px 40px -16px rgba(254,127,82,.35)" });
  return (
    <div ref={cardRef} className="flex flex-col bg-[#1A1220] p-[30px_26px]">
      <span className="mb-[6px] text-[10.5px] uppercase tracking-[0.11em] text-[#f338b0]">{who}</span>
      <h3 className="mb-4 text-[1.14rem] font-bold leading-[1.28] text-white">{title}</h3>
      <dl className="m-0">
        <dt className="mt-[18px] text-[9.5px] uppercase tracking-[0.11em] text-[#8A8093]">The design problem</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#C4BCC7]">{question}</dd>
        <dt className="mt-[18px] text-[9.5px] uppercase tracking-[0.11em] text-[#8A8093]">What we did</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#C4BCC7]">{built}</dd>
      </dl>
      <div className="mt-5 rounded-[11px] border border-[#f338b017] bg-[#f338b017] p-[14px_16px]">
        <dt className="text-[9.5px] uppercase tracking-[0.11em] text-[#f338b0]">{cutLabel}</dt>
        <dd className="mt-[6px] text-[0.9rem] leading-[1.58] text-[#E7D3DB]">{cut}</dd>
      </div>
      <p className="mt-auto pt-5">
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="border-b border-[#4A3A4C] text-[0.86rem] text-[#B4ABB6] transition-colors duration-200 hover:border-[#f338b0] hover:text-white"
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
    <section id="proof" className={cx(SECTION, "relative overflow-hidden bg-[#1A1220]")}>
      <div className="pointer-events-none absolute -right-[24%] -top-[40%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(111,114,232,.32),transparent_66%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Proof · three builds, three design problems"
          eyebrowVariant="brand2"
          title="In every one of these, the constraint was the brief."
          lede="Age verification, tax display, compliance notices, dozens of product options — these read like obstacles to good design. They're actually the design problem. Anyone can make an unconstrained page look good. Here's what we did with the constraints."
        />

        <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-[#332434] bg-[#332434] sm:grid-cols-3" ref={cardsRef}>
          {CASE_STUDIES.map((c) => (
            <CaseStudyCard key={c.who} {...c} />
          ))}
        </div>

        <div ref={plineRef} className="mt-[26px] rounded-2xl border border-[#332434] p-[22px_26px]">
          <p className="m-0 text-[1rem] leading-[1.62] text-[#EFE9EE]">
            <strong className="text-white">None of these decisions show up in a portfolio screenshot.</strong>{" "}
            They&rsquo;re the difference between a page that looks designed and one that works for the person using
            it &mdash; which is the only measure that reaches your numbers.
          </p>
        </div>
      </div>
    </section>
    </div>
  );
}

// ─────────────────────────── 5. why oxytal ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "Our designs get built as drawn", body: "Designers and engineers sit in the same team and review each other's work as it happens. ", em: "Nothing gets quietly simplified during development because it turned out to be impractical", tail: " — the practicality was checked while it was still a drawing." },
  { n: "02", title: "Research sized to the decision", body: "Six weeks of research to settle a question worth two days is its own kind of waste. ", em: "We match the depth of the work to what's actually at stake", tail: ", and we'll tell you when a quick session with five people is genuinely enough." },
  { n: "03", title: "We design inside real constraints", body: "Age verification, tax display, regulated wording, hundreds of product options. ", em: "We've delivered inside all of them", tail: ", which is a different skill from designing something with no rules attached." },
  { n: "04", title: "Systems, not screens", body: "A folder of beautiful pages ages badly. ", em: "We hand over a set of components your team can build with", tail: ", so the design still holds together after two years of additions we had nothing to do with." },
  { n: "05", title: "Accessible by default", body: "Contrast, keyboard use, screen readers and clear language are decided while designing, not corrected after an assessment. ", em: "Retrofitting access is the most avoidable cost in this field", tail: ", and it usually improves the experience for everyone." },
  { n: "06", title: "We're there after launch", body: "The interesting questions only appear once real people arrive. ", em: "The team that designed it watches how it's used and keeps improving it", tail: " — across Dublin and Chandigarh, with the same faces throughout." },
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
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#f338b0]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#f338b0]">{n}</span>
      <h3 className="mb-[9px] text-[1.1rem] font-bold leading-[1.3] text-[#1A1220]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.62] text-[#5F627A]">
        {body}
        <em className="font-medium not-italic text-[#1A1220]">{em}</em>
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
          title="Why us and not a design studio?"
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

// ───────────────────────────── deliverables ─────────────────────────────
const DELIVERABLES = [
  { title: "What we learned", body: "What people are trying to do and where the current experience stops them — in their words, with recordings." },
  { title: "The journeys", body: "Each route mapped end to end, including the awkward cases everyone forgets until they reach development." },
  { title: "The designs", body: "Every screen and state — including empty, loading, error and success, which is where most handovers fall short." },
  { title: "The system", body: "Reusable components with the rules for using them, so new pages stay consistent without us." },
  { title: "The evidence", body: "What testing showed, what changed as a result, and what to measure once it's live." },
];

function DeliverableCard({ title, body }: (typeof DELIVERABLES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-[24px_22px]">
      <h4 className="mb-[7px] text-[1rem] font-bold tracking-[-0.02em] text-[#1A1220]">{title}</h4>
      <p className="text-[0.875rem] leading-[1.58] text-[#5F627A]">{body}</p>
    </div>
  );
}

function DeliverablesSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  return (
    <section className={cx(SECTION, "bg-[#F7F3F7]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="What you get"
          title="Work your team can build from and defend."
          lede="The test we apply: could an engineer build this without asking us fifty questions, and could you justify each decision to someone who disagrees? If either answer is no, it isn't finished."
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
  { k: "Start here", title: "Design review", body: "Two weeks. We assess what you have against how people actually use it, test it with a small number of real users, and come back with the specific problems ranked by what they're costing you.", meta: ["2 weeks · fixed fee", "Credited against design work"], featured: false },
  { k: "Most common", title: "Design partnership", body: "A named designer and researcher working alongside your team through research, design and testing — into build, so they're still there when the difficult questions arrive during development.", meta: ["6–16 weeks typical", "Fixed-price stages"], featured: true },
  { k: "Ongoing", title: "Design system & support", body: "We build the component set, document it, train your team on it, and stay available for the decisions it doesn't cover. Reviewed quarterly as the product grows.", meta: ["Monthly retainer", "Handover built in"], featured: false },
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
        featured ? "border-[#1A1220] bg-[#1A1220]" : "border-[#EDE5E9] bg-white"
      )}
    >
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#f338b0]">{k}</span>
      <h3 className={cx("mb-[9px] text-[1.18rem] font-bold", featured ? "text-white" : "text-[#1A1220]")}>{title}</h3>
      <p className={cx("flex-1 text-[0.9rem] leading-[1.62]", featured ? "text-[#B4ABB6]" : "text-[#5F627A]")}>{body}</p>
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
    q: "Do we really need research, or can you just design it?",
    a: "We can just design it, and sometimes that's the right call — for a small change on a well-understood product, research would cost more than the decision is worth. But when you're building something new, the expensive mistake isn't a bad layout, it's building the right thing for the wrong person. Five conversations with real customers is usually a week and repeatedly changes what gets built. We'll tell you honestly which situation you're in rather than selling research by default.",
  },
  {
    q: "Can you work within our existing brand guidelines?",
    a: "Yes, and we prefer to. Brand consistency is worth more than a designer's preference for something different. Where guidelines cause a real usability problem — contrast that fails accessibility standards is the common one — we'll show you the evidence and propose a narrow exception rather than quietly ignoring it or accepting something that will fail an assessment later.",
  },
  {
    q: "What is a design system, and do we need one?",
    a: "It's a set of ready-made pieces — buttons, forms, layouts, spacing rules — plus guidance on when to use each. You need one once you have more than a handful of screens or more than one person building them. Below that it's overhead. Above it, it's the difference between adding a page in an afternoon and rebuilding decisions from scratch every time. We'll say which side of the line you're on.",
  },
  {
    q: "How do you handle accessibility?",
    a: "As a design constraint from the first sketch rather than an assessment at the end. Contrast, text size, keyboard use, clear labelling and sensible language all get decided while decisions are cheap. It's a legal requirement in many contexts and a commercial one everywhere — a meaningful share of your customers have some barrier to using a screen, permanent or temporary. Designs that work for them are usually clearer for everyone.",
  },
  {
    q: "Will the designs actually be buildable?",
    a: "Yes, because engineers review them while they're being made. This is the most common failure with a standalone studio: beautiful work that turns out to be impractical, gets simplified during development, and ends up neither what was designed nor what was intended. We hand over every state a screen can be in — empty, loading, error, success — because those are the ones that get invented at the last minute otherwise.",
  },
  {
    q: "Who actually does the work?",
    a: "A named designer and researcher, the same ones throughout — the person in your first session is the person doing the design. No account-management layer between you and the people doing the work. You'll meet them before anything is agreed.",
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
                <span aria-hidden className="text-[1.35rem] font-normal text-[#f338b0] transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[76ch] pb-5 text-[0.93rem] leading-[1.7] text-[#5F627A]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── related + final CTA ─────────────────────────
const RELATED = [
  { k: "01", title: "Digital Strategy", body: "Deciding what's worth designing in the first place.", href: "/service/digital-strategy" },
  { k: "03", title: "Software Engineering", body: "Building it exactly as it was designed.", href: "/service/software-development" },
  { k: "06", title: "Digital Commerce", body: "Where design decisions become revenue.", href: "/service/digital-commerce" },
  { k: "07", title: "AI & Agentic Engineering", body: "Designing what happens when software decides.", href: "/service/ai-and-intelligent-automation" },
];

function RelatedCard({ k, title, body, href }: (typeof RELATED)[number]) {
  const cardRef = useCardHover<HTMLAnchorElement>({ y: -4 });
  return (
    <Link href={href} ref={cardRef} className="block rounded-[14px] border border-[#EDE5E9] bg-white p-[22px]">
      <span className="text-[10px] uppercase tracking-[0.11em] text-[#8D8E9E]">{k}</span>
      <h3 className="mt-[9px] mb-[6px] text-[1rem] font-bold text-[#1A1220]">{title}</h3>
      <p className="text-[0.85rem] leading-[1.55] text-[#5F627A]">{body}</p>
    </Link>
  );
}

function RelatedAndCtaSection() {
  const relRef = useStaggerReveal<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading eyebrow="Related services" title="Design rarely travels alone." />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#1A1220)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(111,114,232,.32),transparent_66%)]" />
          <div className="relative">
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with the screen that isn&rsquo;t working.
            </h2>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with a designer rather than a salesperson. Bring the step people abandon, the question
              support keeps answering, or the idea you haven&rsquo;t put in front of anyone yet. We&rsquo;ll tell
              you what we&rsquo;d look at first &mdash; and if it&rsquo;s a short answer, you&rsquo;ll get it on the
              call.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Book a design review <span aria-hidden>&rarr;</span>
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
export default function UiExperiencePage({ entry }: Props) {
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
