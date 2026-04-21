import { useState } from "react";
import { useSimulation } from "./hooks/useSimulation";
import { DEFAULT_CONFIG, DEFAULT_SPECIES } from "./simulation/defaultSpecies";
import type { SimConfig } from "./types";

export default function App() {
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const { state, start, stop, reset } = useSimulation(config);

  const { status, currentYear, species, snapshots } = state;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-semibold mb-6">Симулятор экосистемы</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-gray-500">
          Температура: {config.temperature}°C
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
          Ресурсы: {config.resources}/10
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
          Лет: {config.years}
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
          Скорость: {config.tickMs}мс/год
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

      <div className="flex gap-3 mb-6">
        <button
          onClick={start}
          disabled={status === "running"}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-40"
        >
          Запустить
        </button>
        <button
          onClick={stop}
          disabled={status !== "running"}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
        >
          Стоп
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          Сброс
        </button>
        <span
          className={`ml-auto text-sm font-medium px-3 py-2 rounded-lg ${
            status === "collapsed"
              ? "bg-red-100 text-red-700"
              : status === "done"
                ? "bg-green-100 text-green-700"
                : status === "running"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
          }`}
        >
          {status === "idle"
            ? "Ожидание"
            : status === "running"
              ? `Год ${currentYear}`
              : status === "done"
                ? `Завершено (${currentYear} лет)`
                : "Коллапс экосистемы"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 text-sm font-medium">
          Текущие популяции
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left px-6 py-3">Вид</th>
              <th className="text-left px-6 py-3">Роль</th>
              <th className="text-right px-6 py-3">Популяция</th>
            </tr>
          </thead>
          <tbody>
            {species.map((s) => (
              <tr key={s.id} className="border-t border-gray-50">
                <td className="px-6 py-3 font-medium">{s.name}</td>
                <td className="px-6 py-3 text-gray-400">{s.role}</td>
                <td
                  className={`px-6 py-3 text-right font-mono ${s.population === 0 ? "text-red-500" : ""}`}
                >
                  {s.population === 0 ? "вымер" : s.population.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 text-sm font-medium">
          История по годам
        </div>
        <div className="overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-6 py-3">Год</th>
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
    </div>
  );
}
