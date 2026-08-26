"use client";

import { Entry, EntrySkeletonType } from "contentful";
import { Globe, LineChart, RefreshCw, ShieldAlert, type LucideIcon } from "lucide-react";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

/** Icon keys a `content` JSON payload can reference by name — resolved via `ICON_MAP` below, falling back to a cycled default (same as every other icon-fallback in this codebase) when omitted or unrecognized. */
const ICON_MAP: Record<string, LucideIcon> = {
  lineChart: LineChart,
  refreshCw: RefreshCw,
  globe: Globe,
  shieldAlert: ShieldAlert,
};

/** Cycled by item index as a fallback icon when a problem doesn't name one. */
const FALLBACK_ICONS: LucideIcon[] = [LineChart, RefreshCw, Globe, ShieldAlert];

interface Problem {
  /** A key into `ICON_MAP` (e.g. `"globe"`). Falls back to a cycled default icon when omitted or unrecognized. */
  icon?: string;
  title: string;
  text: string;
  quote: string;
}

/** The reference's own 4 hand-drawn inline SVG glyphs (a falling chart, a radiating "busy work" burst, a globe, a shield) — swapped for their closest Lucide equivalents already used throughout this codebase rather than hand-porting that raw path data. */
const DEFAULT_PROBLEMS: Problem[] = [
  {
    icon: "lineChart",
    title: "Traffic is fine. Revenue isn't.",
    text: "Spend is working and the funnel isn't. Usually it's checkout friction, page weight or a merchandising model that doesn't match how people actually buy.",
    quote: "“We're paying more for the same orders.”",
  },
  {
    icon: "refreshCw",
    title: "Every order costs you people.",
    text: "Orders re-keyed into the ERP, stock reconciled by hand, invoices chased in a spreadsheet. Growth makes it worse rather than better.",
    quote: "“We can't scale without hiring.”",
  },
  {
    icon: "globe",
    title: "New markets take too long.",
    text: "A new region, currency, language or B2B channel turns into a six-month project because the platform was built for one way of selling.",
    quote: "“Every expansion is a rebuild.”",
  },
  {
    icon: "shieldAlert",
    title: "The platform has become a risk.",
    text: "An unsupported version, a checkout customisation nobody dares touch, a developer who left. It works — until the day it doesn't.",
    quote: "“Nobody wants to be the one who breaks it.”",
  },
];

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 1 — "The business problem": 4 cards, one per common
 * conversation. Registered as the `digitalCommerceProblems`
 * composableElement subtype: `entry.fields.content` is cast to
 * `Problem[]` (a JSON array — no dedicated fields, per the request this
 * was built for) and, when present, wholesale-replaces
 * `DEFAULT_PROBLEMS` (same "Contentful array fully replaces the
 * hardcoded default, not merged item-by-item" convention every other
 * array-shaped Contentful field in this codebase follows). Each item's
 * `icon` is a string key into `ICON_MAP`, since a Lucide component
 * itself can't travel through JSON.
 */
export default function DigitalCommerceProblems({ entry }: Props) {
  const problems = (entry?.fields.content as Problem[] | undefined) ?? DEFAULT_PROBLEMS;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const cardsRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>The business problem</p>
          <h2 ref={headingRef}>Commerce rarely fails at the storefront.</h2>
          <p className={styles.lede}>
            It fails in the gap between the storefront and everything behind it — the systems, the
            manual work, the rules nobody wrote down. These are the four conversations we&apos;re
            brought into most often.
          </p>
        </div>
        <div ref={cardsRef} className={styles.probs}>
          {problems.map((problem, index) => {
            const Icon = (problem.icon && ICON_MAP[problem.icon]) || FALLBACK_ICONS[index % FALLBACK_ICONS.length];

            return (
              <div key={problem.title} className={styles.prob}>
                <div className={styles.probIcon}>
                  <Icon size={20} color="#E8641A" strokeWidth={1.9} aria-hidden />
                </div>
                <h3>{problem.title}</h3>
                <p>{problem.text}</p>
                <p className={styles.probSay}>{problem.quote}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
