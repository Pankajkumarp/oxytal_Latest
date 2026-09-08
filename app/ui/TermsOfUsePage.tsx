"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import ThemePattern from "./ThemePattern";
import { ComposableElementSkeleton, DataImageSkeleton } from "../types/contentful";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `Entry<Skeleton>` on its own leaves `Modifiers` unconstrained, which
 * widens every field to also allow the `WITH_ALL_LOCALES` (locale-keyed
 * object) shape. This app's Contentful client is created with no chain
 * modifiers (see app/lib/contentful.ts), so pin `Modifiers` to `undefined`
 * to get the plain, single-locale field shape it actually returns.
 */
type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface AnyEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}

/** True for a resolved Contentful entry; false for an unresolved link (`{ sys: { type: "Link" } }`) or anything else. */
function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

/** One numbered clause of the document. Drives both the sticky table of contents and each `<section id>` anchor below it, so the two can never drift out of sync. */
const TOC_ITEMS: Array<{ id: string; label: string }> = [
  { id: "accept", label: "Agreement to these terms" },
  { id: "who", label: "Who we are" },
  { id: "use", label: "Using this website" },
  { id: "ip", label: "Intellectual property" },
  { id: "submit", label: "What you send us" },
  { id: "accuracy", label: "Accuracy of content" },
  { id: "links", label: "Third-party links" },
  { id: "products", label: "Our products" },
  { id: "services", label: "Client engagements" },
  { id: "availability", label: "Availability" },
  { id: "liability", label: "Liability" },
  { id: "privacy", label: "Privacy" },
  { id: "changes", label: "Changes" },
  { id: "law", label: "Governing law" },
  { id: "contact", label: "Contact" },
];

