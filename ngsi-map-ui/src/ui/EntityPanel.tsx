export const EntityPanel = () => {
  return (
    <aside className="flex h-full flex-col gap-5 border-l border-base-300 bg-base-200 px-6 py-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Filter</div>
        <div className="mt-3 flex flex-col gap-3">
          <select className="select select-sm select-bordered">
            <option>Alla typer</option>
            <option>Station</option>
            <option>Sensor</option>
          </select>
          <select className="select select-sm select-bordered">
            <option>Alla status</option>
            <option>Active</option>
            <option>Maintenance</option>
          </select>
          <button className="btn btn-sm btn-primary" type="button">
            Uppdatera vy
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Senaste entities</div>
        <div className="mt-3 space-y-3">
          {[
            { name: "Central", type: "Station", status: "active" },
            { name: "North", type: "Station", status: "maintenance" },
            { name: "Beta", type: "Sensor", status: "active" },
          ].map((item) => (
            <div key={item.name} className="rounded-xl border border-base-300 bg-base-300/40 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.type}</div>
                </div>
                <div
                  className={`badge badge-sm ${item.status === "active" ? "badge-success" : "badge-warning"}`}
                >
                  {item.status}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">Senast uppdaterad för 2 min sedan</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-base-300 bg-base-300/40 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">API</div>
        <div className="mt-2 text-sm">NGSI-LD /v1/entities</div>
        <div className="mt-1 text-xs text-slate-400">Polling 15s</div>
      </div>
    </aside>
  );
};
