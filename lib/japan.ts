import mapData from "@/data/japan-map.json";

export const cities = mapData.cities;
export const islands = mapData.islands;
export const southwestIslands = mapData.inset;
export type City = (typeof cities)[number];

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 730;

// The same equirectangular projection is used by the outline generator.
export function project(longitude: number, latitude: number) {
  return {
    x: 135 + (longitude - 127) * 42.5 * Math.cos((37 * Math.PI) / 180),
    y: (46.5 - latitude) * 42.5,
  };
}
