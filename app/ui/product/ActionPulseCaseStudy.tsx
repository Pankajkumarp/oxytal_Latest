"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
 * `ActionPulseCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/actionpulse-oxytal.html`. Same treatment as its
 * sibling `SamVaultCaseStudy`: no Contentful wiring, keeps the
 * reference's own colour identity (`--navy` `#0D0B1F`/`--indigo`
 * `#4F46E5`/`--violet` `#7C3AED`/`--electric` `#818CF8`) instead of the
 * site's per-page `themeColor` accent, no `<nav>`/`<footer>` (the app's
 * global `Navbar`/footer already wrap every page), and typography stays
 * the site's own inherited `Poppins` rather than the reference's own
 * Google Fonts (`Syne`/`Inter`/`JetBrains Mono`).
 *
 * Shares its scroll-reveal hooks (`useSplitReveal`/`useFadeUp`/
 * `useListStagger`) with `SamVaultCaseStudy` via `./useReveal` — every
 * section `<h2>`/`<h3>` gets the word-split reveal, whole-block content
 * (problem list aside, tech grid, approach grid, outcomes grid) fades
 * or staggers up on scroll. The hero's own heading, dashboard-mockup
 * entrance, and growing chart bars run on mount (above the fold, no
 * ScrollTrigger) via a dedicated effect, same shape as `SamVaultCaseStudy`'s
 * `Hero`. The reference's `.gradient-text` (a `background-clip: text`
 * span) is animated as its own unit rather than being run through
 * `SplitText`'s word-wrapping, so the gradient still paints correctly.
 *
 * The scrolling tech ticker reuses the site's existing `marquee`
 * keyframe/token (`app/globals.css`, already built for `CaseStudyDetail`'s
 * stat ticker) at the reference's own 28s duration via an arbitrary
 * Tailwind value, rather than adding a near-duplicate keyframe. The
 * feature tabs are the one interactive bit — a plain `useState`, with
 * only the active panel mounted (so its heading replays its reveal each
 * time a visitor switches tabs, a small bonus over the reference's own
 * CSS `display:none` toggle). The screenshot gallery is a plain
 * `overflow-x-auto` + `snap-x` scroller, no JS needed for the reference's
 * own scroll-snap behaviour.
 */

const TONE_CLASSES = {
  rose: "bg-[rgba(244,63,94,0.15)] text-[#F43F5E]",
  amber: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]",
  blue: "bg-[rgba(99,102,241,0.15)] text-[#818CF8]",
  green: "bg-[rgba(52,211,153,0.15)] text-[#34D399]",
} as const;
type Tone = keyof typeof TONE_CLASSES;

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

/* =========================================================
   CONTENT — transcribed from Refrence/actionpulse-oxytal.html
========================================================= */

const HERO_STATS = [
  { value: "85+", label: "Versions shipped" },
  { value: "6", label: "Permission roles" },
  { value: "∞", label: "Organisations" },
];

const HERO_DASHBOARD_CARDS: { num: string; label: string; trend: string; trendTone: "mint" | "amber" }[] = [
  { num: "142", label: "Open actions", trend: "↑ 12 this week", trendTone: "mint" },
  { num: "89%", label: "SLA compliance", trend: "↓ 3% vs target", trendTone: "amber" },
  { num: "£2.4M", label: "Pipeline value", trend: "↑ 18% vs last mo", trendTone: "mint" },
  { num: "7", label: "RFPs in progress", trend: "3 due this week", trendTone: "mint" },
];

const CHART_HEIGHTS = [35, 50, 42, 65, 48, 72, 58, 80, 68, 90, 75, 100];

const HERO_RECENT_ACTIONS: { tone: Tone; label: string; text: string }[] = [
  { tone: "rose", label: "Critical", text: "Cloud migration review" },
  { tone: "amber", label: "High", text: "Q4 budget approval" },
  { tone: "blue", label: "In Review", text: "API security audit" },
  { tone: "green", label: "Closed", text: "Onboarding docs" },
];

const HERO_PIPELINE_STAGES: { tone: Tone; label: string; text: string }[] = [
  { tone: "blue", label: "Identified", text: "4 RFPs" },
  { tone: "amber", label: "Proposal", text: "3 RFPs" },
  { tone: "green", label: "Won", text: "6 this month" },
];

const TICKER_ITEMS = [
  "Next.js 16",
  "Multi-org RBAC",
  "Prisma 7",
  "Azure AD SSO",
  "AWS S3 + SES",
  "RFP Workspace",
  "PPTX Export",
  "CRM Pipeline",
  "Content Library",
  "Drag & Drop Kanban",
  "Real-time Notifications",
  "Executive Analytics",
];

const PROBLEM_ITEMS: { icon: string; title: string; text: string }[] = [
  {
    icon: "⚡",
    title: "Fragmented workflows",
    text: "Teams juggled Jira, Notion, email threads, and spreadsheets with no single source of truth for critical decisions.",
  },
  {
    icon: "🔒",
    title: "No multi-org isolation",
    text: "Client data needed strict organisational boundaries — commercially available tools either mixed data or required expensive enterprise plans.",
  },
  {
    icon: "📑",
    title: "Proposals disconnected from delivery",
    text: "Bid teams built decks in PowerPoint, submitted RFPs via email, then lost track of outcomes. No link between proposal and project.",
  },
  {
    icon: "📊",
    title: "No executive visibility",
    text: "Leadership had no real-time view of SLA compliance, pipeline health, or overdue actions — critical for enterprise client management.",
  },
];

const SOLUTION_ITEMS = [
  "Unlimited organisations with full data isolation",
  "6-tier RBAC from Super Admin to Viewer",
  "Google + Microsoft SSO with MFA",
  "RFP workspace → PPTX export with 5 themes",
  "Reusable content library with approval workflow",
  "CRM pipeline from lead to closed deal",
  "Executive analytics with SLA compliance tracking",
  "Email automation via AWS SES",
  "Document storage on AWS S3",
];

