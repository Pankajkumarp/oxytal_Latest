"use client";

import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface StatItem {
  value: string;
  label: string;
}

/** The reference's own stats are literal em-dash placeholders (`data-count="—"`), not real figures yet — kept as-is rather than inventing numbers. */
const DEFAULT_STATS: StatItem[] = [
  { value: "—", label: "Commerce builds delivered" },
  { value: "—", label: "Average conversion lift" },
  { value: "—", label: "Peak-season uptime" },
  { value: "—", label: "Years supporting live stores" },
];

interface CaseStudy {
  brand?: string;
  title: string;
  text: string;
  outcomes: { value: string; label: string }[];
}

/** Same "placeholder, not a real figure yet" note as `DEFAULT_STATS` above — the reference literally labels its brand line "Placeholder — replace with real client". */
const DEFAULT_CASE_STUDIES: CaseStudy[] = [
  {
    title: "DTC launch with compliant age gating",
    text: "Age verification, restricted-region logic and carrier rules enforced at checkout rather than bolted on afterwards — so compliance stopped being a manual review step.",
    outcomes: [
      { value: "—", label: "Conversion lift" },
      { value: "—", label: "Weeks to launch" },
    ],
  },
  {
    title: "Replatform without losing rankings",
    text: "Catalogue, customer accounts and a decade of order history migrated, with organic search equity held through cutover and trading uninterrupted.",
    outcomes: [
      { value: "—", label: "Downtime" },
      { value: "—", label: "Orders migrated" },
    ],
  },
  {
    title: "Order operations, automated",
    text: "ERP and 3PL integration that removed manual re-keying from every order — the team stopped growing headcount to keep pace with volume.",
    outcomes: [
      { value: "—", label: "Manual steps removed" },
      { value: "—", label: "Hours saved monthly" },
    ],
  },
];

interface EvidenceContent {
  stats?: StatItem[];
  caseStudies?: CaseStudy[];
}

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 5 — "Evidence": the stats strip plus 3 case-study cards.
 * Anchored `id="work"` for the hero's "See the outcomes" link.
 *
 * Registered as the `digitalCommerceEvidence` composableElement
 * subtype: `entry.fields.content` is cast to `EvidenceContent` (a JSON
 * object — no dedicated fields, per the request this was built for),
 * whose `stats`/`caseStudies` each independently replace their own
 * hardcoded default when present. Each case study's `brand` defaults
 * to the reference's own literal "Placeholder — replace with real
 * client" line when omitted.
 */
export default function DigitalCommerceEvidence({ entry }: Props) {
  const overrides = (entry?.fields.content as EvidenceContent | undefined) ?? {};
  const stats = overrides.stats ?? DEFAULT_STATS;
  const caseStudies = overrides.caseStudies ?? DEFAULT_CASE_STUDIES;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const statsRef = useStaggerReveal<HTMLDivElement>();
  const workRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section id="work" className={styles.section}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>Evidence</p>
          <h2 ref={headingRef}>Outcomes, not screenshots.</h2>
          <p className={styles.lede}>
            Drinks and DTC brands are a harder commerce problem than they look — age verification,
            region-restricted shipping, allocation, and demand that spikes twentyfold in December.
            We&apos;ve built for enough of them to know where it breaks.
          </p>
        </div>

        <div ref={statsRef} className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div ref={workRef} className={styles.work}>
          {caseStudies.map((study) => (
            <div key={study.title} className={styles.caseCard}>
              <div className={styles.caseTop} />
              <div className={styles.caseInner}>
                <span className={styles.caseBrand}>
                  {study.brand ?? "Placeholder — replace with real client"}
                </span>
                <h3>{study.title}</h3>
                <p>{study.text}</p>
                <div className={styles.caseOutcomes}>
                  {study.outcomes.map((outcome) => (
                    <div key={outcome.label}>
                      <div className={styles.outcomeValue}>{outcome.value}</div>
                      <div className={styles.outcomeLabel}>{outcome.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
