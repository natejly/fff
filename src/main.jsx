import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Navigation,
  RefreshCw,
  Sparkles,
  Utensils,
} from "lucide-react";
import "./styles.css";

const fallbackLocation = {
  name: "4 World Trade Center",
  lat: 40.7104,
  lng: -74.0119,
};

const filterOptions = [
  { id: "quick", label: "Quick bite" },
  { id: "healthy", label: "Healthy" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pizza", label: "Pizza" },
  { id: "burgers", label: "Burgers" },
  { id: "sandwiches", label: "Sandwiches" },
  { id: "salads", label: "Salads" },
  { id: "sushi", label: "Sushi & poke" },
  { id: "mexican", label: "Mexican" },
  { id: "italian", label: "Italian" },
  { id: "indian", label: "Indian" },
  { id: "chinese", label: "Chinese" },
  { id: "thai", label: "Thai" },
  { id: "mediterranean", label: "Mediterranean" },
];

const WALKING_MINUTES_PER_MILE = 20;

function App() {
  const [location, setLocation] = useState(fallbackLocation);
  const [walkingMinutes, setWalkingMinutes] = useState(15);
  const [restaurants, setRestaurants] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [emojiBurst, setEmojiBurst] = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const radius = walkingMinutes / WALKING_MINUTES_PER_MILE;

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          name: "Your location",
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        });
        setRecommendation(null);
      },
      () => setLocation(fallbackLocation),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/restaurants?lat=${location.lat}&lng=${location.lng}&radius=${radius}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Restaurant search is unavailable");
        return response.json();
      })
      .then((data) => {
        const nextRestaurants = data.restaurants || [];
        setRestaurants(nextRestaurants);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setRestaurants([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [location, radius]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      if (isCafeVenue(restaurant)) return false;
      if (
        activeFilters.size > 0 &&
        ![...activeFilters].some((filter) => restaurantMatchesFilter(restaurant, filter))
      ) {
        return false;
      }
      return true;
    });
  }, [restaurants, activeFilters]);

  useEffect(() => {
    if (
      recommendation &&
      !filteredRestaurants.some((restaurant) => restaurant.id === recommendation.id)
    ) {
      setRecommendation(null);
    }
  }, [filteredRestaurants, recommendation]);

  useEffect(() => {
    if (!recommendation) return;

    window.requestAnimationFrame(() => {
      const result = document.getElementById("todays-pick");
      if (!result) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top =
        result.getBoundingClientRect().top +
        window.scrollY -
        Math.min(window.innerHeight * 0.72, 560);
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }, [recommendation]);

  function toggleFilter(id) {
    setActiveFilters((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setActiveFilters(new Set());
  }

  function pickLunch() {
    if (!filteredRestaurants.length || isPicking) return;

    setIsPicking(true);
    window.setTimeout(() => {
      const alternatives = filteredRestaurants.filter(
        (restaurant) => restaurant.id !== recommendation?.id,
      );
      const pool = alternatives.length ? alternatives : filteredRestaurants;
      const next = pool[Math.floor(Math.random() * pool.length)];
      setRecommendation(next);
      setEmojiBurst({ id: Date.now(), emojis: foodEmojis(next) });
      setIsPicking(false);
    }, 520);
  }

  const selectRestaurant = useCallback((id) => {
    const restaurant = filteredRestaurants.find((item) => item.id === id);
    if (restaurant) {
      setRecommendation(restaurant);
      setEmojiBurst({ id: Date.now(), emojis: foodEmojis(restaurant) });
    }
  }, [filteredRestaurants]);

  return (
    <div className="site-shell">
      {emojiBurst && <EmojiRain key={emojiBurst.id} emojis={emojiBurst.emojis} />}
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FiDi Lunch home">
          <span className="brand-mark">
            <Utensils size={17} strokeWidth={2.4} />
          </span>
          <span>FiDi Lunch</span>
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <MapPanel
            restaurants={filteredRestaurants}
            location={location}
            radius={radius}
            selectedRestaurantId={recommendation?.id || null}
            onSelectRestaurant={selectRestaurant}
          />

          <div className="picker-card">
            <div className="picker-heading">
              <h2>What sounds good?</h2>
              {activeFilters.size > 0 && (
                <button className="text-button" type="button" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>

            <div className="filter-grid" aria-label="Lunch preferences">
              {filterOptions.map((filter) => (
                <button
                  className={`filter-chip ${activeFilters.has(filter.id) ? "is-active" : ""}`}
                  key={filter.id}
                  type="button"
                  aria-pressed={activeFilters.has(filter.id)}
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="picker-row">
              <label className="radius-field">
                <span className="radius-heading">
                  <span>Walking radius</span>
                  <strong>{walkingMinutes} min</strong>
                </span>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={walkingMinutes}
                  onChange={(event) => setWalkingMinutes(Number(event.target.value))}
                />
                <span className="radius-scale">
                  <span>5 min</span>
                  <span>20 min</span>
                </span>
              </label>
              <div className="match-count" aria-live="polite">
                <strong>{isLoading ? "—" : filteredRestaurants.length}</strong>
                <span>spots match</span>
              </div>
            </div>

            <button
              className="primary-button"
              type="button"
              disabled={isLoading || !filteredRestaurants.length || isPicking}
              onClick={pickLunch}
            >
              <Sparkles size={18} />
              {isPicking ? "Finding your lunch…" : "Pick my lunch"}
              {!isPicking && <ArrowRight size={18} />}
            </button>
          </div>
        </section>

        <Recommendation
          restaurant={recommendation}
          isPicking={isPicking}
          onPick={pickLunch}
        />
      </main>

      <footer>
        <span>FiDi Lunch</span>
      </footer>
    </div>
  );
}

function Recommendation({
  restaurant,
  isPicking,
  onPick,
}) {
  if (isPicking) {
    return (
      <section className="recommendation-card is-picking" aria-live="polite">
        <div className="shuffle-orbit"><Sparkles size={24} /></div>
        <div>
          <span className="eyebrow">Checking the neighborhood</span>
          <h2>Finding a winner…</h2>
        </div>
      </section>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <section className="recommendation-card" id="todays-pick" aria-live="polite">
      <RestaurantVisual restaurant={restaurant} featured />
      <div className="recommendation-content">
        <span className="eyebrow"><Sparkles size={14} /> Today’s pick</span>
        <h2>{restaurant.shop}</h2>
        <p className="cuisine">{formatCuisine(restaurant.cuisine)}</p>
        <div className="meta-row">
          <span><Clock3 size={15} /> About {walkMinutes(restaurant.distance)} min walk</span>
          <span><Navigation size={15} /> {restaurant.distance} mi</span>
        </div>
        <p className="address">{restaurant.address || "Address available in directions"}</p>
        <div className="recommendation-actions">
          <a className="primary-button compact" href={directionsUrl(restaurant)} target="_blank" rel="noreferrer">
            Get directions <ExternalLink size={16} />
          </a>
          <button className="secondary-button" type="button" onClick={onPick}>
            <RefreshCw size={16} /> Pick again
          </button>
        </div>
      </div>
    </section>
  );
}

function RestaurantVisual({ restaurant, featured = false }) {
  if (restaurant.imageUrl) {
    return (
      <span className={`restaurant-visual ${featured ? "is-featured" : ""}`}>
        <img src={restaurant.imageUrl} alt="" loading="lazy" />
      </span>
    );
  }

  const initials = restaurant.shop
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={`restaurant-visual placeholder ${featured ? "is-featured" : ""}`}
      style={{ "--restaurant-color": restaurant.color || "#a65f42" }}
    >
      <span>{initials}</span>
      <Utensils size={featured ? 30 : 20} />
    </span>
  );
}

function MapPanel({
  restaurants,
  location,
  radius,
  selectedRestaurantId,
  onSelectRestaurant,
}) {
  const mapNode = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const viewportKey = useRef(null);
  const lastZoomedRestaurantId = useRef(null);

  useEffect(() => {
    if (!mapNode.current || map.current) return;

    map.current = L.map(mapNode.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([location.lat, location.lng], 15);

    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    }).addTo(map.current);
    layer.current = L.featureGroup().addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();

    const center = [location.lat, location.lng];
    const radiusCircle = L.circle(center, {
      radius: radius * 1609.34,
      color: "#1f3a32",
      fillColor: "#1f3a32",
      fillOpacity: 0.04,
      opacity: 0.22,
      weight: 1,
      interactive: false,
    }).addTo(layer.current);

    L.circleMarker(center, {
      radius: 7,
      color: "#ffffff",
      fillColor: "#1f3a32",
      fillOpacity: 1,
      weight: 3,
    }).bindTooltip(location.name).addTo(layer.current);

    const selectedRestaurant = restaurants.find(
      (restaurant) => restaurant.id === selectedRestaurantId,
    );
    const visibleRestaurants = selectedRestaurant ? [selectedRestaurant] : restaurants;

    visibleRestaurants.forEach((restaurant) => {
      const isSelected = selectedRestaurantId === restaurant.id;
      const marker = L.circleMarker([restaurant.lat, restaurant.lng], {
        radius: isSelected ? 9 : 6,
        color: isSelected ? "#1f3a32" : "#ffffff",
        fillColor: restaurant.color || "#c56a43",
        fillOpacity: isSelected ? 1 : 0.78,
        weight: isSelected ? 3 : 2,
      }).on("click", () => onSelectRestaurant(restaurant.id));

      marker.bindTooltip(
        isSelected
          ? `${restaurant.shop} · ${walkMinutes(restaurant.distance)} min walk`
          : `${restaurant.shop} · ${walkMinutes(restaurant.distance)} min`,
        isSelected
          ? {
              permanent: true,
              direction: "top",
              offset: [0, -12],
              className: "selected-restaurant-label",
            }
          : {},
      ).addTo(layer.current);
    });

    const mapWidth = map.current.getSize().x;
    const horizontalOffset = mapWidth * (mapWidth > 700 ? -0.25 : -0.1);

    if (selectedRestaurant && lastZoomedRestaurantId.current !== selectedRestaurant.id) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.current.once("moveend", () => {
        map.current?.panBy([horizontalOffset, 0], { animate: false });
      });
      map.current.flyTo(
        [selectedRestaurant.lat, selectedRestaurant.lng],
        17,
        { animate: !reduceMotion, duration: 0.8 },
      );
      lastZoomedRestaurantId.current = selectedRestaurant.id;
    } else if (!selectedRestaurant) {
      const nextViewportKey = `${location.lat}:${location.lng}:${radius}`;
      if (viewportKey.current !== nextViewportKey) {
        const bounds = radiusCircle.getBounds();
        restaurants.forEach((restaurant) => bounds.extend([restaurant.lat, restaurant.lng]));
        map.current.fitBounds(bounds, {
          padding: [32, 32],
          maxZoom: 16,
          animate: false,
        });
        map.current.panBy([horizontalOffset, 0], { animate: false });
        viewportKey.current = nextViewportKey;
      }
      lastZoomedRestaurantId.current = null;
    }
  }, [restaurants, location, radius, selectedRestaurantId, onSelectRestaurant]);

  return (
    <div
      className="hero-map minimal-map"
      aria-label="Interactive map of lunch spots"
      ref={mapNode}
    />
  );
}

function EmojiRain({ emojis }) {
  return (
    <div className="emoji-rain" aria-hidden="true">
      {Array.from({ length: 30 }, (_, index) => (
        <span
          key={index}
          style={{
            "--emoji-left": `${(index * 37) % 100}%`,
            "--emoji-delay": `${(index % 8) * 0.07}s`,
            "--emoji-duration": `${2.1 + (index % 5) * 0.18}s`,
            "--emoji-drift": `${(index % 2 ? 1 : -1) * (18 + (index % 4) * 15)}px`,
            "--emoji-spin": `${(index % 2 ? 1 : -1) * (180 + index * 13)}deg`,
          }}
        >
          {emojis[index % emojis.length]}
        </span>
      ))}
    </div>
  );
}

function foodEmojis(restaurant) {
  const text = restaurantSearchText(restaurant);
  const categories = [
    [["vegan", "plant based", "plant-based"], ["🌱", "🥑", "🥦"]],
    [["vegetarian", "falafel", "tofu"], ["🥗", "🥕", "🌿"]],
    [["pizza"], ["🍕", "🍅", "🧀"]],
    [["burger"], ["🍔", "🍟", "🥤"]],
    [["sandwich", "deli", "bagel"], ["🥪", "🥯", "🧀"]],
    [["sushi", "poke", "japanese"], ["🍣", "🍱", "🥢"]],
    [["mexican", "taco", "burrito"], ["🌮", "🌯", "🥑"]],
    [["italian", "pasta"], ["🍝", "🍅", "🧀"]],
    [["indian", "curry", "masala"], ["🍛", "🫓", "🌶️"]],
    [["chinese", "dumpling"], ["🥡", "🥟", "🥢"]],
    [["thai"], ["🍜", "🌶️", "🥢"]],
    [["mediterranean", "middle eastern", "hummus"], ["🧆", "🥙", "🫒"]],
    [["bakery", "pastry"], ["🥐", "🥖", "🍪"]],
    [["cafe", "coffee", "tea"], ["☕", "🥐", "🧁"]],
    [["salad", "healthy", "greens"], ["🥗", "🥦", "🥑"]],
  ];
  return categories.find(([terms]) => includesAny(text, terms))?.[1] || ["🍽️", "😋", "✨"];
}

function walkMinutes(distance = 0) {
  return Math.max(3, Math.round(Number(distance) * 20));
}

function formatCuisine(cuisine) {
  if (!cuisine) return "Lunch spot";
  return cuisine
    .replaceAll("_", " ")
    .split(",")
    .map((part) => part.trim())
    .join(" · ");
}

function directionsUrl(restaurant) {
  const destination = restaurant.address || `${restaurant.lat},${restaurant.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function restaurantSearchText(restaurant) {
  return [
    restaurant.shop,
    restaurant.address,
    restaurant.cuisine,
    restaurant.source,
    ...(restaurant.bowls || []).flatMap((bowl) => [bowl.name, ...(bowl.tags || [])]),
    ...(restaurant.menu || []).flatMap((section) => [section.section, ...(section.items || [])]),
  ]
    .filter(Boolean)
    .join(" ")
    .replaceAll("_", " ")
    .toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function isCafeVenue(restaurant) {
  const cuisine = (restaurant.cuisine || "").replaceAll("_", " ").toLowerCase();
  return includesAny(cuisine, ["cafe", "coffee", "tea", "bakery", "pastry"]);
}

function restaurantMatchesFilter(restaurant, filter) {
  const text = restaurantSearchText(restaurant);
  const terms = {
    quick: ["fast food", "fast_food", "sandwich", "pizza", "burger", "burrito", "deli", "cafe"],
    healthy: ["healthy", "salad", "greens", "poke", "juice", "vegetarian", "vegan", "grain"],
    vegetarian: ["vegetarian", "tofu", "falafel", "hummus", "salad", "plant based", "plant-based"],
    vegan: ["vegan", "plant based", "plant-based"],
    pizza: ["pizza", "pizzeria"],
    burgers: ["burger", "hamburger"],
    sandwiches: ["sandwich", "deli", "bagel", "sub", "hoagie"],
    salads: ["salad", "greens", "sweetgreen", "caesar"],
    sushi: ["sushi", "poke", "sashimi", "japanese"],
    mediterranean: ["mediterranean", "middle eastern", "falafel", "hummus", "shawarma", "kebab", "greek"],
    mexican: ["mexican", "taco", "burrito", "quesadilla", "chipotle", "dos toros"],
    italian: ["italian", "pasta", "trattoria"],
    indian: ["indian", "curry", "masala", "tikka", "biryani"],
    chinese: ["chinese", "dumpling", "dim sum", "szechuan", "sichuan"],
    thai: ["thai", "pad thai"],
  };
  return includesAny(text, terms[filter] || []);
}

createRoot(document.getElementById("root")).render(<App />);
