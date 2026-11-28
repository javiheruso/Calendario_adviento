/**
 * Single source of truth for artwork.
 *
 * Final artwork lives under `public/assets/final/` and is referenced here by a
 * `public/`-relative path. A few entries stay emoji placeholders because the
 * approved final folder has no matching asset yet; those keep
 * `provisional: true` and are documented in `docs/TECHNICAL_DECISIONS.md`.
 *
 * Components never build asset URLs on their own: they read an entry from this
 * catalog and resolve its path through `resolveAssetPath`, so the app keeps
 * working when the static build is served from a sub-path.
 *
 * Images are lazy by default (`AssetGlyph`), and only the current mission scene
 * or phase is requested eagerly. The full 41 MB artwork folder is never loaded
 * on first paint.
 */

export interface EmojiAsset {
  readonly kind: 'emoji'
  readonly value: string
  readonly provisional: true
  readonly label: string
}

export interface ImageAsset {
  readonly kind: 'image'
  /** Path relative to `public/`, for example `assets/final/...webp`. */
  readonly src: string
  readonly provisional: boolean
  readonly label: string
}

export type AssetEntry = EmojiAsset | ImageAsset

const FINAL = 'assets/final/'

export const ASSET_CATALOG = {
  /* Brand and characters */
  'brand.trasto': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_saluda.webp`,
    provisional: false,
    label: 'Trasto, el duende, saludando',
  },
  'brand.trasto.celebrates': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_celebra.webp`,
    provisional: false,
    label: 'Trasto celebrando',
  },
  'brand.trasto.risa': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_risa.webp`,
    provisional: false,
    label: 'Trasto riendo',
  },
  'brand.trasto.explains': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_explica.webp`,
    provisional: false,
    label: 'Trasto explicando la misión',
  },
  'brand.trasto.thinking': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_pensativo.webp`,
    provisional: false,
    label: 'Trasto pensativo',
  },
  'brand.trasto.worried': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_preocupado.webp`,
    provisional: false,
    label: 'Trasto preocupado',
  },
  'brand.trasto.surprised': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_sorprendido.webp`,
    provisional: false,
    label: 'Trasto sorprendido',
  },
  'brand.trasto.jumps': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_salta.webp`,
    provisional: false,
    label: 'Trasto saltando',
  },
  'brand.trasto.sings': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_canta.webp`,
    provisional: false,
    label: 'Trasto cantando',
  },
  'brand.trasto.hands': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_manos_cintura.webp`,
    provisional: false,
    label: 'Trasto con las manos en la cintura',
  },
  'brand.trasto.neutral': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_neutro.webp`,
    provisional: false,
    label: 'Trasto',
  },
  'brand.trasto.points': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_senala.webp`,
    provisional: false,
    label: 'Trasto señala un lugar',
  },

  'game.reindeer.normal': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_normal.webp`,
    provisional: false,
    label: 'Rodolfo, el reno',
  },
  'game.reindeer.happy': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_feliz.webp`,
    provisional: false,
    label: 'Rodolfo feliz',
  },
  'game.reindeer.absent': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_despistado.webp`,
    provisional: false,
    label: 'Rodolfo despistado',
  },
  'game.reindeer.walk.a': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_camina.webp`,
    provisional: false,
    label: 'Rodolfo caminando, fotograma uno',
  },
  'game.reindeer.walk.b': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_camina_02.webp`,
    provisional: false,
    label: 'Rodolfo caminando, fotograma dos',
  },

  /* Shared interface */
  'ui.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Estrella encendida',
  },
  'ui.star.off': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_apagada.webp`,
    provisional: false,
    label: 'Estrella apagada',
  },
  'ui.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo rojo',
  },
  'ui.lock': {
    kind: 'image',
    src: `${FINAL}14_cofre/candado.webp`,
    provisional: false,
    label: 'Candado',
  },
  'ui.tree': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/arbol_estrellas.webp`,
    provisional: false,
    label: 'Árbol de estrellas',
  },
  'ui.door.closed': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/puerta_cerrada.webp`,
    provisional: false,
    label: 'Puerta cerrada',
  },
  'ui.door.open': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/puerta_abierta.webp`,
    provisional: false,
    label: 'Puerta abierta',
  },
  'ui.frame.calendar': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/marco_calendario.webp`,
    provisional: false,
    label: 'Marco del calendario',
  },
  'ui.frame.general': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/marco_general.webp`,
    provisional: false,
    label: 'Marco general',
  },
  'ui.parchment.horizontal': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/pergamino_horizontal.webp`,
    provisional: false,
    label: 'Pergamino horizontal',
  },
  'ui.parchment.vertical': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/pergamino_vertical.webp`,
    provisional: false,
    label: 'Pergamino vertical',
  },
  'ui.logo.cartel': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/logo_cartel.webp`,
    provisional: false,
    label: 'Cartel de Los 24 regalos desaparecidos',
  },
  'ui.logo.characters': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/logo_personajes.webp`,
    provisional: false,
    label: 'La aventura de Leyre en el Polo Norte: Trasto y Rodolfo',
  },
  'ui.album.book': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/libro_album.webp`,
    provisional: false,
    label: 'Libro del álbum de recuerdos',
  },
  'ui.background.town.horizontal': {
    kind: 'image',
    src: `${FINAL}00_comunes/fondos/pueblo_horizontal.webp`,
    provisional: false,
    label: 'Pueblo nevado, horizontal',
  },
  'ui.background.town.vertical': {
    kind: 'image',
    src: `${FINAL}00_comunes/fondos/pueblo_vertical.webp`,
    provisional: false,
    label: 'Pueblo nevado, vertical',
  },
  'ui.background.workshop.horizontal': {
    kind: 'image',
    src: `${FINAL}00_comunes/fondos/taller_horizontal.webp`,
    provisional: false,
    label: 'Taller de Trasto, horizontal',
  },
  'ui.background.workshop.vertical': {
    kind: 'image',
    src: `${FINAL}00_comunes/fondos/taller_vertical.webp`,
    provisional: false,
    label: 'Taller de Trasto, vertical',
  },
  'ui.ball.blue': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_azul.webp`,
    provisional: false,
    label: 'Bola azul',
  },
  'ui.ball.red': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_roja.webp`,
    provisional: false,
    label: 'Bola roja',
  },
  'ui.ball.green': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_verde.webp`,
    provisional: false,
    label: 'Bola verde',
  },
  'ui.ball.gold': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_dorada.webp`,
    provisional: false,
    label: 'Bola dorada',
  },
  'ui.snowflake': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/copo_nieve.webp`,
    provisional: false,
    label: 'Copo de nieve',
  },
  'ui.mistletoe': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/muerdago.webp`,
    provisional: false,
    label: 'Muérdago',
  },
  'ui.candyCane': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/baston_caramelo.webp`,
    provisional: false,
    label: 'Bastón de caramelo',
  },
  'ui.sleigh': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/trineo.webp`,
    provisional: false,
    label: 'Trineo',
  },
  'ui.candle': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/vela.webp`,
    provisional: false,
    label: 'Vela',
  },
  'ui.mitten': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/manopla.webp`,
    provisional: false,
    label: 'Manopla',
  },
  'ui.sock': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/calcetin_navideno.webp`,
    provisional: false,
    label: 'Calcetín navideño',
  },
  'ui.snowman': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/muneco_nieve.webp`,
    provisional: false,
    label: 'Muñeco de nieve',
  },
  'ui.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana dorada',
  },
  'ui.santaHat': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/gorro_noel.webp`,
    provisional: false,
    label: 'Gorro de Papá Noel',
  },
  'ui.sparkle': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/destello_magico.webp`,
    provisional: false,
    label: 'Destello mágico',
  },

  'album.book': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/libro_album.webp`,
    provisional: false,
    label: 'Álbum privado',
  },
  'album.photo': { kind: 'emoji', value: '📷', provisional: true, label: 'Album photo' },
  'album.video': { kind: 'emoji', value: '🎥', provisional: true, label: 'Album video' },
  'album.import': { kind: 'emoji', value: '🖼️', provisional: true, label: 'Import from gallery' },
  'album.export': { kind: 'emoji', value: '🗜️', provisional: true, label: 'Export album as ZIP' },

  /* Day 2: memory */
  'game.memory.back': {
    kind: 'image',
    src: `${FINAL}02_memoria/dorso_carta.webp`,
    provisional: false,
    label: 'Dorso de carta de Trasto',
  },
  'game.memory.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_feliz.webp`,
    provisional: false,
    label: 'Rodolfo',
  },
  'game.memory.snowman': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/muneco_nieve.webp`,
    provisional: false,
    label: 'Muñeco de nieve',
  },
  'game.memory.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo',
  },
  'game.memory.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Estrella',
  },
  'game.memory.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana',
  },
  'game.memory.tree': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/arbol_estrellas.webp`,
    provisional: false,
    label: 'Árbol',
  },
  'game.word.snow': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/copo_nieve.webp`,
    provisional: false,
    label: 'Copo de nieve',
  },

  /* Day 4: reindeer maze */
  'game.maze.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_normal.webp`,
    provisional: false,
    label: 'Rodolfo',
  },
  'game.maze.tree': { kind: 'emoji', value: '🌲', provisional: true, label: 'Snowy pine (no final asset yet)' },
  'game.maze.carrot': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/zanahoria.webp`,
    provisional: false,
    label: 'Zanahoria',
  },
  'game.maze.stable': {
    kind: 'image',
    src: `${FINAL}04_reno_perdido/establo.webp`,
    provisional: false,
    label: 'Establo',
  },

  /* Day 6: spot the difference */
  'game.spot.scene.a': {
    kind: 'image',
    src: `${FINAL}06_diferencias/taller_A.webp`,
    provisional: false,
    label: 'Taller A',
  },
  'game.spot.scene.b': {
    kind: 'image',
    src: `${FINAL}06_diferencias/taller_B.webp`,
    provisional: false,
    label: 'Taller B',
  },

  /* Day 7: karaoke */
  'game.karaoke.stage': {
    kind: 'image',
    src: `${FINAL}07_karaoke/escenario.webp`,
    provisional: false,
    label: 'Escenario del karaoke',
  },
  'game.karaoke.microphone': {
    kind: 'image',
    src: `${FINAL}07_karaoke/microfono.webp`,
    provisional: false,
    label: 'Micrófono',
  },
  'game.karaoke.trasto': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_canta.webp`,
    provisional: false,
    label: 'Trasto cantando',
  },
  'game.karaoke.robot': { kind: 'emoji', value: '🤖', provisional: true, label: 'Karaoke style: robot' },
  'game.karaoke.mouse': { kind: 'emoji', value: '🐭', provisional: true, label: 'Karaoke style: mouse' },
  'game.karaoke.giant': { kind: 'emoji', value: '🧌', provisional: true, label: 'Karaoke style: giant' },
  'game.karaoke.sleepy': { kind: 'emoji', value: '😴', provisional: true, label: 'Karaoke style: sleepy' },
  'game.karaoke.laugh': { kind: 'emoji', value: '😂', provisional: true, label: 'Karaoke style: laugh' },
  'game.karaoke.pop-star': { kind: 'emoji', value: '🌟', provisional: true, label: 'Karaoke style: pop star' },

  /* Day 8: word scramble */
  'game.word.board': {
    kind: 'image',
    src: `${FINAL}08_palabra/ficha_madera.webp`,
    provisional: false,
    label: 'Ficha de madera con letras',
  },

  /* Day 10: ornament patterns */
  'game.pattern.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Estrella',
  },
  'game.pattern.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana',
  },
  'game.pattern.tree': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/arbol_estrellas.webp`,
    provisional: false,
    label: 'Árbol',
  },
  'game.pattern.belt': {
    kind: 'image',
    src: `${FINAL}10_fabrica/cinta_transportadora.webp`,
    provisional: false,
    label: 'Cinta transportadora',
  },

  /* Day 12: gift rain */
  'game.catch.basket': {
    kind: 'image',
    src: `${FINAL}12_lluvia_regalos/cesta.webp`,
    provisional: false,
    label: 'Cesta de regalos',
  },
  'game.catch.gift.red': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo rojo',
  },
  'game.catch.gift.blue': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_azul.webp`,
    provisional: false,
    label: 'Regalo azul',
  },
  'game.catch.gift.green': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_verde.webp`,
    provisional: false,
    label: 'Regalo verde',
  },
  'game.catch.gift.gold': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_dorado.webp`,
    provisional: false,
    label: 'Regalo dorado',
  },

  /* Day 14: maths chest */
  'game.math.tree': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/arbol_estrellas.webp`,
    provisional: false,
    label: 'Árbol',
  },
  'game.math.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo',
  },
  'game.math.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_feliz.webp`,
    provisional: false,
    label: 'Reno',
  },
  'game.math.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Estrella',
  },
  'game.math.chest': {
    kind: 'image',
    src: `${FINAL}14_cofre/cofre_cerrado.webp`,
    provisional: false,
    label: 'Cofre cerrado',
  },
  'game.math.chest.open': {
    kind: 'image',
    src: `${FINAL}14_cofre/cofre_abierto.webp`,
    provisional: false,
    label: 'Cofre abierto',
  },
  'game.math.lock': {
    kind: 'image',
    src: `${FINAL}14_cofre/candado.webp`,
    provisional: false,
    label: 'Candado del cofre',
  },

  /* Day 16: jigsaw */
  'game.jigsaw.portrait': {
    kind: 'image',
    src: `${FINAL}16_cuadro_roto/puzzle_trasto_rodolfo.webp`,
    provisional: false,
    label: 'Trasto y Rodolfo en el taller',
  },

  /* Day 17: charades */
  'game.charades.hidden': {
    kind: 'image',
    src: `${FINAL}02_memoria/dorso_carta.webp`,
    provisional: false,
    label: 'Carta de mímica boca abajo',
  },
  'game.charades.elephant': {
    kind: 'image',
    src: `${FINAL}17_mimica/elefante.webp`,
    provisional: false,
    label: 'Charade animal: elefante',
  },
  'game.charades.cat': {
    kind: 'image',
    src: `${FINAL}17_mimica/gato.webp`,
    provisional: false,
    label: 'Charade animal: gato',
  },
  'game.charades.dog': {
    kind: 'image',
    src: `${FINAL}17_mimica/perro.webp`,
    provisional: false,
    label: 'Charade animal: perro',
  },
  'game.charades.lion': {
    kind: 'image',
    src: `${FINAL}17_mimica/leon.webp`,
    provisional: false,
    label: 'Charade animal: león',
  },
  'game.charades.monkey': {
    kind: 'image',
    src: `${FINAL}17_mimica/mono.webp`,
    provisional: false,
    label: 'Charade animal: mono',
  },
  'game.charades.penguin': {
    kind: 'image',
    src: `${FINAL}17_mimica/pinguino.webp`,
    provisional: false,
    label: 'Charade animal: pingüino',
  },
  'game.charades.rabbit': {
    kind: 'image',
    src: `${FINAL}17_mimica/conejo.webp`,
    provisional: false,
    label: 'Charade animal: conejo',
  },
  'game.charades.hen': {
    kind: 'image',
    src: `${FINAL}17_mimica/gallina.webp`,
    provisional: false,
    label: 'Charade animal: gallina',
  },
  'game.charades.gorilla': {
    kind: 'image',
    src: `${FINAL}17_mimica/gorila.webp`,
    provisional: false,
    label: 'Charade animal: gorila',
  },
  'game.charades.duck': {
    kind: 'image',
    src: `${FINAL}17_mimica/pato.webp`,
    provisional: false,
    label: 'Charade animal: pato',
  },
  'game.charades.frog': {
    kind: 'image',
    src: `${FINAL}17_mimica/rana.webp`,
    provisional: false,
    label: 'Charade animal: rana',
  },
  'game.charades.reindeer': {
    kind: 'image',
    src: `${FINAL}17_mimica/reno.webp`,
    provisional: false,
    label: 'Charade animal: reno',
  },

  /* Day 18: magic bells */
  'game.simon.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana dorada',
  },
  'game.simon.bell.red': {
    kind: 'image',
    src: `${FINAL}18_campanas/campana_roja.webp`,
    provisional: false,
    label: 'Campana roja',
  },
  'game.simon.bell.blue': {
    kind: 'image',
    src: `${FINAL}18_campanas/campana_azul.webp`,
    provisional: false,
    label: 'Campana azul',
  },
  'game.simon.bell.green': {
    kind: 'image',
    src: `${FINAL}18_campanas/campana_verde.webp`,
    provisional: false,
    label: 'Campana verde',
  },
  'game.simon.bell.gold': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana dorada',
  },
  'game.simon.stand': {
    kind: 'image',
    src: `${FINAL}18_campanas/soporte.webp`,
    provisional: false,
    label: 'Soporte de las campanas',
  },

  /* Day 19: messy workshop */
  'game.hidden.scene': {
    kind: 'image',
    src: `${FINAL}19_taller_desordenado/escena_objetos.webp`,
    provisional: false,
    label: 'Taller desordenado de Trasto',
  },
  'game.hidden.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo',
  },
  'game.hidden.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Campana',
  },
  'game.hidden.candyCane': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/baston_caramelo.webp`,
    provisional: false,
    label: 'Bastón de caramelo',
  },
  'game.hidden.santaHat': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/gorro_noel.webp`,
    provisional: false,
    label: 'Gorro de Papá Noel',
  },
  'game.hidden.blueBauble': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_azul.webp`,
    provisional: false,
    label: 'Bola azul',
  },
  'game.hidden.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Estrella',
  },

  /* Day 20: mystery bag */
  'game.touch.bag': {
    kind: 'image',
    src: `${FINAL}20_saco/saco_cerrado.webp`,
    provisional: false,
    label: 'Saco misterioso cerrado',
  },
  'game.touch.bag.open': {
    kind: 'image',
    src: `${FINAL}20_saco/saco_abierto.webp`,
    provisional: false,
    label: 'Saco misterioso abierto',
  },
  'game.touch.hand': { kind: 'emoji', value: '🤚', provisional: true, label: 'Hand feeling without looking' },
  'game.touch.spoon': { kind: 'emoji', value: '🥄', provisional: true, label: 'Safe object: wooden spoon' },
  'game.touch.ball': { kind: 'emoji', value: '⚽', provisional: true, label: 'Safe object: small ball' },
  'game.touch.sponge': { kind: 'emoji', value: '🧽', provisional: true, label: 'Safe object: soft sponge' },
  'game.touch.hit': { kind: 'emoji', value: '✅', provisional: true, label: 'Identified object' },

  /* Day 3: red invasion */
  'game.red.garment.one': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/calcetin_navideno.webp`,
    provisional: false,
    label: 'Primera prenda roja',
  },
  'game.red.garment.two': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/gorro_noel.webp`,
    provisional: false,
    label: 'Segunda prenda roja',
  },
  'game.red.object': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/bola_roja.webp`,
    provisional: false,
    label: 'Objeto rojo',
  },

  /* Day 5: snowball fight */
  'game.snowball.ball': { kind: 'emoji', value: '⚪', provisional: true, label: 'Bola de papel' },
  'game.snowball.target': {
    kind: 'image',
    src: `${FINAL}12_lluvia_regalos/cesta.webp`,
    provisional: false,
    label: 'Cesta para las bolas de nieve',
  },
  'game.snowball.hit': { kind: 'emoji', value: '✅', provisional: true, label: 'Dentro' },
  'game.snowball.miss': { kind: 'emoji', value: '❌', provisional: true, label: 'Fuera' },

  /* Day 9: sock pairs (no colour variants in the final folder yet) */
  'game.sock.red': { kind: 'emoji', value: '🧦', provisional: true, label: 'Calcetín rojo' },
  'game.sock.green': { kind: 'emoji', value: '🧦', provisional: true, label: 'Calcetín verde' },
  'game.sock.blue': { kind: 'emoji', value: '🧦', provisional: true, label: 'Calcetín azul' },
  'game.sock.yellow': { kind: 'emoji', value: '🧦', provisional: true, label: 'Calcetín amarillo' },
  'game.sock.purple': { kind: 'emoji', value: '🧦', provisional: true, label: 'Calcetín morado' },
  'game.sock.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'Reloj de los calcetines' },

  /* Day 11: guided drawing */
  'game.drawing.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_normal.webp`,
    provisional: false,
    label: 'Reno para dibujar',
  },
  'game.drawing.pencil': { kind: 'emoji', value: '✏️', provisional: true, label: 'Lápiz' },

  /* Day 13: no laughing */
  'game.laugh.child': { kind: 'emoji', value: '😐', provisional: true, label: 'Niña aguantando la risa' },
  'game.laugh.adult': { kind: 'emoji', value: '😂', provisional: true, label: 'Adulto haciendo bromas' },
  'game.laugh.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'Reloj de la ronda' },

  /* Day 15: elf-hands pyramid */
  'game.pyramid.cup': { kind: 'emoji', value: '🥤', provisional: true, label: 'Vaso de plástico' },
  'game.pyramid.mitten': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/manopla.webp`,
    provisional: false,
    label: 'Manopla o calcetín en la mano',
  },
  'game.pyramid.clock': { kind: 'emoji', value: '⏱️', provisional: true, label: 'Reloj de la pirámide' },

  /* Day 1: elf dance */
  'game.dance.jump': { kind: 'emoji', value: '🦘', provisional: true, label: 'Salto' },
  'game.dance.turn': { kind: 'emoji', value: '🔄', provisional: true, label: 'Vuelta' },
  'game.dance.crouch': { kind: 'emoji', value: '⬇️', provisional: true, label: 'Agacharse' },
  'game.dance.clap': { kind: 'emoji', value: '👏', provisional: true, label: 'Palmas' },
  'game.dance.wiggle': { kind: 'emoji', value: '🕺', provisional: true, label: 'Mover el culete' },
  'game.dance.statue': { kind: 'emoji', value: '🗿', provisional: true, label: 'Estatua' },
  'game.dance.pose': { kind: 'emoji', value: '🧝', provisional: true, label: 'Pose de duende' },
  'game.dance.celebrate': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_celebra.webp`,
    provisional: false,
    label: 'Trasto celebra el baile',
  },

  /* Day 21: absent-minded snowman */
  'game.snowman.body': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/00_base.webp`,
    provisional: false,
    label: 'Copito sin vestir',
  },
  'game.snowman.phase.base': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/00_base.webp`,
    provisional: false,
    label: 'Copito, fase base',
  },
  'game.snowman.phase.hat': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/01_sombrero.webp`,
    provisional: false,
    label: 'Copito con sombrero de copa',
  },
  'game.snowman.phase.nose': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/02_nariz.webp`,
    provisional: false,
    label: 'Copito con nariz de zanahoria',
  },
  'game.snowman.phase.scarf': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/03_bufanda.webp`,
    provisional: false,
    label: 'Copito con bufanda roja',
  },
  'game.snowman.phase.buttons': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/04_botones.webp`,
    provisional: false,
    label: 'Copito con botones de carbón',
  },
  'game.snowman.option.hat.top': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/sombrero_copa.webp`,
    provisional: false,
    label: 'Sombrero de copa',
  },
  'game.snowman.option.hat.santa': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/gorro_noel.webp`,
    provisional: false,
    label: 'Gorro de Papá Noel',
  },
  'game.snowman.option.hat.green': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/gorro_verde.webp`,
    provisional: false,
    label: 'Gorro verde',
  },
  'game.snowman.option.nose.carrot': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/nariz_zanahoria.webp`,
    provisional: false,
    label: 'Nariz de zanahoria',
  },
  'game.snowman.option.nose.button': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/nariz_boton.webp`,
    provisional: false,
    label: 'Nariz de botón',
  },
  'game.snowman.option.nose.pompon': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/nariz_pompon.webp`,
    provisional: false,
    label: 'Nariz de pompón',
  },
  'game.snowman.option.scarf.red': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/bufanda_roja.webp`,
    provisional: false,
    label: 'Bufanda roja',
  },
  'game.snowman.option.scarf.blue': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/bufanda_azul.webp`,
    provisional: false,
    label: 'Bufanda azul',
  },
  'game.snowman.option.scarf.green': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/bufanda_verde.webp`,
    provisional: false,
    label: 'Bufanda verde',
  },
  'game.snowman.option.buttons.coal': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/botones_carbon.webp`,
    provisional: false,
    label: 'Botones de carbón',
  },
  'game.snowman.option.buttons.colors': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/botones_colores.webp`,
    provisional: false,
    label: 'Botones de colores',
  },
  'game.snowman.option.buttons.gold': {
    kind: 'image',
    src: `${FINAL}21_muneco/opciones/botones_dorados.webp`,
    provisional: false,
    label: 'Botones dorados',
  },

  /* Day 22 and 24: shared elf alphabet */
  'game.cipher.tree': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/arbol_estrellas.webp`,
    provisional: false,
    label: 'Símbolo duende: árbol',
  },
  'game.cipher.bell': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Símbolo duende: campana',
  },
  'game.cipher.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Símbolo duende: regalo',
  },
  'game.cipher.snowman': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/muneco_nieve.webp`,
    provisional: false,
    label: 'Símbolo duende: muñeco de nieve',
  },
  'game.cipher.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_feliz.webp`,
    provisional: false,
    label: 'Símbolo duende: reno',
  },
  'game.cipher.star': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/estrella_encendida.webp`,
    provisional: false,
    label: 'Símbolo duende: estrella',
  },
  'game.cipher.mitten': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/manopla.webp`,
    provisional: false,
    label: 'Símbolo duende: manopla',
  },
  'game.cipher.sleigh': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/trineo.webp`,
    provisional: false,
    label: 'Símbolo duende: trineo',
  },
  'game.cipher.snowflake': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/copo_nieve.webp`,
    provisional: false,
    label: 'Símbolo duende: copo de nieve',
  },
  'game.cipher.candy': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/baston_caramelo.webp`,
    provisional: false,
    label: 'Símbolo duende: caramelo',
  },
  'game.cipher.candle': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/vela.webp`,
    provisional: false,
    label: 'Símbolo duende: vela',
  },
  'game.cipher.sock': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/calcetin_navideno.webp`,
    provisional: false,
    label: 'Símbolo duende: calcetín',
  },
  'game.cipher.sparkle': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/destello_magico.webp`,
    provisional: false,
    label: 'Símbolo duende: destello',
  },
  'game.cipher.mistletoe': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/muerdago.webp`,
    provisional: false,
    label: 'Símbolo duende: muérdago',
  },

  /* Day 23: surprise for Trasto */
  'game.craft.drawing': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/dibujo.webp`,
    provisional: false,
    label: 'Dibujo para Trasto',
  },
  'game.craft.letter': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/carta.webp`,
    provisional: false,
    label: 'Carta para Trasto',
  },
  'game.craft.craft': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/manualidad.webp`,
    provisional: false,
    label: 'Manualidad para Trasto',
  },
  'game.craft.farewell': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/trasto_despedida.webp`,
    provisional: false,
    label: 'Trasto se despide',
  },
  'game.craft.excited': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/trasto_emocionado.webp`,
    provisional: false,
    label: 'Trasto emocionado',
  },

  /* Day 24: final mission */
  'game.final.santa': { kind: 'emoji', value: '🎅', provisional: true, label: 'Papá Noel (sin recurso final todavía)' },
  'game.final.sleigh': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/trineo.webp`,
    provisional: false,
    label: 'Trineo',
  },
  'game.final.gift': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Regalo',
  },
  'game.final.reindeer': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_feliz.webp`,
    provisional: false,
    label: 'Reno',
  },
  'game.final.crystal.red.off': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_rojo_off.webp`,
    provisional: false,
    label: 'Cristal rojo apagado',
  },
  'game.final.crystal.red.on': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_rojo_on.webp`,
    provisional: false,
    label: 'Cristal rojo encendido',
  },
  'game.final.crystal.blue.off': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_azul_off.webp`,
    provisional: false,
    label: 'Cristal azul apagado',
  },
  'game.final.crystal.blue.on': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_azul_on.webp`,
    provisional: false,
    label: 'Cristal azul encendido',
  },
  'game.final.crystal.gold.off': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_dorado_off.webp`,
    provisional: false,
    label: 'Cristal dorado apagado',
  },
  'game.final.crystal.gold.on': {
    kind: 'image',
    src: `${FINAL}24_final/cristal_dorado_on.webp`,
    provisional: false,
    label: 'Cristal dorado encendido',
  },
  'game.final.sleigh.prepared': {
    kind: 'image',
    src: `${FINAL}24_final/trineo_preparado.webp`,
    provisional: false,
    label: 'Trineo preparado',
  },
  'game.final.sleigh.flying': {
    kind: 'image',
    src: `${FINAL}24_final/trineo_volando.webp`,
    provisional: false,
    label: 'Trineo volando',
  },
  'game.final.album': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/libro_album.webp`,
    provisional: false,
    label: 'Álbum de recuerdos',
  },

  /* Mission illustrations */
  'mission.01': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_salta.webp`,
    provisional: false,
    label: 'Día 1: el baile del duende',
  },
  'mission.02': {
    kind: 'image',
    src: `${FINAL}02_memoria/dorso_carta.webp`,
    provisional: false,
    label: 'Día 2: la memoria de Trasto',
  },
  'mission.03': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/calcetin_navideno.webp`,
    provisional: false,
    label: 'Día 3: la invasión roja',
  },
  'mission.04': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/rodolfo_normal.webp`,
    provisional: false,
    label: 'Día 4: el reno perdido',
  },
  'mission.05': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/copo_nieve.webp`,
    provisional: false,
    label: 'Día 5: guerra de bolas de nieve',
  },
  'mission.06': {
    kind: 'image',
    src: `${FINAL}06_diferencias/taller_A.webp`,
    provisional: false,
    label: 'Día 6: algo ha cambiado',
  },
  'mission.07': {
    kind: 'image',
    src: `${FINAL}07_karaoke/microfono.webp`,
    provisional: false,
    label: 'Día 7: el villancico disparatado',
  },
  'mission.08': {
    kind: 'image',
    src: `${FINAL}08_palabra/ficha_madera.webp`,
    provisional: false,
    label: 'Día 8: la palabra destrozada',
  },
  'mission.09': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/calcetin_navideno.webp`,
    provisional: false,
    label: 'Día 9: los calcetines desaparejados',
  },
  'mission.10': {
    kind: 'image',
    src: `${FINAL}10_fabrica/cinta_transportadora.webp`,
    provisional: false,
    label: 'Día 10: la fábrica de adornos',
  },
  'mission.11': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_pensativo.webp`,
    provisional: false,
    label: 'Día 11: el retrato imposible',
  },
  'mission.12': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/regalo_rojo.webp`,
    provisional: false,
    label: 'Día 12: lluvia de regalos',
  },
  'mission.13': {
    kind: 'image',
    src: `${FINAL}00_comunes/personajes/trasto_risa.webp`,
    provisional: false,
    label: 'Día 13: prohibido reírse',
  },
  'mission.14': {
    kind: 'image',
    src: `${FINAL}14_cofre/cofre_cerrado.webp`,
    provisional: false,
    label: 'Día 14: el cofre matemático',
  },
  'mission.15': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/manopla.webp`,
    provisional: false,
    label: 'Día 15: manos de duende',
  },
  'mission.16': {
    kind: 'image',
    src: `${FINAL}16_cuadro_roto/puzzle_trasto_rodolfo.webp`,
    provisional: false,
    label: 'Día 16: el cuadro roto',
  },
  'mission.17': {
    kind: 'image',
    src: `${FINAL}17_mimica/elefante.webp`,
    provisional: false,
    label: 'Día 17: el duende silencioso',
  },
  'mission.18': {
    kind: 'image',
    src: `${FINAL}00_comunes/objetos/campana_dorada.webp`,
    provisional: false,
    label: 'Día 18: las campanas mágicas',
  },
  'mission.19': {
    kind: 'image',
    src: `${FINAL}19_taller_desordenado/escena_objetos.webp`,
    provisional: false,
    label: 'Día 19: el taller desordenado',
  },
  'mission.20': {
    kind: 'image',
    src: `${FINAL}20_saco/saco_cerrado.webp`,
    provisional: false,
    label: 'Día 20: el saco misterioso',
  },
  'mission.21': {
    kind: 'image',
    src: `${FINAL}21_muneco/fases/04_botones.webp`,
    provisional: false,
    label: 'Día 21: el muñeco de nieve despistado',
  },
  'mission.22': {
    kind: 'image',
    src: `${FINAL}00_comunes/interfaz/pergamino_vertical.webp`,
    provisional: false,
    label: 'Día 22: el idioma secreto de los duendes',
  },
  'mission.23': {
    kind: 'image',
    src: `${FINAL}23_sorpresa/trasto_emocionado.webp`,
    provisional: false,
    label: 'Día 23: una sorpresa para Trasto',
  },
  'mission.24': {
    kind: 'image',
    src: `${FINAL}24_final/trineo_preparado.webp`,
    provisional: false,
    label: 'Día 24: la última gran misión',
  },
} as const satisfies Record<string, AssetEntry>

export type AssetId = keyof typeof ASSET_CATALOG

export function getAsset<K extends AssetId>(id: K): (typeof ASSET_CATALOG)[K] {
  return ASSET_CATALOG[id]
}
