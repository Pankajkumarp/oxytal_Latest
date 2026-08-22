import type { SectionTheme } from "../lib/theme";

/** Default dot color when no theme (or the caller has no `theme` at all) is set — matches this site's default emerald accent. */
const DEFAULT_PATTERN_COLOR = "#059669";

/**
 * The 13 colorable, seamlessly-repeating background tiles ported from
 * `Refrence/patterns-preview.html`'s own "Foundation"/"AI & data" groups
 * (every tile there except "Grain", which is a baked noise bitmap, not a
 * recolorable line pattern — see `GRAIN_VIEWBOX`/`grainMarkup` below for
 * that one). Each entry's `markup` is the tile's inner SVG content with
 * the reference's own hardcoded `#FFC451` swapped for whatever color is
 * passed in — the same "raw hex baked into an inline SVG data URI" trick
 * `DEFAULT_PATTERN_COLOR` above already relies on, since a dynamically-
 * built Tailwind class couldn't work here (see the comment on
 * `SectionTheme.patternColor` in app/lib/theme.ts for why).
 *
 * `viewBox`'s own width/height doubles as the tile's `background-size` in
 * px — every tile here is authored 0,0-origin, so viewBox dimensions and
 * pixel tile size are the same numbers.
 */
export type PatternName = keyof typeof TILE_PATTERNS | "grain";

