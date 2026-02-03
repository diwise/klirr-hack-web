import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { MapView } from "./map/MapView";
import { getTypes } from "./map/ngsiClient";
import { Sidebar } from "./ui/Sidebar";

type TimelineRangeProps = {
  rangeStart: number;
  rangeEnd: number;
  min: number;
  max: number;
  onChange: (start: number, end: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const formatDate = (value: number) => new Date(value).toLocaleString("sv-SE");

const TimelineRange = ({ rangeStart, rangeEnd, min, max, onChange }: TimelineRangeProps) => {
  const windowSize = Math.max(1, rangeEnd - rangeStart);
  const handlePercent = (value: number) => ((value - min) / (max - min)) * 100;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const clickedValue = Math.round(min + ratio * (max - min));

    if (clickedValue >= rangeStart && clickedValue <= rangeEnd) {
      const nextStart = clamp(clickedValue - Math.round(windowSize / 2), min, max - windowSize);
      const nextEnd = clamp(nextStart + windowSize, min, max);
      onChange(nextStart, nextEnd);
      return;
    }

    const distanceToStart = Math.abs(clickedValue - rangeStart);
    const distanceToEnd = Math.abs(clickedValue - rangeEnd);
    if (distanceToStart <= distanceToEnd) {
      const nextStart = clamp(clickedValue, min, Math.min(rangeEnd - 1, max));
      onChange(nextStart, rangeEnd);
    } else {
      const nextEnd = clamp(clickedValue, Math.max(rangeStart + 1, min), max);
      onChange(rangeStart, nextEnd);
    }
  };

  const handleFromChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextStart = clamp(Number(event.target.value), min, rangeEnd - 1);
    onChange(nextStart, rangeEnd);
  };

  const handleToChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEnd = clamp(Number(event.target.value), rangeStart + 1, max);
    onChange(rangeStart, nextEnd);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const increment = event.shiftKey ? 60 * 60 * 1000 : 15 * 60 * 1000;
    const direction = event.key === " " ? 1 : -1;
    const nextStart = clamp(rangeStart + direction * increment, min, max - windowSize);
    const nextEnd = clamp(nextStart + windowSize, min, max);
    onChange(nextStart, nextEnd);
  };

  return (
    <div className="mt-3">
      <div
        className="relative h-3 w-[320px] rounded-full bg-base-300"
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={rangeStart}
        aria-label="Tidsfönster"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={0}
      >
        <div
          className="absolute h-3 rounded-full bg-primary/70"
          style={{
            left: `${handlePercent(rangeStart)}%`,
            right: `${100 - handlePercent(rangeEnd)}%`,
          }}
        />
        <div
          className="absolute -top-1 h-5 w-2 rounded-full bg-primary"
          style={{ left: `calc(${handlePercent(rangeStart)}% - 4px)` }}
        />
        <div
          className="absolute -top-1 h-5 w-2 rounded-full bg-primary"
          style={{ left: `calc(${handlePercent(rangeEnd)}% - 4px)` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="range range-xs range-primary w-[150px]"
          max={max}
          min={min}
          step={1}
          type="range"
          value={rangeStart}
          onChange={handleFromChange}
        />
        <input
          className="range range-xs range-primary w-[150px]"
          max={max}
          min={min}
          step={1}
          type="range"
          value={rangeEnd}
          onChange={handleToChange}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [selectedType, setSelectedType] = useState("__all__");
  const [observedRange, setObservedRange] = useState<{ min: number; max: number } | null>(null);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const windowSize = useMemo(() => {
    if (rangeStart === null || rangeEnd === null) return 0;
    return Math.max(1, rangeEnd - rangeStart);
  }, [rangeEnd, rangeStart]);

  useEffect(() => {
    if (!observedRange) return;
    if (rangeStart === null || rangeEnd === null) {
      setRangeStart(observedRange.min);
      setRangeEnd(observedRange.max);
      return;
    }
    if (rangeStart < observedRange.min || rangeEnd > observedRange.max) {
      setRangeStart(observedRange.min);
      setRangeEnd(observedRange.max);
    }
  }, [observedRange, rangeEnd, rangeStart]);

  useEffect(() => {
    if (!isPlaying || !observedRange || rangeStart === null || rangeEnd === null) return;
    const step = 15 * 60 * 1000;
    const interval = window.setInterval(() => {
      setRangeStart((prev) => {
        if (prev === null) return prev;
        const next = prev + step;
        const maxStart = observedRange.max - windowSize;
        return next > maxStart ? maxStart : next;
      });
      setRangeEnd((prev) => {
        if (prev === null) return prev;
        const next = prev + step;
        return next > observedRange.max ? observedRange.max : next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, observedRange, rangeEnd, rangeStart, windowSize]);

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
                  {observedRange && rangeStart !== null && rangeEnd !== null && (
                    <>
                      <div className="text-xs text-slate-300">
                        {formatDate(rangeStart)} → {formatDate(rangeEnd)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Fönster: {Math.max(1, Math.round((rangeEnd - rangeStart) / 3600000))}h
                      </div>
                    </>
                  )}
                </div>
                {observedRange && rangeStart !== null && rangeEnd !== null && (
                  <TimelineRange
                    max={observedRange.max}
                    min={observedRange.min}
                    onChange={(nextStart, nextEnd) => {
                      setRangeStart(nextStart);
                      setRangeEnd(nextEnd);
                    }}
                    rangeEnd={rangeEnd}
                    rangeStart={rangeStart}
                  />
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setIsPlaying((prev) => !prev)}
                    type="button"
                  >
                    {isPlaying ? "Pausa" : "Spela"}
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      if (!observedRange || rangeStart === null || rangeEnd === null) return;
                      const step = 15 * 60 * 1000;
                      const nextStart = clamp(
                        rangeStart - step,
                        observedRange.min,
                        observedRange.max,
                      );
                      const nextEnd = clamp(rangeEnd - step, observedRange.min, observedRange.max);
                      setRangeStart(nextStart);
                      setRangeEnd(nextEnd);
                    }}
                    type="button"
                  >
                    ◀ 15m
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      if (!observedRange || rangeStart === null || rangeEnd === null) return;
                      const step = 15 * 60 * 1000;
                      const nextStart = clamp(
                        rangeStart + step,
                        observedRange.min,
                        observedRange.max,
                      );
                      const nextEnd = clamp(rangeEnd + step, observedRange.min, observedRange.max);
                      setRangeStart(nextStart);
                      setRangeEnd(nextEnd);
                    }}
                    type="button"
                  >
                    15m ▶
                  </button>
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
            <MapView
              onObservedRange={(range) => setObservedRange(range)}
              rangeEnd={rangeEnd ?? undefined}
              rangeStart={rangeStart ?? undefined}
              selectedType={selectedType}
              types={types}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
