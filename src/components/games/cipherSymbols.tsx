import { getAsset, type AssetId } from '../../domain/assets'
import {
  CIPHER_ALPHABET,
  cipherSymbolName,
  describeCipherSymbol,
  type CipherSymbolId,
} from '../../domain/games/symbolCipher'
import { AssetGlyph } from '../AssetGlyph'

/**
 * Shared rendering for the fixed day 22 alphabet. Day 24 reuses the same
 * symbol-letter table and the same catalog entries without changing them.
 */
const CIPHER_ASSETS: Readonly<Record<CipherSymbolId, AssetId>> = {
  tree: 'game.cipher.tree',
  bell: 'game.cipher.bell',
  gift: 'game.cipher.gift',
  snowman: 'game.cipher.snowman',
  reindeer: 'game.cipher.reindeer',
  star: 'game.cipher.star',
  mitten: 'game.cipher.mitten',
  sleigh: 'game.cipher.sleigh',
  snowflake: 'game.cipher.snowflake',
  candy: 'game.cipher.candy',
  candle: 'game.cipher.candle',
  sock: 'game.cipher.sock',
  sparkle: 'game.cipher.sparkle',
  mistletoe: 'game.cipher.mistletoe',
}

interface CipherSymbolProps {
  id: CipherSymbolId
  /**
   * When true, the symbol carries its Spanish name as visually hidden text.
   * Set it to false in the reference table, where the whole row already has a
   * clearer accessible description.
   */
  label?: boolean
}

export function CipherSymbol({ id, label = true }: CipherSymbolProps) {
  return (
    <>
      <span className="cipher-symbol" aria-hidden="true">
        <AssetGlyph asset={getAsset(CIPHER_ASSETS[id])} label={false} />
      </span>
      {label ? <span className="visually-hidden">{cipherSymbolName(id)}</span> : null}
    </>
  )
}

/**
 * The visible alphabet stays unchanged, but each row now exposes the complete
 * "symbol -> letter" association to assistive technology.
 */
export function CipherAlphabetReference({ titleId }: { titleId: string }) {
  return (
    <section className="cipher-reference" aria-labelledby={titleId}>
      <AssetGlyph
        asset={getAsset('ui.parchment.horizontal')}
        label={false}
        className="cipher-reference__parchment"
      />
      <h3 id={titleId}>Alfabeto de los duendes</h3>
      <ul className="cipher-alphabet">
        {CIPHER_ALPHABET.map((symbol) => (
          <li key={symbol.id} className="cipher-letter">
            <CipherSymbol id={symbol.id} label={false} />
            <span className="cipher-letter__value" aria-hidden="true">
              {symbol.letter}
            </span>
            <span className="visually-hidden">{describeCipherSymbol(symbol.id)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