const TILE_PATTERNS = {
  "baseline-grid": {
    viewBox: "0 0 120 24",
    markup: (color: string) => `<path d="M0 0.5h120" stroke="${color}" stroke-width="1" opacity=".16"/><path d="M0.5 0v24" stroke="${color}" stroke-width="1" opacity=".07"/><path d="M40.5 0v24" stroke="${color}" stroke-width="1" opacity=".07"/><path d="M80.5 0v24" stroke="${color}" stroke-width="1" opacity=".07"/>`,
  },
  contour: {
    viewBox: "0 0 240 128",
    markup: (color: string) => `<polyline points="0 2.67 6 4.06 12 5.13 18 5.85 24 6.23 30 6.31 36 6.13 42 5.77 48 5.29 54 4.79 60 4.33 66 3.95 72 3.69 78 3.56 84 3.54 90 3.59 96 3.65 102 3.65 108 3.53 114 3.22 120 2.67 126 1.87 132 0.80 138 -0.51 144 -1.99 150 -3.59 156 -5.20 162 -6.71 168 -8.02 174 -9.04 180 -9.67 186 -9.88 192 -9.62 198 -8.91 204 -7.78 210 -6.31 216 -4.58 222 -2.71 228 -0.80 234 1.03 240 2.67" fill="none" stroke="${color}" stroke-width="1" opacity=".18"/><polyline points="0 34.67 6 36.06 12 37.13 18 37.85 24 38.23 30 38.31 36 38.13 42 37.77 48 37.29 54 36.79 60 36.33 66 35.95 72 35.69 78 35.56 84 35.54 90 35.59 96 35.65 102 35.65 108 35.53 114 35.22 120 34.67 126 33.87 132 32.80 138 31.49 144 30.01 150 28.41 156 26.80 162 25.29 168 23.98 174 22.96 180 22.33 186 22.12 192 22.38 198 23.09 204 24.22 210 25.69 216 27.42 222 29.29 228 31.20 234 33.03 240 34.67" fill="none" stroke="${color}" stroke-width="1" opacity=".18"/><polyline points="0 66.67 6 68.06 12 69.13 18 69.85 24 70.23 30 70.31 36 70.13 42 69.77 48 69.29 54 68.79 60 68.33 66 67.95 72 67.69 78 67.56 84 67.54 90 67.59 96 67.65 102 67.65 108 67.53 114 67.22 120 66.67 126 65.87 132 64.80 138 63.49 144 62.01 150 60.41 156 58.80 162 57.29 168 55.98 174 54.96 180 54.33 186 54.12 192 54.38 198 55.09 204 56.22 210 57.69 216 59.42 222 61.29 228 63.20 234 65.03 240 66.67" fill="none" stroke="${color}" stroke-width="1" opacity=".18"/><polyline points="0 98.67 6 100.06 12 101.13 18 101.85 24 102.23 30 102.31 36 102.13 42 101.77 48 101.29 54 100.79 60 100.33 66 99.95 72 99.69 78 99.56 84 99.54 90 99.59 96 99.65 102 99.65 108 99.53 114 99.22 120 98.67 126 97.87 132 96.80 138 95.49 144 94.01 150 92.41 156 90.80 162 89.29 168 87.98 174 86.96 180 86.33 186 86.12 192 86.38 198 87.09 204 88.22 210 89.69 216 91.42 222 93.29 228 95.20 234 97.03 240 98.67" fill="none" stroke="${color}" stroke-width="1" opacity=".18"/><polyline points="0 130.67 6 132.06 12 133.13 18 133.85 24 134.23 30 134.31 36 134.13 42 133.77 48 133.29 54 132.79 60 132.33 66 131.95 72 131.69 78 131.56 84 131.54 90 131.59 96 131.65 102 131.65 108 131.53 114 131.22 120 130.67 126 129.87 132 128.80 138 127.49 144 126.01 150 124.41 156 122.80 162 121.29 168 119.98 174 118.96 180 118.33 186 118.12 192 118.38 198 119.09 204 120.22 210 121.69 216 123.42 222 125.29 228 127.20 234 129.03 240 130.67" fill="none" stroke="${color}" stroke-width="1" opacity=".18"/>`,
  },
  "iso-lattice": {
    viewBox: "0 0 96 48",
    markup: (color: string) => `<path d="M0 -48L96 0" stroke="${color}" stroke-width="1" opacity=".11"/><path d="M0 0L96 48" stroke="${color}" stroke-width="1" opacity=".11"/><path d="M0 48L96 96" stroke="${color}" stroke-width="1" opacity=".11"/><path d="M0 0L96 -48" stroke="${color}" stroke-width="1" opacity=".11"/><path d="M0 48L96 0" stroke="${color}" stroke-width="1" opacity=".11"/><path d="M0 96L96 48" stroke="${color}" stroke-width="1" opacity=".11"/>`,
  },
  "node-field": {
    viewBox: "0 0 80 80",
    markup: (color: string) => `<path d="M0 0L40 40M80 0L40 40M0 80L40 40M80 80L40 40" stroke="${color}" stroke-width="1" opacity=".08"/><circle cx="0" cy="0" r="1.6" fill="${color}" opacity=".38"/><circle cx="80" cy="0" r="1.6" fill="${color}" opacity=".38"/><circle cx="0" cy="80" r="1.6" fill="${color}" opacity=".38"/><circle cx="80" cy="80" r="1.6" fill="${color}" opacity=".38"/><circle cx="40" cy="40" r="1.6" fill="${color}" opacity=".38"/>`,
  },
  halftone: {
    viewBox: "0 0 22 22",
    markup: (color: string) => `<circle cx="0" cy="0" r="1.15" fill="${color}" opacity=".30"/><circle cx="22" cy="0" r="1.15" fill="${color}" opacity=".30"/><circle cx="0" cy="22" r="1.15" fill="${color}" opacity=".30"/><circle cx="22" cy="22" r="1.15" fill="${color}" opacity=".30"/><circle cx="11" cy="11" r="1.15" fill="${color}" opacity=".30"/>`,
  },
  hatch: {
    viewBox: "0 0 8 8",
    markup: (color: string) => `<path d="M-2 2L2 -2M0 8L8 0M6 10L10 6" stroke="${color}" stroke-width="1" opacity=".22"/>`,
  },
  registration: {
    viewBox: "0 0 64 64",
    markup: (color: string) => `<path d="M28 32h8M32 28v8" stroke="${color}" stroke-width="1" opacity=".22"/><path d="M-4 0h8M0 -4v8" stroke="${color}" stroke-width="1" opacity=".22"/><path d="M60 0h8M64 -4v8" stroke="${color}" stroke-width="1" opacity=".22"/><path d="M-4 64h8M0 60v8" stroke="${color}" stroke-width="1" opacity=".22"/><path d="M60 64h8M64 60v8" stroke="${color}" stroke-width="1" opacity=".22"/>`,
  },
  "token-stream": {
    viewBox: "0 0 320 104",
    markup: (color: string) => `<rect x="0.0" y="7" width="22.6" height="10" rx="5" fill="${color}" opacity="0.08"/><rect x="35.6" y="7" width="27.7" height="10" rx="5" fill="${color}" opacity="0.12"/><rect x="76.3" y="7" width="26.3" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="115.6" y="7" width="17.9" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="146.5" y="7" width="27.7" height="10" rx="5" fill="${color}" opacity="0.10"/><rect x="187.2" y="7" width="28.2" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="228.4" y="7" width="28.2" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="269.6" y="7" width="8.0" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="290.6" y="7" width="16.4" height="10" rx="5" fill="${color}" opacity="0.12"/><rect x="0.0" y="33" width="18.9" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="31.9" y="33" width="26.4" height="10" rx="5" fill="${color}" opacity="0.10"/><rect x="71.4" y="33" width="26.9" height="10" rx="5" fill="${color}" opacity="0.11"/><rect x="111.2" y="33" width="25.5" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="149.8" y="33" width="13.7" height="10" rx="5" fill="${color}" opacity="0.11"/><rect x="176.4" y="33" width="21.6" height="10" rx="5" fill="${color}" opacity="0.06"/><rect x="211.0" y="33" width="26.4" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="250.4" y="33" width="18.1" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="281.5" y="33" width="25.5" height="10" rx="5" fill="${color}" opacity="0.10"/><rect x="0.0" y="59" width="19.4" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="32.4" y="59" width="37.5" height="10" rx="5" fill="${color}" opacity="0.10"/><rect x="82.8" y="59" width="35.0" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="130.8" y="59" width="18.7" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="162.6" y="59" width="14.4" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="189.9" y="59" width="15.0" height="10" rx="5" fill="${color}" opacity="0.11"/><rect x="217.9" y="59" width="13.1" height="10" rx="5" fill="${color}" opacity="0.09"/><rect x="244.0" y="59" width="24.4" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="281.4" y="59" width="25.6" height="10" rx="5" fill="${color}" opacity="0.11"/><rect x="0.0" y="85" width="27.4" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="40.4" y="85" width="13.7" height="10" rx="5" fill="${color}" opacity="0.07"/><rect x="67.1" y="85" width="31.1" height="10" rx="5" fill="${color}" opacity="0.14"/><rect x="111.2" y="85" width="24.3" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="148.5" y="85" width="14.3" height="10" rx="5" fill="${color}" opacity="0.08"/><rect x="175.8" y="85" width="28.0" height="10" rx="5" fill="${color}" opacity="0.12"/><rect x="216.9" y="85" width="22.4" height="10" rx="5" fill="${color}" opacity="0.05"/><rect x="252.3" y="85" width="22.4" height="10" rx="5" fill="${color}" opacity="0.13"/><rect x="287.7" y="85" width="19.3" height="10" rx="5" fill="${color}" opacity="0.10"/>`,
  },
  "attention-matrix": {
    viewBox: "0 0 120 120",
    markup: (color: string) => `<rect x="0" y="0" width="11" height="11" fill="${color}" opacity="0.122"/><rect x="15" y="0" width="11" height="11" fill="${color}" opacity="0.034"/><rect x="30" y="0" width="11" height="11" fill="${color}" opacity="0.042"/><rect x="45" y="0" width="11" height="11" fill="${color}" opacity="0.040"/><rect x="60" y="0" width="11" height="11" fill="${color}" opacity="0.166"/><rect x="75" y="0" width="11" height="11" fill="${color}" opacity="0.048"/><rect x="90" y="0" width="11" height="11" fill="${color}" opacity="0.058"/><rect x="105" y="0" width="11" height="11" fill="${color}" opacity="0.161"/><rect x="0" y="15" width="11" height="11" fill="${color}" opacity="0.145"/><rect x="15" y="15" width="11" height="11" fill="${color}" opacity="0.044"/><rect x="30" y="15" width="11" height="11" fill="${color}" opacity="0.036"/><rect x="45" y="15" width="11" height="11" fill="${color}" opacity="0.119"/><rect x="60" y="15" width="11" height="11" fill="${color}" opacity="0.026"/><rect x="75" y="15" width="11" height="11" fill="${color}" opacity="0.044"/><rect x="90" y="15" width="11" height="11" fill="${color}" opacity="0.137"/><rect x="105" y="15" width="11" height="11" fill="${color}" opacity="0.149"/><rect x="0" y="30" width="11" height="11" fill="${color}" opacity="0.031"/><rect x="15" y="30" width="11" height="11" fill="${color}" opacity="0.026"/><rect x="30" y="30" width="11" height="11" fill="${color}" opacity="0.114"/><rect x="45" y="30" width="11" height="11" fill="${color}" opacity="0.078"/><rect x="60" y="30" width="11" height="11" fill="${color}" opacity="0.031"/><rect x="75" y="30" width="11" height="11" fill="${color}" opacity="0.058"/><rect x="90" y="30" width="11" height="11" fill="${color}" opacity="0.025"/><rect x="105" y="30" width="11" height="11" fill="${color}" opacity="0.093"/><rect x="0" y="45" width="11" height="11" fill="${color}" opacity="0.062"/><rect x="15" y="45" width="11" height="11" fill="${color}" opacity="0.094"/><rect x="30" y="45" width="11" height="11" fill="${color}" opacity="0.026"/><rect x="45" y="45" width="11" height="11" fill="${color}" opacity="0.082"/><rect x="60" y="45" width="11" height="11" fill="${color}" opacity="0.042"/><rect x="75" y="45" width="11" height="11" fill="${color}" opacity="0.058"/><rect x="90" y="45" width="11" height="11" fill="${color}" opacity="0.039"/><rect x="105" y="45" width="11" height="11" fill="${color}" opacity="0.080"/><rect x="0" y="60" width="11" height="11" fill="${color}" opacity="0.068"/><rect x="15" y="60" width="11" height="11" fill="${color}" opacity="0.077"/><rect x="30" y="60" width="11" height="11" fill="${color}" opacity="0.025"/><rect x="45" y="60" width="11" height="11" fill="${color}" opacity="0.031"/><rect x="60" y="60" width="11" height="11" fill="${color}" opacity="0.025"/><rect x="75" y="60" width="11" height="11" fill="${color}" opacity="0.043"/><rect x="90" y="60" width="11" height="11" fill="${color}" opacity="0.055"/><rect x="105" y="60" width="11" height="11" fill="${color}" opacity="0.026"/><rect x="0" y="75" width="11" height="11" fill="${color}" opacity="0.087"/><rect x="15" y="75" width="11" height="11" fill="${color}" opacity="0.056"/><rect x="30" y="75" width="11" height="11" fill="${color}" opacity="0.058"/><rect x="45" y="75" width="11" height="11" fill="${color}" opacity="0.073"/><rect x="60" y="75" width="11" height="11" fill="${color}" opacity="0.154"/><rect x="75" y="75" width="11" height="11" fill="${color}" opacity="0.072"/><rect x="90" y="75" width="11" height="11" fill="${color}" opacity="0.026"/><rect x="105" y="75" width="11" height="11" fill="${color}" opacity="0.027"/><rect x="0" y="90" width="11" height="11" fill="${color}" opacity="0.092"/><rect x="15" y="90" width="11" height="11" fill="${color}" opacity="0.037"/><rect x="30" y="90" width="11" height="11" fill="${color}" opacity="0.106"/><rect x="45" y="90" width="11" height="11" fill="${color}" opacity="0.059"/><rect x="60" y="90" width="11" height="11" fill="${color}" opacity="0.043"/><rect x="75" y="90" width="11" height="11" fill="${color}" opacity="0.102"/><rect x="90" y="90" width="11" height="11" fill="${color}" opacity="0.029"/><rect x="105" y="90" width="11" height="11" fill="${color}" opacity="0.034"/><rect x="0" y="105" width="11" height="11" fill="${color}" opacity="0.035"/><rect x="15" y="105" width="11" height="11" fill="${color}" opacity="0.047"/><rect x="30" y="105" width="11" height="11" fill="${color}" opacity="0.146"/><rect x="45" y="105" width="11" height="11" fill="${color}" opacity="0.120"/><rect x="60" y="105" width="11" height="11" fill="${color}" opacity="0.122"/><rect x="75" y="105" width="11" height="11" fill="${color}" opacity="0.079"/><rect x="90" y="105" width="11" height="11" fill="${color}" opacity="0.025"/><rect x="105" y="105" width="11" height="11" fill="${color}" opacity="0.035"/>`,
  },
  "layer-graph": {
    viewBox: "0 0 168 120",
    markup: (color: string) => `<path d="M0.0 0.0L42.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 0.0L42.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 0.0L42.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 0.0L42.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 40.0L42.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 40.0L42.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 40.0L42.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 40.0L42.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 80.0L42.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 80.0L42.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 80.0L42.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 80.0L42.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 120.0L42.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 120.0L42.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 120.0L42.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M0.0 120.0L42.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 20.0L84.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 20.0L84.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 20.0L84.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 20.0L84.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 60.0L84.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 60.0L84.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 60.0L84.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 60.0L84.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 100.0L84.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 100.0L84.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 100.0L84.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 100.0L84.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 140.0L84.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 140.0L84.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 140.0L84.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M42.0 140.0L84.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 0.0L126.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 0.0L126.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 0.0L126.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 0.0L126.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 40.0L126.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 40.0L126.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 40.0L126.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 40.0L126.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 80.0L126.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 80.0L126.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 80.0L126.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 80.0L126.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 120.0L126.0 20.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 120.0L126.0 60.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 120.0L126.0 100.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M84.0 120.0L126.0 140.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 20.0L168.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 20.0L168.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 20.0L168.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 20.0L168.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 60.0L168.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 60.0L168.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 60.0L168.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 60.0L168.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 100.0L168.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 100.0L168.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 100.0L168.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 100.0L168.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 140.0L168.0 0.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 140.0L168.0 40.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 140.0L168.0 80.0" stroke="${color}" stroke-width=".6" opacity=".07"/><path d="M126.0 140.0L168.0 120.0" stroke="${color}" stroke-width=".6" opacity=".07"/><circle cx="0.0" cy="0.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="0.0" cy="40.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="0.0" cy="80.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="0.0" cy="120.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="42.0" cy="20.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="42.0" cy="60.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="42.0" cy="100.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="42.0" cy="140.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="84.0" cy="0.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="84.0" cy="40.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="84.0" cy="80.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="84.0" cy="120.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="126.0" cy="20.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="126.0" cy="60.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="126.0" cy="100.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="126.0" cy="140.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="168.0" cy="0.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="168.0" cy="40.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="168.0" cy="80.0" r="1.7" fill="${color}" opacity=".30"/><circle cx="168.0" cy="120.0" r="1.7" fill="${color}" opacity=".30"/>`,
  },
  "embedding-cloud": {
    viewBox: "0 0 200 200",
    markup: (color: string) => `<circle cx="59.7" cy="48.4" r="1.21" fill="${color}" opacity="0.46"/><circle cx="90.9" cy="58.0" r="1.61" fill="${color}" opacity="0.29"/><circle cx="36.2" cy="66.4" r="1.01" fill="${color}" opacity="0.29"/><circle cx="15.7" cy="98.0" r="2.37" fill="${color}" opacity="0.29"/><circle cx="55.6" cy="56.2" r="2.07" fill="${color}" opacity="0.44"/><circle cx="118.7" cy="110.9" r="0.90" fill="${color}" opacity="0.37"/><circle cx="63.0" cy="71.2" r="1.11" fill="${color}" opacity="0.31"/><circle cx="88.3" cy="98.7" r="2.18" fill="${color}" opacity="0.27"/><circle cx="56.6" cy="58.5" r="1.98" fill="${color}" opacity="0.25"/><circle cx="91.8" cy="62.0" r="1.80" fill="${color}" opacity="0.38"/><circle cx="79.6" cy="70.9" r="1.71" fill="${color}" opacity="0.26"/><circle cx="30.5" cy="32.7" r="2.01" fill="${color}" opacity="0.20"/><circle cx="191.3" cy="48.2" r="1.40" fill="${color}" opacity="0.40"/><circle cx="94.8" cy="26.2" r="1.65" fill="${color}" opacity="0.19"/><circle cx="92.1" cy="81.0" r="1.92" fill="${color}" opacity="0.43"/><circle cx="58.6" cy="54.8" r="1.16" fill="${color}" opacity="0.44"/><circle cx="62.2" cy="32.6" r="0.91" fill="${color}" opacity="0.45"/><circle cx="52.7" cy="53.8" r="1.81" fill="${color}" opacity="0.24"/><circle cx="75.9" cy="75.6" r="1.15" fill="${color}" opacity="0.29"/><circle cx="40.7" cy="76.5" r="1.55" fill="${color}" opacity="0.31"/><circle cx="39.8" cy="50.6" r="1.68" fill="${color}" opacity="0.19"/><circle cx="69.6" cy="54.4" r="1.27" fill="${color}" opacity="0.20"/><circle cx="56.7" cy="62.0" r="2.13" fill="${color}" opacity="0.21"/><circle cx="45.6" cy="38.0" r="1.90" fill="${color}" opacity="0.19"/><circle cx="54.7" cy="80.0" r="1.88" fill="${color}" opacity="0.29"/><circle cx="57.4" cy="104.5" r="1.65" fill="${color}" opacity="0.38"/><circle cx="149.7" cy="54.6" r="1.37" fill="${color}" opacity="0.37"/><circle cx="135.3" cy="156.6" r="2.27" fill="${color}" opacity="0.38"/><circle cx="145.1" cy="110.4" r="1.80" fill="${color}" opacity="0.37"/><circle cx="125.8" cy="149.1" r="2.24" fill="${color}" opacity="0.17"/><circle cx="167.1" cy="134.8" r="2.39" fill="${color}" opacity="0.30"/><circle cx="154.4" cy="151.7" r="2.24" fill="${color}" opacity="0.18"/><circle cx="163.1" cy="92.9" r="1.33" fill="${color}" opacity="0.33"/><circle cx="161.9" cy="123.7" r="1.75" fill="${color}" opacity="0.44"/><circle cx="142.6" cy="136.8" r="1.37" fill="${color}" opacity="0.23"/><circle cx="145.6" cy="55.5" r="1.85" fill="${color}" opacity="0.21"/><circle cx="179.3" cy="142.8" r="2.27" fill="${color}" opacity="0.23"/><circle cx="142.3" cy="111.8" r="0.91" fill="${color}" opacity="0.35"/><circle cx="150.0" cy="91.7" r="1.24" fill="${color}" opacity="0.43"/><circle cx="151.7" cy="114.9" r="1.06" fill="${color}" opacity="0.31"/><circle cx="137.2" cy="99.7" r="1.80" fill="${color}" opacity="0.31"/><circle cx="130.1" cy="144.3" r="0.99" fill="${color}" opacity="0.32"/><circle cx="174.4" cy="131.1" r="1.09" fill="${color}" opacity="0.17"/><circle cx="144.0" cy="100.7" r="2.26" fill="${color}" opacity="0.24"/><circle cx="160.8" cy="155.4" r="1.01" fill="${color}" opacity="0.16"/><circle cx="109.5" cy="145.8" r="2.20" fill="${color}" opacity="0.42"/><circle cx="97.4" cy="112.5" r="2.02" fill="${color}" opacity="0.40"/><circle cx="153.5" cy="90.0" r="1.32" fill="${color}" opacity="0.33"/><circle cx="12.7" cy="158.3" r="2.00" fill="${color}" opacity="0.23"/><circle cx="55.8" cy="146.4" r="2.00" fill="${color}" opacity="0.40"/><circle cx="64.2" cy="141.0" r="1.68" fill="${color}" opacity="0.35"/><circle cx="71.6" cy="157.2" r="0.94" fill="${color}" opacity="0.27"/><circle cx="44.2" cy="166.1" r="1.38" fill="${color}" opacity="0.27"/><circle cx="45.8" cy="188.2" r="2.29" fill="${color}" opacity="0.44"/><circle cx="79.7" cy="164.8" r="0.99" fill="${color}" opacity="0.34"/><circle cx="37.0" cy="133.8" r="1.20" fill="${color}" opacity="0.36"/><circle cx="26.4" cy="155.2" r="2.36" fill="${color}" opacity="0.20"/><circle cx="38.2" cy="154.2" r="1.48" fill="${color}" opacity="0.26"/><circle cx="40.1" cy="163.9" r="1.96" fill="${color}" opacity="0.40"/><circle cx="15.7" cy="136.5" r="0.97" fill="${color}" opacity="0.22"/><circle cx="60.2" cy="170.1" r="1.46" fill="${color}" opacity="0.45"/><circle cx="30.4" cy="178.3" r="2.04" fill="${color}" opacity="0.35"/><circle cx="159.2" cy="36.0" r="2.35" fill="${color}" opacity="0.28"/><circle cx="140.8" cy="53.6" r="2.10" fill="${color}" opacity="0.23"/><circle cx="169.9" cy="57.1" r="1.29" fill="${color}" opacity="0.43"/><circle cx="181.3" cy="41.6" r="2.13" fill="${color}" opacity="0.35"/><circle cx="172.7" cy="59.2" r="1.14" fill="${color}" opacity="0.25"/><circle cx="167.5" cy="37.7" r="2.29" fill="${color}" opacity="0.30"/><circle cx="171.3" cy="53.1" r="0.97" fill="${color}" opacity="0.23"/><circle cx="185.0" cy="71.0" r="1.78" fill="${color}" opacity="0.42"/><circle cx="169.1" cy="60.6" r="1.58" fill="${color}" opacity="0.23"/><circle cx="160.0" cy="50.2" r="2.09" fill="${color}" opacity="0.25"/><circle cx="172.6" cy="68.4" r="1.30" fill="${color}" opacity="0.33"/><circle cx="180.4" cy="33.5" r="1.67" fill="${color}" opacity="0.42"/><circle cx="83.8" cy="28.3" r="1.58" fill="${color}" opacity="0.35"/><circle cx="179.0" cy="179.7" r="1.59" fill="${color}" opacity="0.36"/><circle cx="191.2" cy="146.7" r="2.25" fill="${color}" opacity="0.19"/><circle cx="176.4" cy="113.4" r="2.24" fill="${color}" opacity="0.43"/><circle cx="167.9" cy="65.2" r="1.44" fill="${color}" opacity="0.16"/><circle cx="151.4" cy="151.7" r="1.59" fill="${color}" opacity="0.36"/><circle cx="123.6" cy="167.9" r="1.20" fill="${color}" opacity="0.21"/><circle cx="135.2" cy="49.8" r="1.45" fill="${color}" opacity="0.43"/><circle cx="10.3" cy="65.2" r="1.80" fill="${color}" opacity="0.37"/><circle cx="39.1" cy="181.0" r="1.78" fill="${color}" opacity="0.36"/><circle cx="106.6" cy="145.9" r="1.55" fill="${color}" opacity="0.31"/><circle cx="185.0" cy="158.1" r="1.06" fill="${color}" opacity="0.46"/><circle cx="173.3" cy="112.1" r="1.15" fill="${color}" opacity="0.41"/><circle cx="151.8" cy="191.2" r="1.85" fill="${color}" opacity="0.39"/><circle cx="87.9" cy="140.2" r="1.69" fill="${color}" opacity="0.33"/><circle cx="190.6" cy="48.3" r="1.41" fill="${color}" opacity="0.18"/><circle cx="14.4" cy="96.2" r="1.84" fill="${color}" opacity="0.34"/><circle cx="178.1" cy="104.5" r="1.40" fill="${color}" opacity="0.44"/>`,
  },
  dither: {
    viewBox: "0 0 40 40",
    markup: (color: string) => `<circle cx="5.0" cy="5.0" r="0.35" fill="${color}" opacity=".17"/><circle cx="15.0" cy="5.0" r="1.85" fill="${color}" opacity=".17"/><circle cx="25.0" cy="5.0" r="0.72" fill="${color}" opacity=".17"/><circle cx="35.0" cy="5.0" r="2.23" fill="${color}" opacity=".17"/><circle cx="5.0" cy="15.0" r="2.60" fill="${color}" opacity=".17"/><circle cx="15.0" cy="15.0" r="1.10" fill="${color}" opacity=".17"/><circle cx="25.0" cy="15.0" r="2.98" fill="${color}" opacity=".17"/><circle cx="35.0" cy="15.0" r="1.48" fill="${color}" opacity=".17"/><circle cx="5.0" cy="25.0" r="0.91" fill="${color}" opacity=".17"/><circle cx="15.0" cy="25.0" r="2.41" fill="${color}" opacity=".17"/><circle cx="25.0" cy="25.0" r="0.54" fill="${color}" opacity=".17"/><circle cx="35.0" cy="25.0" r="2.04" fill="${color}" opacity=".17"/><circle cx="5.0" cy="35.0" r="3.16" fill="${color}" opacity=".17"/><circle cx="15.0" cy="35.0" r="1.66" fill="${color}" opacity=".17"/><circle cx="25.0" cy="35.0" r="2.79" fill="${color}" opacity=".17"/><circle cx="35.0" cy="35.0" r="1.29" fill="${color}" opacity=".17"/>`,
  },
  "circuit-trace": {
    viewBox: "0 0 120 120",
    markup: (color: string) => `<path d="M0 30H45V75H120" stroke="${color}" stroke-width="1.1" fill="none" opacity=".16"/><path d="M0 75H22V30H120" stroke="${color}" stroke-width="1.1" fill="none" opacity=".16"/><path d="M35 0V52H90V120" stroke="${color}" stroke-width="1.1" fill="none" opacity=".12"/><path d="M90 0V96H35V120" stroke="${color}" stroke-width="1.1" fill="none" opacity=".12"/><circle cx="45" cy="30" r="2.4" fill="${color}" opacity=".30"/><circle cx="45" cy="75" r="2.4" fill="${color}" opacity=".30"/><circle cx="22" cy="75" r="2.4" fill="${color}" opacity=".30"/><circle cx="22" cy="30" r="2.4" fill="${color}" opacity=".30"/><circle cx="35" cy="52" r="2.4" fill="${color}" opacity=".30"/><circle cx="90" cy="52" r="2.4" fill="${color}" opacity=".30"/><circle cx="90" cy="96" r="2.4" fill="${color}" opacity=".30"/><circle cx="35" cy="96" r="2.4" fill="${color}" opacity=".30"/>`,
  },
} satisfies Record<string, { viewBox: string; markup: (color: string) => string }>;

