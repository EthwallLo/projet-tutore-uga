import { islands, project } from "@/lib/japan";

export default function MapLandscape() {
  const fuji = project(138.73, 35.36);

  return (
    <g className="map-illustrations" aria-hidden="true">
      <defs>
        <pattern id="painted-terrain" x="150" y="-70" width="700" height="1050" patternUnits="userSpaceOnUse">
          <image href="/art/terrain-encre.png" width="700" height="1050" />
        </pattern>
      </defs>

      <g className="painted-terrain">
        {islands.map((island) => <path key={island.id} d={island.path} fill="url(#painted-terrain)" fillRule="evenodd" />)}
      </g>

      <g className="coastline-ink">
        {islands.map((island) => <path key={island.id} d={island.path} fillRule="evenodd" />)}
      </g>

      <g className="fuji-illustration" transform={`translate(${fuji.x} ${fuji.y})`}>
        <path className="mountain-wash" d="M-18 10Q-7 0 0-19Q7-1 20 10Z" />
        <path d="M-18 10Q-7 0 0-19Q7-1 20 10M-5-7-1-5 2-8 6-5M-10 6-4-1M5 2 12 8" />
      </g>

      <g className="sea-ornaments">
        <path d="M304 164q8-5 16 0t16 0m-25 8q8-5 16 0t16 0M594 594q8-5 16 0t16 0m-24 8q8-5 16 0t16 0M770 345q8-5 16 0t16 0m-25 8q8-5 16 0t16 0" />
      </g>

      <g className="map-compass" transform="translate(260 100)">
        <circle r="19" />
        <path d="M0-12 4 1 0 10-4 1ZM0 10V27M-10 1H10" />
        <text y="-29" textAnchor="middle">北</text>
      </g>
    </g>
  );
}
