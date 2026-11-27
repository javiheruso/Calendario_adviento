import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Resolves Vite's `base` from `VITE_BASE_PATH`.
 *
 * GitHub Pages serves a project site under `https://<owner>.github.io/<repo>/`,
 * so the deployment workflow sets `VITE_BASE_PATH` to `/<repo>/`. The value is
 * normalised to always start and end with a slash.
 *
 * With no value the build keeps the portable relative base, which works at a
 * domain root and during local `dev`/`preview`.
 */
export function resolveBase(rawBase: string | undefined): string {
  if (!rawBase) {
    return './'
  }

  const trimmed = rawBase.trim()
  if (!trimmed || trimmed === '/') {
    return '/'
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig({
  base: resolveBase(process.env.VITE_BASE_PATH),
  plugins: [react()],
})
