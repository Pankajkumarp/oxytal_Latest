"use client";

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";
import CountUpNumber from "./CountUpNumber";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `SamVaultCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/samvault_oxytal.html`. Unlike every `composableElement`
 * section elsewhere in `app/ui`, this isn't wired to Contentful (no
 * `entry` prop, no `subType` in `ComposableElementRenderer`) — it's a
 * fixed page, same "no CMS wiring requested" treatment as `AboutPage`/
 * `CareersPage` before their own Contentful wiring existed.
 *
 * Deliberately keeps the reference's own dark/gold identity (`--dark`
 * `#09090d`, `--panel` `#0f1018`, `--card` `#13141f`, `--gold` `#c9a84c`)
 * rather than the site's usual per-page `themeColor` accent — this page
 * is its own brand moment (a client's product), not a themed Oxytal
 * service page, so it isn't run through `resolveTheme`.
 *
 * Typography stays the site's own `Poppins` (`--font-poppins`, wired
 * through `font-sans` in `app/globals.css`) rather than the reference's
 * own Google Fonts (`DM Serif Display`/`Inter`/`JetBrains Mono`) — no
 * per-component fonts here, just the app's existing default.
 *
 * No `<nav>`/`<footer>` — the reference's own header/footer are dropped
 * since the app already renders a global `Navbar` (and site footer)
 * around every page, same reasoning `AboutPage`/`CareersPage` follow.
 *
 * Animation follows the codebase's usual split between GSAP and plain
 * CSS: every section's `<h2>` gets the shared `useSplitReveal` word
 * treatment; whole-block content (`stats-row`/`feature-grid`/the arch
 * diagram/`security-grid`/the differentiators grid/`stack-grid`) fades
 * up together on scroll via `useFadeUp`, mirroring the reference's own
 * generic `.reveal` `IntersectionObserver` class; the three per-item
 * lists (architecture points, USPs, build timeline) stagger in one row
 * at a time via `useListStagger`, mirroring the reference's separate
 * list `IntersectionObserver`; stat numbers count up via GSAP once
 * scrolled into view. Continuous decorative motion (the hero's drifting
 * grid lines, the rising cipher-snippet particles, the doc-card float)
 * stays plain CSS — see `globals.css`'s `grid-drift`/`float-up`/
 * `card-float` keyframes, same "continuous background motion doesn't
 * need GSAP" reasoning as `float`/`glow-pulse` there. Everything else
 * (badge/pill/card/link hover) is a plain Tailwind `hover:` transition,
 * same as the reference's own CSS `:hover` rules.
 */

/* =========================================================
   CONTENT — transcribed 1:1 from Refrence/samvault_oxytal.html
========================================================= */

const HERO_BADGES: { label: string; tone?: "green" }[] = [
  { label: "Next.js 15" },
  { label: "TypeScript" },
  { label: "AES-256-GCM" },
  { label: "AWS S3" },
  { label: "MySQL" },
  { label: "🔒 Zero-knowledge design", tone: "green" },
  { label: "Multi-tenant" },
  { label: "Real-time notifications" },
];

const SIDEBAR_ITEMS: { icon: string; label: string; active?: boolean }[] = [
  { icon: "📄", label: "Documents", active: true },
  { icon: "🔗", label: "Shared" },
  { icon: "📦", label: "Bundles" },
  { icon: "📬", label: "Requests" },
  { icon: "🏢", label: "Team Vault" },
  { icon: "📜", label: "Templates" },
  { icon: "⚙️", label: "Settings" },
];

const DOC_CARDS: { icon: string; name: string; meta: string; status: string; expiring?: boolean }[] = [
  { icon: "🛂", name: "Passport.pdf", meta: "Identity · 2.1 MB", status: "Expires Jun 2025", expiring: true },
  { icon: "🏠", name: "Property_Deed.pdf", meta: "Finance · 4.8 MB", status: "Encrypted" },
  { icon: "📜", name: "Last_Will_v3.pdf", meta: "Legal · 1.2 MB", status: "3 versions" },
  { icon: "🚗", name: "Insurance_Policy.pdf", meta: "Finance · 890 KB", status: "Shared ×2" },
  { icon: "🎓", name: "Degree_Certificate.pdf", meta: "Education · 3.4 MB", status: "Certified" },
  { icon: "🏥", name: "Medical_Report.pdf", meta: "Health · 1.7 MB", status: "Private" },
];

