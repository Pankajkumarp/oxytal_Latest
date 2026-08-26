"use client";

import { useState } from "react";
import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { ComposableElementSkeleton } from "../../types/contentful";
import styles from "./DigitalCommerce.module.css";
import { useFadeUp, useSplitReveal, useStaggerReveal } from "./useReveal";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<Skeleton, undefined>;

interface PlatformCard {
  key: string;
  title: string;
  text: string;
  bestText: string;
  tags: string[];
}

const DEFAULT_PLATFORMS: PlatformCard[] = [
  {
    key: "a",
    title: "Shopify & Shopify Plus",
    text: "Fast to market, cheap to operate, and a checkout that converts because Shopify spends more on optimising it than any single merchant could.",
    bestText:
      "Your complexity is commercial rather than structural — merchandising, promotions, multi-market, DTC growth — and you'd rather spend engineering budget on selling than on hosting.",
    tags: ["Storefront & headless", "Checkout engineering", "B2B", "Markets & expansion", "App development"],
  },
  {
    key: "b",
    title: "Adobe Commerce & Magento",
    text: "Control over everything, including the parts you'd rather not own. Still the right answer when your rules genuinely can't be expressed in a SaaS platform.",
    bestText:
      "Complexity lives in the catalogue, in ERP-driven pricing, or in B2B rules with real approval hierarchies — and you need backend control that a managed platform won't give you.",
    tags: ["Upgrades & security", "Performance", "B2B", "Cloud strategy", "Replatform assessment"],
  },
];

type StatusKind = "ok" | "warn" | "stop";

interface VersionOption {
  label: string;
  status: StatusKind;
  heading: string;
  text: string;
}

const STATUS_LABEL: Record<StatusKind, string> = {
  ok: "Supported",
  warn: "Worth a look",
  stop: "Action needed",
};

interface PlatformOption {
  value: string;
  label: string;
}

const DEFAULT_PLATFORM_OPTIONS: PlatformOption[] = [
  { value: "mos", label: "Magento Open Source" },
  { value: "ac", label: "Adobe Commerce" },
  { value: "shopify", label: "Shopify / Plus" },
];

/** The reference's own `V` lookup — version-support status by platform, ported verbatim (including its copy). */
const DEFAULT_VERSION_DATA: Record<string, VersionOption[]> = {
  mos: [
    {
      label: "2.4.6 or earlier",
      status: "stop",
      heading: "Outside the supported window",
      text: "Security patching has ended for these lines on Open Source. Worth reviewing before it becomes a compliance question.",
    },
    {
      label: "2.4.7",
      status: "warn",
      heading: "Supported, worth planning",
      text: "You have runway, but the upgrade belongs in this budget cycle rather than the next one.",
    },
    {
      label: "2.4.8 or 2.4.9",
      status: "ok",
      heading: "Current",
      text: "You're on a supported line. Keep to the patch cadence and revisit in 2027.",
    },
    {
      label: "Magento 1 / not sure",
      status: "stop",
      heading: "Needs a review",
      text: "Magento 1 has been unsupported since 2020. This is worth a conversation soon.",
    },
  ],
  ac: [
    {
      label: "2.4.6 or earlier",
      status: "warn",
      heading: "Check your entitlement",
      text: "Licensed Adobe Commerce carries extended cover that Open Source doesn't. Teams get this wrong in both directions — verify before deciding.",
    },
    {
      label: "2.4.7",
      status: "warn",
      heading: "Supported, worth planning",
      text: "Plan the upgrade in this cycle, and confirm your PHP version separately.",
    },
    {
      label: "2.4.8 or 2.4.9",
      status: "ok",
      heading: "Current",
      text: "Supported line. Maintain the patch cadence.",
    },
    {
      label: "On Cloud, not sure",
      status: "warn",
      heading: "Quick check needed",
      text: "Cloud carries its own upgrade enforcement timeline. Worth confirming against your contract.",
    },
  ],
  shopify: [
    {
      label: "Plus, migrated to Extensibility",
      status: "ok",
      heading: "Current",
      text: "You're on the supported path. Worth confirming your tracking survived the migration — silent pixel loss is common.",
    },
    {
      label: "Plus, not sure",
      status: "warn",
      heading: "Worth verifying",
      text: "Shopify has been auto-upgrading stores without opt-in. Yours may already have moved.",
    },
    {
      label: "Basic / Grow / Advanced",
      status: "warn",
      heading: "Worth a check",
      text: "Some checkout deadlines apply below Plus too. A short audit settles it.",
    },
    {
      label: "Not on Shopify yet",
      status: "ok",
      heading: "Nothing at risk",
      text: "No deadline pressure — the question is fit, not urgency.",
    },
  ],
};

const DEFAULT_NEUTRAL_TEXT =
  "A replatform is the most expensive answer to most commerce problems. If your issue is checkout friction or a missing integration, we'll say so — even though the smaller project is the less profitable one for us.";