/**
 * "Grain" is the one pattern in `Refrence/patterns-preview.html` that
 * isn't a colorable line-art SVG (the reference bakes it as a grayscale
 * noise PNG) — reproduced here with an SVG `feTurbulence` filter instead,
 * a standard procedural-noise technique, so it doesn't need a giant
 * embedded bitmap. `patternColor` is intentionally ignored for its own
 * *appearance* (grain is inherently monochrome), but an editor still has
 * to set both `pattern` and `patternColor` to turn it on — same "both
 * fields" gate every other pattern uses, for one consistent rule to
 * remember rather than a special case.
 */
const GRAIN_VIEWBOX = "0 0 64 64";

function grainMarkup(): string {
  return `<filter id="oxytal-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0"/></filter><rect width="64" height="64" filter="url(#oxytal-grain)"/>`;
}

interface Props {
  theme?: SectionTheme;
  /** Dot/line opacity multiplier — matches the original mockup's own `.22`. Only applies to the `theme.showPattern` fallback path; the 14 named patterns already bake their own per-shape opacities (ported from the reference), so this doesn't scale those. */
  opacity?: number;
  /**
   * An editor's explicit per-section pattern choice — one of the 14
   * tiles ported from `Refrence/patterns-preview.html` (13 colorable
   * tiles + "grain"). Set via the `composableElement.pattern` field.
   * Only takes effect when `patternColor` is *also* set (see the
   * component doc below) — otherwise this section falls back to the
   * theme-driven "Registration" pattern it always has.
   */
  pattern?: string;
  /** The hex color to render `pattern` in — set via `composableElement.patternColor`. Ignored (but still required to "arm" the pattern) for `pattern="grain"`, which is inherently monochrome. */
  patternColor?: string;
}

