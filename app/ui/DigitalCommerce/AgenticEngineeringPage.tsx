/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Full static conversion of `Refrence/oxytal-ai-agentic-engineering.html`
 * into a single component. The reference page's `<style>` block (custom
 * CSS variables, hand-rolled `.prob`/`.plat`/`.wc`/... classes, `@media`
 * queries) is intentionally NOT ported — every section below is built with
 * Tailwind utility classes only. The reference's colour palette (its
 * `:root` custom properties — a violet/blue scheme) is NOT reproduced
 * either; this file keeps the site's own orange (`#5b4be0`) brand colour
 * already established by the sibling `DigitalStrategyPage`/
 * `UiExperiencePage`/`SoftwareDevelopmentPage`/`CloudDigitaPage`/
 * `EnterpriseSystemPage`/`DigitalCommercePage` conversions in this folder,
 * so every accent below is orange regardless of what colour the reference
 * document used for it. The one exception is the Forge demo's "human
 * decision" accent (an amber, `#F0801F`) — that's the reference's own
 * semantic colour for "this step is waiting on a person", not branding,
 * so it's kept distinct from the AI-automated steps' orange the same way
 * `DigitalCommercePage`'s platform-checker kept its ok/warn/stop colours.
 *
 * This reference's section list is unique among the sibling pages in one
 * way: a live interactive "Forge" pipeline demo (`ForgeDemo`) — a rail of
 * pipeline stages that runs automatically once scrolled into view, with a
 * human-approval gate (Approve / Request changes), a rolling activity log,
 * running tallies and a model switcher. The reference drives this with a
 * ~100-line hand-written vanilla-JS state machine (direct DOM
 * manipulation, `setTimeout` chains); `ForgeDemo` below is a faithful
 * React port of the same stage data, timings and branching logic
 * (including the "changes requested" → reset → replay path), using
 * `useState`/`useCallback`/timers instead of DOM mutation. It also carries
 * `SoftwareDevelopmentPage`'s "Evidence" stats/work-card pattern and a new
 * "Governance" grid section that doesn't appear on any sibling page.
 *
 * The reference's own `IntersectionObserver`-driven `.reveal`/`.reveal.in`
 * fade-ins are replaced by this folder's shared GSAP reveal hooks (see
 * `useReveal.ts`), the same ones `DigitalCommerce.tsx` (the hero) uses.
 *
 * The reference hero's large inline decorative illustration (a single
 * ~90KB `<svg>` of bespoke line art) is approximated with a few blurred
 * gradient blobs instead of being transcribed — everything else is a
 * faithful, section-by-section copy of the reference's copy and structure.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  Lightbulb,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  Lock,
  WifiOff,
  UserCheck,
  FileText,
  SlidersHorizontal,
  Clock,
  Check,
} from "lucide-react";
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
// classes instead (`text-[#0D1B2A]`, `bg-[#5b4be0]`, ...).
const SVG_INK = "#0D1B2A";
const SVG_BODY = "#55677f";
const SVG_LINE = "#EDE5E9";
const SVG_BRAND = "#5b4be0";
const SVG_BRAND_2 = "#5b4be0";
const SVG_INDIGO = "#4351E6";
const SECTION = "py-[60px] sm:py-20 lg:py-28";
const LEDE = "max-w-[62ch] text-[1.05rem] leading-[1.7] text-[#55677f]";
const BTN_BASE =
  "inline-flex items-center gap-[9px] rounded-[10px] border px-[26px] py-[14px] text-[0.95rem] font-medium transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border-transparent bg-[#5b4be0] text-white hover:-translate-y-px hover:bg-[#1a08b1]");
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
        variant === "brand" ? "text-[#5b4be0]" : "text-[#5b4be0]",
        center && "justify-center"
      )}
    >
      <span
        aria-hidden
        className={cx("h-[2px] w-[22px] rounded-full", variant === "brand" ? "bg-[#5b4be0]" : "bg-[#5b4be0]")}
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
  /** Why-Oxytal section only — sits on the dark `#0D1B2A` background. */
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
          <Eyebrow>AI &amp; Agentic Engineering</Eyebrow>
          <h1
            ref={titleRef}
            className="max-w-[680px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-[34px] md:text-[46px] lg:text-[50px] mb-3 text-[#0D1B2A]"
          >
            AI that does the work. You keep the decisions.
          </h1>
          <p className="mb-4 max-w-[620px] text-[19px] font-semibold leading-[1.35] sm:text-[21px] text-[#5b4be0]">
            We don&rsquo;t run pilots. We put AI into production and stay to run it.
          </p>
          <p className="mb-8 max-w-[620px] text-[16px] leading-[1.9] text-[#55677f]">
            We build AI agents that take on real operational work &mdash; inside your systems, on your accounts,
            with a person approving anything that matters. Strategy, engineering, governance and ongoing
            improvement from one team that uses this technology on itself every day.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className={BTN_PRIMARY}>
              Talk to Oxytal AI Lab <span aria-hidden>&rarr;</span>
            </Link>
            <a href="#forge" className={BTN_SECONDARY}>
              See it working
            </a>
          </div>
          <p className="mt-[15px] text-[0.86rem] text-[#8D8E9E]">
            A 60-minute conversation about your business, not a product demo.
          </p>
        </div>

        <div
          ref={logosRef}
          className="relative z-10 mt-11 flex flex-wrap items-center gap-x-9 gap-y-4 border-t border-[#EDE5E9] pt-[26px] sm:mt-16"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">Trusted by</span>
          <ul className="flex flex-wrap gap-x-9 gap-y-4">
            {["Diageo", "Aviation Gin", "Casa Famosa", "Lone River", "Bundaberg Rum"].map((name) => (
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
    Icon: Lightbulb,
    title: "We've run pilots. None of them landed.",
    body: "Something impressive was built, everyone was pleased, and then it never made it into the way work actually gets done. The gap is usually integration and governance, not the model.",
    say: '"We keep proving it works and never using it."',
  },
  {
    Icon: BarChart3,
    title: "Skilled people spend their days on repetitive work.",
    body: "Reading documents, copying between systems, chasing exceptions, assembling the same report every week. The work is necessary. It just doesn't need a person doing all of it.",
    say: '"We’re paying experts to do admin."',
  },
  {
    Icon: ShieldCheck,
    title: "We can't let software make that call.",
    body: "The work is a good fit for automation, but the consequences of a wrong answer are real — money moves, a customer is affected, a regulator would ask questions. So nothing happens.",
    say: '"Who’s accountable when it gets it wrong?"',
  },
  {
    Icon: HelpCircle,
    title: "The board is asking about our AI strategy.",
    body: "There's pressure to have an answer and a fear of spending money on the wrong thing. What's missing is a costed view of where this genuinely pays back and in what order.",
    say: '"We need a plan, not another tool."',
  },
];

function ProblemCard({ Icon, title, body, say }: (typeof PROBLEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#f5f5fc] bg-white p-[26px]">
      <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#f5f5fc]">
        <Icon size={20} strokeWidth={1.9} className="text-[#5b4be0]" />
      </div>
      <h3 className="mb-[9px] text-[1.04rem] font-bold leading-[1.3] text-[#0D1B2A]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#55677f]">{body}</p>
      <p className="mt-[14px] border-t border-[#f5f5fc] pt-[13px] text-[0.85rem] italic text-[#8D8E9E]">{say}</p>
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
          title="Most organisations aren't short of AI ideas. They're short of AI in production."
          lede="The gap between an impressive demo and something the business actually relies on is where nearly every AI programme stalls. These are the four conversations we're brought into most often."
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

// ─────────────────────── 2. AI capability ───────────────────────
const LIFECYCLE_STEPS = [
  { x: 40, label: "Identify" },
  { x: 256, label: "Prove" },
  { x: 472, label: "Build" },
  { x: 688, label: "Govern" },
  { x: 904, label: "Launch" },
];

const CAPABILITIES = [
  { n: "01", title: "AI strategy & readiness", body: "Where this genuinely pays back in your business, what it costs, and the order to do it in." },
  { n: "02", title: "Agentic automation", body: "Operational work run from start to finish, with people involved only where judgement is needed." },
  { n: "03", title: "AI inside your products", body: "Intelligence built into the systems you already run, through controlled and monitored connections." },
  { n: "04", title: "Data foundations", body: "The unglamorous part that decides whether any of it works — access, quality, structure and permissions." },
  { n: "05", title: "Governance & assurance", body: "Approval points, complete records, and testing that proves quality before anything is trusted." },
  { n: "06", title: "Run & improve", body: "Watching accuracy, cost and behaviour after launch — because all three move over time." },
];

function CapabilityCard({ n, title, body }: (typeof CAPABILITIES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-6 transition-colors duration-200 hover:bg-[#FFFCFD]">
      <span className="mb-[11px] block text-[10.5px] tracking-[0.1em] text-[#5b4be0]">{n}</span>
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
          eyebrow="AI capability"
          title="One team from business case through to continuous improvement."
          lede="Strategy, data, engineering, governance and ongoing operation sit in the same team — so nobody hands you a working prototype and walks away from the hard part."
        />

        <div ref={lifeRef} className="mt-11 overflow-x-auto">
          <svg
            viewBox="0 0 1160 212"
            className="block h-auto min-w-[720px] w-full"
            aria-label="A continuous AI lifecycle: identify, prove, build, govern, launch, improve — then looping back to identify. Most AI stops at the pilot."
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
                <text x={1120} y={99} fill={SVG_INK}>Improve</text>
              </g>
            </g>
            <text x={580} y={188} fontWeight={600} fontSize={17} fill={SVG_INK} textAnchor="middle" letterSpacing="-.3">
              Most AI stops at the pilot. This is where the value starts.
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
    title: "Agents that run operational work",
    body: "A process handled from beginning to end — reading what comes in, deciding what to do, acting in your systems, and escalating what it shouldn't decide alone.",
    best: "A repeatable process consumes real hours, has clear rules with messy inputs, and touches systems that already hold the data — claims, invoices, orders, onboarding, reporting, support triage.",
    items: ["Process mapping", "Agent design", "System connections", "Approval points", "Exception handling"],
  },
  {
    variant: "indigo" as const,
    tag: "Shape two",
    title: "AI inside what you already sell",
    body: "Search that understands intent, drafting that saves an hour, recommendations that fit the customer — built into your product rather than bolted on beside it.",
    best: "You have a product or platform with real users and a feature that would be transformative if it worked reliably — and embarrassing if it didn't.",
    items: ["Feature design", "Quality testing", "Cost control", "Fallback behaviour", "User trust"],
  },
];

type DecisionKey = "cs" | "fin" | "ops" | "sales" | "tech" | "risk";

const DECISION_OPTIONS: { value: DecisionKey; label: string }[] = [
  { value: "cs", label: "Customer service & support" },
  { value: "fin", label: "Finance & administration" },
  { value: "ops", label: "Operations & supply chain" },
  { value: "sales", label: "Sales & marketing" },
  { value: "tech", label: "Technology & engineering" },
  { value: "risk", label: "Compliance & risk" },
];

const DECISION_ANSWERS: Record<DecisionKey, { title: string; body: string; approach: string }> = {
  cs: {
    title: "Start with what people look up, not what they say",
    body: "The reliable win is retrieving and summarising — pulling the right policy, order or history so an advisor answers in seconds rather than minutes. Full auto-reply on anything sensitive is where organisations get burned.",
    approach: "Draft-and-approve first: the agent writes the reply, a person sends it. Move to fully automatic only on the categories where accuracy has been proven over months.",
  },
  fin: {
    title: "Documents in, structured data out",
    body: "Invoices, statements, expenses and receipts are a strong fit — high volume, defined rules, messy inputs. Matching and coding are usually the biggest single saving.",
    approach: "Automate the routine and route exceptions to a person. Anything that moves money keeps an approval step, permanently.",
  },
  ops: {
    title: "Exceptions, not the happy path",
    body: "The routine cases are usually already automated. The cost sits in the awkward ones — a delayed shipment, a mismatched delivery, a supplier who replies in free text.",
    approach: "Handle exception triage and the chasing that follows. Keep decisions with commercial consequences with your team.",
  },
  sales: {
    title: "Preparation and follow-up, not the conversation",
    body: "Research, briefing notes, proposal drafting and keeping records current are hours a week per person. Anything customer-facing and automatic risks your brand for a small gain.",
    approach: "Start where the output is internal. Once quality is proven, extend carefully outward.",
  },
  tech: {
    title: "The clearest return we've measured",
    body: "Requirement analysis, test generation, documentation, code review and security checking are repetitive, verifiable and high volume. This is what Forge does for us.",
    approach: "Start with tests and documentation — safe, immediately useful, and it builds your team's trust before anything riskier.",
  },
  risk: {
    title: "Review and flag, never decide",
    body: "Screening documents, spotting missing evidence and drafting first-pass assessments saves substantial time. A regulated decision made without a person is a problem regardless of accuracy.",
    approach: "The agent prepares and highlights; a qualified person decides. The record of both is the point, and it's usually better than what exists today.",
  },
};

function DecisionHelper() {
  const [decision, setDecision] = useState<DecisionKey | "">("");
  const answer = decision ? DECISION_ANSWERS[decision] : undefined;
  const answerRef = useRef<HTMLDivElement>(null);

  // The result panel isn't scroll-triggered like the rest of this page's
  // reveals — it mounts on demand when an area is picked — so it gets its
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
          <h4 className="mb-[5px] text-[1.02rem] font-bold tracking-[-0.02em] text-[#0D1B2A]">
            Where would AI actually pay back for you?
          </h4>
          <p className="text-[0.87rem] text-[#55677f]">
            Choose the part of the business closest to yours. We&rsquo;ll show you where we&rsquo;d start &mdash;
            and where we wouldn&rsquo;t.
          </p>
        </div>
        <div>
          <label htmlFor="decision" className="mb-[6px] block text-[9.5px] uppercase tracking-[0.11em] text-[#8D8E9E]">
            Your area
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
          <div ref={answerRef} className="rounded-xl border border-[#f5f5fc] bg-[#f5f5fc] p-5 lg:col-span-2">
            <div className="mb-2 flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.11em] text-[#5b4be0]">
              <b aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#5b4be0]" />
              Where the return usually is
            </div>
            <strong className="mb-[6px] block text-[1.02rem] tracking-[-0.02em] text-[#0D1B2A]">{answer.title}</strong>
            <p className="text-[0.89rem] leading-[1.6] text-[#55677f]">
              {answer.body}
              <br />
              <br />
              <strong className="text-[#0D1B2A]">Where we&rsquo;d start:</strong> {answer.approach}{" "}
              <Link href="/contact-us" className="font-medium text-[#5b4be0]">
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
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-[3px]", isBrand ? "bg-[#5b4be0]" : "bg-[#4351E6]")} />
      <span className={cx("mb-3 block text-[10px] uppercase tracking-[0.11em]", isBrand ? "text-[#5b4be0]" : "text-[#4351E6]")}>
        {tag}
      </span>
      <h3 className="mb-3 text-[1.42rem] font-bold text-[#0D1B2A]">{title}</h3>
      <p className="text-[0.95rem] leading-[1.65] text-[#55677f]">{body}</p>
      <div className="mt-5 rounded-[11px] bg-[#f5f5fc] p-[16px_18px] text-[0.89rem] text-[#55677f]">
        <b className={cx("mb-[7px] block text-[9.5px] font-medium uppercase tracking-[0.11em]", isBrand ? "text-[#5b4be0]" : "text-[#4351E6]")}>
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
          title="Take work off people, or put intelligence into products."
          lede="These need different things. Automating operations is mostly an integration and governance problem. Putting AI into a product is mostly a design and quality problem. We do both, and we're clear about which one you're actually asking for."
        />

        <div ref={shapesRef} className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SHAPES.map((s) => (
            <ShapeCard key={s.tag} {...s} />
          ))}
        </div>

        <div ref={neutralRef} className="mt-6 rounded-r-xl border-l-[3px] border-[#5b4be0] bg-[#f5f5fc] p-5 sm:p-6">
          <p className="text-[0.95rem] leading-[1.62] text-[#0D1B2A]">
            <strong>And sometimes the answer isn&rsquo;t AI at all.</strong> A properly built integration, a fixed
            process, or deleting a step nobody needed is often cheaper, faster and more reliable than anything we
            could train. We&rsquo;ll tell you when that&rsquo;s the case &mdash; even though it&rsquo;s the smaller
            project.
          </p>
        </div>

        <div ref={utilRef}>
          <DecisionHelper />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 4. forge demo ───────────────────────────
type StageAgent = "agent" | "human";
type StageStatus = "pending" | "active" | "done" | "waiting";

interface Stage {
  name: string;
  sub: string;
  agent: StageAgent;
  ms: number;
  log: string[];
}

const STAGES: Stage[] = [
  { name: "Requirements read and sorted", sub: "From tickets, emails and documents", agent: "agent", ms: 1500, log: ["43 items read", "41 routed automatically, 2 flagged"] },
  { name: "Plan and test approach drafted", sub: "Against your existing systems", agent: "agent", ms: 1700, log: ["6 components mapped", "248 checks proposed"] },
  { name: "Work generated", sub: "Following your standards", agent: "agent", ms: 1900, log: ["14 files, 1,206 lines", "style and structure checks passed"] },
  { name: "Security and quality checked", sub: "Before anyone is asked to look", agent: "agent", ms: 1500, log: ["no high-risk findings", "no known vulnerabilities"] },
  { name: "Your approval", sub: "Everything stops here until you decide", agent: "human", ms: 0, log: [] },
  { name: "Released", sub: "With automatic rollback ready", agent: "agent", ms: 1600, log: ["released to production", "all services responding"] },
  { name: "Record sealed", sub: "Timestamped and exportable", agent: "agent", ms: 1200, log: ["38 actions signed and stored"] },
];

const MODEL_CHIPS = ["Claude", "GPT", "Gemini"] as const;
type ModelChip = (typeof MODEL_CHIPS)[number];

interface LogLine {
  id: number;
  t: string;
  text: string;
  human?: boolean;
}

const HUMAN = "#F0801F";
const HUMAN_SOFT = "#FEF1E4";

function StageRow({
  stage,
  index,
  status,
  onApprove,
  onRequestChanges,
}: {
  stage: Stage;
  index: number;
  status: StageStatus;
  onApprove: (i: number) => void;
  onRequestChanges: (i: number) => void;
}) {
  const isHuman = stage.agent === "human";
  const isOn = status === "active" || status === "waiting";
  const isDone = status === "done";

  return (
    <div
      className={cx(
        "grid grid-cols-[36px_1fr_auto] items-center gap-[14px] rounded-xl p-[15px_18px] transition-opacity duration-300",
        status === "pending" ? "opacity-40" : "opacity-100"
      )}
      style={isHuman && (isOn || isDone) ? { backgroundColor: HUMAN_SOFT, border: `1px solid #F9D6B4` } : undefined}
    >
      <div
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
          !isHuman && isDone && "border-[#5b4be0] bg-[#5b4be0]",
          !isHuman && isOn && "border-[#5b4be0] bg-[#f5f5fc]",
          !isHuman && status === "pending" && "border-[#EDE5E9] bg-[#F1F5F9]"
        )}
        style={isHuman ? { borderColor: HUMAN, backgroundColor: isDone ? HUMAN : isOn ? HUMAN_SOFT : "#F1F5F9" } : undefined}
      >
        {isHuman ? (
          <UserCheck size={16} strokeWidth={2} className={isDone ? "text-white" : "text-[#8D8E9E]"} style={isOn ? { color: HUMAN } : undefined} />
        ) : isDone ? (
          <Check size={15} strokeWidth={3} className="text-white" />
        ) : isOn ? (
          <span className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-[#5b4be0] border-t-transparent" />
        ) : null}
      </div>
      <div>
        <div className="text-[0.945rem] font-medium leading-[1.3] text-[#0D1B2A]">{stage.name}</div>
        <div className="mt-[2px] text-[0.8rem] text-[#8D8E9E]">{stage.sub}</div>
      </div>
      <span
        className={cx(
          "rounded-full border px-[10px] py-[3px] text-[10px] font-medium uppercase tracking-[0.06em]",
          !isHuman && (isDone || isOn) && "border-[#fbd7c8] bg-[#f5f5fc] text-[#5b4be0]",
          !isHuman && status === "pending" && "border-[#EDE5E9] text-[#8D8E9E]"
        )}
        style={isHuman ? { borderColor: "#F7C79B", backgroundColor: "#fff", color: HUMAN } : undefined}
      >
        {isHuman ? "You" : "AI"}
      </span>
      {status === "waiting" && (
        <div className="col-span-3 mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onApprove(index)}
            className="rounded-lg px-4 py-2 text-[0.82rem] font-medium text-white transition-colors"
            style={{ backgroundColor: HUMAN }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onRequestChanges(index)}
            className="rounded-lg border border-[#EDE5E9] bg-white px-4 py-2 text-[0.82rem] font-medium text-[#0D1B2A] transition-colors hover:border-[#8D8E9E]"
          >
            Request changes
          </button>
        </div>
      )}
    </div>
  );
}

// Reference's own `finished()` fallback hardcodes "Claude" in this line
// (it runs before any model-switch interaction is possible), so this
// does too rather than reading live state.
const FINISHED_LOG_TEXT = [
  "43 items read",
  "6 components mapped",
  "14 files, 1,206 lines",
  "no high-risk findings",
  "approved by you — Claude on your accounts",
  "released to production",
  "38 actions signed and stored",
];

const startsReducedMotion = () => typeof window !== "undefined" && prefersReducedMotion();

function ForgeDemo() {
  // Under prefers-reduced-motion the demo renders already-finished (matching
  // the reference's `finished()` fallback) via these lazy initializers,
  // rather than a mount effect calling setState synchronously.
  const [statuses, setStatuses] = useState<StageStatus[]>(() =>
    startsReducedMotion() ? STAGES.map(() => "done") : STAGES.map(() => "pending")
  );
  const [lines, setLines] = useState<LogLine[]>(() =>
    startsReducedMotion()
      ? FINISHED_LOG_TEXT.map((text, i) => ({ id: i, t: `${(1.4 * (i + 1)).toFixed(1)}s`, text, human: i === 4 }))
      : []
  );
  const [steps, setSteps] = useState(() => (startsReducedMotion() ? 6 : 0));
  const [decisions, setDecisions] = useState(() => (startsReducedMotion() ? 1 : 0));
  const [elapsed, setElapsed] = useState(() => (startsReducedMotion() ? "9.4s" : "0.0s"));
  const [model, setModel] = useState<ModelChip>("Claude");

  const containerRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const intervalId = useRef<number | null>(null);
  const startTime = useRef(0);
  const lineId = useRef(0);

  const addLine = useCallback((text: string, human = false) => {
    lineId.current += 1;
    const t = `${((Date.now() - startTime.current) / 1000).toFixed(1)}s`;
    setLines((prev) => [...prev, { id: lineId.current, t, text, human }].slice(-9));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (intervalId.current !== null) {
      window.clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  const resetDemo = useCallback(() => {
    clearTimers();
    setStatuses(STAGES.map(() => "pending"));
    setLines([]);
    setSteps(0);
    setDecisions(0);
    setElapsed("0.0s");
  }, [clearTimers]);

  // Named function expression (not just an arrow assigned to the `runStage`
  // const) so the recursive call inside the `setTimeout` refers to the
  // function's own name binding rather than the outer `const`, which
  // isn't guaranteed to be initialized yet from the linter's point of view.
  const runStage = useCallback(
    function runStage(i: number) {
      if (i >= STAGES.length) {
        if (intervalId.current !== null) {
          window.clearInterval(intervalId.current);
          intervalId.current = null;
        }
        addLine("complete");
        return;
      }
      const stage = STAGES[i];
      if (stage.agent === "human") {
        setStatuses((prev) => prev.map((s, idx) => (idx === i ? "waiting" : s)));
        addLine("waiting for your approval", true);
        return;
      }
      setStatuses((prev) => prev.map((s, idx) => (idx === i ? "active" : s)));
      stage.log.forEach((text, k) => {
        const id = window.setTimeout(() => addLine(text), (stage.ms * (k + 1)) / (stage.log.length + 1));
        timers.current.push(id);
      });
      const id = window.setTimeout(() => {
        setStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
        setSteps((n) => n + 1);
        runStage(i + 1);
      }, stage.ms);
      timers.current.push(id);
    },
    [addLine]
  );

  const start = useCallback(() => {
    startTime.current = Date.now();
    intervalId.current = window.setInterval(() => {
      setElapsed(`${((Date.now() - startTime.current) / 1000).toFixed(1)}s`);
    }, 100);
    runStage(0);
  }, [runStage]);

  const replay = useCallback(() => {
    resetDemo();
    start();
  }, [resetDemo, start]);

  const approve = useCallback(
    (i: number) => {
      setStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      setDecisions((n) => n + 1);
      addLine(`approved by you — ${model} on your accounts`, true);
      runStage(i + 1);
    },
    [addLine, model, runStage]
  );

  const requestChanges = useCallback(() => {
    addLine("changes requested — sent back", true);
    clearTimers();
    const id = window.setTimeout(() => {
      resetDemo();
      start();
    }, 1400);
    timers.current.push(id);
  }, [addLine, clearTimers, resetDemo, start]);

  const switchModel = useCallback(
    (m: ModelChip) => {
      setModel(m);
      addLine(`switched to ${m} — same accounts, same environment`);
    },
    [addLine]
  );

  // Starts the pipeline once the demo scrolls into view (matching the
  // reference's own `IntersectionObserver`). Under prefers-reduced-motion
  // the finished state is already the initial render (see the lazy
  // `useState` initializers above), so this effect has nothing to do —
  // matching the reference's `finished()` fallback without calling
  // setState synchronously from inside an effect.
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          start();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimers();
    };
    // Runs once on mount only — `start`/`clearTimers` are stable enough
    // for this one-shot trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={containerRef} className="mt-11 overflow-hidden rounded-[20px] border border-[#EDE5E9] bg-white">
        <div className="flex flex-wrap items-center gap-4 border-b border-[#EDE5E9] bg-[#FCFCFE] p-[15px_20px]">
          <span className="flex items-center gap-[9px] text-[0.9rem] font-medium text-[#0D1B2A]">
            <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-[#12A67C]" />
            Forge · delivery pipeline
          </span>
          <span className="flex-1" />
          <span className="flex flex-wrap items-center gap-[8px]">
            <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#8D8E9E]">Model</span>
            {MODEL_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                aria-pressed={model === chip}
                onClick={() => switchModel(chip)}
                className={cx(
                  "rounded-full border px-3 py-[5px] text-[0.8rem] transition-colors duration-150",
                  model === chip
                    ? "border-[#5b4be0] bg-[#f5f5fc] font-medium text-[#5b4be0]"
                    : "border-[#EDE5E9] bg-white text-[#55677f] hover:border-[#5b4be0]"
                )}
              >
                {chip}
              </button>
            ))}
          </span>
          <button
            type="button"
            onClick={replay}
            className="rounded-lg border border-[#EDE5E9] px-3 py-[7px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8D8E9E] transition-colors duration-150 hover:border-[#8D8E9E] hover:text-[#0D1B2A]"
          >
            Replay
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="flex flex-col gap-[2px] p-[12px_8px_16px]">
            {STAGES.map((stage, i) => (
              <StageRow
                key={stage.name}
                stage={stage}
                index={i}
                status={statuses[i]}
                onApprove={approve}
                onRequestChanges={requestChanges}
              />
            ))}
          </div>

          <aside className="flex flex-col border-t border-[#EDE5E9] p-[18px_20px] lg:border-l lg:border-t-0">
            <h4 className="mb-3 text-[0.9rem] font-bold text-[#0D1B2A]">Record of activity</h4>
            <div className="flex min-h-[160px] flex-1 flex-col gap-[3px] overflow-hidden font-mono text-[11.5px] leading-[1.55]">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={cx("flex gap-2", !line.human && line.text === "complete" && "text-[#12A67C]", !line.human && line.text !== "complete" && "text-[#55677f]")}
                  style={line.human ? { color: HUMAN } : undefined}
                >
                  <span className="tabular-nums text-[#8D8E9E]">{line.t}</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-[10px] border-t border-[#EDE5E9] pt-4">
              <div>
                <div className="text-[1.45rem] font-bold tracking-[-0.02em] text-[#0D1B2A]">{steps}</div>
                <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.09em] text-[#8D8E9E]">Steps automated</div>
              </div>
              <div>
                <div className="text-[1.45rem] font-bold tracking-[-0.02em]" style={{ color: HUMAN }}>{decisions}</div>
                <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.09em] text-[#8D8E9E]">Your decisions</div>
              </div>
              <div>
                <div className="text-[1.45rem] font-bold tracking-[-0.02em] text-[#0D1B2A]">{elapsed}</div>
                <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.09em] text-[#8D8E9E]">Elapsed</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <p className="mt-[18px] text-center text-[0.9rem] text-[#55677f]">
        Switch the model above and the record updates &mdash; the same work, your choice of provider, running on
        your own accounts.
      </p>
    </div>
  );
}

function ForgeDemoSection() {
  return (
    <section id="forge" className={cx(SECTION, "bg-[linear-gradient(170deg,#F7F3FB,#FBFCFE_70%)]")}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Proof, not a promise"
          title="We use this on ourselves before we sell it to you."
          lede="Forge is Oxytal's own AI platform, and it runs our delivery work every day — reading requirements, drafting plans, generating tests, running security checks. The version below is how it actually behaves. Agents clear the routine work, then stop and wait for a person. Try it: nothing goes live until you say so."
        />
        <ForgeDemo />
      </div>
    </section>
  );
}

// ─────────────────────────── 5. governance ───────────────────────────
const GOVERNANCE_ITEMS = [
  { Icon: Lock, title: "Your accounts, your environment", body: "Everything runs on your credentials inside your own environment, not ours. If our relationship ends tomorrow, the system keeps working and you keep control of it.", human: false },
  { Icon: WifiOff, title: "Never used to train anything", body: "Your information is not used to train any provider's model. We work under enterprise agreements that state this explicitly, and we'll share them with your legal team before you sign.", human: false },
  { Icon: UserCheck, title: "A person approves anything that matters", body: "Consequential actions stop and wait. You decide which actions qualify, and you can change that list at any time without a development project.", human: true },
  { Icon: FileText, title: "A complete record of every action", body: "What was asked, what was decided, which model answered and who approved it — timestamped and exportable, in a form an auditor will accept.", human: false },
  { Icon: SlidersHorizontal, title: "No lock-in to one provider", body: "We build so the model underneath can be changed. When something better or cheaper arrives, you move to it — rather than rebuilding because your system only speaks one dialect.", human: false },
  { Icon: Clock, title: "Costs visible and capped", body: "You see what each process costs to run before it goes live, and limits are set so a mistake can't quietly become an invoice.", human: false },
];

const GOVERNANCE_MODELS = ["Claude", "GPT", "Gemini", "Azure OpenAI", "Amazon Bedrock", "Google Vertex AI", "Open-weight models, self-hosted"];

function GovernanceCard({ Icon, title, body, human }: (typeof GOVERNANCE_ITEMS)[number]) {
  const cardRef = useCardHover<HTMLDivElement>();
  return (
    <div ref={cardRef} className="rounded-2xl border border-[#EDE5E9] bg-white p-[24px]">
      <div
        className="mb-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
        style={{ backgroundColor: human ? HUMAN_SOFT : "#f5f5fc" }}
      >
        <Icon size={17} strokeWidth={2} style={{ color: human ? HUMAN : "#5b4be0" }} />
      </div>
      <h3 className="mb-[7px] text-[1.02rem] font-bold leading-[1.3] text-[#0D1B2A]">{title}</h3>
      <p className="text-[0.9rem] leading-[1.6] text-[#55677f]">{body}</p>
    </div>
  );
}

function GovernanceSection() {
  const gridRef = useStaggerReveal<HTMLDivElement>();
  const modelRowRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={SECTION}>
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          eyebrow="Control & governance"
          title="The questions your risk committee will ask."
          lede="We'd rather answer them here than discover them in week six. Every one of these is a commitment we'll put in the contract."
        />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GOVERNANCE_ITEMS.map((item) => (
            <GovernanceCard key={item.title} {...item} />
          ))}
        </div>
        <div ref={modelRowRef} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#EDE5E9] pt-7">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8D8E9E]">We work with</span>
          {GOVERNANCE_MODELS.map((m) => (
            <span key={m} className="text-[0.9rem] text-[#55677f]">{m}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── 6. why oxytal (dark) ───────────────────────────
const WHY_CARDS = [
  { n: "01", title: "We run it on ourselves first", body: "Forge isn't a case study, it's how our own delivery work gets done. ", em: "We live with the failure modes before you do", tail: " — and that's a very different kind of experience from having read about them." },
  { n: "02", title: "An engineering firm, not an AI shop", body: "The hard part of an agent isn't the model, it's the integration, the error handling and the day it behaves unexpectedly at 2am. ", em: "We were building production systems long before this technology arrived", tail: ", and that discipline is what gets things live." },
  { n: "03", title: "Governance from the first week", body: "Approval points, records and cost limits are designed in at the start, not added when someone in risk asks. ", em: "Retrofitting governance is how pilots die", tail: " — we've watched it happen to other people's projects." },
  { n: "04", title: "We'll tell you not to do it", body: "A good number of the ideas brought to us don't justify the spend, and some are better solved with a plain integration. ", em: "Saying so costs us the bigger project", tail: ", which is exactly why the advice is worth having." },
  { n: "05", title: "We stay after it goes live", body: "Accuracy drifts, costs move, providers change their models underneath you. ", em: "The people who built it watch all three and fix them", tail: ", rather than handing you something that quietly degrades." },
  { n: "06", title: "Dublin, London and Chandigarh, one team", body: "Senior accountability in your timezone, engineering depth and genuine overnight cover. ", em: "Not a handover at 6pm to people you've never spoken to", tail: " — one team, multiple locations, working to the same plan." },
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
        className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-[#5b4be0]"
      />
      <span ref={numberRef} className="mb-[14px] inline-block text-[11px] tracking-[0.1em] text-[#5b4be0]">{n}</span>
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
      <div className="pointer-events-none absolute -right-[25%] -top-[35%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(92,118,232,.32),transparent_66%)]" />
      <div className="container relative mx-auto px-5 md:px-10">
        <SectionHeading
          dark
          eyebrow="Why Oxytal"
          eyebrowVariant="brand2"
          title="Why us and not one of the many firms now offering AI?"
          lede="A fair question — almost every agency added an AI page in the last two years. Here's our honest answer."
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

// ─────────────────────────── 7. evidence ───────────────────────────
const STATS = [
  { value: "—", label: "AI systems live in production" },
  { value: "—", label: "Hours returned to teams monthly" },
  { value: "—", label: "Accuracy against human review" },
  { value: "—", label: "Time from first workshop to live" },
];

const WORK = [
  {
    brand: "Placeholder — replace with real client",
    title: "Years of documents, reorganised",
    body: "A large archive classified, corrected and restructured with AI assistance and text recognition — with every record traceable to its source and a person confirming the exceptions.",
    outputs: [
      { value: "—", label: "Records processed" },
      { value: "—", label: "Manual effort saved" },
    ],
  },
  {
    brand: "Placeholder — replace with real client",
    title: "Intake handled end to end",
    body: "Incoming requests read, classified, matched against existing records and actioned automatically — with anything unusual escalated to a named person rather than guessed at.",
    outputs: [
      { value: "—", label: "Handled without a person" },
      { value: "—", label: "Response time" },
    ],
  },
  {
    brand: "Oxytal — Forge",
    title: "Our own delivery, accelerated",
    body: "Forge runs requirement analysis, planning, test generation and security checking across Oxytal projects, with a person approving every release. It is the reason our delivery pace doesn't match our price.",
    outputs: [
      { value: "—", label: "Faster to first release" },
      { value: "—", label: "Projects running on it" },
    ],
  },
];

function StatTile({ value, label }: (typeof STATS)[number]) {
  return (
    <div className="bg-white p-[28px_24px]">
      <div className="text-[clamp(1.9rem,3.2vw,2.5rem)] font-bold tracking-[-0.03em] text-[#5b4be0] leading-none">
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
      <div aria-hidden className="h-[6px] bg-[linear-gradient(90deg,#5b4be0,#c4b4ff)]" />
      <div className="flex flex-1 flex-col p-[26px]">
        <span className="mb-[13px] text-[10.5px] uppercase tracking-[0.12em] text-[#8D8E9E]">{brand}</span>
        <h3 className="mb-[10px] text-[1.06rem] font-bold leading-[1.32] text-[#0D1B2A]">{title}</h3>
        <p className="flex-1 text-[0.89rem] leading-[1.6] text-[#55677f]">{body}</p>
        <div className="mt-[18px] flex gap-6 border-t border-[#EDE5E9] pt-[15px]">
          {outputs.map((o) => (
            <div key={o.label}>
              <div className="text-[1.25rem] font-bold tracking-[-0.02em] text-[#5b4be0]">{o.value}</div>
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
          title="Outcomes, not demonstrations."
          lede="The measure of an AI programme isn't how impressive it looks in a meeting. It's how much work it removed, how often it was right, and whether anyone still needs to check it twice."
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

// ─────────────────────────── 8. engagement ───────────────────────────
const ENGAGEMENT_MODES = [
  { k: "Start here", title: "AI opportunity assessment", body: "Two to three weeks. We look at where your people actually spend their time, size the return on the three or four strongest candidates, and come back with a costed plan and an order of work.", meta: ["2–3 weeks · fixed fee", "Credited against a build"], featured: false },
  { k: "Most common", title: "From proof to production", body: "We build the strongest candidate properly — connected to your systems, governed, measured against what it replaced. If the numbers don't hold up we say so and stop. If they do, the next one is faster.", meta: ["8–16 weeks typical", "Fixed-price stages"], featured: true },
  { k: "Ongoing", title: "Managed AI operations", body: "We run what's live — watching accuracy, cost and behaviour, handling provider changes, and improving the system as your process changes. Reported monthly against the numbers we agreed.", meta: ["Monthly retainer", "Cover agreed upfront"], featured: false },
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
        featured ? "border-[#0D1B2A] bg-[#0D1B2A]" : "border-[#EDE5E9] bg-white"
      )}
    >
      <span className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#5b4be0]">{k}</span>
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
        <SectionHeading eyebrow="How we engage" title="Three ways in. None of them start with buying a platform." />
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
    q: "Is our data used to train anyone's model?",
    a: "No. We work under enterprise agreements with the providers that state this explicitly, and we'll put the relevant terms in front of your legal team before you commit to anything. Your information stays inside your own environment, running on your own accounts. If your policy requires models hosted entirely on your infrastructure, that's possible too — it costs more and performs differently, and we'll be straight with you about the trade-off.",
  },
  {
    q: "What happens when it gets something wrong?",
    a: "It will, occasionally — anything that handles judgement will. The question is what happens next, and that's a design decision we make with you. Actions with real consequences stop and wait for a person. Lower-stakes work runs automatically but is checked against samples, so quality is measured rather than assumed. Everything is recorded, so when something is wrong you can see exactly what happened and why. A system that can't be wrong safely isn't ready to be live.",
  },
  {
    q: "How is this different from buying an AI product off the shelf?",
    a: "Often it isn't, and when a product already does the job we'll tell you to buy it. Building makes sense when the work is specific to how your business runs, when it has to reach inside systems a product can't, or when the process is a genuine competitive advantage you don't want to standardise. If your need is generic, a subscription is cheaper than anything we could build.",
  },
  {
    q: "Which model do you use?",
    a: "Whichever suits the task, and we build so it can be changed later. Different models are better at different things and the ranking shifts every few months, so committing your business to one provider is a risk rather than a decision. Some organisations have a preferred provider for commercial or regulatory reasons — that's fine, we'll work within it and tell you where it costs you something.",
  },
  {
    q: "How do we know it's actually saving money?",
    a: "Because we measure the before, and we agree how we'll measure it before starting. Time spent on the process today, error rates today, cost per item today. Then the same numbers afterwards, including what the AI itself costs to run — which many suppliers leave out. If a process isn't measurable enough to prove a return, that's usually a sign it's the wrong place to start.",
  },
  {
    q: "Who actually does the work?",
    a: "A named team across Dublin and Chandigarh — the same people from the first workshop through to ongoing support. No account-management layer between you and the people doing the work. You'll meet them before anything is agreed.",
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
                <span aria-hidden className="text-[1.35rem] font-normal text-[#5b4be0] transition-transform duration-200 group-open:rotate-45">
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
  { k: "05", title: "Enterprise Integration", body: "The connections agents need to do anything useful.", href: "/service/enterprise-system-integrations" },
  { k: "03", title: "Software Engineering", body: "The systems the intelligence lives inside.", href: "/service/software-development" },
  { k: "04", title: "Cloud & Transformation", body: "The foundations this all runs on.", href: "/service/cloud-digital-transformation" },
  { k: "01", title: "Digital Strategy", body: "Deciding what's worth doing before doing it.", href: "/service/digital-strategy" },
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
        <SectionHeading eyebrow="Related services" title="AI rarely travels alone." />
        <div ref={relRef} className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <RelatedCard key={r.href} {...r} />
          ))}
        </div>

        <div
          ref={finalRef}
          className="relative mt-12 grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#2A1B2C,#0D1B2A)] p-9 sm:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:p-16"
        >
          <div className="pointer-events-none absolute -right-[14%] -bottom-[52%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(92,118,232,.32),transparent_66%)]" />
          <div className="relative">
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Start with the work, not the technology.
            </h2>
            <p className="max-w-[48ch] text-[#B4ABB6]">
              Sixty minutes with the people who build these systems. Bring the process that eats your team&rsquo;s
              week, the pilot that never landed, or the question your board keeps asking. We&rsquo;ll tell you what
              we&rsquo;d do, what it&rsquo;s worth, and whether it&rsquo;s worth doing at all.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            <Link href="/contact-us" className={cx(BTN_PRIMARY, "justify-center")}>
              Talk to Oxytal AI Lab <span aria-hidden>&rarr;</span>
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
export default function AgenticEngineeringPage({ entry }: Props) {
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
      <ForgeDemoSection />
      <GovernanceSection />
      <WhySection />
      <EvidenceSection />
      <EngagementSection />
      <FaqSection />
      <RelatedAndCtaSection />
    </main>
  );
}
