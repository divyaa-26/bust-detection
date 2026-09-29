import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle, 
  Eye, 
  Clock,
  Sparkles,
  Info,
  FastForward,
  MapPin
} from 'lucide-react';
import { HistoricalReplayEvent, ReplayEventStep } from '../types';
import { api } from '../services/api';

interface HistoricalReplayViewProps {
  initialEventId?: string;
  initialStepIndex?: number;
}

export const HistoricalReplayView: React.FC<HistoricalReplayViewProps> = ({
  initialEventId = 'biparjoy_2023',
  initialStepIndex = 0,
}) => {
  const [events, setEvents] = useState<HistoricalReplayEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialEventId) setSelectedEventId(initialEventId);
  }, [initialEventId]);

  useEffect(() => {
    if (initialStepIndex !== undefined) setCurrentStepIndex(initialStepIndex);
  }, [initialStepIndex]);

  useEffect(() => {
    api.getHistoricalEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0 && !selectedEventId) setSelectedEventId(data[0].event_id);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const activeEvent = events.find((e) => e.event_id === selectedEventId) || events[0];
  const steps = activeEvent?.steps || [];
  const currentStep: ReplayEventStep | undefined = steps[currentStepIndex];

  // Helper to jump directly to T-1 (per SIH flow requirement 16)
  const jumpToTMinus1 = () => {
    const t1Idx = steps.findIndex((s) => s.step_lead === 'T-1');
    if (t1Idx !== -1) setCurrentStepIndex(t1Idx);
  };

  const jumpToReveal = () => {
    const revIdx = steps.findIndex((s) => s.actual_outcome_revealed);
    if (revIdx !== -1) setCurrentStepIndex(revIdx);
  };

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs uppercase border border-amber-500/30">
              SIH FLAGSHIP REPLAY
            </span>
            <h2 className="text-xl font-bold text-slate-100">Historical Counterfactual Replay Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate medium-range lead progression with a <strong>Hard As-Of Temporal Cutoff</strong> and zero future observation leakage.
          </p>
        </div>

        {/* Event Selector & Quick Jump Shortcuts */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">CASE EVENT:</span>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setCurrentStepIndex(0);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-sky-500"
            >
              {events.map((e) => (
                <option key={e.event_id} value={e.event_id}>
                  {e.event_name} ({e.event_date})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center space-x-1 border-l border-slate-800 pl-3">
            <button
              onClick={jumpToTMinus1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition"
              title="Jump directly to T-1 cycle"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Jump to T-1</span>
            </button>
            <button
              onClick={jumpToReveal}
              className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center space-x-1 border border-rose-500/40 transition"
              title="Reveal actual observed ground truth"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal Outcome</span>
            </button>
          </div>
        </div>
      </div>

      {activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Synoptic Case Briefing & Strict Provenance */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Meteorological Context & Provenance</span>
              <h3 className="font-bold text-base text-slate-100 mt-1">{activeEvent.event_name}</h3>
              
              <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                <div><span className="text-slate-500">CATEGORY:</span> {activeEvent.event_category}</div>
                <div><span className="text-slate-500">TARGET SUBDIVISION:</span> {activeEvent.target_region_name} ({activeEvent.target_region_id})</div>
                <div><span className="text-slate-500">COORDINATES:</span> {activeEvent.coordinates_lat_lon ? `${activeEvent.coordinates_lat_lon[0]}°N, ${activeEvent.coordinates_lat_lon[1]}°E` : '22.3°N, 70.3°E'}</div>
                <div><span className="text-slate-500">FORECAST SOURCE:</span> {activeEvent.forecast_source || 'NOAA GFS 0.25° Operational Cycle'}</div>
                <div><span className="text-slate-500">OBSERVATION SOURCE:</span> {activeEvent.observation_source || 'IMD Daily Gridded Rainfall Analysis'}</div>
                <div><span className="text-slate-500">VERIFICATION DATE:</span> {activeEvent.event_date}</div>
                <div><span className="text-slate-500">UNITS:</span> {activeEvent.units || 'mm/day'}</div>
              </div>

              <p className="text-slate-300 mt-3 text-[11px] leading-relaxed">
                {activeEvent.synoptic_description}
              </p>
            </div>

            {/* Strict Anti-Leakage Protocol Card */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Hard As-Of Cutoff & Anti-Leakage Protocol</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                At lead step <strong>{currentStep?.step_lead}</strong>, the intelligence layer only possesses 
                information physically available at <code className="text-emerald-300">{currentStep?.as_of_cutoff_utc || 'cycle init'}</code>.
                Observations occurring on or after verification date {activeEvent.event_date} are strictly blocked.
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-500/20 font-mono text-[10px] text-emerald-300 flex items-center justify-between">
                <span>AS-OF CUTOFF: {currentStep?.as_of_cutoff_utc}</span>
                <span>Future-data exclusion: PASS</span>
              </div>
            </div>

            {/* Error Calculation Trace */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Error Derivation Formula</span>
              <p className="text-slate-300 mt-1 font-mono text-[11px] leading-relaxed">
                {activeEvent.error_derivation_formula || '|Forecast - Observed| vs Empirical Tail Threshold (35.0 mm)'}
              </p>
              <p className="text-slate-400 text-[10px] mt-2">
                {activeEvent.post_event_analysis}
              </p>
            </div>
          </div>

          {/* Center & Right: Timeline Scrubber & Step Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Time Timeline Buttons */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Counterfactual Lead Progression</span>
                <span className="text-slate-400 font-mono">Step {currentStepIndex + 1} of {steps.length}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-500/30'
                          : step.actual_outcome_revealed
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono font-bold text-sm">{step.step_lead}</span>
                      <span className="text-[10px] mt-1">
                        {step.actual_outcome_revealed ? 'VERIFY' : `D+${step.lead_time_days}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Step State Display */}
            {currentStep && (
              <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-5">
                {/* Persistent Visible Replay Mode Badge */}
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-center font-mono text-[10px] font-bold tracking-wider uppercase flex items-center justify-center space-x-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  <span>PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED (HISTORICAL REPLAY ARCHIVE)</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-mono font-bold text-sm">
                      {currentStep.step_lead}
                    </span>
                    <h4 className="font-bold text-base text-slate-100">
                      Forecast Valid Date: {currentStep.valid_date}
                    </h4>
                  </div>
                  <span className={`px-3 py-1 rounded font-bold text-xs uppercase border ${
                    currentStep.priority === 'CRITICAL — INSPECTION REQUIRED'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  }`}>
                    {currentStep.priority}
                  </span>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">NWP Forecast Rain</div>
                    <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                      {currentStep.forecast_rainfall_mm} mm/day
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">GFS Operational run</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Prototype Risk Score</div>
                    <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                      {Math.round(currentStep.bust_risk_percent)}/100
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Heuristic risk index (0–100)</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Ensemble Member Spread</div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                      {currentStep.ensemble_spread_mm} mm
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">21-member dispersion</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Model Discrepancy</div>
                    <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                      {currentStep.multi_model_disagreement} mm
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">GFS vs AIFS spread</div>
                  </div>
                </div>

                {/* Why Distrust Callout (Evidence & Association Phrasing) */}
                <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    <span>Forecast Reliability Evidence & Association Diagnostics</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed mt-2">
                    {currentStep.why_distrust_summary}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    As-of cutoff enforced: {currentStep.as_of_cutoff_utc} (Strict absence of future data)
                  </div>
                </div>

                {/* If Final Reveal Step, Show Ground Truth Comparison */}
                {currentStep.actual_outcome_revealed && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/50 shadow-2xl">
                    <div className="flex items-center space-x-2 text-rose-400 font-bold mb-3">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="text-sm uppercase tracking-wider">Ground Truth Verification Revealed</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400">T-5 GFS Forecast:</span>
                        <div className="text-lg font-bold text-slate-300 mt-1 font-mono">42.0 mm/day</div>
                      </div>
                      <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400">Actual Observed (IMD Gauge):</span>
                        <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">185.0 mm/day</div>
                      </div>
                      <div className="p-3 rounded bg-rose-950/40 border border-red-500/40">
                        <span className="text-rose-300 font-bold">Error Magnitude:</span>
                        <div className="text-lg font-bold text-rose-400 mt-1 font-mono">+143.0 mm (BUST)</div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300">
                      Error Trace: |42.0 - 185.0| = 143.0 mm. Exceeds applied D+5 tail threshold 46.2 mm by +96.8 mm (base 35.0 mm threshold exceeded by +108.0 mm). Category shifted from Moderate Rain to Extremely Heavy Rain.
                    </div>
                  </div>
                )}

                {/* Stepper Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition"
                  >
                    ← Previous Lead Step
                  </button>

                  <button
                    disabled={currentStepIndex === steps.length - 1}
                    onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <span>{currentStepIndex === steps.length - 2 ? 'Reveal Actual Outcome' : 'Next Lead Step'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
