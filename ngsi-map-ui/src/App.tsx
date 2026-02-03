import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { MapView } from "./map/MapView";
import { getTypes } from "./map/ngsiClient";
import { Sidebar } from "./ui/Sidebar";

type TimelineRangeProps = {
  fromHoursBack: number;
  toHoursBack: number;
  onChange: (from: number, to: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const TimelineRange = ({ fromHoursBack, toHoursBack, onChange }: TimelineRangeProps) => {
  const minHours = 0;
  const maxHours = 168;
  const widthHours = Math.max(1, toHoursBack - fromHoursBack);
  const handlePercent = (value: number) => ((value - minHours) / (maxHours - minHours)) * 100;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const clickedValue = Math.round(minHours + ratio * (maxHours - minHours));

    if (clickedValue >= fromHoursBack && clickedValue <= toHoursBack) {
      const nextFrom = clamp(clickedValue - Math.round(widthHours / 2), minHours, maxHours);
      const nextTo = clamp(nextFrom + widthHours, minHours, maxHours);
      onChange(nextFrom, nextTo);
      return;
    }

    const distanceToFrom = Math.abs(clickedValue - fromHoursBack);
    const distanceToTo = Math.abs(clickedValue - toHoursBack);
    if (distanceToFrom <= distanceToTo) {
      const nextFrom = clamp(clickedValue, minHours, Math.min(toHoursBack - 1, maxHours));
      onChange(nextFrom, toHoursBack);
    } else {
      const nextTo = clamp(clickedValue, Math.max(fromHoursBack + 1, minHours), maxHours);
      onChange(fromHoursBack, nextTo);
    }
  };

  const handleFromChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFrom = clamp(Number(event.target.value), minHours, toHoursBack - 1);
    onChange(nextFrom, toHoursBack);
  };

  const handleToChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTo = clamp(Number(event.target.value), fromHoursBack + 1, maxHours);
    onChange(fromHoursBack, nextTo);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const increment = event.shiftKey ? 6 : 1;
    const direction = event.key === " " ? 1 : -1;
    const nextFrom = clamp(fromHoursBack + direction * increment, minHours, maxHours - widthHours);
    const nextTo = clamp(nextFrom + widthHours, minHours, maxHours);
    onChange(nextFrom, nextTo);
  };

  return (
    <div className="mt-3">
      <div
        className="relative h-3 w-[320px] rounded-full bg-base-300"
        aria-valuemax={maxHours}
        aria-valuemin={minHours}
        aria-valuenow={fromHoursBack}
        aria-label="Tidsfönster"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={0}
      >
        <div
          className="absolute h-3 rounded-full bg-primary/70"
          style={{
            left: `${handlePercent(fromHoursBack)}%`,
            right: `${100 - handlePercent(toHoursBack)}%`,
          }}
        />
        <div
          className="absolute -top-1 h-5 w-2 rounded-full bg-primary"
          style={{ left: `calc(${handlePercent(fromHoursBack)}% - 4px)` }}
        />
        <div
          className="absolute -top-1 h-5 w-2 rounded-full bg-primary"
          style={{ left: `calc(${handlePercent(toHoursBack)}% - 4px)` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="range range-xs range-primary w-[150px]"
          max={maxHours}
          min={minHours}
          step={1}
          type="range"
          value={fromHoursBack}
          onChange={handleFromChange}
        />
        <input
          className="range range-xs range-primary w-[150px]"
          max={maxHours}
          min={minHours}
          step={1}
          type="range"
          value={toHoursBack}
          onChange={handleToChange}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [selectedType, setSelectedType] = useState("__all__");
  const [fromHoursBack, setFromHoursBack] = useState(0);
  const [toHoursBack, setToHoursBack] = useState(24);
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
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-xs text-slate-300">
                    {fromHoursBack}h → {toHoursBack}h bakåt
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Fönster: {Math.max(1, toHoursBack - fromHoursBack)}h
                  </div>
                </div>
                <TimelineRange
                  fromHoursBack={fromHoursBack}
                  onChange={(nextFrom, nextTo) => {
                    setFromHoursBack(nextFrom);
                    setToHoursBack(nextTo);
                  }}
                  toHoursBack={toHoursBack}
                />
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
            <MapView
              fromHoursBack={fromHoursBack}
              selectedType={selectedType}
              toHoursBack={toHoursBack}
              types={types}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
