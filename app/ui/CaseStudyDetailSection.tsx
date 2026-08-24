import { Entry, EntrySkeletonType } from "contentful";
import { resolveVariant } from "../lib/caseStudyVariant";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme } from "../lib/theme";
import {
  ComposableElementSkeleton,
  ContentDetailSkeleton,
  DataImageSkeleton,
} from "../types/contentful";
import CaseStudyDetail from "./CaseStudyDetail";

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

function isEntry(value: unknown): value is AnyEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sys" in value &&
    "fields" in value &&
    typeof (value as { sys: unknown }).sys === "object"
  );
}

function isContentDetail(value: unknown): value is PlainEntry<ContentDetailSkeleton> {
  return isEntry(value) && value.sys.contentType.sys.id === "contentDetail";
}

/**
 * `caseStudyDetail`'s composableElement wrapper — the `page`-entry route
 * a case study can be given its own dedicated `page` entry for (slug
 * `case-studies/<contentDetail slug>`, `body: [this composableElement]`),
 * alongside the automatic fallback the `[locale]/[[...slug]]` catch-all
 * already provides for any case study that *doesn't* have one yet (see
 * that route's own `caseStudySlugFromPath` — it renders the exact same
 * `CaseStudyDetail` straight off the `contentDetail` entry with no `page`
 * involved). A `page` entry is worth authoring when you want the URL to
 * behave like every other page (show up in whatever navigation/sitemap
 * tooling walks `page` entries, or eventually carry extra `body` blocks
 * of its own) rather than relying purely on the fallback.
 *
 * `elements` holds an ordered list of `contentDetail` entries, but only
 * the *first* one is read — this case study's own data (the same entry
 * `CaseStudiesListing`'s card and the fallback route both already use).
 * Any entries after it are currently ignored: `CaseStudyDetail` has no
 * "More case studies" grid at all anymore (removed along with its
 * `related` prop) — the `[locale]/[[...slug]]` catch-all fallback route
 * below no longer renders one either.
 *
 * This composableElement is also where the design lives, once a page has
 * one — its own `isFor` field picks which of `CaseStudyDetail`'s 3
 * designs renders (falling back to the linked case study's own
 * `contentDetail.layoutVariant` when `isFor` is unset), and its own
 * `themeColor`/`backgroundImage`/`pattern`+`patternColor` (the same
 * fields every other composableElement subtype already carries)
 * independently recolor the page, give it a full-bleed photo behind
 * everything, and pick its decorative background tile — same convention
 * as every other section on the site: each applies on its own whenever
 * it's set, with no dependency on the others (`pattern` still needs
 * `patternColor` alongside it — see `ThemePattern`'s own doc comment).
 * This is separate from — and can coexist with — the case study's *own*
 * `heroImage`, which `CaseStudyDetail` always shows in its own dedicated
 * hero-area slot regardless of this composableElement's backdrop.
 */
interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

export default function CaseStudyDetailSection({ entry }: Props) {
  const contentDetails = (entry.fields.elements ?? []).filter(isContentDetail);
  const [study] = contentDetails;

  if (!study) {
    return null;
  }

  const variant = resolveVariant(entry.fields.isFor ?? study.fields.layoutVariant);
  const theme = resolveTheme(entry.fields.themeColor);

  const backgroundImageEntry = entry.fields.backgroundImage;
  const backdropUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  return (
    <CaseStudyDetail
      entry={study}
      overrides={{
        variant,
        theme,
        backdropUrl,
        pattern: entry.fields.pattern,
        patternColor: entry.fields.patternColor,
      }}
    />
  );
}
