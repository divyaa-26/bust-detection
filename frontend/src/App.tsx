import React, { useState, useEffect, useMemo } from 'react';
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
import { Layout } from './components/Layout';
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
import { ReviewFlagsDrawer } from './components/ReviewFlagsDrawer';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState<boolean>(true);

  // Existing risk-tier filter: count regions marked as CRITICAL or HIGH_REVIEW
  const alertFlagsCount = predictions.filter(
    (p) => p.operational_priority === 'CRITICAL — INSPECTION REQUIRED' || p.operational_priority === 'HIGH — REVIEW'
  ).length;

  // Fetch Risk Map and Priority Data when Lead Time, Variable, or Forecast Run changes
  useEffect(() => {
    loadData();
  }, [leadTimeDays, forecastVariable, forecastRun]);

  // Fetch full D+1 to D+10 Spatio-Temporal Matrix when Variable or Forecast Run changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMatrix(true);
    api.getRegionLeadMatrix(forecastVariable, forecastRun)
      .then((data) => {
        if (isMounted) {
          setMatrixData(data);
          setIsLoadingMatrix(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch region-lead matrix:', err);
        if (isMounted) setIsLoadingMatrix(false);
      });
    return () => {
      isMounted = false;
    };
  }, [forecastVariable, forecastRun]);

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

  const selectedPrediction = predictions.find((p) => p.region_id === selectedRegionId) || predictions[0] || null;

  // Extract selected subdivision genuine D+1 to D+10 trajectory
  const selectedTrajectory = useMemo(() => {
    if (!matrixData?.matrix || !selectedPrediction?.region_id) return [];
    return matrixData.matrix.filter((c: any) => c.region_id === selectedPrediction.region_id);
  }, [matrixData, selectedPrediction?.region_id]);

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      dataMode={dataMode}
      setDataMode={setDataMode}
      initTime={forecastRun.slice(0, 10) + ' 00 UTC'}
    >
      {/* View 1: Main Dashboard */}
      {currentTab === 'dashboard' && (
        <div className="h-full w-full flex flex-col overflow-hidden min-h-0 space-y-2">
          {/* Top Operational Bar */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 text-xs shadow-md shrink-0 w-full overflow-x-auto">
            {/* Left Group: Lead Horizon */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px] shrink-0">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>LEAD HORIZON</span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setLeadTimeDays(d)}
                    className={`w-[38px] h-[26px] rounded text-xs font-mono font-bold transition flex items-center justify-center shrink-0 ${
                      leadTimeDays === d
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 border border-sky-400'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    D+{d}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Group: Variable, Map Layer, Refresh (Secondary Controls) */}
            <div className="flex items-center gap-2 shrink-0 bg-slate-900/60 border border-slate-800/80 rounded-lg p-1">
              <div className="flex items-center gap-1.5 pl-1.5">
                <span className="text-slate-400 font-mono text-[11px] shrink-0">Variable:</span>
                <select
                  value={forecastVariable}
                  onChange={(e) => setForecastVariable(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded px-2 h-[26px] text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer min-w-[160px]"
                >
                  <option value="precipitation_mm_day">Precipitation (mm/day)</option>
                  <option value="temperature_2m_c">2m Temperature (°C)</option>
                  <option value="wind_speed_10m_kmh">10m Wind Speed (km/h)</option>
                </select>
              </div>

              <div className="h-4 w-px bg-slate-800 shrink-0" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono text-[11px] shrink-0">Map Layer:</span>
                <select
                  value={activeLayer}
                  onChange={(e) => setActiveLayer(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded px-2 h-[26px] text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer min-w-[220px]"
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
                className="w-[26px] h-[26px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700/80"
                title="Refresh Forecast Run"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              </button>

              <div className="h-4 w-px bg-slate-800 shrink-0" />

              {/* Review Flags / Alert Center Trigger */}
              <button
                onClick={() => setIsAlertCenterOpen(true)}
                className={`h-[26px] px-2.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition shrink-0 border ${
                  alertFlagsCount > 0
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Open Review Flags / Alert Center Drawer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Review Flags</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  alertFlagsCount > 0 ? 'bg-rose-500/40 text-rose-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {alertFlagsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Core Map & Right Diagnostic Split */}
          <div className="flex-1 flex flex-col lg:flex-row gap-2.5 min-h-0 overflow-hidden">
            {/* Center Map Workspace */}
            <div className="flex-1 min-w-0 h-full flex flex-col min-h-0 overflow-hidden relative">
              <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-slate-800 shadow-md">
                <MapLibreMap
                  predictions={predictions}
                  selectedRegionId={selectedRegionId}
                  onSelectRegion={setSelectedRegionId}
                  activeLayer={activeLayer}
                  leadTimeDays={leadTimeDays}
                />
              </div>
            </div>

            {/* Right Panel: WHY DISTRUST THIS FORECAST? (390px - 420px, internal scroll only) */}
            <div className="w-full lg:w-[390px] xl:w-[420px] shrink-0 h-full flex flex-col min-h-0 overflow-hidden">
              <WhyDistrustPanel
                prediction={selectedPrediction}
                onFeedbackSubmitted={loadData}
                leadTrajectory={selectedTrajectory}
                isLoadingTrajectory={isLoadingMatrix}
                onSelectLeadTime={setLeadTimeDays}
              />
            </div>
          </div>

          {/* Bottom Drawer (Priority Queue, Degradation, Baselines, Provenance) */}
          <div className="w-full shrink-0">
            <BottomDrawers
              priorityQueue={priorityQueue}
              selectedPrediction={selectedPrediction}
              onSelectRegion={setSelectedRegionId}
              leadTimeDays={leadTimeDays}
            />
          </div>

          {/* Review Flags / Alert Center Drawer */}
          <ReviewFlagsDrawer
            isOpen={isAlertCenterOpen}
            onClose={() => setIsAlertCenterOpen(false)}
            predictions={predictions}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(regId) => {
              setSelectedRegionId(regId);
            }}
          />
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
    </Layout>
  );
};

export default App;
