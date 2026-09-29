import React, { useState } from 'react';
import { 
  AlertOctagon, 
  HelpCircle, 
  TrendingUp, 
  Clock, 
  Layers, 
  ShieldAlert, 
  Check, 
  X, 
  FileCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { PredictionDetail, OperationalPriority } from '../types';
import { api } from '../services/api';

interface WhyDistrustPanelProps {
  prediction: PredictionDetail | null;
  onFeedbackSubmitted?: () => void;
}

export const WhyDistrustPanel: React.FC<WhyDistrustPanelProps> = ({
  prediction,
  onFeedbackSubmitted
}) => {
  const [feedbackDecision, setFeedbackDecision] = useState<'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW' | null>(null);
  const [userRole, setUserRole] = useState('Senior Duty Forecaster');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  if (!prediction) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#111827] rounded-xl border border-slate-800">
        <AlertOctagon className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <p className="font-semibold text-sm text-slate-400">No Region Selected</p>
        <p className="text-xs mt-1 max-w-xs">
          Click on any meteorological subdivision on the map or select from the queue to inspect reliability diagnostics.
        </p>
      </div>
    );
  }

  const handleFeedbackSubmit = async (decision: 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW') => {
    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        prediction_id: prediction.prediction_id,
        forecast_id: `FCST-${prediction.region_id}-D${prediction.lead_time_days}`,
        region_id: prediction.region_id,
        lead_time_days: prediction.lead_time_days,
        user_name: 'Duty Forecaster (IMD/MoES Peering)',
        user_role: userRole,
        decision: decision,
        decision_reason: feedbackNote || `Forecaster marked as ${decision}`,
        notes: feedbackNote
      });
      setSubmittedMessage(`Feedback [${decision}] recorded for governance audit.`);
      setTimeout(() => setSubmittedMessage(null), 4000);
      setFeedbackDecision(null);
      setFeedbackNote('');
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityStyle = (priority: OperationalPriority) => {
    switch (priority) {
      case 'CRITICAL — INSPECTION REQUIRED':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'HIGH — REVIEW':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MONITOR':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-xl text-slate-200">
      {/* Region Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
              {prediction.region_id}
            </span>
            <h2 className="font-bold text-base text-slate-100">{prediction.region_name}</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Valid: {prediction.valid_date} (D+{prediction.lead_time_days})
          </span>
        </div>

        {/* Priority Badge */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-medium">REVIEW PRIORITY:</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${getPriorityStyle(prediction.operational_priority)}`}>
              {prediction.operational_priority}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">FORECAST:</span>
            <span className="ml-1.5 font-bold text-sky-300 text-sm">
              {prediction.forecast_value} {prediction.units}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Persistent Visible Prototype Badge */}
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-center font-mono text-[10px] font-bold tracking-wider uppercase flex items-center justify-center space-x-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span>PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED</span>
        </div>

        {/* Core Risk Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Prototype Risk Score</span>
              <span className="text-rose-400 font-bold font-mono">{Math.round(prediction.calibrated_probability_estimate * 100)}/100</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  prediction.calibrated_probability_estimate >= 0.75 ? 'bg-red-500' :
                  prediction.calibrated_probability_estimate >= 0.50 ? 'bg-orange-500' :
                  prediction.calibrated_probability_estimate >= 0.28 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${prediction.calibrated_probability_estimate * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              Deterministic Prototype Heuristic
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Prototype Uncertainty Interval</div>
            <div className="mt-1 text-base font-bold text-amber-300 font-mono">
              {prediction.prototype_uncertainty_interval ? `${prediction.prototype_uncertainty_interval[0]} – ${prediction.prototype_uncertainty_interval[1]} mm` : `${prediction.expected_error_range[0]} – ${prediction.expected_error_range[1]} mm`}
            </div>
            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              Spread-Residual Heuristic Envelope
            </div>
          </div>
        </div>

        {/* Action Recommendation */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
          <div className="text-[10px] uppercase font-bold text-sky-400 mb-1 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5" />
            <span>Operational Advisory</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {prediction.recommended_action}
          </p>
        </div>

        {/* WHY DISTRUST THIS FORECAST? Panel (Highlight Feature) */}
        <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-500/20">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertOctagon className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Why Distrust This Forecast?</h3>
            </div>
            <span className="text-[10px] text-red-400/80 font-mono">
              {prediction.why_distrust_drivers.length} Drivers Identified
            </span>
          </div>

          <div className="space-y-2">
            {prediction.why_distrust_drivers.map((driver, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900/70 border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-[11px]">{driver.driver_name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    driver.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    driver.severity === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {driver.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  {driver.description}
                </p>
                <div className="mt-1 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Metric: {driver.metric_value.toFixed(1)}</span>
                  <span>Threshold: {driver.benchmark_value.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Atmospheric Analogues */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-1.5 text-sky-400">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Historical Precedent Analogue Search</h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Top 3 Matches</span>
          </div>

          <div className="space-y-2">
            {prediction.historical_analogues.map((analogue, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{analogue.event_name}</span>
                  <span className="text-sky-400 font-mono font-bold text-[10px]">
                    {Math.round(analogue.similarity_score * 100)}% Match
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{analogue.historical_date}</span>
                  <span>•</span>
                  <span>{analogue.region_name} (D+{analogue.lead_time_days})</span>
                  <span>•</span>
                  <span className={analogue.was_bust ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {analogue.was_bust ? 'BUST VERIFIED' : 'STABLE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  "{analogue.actual_outcome}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Human In The Loop Forecaster Action */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Forecaster Review Action
            </span>
            <span className="text-[9px] text-slate-500 font-mono">HITL Protocol</span>
          </div>

          {submittedMessage && (
            <div className="p-2 mb-2 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-1.5">
              <Check className="w-4 h-4" />
              <span>{submittedMessage}</span>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => handleFeedbackSubmit('CONFIRM')}
              disabled={isSubmitting}
              className="flex-1 py-1.5 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Flag</span>
            </button>
            <button
              onClick={() => handleFeedbackSubmit('NEEDS_REVIEW')}
              disabled={isSubmitting}
              className="flex-1 py-1.5 px-2 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hold / Watch</span>
            </button>
            <button
              onClick={() => handleFeedbackSubmit('REJECT')}
              disabled={isSubmitting}
              className="flex-1 py-1.5 px-2 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>

          <div className="mt-2">
            <input
              type="text"
              placeholder="Optional forecaster review notes / sounding notes..."
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
