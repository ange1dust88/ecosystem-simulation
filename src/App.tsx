import { useState } from "react";
import { useSimulation } from "./hooks/useSimulation";
import { DEFAULT_CONFIG, DEFAULT_SPECIES } from "./simulation/defaultSpecies";
import type { SimConfig, Species } from "./types";
import EcosystemMap from "./components/EcosystemMap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS: Record<string, string> = {
  grass: "#22c55e",
  rabbit: "#f59e0b",
  fox: "#ef4444",
};

const ROLE_LABEL: Record<string, string> = {
  plant: "Plant",
  herbivore: "Herbivore",
  predator: "Predator",
};

export default function App() {
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [editableSpecies, setEditableSpecies] =
    useState<Species[]>(DEFAULT_SPECIES);

  const { state, grid, start, stop, reset } = useSimulation(
    config,
    editableSpecies,
  );
  const { status, currentYear, species, snapshots } = state;

  const chartData = snapshots.map((snap) => {
    const row: any = { year: snap.year };
    snap.species.forEach((s) => {
      row[s.id] = s.population;
    });
    return row;
  });

  function updateSpecies(id: string, field: keyof Species, value: number) {
    setEditableSpecies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Ecosystem Simulator</h1>

      {/* ENV CONFIG */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="text-sm font-medium mb-4">Environment</div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-gray-500">
            Temperature: {config.temperature}°C
            <input
              type="range"
              min={-20}
              max={50}
              value={config.temperature}
              onChange={(e) =>
                setConfig((c) => ({ ...c, temperature: +e.target.value }))
              }
              disabled={status === "running"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-500">
            Resources: {config.resources}/10
            <input
              type="range"
              min={1}
              max={10}
              value={config.resources}
              onChange={(e) =>
                setConfig((c) => ({ ...c, resources: +e.target.value }))
              }
              disabled={status === "running"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-500">
            Years: {config.years}
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={config.years}
              onChange={(e) =>
                setConfig((c) => ({ ...c, years: +e.target.value }))
              }
              disabled={status === "running"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-500">
            Speed: {config.tickMs}ms/year
            <input
              type="range"
              min={100}
              max={2000}
              step={100}
              value={config.tickMs}
              onChange={(e) =>
                setConfig((c) => ({ ...c, tickMs: +e.target.value }))
              }
              disabled={status === "running"}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="text-sm font-medium mb-4">Starting populations</div>
        <div className="grid grid-cols-3 gap-6">
          {editableSpecies.map((s) => (
            <div key={s.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[s.id] }}
                />
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {ROLE_LABEL[s.role]}
                </span>
              </div>
              <label className="flex flex-col gap-1 text-xs text-gray-400">
                Population: {s.population}
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={s.population}
                  onChange={(e) =>
                    updateSpecies(s.id, "population", +e.target.value)
                  }
                  disabled={status === "running"}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray-400">
                Growth rate: {s.growthRate}
                <input
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={s.growthRate}
                  onChange={(e) =>
                    updateSpecies(s.id, "growthRate", +e.target.value)
                  }
                  disabled={status === "running"}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray-400">
                Death rate: {s.deathRate}
                <input
                  type="range"
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  value={s.deathRate}
                  onChange={(e) =>
                    updateSpecies(s.id, "deathRate", +e.target.value)
                  }
                  disabled={status === "running"}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => start(editableSpecies)}
          disabled={status === "running"}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-40"
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={status !== "running"}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
        >
          Stop
        </button>
        <button
          onClick={() => {
            reset(editableSpecies);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          Reset
        </button>
        <span
          className={`ml-auto text-sm font-medium px-3 py-2 rounded-lg ${
            status === "collapsed"
              ? "bg-red-100 text-red-700"
              : status === "done"
                ? "bg-green-100 text-green-700"
                : status === "running"
                  ? "bg-blue-100 text-blue-700"
                  : status === "paused"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-500"
          }`}
        >
          {status === "idle"
            ? "Waiting"
            : status === "running"
              ? `Year ${currentYear}`
              : status === "done"
                ? `Done (${currentYear} years)`
                : status === "paused"
                  ? `Stopped (year ${currentYear})`
                  : "Ecosystem collapsed"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 text-sm font-medium">
          Current populations
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left px-6 py-3">Species</th>
              <th className="text-left px-6 py-3">Role</th>
              <th className="text-right px-6 py-3">Population</th>
            </tr>
          </thead>
          <tbody>
            {species.map((s) => (
              <tr key={s.id} className="border-t border-gray-50">
                <td className="px-6 py-3 font-medium">{s.name}</td>
                <td className="px-6 py-3 text-gray-400">
                  {ROLE_LABEL[s.role]}
                </td>
                <td
                  className={`px-6 py-3 text-right font-mono ${s.population === 0 ? "text-red-500" : ""}`}
                >
                  {s.population === 0
                    ? "extinct"
                    : s.population.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 text-sm font-medium">
          History
        </div>
        <div className="overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-6 py-3">Year</th>
                {DEFAULT_SPECIES.map((s) => (
                  <th key={s.id} className="text-right px-6 py-3">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((snap) => (
                <tr key={snap.year} className="border-t border-gray-50">
                  <td className="px-6 py-3 text-gray-400">{snap.year}</td>
                  {snap.species.map((s) => (
                    <td
                      key={s.id}
                      className={`px-6 py-3 text-right font-mono ${s.population === 0 ? "text-red-400" : ""}`}
                    >
                      {s.population === 0 ? "—" : s.population.toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="text-sm font-medium mb-4">Population dynamics</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {DEFAULT_SPECIES.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={COLORS[s.id]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm font-medium mb-4">Ecosystem map</div>
        <EcosystemMap grid={grid} />
      </div>
    </div>
  );
}
