/**
 * Contentful asset/entry links resolved via `include` come back either as
 * the real object (has `fields`) or, if unpublished/unresolvable, an
 * `UnresolvedLink` (`{ sys: { type: "Link", ... } }`, no `fields`). This is
 * the same shape check already used for `metaImage` in the slug page.
 */
type MaybeAsset =
  | { fields: { file?: { url?: string } } }
  | { sys: { type: "Link" } }
  | undefined
  | null;

/** File extensions Contentful's Images API can't (or shouldn't) transform — passed through untouched rather than getting `fm`/`q`/`w` params appended. SVGs are vector (resizing/format params are meaningless, and Contentful just ignores them), and GIFs need to stay GIF or they lose their animation. */
const UNTRANSFORMABLE_EXTENSIONS = [".svg", ".gif"];

/**
 * Contentful asset URLs are protocol-relative (`//images.ctfassets.net/...`).
 * Prefixes them with `https:` so they work directly in `src`/`poster`
 * attributes, and returns `undefined` for missing/unresolved assets.
 *
 * Every rendered image on this site is a plain `<img src={getAssetUrl(...)}>`
 * (not `next/image`), so without this, the browser downloads whatever the
 * editor originally uploaded to Contentful — often several megabytes of
 * full-resolution, unconverted JPEG/PNG — on every single page view; that's
 * one of the biggest levers on real page-load time here. Appending
 * Contentful's own Images API params (https://www.contentful.com/developers/docs/references/images-api/)
 * re-encodes to WebP at a still visually-lossless quality, and `width`
 * (when the caller knows how large the image actually renders) caps the
 * source resolution instead of shipping a 6000px original for a 400px slot.
 * Skips transformation entirely for `UNTRANSFORMABLE_EXTENSIONS`.
 */
export function getAssetUrl(
  asset: MaybeAsset,
  options?: { width?: number; quality?: number }
): string | undefined {
  if (!asset || !("fields" in asset)) {
    return undefined;
  }

  const url = asset.fields.file?.url;
  if (!url) {
    return undefined;
  }

  const absoluteUrl = `https:${url}`;

  if (UNTRANSFORMABLE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext))) {
    return absoluteUrl;
  }

  const params = new URLSearchParams({
    fm: "webp",
    q: String(options?.quality ?? 75),
  });

  if (options?.width) {
    params.set("w", String(Math.round(options.width)));
  }

  return `${absoluteUrl}?${params.toString()}`;
}
