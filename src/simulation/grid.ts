import type { Cell } from "../types";

export function createWorld(size: number): Cell[][] {
  const grid: Cell[][] = [];

  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];

    for (let x = 0; x < size; x++) {
      const r = Math.random();

      let type: Cell["type"] = "empty";

      if (r < 0.1) type = "plant";
      else if (r < 0.13) type = "herbivore";
      else if (r < 0.14) type = "predator";

      row.push({ x, y, type });
    }

    grid.push(row);
  }

  return grid;
}
