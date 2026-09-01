"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cx } from "@/app/lib/cx";
import { prefersReducedMotion, useSplitReveal, useFadeUp, useListStagger } from "./useReveal";
import type { HeadingLevel } from "@/app/lib/headingLevel";
import DynamicHeading from "@/app/ui/DynamicHeading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * `ProductsOverviewPage` — a standalone, static one-pager ported from
 * `Refrence/oxytal-products.html` (the `/products` landing page — SamVault,
 * ForgePipeline, ActionPulse, Kollabry). Same treatment as the case-study
 * components in this folder (`InkJetWorldCaseStudy`/`CastletownrocheCaseStudy`/
 * `LoneRiverCaseStudy`/`RedMirchiCaseStudy`/`KaneffCaseStudy`): no
 * Contentful wiring, keeps the reference's own colour identity (`--ink`
 * `#0B1B2B`, `--body` `#546A7E`, `--accent` `#0E9BC4`, `--accent-2`
 * `#16B9E8`, the `--deep-1`/`--deep-2` `#061223`/`#0C2138` navy gradient,
 * plus each product's own accent — SamVault `#4C6EF5`, ForgePipeline
 * `#8B5CF6`, ActionPulse `#EE7C1B`, Kollabry `#0CA678`) rather than the
 * site's per-page `themeColor` accent, and typography stays the site's
 * own inherited `Poppins`. Every heading size, lede size, and section
 * container width (`max-w-*`) matches the case-study siblings' own shared
 * scale (12px eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s,
 * 16px/1.8 ledes) rather than this reference's own slightly larger
 * numbers, for visual consistency across every page this folder renders.
 *
 * Not a client case study — this is Oxytal's own products landing page —
 * so it skips the `Breadcrumb`/"Related case studies" pieces every
 * sibling has (the reference has neither), and isn't named `*CaseStudy`.
 * Two things unique to this one:
 * - The reference's own hero video markup is a placeholder ("replace the
 *   two `<source>` paths and the poster with your own files"), but a real
 *   asset for exactly this slot already exists in Contentful — the live
 *   `/products` page's own `dataVideo` block ("Our Products Video",
 *   uploaded 2026-08-22/31). `Hero` plays that real file directly as a
 *   hardcoded `<video>` `src` (same "hardcode the real asset URL, no
 *   Contentful query" convention every sibling here already uses for
 *   photos), with the reference's own scrim gradient over it for
 *   legibility, and pauses playback via `IntersectionObserver` once the
 *   hero scrolls out of view — same battery-saving behaviour the
 *   reference's own inline `<script>` implements — skipped under
 *   `prefers-reduced-motion`, which also hides the video outright.
 * - The product cards (`ProductCard`) carry their own per-product accent
 *   color as an inline CSS variable (`--c`, read by `style` on the
 *   colored bits — top border strip, tag pill, primary button, stat
 *   values) exactly like the reference's own `--c` custom property,
 *   since Tailwind's static class scanner can't discover a class name
 *   built from a runtime hex value (same reasoning `ThemePattern`/
 *   `SectionTheme.patternColor` already document elsewhere in this app).
 *
 * Registered in `ComposableElementRenderer` as subtype `productsOverview`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card grids stagger in per item.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-products.html
========================================================= */

const HERO_STRIP: { name: string; label: string }[] = [
  { name: "SamVault", label: "encrypted documents" },
  { name: "ForgePipeline", label: "AI delivery" },
  { name: "ActionPulse", label: "action & RFP" },
  { name: "Kollabry", label: "delivery & knowledge" },
];

const THESIS: { n: string; title: string; text: ReactNode }[] = [
  {
    n: "01",
    title: "They all live in the gaps",
    text: (
      <>
        Not one of these replaces a category. They sit{" "}
        <span className="font-medium text-[#0B1B2B]">between</span> the tools you already own — where the tracker
        doesn&apos;t meet the wiki, where the proposal loses touch with the project, where the handoff between two
        well-run stages costs a week.
      </>
    ),
  },
  {
    n: "02",
    title: "We're the first customer",
    text: (
      <>
        ForgePipeline runs Oxytal&apos;s delivery. ActionPulse tracks our client actions and our own bids.{" "}
        <span className="font-medium text-[#0B1B2B]">We find the failure modes before you do</span>, because
        we&apos;re the ones inconvenienced by them.
      </>
    ),
  },
  {
    n: "03",
    title: "Built to be run, not demoed",
    text: (
      <>
        Audit trails, permissions, versioning, cost visibility, GDPR flows.{" "}
        <span className="font-medium text-[#0B1B2B]">The unglamorous features are the ones we needed</span> — which
        is why they exist rather than sitting on a roadmap.
      </>
    ),
  },
  {
    n: "04",
    title: "Proof of what we can build for you",
    text: (
      <>
        Each product is a working answer to &quot;could you build us something like that&quot;.{" "}
        <span className="font-medium text-[#0B1B2B]">You can log into three of them today</span> — which is a
        stronger reference than any slide we could show you.
      </>
    ),
  },
];

