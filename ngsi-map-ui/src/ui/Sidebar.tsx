type SidebarProps = {
  fromInput: string;
  fromMax: string;
  minObserved?: number;
  onFromChange: (value: string) => void;
  pollingPaused: boolean;
  onTogglePolling: () => void;
  onRefresh: () => void;
  lastFetchedAt?: number | null;
  entityCount: number;
};

export const Sidebar = ({
  fromInput,
  fromMax,
  minObserved,
  onFromChange,
  pollingPaused,
  onTogglePolling,
  onRefresh,
  lastFetchedAt,
  entityCount,
}: SidebarProps) => {
  const lastFetchedLabel = lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleString("sv-SE")
    : "Ej hämtat ännu";

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-base-300 bg-base-200 px-6 py-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</div>
        <div className="mt-2 font-display text-xl">Plan B Control</div>
        <div className="mt-1 text-xs text-slate-400" />
      </div>

      <ul className="menu rounded-box bg-base-300/60 p-2 text-sm">
        <li>
          <a className="active" href="#overview">
            Översikt
          </a>
        </li>
        <li>
          <a href="#entities">Enheter</a>
        </li>
        <li>
          <a href="#alerts">Event & larm</a>
        </li>
        <li>
          <a href="#quality">Datakvalitet</a>
        </li>
        <li>
          <a href="#reports">Rapporter</a>
        </li>
      </ul>

      <div className="rounded-box bg-base-300/60 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Snabbstatus</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-lg font-semibold">128</div>
            <div className="text-xs text-slate-400">Aktiva noder</div>
          </div>
          <div>
            <div className="text-lg font-semibold">7</div>
            <div className="text-xs text-slate-400">Larm</div>
          </div>
          <div>
            <div className="text-lg font-semibold">93%</div>
            <div className="text-xs text-slate-400">Täckning</div>
          </div>
          <div>
            <div className="text-lg font-semibold">1.2s</div>
            <div className="text-xs text-slate-400">Latens</div>
          </div>
        </div>
      </div>

      <div className="rounded-box bg-base-300/60 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tidsfilter</div>
        <div className="mt-3 flex flex-col gap-3">
          {minObserved !== undefined && (
            <div className="text-[10px] text-slate-400">
              Från tidigast {new Date(minObserved).toLocaleString("sv-SE")}
            </div>
          )}
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Från
            <input
              className="input input-sm input-bordered"
              max={fromMax}
              type="datetime-local"
              value={fromInput}
              onChange={(event) => onFromChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-box bg-base-300/60 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Cache & uppdatering</div>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Senast hämtad</span>
            <span>{lastFetchedLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Antal entities</span>
            <span className="font-semibold">{entityCount}</span>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary flex-1" type="button" onClick={onRefresh}>
              Uppdatera nu
            </button>
            <button
              className="btn btn-sm btn-outline flex-1"
              type="button"
              onClick={onTogglePolling}
            >
              {pollingPaused ? "Starta polling" : "Pausa polling"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
