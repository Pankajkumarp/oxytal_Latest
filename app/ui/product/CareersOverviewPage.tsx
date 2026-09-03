"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { cx } from "@/app/lib/cx";
import { useSplitReveal, useFadeUp, useCardHover } from "./useReveal";
import type { HeadingLevel } from "@/app/lib/headingLevel";
import DynamicHeading from "@/app/ui/DynamicHeading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `CareersOverviewPage` — a standalone, static one-pager ported from
 * `Refrence/oxytal-careers_2.html`. Same treatment as this folder's other
 * static pages (`ProductsOverviewPage`, the `*CaseStudy` components): no
 * Contentful wiring, keeps the reference's own colour identity (`--ink`
 * `#0B1B2B`, `--body` `#546A7E`, `--muted` `#8598AA`, `--accent` `#0E9BC4`,
 * `--accent-2` `#16B9E8`, `--accent-soft` `#E5F5FB`, the `--deep-1`/
 * `--deep-2` `#061223`/`#0C2138` navy gradient, `--ok` `#12A67C`, `--warm`
 * `#D9820A`) rather than the site's per-page `themeColor` accent, and
 * typography stays the site's own inherited `Poppins` — the reference's
 * `--fm` (IBM Plex Mono) accents on eyebrows/numbers/tags/labels are
 * rendered in plain Poppins here instead (size/weight/tracking/uppercase
 * carries the "label" look; no second typeface is introduced — see
 * `ProductsOverviewPage`'s own `Eyebrow`, which already does this).
 *
 * Sections, in order: a dark hero, "what the job actually is" (a 4-up
 * honest-grid), "who this suits" (a good-fit/not-a-fit split), "where
 * you'd work" (3 offices, each with an inline flag), "what you'd work on"
 * (client work vs. our own products), "how we hire" (a 4-phase list plus
 * a highlighted note), a dark "everything happens in the portal" handoff
 * with a feature checklist, and a plain equal-opportunity statement.
 *
 * Not registered under any composableElement subtype yet — add it to
 * `ComposableElementRenderer`'s `subtypeComponents` map (e.g. as
 * `careersOverview`) once a page should render it.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useCardHover` (from `./useReveal`)
 * with its siblings, same reveal-role split as `ProductsOverviewPage`:
 * every section's intro block (eyebrow + heading + lede) fades up as one
 * unit via `useFadeUp`, while the heading itself also gets its own
 * word-by-word `useSplitReveal` on top of that (via `SectionHead`) — the
 * "heading animation" this page was built to have. Every grid below an
 * intro fades up as a whole block too, matching the reference's own
 * `.reveal` class, which it applies per-container rather than staggering
 * per card. On top of that, every individual card — the honest-grid
 * cells, the two fit cards, the office cards and the work cards — gets
 * its own `useCardHover` lift + shadow on pointer hover (skipped under
 * `prefers-reduced-motion`), the same springy GSAP hover
 * `DigitalCommerce`'s card grids use, since the reference's own CSS
 * `:hover` here is nothing more than a flat, un-animated background
 * swap.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-careers_2.html
========================================================= */

const HONEST: { n: string; title: string; body: ReactNode }[] = [
  {
    n: "01",
    title: "You stay with what you ship",
    body: (
      <>
        A training platform we built in 2022 is still ours. A school website from 2019 is still ours.{" "}
        <span className="font-medium text-[#0B1B2B]">You&apos;ll see the second and third year of your own decisions</span>{" "}
        — which is a rare and genuinely useful thing for an engineer or designer to experience.
      </>
    ),
  },
  {
    n: "02",
    title: "We build our own products",
    body: (
      <>
        Four of them, in production. If you&apos;d rather spend some of your time on software where we&apos;re the
        customer and the roadmap is ours to argue about,{" "}
        <span className="font-medium text-[#0B1B2B]">that work exists here and isn&apos;t reserved for a special team.</span>
      </>
    ),
  },
  {
    n: "03",
    title: "Agents are part of the workflow",
    body: (
      <>
        We run our own AI delivery pipeline on real client work.{" "}
        <span className="font-medium text-[#0B1B2B]">You&apos;d be working with agents daily and reviewing what they produce</span>{" "}
        — not attending a workshop about it while building the same way you always have.
      </>
    ),
  },
  {
    n: "04",
    title: "Small enough that you're visible",
    body: (
      <>
        You&apos;ll speak to clients, and your work will be recognisably yours rather than absorbed into a delivery
        machine.{" "}
        <span className="font-medium text-[#0B1B2B]">The flip side is there&apos;s nowhere to hide on a bad week.</span>{" "}
        Some people find that motivating and some don&apos;t.
      </>
    ),
  },
];

const FIT_GOOD = [
  "Want to see what happens to your work after launch",
  "Like talking directly to the people who'll use what you build",
  "Are curious about agent-assisted delivery and want to actually do it",
  "Prefer a small team where your judgement is asked for",
  "Care about the unglamorous parts — accessibility, audit trails, documentation",
  "Are comfortable saying “I think we're solving the wrong problem”",
];

const FIT_BAD = [
  "Want to specialise narrowly and never touch anything else",
  "Prefer a defined ticket queue with no client contact",
  "Are looking for a large-organisation structure and formal career ladder",
  "Would rather hand over at launch and start something new",
  "Want to work only on greenfield projects",
  "Find ambiguity draining rather than interesting",
];

function UKFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 60 42" aria-hidden="true" className="shrink-0 rounded-[2px]">
      <rect width="60" height="42" fill="#012169" />
      <path d="M0 0l60 42M60 0L0 42" stroke="#fff" strokeWidth={8} />
      <path d="M0 0l60 42M60 0L0 42" stroke="#C8102E" strokeWidth={4} />
      <path d="M30 0v42M0 21h60" stroke="#fff" strokeWidth={14} />
      <path d="M30 0v42M0 21h60" stroke="#C8102E" strokeWidth={8} />
    </svg>
  );
}

function IrelandFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 60 42" aria-hidden="true" className="shrink-0 rounded-[2px]">
      <rect width="20" height="42" fill="#169B62" />
      <rect x="20" width="20" height="42" fill="#fff" />
      <rect x="40" width="20" height="42" fill="#FF883E" />
    </svg>
  );
}

function IndiaFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 60 42" aria-hidden="true" className="shrink-0 rounded-[2px]">
      <rect width="60" height="14" fill="#FF9933" />
      <rect y="14" width="60" height="14" fill="#fff" />
      <rect y="28" width="60" height="14" fill="#138808" />
      <circle cx="30" cy="21" r="5" fill="none" stroke="#000080" strokeWidth={1.2} />
    </svg>
  );
}

const OFFICES: { Flag: typeof UKFlag; country: string; city: string; role: string; body: string }[] = [
  {
    Flag: UKFlag,
    country: "United Kingdom",
    city: "London",
    role: "Client & growth",
    body: "Commercial and client leadership. Where relationships are held and new work is shaped — client-facing roles, consulting and account leadership.",
  },
  {
    Flag: IrelandFlag,
    country: "Ireland",
    city: "Dublin",
    role: "Headquarters",
    body: "Strategy, delivery leadership and senior accountability. Where the answer to “who owns this” lives — programme leadership, architecture and operations.",
  },
  {
    Flag: IndiaFlag,
    country: "India",
    city: "Chandigarh",
    role: "Engineering & AI R&D",
    body: "Where most of the software gets designed and built, and where our AI research happens. Our own products are engineered here — this is a centre of gravity, not a cost centre.",
  },
];

const WORK: { label: string; title: string; body: string; tags: string[] }[] = [
  {
    label: "Client work",
    title: "Real systems, named clients, long horizons",
    body: "Global drinks brands, an Irish print business, a Canadian property group, a primary school in Cork, an Indian horticulture supplier. The range is deliberate — you'll work on something enormous and something small in the same year, and the small ones often teach you more.",
    tags: ["Brand platforms", "Commerce", "Data migration", "Integration", "Compliance systems", "Long-term support"],
  },
  {
    label: "Our own products",
    title: "Four platforms where we're the customer",
    body: "SamVault, ForgePipeline, ActionPulse and Kollabry are all in production and all built because we needed them. Product work has a different rhythm from client work — longer arcs, your own roadmap, and nobody to blame for the decisions but us.",
    tags: ["Encrypted storage", "AI delivery pipeline", "Enterprise workflow", "Collaboration tools", "Mobile apps", "Platform engineering"],
  },
];

const PHASES: { n: string; title: string; body: string }[] = [
  { n: "01", title: "Apply through the portal", body: "Create an account, submit once, and track it yourself from there. You'll be able to see the stage your application is at without having to email anyone to ask." },
  { n: "02", title: "A conversation, not a screen", body: "Thirty to forty-five minutes with someone who does the work you'd be doing. It runs both ways — bring the questions you actually want answered." },
  { n: "03", title: "Something practical, time-boxed", body: "A realistic problem close to real work, discussed together rather than marked in silence. We respect your time: if it can't be done in a couple of hours, we've designed it badly." },
  { n: "04", title: "Decision, with reasons", body: "An answer either way, with the reasoning. A rejection without a reason teaches you nothing, and we'd rather you left the process with something useful." },
];

const PORTAL_FEATURES = [
  "Browse every open role across all three offices",
  "Apply once — your details carry across future applications",
  "Track your progress without chasing anyone for an update",
  "Arrange interviews and store documents securely",
  "Message your recruiter directly",
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, dark, center }: { children: ReactNode; dark?: boolean; center?: boolean }) {
  const color = dark ? "#16B9E8" : "#0E9BC4";
  return (
    <span
      className={cx("mb-3.5 flex items-center gap-2.5 text-[12px] font-bold tracking-[0.16em] uppercase", center && "justify-center")}
      style={{ color }}
    >
      <span aria-hidden className="h-0.5 w-[22px] rounded-sm" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  lede,
  dark,
  narrow = true,
  headingLevel = "h2",
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  dark?: boolean;
  narrow?: boolean;
  /** Which heading tag to render — `h1`–`h6` (see app/lib/headingLevel.ts). */
  headingLevel?: HeadingLevel;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={narrow ? "max-w-[640px]" : undefined}>
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-[22ch] text-[clamp(27px,3vw,38px)] leading-[1.1] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#0B1B2B]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16.5px] leading-[1.75]", dark ? "text-[#A9BACE]" : "text-[#546A7E]")}>{lede}</p>
      )}
    </div>
  );
}

const BTN_BASE =
  "inline-flex items-center gap-2 rounded-[10px] px-[26px] py-[14px] text-[0.96rem] font-semibold transition duration-150";
const BTN_PRIMARY = cx(BTN_BASE, "border border-transparent bg-[#0E9BC4] text-white hover:-translate-y-px hover:bg-[#0B87AC]");
const BTN_GHOST = cx(BTN_BASE, "border border-white/[0.26] bg-white/[0.06] text-white hover:-translate-y-px hover:border-[#16B9E8] hover:bg-[rgba(22,185,232,0.12)]");

/* =========================================================
   HERO
========================================================= */

function Hero() {
  const copyRef = useFadeUp<HTMLDivElement>();
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  const locRef = useFadeUp<HTMLDivElement>();

  return (
    <header className="relative overflow-hidden bg-[linear-gradient(160deg,#061223,#0C2138)] px-5 py-16 text-[#EAF2F8] sm:px-8 sm:py-20 lg:py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[44%] -right-[18%] h-[860px] w-[860px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,185,232,.22), transparent 64%)" }}
      />
      <div ref={copyRef} className="container relative mx-auto px-5 md:px-10">
        <span className="mb-5 block text-[11px] font-bold tracking-[0.2em] text-[#16B9E8] uppercase">Careers</span>
        <h1
          ref={titleRef}
          className="mb-[22px] max-w-[18ch] text-[clamp(32px,4.7vw,56px)] leading-[1.03] font-extrabold tracking-[-0.036em] text-white"
        >
          Most agency work ends at launch. Ours doesn&apos;t.
        </h1>
        <p className="mb-8 max-w-[58ch] text-[clamp(16px,1.35vw,18.5px)] leading-[1.72] text-[#A9BACE]">
          We&apos;re still running platforms we built in 2019. Which means the decisions you make here have
          consequences you&apos;ll personally live with — and that is the best argument we know for making them
          carefully. If that sounds like a weight, this probably isn&apos;t the place. If it sounds like how the
          work should be, keep reading.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="https://career.oxyem.io/#jobs" target="_blank" rel="noopener" className={BTN_PRIMARY}>
            See open roles
            <ArrowUpRight size={15} aria-hidden />
          </a>
          <a href="#how-we-hire" className={BTN_GHOST}>
            How we hire
          </a>
        </div>
        <div ref={locRef} className="mt-9 flex flex-wrap gap-2.5 sm:mt-11">
          {["London · Client & growth", "Dublin · Headquarters", "Chandigarh · Engineering & AI R&D"].map((loc) => (
            <span
              key={loc}
              className="rounded-full border border-white/[0.18] px-[15px] py-2 text-[11px] font-medium tracking-[0.05em] text-[#C3D3DF] uppercase"
            >
              {loc}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   WHAT THE JOB ACTUALLY IS
========================================================= */

function HonestCard({ n, title, body }: (typeof HONEST)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-7">
      <span className="mb-3.5 block text-[10.5px] font-bold tracking-[0.1em] text-[#0E9BC4]">{n}</span>
      <h3 className="mb-2.5 text-[17px] leading-[1.32] font-bold text-[#0B1B2B]">{title}</h3>
      <p className="text-[14px] leading-[1.68] text-[#546A7E]">{body}</p>
    </div>
  );
}

function HonestSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="container relative mx-auto px-5 md:px-10">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What the job actually is"
            title="Four things that are true here and aren't everywhere."
            lede="Careers pages tend to describe a company nobody recognises on their first Monday. These are the things people actually notice."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3ECF2] bg-[#E3ECF2] sm:grid-cols-2 lg:grid-cols-4"
        >
          {HONEST.map((item) => (
            <HonestCard key={item.n} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHO THIS SUITS
========================================================= */

function FitSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useFadeUp<HTMLDivElement>();
  const goodCardRef = useCardHover<HTMLDivElement>();
  const badCardRef = useCardHover<HTMLDivElement>();

  return (
    <section className="bg-[linear-gradient(170deg,#F1F7FB,#FBFDFE_62%)] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="container relative mx-auto px-5 md:px-10">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Honestly"
            title="Who this suits, and who it doesn't."
            lede="We'd rather you worked this out now than three months in. Nobody wins from a mismatch discovered late."
          />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6.5">
          <div ref={goodCardRef} className="rounded-2xl border border-[#E3ECF2] bg-white p-7">
            <h3 className="mb-[18px] text-[10.5px] font-bold tracking-[0.12em] text-[#12A67C] uppercase">A good fit if you</h3>
            <ul className="list-none">
              {FIT_GOOD.map((line, i) => (
                <li
                  key={line}
                  className={cx(
                    "flex items-start gap-3 py-2.5 text-[14.5px] leading-[1.6] text-[#546A7E]",
                    i > 0 && "border-t border-[#F1F6F9]"
                  )}
                >
                  <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-[#12A67C]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div ref={badCardRef} className="rounded-2xl border border-[#E3ECF2] bg-white p-7">
            <h3 className="mb-[18px] text-[10.5px] font-bold tracking-[0.12em] text-[#D9820A] uppercase">Probably not if you</h3>
            <ul className="list-none">
              {FIT_BAD.map((line, i) => (
                <li
                  key={line}
                  className={cx(
                    "flex items-start gap-3 py-2.5 text-[14.5px] leading-[1.6] text-[#546A7E]",
                    i > 0 && "border-t border-[#F1F6F9]"
                  )}
                >
                  <Minus size={16} aria-hidden className="mt-0.5 shrink-0 text-[#D9820A]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHERE YOU'D WORK
========================================================= */

function OfficeCard({ Flag, country, city, role, body }: (typeof OFFICES)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4, shadow: "0 20px 40px -20px rgba(0,0,0,.45)" });
  return (
    <div ref={cardRef} className="bg-[#061223] p-8">
      <div className="mb-4 flex items-center gap-2.5">
        <Flag />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-[#16B9E8] uppercase">{country}</span>
      </div>
      <h3 className="mb-1.5 text-[19px] font-bold text-white">{city}</h3>
      <p className="mb-3.5 text-[13.5px] font-medium text-[#16B9E8]">{role}</p>
      <p className="text-[14px] leading-[1.68] text-[#A9BACE]">{body}</p>
    </div>
  );
}

function OfficesSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="container relative mx-auto px-5 md:px-10">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Where you'd work"
            title="Three offices, and none of them is a back office."
            lede="Worth saying plainly, because in this industry it usually isn't true."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#22334A] bg-[#22334A] sm:grid-cols-2 lg:grid-cols-3"
        >
          {OFFICES.map((office) => (
            <OfficeCard key={office.city} {...office} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT YOU'D WORK ON
========================================================= */

function WorkCard({ label, title, body, tags }: (typeof WORK)[number]) {
  const cardRef = useCardHover<HTMLDivElement>({ y: -4 });
  return (
    <div ref={cardRef} className="bg-white p-8">
      <span className="mb-3.5 block text-[10.5px] font-bold tracking-[0.1em] text-[#0E9BC4] uppercase">{label}</span>
      <h3 className="mb-3 text-[18px] leading-[1.3] font-bold text-[#0B1B2B]">{title}</h3>
      <p className="text-[14.5px] leading-[1.7] text-[#546A7E]">{body}</p>
      <ul className="mt-4 flex flex-wrap gap-1.75 list-none">
        {tags.map((tag) => (
          <li key={tag} className="rounded-full border border-[#E3ECF2] bg-[#F1F6F9] px-3 py-1.25 text-[12.5px] text-[#546A7E]">
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[linear-gradient(170deg,#F1F7FB,#FBFDFE_62%)] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="container relative mx-auto px-5 md:px-10">
        <div ref={introRef}>
          <SectionHead eyebrow="What you'd work on" title="Two kinds of work, and most people do both." />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3ECF2] bg-[#E3ECF2] md:grid-cols-2">
          {WORK.map((w) => (
            <WorkCard key={w.label} {...w} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW WE HIRE
========================================================= */

function HowWeHireSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useFadeUp<HTMLDivElement>();
  const noteRef = useFadeUp<HTMLDivElement>();

  return (
    <section id="how-we-hire" className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we hire"
            title="Four steps, and we'll tell you where you stand at each one."
            lede="No unexplained silences, no take-home that eats your weekend, no puzzle questions about manhole covers."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E3ECF2] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[88px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E3ECF2]"
              )}
            >
              <span className="pt-0.5 text-[11px] font-bold tracking-[0.1em] text-[#0E9BC4]">{phase.n}</span>
              <div>
                <h3 className="mb-1.75 text-[16.5px] font-bold text-[#0B1B2B]">{phase.title}</h3>
                <p className="text-[14.5px] leading-[1.65] text-[#546A7E]">{phase.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div ref={noteRef} className="mt-6.5 rounded-r-[14px] border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] py-5.5 pr-6.5 pl-7">
          <p className="text-[15.5px] leading-[1.65] text-[#0B1B2B]">
            <strong className="font-semibold">If we&apos;re not hiring for your discipline right now,</strong> register
            anyway. Roles open at short notice and we look at the portal before we look anywhere else — a registered
            candidate is considered before a job advert is written.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PORTAL HANDOFF
========================================================= */

function PortalSection() {
  const copyRef = useFadeUp<HTMLDivElement>();
  const cardRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#061223,#0C2138)] px-5 py-14 text-[#EAF2F8] sm:px-8 sm:py-16 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[16%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,185,232,.20), transparent 64%)" }}
      />
      <div className="container relative mx-auto px-5 md:px-10 grid grid-cols-1 items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div ref={copyRef}>
          <SectionHead eyebrow="Applications" title="Everything happens in the candidate portal." dark narrow={false} />
          <p className="mt-4 mb-2 text-[16px] leading-[1.72] text-[#A9BACE]">
            Open roles, applications, interview scheduling and your documents all live in one place, and you can
            sign in whenever you want to see where things stand. We built the portal ourselves, which means when
            it&apos;s frustrating we have nobody to blame.
          </p>
          <p className="mb-7 text-[16px] leading-[1.72] text-[#A9BACE]">
            Registering takes a minute and doesn&apos;t commit you to anything.
          </p>
          <a href="https://career.oxyem.io/" target="_blank" rel="noopener" className={BTN_PRIMARY}>
            Open the candidate portal
            <ArrowUpRight size={15} aria-hidden />
          </a>
        </div>

        <div ref={cardRef} className="rounded-2xl border border-white/[0.12] bg-white/[0.05] p-7 sm:p-8.5">
          <span className="mb-4.5 block text-[11px] font-bold tracking-[0.1em] text-[#16B9E8]">career.oxyem.io</span>
          <ul className="mb-6 list-none">
            {PORTAL_FEATURES.map((feature, i) => (
              <li
                key={feature}
                className={cx(
                  "flex items-start gap-2.75 py-2.25 text-[14.5px] leading-[1.6] text-[#C3D3DF]",
                  i > 0 && "border-t border-white/[0.08]"
                )}
              >
                <Check size={15} aria-hidden className="mt-1 shrink-0 text-[#16B9E8]" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="text-[13.5px] leading-[1.6] text-[#8598AA]">
            Questions before you apply? Email{" "}
            <a href="mailto:careers@oxytal.com" className="text-[#C3D3DF]">
              careers@oxytal.com
            </a>{" "}
            — a person reads it.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   EQUAL OPPORTUNITY
========================================================= */

function EeoSection() {
  const ref = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5  sm:px-8 py-18">
      <div ref={ref} className="mx-auto max-w-5xl">
        <Eyebrow>Equal opportunity</Eyebrow>
        <p className="mb-3 text-[14.5px] leading-[1.72] text-[#546A7E]">
          <strong className="font-semibold text-[#0B1B2B]">Oxytal is an equal opportunity employer.</strong> We
          consider every applicant on merit and don&apos;t discriminate on the basis of age, disability, gender,
          gender identity or expression, marital or civil partnership status, pregnancy or maternity, race, religion
          or belief, sex, or sexual orientation.
        </p>
        <p className="mb-3 text-[14.5px] leading-[1.72] text-[#546A7E]">
          If you need an adjustment at any point in the process — to an interview format, a timing, or how we share
          materials with you — tell us and we&apos;ll arrange it. Asking will never count against an application.
        </p>
        <p className="text-[14.5px] leading-[1.72] text-[#546A7E]">
          Applications are handled in line with our{" "}
          <Link href="/privacy-policy" className="text-[#0E9BC4]">
            Privacy Policy
          </Link>
          . Candidate data is stored in our own portal and is not sold or shared with third parties.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CareersOverviewPage() {
  return (
    <div className="relative overflow-hidden bg-[#FBFDFE]">
      <div data-nav-contrast="dark">
        <Hero />
      </div>
      <HonestSection />
      <FitSection />
      <OfficesSection />
      <WorkSection />
      <HowWeHireSection />
      <div data-nav-contrast="dark">
        <PortalSection />
      </div>
      <EeoSection />
    </div>
  );
}
