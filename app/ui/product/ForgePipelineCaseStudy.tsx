"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useListStagger } from "./useReveal";
import CountUpNumber from "./CountUpNumber";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `ForgePipelineCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/forge-oxytal-casestudy.html`. Same treatment as
 * its siblings `SamVaultCaseStudy`/`ActionPulseCaseStudy`: no Contentful
 * wiring, keeps the reference's own colour identity (`--dark` `#06061A`,
 * `--indigo` `#6366F1`, `--violet` `#8B5CF6`) rather than the site's
 * per-page `themeColor` accent, and typography stays the site's own
 * inherited `Poppins` instead of the reference's Google Fonts (`Inter`/
 * `JetBrains Mono`). Unlike its siblings, the reference itself alternates
 * dark sections (hero, stats bar, pipeline, integrations, results, CTA)
 * with light ones (about, features, approach, tech, explore) rather than
 * committing to one palette throughout — that alternation is kept as-is,
 * per section, rather than flattened to a single background.
 *
 * The reference's own `<style>` block defines `.nav`/`footer` rules, but
 * neither actually appears in its `<body>` — there's nothing to drop
 * here the way `SamVaultCaseStudy`/`ActionPulseCaseStudy` dropped their
 * reference's real nav/footer markup; the app's global `Navbar` (and
 * site footer) wrap this page exactly as they do every other page.
 *
 * Shares `useSplitReveal`/`useListStagger` (from `./useReveal`) and
 * `CountUpNumber` with its siblings. Every section heading gets the
 * word-split reveal; every card grid where the reference tags each card
 * with its own `.reveal` (features/agents/approach/integrations/tech/
 * results) staggers in via `useListStagger`. The two interactive bits —
 * the agent grid's click-to-expand detail panel and the pipeline demo's
 * auto-cycling step list — are plain `useState`, matching the
 * reference's own vanilla-JS behaviour (including starting on Agent 01
 * expanded, and the pipeline demo starting at step index 3, both of
 * which the reference sets before its own interval/click-handlers ever
 * fire). The hero's `SDLC`/CTA's gradient text and the pipeline demo's
 * edge shimmer keep running continuously via new `globals.css` keyframes
 * (`text-shimmer`/`shim-line`/`step-glow`) rather than GSAP, same
 * reasoning as `float`/`glow-pulse` there.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/forge-oxytal-casestudy.html
========================================================= */

const HERO_TAGS: { label: string; dot: string }[] = [
  { label: "Live at forgepipeline.ai", dot: "#4ADE80" },
  { label: "Oxytal AI Lab — 2024", dot: "#A5B4FC" },
  { label: "8 AI agents", dot: "#67E8F9" },
];

const STATS: { target: number; suffix: string; label: string; color: string }[] = [
  { target: 8, suffix: "", label: "AI agents in pipeline", color: "#A5B4FC" },
  { target: 14, suffix: "min", label: "Requirement to PR", color: "#4ADE80" },
  { target: 7, suffix: "", label: "Stories auto-extracted", color: "#FFFFFF" },
  { target: 100, suffix: "%", label: "Audit trail coverage", color: "#F472B6" },
];

const PIPELINE_STEPS: { icon: string; name: string; detail: string }[] = [
  { icon: "📋", name: "Requirements Agent", detail: "7 stories → Jira · 2 clarifications" },
  { icon: "🏗", name: "Design Agent", detail: "ADR · 5 components · 0 migrations" },
  { icon: "💻", name: "Development Agent", detail: "8 files committed · PR #3 opened" },
  { icon: "🔍", name: "Code Review Agent", detail: "0 critical · 2 warnings · reviewing…" },
  { icon: "🧪", name: "Testing Agent", detail: "Queued" },
  { icon: "🚀", name: "Deploy Agent", detail: "Awaiting gate approval" },
];

