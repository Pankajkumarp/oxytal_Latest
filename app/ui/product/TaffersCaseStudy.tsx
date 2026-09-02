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
import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton, ContentDetailSkeleton, DataLinkSkeleton } from "@/app/types/contentful";
import { getAssetUrl } from "@/app/lib/contentfulAsset";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// Contentful wiring — same shape as `DiageoBrandPromoterCaseStudy`'s own:
// `entry.fields.elements` may hold up to 4 `contentDetail` entries.
// `[0]` supplies this case study's own hero photo (`heroImage`) and
// "what we built" gallery (`gallery`); `[1]`–`[3]` each become one
// `RelatedSection` card (see `resolveRelatedItem`). Everything here works
// exactly as before when `entry` is omitted or those fields are unset —
// each piece falls back to its own hardcoded default individually.
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

/**
 * `TaffersCaseStudy` — a standalone, static case-study one-pager ported
 * from `Refrence/oxytal-case-study-taffers.html`. Same treatment as its
 * siblings in this folder (`DiageoBrandPromoterCaseStudy` and the rest):
 * keeps the reference's own colour identity (`--ink` `#1E140C`,
 * `--accent` `#A8682A`, `--accent-2` `#D9A05B`, the `--deep-1`/`--deep-2`
 * `#160D07`/`#2A1B10` warm-brown gradient) rather than the site's
 * per-page `themeColor` accent, and typography stays the site's own
 * inherited `Poppins` instead of the reference's Google Fonts —
 * tracking/size/weight/uppercase alone carry the reference's own mono/
 * display feel. Every piece of content is still the reference's own
 * hardcoded copy/photography (Contentful assets and Oxytal's S3 bucket,
 * at the reference's own URLs); the only genuine Contentful wiring is the
 * optional `entry` prop (same shape as `DiageoBrandPromoterCaseStudy`'s):
 * a `contentDetail` entry's own `heroImage`/`gallery` can override the
 * hero photo and the "what we built" row photos, and up to 3 more
 * `contentDetail` entries can override the related-case-study cards —
 * each falls back to its own hardcoded default individually when unset.
 *
 * Unlike `DiageoBrandPromoterCaseStudy`'s "built" rows, the reference's
 * own stylesheet here has no `:nth-of-type(even)` flip rule — all four
 * rows keep text-left/image-right, so `BuiltRow` below doesn't take a
 * `flip` option. The 2nd row also nests a small 2-up "awards" grid
 * (medal artwork + name) inside its own text column, unique to this case
 * study.
 *
 * Unlike `DiageoBrandPromoterCaseStudy`'s "built" rows, the reference's
 * own stylesheet here has no `:nth-of-type(even)` flip rule — all four
 * rows keep text-left/image-right, so `BuiltRow` below doesn't take a
 * `flip` option. The 2nd row also nests a small 2-up "awards" grid
 * (medal artwork + name) inside its own text column, unique to this case
 * study.
 *
 * Registered in `ComposableElementRenderer` as subtype `taffers`.
 *
 * Shares `useSplitReveal`/`useFadeUp`/`useListStagger` (from
 * `./useReveal`) with its siblings, same reveal-role split as
 * `DiageoBrandPromoterCaseStudy`: every section `<h2>` gets the
 * word-split reveal via `SectionHead`; the hero's own `<h1>` plays on
 * mount instead of on scroll; single-block intros fade up as one unit;
 * card/row grids stagger in per item; each built row's text/media fade
 * up as two independent halves.
 */

/* =========================================================
   CONTENT — transcribed from Refrence/oxytal-case-study-taffers.html
========================================================= */

const FACTS: { k: string; v: string }[] = [
  { k: "Client", v: "Diageo — Taffer's Browned Butter Bourbon" },
  { k: "Sector", v: "Drinks & FMCG" },
  { k: "Services", v: "Experience Design · Engineering · Integration · Support" },
  { k: "Scope", v: "Designed and built from scratch" },
  { k: "Status", v: "Live, supported and enhanced" },
];

