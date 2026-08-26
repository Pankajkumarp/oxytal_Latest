import { EntryFieldTypes, EntrySkeletonType } from "contentful";

/**
 * 🖼️ Data - Image (`dataImage`)
 * Shared image entry — wraps a Contentful asset with alt text.
 */
export type DataImageSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    altText?: EntryFieldTypes.Symbol;
    image: EntryFieldTypes.AssetLink;
    secondaryImage: EntryFieldTypes.AssetLink;
    lazyLoad?: EntryFieldTypes.Boolean;
    /** Locked Contentful enum — "dark" or "light" only. Only meaningful when this entry is placed directly in a `page.body` field (see `PageBody`) — nested usage elsewhere (a `composableElement`'s `elements`, `dataLink.icon`, …) ignores it entirely. `PageBody` stamps it onto this block's own wrapper as a `data-nav-contrast` attribute, same mechanism `ComposableElementRenderer`'s own `navType` uses — see `Navbar.tsx`'s "NAV CONTRAST" comment. Falls back to "light" when unset. */
    navType?: EntryFieldTypes.Symbol;
  },
  "dataImage"
>;

/**
 * 🎥 Data - Video (`dataVideo`)
 */
export type DataVideoSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    altText: EntryFieldTypes.Symbol;
    description?: EntryFieldTypes.Symbol;
    isFor?: EntryFieldTypes.Symbol;
    videoFile?: EntryFieldTypes.AssetLink;
    videoFileMobile?: EntryFieldTypes.AssetLink;
    showControls?: EntryFieldTypes.Boolean;
    /** Free text in Contentful (no enum validation) — e.g. "16:9", "9:16", "1:1", "4:3". Validated against CommonVideo's supported ratios in PageBody before use. */
    aspectRatio?: EntryFieldTypes.Symbol;
    /** Same format as `aspectRatio`, applied below the 768px breakpoint instead — doesn't exist as a field in Contentful yet; wired here so it works automatically the moment it's added (see `dataVideo` in the Contentful web app). */
    aspectRatioMobile?: EntryFieldTypes.Symbol;
    /** Links to a `dataImage` entry (not a raw asset) — resolve `.fields.image` for the actual asset URL. */
    poster?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    autoPlay?: EntryFieldTypes.Boolean;
    loop?: EntryFieldTypes.Boolean;
    /**
     * Optional overlay content shown above the video — `CommonVideo`'s
     * existing "content mode" (see `app/ui/CommonVideo.tsx`), now wired up
     * from Contentful. `PageBody` only renders this block at all when at
     * least one of `eyebrow`/`heading`/`text`/`button` is set; each piece
     * also only renders individually when its own field is set — an editor
     * who fills in just `heading` gets only a heading, no empty eyebrow/
     * text/button slots. Each piece always renders with `CommonVideo`'s
     * fixed default styling (white-on-glass eyebrow pill, white heading,
     * gray body, white-on-emerald button) — there's no per-entry color/size
     * override for any of them.
     */
    eyebrow?: EntryFieldTypes.Symbol;
    heading?: EntryFieldTypes.Symbol;
    /** Free text in Contentful — "h1"–"h4" only (narrower than `dataText.headingLevel`'s h1–h6, since `CommonVideo`'s `headingLevel` prop doesn't accept h5/h6). Validated against that narrower set in `PageBody` before use; falls back to `CommonVideo`'s own default ("h2") for anything unset or unrecognized. */
    headingLevel?: EntryFieldTypes.Symbol;
    /** Plain (non-rich) overlay body copy — short by design (a video caption, not a full article), unlike `dataText.text`'s `RichText`. */
    text?: EntryFieldTypes.Text;
    /** The overlay's CTA — reuses `dataLink` for its `label`/href, same convention every other CTA in this project uses. */
    button?: EntryFieldTypes.EntryLink<DataLinkSkeleton>;
    /** Locked Contentful enum — "dark" or "light" only. Only meaningful when this entry is placed directly in a `page.body` field (see `PageBody`) — a `dataVideo` nested inside a `composableElement`'s `elements` ignores it entirely. `PageBody` stamps it onto this block's own wrapper as a `data-nav-contrast` attribute, same mechanism `ComposableElementRenderer`'s own `navType` uses — see `Navbar.tsx`'s "NAV CONTRAST" comment. Falls back to "light" when unset. */
    navType?: EntryFieldTypes.Symbol;
    /**
     * Locked Contentful enum — "dark" or "light" only, and unlike `navType`
     * above, genuinely optional with no fallback: `PageBody` passes this
     * straight through to `CommonVideo`'s own `overlay` prop, which tints
     * the video itself ("dark" → black scrim, "light" → white scrim) only
     * when the field is actually set, and renders no tint at all otherwise.
     * Independent of `navType` — that field only affects the fixed navbar's
     * icon color, not anything drawn over the video.
     */
    overlay?: EntryFieldTypes.Symbol;
    /** Seconds the text overlay (eyebrow/heading/description/button) waits — after the section scrolls into view — before it reveals, passed straight through to `CommonVideo`'s own `textDelay` prop. The video itself isn't held back by this. Falls back to 0 (no delay) when unset. */
    textDelay?: EntryFieldTypes.Number;
  },
  "dataVideo"
