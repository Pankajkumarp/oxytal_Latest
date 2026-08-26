"use client";

import { useLayoutEffect, useRef } from "react";
import { Entry, EntrySkeletonType } from "contentful";
import gsap from "gsap";
import { cx } from "@/app/lib/cx";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { prefersReducedMotion, useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface LifecycleNode {
  label: string;
  x: number;
}

interface CapabilityCard {
  num: string;
  title: string;
  text: string;
}

interface CapabilityContent {
  nodes?: LifecycleNode[];
  cards?: CapabilityCard[];
}

/** The lifecycle diagram's 6 nodes, in order — `x` is its position along the `0 0 1160 130` viewBox (same coordinates as the reference's own inline SVG), and the last one is drawn larger/filled ("we stay here" — Oxytal's own ongoing-support stage, not a one-off handoff). */
const DEFAULT_NODES: LifecycleNode[] = [
  { label: "Strategy", x: 40 },
  { label: "Experience", x: 256 },
  { label: "Build", x: 472 },
  { label: "Integrate", x: 688 },
  { label: "Optimise", x: 904 },
  { label: "Support", x: 1120 },
];

const DEFAULT_CARDS: CapabilityCard[] = [
  { num: "01", title: "Commerce strategy", text: "Where the revenue actually leaks, what fixing it is worth, and the order to do it in." },
  { num: "02", title: "Experience & conversion", text: "Merchandising, product discovery and checkout designed against your real catalogue." },
  { num: "03", title: "Storefront engineering", text: "Themed or headless builds, replatforms and migrations that keep SEO equity intact." },
  { num: "04", title: "Systems integration", text: "ERP, PIM, 3PL, tax and CRM connected so orders stop being re-typed by people." },
  { num: "05", title: "B2B & expansion", text: "Company accounts, contract pricing and new markets without a rebuild each time." },
  { num: "06", title: "Run & optimise", text: "Patching, monitoring, peak-season cover and a roadmap — not a ticket queue." },
];

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 2 — "Commerce capability": the lifecycle diagram (an inline
 * SVG whose progress line draws in via `strokeDashoffset` as it scrolls
 * into view — this section's own equivalent of the reference's
 * `IntersectionObserver`-driven line reveal, done with GSAP +
 * ScrollTrigger instead) plus the 6-card capability grid below it.
 *
 * Registered as the `digitalCommerceCapability` composableElement
 * subtype: `entry.fields.content` is cast to `CapabilityContent` (a
 * JSON object — no dedicated fields, per the request this was built
 * for) whose `nodes`/`cards` each independently replace their own
 * hardcoded default when present (`DEFAULT_NODES`/`DEFAULT_CARDS`).
 * Note the lifecycle diagram's node *positions* are tied to its `0 0
 * 1160 130` viewBox — a `content.nodes` override changing the node
 * count only relabels/repositions the existing 6 slots, it doesn't add
 * new ones to the drawing.
 */
export default function DigitalCommerceCapability({ entry }: Props) {
  const overrides = (entry?.fields.content as CapabilityContent | undefined) ?? {};
  const nodes = overrides.nodes ?? DEFAULT_NODES;
  const cards = overrides.cards ?? DEFAULT_CARDS;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const lifeRef = useFadeUp<HTMLDivElement>();
  const capsRef = useStaggerReveal<HTMLDivElement>();
  const lifelineRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    if (!lifelineRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(lifelineRef.current, { strokeDashoffset: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(lifelineRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: lifelineRef.current,
          start: "top 85%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className={cx(styles.section, styles.capBand)}>
      <div className={styles.wrap}>
        <div ref={introRef} className={styles.center}>
          <p className={styles.eyebrow}>Commerce capability</p>
          <h2 ref={headingRef}>One team across the whole commerce lifecycle.</h2>
          <p className={styles.lede}>
            Strategy, design, engineering, integration and support sit in the same practice — so the
            person who scoped it is accountable for how it runs.
          </p>
        </div>

        <div ref={lifeRef} className={styles.life}>
          <svg
            viewBox="0 0 1160 130"
            className={styles.lifeSvg}
            aria-label="Commerce lifecycle: strategy, experience, build, integrate, optimise, support — a continuous loop."
          >
            <defs>
              <linearGradient id="dc-lifecycle-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FFB268" />
                <stop offset=".5" stopColor="#E8641A" />
                <stop offset="1" stopColor="#FF7FA6" />
              </linearGradient>
            </defs>
            <path d="M40 70H1120" stroke="#E4EBF3" strokeWidth={3} strokeLinecap="round" />
            <path
              ref={lifelineRef}
              d="M40 70H1120"
              stroke="url(#dc-lifecycle-gradient)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={1080}
              strokeDashoffset={1080}
            />
            <g fontFamily="var(--fm)" fontSize={11.5} fill="#55677F" textAnchor="middle">
              {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;

                return (
                  <g key={node.label}>
                    <circle
                      cx={node.x}
                      cy={70}
                      r={isLast ? 12 : 9}
                      fill={isLast ? "#E8641A" : "#fff"}
                      stroke={isLast ? undefined : "#E8641A"}
                      strokeWidth={isLast ? undefined : 3}
                    />
                    <text x={node.x} y={105} fill={isLast ? "#101C2E" : undefined}>
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
            <text x={1120} y={38} fontFamily="var(--fm)" fontSize={10.5} fill="#8695AC" textAnchor="middle">
              we stay here
            </text>
          </svg>
        </div>

        <div ref={capsRef} className={styles.caps}>
          {cards.map((cap) => (
            <div key={cap.num} className={styles.capCard}>
              <span className={styles.capNumber}>{cap.num}</span>
              <h3>{cap.title}</h3>
              <p>{cap.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
