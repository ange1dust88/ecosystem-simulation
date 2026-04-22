import type { SimConfig } from "../types";

export type CellType = "empty" | "plant" | "herbivore" | "predator";

function tempFactor(temp: number): number {
  return Math.max(0.1, 1 - Math.abs(temp - 20) / 40);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getNeighbors(
  grid: CellType[][],
  x: number,
  y: number,
  type?: CellType,
): { x: number; y: number }[] {
  const size = grid.length;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  return shuffle(
    dirs
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((p) => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size)
      .filter((p) => !type || grid[p.y][p.x] === type),
  );
}

export function worldStep(grid: CellType[][], config: SimConfig): CellType[][] {
  const size = grid.length;
  const next = grid.map((row) => [...row]);
  const tf = tempFactor(config.temperature);
  const rf = config.resources / 10;

  const coords = shuffle(
    Array.from({ length: size * size }, (_, i) => ({
      x: i % size,
      y: Math.floor(i / size),
    })),
  );

  for (const { x, y } of coords) {
    const cell = grid[y][x];
    if (cell === "plant") {
      if (Math.random() < 0.18 * tf * rf) {
        const empty = getNeighbors(next, x, y, "empty")[0];
        if (empty) next[empty.y][empty.x] = "plant";
      }
    }

    if (cell === "herbivore") {
      const food = getNeighbors(grid, x, y, "plant")[0];
      if (food) {
        next[food.y][food.x] = "herbivore";
        next[y][x] = "empty";
        if (Math.random() < 0.45 * tf) {
          const empty = getNeighbors(next, x, y, "empty")[0];
          if (empty) next[empty.y][empty.x] = "herbivore";
        }
      } else {
        if (Math.random() < 0.06) next[y][x] = "empty";
      }
    }

    if (cell === "predator") {
      const prey = getNeighbors(grid, x, y, "herbivore")[0];
      if (prey) {
        next[prey.y][prey.x] = "predator";
        next[y][x] = "empty";
        if (Math.random() < 0.3 * tf) {
          const empty = getNeighbors(next, x, y, "empty")[0];
          if (empty) next[empty.y][empty.x] = "predator";
        }
      } else {
        if (Math.random() < 0.04) next[y][x] = "empty";
      }
    }
  }

  return next;
}

export function countPopulations(grid: CellType[][]) {
  let plant = 0,
    herbivore = 0,
    predator = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === "plant") plant++;
      else if (cell === "herbivore") herbivore++;
      else if (cell === "predator") predator++;
    }
  }
  return { plant, herbivore, predator };
}
