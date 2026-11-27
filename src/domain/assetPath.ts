/**
 * Resolves a `public/`-relative path against Vite's configured base path.
 *
 * Kept apart from the asset catalog so the catalog itself has no Vite-specific
 * runtime dependency (it can be imported by plain Node checks).
 */
export function resolveAssetPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