const FEATURES: { icon: string; iconBg: string; title: string; desc: string }[] = [
  {
    icon: "🔒",
    iconBg: "#EEF2FF",
    title: "Human-approved gates",
    desc: "Critical checkpoints require real sign-off before the pipeline proceeds. Architecture review, code review, and deployment — never fully automated unless you choose it.",
  },
  {
    icon: "🔍",
    iconBg: "#F0FDF4",
    title: "Full audit trail",
    desc: "Every decision, handoff, and generated artefact is logged with timestamps, agent version, and token cost. Know exactly what happened and why.",
  },
  {
    icon: "⚡",
    iconBg: "#EEF2FF",
    title: "Plugs into your stack",
    desc: "Native integrations with Confluence, Jira, GitHub, Vercel, Slack, SharePoint, and the Anthropic Claude API. Works with your existing tools, not instead of them.",
  },
  {
    icon: "🎛",
    iconBg: "#FFF7ED",
    title: "Fully configurable",
    desc: "Every agent prompt is customisable per project. Branch naming, test coverage targets, code style, documentation level — all configurable from the UI.",
  },
  {
    icon: "📊",
    iconBg: "#FDF4FF",
    title: "Real cost visibility",
    desc: "See exactly how many tokens each pipeline run costs. Per-agent breakdown, per-project totals, and trend data so you stay in control of AI spend.",
  },
  {
    icon: "🔄",
    iconBg: "#F0FDF4",
    title: "Resume from anywhere",
    desc: "Pipeline failed at code review? Fix the issue and resume from that exact stage — no need to re-run requirements extraction or design from scratch.",
  },
];

const AGENTS: { num: string; icon: string; name: string; shortDesc: string; detailDesc: string; tags: string[] }[] = [
  {
    num: "Agent 01",
    icon: "📋",
    name: "Requirements",
    shortDesc: "Confluence → structured Jira stories",
    detailDesc:
      "Reads Confluence pages and extracts every user story — structured, estimated with Fibonacci points, and pushed directly to Jira. Flags ambiguities before a single line of code is written.",
    tags: ["Confluence integration", "Jira sync", "Story estimation", "Auto-clarification"],
  },
  {
    num: "Agent 02",
    icon: "🏗",
    name: "Design",
    shortDesc: "ADR, components, API contracts",
    detailDesc:
      "Produces a complete Architecture Decision Record: component breakdown, API contracts, database schema, TypeScript interfaces, and a gate recommendation. Generates UI mockup, ER diagram, and API documentation.",
    tags: ["ADR generation", "UI mockup", "ER diagram", "API docs", "Gate recommendation"],
  },
  {
    num: "Agent 03",
    icon: "💻",
    name: "Development",
    shortDesc: "AI code generation per file",
    detailDesc:
      "Generates production-ready code file by file, using the existing codebase as context. Creates a manifest plan first, then generates each file individually with type-consistent interfaces. Opens a PR on GitHub.",
    tags: ["Per-file generation", "Codebase context", "Import validation", "GitHub PR creation"],
  },
  {
    num: "Agent 04",
    icon: "🔍",
    name: "Code Review",
    shortDesc: "Security and quality analysis",
    detailDesc:
      "Scans the PR diff for security vulnerabilities, missing validation, and quality issues using Claude Opus. Produces a structured report with CRITICAL/HIGH/WARNING/INFO findings and a gate decision.",
    tags: ["SQL injection detection", "Auth bypass checks", "Spec conformance", "Severity tiers"],
  },
  {
    num: "Agent 05",
    icon: "🧪",
    name: "Testing",
    shortDesc: "Auto test generation and execution",
    detailDesc:
      "Generates a comprehensive test plan from acceptance criteria and executes it against the deployed preview URL — covering functional, accessibility, performance, and security test categories.",
    tags: ["AC-driven testing", "WCAG 2.1 AA", "Core Web Vitals", "Regression tests"],
  },
  {
    num: "Agent 06",
    icon: "🔧",
    name: "Defect Fix",
    shortDesc: "Reads failures, generates fixes",
    detailDesc:
      "Reads failing test results, identifies root causes, and generates targeted fixes committed directly to the PR branch. Confidence-scored and never touches code outside the failing scope.",
    tags: ["Root cause analysis", "Minimal blast radius", "Confidence scoring", "Auto-commit fix"],
  },
  {
    num: "Agent 07",
    icon: "🚀",
    name: "Deploy",
    shortDesc: "CI/CD orchestration + Vercel",
    detailDesc:
      "Triggers your CI/CD pipeline, monitors the build, and deploys to Vercel preview or production. Alerts on failure via Slack and supports rollback on degraded health signals.",
    tags: ["GitHub Actions", "Vercel deployment", "Slack alerts", "Rollback support"],
  },
  {
    num: "Agent 08",
    icon: "📊",
    name: "Monitoring",
    shortDesc: "Post-deploy health and alerts",
    detailDesc:
      "Watches the deployment for 10 minutes post-launch — error rates, p95 latency, Core Web Vitals. Raises a health summary with Healthy / Degraded / Critical status and recommended action.",
    tags: ["Error rate monitoring", "p95 latency", "Core Web Vitals", "Health summary"],
  },
];

