import type { Species } from "../types";

export const DEFAULT_SPECIES: Species[] = [
  {
    id: "grass",
    name: "Grass",
    role: "plant",
    population: 800,
    growthRate: 0.4,
    deathRate: 0.05,
  },
  {
    id: "rabbit",
    name: "Rabbits",
    role: "herbivore",
    population: 150,
    growthRate: 0.3,
    deathRate: 0.1,
  },
  {
    id: "fox",
    name: "Foxes",
    role: "predator",
    population: 30,
    growthRate: 0.2,
    deathRate: 0.15,
  },
];

export const DEFAULT_CONFIG = {
  temperature: 20,
  resources: 7,
  years: 50,
  tickMs: 600,
};