/**
 * A section's decorative background pattern — either an editor's
 * explicit per-section choice, or (falling back) the theme's own
 * built-in "Registration" dotted-grid.
 *
 * **Both `pattern` and `patternColor` must be set together to render the
 * explicit choice** — a `pattern` with no color (or a color with no
 * pattern) renders nothing new, same as leaving both unset. This mirrors
 * how every other per-section override in this codebase behaves: half-
 * finished config falls back to the existing default rather than
 * guessing a color or a pattern to fill the gap.
 *
 * When neither is set, this drops back to the original mechanism: the
 * dotted-grid "Registration" pattern, shown only when the resolved
 * `theme.showPattern` opts in (currently only the `darkyellow` preset —
 * see app/lib/theme.ts), colored via that theme's own `patternColor`.
 * Nothing about that path changes, so no existing section regresses.
 *
 * Renders as a full-cover, `pointer-events-none`, `z-0` layer — meant to
 * be dropped as the *first* child inside a section's existing decorative
 * background wrapper (the `<div aria-hidden className="... -z-10">` every
 * HomeAI/HomeServices/HomeProducts/etc.-style section already renders),
 * not directly alongside a section's actual text content. `z-0` only
 * needs to out-rank its *sibling* decorative divs (the blob/gradient
 * layers already in that wrapper) — the wrapper itself supplies the
 * negative z-index that keeps the whole group behind the section's
 * `position: static` text, which a `z-index` on this div alone couldn't
 * do (plain static content always paints above a positioned sibling at
 * z-index `0`/`auto`, regardless of DOM order — only a *negative*
 * z-index reliably stays behind it, which is why the wrapper needs it,
 * not this div).
 */
