import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import ThemePattern from "./ThemePattern";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  StatisticSkeleton,
} from "../types/contentful";

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

type Stat = { value: string; label: string };

/** Placeholder rows, used only when `elements` has no `statistic` entries yet — the original mockup's 4-up stats bar. */
const DEFAULT_STATS: Stat[] = [];

/**
 * The About page's stats bar — a `composableElement` section (`subType:
 * "aboutStats"` — see `ComposableElementRenderer`), split out of
 * `AboutPage` the same way `AboutHero` was:
 *
 * - every `statistic` entry among `elements` becomes one column
 *   (`value`/`label`) — same content type `AboutHero`'s own "Company
 *   Overview" rows reuse, add/remove/reorder `statistic` entries in
 *   Contentful to change the roster, nothing here needs to change
 *
 * Falls back to `DEFAULT_STATS` when `elements` has no `statistic`
 * entries yet.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)` like every other
 * composableElement section — the un-themed fallback is the mockup's own
 * solid `#1450d4` bar with white text, matching `AboutPage`'s port of
 * `Refrence/oxytal-about.html`, so it looks the same as before this
 * existed until an editor sets a `themeColor`.
 *
 * The composableElement's own `backgroundImage` field (links to a
 * `dataImage` entry, same field HomeAI/HomeTalkToUs/AboutHero-style
 * sections use) is an *optional* full-bleed background photo — when set,
 * it wins over the themed/default solid bar, with a semi-opaque tint
 * (the same color the bar would otherwise be) over it so the stat text
 * stays readable. `ThemePattern`'s dotted backdrop only shows when
 * there's no background photo — layered under a tint, it would barely
 * read anyway.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AboutStats({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const statEntries: Stat[] = elements
    .filter(
      (element): element is PlainEntry<StatisticSkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "statistic"
    )
    .map((stat) => ({ value: stat.fields.value, label: stat.fields.label }));

  const stats = statEntries.length ? statEntries : DEFAULT_STATS;

  // Resolves `themeColor` (e.g. "dark", "blue", "darkyellow" — see
  // app/lib/theme.ts) to this bar's background/text colors. `undefined`
  // for an unset or unrecognized value, in which case every themed class
  // below falls back to the mockup's own solid blue bar (today's look,
  // unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAI/HomeTalkToUs/AboutHero use). Optional here: no
  // placeholder fallback, so it's simply absent until an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  return (
    <section
      className={cx(
        "relative overflow-hidden py-14",
        backgroundUrl ? "bg-cover bg-center" : (theme?.sectionBg ?? "bg-[#1450d4]")
      )}
      style={
        backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
      }
      aria-label="Company statistics"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
          <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>
      <div className="container mx-auto grid grid-cols-2 gap-6 px-5 text-center md:px-10 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cx(
              "relative",
              index < stats.length - 1 &&
                "after:absolute after:top-1/2 after:right-0 after:hidden after:h-10 after:w-px after:-translate-y-1/2 after:bg-white/15 lg:after:block"
            )}
          >
            <p
              className={cx(
                "text-[36px] font-extrabold md:text-[44px]",
                theme?.heading ?? "text-white"
              )}
            >
              {stat.value}
            </p>
            <p
              className={cx(
                "mt-1 text-[12px] font-semibold tracking-wide uppercase",
                theme?.body ?? "text-white/70"
              )}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