>;

/**
 * 📝 Data - Text (`dataText`)
 */
export type DataTextSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    headingLevel?: EntryFieldTypes.Symbol;
    heading?: EntryFieldTypes.Symbol;
    /** A trailing portion of `heading` rendered in the section's own accent color instead of the plain heading color (e.g. heading "Build what's next," + highlightText "with us" → "Build what's next, **with us**") — same "title + highlightText" idiom `callToAction.highlightText` already uses, generalized onto `dataText` so any section reusing it for a heading can opt in too (see `CareersBannerHorizon` for the first user). Renders nothing extra when unset. */
    highlightText?: EntryFieldTypes.Symbol;
    eyebrow?: EntryFieldTypes.Symbol;
    text?: EntryFieldTypes.RichText;
    /** Locked Contentful enum — "dark" or "light" only. Only meaningful when this entry is placed directly in a `page.body` field (see `PageBody`) — the many `dataText` entries nested inside a `composableElement`'s `elements` (every section's own copy) ignore it entirely. `PageBody` stamps it onto this block's own wrapper as a `data-nav-contrast` attribute, same mechanism `ComposableElementRenderer`'s own `navType` uses — see `Navbar.tsx`'s "NAV CONTRAST" comment. Falls back to "light" when unset. */
    navType?: EntryFieldTypes.Symbol;
  },
  "dataText"
>;

/**
 * 🔗 Data - Link (`dataLink`)
 * Generic link used for nav items, CTAs and footer links.
 */
export type DataLinkSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    label: EntryFieldTypes.Symbol;
    ariaLabel?: EntryFieldTypes.Symbol;
    type: EntryFieldTypes.Symbol;
    externalUrl?: EntryFieldTypes.Symbol;
    linkedPage?: EntryFieldTypes.Symbol;
    icon?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
  },
  "dataLink"
>;

/**
 * 📖 Data - Dictionary Item (`dataDictionaryItem`)
 * Key/value translation string.
 */
export type DataDictionaryItemSkeleton = EntrySkeletonType<
  {
    translationKey: EntryFieldTypes.Symbol;
    translationValue: EntryFieldTypes.Symbol;
  },
  "dataDictionaryItem"
>;

/**
 * 🧭 Data - Navigation (`dataNavigation`)
 * An ordered list of `dataLink` entries (e.g. a footer column). The header
 * nav uses its own dedicated `headerNavigation`/`navMenu`/`navLink` types
 * instead — see below and `Navbar`.
 */
export type DataNavigationSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    navigation: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
  },
  "dataNavigation"
>;

/**
 * Statistic (`statistic`)
 * A single stat/metric, e.g. used inside `contentDetail`.
 */
export type StatisticSkeleton = EntrySkeletonType<
  {
    label: EntryFieldTypes.Symbol;
    value: EntryFieldTypes.Symbol;
    icon?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
  },
  "statistic"
>;

/**
 * Technology 🪟 (`technology`)
 */
export type TechnologySkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    logo?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    website?: EntryFieldTypes.Symbol;
    category?: EntryFieldTypes.Symbol;
  },
  "technology"
>;

/**
 * Subsidiary (`subsidiary`)
 */
export type SubsidiarySkeleton = EntrySkeletonType<
  {
    companyName?: EntryFieldTypes.Symbol;
    country?: EntryFieldTypes.Symbol;
    description?: EntryFieldTypes.Symbol;
  },
  "subsidiary"
>;

/**
 * Office 📊 (`office`)
 */