type StatItem =
  | { kind: "count"; target: number; suffix: string; label: string }
  | { kind: "text"; value: string; label: string };

const STATS: StatItem[] = [
  { kind: "count", target: 25, suffix: "+", label: "Core modules built" },
  { kind: "count", target: 60, suffix: "+", label: "API routes" },
  { kind: "text", value: "AES-256", label: "Encryption standard" },
  { kind: "count", target: 100, suffix: "+", label: "% encrypted at rest" },
];

const FEATURES: { icon: string; title: string; desc: string; tags: string[]; wide?: boolean }[] = [
  {
    icon: "🔐",
    title: "Zero-knowledge Encryption",
    desc: "Every document is encrypted client-side with a unique per-document DEK, wrapped by a per-user KEK derived from credentials using scrypt. The server never sees plaintext.",
    tags: ["AES-256-GCM", "scrypt KDF", "DEK + KEK"],
  },
  {
    icon: "🏢",
    title: "Team Vaults",
    desc: "Multi-tenant org structure with role-based permissions (Owner / Admin / Member), folder trees with inheritance, and organisation-scoped document sharing.",
    tags: ["RBAC", "Multi-tenant", "Folder ACL"],
  },
  {
    icon: "🔗",
    title: "Secure Sharing",
    desc: "Time-limited share links with one-time access codes, IP locking, download toggle, access alerts, and revocation. Every access is logged with device and timestamp.",
    tags: ["OTP codes", "IP lock", "Audit log"],
  },
  {
    icon: "📬",
    title: "Document Request System",
    desc: "Request documents from anyone — they upload via a branded link (no account needed), files are encrypted using the requester's keys, and both parties get email + in-app notifications. Access codes protect every upload link.",
    tags: ["Encrypted uploads", "Access codes", "SES email", "No-account uploads"],
    wide: true,
  },
  {
    icon: "🕐",
    title: "Document Versioning",
    desc: "Save snapshots before updates. Preview any historical version. Restore with auto-backup — no data loss possible. Each version has its own encryption key.",
    tags: ["Non-destructive", "Version DEK"],
  },
  {
    icon: "📜",
    title: "AI-Powered Templates",
    desc: "Will & Testament, Personal Data Summary, and 10+ more. Live split-pane preview, jsPDF export, collapsible asset/beneficiary sections, and direct vault upload.",
    tags: ["jsPDF", "Live preview", "Will versioning"],
  },
  {
    icon: "🔔",
    title: "Notification System",
    desc: "In-app bell with 30-second polling, 15 notification types, SES email delivery, user preference controls, and weekly digest emails for org owners.",
    tags: ["Real-time", "SES", "Preferences"],
  },
  {
    icon: "🏷️",
    title: "Expiry Reminders",
    desc: "Multi-expiry dates per document (passport expiry, MOT, insurance). Automated cron emails at 30d / 14d / 7d / 1d. In-app alerts with colour-coded urgency.",
    tags: ["Cron jobs", "Multi-expiry"],
  },
  {
    icon: "📦",
    title: "Bundles & Trusted Contacts",
    desc: "Group multiple documents into a shareable bundle with a single link. Trusted contacts system for emergency vault access with configurable time delays.",
    tags: ["Bundle sharing", "Emergency access"],
  },
];

const ARCH_LAYERS: { icon: string; name: string; tech: string; arrow: string | null }[] = [
  {
    icon: "🌐",
    name: "Next.js 15 App Router",
    tech: "React Server Components · Turbopack · TypeScript",
    arrow: "⬇ API Routes (Edge + Node runtime)",
  },
  {
    icon: "🔐",
    name: "Encryption Layer",
    tech: "AES-256-GCM · scrypt · Per-doc DEK · KEK wrapping",
    arrow: "⬇ Encrypted blobs",
  },
  {
    icon: "☁️",
    name: "AWS S3 (encrypted storage)",
    tech: "Server-side never sees plaintext",
    arrow: "⬇ Metadata only",
  },
  {
    icon: "🗄️",
    name: "MySQL (Aiven cloud)",
    tech: "Encrypted DEKs · session tokens · audit logs",
    arrow: "⬇ Transactional emails",
  },
  {
    icon: "📧",
    name: "AWS SES",
    tech: "Expiry reminders · share alerts · request emails",
    arrow: null,
  },
];