const OUTCOMES: { v: string; l: string }[] = [
  { v: "Built\nfrom scratch", l: "Design, build and launch delivered end to end" },
  { v: "2", l: "Competition awards published on the site in 2026" },
  { v: "Full", l: "Diageo compliance requirements met on every page" },
  { v: "—", l: "Sign-ups captured into marketing and customer records" },
  { v: "—", l: "Retailer lookups per month" },
];

const HARD_CARDS: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "The first interaction is legally required",
    text: "Before anyone sees a bottle, a colour or a word of the story, they meet an age check. It's the worst possible first impression for a brand built on warmth — and it isn't optional, so it had to become part of the experience rather than a barrier standing in front of it.",
  },
  {
    n: "02",
    title: "Compliance lands on every page",
    text: "Conditions of use, community guidelines, accessibility, privacy, cookie controls, responsible drinking, and a US privacy request route. Ten mandatory elements on a page whose job is to feel like a bar in Georgia.",
  },
  {
    n: "03",
    title: "Persuasion without a taste",
    text: "You can't sample a drink through a screen. Everything that reduces doubt has to be borrowed — proof from other people, a reason to buy this week, and a route to a bottle that doesn't make anyone hunt.",
  },
];

const AWARDS: { img: string; n: string; s: string }[] = [
  {
    img: "https://images.ctfassets.net/2ctrlpw4si8r/46HZuGBCD4jPt3VjgtiH7b/203a4b736f0e41073ef044ac1c13a77f/DoubleGold1500.webp",
    n: "Double Gold",
    s: "2026 SIP Awards",
  },
  {
    img: "https://images.ctfassets.net/2ctrlpw4si8r/3Qb9UOyM2Aa38swgdv9raz/3b29084048e637ad8ccb49b9c12e41d3/2026_SFWSC_Silver_Med._Artwork.webp",
    n: "Silver",
    s: "2026 San Francisco World Spirits Competition",
  },
];

const BUILT_ROWS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  img: string;
  alt: string;
  awards?: boolean;
}[] = [
  {
    n: "01 · The story",
    title: "A few lines, not an essay",
    desc: "The origin does the persuading — a real tavern, a real experiment, a drink the bar became known for. Told in the length someone will actually read on a phone, with the bottle doing the rest.",
    bullets: [
      "Tasting notes stated plainly — vanilla, toffee, browned butter",
      "“Familiar enough to sip, different enough to remember” — the reassurance and the hook in one line",
      "Founder's voice kept intact rather than smoothed into brand copy",
    ],
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5EzvOAfAHo85s4C6VJJVMn/00f0fc36e436c9b6260c14a624ae88af/our-story.webp",
    alt: "The Taffer's origin story section on the website",
  },
  {
    n: "02 · The proof",
    title: "Awards placed where the doubt is",
    desc: "Independent blind-tasting results are the closest thing to a taste you can offer through a screen. So they don't sit on a separate page nobody visits — they appear on the homepage, at the point where someone is deciding whether an unusual bourbon is actually any good.",
    bullets: [
      "Medals shown as artwork, not text — recognised in an instant",
      "Judged by consumers and by the industry — two different kinds of reassurance",
      "Managed as content, so a new medal is published the week it's announced",
    ],
    img: "https://images.ctfassets.net/2ctrlpw4si8r/1OECn920qKYj7aM6GgKkwm/0cc5f39f4fe606fea5a81f0abd8ef595/bottle_lable.webp",
    alt: "Taffer's Browned Butter Bourbon bottle label",
    awards: true,
  },
  {
    n: "03 · The reason to buy this week",
    title: "Recipes as a route in, not decoration",
    desc: "“Rich and bold” is a description. “Make this Old Fashioned in seconds” is a plan for Friday. Recipes give someone a concrete use for a bottle they don't own yet — and they're what people search for, so they bring their own traffic.",
    bullets: [
      "A proper section with its own navigation, not a strip on the homepage",
      "Built around the product's advantage — the flavour is already in the bottle, so the recipe is short",
      "Marketing team publishes new recipes without a development release",
    ],
    img: "https://images.ctfassets.net/2ctrlpw4si8r/Pf10EizGbgePFXsyA1r6a/cbeba521dd4541f47430b016f65d97d1/Deck-Slides-Bottle-Closeup-desktop.webp",
    alt: "Old Fashioned cocktail made with Taffer's Browned Butter Bourbon",
  },
  {
    n: "04 · The handoff",
    title: "From decided to holding a bottle",
    desc: "The moment someone wants it is the moment the site should stop persuading. Find Near You and Buy Now are reachable from anywhere, and the sign-up carries permission properly into the marketing and customer systems behind it.",
    bullets: [
      "Retailer lookup one tap from every page, not buried in a footer",
      "Clean handover to the shop, rather than a second checkout to maintain",
      "Sign-up flowing to marketing and customer records with consent attached",
      "Withdrawal of consent reaching every system that holds the person",
    ],
    img: "https://images.ctfassets.net/2ctrlpw4si8r/5rN8pXjYf81OJlJsQc7RyN/91074d680f5cac8db16497cacfaeb3c7/Deck-Slides-Bottle-Closeup.webp",
    alt: "Taffer's Browned Butter Bourbon bottle",
  },
];