const APPROACH_STEPS: { num: string; title: string; desc: string }[] = [
  {
    num: "01",
    title: "Ideation & Discovery",
    desc: "Mapped the SDLC coordination problem across real engineering teams. Defined the 8 agent stages and the gate approval model.",
  },
  {
    num: "02",
    title: "Architecture & Design",
    desc: "Designed the pipeline orchestration engine, credential flow, context passing between agents, and the drag-and-drop canvas UI.",
  },
  {
    num: "03",
    title: "Build & Integration",
    desc: "Built all 8 agents with real API integrations — Confluence, Jira, GitHub, Vercel, Slack, SharePoint — and a full audit trail at every step.",
  },
  {
    num: "04",
    title: "Live & Scaling",
    desc: "Deployed at forgepipeline.ai. Actively onboarding early-access customers and iterating based on real pipeline runs.",
  },
];

const INTEGRATIONS: { icon: string; iconBg: string; name: string; type: string }[] = [
  { icon: "📘", iconBg: "rgba(37,99,235,0.15)", name: "Confluence", type: "Requirements source" },
  { icon: "📋", iconBg: "rgba(37,99,235,0.15)", name: "Jira", type: "Story management" },
  { icon: "🐙", iconBg: "rgba(34,197,94,0.1)", name: "GitHub", type: "Code & PR management" },
  { icon: "▲", iconBg: "rgba(0,0,0,0.2)", name: "Vercel", type: "Deployment platform" },
  { icon: "💬", iconBg: "rgba(249,115,22,0.1)", name: "Slack", type: "Notifications & alerts" },
  { icon: "📁", iconBg: "rgba(6,182,212,0.1)", name: "SharePoint", type: "Document management" },
  { icon: "✦", iconBg: "rgba(217,119,6,0.1)", name: "Anthropic Claude", type: "AI engine" },
  { icon: "🔌", iconBg: "rgba(99,102,241,0.1)", name: "Custom agents", type: "Extensible platform" },
];

const TECH_CARDS: { name: string; role: string }[] = [
  { name: "Next.js 15", role: "App Router framework" },
  { name: "TypeScript", role: "Strict type safety" },
  { name: "MySQL 8", role: "Relational database" },
  { name: "Anthropic API", role: "Claude AI engine" },
  { name: "Tailwind CSS", role: "UI styling" },
  { name: "GitHub API", role: "Code management" },
  { name: "Vercel API", role: "Deploy automation" },
  { name: "Confluence API", role: "Requirements source" },
  { name: "Microsoft Graph", role: "SharePoint connector" },
  { name: "Jira REST API", role: "Story management" },
];

