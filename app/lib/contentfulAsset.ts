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

/**
 * Contentful asset URLs are protocol-relative (`//images.ctfassets.net/...`).
 * Prefixes them with `https:` so they work directly in `src`/`poster`
 * attributes, and returns `undefined` for missing/unresolved assets.
 */
export function getAssetUrl(asset: MaybeAsset): string | undefined {
  if (!asset || !("fields" in asset)) {
    return undefined;
  }

  const url = asset.fields.file?.url;
  return url ? `https:${url}` : undefined;
}