export default function ThemePattern({
  theme,
  opacity = 0.22,
  pattern,
  patternColor,
}: Props) {
  // Explicit per-section choice — only when BOTH fields are set.
  if (pattern && patternColor) {
    if (pattern === "grain") {
      return (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${64}" height="${64}" viewBox="${GRAIN_VIEWBOX}">${grainMarkup()}</svg>`
            )}")`,
            backgroundSize: "64px 64px",
          }}
        />
      );
    }

    const tile = (TILE_PATTERNS as Record<string, { viewBox: string; markup: (color: string) => string }>)[
      pattern
    ];

    if (tile) {
      const [, , w, h] = tile.viewBox.split(" ");
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${tile.viewBox}">${tile.markup(
        patternColor
      )}</svg>`;
      const dataUri = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;

      return (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: `url("${dataUri}")`, backgroundSize: `${w}px ${h}px` }}
        />
      );
    }
    // An unrecognized `pattern` value (e.g. old data from before a name
    // changed) falls through to the theme-driven default below, same as
    // if neither field had been set.
  }

  // Fallback: the original theme-driven "Registration" pattern.
  if (!theme?.showPattern) {
    return null;
  }

  const color = theme.patternColor ?? DEFAULT_PATTERN_COLOR;
  const registration = TILE_PATTERNS.registration;
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${registration.viewBox}">${registration
    .markup(color)
    .replace(/opacity="\.22"/g, `opacity="${opacity}"`)}</svg>`;
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: `url("${dataUri}")`, backgroundSize: "64px 64px" }}
    />
  );
}
