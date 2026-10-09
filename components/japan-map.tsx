"use client";

import { useState, useSyncExternalStore } from "react";
import CityCard from "@/components/city-card";
import {
  cities,
  islands,
  southwestIslands,
  MAP_HEIGHT,
  MAP_WIDTH,
  project,
  type City,
} from "@/lib/japan";

const themeStorageKey = "japan-map-theme";
const themeChangeEvent = "japan-map-theme-change";
let fallbackNightMode = false;
const compactLabels: Record<string, [number, number]> = {
  kyoto: [-62, -50],
  hiroshima: [-60, -10],
};

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia("(max-width: 600px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isCompactViewport() {
  return window.matchMedia("(max-width: 600px)").matches;
}

function serverSnapshot() {
  return false;
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(themeChangeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(themeChangeEvent, onChange);
  };
}

function isNightMode() {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === null ? fallbackNightMode : stored === "night";
  } catch {
    return fallbackNightMode;
  }
}

function setNightMode(enabled: boolean) {
  fallbackNightMode = enabled;
  try {
    window.localStorage.setItem(themeStorageKey, enabled ? "night" : "day");
  } catch {
    // Le thème reste utilisable lorsque le stockage du navigateur est bloqué
  }
  window.dispatchEvent(new Event(themeChangeEvent));
}

function CityMarker({ city, active, compact, onSelect }: {
  city: City;
  active: boolean;
  compact: boolean;
  onSelect: (city: City) => void;
}) {
  const point = project(city.longitude, city.latitude);
  const [labelX, labelY] = compact && compactLabels[city.id]
    ? compactLabels[city.id]
    : city.label;
  const labelWidth = city.name.length * 9 + 24;
  const hasLeader = Math.abs(labelX) > 40 || Math.abs(labelY) > 20;

  return (
    <g
      className={`city-marker${active ? " city-marker-active" : ""}`}
      transform={`translate(${point.x} ${point.y})`}
      role="button"
      tabIndex={0}
      aria-label={`Découvrir ${city.name}, ${city.region}`}
      aria-haspopup="dialog"
      aria-controls="city-card"
      aria-expanded={active}
      data-city={city.id}
      onClick={() => onSelect(city)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onSelect(city);
        }
      }}
    >
      <title>{`Découvrir ${city.name} — ${city.region}`}</title>
      <g transform={`scale(${compact ? 1.6 : 1})`}>
        {hasLeader && <path className="city-leader" d={`M0 0L${labelX + labelWidth / 2} ${labelY - 5}`} />}
        <circle className="city-halo" r={17} />
        <circle className="city-dot" r={6} />
        <rect className="city-label-background" x={labelX - 10} y={labelY - 24} width={labelWidth} height={40} rx={7} />
        <text className="city-label" x={labelX + 2} y={labelY}>{city.name}</text>
      </g>
    </g>
  );
}

export default function JapanMap() {
  const compact = useSyncExternalStore(subscribeToViewport, isCompactViewport, serverSnapshot);
  const nightMode = useSyncExternalStore(subscribeToTheme, isNightMode, serverSnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCity = cities.find((city) => city.id === selectedId) ?? null;

  return (
    <section className="game-board" data-theme={nightMode ? "night" : "day"} aria-label="Explorer les villes du Japon">
      <div
        className="map-stage"
        role="region"
        aria-label="Carte du Japon"
        aria-describedby="map-keyboard-help"
      >
        <svg
          className="japan-map"
          viewBox={compact ? `160 0 680 ${MAP_HEIGHT}` : `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="group"
          aria-labelledby="map-title map-description"
        >
          <title id="map-title">Carte du Japon</title>
          <desc id="map-description">Sélectionnez une ville pour ouvrir sa fiche et découvrir sa culture. Hokkaidō, Honshū, Shikoku et Kyūshū sont représentées, avec un encart des îles du sud-ouest.</desc>
          <g className="map-world">
            <text className="sea-label" x="290" y="260" transform="rotate(-22 290 260)">Mer du Japon</text>
            <text className="ocean-label" x="735" y="563" textAnchor="middle">OCÉAN</text>
            <text className="ocean-label" x="735" y="591" textAnchor="middle">PACIFIQUE</text>

            <g className="island-outlines">
              {islands.map((island) => (
                <path key={island.id} className={`island island-${island.id}`} d={island.path} fillRule="evenodd">
                  <title>{island.name}</title>
                </path>
              ))}
            </g>

            <g className="island-labels" aria-hidden="true">
              <text x="665" y="78">HOKKAIDŌ</text>
              <text x="482" y="348" transform="rotate(-35 482 348)">HONSHŪ</text>
              <text x={compact ? 440 : 394} y={compact ? 610 : 589}>SHIKOKU</text>
              <text x="284" y="672">KYŪSHŪ</text>
            </g>

            {cities.map((city) => (
              <CityMarker key={city.id} city={city} active={city.id === selectedId} compact={compact} onSelect={(selected) => setSelectedId(selected.id)} />
            ))}
          </g>

          <svg x={compact ? 175 : 32} y={compact ? 100 : 275} width={compact ? 165 : 180} height={compact ? 191 : 209} viewBox="0 0 210 245" className="okinawa-inset" aria-label="Îles du sud-ouest, à une échelle différente">
            <rect x="1" y="1" width="208" height="243" rx="12" className="inset-background" />
            <text x="18" y="30" className="inset-title">ÎLES DU SUD-OUEST</text>
            {southwestIslands.map((path, index) => <path key={index} d={path} className="island" fillRule="evenodd" />)}
            <text x="124" y="147" className="inset-label">Okinawa</text>
            <path d="M120 139 106 124" className="inset-leader" />
            <text x="18" y="224" className="inset-caption">Échelle de l’encart différente</text>
          </svg>
        </svg>
      </div>

      <button className="theme-toggle" type="button" onClick={() => setNightMode(!nightMode)} aria-pressed={nightMode} title={nightMode ? "Revenir au mode jour" : "Activer le mode nuit"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
        </svg>
        <span>Mode nuit</span>
      </button>
      <CityCard city={selectedCity} onClose={() => setSelectedId(null)} />
      <p id="map-keyboard-help" className="sr-only">Tab pour choisir une ville, puis Entrée ou Espace pour ouvrir sa fiche. Échap pour fermer la fiche.</p>
    </section>
  );
}
