# Water in Islam

The **Museum With No Frontiers — Water in Islam** online exhibition
("And We Made from Water Every Living Thing"): the themed exhibition tour, the
collection and its database, partners and contributing institutions, further
reading, and the item sheets themselves — built from the published dataset.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@metanull` packages from GitHub Packages:

| Package | Role |
| --- | --- |
| `@metanull/water-in-islam-data` | the dataset (JSON + `manifest.json`, **private**) |
| `@metanull/viewer-core` | application engine (routing, data access, i18n) |
| `@metanull/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

Because the data package is private, every `npm install` needs authenticated
access to GitHub Packages. In CI there is nothing to configure: the package
grants this repository Read under *Manage Actions access*, so the workflow's
built-in `github.token` can install it — no secret, no PAT. Locally, each
developer authenticates for themselves, with
`npm login --registry=https://npm.pkg.github.com` or a personal `~/.npmrc`; the
Docker preview reads the token from `.env`.

---

## What is where

| Path | Contents |
| --- | --- |
| `src/dataset.config.js` | the whole website declaration: dataset package, languages, page shell, the route map |
| `src/SiteShell.vue` | the exhibition chrome — header, banner, navigation, bottom banner, sponsor logos, footer — wrapped around `PageShell` |
| `src/views/` | one component per page of the exhibition |
| `src/components/` | the pieces shared between pages (object grid, pagination, banners, logo strip, partner map) |
| `src/composables/` | data access over the package: exhibition and theme data, collection search, timeline, glossary, UI strings |
| `src/i18n/` | the MWNF exhibition message catalogues, vendored from `scripts/site-i18n` in the inventory monorepo |
| `locales/` | interface texts of the shell itself, editable by translators (see below) |
| `theme/` | the visual identity: `tokens.css`, `overrides.css`, `assets/` |

### One build, one language

`exhibition.languages_enabled` is what this deployment publishes — English
alone here — and the site is built for it. An exhibition ships **one build per
enabled language** rather than switching between them at runtime, which is why
the header carries no language switcher. The item sheet and the partner profile
still offer every language the *record* itself carries, exactly as the legacy
client did.

### Two message sources, on purpose

`locales/` holds the small set of chrome strings the platform itself defines
(`chrome.*`, `layout.*`) and is the file a translator edits in the browser.
`src/i18n/` holds the MWNF exhibition catalogues — the item-sheet field labels
and the curated introductory texts — vendored rather than translated here, with
English as the fallback exactly as in the legacy client.

## Development

The preview runs in Docker; nothing needs to be installed on the host.

```bash
docker compose up
```

Copy `.env.example` to `.env` first and paste a GitHub Packages read token
after `NODE_AUTH_TOKEN=`. Then open <http://localhost:5173>.

`npm run build`, `npm run test` and `npm run lint` are the three checks CI runs
(build and test are blocking).

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
the interface texts, one file per language — `en.json` is English. The museum
content itself arrives already translated in the dataset and is not edited
here.

1. **Open the folder** `locales/` on this repository's GitHub page and click
   the language file you want to change.
2. **Click the pencil** (✏️, top right). Change only the text between the
   second pair of quotation marks on a line — the part before the colon is the
   identifier and must stay exactly as it is. Pieces in curly braces like
   `{page}` are filled in automatically: keep them, but you may move them
   within the sentence.
3. **To start a new language**, copy all of `en.json`, create a file named with
   the two-letter language code, paste and translate.
4. **Click "Commit changes…" then "Propose changes".**
5. **Wait for the automatic check.** A green tick means your change goes live
   by itself a few minutes later. If something is off, a comment appears
   explaining in plain language what to fix.

## Webdesigner — theming the website

The whole visual identity lives in `theme/`: `tokens.css` (colours, fonts,
spacing — the normal surface), `overrides.css` (escape hatch) and `assets/`.
The exhibition platform's scheme is a black/white base plus one accent colour;
the accent is the value that distinguishes one exhibition from its siblings.
Follow the same pencil-button flow as above for small changes, or run the
Docker preview for real design work. A change to a layout component itself is a
request for the `viewer-layout` package — open an issue there.

## Deployment

Every push to `main` builds and publishes the site to
<https://metanull.github.io/water-in-islam/> through the reusable workflows in
[`metanull/viewer-workflows`](https://github.com/metanull/viewer-workflows).
The base path comes from `BASE_PATH` at build time and defaults to the
repository name.
