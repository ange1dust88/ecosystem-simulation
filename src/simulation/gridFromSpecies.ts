import type { Species } from "../types";

export function createGridFromSpecies(size: number, species: Species[]) {
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      type: "empty" as "empty" | "plant" | "herbivore" | "predator",
    })),
  );

  species.forEach((s) => {
    const count = Math.min(s.population, size * size);

    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      if (s.role === "plant") grid[y][x].type = "plant";
      if (s.role === "herbivore") grid[y][x].type = "herbivore";
      if (s.role === "predator") grid[y][x].type = "predator";
    }
  });

  return grid;
}
