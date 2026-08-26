"use client";

import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface WhyCard {
  num: string;
  title: string;
  text: string;
  emphasis: string;
  after: string;
}

/** Each card's paragraph is `text` + an emphasized clause (`emphasis`, the reference's own `<em>`) + `after` — kept as 3 pieces instead of one rich-text blob so the emphasis can render as its own `<em>` without a markdown-lite parser for hardcoded (or Contentful JSON) copy. */
const DEFAULT_WHY_CARDS: WhyCard[] = [
  {
    num: "01",
    title: "We're platform-neutral by construction",
    text: "Two established practices, not one plus a landing page. ",
    emphasis: "Our recommendation costs us money when it's the smaller project",
    after: " — which is exactly why you can trust it.",
  },
  {
    num: "02",
    title: "We build products, not just projects",
    text: "Oxytal ships and supports applications in the Shopify ecosystem. ",
    emphasis: "We've been through app review, performance budgets and merchant support from the other side",
    after: " — so our advice comes from operating software, not just delivering it.",
  },
  {
    num: "03",
    title: "Commerce isn't a silo here",
    text: "Integration, cloud, data and AI are in-house practices at Oxytal. ",
    emphasis: "Your ERP work doesn't get subcontracted to a partner you never meet",
    after: ", and the people doing it sit in the same standups.",
  },
  {
    num: "04",
    title: "Agent-accelerated delivery",
    text: "Forge, our own agent platform, runs our delivery lifecycle — requirements, test generation, security scanning. ",
    emphasis: "You get enterprise rigour at a pace that doesn't match the price tag",
    after: ", with a human approving every release.",
  },
  {
    num: "05",
    title: "We're still there after go-live",
    text: "Most agencies hand over the keys and move on. ",
    emphasis: "The engineers who built it run the support rota",
    after: ", with peak-season cover agreed in writing before the season starts.",
  },
  {
    num: "06",
    title: "Dublin and Chandigarh, one team",
    text: "Senior accountability in your timezone, engineering depth and genuine overnight cover. ",
    emphasis: "Not an offshore handoff at 6pm",
    after: " — one team, two hubs, continuous coverage.",
  },
];

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 4 — "Why Oxytal": a dark 6-card grid, each with a bolded/
 * emphasized clause mid-paragraph. Registered as the
 * `digitalCommerceWhy` composableElement subtype: `entry.fields.content`
 * is cast to `WhyCard[]` (a JSON array — no dedicated fields, per the
 * request this was built for) and, when present, wholesale-replaces
 * `DEFAULT_WHY_CARDS`.
 */
export default function DigitalCommerceWhy({ entry }: Props) {
  const cards = (entry?.fields.content as WhyCard[] | undefined) ?? DEFAULT_WHY_CARDS;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const gridRef = useStaggerReveal<HTMLDivElement>();

  return (
    <section className={cx(styles.section, styles.why)}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>Why Oxytal</p>
          <h2 ref={headingRef}>Why us and not another Shopify or Magento agency?</h2>
          <p className={styles.lede}>
            A fair question, and one you should ask everyone on your shortlist. Here&apos;s our honest
            answer.
          </p>
        </div>
        <div ref={gridRef} className={styles.wgrid}>
          {cards.map((card) => (
            <div key={card.num} className={styles.whyCard}>
              <span className={styles.whyNumber}>{card.num}</span>
              <h3>{card.title}</h3>
              <p>
                {card.text}
                <em className={styles.whyEmphasis}>{card.emphasis}</em>
                {card.after}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
