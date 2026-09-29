import React, { useEffect, useState } from 'react';
import { getSystemMonitoring } from '../services/providerService';
import type { SystemStatusResponse } from '../services/providerService';

const DataProviders: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSystemMonitoring();
        setStatus(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !status) return <div className="p-gutter-desktop text-outline">Pinging NWP API gateways...</div>;

  return (
    <div className="w-full min-h-screen p-gutter-desktop space-y-space-md">
      <div className="flex flex-col mb-space-lg">
        <h1 className="font-headline-lg text-on-surface">Upstream Data Providers</h1>
        <p className="text-outline">Live status of external meteorological APIs and internal caches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-sm mb-space-lg">
        <div className="bg-surface-container p-space-md rounded-xl border border-outline-variant">
          <span className="text-[10px] uppercase text-outline">System Health</span>
          <div className="font-mono-data text-2xl text-primary font-bold mt-1">{status.system_health}</div>
        </div>
        <div className="bg-surface-container p-space-md rounded-xl border border-outline-variant">
          <span className="text-[10px] uppercase text-outline">Data Mode</span>
          <div className="font-mono-data text-2xl text-tertiary-fixed-dim font-bold mt-1">{status.data_mode}</div>
        </div>
        <div className="bg-surface-container p-space-md rounded-xl border border-outline-variant">
          <span className="text-[10px] uppercase text-outline">Gateway Latency</span>
          <div className="font-mono-data text-2xl text-on-surface font-bold mt-1">{status.latency_ms} ms</div>
        </div>
        <div className="bg-surface-container p-space-md rounded-xl border border-outline-variant">
          <span className="text-[10px] uppercase text-outline">Last Sync</span>
          <div className="font-mono-data text-sm text-on-surface-variant font-bold mt-1">{status.timestamp}</div>
        </div>
      </div>

      <h2 className="font-headline-sm text-outline border-b border-outline-variant pb-2 mb-4">Connected Provider Endpoints</h2>
      <div className="flex flex-col gap-space-sm">
        {Object.entries(status.active_providers).map(([name, data]: [string, any]) => (
          <div key={name} className="flex items-center justify-between p-space-md bg-surface-container-low rounded-lg border border-outline-variant">
            <div className="flex items-center gap-space-md">
              <div className={`w-3 h-3 rounded-full ${data.status === 'ONLINE' ? 'bg-primary' : 'bg-error'}`}></div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-on-surface">{name}</span>
                <span className="text-xs text-outline font-mono-data">{data.endpoint || 'Internal Engine API'}</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md">
              <span className="font-mono-data text-xs px-2 py-1 bg-surface-container-highest rounded text-on-surface">
                {data.latency_ms} ms
              </span>
              <span className={`font-mono-data font-bold text-xs ${data.status === 'ONLINE' ? 'text-primary' : 'text-error'}`}>
                {data.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProviders;
