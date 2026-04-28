import { useEffect, useRef } from "react";
import type { CellType } from "../simulation/worldStep";

const COLORS: Record<CellType, string> = {
  empty: "#f9fafb",
  plant: "#22c55e",
  herbivore: "#f59e0b",
  predator: "#ef4444",
};

export default function EcosystemMap({ grid }: { grid: CellType[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const size = grid.length;
      const cell = Math.max(1, Math.floor(canvas.offsetWidth / size));
      canvas.width = cell * size;
      canvas.height = cell * size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          ctx.fillStyle = COLORS[grid[y][x]];
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [grid]);

  return (
    <div className="mt-4">
      <div className="flex gap-4 mb-3">
        {(["plant", "herbivore", "predator", "empty"] as CellType[]).map(
          (t) => (
            <div
              key={t}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ background: COLORS[t] }}
              />
              {t === "plant"
                ? "Grass"
                : t === "herbivore"
                  ? "Rabbit"
                  : t === "predator"
                    ? "Fox"
                    : "Empty"}
            </div>
          ),
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-gray-100"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
