import { useRef, useState, useCallback, useEffect } from "react";

import { simulateStep, isCollapsed } from "../simulation/engine";
import { DEFAULT_SPECIES } from "../simulation/defaultSpecies";
import type { SimConfig, SimState, Species } from "../types";

function cloneSpecies(): Species[] {
  return DEFAULT_SPECIES.map((s) => ({ ...s }));
}

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
  const initialSpecies = cloneSpecies();

  const [state, setState] = useState<SimState>({
    status: "idle",
    currentYear: 0,
    species: initialSpecies,
    snapshots: [makeSnapshot(0, initialSpecies)],
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const yearRef = useRef(0);
  const speciesRef = useRef<Species[]>(cloneSpecies());

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

    setState((prev) => ({
      ...prev,
      status: "paused",
    }));
  }, []);

  const start = useCallback(() => {
    if (tickRef.current) return;

    setState((prev) => ({
      ...prev,
      status: "running",
    }));

    tickRef.current = setInterval(() => {
      yearRef.current += 1;

      const nextSpecies = simulateStep(speciesRef.current, config);
      speciesRef.current = nextSpecies;

      const year = yearRef.current;
      const snapshot = makeSnapshot(year, nextSpecies);

      setState((prev) => ({
        ...prev,
        currentYear: year,
        species: nextSpecies,
        snapshots: [...prev.snapshots.slice(-200), snapshot],
        status: isCollapsed(nextSpecies) ? "collapsed" : prev.status,
      }));

      if (isCollapsed(nextSpecies) || year >= config.years) {
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          status: isCollapsed(nextSpecies) ? "collapsed" : "done",
        }));
      }
    }, config.tickMs);
  }, [config]);

  const reset = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const freshSpecies = cloneSpecies();

    yearRef.current = 0;
    speciesRef.current = freshSpecies;

    setState({
      status: "idle",
      currentYear: 0,
      species: freshSpecies,
      snapshots: [makeSnapshot(0, freshSpecies)],
    });
  }, []);

  return { state, start, stop, reset };
}
