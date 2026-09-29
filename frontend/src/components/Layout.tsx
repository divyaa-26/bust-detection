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
  FileCheck2,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { DataMode } from '../types';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  leadTimeDays: number;
  setLeadTimeDays: (days: number) => void;
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  initTime: string;
  activeDemoStep: number;
  onExecuteDemoStep: (step: number) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setCurrentTab,
  leadTimeDays,
  setLeadTimeDays,
  dataMode,
  setDataMode,
  initTime,
  activeDemoStep,
  onExecuteDemoStep,
  children
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', badge: 'MAP', badgeColor: 'text-primary bg-surface-container', icon: Map },
    { id: 'realtime_disagreement', label: 'Realtime Disagreement', badge: 'LIVE-SYNC', badgeColor: 'text-primary-fixed bg-surface-container', icon: Radio },
    { id: 'replay', label: 'Historical Replay & Bust Archives', badge: 'ARCHIVE', badgeColor: 'text-tertiary-fixed-dim bg-surface-container', icon: History },
    { id: 'case_studies', label: 'Event Case Studies', badge: 'CASE', badgeColor: 'text-sky-300 bg-sky-950/40', icon: BookOpen },
    { id: 'validation', label: 'Governance & Validation', badge: 'AUDIT', badgeColor: 'text-emerald-400 bg-emerald-950/40', icon: BarChart2 },
    { id: 'methodology', label: 'Model Architecture & ML Specs', badge: 'METHO', badgeColor: 'text-purple-300 bg-purple-950/40', icon: BookOpen },
    { id: 'feedback', label: 'Forecaster Queue & Dispatch', badge: 'DISPATCH', badgeColor: 'text-amber-300 bg-amber-950/40', icon: Send },
    { id: 'providers', label: 'Data Providers & OGC EDR', badge: 'INGEST', badgeColor: 'text-outline bg-surface-container', icon: Database },
    { id: 'governance', label: 'Provenance & Reproducibility', badge: 'LEGAL', badgeColor: 'text-sky-300 bg-sky-950/40', icon: FileCheck2 },
  ];

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Top Persistent Model Status Banner */}
      <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1 text-center font-mono text-[10px] text-emerald-300 font-bold tracking-wider uppercase flex items-center justify-center space-x-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>REAL GFS + IMD TRAINED MODEL (NOAA GFS 0.25° + IMD DAILY GRIDDED VERIFICATION)</span>
      </div>

      {/* Top Header - AETHER-DISPUTE Workstation Banner */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-lg">
        <div className="h-16 w-full px-4 flex items-center justify-between gap-4">
          {/* Logo & Workstation Branding */}
          <div className="flex items-center space-x-3 min-w-max">
            <div className="p-2 bg-primary/10 border border-primary-container/40 rounded-lg text-primary-container">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className="font-headline-md font-semibold tracking-tight text-primary text-sm sm:text-base">
                  AETHER-DISPUTE
                </span>
                <span className="font-label-caps uppercase text-on-surface-variant text-[10px]">
                  // MET-ENSEMBLE INDIA
                </span>
              </div>
              <span className="font-label-caps uppercase text-outline text-[9px]">
                FORECAST BUST DETECTION SYSTEM • SIH26079
              </span>
            </div>
          </div>

          {/* Quick Evaluation Stepper */}
          <div className="hidden lg:flex items-center space-x-1 bg-surface-container-low px-2 py-1 rounded border border-outline-variant/60 text-xs">
            <span className="text-[10px] font-mono uppercase text-primary-fixed mr-1 font-bold">
              SIH Flow:
            </span>
            {[
              { step: 1, label: '1. D+5' },
              { step: 2, label: '2. T-5 Biparjoy' },
              { step: 3, label: '3. Saurashtra' },
              { step: 4, label: '4. Why Distrust' },
              { step: 5, label: '5. Jump T-1' },
              { step: 6, label: '6. +143mm Bust' },
              { step: 7, label: '7. GFS vs AIFS' }
            ].map(({ step, label }) => (
              <button
                key={step}
                onClick={() => onExecuteDemoStep(step)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                  activeDemoStep === step
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => onExecuteDemoStep((activeDemoStep % 7) + 1)}
              className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-primary"
              title="Next Step"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Top Right Controls: Synoptic Time & Lead Selector */}
          <div className="flex items-center space-x-3 shrink-0 text-xs font-mono">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] uppercase text-outline">SYNOPTIC RUN</span>
              <span className="text-primary-fixed text-[11px] font-bold">{initTime}</span>
            </div>

            <div className="h-6 w-px bg-outline-variant hidden sm:block" />

            <div className="flex items-center space-x-1.5 bg-surface-container px-2.5 py-1 rounded border border-outline-variant">
              <Sliders className="w-3.5 h-3.5 text-primary-container" />
              <span className="text-[10px] uppercase text-outline">LEAD:</span>
              <select
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="bg-transparent font-bold text-primary-fixed focus:outline-none cursor-pointer text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                  <option key={d} value={d} className="bg-surface-container-lowest text-on-surface">
                    D+{d} ({d * 24}h)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Contributor Workstation Rail Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Avi's Workstation Rail / Atmospheric HUD */}
        <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0 z-40 shadow-xl">
          <div className="px-4 py-3 border-b border-outline-variant flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-outline text-[10px]">
              WORKSTATION RAIL
            </span>
            <span className="font-headline-md font-semibold text-on-surface text-sm">
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
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-on-primary-container' : 'text-outline group-hover:text-primary-fixed'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className={`font-label-badge uppercase px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0 ml-1 ${
                    isActive ? 'bg-on-primary-container/20 text-on-primary-container font-bold' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Telemetry HUD */}
          <div className="p-3 bg-surface-container-low/70 border-t border-outline-variant text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[9px]">INGEST LATENCY</span>
              <span className="text-primary-fixed font-bold">42ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[9px]">GRID RESOLUTION</span>
              <span className="text-on-surface font-bold">0.25° GFS / IMD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[9px]">GEODATA SOURCE</span>
              <span className="text-on-surface font-bold">NOAA GFS / IMD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[9px]">MODEL ENGINE</span>
              <span className="text-emerald-400 font-bold">LightGBM+Isotonic</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-3">
          {children}
        </main>
      </div>
    </div>
  );
};
