import Link from "next/link";
import { Entry, EntrySkeletonType } from "contentful";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";
import { getAssetUrl } from "../lib/contentfulAsset";
import { resolveTheme, type SectionTheme } from "../lib/theme";
import {
  DataImageSkeleton,
  DataLinkSkeleton,
  FooterSkeleton,
  OfficeSkeleton,
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

/** Best-effort href from a `dataLink` entry: prefers an external URL, falls back to `/<linkedPage>`. Same resolution PageBody/Navbar/HomeAboutUs use. */
function resolveLinkHref(link: PlainEntry<DataLinkSkeleton>): string {
  if (link.fields.externalUrl) {
    return link.fields.externalUrl;
  }

  return link.fields.linkedPage ? `/${link.fields.linkedPage}` : "#";
}

/** Resolves a `dataLink`'s optional `icon` field (links to a `dataImage` entry, not a raw asset) to an asset URL — same pattern used throughout this project. */
function resolveLinkIcon(
  link: PlainEntry<DataLinkSkeleton>
): string | undefined {
  const iconEntry = link.fields.icon;

  return isEntry(iconEntry)
    ? getAssetUrl(
        (iconEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;
}

/** Drops unresolved (unpublished) links out of a `dataLink` array field. */
function resolveDataLinks(
  entries: unknown[] | undefined
): PlainEntry<DataLinkSkeleton>[] {
  return (entries ?? []).filter(
    (entry): entry is PlainEntry<DataLinkSkeleton> => isEntry(entry)
  );
}

interface LinkItem {
  /** The `dataLink` entry's own `sys.id` (or a fixed literal for the hardcoded `DEFAULT_*` rosters below) — used as the React list key instead of `label`, since two different `dataLink` entries can legitimately share the same label text (seen in real Contentful data: two separate "AI & Automation" entries with different hrefs). */
  id: string;
  label: string;
  href: string;
}

function toLinkItem(entry: PlainEntry<DataLinkSkeleton>): LinkItem {
  return {
    id: entry.sys.id,
    label: entry.fields.label ?? "",
    href: resolveLinkHref(entry),
  };
}

interface IconLinkItem extends LinkItem {
  iconUrl?: string;
}

function toIconLinkItem(entry: PlainEntry<DataLinkSkeleton>): IconLinkItem {
  return {
    id: entry.sys.id,
    label: entry.fields.label ?? "",
    href: resolveLinkHref(entry),
    iconUrl: resolveLinkIcon(entry),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A run of 7+ digits, optionally grouped with spaces/dots/dashes/parens and an optional leading "+" — e.g. "+91 98765 43210", "(555) 123-4567". */
const PHONE_PATTERN = /^\+?[0-9][0-9()\-.\s]{6,}$/;

/**
 * Contact-specific href resolution: a plain email address or phone number —
 * in `externalUrl`, or the label itself when an editor left `externalUrl`
 * blank and just typed the address/number straight into `label` — gets
 * prefixed with `mailto:`/`tel:` so clicking it opens the mail client /
 * dialer instead of trying to navigate to it as a relative page (which is
 * what the plain `resolveLinkHref` above would otherwise do). Anything
 * already prefixed, or that isn't an email/phone shape, falls back to the
 * normal `dataLink` resolution unchanged.
 */
function resolveContactHref(link: PlainEntry<DataLinkSkeleton>): string {
  const raw = (link.fields.externalUrl || link.fields.label || "").trim();

  if (/^(mailto:|tel:)/i.test(raw)) {
    return raw;
  }

  if (EMAIL_PATTERN.test(raw)) {
    return `mailto:${raw}`;
  }

  if (PHONE_PATTERN.test(raw)) {
    return `tel:${raw.replace(/[()\-.\s]/g, "")}`;
  }

  return resolveLinkHref(link);
}

function toContactItem(entry: PlainEntry<DataLinkSkeleton>): IconLinkItem {
  return {
    id: entry.sys.id,
    label: entry.fields.label ?? "",
    href: resolveContactHref(entry),
    iconUrl: resolveLinkIcon(entry),
  };
}

interface PartnerItem {
  id: string;
  label: string;
  iconUrl?: string;
}

interface OfficeItem {
  /** The `office` entry's own `sys.id` (or a fixed literal for `DEFAULT_OFFICES`) — used as the React list key instead of `city`, since two offices can share a city name. */
  id: string;
  city: string;
  description?: string;
  flagUrl?: string;
}

function officeToItem(entry: PlainEntry<OfficeSkeleton>): OfficeItem {
  const flagEntry = entry.fields.flag;
  const flagUrl = isEntry(flagEntry)
    ? getAssetUrl(
        (flagEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  return {
    id: entry.sys.id,
    city: entry.fields.city ?? "",
    description: entry.fields.description,
    flagUrl,
  };
}

/** Cycled by item index as a fallback when a "contact" `dataLink` has no `icon` image set. */
const CONTACT_ICONS: LucideIcon[] = [Mail, CalendarClock, Send];

/** Cycled by item index as a fallback when a "partner" `dataLink` has no `icon` image set. */
const PARTNER_ICONS: LucideIcon[] = [ShieldCheck, BadgeCheck];

/**
 * Placeholder content, used only until a real `footer` entry exists in
 * Contentful at all — mirrors Refrence/footer.png so the footer looks right
 * from the start. The moment a real entry exists, every field below
 * renders exactly what's in Contentful (including "empty", which hides the
 * corresponding column — see `hasEntry` in `Footer`) instead of silently
 * falling back to this placeholder text.
 */
const DEFAULT_DESCRIPTION ="";

const DEFAULT_COPYRIGHT = '';

const DEFAULT_SERVICES: LinkItem[] = [];

const DEFAULT_COMPANY_LINKS: LinkItem[] = [];

const DEFAULT_RESOURCE_LINKS: LinkItem[] = [];

const DEFAULT_LEGAL_LINKS: LinkItem[] = [];

const DEFAULT_CONTACT_LINKS: IconLinkItem[] = [];

const DEFAULT_OFFICES: OfficeItem[] = [];

const DEFAULT_PARTNERS: PartnerItem[] = [];

const DEFAULT_SOCIAL_LINKS: IconLinkItem[] = [];

const DEFAULT_BOTTOM_LINKS: LinkItem[] = [];

/** One nav column ("Services"/"Company"/"Resources"/"Legal"). */
function FooterColumn({
  title,
  links,
  theme,
}: {
  title: string;
  links: LinkItem[];
  theme?: SectionTheme;
}) {
  return (
    <div>
      <h3
        className={cx(
          "text-xs font-bold tracking-wide uppercase",
          theme?.accentText ?? "text-emerald-700"
        )}
      >
        {title}
      </h3>

      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className={cx(
                "text-[13.5px] transition-colors",
                theme?.link ?? "text-gray-600",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Site footer, rendered from the `footer` entry fetched via `getFooter()`
 * (see app/lib/contentEntry.ts) and rendered once per page from
 * `[[...slug]]/page.tsx`, next to `Navbar`:
 *
 * - `logo` (falls back to a plain "OXYTAL" wordmark) + `companyDescription`
 *   + `socialLinks` (each `dataLink`'s own `icon` field supplies its glyph,
 *   falling back to the label's first two letters when unset) make up the
 *   brand column
 * - `services`/`companyLinks`/`resourceLinks`/`legalLinks` are each a plain
 *   list of `dataLink` entries, rendered as one column apiece
 * - `contactLinks` (icon + label, icon falls back to a cycled Lucide glyph)
 *   and `officeLocations` (`office` entries — city + description) share the
 *   last column
 * - `partner` renders as a row of compliance/partner badges below the nav
 *   columns
 * - `copyright` + `bottomLinks` make up the bottom bar
 * - the entry's own `backgroundImage` field (links to a `dataImage` entry,
 *   same pattern `composableElement`/`callToAction` use) is an *optional*
 *   full-bleed section background — like HomeAboutUs, there's no
 *   placeholder fallback, so the footer just stays on its plain white
 *   background until an editor sets one
 * - `themeColor` resolves via `resolveTheme` (see app/lib/theme.ts) to
 *   every section's background/heading/body/accent colors, same
 *   convention `composableElement`/`Navbar` use — falls back to the
 *   footer's own existing default look (today's plain white/emerald
 *   identity) when unset or unrecognized
 *
 * Falls back to hardcoded placeholder content (mirroring
 * Refrence/footer.png) for every section when `entry` is omitted or the
 * corresponding field isn't populated yet.
 */
interface Props {
  entry?: PlainEntry<FooterSkeleton> | null;
}

export default function Footer({ entry }: Props) {
  const logoEntry = entry?.fields.logo;
  const logoUrl = isEntry(logoEntry)
    ? getAssetUrl(
        (logoEntry as unknown as PlainEntry<DataImageSkeleton>).fields.image
      )
    : undefined;

  // Whether a real `footer` entry exists at all yet. `DEFAULT_*` placeholder
  // content below is only used in its absence (Contentful not wired up
  // yet) — once a real entry exists, every field renders exactly what's in
  // Contentful, empty or not, rather than quietly falling back to
  // hardcoded text. An editor who genuinely leaves e.g. `legalLinks` empty
  // gets no "Legal" column (see `navColumns`'s length filter above), not a
  // placeholder that never goes away.
  const hasEntry = Boolean(entry);

  const description = hasEntry
    ? entry?.fields.companyDescription
    : DEFAULT_DESCRIPTION;

  const resolvedSocialLinks = resolveDataLinks(entry?.fields.socialLinks).map(
    toIconLinkItem
  );
  const socialLinks = hasEntry ? resolvedSocialLinks : DEFAULT_SOCIAL_LINKS;

  const servicesTitle = entry?.fields.servicesTitle ?? "Services";
  const resolvedServices = resolveDataLinks(entry?.fields.services).map(
    toLinkItem
  );
  const services = hasEntry ? resolvedServices : DEFAULT_SERVICES;

  const companyTitle = entry?.fields.companyTitle ?? "Company";
  const resolvedCompanyLinks = resolveDataLinks(
    entry?.fields.companyLinks
  ).map(toLinkItem);
  const companyLinks = hasEntry ? resolvedCompanyLinks : DEFAULT_COMPANY_LINKS;

  const resourcesTitle = entry?.fields.resourcesTitle ?? "Resources";
  const resolvedResourceLinks = resolveDataLinks(
    entry?.fields.resourceLinks
  ).map(toLinkItem);
  const resourceLinks = hasEntry
    ? resolvedResourceLinks
    : DEFAULT_RESOURCE_LINKS;

  const legalTitle = entry?.fields.legalTitle ?? "Legal";
  const resolvedLegalLinks = resolveDataLinks(entry?.fields.legalLinks).map(
    toLinkItem
  );
  const legalLinks = hasEntry ? resolvedLegalLinks : DEFAULT_LEGAL_LINKS;

  const contactTitle = entry?.fields.contactTitle ?? "Contact";
  const resolvedContactLinks = resolveDataLinks(
    entry?.fields.contactLinks
  ).map(toContactItem);
  const contactLinks = hasEntry ? resolvedContactLinks : DEFAULT_CONTACT_LINKS;

  const officesTitle = entry?.fields.officesTitle ?? "Offices";
  const resolvedOffices = (entry?.fields.officeLocations ?? [])
    .filter((office): office is PlainEntry<OfficeSkeleton> => isEntry(office))
    .map(officeToItem);
  const offices = hasEntry ? resolvedOffices : DEFAULT_OFFICES;

  const resolvedPartners = resolveDataLinks(entry?.fields.partner).map(
    (link) => ({
      id: link.sys.id,
      label: link.fields.label ?? "",
      iconUrl: resolveLinkIcon(link),
    })
  );
  const partners = hasEntry ? resolvedPartners : DEFAULT_PARTNERS;

  const copyright = hasEntry ? entry?.fields.copyright : DEFAULT_COPYRIGHT;

  const resolvedBottomLinks = resolveDataLinks(entry?.fields.bottomLinks).map(
    toLinkItem
  );
  const bottomLinks = hasEntry ? resolvedBottomLinks : DEFAULT_BOTTOM_LINKS;

  // `backgroundImage` links to a `dataImage` *entry*, not a raw asset —
  // resolve that entry's own `image` field for the actual asset URL (same
  // pattern HomeAboutUs's optional background uses). No placeholder
  // fallback: the footer simply stays on its plain white background until
  // an editor sets one.
  const backgroundImageEntry = entry?.fields.backgroundImage;
  const backgroundUrl = isEntry(backgroundImageEntry)
    ? getAssetUrl(
        (backgroundImageEntry as unknown as PlainEntry<DataImageSkeleton>)
          .fields.image
      )
    : undefined;

  // Resolves `themeColor` (e.g. "oxytalvision", "arcticvision" — see
  // app/lib/theme.ts) to this footer's background/heading/body/accent
  // colors. `undefined` for an unset or unrecognized value, in which case
  // every themed class below falls back to the footer's own existing
  // default look (today's plain white/emerald identity, unchanged).
  const theme = resolveTheme(entry?.fields.themeColor);

  // The 4 generic nav columns, skipping any with no links — e.g. if
  // `legalLinks` ends up empty, "Legal" simply isn't rendered below rather
  // than showing an empty column. Combined with the flex layout (each
  // column is `flex-1`, not a fixed grid track), the remaining columns
  // automatically grow to fill the width that column would have taken.
  const navColumns = [
    { key: "services", title: servicesTitle, links: services },
    { key: "company", title: companyTitle, links: companyLinks },
    { key: "resources", title: resourcesTitle, links: resourceLinks },
    { key: "legal", title: legalTitle, links: legalLinks },
  ].filter((column) => column.links.length > 0);

  // Same idea for the combined Contact/Offices column: only rendered when
  // at least one of the two has content, and each of its two sub-sections
  // is skipped individually when empty.
  const hasContactColumn = contactLinks.length > 0 || offices.length > 0;

  return (
    <footer
      className={cx(
        "relative overflow-hidden border-t",
        theme?.cardBorder ?? "border-gray-100",
        !backgroundUrl && (theme?.sectionBg ?? "bg-white")
      )}
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
      {/* Light scrim over the background image so the text stays readable
          regardless of what's behind it — no-op when there's no image. */}
      {backgroundUrl && (
        <div
          aria-hidden
          className={cx(
            "pointer-events-none absolute inset-0 -z-10 opacity-90",
            theme?.sectionBg ?? "bg-white"
          )}
        />
      )}

      <div className="container mx-auto px-5 md:px-10">
        {/* =================================================
            TOP — brand column + nav columns, laid out with flexbox
            (`flex-wrap` + each column `flex-1`) rather than a fixed-track
            grid: the brand block reserves a fixed width on desktop
            (`lg:basis-[260px]`, stacking full-width below `lg`), and every
            other column shares the remaining space equally via `flex-1`.
            Columns with no links are skipped entirely (see `navColumns`/
            `hasContactColumn` above) — since the rest are `flex-1` and not
            pinned to a fixed grid track, dropping one column just lets its
            neighbors grow to fill the freed width instead of leaving a
            blank gap.
        ================================================= */}
        <div className="flex flex-wrap gap-x-8 gap-y-12 py-14 md:py-16">
          {/* BRAND */}
          <div className="flex basis-full flex-col gap-5 lg:basis-[260px] lg:shrink-0 lg:grow-0">
            <Link
              href="/"
              className={cx(
                "inline-flex w-fit items-center text-[30px] tracking-tight text-white"
              )}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                <img src={logoUrl} alt="Oxytal" className="h-8 w-auto object-contain" />
              ) : (
                <>
                  Oxytal
                </>
              )}
            </Link>

            {description && (
              <p
                className={cx(
                  "max-w-xs text-[14.5px] leading-relaxed",
                  theme?.body ?? "text-gray-500"
                )}
              >
                {description}
              </p>
            )}

            <div className="flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                    theme?.iconBG ?? "bg-gray-100",
                  )}
                >
                  {social.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                    <img src={social.iconUrl} alt="" aria-hidden className="h-4 w-4 object-contain" />
                  ) : (
                    social.label.slice(0, 2)
                  )}
                </Link>
              ))}
            </div>
          </div>

          {navColumns.map((column) => (
            <div key={column.key} className="min-w-[130px] basis-[140px] flex-1">
              <FooterColumn title={column.title} links={column.links} theme={theme} />
            </div>
          ))}

          {/* CONTACT + OFFICES */}
          {hasContactColumn && (
            <div className="min-w-[170px] basis-[170px] flex-1 flex flex-col gap-6">
              {contactLinks.length > 0 && (
                <div>
                  <h3
                    className={cx(
                      "text-xs font-bold tracking-wide uppercase",
                      theme?.accentText ?? "text-emerald-700"
                    )}
                  >
                    {contactTitle}
                  </h3>

                  <ul className="mt-4 flex flex-col gap-3">
                    {contactLinks.map((contact, index) => {
                      const Icon = CONTACT_ICONS[index % CONTACT_ICONS.length];

                      return (
                        <li key={contact.id}>
                          <Link
                            href={contact.href}
                            className={cx(
                              "flex items-start gap-2 text-[13.5px] transition-colors",
                              theme?.link ?? "text-gray-600",
                            )}
                          >
                            {contact.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                              <img src={contact.iconUrl} alt="" aria-hidden className="mt-0.5 h-4 w-4 object-contain" />
                            ) : (
                              <Icon
                                size={15}
                                className={cx("mt-0.5 shrink-0", theme?.accentText ?? "text-emerald-600")}
                                aria-hidden
                              />
                            )}
                            {contact.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {offices.length > 0 && (
                <div
                  className={
                    contactLinks.length > 0
                      ? cx("border-t pt-5", theme?.cardBorder ?? "border-gray-100")
                      : ""
                  }
                >
                  <h3
                    className={cx(
                      "text-xs font-bold tracking-wide uppercase",
                      theme?.accentText ?? "text-emerald-700"
                    )}
                  >
                    {officesTitle}
                  </h3>

                  <ul className="mt-4 flex flex-col gap-4">
                    {offices.map((office) => (
                      <li key={office.id} className="flex items-start gap-2">
                        {office.flagUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                          <img
                            src={office.flagUrl}
                            alt=""
                            aria-hidden
                            className="mt-0.5 h-[22px] w-[20px] shrink-0 object-cover"
                          />
                        ) : (
                          <MapPin
                            size={15}
                            className={cx("mt-0.5 shrink-0", theme?.accentText ?? "text-emerald-600")}
                            aria-hidden
                          />
                        )}

                        <div>
                          <div
                            className={cx(
                              "text-[13.5px] font-bold",
                              theme?.heading ?? "text-gray-900"
                            )}
                          >
                            {office.city}
                          </div>
                          {office.description && (
                            <div
                              className={cx(
                                "text-[12.5px]",
                                theme?.body ?? "text-gray-500"
                              )}
                            >
                              {office.description}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            PARTNER / COMPLIANCE BADGES
        ================================================= */}
        {partners?.length > 0 && (
        <div
          className={cx(
            "flex flex-wrap items-center justify-center gap-x-10 gap-y-5 rounded-2xl border px-6 py-6 sm:justify-between md:px-10",
            theme?.partnerIcon ?? "border-gray-100",
          )}
        >
          {partners.map((partner, index) => {
            const Icon = PARTNER_ICONS[index % PARTNER_ICONS.length];

            return (
              <div key={partner.id} className="flex items-center gap-3">
                {partner.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- matches the plain <img> convention already used for Contentful assets in this project
                  <img src={partner.iconUrl} alt="" aria-hidden className="h-6 w-6 object-contain" />
                ) : (
                  <Icon size={20} className={theme?.accentText ?? "text-emerald-600"} aria-hidden />
                )}

                <span
                  className={cx(
                    "text-[13.5px] font-semibold"
                  )}
                >
                  {partner.label}
                </span>
              </div>
            );
          })}
        </div>
        )}

        {/* =================================================
            BOTTOM — copyright + legal links.
        ================================================= */}
        {copyright?(
        <div
          className={cx(
            "flex flex-col items-center gap-4 border-t py-7 sm:flex-row sm:justify-between",
            theme?.cardBorder ?? "border-gray-100"
          )}
        >
          <p className={cx("text-[13px]", theme?.muted ?? "text-gray-500")}>{copyright}</p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {bottomLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={cx(
                  "text-[13px] transition-colors",
                  theme?.link ?? "text-gray-600",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
  ):null}
      </div>
    </footer>
  );
}
