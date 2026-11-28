import { resolveAssetPath } from '../domain/assetPath'
import type { AssetEntry } from '../domain/assets'

interface AssetGlyphProps {
  asset: AssetEntry
  /** Set to false for purely decorative glyphs. */
  label?: boolean
  /** Extra class for context-specific sizing. */
  className?: string
  /**
   * Request the image eagerly. Use it only for a scene or phase that is already
   * on screen; everything else stays lazy so first paint does not fetch the
   * whole artwork folder.
   */
  priority?: boolean
}

export function AssetGlyph({
  asset,
  label = true,
  className,
  priority = false,
}: AssetGlyphProps) {
  const classes = className ? `asset-glyph ${className}` : 'asset-glyph'

  if (asset.kind === 'image') {
    return (
      <img
        className={classes}
        src={resolveAssetPath(asset.src)}
        alt={label ? asset.label : ''}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    )
  }

  return label ? (
    <span className={classes} role="img" aria-label={asset.label}>
      {asset.value}
    </span>
  ) : (
    <span className={classes} aria-hidden="true">
      {asset.value}
    </span>
  )
}
