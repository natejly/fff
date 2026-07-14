import express from "express";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 4177;

app.use(express.json());

const restaurants = [
  {
    id: "sweetgreen-wall",
    shop: "sweetgreen Wall Street",
    address: "67 Wall St",
    cuisine: "salads and warm bowls",
    rating: 4.6,
    wait: 9,
    lat: 40.7068,
    lng: -74.0086,
    color: "#4d8f5b",
    bowls: [
      {
        id: "sweetgreen-harvest",
        name: "Harvest Bowl",
        price: 15.95,
        likes: 87,
        orders: 34,
        tags: ["chicken", "sweet potato", "greens"],
      },
      {
        id: "sweetgreen-shroomami",
        name: "Shroomami",
        price: 14.95,
        likes: 61,
        orders: 21,
        tags: ["tofu", "wild rice", "miso sesame"],
      },
      {
        id: "sweetgreen-guacamole",
        name: "Guacamole Greens",
        price: 15.45,
        likes: 72,
        orders: 26,
        tags: ["chicken", "avocado", "lime cilantro"],
      },
    ],
    menu: [
      { section: "Bowls", items: ["Harvest Bowl", "Shroomami", "Chicken Pesto Parm"] },
      { section: "Salads", items: ["Guacamole Greens", "Kale Caesar", "Super Green Goddess"] },
      { section: "Add-ons", items: ["Hot honey chicken", "Roasted tofu", "Avocado"] },
    ],
  },
  {
    id: "dig-broad",
    shop: "DIG Broad Street",
    address: "80 Broad St",
    cuisine: "market bowls",
    rating: 4.7,
    wait: 11,
    lat: 40.7061,
    lng: -74.0112,
    color: "#bf6b3d",
    bowls: [
      {
        id: "dig-charred-chicken",
        name: "Charred Chicken Marketbowl",
        price: 16.5,
        likes: 112,
        orders: 41,
        tags: ["chicken", "roasted veg", "brown rice"],
      },
      {
        id: "dig-salmon",
        name: "Roasted Salmon Bowl",
        price: 18.95,
        likes: 88,
        orders: 23,
        tags: ["salmon", "broccoli", "farro"],
      },
      {
        id: "dig-tofu",
        name: "Herb Tofu Marketbowl",
        price: 15.25,
        likes: 54,
        orders: 16,
        tags: ["tofu", "beets", "sweet potatoes"],
      },
    ],
    menu: [
      { section: "Proteins", items: ["Charred chicken", "Roasted salmon", "Herb tofu"] },
      { section: "Bases", items: ["Brown rice", "Farro", "Greens"] },
      { section: "Market Sides", items: ["Broccoli", "Mac and cheese", "Sweet potatoes"] },
    ],
  },
  {
    id: "cava-fulton",
    shop: "CAVA Fulton",
    address: "143 Fulton St",
    cuisine: "mediterranean",
    rating: 4.5,
    wait: 8,
    lat: 40.7107,
    lng: -74.0077,
    color: "#d3a331",
    bowls: [
      {
        id: "cava-spicy-greens",
        name: "Spicy Greens + Grains",
        price: 14.85,
        likes: 74,
        orders: 29,
        tags: ["harissa", "falafel", "tzatziki"],
      },
      {
        id: "cava-harissa-chicken",
        name: "Harissa Avocado Bowl",
        price: 16.15,
        likes: 93,
        orders: 31,
        tags: ["chicken", "avocado", "hot harissa"],
      },
      {
        id: "cava-lamb",
        name: "Spicy Lamb Meatball Bowl",
        price: 15.95,
        likes: 66,
        orders: 18,
        tags: ["lamb", "hummus", "pickled onion"],
      },
    ],
    menu: [
      { section: "Chef Bowls", items: ["Harissa Avocado", "Greek Chicken", "Tahini Caesar"] },
      { section: "Build Your Own", items: ["Greens + grains", "Pita", "Salad"] },
      { section: "Dips", items: ["Hummus", "Tzatziki", "Crazy feta"] },
    ],
  },
  {
    id: "dos-toros",
    shop: "Dos Toros Maiden Lane",
    address: "101 Maiden Ln",
    cuisine: "burrito bowls",
    rating: 4.4,
    wait: 7,
    lat: 40.7069,
    lng: -74.0064,
    color: "#c84a35",
    bowls: [
      {
        id: "dos-carnitas",
        name: "Carnitas Rice Bowl",
        price: 13.95,
        likes: 68,
        orders: 22,
        tags: ["carnitas", "pico", "black beans"],
      },
      {
        id: "dos-carne-asada",
        name: "Carne Asada Bowl",
        price: 15.5,
        likes: 77,
        orders: 24,
        tags: ["steak", "guac", "salsa verde"],
      },
      {
        id: "dos-veggie",
        name: "Impossible Picadillo Bowl",
        price: 14.75,
        likes: 42,
        orders: 12,
        tags: ["plant-based", "beans", "corn salsa"],
      },
    ],
    menu: [
      { section: "Mains", items: ["Burrito bowl", "Burrito", "Salad"] },
      { section: "Proteins", items: ["Carnitas", "Carne asada", "Impossible picadillo"] },
      { section: "Toppings", items: ["Guacamole", "Pico", "Salsa verde"] },
    ],
  },
  {
    id: "naya",
    shop: "NAYA Financial District",
    address: "One New York Plaza",
    cuisine: "middle eastern",
    rating: 4.8,
    wait: 10,
    lat: 40.7086,
    lng: -74.0093,
    color: "#2c858d",
    bowls: [
      {
        id: "naya-shawarma",
        name: "Chicken Shawarma Bowl",
        price: 14.75,
        likes: 143,
        orders: 46,
        tags: ["shawarma", "hummus", "pickles"],
      },
      {
        id: "naya-kafta",
        name: "Kafta Lamb Bowl",
        price: 15.95,
        likes: 81,
        orders: 27,
        tags: ["lamb", "tabbouleh", "garlic whip"],
      },
      {
        id: "naya-falafel",
        name: "Falafel Mezze Bowl",
        price: 13.95,
        likes: 95,
        orders: 33,
        tags: ["falafel", "hummus", "cabbage"],
      },
    ],
    menu: [
      { section: "Bowls", items: ["Chicken shawarma", "Kafta lamb", "Falafel"] },
      { section: "Spreads", items: ["Hummus", "Baba ganoush", "Labneh"] },
      { section: "Toppings", items: ["Pickles", "Tabbouleh", "Garlic whip"] },
    ],
  },
  {
    id: "inday",
    shop: "INDAY",
    address: "1 New York Plaza",
    cuisine: "indian-ish",
    rating: 4.6,
    wait: 12,
    lat: 40.7048,
    lng: -74.0091,
    color: "#db8e2f",
    bowls: [
      {
        id: "inday-golden-curry",
        name: "Golden Curry Bowl",
        price: 15.25,
        likes: 91,
        orders: 25,
        tags: ["turmeric", "cauliflower", "basmati"],
      },
      {
        id: "inday-chicken-tikka",
        name: "Chicken Tikka Bowl",
        price: 16.25,
        likes: 76,
        orders: 20,
        tags: ["tikka", "raita", "greens"],
      },
      {
        id: "inday-crunch",
        name: "Coconut Crunch Bowl",
        price: 14.95,
        likes: 58,
        orders: 14,
        tags: ["coconut", "chickpea", "cilantro"],
      },
    ],
    menu: [
      { section: "Signature Bowls", items: ["Golden Curry", "Chicken Tikka", "Coconut Crunch"] },
      { section: "Bases", items: ["Basmati rice", "Cauliflower rice", "Baby spinach"] },
      { section: "Sauces", items: ["Cilantro chutney", "Raita", "Hot honey"] },
    ],
  },
  {
    id: "poke-bowl",
    shop: "Poke Bowl Co.",
    address: "100 Pearl St",
    cuisine: "poke",
    rating: 4.3,
    wait: 13,
    lat: 40.7093,
    lng: -74.0131,
    color: "#5d80c8",
    bowls: [
      {
        id: "poke-tuna-crunch",
        name: "Tuna Crunch Poke",
        price: 17.25,
        likes: 58,
        orders: 17,
        tags: ["ahi tuna", "edamame", "crispy onion"],
      },
      {
        id: "poke-salmon",
        name: "Spicy Salmon Bowl",
        price: 16.95,
        likes: 69,
        orders: 19,
        tags: ["salmon", "mango", "sriracha aioli"],
      },
      {
        id: "poke-tofu",
        name: "Sesame Tofu Poke",
        price: 14.95,
        likes: 39,
        orders: 11,
        tags: ["tofu", "seaweed", "sesame"],
      },
    ],
    menu: [
      { section: "Signature Bowls", items: ["Tuna Crunch", "Spicy Salmon", "Sesame Tofu"] },
      { section: "Bases", items: ["Sushi rice", "Brown rice", "Mixed greens"] },
      { section: "Toppings", items: ["Edamame", "Seaweed salad", "Crispy onion"] },
    ],
  },
  {
    id: "fields-good",
    shop: "Fields Good Chicken",
    address: "101 Maiden Ln",
    cuisine: "protein bowls",
    rating: 4.2,
    wait: 6,
    lat: 40.7118,
    lng: -74.0096,
    color: "#a9485c",
    bowls: [
      {
        id: "fields-buffalo",
        name: "Buffalo Chicken Bowl",
        price: 15.75,
        likes: 64,
        orders: 19,
        tags: ["buffalo", "ranch", "farro"],
      },
      {
        id: "fields-herby",
        name: "Herby Chicken Bowl",
        price: 15.25,
        likes: 57,
        orders: 15,
        tags: ["chicken", "greens", "lemon"],
      },
      {
        id: "fields-bbq",
        name: "BBQ Chicken Bowl",
        price: 15.95,
        likes: 71,
        orders: 22,
        tags: ["bbq", "slaw", "sweet potato"],
      },
    ],
    menu: [
      { section: "Bowls", items: ["Buffalo Chicken", "Herby Chicken", "BBQ Chicken"] },
      { section: "Sides", items: ["Farro", "Sweet potatoes", "Market greens"] },
      { section: "Sauces", items: ["Ranch", "Green goddess", "BBQ"] },
    ],
  },
];

