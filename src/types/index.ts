export type Role = "plant" | "herbivore" | "predator";

export type Species = {
  id: string;
  name: string;
  role: Role;
  population: number;
  growthRate: number;
  deathRate: number;
};

export type SimConfig = {
  temperature: number;
  resources: number;
  years: number;
  tickMs: number;
};

export type YearSnapshot = {
  year: number;
  species: { id: string; name: string; population: number }[];
};

export type SimStatus = "idle" | "running" | "done" | "collapsed";

export type SimState = {
  status: SimStatus;
  currentYear: number;
  species: Species[];
  snapshots: YearSnapshot[];
};
