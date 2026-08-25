"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { resolveTheme } from "../lib/theme";
import { getAssetUrl } from "../lib/contentfulAsset";
import { ComposableElementSkeleton, DataImageSkeleton } from "../types/contentful";
import styles from "./ProductsCarousel.module.css";
import ThemePattern from "./ThemePattern";

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns. Same
 * helper HomeAI/HomeProducts define for themselves.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface AnyEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}

/** True for a resolved Contentful entry; false for an unresolved link (`{ sys: { type: "Link" } }`) or anything else. Same check HomeAI/HomeProducts use. */
function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

interface Metric {
  value: string;
  color?: string;
  label: string;
}

interface Tag {
  label: string;
  bg: string;
  border: string;
  color: string;
}

interface Cta {
  label: string;
  href: string;
  primary?: boolean;
  external?: boolean;
}

type Visual =
  | {
    kind: "pipeline";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    steps: Array<{
      icon: string;
      name: string;
      state: "done" | "run" | "queued";
      note: string;
    }>;
  }
  | {
    kind: "exam";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    stats: Array<{ value: string; color?: string; label: string }>;
    subjects: Array<{ name: string; pct: number; color: string }>;
  }
  | {
    kind: "board";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    columns: Array<{
      title: string;
      items: Array<{ name: string; tag: string; active?: boolean }>;
    }>;
  }
  | {
    kind: "vault";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    items: Array<{
      icon: string;
      name: string;
      meta: string;
      badge: "ENC" | "EXP";
    }>;
  }
  | {
    kind: "actions";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    rows: Array<{
      text: string;
      owner: string;
      due: string;
      dueKind: "ok" | "warn" | "late";
      priorityColor: string;
      pulse?: boolean;
    }>;
  }
  | {
    kind: "oxyem";
    logoBg: string;
    logoText: string;
    title: string;
    sub: string;
    stats: Array<{ value: string; color?: string; label: string }>;
    employees: Array<{
      initials: string;
      avatarBg: string;
      avatarColor: string;
      name: string;
      dept: string;
    }>;
  };

interface ProductSlide {
  id: string;
  eyebrow: string;
  eyebrowColor: string;
  dotColor: string;
  namePlain: string;
  nameAccent: string;
  accentColor: string;
  tagline: string;
  metrics: Metric[];
  tags: Tag[];
  ctas: Cta[];
  visual: Visual;
}

/** Shared "Live" status tag every slide ends its tag row with, verbatim from the reference. */
const LIVE_TAG: Tag = {
  label: "Live",
  bg: "rgba(74,222,128,.08)",
  border: "rgba(74,222,128,.2)",
  color: "#4ADE80",
};

/**
 * Static dummy content, ported verbatim from `Refrence/oxytal-products-
 * carousel.html`'s own six `<div class="slide">` blocks — this carousel
 * isn't Contentful-driven, per the request this was built for ("one
 * section... with dummy data"). See the `ProductsCarousel` component doc
 * comment below for how the interaction model was adapted for embedding.
 */