const recentOrders = [
  { id: 1, person: "Maya", bowlId: "naya-shawarma", minutesAgo: 2 },
  { id: 2, person: "Eli", bowlId: "dig-charred-chicken", minutesAgo: 4 },
  { id: 3, person: "Jordan", bowlId: "sweetgreen-harvest", minutesAgo: 6 },
  { id: 4, person: "Sam", bowlId: "cava-spicy-greens", minutesAgo: 9 },
  { id: 5, person: "Priya", bowlId: "inday-golden-curry", minutesAgo: 13 },
  { id: 6, person: "Noah", bowlId: "dos-carnitas", minutesAgo: 18 },
];

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const RESTAURANT_PROVIDER = process.env.RESTAURANT_PROVIDER || "overpass";
const OVERPASS_API_URL = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";
const providerColors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#0891b2", "#ca8a04"];

function distanceMiles(a, b) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthMiles * Math.asin(Math.sqrt(h));
}

function flattenBowls(items) {
  return items.flatMap((restaurant) =>
    (restaurant.bowls || []).map((bowl) => ({
      ...bowl,
      shop: restaurant.shop,
      restaurantId: restaurant.id,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      wait: restaurant.wait,
      lat: restaurant.lat,
      lng: restaurant.lng,
      color: restaurant.color,
      distance: restaurant.distance,
    })),
  );
}

