import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  History, 
  Cpu, 
  CheckCircle2, 
  Database, 
  FileText, 
  MessageSquare,
  AlertTriangle,
  Info,
  Radio,
  Server
} from 'lucide-react';
import { DataMode } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  initTime: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  dataMode,
  setDataMode,
  initTime
}) => {
  const [showProviderModal, setShowProviderModal] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'risk_map', label: 'Reliability Map', icon: ShieldAlert },
    { id: 'replay', label: 'Counterfactual Replay', icon: History },
    { id: 'realtime_disagreement', label: "Today's Real Disagreement", icon: Radio },
    { id: 'case_studies', label: 'Case Studies', icon: Radio },
    { id: 'methodology', label: 'Model & Baselines', icon: Cpu },
    { id: 'validation', label: 'Calibration & Metrics', icon: CheckCircle2 },
    { id: 'providers', label: 'Data Providers & EDR', icon: Database },
    { id: 'governance', label: 'Governance & Audit', icon: FileText },
    { id: 'feedback', label: 'Forecaster Log', icon: MessageSquare },
  ];

  return (
    <>
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 shadow-md">
        {/* Persistent Prototype Banner */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center font-mono text-[10px] text-amber-300 font-bold tracking-wider uppercase flex items-center justify-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED (STAGE 1 OPERATIONAL ARCHITECTURE)</span>
        </div>

        {/* Top Header */}
        <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-950/80 border border-red-500/40 rounded-lg text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-950 border border-sky-600/40 text-sky-300">
                  SIH26079 • MoES
                </span>
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  Forecast Reliability Intelligence & Decision Support
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                AI-Based Forecast Bust Detection Layer for Medium-Range Weather Forecasts
              </p>
            </div>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-3">
            {/* Active Data Mode Badge */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md text-xs">
              <span className="text-slate-400 font-mono text-[10px]">DATA MODE:</span>
              <button
                onClick={() => setDataMode(dataMode === 'REPLAY' ? 'DEMO' : 'REPLAY')}
                title="Click to toggle between Historical Replay and Synthetic Demo Mode"
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition ${
                  dataMode === 'REPLAY'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {dataMode}
              </button>
            </div>

            {/* Provider Connectivity Pills */}
            <button
              onClick={() => setShowProviderModal(true)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-xs transition"
              title="Inspect Active NWP / AI Data Provider Status"
            >
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center space-x-1.5">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-semibold text-[11px]">GFS</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-semibold text-[11px]">AIFS</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400 line-through text-[11px]" title="NCUM: Institutional MoES access required (Honest Disconnected State)">
                  NCUM
                </span>
              </div>
            </button>

            {/* Cycle Run Time */}
            <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 text-xs font-mono bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded">
              <span className="text-slate-500">CYCLE:</span>
              <span className="text-slate-200">{initTime}</span>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1920px] mx-auto px-4 flex items-center space-x-1 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Honest Data Provider Status Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-slate-100">NWP & AI Data Provider Connectivity</h3>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>GFS (0.25° Global Forecast System)</span>
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">ACTIVE</span>
                </div>
                <p className="text-slate-300 mt-1">Agency: NOAA / NCEP • Resolution: 0.25° (~25km)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Legitimate access via NOAA Open Data AWS & NOMADS.</p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>AIFS (ECMWF Open Data AI-NWP)</span>
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">CONNECTED</span>
                </div>
                <p className="text-slate-300 mt-1">Agency: ECMWF • Resolution: 0.25° (~28km)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Legitimate open access under ECMWF Open Data license.</p>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30">
                <div className="flex items-center justify-between font-bold text-rose-400">
                  <span>NCUM (NCMRWF Unified Model)</span>
                  <span className="bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">NOT CONNECTED</span>
                </div>
                <p className="text-slate-300 mt-1">Agency: NCMRWF / MoES India • Resolution: 12km / 4km</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  <strong className="text-rose-300">SCIENTIFIC HONESTY:</strong> Restricted institutional MoES access. We DO NOT fake or simulate NCUM data. The system demonstrates graceful degradation to single/multi-model fallback.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