type TabKey = "actions" | "rfp" | "library" | "crm" | "analytics";

const FEATURE_TABS: { key: TabKey; label: string }[] = [
  { key: "actions", label: "Action Management" },
  { key: "rfp", label: "RFP Workspace" },
  { key: "library", label: "Content Library" },
  { key: "crm", label: "CRM Pipeline" },
  { key: "analytics", label: "Analytics" },
];

const FEATURE_PANELS: Record<TabKey, { module: string; title: string; desc: string; bullets: string[] }> = {
  actions: {
    module: "Module 01",
    title: "Action management that actually drives accountability",
    desc: "Every decision, task, and escalation tracked in real time. Rich text descriptions, file attachments, @mention comments, SLA rules, and overdue alerts — all scoped per organisation.",
    bullets: [
      "Kanban board with drag-and-drop stage management",
      "Priority levels: Critical, High, Medium, Low with SLA thresholds",
      "@mention notifications delivered instantly via AWS SES",
      "Bulk import from CSV with auto-validation",
      "Escalation rules that auto-notify managers when overdue",
      "Full activity log with timestamped audit trail",
    ],
  },
  rfp: {
    module: "Module 02",
    title: "End-to-end RFP workspace — from brief to PPTX",
    desc: "The proposal is a first-class object. Build sections with a full-screen rich text editor, link library blocks, assign team members to sections, and export a branded PowerPoint in one click.",
    bullets: [
      "9 default sections, fully reorderable by drag-and-drop",
      "Full-screen per-section editor with word count and slide estimate",
      "Link pre-approved content library blocks to any section",
      "5 PPTX export themes with auto-pagination for long content",
      "Cover logo uploaded per organisation, appears on every export",
      "4 built-in RFP templates: Government IT, Commercial, Technical, Creative",
      "Slide preview before export — see the first 3 slides as SVG",
    ],
  },
  library: {
    module: "Module 03",
    title: "Content library — write once, use everywhere",
    desc: "A curated bank of pre-approved content blocks — company profiles, rate cards, case studies, team bios — that anyone can pull into an RFP or proposal in one click.",
    bullets: [
      "13 categories: Company Profile, Financial Info, QA Approach, Design Approach and more",
      "Draft → Approved → Archived workflow with role-gated approval",
      "Rich text content with tables, images, formatting",
      "Tag system for fast search (#ISO27001, #SaaS, #APAC)",
      "Version history and usage count per block",
      "Slide layout flag for PPTX export positioning",
    ],
  },
  crm: {
    module: "Module 04",
    title: "CRM pipeline — from first contact to won deal",
    desc: "A full B2B CRM built into the same platform. Leads flow through qualification into opportunities, which link directly to RFPs. The proposal is part of the deal — not a separate attachment.",
    bullets: [
      "Lead capture from web, LinkedIn, referral, and cold outreach",
      "Accounts and contacts with relationship scoring (0–100)",
      "Opportunity Kanban: Identified → Qualified → Proposal → Negotiation → Won/Lost",
      "Convert a qualified lead to an opportunity in one click",
      "Auto-create an RFP when a deal moves to Proposal stage",
      "Revenue forecasting dashboard with weighted pipeline value",
    ],
  },
  analytics: {
    module: "Module 05",
    title: "Executive analytics built for leadership decisions",
    desc: "Real-time visibility across every layer of the organisation. SLA compliance, overdue action trends, pipeline health, and revenue forecasting — all in one dashboard tailored to role.",
    bullets: [
      "8 KPI cards with drill-through to filtered action lists",
      "Monthly trend charts and pipeline funnel (Recharts)",
      "SLA compliance tracking with configurable thresholds per priority",
      "Owner accountability matrix — who's overdue and by how much",
      "Excel export of full reports for board presentation",
      "Role-filtered views — CXO sees org-wide, manager sees team only",
    ],
  },
};

const TECH_CARDS: { icon: string; name: string; desc: string; tag: string }[] = [
  { icon: "▲", name: "Next.js 16", desc: "App Router, React Server Components, Edge-ready deployment on Vercel", tag: "Framework" },
  { icon: "🔷", name: "TypeScript", desc: "End-to-end type safety from database schema to UI component props", tag: "Language" },
  { icon: "⬡", name: "Prisma 7", desc: "Type-safe ORM with MariaDB adapter, migrations, and generated client", tag: "Database" },
  { icon: "🔐", name: "NextAuth v4", desc: "Google OAuth, Microsoft Azure AD, MFA credentials, JWT strategy", tag: "Auth" },
  { icon: "☁️", name: "AWS S3 + SES", desc: "Presigned POST uploads, transactional email, scalable file storage", tag: "Cloud" },
  { icon: "🎨", name: "Tailwind CSS", desc: "Utility-first styling with custom CSS variable design tokens", tag: "Styling" },
  { icon: "⚡", name: "TanStack Query", desc: "Server state management, optimistic updates, background refetching", tag: "State" },
  { icon: "📊", name: "Recharts + ExcelJS", desc: "Interactive analytics charts and Excel report export for executives", tag: "Analytics" },
  { icon: "📑", name: "pptxgenjs", desc: "Server-side PPTX generation with 5 themes, images, tables, pagination", tag: "Export" },
];

const APPROACH_CARDS = [
  {
    num: "01",
    title: "Ideation & discovery",
    desc: "Deep-dive workshops to map the full action lifecycle, proposal workflow, and permission model. Architecture designed for multi-tenancy from day one.",
  },
  {
    num: "02",
    title: "Iterative delivery",
    desc: "85+ versions shipped in a continuous deployment loop — each release adding a testable module. Users giving feedback on real working software, not wireframes.",
  },
  {
    num: "03",
    title: "AI-augmented build",
    desc: "Claude Code integrated directly into the VS Code workflow via CLAUDE.md project context — accelerating feature delivery without sacrificing code quality.",
  },
  {
    num: "04",
    title: "Production hardened",
    desc: "Live on Vercel with Aiven cloud MySQL, all secrets managed server-side, PPTX generation server-only, and JWT cookies set directly from API routes.",
  },
];

