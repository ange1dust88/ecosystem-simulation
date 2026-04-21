import type { SimConfig, Species } from "../types";

function tempFactor(temp: number): number {
  return Math.max(0, 1 - Math.abs(temp - 20) / 40);
}

function nextPopulation(
  species: Species,
  all: Species[],
  config: SimConfig,
): number {
  const tf = tempFactor(config.temperature);
  const resourceFactor = config.resources / 10;

  let pop = species.population;

  if (species.role === "plant") {
    const K = 1000 * resourceFactor;
    pop += species.growthRate * pop * (1 - pop / K) * tf;
  }

  if (species.role === "herbivore") {
    const plants = all.find((s) => s.role === "plant");
    const predators = all.filter((s) => s.role === "predator");
    const plantEffect = plants ? plants.population / 500 : 0;
    const predatorEffect = predators.reduce((sum, p) => sum + p.population, 0);

    pop += species.growthRate * pop * plantEffect * tf;
    pop -= species.deathRate * pop * (predatorEffect / 200);
  }

  if (species.role === "predator") {
    const herbivores = all.filter((s) => s.role === "herbivore");
    const preyEffect = herbivores.reduce((sum, h) => sum + h.population, 0);

    pop += species.growthRate * pop * (preyEffect / 500) * tf;
    pop -= species.deathRate * pop;
  }

  return Math.max(0, Math.round(pop));
}

export function simulateStep(species: Species[], config: SimConfig): Species[] {
  return species.map((s) => ({
    ...s,
    population: nextPopulation(s, species, config),
  }));
}

export function isCollapsed(species: Species[]): boolean {
  return species
    .filter((s) => s.role !== "plant")
    .every((s) => s.population === 0);
}
