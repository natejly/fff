import { writeFile } from "node:fs/promises";

const center = { lat: 40.7069, lng: -74.0113 };
const radiusMiles = 1;
const radiusMeters = Math.round(radiusMiles * 1609.34);
const outputUrl = new URL("./fidi-restaurants.json", import.meta.url);
const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#0891b2", "#ca8a04"];
const endpoints = [
  process.env.OVERPASS_API_URL,
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
].filter(Boolean);

const query = `
  [out:json][timeout:60];
  (
    nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"](around:${radiusMeters},${center.lat},${center.lng});
    nwr["shop"~"^(bakery|deli|pastry|coffee|confectionery)$"]["name"](around:${radiusMeters},${center.lat},${center.lng});
  );
  out center tags;
`;

function colorForId(id) {
  const total = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function formatAddress(tags = {}) {
  if (tags["addr:full"]) return tags["addr:full"];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const area = [tags["addr:city"], tags["addr:state"], tags["addr:postcode"]]
    .filter(Boolean)
    .join(", ");
  return [street, area].filter(Boolean).join(", ");
}

function cuisineFor(tags = {}) {
  if (tags.cuisine) {
    return tags.cuisine
      .split(";")
      .map((item) => item.replaceAll("_", " "))
      .slice(0, 2)
      .join(", ");
  }
  return (tags.amenity || tags.shop || "restaurant").replaceAll("_", " ");
}

function normalize(element) {
  const tags = element.tags || {};
  const id = `osm-${element.type}-${element.id}`;
  const image = tags.image || tags.logo;

  return {
    id,
    source: "openstreetmap",
    shop: tags.name,
    address: formatAddress(tags),
    cuisine: cuisineFor(tags),
    lat: element.lat ?? element.center?.lat,
    lng: element.lon ?? element.center?.lon,
    color: colorForId(id),
    imageUrl:
      image?.startsWith("http://") || image?.startsWith("https://") ? image : null,
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    bowls: [],
    menu: [],
  };
}

async function fetchElements() {
  const failures = [];

  for (const endpoint of [...new Set(endpoints)]) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "User-Agent": "fidi-lunch/1.0",
        },
        body: query,
        signal: AbortSignal.timeout(90000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { endpoint, elements: data.elements || [] };
    } catch (error) {
      failures.push(`${endpoint}: ${error.message}`);
    }
  }

  throw new Error(`Every Overpass endpoint failed:\n${failures.join("\n")}`);
}

const { endpoint, elements } = await fetchElements();
const restaurants = elements
  .filter(
    (element) =>
      element.tags?.name &&
      (element.lat || element.center?.lat) &&
      (element.lon || element.center?.lon) &&
      (element.lon ?? element.center?.lon) < -74,
  )
  .map(normalize)
  .sort((a, b) => a.shop.localeCompare(b.shop));

if (restaurants.length < 100) {
  throw new Error(`Refusing to replace the seed with only ${restaurants.length} places`);
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: endpoint,
  center,
  radiusMiles,
  count: restaurants.length,
  restaurants,
};

await writeFile(outputUrl, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Seeded ${restaurants.length} FiDi food venues from ${endpoint}`);
