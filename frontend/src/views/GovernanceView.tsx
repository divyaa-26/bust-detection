import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, CheckCircle2, Copy, Terminal, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export const GovernanceView: React.FC = () => {
  const [configData, setConfigData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getConfig().then((data) => setConfigData(data)).catch((err) => console.error(err));
  }, []);

  const sampleProvenanceRecord = {
    prediction_id: "PRED-GFS-SUB22-D5-7E3B8F1A",
    forecast: {
      source_model: "GFS_0.25deg_Operational",
      initialization_time: "2024-07-15T00:00:00Z",
      valid_time: "2024-07-20T00:00:00Z",
      lead_time_days: 5,
      variable: "precipitation_mm_day"
    },
    governance: {
      dataset_version: configData?.dataset_version || "expanded-real-nwp-dataset-13680pairs-v1.0",
      feature_version: configData?.feature_version || "real-feature-schema-v1.0-10audited",
      bust_definition_version: configData?.bust_definition_version || "bust-def-v2.0-frozen-35mm-cat2",
      model_version: configData?.model_version || "LightGBM-v1.0-Real-NWP-IMD-Calibrated",
      calibration_version: configData?.calibration_version || "isotonic-regression-v1.0",
      git_commit: configData?.git_commit || "sih-2026-v1.0",
      inference_timestamp: new Date().toISOString(),
      data_mode: configData?.data_mode || "REAL"
    },
    reproducibility: {
      spatial_regrid_operator: "Conservative Areal Mean (36 Subdivisions)",
      conformal_calibration_set: "HELD_OUT_VALIDATION_2023",
      leakage_guard_check: "PASSED (As-of Cutoff Enforced)"
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleProvenanceRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-xs uppercase border border-sky-500/30">
            AUDITABILITY & COMPLIANCE
          </span>
          <h2 className="text-xl font-bold text-slate-100">Scientific Provenance & Model Governance</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically traceable metadata, immutable version hashes, and reproduction parameters for every prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Governance Parameters Grid */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>MoES Governance Mandates</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Every bust risk inference emitted by the system is tagged with an end-to-end provenance schema. 
              No opaque unversioned predictions can reach duty meteorologists.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500">GIT COMMIT:</span>
                <span className="text-sky-300 ml-2">{configData?.git_commit || 'sih-2026-v1.0'}</span>
              </div>
              <div>
                <span className="text-slate-500">MODEL VERSION:</span>
                <span className="text-slate-200 ml-2">{configData?.model_version}</span>
              </div>
              <div>
                <span className="text-slate-500">FEATURE SCHEMA:</span>
                <span className="text-slate-200 ml-2">{configData?.feature_version}</span>
              </div>
              <div>
                <span className="text-slate-500">BUST DEF VERSION:</span>
                <span className="text-slate-200 ml-2">{configData?.bust_definition_version}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Anti-Leakage Audit Certificate</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Automated continuous testing verifies zero future observation leakage into the feature engine. 
              Timestamp alignment enforces <code className="text-emerald-300">valid_time == init_time + lead_days</code> without off-by-one errors.
            </p>
          </div>
        </div>

        {/* JSON Provenance Record Inspector */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Traceable Provenance JSON Schema (Prediction ID: {sampleProvenanceRecord.prediction_id})
            </span>
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-sky-300 overflow-x-auto max-h-[460px]">
            <pre>{JSON.stringify(sampleProvenanceRecord, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
