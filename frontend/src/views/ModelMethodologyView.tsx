import React from 'react';
import { Cpu, GitBranch, ArrowRight, ShieldAlert, CheckCircle, Database, Layers, Terminal } from 'lucide-react';

export const ModelMethodologyView: React.FC = () => {
  const pipelineSteps = [
    { title: "Raw NWP & AI Feeds", desc: "Ingest GFS, ECMWF/AIFS, NCUM (when authorized) and IMD gridded rainfall analysis." },
    { title: "Temporal & Spatial Alignment", desc: "Audit initialization, valid time, and regrid conservatively to 36 IMD subdivisions." },
    { title: "Temporal Blocking Split", desc: "Earlier years training (2018-2022), 2023 validation, 2024 held-out testing to prevent autocorrelation leakage." },
    { title: "Feature Generation", desc: "Extract ensemble spread, inter-model difference, historical lead skill, spatial gradients, terrain indicators." },
    { title: "Bust Label Generation", desc: "Evaluate Tail-Error (90th percentile) and Category Failure (shift >= 2 IMD levels)." },
    { title: "Mandatory Baselines", desc: "Benchmarked against Climatology, Ensemble Spread heuristic, and Historical lead-decay skill." },
    { title: "XGBoost / LightGBM Classifier", desc: "Predicts raw probability of bust conditioned on multi-source weather state." },
    { title: "Platt Scaling Calibration", desc: "Transforms raw trees probability into calibrated frequentist confidence via isotonic/sigmoid curves." },
    { title: "Conformal Uncertainty", desc: "Generates distribution-free coverage error intervals for operational risk budgeting." },
    { title: "Decision-Support Priority", desc: "Computes operational review rank (Critical, High Review, Monitor, Routine) for duty meteorologists." }
  ];

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-xs uppercase border border-purple-500/30">
            SCIENTIFIC FOUNDATION
          </span>
          <h2 className="text-xl font-bold text-slate-100">ML Architecture & Training Methodology</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete blueprint for the future Stage 2 Machine Learning training pipeline and current deterministic prototype engine.
        </p>
      </div>

      {/* Development Stage Notice */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs">
        <div className="flex items-center space-x-2 text-amber-400 font-bold mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Stage 1 Development Architecture — Honest Scientific Disclosure</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          In strict accordance with the project guidelines, <strong>final ML model training is deferred</strong>. 
          The end-to-end software system is fully built, integrated, and validated using the 
          <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 mx-1">DemoReliabilityModel</code>. 
          The future trained <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 mx-1">XGBoost</code> / 
          <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 mx-1">LightGBM</code> model implements 
          the exact same <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 mx-1">BaseReliabilityModel</code> 
          interface, requiring zero frontend redesign when swapped in.
        </p>
      </div>

      {/* End-to-End Pipeline Workflow */}
      <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
          End-to-End Scientific Training & Inference Flowchart
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span>STEP {idx + 1}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="font-bold text-slate-200 text-[11px]">{step.title}</div>
                <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLI Training Hooks */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
        <div className="flex items-center space-x-2 text-sky-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>Stage 2 Future CLI Execution Hooks (Ready for Training)</span>
        </div>
        <p className="text-slate-400 text-[11px]">
          The following module structure is pre-configured in the repository for executing the future training runs:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.prepare<br />
            <span className="text-slate-500 text-[10px]"># Temporal/spatial split</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.create_labels<br />
            <span className="text-slate-500 text-[10px]"># Tail & category bust labels</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.train<br />
            <span className="text-slate-500 text-[10px]"># XGBoost / LightGBM</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.calibrate<br />
            <span className="text-slate-500 text-[10px]"># Platt & Isotonic calibration</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.evaluate<br />
            <span className="text-slate-500 text-[10px]"># AUROC, Brier, Baselines</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
            python -m ml.predict<br />
            <span className="text-slate-500 text-[10px]"># Serialized model artifact</span>
          </div>
        </div>
      </div>
    </div>
  );
};
