import type { Species } from "../types";
import type { CellType } from "./worldStep";

export function createGridFromSpecies(
  size: number,
  species: Species[],
): CellType[][] {
  const grid: CellType[][] = Array.from(
    { length: size },
    () => Array(size).fill("empty") as CellType[],
  );

  const total = size * size;

  const sorted = [...species].sort((a, b) => {
    const order = { plant: 0, herbivore: 1, predator: 2 };
    return order[a.role] - order[b.role];
  });

  sorted.forEach((s) => {
    const type: CellType =
      s.role === "plant"
        ? "plant"
        : s.role === "herbivore"
          ? "herbivore"
          : "predator";

    const CELL_LIMITS: Record<string, number> = {
      plant: Math.floor(total * 0.45),
      herbivore: Math.floor(total * 0.15),
      predator: Math.floor(total * 0.05),
    };

    const count = Math.min(s.population, CELL_LIMITS[s.role]);
    let placed = 0;

    while (placed < count) {
      const cx = Math.floor(Math.random() * size);
      const cy = Math.floor(Math.random() * size);
      const radius = Math.floor(Math.random() * 3) + 2;

      for (let dy = -radius; dy <= radius && placed < count; dy++) {
        for (let dx = -radius; dx <= radius && placed < count; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          if (grid[y][x] !== "empty") continue;
          if (Math.random() > 0.55) continue;
          grid[y][x] = type;
          placed++;
        }
      }
    }
  });

  return grid;
}
