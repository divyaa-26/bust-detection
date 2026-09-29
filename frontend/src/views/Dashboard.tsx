import React, { useState } from 'react';
import MapComponent from '../map/MapComponent';
import { useAppContext } from '../store';
import { fetchClient } from '../services/apiClient';

const Dashboard: React.FC = () => {
  const { mode, activeSubdivision, activeRegionData } = useAppContext();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTelemetry = async () => {
    if (!activeSubdivision) return;
    setLoading(true);
    try {
      // Backend automatically extracts SUB_XX from the ID
      const data = await fetchClient<any>(`/api/predictions/${activeSubdivision}`);
      setTelemetry(data);
    } catch (err) {
      console.error("Telemetry failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset telemetry if active subdivision changes
  React.useEffect(() => {
    setTelemetry(null);
  }, [activeSubdivision]);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full">
      {/* Main Map Area */}
      <div className="flex-1 relative border-r border-outline-variant">
        {mode === 'DEMO' && (
          <div className="absolute top-space-sm left-space-sm z-10 bg-surface-container-high/90 backdrop-blur px-space-sm py-space-xs rounded border border-outline-variant text-label-badge font-label-caps uppercase text-primary-fixed">
            DEMO MODE - Mock GeoJSON Data
          </div>
        )}
        
        {/* MapLibre Map */}
        <MapComponent />
      </div>

      {/* Diagnostic Panel */}
      <div className="w-96 bg-surface-container flex flex-col overflow-y-auto">
        <div className="p-space-md border-b border-outline-variant">
          <span className="font-label-caps text-label-caps text-outline uppercase">DIAGNOSTIC PANEL</span>
          {activeSubdivision ? (
            <h2 className="font-headline-md font-bold mt-1 text-on-surface">{activeRegionData?.region_name || activeSubdivision} <span className="text-sm font-normal text-outline ml-2">{activeSubdivision}</span></h2>
          ) : (
            <h2 className="font-headline-md text-outline mt-1 italic">Select a region</h2>
          )}
        </div>
        
        {activeSubdivision ? (
          <div className="p-space-md flex flex-col gap-space-md">
            
            {!telemetry ? (
              <>
                <div className="bg-surface-container-low p-space-sm rounded border border-outline-variant">
                  <span className="text-label-caps text-outline uppercase mb-2 block">Risk Drivers</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-body-sm">
                      <span>Ensemble Spread</span>
                      <span className="font-mono-data text-secondary">
                        {activeRegionData ? `±${activeRegionData.ensemble_spread?.toFixed(1)}` : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm">
                      <span>Model Disagreement</span>
                      <span className="font-mono-data text-error">
                        {activeRegionData ? `Δ ${activeRegionData.inter_model_disagreement?.toFixed(1)}` : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={loadTelemetry}
                  disabled={loading}
                  className="w-full py-space-sm bg-primary-container text-on-primary-container font-label-caps rounded font-bold hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {loading ? 'PULLING TELEMETRY...' : 'VIEW DETAILED TELEMETRY'}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-surface-container-highest p-3 rounded">
                  <div className="text-xs uppercase text-outline mb-1">Operational Priority</div>
                  <div className={`font-bold ${telemetry.prediction.operational_priority.includes('CRITICAL') ? 'text-error' : 'text-primary'}`}>
                    {telemetry.prediction.operational_priority.replace('_', ' ')}
                  </div>
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
                  <div className="text-[10px] uppercase text-outline mb-2">Deep Intelligence Drivers</div>
                  {telemetry.prediction.why_distrust_drivers.map((driver: any, idx: number) => (
                    <div key={idx} className="mb-2 last:mb-0 border-l-2 border-primary-fixed pl-2">
                      <div className="text-xs font-bold text-on-surface">{driver.driver_name}</div>
                      <div className="text-[10px] text-on-surface-variant italic">{driver.rationale}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
                  <div className="text-[10px] uppercase text-outline mb-2">Conformal Uncertainty Interval</div>
                  <div className="flex justify-between text-xs font-mono-data">
                    <span className="text-secondary">P5 (Lower)</span>
                    <span>{telemetry.prediction.conformal_interval_90[0].toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono-data mt-1">
                    <span className="text-error">P95 (Upper)</span>
                    <span>{telemetry.prediction.conformal_interval_90[1].toFixed(2)} mm</span>
                  </div>
                </div>

                <div className="bg-error/10 border border-error/50 p-3 rounded">
                  <div className="text-[10px] uppercase text-error font-bold mb-1">Recommended Action</div>
                  <div className="text-sm text-on-surface">{telemetry.prediction.recommended_action}</div>
                </div>
                
                <button 
                  onClick={() => setTelemetry(null)}
                  className="w-full py-2 bg-surface-container-highest text-on-surface font-label-caps rounded font-bold hover:bg-surface-bright transition-colors"
                >
                  CLOSE TELEMETRY
                </button>
              </div>
            )}
            
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-outline p-space-md text-center">
            Click on any subdivision on the map to view detailed risk diagnostics and model disagreement metrics.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
