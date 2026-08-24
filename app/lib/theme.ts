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
  | "blackwhite"
  | "whiteblack"
  | "bourbonblack"
  | "bourboncream"
  | "frescapink"
  | "frescaruby"
  | "oxytalfooter"
  | "oxytalnavbar"

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
blackwhite: {
  sectionBg: "bg-[#1c1c1c]",
  eyebrowBg: "bg-white/10",
  eyebrowText: "text-white",
  heading: "text-white",
  body: "text-white",
  muted: "text-white/50",
  buttonBg: "bg-white",
  buttonText: "text-[#1c1c1c]",
  buttonHoverBg: "hover:bg-white/90",
  accentText: "text-white",
  cardBg: "bg-white/5",
  cardBorder: "border-white",
  patternColor: "#FFFFFF",
  showPattern: false,
},
whiteblack: {
  sectionBg: "bg-white",
  eyebrowBg: "bg-black/5",
  eyebrowText: "text-black",
  heading: "text-[#1c1c1c]",
  body: "text-black/70",
  muted: "text-black/50",
  buttonBg: "bg-[#1c1c1c]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-black/80",
  accentText: "text-[#1c1c1c]",
  cardBg: "bg-black/[0.02]",
  cardBorder: "border-black/10",
  patternColor: "#000000",
  showPattern: false,
},
bourbonblack: {
  sectionBg: "bg-gradient-to-br from-[#17130F] via-[#24170D] to-[#3A210D]",
  eyebrowBg: "bg-[#F5B915]/10",
  eyebrowText: "text-[#F5B915]",
  heading: "text-[#FFF4D6]",
  body: "text-[#E8D8B8]",
  muted: "text-[#A99270]",
  buttonBg: "bg-[#F5B915]",
  buttonText: "text-[#17130F]",
  buttonHoverBg: "hover:bg-[#FFC928]",
  accentText: "text-[#F5B915]",
  cardBg: "bg-[#FFF4D6]/5 backdrop-blur-md",
  cardBorder: "border-[#F5B915]/20",
  patternColor: "#F5B915",
  showPattern: false,
},
bourboncream: {
  sectionBg: "bg-gradient-to-b from-[#FFF8E8] via-[#FFFDF6] to-[#F8E8C5]",
  eyebrowBg: "bg-[#F5B915]/15",
  eyebrowText: "text-[#8A4A12]",
  heading: "text-[#17130F]",
  body: "text-[#5C4630]",
  muted: "text-[#967D5E]",
  buttonBg: "bg-[#17130F]",
  buttonText: "text-[#FFF4D6]",
  buttonHoverBg: "hover:bg-[#2A1B10]",
  accentText: "text-[#9A4F16]",
  cardBg: "bg-white",
  cardBorder: "border-[#E7C77A]",
  patternColor: "#F5B915",
  showPattern: false,
},
frescapink: {
  sectionBg: "bg-gradient-to-br from-[#F43F68] via-[#EF3E68] to-[#D92F58]",
  eyebrowBg: "bg-[#FFD91A]",
  eyebrowText: "text-[#073B22]",
  heading: "text-[#FFF8E8]",
  body: "text-[#FFF4E6]",
  muted: "text-[#FFD0D8]",
  buttonBg: "bg-[#74B82A]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-[#5F9F20]",
  accentText: "text-[#FFD91A]",
  cardBg: "bg-white/10 backdrop-blur-md",
  cardBorder: "border-white/20",
  patternColor: "#FFD91A",
  showPattern: false,
},
frescaruby: {
  sectionBg: "bg-gradient-to-br from-[#F8EE4B] via-[#F8EE4B] to-[#F3DF32]",
  eyebrowBg: "bg-[#073B22]",
  eyebrowText: "text-[#F8EE4B]",
  heading: "text-[#073B22]",
  body: "text-[#31552D]",
  muted: "text-[#668052]",
  buttonBg: "bg-[#F43F68]",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-[#D92F58]",
  accentText: "text-[#E52F5E]",
  cardBg: "bg-white/40 backdrop-blur-md",
  cardBorder: "border-[#073B22]/15",
  patternColor: "#073B22",
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
oxytalnavbar: {
  sectionBg:"bg-gradient-to-b from-[#F8FCFD] via-white to-[#F1F9FC]",
  eyebrowBg: "bg-cyan-100",
  eyebrowText: "text-cyan-400",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-400",
  buttonBg: "bg-cyan-600",
  buttonText: "text-white",
  buttonHoverBg: "hover:bg-cyan-500",
  accentText: "text-cyan-600",
  link: "text-slate-900 hover:text-cyan-400",
  cardBg: "bg-white shadow-[0_4px_14px_-8px_rgba(16,24,40,0.08)]",
  cardBorder: "border-cyan-100",
  patternColor: "#00D4FF",
  showPattern: false,
}
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
