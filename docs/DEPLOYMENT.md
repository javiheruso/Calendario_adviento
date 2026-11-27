# Deploy to GitHub Pages

The app is a static Vite build with no backend, so GitHub Pages can host it directly. A GitHub Actions workflow builds `dist/` with `npm ci` and publishes it with the official Pages actions. Nothing in the repository was committed, pushed, authenticated or deployed for this setup.

## Quick path

1. Run the local Pages check: `npm run verify:pages -- <repository-name>`.
2. Create the GitHub repository and push the project (commands below, not executed here).
3. Open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
4. Push to `main` or run the workflow manually from **Actions**.
5. Open the URL printed by the `deploy` job and complete the HTTPS/browser checks.

## What the workflow does

`.github/workflows/deploy-pages.yml` runs on pushes to `main` or `master` and on manual dispatch.

| Step | Action | Purpose |
|------|--------|---------|
| Checkout | `actions/checkout@v7` | Reads the repository |
| Node | `actions/setup-node@v7` (Node 24, npm cache) | Reproducible toolchain |
| Install | `npm ci` | Installs exactly `package-lock.json` |
| Build | `npm run build` with `VITE_BASE_PATH=/<repository>/` | Type-checks and writes `dist/` |
| Upload | `actions/upload-pages-artifact@v5` (`path: dist`) | Packages the static site |
| Deploy | `actions/deploy-pages@v5` | Publishes the artifact to Pages |

Permissions are the minimum required: `contents: read`, `pages: write` and `id-token: write`. The `pages` concurrency group allows one deployment at a time and does not cancel a deployment already in progress.

Action majors were checked against their latest releases on 2026-11-27. Review them when GitHub announces a new major.

## Base path and repository renames

GitHub Pages project sites are served from `https://<owner>.github.io/<repository>/`, so asset URLs must include the repository segment.

| Situation | Build base | Action needed |
|-----------|------------|---------------|
| Project site, default setup | `/<repository>/` from `github.event.repository.name` | None |
| Repository renamed | New `/<repository>/` is derived automatically | None; the Pages URL and local bookmark change |
| User/organization site (`<owner>.github.io`) | `/` | Set `VITE_BASE_PATH: /` on the build step |
| Custom domain | `/` | Set `VITE_BASE_PATH: /` on the build step |
| Local development or portable build | `./` when `VITE_BASE_PATH` is unset | None |

`vite.config.ts` normalises the value, so `my-repo`, `/my-repo` and `/my-repo/` all produce `/my-repo/`. The public asset resolver already uses `import.meta.env.BASE_URL`, so artwork under `public/` follows the same base.

To override the base for a non-project site, edit the build step:

```yaml
      - name: Build static site
        run: npm run build
        env:
          VITE_BASE_PATH: /
```

## First-time repository setup

These commands are documentation only; they were not run in this session. Replace `<owner>` and `<repository>`.

```bash
cd /path/to/calendario_adviento
git add .
git commit -m "chore: initial project import"
git branch -M main
git remote add origin git@github.com:<owner>/<repository>.git
git push -u origin main
```

Use HTTPS remote URLs with a credential helper or SSH keys according to your account setup. Do not commit `dist/`, `node_modules/` or `test/.build/`; they are already git-ignored. The workflow builds them in CI.

After the repository exists, enable Pages:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages** and run the workflow, or push a new commit.

If the first push happened before Pages was enabled, the build and artifact upload can succeed while the deploy job fails. Enable Pages, then re-run the workflow; no code change is needed.

No `gh auth`, repository creation, commit, push or deployment is part of this task.

## HTTPS and browser capability checks

GitHub Pages serves `*.github.io` over HTTPS and offers **Enforce HTTPS** in **Settings → Pages** once the certificate is ready. A custom domain needs its DNS records and certificate first. HTTPS matters here because the app uses browser APIs that require a secure context:

| Capability | Used by | Expected on Pages |
|------------|---------|-------------------|
| Web Crypto `crypto.subtle` (PBKDF2-SHA-256) | Parental PIN creation and verification | Available; PIN setup works |
| `getUserMedia` / `MediaRecorder` | Day 7 recording, album photo capture | Available; the browser prompts for permission |
| IndexedDB | Private album metadata and blobs | Available; album save and reload work |
| `navigator.storage.persist()` | Storage durability request | May be unsupported or denied; the album reports it |
| Web Audio API | Music, voice and effects | Available after a user gesture |

