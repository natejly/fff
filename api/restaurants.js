import { readFileSync } from "node:fs";

const seedSnapshot = JSON.parse(
  readFileSync(new URL("../server/fidi-restaurants.json", import.meta.url), "utf8"),
);
const seededRestaurants = seedSnapshot.restaurants || [];
const fidiCenter = seedSnapshot.center || { lat: 40.7069, lng: -74.0113 };
const providerColors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#0891b2", "#ca8a04"];
const overpassUrls = [
  process.env.OVERPASS_API_URL,
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
].filter(Boolean);

function distanceMiles(a, b) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthMiles = 3958.8;
  const latitudeDistance = toRadians(b.lat - a.lat);
  const longitudeDistance = toRadians(b.lng - a.lng);
  const latitudeA = toRadians(a.lat);
  const latitudeB = toRadians(b.lat);
  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDistance / 2) ** 2;
  return 2 * earthMiles * Math.asin(Math.sqrt(haversine));
}

function withDistance(restaurants, location) {
  return restaurants
    .map((restaurant) => ({
      ...restaurant,
      distance: Number(distanceMiles(location, restaurant).toFixed(2)),
    }))
    .sort((a, b) => a.distance - b.distance);
}

function colorForId(id) {
  const total = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return providerColors[total % providerColors.length];
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

function normalizeElement(element, location) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const id = `osm-${element.type}-${element.id}`;
  const image = tags.image || tags.logo;

  return {
    id,
    source: "openstreetmap",
    shop: tags.name,
    address: formatAddress(tags),
    cuisine: cuisineFor(tags),
    lat,
    lng,
    color: colorForId(id),
    distance: Number(distanceMiles(location, { lat, lng }).toFixed(2)),
    imageUrl:
      image?.startsWith("http://") || image?.startsWith("https://") ? image : null,
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    bowls: [],
    menu: [],
  };
}

async function fetchLiveRestaurants(location, radiusMiles) {
  const radiusMeters = Math.max(100, Math.min(radiusMiles * 1609.34, 5000));
  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"](around:${radiusMeters},${location.lat},${location.lng});
      nwr["shop"~"^(bakery|deli|pastry|coffee|confectionery)$"]["name"](around:${radiusMeters},${location.lat},${location.lng});
    );
    out center tags;
  `;
  const failures = [];

  for (const endpoint of [...new Set(overpassUrls)]) {
    try {
      const result = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "User-Agent": "fidi-lunch/1.0",
        },
        body: query,
        signal: AbortSignal.timeout(9000),
      });
      if (!result.ok) throw new Error(`HTTP ${result.status}`);

      const data = await result.json();
      return (data.elements || [])
        .filter(
          (element) =>
            element.tags?.name &&
            (element.lat || element.center?.lat) &&
            (element.lon || element.center?.lon),
        )
        .map((element) => normalizeElement(element, location))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      failures.push(`${endpoint}: ${error.message}`);
    }
  }

  throw new Error(failures.join("; "));
}

function numberFromQuery(value, fallback) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const location = {
    lat: numberFromQuery(request.query.lat, 40.7104),
    lng: numberFromQuery(request.query.lng, -74.0119),
  };
  const radius = Math.max(0.1, Math.min(numberFromQuery(request.query.radius, 0.75), 3));
  const isNearFidi = distanceMiles(location, fidiCenter) <= 0.5;

  response.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );

  if (isNearFidi) {
    const ordered = withDistance(seededRestaurants, location);
    response.status(200).json({
      provider: "openstreetmap-seed",
      restaurants: ordered.filter((restaurant) => restaurant.distance <= radius),
      allRestaurants: ordered,
      center: location,
      seedGeneratedAt: seedSnapshot.generatedAt,
    });
    return;
  }

  try {
    const restaurants = await fetchLiveRestaurants(location, radius);
    response.status(200).json({
      provider: "openstreetmap-live",
      restaurants,
      allRestaurants: restaurants,
      center: location,
    });
  } catch (error) {
    const ordered = withDistance(seededRestaurants, location);
    response.status(200).json({
      provider: "openstreetmap-seed-fallback",
      restaurants: ordered.filter((restaurant) => restaurant.distance <= radius),
      allRestaurants: ordered,
      center: location,
      warning: "Live restaurant search was unavailable",
    });
  }
}
