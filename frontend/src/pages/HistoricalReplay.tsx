import React, { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import type { HistoricalReplayEvent } from '../services/eventService';

const HistoricalReplay: React.FC = () => {
  const [events, setEvents] = useState<HistoricalReplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getEvents();
        setEvents(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-gutter-desktop text-outline">Loading Archive...</div>;

  return (
    <div className="w-full min-h-screen p-gutter-desktop space-y-space-md">
      <div className="flex flex-col mb-space-lg">
        <h1 className="font-headline-lg text-tertiary-fixed-dim">Historical Replay & Bust Archives</h1>
        <p className="text-outline">Examine how the models and the decision-support engine performed during major historical weather events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        {events.map((evt, idx) => (
          <div key={idx} className="bg-surface-container shadow-sm border border-outline-variant p-space-md rounded-xl flex flex-col justify-between hover:border-tertiary-fixed-dim/50 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-badge text-label-badge px-2 py-1 rounded bg-surface-container-highest text-on-surface-variant">
                  {evt.event_date}
                </span>
                <span className="font-label-badge text-label-badge px-2 py-1 rounded uppercase font-bold bg-error/20 text-error">
                  {evt.target_region_name}
                </span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">{evt.event_name}</h3>
              <p className="font-body-sm text-outline italic line-clamp-3">{evt.synoptic_description}</p>
            </div>
            
            <div className="mt-space-md flex gap-2">
              <button className="flex-1 py-2 bg-tertiary-container text-on-tertiary-container rounded font-label-caps font-bold text-xs hover:bg-tertiary transition-colors">
                LAUNCH REPLAY
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricalReplay;