`http://localhost` is also a secure context, so local checks behave like production. A plain `http://` deployment is not supported for camera or PIN features.

Run this in the browser console on the deployed page:

```js
({
  secureContext: window.isSecureContext,
  crypto: Boolean(window.crypto?.subtle),
  camera: Boolean(navigator.mediaDevices?.getUserMedia),
  mediaRecorder: typeof MediaRecorder !== 'undefined',
  indexedDb: Boolean(window.indexedDB),
  persistentStorage: Boolean(navigator.storage?.persist),
})
```

`secureContext`, `crypto`, `camera`, `mediaRecorder` and `indexedDb` should be `true`. `persistentStorage` may be `false`; that is a best-effort capability.

Then verify the real flows:

1. Open **Zona de adultos**, create a PIN and reload. The PIN must still unlock; this proves Web Crypto and `localStorage`.
2. Enable the camera in the adult panel, open the album, take a photo and save it. Reload and reopen the album; this proves IndexedDB.
3. Open day 7 with recording enabled and confirm the camera/microphone prompt, preview and cleanup after leaving.
4. Deny the camera permission once and confirm the mission and album import still work.
5. Check that the padlock is present and that the browser makes no application network requests beyond loading the static assets.

Browser storage is scoped by origin (scheme + host), not by path. Renaming the repository keeps the Pages origin and the existing progress/album. Moving to another owner or a custom domain creates a new origin with empty storage. Two copies of the app served from different repositories under the same `*.github.io` owner share the same origin, so run a single copy per owner if the data must stay separate.

## Local verification

```bash
npm ci
npm run verify:pages -- <repository-name>
npm run build
npm test
npm run lint
```

`npm run verify:pages` builds with the Pages base, serves `dist/` under `/<repository>/` with a temporary local HTTP server and requests the page plus every local asset referenced by `index.html`. It exits non-zero if a reference escapes the base or returns a non-200 status. Without an argument it uses the project folder name.

`npm run build` without `VITE_BASE_PATH` keeps the relative base and still works for local preview. `npm test` and `npm run lint` are independent of the deployment. To preview the exact Pages artifact after the check, run `VITE_BASE_PATH=/<repository>/ npm run preview` and open the printed sub-path.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank page, assets return 404 | Build base does not match the Pages path | Run `npm run verify:pages -- <repository>`; check the `VITE_BASE_PATH` value in the workflow |
| Deploy job fails with a Pages error | Pages source is not GitHub Actions | Set **Settings → Pages → Source** to **GitHub Actions** and re-run |
| Deploy fails with a permission error | Organization policy blocks the token permissions | Allow Pages deployment/read-write workflow permissions for the repository |
| Camera prompt never appears | Not a secure context, or permission already denied | Use the HTTPS Pages URL; reset the site permission in the browser settings |
| PIN cannot be created | `crypto.subtle` unavailable | Confirm `window.isSecureContext` and the HTTPS URL |
| Album is empty after a redeploy | Different origin, browser or cleared storage | Use the same origin and browser; export the album before clearing data |
| Old site still shown | Deployment still running or browser cache | Check the latest Actions run, then hard-refresh |

No `.nojekyll` file is needed: the Actions artifact deployment does not run Jekyll. No `404.html` fallback is needed today because the app has no client-side router; add one only if routing is introduced.

## Checklist

- [ ] Repository pushed with `dist/`, `node_modules/` and `test/.build/` excluded.
- [ ] Pages source set to **GitHub Actions**.
- [ ] Workflow run is green and the `deploy` job prints the site URL.
- [ ] `npm run verify:pages -- <repository>` passes locally.
- [ ] `npm run build`, `npm test` and `npm run lint` pass locally.
- [ ] HTTPS padlock is present and **Enforce HTTPS** is enabled when available.
- [ ] PIN, album save and camera flows work on the deployed URL.
- [ ] The app makes no backend, upload or telemetry requests.
