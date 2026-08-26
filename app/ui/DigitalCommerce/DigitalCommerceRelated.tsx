"use client";

import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface RelatedService {
  num: string;
  title: string;
  text: string;
  href: string;
}

const DEFAULT_SERVICES: RelatedService[] = [
  { num: "05", title: "Enterprise Integration", text: "ERP, PIM and 3PL connected to the storefront.", href: "/service/enterprise-system-integrations" },
  { num: "07", title: "AI & Agentic Engineering", text: "Automating the operational work behind each order.", href: "/service/ai-and-intelligent-automation" },
  { num: "04", title: "Cloud & Transformation", text: "Infrastructure that holds through peak trading.", href: "/service/cloud-digital-transformation" },
  { num: "02", title: "Experience Design", text: "The research behind why people don't convert.", href: "/service/ui-ux-design" },
];

interface FinalContent {
  title?: string;
  text?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  fine?: string;
}

const DEFAULT_FINAL: Required<FinalContent> = {
  title: "Start with the business problem.",
  text: "Sixty minutes. Bring the thing that's actually worrying you — the number that won't move, the process that needs three people, the platform nobody wants to touch. We'll tell you what we'd do, and whether we're the right people to do it.",
  ctaLabel: "Talk to our commerce team",
  ctaHref: "/contact-us",
  secondaryLabel: "Email info@oxytal.com",
  secondaryHref: "mailto:info@oxytal.com",
  fine: "Reply within one business day",
};

interface RelatedContent {
  services?: RelatedService[];
  final?: FinalContent;
}

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 8 — "Related services" + the closing CTA panel. Both
 * headings get the split-text reveal.
 *
 * Registered as the `digitalCommerceRelated` composableElement
 * subtype: `entry.fields.content` is cast to `RelatedContent` (a JSON
 * object — no dedicated fields, per the request this was built for).
 * `services` wholesale-replaces `DEFAULT_SERVICES` when present;
 * `final` is merged key-by-key over `DEFAULT_FINAL`, so an editor can
 * override just the CTA label without needing to resupply the whole
 * closing panel.
 */
export default function DigitalCommerceRelated({ entry }: Props) {
  const overrides = (entry?.fields.content as RelatedContent | undefined) ?? {};
  const services = overrides.services ?? DEFAULT_SERVICES;
  const final: Required<FinalContent> = { ...DEFAULT_FINAL, ...overrides.final };

  const relatedHeadingRef = useSplitReveal<HTMLHeadingElement>();
  const finalHeadingRef = useSplitReveal<HTMLHeadingElement>();
  const relatedIntroRef = useFadeUp<HTMLDivElement>();
  const finalRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div ref={relatedIntroRef}>
          <p className={styles.eyebrow}>Related services</p>
          <h2 ref={relatedHeadingRef}>Commerce rarely travels alone.</h2>
          <div className={styles.rel}>
            {services.map((service) => (
              <Link key={service.href} className={styles.relatedCard} href={service.href}>
                <span className={styles.relatedKicker}>{service.num}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </Link>
            ))}
          </div>
        </div>

        <div ref={finalRef} className={styles.final} style={{ marginTop: "clamp(48px, 6vw, 80px)" }}>
          <div>
            <h2 ref={finalHeadingRef}>{final.title}</h2>
            <p>{final.text}</p>
          </div>
          <div className={styles.finalActs}>
            <Link className={cx(styles.btn, styles.btnP)} href={final.ctaHref}>
              {final.ctaLabel} <span aria-hidden>→</span>
            </Link>
            <a className={cx(styles.btn, styles.btnS)} href={final.secondaryHref}>
              {final.secondaryLabel}
            </a>
            <p className={styles.finalFine}>{final.fine}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
