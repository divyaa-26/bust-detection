import React, { useEffect, useState } from 'react';
import { getPriorityQueue } from '../services/priorityService';
import type { PriorityQueueItem } from '../services/priorityService';
import { RISK_THRESHOLDS } from '../constants';

const ForecasterFeedback: React.FC = () => {
  const [queue, setQueue] = useState<PriorityQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPriorityQueue(5);
        setQueue(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-gutter-desktop text-outline">Loading Priority Queue...</div>;

  return (
    <div className="w-full min-h-screen p-gutter-desktop space-y-space-md">
      <div className="flex flex-col mb-space-lg">
        <h1 className="font-headline-lg text-primary">Forecaster Action Queue</h1>
        <p className="text-outline">Algorithmically sorted by bust probability and operational priority.</p>
      </div>

      <div className="flex flex-col gap-space-sm">
        {queue.map((item, idx) => {
          const isCritical = item.operational_priority === 'CRITICAL_INSPECTION';
          return (
            <div key={idx} className={`flex flex-col md:flex-row items-center gap-space-md p-space-md rounded-lg border ${isCritical ? 'border-error/50 bg-error/5' : 'border-outline-variant bg-surface-container-low'} shadow-sm`}>
              {/* RANK */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-highest text-on-surface font-headline-md font-bold shrink-0">
                #{item.rank}
              </div>

              {/* DETAILS */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-space-sm">
                  <span className="font-mono-data font-bold text-lg text-on-surface">{item.region_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCritical ? 'bg-error text-on-error' : 'bg-surface-container-highest text-outline'}`}>
                    {item.operational_priority.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-outline">
                  Primary Driver: <span className="text-on-surface-variant font-semibold">{item.top_driver}</span>
                </div>
              </div>

              {/* METRICS */}
              <div className="flex items-center gap-space-lg">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-outline">Bust Prob</span>
                  <span className="font-mono-data font-bold text-lg" style={{ color: RISK_THRESHOLDS[item.risk_level as keyof typeof RISK_THRESHOLDS]?.color }}>
                    {(item.bust_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-outline">Expected Error</span>
                  <span className="font-mono-data text-secondary">{item.expected_error_str}</span>
                </div>
              </div>

              {/* ACTION */}
              <div className="shrink-0 ml-space-md">
                <button className={`px-space-md py-space-sm rounded font-label-caps font-bold transition-colors ${isCritical ? 'bg-error text-on-error hover:bg-error/90' : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90'}`}>
                  REVIEW CASE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecasterFeedback;
