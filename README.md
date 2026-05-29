# wip

A [Digital Garden](https://maggieappleton.com/garden-history) style website
built from an [Obsidian](https://obsidian.md/) vault, generated as a static
site and deployed to Cloudflare Workers.

The vault — personal notes on web design and development — is sourced from a
NAS, built locally into a static site, and published as a way to make my
knowledge, skills, and areas of interest visible to teammates and others.

> **Note:** The Obsidian vault is external (stored on a NAS) and is **not**
> included in this repository. Set its path via `VAULT_ROOT` (see below). CI
> and tests run against the mock vault in `tests/fixtures/`.

## Content types

Three kinds of content from a single Obsidian vault drive the site:

- **Notes** — Topical knowledge notes. Live at the vault root with a nested
  subfolder structure.
- **Glossary** — Word / term notes. Flat, under `Glossary/`.
- **Books** — Short notes on books read. Flat, under `Books/`; filenames are
  ISBNs.

Everything under `Clips/` and other miscellaneous files is excluded from the
site.

Publication is controlled per file via the optional frontmatter `status`
field: `published` (default) is public, while `draft` and `archived` are
excluded from the build. Internal links to non-public content are rendered as
plain text.

## Tech stack

- **Language**: TypeScript (`strict: true` plus additional strict options)
- **Framework**: TanStack Start (SSG mode)
- **UI**: react-aria-components
- **Styling**: StyleX
- **Markdown**: remark / unified ecosystem
- **Syntax highlighting**: Shiki (build-time)
- **Search**: Pagefind (client-side, indexed at build time)
- **Tests**: Vitest
- **Lint / format**: oxlint / oxfmt (with eslint for StyleX)
- **Package manager**: npm
- **Hosting**: Cloudflare Workers (Static Assets)

## Requirements

- Node.js >= 24 (see `.nvmrc`)
- npm

## Getting started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# then edit .env and set VAULT_ROOT (and SITE_URL for production builds)
```

`.env` keys:

| Key          | Description                                          |
| ------------ | ---------------------------------------------------- |
| `VAULT_ROOT` | Absolute path to the Obsidian vault root             |
| `SITE_URL`   | Public site URL, used by production builds            |

Site-level configuration lives in `site.config.ts`.

## Commands

```bash
# Dev server (vite dev)
npm run dev

# Production build (TanStack Start SSG prerender + image copy / sitemap / feed / pagefind)
npm run build

# Local preview of build output (vite preview)
npm run preview

# Deploy to Cloudflare Workers
npm run deploy
npm run deploy:dry       # wrangler deploy --dry-run
npm run deploy:preview   # wrangler dev (reproduces Workers Static Assets)

# Type check
npm run typecheck

# Tests (Vitest)
npm run test
npm run test:watch

# Lint (oxlint + eslint)
npm run lint

# Format (oxfmt)
npm run fmt
```

`dev` / `build` / `preview` require `VAULT_ROOT` to be set in `.env` (or as an
environment variable).

## URL structure

| URL                    | Content              |
| ---------------------- | -------------------- |
| `/`                    | Home                 |
| `/notes`               | Notes index          |
| `/notes/[slug]`        | Note detail          |
| `/notes/tags`          | Notes tag index      |
| `/notes/tags/[tag]`    | Notes by tag         |
| `/glossary`            | Glossary index       |
| `/glossary/[slug]`     | Glossary detail      |
| `/glossary/tags`       | Glossary tag index   |
| `/glossary/tags/[tag]` | Glossary by tag      |
| `/books`               | Books index          |
| `/books/[isbn]`        | Book detail          |
| `/books/tags`          | Books tag index      |
| `/books/tags/[tag]`    | Books by tag         |
| `/404`                 | Not Found            |

Slugs are filenames with the extension removed (Japanese filenames produce
Japanese URLs). There are no trailing slashes, and the Notes subfolder
hierarchy is flattened in URLs. Tag namespaces are separated per content type.

## Project layout

- `src/routes/` — TanStack Start routes (file-based routing)
- `src/components/` — UI components (layout / content / tree / card / common)
- `src/lib/content/` — vault collection, parsing, and validation
- `src/lib/markdown/` — Markdown transform pipeline (plugins)
- `src/lib/linkgraph/` — link resolution and backlink building
- `src/lib/search/`, `src/lib/feed/`, `src/lib/config/` — supporting features
- `src/styles/` — StyleX theme tokens
- `src/types/` — shared type definitions
- `tests/fixtures/` — mock vault for tests

## Documentation

- [`SPEC.md`](./SPEC.md) — overall specification
- [`docs/content-spec.md`](./docs/content-spec.md) — content spec (frontmatter schema, Markdown extensions)
- [`docs/ui-spec.md`](./docs/ui-spec.md) — UI spec (layouts, pages, responsive behavior)
- [`docs/build-spec.md`](./docs/build-spec.md) — build spec (pipeline, config, link resolution)
- [`docs/architecture.md`](./docs/architecture.md) — architecture (tech choices, directory layout, data flow)
- [`docs/implementation-log.md`](./docs/implementation-log.md) — implementation log and handoff notes
- [`CLAUDE.md`](./CLAUDE.md) — project guide for Claude Code

## License

See [`LICENSE`](./LICENSE).
