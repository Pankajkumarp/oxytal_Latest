"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
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
 * `CastletownrocheCaseStudy` — a standalone, static case-study one-pager
 * ported from `Refrence/oxytal-case-study-ctrns.html`. Same treatment as
 * its siblings in this folder (`InkJetWorldCaseStudy`/`LoneRiverCaseStudy`/
 * `RedMirchiCaseStudy`/`KaneffCaseStudy`): no Contentful wiring, keeps the
 * reference's own colour identity (`--ink` `#0F1A10`, `--body` `#526155`,
 * `--accent` `#0B7A18`, `--accent-2` `#3B8632`, `--warm` `#C97A2B`, the
 * `--deep-1`/`--deep-2` `#08150A`/`#132A16` near-black-green gradient)
 * rather than the site's per-page `themeColor` accent, and typography
 * stays the site's own inherited `Poppins`. Every heading size, lede
 * size, and section container width (`max-w-*`) matches its siblings
 * exactly — 12px eyebrows, `clamp(28px,3.2vw,40px)`/`leading-[1.2]` h2s,
 * 16px/1.8 ledes, `max-w-7xl` for the wide sections, `max-w-5xl` for the
 * narrow prose ones, `max-w-6xl` for "what we built" — rather than the
 * numbers baked into the reference's own stylesheet.
 *
 * Things unique to this one:
 * - Like `InkJetWorldCaseStudy`, the hero has no `.hero-shot` photo — the
 *   reference's own hero is text-and-facts only.
 * - "What we built" has 4 rows, not the usual 3 — the reference genuinely
 *   walks through 4 audiences (parents, the illustrated character system,
 *   teachers, new families), each with its own ported SVG diagram (same
 *   `DIAGRAMS` map idiom as every diagram-led sibling), including a
 *   hand-drawn tree/fox/leaves illustration diagram unlike anything the
 *   other case studies needed.
 * - "The challenge" runs 4 paragraphs before the pull quote instead of
 *   the usual 3, since the reference genuinely argues through 4 distinct
 *   points (two competing audiences, then the statutory-publisher angle)
 *   before landing the quote.
 * - "The detail that mattered" cards here are plain title+text, unlike
 *   `InkJetWorldCaseStudy`'s `who`-labelled cards — the reference has no
 *   equivalent device on this page.
 *
 * The reference's own client-quote block is a marked placeholder
 * ("Placeholder — replace with a client quote") and is skipped entirely
 * here rather than inventing a quote attributed to a real person.
 *
 * Registered in `ComposableElementRenderer` as subtype `castletownroche`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split: every section
 * `<h2>` gets the word-split reveal via `SectionHead`; the hero's own
 * `<h1>` plays on mount instead of on scroll; single-block intros fade up
 * as one unit; card/row grids stagger in per item; each built row's
 * text/diagram fade up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-ctrns.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Castletownroche NS, Mallow, Co. Cork" },
  { k: "Sector", v: "Education · Irish primary school" },
  { k: "Services", v: "Experience Design · Engineering · Support" },
  { k: "Languages", v: "English & Irish" },
  { k: "Status", v: "Built from scratch, supported since 2019" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "6+ yrs", l: "Live and continuously supported since launch" },
  { v: "30+", l: "Pages, all editable by school staff" },
  { v: "2", l: "Languages, English and Irish" },
  { v: "100%", l: "Statutory publishing requirements met" },
  { v: "—", l: "Enrolment enquiries through the site" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "It's run by teachers, in the gaps",
    text: "Nobody at a primary school has a communications role. Publishing happens between classes, at lunchtime, or not at all. If posting news takes more than a few minutes, the site quietly goes stale — and a stale school site tells prospective families something the school didn't intend.",
  },
  {
    n: "02",
    title: "Statutory obligations, permanently visible",
    text: "The Annual Admissions Notice, the designated child safeguarding contacts, the school policies — these must be published and easy to find. They also can't be allowed to make the site feel like a compliance document.",
  },
  {
    n: "03",
    title: "The photographs are of children",
    text: "Every image decision on this project carries a weight that a drinks brand or a print shop never has to think about. What goes online, at what resolution, with what caption, is a safeguarding question before it's a design one.",
  },
];

