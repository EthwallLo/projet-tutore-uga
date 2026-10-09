"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { cityDescriptions } from "@/data/city-descriptions";
import type { City } from "@/lib/japan";

export default function CityCard({ city, onClose }: {
  city: City | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const details = city ? cityDescriptions[city.id] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (city && !dialog.open) dialog.showModal();
    else if (!city && dialog.open) dialog.close();
  }, [city]);

  function close() {
    dialogRef.current?.close();
  }

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="city-card"
      className="city-card"
      aria-labelledby="city-card-title"
      aria-describedby="city-card-description"
      onClose={onClose}
      onKeyDown={keepFocusInside}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {city && details && (
        <article className="city-card-content">
          <button className="city-card-close" type="button" onClick={close} aria-label="Fermer la fiche">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <header className="city-card-heading">
            <p className="city-card-region">{city.region === city.island ? city.island : `${city.region} · ${city.island}`}</p>
            <h2 id="city-card-title">{city.name}</h2>
            <p className="city-card-japanese" lang="ja">{city.japanese}</p>
          </header>
          <p id="city-card-description" className="city-card-description">{details.description}</p>
          <section className="city-card-highlights" aria-labelledby="city-card-highlights-title">
            <h3 id="city-card-highlights-title">À découvrir</h3>
            <ul>{details.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          </section>
          <a className="city-card-source" href={details.source} target="_blank" rel="noreferrer">
            Guide de l’office du tourisme japonais
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M6 6h8v8" /></svg>
            <span className="sr-only">Ouvre un nouvel onglet</span>
          </a>
        </article>
      )}
    </dialog>
  );
}
