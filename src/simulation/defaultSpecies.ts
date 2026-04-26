import type { Species } from "../types";

export const DEFAULT_SPECIES: Species[] = [
  { id: "grass", name: "Grass", role: "plant", population: 800 },
  { id: "rabbit", name: "Rabbits", role: "herbivore", population: 300 },
  { id: "fox", name: "Foxes", role: "predator", population: 15 },
];

export const DEFAULT_CONFIG = {
  temperature: 20,
  resources: 7,
  years: 50,
  tickMs: 600,
};