const SLIDES: ProductSlide[] = [
  {
    id: "forgepipeline",
    eyebrow: "AI-Powered SDLC · Oxytal AI Lab",
    eyebrowColor: "#A5B4FC",
    dotColor: "#818CF8",
    namePlain: "Forge",
    nameAccent: "Pipeline",
    accentColor: "#6366F1",
    tagline:
      "Autonomous software development lifecycle platform. Requirements from Confluence become a reviewed GitHub PR — through 8 specialised AI agents, with human approval gates at every critical step.",
    metrics: [
      { value: "14min", color: "#A5B4FC", label: "Req to PR" },
      { value: "8", label: "AI agents" },
      { value: "0", color: "#4ADE80", label: "Critical findings" },
    ],
    tags: [
      { label: "Agentic AI", bg: "rgba(99,102,241,.1)", border: "rgba(99,102,241,.25)", color: "#A5B4FC" },
      { label: "SDLC Automation", bg: "rgba(99,102,241,.1)", border: "rgba(99,102,241,.25)", color: "#A5B4FC" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "Visit forgepipeline.ai ↗", href: "https://forgepipeline.ai", primary: true, external: true },
      { label: "Case study", href: "https://oxytal-latest.vercel.app/products/forgepipeline" },
    ],
    visual: {
      kind: "pipeline",
      logoBg: "linear-gradient(135deg,#6366F1,#8B5CF6)",
      logoText: "F",
      title: "ForgePipeline",
      sub: "RUN-003 · In progress · 00:09 elapsed",
      steps: [
        { icon: "📋", name: "Requirements Agent", state: "done", note: "✓ 7 stories" },
        { icon: "🏗", name: "Design Agent", state: "done", note: "✓ ADR ready" },
        { icon: "💻", name: "Development Agent", state: "done", note: "✓ 8 files" },
        { icon: "🔍", name: "Code Review Agent", state: "run", note: "" },
        { icon: "🧪", name: "Testing Agent", state: "queued", note: "Queued" },
        { icon: "🚀", name: "Deploy Agent", state: "queued", note: "Awaiting gate" },
      ],
    },
  },
  {
    id: "examverge",
    eyebrow: "EdTech · UK Exam Preparation",
    eyebrowColor: "#A78BFA",
    dotColor: "#A78BFA",
    namePlain: "Exam",
    nameAccent: "Verge",
    accentColor: "#7C3AED",
    tagline:
      "Free timed mock papers for 11+, SATs and GCSEs with instant marking, step-by-step answer explanations, predicted grades, and a parent dashboard. The smarter way to prepare for exams.",
    metrics: [
      { value: "200+", color: "#A78BFA", label: "Practice papers" },
      { value: "5", label: "Exam boards" },
      { value: "Free", color: "#4ADE80", label: "To start" },
    ],
    tags: [
      { label: "EdTech", bg: "rgba(124,58,237,.1)", border: "rgba(124,58,237,.3)", color: "#A78BFA" },
      { label: "UK Curriculum", bg: "rgba(124,58,237,.1)", border: "rgba(124,58,237,.3)", color: "#A78BFA" },
      { label: "11+ · SATs · GCSE", bg: "rgba(124,58,237,.1)", border: "rgba(124,58,237,.3)", color: "#A78BFA" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "Visit examverge.com ↗", href: "https://www.examverge.com", primary: true, external: true },
      { label: "See pricing", href: "https://www.examverge.com/pricing", external: true },
    ],
    visual: {
      kind: "exam",
      logoBg: "linear-gradient(135deg,#7C3AED,#A78BFA)",
      logoText: "EV",
      title: "ExamVerge",
      sub: "Student dashboard · Mia Patel",
      stats: [
        { value: "78%", color: "#A78BFA", label: "Last paper" },
        { value: "12", label: "Papers done" },
        { value: "43d", color: "#4ADE80", label: "To exam" },
      ],
      subjects: [
        { name: "Verbal reasoning", pct: 82, color: "#A78BFA" },
        { name: "Mathematics", pct: 74, color: "#7C3AED" },
        { name: "Non-verbal reasoning", pct: 68, color: "#6D28D9" },
      ],
    },
  },
  {
    id: "kollabry",
    eyebrow: "Team Collaboration · Project Management",
    eyebrowColor: "#38BDF8",
    dotColor: "#38BDF8",
    namePlain: "Kollab",
    nameAccent: "ry",
    accentColor: "#0EA5E9",
    tagline:
      "Issues, sprints, and retros with a built-in knowledge base and collaborative whiteboards. Plans and the decisions behind them — together, in one workspace.",
    metrics: [
      { value: "5", color: "#38BDF8", label: "Core modules" },
      { value: "Live", label: "Whiteboards" },
      { value: "SSO", color: "#4ADE80", label: "Passwordless" },
    ],
    tags: [
      { label: "Project Tracking", bg: "rgba(14,165,233,.1)", border: "rgba(14,165,233,.3)", color: "#38BDF8" },
      { label: "Knowledge Base", bg: "rgba(14,165,233,.1)", border: "rgba(14,165,233,.3)", color: "#38BDF8" },
      { label: "Whiteboards", bg: "rgba(14,165,233,.1)", border: "rgba(14,165,233,.3)", color: "#38BDF8" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "Visit kollabry.com ↗", href: "https://www.kollabry.com", primary: true, external: true },
      { label: "Get started free", href: "https://www.kollabry.com/login", external: true },
    ],
    visual: {
      kind: "board",
      logoBg: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
      logoText: "KB",
      title: "Kollabry",
      sub: "Sprint 14 · Oxytal workspace",
      columns: [
        {
          title: "Backlog",
          items: [
            { name: "Auth redesign", tag: "Feature · 5pts" },
            { name: "API rate limits", tag: "Backend · 3pts" },
          ],
        },
        {
          title: "In Progress",
          items: [
            { name: "Dashboard v2", tag: "Design · 8pts", active: true },
            { name: "Search index", tag: "Backend · 5pts" },
          ],
        },
        {
          title: "Done",
          items: [
            { name: "Onboarding", tag: "Frontend · 3pts" },
            { name: "Email alerts", tag: "Backend · 2pts" },
          ],
        },
      ],
    },
  },
  {
    id: "samvault",
    eyebrow: "Secure Storage · Document Management",
    eyebrowColor: "#F5C842",
    dotColor: "#F5C842",
    namePlain: "Sam",
    nameAccent: "Vault",
    accentColor: "#C9A84C",
    tagline:
      "Zero-knowledge encrypted document vault. AES-256 encrypted, biometric protected, with expiry intelligence, secure sharing via one-time codes, and team vault collaboration.",
    metrics: [
      { value: "50K+", color: "#F5C842", label: "Users" },
      { value: "AES-256", label: "Encryption" },
      { value: "Zero", color: "#4ADE80", label: "Knowledge" },
    ],
    tags: [
      { label: "Document Security", bg: "rgba(201,168,76,.1)", border: "rgba(201,168,76,.3)", color: "#F5C842" },
      { label: "AES-256", bg: "rgba(201,168,76,.1)", border: "rgba(201,168,76,.3)", color: "#F5C842" },
      { label: "Zero-Knowledge", bg: "rgba(201,168,76,.1)", border: "rgba(201,168,76,.3)", color: "#F5C842" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "Visit samvault.io ↗", href: "https://samvault.io", primary: true, external: true },
      { label: "Try free 14 days", href: "https://samvault.io/register", external: true },
    ],
    visual: {
      kind: "vault",
      logoBg: "linear-gradient(135deg,#92711F,#C9A84C)",
      logoText: "🔐",
      title: "SamVault",
      sub: "24 documents secured · AES-256",
      items: [
        { icon: "📄", name: "Tax Return 2024", meta: "PDF · 2.1 MB", badge: "ENC" },
        { icon: "🪪", name: "Passport", meta: "Expires Jan 2026", badge: "EXP" },
        { icon: "📋", name: "NDA — Oxytal", meta: "PDF · 1.4 MB", badge: "ENC" },
        { icon: "🏦", name: "Bank Statement", meta: "Shared · 1 link", badge: "ENC" },
      ],
    },
  },
  {
    id: "actionpulse",
    eyebrow: "Action Intelligence · CXO Platform",
    eyebrowColor: "#FB923C",
    dotColor: "#FB923C",
    namePlain: "Action",
    nameAccent: "Pulse",
    accentColor: "#F97316",
    tagline:
      "Centralised action tracking for CXO and upper management teams. Real-time visibility into what's happening and what's stuck — across teams, projects, and priorities.",
    metrics: [
      { value: "98%", color: "#FB923C", label: "Action visibility" },
      { value: "3x", label: "Faster resolution" },
      { value: "Zero", color: "#4ADE80", label: "Missed deadlines" },
    ],
    tags: [
      { label: "CXO Dashboard", bg: "rgba(249,115,22,.1)", border: "rgba(249,115,22,.3)", color: "#FB923C" },
      { label: "Action Intelligence", bg: "rgba(249,115,22,.1)", border: "rgba(249,115,22,.3)", color: "#FB923C" },
      { label: "Leadership Tools", bg: "rgba(249,115,22,.1)", border: "rgba(249,115,22,.3)", color: "#FB923C" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "Visit ActionPulse ↗", href: "https://actionpulse.oxytal.com", primary: true, external: true },
      { label: "Request access", href: "https://oxytal-latest.vercel.app/contact-us" },
    ],
    visual: {
      kind: "actions",
      logoBg: "linear-gradient(135deg,#EA580C,#F97316)",
      logoText: "AP",
      title: "ActionPulse",
      sub: "CXO view · 14 open actions",
      rows: [
        { text: "Q4 budget sign-off required", owner: "CFO", due: "Overdue", dueKind: "late", priorityColor: "#EF4444", pulse: true },
        { text: "Hiring plan — Engineering", owner: "CTO", due: "2d left", dueKind: "warn", priorityColor: "#FB923C" },
        { text: "Product roadmap review", owner: "CPO", due: "3d left", dueKind: "warn", priorityColor: "#FB923C" },
        { text: "Partner agreement finalised", owner: "CEO", due: "On track", dueKind: "ok", priorityColor: "#4ADE80" },
        { text: "Security audit scheduled", owner: "CTO", due: "On track", dueKind: "ok", priorityColor: "#4ADE80" },
      ],
    },
  },
  {
    id: "oxyem",
    eyebrow: "Workforce Management · HR Platform",
    eyebrowColor: "#004D95",
    dotColor: "#004D95",
    namePlain: "Oxy",
    nameAccent: "em",
    accentColor: "#004D95",
    tagline:
      "Modern workforce management platform covering HR, payroll, attendance, and employee engagement. Built for compliance-driven businesses that need clarity at scale.",
    metrics: [
      { value: "500+", color: "#004D95", label: "Companies" },
      { value: "50K+", label: "Employees" },
      { value: "99.9%", color: "#004D95", label: "Uptime" },
    ],
    tags: [
      { label: "HR & Payroll", bg: "rgba(5,150,105,.1)", border: "#004D95", color: "#fff" },
      { label: "Attendance", bg: "rgba(5,150,105,.1)", border: "#004D95", color: "#fff" },
      { label: "Employee Engagement", bg: "rgba(5,150,105,.1)", border: "#004D95", color: "#fff" },
      LIVE_TAG,
    ],
    ctas: [
      { label: "View case study ↗", href: "https://oxytal-latest.vercel.app/case-studies/oxyem-management-platform", primary: true },
      { label: "Request demo", href: "https://oxytal-latest.vercel.app/contact-us" },
    ],
    visual: {
      kind: "oxyem",
      logoBg: "linear-gradient(135deg,#004D95,#004D95)",
      logoText: "OE",
      title: "Oxyem",
      sub: "HR dashboard · October 2025",
      stats: [
        { value: "247", color: "#004D95", label: "Active employees" },
        { value: "96%", label: "Attendance rate" },
        { value: "£84K", color: "#004D95", label: "Monthly payroll" },
        { value: "3", label: "Open positions" },
      ],
      employees: [
        { initials: "SB", avatarBg: "rgba(52,211,153,.15)", avatarColor: "#004D95", name: "Sandeep Bawalia", dept: "Engineering" },
        { initials: "PN", avatarBg: "rgba(96,165,250,.15)", avatarColor: "#60A5FA", name: "Priya Nair", dept: "Data & Analytics" },
      ],
    },
  },
];

