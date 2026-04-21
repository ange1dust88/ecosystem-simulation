import { useRef, useState, useCallback } from "react";

import { simulateStep, isCollapsed } from "../simulation/engine";
import { DEFAULT_SPECIES } from "../simulation/defaultSpecies";
import type { SimConfig, SimState, Species } from "../types";

function makeSnapshot(year: number, species: Species[]) {
  return {
    year,
    species: species.map((s) => ({
      id: s.id,
      name: s.name,
      population: s.population,
    })),
  };
}

export function useSimulation(config: SimConfig) {
  const [state, setState] = useState<SimState>({
    status: "idle",
    currentYear: 0,
    species: DEFAULT_SPECIES,
    snapshots: [makeSnapshot(0, DEFAULT_SPECIES)],
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const yearRef = useRef(0);
  const speciesRef = useRef<Species[]>(DEFAULT_SPECIES);

  const stop = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setState((prev) => ({ ...prev, status: "done" }));
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, status: "running" }));

    tickRef.current = setInterval(() => {
      yearRef.current += 1;
      speciesRef.current = simulateStep(speciesRef.current, config);

      const year = yearRef.current;
      const species = speciesRef.current;
      const snapshot = makeSnapshot(year, species);

      setState((prev) => ({
        ...prev,
        currentYear: year,
        species,
        snapshots: [...prev.snapshots, snapshot],
        status: isCollapsed(species) ? "collapsed" : prev.status,
      }));

      if (isCollapsed(speciesRef.current) || yearRef.current >= config.years) {
        clearInterval(tickRef.current!);
        setState((prev) => ({
          ...prev,
          status: isCollapsed(speciesRef.current) ? "collapsed" : "done",
        }));
      }
    }, config.tickMs);
  }, [config, stop]);

  const reset = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    yearRef.current = 0;
    speciesRef.current = DEFAULT_SPECIES;
    setState({
      status: "idle",
      currentYear: 0,
      species: DEFAULT_SPECIES,
      snapshots: [makeSnapshot(0, DEFAULT_SPECIES)],
    });
  }, []);

  return { state, start, stop, reset };
}