const ARCH_POINTS: { title: string; text: string }[] = [
  {
    title: "Key hierarchy that scales",
    text: "Master Key → KEK → per-document DEK. Revoking access or changing credentials only re-wraps the KEK — no re-encryption of documents.",
  },
  {
    title: "Multi-tenant from the start",
    text: "Personal vaults and team organisations share the same schema but are isolated by user_id / org_id with row-level checks on every query.",
  },
  {
    title: "Event-driven notifications",
    text: "Every meaningful action (upload, share, access, request) triggers in-app + email notifications via a central notify.ts library with a 15-type allowlist.",
  },
  {
    title: "Vercel-native deployment",
    text: "Edge-optimised API routes, force-dynamic on all data routes, cron jobs via Vercel Cron, environment-isolated secrets.",
  },
];

const SEC_CARDS: { icon: string; title: string; desc: string; badge: string }[] = [
  {
    icon: "🔑",
    title: "AES-256-GCM",
    desc: "Authenticated encryption with per-document IVs. Auth tags prevent tampering — any modification is detected.",
    badge: "Military grade",
  },
  {
    icon: "🧂",
    title: "scrypt KDF",
    desc: "Key derivation from credentials. Memory-hard, GPU-resistant. Unique salt per user with configurable work factors.",
    badge: "Brute-force resistant",
  },
  {
    icon: "🪪",
    title: "JWT Sessions",
    desc: "Short-lived signed tokens (sv_session cookie). HttpOnly, SameSite, Secure. No server-side session storage.",
    badge: "Stateless auth",
  },
  {
    icon: "🛡️",
    title: "TOTP MFA",
    desc: "Authenticator app support. MFA enforced on sensitive operations. Backup codes with hashed storage.",
    badge: "TOTP / RFC 6238",
  },
  {
    icon: "🌍",
    title: "IP Locking",
    desc: "Share links can be pinned to specific IP ranges. Accesses from unexpected IPs trigger owner alerts.",
    badge: "Access control",
  },
  {
    icon: "📋",
    title: "Audit Trail",
    desc: "Every action logged with user, IP, timestamp, and resource. Organisation-scoped audit log with export.",
    badge: "Compliance ready",
  },
  {
    icon: "🔒",
    title: "Rate Limiting",
    desc: "Per-route rate limits on auth, upload, and share endpoints. Sliding window algorithm with Redis-compatible counters.",
    badge: "DDoS mitigation",
  },
  {
    icon: "🗑️",
    title: "Secure Deletion",
    desc: "Soft-delete with audit trail. S3 object versioning for hard-delete compliance. GDPR data export + right-to-erasure flow.",
    badge: "GDPR ready",
  },
];

const DIFF_ROWS: { feature: string; sam: boolean; drive: boolean; dropbox: boolean; highlight?: boolean }[] = [
  { feature: "End-to-end encryption", sam: true, drive: false, dropbox: false, highlight: true },
  { feature: "Document request system", sam: true, drive: false, dropbox: false, highlight: true },
  { feature: "Expiry reminders", sam: true, drive: false, dropbox: false, highlight: true },
  { feature: "Legal document templates", sam: true, drive: false, dropbox: false },
  { feature: "IP-locked share links", sam: true, drive: false, dropbox: false },
  { feature: "Trusted contacts / emergency", sam: true, drive: false, dropbox: false },
  { feature: "Team vaults with RBAC", sam: true, drive: true, dropbox: true },
  { feature: "Tamper-evident certificates", sam: true, drive: false, dropbox: false },
];

const USP_ITEMS: { title: string; text: string }[] = [
  {
    title: "Purpose-built for personal life documents",
    text: "Passports, wills, property deeds, insurance — SamVault understands document categories, expiry dates, and legal templates. Generic cloud storage doesn't.",
  },
  {
    title: "Encryption the server can't break",
    text: "Keys are derived from user credentials. Even if the database is breached, encrypted documents are worthless without the user's master key.",
  },
  {
    title: "The request flow nobody else has",
    text: "Send a link, recipient uploads without needing an account, you receive the document already encrypted in your vault. Solicitors, landlords, employers — all covered.",
  },
  {
    title: "Built to last, not just to demo",
    text: "Version history, audit trails, trusted contacts for emergencies, GDPR compliance flows — the features that matter when documents actually matter.",
  },
];