/** Renders the one visual mockup card matching a slide's `visual.kind` — the reference's own `.mock-card` variants (pipeline steps / exam stats / kanban board / vault grid / action rows / oxyem stats + roster). */
function SlideVisual({ visual }: { visual: Visual }) {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockHeader}>
        <div
          className={styles.mockLogo}
          style={{
            background: visual.logoBg,
            color: "#fff",
            fontSize: visual.logoText.length > 1 ? 11 : undefined,
          }}
        >
          {visual.logoText}
        </div>
        <div>
          <div className={styles.mockTitle}>{visual.title}</div>
          <div className={styles.mockSub}>{visual.sub}</div>
        </div>
      </div>

      {visual.kind === "pipeline" && (
        <>
          <div className={styles.pipeSteps}>
            {visual.steps.map((step) => (
              <div
                key={step.name}
                className={cx(
                  styles.ps,
                  step.state === "done" && styles.psDone,
                  step.state === "run" && styles.psRun
                )}
                style={step.state === "queued" ? { opacity: 0.35 } : undefined}
              >
                <div className={styles.psIcon}>{step.icon}</div>
                <div className={styles.psName}>{step.name}</div>
                <div className={cx(styles.psStatus, step.state === "done" && styles.tickGreen)}>
                  {step.state === "run" ? (
                    <span className={styles.spinIcon} />
                  ) : (
                    step.note
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.shimmerLine} />
        </>
      )}

      {visual.kind === "exam" && (
        <>
          <div className={styles.examStats}>
            {visual.stats.map((stat) => (
              <div key={stat.label} className={styles.examStat}>
                <div className={styles.esVal} style={{ color: stat.color ?? "#fff" }}>
                  {stat.value}
                </div>
                <div className={styles.esLab}>{stat.label}</div>
              </div>
            ))}
          </div>
          {visual.subjects.map((subject) => (
            <div key={subject.name}>
              <div className={styles.subjectRow}>
                <span>{subject.name}</span>
                <span>{subject.pct}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ background: subject.color, width: `${subject.pct}%` }}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {visual.kind === "board" && (
        <div className={styles.boardCols}>
          {visual.columns.map((col) => (
            <div key={col.title} className={styles.boardCol}>
              <div className={styles.boardColTitle}>{col.title}</div>
              {col.items.map((item) => (
                <div
                  key={item.name}
                  className={cx(styles.boardItem, item.active && styles.boardItemActive)}
                >
                  {item.name}
                  <div className={styles.biTag}>{item.tag}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {visual.kind === "vault" && (
        <div className={styles.vaultItems}>
          {visual.items.map((item) => (
            <div key={item.name} className={styles.vaultItem}>
              <div className={styles.vaultIcon}>{item.icon}</div>
              <div>
                <div className={styles.vaultName}>{item.name}</div>
                <div className={styles.vaultMeta}>{item.meta}</div>
              </div>
              <div
                className={cx(
                  styles.vaultBadge,
                  item.badge === "ENC" ? styles.vbEnc : styles.vbExp
                )}
              >
                {item.badge}
              </div>
            </div>
          ))}
        </div>
      )}

      {visual.kind === "actions" && (
        <div className={styles.actionRows}>
          {visual.rows.map((row) => (
            <div key={row.text} className={styles.actionRow}>
              <div
                className={cx(styles.arPriority, row.pulse && styles.pulseRing)}
                style={{ background: row.priorityColor, color: row.priorityColor }}
              />
              <div className={styles.arText}>{row.text}</div>
              <div className={styles.arOwner}>{row.owner}</div>
              <div
                className={cx(
                  styles.arDue,
                  row.dueKind === "ok" && styles.dueOk,
                  row.dueKind === "warn" && styles.dueWarn,
                  row.dueKind === "late" && styles.dueLate
                )}
              >
                {row.due}
              </div>
            </div>
          ))}
        </div>
      )}

      {visual.kind === "oxyem" && (
        <>
          <div className={styles.oxyemStats}>
            {visual.stats.map((stat) => (
              <div key={stat.label} className={styles.oxyemStat}>
                <div className={styles.osVal} style={{ color: stat.color ?? "#fff" }}>
                  {stat.value}
                </div>
                <div className={styles.osLab}>{stat.label}</div>
              </div>
            ))}
          </div>
          {visual.employees.map((employee) => (
            <div key={employee.name} className={styles.employeeRow}>
              <div
                className={styles.empAvatar}
                style={{ background: employee.avatarBg, color: employee.avatarColor }}
              >
                {employee.initials}
              </div>
              <div className={styles.empName}>{employee.name}</div>
              <div className={styles.empDept}>{employee.dept}</div>
              <div
                className={styles.empStatus}
                style={{ background: "rgba(74,222,128,.12)", color: "#4ADE80" }}
              >
                Active
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * "Our Products" carousel — a faithful, class-renamed port of
 * `Refrence/oxytal-products-carousel.html`'s six-slide product showcase,
 * built with hardcoded dummy data (ForgePipeline / ExamVerge / Kollabry /
 * SamVault / ActionPulse / Oxyem) rather than Contentful, per the request
 * this was built for ("one section... with dummy data"). It's a
 * standalone component — nothing wires it into a page yet.
 *
 * The reference is authored as a full takeover of the browser viewport
 * (`html,body{overflow:hidden}`, every nav control `position:fixed` to
 * the window). That doesn't fit dropping this in as one section on a
 * normal, otherwise-scrollable marketing page, so the interaction model
 * is adapted to stay self-contained within the section's own box:
 *
 * - the slide stage is a fixed-height dark panel (this component's own
 *   `.stage`) instead of 100vh/`overflow:hidden` on `<body>`; the small
 *   "Our Products · 01 / 06" counter row that replaces the reference's
 *   page-wide top bar lives inside that panel instead of pinned to the
 *   window (the site's real `Navbar` already owns that space)
 * - dots, arrows, and the progress pips are positioned within the stage
 *   (`position:absolute`, not `fixed` to the viewport)
 * - keyboard-arrow navigation and mouse-wheel navigation only fire while
 *   the pointer is actually over the stage (tracked via
 *   onMouseEnter/onMouseLeave), so this section never hijacks the page's
 *   own scrolling or steals arrow-key focus from the rest of the page
 * - touch swipe is scoped to the stage element itself, not `document`
 *
 * Slide transitions reuse the reference's own two-state trick: the
 * outgoing slide gets a transient `prev` class (fades out, drifts up)
 * that's cleared after the same 650ms the CSS transition takes, while the
 * incoming slide gets `active`. The reference's six bespoke mock-card
 * visuals (pipeline steps, exam stats + progress bars, kanban board,
 * vault grid, action rows, stats + roster) are ported as one
 * `SlideVisual` renderer keyed by each slide's own `visual.kind`.
 *
 * Kept as a CSS Module rather than rewritten into Tailwind utilities,
 * same "faithfulness over consistency" rule `ServicesPage.module.css`/
 * `AIPipelineDemo.module.css` document for the same situation — this
 * design's per-product accent colors, gradients, and bespoke keyframe
 * animations don't map cleanly onto utility classes.
 *
 * Registered as the `producthome` composableElement subtype's renderer
 * (see `ComposableElementRenderer`), so it receives the same `entry` prop
 * every other subtype component does — this component reads exactly two
 * fields off it, the same `themeColor`/`backgroundImage` concept every
 * sibling section (HomeAI, HomeProducts, ...) resolves via `resolveTheme`
 * (see `app/lib/theme.ts`): `entry.fields.themeColor` resolves to
 * `sectionBg` (falling back to today's plain `#ECEAE2` when unset/
 * unrecognized), and `entry.fields.backgroundImage` — a link to a
 * `dataImage` entry, not a raw asset, same as every sibling section's own
 * optional background — is an optional full-bleed photo behind that, with
 * a `sectionBg`-tinted scrim over it so the stage stays legible either
 * way (same "optional background image + tint" pattern `HomeProducts`/
 * `HomeAI` use). Both only reach the *outer* wrapper around the carousel.
 * The dark `.stage` panel itself — every per-product accent color, the
 * mock-card chrome, the reference's own dark identity — stays fixed
 * regardless of theme, same reasoning `HomeProducts`'s own doc comment
 * gives for its corner ticks and gold/teal/emerald tag palette: it's this
 * section's bespoke structural identity, not something a theme preset is
 * meant to override. The six product slides themselves stay the
 * hardcoded dummy data described above — `entry` isn't read for content,
 * only for these two presentational fields.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function ProductsCarousel({ entry }: Props) {
  const theme = resolveTheme(entry.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling section uses). Optional here: no placeholder
  // fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry.fields.backgroundImage;
  const backgroundImageUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
      (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
        .fields.image
    )
    : undefined;
  const [current, setCurrent] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const animatingRef = useRef(false);
  const prevTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartXRef = useRef(0);
  const lastWheelRef = useRef(0);

  const total = SLIDES.length;

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(total - 1, index));
    if (clamped === current || animatingRef.current) {
      return;
    }

    animatingRef.current = true;
    setPrevIndex(current);
    setCurrent(clamped);

    clearTimeout(prevTimeoutRef.current);
    prevTimeoutRef.current = setTimeout(() => {
      setPrevIndex(null);
      animatingRef.current = false;
    }, 650);
  }

  const navigate = (dir: 1 | -1) => goTo(current + dir);

  useEffect(() => {
    return () => {
      clearTimeout(prevTimeoutRef.current);
    };
  }, []);

  /* Keyboard arrows — only while the stage is hovered (see doc comment). */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!hoveredRef.current) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        navigate(1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        navigate(-1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `navigate` closes over `current`/`total` freshly each render; only the listener identity needs to stay stable across renders.
  }, [current]);

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const now = Date.now();
    if (now - lastWheelRef.current < 800) {
      return;
    }
    lastWheelRef.current = now;
    navigate(event.deltaY > 0 ? 1 : -1);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0].screenX;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const dx = event.changedTouches[0].screenX - touchStartXRef.current;
    if (Math.abs(dx) > 50) {
      navigate(dx < 0 ? 1 : -1);
    }
  }

  return (
    <section
      className={cx(
        "relative overflow-hidden",
        !backgroundImageUrl && (theme?.sectionBg ?? "bg-[#ECEAE2]")
      )}
      style={
        backgroundImageUrl
          ? {
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }
          : undefined
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry.fields.pattern} patternColor={entry.fields.patternColor} />
      </div>

      <div className="relative">
        <div
          ref={stageRef}
          className={cx(
                "container mx-auto px-5 py-16 md:px-10 md:py-24 lg:py-28",
                styles.stage
              )}
          onMouseEnter={() => (hoveredRef.current = true)}
          onMouseLeave={() => (hoveredRef.current = false)}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          <div className={styles.topBar}>
            <span className={cx(
              "text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] z-2",
              theme?.heading ?? "text-gray-900"
            )}>Our Products</span>
            <span className={cx(
              "text-[20px] leading-[1.15] font-extrabold tracking-tight sm:text-[26px] md:text-[30px] z-2",
              theme?.heading ?? "text-gray-900"
            )}>
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          <div className={styles.dots}>
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Product ${i + 1}: ${slide.namePlain}${slide.nameAccent}`}
                className={cx(styles.dot, i === current && styles.dotActive)}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <div className={styles.slides}>
            {SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                className={cx(
                  styles.slide,
                  i === current && styles.slideActive,
                  i === prevIndex && styles.slidePrev
                )}
              >
                <div className={styles.left}>
                  <div className={styles.productNum}>
                    {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </div>
                  <div className="inline-block w-fit text-xs font-bold tracking-wide z-2 mb-2 uppercase">
                    <span style={{ color: slide.eyebrowColor }}>{slide.eyebrow}</span>
                  </div>
                  <h3 className="text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px] md:text-[40px] mb-3">
                    {slide.namePlain}
                    <span style={{ color: slide.accentColor }}>{slide.nameAccent}</span>
                  </h3>
                  <p className="text-[15.5px] leading-relaxed mb-5 font-normal">{slide.tagline}</p>

                  <div className={styles.metrics}>
                    {slide.metrics.map((metric) => (
                      <div key={metric.label} className={styles.metricBox}>
                        <div className={styles.metricVal} style={{ color: metric.color ?? "#fff" }}>
                          {metric.value}
                        </div>
                        <div className={styles.metricLab}>{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.productTags}>
                    {slide.tags.map((tag) => (
                      <div
                        key={tag.label}
                        className={styles.tag}
                        style={{ background: tag.bg, borderColor: tag.border, color: tag.color }}
                      >
                        {tag.label}
                      </div>
                    ))}
                  </div>

                  <div className={styles.productCtas}>
                    {slide.ctas.map((cta) =>
                      cta.primary ? (
                        <Link
                          key={cta.label}
                          href={cta.href}
                          target={cta.external ? "_blank" : undefined}
                          rel={cta.external ? "noopener noreferrer" : undefined}
                          className={styles.btnPrimary}
                          style={{ background: slide.accentColor }}
                        >
                          {cta.label}
                        </Link>
                      ) : (
                        <Link
                          key={cta.label}
                          href={cta.href}
                          target={cta.external ? "_blank" : undefined}
                          rel={cta.external ? "noopener noreferrer" : undefined}
                          className={styles.btnOutline}
                        >
                          {cta.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>

                <div className={styles.right}>
                  <div className={styles.rightVisual}>
                    <SlideVisual visual={slide.visual} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrowBtn}
              aria-label="Previous product"
              onClick={() => navigate(-1)}
              disabled={current === 0}
            >
              ‹
            </button>
            <div className={styles.progressPips}>
              {SLIDES.map((slide, i) => (
                <div
                  key={slide.id}
                  className={cx(styles.pip, i === current && styles.pipActive)}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.arrowBtn}
              aria-label="Next product"
              onClick={() => navigate(1)}
              disabled={current === total - 1}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