export type OfficeSkeleton = EntrySkeletonType<
  {
    country: EntryFieldTypes.Symbol;
    city: EntryFieldTypes.Symbol;
    description?: EntryFieldTypes.Text;
    address?: EntryFieldTypes.Text;
    phone?: EntryFieldTypes.Symbol;
    email?: EntryFieldTypes.Symbol;
    /** Optional flag/marker image shown next to this office in the footer's "Offices" list (see `Footer`) — falls back to a plain map-pin icon when unset. */
    flag?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
  },
  "office"
>;

/**
 * Call To Action 📞 (`callToAction`)
 */
export type CallToActionSkeleton = EntrySkeletonType<
  {
    systemTitle: EntryFieldTypes.Symbol;
    eyebrow?: EntryFieldTypes.Symbol;
    title: EntryFieldTypes.Symbol;
    highlightText?: EntryFieldTypes.Symbol;
    description: EntryFieldTypes.Text;
    backgroundImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    ctaButton?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    theme?: EntryFieldTypes.Symbol;
  },
  "callToAction"
>;

/**
 * Content Detail ⭐ (`contentDetail`)
 * Generic detail entry used for case studies / service detail blocks.
 */
export type ContentDetailSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    title?: EntryFieldTypes.Symbol;
    badge?: EntryFieldTypes.Symbol;
    slug?: EntryFieldTypes.Symbol;
    /** Locked Contentful enum of business-catalog labels ("Featured", "Digital Product", "Workforce Management Platform", "Student Community Platform", …) — not free text, so components needing a free-text subtitle/tag (e.g. `ProductShowcase`'s product-card tagline) reuse `industry` instead. */
    category?: EntryFieldTypes.Symbol;
    icon?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** Whether a consumer should render `icon`/its fallback glyph at all — e.g. `HomeAboutUs`'s feature cards. Defaults to shown (`true`) when unset, so existing entries with no value set keep rendering their icon exactly as before this field existed; set explicitly to `false` to hide it for a given entry. */
    showIcon?: EntryFieldTypes.Boolean;
    heroImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    clientName?: EntryFieldTypes.Symbol;
    /** The client's logo/wordmark — pairs with `clientName` above. Used by `HomeCaseStudies`' case-study cards; falls back to plain `clientName` text when unset. */
    clientLogo?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    industry?: EntryFieldTypes.Symbol;
    shortDescription?: EntryFieldTypes.Text;
    fullDescription?: EntryFieldTypes.RichText;
    statistics?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<StatisticSkeleton>
    >;
    technologies?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<TechnologySkeleton>
    >;
    cta?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<DataLinkSkeleton>>;
    gallery?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataImageSkeleton>
    >;
    /** Locked Contentful enum — "blue" or "yellow" only (no "green"). Used by `AboutProducts`' product cards to pick their header gradient/accent color; `ProductShowcase`/`ProductsHero` (see app/ui) reuse the same two values but render "yellow" as a green accent instead, to get a distinct Oxyem/Skolrup identity out of an enum that only offers two options. Falls back to cycling by card position when unset or unrecognized. */
    accentColor?: EntryFieldTypes.Symbol;
    /** Locked Contentful enum — "reel", "editorial", or "bento". Picks which of `CaseStudyDetail`'s 3 designs (see app/ui/CaseStudyDetail.tsx, ported from `Refrence/case-study-detail.html`/`case-study-2.html`/`case-study-3.html`) renders this entry's `/case-studies/[slug]` detail page — same underlying fields for every variant, only the layout/typography/heading animation/background differ. Falls back to "editorial" when unset. */
    layoutVariant?: EntryFieldTypes.Symbol;
    /** Resolves via `resolveTheme` (see app/lib/theme.ts) to `CaseStudyDetail`'s colors, same "themeColor" convention every `composableElement` section uses. `undefined`/unrecognized falls back to the selected `layoutVariant`'s own bespoke default palette (its reference mockup's identity) rather than this project's usual light/dark defaults. */
    themeColor?: EntryFieldTypes.Symbol;
    /**
     * Locked Contentful enum naming one of the 14 decorative background
     * tiles ported from `Refrence/patterns-preview.html` (see
     * `ThemePattern` in app/ui) — "baseline-grid", "contour",
     * "iso-lattice", "node-field", "halftone", "hatch", "registration",
     * "token-stream", "attention-matrix", "layer-graph",
     * "embedding-cloud", "dither", "circuit-trace", or "grain". Same
     * "only takes effect together with `patternColor`" rule every other
     * `pattern` field in this project follows (see `composableElement.
     * pattern`'s own doc comment) — this is the fallback-path pair,
     * read by `CaseStudyDetail` only when this case study has no
     * dedicated `page` yet (same fallback-vs-`page` split `themeColor`
     * above already documents).
     */
    pattern?: EntryFieldTypes.Symbol;
    /** The hex color `pattern` renders in (e.g. "#2F5CFF") — see `pattern` above. Ignored for `pattern: "grain"`, which is inherently monochrome, but still required to "arm" it. */
    patternColor?: EntryFieldTypes.Symbol;
  },
  "contentDetail"
