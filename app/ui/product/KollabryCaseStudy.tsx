"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `KollabryCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/kollabry-case-study.html`. Same treatment as its
 * siblings (`SamVaultCaseStudy`/`ActionPulseCaseStudy`/
 * `ForgePipelineCaseStudy`): no Contentful wiring, keeps the reference's
 * own colour identity (`--ink` `#141127`, `--indigo` `#4F46E5`, `--violet`
 * `#7C3AED`) rather than the site's per-page `themeColor` accent, and
 * typography stays the site's own inherited `Poppins` instead of the
 * reference's Google Fonts (`Space Grotesk`/`Inter`). The reference's own
 * `<style>` defines `.topbar`/`footer` rules but neither actually
 * appears in its markup — same as `ForgePipelineCaseStudy`, there's no
 * real nav/footer here to drop; the app's global `Navbar` (and site
 * footer) wrap this page as they do every other page.
 *
 * The reference marks the four screenshot slots (board, Synergy doc,
 * whiteboard, gallery grid) as explicit placeholders — "swap the `.shot`
 * block for `<img>` when you have real captures" — so they're kept as
 * placeholder cards here too, not invented photography.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings. Every section `<h2>` gets the
 * word-split reveal (the hero's own `<h1>` plays on mount instead of on
 * scroll, its gradient second line animated as its own unit so
 * `background-clip: text` isn't broken by `SplitText`'s word-wrapping —
 * same technique as `ForgePipelineCaseStudy`'s hero); single-block
 * content (the hero's "stage" visual, each two-surfaces panel, each deep
 * dive's text/media pair, the tech section's stack/highlights columns,
 * the CTA card) fades up individually via `useFadeUp`, mirroring how the
 * reference tags each of those elements with its own `.reveal`; card
 * grids where the reference tags every card individually (challenge,
 * features, approach steps, the loop, impact, gallery) stagger in via
 * `useListStagger`. This is the calmest of the four case studies — no
 * count-up stats, no client-side interactivity, no continuous decorative
 * motion — so it needed no new `globals.css` keyframes at all.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/kollabry-case-study.html
========================================================= */

const HERO_META: { k: string; v: string }[] = [
  { k: "Owner", v: "Oxytal (in-house)" },
  { k: "Type", v: "SaaS web app" },
  { k: "Role", v: "Design & full-stack build" },
  { k: "Platform", v: "Responsive web" },
  { k: "Live", v: "kollabry.com" },
];

const PROBLEM_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Fragmented toolchain",
    text: "A tracker, a wiki, and a whiteboard tool that never talk to each other — three logins, three sources of truth.",
  },
  {
    n: "02",
    title: "Lost context",
    text: "The “why” behind an issue lives somewhere else. By the time work starts, the decision is hard to find.",
  },
  {
    n: "03",
    title: "No shared memory",
    text: "Retros, specs, and approvals evaporate between cycles, so teams relearn the same lessons.",
  },
];

const KOLLABRY_ITEMS = [
  "Boards with custom statuses, WIP limits & blocked tracking",
  "Backlog & sprints with capacity, velocity and burndown",
  "Roadmap and initiative roll-ups",
  "Retrospectives with actions tracked to done",
];

const SYNERGY_ITEMS = [
  "Rich documents: tables, callouts, charts, diagrams, @mentions",
  "Infinite-canvas whiteboards with live cursors",
  "Reviews & approvals with a full audit trail",
  "Version history with side-by-side compare",
];

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: "▦", title: "Boards that fit your flow", desc: "Live boards with statuses you create and reorder, WIP limits, and blocked-issue signals." },
  { icon: "◷", title: "Backlog & sprints", desc: "Plan deliberately, then run one or many sprints with capacity, velocity, and burndown." },
  { icon: "↺", title: "Retrospectives", desc: "Sticky notes, dot-voting, a timer, and action items tracked through to done." },
  { icon: "◲", title: "Knowledge base", desc: "Synergy documents with headings, tables, callouts, charts, diagrams, and @-mentions." },
  { icon: "✎", title: "Whiteboards", desc: "Brainstorm on an infinite canvas with shapes, sticky notes, and real-time cursors." },
  { icon: "⟲", title: "Version history & compare", desc: "Every edit is checkpointed. Compare any two versions side-by-side or unified." },
  { icon: "✓", title: "Reviews & approvals", desc: "Move a document from draft to review to approved, with an audit trail." },
  { icon: "◉", title: "Real-time collaboration", desc: "Live presence, in-context comments, and @mentions that reach people by email and in-app." },
  { icon: "⚿", title: "Passwordless & SSO", desc: "One-time email codes or Microsoft sign-in — no passwords to manage." },
];

