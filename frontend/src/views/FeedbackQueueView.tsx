import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X, HelpCircle, UserCheck, ShieldCheck, Clock } from 'lucide-react';
import { ForecasterFeedbackRecord } from '../types';
import { api } from '../services/api';

export const FeedbackQueueView: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<ForecasterFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getFeedbackList()
      .then((data) => setFeedbackList(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const confirmCount = feedbackList.filter((f) => f.decision === 'CONFIRM').length;
  const reviewCount = feedbackList.filter((f) => f.decision === 'NEEDS_REVIEW').length;
  const rejectCount = feedbackList.filter((f) => f.decision === 'REJECT').length;

  return (
    <div className="max-w-[1700px] mx-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-xs uppercase border border-sky-500/30">
            HUMAN-IN-THE-LOOP (HITL)
          </span>
          <h2 className="text-xl font-bold text-slate-100">Forecaster Review Feedback Ledger</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Operational forecaster adjudication records for retrospective scientific verification, model auditing, and future retraining datasets.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Reviews Logged</span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{feedbackList.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Continuous duty feedback</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Confirmed Bust Risk</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{confirmCount}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">Forecaster agreed with distrust flag</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-amber-400">Held on Watch</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{reviewCount}</div>
          <div className="text-[10px] text-amber-400/70 mt-1">Awaiting 6-hourly cycle update</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-rose-400">Dismissed Flags</span>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-1">{rejectCount}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">Synoptic override by human expert</div>
        </div>
      </div>

      {/* Feedback Records Table */}
      <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
            Duty Forecaster Review Decisions Log
          </h3>
          <span className="text-xs font-mono text-slate-400">Automated Retraining Disabled (Human Safety Buffer)</span>
        </div>

        {feedbackList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No feedback entries logged yet in this session. Submit review decisions from the Dashboard right panel to populate this ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3">Feedback ID</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Subdivision</th>
                  <th className="py-2.5 px-3">Lead</th>
                  <th className="py-2.5 px-3">Reviewer Role</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Reason & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {feedbackList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-sky-400 font-bold">{item.feedback_id}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{item.region_id}</td>
                    <td className="py-2.5 px-3 text-slate-300">D+{item.lead_time_days}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.user_role}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.decision === 'CONFIRM'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.decision === 'NEEDS_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {item.decision}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate font-sans text-xs">
                      {item.notes || item.decision_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