function colorForId(id) {
  const total = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return providerColors[total % providerColors.length];
}

function googlePhotoUrl(photoName) {
  if (!photoName) return null;
  return `/api/places/photo?name=${encodeURIComponent(photoName)}`;
}

function normalizeGooglePlace(place, location) {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const id = place.id || place.name;
  const photoName = place.photos?.[0]?.name;

  return {
    id,
    source: "google",
    shop: place.displayName?.text || "Restaurant",
    address: place.formattedAddress || "",
    cuisine: place.primaryTypeDisplayName?.text || "Restaurant",
    lat,
    lng,
    color: colorForId(id),
    distance: Number(distanceMiles(location, { lat, lng }).toFixed(2)),
    imageUrl: googlePhotoUrl(photoName),
    bowls: [],
    menu: [],
  };
}

async function fetchGoogleRestaurants(location, radiusMiles) {
  const radiusMeters = Math.max(100, Math.min(radiusMiles * 1609.34, 50000));
  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName,places.photos",
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return (data.places || [])
    .filter((place) => place.location?.latitude && place.location?.longitude)
    .map((place) => normalizeGooglePlace(place, location))
    .sort((a, b) => a.distance - b.distance);
}

function formatOsmAddress(tags = {}) {
  if (tags["addr:full"]) return tags["addr:full"];

  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const area = [tags["addr:city"], tags["addr:state"], tags["addr:postcode"]].filter(Boolean).join(", ");
  return [street, area].filter(Boolean).join(", ");
}

function normalizeOsmCuisine(tags = {}) {
  if (tags.cuisine) {
    return tags.cuisine
      .split(";")
      .map((item) => item.replaceAll("_", " "))
      .slice(0, 2)
      .join(", ");
  }
  return (tags.amenity || "restaurant").replaceAll("_", " ");
}

function normalizeOsmImage(tags = {}) {
  const image = tags.image || tags.logo;
  if (image?.startsWith("http://") || image?.startsWith("https://")) return image;
  return null;
}

function normalizeOsmElement(element, location) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const id = `osm-${element.type}-${element.id}`;

  return {
    id,
    source: "openstreetmap",
    shop: tags.name || "Restaurant",
    address: formatOsmAddress(tags),
    cuisine: normalizeOsmCuisine(tags),
    lat,
    lng,
    color: colorForId(id),
    distance: Number(distanceMiles(location, { lat, lng }).toFixed(2)),
    imageUrl: normalizeOsmImage(tags),
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    bowls: [],
    menu: [],
  };
}

