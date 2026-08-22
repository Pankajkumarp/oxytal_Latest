"use client";

import { Cpu } from "lucide-react";
import { Entry, EntrySkeletonType } from "contentful";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import {
  ComposableElementSkeleton,
  DataImageSkeleton,
  DataTextSkeleton,
  TechnologySkeleton,
} from "../types/contentful";
import ThemePattern from "./ThemePattern";

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

interface TechItem {
  name: string;
  logoUrl?: string;
}

/**
 * The `/ai-solutions` page's "// runs on" tech strip — a
 * `composableElement` section (`subType: "aiTechStack"` — see
 * `ComposableElementRenderer`), ported from `Refrence/ai-solutions.html`'s
 * `.stack-strip`:
 *
 * - the first `dataText` entry among `elements` supplies the small label
 *   (`eyebrow`, e.g. "// runs on") — this section has no heading
 * - every `technology` entry among `elements` becomes one item (`name`,
 *   with its own `logo` shown in place of the fallback CPU glyph) — same
 *   content type `AboutProducts`'s tech roster uses. Add/remove/reorder
 *   `technology` entries in Contentful to change the roster
 *
 * Renders no items until at least one `technology` entry is set.
 *
 * Themed via `resolveTheme(entry.fields.themeColor)`; un-themed, this
 * section defaults to the reference mockup's own light navy-on-white
 * identity. The composableElement's own `backgroundImage` field is an
 * optional full-bleed section photo layered under the card — same "photo
 * wins over sectionBg" treatment every sibling composableElement section
 * uses (see AISolutionsHero/AISolutionsSpotlight) — and `ThemePattern`
 * renders the same decorative backdrop (theme's built-in pattern, or an
 * editor's explicit `pattern`/`patternColor` choice) behind the strip. No
 * heading here, so no split-text reveal — this is a quiet, static strip
 * by design, same as the reference mockup.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

export default function AISolutionsTechStack({ entry }: Props) {
  const elements = entry?.fields.elements ?? [];

  const copy = elements.find(
    (element): element is PlainEntry<DataTextSkeleton> =>
      isEntry(element) && element.sys.contentType.sys.id === "dataText"
  );

  const techEntries = elements
    .filter(
      (element): element is PlainEntry<TechnologySkeleton> =>
        isEntry(element) && element.sys.contentType.sys.id === "technology"
    )
    .map((techEntry): TechItem => {
      const logoEntry = techEntry.fields.logo;

      return {
        name: techEntry.fields.name,
        logoUrl: isEntry(logoEntry)
          ? getAssetUrl(
              (logoEntry as unknown as PlainEntry<DataImageSkeleton>).fields
                .image
            )
          : undefined,
      };
    });
  const techItems = techEntries;

  const label = copy?.fields.eyebrow ?? "// runs on";

  const theme = resolveTheme(entry?.fields.themeColor);

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern every sibling composableElement section uses).
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  return (
    <section
      className={cx("relative overflow-hidden py-10", !backgroundUrl && (theme?.sectionBg ?? "bg-white"))}
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
      <div aria-hidden className="pointer-events-none absolute inset-0 z-1">
        <ThemePattern theme={theme} pattern={entry?.fields.pattern} patternColor={entry?.fields.patternColor} />
      </div>

      <div className="relative z-2 container mx-auto px-5 md:px-10">
        <div
          className={cx(
            "flex flex-wrap items-center gap-9 rounded-2xl border p-9",
            theme?.cardBorder ?? "border-gray-200",
            theme?.cardBg ?? "bg-white"
          )}
        >
          <span
            className={cx(
              "shrink-0 font-mono text-[12.5px]",
              theme?.body ?? "text-[#4A5570]"
            )}
          >
            {label}
          </span>

          <div className="flex flex-1 flex-wrap gap-8">
            {techItems.map((item) => (
              <div
                key={item.name}
                className={cx(
                  "flex items-center gap-2.5 text-[15px] font-bold",
                  theme?.heading ?? "text-[#0B1730]"
                )}
              >
                {item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                  <img
                    src={item.logoUrl}
                    alt=""
                    aria-hidden
                    className="h-5 w-5 object-contain"
                  />
                ) : (
                  <Cpu
                    size={20}
                    strokeWidth={1.8}
                    className={theme?.accentText ?? "text-[#2F5CFF]"}
                    aria-hidden
                  />
                )}
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