/** A `.cblk` info card from the reference — a bordered block of label/value rows (entity details, contact addresses). Used twice below ("Who we are", "Contact"). */
function InfoBlock({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="my-5 rounded-2xl border border-[#E3ECF2] bg-white p-6">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 border-t border-[#F1F6F9] py-2.5 first:border-t-0 first:pt-0 sm:flex-row sm:gap-3"
        >
          <span className="min-w-[110px] shrink-0 font-semibold text-[10px] tracking-[0.1em] text-[#8598AA] uppercase">
            {row.label}
          </span>
          <span className="text-[14px] leading-[1.6] text-[#546A7E]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The `/terms-and-conditions` page's document section — a
 * `composableElement` section (`subType: "termsOfUse"` — see
 * `ComposableElementRenderer`), ported from
 * `Refrence/oxytal-terms-of-use.html`. A deliberately standalone
 * component (not a change to `LegalPage`, the site's existing generic
 * privacy-policy/terms renderer) since this reference calls for a much
 * more specific layout than that component's single "hero + one rich-text
 * blob" shape: a dark hero, a sticky numbered table of contents, 15
 * bordered clauses, and two bordered "entity details" info cards plus one
 * highlighted callout box.
 *
 * Fully static/hardcoded — like `ContactFormInfo`, this is legal copy
 * that needs precise, reviewed wording rather than a field an editor can
 * freely rewrite, so no part of the document body is Contentful-driven.
 * `entry` is read for exactly the same two things `ContactFormInfo` reads
 * it for: `backgroundImage` (a full-bleed photo replacing the dark hero's
 * own gradient outright) and `pattern`/`patternColor` (the decorative
 * `ThemePattern` backdrop layered over the hero) — same "photo/pattern
 * still wins" convention every composableElement section uses, kept
 * available here even though the rest of the page is static.
 *
 * Responsive: the 250px sticky table of contents (`nav`, `lg:sticky`)
 * sits beside the article on large screens and disappears entirely below
 * `lg`, same as the reference's own `nav.toc{display:none}` breakpoint —
 * there's no room for a sidebar once the content column would have to
 * shrink below a readable width, and every clause is still reachable by
 * scrolling.
 *
 * Animation (skipped under `prefers-reduced-motion`): the `h1` gets the
 * same GSAP split-text word reveal every hero on this site uses; each of
 * the 15 clause headings then fades + rises in individually as it
 * scrolls into view, a lighter per-heading treatment (not a full
 * split-text pass) since there are 15 of them spread down a long page.
 *
 * The sticky table of contents also runs a scroll-spy (see SCROLL SPY
 * below): an `IntersectionObserver` watching a thin band near the top of
 * the viewport tracks which clause is currently in view and highlights
 * that entry in the sidebar, so a visitor always sees where they are in
 * the document without needing to scroll back up to the contents list.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function TermsOfUsePage({ entry }: Props) {
  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL, same
  // pattern every sibling composableElement section uses.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  const heroRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  /** Which clause's TOC entry is highlighted — kept in sync with scroll position by the SCROLL SPY effect below. Starts on the first clause. */
  const [activeId, setActiveId] = useState<string>(TOC_ITEMS[0].id);

  /* =========================================================
     HERO HEADING REVEAL — the h1 splits into words and rises in as soon
     as it mounts (already in view on first paint, no scroll trigger),
     same GSAP split-text vocabulary every other section's own heading
     uses. Skipped entirely under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!headingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headingRef.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(headingRef.current!, {
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
            stagger: 0.06,
          }),
      });
    }, heroRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  /* =========================================================
     CLAUSE HEADING REVEAL — each of the 15 clause `<h2>`s fades + rises
     in individually as it scrolls into view — a lighter per-heading
     treatment than the hero's split-text pass, since there are 15 of
     them spread down a long document. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!articleRef.current) {
      return;
    }

    const headings = articleRef.current.querySelectorAll("h2");

    if (!headings.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(headings, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      headings.forEach((heading) => {
        gsap.from(heading, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
          },
        });
      });
    }, articleRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     SCROLL SPY — highlights whichever clause is currently in view in the
     sticky table of contents. Watches a thin horizontal band near the
     top of the viewport (`rootMargin`'s negative top/bottom shrink the
     observed area down to roughly the top 15%–30% of the screen) rather
     than the whole viewport, so the active link switches right as a
     clause's heading crosses that band instead of whichever section
     merely happens to cover the most of the screen. Not gated behind
     `prefers-reduced-motion` — this is a state update, not a motion
     effect (the highlight itself has no animation).
  ========================================================= */
  useLayoutEffect(() => {
    if (!articleRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections = articleRef.current.querySelectorAll("section[id]");

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <div data-nav-contrast="dark">
      <section
        ref={heroRef}
        className={cx(
          "relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-16 md:pt-28 md:pb-24",
          !backgroundUrl && "bg-gradient-to-br from-[#020617] via-[#041C32] to-[#003B5C]"
        )}
        style={
          backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Decorative radial glow — fixed regardless of any background
            photo, same "flourish stays fixed" convention every other
            section's own decorative accents use. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[46%] -right-[16%] z-0 h-[480px] w-[480px] rounded-full opacity-70 sm:h-[620px] sm:w-[620px] md:h-[760px] md:w-[760px]"
          style={{
            background: "radial-gradient(circle, rgba(22,185,232,.20), transparent 64%)",
          }}
        />

        <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern
            pattern={entry?.fields.pattern}
            patternColor={entry?.fields.patternColor}
          />
        </div>

        <div className="relative z-2 mx-auto max-w-7xl px-5 md:px-10 lg:px-14">
          <p className="mb-4 text-xs font-semibold tracking-[0.1em] text-cyan-400 uppercase">
            Legal
          </p>
          <h1
            ref={headingRef}
            className="max-w-xl text-[28px] leading-[1.2] font-extrabold tracking-tight sm:text-[34px] md:text-[42px] lg:text-[50px] text-white"
          >
            Terms of Use
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] md:text-[16px] text-slate-300">
            The terms on which you may use this website. These cover the
            website itself — work we do for clients is governed by a
            separate signed agreement.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["Effective [02 Sep 2026]", "Last updated [02 Sep 2026]", "Version 1.0"].map(
              (date) => (
                <span
                  key={date}
                  className="rounded-full border border-white/18 px-3.5 py-[7px]  text-[10px] tracking-[0.1em] text-[#C3D3DF] uppercase"
                >
                  {date}
                </span>
              )
            )}
          </div>
        </div>
      </section>
      </div>

      {/* ═══ CONTENTS + ARTICLE ═══ */}
      <div className="bg-[#FBFDFE]">
      <div className="mx-auto max-w-7xl px-5 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-10 py-11 sm:py-14 md:py-16 lg:grid-cols-[250px_1fr] lg:gap-16 lg:py-20">
          {/* Sticky table of contents — desktop/large screens only. */}
          <nav aria-label="Contents" className="hidden lg:sticky lg:top-7 lg:block">
            <p className="mb-3.5 font-bold text-[13px] tracking-[0.05em] text-[#8598AA] uppercase">
              Contents
            </p>
            <ol className="flex flex-col gap-0.5">
              {TOC_ITEMS.map((item, index) => {
                const isActive = item.id === activeId;

                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={cx(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-[12px] text-[14px] leading-[1.45] transition-colors",
                        isActive
                          ? "bg-[#E5F5FB] font-semibold text-[#0E9BC4]"
                          : "text-[#3F5468] hover:bg-[#F1F6F9] hover:text-[#546A7E]"
                      )}
                    >
                      <span
                        className={cx(
                          "pt-[3px] font-extrabold text-[13.6px]",
                          isActive ? "text-[#0E9BC4]" : "text-[#8598AA]"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <article ref={articleRef} className="max-w-[70ch]">
            <section id="accept" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                1. Agreement to these terms
              </h2>
              <p className="mb-4 text-[16px] leading-[1.72] text-[#546A7E]">
                By accessing or using this website you agree to these Terms
                of Use. If you don&apos;t agree with them, please
                don&apos;t use the site.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                These terms apply to your use of{" "}
                <strong className="font-semibold text-[#0f172b]">
                  www.oxytal.com
                </strong>{" "}
                and its subdomains. They don&apos;t govern any professional
                services we provide — that work is covered by a separate
                written agreement signed by both parties, and where
                anything in these terms conflicts with a signed agreement,{" "}
                <strong className="font-semibold text-[#0f172b]">
                  the signed agreement takes precedence
                </strong>
                .
              </p>
            </section>

            <section id="who" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                2. Who we are
              </h2>
              <InfoBlock
                rows={[
                  { label: "Entity", value: "Oxytal Limited" },
                  { label: "Registered", value: "Ireland, company number: 705743" },
                  { label: "Address", value: "Ballydeague, Ballyhooly, Co Cork, Ireland" },
                  {
                    label: "Email",
                    value: (
                      <a href="mailto:info@oxytal.com" className="text-[#0E9BC4]">
                        info@oxytal.com
                      </a>
                    ),
                  },
                ]}
              />
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                &ldquo;Oxytal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; and
                &ldquo;our&rdquo; refer to Oxytal Limited and its group
                companies, including Oxytal UK Limited (England and Wales,
                company number 16848238) and Oxytal India Private Limited
                (CIN: U72900HR2022FTC100829, Panipat, India).
                &ldquo;You&rdquo; and &ldquo;your&rdquo; refer to the person
                using this website.
              </p>
            </section>

            <section id="use" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                3. Using this website
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                You may use this site for lawful purposes — reading about
                what we do, contacting us, and applying for a role. You may
                print or download extracts for your own reference or to
                share within your organisation, provided you don&apos;t
                alter them and you keep any notices of ownership intact.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                You agree{" "}
                <strong className="font-semibold text-[#0f172b]">not</strong>{" "}
                to:
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li>Use the site in any way that breaks any applicable law or regulation</li>
                <li>Attempt to gain unauthorised access to the site, its servers, or any connected system</li>
                <li>Introduce viruses, trojans, worms or any other malicious or technologically harmful material</li>
                <li>Attack the site by denial-of-service or any similar means</li>
                <li>Scrape, harvest or systematically extract content or contact details, including for training machine learning models, without our written permission</li>
                <li>Use the site to send unsolicited commercial communications</li>
                <li>Reproduce, republish or resell any part of the site for commercial purposes without our permission</li>
                <li>Frame or mirror the site, or present it as your own</li>
              </ul>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Breaching these provisions may be a criminal offence. We may
                report a breach to the relevant authorities and disclose
                your identity to them, and we may terminate your right to
                use the site immediately.
              </p>
            </section>

            <section id="ip" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                4. Intellectual property
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Unless stated otherwise, we own or are licensed to use all
                intellectual property rights in this website and everything
                published on it — text, design, layout, graphics,
                illustrations, diagrams, photographs, video, code and the
                arrangement of it all. These works are protected by
                copyright and other laws worldwide.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                The Oxytal name and logo, and the names SamVault,
                ForgePipeline, ActionPulse and Kollabry, are our marks. You
                may not use them without our prior written permission.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Client names, logos and product images shown in our case
                studies belong to the organisations concerned and are used
                with permission to identify the work described. Nothing on
                this site grants you any right to use them.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                You may quote briefly from this site with clear attribution
                and a link. Anything more than that needs our permission —
                which we&apos;re usually happy to give if you ask.
              </p>
            </section>

            <section id="submit" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                5. What you send us
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                When you submit an enquiry through our contact form, apply
                for a role, or otherwise send us information, you confirm
                that:
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li>The information you provide is accurate, and you&apos;re entitled to provide it</li>
                <li>Where you provide someone else&apos;s details, you have their permission or another lawful basis for doing so</li>
                <li>What you send doesn&apos;t infringe anyone&apos;s rights and isn&apos;t unlawful, defamatory or offensive</li>
              </ul>
              <div className="my-5 rounded-r-xl border-l-[3px] border-[#0E9BC4] bg-[#E5F5FB] p-5 md:p-6">
                <p className="text-[14.5px] leading-[1.7] text-[#546A7E]">
                  <strong className="font-semibold">
                    Please don&apos;t send us confidential information
                    through the contact form.
                  </strong>{" "}
                  Use it to tell us broadly what you need. If a conversation
                  requires confidential detail, we&apos;ll put a
                  non-disclosure agreement in place first — and we&apos;re
                  happy to do that before you tell us anything sensitive.
                </p>
              </div>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Ideas or suggestions you send us unprompted are treated as
                non-confidential, and we may use them without obligation or
                payment. This protects both of us: it means we can&apos;t
                be accused of appropriating an idea we may already have
                been working on. It doesn&apos;t apply to anything shared
                under a signed non-disclosure or client agreement.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                How we handle personal data in what you send is set out in
                our{" "}
                <Link href="/privacy-policy" className="text-[#0E9BC4]">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section id="accuracy" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                6. Accuracy of content
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We take care over what we publish, and the content on this
                site is provided for general information about our work
                and our views. It is{" "}
                <strong className="font-semibold text-[#0f172b]">not</strong>{" "}
                professional, technical, legal or financial advice, and
                shouldn&apos;t be relied on as a substitute for advice
                about your particular circumstances.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Case study figures, timescales and outcomes describe
                specific engagements. They are not a promise of what will
                happen on yours — every project is different, and anyone
                claiming otherwise should worry you.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                We don&apos;t warrant that the content is complete, current
                or free of error, and we may change it at any time without
                notice.
              </p>
            </section>

            <section id="links" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                7. Third-party links
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                This site links to websites we don&apos;t control — client
                sites, our product sites, our candidate portal and others.
                Those links are provided for your convenience and
                don&apos;t imply we endorse or are responsible for their
                content.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                We have no control over the content, privacy practices or
                availability of third-party sites. When you follow a link
                away from here, the terms and privacy policy of that site
                apply instead of ours.
              </p>
            </section>

            <section id="products" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                8. Our products
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Pages on this site describe software products we build and
                operate, including SamVault, ForgePipeline, ActionPulse and
                Kollabry. Those descriptions are marketing information.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                <strong className="font-semibold text-[#0f172b]">
                  Access to and use of any of those products is governed by
                  its own terms of service and privacy notice
                </strong>
                , presented when you sign up. Nothing on this website
                grants you a licence to use them, and nothing here forms
                part of that separate agreement.
              </p>
            </section>

            <section id="services" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                9. Client engagements
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Nothing on this website is an offer capable of acceptance,
                and nothing here creates a contract for services or a
                client relationship between us.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Descriptions of engagement models, indicative timescales and
                phases are illustrative. Any work we do for you will be
                governed by a separate written agreement setting out the
                scope, deliverables, timelines, fees, intellectual property
                arrangements, confidentiality obligations, data processing
                terms and liability, signed by both parties before work
                begins.
              </p>
            </section>

            <section id="availability" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                10. Availability
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We aim to keep this website available, but we don&apos;t
                guarantee uninterrupted access. We may suspend, withdraw or
                restrict all or part of it for business or operational
                reasons, and we&apos;ll try to give reasonable notice where
                we can.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                You are responsible for arranging your own access to the
                site, and for making sure anyone accessing it through your
                connection is aware of these terms and complies with them.
              </p>
            </section>

            <section id="liability" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                11. Liability
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                <strong className="font-semibold text-[#0f172b]">
                  Nothing in these terms excludes or limits our liability
                  for death or personal injury caused by our negligence,
                  for fraud or fraudulent misrepresentation, or for
                  anything else that cannot lawfully be excluded or
                  limited.
                </strong>
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Subject to that, and to the fullest extent permitted by
                law:
              </p>
              <ul className="mb-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.75] text-[#3F5468] marker:text-[#8598AA]">
                <li>This website is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, whether express or implied</li>
                <li>We exclude all implied conditions, warranties and representations to the extent the law allows</li>
                <li>We will not be liable for any loss of profits, sales, business or revenue; business interruption; loss of anticipated savings; loss of business opportunity, goodwill or reputation; or any indirect or consequential loss arising from your use of, or inability to use, this website, or from reliance on any content on it</li>
                <li>We will not be liable for any loss or damage caused by a virus or other technologically harmful material that infects your equipment through your use of this site or any linked site</li>
              </ul>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If you are a consumer rather than a business user, these
                limitations don&apos;t affect your statutory rights, which
                cannot be excluded.
              </p>
            </section>

            <section id="privacy" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                12. Privacy and cookies
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                How we collect and use personal data — including anything
                you send through the contact form — is set out in our{" "}
                <Link href="/privacy-policy" className="text-[#0E9BC4]">
                  Privacy Policy
                </Link>
                . Please read it; it forms part of your use of this site.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                We use cookies. Strictly necessary cookies keep the site
                working. Analytics cookies are only set with your consent,
                and you can change that choice at any time through the
                Cookie Settings link in the footer.
              </p>
            </section>

            <section id="changes" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                13. Changes to these terms
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                We may revise these terms at any time. The version and
                dates at the top of this page show when they were last
                changed, and the current version applies each time you use
                the site.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Please check this page from time to time. Continuing to
                use the site after a change means you accept the revised
                terms.
              </p>
            </section>

            <section id="law" className="mb-8 border-b border-[#E3ECF2] pb-8 last:mb-0 last:border-b-0 last:pb-0 md:mb-11 md:pb-11">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                14. Governing law and jurisdiction
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                These terms, their subject matter and their formation are
                governed by{" "}
                <strong className="font-semibold text-[#0f172b]">
                  the laws of Ireland
                </strong>
                . Both you and we agree that the courts of Ireland have
                exclusive jurisdiction over any dispute or claim arising
                out of or in connection with them.
              </p>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                If you are a consumer resident in another EU member state,
                you retain the protection of any mandatory provisions of
                the law of your country of residence, and you may bring
                proceedings there.
              </p>
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                If any provision of these terms is found to be unlawful,
                invalid or unenforceable, that provision will be severed
                and the remainder will continue in full force.
              </p>
            </section>

            <section id="contact">
              <h2 className="mb-3.5 scroll-mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.025em] text-[#0f172b] sm:text-[25px]">
                15. Contact
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.78] text-[#3F5468]">
                Questions about these terms, or about anything on this
                website:
              </p>
              <InfoBlock
                rows={[
                  {
                    label: "General",
                    value: (
                      <a href="mailto:info@oxytal.com" className="text-[#0E9BC4]">
                        info@oxytal.com
                      </a>
                    ),
                  },
                  {
                    label: "Privacy",
                    value: (
                      <a href="mailto:privacy@oxytal.com" className="text-[#0E9BC4]">
                        privacy@oxytal.com
                      </a>
                    ),
                  },
                  {
                    label: "Post",
                    value: "Oxytal Limited, Ballydeague, Ballyhooly, Co Cork, Ireland",
                  },
                ]}
              />
              <p className="text-[15.5px] leading-[1.78] text-[#3F5468]">
                Related pages:{" "}
                <Link href="/privacy-policy" className="text-[#0E9BC4]">
                  Privacy Policy
                </Link>{" "}
                ·{" "}
                <Link href="/contact-us" className="text-[#0E9BC4]">
                  Contact us
                </Link>
              </p>
            </section>
          </article>
        </div>
      </div>
      </div>
    </>
  );
}
