import type { SimConfig } from "../types";
import { randomNormal, randomPoisson } from "./random";

export type CellType = "empty" | "plant" | "herbivore" | "predator";

const predatorEnergy = new Map<string, number>();
const predatorDirs = new Map<string, { dx: number; dy: number }>();
const herbivoreEnergy = new Map<string, number>();
const plantHealth = new Map<string, number>();

export function clearWorldState() {
  predatorEnergy.clear();
  predatorDirs.clear();
  herbivoreEnergy.clear();
  plantHealth.clear();
}

const PREDATOR = {
  energyStart: 100,
  energyPerTick: 3,
  energyFromKill: 80,
  hungryBelow: 65,
  reproduceAt: 85,
  reproduceChance: 0.25,
};

const HERBIVORE = {
  energyStart: 80,
  energyPerTick: 3,
  energyFromPlant: 50,
  hungryBelow: 50,
  reproduceAt: 70,
  reproduceChance: 0.15,
};

const PLANT = {
  healthStart: 100,
  healthPerTick: 2,
  healthFromSun: 15,
  spreadChance: 0.18,
  dieBelow: 10,
};

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

function neighbors(
  grid: CellType[][],
  x: number,
  y: number,
  type?: CellType,
): { x: number; y: number }[] {
  const size = grid.length;
  return shuffle(
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((p) => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size)
      .filter((p) => !type || grid[p.y][p.x] === type),
  );
}

function randomDir() {
  const v = [-1, 0, 1];
  return {
    dx: v[Math.floor(Math.random() * 3)],
    dy: v[Math.floor(Math.random() * 3)],
  };
}

function nonZeroDir() {
  let dir = randomDir();
  while (dir.dx === 0 && dir.dy === 0) dir = randomDir();
  return dir;
}

