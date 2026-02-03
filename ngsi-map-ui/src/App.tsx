import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MapView } from "./map/MapView";
import { getTypes } from "./map/ngsiClient";
import { Sidebar } from "./ui/Sidebar";

const clampRange = (start: number, end: number): [number, number] =>
  start > end ? [end, start] : [start, end];
const toInputValue = (value: number) => new Date(value).toISOString().slice(0, 16);
const fromInputValue = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const App = () => {
  const [selectedType, setSelectedType] = useState("__all__");
  const [observedRange, setObservedRange] = useState<{ min: number; max: number } | null>(null);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
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

  useEffect(() => {
    if (!observedRange) return;
    if (rangeStart === null || rangeEnd === null) {
      const now = Date.now();
      setRangeStart(observedRange.min);
      setRangeEnd(now);
      setFromInput(toInputValue(observedRange.min));
      setToInput(toInputValue(now));
      return;
    }
    if (rangeStart < observedRange.min) {
      setRangeStart(observedRange.min);
      setFromInput(toInputValue(observedRange.min));
    }
    if (rangeEnd > Date.now()) {
      setRangeEnd(Date.now());
      setToInput(toInputValue(Date.now()));
    }
  }, [observedRange, rangeEnd, rangeStart]);

  const handleFromInputChange = (value: string) => {
    setFromInput(value);
    const parsed = fromInputValue(value);
    if (parsed === null) return;
    const [start, end] = clampRange(parsed, rangeEnd ?? parsed);
    setRangeStart(start);
    setRangeEnd(end);
  };

  const handleToInputChange = (value: string) => {
    setToInput(value);
    const parsed = fromInputValue(value);
    if (parsed === null) return;
    const [start, end] = clampRange(rangeStart ?? parsed, parsed);
    setRangeStart(start);
    setRangeEnd(end);
  };

  return (
    <div className="h-full bg-base-100 text-base-content">
      <div className="grid h-full grid-cols-[260px_1fr] grid-rows-[72px_1fr]">
        <header className="col-span-3 row-span-1 flex items-center justify-between border-b border-base-300 bg-base-200 px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin dashboard</div>
            <div className="font-display text-lg">NGSI-LD Geo Monitor</div>
          </div>
          <div className="flex items-center gap-3">
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

        <Sidebar
          fromInput={fromInput}
          minObserved={observedRange?.min}
          onFromChange={handleFromInputChange}
          onToChange={handleToInputChange}
          toInput={toInput}
        />

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
            <div className="flex items-center gap-4" />
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
