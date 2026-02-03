import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapView } from "./map/MapView";
import { getTypes } from "./map/ngsiClient";
import { Sidebar } from "./ui/Sidebar";

const App = () => {
  const [selectedType, setSelectedType] = useState("__all__");
  const [hoursBack, setHoursBack] = useState(24);
  const {
    data: types = [],
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({
    queryKey: ["ngsi-types"],
    queryFn: getTypes,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
  });

  return (
    <div className="h-full bg-base-100 text-base-content">
      <div className="grid h-full grid-cols-[260px_1fr] grid-rows-[72px_1fr]">
        <header className="col-span-3 row-span-1 flex items-center justify-between border-b border-base-300 bg-base-200 px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin dashboard</div>
            <div className="font-display text-lg">NGSI-LD Geo Monitor</div>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="input input-sm input-bordered w-64"
              placeholder="Sök entity, id, type"
            />
            <button className="btn btn-sm btn-ghost" type="button">
              Avancerat
            </button>
            <div className="flex items-center gap-2 rounded-full bg-base-300/60 px-3 py-2 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span>LIVE</span>
            </div>
            <div className="avatar">
              <div className="w-9 rounded-full ring ring-primary ring-offset-2 ring-offset-base-200">
                <img src="https://i.pravatar.cc/80?img=32" alt="User" />
              </div>
            </div>
          </div>
        </header>

        <Sidebar />

        <main className="row-span-1 overflow-hidden bg-base-100 px-6 py-6">
          {(typesError || (!typesLoading && types.length === 0)) && (
            <div className="alert alert-warning mb-4">
              <span className="text-sm">
                {typesError
                  ? "Kunde inte hämta typer från /types."
                  : "Inga typer hittades i /types (typeList.value är tom)."}
              </span>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Geo overview</div>
              <div className="text-lg font-semibold">Live karta</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-base-300 bg-base-200 px-4 py-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Tidsfilter
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    className="range range-xs range-primary w-36"
                    max={168}
                    min={1}
                    step={1}
                    type="range"
                    value={hoursBack}
                    onChange={(event) => setHoursBack(Number(event.target.value))}
                  />
                  <div className="text-xs text-slate-300">Senaste {hoursBack}h</div>
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" type="button">
                Spara vy
              </button>
              <button className="btn btn-sm btn-secondary" type="button">
                Skapa larm
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <MapView hoursBack={hoursBack} selectedType={selectedType} types={types} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
