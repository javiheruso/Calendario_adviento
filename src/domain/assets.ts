/**
 * Single source of truth for provisional artwork.
 *
 * The calendar phases ship emoji placeholders so the UI can be wired without
 * inventing file paths across components. When final artwork arrives, only this module
 * changes: swap the entry to `kind: 'image'` and point `src` at a file under
 * `public/assets/`. No component should build asset URLs on its own.
 *
 * Public paths must go through `resolveAssetPath` so the app keeps working
 * when the static build is served from a sub-path.
 */

export interface EmojiAsset {
  readonly kind: 'emoji'
  readonly value: string
  readonly provisional: true
  readonly label: string
}

export interface ImageAsset {
  readonly kind: 'image'
  /** Path relative to `public/`, for example `assets/final/trasto.webp`. */
  readonly src: string
  readonly provisional: boolean
  readonly label: string
}

export type AssetEntry = EmojiAsset | ImageAsset

export const ASSET_CATALOG = {
  'brand.trasto': { kind: 'emoji', value: '🧝', provisional: true, label: 'Trasto, the elf' },
  'ui.star': { kind: 'emoji', value: '⭐', provisional: true, label: 'Star' },
  'ui.gift': { kind: 'emoji', value: '🎁', provisional: true, label: 'Gift' },
  'ui.lock': { kind: 'emoji', value: '🔒', provisional: true, label: 'Locked door' },
  'ui.tree': { kind: 'emoji', value: '🎄', provisional: true, label: 'Christmas tree' },

  'album.photo': { kind: 'emoji', value: '📷', provisional: true, label: 'Album photo' },
  'album.video': { kind: 'emoji', value: '🎥', provisional: true, label: 'Album video' },
  'album.import': { kind: 'emoji', value: '🖼️', provisional: true, label: 'Import from gallery' },
  'album.export': { kind: 'emoji', value: '🗜️', provisional: true, label: 'Export album as ZIP' },

  'game.memory.back': { kind: 'emoji', value: '🎴', provisional: true, label: 'Memory card back' },
  'game.memory.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Reindeer' },
  'game.memory.snowman': { kind: 'emoji', value: '⛄', provisional: true, label: 'Snowman' },
  'game.memory.bell': { kind: 'emoji', value: '🔔', provisional: true, label: 'Bell' },
  'game.word.snow': { kind: 'emoji', value: '❄️', provisional: true, label: 'Snowflake' },
  'game.simon.bell': { kind: 'emoji', value: '🔔', provisional: true, label: 'Magic bell' },
  'game.maze.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Rodolfo the reindeer' },
  'game.maze.carrot': { kind: 'emoji', value: '🥕', provisional: true, label: 'Carrot' },
  'game.maze.stable': { kind: 'emoji', value: '🏠', provisional: true, label: 'Stable' },
  'game.maze.tree': { kind: 'emoji', value: '🌲', provisional: true, label: 'Snowy pine' },
  'game.spot.bauble.red': { kind: 'emoji', value: '🔴', provisional: true, label: 'Red bauble' },
  'game.spot.bauble.blue': { kind: 'emoji', value: '🔵', provisional: true, label: 'Blue bauble' },
  'game.spot.clock.one': { kind: 'emoji', value: '🕐', provisional: true, label: 'Clock at one' },
  'game.spot.clock.three': { kind: 'emoji', value: '🕒', provisional: true, label: 'Clock at three' },
  'game.spot.hat': { kind: 'emoji', value: '🎩', provisional: true, label: 'Top hat' },
  'game.spot.carrot': { kind: 'emoji', value: '🥕', provisional: true, label: 'Bitten carrot' },
  'game.pattern.star': { kind: 'emoji', value: '⭐', provisional: true, label: 'Star token' },
  'game.pattern.bell': { kind: 'emoji', value: '🔔', provisional: true, label: 'Bell token' },
  'game.pattern.tree': { kind: 'emoji', value: '🎄', provisional: true, label: 'Tree token' },
  'game.catch.basket': { kind: 'emoji', value: '🧺', provisional: true, label: 'Gift basket' },
  'game.jigsaw.portrait': {
    kind: 'image',
    src: 'assets/provisional/portrait.svg',
    provisional: true,
    label: 'Trasto and Rodolfo in the workshop',
  },

  'game.math.tree': { kind: 'emoji', value: '🎄', provisional: true, label: 'Maths tree' },
  'game.math.gift': { kind: 'emoji', value: '🎁', provisional: true, label: 'Maths gift' },
  'game.math.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Maths reindeer' },
  'game.math.star': { kind: 'emoji', value: '⭐', provisional: true, label: 'Maths star' },
  'game.math.chest': { kind: 'emoji', value: '🧰', provisional: true, label: 'Maths chest' },

  'game.hidden.key': { kind: 'emoji', value: '🔑', provisional: true, label: 'Hidden key' },
  'game.hidden.sock': { kind: 'emoji', value: '🧦', provisional: true, label: 'Hidden sock' },
  'game.hidden.carrot': { kind: 'emoji', value: '🥕', provisional: true, label: 'Hidden carrot' },
  'game.hidden.bell': { kind: 'emoji', value: '🔔', provisional: true, label: 'Hidden bell' },
  'game.hidden.teddy': { kind: 'emoji', value: '🧸', provisional: true, label: 'Hidden teddy' },
  'game.hidden.candy': { kind: 'emoji', value: '🍬', provisional: true, label: 'Hidden candy' },

  'game.snowman.body': { kind: 'emoji', value: '⛄', provisional: true, label: 'Copito the snowman' },
  'game.snowman.hat.top': { kind: 'emoji', value: '🎩', provisional: true, label: 'Top hat' },
  'game.snowman.hat.warm': { kind: 'emoji', value: '🧢', provisional: true, label: 'Warm hat' },
  'game.snowman.hat.crown': { kind: 'emoji', value: '👑', provisional: true, label: 'Crown' },
  'game.snowman.scarf.red': { kind: 'emoji', value: '🧣', provisional: true, label: 'Red scarf' },
  'game.snowman.scarf.green': { kind: 'emoji', value: '🧣', provisional: true, label: 'Green scarf' },
  'game.snowman.scarf.blue': { kind: 'emoji', value: '🧣', provisional: true, label: 'Blue scarf' },
  'game.snowman.nose.carrot': { kind: 'emoji', value: '🥕', provisional: true, label: 'Carrot nose' },
  'game.snowman.nose.button': { kind: 'emoji', value: '🔘', provisional: true, label: 'Button nose' },
  'game.snowman.nose.coal': { kind: 'emoji', value: '⚫', provisional: true, label: 'Coal nose' },
  'game.snowman.buttons.two': { kind: 'emoji', value: '⚫⚫', provisional: true, label: 'Two coal buttons' },
  'game.snowman.buttons.three': { kind: 'emoji', value: '⚫⚫⚫', provisional: true, label: 'Three coal buttons' },
  'game.snowman.buttons.stars': { kind: 'emoji', value: '⭐⭐⭐', provisional: true, label: 'Three star buttons' },

  'game.cipher.tree': { kind: 'emoji', value: '🎄', provisional: true, label: 'Elf symbol: tree = A' },
  'game.cipher.bell': { kind: 'emoji', value: '🔔', provisional: true, label: 'Elf symbol: bell = E' },
  'game.cipher.gift': { kind: 'emoji', value: '🎁', provisional: true, label: 'Elf symbol: gift = I' },
  'game.cipher.snowman': { kind: 'emoji', value: '⛄', provisional: true, label: 'Elf symbol: snowman = O' },
  'game.cipher.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Elf symbol: reindeer = U' },
  'game.cipher.star': { kind: 'emoji', value: '⭐', provisional: true, label: 'Elf symbol: star = M' },
  'game.cipher.mitten': { kind: 'emoji', value: '🧤', provisional: true, label: 'Elf symbol: mitten = G' },
  'game.cipher.sleigh': { kind: 'emoji', value: '🛷', provisional: true, label: 'Elf symbol: sleigh = L' },
  'game.cipher.snowflake': { kind: 'emoji', value: '❄️', provisional: true, label: 'Elf symbol: snowflake = N' },
  'game.cipher.candy': { kind: 'emoji', value: '🍬', provisional: true, label: 'Elf symbol: candy = S' },
  'game.cipher.candle': { kind: 'emoji', value: '🕯️', provisional: true, label: 'Elf symbol: candle = T' },
  'game.cipher.sock': { kind: 'emoji', value: '🧦', provisional: true, label: 'Elf symbol: sock = R' },
  'game.cipher.sparkle': { kind: 'emoji', value: '✨', provisional: true, label: 'Elf symbol: sparkle = Z' },

  'game.red.garment.one': { kind: 'emoji', value: '🧥', provisional: true, label: 'First red garment' },
  'game.red.garment.two': { kind: 'emoji', value: '🧣', provisional: true, label: 'Second red garment' },
  'game.red.object': { kind: 'emoji', value: '🔴', provisional: true, label: 'Red object' },
  'game.snowball.ball': { kind: 'emoji', value: '⚪', provisional: true, label: 'Paper snowball' },
  'game.snowball.target': { kind: 'emoji', value: '🧺', provisional: true, label: 'Snowball target basket' },
  'game.snowball.hit': { kind: 'emoji', value: '✅', provisional: true, label: 'Hit' },
  'game.snowball.miss': { kind: 'emoji', value: '❌', provisional: true, label: 'Miss' },
  'game.sock.red': { kind: 'emoji', value: '🧦', provisional: true, label: 'Red sock' },
  'game.sock.green': { kind: 'emoji', value: '🧦', provisional: true, label: 'Green sock' },
  'game.sock.blue': { kind: 'emoji', value: '🧦', provisional: true, label: 'Blue sock' },
  'game.sock.yellow': { kind: 'emoji', value: '🧦', provisional: true, label: 'Yellow sock' },
  'game.sock.purple': { kind: 'emoji', value: '🧦', provisional: true, label: 'Purple sock' },
  'game.sock.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'Playful sock timer' },
  'game.drawing.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Impossible reindeer' },
  'game.drawing.pencil': { kind: 'emoji', value: '✏️', provisional: true, label: 'Drawing pencil' },
  'game.laugh.child': { kind: 'emoji', value: '😐', provisional: true, label: 'Child holding back laughter' },
  'game.laugh.adult': { kind: 'emoji', value: '😂', provisional: true, label: 'Adult making jokes' },
  'game.laugh.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'No-laughing round timer' },

  'game.pyramid.cup': { kind: 'emoji', value: '🥤', provisional: true, label: 'Plastic cup' },
  'game.pyramid.mitten': { kind: 'emoji', value: '🧤', provisional: true, label: 'Sock or mitten hand' },
  'game.pyramid.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'Pyramid timer' },

  'game.charades.hidden': { kind: 'emoji', value: '🎭', provisional: true, label: 'Hidden charade card' },
  'game.charades.dog': { kind: 'emoji', value: '🐶', provisional: true, label: 'Charade animal: dog' },
  'game.charades.cat': { kind: 'emoji', value: '🐱', provisional: true, label: 'Charade animal: cat' },
  'game.charades.elephant': { kind: 'emoji', value: '🐘', provisional: true, label: 'Charade animal: elephant' },
  'game.charades.lion': { kind: 'emoji', value: '🦁', provisional: true, label: 'Charade animal: lion' },
  'game.charades.monkey': { kind: 'emoji', value: '🐵', provisional: true, label: 'Charade animal: monkey' },
  'game.charades.penguin': { kind: 'emoji', value: '🐧', provisional: true, label: 'Charade animal: penguin' },
  'game.charades.frog': { kind: 'emoji', value: '🐸', provisional: true, label: 'Charade animal: frog' },
  'game.charades.duck': { kind: 'emoji', value: '🦆', provisional: true, label: 'Charade animal: duck' },
  'game.charades.rabbit': { kind: 'emoji', value: '🐰', provisional: true, label: 'Charade animal: rabbit' },
  'game.charades.bear': { kind: 'emoji', value: '🐻', provisional: true, label: 'Charade animal: bear' },
  'game.charades.horse': { kind: 'emoji', value: '🐴', provisional: true, label: 'Charade animal: horse' },
  'game.charades.fish': { kind: 'emoji', value: '🐟', provisional: true, label: 'Charade animal: fish' },

  'game.touch.bag': { kind: 'emoji', value: '👜', provisional: true, label: 'Opaque mystery bag' },
  'game.touch.hand': { kind: 'emoji', value: '🤚', provisional: true, label: 'Hand feeling without looking' },
  'game.touch.spoon': { kind: 'emoji', value: '🥄', provisional: true, label: 'Safe object: wooden spoon' },
  'game.touch.ball': { kind: 'emoji', value: '⚽', provisional: true, label: 'Safe object: small ball' },
  'game.touch.sponge': { kind: 'emoji', value: '🧽', provisional: true, label: 'Safe object: soft sponge' },
  'game.touch.hit': { kind: 'emoji', value: '✅', provisional: true, label: 'Identified object' },

  'game.craft.drawing': { kind: 'emoji', value: '🖍️', provisional: true, label: 'Drawing for Trasto' },
  'game.craft.letter': { kind: 'emoji', value: '💌', provisional: true, label: 'Letter for Trasto' },
  'game.craft.craft': { kind: 'emoji', value: '✂️', provisional: true, label: 'Craft for Trasto' },
  'game.craft.farewell': { kind: 'emoji', value: '👋', provisional: true, label: 'Farewell wave' },

  'game.dance.jump': { kind: 'emoji', value: '🦘', provisional: true, label: 'Dance move: jump' },
  'game.dance.turn': { kind: 'emoji', value: '🔄', provisional: true, label: 'Dance move: turn' },
  'game.dance.crouch': { kind: 'emoji', value: '⬇️', provisional: true, label: 'Dance move: crouch' },
  'game.dance.clap': { kind: 'emoji', value: '👏', provisional: true, label: 'Dance move: clap' },
  'game.dance.wiggle': { kind: 'emoji', value: '🕺', provisional: true, label: 'Dance move: wiggle' },
  'game.dance.statue': { kind: 'emoji', value: '🗿', provisional: true, label: 'Dance move: statue' },
  'game.dance.pose': { kind: 'emoji', value: '🧝', provisional: true, label: 'Dance move: elf pose' },
  'game.dance.celebrate': { kind: 'emoji', value: '🎉', provisional: true, label: 'Dance celebration' },

  'game.karaoke.robot': { kind: 'emoji', value: '🤖', provisional: true, label: 'Karaoke style: robot' },
  'game.karaoke.mouse': { kind: 'emoji', value: '🐭', provisional: true, label: 'Karaoke style: mouse' },
  'game.karaoke.giant': { kind: 'emoji', value: '🧌', provisional: true, label: 'Karaoke style: giant' },
  'game.karaoke.sleepy': { kind: 'emoji', value: '😴', provisional: true, label: 'Karaoke style: sleepy' },
  'game.karaoke.laugh': { kind: 'emoji', value: '😂', provisional: true, label: 'Karaoke style: laugh' },
  'game.karaoke.pop-star': { kind: 'emoji', value: '🌟', provisional: true, label: 'Karaoke style: pop star' },

  'game.final.santa': { kind: 'emoji', value: '🎅', provisional: true, label: 'Final crystal: Santa Claus' },
  'game.final.sleigh': { kind: 'emoji', value: '🛷', provisional: true, label: 'Final crystal: sleigh' },
  'game.final.gift': { kind: 'emoji', value: '🎁', provisional: true, label: 'Final crystal: gift' },
  'game.final.reindeer': { kind: 'emoji', value: '🦌', provisional: true, label: 'Final crystal: reindeer' },
  'game.final.crystal.intelligence': { kind: 'emoji', value: '🔴', provisional: true, label: 'Red intelligence crystal' },
  'game.final.crystal.memory': { kind: 'emoji', value: '🔵', provisional: true, label: 'Blue memory crystal' },
  'game.final.crystal.magic': { kind: 'emoji', value: '🟡', provisional: true, label: 'Golden magic crystal' },
  'game.final.album': { kind: 'emoji', value: '🖼️', provisional: true, label: 'Album of memories' },

  'mission.01': { kind: 'emoji', value: '💃', provisional: true, label: 'Day 1: elf dance' },
  'mission.02': { kind: 'emoji', value: '🃏', provisional: true, label: 'Day 2: memory game' },
  'mission.03': { kind: 'emoji', value: '🧣', provisional: true, label: 'Day 3: red invasion' },
  'mission.04': { kind: 'emoji', value: '🦌', provisional: true, label: 'Day 4: lost reindeer' },
  'mission.05': { kind: 'emoji', value: '❄️', provisional: true, label: 'Day 5: snowball fight' },
  'mission.06': { kind: 'emoji', value: '🔍', provisional: true, label: 'Day 6: spot the changes' },
  'mission.07': { kind: 'emoji', value: '🎤', provisional: true, label: 'Day 7: silly carol' },
  'mission.08': { kind: 'emoji', value: '🔤', provisional: true, label: 'Day 8: broken word' },
  'mission.09': { kind: 'emoji', value: '🧦', provisional: true, label: 'Day 9: mismatched socks' },
  'mission.10': { kind: 'emoji', value: '🎨', provisional: true, label: 'Day 10: ornament factory' },
  'mission.11': { kind: 'emoji', value: '✏️', provisional: true, label: 'Day 11: impossible portrait' },
  'mission.12': { kind: 'emoji', value: '🎁', provisional: true, label: 'Day 12: gift rain' },
  'mission.13': { kind: 'emoji', value: '😂', provisional: true, label: 'Day 13: no laughing' },
  'mission.14': { kind: 'emoji', value: '🔢', provisional: true, label: 'Day 14: maths chest' },
  'mission.15': { kind: 'emoji', value: '🥤', provisional: true, label: 'Day 15: elf hands' },
  'mission.16': { kind: 'emoji', value: '🧩', provisional: true, label: 'Day 16: broken painting' },
  'mission.17': { kind: 'emoji', value: '🎭', provisional: true, label: 'Day 17: silent elf' },
  'mission.18': { kind: 'emoji', value: '🔔', provisional: true, label: 'Day 18: magic bells' },
  'mission.19': { kind: 'emoji', value: '🕵️', provisional: true, label: 'Day 19: messy workshop' },
  'mission.20': { kind: 'emoji', value: '👜', provisional: true, label: 'Day 20: mystery bag' },
  'mission.21': { kind: 'emoji', value: '⛄', provisional: true, label: 'Day 21: absent-minded snowman' },
  'mission.22': { kind: 'emoji', value: '📜', provisional: true, label: 'Day 22: secret elf language' },
  'mission.23': { kind: 'emoji', value: '💌', provisional: true, label: 'Day 23: a surprise for Trasto' },
  'mission.24': { kind: 'emoji', value: '🛷', provisional: true, label: 'Day 24: the final mission' },
} as const satisfies Record<string, AssetEntry>

export type AssetId = keyof typeof ASSET_CATALOG

export function getAsset<K extends AssetId>(id: K): (typeof ASSET_CATALOG)[K] {
  return ASSET_CATALOG[id]
}