const STACK_GROUPS: { category: string; items: { icon: string; label: string }[] }[] = [
  {
    category: "Frontend",
    items: [
      { icon: "▲", label: "Next.js 15" },
      { icon: "⚛️", label: "React 19" },
      { icon: "𝓣𝓢", label: "TypeScript" },
      { icon: "🎨", label: "CSS Modules" },
      { icon: "🖥️", label: "App Router" },
    ],
  },
  {
    category: "Backend & API",
    items: [
      { icon: "🚀", label: "Next.js API Routes" },
      { icon: "🔑", label: "JWT Auth" },
      { icon: "🏃", label: "Node.js runtime" },
      { icon: "⚡", label: "Edge-compatible" },
    ],
  },
  {
    category: "Data & Storage",
    items: [
      { icon: "🗄️", label: "MySQL (Aiven)" },
      { icon: "☁️", label: "AWS S3" },
      { icon: "📧", label: "AWS SES" },
      { icon: "💳", label: "Stripe / Razorpay" },
    ],
  },
  {
    category: "Cryptography",
    items: [
      { icon: "🔐", label: "AES-256-GCM" },
      { icon: "🧂", label: "scrypt KDF" },
      { icon: "🔒", label: "Node crypto" },
      { icon: "🪪", label: "TOTP (RFC 6238)" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { icon: "▲", label: "Vercel" },
      { icon: "⏱️", label: "Vercel Cron" },
      { icon: "📄", label: "jsPDF" },
      { icon: "📱", label: "React Native (iOS/Android)" },
    ],
  },
];

const TIMELINE: { phase: string; title: string; desc: string }[] = [
  {
    phase: "Phase 1",
    title: "Core vault & encryption foundation",
    desc: "Authentication system, session management, AES-256-GCM encryption pipeline with scrypt key derivation, AWS S3 integration, document upload/download, category system, and expiry tracking.",
  },
  {
    phase: "Phase 2",
    title: "Sharing, subscriptions & team vaults",
    desc: "Secure share links with IP locking and one-time codes, Stripe + Razorpay subscription billing, multi-tenant organisation structure, folder trees with permission inheritance, RBAC.",
  },
  {
    phase: "Phase 3 — 5",
    title: "Collaboration & advanced features",
    desc: "Document request system, bundles, trusted contacts, tamper-evident certificates with QR codes, audit trail, notifications, weekly digest emails, cron jobs, permissions manager.",
  },
  {
    phase: "Phase 6",
    title: "Templates, versioning & mobile",
    desc: "AI-powered document templates (Will & Testament, personal data), document versioning with restore, React Native mobile apps (iOS + Android), PWA support, full mobile responsiveness.",
  },
  {
    phase: "Ongoing",
    title: "Production hardening",
    desc: "Cache-busting, force-dynamic API routes, Zero-stale-data guarantees, notification delivery tuning, security patches, performance optimisation.",
  },
];

const PARTICLE_SNIPPETS = [
  "AES-256-GCM",
  "scrypt(N=16384)",
  "iv+tag+cipher",
  "DEK→KEK→UMK",
  "SHA-256",
  "JWT·HS256",
  "TOTP·RFC6238",
  "0x4a6f...",
  "pbkdf2",
  "hmac-sha256",
];

/* =========================================================
   SHARED PIECES
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  sub,
  center,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  center?: boolean;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={center ? "text-center" : undefined}>
      <div className="mb-3.5 text-[11px] font-semibold tracking-[0.14em] text-[#c9a84c] uppercase">
        {eyebrow}
      </div>
      <h2
        ref={titleRef}
        className="mb-4 text-[clamp(2rem,4vw,3rem)] leading-[1.15] text-[#f0ede8] font-bold"
      >
        {title}
      </h2>
      {sub && (
        <p className={cx(center ? "mx-auto" : undefined, "max-w-[560px] text-[1.05rem] font-light text-[#6b7280]")}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function FloatingParticles() {
  // Deterministic per-index placement (no Math.random()) so server and
  // client render identically — the reference re-spawns particles on a
  // JS interval, which a static server-rendered page can't reproduce;
  // this fixed roster looping via CSS is the SSR-safe equivalent.
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        text: PARTICLE_SNIPPETS[i % PARTICLE_SNIPPETS.length],
        left: (i * 37 + 5) % 100,
        duration: 12 + (i % 5) * 2.6,
        delay: -(i * 2.3),
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle, i) => (
        <span
          key={i}
          className="animate-float-up absolute text-[10px] whitespace-nowrap text-[#c9a84c]/15"
          style={{
            left: `${particle.left}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.text}
        </span>
      ))}
    </div>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const encBadgeRef = useRef<HTMLDivElement>(null);

  // Hero heading: splits and rises in on mount (above the fold, so no
  // ScrollTrigger — same treatment AISolutionsHero's own h1 gets).
  useLayoutEffect(() => {
    if (!titleRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(titleRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(titleRef.current!, {
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
            delay: 0.1,
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  // Everything else: a single sequenced fade-up, matching the reference's
  // own staggered `fadeUp`/`badgeIn` animation-delay values.
  useLayoutEffect(() => {
    const targets = [eyebrowRef.current, subRef.current, badgesRef.current, mockupRef.current];

    if (prefersReducedMotion()) {
      gsap.set([...targets, encBadgeRef.current], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(eyebrowRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0)
        .from(subRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.3)
        .from(badgesRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.4)
        .from(mockupRef.current, { opacity: 0, y: 28, duration: 0.8 }, 0.5)
        .from(
          encBadgeRef.current,
          { opacity: 0, scale: 0.9, y: 10, duration: 1, ease: "power2.out" },
          1.2
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-[120px] pb-20 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="animate-grid-drift pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black_40%,transparent_100%)]"
      />

      <div
        ref={eyebrowRef}
        className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,76,0.3)] px-[18px] py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#c9a84c] uppercase"
      >
        <span aria-hidden className="animate-dot-pulse h-1.5 w-1.5 rounded-full bg-[#c9a84c]" />
        Oxytal Case Study
      </div>

      <h1
        ref={titleRef}
        className="mb-6 max-w-6xl text-[clamp(3rem,7vw,5.5rem)] leading-[1.08] tracking-[-0.02em] text-[#f0ede8] font-bold"
      >
        The personal vault that keeps
        <br />
        <em className="text-[#c9a84c] italic">documents encrypted,</em>
        <br />
        not just stored
      </h1>

      <p ref={subRef} className="mb-12 max-w-[600px] text-[clamp(1rem,2vw,1.2rem)] font-light text-[#6b7280]">
        SamVault — a full-stack document management platform with military-grade encryption, team
        vaults, AI-powered templates, and zero-knowledge architecture.
      </p>

      <div ref={badgesRef} className="mb-14 flex flex-wrap justify-center gap-2.5">
        {HERO_BADGES.map((badge) =>
          badge.tone === "green" ? (
            <span
              key={badge.label}
              className="rounded-md border border-[rgba(46,204,138,0.3)] bg-[rgba(46,204,138,0.06)] px-3.5 py-1.5 text-[11.5px] font-medium text-[#2ecc8a]"
            >
              {badge.label}
            </span>
          ) : (
            <span
              key={badge.label}
              className="rounded-md border border-[rgba(255,255,255,0.07)] bg-[#13141f] px-3.5 py-1.5 text-[11.5px] font-medium text-[#6b7280] transition-colors duration-200 hover:border-[rgba(201,168,76,0.4)] hover:text-[#c9a84c]"
            >
              {badge.label}
            </span>
          )
        )}
      </div>

      <div ref={mockupRef} className="relative z-10 w-full max-w-[860px]">
        <div className="overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#0f1018] shadow-[0_40px_120px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] bg-[#13141f] px-4 py-3">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
            <div className="flex-1 rounded-md bg-[rgba(255,255,255,0.04)] px-3 py-1 text-center text-[11px] text-[#6b7280]">
              🔒 samvault.io/documents
            </div>
          </div>

          <div className="grid grid-cols-1 md:h-[380px] md:grid-cols-[200px_1fr]">
            <div className="hidden border-r border-[rgba(255,255,255,0.07)] bg-[rgba(0,0,0,0.2)] py-5 md:block">
              <div className="mb-3 border-b border-[rgba(255,255,255,0.07)] px-5 pb-5 text-[18px] text-[#f0ede8]">
                Sam<span className="text-[#c9a84c]">Vault</span>
              </div>
              {SIDEBAR_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={cx(
                    "flex items-center gap-2.5 px-5 py-2.5 text-[12px] transition-colors duration-200",
                    item.active
                      ? "border-l-2 border-[#c9a84c] bg-[rgba(201,168,76,0.08)] text-[#c9a84c]"
                      : "text-[#6b7280] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f0ede8]"
                  )}
                >
                  <span className="text-[14px]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            <div className="overflow-hidden p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[20px] text-[#f0ede8]">My Documents</span>
                <span className="rounded-lg bg-[#c9a84c] px-4 py-[7px] text-[12px] font-bold text-[#0a0b0d]">
                  + Upload
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {DOC_CARDS.map((doc, i) => (
                  <div
                    key={doc.name}
                    className="animate-card-float rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#13141f] p-3.5"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <div className="mb-2 text-[22px]">{doc.icon}</div>
                    <div className="mb-[3px] text-[11px] font-semibold text-[#f0ede8]">{doc.name}</div>
                    <div className="text-[10px] text-[#6b7280]">{doc.meta}</div>
                    <div
                      className={cx(
                        "mt-1.5 inline-block rounded-full px-[7px] py-[2px] text-[9px] font-bold",
                        doc.expiring
                          ? "bg-[rgba(251,146,60,0.1)] text-[#fb923c]"
                          : "bg-[rgba(46,204,138,0.1)] text-[#2ecc8a]"
                      )}
                    >
                      {doc.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={encBadgeRef}
          className="absolute -right-3.5 -bottom-3.5 hidden items-center gap-2.5 rounded-xl border border-[rgba(201,168,76,0.4)] bg-[#13141f] px-[18px] py-3 text-[11px] font-semibold text-[#c9a84c] shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:flex"
        >
          <span className="text-[22px]">🔐</span>
          <div>
            <div className="mb-0.5 text-[10px] text-[#6b7280]">Encryption</div>
            AES-256-GCM · Per-document DEK
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STATS
========================================================= */

function StatsSection() {
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading eyebrow="By the numbers" title="Built to scale, designed to last" />
        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.07)] sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0f1018] px-8 py-9 text-center transition-colors duration-300 hover:bg-[#13141f]"
            >
              {stat.kind === "count" ? (
                <CountUpNumber
                  target={stat.target}
                  suffix={stat.suffix}
                  className="mb-2 text-[clamp(2.4rem,4vw,3rem)] leading-none text-[#c9a84c]"
                />
              ) : (
                <div className="mb-2 text-[clamp(2.4rem,4vw,3rem)] leading-none text-[#c9a84c]">
                  {stat.value}
                </div>
              )}
              <div className="text-[12px] tracking-[0.08em] text-[#6b7280] uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FEATURES
========================================================= */

function FeaturesSection() {
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 border-y border-[rgba(255,255,255,0.07)] bg-[#0f1018] px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading
          eyebrow="What we built"
          title="Every feature a user actually needs"
          sub="From personal document storage to enterprise team vaults — a complete platform, not a prototype."
        />
        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.07)] lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={cx(
                "group relative overflow-hidden bg-[#0f1018] p-9 transition-colors duration-300 hover:bg-[#13141f] md:p-10",
                feature.wide && "lg:col-span-2"
              )}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,#c9a84c,transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="mb-[18px] text-[28px]">{feature.icon}</div>
              <div className="mb-2.5 text-[1.3rem] text-[#f0ede8]">{feature.title}</div>
              <p className="text-[13.5px] leading-[1.65] text-[#6b7280]">{feature.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[5px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-2.5 py-[3px] text-[10.5px] text-[#6b7280]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ARCHITECTURE
========================================================= */

function ArchitectureSection() {
  const diagramRef = useFadeUp<HTMLDivElement>();
  const pointsRef = useListStagger<HTMLUListElement>("x", 20);

  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading eyebrow="Architecture" title="Built on a solid foundation" />
        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div
            ref={diagramRef}
            className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0f1018] p-9"
          >
            {ARCH_LAYERS.map((layer) => (
              <div key={layer.name}>
                <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#13141f] px-[18px] py-3.5 transition-all duration-300 hover:translate-x-1 hover:border-[rgba(201,168,76,0.4)]">
                  <span className="shrink-0 text-[18px]">{layer.icon}</span>
                  <div>
                    <div className="text-[12px] font-medium text-[#f0ede8]">{layer.name}</div>
                    <div className="mt-0.5 text-[10px] text-[#6b7280]">{layer.tech}</div>
                  </div>
                </div>
                {layer.arrow && (
                  <div className="my-1 text-center text-[11px] tracking-[0.1em] text-[#6b7280]">{layer.arrow}</div>
                )}
              </div>
            ))}
          </div>

          <ul ref={pointsRef} className="list-none">
            {ARCH_POINTS.map((point, i) => (
              <li key={point.title} className="mb-[22px] flex gap-3.5">
                <div className="w-9 shrink-0 text-right text-[2rem] leading-none text-[rgba(201,168,76,0.2)]">
                  {i + 1}
                </div>
                <div>
                  <strong className="mb-1 block text-[14px] font-semibold text-[#f0ede8]">{point.title}</strong>
                  <span className="text-[13px] text-[#6b7280]">{point.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecuritySection() {
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 border-y border-[rgba(255,255,255,0.07)] bg-[#0f1018] px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading eyebrow="Security first" title="Defence in depth, not security theatre" />
        <div ref={gridRef} className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEC_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0f1018] px-6 py-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,168,76,0.3)] hover:bg-[#13141f] hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="mb-3.5 text-[32px]">{card.icon}</div>
              <div className="mb-2 text-[13px] font-bold text-[#f0ede8]">{card.title}</div>
              <p className="text-[12px] leading-[1.6] text-[#6b7280]">{card.desc}</p>
              <div className="mt-3 inline-block rounded-full bg-[rgba(46,204,138,0.1)] px-2.5 py-[3px] text-[9.5px] font-bold tracking-[0.06em] text-[#2ecc8a] uppercase">
                {card.badge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   DIFFERENTIATORS
========================================================= */

function DifferentiatorsSection() {
  const gridRef = useFadeUp<HTMLDivElement>();
  const uspRef = useListStagger<HTMLUListElement>("y", 16);

  return (
    <section className="relative z-10 border-y border-[rgba(255,255,255,0.07)] bg-[#0f1018] px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading eyebrow="Why SamVault" title="What sets it apart" />
        <div ref={gridRef} className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-[#6b7280] uppercase">
                    Feature
                  </th>
                  <th className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-2.5 text-center text-[11px] font-semibold tracking-[0.08em] text-[#6b7280] uppercase">
                    SamVault
                  </th>
                  <th className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-2.5 text-center text-[11px] font-semibold tracking-[0.08em] text-[#6b7280] uppercase">
                    Google Drive
                  </th>
                  <th className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-2.5 text-center text-[11px] font-semibold tracking-[0.08em] text-[#6b7280] uppercase">
                    Dropbox
                  </th>
                </tr>
              </thead>
              <tbody>
                {DIFF_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className={cx(row.highlight && "bg-[rgba(201,168,76,0.05)]", "transition-colors hover:bg-[rgba(255,255,255,0.02)]")}
                  >
                    <td
                      className={cx(
                        "border-b border-[rgba(255,255,255,0.07)] px-3.5 py-3 font-medium text-[#f0ede8]",
                        row.highlight && "border-l-2 border-l-[#c9a84c]"
                      )}
                    >
                      {row.feature}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-3 text-center">
                      {row.sam ? (
                        <span className="text-[16px] text-[#2ecc8a]">✓</span>
                      ) : (
                        <span className="text-[16px] text-[rgba(239,68,68,0.6)]">✗</span>
                      )}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-3 text-center">
                      {row.drive ? (
                        <span className="text-[16px] text-[#2ecc8a]">✓</span>
                      ) : (
                        <span className="text-[16px] text-[rgba(239,68,68,0.6)]">✗</span>
                      )}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.07)] px-3.5 py-3 text-center">
                      {row.dropbox ? (
                        <span className="text-[16px] text-[#2ecc8a]">✓</span>
                      ) : (
                        <span className="text-[16px] text-[rgba(239,68,68,0.6)]">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul ref={uspRef} className="list-none">
            {USP_ITEMS.map((item) => (
              <li key={item.title} className="mb-7 flex gap-4">
                <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c9a84c]" />
                <div>
                  <div className="mb-[5px] text-[14px] font-semibold text-[#f0ede8]">{item.title}</div>
                  <p className="text-[13px] leading-[1.6] text-[#6b7280]">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECH STACK
========================================================= */

function StackSection() {
  const gridRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading eyebrow="Tech stack" title="Modern stack, production-grade choices" />
        <div ref={gridRef} className="mt-10 flex flex-wrap gap-2.5">
          {STACK_GROUPS.map((group) => (
            <div key={group.category} className="flex w-full flex-wrap items-center gap-2.5">
              <div className="mt-5 mb-2 flex w-full items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.1em] text-[#6b7280] uppercase">
                {group.category}
                <span aria-hidden className="h-px flex-1 bg-[rgba(255,255,255,0.07)]" />
              </div>
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#13141f] px-4 py-2.5 text-[13px] font-medium text-[#f0ede8] transition-all duration-200 hover:border-[rgba(201,168,76,0.4)] hover:text-[#c9a84c]"
                >
                  <span className="text-[17px]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   BUILD TIMELINE
========================================================= */

function TimelineSection() {
  const listRef = useListStagger<HTMLDivElement>("x", 20);

  return (
    <section className="relative z-10 border-y border-[rgba(255,255,255,0.07)] bg-[#0f1018] px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeading
          eyebrow="How we built it"
          title="Phase by phase"
          sub="From zero to a production-ready multi-tenant SaaS in a focused sprint."
        />
        <div ref={listRef} className="relative mt-14">
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-0 w-px bg-[linear-gradient(to_bottom,transparent,#c9a84c,transparent)]"
          />
          {TIMELINE.map((item) => (
            <div key={item.phase + item.title} className="relative pb-10 pl-10">
              <span aria-hidden className="absolute top-1 -left-[5px] h-[11px] w-[11px] rounded-full border-2 border-[#09090d] bg-[#c9a84c]" />
              <div className="mb-1.5 text-[10.5px] font-bold tracking-[0.1em] text-[#c9a84c] uppercase">{item.phase}</div>
              <div className="mb-2 text-[1.2rem] text-[#f0ede8]">{item.title}</div>
              <p className="max-w-[600px] text-[13px] leading-[1.65] text-[#6b7280]">{item.desc}</p>
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
  return (
    <section className="relative z-10 overflow-hidden px-6 py-[120px] text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(201,168,76,0.1)_0%,transparent_70%)]"
      />
      <div className="relative">
        <SectionHeading
          eyebrow="Ready to see it?"
          title={
            <>
              Want a platform like this
              <br />
              for your business?
            </>
          }
          center
        />
        <p className="mx-auto mt-5 mb-10 max-w-[560px] text-[1.05rem] font-light text-[#6b7280]">
          We build production-grade SaaS products — encrypted, scalable, and designed to impress.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link
            href="/contact-us"
            className="inline-block rounded-[10px] bg-[#c9a84c] px-8 py-3.5 text-[14px] font-bold text-[#0a0b0d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e8c97a] hover:shadow-[0_8px_24px_rgba(201,168,76,0.4)]"
          >
            Talk to Oxytal →
          </Link>
          <Link
            href="https://samvault.io"
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-[10px] border border-[rgba(255,255,255,0.07)] px-8 py-3.5 text-[14px] font-medium text-[#f0ede8] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.3)]"
          >
            See SamVault live ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SamVaultCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#09090d] text-[#f0ede8]" data-nav-contrast="dark">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />
      <FloatingParticles />

      <Hero />
      <StatsSection />
      <FeaturesSection />
      <ArchitectureSection />
      <SecuritySection />
      <DifferentiatorsSection />
      <StackSection />
      <TimelineSection />
      <CtaSection />
    </div>
  );
}
