# Datos Gob Watch

Web estatica que revisa cada semana novedades del catalogo de `datos.gob.es` y destaca datasets interesantes para construir proyectos.

## Que hace
- consulta datasets modificados recientemente desde la API publica
- calcula una puntuacion simple de interes
- genera `data/latest.json`
- publica una pagina estatica en GitHub Pages

## Stack
- Node.js
- HTML, CSS y JavaScript sin framework
- GitHub Actions
- GitHub Pages

## Desarrollo local
```bash
npm run build
```

Esto actualiza `data/latest.json`.

## Fuente de datos
- API REST de datos.gob.es
- endpoint base: `https://datos.gob.es/apidata/catalog/dataset.json`
- endpoint semanal recomendado: `https://datos.gob.es/apidata/catalog/dataset/modified/begin/{YYYY-MM-DDTHH:mmZ}/end/{YYYY-MM-DDTHH:mmZ}.json?_sort=-modified&_pageSize=50&_page=0`

## Deploy
El workflow semanal actualiza el JSON y publica el repo en GitHub Pages.
