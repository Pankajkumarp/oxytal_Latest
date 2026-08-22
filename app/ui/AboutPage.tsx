import type { Entry, EntrySkeletonType } from "contentful";
import type { ComposableElementSkeleton } from "../types/contentful";

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

/**
 * The `/about` page's original monolithic component — ported in full
 * from `Refrence/oxytal-about.html` (a bespoke Bootstrap mockup), then
 * had every one of its sections split out into its own
 * `composableElement` section, one at a time, the same move
 * `ServicesAiLayer` was for `ServicesPage`:
 *
 * Hero → `AboutHero` (`subType: "aboutHero"`)
 * Stats bar → `AboutStats` (`"aboutStats"`)
 * Our Story → `AboutStory` (`"aboutStory"`)
 * What We Do → `AboutServices` (`"aboutServices"`)
 * Approach → `AboutApproach` (`"aboutApproach"`)
 * Products → `AboutProducts` (`"aboutProducts"`)
 * Leadership → `AboutLeadership` (`"aboutLeadership"`)
 * Culture → `AboutCulture` (`"aboutCulture"`)
 * Global Presence → `AboutGlobal` (`"aboutGlobal"`)
 * Mission & Vision → `AboutMissionVision` (`"aboutMissionVision"`)
 * Why Choose Us → `AboutWhy` (`"aboutWhy"`)
 *
 * That was every section in the mockup, so this component is now an
 * empty shell — nothing left to render. It stays registered under its
 * own `composableElement` subtype (`"aboutPage"` — see
 * `ComposableElementRenderer`) only so any `page.body` still referencing
 * it doesn't break; remove that reference from the `about` page's body
 * in Contentful (it renders nothing either way) rather than relying on
 * this file.
 */
interface Props {
  entry?: PlainEntry<ComposableElementSkeleton>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AboutPage({ entry }: Props) {
  return null;
}
