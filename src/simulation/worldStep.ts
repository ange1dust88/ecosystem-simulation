import type { Cell } from "../types";

function neighbors(grid: Cell[][], x: number, y: number) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const result: Cell[] = [];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (grid[ny]?.[nx]) result.push(grid[ny][nx]);
  }

  return result;
}

export function worldStep(grid: Cell[][]): Cell[][] {
  const size = grid.length;

  const next = grid.map((row) => row.map((c) => ({ ...c })));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = grid[y][x];
      const n = neighbors(grid, x, y);

      if (cell.type === "plant") {
        if (Math.random() < 0.02) {
          const empty = n.find((c) => c.type === "empty");
          if (empty) next[empty.y][empty.x].type = "plant";
        }
      }

      if (cell.type === "herbivore") {
        const plant = n.find((c) => c.type === "plant");

        if (plant) {
          next[plant.y][plant.x].type = "herbivore";
          next[y][x].type = "empty";
        } else {
          if (Math.random() < 0.05) next[y][x].type = "empty";
        }
      }

      if (cell.type === "predator") {
        const prey = n.find((c) => c.type === "herbivore");

        if (prey) {
          next[prey.y][prey.x].type = "predator";
          next[y][x].type = "empty";
        } else {
          if (Math.random() < 0.08) next[y][x].type = "empty";
        }
      }
    }
  }

  return next;
}
