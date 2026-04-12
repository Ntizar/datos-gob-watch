import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataPath = path.join(projectRoot, "data", "latest.json");

const PAGE_SIZE = 50;
const MAX_ITEMS = 24;
const API_BASE = "https://datos.gob.es/apidata/catalog/dataset";

const preferredFormats = new Set(["CSV", "JSON", "GEOJSON", "XLSX", "XLS", "XML", "RDF"]);
const preferredThemes = [
  "transporte",
  "movilidad",
  "vivienda",
  "energia",
  "empleo",
  "turismo",
  "salud",
  "contratacion",
  "medio-ambiente",
  "environment",
  "economia",
  "urbanismo",
  "educacion"
];

function toWindow(days = 7) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    start,
    end,
    startApi: formatApiDate(start),
    endApi: formatApiDate(end)
  };
}

function formatApiDate(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 16)}Z`;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function pickLabel(value) {
  if (Array.isArray(value)) {
    const spanish = value.find((entry) => entry && entry._lang === "es" && entry._value);
    if (spanish) return spanish._value;
    const first = value.find((entry) => entry && entry._value);
    if (first) return first._value;
  }

  if (value && typeof value === "object" && "_value" in value) {
    return value._value;
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function uriTail(value) {
  if (typeof value !== "string") return "";
  const parts = value.split(/[\/#]/).filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

function formatLabelFromTail(value) {
  const tail = uriTail(value);
  return tail.replace(/-/g, " ").replace(/_/g, " ");
}

function formatName(value) {
  if (!value) return "Sin dato";
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeFormat(value) {
  return formatName(formatLabelFromTail(value)).toUpperCase();
}

function inferFormat(distribution) {
  const explicit = normalizeFormat(distribution.format);
  if (explicit && explicit !== "SIN DATO") return explicit;

  const candidates = [distribution.accessURL, distribution.downloadURL, pickLabel(distribution.title)]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  const knownFormats = ["GEOJSON", "JSON", "JSONP", "CSV", "XLSX", "XLS", "XML", "RDF", "TTL"];

  for (const candidate of candidates) {
    for (const format of knownFormats) {
      if (candidate.includes(`.${format}`) || candidate.endsWith(format)) {
        return format;
      }
    }
  }

  return "SIN DATO";
}

function normalizeDataset(item) {
  const distributions = normalizeList(item.distribution).map((distribution) => ({
    title: pickLabel(distribution.title) || "Distribucion",
    accessUrl: distribution.accessURL || distribution.downloadURL || "",
    format: inferFormat(distribution),
    identifier: distribution.identifier || ""
  }));

  const rawFormats = [...new Set(distributions.map((distribution) => distribution.format).filter(Boolean))];
  const formats = rawFormats.length > 1 ? rawFormats.filter((format) => format !== "SIN DATO") : rawFormats;
  const title = pickLabel(item.title) || item.identifier || "Dataset sin titulo";
  const description = pickLabel(item.description);
  const themes = normalizeList(item.theme).map((entry) => formatName(formatLabelFromTail(entry))).filter(Boolean);
  const keywords = normalizeList(item.keyword).map((entry) => pickLabel(entry)).filter(Boolean);
  const publisher = formatName(formatLabelFromTail(item.publisher));
  const spatial = formatName(formatLabelFromTail(item.spatial));
  const notes = buildNotes({ formats, themes, publisher, spatial, distributions });
  const score = computeScore({ formats, themes, distributions, publisher, spatial, keywords });

  return {
    id: item.identifier || uriTail(item._about) || title,
    title,
    description,
    issued: item.issued || "",
    modified: item.modified || "",
    publisher,
    spatial,
    themes,
    keywords: keywords.slice(0, 6),
    formats,
    datasetUrl: item._about || "",
    distributions: distributions.slice(0, 6),
    score,
    notes
  };
}

function computeScore({ formats, themes, distributions, publisher, spatial, keywords }) {
  let score = 0;

  for (const format of formats) {
    if (preferredFormats.has(format)) score += 10;
  }

  for (const theme of themes) {
    const normalized = theme.toLowerCase().replace(/\s+/g, "-");
    if (preferredThemes.some((entry) => normalized.includes(entry))) score += 12;
  }

  if (distributions.length >= 3) score += 8;
  if (publisher !== "Sin dato") score += 4;
  if (spatial !== "Sin dato") score += 3;
  if (keywords.length >= 3) score += 4;

  return Math.min(score, 100);
}

function buildNotes({ formats, themes, publisher, spatial, distributions }) {
  const notes = [];

  if (formats.some((format) => preferredFormats.has(format))) {
    notes.push("Incluye formatos reutilizables para prototipos y analisis.");
  }

  if (distributions.length >= 3) {
    notes.push("Tiene varias distribuciones, senal de dataset mantenido o explotable.");
  }

  if (themes.length > 0) {
    notes.push(`Tematicas detectadas: ${themes.slice(0, 3).join(", ")}.`);
  }

  if (publisher !== "Sin dato") {
    notes.push(`Publicador: ${publisher}.`);
  }

  if (spatial !== "Sin dato") {
    notes.push(`Cobertura geografica principal: ${spatial}.`);
  }

  return notes;
}

async function fetchPage(page, startApi, endApi) {
  const url = `${API_BASE}/modified/begin/${startApi}/end/${endApi}.json?_sort=-modified&_pageSize=${PAGE_SIZE}&_page=${page}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`datos.gob.es API error ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchWeeklyDatasets() {
  const { start, end, startApi, endApi } = toWindow(7);
  const datasets = [];

  for (let page = 0; page < 5; page += 1) {
    const payload = await fetchPage(page, startApi, endApi);
    const items = normalizeList(payload?.result?.items);

    if (items.length === 0) break;

    datasets.push(...items.map(normalizeDataset));

    if (!payload?.result?.next) break;
  }

  const ranked = datasets
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "es"))
    .slice(0, MAX_ITEMS);

  const topScore = ranked[0]?.score ?? 0;
  const summary = buildSummary(ranked, topScore);

  return {
    generatedAt: new Date().toISOString(),
    window: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: `Ultimos 7 dias`
    },
    source: {
      name: "datos.gob.es API",
      url: `${API_BASE}/modified/begin/${startApi}/end/${endApi}.json?_sort=-modified&_pageSize=${PAGE_SIZE}&_page=0`
    },
    summary,
    items: ranked
  };
}

function buildSummary(items, topScore) {
  const formatCounts = new Map();
  const themeCounts = new Map();

  for (const item of items) {
    for (const format of item.formats) {
      formatCounts.set(format, (formatCounts.get(format) ?? 0) + 1);
    }

    for (const theme of item.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
  }

  const topFormats = [...formatCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));

  const topThemes = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));

  return {
    totalReviewed: items.length,
    topScore,
    topFormats,
    topThemes,
    headline: items.length
      ? `Se han detectado ${items.length} datasets recientes con ${topFormats[0]?.label ?? "formatos reutilizables"} como formato dominante.`
      : "No se han detectado datasets recientes en la ventana actual."
  };
}

async function main() {
  const payload = await fetchWeeklyDatasets();
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stdout.write(`Updated ${path.relative(projectRoot, dataPath)} with ${payload.items.length} items.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
