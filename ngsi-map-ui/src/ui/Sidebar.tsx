export const Sidebar = () => {
  return (
    <aside className="flex h-full flex-col gap-6 border-r border-base-300 bg-base-200 px-6 py-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</div>
        <div className="mt-2 font-display text-xl">NGSI Control</div>
        <div className="mt-1 text-xs text-slate-400">Stockholm region</div>
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

      <div className="mt-auto">
        <button className="btn btn-outline btn-sm w-full" type="button">
          Skapa ny vy
        </button>
      </div>
    </aside>
  );
};
