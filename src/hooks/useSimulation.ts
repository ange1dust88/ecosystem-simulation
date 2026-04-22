import { useRef, useState, useCallback, useEffect } from "react";
import { worldStep, countPopulations } from "../simulation/worldStep";
import { createGridFromSpecies } from "../simulation/gridFromSpecies";
import type { SimConfig, SimState, Species } from "../types";
import type { CellType } from "../simulation/worldStep";

const GRID_SIZE = 60;

function makeSnapshot(
  year: number,
  counts: ReturnType<typeof countPopulations>,
  species: Species[],
) {
  return {
    year,
    species: species.map((s) => ({
      id: s.id,
      name: s.name,
      population:
        s.role === "plant"
          ? counts.plant
          : s.role === "herbivore"
            ? counts.herbivore
            : counts.predator,
    })),
  };
}

function speciesToCurrent(
  species: Species[],
  counts: ReturnType<typeof countPopulations>,
): Species[] {
  return species.map((s) => ({
    ...s,
    population:
      s.role === "plant"
        ? counts.plant
        : s.role === "herbivore"
          ? counts.herbivore
          : counts.predator,
  }));
}

export function useSimulation(config: SimConfig, initialSpecies: Species[]) {
  const initGrid = () => createGridFromSpecies(GRID_SIZE, initialSpecies);
  const initCounts = (grid: CellType[][]) => countPopulations(grid);

  const firstGrid = initGrid();
  const firstCounts = initCounts(firstGrid);

  const [grid, setGrid] = useState<CellType[][]>(firstGrid);
  const [state, setState] = useState<SimState>({
    status: "idle",
    currentYear: 0,
    species: speciesToCurrent(initialSpecies, firstCounts),
    snapshots: [makeSnapshot(0, firstCounts, initialSpecies)],
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const yearRef = useRef(0);
  const gridRef = useRef<CellType[][]>(firstGrid);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const start = useCallback(
    (species: Species[]) => {
      if (tickRef.current) return;

      setState((prev) => ({ ...prev, status: "running" }));

      tickRef.current = setInterval(() => {
        yearRef.current += 1;
        const year = yearRef.current;

        const nextGrid = worldStep(gridRef.current, config);
        gridRef.current = nextGrid;

        const counts = countPopulations(nextGrid);
        const collapsed = counts.herbivore === 0 && counts.predator === 0;

        setGrid(nextGrid);
        setState((prev) => ({
          ...prev,
          currentYear: year,
          species: speciesToCurrent(species, counts),
          snapshots: [
            ...prev.snapshots.slice(-200),
            makeSnapshot(year, counts, species),
          ],
          status: collapsed ? "collapsed" : prev.status,
        }));

        if (collapsed || year >= config.years) {
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            status: collapsed ? "collapsed" : "done",
          }));
        }
      }, config.tickMs);
    },
    [config],
  );

  const reset = useCallback((species: Species[]) => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const newGrid = createGridFromSpecies(GRID_SIZE, species);
    const counts = countPopulations(newGrid);

    yearRef.current = 0;
    gridRef.current = newGrid;

    setGrid(newGrid);
    setState({
      status: "idle",
      currentYear: 0,
      species: speciesToCurrent(species, counts),
      snapshots: [makeSnapshot(0, counts, species)],
    });
  }, []);

  return { state, grid, start, stop, reset };
}
