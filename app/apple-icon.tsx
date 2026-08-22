import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon (Next.js's `apple-icon.tsx` file convention — see
 * `app/icon.tsx`'s own doc comment for why this is code-generated rather
 * than a static image, and why it lives at this exact path). Same "O"
 * mark/color as the browser-tab favicon, just at Apple's own larger
 * recommended size (180×180) with no rounded corners of its own — iOS
 * applies its own corner mask on top regardless.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00d3f3",
          color: "#ffffff",
          fontSize: 110,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        O
      </div>
    ),
    { ...size }
  );
}