/* =========================================================
   WHAT WE BUILT — diagrams
========================================================= */

function ParentsDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="A parent finds the stationery list for their child's class in two taps from the menu."
    >
      <rect x="34" y="34" width="132" height="232" rx="16" fill="#F2F7EF" stroke="#E3EBDF" />
      <text x="100" y="62" fill="#87957F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">MENU</text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11" fill="#526155">
        <rect x="52" y="76" width="96" height="24" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="66" y="92">Our School</text>
        <rect x="52" y="108" width="96" height="24" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="66" y="124">Classes</text>
        <rect x="52" y="140" width="96" height="24" rx="6" fill="#0B7A18" />
        <text x="66" y="156" fill="#fff" fontWeight="600">Parents</text>
        <rect x="52" y="172" width="96" height="24" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="66" y="188">Activities</text>
        <rect x="52" y="204" width="96" height="24" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="66" y="220">News</text>
      </g>
      <path d="M178 152h34" stroke="#0B7A18" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M206 146l8 6-8 6" fill="none" stroke="#0B7A18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="224" y="34" width="132" height="232" rx="16" fill="#F2F7EF" stroke="#E3EBDF" />
      <text x="290" y="62" fill="#87957F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">PARENTS</text>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="10.5" fill="#526155">
        <rect x="240" y="76" width="100" height="22" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="252" y="91">Prospectus</text>
        <rect x="240" y="104" width="100" height="22" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="252" y="119">Calendar</text>
        <rect x="240" y="132" width="100" height="22" rx="6" fill="#0B7A18" />
        <text x="252" y="147" fill="#fff" fontWeight="600">Stationery</text>
        <rect x="240" y="160" width="100" height="22" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="252" y="175">Homework</text>
        <rect x="240" y="188" width="100" height="22" rx="6" fill="#fff" stroke="#E3EBDF" />
        <text x="252" y="203">Tracksuit</text>
      </g>
      <path d="M368 152h30" stroke="#0B7A18" strokeWidth="2" strokeDasharray="5 6" />
      <path d="M392 146l8 6-8 6" fill="none" stroke="#0B7A18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="410" y="60" width="86" height="180" rx="14" fill="#fff" stroke="#0B7A18" />
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="9.5" fill="#526155" textAnchor="middle">
        <rect x="424" y="80" width="58" height="30" rx="6" fill="#E9F6E6" />
        <text x="453" y="99">Infants</text>
        <rect x="424" y="118" width="58" height="30" rx="6" fill="#E9F6E6" />
        <text x="453" y="137">1st &amp; 2nd</text>
        <rect x="424" y="156" width="58" height="30" rx="6" fill="#E9F6E6" />
        <text x="453" y="175">3rd &amp; 4th</text>
        <rect x="424" y="194" width="58" height="30" rx="6" fill="#E9F6E6" />
        <text x="453" y="213">5th &amp; 6th</text>
      </g>
    </svg>
  );
}

function CharacterDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="The school's illustrated identity — trees, leaves and a fox — used as page furniture."
    >
      <rect x="20" y="24" width="480" height="252" rx="16" fill="#F2F7EF" stroke="#E3EBDF" />
      <g opacity=".9">
        <path
          d="M120 210c0-40 26-66 26-96 0-26-18-40-18-56 0-14 12-24 26-24s26 10 26 24c0 16-18 30-18 56 0 30 26 56 26 96z"
          fill="#3B8632"
          opacity=".28"
        />
        <rect x="146" y="204" width="12" height="40" rx="4" fill="#0B7A18" opacity=".45" />
      </g>
      <g opacity=".9">
        <circle cx="330" cy="140" r="52" fill="#3B8632" opacity=".22" />
        <circle cx="368" cy="168" r="34" fill="#0B7A18" opacity=".18" />
        <rect x="324" y="188" width="12" height="56" rx="4" fill="#0B7A18" opacity=".45" />
      </g>
      <g transform="translate(228,196)">
        <path d="M0 34c0-16 10-28 24-28s24 12 24 28z" fill="#C97A2B" opacity=".8" />
        <circle cx="24" cy="10" r="12" fill="#C97A2B" />
        <path d="M14 2l-4-10 10 4zM34 2l4-10-10 4z" fill="#C97A2B" />
        <circle cx="20" cy="10" r="1.8" fill="#fff" />
        <circle cx="29" cy="10" r="1.8" fill="#fff" />
      </g>
      <g fill="#3B8632" opacity=".5">
        <ellipse cx="82" cy="86" rx="16" ry="9" transform="rotate(-24 82 86)" />
        <ellipse cx="436" cy="72" rx="14" ry="8" transform="rotate(18 436 72)" />
        <ellipse cx="416" cy="232" rx="13" ry="7" transform="rotate(-12 416 232)" />
      </g>
      <path d="M52 244h416" stroke="#0B7A18" strokeWidth="2" opacity=".3" strokeLinecap="round" />
      <text x="260" y="270" fill="#87957F" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" textAnchor="middle">
        DRAWN FOR THIS SCHOOL, NOT BOUGHT
      </text>
    </svg>
  );
}

function TeachersDiagram() {
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Class pages, activity pages and a social feed, all maintained by school staff.">
      <g fill="#fff" stroke="#E3EBDF">
        <rect x="26" y="40" width="140" height="96" rx="12" />
        <rect x="26" y="152" width="140" height="96" rx="12" />
        <rect x="190" y="40" width="140" height="96" rx="12" />
        <rect x="190" y="152" width="140" height="96" rx="12" />
      </g>
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11" fontWeight="600" fill="#0F1A10">
        <text x="46" y="70">Infants</text>
        <text x="46" y="182">3rd &amp; 4th</text>
        <text x="210" y="70">1st &amp; 2nd</text>
        <text x="210" y="182">5th &amp; 6th</text>
      </g>
      <g fill="#E9F6E6">
        <rect x="46" y="82" width="100" height="8" rx="4" />
        <rect x="46" y="96" width="76" height="8" rx="4" />
        <rect x="46" y="110" width="88" height="8" rx="4" />
        <rect x="46" y="194" width="100" height="8" rx="4" />
        <rect x="46" y="208" width="70" height="8" rx="4" />
        <rect x="46" y="222" width="90" height="8" rx="4" />
        <rect x="210" y="82" width="100" height="8" rx="4" />
        <rect x="210" y="96" width="82" height="8" rx="4" />
        <rect x="210" y="110" width="66" height="8" rx="4" />
        <rect x="210" y="194" width="100" height="8" rx="4" />
        <rect x="210" y="208" width="88" height="8" rx="4" />
        <rect x="210" y="222" width="72" height="8" rx="4" />
      </g>
      <rect x="356" y="40" width="140" height="208" rx="12" fill="#0B7A18" />
      <text x="426" y="70" fill="#fff" fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" fontWeight="600" textAnchor="middle">
        School news
      </text>
      <g fill="#fff" opacity=".22">
        <rect x="376" y="86" width="46" height="46" rx="7" />
        <rect x="430" y="86" width="46" height="46" rx="7" />
        <rect x="376" y="140" width="46" height="46" rx="7" />
        <rect x="430" y="140" width="46" height="46" rx="7" />
      </g>
      <rect x="376" y="200" width="100" height="28" rx="8" fill="#fff" opacity=".16" />
      <text x="426" y="218" fill="#DFF3DB" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        POST ONCE
      </text>
    </svg>
  );
}

function NewFamiliesDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-label="A family moves from reading about the school to the admissions notice and the school's own enrolment system."
    >
      <g fill="#fff" stroke="#E3EBDF">
        <rect x="24" y="96" width="116" height="108" rx="14" />
        <rect x="164" y="96" width="116" height="108" rx="14" />
      </g>
      <rect x="304" y="96" width="116" height="108" rx="14" fill="#E9F6E6" stroke="#0B7A18" />
      <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11.5" fontWeight="600" fill="#0F1A10" textAnchor="middle">
        <text x="82" y="140">Read about</text>
        <text x="82" y="158">the school</text>
        <text x="222" y="140">Admissions</text>
        <text x="222" y="158">Notice</text>
        <text x="362" y="140">Pre-enrol</text>
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#87957F" textAnchor="middle">
        <text x="82" y="180">principal · classes</text>
        <text x="222" y="180">statutory</text>
      </g>
      <text x="362" y="180" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#0B7A18" textAnchor="middle">
        school&apos;s own system
      </text>
      <g stroke="#0B7A18" strokeWidth="2" fill="none">
        <path d="M148 150h8" strokeDasharray="5 6" />
        <path d="M288 150h8" strokeDasharray="5 6" />
      </g>
      <path d="M150 144l8 6-8 6M290 144l8 6-8 6" fill="none" stroke="#0B7A18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="140" y="234" width="240" height="34" rx="10" fill="#fff" stroke="#C97A2B" />
      <text x="260" y="256" fill="#C97A2B" fontFamily="IBM Plex Sans, sans-serif" fontSize="11" textAnchor="middle">
        Or just come and look around
      </text>
      <path d="M260 210v20" stroke="#C97A2B" strokeWidth="1.6" strokeDasharray="4 5" />
    </svg>
  );
}

