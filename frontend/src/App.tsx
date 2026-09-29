import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  MapPin, 
  Clock, 
  Layers, 
  Calendar, 
  RefreshCw, 
  ShieldAlert, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MapLibreMap } from './components/MapLibreMap';
import { WhyDistrustPanel } from './components/WhyDistrustPanel';
import { BottomDrawers } from './components/BottomDrawers';
import { HistoricalReplayView } from './views/HistoricalReplayView';
import { EventCaseStudiesView } from './views/EventCaseStudiesView';
import { ModelMethodologyView } from './views/ModelMethodologyView';
import { ValidationView } from './views/ValidationView';
import { DataProvidersView } from './views/DataProvidersView';
import { GovernanceView } from './views/GovernanceView';
import { FeedbackQueueView } from './views/FeedbackQueueView';
import { RealtimeDisagreementView } from './views/RealtimeDisagreementView';
import { PredictionDetail, PriorityQueueItem, DataMode } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [dataMode, setDataMode] = useState<DataMode>('REPLAY');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [forecastVariable, setForecastVariable] = useState<string>('precipitation_mm_day');
  const [forecastRun, setForecastRun] = useState<string>('2024-07-15T00:00:00Z');
  const [activeLayer, setActiveLayer] = useState<string>('bust_probability');
  
  const [predictions, setPredictions] = useState<PredictionDetail[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<PriorityQueueItem[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('SUB_22'); // Default to Saurashtra & Kutch (high-risk case)
  const [replayStepIndex, setReplayStepIndex] = useState<number>(0);
  const [activeDemoStep, setActiveDemoStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Risk Map and Priority Data when Lead Time, Variable, or Forecast Run changes
  useEffect(() => {
    loadData();
  }, [leadTimeDays, forecastVariable, forecastRun]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [riskData, queueData] = await Promise.all([
        api.getRiskMap(leadTimeDays, forecastVariable, forecastRun),
        api.getPriorityQueue(leadTimeDays, forecastVariable)
      ]);
      setPredictions(riskData.predictions);
      setPriorityQueue(queueData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch operational forecast reliability data.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeDemoStep = (stepNumber: number) => {
    setActiveDemoStep(stepNumber);
    switch (stepNumber) {
      case 1:
        // Dashboard D+5
        setCurrentTab('dashboard');
        setLeadTimeDays(5);
        setDataMode('REPLAY');
        break;
      case 2:
        // Historical event at T-5 (Biparjoy)
        setCurrentTab('replay');
        setReplayStepIndex(0);
        break;
      case 3:
        // Region inspection (SUB_22 Saurashtra & Kutch)
        setCurrentTab('dashboard');
        setLeadTimeDays(5);
        setSelectedRegionId('SUB_22');
        break;
      case 4:
        // Why Distrust? (Empirical Drivers)
        setCurrentTab('dashboard');
        setSelectedRegionId('SUB_22');
        break;
      case 5:
        // Jump to T-1
        setCurrentTab('replay');
        setReplayStepIndex(2);
        break;
      case 6:
        // Reveal actual outcome (+143 mm bust)
        setCurrentTab('replay');
        setReplayStepIndex(3);
        break;
      case 7:
        // Today's Real Disagreement (GFS vs AIFS)
        setCurrentTab('realtime_disagreement');
        break;
      default:
        break;
    }
  };

  const selectedPrediction = predictions.find((p) => p.region_id === selectedRegionId) || predictions[0] || null;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        dataMode={dataMode}
        setDataMode={setDataMode}
        initTime={forecastRun.slice(0, 10) + ' 00 UTC'}
      />

      {/* SIH 2026 Primary Presentation Stepper */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 font-mono text-[10px] uppercase">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>SIH 2026 Evaluation Flow</span>
          </span>
          <span className="hidden sm:inline text-slate-400 text-xs">Quick Evaluation Stepper:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { step: 1, label: '1. Dashboard (D+5)' },
            { step: 2, label: '2. Replay T-5 (Biparjoy)' },
            { step: 3, label: '3. Inspect Saurashtra (SUB_22)' },
            { step: 4, label: '4. Why Distrust?' },
            { step: 5, label: '5. Jump to T-1' },
            { step: 6, label: '6. Reveal Outcome (+143mm)' },
            { step: 7, label: '7. Real GFS vs AIFS ⚡' }
          ].map(({ step, label }) => (
            <button
              key={step}
              onClick={() => executeDemoStep(step)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeDemoStep === step
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => executeDemoStep((activeDemoStep % 7) + 1)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-[11px] font-bold"
            title="Advance to next evaluation step"
          >
            <span>Next</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'dashboard' && (
          <div className="flex-1 flex flex-col p-3 space-y-3">
            {/* Top Operational Bar */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5 font-mono uppercase tracking-wider text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Lead Horizon Scrubber:</span>
                </span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <button
                      key={d}
                      onClick={() => setLeadTimeDays(d)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                        leadTimeDays === d
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      D+{d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Selector */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">VARIABLE:</span>
                  <select
                    value={forecastVariable}
                    onChange={(e) => setForecastVariable(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="precipitation_mm_day">Precipitation (mm/day)</option>
                    <option value="temperature_2m_c">2m Temperature (°C)</option>
                    <option value="wind_speed_10m_kmh">10m Wind Speed (km/h)</option>
                  </select>
                </div>

                {/* Risk Layer Selector */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">MAP LAYER:</span>
                  <select
                    value={activeLayer}
                    onChange={(e) => setActiveLayer(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="bust_probability">Calibrated Bust Risk P(Bust) (0–100%)</option>
                    <option value="ensemble_spread">NWP Ensemble Spread (mm)</option>
                    <option value="model_disagreement">Inter-Model Disagreement (mm)</option>
                    <option value="forecast_value">Forecast Raw Value (mm/day)</option>
                  </select>
                </div>

                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Refresh Forecast Run"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Core Map & Right Diagnostic Split */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[500px]">
              {/* Left Controls & Map (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col space-y-2">
                <div className="flex-1 relative">
                  <MapLibreMap
                    predictions={predictions}
                    selectedRegionId={selectedRegionId}
                    onSelectRegion={setSelectedRegionId}
                    activeLayer={activeLayer}
                    leadTimeDays={leadTimeDays}
                  />
                </div>
              </div>

              {/* Right Panel: WHY DISTRUST THIS FORECAST? (4 Cols) */}
              <div className="lg:col-span-4 h-full">
                <WhyDistrustPanel
                  prediction={selectedPrediction}
                  onFeedbackSubmitted={loadData}
                />
              </div>
            </div>

            {/* Bottom Drawer (Priority Queue, Degradation, Baselines, Provenance) */}
            <div className="w-full">
              <BottomDrawers
                priorityQueue={priorityQueue}
                selectedPrediction={selectedPrediction}
                onSelectRegion={setSelectedRegionId}
                leadTimeDays={leadTimeDays}
              />
            </div>
          </div>
        )}

        {/* View 2: Full Screen Reliability Map */}
        {currentTab === 'risk_map' && (
          <div className="flex-1 p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between bg-[#111827] p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-200">Full-Screen Spatial Reliability Explorer</span>
                <span className="text-slate-400 font-mono">India 36 IMD Subdivisions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Lead Horizon:</span>
                {[1, 3, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setLeadTimeDays(d)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      leadTimeDays === d ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    D+{d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[650px]">
              <MapLibreMap
                predictions={predictions}
                selectedRegionId={selectedRegionId}
                onSelectRegion={setSelectedRegionId}
                activeLayer={activeLayer}
                leadTimeDays={leadTimeDays}
              />
            </div>
          </div>
        )}

        {/* View 3: Historical Counterfactual Replay */}
        {currentTab === 'replay' && (
          <HistoricalReplayView
            initialEventId="biparjoy_2023"
            initialStepIndex={replayStepIndex}
          />
        )}

        {/* View 4: Event Case Studies */}
        {currentTab === 'case_studies' && <EventCaseStudiesView />}

        {/* View 5: Model & Methodology */}
        {currentTab === 'methodology' && <ModelMethodologyView />}

        {/* View 6: Validation & Calibration */}
        {currentTab === 'validation' && <ValidationView />}

        {/* View 7: Data Providers & OGC EDR */}
        {currentTab === 'providers' && <DataProvidersView />}

        {/* View 8: Governance & Provenance */}
        {currentTab === 'governance' && <GovernanceView />}

        {/* View 9: Forecaster Feedback Log */}
        {currentTab === 'feedback' && <FeedbackQueueView />}

        {/* View 10: Today's Real Forecast Disagreement */}
        {currentTab === 'realtime_disagreement' && <RealtimeDisagreementView />}
      </main>
    </div>
  );
};

export default App;