const RESULTS: { topGradient: string; value: string; suffix: string; color: string; label: string; desc: string }[] = [
  {
    topGradient: "linear-gradient(90deg,#6366F1,#8B5CF6)",
    value: "14",
    suffix: "min",
    color: "#A5B4FC",
    label: "Requirement to pull request",
    desc: "From a single Confluence page to an open GitHub PR with reviewed, committed code — in one automated pipeline run.",
  },
  {
    topGradient: "linear-gradient(90deg,#22C55E,#06B6D4)",
    value: "0",
    suffix: "",
    color: "#4ADE80",
    label: "Critical security findings",
    desc: "Code Review Agent powered by Claude Opus analyses every PR for SQL injection, auth bypass, hardcoded secrets, and OWASP vulnerabilities.",
  },
  {
    topGradient: "linear-gradient(90deg,#8B5CF6,#EC4899)",
    value: "100",
    suffix: "%",
    color: "#C084FC",
    label: "Audit trail coverage",
    desc: "Every agent decision, token cost, and handoff is logged and traceable. Every critical stage requires explicit human approval before proceeding.",
  },
];

// The reference's "Explore More" cards deep-link to other Oxytal client
// case studies (Skolrup, George Dickel) that don't exist as pages in
// this app — all three tiles route to `/work` instead of inventing
// dead routes, differing only in their own display content.
const EXPLORE_CARDS: { gradient: string; icon: string; title: string; linkLabel: string }[] = [
  { gradient: "linear-gradient(135deg,#1E3A5F,#2563EB)", icon: "🎓", title: "Skolrup", linkLabel: "Case Study →" },
  { gradient: "linear-gradient(135deg,#422006,#92400E)", icon: "🥃", title: "George Dickel", linkLabel: "Case Study →" },
  { gradient: "linear-gradient(135deg,#06061A,#111135)", icon: "→", title: "View All Projects", linkLabel: "See full portfolio →" },
];

const PARTICLE_COLORS = ["99,102,241", "139,92,246"];

/* =========================================================
   SHARED PIECES
========================================================= */