interface ProductStat {
  v: string;
  l: string;
}

interface Product {
  color: string;
  tag: string;
  name: string;
  sub: string;
  why: string;
  desc: string;
  features: string[];
  exploreHref: string;
  liveHref: string;
  stats: ProductStat[];
}

const PRODUCTS: Product[] = [
  {
    color: "#4C6EF5",
    tag: "Live at samvault.io",
    name: "SamVault",
    sub: "Encrypted document management",
    why: "The gap: cloud storage holds your files. It doesn't know a passport expires.",
    desc: "A secure vault built for the documents that actually matter — passports, wills, deeds, insurance, certificates. Encrypted client-side with a unique key per document, so the server never sees plaintext. Team vaults with role-based access, share links that can be time-limited and IP-locked, a request flow that lets someone upload to your vault without an account, versioning, and reminders before anything expires.",
    features: ["Zero-knowledge encryption", "Team vaults & RBAC", "Document requests", "Expiry reminders", "Version history", "iOS & Android"],
    exploreHref: "/products/sam-vault",
    liveHref: "https://samvault.io",
    stats: [
      { v: "AES-256", l: "Authenticated encryption, per-document keys" },
      { v: "Zero-knowledge", l: "Keys derived from user credentials — a breach yields nothing" },
      { v: "Web + mobile", l: "Live platform with iOS and Android apps" },
    ],
  },
  {
    color: "#8B5CF6",
    tag: "Live at forgepipeline.ai",
    name: "ForgePipeline",
    sub: "AI-driven software delivery · Oxytal AI Lab",
    why: "The gap: the engineering isn't slow. The coordination around it is.",
    desc: "Eight specialised agents take a requirement from Confluence through architecture, code, review, testing and deployment to a reviewed GitHub pull request. Every handoff is logged with timestamp, agent version and token cost. Every consequential checkpoint stops and waits for a person — architecture review, code review, deployment. It runs Oxytal's own delivery work, which is how we know what it does under real conditions.",
    features: ["8 specialised agents", "Human approval gates", "Full audit trail", "Confluence · Jira · GitHub", "Token cost visibility", "Resume from any stage"],
    exploreHref: "/products/forgepipeline",
    liveHref: "https://forgepipeline.ai",
    stats: [
      { v: "14 min", l: "From a Confluence requirement to an open pull request" },
      { v: "100%", l: "Audit trail coverage across every agent decision" },
      { v: "8 agents", l: "Requirements, design, build, review, test, fix, deploy, monitor" },
    ],
  },
  {
    color: "#EE7C1B",
    tag: "Live at actionpulse.oxytal.com",
    name: "ActionPulse",
    sub: "Enterprise action, proposal & pipeline management",
    why: "The gap: the proposal you won and the project you're delivering live in different systems.",
    desc: "Built because we were running client actions across a tracker, a wiki, email threads and spreadsheets with no single source of truth. Action management with SLA rules and escalation, an RFP workspace that exports to PowerPoint, a reusable content library with approvals, a CRM pipeline linked to the proposals that created it, and executive analytics that show SLA compliance and weighted forecast in real time — all with strict isolation between organisations.",
    features: ["Multi-organisation isolation", "Six-tier permissions", "RFP workspace → PPTX", "Reusable content library", "CRM pipeline", "Executive analytics"],
    exploreHref: "/products/action-pulse",
    liveHref: "https://actionpulse.oxytal.com",
    stats: [
      { v: "85+", l: "Versions shipped in continuous deployment" },
      { v: "70%", l: "Less time building proposals, using the content library" },
      { v: "100%", l: "Traceability from deal back to the proposal that won it" },
    ],
  },
  {
    color: "#0CA678",
    tag: "Live at kollabry.com",
    name: "Kollabry",
    sub: "Delivery tracking & knowledge, one workspace",
    why: "The gap: the plan lives in the tracker. The reasoning behind it lives somewhere else.",
    desc: "Two connected surfaces on one canvas. Kollabry runs the work — boards with custom statuses, backlogs, sprints with capacity and burndown, retrospectives with actions tracked to done. Synergy holds the thinking — rich documents, infinite-canvas whiteboards with live cursors, reviews and approvals, version history with side-by-side compare. Issues and documents link in both directions, so context travels with the task instead of evaporating between cycles.",
    features: ["Boards, sprints & retros", "Knowledge base", "Whiteboards, live cursors", "Two-way issue ↔ doc links", "Reviews & approvals", "Passwordless & SSO"],
    exploreHref: "/products/kollabry",
    liveHref: "https://www.kollabry.com/",
    stats: [
      { v: "3 in 1", l: "Tracker, knowledge base and whiteboard in one workspace" },
      { v: "Two-way", l: "Documents and issues stay linked in both directions" },
      { v: "Passwordless", l: "One-time email codes or Microsoft sign-in" },
    ],
  },
];

