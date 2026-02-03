import { MapView } from "./map/MapView";
import { EntityPanel } from "./ui/EntityPanel";
import { Sidebar } from "./ui/Sidebar";

const App = () => {
  return (
    <div className="h-full bg-base-100 text-base-content">
      <div className="grid h-full grid-cols-[260px_1fr_320px] grid-rows-[72px_1fr]">
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Geo overview</div>
              <div className="text-lg font-semibold">Live karta</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-ghost" type="button">
                Spara vy
              </button>
              <button className="btn btn-sm btn-secondary" type="button">
                Skapa larm
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <MapView />
          </div>
        </main>

        <EntityPanel />
      </div>
    </div>
  );
};

export default App;
