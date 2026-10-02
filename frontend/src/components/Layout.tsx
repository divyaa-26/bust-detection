import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Map, 
  Radio, 
  History, 
  BarChart2, 
  BookOpen, 
  Send, 
  Database, 
  FileCheck2
} from 'lucide-react';
import { DataMode } from '../types';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dataMode: DataMode;
  setDataMode?: (mode: DataMode) => void;
  initTime: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setCurrentTab,
  dataMode,
  initTime,
  children
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', badge: 'MAP', icon: Map },
    { id: 'realtime_disagreement', label: 'Multi-Model Disagreement', badge: dataMode === 'REAL' ? 'LIVE' : 'VERIFIED', icon: Radio },
    { id: 'replay', label: 'Historical Replay & Bust Archives', badge: 'ARCHIVE', icon: History },
    { id: 'case_studies', label: 'Event Case Studies', badge: 'CASE', icon: BookOpen },
    { id: 'validation', label: 'Governance & Validation', badge: 'AUDIT', icon: BarChart2 },
    { id: 'methodology', label: 'Model Architecture & ML Specs', badge: 'METHOD', icon: BookOpen },
    { id: 'feedback', label: 'Forecaster Queue & Dispatch', badge: 'DISPATCH', icon: Send },
    { id: 'providers', label: 'Data Providers & OGC EDR', badge: 'INGEST', icon: Database },
    { id: 'governance', label: 'Provenance & Reproducibility', badge: 'LEGAL', icon: FileCheck2 },
  ];

  return (
    <div className={`bg-background font-body-md text-on-surface antialiased flex flex-col ${currentTab === 'dashboard' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Top Persistent Model Status Banner */}
      {currentTab === 'replay' ? (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center font-mono text-[10px] text-amber-300 font-bold tracking-wider uppercase flex items-center justify-center space-x-2">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>HISTORICAL COUNTERFACTUAL REPLAY MODE (CURATED SYNOPTIC ARCHIVE — CYCLONE BIPARJOY 2023)</span>
        </div>
      ) : (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1 text-center font-mono text-[10px] text-emerald-300 font-bold tracking-wider uppercase flex items-center justify-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>REAL GFS + OPEN-METEO VERIFIED MODEL (NOAA GFS 0.25° + 03Z–03Z CENTROID VERIFICATION)</span>
        </div>
      )}

      {/* Top Header - AETHER-CAST Workstation Banner */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-lg">
        <div className="h-16 w-full px-4 flex items-center justify-between gap-4">
          {/* Logo & Workstation Branding */}
          <div className="flex items-center space-x-3 min-w-max">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className="font-headline-md font-semibold tracking-tight text-slate-100 text-sm sm:text-base">
                  AETHER-CAST
                </span>
                <span className="font-label-caps uppercase text-slate-400 text-[10px]">
                  // MET-ENSEMBLE INDIA
                </span>
              </div>
              <span className="font-label-caps uppercase text-slate-400 text-[10px]">
                FORECAST BUST DETECTION &amp; RISK ANALYTICS • SIH26079
              </span>
            </div>
          </div>

          {/* Top Right Controls: Synoptic Time */}
          <div className="flex items-center space-x-3 shrink-0 text-xs font-mono">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase text-slate-400">SYNOPTIC RUN</span>
              <span className="text-sky-300 text-xs font-bold">{initTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Contributor Workstation Rail Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar: Avi's Workstation Rail / Atmospheric HUD */}
        <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0 z-40 shadow-xl">
          <div className="px-4 py-3 border-b border-outline-variant flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-slate-400 text-[10px]">
              WORKSTATION RAIL
            </span>
            <span className="font-headline-md font-semibold text-slate-200 text-sm">
              Atmospheric HUD
            </span>
          </div>

          <nav className="flex-1 px-2 py-3 flex flex-col space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full px-3 py-2 rounded text-left font-body-md text-xs transition-colors flex items-center justify-between group ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-200 border-l-2 border-sky-400 font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className={`font-label-badge uppercase px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ml-1 border transition-colors ${
                    isActive 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 font-bold' 
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/50 group-hover:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Telemetry HUD */}
          <div className="p-3 bg-surface-container-low/70 border-t border-outline-variant text-[10px] font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-[10px]">INGEST LATENCY</span>
              <span className="text-slate-200 font-bold">42ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-[10px]">GRID RESOLUTION</span>
              <span className="text-slate-200 font-bold">0.25° GFS / IMD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-[10px]">GEODATA SOURCE</span>
              <span className="text-slate-200 font-bold">NOAA GFS / IMD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-[10px]">MODEL ENGINE</span>
              <span className="text-emerald-400 font-bold">LightGBM+Isotonic</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 bg-background ${currentTab === 'dashboard' ? 'overflow-hidden flex flex-col min-h-0 p-2 sm:p-3' : 'overflow-y-auto p-3'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