async function fetchOverpassRestaurants(location, radiusMiles) {
  const radiusMeters = Math.max(100, Math.min(radiusMiles * 1609.34, 5000));
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["name"](around:${radiusMeters},${location.lat},${location.lng});
      way["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["name"](around:${radiusMeters},${location.lat},${location.lng});
      relation["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["name"](around:${radiusMeters},${location.lat},${location.lng});
    );
    out center tags 50;
  `;

  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": "fidi-food-finder/1.0",
    },
    body: query,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Overpass request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return (data.elements || [])
    .filter((element) => element.tags?.name && (element.lat || element.center?.lat) && (element.lon || element.center?.lon))
    .map((element) => normalizeOsmElement(element, location))
    .sort((a, b) => a.distance - b.distance);
}

function withDistance(items, location) {
  return items
    .map((restaurant) => ({
      ...restaurant,
      distance: Number(distanceMiles(location, restaurant).toFixed(2)),
    }))
    .sort((a, b) => a.distance - b.distance);
}

function findBowl(id) {
  for (const restaurant of restaurants) {
    const bowl = restaurant.bowls.find((item) => item.id === id);
    if (bowl) return { bowl, restaurant };
  }
  return {};
}

app.get("/api/restaurants", async (req, res) => {
  const lat = Number(req.query.lat || 40.7075);
  const lng = Number(req.query.lng || -74.0104);
  const radius = Number(req.query.radius || 0.7);
  const location = { lat, lng };

  if (RESTAURANT_PROVIDER === "google" && GOOGLE_PLACES_API_KEY) {
    try {
      const googleRestaurants = await fetchGoogleRestaurants(location, radius);
      res.json({
        provider: "google",
        restaurants: googleRestaurants,
        allRestaurants: googleRestaurants,
        bowls: [],
        allBowls: [],
        center: location,
      });
      return;
    } catch (error) {
      console.error(error);
    }
  }

  if (RESTAURANT_PROVIDER === "overpass") {
    try {
      const osmRestaurants = await fetchOverpassRestaurants(location, radius);
      res.json({
        provider: "openstreetmap",
        restaurants: osmRestaurants,
        allRestaurants: osmRestaurants,
        bowls: [],
        allBowls: [],
        center: location,
      });
      return;
    } catch (error) {
      console.error(error);
    }
  }

  const ordered = withDistance(restaurants, { lat, lng });
  const nearby = ordered.filter((restaurant) => restaurant.distance <= radius);
  res.json({
    provider: "local",
    restaurants: nearby,
    allRestaurants: ordered,
    bowls: flattenBowls(nearby),
    allBowls: flattenBowls(ordered),
    center: { lat, lng },
  });
});

app.get("/api/places/photo", async (req, res) => {
  if (!GOOGLE_PLACES_API_KEY) {
    res.status(404).json({ error: "Google Places API key is not configured" });
    return;
  }

  const photoName = req.query.name;
  if (!photoName || typeof photoName !== "string") {
    res.status(400).json({ error: "Missing photo name" });
    return;
  }

  const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);
  url.searchParams.set("maxWidthPx", "720");
  url.searchParams.set("skipHttpRedirect", "true");

  const response = await fetch(url);
  if (!response.ok) {
    res.status(response.status).json({ error: "Unable to fetch place photo" });
    return;
  }

  const data = await response.json();
  if (!data.photoUri) {
    res.status(404).json({ error: "Place photo not found" });
    return;
  }

  res.redirect(data.photoUri);
});

app.get("/api/orders", (req, res) => {
  res.json(
    recentOrders.map((order) => {
      const { bowl, restaurant } = findBowl(order.bowlId);
      return {
        ...order,
        bowl: bowl && {
          ...bowl,
          shop: restaurant.shop,
          color: restaurant.color,
        },
      };
    }),
  );
});

app.post("/api/bowls/:id/like", (req, res) => {
  const { bowl, restaurant } = findBowl(req.params.id);
  if (!bowl) {
    res.status(404).json({ error: "Bowl not found" });
    return;
  }
  bowl.likes += 1;
  res.json({ ...bowl, shop: restaurant.shop, color: restaurant.color });
});

app.post("/api/orders", (req, res) => {
  const { bowl, restaurant } = findBowl(req.body.bowlId);
  if (!bowl) {
    res.status(404).json({ error: "Bowl not found" });
    return;
  }
  bowl.orders += 1;
  const order = {
    id: Date.now(),
    person: req.body.person || "You",
    bowlId: bowl.id,
    minutesAgo: 0,
  };
  recentOrders.unshift(order);
  res.status(201).json({ ...order, bowl: { ...bowl, shop: restaurant.shop, color: restaurant.color } });
});

const server = app.listen(port, () => {
  console.log(`FIDI Food Finder API listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
