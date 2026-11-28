/**
 * Local verification for the GitHub Pages build.
 *
 * It runs the production build with the same base path the deployment workflow
 * uses, serves `dist/` under that base with a tiny static server, and requests
 * the page and every local asset referenced by `index.html`.
 *
 * Usage:
 *   npm run verify:pages               # base from the project folder name
 *   npm run verify:pages -- my-repo    # explicit repository name
 *   VITE_BASE_PATH=/my-repo/ npm run verify:pages
 *
 * Node built-ins only: no dependency is added for this check.
 */
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, extname, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolvePath(fileURLToPath(new URL('..', import.meta.url)))
const distDir = resolvePath(projectRoot, 'dist')
const requestedBase = process.argv[2] ?? process.env.VITE_BASE_PATH ?? basename(projectRoot)
const base = normalizeBase(requestedBase)

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
}

function normalizeBase(rawBase) {
  const trimmed = rawBase.trim()
  if (!trimmed || trimmed === '/') {
    return '/'
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

function fail(message) {
  throw new Error(message)
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)
}

/**
 * Reads every `src` declared by the asset catalog. The catalog uses a
 * `${FINAL}` prefix for the final artwork folder; direct public-relative paths
 * are also accepted. This checks the source declarations against the built
 * `dist/` output, so a missing WebP cannot pass just because the page loaded.
 */
function declaredImagePaths() {
  const catalogPath = resolvePath(projectRoot, 'src/domain/assets.ts')
  const source = readFileSync(catalogPath, 'utf8')
  const paths = new Set()

  for (const match of source.matchAll(/src:\s*`\$\{FINAL\}([^`]+)`/g)) {
    paths.add(`assets/final/${match[1]}`)
  }

  for (const match of source.matchAll(/src:\s*'([^']+)'/g)) {
    if (!isExternalReference(match[1])) {
      paths.add(match[1].replace(/^\/+/, ''))
    }
  }

  return [...paths].sort()
}

function contentTypeFor(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Artwork filenames that the primary shell must keep referencing after the
 * production build: brand logo, page backdrop, calendar banner, both door
 * states, star tree, mission frame and album book. A missing filename means a
 * shell surface no longer points at its final asset, even if the file is still
 * present in `dist/`.
 */
const SHELL_ASSET_FILES = [
  'logo_personajes.webp',
  'pueblo_horizontal.webp',
  'pueblo_vertical.webp',
  'taller_horizontal.webp',
  'taller_vertical.webp',
  'marco_calendario.webp',
  'puerta_cerrada.webp',
  'puerta_abierta.webp',
  'arbol_estrellas.webp',
  'marco_general.webp',
  'libro_album.webp',
]

/** Reads the bundled JavaScript and returns the shell artwork still missing. */
function missingShellReferences() {
  const assetsDir = resolvePath(distDir, 'assets')
  const bundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => readFileSync(resolvePath(assetsDir, fileName), 'utf8'))
    .join('\n')

  return SHELL_ASSET_FILES.filter((fileName) => !bundle.includes(fileName))
}

function createDistServer() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')

    // Mirrors GitHub Pages: the project root without a trailing slash redirects.
    if (url.pathname === base.slice(0, -1)) {
      response.writeHead(301, { location: base })
      response.end()
      return
    }

    if (!url.pathname.startsWith(base)) {
      response.writeHead(404)
      response.end('Not found')
      return
    }

    const relativePath = url.pathname.slice(base.length) || 'index.html'
    const filePath = resolvePath(distDir, relativePath)

    if (!filePath.startsWith(`${distDir}${sep}`) || !existsSync(filePath)) {
      response.writeHead(404)
      response.end('Not found')
      return
    }

    response.writeHead(200, { 'content-type': contentTypeFor(filePath) })
    response.end(readFileSync(filePath))
  })
}

let server = null

try {
  console.log(`Building with VITE_BASE_PATH=${base}`)
  const buildCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const build = spawnSync(buildCommand, ['run', 'build'], {
    cwd: projectRoot,
    env: { ...process.env, VITE_BASE_PATH: base },
    stdio: 'inherit',
  })

  if (build.status !== 0) {
    fail(`npm run build exited with status ${build.status ?? 'unknown'}.`)
  }

  const indexPath = resolvePath(distDir, 'index.html')
  if (!existsSync(indexPath)) {
    fail('dist/index.html was not produced.')
  }

  const html = readFileSync(indexPath, 'utf8')
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !isExternalReference(reference))

  if (references.length === 0) {
    fail('No local asset references were found in dist/index.html.')
  }

  const outsideBase = references.filter((reference) => !reference.startsWith(base))
  if (outsideBase.length > 0) {
    fail(`These references do not use the ${base} base: ${outsideBase.join(', ')}`)
  }

  const declaredAssets = declaredImagePaths()

  if (declaredAssets.length === 0) {
    fail('The asset catalog did not declare any image paths.')
  }

  const missingBuiltAssets = declaredAssets.filter(
    (assetPath) => !existsSync(resolvePath(distDir, assetPath)),
  )

  if (missingBuiltAssets.length > 0) {
    fail(
      `The asset catalog declares files that are missing from dist/: ${missingBuiltAssets.join(', ')}`,
    )
  }

  const missingShellAssets = missingShellReferences()

  if (missingShellAssets.length > 0) {
    fail(
      `The production bundle no longer references these shell final assets: ${missingShellAssets.join(', ')}`,
    )
  }

  const requestedPaths = [...new Set([
    base,
    ...references,
    ...declaredAssets.map((assetPath) => `${base}${assetPath}`),
  ])]

  server = createDistServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address()
  const origin = `http://127.0.0.1:${port}`

  for (const pathname of requestedPaths) {
    const response = await fetch(`${origin}${pathname}`)
    await response.arrayBuffer()

    if (!response.ok) {
      fail(`${pathname} returned HTTP ${response.status}.`)
    }
  }

  console.log(
    `Verified ${requestedPaths.length} URLs under ${origin}${base} (${declaredAssets.length} catalog images).`,
  )
  console.log(
    `The production bundle references the ${SHELL_ASSET_FILES.length} primary shell final assets.`,
  )
  console.log('The Pages base path, local assets and every declared catalog image resolve correctly.')
} catch (error) {
  console.error(`verify:pages failed: ${error.message}`)
  process.exitCode = 1
} finally {
  server?.close()
}
