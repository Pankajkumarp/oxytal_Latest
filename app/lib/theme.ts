/**
 * Section theming, driven by a `composableElement` entry's own `themeColor`
 * field (currently a free-text Symbol in Contentful — see
 * `app/types/contentful.ts`). An editor picks one of the named presets
 * below (case-insensitive); every registered composableElement subtype
 * (HomeAI, HomeProducts, HomeServices, HomeCaseStudies, CommonTrustedBy,
 * HomeTalkToUs, HomeAboutUs, ServicesPage, ServicesAiLayer) and PageBody's
 * own default renderer resolve it via `resolveTheme` and apply the
 * returned classes to their section background, heading, body copy,
 * eyebrow badge, primary button, and accent/link text — the elements the
 * theme is meant to cover.
 *
 * `resolveTheme` returns `undefined` for an unset or unrecognized
 * `themeColor` — every call site only applies theme classes when it gets
 * a real result back, so a section with no theme set renders exactly as
 * it did before this existed.
 *
 * Decorative background flourishes (blurred blobs, radial gradients) are
 * left as-is regardless of theme: they're a subtle, low-opacity accent
 * rather than a "necessary" themed element, and reproducing them per theme
 * would be a lot of bespoke art for very little visible difference. The
 * one exception is `patternColor` (below) — the dotted-grid decorative
 * backdrop originally built for the `/services` mockup, generalized via
 * `ThemePattern` (see `app/ui/ThemePattern.tsx`) into a shared background
 * any composableElement section can drop in, themed like everything else.
 */

export type ThemeName =
  | "oxytalvision"
  | "arcticvision"
  | "auroravision"
  | "indigocore"
  | "aetherflow"
  | "deepcurrent"
  | "icegrid"
  | "auroraglass"
  | "lavenderflow"
  | "oxytalnova"
  | "oxytalfooter"
  | "neuralhorizon"
  | "platinumcore"
  | "flowspectrum"
  | "aurorawave"
  | "peachfusion"
  | "light"
  | "dark"
  | "black"
  | "navy"
  | "blue"
  | "green"
  | "yellow"
  | "blackyellow"
  | "darkyellow"
  | "pink"
  | "emerald";

export interface SectionTheme {
  /** Section's outer background. */
  sectionBg: string;
  /** Eyebrow/badge pill background + text (e.g. "OUR SERVICES"). */
  eyebrowBg: string;
  eyebrowText: string;
  /** Main heading color. */
  heading: string;
  /** Body/paragraph copy color. */
  body: string;
  /** Muted/secondary text (captions, labels, placeholders). */
  muted: string;
  /** Primary CTA button. */
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
  /** Text links, icons, "Learn more" arrows. */
  accentText: string;
  /** Card background + border, for sections built from bordered cards. */
  cardBg: string;
  cardBorder: string;
  link?: string;
  iconBG?: string;
  divider?: string;
  partnerIcon?: string;
  /**
   * Dot color for `ThemePattern`'s decorative grid backdrop — a raw hex
   * string rather than a Tailwind utility class like every field above.
   * `ThemePattern` bakes it directly into an inline SVG data URI via a
   * `style` attribute, not a `className`, so it needs an actual color
   * value to put there — a dynamically-built Tailwind class name (e.g.
   * `` `bg-[${hex}]` ``) wouldn't work anyway, since Tailwind's static
   * scanner can't discover class names built at runtime by string
   * concatenation, only literal ones it can find in source.
   */
  patternColor: string;
  /**
   * Whether `ThemePattern` should render its decorative grid backdrop at
   * all for this preset — most themes leave it off; only `darkyellow`
   * (the `/services` mockup's own look, where this pattern originally
   * came from) turns it on. Flip this on a preset to opt it in too.
   */
  showPattern: boolean;
}