>;

/**
 * Comparison Row (`comparisonRow`)
 * One row of the `/products` page's Oxyem-vs-Skolrup comparison table —
 * referenced from a `composableElement` (`subType: "productCompare"`)
 * `elements` array — see `ProductCompare`. `productAValue`/`productBValue`
 * are free text: the literal values `"yes"`/`"no"` render as a check/×
 * icon, anything else renders as plain text (the reference mockup mixes
 * both — most rows are yes/no, a couple like "Target Audience" show
 * plain descriptive text in both columns instead).
 */
export type ComparisonRowSkeleton = EntrySkeletonType<
  {
    feature: EntryFieldTypes.Symbol;
    productAValue: EntryFieldTypes.Symbol;
    productBValue: EntryFieldTypes.Symbol;
  },
  "comparisonRow"
>;

/**
 * Service Card (`serviceCard`)
 * A single named service/stop, referenced from a `composableElement`
 * (`subType: "service"`) `elements` array — see `HomeServices`.
 */
export type ServiceCardSkeleton = EntrySkeletonType<
  {
    title: EntryFieldTypes.Symbol;
    shortDescription: EntryFieldTypes.Symbol;
    icon?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** Illustration shown at the top of the card (see `HomeServices`) — falls back to a colored gradient block (from `accentColor`) when unset, same "photo replaces the gradient" treatment `AboutProducts`' `contentDetail.heroImage` uses. */
    heroImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** A short highlight badge shown above the title (e.g. "↓ 40% scoping time") — see `LandingCards`, the first user. Renders nothing extra when unset. */
    metric?: EntryFieldTypes.Symbol;
    /** Free text in Contentful — "blue", "green", "purple", or "orange". Picks this card's illustration gradient / icon / number / "Learn more" accent color in `HomeServices`; falls back to cycling by card position when unset or unrecognized, same convention as `contentDetail.accentColor`. */
    accentColor?: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    cta?: EntryFieldTypes.EntryLink<DataLinkSkeleton>;
  },
  "serviceCard"
>;

/**
 * Testimonial 💬 (`testimonial`)
 * A single client quote, referenced from a `composableElement`
 * (`subType: "casestudy"`) `elements` array — see `HomeCaseStudies`.
 */
export type TestimonialSkeleton = EntrySkeletonType<
  {
    quote: EntryFieldTypes.Text;
    authorName: EntryFieldTypes.Symbol;
    authorTitle?: EntryFieldTypes.Symbol;
    authorPhoto?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    clientLogo?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** Up to 3 highlight stat badges shown alongside this testimonial (e.g. "+70% Efficiency Gain") — each testimonial carries its own, since different quotes highlight different results. */
    stats?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<StatisticSkeleton>>;
  },
  "testimonial"
>;

/**
 * 🧩 Composable Element (`composableElement`)
 * A generic page-builder block; `elements` can hold a mix of the linked types below.
 */
