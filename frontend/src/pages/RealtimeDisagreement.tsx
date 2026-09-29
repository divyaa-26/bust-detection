import React, { useEffect, useState } from 'react';
import { getRealtimeDisagreement } from '../services/realtimeService';
import type { RealtimeDisagreementResponse } from '../services/realtimeService';

const RealtimeDisagreement: React.FC = () => {
  const [data, setData] = useState<RealtimeDisagreementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRealtimeDisagreement(5);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !data) return <div className="p-gutter-desktop text-outline">Syncing LIVE models...</div>;

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-on-surface p-gutter-desktop space-y-gutter-desktop">
      {/* HEADER */}
      <div className="bg-surface-container shadow-md rounded-xl p-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-error-container/30 px-space-sm py-1 rounded">
            <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
            <span className="font-label-caps text-label-caps text-error uppercase font-bold tracking-wider">LIVE COMPARISON: {data.feature_name}</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-outline">CRITICAL MAX SPREAD:</span>
            <span className="font-mono-metric text-mono-metric text-primary font-semibold">{data.max_discrepancy_region}</span>
            <span className="font-label-badge text-label-badge px-space-xs py-0.5 bg-surface-container-highest text-tertiary-fixed-dim rounded font-semibold uppercase">Δ {data.max_discrepancy_mm} mm</span>
          </div>
        </div>
      </div>

      {/* DISAGREEMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {data.disagreements.map((item, idx) => (
          <div key={idx} className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2 shadow-sm border border-outline-variant hover:border-primary-fixed/50 transition-colors">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-mono-data font-bold text-lg text-primary">{item.region_name}</span>
              <span className={`px-2 py-1 rounded font-bold text-xs ${item.agreement_level === 'SEVERE_DISCORD' ? 'bg-error/20 text-error' : item.agreement_level === 'MODERATE_DISCORD' ? 'bg-tertiary-container/20 text-tertiary-fixed-dim' : 'bg-secondary/20 text-secondary'}`}>
                {item.agreement_level.replace('_', ' ')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="flex flex-col bg-surface-container p-2 rounded">
                <span className="text-[10px] uppercase text-outline">GFS Forecast</span>
                <span className="font-mono-data text-xl text-on-surface">{item.gfs_forecast_mm.toFixed(1)} <span className="text-sm">mm</span></span>
              </div>
              <div className="flex flex-col bg-surface-container p-2 rounded">
                <span className="text-[10px] uppercase text-outline">AIFS Forecast</span>
                <span className="font-mono-data text-xl text-primary-fixed">{item.aifs_forecast_mm.toFixed(1)} <span className="text-sm">mm</span></span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-surface-container-highest p-2 rounded mt-2">
              <span className="text-xs uppercase text-outline font-bold">Discrepancy (Δ)</span>
              <span className="font-mono-data font-bold text-error text-lg">{item.discrepancy_mm.toFixed(1)} mm</span>
            </div>

            <div className="mt-2 text-sm text-on-surface-variant italic border-l-2 border-primary-fixed pl-2">
              {item.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtimeDisagreement;