const CARE_CARDS: { title: string; text: string }[] = [
  {
    title: "The age check belongs to the brand",
    text: "Same typography, same colour, same tone as everything behind it — so the first thing a visitor meets reads as the start of the experience rather than a gate in front of it.",
  },
  {
    title: "Legal links, properly built",
    text: "All ten present, correctly labelled, keyboard reachable and legible — not shrunk to six-point grey in the hope nobody looks. Accessibility is one of the links; it would be strange to fail it.",
  },
  {
    title: "Privacy requests that actually work",
    text: "Cookie controls remain reachable after the first visit, and the US privacy request route is a working path rather than a link that exists to be pointed at.",
  },
  {
    title: "Responsibility without a lecture",
    text: "The responsible drinking message is present and clear, placed where it's read rather than hidden — and worded so it sits with the brand instead of interrupting it.",
  },
];

const PHASES: { n: string; title: string; text: string }[] = [
  {
    n: "01",
    title: "Understand the hesitation",
    text: "Working with the brand team to establish what the site actually had to overcome — not “raise awareness”, but the specific doubt an unfamiliar bourbon creates in someone who's never tasted it.",
  },
  {
    n: "02",
    title: "Design for a phone, in a hurry",
    text: "Most visitors arrive from social, on a phone, with limited patience. Every layout decision was tested against that rather than against a desktop mock-up in a design tool.",
  },
  {
    n: "03",
    title: "Build so the brand team can run it",
    text: "Content managed independently, so a new recipe, a new award or a seasonal update happens in an afternoon rather than through a release process. That's why the 2026 medals appeared when they did.",
  },
  {
    n: "04",
    title: "Wire the systems behind it",
    text: "Sign-ups connected into the marketing platform and customer records with permission travelling alongside — and withdrawal flowing back to every system holding that person.",
  },
  {
    n: "05",
    title: "Support and enhance, continuously",
    text: "Still ours. New content types, seasonal campaigns, performance work and platform maintenance — delivered as ongoing work rather than through a change request each time.",
  },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Front end", items: ["Next.js", "Server-rendered pages", "Optimised imagery", "Mobile-first layouts"] },
  {
    title: "Content",
    items: ["Contentful", "Structured content types", "Marketing-managed publishing", "Locale-aware routing"],
  },
  {
    title: "Integration",
    items: ["Marketing platform sign-up", "Customer record creation", "Consent captured at source", "Retailer locator"],
  },
  {
    title: "Compliance",
    items: ["Age verification", "Cookie consent management", "US privacy request route", "Accessibility standards"],
  },
];

const RELATED: { href: string; img: string; alt: string; k: string; title: string; text: string }[] = [
  {
    href: "/case-studies/aviation-gin",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/aviationgin.webp",
    alt: "Aviation American Gin website",
    k: "Diageo · Brand",
    title: "Aviation American Gin",
    text: "Consent-aware sign-up flowing into Klaviyo and Salesforce.",
  },
  {
    href: "/case-studies/diageo-brand-promoter",
    img: "https://oxytal.s3.eu-west-1.amazonaws.com/Oxytal-company/explore/brandpromotor.webp",
    alt: "Diageo Brand Promoter training platform",
    k: "Diageo · Compliance",
    title: "Brand Promoter Standard",
    text: "Conduct and safeguarding training in 17 languages, live since 2022.",
  },
  {
    href: "/case-studies/kaneff-sharepoint-migration",
    img: "https://oxytal-ai.vercel.app/images/projects/sharepoint-migration/hero.webp",
    alt: "Kaneff Group SharePoint migration",
    k: "Real estate",
    title: "Kaneff Group",
    text: "7 TB read, cleaned and moved — with 20% less storage after.",
  },
];