const DIVES: { tag: string; title: string; desc: string; bullets: string[]; flip?: boolean; caption: string; sub: string }[] = [
  {
    tag: "Boards & sprints",
    title: "Plan the work, then run it",
    desc: "A live board that mirrors how your team really works, backed by deliberate sprint planning.",
    bullets: [
      "Drag-and-drop board with custom, reorderable statuses",
      "Sub-tasks, dependencies, and blocked-issue badges",
      "Capacity, velocity, and burndown per sprint",
      "Group and roll up work by initiative",
    ],
    caption: "Board & sprints",
    sub: "Drop a real screenshot here",
  },
  {
    tag: "Synergy knowledge base",
    title: "Documents that hold the decisions",
    desc: "A rich editor where specs, plans, and notes live next to the work they describe.",
    bullets: [
      "Headings, tables, callouts, code, charts & diagrams",
      "Reusable templates for specs, plans, and meeting notes",
      "@-mentions and two-way links to issues",
      "Full-text search across the workspace",
    ],
    flip: true,
    caption: "Synergy document",
    sub: "Drop a real screenshot here",
  },
  {
    tag: "Whiteboards & approvals",
    title: "From brainstorm to sign-off",
    desc: "Ideate on an open canvas, then move the output through review to an approved, versioned record.",
    bullets: [
      "Infinite canvas with shapes, sticky notes & live cursors",
      "Draft → in review → approved, with reviewers and history",
      "Version checkpoints with side-by-side compare",
      "Notifications for mentions, reviews, and due dates",
    ],
    caption: "Whiteboard",
    sub: "Drop a real screenshot here",
  },
];

const APPROACH_STEPS: { num: string; title: string; desc: string }[] = [
  { num: "01", title: "Discovery & definition", desc: "Framed the problem, mapped the delivery-to-knowledge loop, and defined the product's scope." },
  { num: "02", title: "UX & interface design", desc: "Designed a fast, focused UI where tracking and knowledge feel like one product, not two." },
  { num: "03", title: "Technical solution design", desc: "Architected for real-time collaboration, scale, and security from the outset." },
  { num: "04", title: "Build, harden & launch", desc: "Engineered end-to-end, tuned performance, and shipped across modern devices and browsers." },
];

const TECH_STACK: { k: string; v: string }[] = [
  { k: "Front end", v: "Next.js 14 (App Router) · React" },
  { k: "Back end", v: "Node.js · service-layer API" },
  { k: "Data", v: "MySQL · Redis (cache + queues)" },
  { k: "Real-time", v: "Ably (presence, cursors, live updates)" },
  { k: "Editor & canvas", v: "TipTap docs · Excalidraw-based board" },
  { k: "Cloud", v: "AWS (SES, S3) · Vercel" },
];

const TECH_HIGHLIGHTS: { icon: string; title: string; desc: string }[] = [
  { icon: "◉", title: "Live collaboration", desc: "Presence, cursors, and instant updates across boards, docs, and whiteboards." },
  { icon: "⚡", title: "Performance", desc: "Parallelized queries, Redis read-through caching, and targeted indexing for snappy loads." },
  { icon: "⚿", title: "Security", desc: "Passwordless & SSO auth, role-based access, upload safety controls, and an audit trail." },
];

