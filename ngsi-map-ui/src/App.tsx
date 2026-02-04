import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapView } from "./map/MapView";
import { getTypes } from "./map/ngsiClient";
import { Sidebar } from "./ui/Sidebar";

const pad2 = (value: number) => String(value).padStart(2, "0");

// datetime-local uses local time without timezone (YYYY-MM-DDTHH:mm)
const toDateTimeLocalValue = (timestampMs: number) => {
  const date = new Date(timestampMs);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const parseDateTimeLocalValue = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const App = () => {
  const [observedRange, setObservedRange] = useState<{ min: number; max: number } | null>(null);
  const [rangeStart, setRangeStart] = useState(() => Date.now() - 24 * 60 * 60 * 1000);
  const [fitRequest, setFitRequest] = useState(0);
  const [pollingPaused, setPollingPaused] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [entityCount, setEntityCount] = useState(0);
  const {
    data: types = [],
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({
    queryKey: ["ngsi-types"],
    queryFn: ({ signal }) => getTypes(signal),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
  });

  const handleFromInputChange = (value: string) => {
    const parsed = parseDateTimeLocalValue(value);
    if (parsed === null) return;
    // Prevent selecting a start time in the future.
    setRangeStart(Math.min(parsed, Date.now()));
  };

  const rangeStartInput = toDateTimeLocalValue(rangeStart);
  const nowInput = toDateTimeLocalValue(Date.now());

  return (
    <div className="h-full bg-base-100 text-base-content">
      <div className="grid h-full grid-cols-[260px_1fr] grid-rows-[72px_1fr]">
        <header className="col-span-3 row-span-1 flex items-center justify-between border-b border-base-300 bg-base-200 px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin dashboard</div>
            <div className="font-display text-lg">Plan B</div>
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
          fromInput={rangeStartInput}
          fromMax={nowInput}
          minObserved={observedRange?.min}
          onFromChange={handleFromInputChange}
          pollingPaused={pollingPaused}
          onTogglePolling={() => setPollingPaused((value) => !value)}
          onRefresh={() => setRefreshSignal((value) => value + 1)}
          lastFetchedAt={lastFetchedAt}
          entityCount={entityCount}
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
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">Live karta</div>
                <button
                  aria-label="Centrera kartan"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setFitRequest((value) => value + 1)}
                  type="button"
                  title="Centrera kartan"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3l2.4 6.2L21 12l-6.6 2.8L12 21l-2.4-6.2L3 12l6.6-2.8L12 3z" />
                    <circle cx="12" cy="12" r="3.2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4" />
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <MapView
              onObservedRange={(range) => setObservedRange(range)}
              rangeStart={rangeStart}
              fitSignal={fitRequest}
              types={types}
              pollingPaused={pollingPaused}
              refreshSignal={refreshSignal}
              onFetchMeta={(meta) => {
                setEntityCount(meta.entityCount);
                if (meta.lastFetchedAt) {
                  setLastFetchedAt(meta.lastFetchedAt);
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