/* =========================================================
   SHARED PIECES
========================================================= */

function Eyebrow({ children, color = "#A8682A" }: { children: ReactNode; color?: string }) {
  return (
    <span className="mb-4 flex items-center gap-2.5 text-[12px] font-bold uppercase" style={{ color }}>
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
          dark ? "text-white" : "text-[#1E140C]"
        )}
      >
        {title}
      </DynamicHeading>
      {lede && (
        <p className={cx("mt-4 text-[16px] leading-[1.8]", dark ? "text-[#C4B2A0]" : "text-[#6B5C4E]")}>{lede}</p>
      )}
    </div>
  );
}

function CheckSvg({ color = "#A8682A" }: { color?: string }) {
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
    <nav aria-label="Breadcrumb" className="bg-[#160D07] py-4 pt-26">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[#8A7562] uppercase">
          <li>
            <Link href="/" className="text-[#B8A48F] transition-colors duration-150 hover:text-white">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 before:opacity-50 before:content-['/']">
            <Link href="/case-studies" className="text-[#B8A48F] transition-colors duration-150 hover:text-white">
              Case Studies
            </Link>
          </li>
          <li className="flex items-center gap-2 text-white before:opacity-50 before:content-['/']">
            <span aria-current="page">Taffer&apos;s Browned Butter Bourbon</span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ mainBanner }: { mainBanner?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const clientRef = useRef<HTMLParagraphElement>(null);
  const standRef = useRef<HTMLParagraphElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);

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
    const targets = [clientRef.current, standRef.current, factsRef.current, visitRef.current, shotRef.current];

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(clientRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0)
        .from(standRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.5)
        .from(factsRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from(visitRef.current, { opacity: 0, y: 20, duration: 0.6 }, 0.7)
        .from(shotRef.current, { opacity: 0, y: 24, duration: 0.7 }, 0.8);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#160D07] to-[#2A1B10] pt-12 text-[#F4EBE1] sm:pt-16 lg:pt-[88px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[46%] -right-[20%] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(217,160,91,.26), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p ref={clientRef} className="mb-4.5 font-semibold text-[12px] text-[#D9A05B] uppercase">
          Case study · Diageo · Taffer&apos;s Browned Butter Bourbon
        </p>

        <h1
          ref={titleRef}
          className="mb-5.5 max-w-[21ch] text-[clamp(32px,4.4vw,54px)] leading-[1.2] font-extrabold tracking-[-0.036em] text-white"
        >
          Curiosity gets them to the page. Doubt stops them buying.
        </h1>

        <p ref={standRef} className="mb-8 max-w-[62ch] text-[16px] leading-[1.85] text-[#C4B2A0]">
          Browned butter bourbon is an unusual proposition. The name does the hard work of getting attention — and
          then creates a question the site has to answer before anyone reaches for a bottle. We designed and built
          the brand experience from scratch, inside Diageo&apos;s compliance requirements, and we still ship
          changes to it.
        </p>

        <dl
          ref={factsRef}
          className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {FACTS.map((fact) => (
            <div key={fact.k} className="bg-[#160D07] px-5 py-4.5">
              <dt className="mb-1.5 font-semibold text-[11px]  text-[#8A7562] uppercase">{fact.k}</dt>
              <dd className="text-[15.6px] leading-[1.45] font-semibold text-[#F4EBE1]">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <a
          ref={visitRef}
          href="https://www.taffersbrownedbutterbourbon.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-9 inline-flex items-center gap-2.5 rounded-[10px] border border-white/20 px-5.5 py-3.5 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#D9A05B] hover:bg-[#D9A05B]/12 sm:mb-12"
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

        <div
          ref={shotRef}
          className="overflow-hidden aspect-[1672/941] rounded-t-[10px] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
          <img
            src={mainBanner ?? ""}
            alt="Taffer's Browned Butter Bourbon bottle photographed for the site hero"
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>
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
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EDE3D8] bg-[#EDE3D8] sm:grid-cols-3 lg:grid-cols-5"
        >
          {OUTCOMES.map((item) => (
            <div key={item.l} className="bg-white p-6.5">
              <div className="text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#A8682A]">
                {item.v}
              </div>
              <div className="mt-2.5 text-[14px] leading-[1.5] text-[#6B5C4E]">{item.l}</div>
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
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16 lg:py-[104px]">
      <div ref={bodyRef} className="mx-auto max-w-5xl">
        <SectionHead eyebrow="The challenge" title="An unfamiliar product, and a doubt the site can't hear." headingLevel="h2" narrow={false} />
        <p className="mt-5 mb-4.5 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.8] font-normal text-[#1E140C]">
          Taffer&apos;s began in a Georgia tavern. Someone took an Old Fashioned, worked browned butter into the
          bourbon to see whether it tasted better, and it did. That&apos;s a good story — but &ldquo;browned butter
          bourbon&rdquo; still lands on a stranger as a question rather than an invitation.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#6B5C4E]">
          The name earns a click. What happens next is the whole problem. A visitor is curious, slightly sceptical,
          and has never tasted it — and there&apos;s no sample, no bartender, no one to ask. The site has to
          answer a hesitation nobody voices, in the seconds before someone decides it isn&apos;t for them.
        </p>
        <p className="mb-4.5 text-[16px] leading-[1.8] text-[#6B5C4E]">
          Two things made that harder. The brand carries Jon Taffer&apos;s name, so the personality has to feel
          like his rather than like a corporate drinks page. And it sits inside Diageo, which means age
          verification, market-specific privacy rules and a set of mandatory legal links on every single page —
          none of them negotiable.
        </p>
        <div className="rounded-r-[14px] border-l-[3px] border-[#A8682A] bg-[#FAF0E2] py-6.5 pr-7 pl-7.5">
          <p className="text-[18px] leading-[1.8] font-semibold tracking-[-0.02em] text-[#1E140C]">
            The site doesn&apos;t sell anything directly. Its entire job is to turn curiosity into intent, then
            hand the person to a retailer or the shop. Everything on it either does that or it&apos;s in the way.
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
    <section className="bg-gradient-to-b from-[#FBF4EA] to-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Why it was hard"
            title="Three constraints, none of them visual."
            headingLevel="h2"
            lede="The design work people notice is the photography and the type. The work that decided whether this succeeded was elsewhere."
          />
        </div>

        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#EDE3D8] bg-[#EDE3D8] sm:grid-cols-2 lg:grid-cols-3"
        >
          {HARD_CARDS.map((card) => (
            <div key={card.n} className="bg-white p-7">
              <span className="mb-3.5 block font-semibold text-[12px] text-[#A8682A]">{card.n}</span>
              <span className="mb-2.5 text-[19px] leading-[1.5] font-extrabold tracking-[-0.02em] text-[#1E140C] block">
                {card.title}
              </span>
              <p className="text-[14px] leading-[1.65] text-[#6B5C4E]">{card.text}</p>
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

function WhatWeBuiltSection({ galleryImages = [] }: { galleryImages?: string[] }) {
  const introRef = useFadeUp<HTMLDivElement>();

  return (
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="What we built"
            title="Four answers to the same hesitation."
            headingLevel="h3"
            lede="Each part of the site removes one specific reason someone doesn't buy. Nothing on it is there because brand sites usually have one."
            narrow={false}
          />
        </div>

        <div className="mt-10 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          {BUILT_ROWS.map((row, index) => (
            <BuiltRow key={row.n} row={row} image={galleryImages[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** `image` overrides `row.img` when a matching Contentful gallery entry resolved (see `galleryImages` in the default export below); falls back to the row's own static photo otherwise. */
function BuiltRow({ row, image }: { row: (typeof BUILT_ROWS)[number]; image?: string }) {
  const textRef = useFadeUp<HTMLDivElement>();
  const mediaRef = useFadeUp<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div ref={textRef}>
        <span className="mb-3.5 block font-semibold text-[12px] text-[#A8682A]">{row.n}</span>
        <span className="mb-3.5 text-[24px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#1E140C] block">
          {row.title}
        </span>
        <p className="mb-1 text-[16px] leading-[1.8] text-[#6B5C4E]">{row.desc}</p>
        <ul className="mt-5 list-none">
          {row.bullets.map((bullet, index) => (
            <li
              key={bullet}
              className={cx(
                "flex gap-2.5 py-2.5 text-[16px] leading-[1.8] text-[#6B5C4E]",
                index > 0 && "border-t border-[#F7F1E9]"
              )}
            >
              <CheckSvg />
              {bullet}
            </li>
          ))}
        </ul>

        {row.awards && (
          <div className="mt-7.5 grid grid-cols-2 gap-5">
            {AWARDS.map((award) => (
              <div key={award.n} className="rounded-2xl border border-[#EDE3D8] bg-white p-6 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
                <img src={award.img} alt="" aria-hidden width={84} height={84} className="mx-auto mb-3.5 w-[84px]" />
                <div className="mb-1 text-[16px] font-extrabold tracking-[-0.01em] text-[#1E140C]">{award.n}</div>
                <div className="text-[13.5px] text-[#6B5C4E]">{award.s}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        ref={mediaRef}
        className="overflow-hidden rounded-[10px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
        <img
          src={image ?? row.img}
          alt={row.alt}
          width={1200}
          height={900}
          loading="lazy"
          className="block aspect-4/3 w-full object-cover"
        />
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#160D07] to-[#2A1B10] px-5 py-14 text-[#F4EBE1] sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[46%] -left-[18%] h-[820px] w-[820px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(217,160,91,.26), transparent 64%)" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div ref={introRef} className="max-w-[760px]">
          <SectionHead
            eyebrow="The detail that mattered"
            eyebrowColor="#D9A05B"
            headingLevel="h3"
            title="Designing the rules you can't negotiate."
            dark
          />
          <p className="mt-4 mb-4.5 text-[16px] leading-[1.8] text-[#C4B2A0]">
            Most brand sites treat compliance as something to survive. On a Diageo property it arrives first and
            stays on every page — an age check before anything else, ten mandatory legal elements at the foot, and
            a US privacy request route that has to work.
          </p>
          <p className="text-[16px] leading-[1.8] text-[#C4B2A0]">
            <strong className="font-semibold text-white">Handled badly, that&apos;s the whole experience.</strong>{" "}
            A cold interstitial, a wall of grey links, and a warm brand suddenly feels like a
            terms-and-conditions page. So we designed those elements rather than accepting them, and it&apos;s the
            part of this project we&apos;d point at first.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2"
        >
          {CARE_CARDS.map((card) => (
            <div key={card.title} className="bg-[#160D07] p-6.5">
              <span className="mb-2.5 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-white block">
                {card.title}
              </span>
              <p className="text-[14.6px] leading-[1.65] text-[#B8A48F]">{card.text}</p>
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
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="How we worked"
            title="Designed and built by one team, then kept improving."
            headingLevel="h3"
            lede="Design and engineering worked together throughout, which is why the site that launched matches the one that was drawn — and why we could keep changing it afterwards without the structure fighting back."
            narrow={false}
          />
        </div>

        <div ref={phasesRef} className="mt-9 overflow-hidden rounded-2xl border border-[#EDE3D8] bg-white">
          {PHASES.map((phase, index) => (
            <div
              key={phase.n}
              className={cx(
                "grid grid-cols-[56px_1fr] gap-4 p-6 sm:grid-cols-[96px_1fr] sm:gap-5.5 sm:p-7",
                index > 0 && "border-t border-[#EDE3D8]"
              )}
            >
              <span className="pt-1 font-semibold text-[12px] text-[#A8682A]">{phase.n}</span>
              <div>
                <span className="mb-2 text-[18px] leading-[1.4] font-extrabold tracking-[-0.02em] text-[#1E140C] block">
                  {phase.title}
                </span>
                <p className="text-[14.5px] leading-[1.65] text-[#6B5C4E]">{phase.text}</p>
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
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div
          ref={panelRef}
          className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[22px] bg-[#160D07] p-7 sm:gap-10 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-13"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[48%] -right-[16%] h-[640px] w-[640px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(217,160,91,.24), transparent 64%)" }}
          />

          <div className="relative">
            <SectionHead eyebrow="What happened next" eyebrowColor="#D9A05B" headingLevel="h4" title="We didn't hand over the keys." dark narrow={false} />
            <p className="mt-4 mb-4 text-[16px] leading-[1.8] text-[#C4B2A0]">
              Launching a brand site is the easy half. The half that decides whether it keeps earning is what
              happens over the following years — new awards, new recipes, seasonal campaigns, privacy rules that
              change, and the steady maintenance nobody budgets for.
            </p>
            <p className="text-[16px] leading-[1.8] text-[#C4B2A0]">
              Two 2026 competition medals are live on the site today because the team who built it is the team who
              publishes to it. That&apos;s the difference between a site that ages and one that stays current.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/11 bg-white/5 p-6.5 sm:p-7">
            <div className="text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.15] font-extrabold tracking-[-0.03em] whitespace-pre-line text-[#D9A05B]">
              {"Designed,\nbuilt, supported"}
            </div>
            <div className="mt-2.5 text-[14.5px] leading-[1.55] text-[#B8A48F]">
              From first conversation to the enhancement shipped last month — the same team throughout, across
              London, Dublin and Chandigarh.
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
    <section className="bg-gradient-to-b from-[#FBF4EA] to-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div ref={introRef}>
          <SectionHead
            eyebrow="Technology"
            title="Fast to load, easy to change."
            headingLevel="h4"
            lede="A brand site lives or dies on two things: how quickly it appears on a phone, and how easily the marketing team can change it without calling us. Everything here serves one of those."
            narrow={false}
          />
        </div>

        <div ref={gridRef} className="mt-8.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="mb-3 font-semibold text-[16px] font-medium text-[#A8682A] uppercase block">
                {group.title}
              </span>
              <ul className="list-none">
                {group.items.map((item, index) => (
                  <li key={item} className={cx("py-1.75 text-[15px] text-[#6B5C4E]", index > 0 && "border-t border-[#F7F1E9]")}>
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

type RelatedItem = (typeof RELATED)[number];

const RELATED_DESCRIPTION_MAX_LENGTH = 400;

/**
 * Truncates to at most `max` characters, trimmed back to the nearest word
 * boundary so a cut never lands mid-word, and suffixed with "…". Text
 * already at or under the limit passes through unchanged, no ellipsis
 * added.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Maps one `contentDetail` entry (`contentDetailEntries[1]`/`[2]`/`[3]` —
 * `[0]` is this case study's own hero/gallery source, see the default
 * export below) to one `RelatedSection` card. Same field convention
 * `CaseStudiesListing`'s own card mapping uses elsewhere in this app:
 * `heroImage` for the photo, `category` for the small tag, `title`/
 * `shortDescription` for the copy (capped at
 * `RELATED_DESCRIPTION_MAX_LENGTH` characters, via `truncate`, so a long
 * editor-written description can't unbalance the 3-up card grid), and a
 * link resolved from `cta` (preferred) or else `/case-studies/<slug>`.
 * Returns `undefined` for a missing entry or one with no `heroImage` — a
 * related card with no photo would look broken here, so it's dropped
 * rather than shown empty.
 */
function resolveRelatedItem(entry: PlainEntry<ContentDetailSkeleton> | undefined): RelatedItem | undefined {
  if (!entry) {
    return undefined;
  }

  const heroImageEntry = entry.fields.heroImage;
  const img = heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  if (!img) {
    return undefined;
  }

  const ctaEntry = entry.fields.cta?.find((link) => link && "fields" in link) as
    | PlainEntry<DataLinkSkeleton>
    | undefined;
  const ctaHref = ctaEntry
    ? ctaEntry.fields.externalUrl || (ctaEntry.fields.linkedPage ? `/${ctaEntry.fields.linkedPage}` : undefined)
    : undefined;

  return {
    href: ctaHref ?? (entry.fields.slug ? `/case-studies/${entry.fields.slug}` : "#"),
    img,
    alt: entry.fields.title ?? "",
    k: entry.fields.category ?? entry.fields.clientName ?? "",
    title: entry.fields.title ?? "",
    text: entry.fields.shortDescription ? truncate(entry.fields.shortDescription, RELATED_DESCRIPTION_MAX_LENGTH) : "",
  };
}

/** Falls back to the static `RELATED` list when `related` is unset or empty — i.e. until a page's composableElement actually has `contentDetailEntries[1]`/`[2]`/`[3]` set (see `resolveRelatedItem`/the default export below). */
function RelatedSection({ related }: { related?: RelatedItem[] }) {
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useListStagger<HTMLDivElement>("y", 20);
  const items = related?.length ? related : RELATED;

  return (
    <section className="bg-[#FDFBF8] px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div ref={introRef}>
          <SectionHead eyebrow="More of our work" title="Related case studies." headingLevel="h4" narrow={false} />
        </div>

        <div ref={gridRef} className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block overflow-hidden rounded-2xl border border-[#EDE3D8] bg-white hover:-translate-y-1 hover:border-[#E0C9AE] hover:shadow-[0_20px_44px_-20px_rgba(30,20,12,0.2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention this project already uses for external/hosted assets */}
              <img src={item.img} alt={item.alt} loading="lazy" className="aspect-[1672/941] block w-full object-cover" />
              <div className="p-5.5">
                <span className="text-[12px] font-semibold text-[#9C8B7B] uppercase">{item.k}</span>
                <span className="mt-2 mb-1.5 text-[20px] font-extrabold text-[#1E140C] block">{item.title}</span>
                <p className="text-[15px] leading-[1.75] text-[#6B5C4E]">{item.text}</p>
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

export default function TaffersCaseStudy({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];
  const contentDetailEntries = elements.filter(
    (element): element is PlainEntry<ContentDetailSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "contentDetail"
  );
  const heromainEntry = contentDetailEntries[0];
  const heroImageEntry = heromainEntry?.fields.heroImage;
  const mainBanner =
    heroImageEntry && "fields" in heroImageEntry ? getAssetUrl(heroImageEntry.fields.image) : undefined;

  // `gallery` is an array of `dataImage` *entries*, not raw assets — same
  // "resolve the entry, then its own `image` field" two-step
  // `heroImageEntry` above already uses. One resolved entry becomes one
  // `BuiltRow`'s photo, matched by position: the first gallery image
  // overrides `BUILT_ROWS[0].img`, the second overrides
  // `BUILT_ROWS[1].img`, and so on — a row with no corresponding
  // gallery entry keeps its own static `img` unchanged (see
  // `WhatWeBuiltSection`/`BuiltRow`'s own `image` prop above).
  const galleryImages = (heromainEntry?.fields.gallery ?? [])
    .map((image) => (image && "fields" in image ? getAssetUrl(image.fields.image) : undefined))
    .filter((url): url is string => Boolean(url));

  // The 3 related-case-study cards, one per entry — `[0]` stays this
  // case study's own hero/gallery source above, so the related cards
  // start at `[1]`. `resolveRelatedItem` drops any that don't resolve
  // (missing entry, or no `heroImage`), and `RelatedSection` falls back
  // to its own static list whenever none of the three do.
  const relatedItems = [contentDetailEntries[1], contentDetailEntries[2]]
    .map(resolveRelatedItem)
    .filter((item): item is RelatedItem => Boolean(item));

  return (
    <div className="relative overflow-hidden bg-[#FDFBF8]">
      <div data-nav-contrast="dark">
        <Breadcrumb />
        <Hero mainBanner={mainBanner} />
      </div>
      <OutcomesSection />
      <ChallengeSection />
      <WhyItWasHardSection />
      <WhatWeBuiltSection galleryImages={galleryImages} />
      <div data-nav-contrast="dark">
      <DetailThatMatteredSection />
      </div>
      <HowWeWorkedSection />
      <StillOursSection />
      <TechnologySection />
      <RelatedSection related={relatedItems} />
    </div>
  );
}