const DIAGRAMS = {
  parents: ParentsDiagram,
  character: CharacterDiagram,
  teachers: TeachersDiagram,
  newFamilies: NewFamiliesDiagram,
} as const;

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  diagram: keyof typeof DIAGRAMS;
}[] = [
  {
    n: "01 · For parents",
    title: "Everything a parent needs, one menu deep",
    desc: "The Parents section is organised around what people actually come looking for — prospectus, enrolment form, calendar, attendance, homework, tracksuit, and a stationery list broken out by class rather than bundled into one file a parent then has to search.",
    bullets: [
      "A separate stationery list per class group — no scrolling to find your child's",
      "Documents reachable directly from the navigation, not buried in a news post",
      'A calendar on the homepage, because "is there school on Monday" is the most-asked question in Irish education',
      "Built to work on a phone held in one hand, at eight in the morning",
    ],
    diagram: "parents",
  },
  {
    n: "02 · The character",
    title: "An illustrated world, drawn for this school",
    desc: "Trees, leaves, a fox, children under a canopy — a small illustrated identity that gives the site warmth without relying on photographs of pupils to do it. It ages far better than stock imagery, and it works on the pages where a photograph wouldn't be appropriate.",
    bullets: [
      "Custom illustration rather than bought stock — nothing another school also has",
      "Carries the warmth on pages where children's photographs shouldn't",
      "Drawn as scalable artwork, so it stays sharp and weighs almost nothing",
      "Six years on it still looks current, which stock photography would not",
    ],
    diagram: "character",
  },
  {
    n: "03 · For teachers",
    title: "Classes and news, published in minutes",
    desc: "Each class group has its own page written in the children's voice, and teachers keep them up themselves. The news section and an Instagram feed pull the school's day-to-day life onto the site without anyone having to post twice.",
    bullets: [
      "A page per class group, maintained by that teacher",
      "Activity pages for Green Schools, Coiste Gaelach, Student Council, sport and healthy living",
      "Social posts surface on the site automatically — one post, two places",
      "Editing simple enough that it happens during a lunch break",
    ],
    diagram: "teachers",
  },
  {
    n: "04 · For new families",
    title: "A clear path from curiosity to enrolment",
    desc: "The principal's address in English and Irish, class pages showing real work, and then a single obvious route: the Annual Admissions Notice, and a hand-off to the school's own enrolment system rather than a form that creates a second place to check.",
    bullets: [
      "Admissions Notice published as required, easy to find and current",
      "Pre-enrolment handed to the school's existing system — no duplicate records",
      "An open invitation to visit, because that's what actually converts a family",
      "Welcome in both languages, as a statement of identity rather than a translation",
    ],
    diagram: "newFamilies",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "The school decides, always",
    text: "Every image is published by school staff, not by us. Nobody outside the school makes a judgement about which children appear online.",
  },
  {
    title: "Illustration carries the warmth",
    text: "Trees, leaves and a fox do the work that stock photographs of children usually do on school sites. The page feels alive without needing a face.",
  },
  {
    title: "Safeguarding contacts are permanent",
    text: "The Designated Liaison Person and deputy are named in the footer of every page — not filed under policies, where nobody in difficulty would think to look.",
  },
  {
    title: "Restraint over completeness",
    text: "Not every achievement needs a photograph. Where a name and a sentence tell the story just as well, that's what the page uses.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Ask what parents actually phone about",
    text: "The office knows exactly which questions come in most often. Those became the shortest paths on the site — which is a faster route to good information architecture than any workshop.",
  },
  {
    n: "02",
    title: "Separate the statutory from the welcoming",
    text: "Admissions notices, policies and safeguarding contacts given permanent, findable places, so the rest of the site could be warm without ever hiding an obligation.",
  },
  {
    n: "03",
    title: "Draw an identity instead of buying one",
    text: "A small illustrated world made for this school. It cost more than stock imagery and it's the reason the site still looks like itself six years later.",
  },
  {
    n: "04",
    title: "Make editing survivable",
    text: "Teachers were shown how to update their own class page and post news in a few minutes. If that had needed training notes, it would never have happened twice.",
  },
  {
    n: "05",
    title: "Support through every school year since",
    text: "New calendars, new stationery lists, new admissions notices, new staff, a campaign site when the school needed one. Ongoing work, timed around term.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Platform", items: ["WordPress", "Visual page editing", "Staff-managed content", "Document library"] },
  { title: "Features", items: ["School events calendar", "News section", "Social feed", "Class & activity pages"] },
  { title: "Compliance", items: ["Annual Admissions Notice", "Safeguarding contacts", "School policies", "Privacy notice"] },
  { title: "Support", items: ["Annual content updates", "Platform maintenance", "Staff guidance", "Additional sites when needed"] },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/diageobrandpromoter",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/brandpromotor.webp",
    alt: "Diageo Brand Promoter platform",
    k: "Diageo · Safeguarding",
    title: "Brand Promoter Standard",
    text: "Conduct and safeguarding training in 17 languages.",
  },
  {
    href: "/case-studies/inkjet-world",
    img: "https://staginginkjet.oxytalapps.com/wp-content/uploads/2026/04/BusinessCard_Sample_1-scaled.png",
    alt: "InkJet World print shop",
    k: "Print & retail",
    title: "InkJet World",
    text: 'You can\'t put "a poster" in a shopping cart.',
  },
  {
    href: "/case-studies/Kaneff",
    img: "https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp",
    alt: "Kaneff Group document platform on SharePoint Online",
    k: "Real estate",
    title: "Kaneff Group",
    text: "7 TB read, cleaned and moved — with 20% less storage after.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#0B7A18" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color }}>
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
    <div className={narrow ? "max-w-[620px]" : undefined}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <DynamicHeading
        level={headingLevel}
        ref={titleRef}
        className={cx(
          "max-w-[20ch] text-[clamp(28px,3.2vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em]",
          dark ? "text-white" : "text-[#0F1A10]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#A6B8A3]" : "text-[#526155]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#0B7A18" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* =========================================================
   BREADCRUMB
========================================================= */

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="bg-[#08150A] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.09em] text-[#6E8470] uppercase">
          <li>
            <Link href="/" className="text-[#9FB49C] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#9FB49C] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Castletownroche National School</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO — no `.hero-shot` photo in the reference, so none rendered here
========================================================= */

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLParagraphElement>(null);
  const standRef = useRef<HTMLParagraphElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);

  // Hero's own `<h1>` plays on mount rather than on scroll — it's
  // already in view the instant the page loads, same as every sibling
  // case study's own hero.
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
          }),
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const targets = [clientRef.current, standRef.current, factsRef.current, visitRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(clientRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(standRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.5)
        .from(factsRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(visitRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.7);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#08150A] to-[#132A16] pt-12 pb-12 text-[#EAF3E8] sm:pt-16 sm:pb-16 lg:pt-[88px] lg:pb-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(95,191,82,.20), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-mono text-[12px] tracking-[0.18em] text-[#3B8632] uppercase">
          Case study · Castletownroche National School · Co. Cork
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Most people using a school website already chose the school.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#A6B8A3]">
          School sites are usually designed as prospectuses — built to persuade a family who hasn&apos;t decided.
          But almost every visit comes from a parent who enrolled years ago and needs one thing: the stationery
          list, the finish time, or whether there&apos;s school on Monday. Usually on a phone, usually while doing
          something else. We designed for them first, and the prospectus second.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#08150A] px-5 py-4.5">
              <dt className="mb-1.5 font-mono text-[11px] tracking-[0.12em] text-[#6E8470] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#EAF3E8]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.ctrns.ie/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#3B8632] hover:bg-[#3B8632]/12"
        >
          Visit the live site
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </header>
  );
}

/* =========================================================
   OUTCOMES
========================================================= */

function OutcomesSection() {
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E3EBDF] bg-[#E3EBDF] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] text-[#0B7A18]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#526155]">{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   THE CHALLENGE
========================================================= */

function ChallengeSection() {
  const bodyRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead
          eyebrow="The challenge"
          title="Two audiences who want opposite things."
          headingLevel="h2"
          narrow={false}
        />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#0F1A10]">
          Castletownroche National School sits on Close Road, outside Mallow in north Cork. Like every Irish primary
          school, its website has to do two jobs that pull against each other — and the one everybody designs for
          is the smaller of the two.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#526155]">
          The first audience is a family deciding where to send their child. They want warmth, a sense of the place,
          the principal&apos;s voice, photographs of children who look happy. That&apos;s the brochure, and
          it&apos;s what school websites are usually built to be.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#526155]">
          The second audience is every parent who already enrolled. They visit far more often, and they never
          browse. They want the stationery list for third class, the calendar, the tracksuit supplier, whether
          Friday is a half day. One specific thing, found in seconds, usually one-handed while making a lunch.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#526155]">
          Underneath both sits a third job nobody mentions: the site is a statutory publisher. Irish schools must
          publish an Annual Admissions Notice, their child safeguarding contacts, and their policies. Legal
          obligations share a page with photographs of children playing.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#0B7A18] bg-[#E9F6E6] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#0F1A10]">
            Design for the prospectus alone and the site fails a hundred times a week. Design only for utility and
            the school looks like a filing cabinet. The work was holding both without either one winning.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHY IT WAS HARD
========================================================= */

function WhyItWasHardSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-gradient-to-b from-[#F1F8EE] to-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three constraints that don't apply to commercial sites."
            headingLevel="h2"
            lede="A school is not a small business with a smaller budget. The obligations and the operating reality are genuinely different."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E3EBDF] bg-[#E3EBDF] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-mono text-[12px] tracking-[0.1em] text-[#0B7A18]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#0F1A10] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#526155]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHAT WE BUILT
========================================================= */

function WhatWeBuiltSection() {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="A warm front door and a fast filing system."
            headingLevel="h2"
            lede="The structure carries both audiences. Parents get the shortest possible path to a document; prospective families get the school at its best."
            narrow={false}
          />
        </div>

        <div className="mt-10 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          {BUILT_ROWS.map((row) => (
            <BuiltRow key={row.n} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltRow({ row }: { row: (typeof BUILT_ROWS)[number] }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();
  const Diagram = DIAGRAMS[row.diagram];

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-mono text-[12px] tracking-[0.11em] text-[#0B7A18]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0F1A10] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#526155]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#526155]",
                index > 0 && "border-t border-[#F2F7EF]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div
        ref={mediaRef}
        className="rounded-[18px] border border-[#E3EBDF] bg-white p-5 shadow-[0_20px_46px_-22px_rgba(15,26,16,0.18)] sm:p-7"
      >
        <Diagram />
      </div>
    </div>
  );
}

/* =========================================================
   THE DETAIL THAT MATTERED
========================================================= */

function DetailThatMatteredSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#08150A] to-[#132A16] px-5 py-14 text-[#EAF3E8] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(95,191,82,.18), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#3B8632"
            headingLevel="h3"
            title="The photographs are of children."
            dark
            narrow={false}
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#A6B8A3]">
            Every other project we&apos;ve worked on treats imagery as a design decision. On a primary school
            website it isn&apos;t. A photograph of a child on a public page is a safeguarding matter first, and
            everything else afterwards — what&apos;s shown, how large, whether a name appears beside a face, and who
            decides.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#A6B8A3]">
            <strong className="font-semibold text-white">
              That changed how the site was built, not just what went on it.
            </strong>{" "}
            The school controls the images, the structure gives them somewhere appropriate for every kind of page,
            and the illustrated world means no page ever has to use a child&apos;s photograph simply to avoid
            looking empty.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#08150A] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#9FB49C]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HOW WE WORKED
========================================================= */

function HowWeWorkedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const phasesRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Built around a school year, not a sprint plan."
            headingLevel="h3"
            lede="Schools have their own rhythm. Nothing significant lands in September, and anything needed for the new year has to be ready by June."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#E3EBDF] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#E3EBDF]"
              )}
            >
              <span className="pt-1 font-mono text-[12px] tracking-[0.1em] text-[#0B7A18]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#0F1A10] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#526155]">{phase.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STILL OURS
========================================================= */

function StillOursSection() {
  const panelRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#08150A] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(95,191,82,.18), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead
              eyebrow="What happened next"
              eyebrowColor="#3B8632"
              headingLevel="h3"
              title="Six years, and every September since."
              dark
              narrow={false}
            />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#A6B8A3]">
              A school website has an annual heartbeat. Calendars change, stationery lists change, class groups move
              up, the admissions notice is republished, staff arrive and leave. None of it is large work and all of
              it has to happen on time.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#A6B8A3]">
              We&apos;ve been there for every one of those years since launch, including standing up a separate
              campaign site when the school needed to gather public support. Small clients get the same continuity
              as large ones — that&apos;s the whole point of how we&apos;re set up.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#3B8632]">
              {"2019\nto today"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#9FB49C]">
              Continuous support through every school year — calendars, admissions notices, staff changes, new
              sections and platform maintenance.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TECHNOLOGY
========================================================= */

function TechnologySection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("x", 16);

  return (
    <section className="bg-gradient-to-b from-[#F1F8EE] to-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Chosen so a teacher can use it."
            headingLevel="h4"
            lede="The test wasn't what we'd enjoy building. It was whether someone with fifteen spare minutes and no technical training could update their class page without calling anyone."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-mono text-[16px] font-medium tracking-[0.12em] text-[#0B7A18] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#526155]", index > 0 && "border-t border-[#F2F7EF]")}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   RELATED
========================================================= */

function RelatedSection() {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);

  return (
    <section className="bg-[#FBFDFA] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#E3EBDF] bg-white hover:-translate-y-1 hover:border-[#C3DEBB] hover:shadow-[0_20px_44px_-20px_rgba(15,26,16,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} width={800} height={500} loading="lazy" className="aspect-16/10 block w-full object-cover" />
              <div className="p-5.5">
                <span className="font-mono text-[12px] tracking-[0.11em] text-[#87957F] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[17px] font-extrabold text-[#0F1A10] block">{item.title}</span>
                <p className="text-[13.5px] leading-[1.55] text-[#526155]">{item.text}</p>
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

export default function CastletownrocheCaseStudy() {
  return (
    <div className="relative overflow-hidden bg-[#FBFDFA]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection />
      <div data-nav-contrast="dark">
        <DetailThatMatteredSection />
      </div>
      <HowWeWorkedSection />
      <div data-nav-contrast="dark">
        <StillOursSection />
      </div>
      <TechnologySection />
      <RelatedSection />
    </div>
  );
}