const CHANGE: { n: string; title: string; text: ReactNode }[] = [
  {
    n: "01",
    title: "Context should travel with the work",
    text: (
      <>
        A task without its reasoning is a task somebody will do wrong or redo.{" "}
        <span className="font-medium text-white">Kollabry links every issue to the document behind it</span>, in
        both directions, so nobody has to reconstruct a decision from memory two sprints later.
      </>
    ),
  },
  {
    n: "02",
    title: "Automation should stop where it matters",
    text: (
      <>
        The debate about AI in delivery is framed as how much to automate. We think the better question is where it
        should pause.{" "}
        <span className="font-medium text-white">
          ForgePipeline automates the repetitive 40% and halts at every consequential decision
        </span>{" "}
        — with a person, and a record.
      </>
    ),
  },
  {
    n: "03",
    title: "Privacy shouldn't need trust",
    text: (
      <>
        Most storage asks you to trust the provider.{" "}
        <span className="font-medium text-white">SamVault is designed so we couldn&apos;t read your documents if we wanted to</span>{" "}
        — keys derived from your credentials, encryption before anything leaves your device. Security you can
        verify beats security you&apos;re promised.
      </>
    ),
  },
  {
    n: "04",
    title: "The promise and the delivery should be one system",
    text: (
      <>
        Organisations win work in one place and deliver it in another, then wonder why expectations drift.{" "}
        <span className="font-medium text-white">ActionPulse keeps the proposal and the project in the same platform</span>,
        so what was promised stays visible to the people delivering it.
      </>
    ),
  },
  {
    n: "05",
    title: "Bespoke shouldn't mean unaffordable",
    text: (
      <>
        Teams accept tools that fit badly because building seems out of reach.{" "}
        <span className="font-medium text-white">Agent-accelerated delivery has changed that arithmetic</span> —
        these four are the evidence, and it&apos;s why a custom platform is now a realistic option for far more
        organisations.
      </>
    ),
  },
  {
    n: "06",
    title: "Products should outlive the people who built them",
    text: (
      <>
        Audit trails, version history, permissions and documented handover aren&apos;t features anyone asks for in
        a demo.{" "}
        <span className="font-medium text-white">
          They&apos;re what separates software you can inherit from software you have to replace.
        </span>
      </>
    ),
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Feel the problem first",
    text: "None of these started with a market. They started with a week we'd wasted. Building for a problem you have yourself removes the guesswork about what actually matters.",
  },
  {
    n: "02",
    title: "Design for multi-tenancy on day one",
    text: "Isolation, permissions and roles designed in from the first schema. Retrofitting them is one of the most expensive corrections in software, and it always shows.",
  },
  {
    n: "03",
    title: "Ship in small versions, continuously",
    text: "ActionPulse reached eighty-five shipped versions by releasing testable modules rather than milestones — real working software in front of users instead of wireframes.",
  },
  {
    n: "04",
    title: "Build with agents, approve with people",
    text: "AI-accelerated development inside our own workflow, with human review at every merge. It's how four production platforms exist alongside a full client practice.",
  },
  {
    n: "05",
    title: "Harden, then keep going",
    text: "Rate limiting, audit trails, GDPR flows, cost controls, security patches. All four are supported continuously — a product you stop maintaining is a liability you handed someone.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#0E9BC4", center }: { children: ReactNode; color?: string; center?: boolean }) {
  return (
    <span
      className={cx("mb-4 flex items-center gap-2.5 text-[12px] font-bold tracking-[0.16em] uppercase", center && "justify-center")}
      style={{ color }}
    >
      <span aria-hidden className="h-0.5 w-[22px] rounded-sm" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  eyebrowColor,
  title,
  lede,
  dark,
  narrow = true,
  headingLevel = "h2",
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  lede?: ReactNode;
  dark?: boolean;
  narrow?: boolean;
  /** Which heading tag to render — `h1`–`h6` (see app/lib/headingLevel.ts). Defaults to `h2`, this component's original fixed level, so every existing call site renders unchanged. */
  headingLevel?: HeadingLevel;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <div className={narrow ? "max-w-[640px]" : undefined}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-[20ch] text-[clamp(28px,3.2vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#0B1B2B]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A9BACE]" : "text-[#546A7E]")}>{lede}</p>
      )}
    </div>
  );
}


