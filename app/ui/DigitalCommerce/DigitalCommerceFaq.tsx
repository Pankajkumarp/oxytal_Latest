"use client";

import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface FaqItem {
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "Should we replatform or fix what we have?",
    answer:
      "Usually fix. A replatform is the most expensive answer to most commerce problems, and it resets a lot of institutional knowledge along with the code. If your issue is conversion, page speed or a missing integration, that's a project measured in weeks. We'll only recommend replatforming when the three-year cost of staying genuinely exceeds the cost of moving — and we'll show you the arithmetic.",
  },
  {
    question: "How do you decide between Shopify and Adobe Commerce?",
    answer:
      "By where your complexity lives. If it's commercial — merchandising, promotions, markets, DTC growth — Shopify usually wins on total cost once you price in hosting, patching and the engineering hours a self-managed platform quietly consumes. If it's structural — catalogue depth, ERP-driven pricing, B2B approval hierarchies — Adobe Commerce is often cheaper over three years than rebuilding those rules in SaaS. We model both before recommending either.",
  },
  {
    question: "What does a commerce project actually cost?",
    answer:
      "We won't quote a range on a web page, because the honest answer depends on catalogue size, integration count and how much of your process is currently undocumented. What we will do is fix the price of the first two weeks, so you get a costed plan before committing to a build. Most clients find the review pays for itself by removing one bad assumption from the scope.",
  },
  {
    question: "Who actually does the work?",
    answer:
      "A named pod across Dublin and Chandigarh — the same engineers from build through to support. No account-manager layer between you and the people writing the code, and no reassignment after go-live. You'll meet them before you sign anything.",
  },
];

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 7 — FAQ: a native `<details>`/`<summary>` accordion (no JS
 * needed for the toggle itself), first entry open by default same as
 * the reference.
 *
 * Registered as the `digitalCommerceFaq` composableElement subtype:
 * `entry.fields.content` is cast to `FaqItem[]` (a JSON array — no
 * dedicated fields, per the request this was built for) and, when
 * present, wholesale-replaces `DEFAULT_FAQS`.
 */
export default function DigitalCommerceFaq({ entry }: Props) {
  const faqs = (entry?.fields.content as FaqItem[] | undefined) ?? DEFAULT_FAQS;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const listRef = useFadeUp<HTMLDivElement>();

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>Straight answers</p>
          <h2 ref={headingRef}>What clients ask first.</h2>
        </div>
        <div ref={listRef} style={{ marginTop: 30, maxWidth: 880 }}>
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
