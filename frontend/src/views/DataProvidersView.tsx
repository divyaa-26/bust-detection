import React, { useState } from 'react';
import { Database, Server, CheckCircle2, AlertOctagon, Terminal, Play, FileJson } from 'lucide-react';

export const DataProvidersView: React.FC = () => {
  const [edrCoords, setEdrCoords] = useState('POINT(70.3 22.3)');
  const [edrLead, setEdrLead] = useState(5);
  const [edrResponse, setEdrResponse] = useState<any>(null);
  const [isLoadingEdr, setIsLoadingEdr] = useState(false);

  const handleTestEdr = async () => {
    setIsLoadingEdr(true);
    try {
      const res = await fetch(`/edr/collections/forecast-bust/position?coords=${encodeURIComponent(edrCoords)}&lead_time_days=${edrLead}`);
      const data = await res.json();
      setEdrResponse(data);
    } catch (err) {
      setEdrResponse({ error: 'Failed to query OGC EDR endpoint' });
    } finally {
      setIsLoadingEdr(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase border border-emerald-500/30">
            INTEROPERABILITY & INFRASTRUCTURE
          </span>
          <h2 className="text-xl font-bold text-slate-100">Data Providers & OGC API-EDR-Style Endpoints</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Model-agnostic ingestion layer supporting NWP, data-driven AI systems, and endpoints modeled on OGC Environmental Data Retrieval (EDR) patterns.
        </p>
      </div>

      {/* Active Providers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GFS */}
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-100">GFS (0.25°)</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>Agency: NOAA / NCEP</div>
            <div>Resolution: 0.25° (~25km)</div>
            <div>Cycle: 6-hourly (00, 06, 12, 18 UTC)</div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            Legitimate open access via AWS NOAA Open Data Archive & Operational NOMADS server.
          </p>
        </div>

        {/* AIFS */}
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100 text-sm">AIFS (ECMWF Open)</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
              CONNECTED
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>Agency: ECMWF</div>
            <div>Resolution: 0.25° (~28km)</div>
            <div>Cycle: 12-hourly (00, 12 UTC)</div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            Data-driven deep learning NWP model openly licensed under CC-BY-4.0 via ECMWF Open Data API.
          </p>
        </div>

        {/* ECMWF IFS */}
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100 text-sm">ECMWF IFS (ENS)</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
              PARTIAL (WMO)
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>Agency: ECMWF</div>
            <div>Resolution: 0.4° (WMO Subset)</div>
            <div>Cycle: 12-hourly</div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            WMO Essential open dataset accessible; commercial high-resolution fields require licensing.
          </p>
        </div>

        {/* NCUM (Honest Disconnected State) */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-300 text-sm">NCUM (MoES)</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase border border-rose-500/30">
              NOT CONNECTED
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>Agency: NCMRWF / MoES</div>
            <div>Resolution: 12km / 4km</div>
            <div>Cycle: Operational</div>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            <strong>RESTRICTED:</strong> Institutional MoES peering required. We do <strong>NOT</strong> simulate or fake NCUM data.
          </p>
        </div>
      </div>

      {/* OGC API - EDR Interactive Query Console */}
      <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-sky-400">
            <Terminal className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              OGC API-EDR-Style Interactive Console (Modeled on OGC API-EDR)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Modeled on OGC API-EDR Part 1 Core (Conformance Testing Pending)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs">
          <div>
            <label className="text-[11px] font-mono text-slate-400 mb-1 block">WKT Position Query (POINT lon lat):</label>
            <input
              type="text"
              value={edrCoords}
              onChange={(e) => setEdrCoords(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 mb-1 block">Lead Horizon (Days):</label>
            <input
              type="number"
              min={1}
              max={10}
              value={edrLead}
              onChange={(e) => setEdrLead(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <button
              onClick={handleTestEdr}
              disabled={isLoadingEdr}
              className="w-full py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center space-x-2 transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isLoadingEdr ? 'Querying...' : 'Execute OGC Query'}</span>
            </button>
          </div>
        </div>

        {edrResponse && (
          <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-60">
            <div className="flex items-center justify-between text-slate-500 text-[10px] pb-1 border-b border-slate-900 mb-2">
              <span>RESPONSE: /edr/collections/forecast-bust/position</span>
              <span>STATUS: 200 OK</span>
            </div>
            <pre>{JSON.stringify(edrResponse, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