export type ComposableElementSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    type: EntryFieldTypes.Symbol;
    subType: EntryFieldTypes.Symbol;
    elements?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<
        | DataImageSkeleton
        | DataLinkSkeleton
        | DataTextSkeleton
        | DataVideoSkeleton
        | ContentDetailSkeleton
        | TechnologySkeleton
        | ServiceCardSkeleton
        | CallToActionSkeleton
        | TestimonialSkeleton
        | StatisticSkeleton
        | OfficeSkeleton
        | ComparisonRowSkeleton
      >
    >;
    backgroundImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    themeColor?: EntryFieldTypes.Symbol;
    /**
     * Locked Contentful enum naming one of the 14 decorative background
     * tiles ported from `Refrence/patterns-preview.html` (see
     * `ThemePattern` in app/ui) — "baseline-grid", "contour",
     * "iso-lattice", "node-field", "halftone", "hatch", "registration",
     * "token-stream", "attention-matrix", "layer-graph",
     * "embedding-cloud", "dither", "circuit-trace", or "grain". Only
     * takes effect when `patternColor` is *also* set — see
     * `ThemePattern`'s own doc comment for why both are required
     * together. Unset (or set with no `patternColor`) falls back to the
     * section's existing theme-driven pattern, unchanged.
     */
    pattern?: EntryFieldTypes.Symbol;
    /** The hex color `pattern` renders in (e.g. "#2F5CFF") — see `pattern` above. Ignored for `pattern: "grain"`, which is inherently monochrome, but still required to "arm" it, same one-rule-for-every-pattern convention the others use. */
    patternColor?: EntryFieldTypes.Symbol;
    /** Free text in Contentful — "left" (default), "center", or "right". Not every subtype reads this yet; see `HomeTalkToUs` for the first one that does. */
    textStart?: EntryFieldTypes.Symbol;
    /** Locked Contentful enum — "reel", "editorial", or "bento". Only read by the `caseStudyDetail` subtype (see `CaseStudyDetailSection`/`CaseStudyDetail` in app/ui) to pick which of its 3 designs this page uses; falls back to the linked case study's own `contentDetail.layoutVariant` when unset, then to "editorial". Named `isFor` (which design this section "is for") rather than reusing `subType`, since `subType` already picks the *component* (`caseStudyDetail`) — this picks the *design* that component renders. */
    isFor?: EntryFieldTypes.Symbol;
    /**
     * Locked Contentful enum — "dark" or "light" only. Not read by this
     * section itself — `ComposableElementRenderer` stamps it onto this
     * section's own DOM wrapper as a `data-nav-contrast` attribute, which
     * `Navbar`'s own scroll handler reads to decide whether its logo/
     * icons render in white or dark once the fixed nav is sitting over
     * this section (see `Navbar.tsx`'s own "NAV CONTRAST" comment for
     * the mechanism). Falls back to "light" when unset — most sections
     * on this site default to a light background, so a section that
     * forgets to set this is more likely to be legible (dark nav text)
     * than not.
     */
    navType?: EntryFieldTypes.Symbol;
    /**
     * Freeform JSON payload for subtypes that render structured content
     * directly from JSON rather than via linked `elements` entries —
     * e.g. the `digitalCommerce*` subtypes (see `app/ui/DigitalCommerce`),
     * each of which casts this to its own expected shape (an array or
     * object, documented on that subtype's own component) and falls
     * back to its hardcoded reference copy when unset. Not read by any
     * `elements`-driven subtype — the two content models are
     * alternatives, not layered.
     */
    content?: EntryFieldTypes.Object;
  },
  "composableElement"
>;

/**
 * Nav Menu Item (`navMenuItem`)
 * One clickable item inside a `navMenu`'s panel — see `Navbar`. `column`
 * is just a plain number (1, 2, 3…) grouping items into the mega-menu's
 * columns; items are grouped by that number rather than needing separate
 * "column" entries.
 */
export type NavMenuItemSkeleton = EntrySkeletonType<
  {
    title: EntryFieldTypes.Symbol;
    description?: EntryFieldTypes.Symbol;
    href?: EntryFieldTypes.Symbol;
    column?: EntryFieldTypes.Integer;
  },
  "navMenuItem"
>;

/**
 * Nav Menu (`navMenu`)
 * One expandable top-nav item — referenced from a `headerNavigation`
 * entry's `items` array (a plain `navLink` in that same array instead
 * renders as a simple, non-expanding link) — see `Navbar`.
 *
 * A dedicated, flat content model built specifically for the nav (rather
 * than reusing generic page-builder types): `items` is a flat list of
 * `navMenuItem` entries grouped into columns by their own `column` number,
 * and the mega-menu panel's highlighted CTA card is just plain fields
 * directly on this entry (`ctaTag`/`ctaTitle`/`ctaDescription`/
 * `ctaLinkLabel`/`ctaLinkHref`) instead of a separate linked entry.
 */
