import React from 'react';
import { Cpu, GitBranch, ArrowRight, ShieldCheck, CheckCircle2, Database, Layers, Terminal, Sparkles, AlertCircle } from 'lucide-react';

export const ModelMethodologyView: React.FC = () => {
  const pipelineSteps = [
    { 
      title: "1. Real NWP Ingestion", 
      desc: "Ingest genuine NOAA GFS 0.25° operational GRIB2 runs (Monsoon 2023 & 2024) across 38 initialization dates." 
    },
    { 
      title: "2. 03Z–03Z Window Alignment", 
      desc: "Exact 24h accumulation alignment matching IMD daily rainfall (08:30 IST to 08:30 IST): D1 = f027 - f003 ... D10 = f243 - f219." 
    },
    { 
      title: "3. Polygon Surface Regridding", 
      desc: "Conservative area-weighted polygon integration over all 36 IMD meteorological subdivisions with latitude-cosine weighting." 
    },
    { 
      title: "4. Chronological Splitting", 
      desc: "Zero-leakage split: Monsoon 2023 (7,200 rows) Train, Early/Peak 2024 (3,600 rows) Calibration, Late 2024 (2,880 rows) Test." 
    },
    { 
      title: "5. Audited Feature Schema", 
      desc: "10 features verified available at T_init. Excluded all unverified synthetic features (spread, model delta) under zero-fabrication rule." 
    },
    { 
      title: "6. Frozen Bust Ground Truth", 
      desc: "Tail-Error: |F - O| >= 35.0 * (1 + 0.08*(d-1)) mm OR Category Shift: rank diff >= 2 OR Missed Severe: (fcst <= 1 and obs >= 3) per ForecastBustDefinition." 
    },
    { 
      title: "7. Mandatory Baselines", 
      desc: "Benchmarked against Climatology (0.0380), Lead Skill Decay (0.0380), and Raw LightGBM Trees (0.0381)." 
    },
    { 
      title: "8. LightGBM Classifier", 
      desc: "Trained gradient boosted trees optimizing binary logloss with class weighting on rare 3.98% bust prevalence." 
    },
    { 
      title: "9. Isotonic Calibration", 
      desc: "Non-parametric isotonic regression fitted on the 2024 validation partition; calibration quality evaluated using ECE = 0.0152." 
    },
    { 
      title: "10. TreeSHAP & Decision Priority", 
      desc: "Exact local TreeSHAP attribution and operational priority ranking for IMD duty meteorologists." 
    }
  ];

  const auditedFeatures = [
    { name: "lead_time_days", type: "Integer (1-10)", role: "Forecast horizon degradation driver", available: "T_init" },
    { name: "forecast_value_mm", type: "Float", role: "GFS predicted 24h accumulation", available: "T_init" },
    { name: "climatological_normal_mm", type: "Float", role: "Subdivision-specific monsoon normal", available: "T_init" },
    { name: "forecast_anomaly_mm", type: "Float", role: "Departure from climatological normal", available: "T_init" },
    { name: "subdivision_code", type: "Categorical (0-35)", role: "IMD subdivision regional identity", available: "T_init" },
    { name: "macro_region_code", type: "Categorical (0-4)", role: "NW, Central, NE, South Peninsular", available: "T_init" },
    { name: "terrain_type_code", type: "Categorical (0-3)", role: "Plains, Ghats, Hills, Coastal", available: "T_init" },
    { name: "is_coastal", type: "Binary (0/1)", role: "Marine-terrestrial boundary indicator", available: "T_init" },
    { name: "analogue_historical_bust_rate", type: "Float", role: "Historical bust prevalence in analogous weather regime", available: "T_init" },
    { name: "analogue_mean_error_mm", type: "Float", role: "Historical bias in similar synoptic conditions", available: "T_init" }
  ];

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase border border-emerald-500/30 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>REAL GFS + OPEN-METEO VERIFIED MODEL</span>
          </span>
          <h2 className="text-xl font-bold text-slate-100">ML Architecture & Real-Data Training Methodology</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete scientific specification of the LightGBM bust risk model trained on genuine NOAA GFS operational runs and Open-Meteo 03Z–03Z centroid-verified observations.
        </p>
      </div>

      {/* Model Status Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Real NWP + Open-Meteo Verification Model Active</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          The synthetic prototype model has been succeeded by a <strong>genuine historical ML model</strong> trained on 
          <strong> 13,680 genuine forecast-verification pairs</strong> across 38 distinct initialization dates from Monsoon 2023 and Monsoon 2024. 
          All verification data uses Open-Meteo historical archive daily rainfall with mathematically verified 03Z–03Z accumulation windows at subdivision centroids. 
          Zero synthetic or fabricated data rows exist in the real training pipeline.
        </p>
      </div>

      {/* End-to-End Pipeline Workflow */}
      <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>10-Stage Scientific Training & Verification Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span>PHASE {idx + 1}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-bold text-slate-200 text-[11px]">{step.title}</div>
                <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audited Feature Schema & Zero-Fabrication Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Audited Feature Schema (10 Operational Features)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              No Data Leakage
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Every feature in this schema is proven to be strictly computable at forecast initialization time (<code className="text-sky-300">T_init</code>).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px] uppercase font-mono">
                  <th className="py-1.5 px-2">Feature Name</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 px-2">Role</th>
                  <th className="py-1.5 px-2">Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditedFeatures.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-1.5 px-2 font-bold text-sky-300">{f.name}</td>
                    <td className="py-1.5 px-2 text-slate-400 text-[10px]">{f.type}</td>
                    <td className="py-1.5 px-2 font-sans text-slate-300 text-[11px]">{f.role}</td>
                    <td className="py-1.5 px-2 text-emerald-400 text-[10px] font-bold">{f.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zero Fabrication Rule */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Zero-Fabrication Enforcement</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              In real meteorological operations, training on fabricated synthetic columns violates scientific integrity. The following features were <strong>strictly audited and removed</strong> from the real training pipeline:
            </p>
            <ul className="mt-3 space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✗</span>
                <span><strong className="text-slate-200">ensemble_spread:</strong> Monolithic GFS archive does not contain GEFS members</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✗</span>
                <span><strong className="text-slate-200">inter_model_difference:</strong> No historical AIFS/ECMWF paired archive ingested</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">✗</span>
                <span><strong className="text-slate-200">consecutive_run_delta:</strong> Subsampled runs lack consecutive 6h cycles</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300">
            <strong>Result:</strong> Real model achieves genuine out-of-time skill (ROC-AUC 0.782, BSS +4.74%) with 100% genuine data provenance.
          </div>
        </div>
      </div>

      {/* CLI Verification & Reproducibility */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
        <div className="flex items-center space-x-2 text-sky-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>Verified CLI Pipeline & Artifact Generation</span>
        </div>
        <p className="text-slate-400 text-[11px]">
          The real dataset generation, validation, and training pipelines are 100% reproducible via the following verified commands:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m data.training.ingest_real_expanded_data<br />
            <span className="text-slate-500 text-[10px]"># 13,680 GFS-verified real pairs</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m data.training.audit_expanded_dataset<br />
            <span className="text-slate-500 text-[10px]"># Zero nulls & leakage check</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m data.training.train_real_model<br />
            <span className="text-slate-500 text-[10px]"># LightGBM + Isotonic + SHAP</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            pytest backend/tests/<br />
            <span className="text-slate-500 text-[10px]"># Full 32-test regression suite</span>
          </div>
        </div>
      </div>
    </div>
  );
};