interface PlatformsContent {
  platforms?: PlatformCard[];
  neutralText?: string;
  platformOptions?: PlatformOption[];
  versionData?: Record<string, VersionOption[]>;
}

interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

/**
 * Section 3 — "Platforms": the Shopify/Adobe Commerce comparison cards,
 * the "stay put" note, and the platform version-support checker (two
 * `<select>`s + a result panel) — the one genuinely interactive piece
 * in this component set, ported from the reference's own vanilla-JS
 * version to plain React state (`platform`/`versionIndex`).
 *
 * Registered as the `digitalCommercePlatforms` composableElement
 * subtype: `entry.fields.content` is cast to `PlatformsContent` (a
 * JSON object — no dedicated fields, per the request this was built
 * for), each of whose keys independently replaces its own hardcoded
 * default when present. `versionData`/`platformOptions` are the
 * checker's own lookup table and dropdown options — override both
 * together if you add/remove a platform, since an option with no
 * matching `versionData` entry would just show an empty version list.
 */
export default function DigitalCommercePlatforms({ entry }: Props) {
  const overrides = (entry?.fields.content as PlatformsContent | undefined) ?? {};
  const platforms = overrides.platforms ?? DEFAULT_PLATFORMS;
  const neutralText = overrides.neutralText ?? DEFAULT_NEUTRAL_TEXT;
  const platformOptions = overrides.platformOptions ?? DEFAULT_PLATFORM_OPTIONS;
  const versionData = overrides.versionData ?? DEFAULT_VERSION_DATA;

  const headingRef = useSplitReveal<HTMLHeadingElement>();
  const introRef = useFadeUp<HTMLDivElement>();
  const platformsRef = useStaggerReveal<HTMLDivElement>();
  const neutralRef = useFadeUp<HTMLDivElement>();
  const utilRef = useFadeUp<HTMLDivElement>();

  const [platform, setPlatform] = useState("");
  const [versionIndex, setVersionIndex] = useState("");

  const versionOptions = platform ? versionData[platform] : undefined;
  const result =
    versionOptions && versionIndex !== "" ? versionOptions[Number(versionIndex)] : undefined;

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div ref={introRef}>
          <p className={styles.eyebrow}>Platforms</p>
          <h2 ref={headingRef}>We build on both. That&apos;s the point.</h2>
          <p className={styles.lede}>
            An agency that only builds on one platform will always find a reason it&apos;s the right
            one. We&apos;ve delivered on Shopify and Adobe Commerce for years, so the recommendation
            follows your catalogue, your operating model and your three-year cost — not our bench.
          </p>
        </div>

        <div ref={platformsRef} className={styles.two}>
          {platforms.map((plat, index) => (
            <div key={plat.key} className={cx(styles.plat, index === 0 ? styles.platA : styles.platB)}>
              <span className={styles.platTag}>Platform</span>
              <h3>{plat.title}</h3>
              <p>{plat.text}</p>
              <div className={styles.platBest}>
                <b className={styles.platBestLabel}>Best when</b>
                {plat.bestText}
              </div>
              <ul className={styles.platTags}>
                {plat.tags.map((tag) => (
                  <li key={tag} className={styles.platTagItem}>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div ref={neutralRef} className={styles.neutral}>
          <p>
            <strong>And sometimes we tell you to stay put.</strong> {neutralText}
          </p>
        </div>

        <div ref={utilRef} className={styles.util}>
          <div className={styles.utilIntro}>
            <h4>Not sure where your platform stands?</h4>
            <p>Version support windows move. Check yours in two clicks.</p>
          </div>
          <div>
            <label className={styles.label} htmlFor="dc-platform">
              Platform
            </label>
            <select
              id="dc-platform"
              className={styles.select}
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value);
                setVersionIndex("");
              }}
            >
              <option value="">Select…</option>
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="dc-version">
              Version
            </label>
            <select
              id="dc-version"
              className={styles.select}
              value={versionIndex}
              disabled={!versionOptions}
              onChange={(event) => setVersionIndex(event.target.value)}
            >
              {versionOptions ? (
                <>
                  <option value="">Select…</option>
                  {versionOptions.map((option, index) => (
                    <option key={option.label} value={index}>
                      {option.label}
                    </option>
                  ))}
                </>
              ) : (
                <option>Select platform first</option>
              )}
            </select>
          </div>
          <div className={styles.utilOut}>
            {result && (
              <div
                className={cx(
                  styles.result,
                  result.status === "ok" && styles.resultOk,
                  result.status === "warn" && styles.resultWarn,
                  result.status === "stop" && styles.resultStop
                )}
              >
                <div className={styles.resultStatus}>
                  <b className={styles.resultDot} />
                  {STATUS_LABEL[result.status]}
                </div>
                <strong className={styles.resultHeading}>{result.heading}</strong>
                <p className={styles.resultText}>
                  {result.text}{" "}
                  <Link href="/contact-us" className={styles.resultLink}>
                    Book a review →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
