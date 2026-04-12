# Datos Gob Watch

> Weekly watchtower for interesting datasets published or updated on `datos.gob.es`.

![Status](https://img.shields.io/badge/status-live-2563eb)
![Pages](https://img.shields.io/badge/pages-active-f97316)
![Stack](https://img.shields.io/badge/stack-node%20%2B%20html%20%2B%20css-0f1729)
![Schedule](https://img.shields.io/badge/refresh-weekly-16a34a)

`Ntizar theme` · `GitHub Pages` · `Weekly digest` · `datos.gob.es`

## Snapshot

| Block | Value |
|---|---|
| Site | `https://ntizar.github.io/datos-gob-watch/` |
| Source | `datos.gob.es` public catalog API |
| Output | `data/latest.json` + static homepage |
| Runtime | Node script + GitHub Actions |
| Goal | Spot reusable datasets with product potential |

## What It Does

- fetches datasets modified in the last 7 days
- normalizes metadata and distribution formats
- scores datasets with simple reuse heuristics
- publishes a compact weekly digest in GitHub Pages

## Why It Exists

The point is not just to list datasets. The point is to surface data that looks useful for building small products, prototypes or public-interest tools.

## Stack

| Layer | Choice |
|---|---|
| Fetch/build | Node.js |
| UI | Plain HTML + `ntizar.css` |
| Deploy | GitHub Pages |
| Automation | GitHub Actions |

## Local Run

```bash
npm run build
```

This refreshes `data/latest.json`.

## Core Flow

```text
datos.gob.es API
  -> scripts/fetch-weekly.mjs
  -> data/latest.json
  -> index.html
  -> GitHub Pages
```

## Main Files

| File | Role |
|---|---|
| `scripts/fetch-weekly.mjs` | Fetch + normalize + rank datasets |
| `data/latest.json` | Generated digest payload |
| `index.html` | Static Ntizar-styled frontend |
| `ntizar.css` | Synced design layer from `Ntizar-Design` |
| `.github/workflows/weekly.yml` | Weekly refresh + Pages deploy |

## Data Source

- base catalog endpoint:
  - `https://datos.gob.es/apidata/catalog/dataset.json`
- weekly modified window:
  - `https://datos.gob.es/apidata/catalog/dataset/modified/begin/{YYYY-MM-DDTHH:mmZ}/end/{YYYY-MM-DDTHH:mmZ}.json?_sort=-modified&_pageSize=50&_page=0`

## Ranking Heuristics

Datasets score higher when they include:
- reusable formats like `JSON`, `CSV`, `XML`, `GEOJSON`, `XLSX`
- themes with product potential
- multiple distributions
- decent metadata coverage

## Ntizar Fit

This repo uses the Ntizar visual language in a lighter, more editorial way:
- bright default canvas
- blue/orange accents
- compact glass panels
- readable contrast for data-heavy cards

## Repo Links

- Repo: `https://github.com/Ntizar/datos-gob-watch`
- Live site: `https://ntizar.github.io/datos-gob-watch/`
- Design source: `https://github.com/Ntizar/Ntizar-Design`
