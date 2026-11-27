import { resolveAssetPath } from '../domain/assetPath'
import type { AssetEntry } from '../domain/assets'

interface AssetGlyphProps {
  asset: AssetEntry
  /** Set to false for purely decorative glyphs. */
  label?: boolean
}

export function AssetGlyph({ asset, label = true }: AssetGlyphProps) {
  if (asset.kind === 'image') {
    return <img src={resolveAssetPath(asset.src)} alt={label ? asset.label : ''} />
  }

  return label ? (
    <span role="img" aria-label={asset.label}>
      {asset.value}
    </span>
  ) : (
    <span aria-hidden="true">{asset.value}</span>
  )
}
