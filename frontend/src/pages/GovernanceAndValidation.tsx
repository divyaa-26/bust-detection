import React, { useEffect, useState } from 'react';
import { getModelMetrics } from '../services/governanceService';
import type { ModelMetricsResponse } from '../services/governanceService';

const GovernanceAndValidation: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getModelMetrics();
        setMetrics(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !metrics) return <div className="p-gutter-desktop text-outline">Auditing model behavior...</div>;

  return (
    <div className="w-full min-h-screen p-gutter-desktop space-y-space-md">
      <div className="flex flex-col mb-space-lg">
        <h1 className="font-headline-lg text-primary-fixed">Governance & Validation Audit</h1>
        <p className="text-outline">Probability Calibration and Model Lifecycle Governance.</p>
      </div>

      <div className="bg-surface-container shadow-md border border-outline-variant p-space-md rounded-xl max-w-4xl">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
          <h2 className="font-headline-sm text-on-surface">Active ML Model Record</h2>
          <span className="bg-primary/20 text-primary-fixed px-3 py-1 rounded-full text-xs font-bold font-mono-data">
            {metrics.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="block text-[10px] uppercase text-outline">Model Architecture</span>
            <span className="font-mono-data text-lg text-on-surface">{metrics.active_model_info.name}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-outline">Version Hash</span>
            <span className="font-mono-data text-lg text-on-surface">{metrics.active_model_info.version}</span>
          </div>
        </div>
        
        <div className={`${metrics.status === 'TRAINED_REAL_MODEL' ? 'bg-emerald-950/20 border-l-4 border-emerald-500' : 'bg-error-container/20 border-l-4 border-error'} p-space-sm rounded`}>
          <span className={`${metrics.status === 'TRAINED_REAL_MODEL' ? 'text-emerald-400' : 'text-error'} font-bold text-xs uppercase block mb-1`}>
            {metrics.status === 'TRAINED_REAL_MODEL' ? 'SCIENTIFIC PROVENANCE & DISCLOSURE' : 'PROTOTYPE NOTICE'}
          </span>
          <p className="text-sm text-on-surface-variant italic">{metrics.honesty_notice}</p>
        </div>
      </div>

      {/* Mock Calibration Chart Wrapper */}
      <div className="bg-surface-container shadow-md border border-outline-variant p-space-md rounded-xl max-w-4xl">
        <h2 className="font-headline-sm text-on-surface mb-2">Probability Calibration Curve (Reliability Diagram)</h2>
        <p className="text-sm text-outline mb-4">Plots predicted probabilities against observed frequencies. A perfectly calibrated model lies exactly on the diagonal (y=x).</p>
        
        <div className="h-64 bg-surface-container-low border-l-2 border-b-2 border-outline flex items-center justify-center relative overflow-hidden">
           {/* Perfect Calibration Line */}
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <line x1="0" y1="100" x2="100" y2="0" stroke="#333" strokeDasharray="4" strokeWidth="1" />
           </svg>
           
           <span className="text-outline italic z-10 bg-surface-container-low px-2">Interactive D3 Chart requires D3.js integration (Data mapped to: {metrics.calibration.expected_calibration_error} ECE)</span>
        </div>
      </div>
    </div>
  );
};

export default GovernanceAndValidation;