const THEMES: Record<ThemeName, SectionTheme> = {
  oxytalvision: {
  sectionBg:"bg-gradient-to-br from-[#020617] via-[#041C32] to-[#003B5C]",
  eyebrowBg: "bg-cyan-500/10",
  eyebrowText: "text-cyan-400",
  heading: "text-white",
  body: "text-slate-300",
  muted: "text-slate-500",
  buttonBg: "bg-cyan-500",
  buttonText: "text-slate-950",
  buttonHoverBg: "hover:bg-cyan-400",
  accentText: "text-cyan-400",
  cardBg: "bg-white/1 backdrop-blur-md",
  cardBorder: "border-white/10 border",
  patternColor: "#00D4FF",
  showPattern: false,
},
 arcticvision: {
  sectionBg:"bg-gradient-to-b from-[#F8FCFD] via-white to-[#F1F9FC]",
  eyebrowBg: "bg-cyan-100",
  eyebrowText: "text-cyan-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-cyan-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-cyan-500",
  accentText: "text-cyan-600",
  cardBg: "bg-white shadow-[0_4px_14px_-8px_rgba(16,24,40,0.08)]",
  cardBorder: "border-cyan-100",
  patternColor: "#00D4FF",
  showPattern: false,
},
auroravision: {
  sectionBg:"bg-gradient-to-b from-[#FFFDF7] via-white to-[#F8FAFF]",
  eyebrowBg: "bg-indigo-100",
  eyebrowText: "text-indigo-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-indigo-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-indigo-500",
  accentText: "text-orange-500",
  cardBg:"bg-white shadow-[0_4px_14px_-8px_rgba(79,70,229,0.12)]",
  cardBorder: "border border-indigo-100",
  patternColor: "#8B5CF6",
  showPattern: false,
},
indigocore: {
  sectionBg:"bg-gradient-to-b from-[#F8FAFF] via-white to-[#F5F3FF]",
  eyebrowBg: "bg-violet-100",
  eyebrowText: "text-violet-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-violet-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-violet-500",
  accentText: "text-indigo-600",
  cardBg:"bg-white shadow-[0_4px_14px_-8px_rgba(139,92,246,0.12)]",
  cardBorder: "border border-violet-100",
  patternColor: "#6366F1",
  showPattern: false,
},
aetherflow: {
  sectionBg:"bg-gradient-to-b from-[#F7FAFC] via-white to-[#EEF6F8]",
  eyebrowBg: "bg-cyan-50",
  eyebrowText: "text-cyan-700",
  heading: "text-[#112B5C]",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-[#112B5C]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-[#1B3A73]",
  accentText: "text-[#14B8A6]",
  cardBg:"bg-white shadow-[0_6px_20px_-12px_rgba(17,43,92,0.12)]",
  cardBorder: "border-cyan-100",
  patternColor: "#7DC7C7",
  showPattern: false,
},
deepcurrent: {
  sectionBg:"bg-gradient-to-br from-[#08172E] via-[#112B5C] to-[#123B5D]",
  eyebrowBg: "bg-cyan-500/10",
  eyebrowText: "text-cyan-300",
  heading: "text-white",
  body: "text-slate-300",
  muted: "text-slate-500",
  buttonBg: "bg-cyan-500",
  buttonText: "text-slate-950",
  buttonHoverBg: "hover:bg-cyan-400",
  accentText: "text-cyan-300",
  cardBg: "bg-white/5 backdrop-blur-md",
  cardBorder: "border-white/10",
  patternColor: "#7DC7C7",
  showPattern: false,
},
icegrid: {
  sectionBg: "bg-gradient-to-b from-[#F7FAFC] via-[#FFFFFF] to-[#EEF5FB]",
  eyebrowBg: "bg-sky-100",
  eyebrowText: "text-sky-700",
  heading: "text-[#0F172A]",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-[#0F172A]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-slate-800",
  accentText: "text-sky-600",
  cardBg:"bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]",
  cardBorder: "border-sky-100",
  patternColor: "#9BBFD8",
  showPattern: false,
},
auroraglass: {
  sectionBg:"bg-gradient-to-b from-[#F8FBFD] via-[#FFFFFF] to-[#F6F9FC]",
  eyebrowBg: "bg-sky-100",
  eyebrowText: "text-sky-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-sky-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-sky-500",
  accentText: "text-sky-600",
  cardBg:"bg-white shadow-[0_8px_24px_-12px_rgba(168,213,229,0.18)]",
  cardBorder: "border-sky-100",
  patternColor: "#A8D5E5",
  showPattern: false,
},
lavenderflow: {
  sectionBg:
    "bg-gradient-to-b from-[#FAF8FF] via-[#FFFFFF] to-[#F7F4FF]",
  eyebrowBg: "bg-violet-100",
  eyebrowText: "text-violet-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-violet-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-violet-500",
  accentText: "text-violet-600",
  cardBg:
    "bg-white shadow-[0_8px_24px_-12px_rgba(139,92,246,0.15)]",
  cardBorder: "border-violet-100",
  patternColor: "#C4B5FD",
  showPattern: false,
},
oxytalnova: {
  sectionBg:
    "bg-gradient-to-b from-[#F7FAFC] via-white to-[#F2F7FB]",
  eyebrowBg: "bg-sky-100",
  eyebrowText: "text-sky-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-[#2563EB]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-[#1D4ED8]",
  accentText: "text-[#06B6D4]",
  cardBg:
    "bg-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.10)]",
  cardBorder: "border-sky-100 divide-sky-100",
  patternColor: "#60A5FA",
  showPattern: false,
},
oxytalfooter: {
  sectionBg:"bg-gradient-to-br from-[#020617] via-[#041C32] to-[#003B5C]",
  eyebrowBg: "bg-cyan-500/10",
  eyebrowText: "text-cyan-400",
  heading: "text-white",
  body: "text-slate-400",
  muted: "text-slate-500",
  buttonBg: "bg-cyan-500",
  buttonText: "text-slate-950",
  buttonHoverBg: "hover:bg-cyan-400",
  accentText: "text-cyan-400",
  cardBg: "bg-white/5",
  cardBorder: "border-white/10",
  link: "text-white hover:text-cyan-400",
  iconBG: "bg-white hover:bg-cyan-400",
  partnerIcon: "bg-white text-black",
  divider: "border-white/10",
  patternColor: "#00D4FF",
  showPattern: true,
},
  neuralhorizon: {
    sectionBg: "bg-gradient-to-br from-blue-50 via-white to-sky-50",
    eyebrowBg: "bg-blue-100",
    eyebrowText: "text-blue-700",
    heading: "text-slate-900",
    body: "text-slate-600",
    muted: "text-slate-400",
    buttonBg: "bg-blue-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-blue-500",
    accentText: "text-blue-600",
    cardBg: "bg-white/90",
    cardBorder: "border-blue-100",
    patternColor: "#2563EB",
    showPattern: false,
  },
  platinumcore: {
    sectionBg: "bg-gradient-to-br from-slate-50 via-white to-zinc-50",
    eyebrowBg: "bg-slate-100",
    eyebrowText: "text-slate-700",
    heading: "text-slate-900",
    body: "text-slate-600",
    muted: "text-slate-400",
    buttonBg: "bg-slate-800",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-slate-700",
    accentText: "text-slate-700",
    cardBg: "bg-white/90",
    cardBorder: "border-slate-200",
    patternColor: "#475569",
    showPattern: false,
  },
  flowspectrum: {
  sectionBg: "bg-gradient-to-br from-sky-50 via-white to-violet-50",
  eyebrowBg: "bg-sky-100",
  eyebrowText: "text-sky-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-sky-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-sky-500",
  accentText: "text-violet-600",
  cardBg: "bg-white",
  cardBorder: "border-sky-100",
  patternColor: "#38BDF8",
  showPattern: false,
},
aurorawave: {
  sectionBg: "bg-gradient-to-br from-violet-50 via-white to-purple-50",
  eyebrowBg: "bg-violet-100",
  eyebrowText: "text-violet-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-violet-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-violet-500",
  accentText: "text-purple-600",
  cardBg: "bg-white",
  cardBorder: "border-violet-100",
  patternColor: "#8B5CF6",
  showPattern: false,
},
peachfusion: {
  sectionBg: "bg-gradient-to-br from-orange-50 via-white to-amber-50",
  eyebrowBg: "bg-orange-100",
  eyebrowText: "text-orange-700",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-orange-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-orange-500",
  accentText: "text-amber-600",
  cardBg: "bg-white",
  cardBorder: "border-orange-100",
  patternColor: "#FB923C",
  showPattern: false,
},
  light: {
    sectionBg: "bg-white",
    eyebrowBg: "bg-emerald-50",
    eyebrowText: "text-emerald-700",
    heading: "text-gray-900",
    body: "text-gray-500",
    muted: "text-gray-400",
    buttonBg: "bg-emerald-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-emerald-500",
    accentText: "text-emerald-600",
    cardBg: "bg-white",
    cardBorder: "border-gray-100",
    patternColor: "#059669",
    showPattern: false,
  },
  dark: {
    sectionBg: "bg-gray-900",
    eyebrowBg: "bg-white/10",
    eyebrowText: "text-emerald-300",
    heading: "text-white",
    body: "text-gray-300",
    muted: "text-gray-400",
    buttonBg: "bg-white",
    buttonText: "text-gray-900",
    buttonHoverBg: "hover:bg-gray-100",
    accentText: "text-emerald-400",
    cardBg: "bg-gray-800",
    cardBorder: "border-white/10",
    patternColor: "#34d399",
    showPattern: false,
  },
  black: {
    sectionBg: "bg-black",
    eyebrowBg: "bg-white/5",
    eyebrowText: "text-gray-200",
    heading: "text-white",
    body: "text-gray-400",
    muted: "text-gray-500",
    buttonBg: "bg-white",
    buttonText: "text-black",
    buttonHoverBg: "hover:bg-gray-200",
    accentText: "text-gray-300",
    cardBg: "bg-gray-900",
    cardBorder: "border-white/10",
    patternColor: "#d1d5db",
    showPattern: false,
  },
  navy: {
    sectionBg: "bg-blue-950",
    eyebrowBg: "bg-white/10",
    eyebrowText: "text-blue-200",
    heading: "text-white",
    body: "text-blue-200",
    muted: "text-blue-300",
    buttonBg: "bg-white",
    buttonText: "text-blue-950",
    buttonHoverBg: "hover:bg-blue-50",
    accentText: "text-blue-300",
    cardBg: "bg-blue-900",
    cardBorder: "border-white/10",
    patternColor: "#93c5fd",
    showPattern: false,
  },
  blue: {
    sectionBg: "bg-blue-50",
    eyebrowBg: "bg-blue-100",
    eyebrowText: "text-blue-700",
    heading: "text-gray-900",
    body: "text-gray-600",
    muted: "text-gray-400",
    buttonBg: "bg-blue-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-blue-500",
    accentText: "text-blue-600",
    cardBg: "bg-white",
    cardBorder: "border-blue-100",
    patternColor: "#2563eb",
    showPattern: false,
  },
  green: {
    sectionBg: "bg-green-50",
    eyebrowBg: "bg-green-100",
    eyebrowText: "text-green-700",
    heading: "text-gray-900",
    body: "text-gray-600",
    muted: "text-gray-400",
    buttonBg: "bg-green-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-green-500",
    accentText: "text-green-600",
    cardBg: "bg-white",
    cardBorder: "border-green-100",
    patternColor: "#16a34a",
    showPattern: false,
  },
  yellow: {
    sectionBg: "bg-yellow-50",
    eyebrowBg: "bg-yellow-100",
    eyebrowText: "text-yellow-800",
    heading: "text-gray-900",
    body: "text-gray-600",
    muted: "text-gray-400",
    // Yellow/amber at readable button weight needs dark text, not white,
    // to keep contrast — white-on-yellow fails accessible contrast checks.
    buttonBg: "bg-amber-500",
    buttonText: "text-gray-900",
    buttonHoverBg: "hover:bg-amber-400",
    accentText: "text-yellow-700",
    cardBg: "bg-white",
    cardBorder: "border-yellow-100",
    patternColor: "#a16207",
    showPattern: false,
  },
  blackyellow: {
    sectionBg: "bg-black",
    eyebrowBg: "bg-white",
    eyebrowText: "text-[#FFC451]",
    heading: "text-white",
    body: "text-white",
    muted: "text-gray-100",
    // Yellow/amber at readable button weight needs dark text, not white,
    // to keep contrast — white-on-yellow fails accessible contrast checks.
    buttonBg: "bg-[#FFC451]",
    buttonText: "text-gray-900",
    buttonHoverBg: "hover:bg-amber-400",
    accentText: "text-[#FFC451]",
    cardBg: "bg-black",
    cardBorder: "border-[#FFffff]",
    patternColor: "#ffc451",
    showPattern: false,
  },
  /**
   * The `/services` page mockup's own bespoke dark/amber palette (see
   * `ServicesPage.module.css`'s `--ink`/`--paper`/`--mute`/`--amber`/
   * `--line-2` custom properties), promoted to a named preset so any
   * composableElement can opt into that exact look via `themeColor`. A
   * softer near-black "ink" tone rather than `blackyellow`'s pure
   * `bg-black`, with matching muted/card tones instead of generic Tailwind
   * grays.
   */
  darkyellow: {
    sectionBg: "bg-[#0e0e0f]",
    eyebrowBg: "bg-white/10",
    eyebrowText: "text-[#ffc451]",
    heading: "text-[#ededea]",
    body: "text-[#8c8c88]",
    muted: "text-[#8c8c88]",
    // Amber at readable button weight needs dark text, not white, to keep
    // contrast — same reasoning `yellow`/`blackyellow` already use.
    buttonBg: "bg-[#ffc451]",
    buttonText: "text-[#141416]",
    buttonHoverBg: "hover:bg-[#ffd37a]",
    accentText: "text-[#ffc451]",
    cardBg: "bg-[#1a1a1d]",
    cardBorder: "border-[#33333a]",
    patternColor: "#ffc451",
    showPattern: true,
  },
  pink: {
    sectionBg: "bg-pink-50",
    eyebrowBg: "bg-pink-100",
    eyebrowText: "text-pink-700",
    heading: "text-gray-900",
    body: "text-gray-600",
    muted: "text-gray-400",
    buttonBg: "bg-pink-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-pink-500",
    accentText: "text-pink-600",
    cardBg: "bg-white",
    cardBorder: "border-pink-100",
    patternColor: "#db2777",
    showPattern: false,
  },
  emerald: {
    sectionBg: "bg-emerald-50",
    eyebrowBg: "bg-emerald-100",
    eyebrowText: "text-emerald-700",
    heading: "text-gray-900",
    body: "text-gray-600",
    muted: "text-gray-400",
    buttonBg: "bg-emerald-600",
    buttonText: "text-white",
    buttonHoverBg: "hover:bg-emerald-500",
    accentText: "text-emerald-600",
    cardBg: "bg-white",
    cardBorder: "border-emerald-100",
    patternColor: "#059669",
    showPattern: false,
  },
};

const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/**
 * Resolves a `composableElement.themeColor` value (free text — case and
 * surrounding whitespace can vary) to its `SectionTheme`. Returns
 * `undefined` when `themeColor` is unset or doesn't match one of the
 * named presets, so callers can fall back to their own existing default
 * styling unchanged.
 */
export function resolveTheme(themeColor?: string): SectionTheme | undefined {
  if (!themeColor) {
    return undefined;
  }

  const normalized = themeColor.trim().toLowerCase();

  return THEME_NAMES.includes(normalized as ThemeName)
    ? THEMES[normalized as ThemeName]
    : undefined;
}