export type NavMenuSkeleton = EntrySkeletonType<
  {
    label: EntryFieldTypes.Symbol;
    /** Optional destination for the top-level label itself. When set, the label renders as a link (clicking it navigates there) alongside its existing hover-to-open mega menu/dropdown panel — see `Navbar`. Left unset, the label stays a plain, non-navigating toggle, same as before this field existed. */
    href?: EntryFieldTypes.Symbol;
    /** Free text in Contentful — "megaMenu" (full-width panel with columns + cta) or "dropdown" (simple list). Validated against those two in Navbar before use. */
    menuType: EntryFieldTypes.Symbol;
    eyebrow?: EntryFieldTypes.Symbol;
    intro?: EntryFieldTypes.Symbol;
    items?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<NavMenuItemSkeleton>
    >;
    ctaTag?: EntryFieldTypes.Symbol;
    ctaTitle?: EntryFieldTypes.Symbol;
    ctaDescription?: EntryFieldTypes.Symbol;
    ctaLinkLabel?: EntryFieldTypes.Symbol;
    ctaLinkHref?: EntryFieldTypes.Symbol;
  },
  "navMenu"
>;

/**
 * Nav Link (`navLink`)
 * A simple, non-expanding top-level nav item — see `Navbar`.
 */
export type NavLinkSkeleton = EntrySkeletonType<
  {
    label: EntryFieldTypes.Symbol;
    href: EntryFieldTypes.Symbol;
  },
  "navLink"
>;

/**
 * Header Navigation (`headerNavigation`)
 * The header nav's top-level container — an ordered list mixing `navMenu`
 * (expandable) and `navLink` (simple) entries. Fetched via
 * `getNavigation()` (see app/lib/contentEntry.ts) and rendered by
 * `Navbar`.
 */
export type HeaderNavigationSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    items: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<NavMenuSkeleton | NavLinkSkeleton>
    >;
    /**
     * Social icon row shown alongside the "Contact us" button — desktop
     * right side and the mobile slide-out panel (see `Navbar`). The
     * field accepts either shape: a `dataLink` (icon + explicit href,
     * same as `Footer`'s own `socialLinks`) or a bare `dataImage` (just
     * an icon — `Navbar` infers a platform href from its label/alt text
     * since there's no `externalUrl` on that shape).
     */
    socialLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton | DataImageSkeleton>
    >;
    /** Resolves via `resolveTheme` (see app/lib/theme.ts) to the nav's link/hover/mega-panel/CTA-card colors, same "themeColor" convention every `composableElement` section uses. `undefined`/unrecognized falls back to `Navbar`'s own existing default look. */
    themeColor?: EntryFieldTypes.Symbol;
  },
  "headerNavigation"
>;

/**
 * Footer ✨ (`footer`)
 */
export type FooterSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    logo?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    companyDescription?: EntryFieldTypes.Text;
    socialLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "services" column below — defaults to "Services" when unset (see `Footer`). */
    servicesTitle?: EntryFieldTypes.Symbol;
    services?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "companyLinks" column below — defaults to "Company" when unset. */
    companyTitle?: EntryFieldTypes.Symbol;
    companyLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "resourceLinks" column below — defaults to "Resources" when unset. */
    resourcesTitle?: EntryFieldTypes.Symbol;
    /** "Resources" column (Blog/Insights/Documentation/Security/Status in Refrence/footer.png) — same shape as `companyLinks`/`legalLinks`. */
    resourceLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "legalLinks" column below — defaults to "Legal" when unset. */
    legalTitle?: EntryFieldTypes.Symbol;
    legalLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "contactLinks" column below — defaults to "Contact" when unset. */
    contactTitle?: EntryFieldTypes.Symbol;
    /** "Contact" column (email/discovery call/contact form in Refrence/footer.png) — each `dataLink`'s own `icon` field supplies its glyph, same pattern as `socialLinks`/`partner`. */
    contactLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Heading text for the "officeLocations" list below — defaults to "Offices" when unset. */
    officesTitle?: EntryFieldTypes.Symbol;
    officeLocations?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<OfficeSkeleton>
    >;
    workingHours?: EntryFieldTypes.Symbol;
    subsidiaries?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<SubsidiarySkeleton>
    >;
    partner?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    copyright: EntryFieldTypes.Symbol;
    bottomLinks?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<DataLinkSkeleton>
    >;
    /** Optional full-bleed section background (links to a `dataImage` entry, same field/pattern `composableElement`/`callToAction` use) — rendered only when set; the footer otherwise stays on its plain white background. */
    backgroundImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** Resolves via `resolveTheme` (see app/lib/theme.ts) to the footer's background/text/link/accent colors, same "themeColor" convention `composableElement`/`headerNavigation` use. `undefined`/unrecognized falls back to `Footer`'s own existing default look. */
    themeColor?: EntryFieldTypes.Symbol;
  },
  "footer"