function moveAgent(
  energyMap: Map<string, number>,
  dirMap: Map<string, { dx: number; dy: number }> | null,
  fromKey: string,
  toKey: string,
) {
  const e = energyMap.get(fromKey);
  const d = dirMap?.get(fromKey);
  energyMap.delete(fromKey);
  dirMap?.delete(fromKey);
  if (e !== undefined) energyMap.set(toKey, e);
  if (d && dirMap) dirMap.set(toKey, d);
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
    const cell = next[y][x];
    const key = `${x},${y}`;

    // ——— ТРАВА ———
    if (cell === "plant") {
      let health = plantHealth.get(key) ?? PLANT.healthStart;

      health -= PLANT.healthPerTick;
      health += PLANT.healthFromSun * rf * tf * 2;
      health = Math.min(100, health);

      if (health <= PLANT.dieBelow) {
        next[y][x] = "empty";
        plantHealth.delete(key);
        continue;
      }

      plantHealth.set(key, health);

      if (health > 50 && Math.random() < PLANT.spreadChance * tf * rf) {
        const lambda = (health / 100) * 2 * rf;
        const sprouts = randomPoisson(lambda);
        const empties = neighbors(next, x, y, "empty");
        for (let i = 0; i < Math.min(sprouts, empties.length); i++) {
          next[empties[i].y][empties[i].x] = "plant";
          plantHealth.set(
            `${empties[i].x},${empties[i].y}`,
            PLANT.healthStart * 0.7,
          );
        }
      }
    }

    // ——— КРОЛИКИ ———
    if (cell === "herbivore") {
      let energy = herbivoreEnergy.get(key) ?? HERBIVORE.energyStart;
      energy -= HERBIVORE.energyPerTick * (1 + (1 - tf));

      if (energy <= 0) {
        next[y][x] = "empty";
        herbivoreEnergy.delete(key);
        continue;
      }

      const hungry = energy < HERBIVORE.hungryBelow;

      if (hungry) {
        const food = neighbors(next, x, y, "plant")[0];
        if (food) {
          const fkey = `${food.x},${food.y}`;
          const gained = Math.max(
            10,
            randomNormal(HERBIVORE.energyFromPlant, 10),
          );
          energy = Math.min(HERBIVORE.energyStart, energy + gained);
          next[food.y][food.x] = "herbivore";
          next[y][x] = "empty";
          plantHealth.delete(fkey);
          herbivoreEnergy.delete(key);
          herbivoreEnergy.set(fkey, energy);
        } else {
          // ищем траву в радиусе 2 и идём к ней
          let moved = false;
          outer: for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
              if (next[ny][nx] === "plant") {
                const sx = x + Math.sign(dx);
                const sy = y + Math.sign(dy);
                if (
                  sx >= 0 &&
                  sy >= 0 &&
                  sx < size &&
                  sy < size &&
                  next[sy][sx] === "empty"
                ) {
                  next[sy][sx] = "herbivore";
                  next[y][x] = "empty";
                  moveAgent(herbivoreEnergy, null, key, `${sx},${sy}`);
                  moved = true;
                  break outer;
                }
              }
            }
          }
          if (!moved) {
            const empty = neighbors(next, x, y, "empty")[0];
            if (empty) {
              next[empty.y][empty.x] = "herbivore";
              next[y][x] = "empty";
              moveAgent(herbivoreEnergy, null, key, `${empty.x},${empty.y}`);
            } else {
              herbivoreEnergy.set(key, energy);
            }
          }
        }
      } else {
        herbivoreEnergy.set(key, energy);

        // размножение — максимум 1 детёныш за тик
        if (
          energy > HERBIVORE.reproduceAt &&
          Math.random() < HERBIVORE.reproduceChance * tf
        ) {
          const empty = neighbors(next, x, y, "empty")[0];
          if (empty) {
            next[empty.y][empty.x] = "herbivore";
            herbivoreEnergy.set(
              `${empty.x},${empty.y}`,
              HERBIVORE.energyStart * 0.6,
            );
          }
        }

        if (Math.random() < 0.3) {
          const empty = neighbors(next, x, y, "empty")[0];
          if (empty) {
            next[empty.y][empty.x] = "herbivore";
            next[y][x] = "empty";
            moveAgent(herbivoreEnergy, null, key, `${empty.x},${empty.y}`);
          }
        }
      }
    }

    // ——— ЛИСЫ ———
    if (cell === "predator") {
      let energy = predatorEnergy.get(key) ?? PREDATOR.energyStart;
      energy -= PREDATOR.energyPerTick * (1 + (1 - tf));

      if (energy <= 0) {
        next[y][x] = "empty";
        predatorEnergy.delete(key);
        predatorDirs.delete(key);
        continue;
      }

      const hungry = energy < PREDATOR.hungryBelow;
      const searchRadius = hungry ? 6 : 3;

      const searchArea: { x: number; y: number }[] = [];
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          if (next[ny][nx] === "herbivore") searchArea.push({ x: nx, y: ny });
        }
      }

      if (hungry && searchArea.length > 0) {
        // голодная — бежит к ближайшему кролику, 2 шага за тик
        predatorDirs.delete(key);
        searchArea.sort(
          (a, b) =>
            Math.abs(a.x - x) +
            Math.abs(a.y - y) -
            (Math.abs(b.x - x) + Math.abs(b.y - y)),
        );
        const target = searchArea[0];

        let cx = x;
        let cy = y;
        let ate = false;

        for (let step = 0; step < 2; step++) {
          if (Math.abs(target.x - cx) === 0 && Math.abs(target.y - cy) === 0)
            break;

          const sx = cx + Math.sign(target.x - cx);
          const sy = cy + Math.sign(target.y - cy);

          if (sx < 0 || sy < 0 || sx >= size || sy >= size) break;

          if (next[sy][sx] === "herbivore") {
            const gained = Math.max(
              15,
              randomNormal(PREDATOR.energyFromKill, 12),
            );
            energy = Math.min(PREDATOR.energyStart, energy + gained);

            next[cy][cx] = "empty";
            next[sy][sx] = "predator";

            predatorEnergy.delete(`${cx},${cy}`);
            predatorEnergy.set(`${sx},${sy}`, energy);

            herbivoreEnergy.delete(`${sx},${sy}`);

            if (
              energy > PREDATOR.reproduceAt &&
              Math.random() < PREDATOR.reproduceChance * tf
            ) {
              const empty = neighbors(next, sx, sy, "empty")[0];
              if (empty) {
                next[empty.y][empty.x] = "predator";
                predatorEnergy.set(
                  `${empty.x},${empty.y}`,
                  PREDATOR.energyStart * 0.6,
                );
              }
            }

            cx = sx;
            cy = sy;
            ate = true;
            break;
          } else if (next[sy][sx] === "empty") {
            next[cy][cx] = "empty";
            next[sy][sx] = "predator";

            predatorEnergy.delete(`${cx},${cy}`);
            predatorEnergy.set(`${sx},${sy}`, energy);

            cx = sx;
            cy = sy;
          } else {
            // заблокировано — пробуем свободного соседа
            const empty = neighbors(next, cx, cy, "empty")[0];
            if (empty) {
              next[cy][cx] = "empty";
              next[empty.y][empty.x] = "predator";
              predatorEnergy.delete(`${cx},${cy}`);
              predatorEnergy.set(`${empty.x},${empty.y}`, energy);
              cx = empty.x;
              cy = empty.y;
            }
            break;
          }
        }

        // если вообще не сдвинулась
        if (cx === x && cy === y && !ate) {
          predatorEnergy.set(key, energy);
        }
      } else if (hungry && searchArea.length === 0) {
        // голодная, добычи нет — агрессивный патруль
        let dir = predatorDirs.get(key) ?? nonZeroDir();
        const attempts = [
          dir,
          { dx: dir.dy, dy: -dir.dx },
          { dx: -dir.dy, dy: dir.dx },
          nonZeroDir(),
        ];

        let moved = false;
        for (const d of attempts) {
          if (d.dx === 0 && d.dy === 0) continue;
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < size &&
            ny < size &&
            next[ny][nx] === "empty"
          ) {
            next[y][x] = "empty";
            next[ny][nx] = "predator";
            predatorEnergy.delete(key);
            predatorEnergy.set(`${nx},${ny}`, energy);
            predatorDirs.set(`${nx},${ny}`, d);
            moved = true;
            break;
          }
        }

        if (!moved) {
          predatorDirs.set(key, nonZeroDir());
          predatorEnergy.set(key, energy);
        }
      } else {
        // сытая — медленный патруль
        predatorEnergy.set(key, energy);
        if (Math.random() < 0.5) {
          const dir = predatorDirs.get(key) ?? nonZeroDir();
          const nx = x + dir.dx;
          const ny = y + dir.dy;
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < size &&
            ny < size &&
            next[ny][nx] === "empty"
          ) {
            next[y][x] = "empty";
            next[ny][nx] = "predator";
            predatorEnergy.delete(key);
            predatorEnergy.set(`${nx},${ny}`, energy);
            predatorDirs.set(`${nx},${ny}`, dir);
          } else {
            predatorDirs.set(key, nonZeroDir());
          }
        }
      }
    }
  }

  for (const key of predatorEnergy.keys()) {
    const [kx, ky] = key.split(",").map(Number);
    if (next[ky]?.[kx] !== "predator") {
      predatorEnergy.delete(key);
      predatorDirs.delete(key);
    }
  }
  for (const key of herbivoreEnergy.keys()) {
    const [kx, ky] = key.split(",").map(Number);
    if (next[ky]?.[kx] !== "herbivore") herbivoreEnergy.delete(key);
  }
  for (const key of plantHealth.keys()) {
    const [kx, ky] = key.split(",").map(Number);
    if (next[ky]?.[kx] !== "plant") plantHealth.delete(key);
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
