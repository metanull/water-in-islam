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
| `@metanull/viewer-core` | application engine (routing, data access, the text runtime and the language service) |
| `@metanull/viewer-i18n` | the texts shared with the other MWNF websites (this one receives the `exhibition` bundle: `core` + `layout` + `exhibition`) |
| `@metanull/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

Because the data package is private, every `npm install` needs authenticated
access to GitHub Packages. In CI there is nothing to configure: the package
grants this repository Read under *Manage Actions access*, so the workflow's
built-in `github.token` can install it — no secret, no PAT. Locally, each
developer authenticates for themselves, with
`npm login --registry=https://npm.pkg.github.com` or a personal `~/.npmrc`; the
Docker preview mounts that `~/.npmrc` read-only.

---

## What is where

| Path | Contents |
| --- | --- |
| `src/dataset.config.js` | the whole website declaration: dataset package, languages, page shell, the route map |
| `src/SiteShell.vue` | the exhibition chrome — header, banner, navigation, bottom banner, sponsor logos, footer — wrapped around `PageShell` |
| `src/views/` | one component per page of the exhibition |
| `src/components/` | the pieces shared between pages (object grid, pagination, banners, logo strip, partner map) |
| `src/composables/` | data access over the package: exhibition and theme data, collection search, timeline, glossary |
| `locales/` | this exhibition's own texts, editable by translators (see below) |
| `theme/` | the visual identity: `tokens.css`, `overrides.css`, `assets/` |

### One build, one language

`exhibition.languages_enabled` is what this deployment publishes — English
alone here — and the site is built for it. An exhibition ships **one build per
enabled language** rather than switching between them at runtime, which is why
the header carries no language switcher. The item sheet and the partner profile
still offer every language the *record* itself carries, exactly as the legacy
client did.

### Two layers, one merge rule

The texts every MWNF exhibition shares — the menu, the item-sheet labels, the
introductions to the Collection, the Partners and the Timeline — come from
[`viewer-i18n`](https://github.com/metanull/viewer-i18n) as the `exhibition`
bundle. `locales/` holds only what belongs to *this* exhibition, and may
overload any shared entry by spelling out the same name. Today that is one
entry, `waterInIslam.credits.body`: the credits name this exhibition's own
curators and authors, so there is nothing generic to inherit.

The local file is applied last. **Local wins** — that is the only merge rule in
the system. An exhibition cannot delete a shared entry; leaving it out means
inheriting it.

There used to be a second, vendored catalogue under `src/i18n/` and a
`useUiStrings.js` composable with its own language state beside viewer-core's.
Both are gone, and so is the hand-written code that kept the two in step.

## Development

The preview runs in Docker; nothing needs to be installed on the host.

```bash
docker compose up
```

Log in to GitHub Packages once on your own machine — `npm login
--registry=https://npm.pkg.github.com --scope=@metanull` — and the preview reads
that login. Nothing in this repository holds a token. Then open
<http://localhost:5173>.

`npm run build`, `npm run test` and `npm run lint` are the three checks CI runs
(build and test are blocking).

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
**this exhibition's own texts**, one file per language — `en.json` is English.

Texts shared with the other MWNF exhibitions — the menu, the labels of an item
sheet, the introductions to the Collection and the Timeline — are not here:
they live in [`viewer-i18n`](https://github.com/metanull/viewer-i18n) and are
edited there, the same way. This exhibition can override any of them by writing
the same entry name in its own file. The museum content itself arrives already
translated in the dataset and is not edited anywhere.

1. **Open the folder** `locales/` on this repository's GitHub page and click
   the language file you want to change.
2. **Click the pencil** (✏️, top right). Change only the text between the
   second pair of quotation marks on a line — the part before the colon is the
   name of the entry and must stay exactly as it is.
3. **To start a new language**, copy all of `en.json`, create a file named with
   the two-letter language code, paste and translate. A language does not have
   to be complete: anything untranslated shows in English.
4. **Click "Commit changes…" then "Propose changes".**
5. **Wait for the automatic check.** A green tick means your change goes live
   by itself a few minutes later. If something is off, a comment appears
   explaining in plain language what to fix.

A text is **just text**, formatted with Markdown if you want: `**bold**`,
`*italic*`, `[a link](https://example.org)`. It may not contain HTML tags, and
it may not contain `{` or `}` — nothing is ever inserted into a text, so a
number or a date is placed next to it by the website rather than inside it.

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
