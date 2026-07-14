import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Utensils,
  X,
} from "lucide-react";
import "./styles.css";

const fallbackLocation = {
  name: "Finding you...",
  lat: 40.7069,
  lng: -74.0113,
};

const panelClass = "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm";
const eyebrowClass = "text-[0.68rem] font-semibold uppercase text-zinc-500";
const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50";

const foodFilterOptions = [
  { id: "slop-bowl", label: "Slop bowl" },
  { id: "healthy", label: "Healthy" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "quick", label: "Quick" },
  { id: "cafe", label: "Cafe" },
  { id: "asian", label: "Asian" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "mexican", label: "Mexican" },
  { id: "indian", label: "Indian" },
  { id: "salad", label: "Salad" },
  { id: "poke-sushi", label: "Poke / sushi" },
  { id: "protein", label: "Protein" },
];

function App() {
  const [location, setLocation] = useState(fallbackLocation);
  const [locationStatus, setLocationStatus] = useState("Requesting live location");
  const [radius, setRadius] = useState(0.7);
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [spinnerIds, setSpinnerIds] = useState(new Set());
  const [spinResult, setSpinResult] = useState(null);
  const [spinRotation, setSpinRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFoodFilters, setActiveFoodFilters] = useState(new Set());
  const watchId = useRef(null);

  useEffect(() => {
    startLiveLocation();
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/restaurants?lat=${location.lat}&lng=${location.lng}&radius=${radius}`)
      .then((response) => response.json())
      .then((data) => {
        setRestaurants(data.restaurants);
        setAllRestaurants(data.allRestaurants);
        setSelectedRestaurantId((previous) => {
          if (previous && data.restaurants.some((restaurant) => restaurant.id === previous)) return previous;
          return data.restaurants[0]?.id || null;
        });
        setSpinnerIds((previous) => {
          const available = new Set(data.restaurants.map((restaurant) => restaurant.id));
          return new Set([...previous].filter((id) => available.has(id)));
        });
      });
  }, [location, radius]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId],
  );

  const filteredRestaurants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const searchable = [
        restaurant.shop,
        restaurant.address,
        restaurant.cuisine,
        ...(restaurant.bowls || []).map((bowl) => bowl.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (
        activeFoodFilters.size &&
        ![...activeFoodFilters].some((filter) => restaurantMatchesFoodFilter(restaurant, filter))
      ) {
        return false;
      }
      return true;
    });
  }, [restaurants, searchTerm, activeFoodFilters]);

  useEffect(() => {
    setSelectedRestaurantId((previous) => {
      if (previous && filteredRestaurants.some((restaurant) => restaurant.id === previous)) return previous;
      return filteredRestaurants[0]?.id || null;
    });
    setSpinnerIds((previous) => {
      const available = new Set(filteredRestaurants.map((restaurant) => restaurant.id));
      return new Set([...previous].filter((id) => available.has(id)));
    });
  }, [filteredRestaurants]);

  const spinnerRestaurants = useMemo(
    () => filteredRestaurants.filter((restaurant) => spinnerIds.has(restaurant.id)),
    [filteredRestaurants, spinnerIds],
  );

  function startLiveLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Live location is unavailable in this browser");
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    setLocationStatus("Requesting live location");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          name: "Your live location",
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        });
        setLocationStatus(`Live within ${Math.round(position.coords.accuracy)}m`);
      },
      () => {
        setLocationStatus("Allow location access to search around you");
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 12000 },
    );
  }

  function toggleSpinnerRestaurant(id) {
    setSpinnerIds((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleFoodFilter(key) {
    setActiveFoodFilters((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function clearFilters() {
    setSearchTerm("");
    setActiveFoodFilters(new Set());
  }

  function spinRestaurant() {
    if (!spinnerRestaurants.length || isSpinning) return;

    const index = Math.floor(Math.random() * spinnerRestaurants.length);
    const restaurant = spinnerRestaurants[index];
    const bowl = restaurant.bowls?.length
      ? restaurant.bowls[Math.floor(Math.random() * restaurant.bowls.length)]
      : null;
    const slice = 360 / spinnerRestaurants.length;
    const target = 360 - (index * slice + slice / 2);

    setSpinResult(null);
    setIsSpinning(true);
    setSpinRotation((previous) => previous + 1440 + target);
    window.setTimeout(() => {
      setSelectedRestaurantId(restaurant.id);
      setSpinResult({ restaurant, bowl });
      setIsSpinning(false);
    }, 1500);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-4 text-zinc-950 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-none sm:text-4xl">FIDI Food Finder</h1>
          <p className="mt-2 text-sm font-medium text-zinc-500">Find nearby restaurants from your live location.</p>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700">
            <MapPin size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{location.name}</div>
            <div className="truncate text-xs font-medium text-zinc-500">{locationStatus}</div>
          </div>
          <button className={iconButtonClass} title="Refresh live location" onClick={startLiveLocation}>
            <LocateFixed size={17} />
          </button>
        </div>
      </header>

      <section className="mb-5 grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_auto]">
        <label className="grid gap-2 px-1">
          <span className="flex items-center justify-between gap-3 text-sm font-semibold text-zinc-700">
            <span>Search radius</span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{radius.toFixed(1)} mi</span>
          </span>
          <input
            className="h-2 w-full accent-zinc-950"
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
          />
        </label>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-white"
          onClick={startLiveLocation}
        >
          <LocateFixed size={17} />
          Use live location
        </button>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(560px,1.2fr)_minmax(420px,0.85fr)]">
        <MapPanel
          restaurants={allRestaurants}
          nearbyIds={new Set(filteredRestaurants.map((restaurant) => restaurant.id))}
          location={location}
          radius={radius}
          selectedRestaurantId={selectedRestaurantId}
          onSelectRestaurant={setSelectedRestaurantId}
        />

        <div className="grid gap-5 xl:sticky xl:top-4">
          <div className={panelClass}>
            <PanelHeader eyebrow="Nearby restaurants" title={`${filteredRestaurants.length} of ${restaurants.length} shown`} />
            <FilterBar
              searchTerm={searchTerm}
              activeFoodFilters={activeFoodFilters}
              onSearch={setSearchTerm}
              onToggleFoodFilter={toggleFoodFilter}
              onClear={clearFilters}
            />
            <div className="max-h-[300px] overflow-auto p-2">
              {filteredRestaurants.length ? (
                <div className="grid gap-1">
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isActive={selectedRestaurantId === restaurant.id}
                      isQueued={spinnerIds.has(restaurant.id)}
                      onOpen={() => setSelectedRestaurantId(restaurant.id)}
                      onToggleQueue={() => toggleSpinnerRestaurant(restaurant.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No restaurants match" detail="Clear filters, increase the radius, or refresh your live location." />
              )}
            </div>
          </div>

          <MenuPanel restaurant={selectedRestaurant} onAdd={() => selectedRestaurant && toggleSpinnerRestaurant(selectedRestaurant.id)} isQueued={selectedRestaurant && spinnerIds.has(selectedRestaurant.id)} />

          <SpinnerPanel
            restaurants={spinnerRestaurants}
            rotation={spinRotation}
            isSpinning={isSpinning}
            result={spinResult}
            onSpin={spinRestaurant}
            onRemove={toggleSpinnerRestaurant}
          />
        </div>
      </section>
    </main>
  );
}

function PanelHeader({ eyebrow, title, action }) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3">
      <div className="min-w-0">
        <p className={eyebrowClass}>{eyebrow}</p>
        <strong className="block truncate text-base font-semibold">{title}</strong>
      </div>
      {action}
    </div>
  );
}

function FilterBar({
  searchTerm,
  activeFoodFilters,
  onSearch,
  onToggleFoodFilter,
  onClear,
}) {
  const hasActiveFilters = searchTerm || activeFoodFilters.size > 0;

  return (
    <div className="grid gap-3 border-b border-zinc-200 p-3">
      <div className="grid gap-1">
        <label className="grid gap-1">
          <span className={eyebrowClass}>Search</span>
          <input
            className="min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            placeholder="Name, cuisine, address"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
          <SlidersHorizontal size={13} /> Food filters
        </span>
        {foodFilterOptions.map((option) => (
          <button
            key={option.id}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeFoodFilters.has(option.id)
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            onClick={() => onToggleFoodFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant, isActive, isQueued, onOpen, onToggleQueue }) {
  return (
    <article
      className={`grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md p-2 transition ${
        isActive ? "bg-zinc-950 text-white" : "bg-white text-zinc-950 hover:bg-zinc-50"
      }`}
    >
      <button className="block h-11 w-11 overflow-hidden rounded-md bg-zinc-100" onClick={onOpen}>
        {restaurant.imageUrl ? (
          <img className="h-full w-full object-cover" src={restaurant.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className={`grid h-full w-full place-items-center ${isActive ? "bg-white/10" : "bg-zinc-100"}`}>
            <span className="h-3 w-3 rounded-full" style={{ background: restaurant.color }} />
          </span>
        )}
      </button>
      <button className="min-w-0 text-left" onClick={onOpen}>
        <strong className="block truncate text-sm font-semibold">{restaurant.shop}</strong>
        <small className={`mt-1 block truncate text-xs font-medium ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
          {restaurant.cuisine || restaurant.address}
        </small>
      </button>
      <span className={`grid justify-items-end gap-1 text-xs font-semibold ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
        <span>{restaurant.distance} mi</span>
        <button
          className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${
            isQueued
              ? isActive
                ? "bg-white text-zinc-950"
                : "bg-zinc-950 text-white"
              : isActive
                ? "bg-white/10 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
          onClick={onToggleQueue}
          title={isQueued ? "Remove from spinner" : "Add to spinner"}
        >
          {isQueued ? <X size={13} /> : <Plus size={13} />}
        </button>
      </span>
    </article>
  );
}

function MapPanel({ restaurants, nearbyIds, location, radius, selectedRestaurantId, onSelectRestaurant }) {
  const mapNode = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (!mapNode.current || map.current) return;

    map.current = L.map(mapNode.current, {
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([location.lat, location.lng], 15);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.featureGroup().addTo(map.current);

    return () => {
      map.current.remove();
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
      color: "#18181b",
      fillColor: "#18181b",
      fillOpacity: 0.035,
      opacity: 0.28,
      weight: 1,
      interactive: false,
    }).addTo(layer.current);

    L.circleMarker(center, {
      radius: 6,
      color: "#ffffff",
      fillColor: "#18181b",
      fillOpacity: 1,
      weight: 2,
    })
      .bindTooltip(location.name)
      .addTo(layer.current);

    restaurants.forEach((restaurant) => {
      const inRange = nearbyIds.has(restaurant.id);
      const isSelected = selectedRestaurantId === restaurant.id;
      const marker = L.circleMarker([restaurant.lat, restaurant.lng], {
        radius: isSelected ? 8 : 6,
        color: isSelected ? "#18181b" : "#ffffff",
        fillColor: restaurant.color,
        fillOpacity: inRange ? 0.72 : 0.18,
        opacity: inRange ? 0.9 : 0.35,
        weight: isSelected ? 2 : 1,
      });

      marker
        .bindTooltip(`${restaurant.shop} · ${restaurant.distance} mi`)
        .on("click", () => onSelectRestaurant(restaurant.id))
        .addTo(layer.current);
    });

    const bounds = radiusCircle.getBounds();
    restaurants.forEach((restaurant) => {
      bounds.extend([restaurant.lat, restaurant.lng]);
    });
    map.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
  }, [restaurants, nearbyIds, location, radius, selectedRestaurantId, onSelectRestaurant]);

  return (
    <div className={panelClass}>
      <PanelHeader
        eyebrow="Map"
        title="Search radius"
        action={<MapPin size={19} className="text-zinc-500" />}
      />
      <div className="minimal-map h-[520px] bg-zinc-100 sm:h-[620px]" ref={mapNode} />
    </div>
  );
}

function MenuPanel({ restaurant, onAdd, isQueued }) {
  if (!restaurant) {
    return (
      <div className={panelClass}>
        <PanelHeader eyebrow="Restaurant" title="No selection" action={<Utensils size={19} className="text-zinc-500" />} />
        <EmptyState title="Choose a restaurant" detail="Select a list item or map marker to see details." />
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="border-b border-zinc-200 p-4">
        <p className={eyebrowClass}>Restaurant</p>
        <h2 className="mt-1 text-xl font-semibold leading-tight">{restaurant.shop}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1">
            <Navigation size={13} /> {restaurant.distance} mi
          </span>
          {restaurant.cuisine && <span className="rounded-md bg-zinc-100 px-2 py-1">{restaurant.cuisine}</span>}
        </div>
        <button
          className={`mt-4 inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
            isQueued ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "bg-zinc-950 text-white"
          }`}
          onClick={onAdd}
        >
          {isQueued ? <X size={15} /> : <Plus size={15} />}
          {isQueued ? "Remove from spinner" : "Add to spinner"}
        </button>
      </div>
      <div className="grid gap-4 p-4">
        {restaurant.imageUrl && (
          <div className="aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100">
            <img className="h-full w-full object-cover" src={restaurant.imageUrl} alt="" />
          </div>
        )}
        <div>
          <p className={eyebrowClass}>Address</p>
          <p className="mt-1 text-sm font-medium leading-6 text-zinc-700">{restaurant.address || "Address unavailable"}</p>
          {(restaurant.website || restaurant.phone) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {restaurant.website && (
                <a
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  href={restaurant.website}
                  rel="noreferrer"
                  target="_blank"
                >
                  Website
                </a>
              )}
              {restaurant.phone && (
                <a
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  href={`tel:${restaurant.phone}`}
                >
                  {restaurant.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {!!restaurant.bowls?.length ? (
          <div className="grid gap-3">
            <div>
              <p className={eyebrowClass}>Bowls</p>
            </div>
            {restaurant.bowls.map((bowl) => (
              <article className="rounded-md border border-zinc-200 bg-white p-3" key={bowl.id}>
                <strong className="block text-sm font-semibold">{bowl.name}</strong>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bowl.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium leading-6 text-zinc-600">
            {restaurant.source === "openstreetmap"
              ? "OpenStreetMap provides place details, but not full restaurant menus."
              : "Google Places provides restaurant details and photos, but not full menu items through this API."}
          </div>
        )}

        {!!restaurant.menu?.length && (
          <div className="grid gap-3">
            {restaurant.menu.map((section) => (
              <section className="border-t border-zinc-200 pt-3" key={section.section}>
                <h2 className={eyebrowClass}>{section.section}</h2>
                <p className="mt-1 text-sm font-medium leading-6 text-zinc-700">{section.items.join(" · ")}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpinnerPanel({ restaurants, rotation, isSpinning, result, onSpin, onRemove }) {
  const wheelStyle = useMemo(() => {
    if (!restaurants.length) return { background: "#e4e4e7" };
    const slice = 100 / restaurants.length;
    const stops = restaurants
      .map((restaurant, index) => `${restaurant.color} ${index * slice}% ${(index + 1) * slice}%`)
      .join(", ");
    return {
      background: `conic-gradient(${stops})`,
      transform: `rotate(${rotation}deg)`,
    };
  }, [restaurants, rotation]);

  return (
    <div className={panelClass}>
      <PanelHeader eyebrow="Spinner" title={`${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} queued`} action={<Shuffle size={18} className="text-zinc-500" />} />
      <div className="grid gap-4 p-4">
        <div className="grid grid-cols-[150px_1fr] items-center gap-4">
          <div className="relative grid h-[150px] place-items-center">
            <div className="absolute top-0 z-10 h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-zinc-950" />
            <div
              className="grid h-32 w-32 place-items-center rounded-full border-8 border-white shadow-sm transition-transform duration-[1500ms]"
              style={wheelStyle}
            >
              <div className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-950">
                <Shuffle size={18} />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            {result ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className={eyebrowClass}>Result</p>
                <strong className="mt-1 block text-sm font-semibold">{result.restaurant.shop}</strong>
                <p className="mt-1 text-sm font-medium text-zinc-600">
                  {result.bowl ? result.bowl.name : "Pick your bowl from the restaurant."}
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium leading-6 text-zinc-600">
                Add restaurants, then spin to pick where to go. If menu bowls are available, it also picks a bowl.
              </p>
            )}
          </div>
        </div>

        <button
          className="min-h-10 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white transition disabled:bg-zinc-300"
          disabled={!restaurants.length || isSpinning}
          onClick={onSpin}
        >
          Spin restaurant
        </button>

        {!!restaurants.length && (
          <div className="flex flex-wrap gap-2">
            {restaurants.map((restaurant) => (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                key={restaurant.id}
                onClick={() => onRemove(restaurant.id)}
              >
                {restaurant.shop}
                <X size={12} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="grid min-h-40 place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-sm font-medium text-zinc-500">{detail}</p>
      </div>
    </div>
  );
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

function restaurantMatchesFoodFilter(restaurant, filter) {
  const text = restaurantSearchText(restaurant);

  switch (filter) {
    case "slop-bowl":
      return includesAny(text, [
        "bowl",
        "marketbowl",
        "grain",
        "rice",
        "greens",
        "poke",
        "cava",
        "sweetgreen",
        "dig",
        "naya",
        "chipotle",
        "dos toros",
      ]);
    case "healthy":
      return includesAny(text, [
        "healthy",
        "salad",
        "greens",
        "poke",
        "juice",
        "smoothie",
        "mediterranean",
        "vegetarian",
        "vegan",
        "tofu",
        "falafel",
        "grain",
      ]);
    case "vegetarian":
      return includesAny(text, ["vegetarian", "vegan", "tofu", "falafel", "hummus", "salad", "plant"]);
    case "quick":
      return includesAny(text, ["fast food", "fast_food", "cafe", "sandwich", "pizza", "burger", "burrito", "deli"]);
    case "cafe":
      return includesAny(text, ["cafe", "coffee", "bakery", "tea"]);
    case "asian":
      return includesAny(text, [
        "asian",
        "chinese",
        "japanese",
        "korean",
        "thai",
        "vietnamese",
        "ramen",
        "sushi",
        "poke",
      ]);
    case "mediterranean":
      return includesAny(text, ["mediterranean", "middle eastern", "falafel", "hummus", "shawarma", "kebab", "greek"]);
    case "mexican":
      return includesAny(text, ["mexican", "taco", "burrito", "quesadilla", "chipotle", "dos toros"]);
    case "indian":
      return includesAny(text, ["indian", "curry", "tikka", "masala", "basmati"]);
    case "salad":
      return includesAny(text, ["salad", "greens", "sweetgreen", "caesar"]);
    case "poke-sushi":
      return includesAny(text, ["poke", "sushi", "tuna", "salmon", "ahi"]);
    case "protein":
      return includesAny(text, ["protein", "chicken", "steak", "salmon", "tuna", "lamb", "beef", "tofu"]);
    default:
      return false;
  }
}

createRoot(document.getElementById("root")).render(<App />);