/* =========================================================
   WHY WE BUILD PRODUCTS
========================================================= */

function WhyWeBuildSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why we build products"
            title="A services firm that ships products argues from a different position."
            headingLevel="h2"
            narrow={false}
          />
          <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0B1B2B]">
            Most agencies advise on software they&apos;ve never had to operate. We wanted the other relationship —
            the one where an architectural shortcut becomes our problem at 2am, where a token bill arrives with our
            name on it, and where a feature nobody uses is money we spent on ourselves.
          </p>
          <p className="mb-4.5 text-[16px] leading-[1.8] text-[#546A7E]">
            Each of these four began the same way. A gap in how we worked, a tool that almost fit, a quote for
            something that should have cost a tenth as much. We built the thing, used it, hardened it, and then
            found other people had exactly the same gap.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3ECF2] bg-[#E3ECF2] sm:grid-cols-2"
        >
          {THESIS.map((item) => (
            <div
              key={item.n}
              className="group bg-white p-7 transition-colors duration-300 hover:bg-[#F1F7FB]"
            >
              <span className="mb-3.5 block font-mono text-[10.5px] tracking-[0.1em] text-[#0E9BC4] transition-colors duration-300 group-hover:text-[#0B87AC]">
                {item.n}
              </span>
              <span className="mb-2.5 text-[21px] leading-[1.4] font-extrabold text-[#0B1B2B] block transition-transform duration-300 group-hover:translate-x-1">
                {item.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#546A7E]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE FOUR PRODUCTS
========================================================= */

function ProductsSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const listRef = useListStagger<HTMLDivElement>("y", 24);

  return (
    <section id="products" className="bg-gradient-to-b from-[#F1F7FB] to-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="The products"
            title="Four platforms, four gaps."
            headingLevel="h2"
            lede="All live, all in daily use, all built end to end by Oxytal — design, engineering, security and the ongoing work of keeping them running."
            narrow={false}
          />
        </div>

        <div ref={listRef} className="mt-9 flex flex-col gap-6 sm:mt-11 sm:gap-8">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const style = { "--c": product.color } as CSSProperties;

  return (
    <article
      style={style}
      className="relative grid grid-cols-1 overflow-hidden rounded-[22px] border border-[#E3ECF2] bg-white shadow-[0_2px_0_0_var(--c)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_2px_0_0_var(--c),0_26px_56px_-26px_rgba(11,27,43,0.22)] lg:grid-cols-[1.08fr_0.92fr]"
    >
      <div className="p-7 sm:p-9">
        <span
          className="mb-4.5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.11em] uppercase"
          style={{ color: "var(--c)", borderColor: "color-mix(in srgb, var(--c) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--c) 10%, transparent)" }}
        >
          {product.tag}
        </span>

        <h3 className="mb-1.5 text-[clamp(24px,2.4vw,31px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#0B1B2B]">
          {product.name}
        </h3>
        <p className="mb-4.5 font-mono text-[11px] tracking-[0.1em] text-[#8598AA] uppercase">{product.sub}</p>

        <p className="mb-4 text-[16px] leading-[1.68] font-medium text-[#0B1B2B]">{product.why}</p>
        <p className="mb-5.5 text-[14.5px] leading-[1.7] text-[#546A7E]">{product.desc}</p>

        <ul className="mb-6 flex flex-wrap gap-1.75 list-none">
          {product.features.map((feature) => (
            <li key={feature} className="rounded-full border border-[#E3ECF2] bg-[#F1F6F9] px-3 py-1.25 text-[12.5px] text-[#546A7E]">
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={product.exploreHref}
            style={{ backgroundColor: "var(--c)" }}
            className="inline-flex items-center gap-2 rounded-[9px] px-5 py-2.75 text-[14px] font-medium text-white transition-transform duration-150 hover:-translate-y-0.5 hover:brightness-110"
          >
            Explore {product.name} <span aria-hidden>→</span>
          </Link>
          <Link
            href={product.liveHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[#E3ECF2] px-5 py-2.75 text-[14px] font-medium text-[#0B1B2B] transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#8598AA]"
          >
            Visit live <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2.5 border-t border-[#E3ECF2] bg-[#F1F6F9] p-7 sm:p-9 lg:border-t-0 lg:border-l">
        {product.stats.map((stat) => (
          <div key={stat.l} className="rounded-xl border border-[#E3ECF2] bg-white p-4.5">
            <div style={{ color: "var(--c)" }} className="text-[24px] leading-none font-extrabold tracking-[-0.03em]">
              {stat.v}
            </div>
            <div className="mt-1.75 text-[13.5px] leading-[1.45] text-[#546A7E]">{stat.l}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

/* =========================================================
   WHAT WE'RE TRYING TO CHANGE
========================================================= */

function ChangeSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#061223] to-[#0C2138] px-5 py-14 text-[#EAF2F8] sm:px-8 sm:py-16 lg:py-[104px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[44%] -left-[20%] h-[880px] w-[880px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,185,232,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[640px]">
          <SectionHead
            eyebrow="What we're trying to change"
            eyebrowColor="#16B9E8"
            title="Software got good. The seams between it didn't."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A9BACE]">
            Any organisation can buy excellent tools now. What nobody sells is the connective tissue — and
            that&apos;s where the working week actually goes. Re-explaining a decision. Rebuilding a proposal from
            three old ones. Chasing a status. Waiting on a handoff between two teams who are both doing their jobs
            well.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A9BACE]">
            These four products are one argument, made four times:{" "}
            <strong className="font-semibold text-white">the waste isn&apos;t inside the tools, it&apos;s between them</strong>{" "}
            — and the gaps are worth building for.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {CHANGE.map((item) => (
            <div key={item.n} className="bg-[#061223] p-6.5 transition-colors duration-200 hover:bg-[#16253A]">
              <span className="mb-3.5 block font-mono text-[11px] tracking-[0.1em] text-[#16B9E8]">{item.n}</span>
              <span className="mb-2.5 text-[21px] leading-[1.35] font-extrabold text-white block">
                {item.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#A9BACE]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   OUR APPROACH
========================================================= */

function ApproachSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useListStagger<HTMLDivElement>("y", 20);
  const noteRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFE] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Our approach"
            title="The same method behind all four."
            headingLevel="h3"
            lede="Every product on this page followed the same path — and it's the path we use on client work, which is rather the point."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E3ECF2] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E3ECF2]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#0E9BC4]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0B1B2B] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#546A7E]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div ref={noteRef} className="mt-7 rounded-r-[14px] border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] py-5.5 pr-6.5 pl-7">
          <p className="text-[15.5px] leading-[1.65] text-[#0B1B2B]">
            <strong className="font-semibold">Why this matters if you&apos;re a client rather than a user.</strong>{" "}
            When we recommend an architecture, we&apos;ve lived with that decision on our own platforms. When we
            estimate, it&apos;s from work we delivered last quarter, not a benchmark. Building products keeps our
            advice honest in a way that no amount of experience alone does.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductsOverviewPage() {
  return (
    <div className="relative overflow-hidden bg-[#FBFDFE]">
      <WhyWeBuildSection />
      <ProductsSection />
      <div data-nav-contrast="dark">
        <ChangeSection />
      </div>
      <ApproachSection />
    </div>
  );
}