const LOOP_ITEMS: { n: string; title: string; desc: string }[] = [
  { n: "01", title: "Capture", desc: "Write the spec or brainstorm it on a board in Synergy." },
  { n: "02", title: "Plan", desc: "Shape the backlog and link issues to the docs behind them." },
  { n: "03", title: "Build", desc: "Run focused sprints and track work across the board." },
  { n: "04", title: "Review", desc: "Approve the docs; collect the decisions that shipped." },
  { n: "05", title: "Reflect", desc: "Run a retro and feed the next cycle." },
];

const IMPACT_ITEMS: { big: string; text: string }[] = [
  { big: "3-in-1", text: "Tracker, knowledge base, and whiteboard unified into a single workspace." },
  { big: "2-way", text: "Documents and issues stay linked, so context travels with every task." },
  { big: "100%", text: "Passwordless — one-time email codes or Microsoft SSO, no passwords to manage." },
];

const GALLERY_ITEMS: { caption: string; sub: string }[] = [
  { caption: "Board view", sub: "kollabry/board.webp" },
  { caption: "Sprint planning", sub: "kollabry/sprint.webp" },
  { caption: "Synergy document", sub: "kollabry/doc.webp" },
  { caption: "Whiteboard", sub: "kollabry/whiteboard.webp" },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function SectionHead({ eyebrow, title, sub, dark }: { eyebrow: string; title: ReactNode; sub?: string; dark?: boolean }) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className="max-w-[620px]">
      <span className={cx("text-[13px] font-semibold tracking-[0.16em] uppercase", dark ? "text-[#A5B4FC]" : "text-[#4F46E5]")}>
        {eyebrow}
      </span>
      <h2
        ref={titleRef}
        className={cx("mt-3 text-[clamp(28px,4vw,40px)] leading-[1.08] font-bold tracking-[-0.02em]", dark ? "text-white" : "text-[#141127]")}
      >
        {title}
      </h2>
      {sub && <p className={cx("mt-3.5 text-[17px]", dark ? "text-[#c8c5e0]" : "text-[#5c5975]")}>{sub}</p>}
    </div>
  );
}

/** The reference's `.shot` placeholder — explicitly marked "REPLACE:" with a real screenshot; kept as a placeholder card rather than invented photography. */
function ShotPlaceholder({ caption, sub }: { caption: string; sub: string }) {
  return (
    <div className="relative flex aspect-16/10 items-center justify-center overflow-hidden rounded-2xl border border-[#d8d5ec] bg-[linear-gradient(135deg,#EEF0FF,#F5F2FF)] shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
      <span className="absolute top-3 left-3 rounded-[6px] border border-[#E7E5F3] bg-white px-2 py-[3px] text-[10.5px] font-bold tracking-[0.05em] text-[#4F46E5] uppercase">
        Screenshot
      </span>
      <div className="px-5 text-center">
        <svg className="mx-auto mb-3" width="46" height="42" viewBox="0 0 66 60" aria-hidden>
          <rect x="8" y="8" width="34" height="34" rx="11" fill="#4F46E5" />
          <rect x="26" y="16" width="34" height="34" rx="11" fill="#7C73F0" fillOpacity="0.85" />
        </svg>
        <div className="font-semibold text-[#2b2740]">{caption}</div>
        <div className="mt-1 text-[12px] text-[#8f8ca8]">{sub}</div>
      </div>
    </div>
  );
}

function CheckSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!line1Ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set([line1Ref.current, line2Ref.current], { opacity: 1, y: 0 });
      return;
    }

    let split: SplitText | undefined;

    // Only the plain first line goes through SplitText — its
    // `mask: "words"` wrapping restructures the text into new
    // block-level elements, which would take `line2Ref`'s gradient text
    // out of its own inline box and leave `background-clip: text` with
    // nothing to clip against (the line would render invisible). The
    // gradient second line instead animates as one simple fade/rise
    // unit, same technique `ActionPulseCaseStudy`/`ForgePipelineCaseStudy`
    // use for their own gradient hero text.
    const ctx = gsap.context(() => {
      split = SplitText.create(line1Ref.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, { yPercent: 115, rotate: 3, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.05 }),
      });

      gsap.from(line2Ref.current, { opacity: 0, y: 20, duration: 0.8, ease: "power2.out", delay: 0.4 });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const targets = [eyebrowRef.current, ledeRef.current, ctaRef.current, metaRef.current, stageRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(eyebrowRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(ledeRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.55)
        .from(ctaRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.65)
        .from(metaRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.75)
        .from(stageRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.4);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[radial-gradient(1200px_500px_at_82%_-8%,#F5F2FF,transparent_60%)] pt-[100px] pb-8"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-9 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-13">
        <div>
          <span ref={eyebrowRef} className="text-[13px] font-semibold tracking-[0.16em] text-[#4F46E5] uppercase">
            In-house product · Delivery &amp; knowledge workspace
          </span>

          <h1 className="mt-4.5 text-[clamp(40px,6vw,68px)] leading-[1.08] font-bold tracking-[-0.02em] text-[#141127]">
            <span ref={line1Ref} className="block">
              Track the work. 
            </span>
            <span ref={line2Ref} className="block bg-[linear-gradient(120deg,#4F46E5,#7C3AED)] bg-clip-text text-transparent">
              Capture the knowledge.
            </span>
          </h1>

          <p ref={ledeRef} className="mt-5 max-w-[38ch] text-[20px] text-[#5c5975]">
            Kollabry is a delivery and knowledge platform we designed and built end-to-end —
            issues, sprints, and retros in the same workspace as a knowledge base and
            collaborative whiteboards, so plans and the decisions behind them never drift apart.
          </p>

          <div ref={ctaRef} className="mt-7.5 flex flex-wrap gap-3">
            <Link
              href="https://www.kollabry.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[linear-gradient(120deg,#4F46E5,#7C3AED)] px-4.5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)] transition-all duration-150 hover:brightness-105 hover:-translate-y-px"
            >
              Explore Kollabry ↗
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#d8d5ec] bg-white px-4.5 py-2.5 text-[14.5px] font-semibold text-[#141127] transition-colors duration-150 hover:border-[#4F46E5] hover:text-[#4F46E5]"
            >
              See the build
            </Link>
          </div>

          <div ref={metaRef} className="mt-8.5 flex flex-wrap gap-6.5 border-t border-[#E7E5F3] pt-6.5">
            {HERO_META.map((item) => (
              <div key={item.k}>
                <div className="text-[11px] font-semibold tracking-[0.04em] text-[#8f8ca8] uppercase">{item.k}</div>
                <div className="mt-0.5 text-[14px] font-semibold text-[#141127]">{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature visual: two linked surfaces, one workspace. */}
        <div
          ref={stageRef}
          aria-hidden
          className="relative overflow-hidden rounded-[20px] border border-[#E7E5F3] bg-[linear-gradient(135deg,#ffffff,#EEF0FF)] p-5.5 shadow-[0_30px_70px_-30px_rgba(30,27,75,0.35)]"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6058]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>

          <div className="rounded-[14px] border border-[#E7E5F3] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(30,27,75,0.25)]">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[#4F46E5] uppercase">Kollabry · Tracking</span>
            <h4 className="my-1.5 text-[15px] font-semibold text-[#141127]">Q3 launch — Sprint 7</h4>
            <div className="flex flex-wrap gap-1.5">
              {["◆ Board", "Backlog", "Sprints", "Retros"].map((chip) => (
                <span key={chip} className="rounded-full border border-[#E7E5F3] bg-[#EEF0FF] px-2.5 py-1 text-[11.5px] font-semibold text-[#2b2740]">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="my-3 flex items-center justify-center gap-2 text-[11.5px] font-semibold text-[#7C73F0]">
            <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#d8d5ec,transparent)]" />
            linked both ways
            <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#d8d5ec,transparent)]" />
          </div>

          <div className="rounded-[14px] border border-[#E7E5F3] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(30,27,75,0.25)]">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[#7C3AED] uppercase">Synergy · Knowledge</span>
            <h4 className="my-1.5 text-[15px] font-semibold text-[#141127]">
              Q3 launch plan <span className="text-[11px] font-semibold text-[#7C3AED]">· Approved v7</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {["Documents", "Whiteboards", "Approvals", "Versions"].map((chip) => (
                <span key={chip} className="rounded-full border border-[#E7E5F3] bg-[#F5F2FF] px-2.5 py-1 text-[11.5px] font-semibold text-[#7C3AED]">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewSection() {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <section className="bg-white px-6 py-[78px] sm:py-[78px]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-[620px]">
          <span className="text-[13px] font-semibold tracking-[0.16em] text-[#4F46E5] uppercase">Overview</span>
          <h2 ref={titleRef} className="mt-3 text-[clamp(28px,4vw,40px)] leading-[1.08] font-bold tracking-[-0.02em] text-[#141127]">
            One workspace, from idea to shipped — and remembered
          </h2>
          <p className="mt-3.5 text-[17px] text-[#5c5975]">
            Most teams run delivery in one tool and keep their thinking in another. The plan lives
            in a tracker; the decisions behind it scatter across wikis, docs, and whiteboards — and
            context is lost in the gap. Kollabry closes that gap with two connected surfaces on one
            canvas: <b className="font-semibold text-[#141127]">Kollabry</b> for tracking and{" "}
            <b className="font-semibold text-[#141127]">Synergy</b> for knowledge, linked both ways
            so context always travels with the work.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CHALLENGE
========================================================= */

function ChallengeSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#f7f6fd] px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="The challenge" title="Plans and the thinking behind them drift apart" />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEM_CARDS.map((card) => (
            <div key={card.n} className="rounded-2xl border border-[#E7E5F3] bg-white p-6.5 shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
              <div className="text-[14px] font-bold tracking-[0.1em] text-[#4F46E5]">{card.n}</div>
              <h3 className="mt-3 mb-2 text-[19px] font-bold text-[#141127]">{card.title}</h3>
              <p className="text-[14.5px] text-[#5c5975]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TWO SURFACES
========================================================= */

function TwoSurfacesSection() {
  const kRef = useFadeUp<HTMLDivElement>();
  const sRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-white px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead
          eyebrow="The idea"
          title="Two surfaces, one workspace"
          sub="Not separate tools bolted together — work flows across both, and documents and issues stay linked in both directions."
        />
        <div className="mt-11.5 grid grid-cols-1 items-stretch gap-6.5 lg:grid-cols-[1fr_auto_1fr]">
          <div ref={kRef} className="rounded-[18px] border border-[#E7E5F3] bg-white p-7.5 shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
            <span className="text-[12px] font-semibold tracking-[0.14em] text-[#4F46E5] uppercase">Kollabry · Tracking</span>
            <h3 className="mt-2.5 mb-1.5 text-[23px] font-bold text-[#141127]">Run the work</h3>
            <p className="mb-4 text-[14.5px] text-[#5c5975]">
              Everything you need to plan and deliver, shaped around how your team actually works.
            </p>
            <ul className="grid gap-2.5">
              {KOLLABRY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14.5px] text-[#2b2740]">
                  <CheckSvg />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden className="flex flex-row items-center justify-center gap-2.5 py-1.5 text-center text-[12px] font-semibold tracking-[0.1em] text-[#7C73F0] uppercase lg:flex-col">
            <span className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-[#d8d5ec] bg-[#F5F2FF]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C73F0" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M9 12h6M8 8l-2 2a4 4 0 000 6l2 2M16 8l2 2a4 4 0 010 6l-2 2" />
              </svg>
            </span>
            <span>
              linked
              <br />
              both ways
            </span>
          </div>

          <div ref={sRef} className="rounded-[18px] border border-[#E7E5F3] bg-white p-7.5 shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
            <span className="text-[12px] font-semibold tracking-[0.14em] text-[#7C3AED] uppercase">Synergy · Knowledge</span>
            <h3 className="mt-2.5 mb-1.5 text-[23px] font-bold text-[#141127]">Keep the knowledge</h3>
            <p className="mb-4 text-[14.5px] text-[#5c5975]">
              The decisions, specs, and ideas behind the work — versioned, reviewed, and searchable.
            </p>
            <ul className="grid gap-2.5">
              {SYNERGY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14.5px] text-[#2b2740]">
                  <CheckSvg />
                  {item}
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
   FEATURES
========================================================= */

function FeaturesSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section id="features" className="bg-[#f7f6fd] px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Features" title="A complete delivery & knowledge platform" sub="Everything the team needs across the whole cycle, in one place." />
        <div ref={gridRef} className="mt-11.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[#E7E5F3] bg-white p-6  hover:-translate-y-1 hover:border-[#d8d5ec] hover:shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]"
            >
              <div className="mb-3.5 grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-[#EEF0FF] text-[18px] text-[#4F46E5]">
                {feature.icon}
              </div>
              <h3 className="mb-1.5 text-[17px] font-bold text-[#141127]">{feature.title}</h3>
              <p className="text-[14px] text-[#5c5975]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   DEEP DIVES
========================================================= */

function DivesSection() {
  return (
    <section className="bg-white px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="A closer look" title="Built for real-time teamwork" />
        <div className="mt-4">
          {DIVES.map((dive, i) => (
            <DiveRow key={dive.title} dive={dive} isLast={i === DIVES.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DiveRow({ dive, isLast }: { dive: (typeof DIVES)[number]; isLast: boolean }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className={cx("grid grid-cols-1 items-center gap-9 py-10 lg:grid-cols-2 lg:gap-12", !isLast && "border-b border-[#E7E5F3]")}>
      <div ref={textRef}>
        <span className="text-[12px] font-semibold tracking-[0.14em] text-[#7C3AED] uppercase">{dive.tag}</span>
        <h3 className="mt-3 mb-3.5 text-[26px] font-bold text-[#141127]">{dive.title}</h3>
        <p className="text-[16px] text-[#5c5975]">{dive.desc}</p>
        <ul className="mt-4 grid gap-2.5">
          {dive.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2.5 text-[14.5px] text-[#2b2740]">
              <span aria-hidden className="mt-0.5 shrink-0 text-[#7C3AED]">
                ✦
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div ref={mediaRef} className={dive.flip ? "lg:order-first" : undefined}>
        <ShotPlaceholder caption={dive.caption} sub={dive.sub} />
      </div>
    </div>
  );
}

/* =========================================================
   APPROACH (dark band)
========================================================= */

function ApproachSection() {
  const stepsRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#141127] px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Our approach" title="How we built it" sub="A deliberate path from discovery to a launched, hardened product." dark />
        <div ref={stepsRef} className="mt-11.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {APPROACH_STEPS.map((step) => (
            <div key={step.num} className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] p-6.5">
              <div className="bg-[linear-gradient(120deg,#a5b4fc,#c4b5fd)] bg-clip-text text-[34px] font-bold text-transparent">{step.num}</div>
              <h3 className="my-2 text-[17px] font-bold text-white">{step.title}</h3>
              <p className="text-[14px] text-[#c8c5e0]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECH
========================================================= */

function TechSection() {
  const stackRef = useFadeUp<HTMLDivElement>();
  const highlightsRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-white px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Architecture & technology" title="Engineered for real-time and scale" />
        <div className="mt-11 grid grid-cols-1 items-start gap-11 lg:grid-cols-[1.1fr_1fr]">
          <div ref={stackRef} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {TECH_STACK.map((row) => (
              <div key={row.k} className="rounded-xl border border-[#E7E5F3] bg-white p-3.5 px-4">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[#8f8ca8] uppercase">{row.k}</div>
                <div className="mt-1 text-[14.5px] font-semibold text-[#141127]">{row.v}</div>
              </div>
            ))}
          </div>
          <div ref={highlightsRef} className="grid gap-3.5">
            {TECH_HIGHLIGHTS.map((item) => (
              <div key={item.title} className="flex gap-3.5 rounded-xl border border-[#E7E5F3] bg-white p-4 px-4.5">
                <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[#EEF0FF] text-[16px] text-[#4F46E5]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="mb-0.5 text-[15.5px] font-bold text-[#141127]">{item.title}</h3>
                  <p className="text-[13.5px] text-[#5c5975]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE LOOP
========================================================= */

function LoopSection() {
  const loopRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#f7f6fd] px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="The loop" title="From idea to shipped — and remembered" />
        <div ref={loopRef} className="mt-11 flex flex-wrap gap-3">
          {LOOP_ITEMS.map((item) => (
            <div key={item.n} className="min-w-[150px] flex-1 rounded-2xl border border-[#E7E5F3] bg-white p-5 shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
              <div className="text-[13px] font-bold text-[#4F46E5]">{item.n}</div>
              <h3 className="my-1.5 text-[16px] font-bold text-[#141127]">{item.title}</h3>
              <p className="text-[13.5px] text-[#5c5975]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   IMPACT
========================================================= */

function ImpactSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-white px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Impact" title="What it delivers" sub="Qualitative outcomes below. Replace the placeholders with real figures you can stand behind." />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {IMPACT_ITEMS.map((item) => (
            <div key={item.big} className="rounded-2xl border border-[#E7E5F3] bg-[linear-gradient(135deg,#ffffff,#EEF0FF)] p-7 shadow-[0_12px_34px_-14px_rgba(79,70,229,0.22)]">
              <div className="bg-[linear-gradient(120deg,#4F46E5,#7C3AED)] bg-clip-text text-[40px] font-bold text-transparent">{item.big}</div>
              <p className="mt-1.5 text-[14px] text-[#5c5975]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   GALLERY
========================================================= */

function GallerySection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#f7f6fd] px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Gallery" title="Inside the product" sub="Add real captures — login, board, backlog, a Synergy doc, a whiteboard, and a retro read well here." />
        <div ref={gridRef} className="mt-11 grid grid-cols-1 gap-4.5 lg:grid-cols-2">
          {GALLERY_ITEMS.map((item) => (
            <ShotPlaceholder key={item.caption} caption={item.caption} sub={item.sub} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CTA
========================================================= */

function CtaSection() {
  const cardRef = useFadeUp<HTMLDivElement>();
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <section className="bg-white px-6 py-[78px]">
      <div className="mx-auto max-w-7xl">
        <div
          ref={cardRef}
          className="rounded-[22px] bg-[linear-gradient(120deg,#4F46E5,#7C3AED)] px-6 py-14 text-center text-white shadow-[0_30px_70px_-30px_rgba(30,27,75,0.35)] sm:px-12"
        >
          <h2 ref={titleRef} className="text-[clamp(26px,4vw,38px)] leading-[1.08] font-bold text-white">
            Have a product like this in mind?
          </h2>
          <p className="mx-auto mt-3.5 mb-6.5 max-w-[52ch] text-[17px] text-[rgba(255,255,255,0.9)]">
            We design and build scalable digital products end-to-end — from the first idea to a
            launched, hardened platform. Let&apos;s talk about yours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4.5 py-2.5 text-[14.5px] font-semibold text-[#4F46E5] transition-all duration-150 hover:brightness-105 hover:-translate-y-px"
            >
              Let&apos;s connect
            </Link>
            <Link
              href="https://www.kollabry.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.55)] px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-all duration-150 hover:border-white hover:bg-[rgba(255,255,255,0.12)]"
            >
              Visit Kollabry ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function KollabryCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-white">
      <Hero />
      <OverviewSection />
      <ChallengeSection />
      <TwoSurfacesSection />
      <FeaturesSection />
      <DivesSection />
      <ApproachSection />
      <TechSection />
      <LoopSection />
      <ImpactSection />
      <GallerySection />
      <CtaSection />
    </div>
  );
}
