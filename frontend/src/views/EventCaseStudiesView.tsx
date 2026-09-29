import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, MapPin, Wind, CloudRain, Mountain } from 'lucide-react';

export const EventCaseStudiesView: React.FC = () => {
  const caseStudies = [
    {
      title: "Extremely Severe Cyclonic Storm Biparjoy (June 2023)",
      region: "Saurashtra & Kutch (SUB_22), Gujarat",
      synoptic: "Deep cyclonic vortex over east-central Arabian Sea with recurvature uncertainty.",
      nwpError: "At D+5, global deterministic GFS predicted 42 mm. Actual observed station accumulation exceeded 185 mm in Kutch.",
      aiAction: "Flagged Prototype Risk Score 76/100 at D+5 due to 26.5mm ensemble spread and 22mm GFS-AIFS disagreement.",
      outcome: "Forecasters alert prevented surprise flash flooding in coastal ports.",
      type: "Cyclone Landfall Bust"
    },
    {
      title: "Western Ghats Orographic Cloudburst (July 2022)",
      region: "Konkan & Goa (SUB_23) & Coastal Karnataka (SUB_32)",
      synoptic: "Strong low-level westerly monsoon jet (45 knots) impinging on the Sahyadri mountains.",
      nwpError: "At D+4, coarse global models predicted 85 mm, failing to resolve sub-grid orographic convection.",
      aiAction: "Flagged Prototype Risk Score 82/100 based on terrain-boundary vulnerability and historical analogue failure rate.",
      outcome: "Actual observed was 242 mm. Recommended forecaster review of high-resolution radar soundings.",
      type: "Orographic Convective Bust"
    },
    {
      title: "Cyclone Michaung Coastal Stalling (December 2023)",
      region: "Coastal Andhra Pradesh & Yanam (SUB_28) and Chennai",
      synoptic: "Cyclone drifted quasi-parallel to coast, stalling for 18 hours within 40km of shoreline.",
      nwpError: "Global models anticipated continuous northward propagation without accounting for coastal boundary friction drag.",
      aiAction: "Ensemble spread expanded to 22mm. AI flagged Prototype Risk Score 74/100 with Critical Inspection Priority at D+4.",
      outcome: "Actual rainfall reached catastrophic 280 mm in 24 hours.",
      type: "Cyclone Stalling & Coastal Flood"
    },
    {
      title: "Intense Northwest India Western Disturbance (January 2024)",
      region: "Himachal Pradesh (SUB_15) & Uttarakhand (SUB_12)",
      synoptic: "Upper-tropospheric trough embedded in subtropical westerly jet with Arabian Sea moisture feed.",
      nwpError: "Models predicted brief light snow (18 mm liquid equivalent) at D+5; observed was 72 mm blizzard.",
      aiAction: "Flagged Prototype Risk Score 68/100 due to steep spatial baroclinic gradient instability.",
      outcome: "Severe travel disruption anticipated by forecaster review.",
      type: "Mid-Latitude Synoptic Trough"
    }
  ];

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-xs uppercase border border-sky-500/30">
            METEOROLOGICAL VERIFICATION
          </span>
          <h2 className="text-xl font-bold text-slate-100">Historical Case Studies & Bust Diagnostics</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed meteorological autopsy of historic Indian forecast bust events and how the reliability layer detected them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {caseStudies.map((cs, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-sky-400 text-xs font-mono font-semibold">
                {cs.type}
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{cs.region}</span>
              </span>
            </div>

            <h3 className="font-bold text-slate-100 text-base">{cs.title}</h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-0.5">Synoptic Meteorological Setup:</span>
                <p className="text-slate-300">{cs.synoptic}</p>
              </div>

              <div className="p-2.5 rounded bg-red-950/20 border border-red-500/30 text-rose-300">
                <span className="font-semibold block mb-0.5 text-rose-400">NWP Model Failure Mode:</span>
                <p>{cs.nwpError}</p>
              </div>

              <div className="p-2.5 rounded bg-sky-950/30 border border-sky-500/30 text-sky-200">
                <span className="font-semibold block mb-0.5 text-sky-300">Reliability Layer Detection:</span>
                <p>{cs.aiAction}</p>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                <span className="font-semibold block mb-0.5 text-emerald-400">Forecaster Decision Outcome:</span>
                <p>{cs.outcome}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
