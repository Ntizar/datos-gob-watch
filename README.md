# Datos Gob Watch

> Radar semanal de datasets interesantes publicados o actualizados en `datos.gob.es`.

![Estado](https://img.shields.io/badge/status-live-2563eb)
![Pages](https://img.shields.io/badge/pages-activo-f97316)
![Stack](https://img.shields.io/badge/stack-node%20%2B%20html%20%2B%20css-0f1729)
![Frecuencia](https://img.shields.io/badge/refresh-semanal-16a34a)

`Tema Ntizar` · `GitHub Pages` · `Digest semanal` · `datos.gob.es`

## Enlaces

- GitHub: `https://github.com/Ntizar/datos-gob-watch`
- Pages: `https://ntizar.github.io/datos-gob-watch/`
- Design source: `https://github.com/Ntizar/Ntizar-Design`

## Snapshot

| Bloque | Valor |
|---|---|
| Sitio | `https://ntizar.github.io/datos-gob-watch/` |
| Fuente | API pública del catálogo de `datos.gob.es` |
| Output | `data/latest.json` + homepage estática |
| Runtime | Script Node + GitHub Actions |
| Objetivo | Detectar datasets reutilizables con potencial de producto |

## Qué Hace

- consulta datasets modificados en los últimos 7 días
- normaliza metadatos y formatos de distribución
- puntúa datasets con heurísticas simples de reutilización
- publica un resumen semanal compacto en GitHub Pages

## Por Qué Existe

La idea no es solo listar datasets. La idea es destacar datos que parezcan útiles para construir productos pequeños, prototipos o herramientas de interés público.

## Stack

| Capa | Elección |
|---|---|
| Fetch/build | Node.js |
| UI | HTML plano + `ntizar.css` |
| Deploy | GitHub Pages |
| Automatización | GitHub Actions |

## Ejecución Local

```bash
npm run build
```

Esto regenera `data/latest.json`.

## Flujo Principal

```text
datos.gob.es API
  -> scripts/fetch-weekly.mjs
  -> data/latest.json
  -> index.html
  -> GitHub Pages
```

## Archivos Principales

| Archivo | Rol |
|---|---|
| `scripts/fetch-weekly.mjs` | Fetch + normalización + ranking |
| `data/latest.json` | Payload generado del digest |
| `index.html` | Frontend estático con estilo Ntizar |
| `ntizar.css` | Capa visual sincronizada desde `Ntizar-Design` |
| `.github/workflows/weekly.yml` | Refresh semanal + deploy de Pages |

## Fuente de Datos

- endpoint base del catálogo:
  - `https://datos.gob.es/apidata/catalog/dataset.json`
- ventana semanal por modificados:
  - `https://datos.gob.es/apidata/catalog/dataset/modified/begin/{YYYY-MM-DDTHH:mmZ}/end/{YYYY-MM-DDTHH:mmZ}.json?_sort=-modified&_pageSize=50&_page=0`

## Heurísticas de Ranking

Suben más en ranking los datasets que traen:
- formatos reutilizables como `JSON`, `CSV`, `XML`, `GEOJSON`, `XLSX`
- temáticas con potencial de producto
- varias distribuciones
- metadatos razonablemente completos

## Encaje con Ntizar

Este repo usa el lenguaje visual Ntizar en una versión más ligera y editorial:
- base clara
- acentos azul/naranja
- panels compactos glass
- contraste legible para tarjetas con bastante contenido