const OUTCOME_CARDS: {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  metric: string;
  metricGradient: string;
  metricSub: string;
}[] = [
  {
    icon: "⚡",
    iconBg: "bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)]",
    title: "Decision velocity",
    desc: "Every action tracked with owner, deadline, priority, and full comment thread. Escalation rules fire automatically when items go overdue — leadership never chases status by email.",
    metric: "3× faster",
    metricGradient: "bg-[linear-gradient(135deg,#34D399,#818CF8)]",
    metricSub: "average decision-to-close time",
  },
  {
    icon: "📑",
    iconBg: "bg-[rgba(79,70,229,0.1)] border border-[rgba(79,70,229,0.2)]",
    title: "Proposal quality",
    desc: "The content library eliminates copy-pasting between bids. Approved blocks are reused, version-controlled, and consistent. Proposals that used to take days now take hours.",
    metric: "70% less",
    metricGradient: "bg-[linear-gradient(135deg,#818CF8,#7C3AED)]",
    metricSub: "time spent building proposals",
  },
  {
    icon: "🎯",
    iconBg: "bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)]",
    title: "Pipeline visibility",
    desc: "CRM pipeline linked directly to RFPs — no gap between “we submitted a proposal” and “we're tracking that deal.” Leadership sees weighted forecast in real time.",
    metric: "100%",
    metricGradient: "bg-[linear-gradient(135deg,#7C3AED,#F43F5E)]",
    metricSub: "deal-to-proposal traceability",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function SectionHeader({ eyebrow, title, sub, center = true }: { eyebrow: string; title: ReactNode; sub?: string; center?: boolean }) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={cx(center ? "mx-auto max-w-[640px] text-center" : undefined, "mb-16")}>
      <p className="text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">{eyebrow}</p>
      <h2
        ref={titleRef}
        className="my-4 text-[clamp(32px,4vw,52px)] leading-[1.15] font-extrabold tracking-[-0.02em] text-white"
      >
        {title}
      </h2>
      {sub && <p className="text-[18px] leading-[1.7] text-[#A8A4CC]">{sub}</p>}
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Heading: the plain first line splits word-by-word on mount (above
  // the fold, no ScrollTrigger); the gradient second line is animated
  // as one unit instead of being split, so SplitText never re-wraps the
  // `background-clip: text` span and breaks the gradient.
  useLayoutEffect(() => {
    if (!line1Ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set([line1Ref.current, line2Ref.current], { opacity: 1, y: 0 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(line1Ref.current!, {
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

      gsap.from(line2Ref.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5,
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  // Everything else: a single sequenced fade-up.
  useLayoutEffect(() => {
    const targets = [tagRef.current, descRef.current, actionsRef.current, statsRef.current, visualRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(tagRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0)
        .from(descRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.55)
        .from(actionsRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.65)
        .from(statsRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.75)
        .from(visualRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.4);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Dashboard chart bars grow in from 0 once the hero mounts.
  useLayoutEffect(() => {
    const bars = chartRef.current?.children;
    if (!bars || !bars.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(bars, { height: (i: number) => `${CHART_HEIGHTS[i]}%` });
      return;
    }

    gsap.set(bars, { height: "0%" });

    const ctx = gsap.context(() => {
      gsap.to(bars, {
        height: (i: number) => `${CHART_HEIGHTS[i]}%`,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
        delay: 0.9,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 flex min-h-screen items-center overflow-hidden px-[5%] pt-[120px] pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(79,70,229,0.18)_0%,transparent_70%),radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(124,58,237,0.12)_0%,transparent_60%)]"
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <div>
          <div
            ref={tagRef}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(79,70,229,0.4)] bg-[rgba(79,70,229,0.1)] px-3.5 py-1.5 text-[11px] tracking-[0.12em] text-[#818CF8] uppercase"
          >
            <span aria-hidden className="animate-dot-pulse h-1.5 w-1.5 rounded-full bg-[#34D399]" />
            Oxytal Case Study — ActionPulse
          </div>

          <h1 className="mb-6 max-w-[640px] text-[clamp(40px,5.5vw,68px)] leading-[1.15] font-extrabold tracking-[-0.02em] text-white">
            <span ref={line1Ref} className="block">
              Enterprise action intelligence,
            </span>
            <span
              ref={line2Ref}
              className="block bg-[linear-gradient(135deg,#818CF8_0%,#7C3AED_50%,#F43F5E_100%)] bg-clip-text text-transparent"
            >
              built for scale
            </span>
          </h1>

          <p ref={descRef} className="mb-10 max-w-[480px] text-[18px] leading-[1.75] text-[#A8A4CC]">
            A fully custom multi-organisation platform that transforms how leadership teams track
            decisions, manage proposals, and close enterprise deals — built entirely in-house by
            Oxytal.
          </p>

          <div ref={actionsRef} className="mb-14 flex flex-wrap gap-3.5">
            <a
              href="https://actionpulse.oxytal.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_32px_rgba(79,70,229,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_40px_rgba(79,70,229,0.55)]"
            >
              Live platform ↗
            </a>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.13)] px-7 py-3.5 text-[15px] font-semibold text-[#F0EEFF] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.04)]"
            >
              Build yours →
            </Link>
          </div>

          <div ref={statsRef} className="flex flex-wrap gap-10">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="bg-[linear-gradient(135deg,#FFFFFF,#818CF8)] bg-clip-text text-[32px] font-extrabold text-transparent">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-[#6B678E]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup — hidden below `lg`, same as the reference's own `.hero-visual{display:none}` under 900px. */}
        <div ref={visualRef} className="relative hidden lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,transparent_70%)]"
          />
          <div className="animate-float-slow relative rounded-[20px] border border-[rgba(79,70,229,0.25)] bg-[linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.08))] p-[3px] shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="overflow-hidden rounded-[18px] bg-[#13112A]">
              <div className="flex items-center gap-1.5 border-b border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                <div className="flex-1 text-center text-[11px] text-[#6B678E]">actionpulse.oxytal.com/dashboard</div>
              </div>

              <div className="p-5">
                <div className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {HERO_DASHBOARD_CARDS.map((card) => (
                    <div key={card.label} className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-3.5">
                      <div className="text-[22px] font-bold text-white">{card.num}</div>
                      <div className="mt-0.5 text-[10px] text-[#6B678E]">{card.label}</div>
                      <div className={cx("mt-1.5 text-[10px]", card.trendTone === "mint" ? "text-[#34D399]" : "text-[#F59E0B]")}>
                        {card.trend}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  ref={chartRef}
                  className="mb-3.5 flex h-[90px] items-end gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4"
                >
                  {CHART_HEIGHTS.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[4px] bg-[linear-gradient(to_top,#4F46E5,#818CF8)] opacity-70"
                      style={{ height: 0 }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3.5">
                    <div className="mb-2 text-[10px] font-semibold text-[#A8A4CC]">Recent actions</div>
                    {HERO_RECENT_ACTIONS.map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-1.5 text-[11px] text-[#A8A4CC] last:border-0"
                      >
                        <Pill tone={item.tone}>{item.label}</Pill>
                        {item.text}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3.5">
                    <div className="mb-2 text-[10px] font-semibold text-[#A8A4CC]">Pipeline stages</div>
                    {HERO_PIPELINE_STAGES.map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-1.5 text-[11px] text-[#A8A4CC] last:border-0"
                      >
                        <Pill tone={item.tone}>{item.label}</Pill>
                        {item.text}
                      </div>
                    ))}
                    <div className="pt-1.5 text-[9px] text-[#6B678E]">£840K weighted value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TICKER
========================================================= */

function Ticker() {
  const row = (
    <div className="flex shrink-0 items-center">
      {TICKER_ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-8 px-8 text-[12px] tracking-[0.08em] whitespace-nowrap text-[#6B678E]">
          {item}
          <span aria-hidden className="text-[18px] text-[rgba(79,70,229,0.4)]">
            ·
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative z-10 overflow-hidden border-y border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.01)] py-3.5">
      <div className="animate-marquee flex w-max [animation-duration:28s]">
        {row}
        {row}
      </div>
    </div>
  );
}

/* =========================================================
   PROBLEM / SOLUTION
========================================================= */

function ProblemSolutionSection() {
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  const listRef = useListStagger<HTMLUListElement>("y", 20);
  const cardRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 bg-[radial-gradient(ellipse_60%_50%_at_10%_50%,rgba(124,58,237,0.08)_0%,transparent_60%)] px-[5%] py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">The challenge</p>
          <h2 ref={titleRef} className="my-4 text-[clamp(28px,3.5vw,46px)] leading-[1.15] font-extrabold text-white">
            Why existing tools weren&apos;t enough
          </h2>
          <p className="mb-9 leading-[1.75] text-[#A8A4CC]">
            Oxytal needed a single platform to coordinate actions across clients, manage
            enterprise RFPs, and track sales opportunities — without stitching together five
            different SaaS tools.
          </p>
          <ul ref={listRef} className="list-none">
            {PROBLEM_ITEMS.map((item) => (
              <li key={item.title} className="flex gap-4 border-b border-[rgba(255,255,255,0.07)] py-5 last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(244,63,94,0.2)] bg-[rgba(244,63,94,0.1)] text-[18px]">
                  {item.icon}
                </div>
                <div>
                  <span className="mb-1 text-[16px] font-semibold text-white block">{item.title}</span>
                  <p className="text-[14px] leading-[1.6] text-[#A8A4CC]">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div ref={cardRef} className="relative overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.13)] bg-[rgba(255,255,255,0.04)] p-10">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#4F46E5,transparent)]" />
          <p className="mb-4 text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">Our solution</p>
          <span className="mb-4 text-[28px] font-bold text-white block">One platform. Every layer.</span>
          <p className="mb-6 leading-[1.7] text-[#A8A4CC]">
            ActionPulse unifies action tracking, proposal management, content reuse, and CRM
            pipeline into a single multi-tenant application — with enterprise-grade auth and
            role-based access at every level.
          </p>
          <div className="flex flex-col gap-3">
            {SOLUTION_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-3 text-[15px] text-[#F0EEFF]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.15)] text-[12px] text-[#34D399]">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FEATURE TAB VISUALS
========================================================= */

function MiniCard({ borderColor, children }: { borderColor: string; children: ReactNode }) {
  return (
    <div className="mb-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-3" style={{ borderLeft: `3px solid ${borderColor}` }}>
      {children}
    </div>
  );
}

function ActionsVisual() {
  const items = [
    { title: "Cloud security audit", meta: "Due 3 days · Sandeep B. · 4 comments", tone: "rose" as Tone, label: "Critical", color: "#F43F5E" },
    { title: "Q4 budget sign-off", meta: "Due 7 days · CFO · In review", tone: "amber" as Tone, label: "High", color: "#F59E0B" },
    { title: "API documentation", meta: "Due 14 days · Dev team", tone: "blue" as Tone, label: "In Progress", color: "#4F46E5" },
    { title: "Onboarding pack v2", meta: "Completed 2 days ago", tone: "green" as Tone, label: "Closed", color: "#34D399" },
  ];

  return (
    <div className="flex gap-4">
      <div className="hidden w-[140px] shrink-0 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3 sm:block">
        <div className="mb-2.5 text-[9px] text-[#6B678E]">ACTIONPULSE</div>
        {["📊 Dashboard", "✅ Actions", "⚡ Board", "📑 RFPs", "📚 Library"].map((item, i) => (
          <div
            key={item}
            className={cx(
              "mb-0.5 rounded-[6px] px-2.5 py-1.5 text-[10px]",
              i === 0 ? "bg-[rgba(79,70,229,0.2)] text-[#818CF8]" : "text-[#6B678E]"
            )}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2.5 text-[11px] font-semibold text-[#F0EEFF]">Actions — Q4 Programme</div>
        {items.map((item) => (
          <MiniCard key={item.title} borderColor={item.color}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold text-[#F0EEFF]">{item.title}</div>
              <Pill tone={item.tone}>{item.label}</Pill>
            </div>
            <div className="text-[9px] text-[#6B678E]">{item.meta}</div>
          </MiniCard>
        ))}
      </div>
    </div>
  );
}

function RfpVisual() {
  const sections = [
    { title: "Executive Summary", done: true, note: "📚 linked", noteColor: "text-[#34D399]" },
    { title: "Company Overview", done: true, note: "📚 linked", noteColor: "text-[#34D399]" },
    { title: "Technical Approach", done: false, active: true, note: "⤢ editing", noteColor: "text-[#6B678E]" },
    { title: "Team & Credentials", done: false, note: "Unassigned", noteColor: "text-[#6B678E]" },
    { title: "Pricing & Rate Cards", done: false, note: "Unassigned", noteColor: "text-[#6B678E]" },
  ];

  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold text-[#F0EEFF]">Cloud Infrastructure RFP — Gov IT</div>
      <div className="mb-3 flex items-center gap-2">
        <Pill tone="amber">In Progress</Pill>
        <span className="text-[9px] text-[#6B678E]">7 sections · Deadline 14 Dec</span>
      </div>
      <div className="mb-1.5">
        {sections.map((section) => (
          <div
            key={section.title}
            className={cx(
              "mb-1.5 flex items-center gap-2 rounded-[6px] border px-2.5 py-2 text-[10px] text-[#A8A4CC]",
              section.active ? "border-[rgba(79,70,229,0.3)] bg-[rgba(79,70,229,0.06)]" : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
            )}
          >
            <span
              className={cx(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border text-[8px]",
                section.done
                  ? "border-[#34D399] bg-[rgba(52,211,153,0.2)] text-[#34D399]"
                  : section.active
                    ? "border-[#818CF8] text-[#818CF8]"
                    : "border-[rgba(255,255,255,0.13)]"
              )}
            >
              {section.done ? "✓" : section.active ? "✎" : ""}
            </span>
            <span className={cx("flex-1", section.active && "text-[#818CF8]")}>{section.title}</span>
            <span className={cx("text-[9px]", section.noteColor)}>{section.note}</span>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex gap-2">
        <div className="flex-1 rounded-[8px] border border-[rgba(79,70,229,0.3)] bg-[linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,58,237,0.2))] p-2.5 text-center text-[10px] text-[#818CF8]">
          ↓ Export PPTX
          <br />
          <span className="text-[9px] text-[#6B678E]">5 themes</span>
        </div>
        <div className="flex-1 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-2.5 text-center text-[10px] text-[#A8A4CC]">
          👁 Preview
          <br />
          <span className="text-[9px] text-[#6B678E]">First 3 slides</span>
        </div>
        <div className="flex-1 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-2.5 text-center text-[10px] text-[#A8A4CC]">
          📋 Template
          <br />
          <span className="text-[9px] text-[#6B678E]">4 built-in</span>
        </div>
      </div>
    </div>
  );
}

function LibraryVisual() {
  const blocks = [
    { title: "Company Overview 2025 — EMEA", meta: "Company Profile · v3 · 12 uses · #ISO27001 #SaaS", status: "Approved", color: "#4F46E5" },
    { title: "Day rate card — Enterprise 2025", meta: "Rate Cards · v2 · 8 uses · table slide", status: "Approved", color: "#059669" },
    { title: "NHS Digital Transformation — case study", meta: "Case Studies · v1 · Awaiting approval", status: "Draft", color: "#F59E0B" },
    { title: "QA & Testing Methodology", meta: "QA Approach · v1 · 5 uses · content slide", status: "Approved", color: "#06B6D4" },
  ];
  const filters = ["All categories", "Company Profile", "Rate Cards", "Case Studies"];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {filters.map((filter, i) => (
          <span
            key={filter}
            className={cx(
              "rounded-full border px-2.5 py-1 text-[10px]",
              i === 0
                ? "border-[rgba(79,70,229,0.3)] bg-[rgba(79,70,229,0.2)] text-[#818CF8]"
                : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] text-[#6B678E]"
            )}
          >
            {filter}
          </span>
        ))}
      </div>
      {blocks.map((block) => (
        <MiniCard key={block.title} borderColor={block.color}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-[#F0EEFF]">{block.title}</div>
            <Pill tone={block.status === "Approved" ? "green" : "amber"}>{block.status}</Pill>
          </div>
          <div className="mt-0.5 text-[9px] text-[#6B678E]">{block.meta}</div>
        </MiniCard>
      ))}
    </div>
  );
}

function CrmVisual() {
  const columns = [
    { label: "QUALIFIED · 3", color: "text-[#6B678E]", deals: [{ name: "Acme Corp", meta: "£120K · 60%" }, { name: "NHS Dept", meta: "£340K · 40%" }] },
    { label: "PROPOSAL · 2", color: "text-[#F59E0B]", deals: [{ name: "GovCloud RFP", meta: "£480K · 70% · 📄" }] },
    { label: "NEGOTIATION · 1", color: "text-[#818CF8]", deals: [{ name: "Fintech Platform", meta: "£220K · 85%" }] },
    { label: "WON · 4", color: "text-[#34D399]", deals: [{ name: "Retail Cloud", meta: "£95K ✓" }, { name: "Logistics API", meta: "£140K ✓" }] },
  ];
  const totals = [
    { value: "£1.4M", label: "Total pipeline", color: "text-white" },
    { value: "£840K", label: "Weighted value", color: "text-[#818CF8]" },
    { value: "67%", label: "Win rate", color: "text-[#34D399]" },
  ];

  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold text-[#F0EEFF]">Pipeline — Q4 2025</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {columns.map((col) => (
          <div key={col.label} className="w-[130px] shrink-0">
            <div className={cx("mb-1.5 text-[9px]", col.color)}>{col.label}</div>
            {col.deals.map((deal) => (
              <div key={deal.name} className="mb-1.5 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-2">
                <div className="text-[10px] text-[#F0EEFF]">{deal.name}</div>
                <div className="text-[9px] text-[#6B678E]">{deal.meta}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex gap-5 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-2.5">
        {totals.map((total) => (
          <div key={total.label}>
            <div className={cx("text-[18px] font-bold", total.color)}>{total.value}</div>
            <div className="text-[10px] text-[#6B678E]">{total.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const kpis = [
    { value: "89%", label: "SLA compliance", color: "text-[#34D399]" },
    { value: "12", label: "Overdue critical", color: "text-[#F43F5E]" },
    { value: "142", label: "Actions open", color: "text-[#818CF8]" },
  ];
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendHeights = [40, 55, 45, 70, 60, 80, 100];
  const owners = [
    { name: "Sandeep B.", pct: 85, color: "#34D399" },
    { name: "Priya K.", pct: 72, color: "#818CF8" },
    { name: "Raj M.", pct: 48, color: "#F43F5E" },
  ];

  return (
    <div>
      <div className="mb-2.5 grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-3">
            <div className={cx("text-[20px] font-bold", kpi.color)}>{kpi.value}</div>
            <div className="text-[9px] text-[#6B678E]">{kpi.label}</div>
          </div>
        ))}
      </div>
      <div className="mb-2.5 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3">
        <div className="mb-2 text-[10px] text-[#6B678E]">Monthly trend — closed actions</div>
        <div className="flex h-[50px] items-end gap-1">
          {trendHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px] bg-[linear-gradient(to_top,#4F46E5,#818CF8)] opacity-70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between">
          {months.map((month) => (
            <span key={month} className="text-[9px] text-[#6B678E]">
              {month}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-2.5">
        <div className="mb-1.5 text-[10px] text-[#6B678E]">Owner accountability</div>
        <div className="flex flex-col gap-1.5">
          {owners.map((owner) => (
            <div key={owner.name} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-[70px] text-[#A8A4CC]">{owner.name}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                <div className="h-full rounded-full" style={{ width: `${owner.pct}%`, background: owner.color }} />
              </div>
              <span style={{ color: owner.color }}>{owner.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VISUALS: Record<TabKey, () => ReactNode> = {
  actions: ActionsVisual,
  rfp: RfpVisual,
  library: LibraryVisual,
  crm: CrmVisual,
  analytics: AnalyticsVisual,
};

/* =========================================================
   FEATURES
========================================================= */

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("actions");
  const tabsRef = useFadeUp<HTMLDivElement>();
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  const panel = FEATURE_PANELS[activeTab];
  const Visual = VISUALS[activeTab];

  return (
    <section className="relative z-10 bg-[linear-gradient(180deg,transparent,rgba(79,70,229,0.04),transparent)] px-[5%] py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-16 max-w-[640px] text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">Platform capabilities</p>
          <h2 ref={titleRef} className="my-4 text-[clamp(32px,4vw,52px)] leading-[1.15] font-extrabold text-white">
            Everything your team needs,
            <br />
            nothing they don&apos;t
          </h2>
          <p className="text-[18px] leading-[1.7] text-[#A8A4CC]">
            Five deeply integrated modules that replace your entire toolchain.
          </p>
        </div>

        <div ref={tabsRef} className="mb-14 flex flex-wrap justify-center gap-2">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                "rounded-full border px-5 py-2.5 text-[14px] font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "border-transparent bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                  : "border-[rgba(255,255,255,0.13)] text-[#A8A4CC] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F0EEFF]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div key={activeTab} className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <FeatureText panel={panel} />
          <div className="relative min-h-[340px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.13)] bg-[rgba(255,255,255,0.04)] p-6">
            <Visual />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureText({ panel }: { panel: (typeof FEATURE_PANELS)[TabKey] }) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">{panel.module}</p>
      <h2 ref={titleRef} className="my-4 text-[clamp(26px,3vw,38px)] leading-[1.15] font-bold text-white">
        {panel.title}
      </h2>
      <p className="mb-7 text-[17px] leading-[1.75] text-[#A8A4CC]">{panel.desc}</p>
      <ul className="flex flex-col gap-3.5">
        {panel.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3 text-[15px] text-[#F0EEFF]">
            <span aria-hidden className="mt-0.5 shrink-0 text-[14px] text-[#818CF8]">
              →
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================
   TECH STACK
========================================================= */

function TechSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative z-10 bg-[rgba(255,255,255,0.01)] px-[5%] py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          eyebrow="Engineering"
          title={
            <>
              Built on a modern,
              <br />
              production-grade stack
            </>
          }
          sub="Every technology chosen for a reason — scalability, developer velocity, and enterprise security."
        />
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_CARDS.map((tech) => (
            <div
              key={tech.name}
              className="rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-5 py-6  hover:-translate-y-1 hover:border-[#6366F1] hover:bg-[rgba(79,70,229,0.07)]"
            >
              <div className="mb-3 text-[28px]">{tech.icon}</div>
              <div className="mb-1 text-[15px] font-semibold text-white">{tech.name}</div>
              <p className="text-[12px] leading-[1.5] text-[#6B678E]">{tech.desc}</p>
              <span className="mt-2.5 inline-block rounded-full border border-[rgba(79,70,229,0.25)] bg-[rgba(79,70,229,0.12)] px-2.5 py-[3px] text-[10px] text-[#818CF8]">
                {tech.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   APPROACH
========================================================= */

function ApproachSection() {
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 px-[5%] py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader eyebrow="How we built it" title="Our delivery approach" />
        <div ref={gridRef} className="grid grid-cols-1 gap-px bg-[rgba(255,255,255,0.07)] sm:grid-cols-2 lg:grid-cols-4">
          {APPROACH_CARDS.map((card) => (
            <div key={card.num} className="group relative overflow-hidden bg-[#0D0B1F] p-10  hover:bg-[rgba(79,70,229,0.04)]">
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-[linear-gradient(90deg,transparent,#4F46E5,transparent)] transition-transform duration-300 group-hover:scale-x-100"
              />
              <div className="mb-5 text-[48px] leading-none font-extrabold text-[rgba(79,70,229,0.15)]">{card.num}</div>
              <span className="mb-2.5 text-[18px] font-bold text-white block">{card.title}</span>
              <p className="text-[14px] leading-[1.65] text-[#A8A4CC]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   OUTCOMES
========================================================= */

function OutcomesSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 24);

  return (
    <section className="relative z-10 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(79,70,229,0.1)_0%,transparent_60%)] px-[5%] py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          eyebrow="Outcomes"
          title="What ActionPulse delivers"
          sub="Measurable impact across the teams that use it daily."
        />
        <div ref={gridRef} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {OUTCOME_CARDS.map((outcome) => (
            <div
              key={outcome.title}
              className="rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-9  hover:-translate-y-1.5 hover:border-[rgba(79,70,229,0.4)]"
            >
              <div className={cx("mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-[22px]", outcome.iconBg)}>
                {outcome.icon}
              </div>
              <span className="mb-3 text-[20px] font-bold text-white block">{outcome.title}</span>
              <p className="text-[14px] leading-[1.65] text-[#A8A4CC]">{outcome.desc}</p>
              <div className="mt-5 border-t border-[rgba(255,255,255,0.07)] pt-5">
                <div className={cx("bg-clip-text text-[36px] leading-none font-extrabold text-transparent", outcome.metricGradient)}>
                  {outcome.metric}
                </div>
                <div className="mt-1 text-[12px] text-[#6B678E]">{outcome.metricSub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SCREEN GALLERY
========================================================= */

function GalleryFrame({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div className="w-[380px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.13)] bg-[#13112A] transition-all duration-300 hover:scale-[1.02] hover:border-[rgba(79,70,229,0.4)]">
      <div className="flex items-center gap-1.5 border-b border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[#FF5F56]" />
        <span className="h-2 w-2 rounded-full bg-[#FFBD2E]" />
        <span className="h-2 w-2 rounded-full bg-[#27C93F]" />
        <span className="ml-2 text-[10px] text-[#6B678E]">{path}</span>
      </div>
      <div className="relative min-h-[220px] p-4">{children}</div>
    </div>
  );
}

function GalleryScreens() {
  const dashboardStats = [
    { value: "12", label: "Overdue critical", color: "text-[#F43F5E]", bg: "bg-[rgba(244,63,94,0.08)] border-[rgba(244,63,94,0.2)]" },
    { value: "89%", label: "SLA compliance", color: "text-[#34D399]", bg: "bg-[rgba(52,211,153,0.08)] border-[rgba(52,211,153,0.2)]" },
    { value: "142", label: "Open actions", color: "text-[#818CF8]", bg: "bg-[rgba(79,70,229,0.08)] border-[rgba(79,70,229,0.2)]" },
    { value: "7", label: "RFPs active", color: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.2)]" },
  ];

  const rfpList = [
    { title: "Cloud Infrastructure Tender", status: "In Progress", tone: "amber" as Tone, meta: "Gov Client · £480K · Due 14 Dec · 7 sections", color: "#F59E0B" },
    { title: "Retail Platform Modernisation", status: "In Review", tone: "blue" as Tone, meta: "Retail Co · £220K · Due 21 Dec", color: "#818CF8" },
    { title: "Fintech API Integration", status: "Won ✓", tone: "green" as Tone, meta: "Fintech Ltd · £95K · Submitted", color: "#34D399" },
  ];

  const kanbanColumns = [
    { label: "OPEN · 5", color: "text-[#6B678E]", items: [{ text: "Cloud audit", tone: "rose" as const }, { text: "Budget review", tone: "plain" as const }] },
    { label: "IN PROGRESS · 4", color: "text-[#F59E0B]", items: [{ text: "API security", tone: "amber" as const }, { text: "Docs update", tone: "plain" as const }] },
    { label: "CLOSED · 12", color: "text-[#34D399]", items: [{ text: "Onboarding", tone: "green" as const }, { text: "Risk log", tone: "green-soft" as const }] },
  ];

  const kanbanToneClasses = {
    rose: "bg-[rgba(244,63,94,0.1)] border-[rgba(244,63,94,0.2)] text-[#F0EEFF]",
    amber: "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)] text-[#F0EEFF]",
    green: "bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)] text-[#F0EEFF]",
    "green-soft": "bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.1)] text-[#A8A4CC]",
    plain: "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)] text-[#A8A4CC]",
  };

  const libraryBlocks = [
    { title: "Company Overview 2025", meta: "Company Profile · 12 uses", color: "#4F46E5" },
    { title: "Enterprise Rate Card", meta: "Rate Cards · 8 uses · table slide", color: "#059669" },
    { title: "QA & Testing Methodology", meta: "QA Approach · 5 uses", color: "#84CC16" },
  ];

  const trackRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 px-[5%] py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 max-w-[640px]">
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">Screens</p>
          <h2 className="my-4 text-[clamp(26px,3vw,40px)] leading-[1.15] font-extrabold text-white">Every screen, purpose-built</h2>
        </div>

        <div ref={trackRef} className="ap-gallery-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6">
          <GalleryFrame path="/dashboard">
            <div className="grid grid-cols-2 gap-2">
              {dashboardStats.map((stat) => (
                <div key={stat.label} className={cx("rounded-[8px] border p-3", stat.bg)}>
                  <div className={cx("text-[16px] font-bold", stat.color)}>{stat.value}</div>
                  <div className="text-[9px] text-[#6B678E]">{stat.label}</div>
                </div>
              ))}
            </div>
          </GalleryFrame>

          <GalleryFrame path="/rfp">
            <div className="mb-2.5 text-[11px] font-semibold text-[#F0EEFF]">RFP Workspace</div>
            {rfpList.map((rfp) => (
              <MiniCard key={rfp.title} borderColor={rfp.color}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#F0EEFF]">{rfp.title}</span>
                  <Pill tone={rfp.tone}>{rfp.status}</Pill>
                </div>
                <div className="mt-0.5 text-[9px] text-[#6B678E]">{rfp.meta}</div>
              </MiniCard>
            ))}
          </GalleryFrame>

          <GalleryFrame path="/board">
            <div className="mb-2.5 text-[11px] font-semibold text-[#F0EEFF]">Kanban Board</div>
            <div className="flex h-[170px] gap-2">
              {kanbanColumns.map((col) => (
                <div key={col.label} className="flex-1 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-2">
                  <div className={cx("mb-1.5 text-[9px]", col.color)}>{col.label}</div>
                  {col.items.map((item) => (
                    <div key={item.text} className={cx("mb-1.5 rounded-[6px] border p-1.5 text-[9px]", kanbanToneClasses[item.tone])}>
                      {item.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </GalleryFrame>

          <GalleryFrame path="/rfp-editor">
            <div className="mb-2.5 flex items-center gap-2 text-[10px] text-[#A8A4CC]">
              ← RFPs <span className="text-[#6B678E]">›</span> Technical Approach
              <span className="rounded-full bg-[rgba(245,158,11,0.15)] px-2 py-0.5 text-[9px] text-[#F59E0B]">Unsaved</span>
            </div>
            <div className="min-h-[120px] rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-2.5 text-[10px] leading-[1.6] text-[#A8A4CC]">
              <span className="font-semibold text-white">Our technical approach</span>
              <br />
              <br />
              We propose a <span className="text-[#818CF8]">microservices architecture</span> deployed on
              AWS EKS with auto-scaling to handle variable government workloads...
              <br />
              <br />
              <span className="text-[#6B678E] italic">142 words · ~1 slide in export</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <span className="h-2 w-2 rounded-full bg-[#4F46E5]" />
                <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.1)]" />
              </div>
              <div className="rounded-[6px] bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] px-2.5 py-1 text-[9px] text-white">Save section</div>
            </div>
          </GalleryFrame>

          <GalleryFrame path="/library">
            <div className="mb-2.5 text-[11px] font-semibold text-[#F0EEFF]">Content Library</div>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[rgba(79,70,229,0.2)] px-2 py-[3px] text-[9px] text-[#818CF8]">28 blocks</span>
              <span className="rounded-full bg-[rgba(52,211,153,0.1)] px-2 py-[3px] text-[9px] text-[#34D399]">19 approved</span>
              <span className="rounded-full bg-[rgba(245,158,11,0.1)] px-2 py-[3px] text-[9px] text-[#F59E0B]">9 drafts</span>
            </div>
            {libraryBlocks.map((block) => (
              <MiniCard key={block.title} borderColor={block.color}>
                <div className="text-[10px] text-[#F0EEFF]">{block.title}</div>
                <div className="text-[9px] text-[#6B678E]">{block.meta}</div>
              </MiniCard>
            ))}
          </GalleryFrame>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CTA
========================================================= */

function CtaSection() {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!line1Ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set([line1Ref.current, line2Ref.current], { opacity: 1, y: 0 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(line1Ref.current!, {
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
            scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
          }),
      });

      gsap.from(line2Ref.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5,
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
      });
    });

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 overflow-hidden px-[5%] py-[120px] text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(79,70,229,0.15)_0%,transparent_65%)]"
      />
      <div className="relative mx-auto max-w-[720px]">
        <p className="inline-block text-[11px] font-medium tracking-[0.18em] text-[#818CF8] uppercase">Ready to build yours?</p>
        <h2 className="my-4 text-[clamp(36px,5vw,64px)] leading-[1.15] font-extrabold text-white">
          <span ref={line1Ref} className="block">
            Let&apos;s build your
          </span>
          <span
            ref={line2Ref}
            className="block bg-[linear-gradient(135deg,#818CF8,#7C3AED,#F43F5E)] bg-clip-text text-transparent"
          >
            platform next
          </span>
        </h2>
        <p className="mx-auto mb-12 max-w-[560px] text-[19px] text-[#A8A4CC]">
          ActionPulse proves what Oxytal builds — bespoke enterprise platforms that replace entire
          SaaS toolchains. If your team needs something this specific, we should talk.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] px-9 py-4 text-[17px] font-semibold text-white shadow-[0_0_32px_rgba(79,70,229,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_40px_rgba(79,70,229,0.55)]"
          >
            Start a conversation ↗
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.13)] px-9 py-4 text-[17px] font-semibold text-[#F0EEFF] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            More work →
          </Link>
        </div>
        <div className="mt-6 text-[13px] text-[#6B678E]">
          Ballydeague, Cork, Ireland ·{" "}
          <a href="tel:353866034988" className="text-[#818CF8]">
            +353 86 603 4988
          </a>{" "}
          ·{" "}
          <a href="mailto:info@oxytal.com" className="text-[#818CF8]">
            info@oxytal.com
          </a>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ActionPulseCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#0D0B1F] text-[#F0EEFF]" data-nav-contrast="dark">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")",
        }}
      />

      <Hero />
      <Ticker />
      <ProblemSolutionSection />
      <FeaturesSection />
      <TechSection />
      <ApproachSection />
      <OutcomesSection />
      <GalleryScreens />
      <CtaSection />
    </div>
  );
}
