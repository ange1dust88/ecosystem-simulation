export default function EcosystemMap({ grid }: { grid: any }) {
  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${grid.length}, 4px)`,
      }}
    >
      {grid.flat().map((c: any, i: any) => {
        let color = "bg-white";

        if (c.type === "plant") color = "bg-green-500";
        if (c.type === "herbivore") color = "bg-yellow-500";
        if (c.type === "predator") color = "bg-red-500";

        return <div key={i} className={`w-1 h-1 ${color}`} />;
      })}
    </div>
  );
}