function SectionIntro({
  label,
  title,
  sub,
  dark,
  titleSizeClass = "text-[clamp(28px,4vw,44px)]",
}: {
  label: string;
  title: ReactNode;
  sub?: string;
  dark?: boolean;
  titleSizeClass?: string;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div>
      <div
        className={cx(
          "mb-3.5 flex items-center gap-2 text-[12px] font-semibold tracking-[0.1em] uppercase",
          dark ? "text-[#6366F1]" : "text-[#6366F1]"
        )}
      >
        <span aria-hidden className="h-px w-5 bg-[#6366F1]" />
        {label}
      </div>
      <h2
        ref={titleRef}
        className={cx(
          titleSizeClass,
          "mb-4 leading-[1.1] font-extrabold tracking-[-1.5px]",
          dark ? "text-white" : "text-[#111111]"
        )}
      >
        {title}
      </h2>
      {sub && <p className={cx("max-w-[540px] text-[17px] leading-[1.7]", dark ? "text-[rgba(248,248,255,0.5)]" : "text-[#555555]")}>{sub}</p>}
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function HeroParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        size: 1 + ((i * 37) % 20) / 10,
        left: (i * 23 + 5) % 100,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        opacity: 0.2 + ((i * 13) % 50) / 100,
        duration: 5 + ((i * 11) % 70) / 10,
        delay: -((i * 8) % 15),
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-float-up absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: 0,
            background: `rgba(${p.color},${p.opacity})`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineARef = useRef<HTMLSpanElement>(null);
  const gradientRef = useRef<HTMLSpanElement>(null);
  const lineBRef = useRef<HTMLSpanElement>(null);
  const crumbRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!lineARef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set([lineARef.current, gradientRef.current, lineBRef.current], { opacity: 1, y: 0 });
      return;
    }

    let splitA: SplitText | undefined;
    let splitB: SplitText | undefined;

    const ctx = gsap.context(() => {
      splitA = SplitText.create(lineARef.current!, {
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

      gsap.from(gradientRef.current, { opacity: 0, y: 20, duration: 0.7, ease: "power2.out", delay: 0.2 });

      splitB = SplitText.create(lineBRef.current!, {
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
            delay: 0.35,
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      splitA?.revert();
      splitB?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const targets = [crumbRef.current, subRef.current, metaRef.current, ctasRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(crumbRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(subRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(metaRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.75)
        .from(ctasRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.9);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#06061A] px-6 pt-[120px] pb-20 text-center"
    >
      <div
        aria-hidden
        className="animate-grid-drift pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] [background-size:50px_50px] [animation-duration:25s]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]"
      />
      <HeroParticles />

      <div className="relative z-10 max-w-5xl">
        <div
          ref={crumbRef}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.1)] px-4 py-1.5 text-[12px] font-semibold tracking-[0.06em] text-[rgba(165,180,252,0.9)] uppercase"
        >
          <Link href="/work" className="text-[rgba(165,180,252,0.6)] transition-colors hover:text-[rgba(165,180,252,0.9)]">
            Work
          </Link>
          <span className="opacity-40">/</span> ForgePipeline
        </div>

        <h1 className="mb-5 text-[clamp(44px,7vw,82px)] leading-[1] font-black tracking-[-3px] text-white">
          <span ref={lineARef} className="inline">
            Autonomous{" "}
          </span>
          <span
            ref={gradientRef}
            className="animate-text-shimmer inline-block bg-[linear-gradient(90deg,#A5B4FC,#818CF8,#C084FC,#67E8F9)] bg-clip-text text-transparent [background-size:200%_100%]"
          >
            SDLC
          </span>
          <br />
          <span ref={lineBRef} className="inline">
            from Oxytal AI Lab
          </span>
        </h1>

        <p ref={subRef} className="mx-auto mb-9 max-w-[600px] text-[clamp(16px,2.2vw,20px)] leading-[1.7] text-[rgba(248,248,255,0.5)]">
          An AI-powered pipeline platform that takes requirements from Confluence all the way to a
          reviewed GitHub PR — automatically, auditably, with 8 specialised agents.
        </p>

        <div ref={metaRef} className="flex flex-wrap items-center justify-center gap-6">
          {HERO_TAGS.map((tag) => (
            <div key={tag.label} className="flex items-center gap-1.5 text-[13px] text-[rgba(248,248,255,0.28)]">
              <span aria-hidden className="h-[5px] w-[5px] rounded-full" style={{ background: tag.dot }} />
              {tag.label}
            </div>
          ))}
        </div>

        <div ref={ctasRef} className="mt-8 flex flex-wrap justify-center gap-2.5">
          <a
            href="https://forgepipeline.ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[9px] bg-[#6366F1] px-6.5 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4F46E5] hover:shadow-[0_8px_24px_rgba(99,102,241,0.3)]"
          >
            Visit forgepipeline.ai ↗
          </a>
          <a
            href="#pipeline"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[rgba(99,102,241,0.2)] px-6.5 py-3.5 text-[15px] font-medium text-white transition-all duration-200 hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.08)]"
          >
            Explore the pipeline
          </a>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STATS BAR
========================================================= */

function StatsBar() {
  return (
    <div className="relative z-10 border-y border-[rgba(255,255,255,0.06)] bg-[#0D0D28] px-6 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 text-center sm:grid-cols-4 sm:gap-0">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={cx(
              "px-6 pb-5 sm:pb-0",
              i < STATS.length - 1 && "border-b border-[rgba(255,255,255,0.05)] sm:border-r sm:border-b-0",
              i % 2 === 1 && "sm:border-r"
            )}
          >
            <CountUpNumber
              target={stat.target}
              suffix={stat.suffix}
              className="text-[36px] leading-none font-black tracking-[-1px]"
            />
            <div className="mt-1.5 text-[12px] tracking-[0.08em] text-[rgba(248,248,255,0.28)] uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   ABOUT
========================================================= */

function PipelineDemo() {
  const [active, setActive] = useState(3);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % PIPELINE_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[rgba(99,102,241,0.2)] bg-[#06061A] p-7">
      <div className="mb-3.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-[rgba(248,248,255,0.28)] uppercase">
        <span aria-hidden className="animate-dot-pulse h-[5px] w-[5px] rounded-full bg-[#22C55E]" />
        Pipeline · RUN-003 · In progress
      </div>
      <div className="flex flex-col gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const status = i < active ? "done" : i === active ? "run" : "queued";
          const opacity = status === "queued" ? (i === active + 1 ? 0.4 : 0.3) : 1;

          return (
            <div
              key={step.name}
              style={{ opacity }}
              className={cx(
                "flex items-center gap-2.5 rounded-[9px] border px-3 py-2.5 ",
                status === "done" && "border-[rgba(34,197,94,0.25)] bg-[rgba(255,255,255,0.02)]",
                status === "run" && "animate-step-glow border-[rgba(99,102,241,0.45)] bg-[rgba(99,102,241,0.06)]",
                status === "queued" && "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
              )}
            >
              <div
                className={cx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[13px]",
                  status === "done" && "bg-[rgba(34,197,94,0.15)]",
                  status === "run" && "bg-[rgba(99,102,241,0.2)]",
                  status === "queued" && "bg-[rgba(255,255,255,0.05)]"
                )}
              >
                {step.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[rgba(255,255,255,0.82)]">{step.name}</div>
                <div className="mt-0.5 text-[10px] text-[rgba(248,248,255,0.28)]">{step.detail}</div>
              </div>
              <div className="ml-auto shrink-0">
                {status === "done" ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(34,197,94,0.18)]">
                    <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
                      <path d="M1.5 4.5l2 2L7.5 2" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : status === "run" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-[rgba(99,102,241,0.3)] border-t-[#6366F1]" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.12)]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <span
        aria-hidden
        className="animate-shim-line absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,transparent,#6366F1,#8B5CF6,transparent)] [background-size:200%_100%]"
      />
    </div>
  );
}

function AboutSection() {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <section className="relative z-10 bg-white px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="mb-3.5 flex items-center gap-2 text-[12px] font-semibold tracking-[0.1em] text-[#6366F1] uppercase">
            <span aria-hidden className="h-px w-5 bg-[#6366F1]" />
            About the product
          </div>
          <h2 ref={titleRef} className="mb-5 text-[clamp(32px,4vw,48px)] leading-[1.05] font-black tracking-[-2px] text-[#111111]">
            The coordination problem, solved.
          </h2>
          <p className="mb-4 text-[16px] leading-[1.8] text-[#444444]">
            Every software team runs the same cycle — requirements, architecture, development,
            review, testing, deployment, monitoring. The steps are well understood. The delays are
            not caused by the engineering. They&apos;re caused by the coordination <em className="not-italic font-semibold">around</em> it.
          </p>
          <p className="mb-4 text-[16px] leading-[1.8] text-[#444444]">
            ForgePipeline is an AI platform built by Oxytal AI Lab that orchestrates the entire
            SDLC as a configurable, auditable pipeline. Each stage is handled by a specialised AI
            agent. Every handoff is logged. Every critical checkpoint requires human approval
            before proceeding.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#444444]">
            Not replacing developers. Making the boring 40% of their week disappear.
          </p>
        </div>
        <PipelineDemo />
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
    <section className="relative z-10 bg-[#F8F8FC] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          label="Key features"
          title={
            <>
              Built for engineering teams
              <br />
              that care about quality.
            </>
          }
          sub="Not just fast. Auditable, controllable, and transparent at every step of the way."
        />
        <div ref={gridRef} className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white p-7 hover:-translate-y-1 hover:border-[rgba(99,102,241,0.2)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.1)]"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[linear-gradient(90deg,#6366F1,#8B5CF6)] transition-transform duration-300 group-hover:scale-x-100"
              />
              <div
                className="mb-4.5 flex h-[46px] w-[46px] items-center justify-center rounded-xl text-[20px]"
                style={{ background: feature.iconBg }}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2.5 text-[16px] font-bold text-[#111111]">{feature.title}</h3>
              <p className="text-[14px] leading-[1.65] text-[#555555]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PIPELINE (AGENTS)
========================================================= */

function PipelineSection() {
  const [selected, setSelected] = useState(0);
  const gridRef = useListStagger<HTMLDivElement>("y", 20);
  const agent = AGENTS[selected];

  return (
    <section id="pipeline" className="relative z-10 bg-[#06061A] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          label="The pipeline"
          title={
            <>
              Eight agents. One pipeline.
              <br />
              Zero handoff delays.
            </>
          }
          sub="Click any agent to explore what it does and how it fits into the flow."
          dark
        />
        <div ref={gridRef} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {AGENTS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelected(i)}
              className={cx(
                "group relative overflow-hidden rounded-2xl border p-5 text-center  hover:-translate-y-1 hover:border-[rgba(99,102,241,0.2)]",
                selected === i
                  ? "border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.06)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]"
              )}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.06),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative mb-2.5 text-[10px] font-semibold tracking-[0.1em] text-[rgba(248,248,255,0.28)] uppercase">{item.num}</div>
              <span className="relative mb-2.5 block text-[24px]">{item.icon}</span>
              <div className="relative mb-1 text-[13px] font-bold text-white">{item.name}</div>
              <div className="relative text-[11px] leading-[1.5] text-[rgba(248,248,255,0.28)]">{item.shortDesc}</div>
            </button>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)] p-7">
          <h3 className="mb-2.5 text-[18px] font-bold text-white">{agent.name} Agent</h3>
          <p className="mb-4 text-[14px] leading-[1.7] text-[rgba(248,248,255,0.5)]">{agent.detailDesc}</p>
          <div className="flex flex-wrap gap-2">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.12)] px-3 py-1.5 text-[12px] font-medium text-[#A5B4FC]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   APPROACH
========================================================= */

function ApproachSection() {
  const stepsRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative z-10 bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          label="Our approach"
          title="How we built ForgePipeline."
          sub="From whiteboard to working pipeline in weeks, using the same agile methodology we apply across all Oxytal products."
        />
        <div ref={stepsRef} className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.3)_20%,rgba(99,102,241,0.3)_80%,transparent)] lg:block"
          />
          {APPROACH_STEPS.map((step) => (
            <div key={step.num} className="group relative px-4 text-center">
              <div className="relative z-10 mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(99,102,241,0.2)] bg-[#06061A] text-[16px] font-extrabold text-[#6366F1]  group-hover:border-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white">
                {step.num}
              </div>
              <div className="mb-2 text-[15px] font-bold text-[#111111]">{step.title}</div>
              <p className="text-[13px] leading-[1.6] text-[#555555]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   INTEGRATIONS
========================================================= */

function IntegrationsSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative z-10 bg-[#0D0D28] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          label="Integrations"
          title={
            <>
              Works with the tools
              <br />
              your team already uses.
            </>
          }
          sub="ForgePipeline connects to your existing ecosystem out of the box — no re-tooling required."
          dark
        />
        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5  hover:border-[rgba(99,102,241,0.2)] hover:bg-[rgba(99,102,241,0.05)]"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[16px]"
                style={{ background: item.iconBg }}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white">{item.name}</div>
                <div className="mt-0.5 text-[11px] text-[rgba(248,248,255,0.28)]">{item.type}</div>
              </div>
              <span aria-hidden className="animate-dot-pulse ml-auto h-[7px] w-[7px] shrink-0 rounded-full bg-[#22C55E]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECH STACK
========================================================= */

function TechSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative z-10 bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          label="Technology"
          title={
            <>
              Built on a modern,
              <br />
              production-grade stack.
            </>
          }
        />
        <div ref={gridRef} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TECH_CARDS.map((tech) => (
            <div
              key={tech.name}
              className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F8F8FC] px-4 py-5 text-center  hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.2)] hover:bg-white"
            >
              <div className="mb-1 text-[13px] font-bold text-[#111111]">{tech.name}</div>
              <div className="text-[11px] text-[#777777]">{tech.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   RESULTS
========================================================= */

function ResultsSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 24);

  return (
    <section className="relative z-10 bg-[#06061A] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionIntro label="Results" title="Proven in production." sub="Real numbers from real pipeline runs on the live platform." dark />
        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {RESULTS.map((result) => (
            <div key={result.label} className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-7">
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: result.topGradient }} />
              <div className="mb-2 text-[48px] leading-none font-black tracking-[-2px]" style={{ color: result.color }}>
                {result.value}
                {result.suffix && <span className="text-[24px] opacity-60">{result.suffix}</span>}
              </div>
              <div className="mb-2 text-[14px] font-semibold text-white">{result.label}</div>
              <p className="text-[13px] text-[rgba(248,248,255,0.5)]">{result.desc}</p>
            </div>
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
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <section className="relative z-10 overflow-hidden bg-[linear-gradient(135deg,#06061A_0%,#0D0D28_50%,#06061A_100%)] px-6 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.12),transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-[700px] text-center">
        <h2 ref={titleRef} className="mb-4 text-[clamp(32px,5vw,52px)] leading-[1.1] font-black tracking-[-2px] text-white">
          Ready to automate
          <br />
          your SDLC?
        </h2>
        <p className="mb-9 text-[17px] leading-[1.7] text-[rgba(248,248,255,0.5)]">
          ForgePipeline is live and accepting early access requests. Join engineering teams already
          cutting coordination time by 40%.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a
            href="https://forgepipeline.ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[9px] bg-[#6366F1] px-6.5 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4F46E5] hover:shadow-[0_8px_24px_rgba(99,102,241,0.3)]"
          >
            Visit forgepipeline.ai ↗
          </a>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[rgba(99,102,241,0.2)] px-6.5 py-3.5 text-[15px] font-medium text-white transition-all duration-200 hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.08)]"
          >
            Talk to Oxytal
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   EXPLORE MORE
========================================================= */

function ExploreSection() {
  return (
    <section className="relative z-10 bg-[#F8F8FC] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2.5 text-[12px] font-semibold tracking-[0.1em] text-[#6366F1] uppercase">More from Oxytal</div>
        <h2 className="mb-2 text-[28px] font-extrabold tracking-[-1px] text-[#111111]">Explore More Work</h2>
        <p className="mb-10 text-[15px] text-[#666666]">
          See how we&apos;ve helped ambitious brands and enterprises build next-generation digital
          products.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE_CARDS.map((card) => (
            <Link
              key={card.title}
              href="/work"
              className="block overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
            >
              <div className="flex h-[160px] w-full items-center justify-center text-[40px]" style={{ background: card.gradient }}>
                {card.icon}
              </div>
              <div className="p-4.5">
                <div className="mb-1 text-[15px] font-bold text-[#111111]">{card.title}</div>
                <div className="text-[12px] font-semibold tracking-[0.06em] text-[#6366F1] uppercase">{card.linkLabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ForgePipelineCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-white">
      <div data-nav-contrast="dark">
      <Hero />
      </div>
      <div data-nav-contrast="dark">
      <StatsBar />
      </div>
      <AboutSection />
      <FeaturesSection />
      <div data-nav-contrast="dark">
      <PipelineSection />
      </div>
      <ApproachSection />
      <div data-nav-contrast="dark">
      <IntegrationsSection />
      </div>
      <TechSection />
      <div data-nav-contrast="dark">
      <ResultsSection />
      </div>
      <CtaSection />
      <ExploreSection />
    </div>
  );
}
