import React from 'react';
import { ShieldAlert, AlertTriangle, ChevronRight, X, Eye } from 'lucide-react';
import { PredictionDetail, OperationalPriority } from '../types';

interface ReviewFlagsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  predictions: PredictionDetail[];
  selectedRegionId: string;
  onSelectRegion: (regionId: string) => void;
}

export const ReviewFlagsDrawer: React.FC<ReviewFlagsDrawerProps> = ({
  isOpen,
  onClose,
  predictions,
  selectedRegionId,
  onSelectRegion
}) => {
  if (!isOpen) return null;

  // Filter ONLY using EXISTING AETHER-CAST risk tiers: CRITICAL_INSPECTION and HIGH_REVIEW
  const flaggedPredictions = predictions.filter((p) =>
    p.operational_priority === 'CRITICAL — INSPECTION REQUIRED' ||
    p.operational_priority === 'HIGH — REVIEW'
  ).sort((a, b) => {
    // Sort critical first, then by calibrated probability descending
    if (a.operational_priority !== b.operational_priority) {
      return a.operational_priority === 'CRITICAL — INSPECTION REQUIRED' ? -1 : 1;
    }
    return b.calibrated_probability_estimate - a.calibrated_probability_estimate;
  });

  const criticalCount = flaggedPredictions.filter(
    (p) => p.operational_priority === 'CRITICAL — INSPECTION REQUIRED'
  ).length;
  const highReviewCount = flaggedPredictions.filter(
    (p) => p.operational_priority === 'HIGH — REVIEW'
  ).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-[#111827]/90 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                Review Flags / Alert Center
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                {flaggedPredictions.length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Derived review alerts for Duty Forecasters from existing operational risk tiers.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition"
          title="Close Alert Center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tier Summary Badges */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-rose-950/30 border border-rose-500/40 flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-rose-300">Critical Inspection</span>
          <span className="text-base font-bold font-mono text-rose-400">{criticalCount}</span>
        </div>
        <div className="p-2 rounded bg-orange-950/30 border border-orange-500/40 flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-orange-300">High Review</span>
          <span className="text-base font-bold font-mono text-orange-400">{highReviewCount}</span>
        </div>
      </div>

      {/* Flagged Regions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {flaggedPredictions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <AlertTriangle className="w-10 h-10 mb-2 text-slate-600" />
            <p className="font-semibold text-xs text-slate-400">No High Review or Critical Flags</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              All subdivisions are currently within normal baseline monitoring thresholds for this lead horizon.
            </p>
          </div>
        ) : (
          flaggedPredictions.map((pred) => {
            const isSelected = pred.region_id === selectedRegionId;
            const isCritical = pred.operational_priority === 'CRITICAL — INSPECTION REQUIRED';
            const topDriver = pred.why_distrust_drivers?.[0]?.driver_name ||
              pred.shap_attributions?.[0]?.display_name ||
              'Synoptic Anomaly';

            return (
              <div
                key={pred.region_id}
                onClick={() => {
                  onSelectRegion(pred.region_id);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer select-none relative ${
                  isSelected
                    ? 'bg-sky-950/70 border-sky-400 shadow-md ring-1 ring-sky-400'
                    : isCritical
                    ? 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Region, Lead Time, Tier Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-bold shrink-0">
                        {pred.region_id}
                      </span>
                      <h4 className="font-bold text-xs text-slate-100 truncate">
                        {pred.region_name}
                      </h4>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Lead: <strong className="text-slate-200">D+{pred.lead_time_days}</strong> • Valid: {pred.valid_date}
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                  }`}>
                    {pred.operational_priority}
                  </span>
                </div>

                {/* Metrics Grid: P(Bust), Risk Elevation, Forecast */}
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                  <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 font-mono">P(BUST)</div>
                    <div className="font-bold font-mono text-rose-400 text-sm">
                      {(pred.calibrated_probability_estimate * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 font-mono">RISK ELEVATION</div>
                    <div className="font-bold font-mono text-amber-300 text-sm">
                      {(pred.calibrated_probability_estimate / 0.04).toFixed(1)}×
                    </div>
                  </div>

                  <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 font-mono">GFS VALUE</div>
                    <div className="font-bold font-mono text-sky-300 text-sm truncate">
                      {pred.forecast_value} mm
                    </div>
                  </div>
                </div>

                {/* Top Driver & Navigation CTA */}
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                  <div className="text-slate-400 truncate max-w-[280px]">
                    <span className="text-slate-500 font-mono text-[10px]">TOP DRIVER: </span>
                    <span className="text-slate-200 font-medium">{topDriver}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRegion(pred.region_id);
                    }}
                    className="flex items-center space-x-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 transition"
                  >
                    <span>Zoom Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer Note */}
      <div className="p-3 border-t border-slate-800 bg-[#111827]/90 text-[10px] text-slate-400 font-mono flex items-center justify-between">
        <span>Derived from Operational Risk Engine</span>
        <span className="text-emerald-400">Map Pan Enabled</span>
      </div>
    </div>
  );
};
