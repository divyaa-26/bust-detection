import React, { useState } from 'react';
import { TrendingUp, Activity, HelpCircle } from 'lucide-react';

export interface TrajectoryPoint {
  lead_time_days: number;
  bust_probability: number;
  risk_level: string;
  forecast_value?: number;
  confidence?: number;
}

interface LeadTimeRiskCurveProps {
  regionId: string;
  regionName: string;
  currentLead: number;
  currentProbability: number;
  currentRiskTier: string;
  trajectory?: TrajectoryPoint[];
  isLoading?: boolean;
  onSelectLead?: (lead: number) => void;
}

const getRiskColor = (prob: number) => {
  if (prob >= 0.24) return '#f43f5e'; // Rose-500 (Severe)
  if (prob >= 0.14) return '#f97316'; // Orange-500 (High)
  if (prob >= 0.08) return '#fbbf24'; // Amber-400 (Moderate)
  return '#34d399'; // Emerald-400 (Low)
};

const getRiskBadgeStyle = (tier: string) => {
  const t = tier.toUpperCase();
  if (t.includes('CRITICAL') || t.includes('SEVERE')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  if (t.includes('HIGH')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }
  if (t.includes('MODERATE') || t.includes('MONITOR')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
};

export const LeadTimeRiskCurve: React.FC<LeadTimeRiskCurveProps> = ({
  regionId,
  regionName,
  currentLead,
  currentProbability,
  currentRiskTier,
  trajectory = [],
  isLoading = false,
  onSelectLead
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);

  // Sort trajectory strictly by lead day 1..10
  const sortedPoints = [...trajectory].sort((a, b) => a.lead_time_days - b.lead_time_days);

  // SVG dimensions
  const svgWidth = 360;
  const svgHeight = 110;
  const paddingLeft = 32;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 22;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute maximum Y bound (minimum 20% so small values have room)
  const maxDataProb = sortedPoints.length > 0 
    ? Math.max(...sortedPoints.map((p) => p.bust_probability), currentProbability)
    : Math.max(currentProbability, 0.15);
  
  // Snap maxAxis to comfortable intervals (0.20, 0.25, 0.30, 0.40, etc.)
  const maxAxis = Math.max(0.20, Math.ceil((maxDataProb * 1.25) / 0.05) * 0.05);

  const getX = (lead: number) => {
    return paddingLeft + ((lead - 1) / 9) * chartWidth;
  };

  const getY = (prob: number) => {
    const clamped = Math.max(0, Math.min(maxAxis, prob));
    return paddingTop + chartHeight - (clamped / maxAxis) * chartHeight;
  };

  // Build SVG straight-line path (no smoothing/splines per scientific honesty requirement)
  let linePath = '';
  let areaPath = '';
  if (sortedPoints.length > 0) {
    const coords = sortedPoints.map((p) => ({
      x: getX(p.lead_time_days),
      y: getY(p.bust_probability)
    }));

    linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    
    const firstX = coords[0].x.toFixed(1);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const baseY = (paddingTop + chartHeight).toFixed(1);
    areaPath = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }

  // Y-axis grid ticks
  const yTicks = [0, maxAxis * 0.5, maxAxis];

  return (
    <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2.5">
      {/* Title & Small Annotation */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>FORECAST BUST RISK — LEAD-TIME EVOLUTION</span>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-0.5">
            Risk trajectory across forecast lead time
          </p>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
          D+1 → D+10
        </span>
      </div>

      {/* Current Lead & Risk Metric Chips */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800/80">
          <div className="text-[9px] uppercase text-slate-500">Selected Lead</div>
          <div className="text-xs font-bold text-sky-400 mt-0.5">D+{currentLead}</div>
        </div>

        <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800/80">
          <div className="text-[9px] uppercase text-slate-500">Current P(Bust)</div>
          <div className="text-xs font-bold text-amber-300 mt-0.5">
            {(currentProbability * 100).toFixed(1)}%
          </div>
        </div>

        <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="text-[9px] uppercase text-slate-500">Risk Tier</div>
          <div className="mt-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRiskBadgeStyle(currentRiskTier)}`}>
              {currentRiskTier.replace(' — INSPECTION REQUIRED', '').replace(' — REVIEW', '')}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      {isLoading && sortedPoints.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">
          Loading genuine D+1–D+10 model predictions...
        </div>
      ) : sortedPoints.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-slate-500 text-xs font-mono">
          No lead trajectory points available
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
          >
            <defs>
              <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Tick values */}
            {yTicks.map((val, idx) => {
              const yPos = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={svgWidth - paddingRight}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeDasharray={idx > 0 ? '3,3' : undefined}
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 4}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[8px] font-mono fill-slate-500"
                  >
                    {Math.round(val * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#leadAreaGradient)" />
            )}

            {/* Baseline X-axis */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={svgWidth - paddingRight}
              y2={paddingTop + chartHeight}
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Real LightGBM Model Output Polyline */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Vertical Guide Indicator for Current Lead */}
            {(() => {
              const curX = getX(currentLead);
              const curY = getY(currentProbability);
              return (
                <g key="current-guide">
                  <line
                    x1={curX}
                    y1={paddingTop - 6}
                    x2={curX}
                    y2={paddingTop + chartHeight}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    strokeOpacity="0.8"
                  />
                  {/* Subtle Callout Pill above selected lead */}
                  <rect
                    x={curX - 18}
                    y={Math.max(2, curY - 18)}
                    width="36"
                    height="13"
                    rx="3"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <text
                    x={curX}
                    y={Math.max(2, curY - 18) + 9.5}
                    textAnchor="middle"
                    className="text-[8px] font-mono font-bold fill-sky-300"
                  >
                    {(currentProbability * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })()}

            {/* Data Points across D+1 to D+10 */}
            {sortedPoints.map((p) => {
              const px = getX(p.lead_time_days);
              const py = getY(p.bust_probability);
              const isSelected = p.lead_time_days === currentLead;
              const pointColor = getRiskColor(p.bust_probability);

              return (
                <g
                  key={p.lead_time_days}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectLead && onSelectLead(p.lead_time_days)}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible larger click/hover target */}
                  <circle cx={px} cy={py} r="10" fill="transparent" />

                  {/* Highlight ring for selected lead */}
                  {isSelected && (
                    <circle
                      cx={px}
                      cy={py}
                      r="6.5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                  )}

                  {/* Point Marker */}
                  <circle
                    cx={px}
                    cy={py}
                    r={isSelected ? 4.5 : 3}
                    fill={pointColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* X-axis Ticks & Labels */}
            {sortedPoints.map((p) => {
              const px = getX(p.lead_time_days);
              const isSelected = p.lead_time_days === currentLead;

              return (
                <text
                  key={`lbl-${p.lead_time_days}`}
                  x={px}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  className={`text-[8.5px] font-mono cursor-pointer transition ${
                    isSelected ? 'fill-sky-300 font-bold' : 'fill-slate-500 hover:fill-slate-300'
                  }`}
                  onClick={() => onSelectLead && onSelectLead(p.lead_time_days)}
                >
                  D+{p.lead_time_days}
                </text>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div 
              className="absolute pointer-events-none p-1.5 rounded bg-slate-950/95 border border-slate-700 text-[10px] font-mono text-slate-200 shadow-xl z-20"
              style={{
                left: `${Math.min(230, Math.max(10, (getX(hoveredPoint.lead_time_days) / svgWidth) * 100))}%`,
                top: '-8px'
              }}
            >
              <div className="font-bold text-sky-400">
                Lead D+{hoveredPoint.lead_time_days}
              </div>
              <div className="flex items-center space-x-1.5">
                <span>P(Bust):</span>
                <span className="font-bold" style={{ color: getRiskColor(hoveredPoint.bust_probability) }}>
                  {(hoveredPoint.bust_probability * 100).toFixed(1)}%
                </span>
                <span className="text-slate-400 text-[9px]">({hoveredPoint.risk_level})</span>
              </div>
              {hoveredPoint.forecast_value !== undefined && (
                <div className="text-slate-400 text-[9px]">
                  Forecast: {hoveredPoint.forecast_value.toFixed(1)} mm
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scientific Transparency Footnote */}
      <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5">
        <span>Actual LightGBM outputs (no smoothing/extrapolation)</span>
        <span className="text-slate-400">36 Subdivisions • 10 Leads</span>
      </div>
    </div>
  );
};