>;

/**
 * Banner Image 🖼️ (`bannerImage`)
 * A full-bleed promotional image banner with its own responsive image
 * pair (desktop/mobile, each with its own aspect ratio), overlay copy
 * (badge/title/description), and CTA link — referenced directly from a
 * `page.body` entry (see `PageBody`), not nested inside a
 * `composableElement`. A dedicated content type of its own rather than
 * composed from `dataText`/`dataImage`/`dataLink` like every
 * `composableElement` subtype's content is, since it needs two distinct,
 * non-repeating images (desktop/mobile) plus two aspect-ratio fields —
 * a shape the generic "elements array" every `composableElement`
 * subtype reuses doesn't fit.
 */
export type BannerImageSkeleton = EntrySkeletonType<
  {
    systemTitle?: EntryFieldTypes.Symbol;
    /** The banner image shown at `md:` breakpoints and up. */
    desktopImage: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** The banner image shown below the `md:` breakpoint — falls back to `desktopImage` when unset, so a banner only ever needs one image to start. */
    mobileImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    /** Free text, e.g. "1920/500" — the "W/H" shape this project's own `aspect-[W/H]` Tailwind classes use elsewhere (see `ProductsHero`/`ProductShowcase`), applied here via inline `style` instead since an arbitrary editor-typed ratio can't become a literal Tailwind class (Tailwind's scanner only discovers class names it finds literally in source — see `ThemePattern`'s own `patternColor` doc comment for the same constraint). Falls back to a wide 1920:500 letterbox when unset. */
    desktopAspectRatio?: EntryFieldTypes.Symbol;
    /** Same format/mechanism as `desktopAspectRatio`, applied below `md:` instead. Falls back to a taller 4:5 crop when unset — the wide desktop ratio would badly letterbox the same photo on a phone-width screen. */
    mobileAspectRatio?: EntryFieldTypes.Symbol;
    badgeText?: EntryFieldTypes.Symbol;
    title?: EntryFieldTypes.Symbol;
    description?: EntryFieldTypes.Text;
    /** The overlay's CTA — reuses `dataLink` for its `label`/href, same convention every other CTA in this project uses. */
    link?: EntryFieldTypes.EntryLink<DataLinkSkeleton>;
    /** Locked Contentful enum — "dark" or "light" only. Resolves via the same `resolveTheme` (see app/lib/theme.ts) every `composableElement` section uses, picking overlay text/badge/button colors (and the scrim's own tint) that read legibly over a photo. Falls back to "dark" (white-on-photo) when unset — the safer default over an arbitrary image, same convention `AISolutionsSpotlight`/`AISolutionsProcess` use for their own un-themed default. */
    themeColor?: EntryFieldTypes.Symbol;
    /**
     * Locked Contentful enum — "dark" or "light" only. A *different*
     * concern from `themeColor` above (which styles this banner's own
     * overlay copy): this one controls the site's fixed nav bar's own
     * logo/icon contrast while it sits over *this* section. `PageBody`
     * stamps it onto this block's own wrapper as a `data-nav-contrast`
     * attribute, same mechanism `ComposableElementRenderer`'s own
     * `navType` uses for `composableElement` sections — see
     * `Navbar.tsx`'s "NAV CONTRAST" comment. Falls back to "light" when
     * unset (unlike `themeColor` above, which defaults to "dark") — most
     * sections on this site default to a light background, so a section
     * that forgets to set this is more likely to end up legible.
     */
    navType?: EntryFieldTypes.Symbol;
  },
  "bannerImage"
>;

/**
 * 📄 Page (`page`)
 * The main routable content type — looked up by `slug` in `getPageBySlug`.
 */
export type PageSkeleton = EntrySkeletonType<
  {
    systemTitle: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    contentType: EntryFieldTypes.Symbol;
    published: EntryFieldTypes.Boolean;
    metaTitle: EntryFieldTypes.Symbol;
    metaDescription?: EntryFieldTypes.Text;
    metaImage?: EntryFieldTypes.EntryLink<DataImageSkeleton>;
    body?: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<
        | DataVideoSkeleton
        | DataTextSkeleton
        | DataImageSkeleton
        | ComposableElementSkeleton
        | DataNavigationSkeleton
        | CallToActionSkeleton
        | BannerImageSkeleton
      >
    >;
  },
  "page"
>;
