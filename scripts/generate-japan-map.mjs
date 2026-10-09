import { mkdir, writeFile } from "node:fs/promises";

// Natural Earth 5.1.2, public domain. Downloaded only when regenerating this file;
// the application renders the generated local data without external requests.
const source =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/";

async function load(name) {
  const response = await fetch(`${source}${name}.geojson`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}

const [countries, places] = await Promise.all([
  load("ne_50m_admin_0_countries"),
  load("ne_50m_populated_places"),
]);

const japan = countries.features.find(
  (feature) => feature.properties.ADM0_A3 === "JPN",
);
if (!japan || japan.geometry.type !== "MultiPolygon") {
  throw new Error("Japan's MultiPolygon was not found.");
}

const requestedCities = [
  { id: "sapporo", name: "Sapporo", japanese: "札幌", region: "Hokkaidō", island: "Hokkaidō", label: [22, 5] },
  { id: "tokyo", name: "Tokyo", japanese: "東京", region: "Kantō", island: "Honshū", label: [25, 5] },
  { id: "kyoto", name: "Kyoto", japanese: "京都", region: "Kansai", island: "Honshū", label: [-88, -43] },
  { id: "osaka", name: "Osaka", japanese: "大阪", region: "Kansai", island: "Honshū", label: [20, 37] },
  { id: "hiroshima", name: "Hiroshima", japanese: "広島", region: "Chūgoku", island: "Honshū", label: [-82, -23] },
  { id: "fukuoka", name: "Fukuoka", japanese: "福岡", region: "Kyūshū", island: "Kyūshū", label: [0, 50] },
];

const cities = requestedCities.map((city) => {
  const place = places.features.find(
    (feature) => feature.properties.ADM0_A3 === "JPN" && feature.properties.NAMEASCII === city.name,
  );
  if (!place) throw new Error(`Missing city: ${city.name}`);
  const [longitude, latitude] = place.geometry.coordinates;
  return { ...city, longitude, latitude };
});

const mainProjection = ([longitude, latitude]) => [
  135 + (longitude - 127) * 42.5 * Math.cos((37 * Math.PI) / 180),
  (46.5 - latitude) * 42.5,
];
const insetProjection = ([longitude, latitude]) => [
  16 + (longitude - 122) * 17,
  48 + (30 - latitude) * 20,
];

function pathFor(polygon, project) {
  return polygon.map((ring) => ring.map((point, index) => {
    const [x, y] = project(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join("") + "Z").join("");
}

// Distinguish the four main islands by a point known to be on each island.
function contains(ring, [longitude, latitude]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > latitude) !== (yj > latitude) &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const anchors = [
  { id: "hokkaido", name: "Hokkaidō", point: [143, 43] },
  { id: "honshu", name: "Honshū", point: [139, 36] },
  { id: "shikoku", name: "Shikoku", point: [133.5, 33.7] },
  { id: "kyushu", name: "Kyūshū", point: [131, 32.5] },
];

const islands = [];
const inset = [];
for (const polygon of japan.geometry.coordinates) {
  const isSouthwest = polygon[0].every(([longitude, latitude]) => longitude < 132 && latitude < 30.2);
  if (isSouthwest) {
    inset.push(pathFor(polygon, insetProjection));
    continue;
  }
  const anchor = anchors.find(({ point }) => contains(polygon[0], point));
  islands.push({
    id: anchor?.id ?? `island-${islands.length}`,
    name: anchor?.name ?? "Île du Japon",
    path: pathFor(polygon, mainProjection),
  });
}

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/japan-map.json", import.meta.url),
  JSON.stringify({ source: "Natural Earth 5.1.2 · 1:50m", cities, islands, inset }, null, 2) + "\n",
);
console.log(`Generated ${islands.length} island outlines, ${inset.length} inset outlines and ${cities.length} cities.`);
