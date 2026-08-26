"use client";

import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface EngagementMode {
  kicker: string;
  title: string;
  text: string;
  meta: string[];
  featured?: boolean;
}

const DEFAULT_MODES: EngagementMode[] = [
  {
    kicker: "Start here",
    title: "Commerce review",
    text: "Two weeks. We look at the store, the systems behind it and where revenue is actually leaking, then give you a costed set of options with a recommendation and the reasoning.",
    meta: ["2 weeks · fixed fee", "Credited against a build"],
  },
  {
    kicker: "Most common",
    title: "Build or replatform",
    text: "Staged delivery with a stabilisation bridge, so you stay supported while the new platform is built. Cutover is rehearsed, not attempted, and designed around your trading calendar.",
    meta: ["8–24 weeks typical", "Fixed-price phases"],
    featured: true,
  },
  {
    kicker: "Ongoing",
    title: "Support & growth",
    text: "A named engineering pod on retainer — the people who built it. Patching, monitoring, conversion work and a quarterly roadmap you set.",
    meta: ["Monthly retainer", "Peak cover agreed upfront"],
  },
];

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 6 — "How we engage": 3 engagement modes, the middle one
 * visually "featured" (dark card) same as the reference.
 *
 * Registered as the `digitalCommerceEngagement` composableElement
 * subtype: `entry.fields.content` is cast to `EngagementMode[]` (a
 * JSON array — no dedicated fields, per the request this was built
 * for) and, when present, wholesale-replaces `DEFAULT_MODES`.
 */
export default function DigitalCommerceEngagement({ entry }: Props) {
  const modes = (entry?.fields.content as EngagementMode[] | undefined) ?? DEFAULT_MODES;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>How we engage</p>
          <h2 ref={headingRef}>Three ways in. All start with thinking, not a quote.</h2>
        </div>
        <div ref={gridRef} className={styles.eng}>
          {modes.map((mode) => (
            <div key={mode.title} className={cx(styles.mode, mode.featured && styles.modeFeat)}>
              <span className={styles.modeKicker}>{mode.kicker}</span>
              <h3>{mode.title}</h3>
              <p>{mode.text}</p>
              <div className={styles.modeMeta}>
                {mode.meta.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
