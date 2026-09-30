import type { RiskLevel } from '../types';

export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 8, label: 'Low Risk', color: '#10B981' }, // Green (< 8% | < 2.0x base)
  MODERATE: { min: 8, max: 14, label: 'Monitor', color: '#F59E0B' }, // Amber (8–14% | 2.0–3.5x base)
  HIGH: { min: 14, max: 24, label: 'High Review', color: '#EA580C' }, // Orange (14–24% | 3.5–6.0x base)
  SEVERE: { min: 24, max: 100, label: 'Critical Inspection', color: '#DC2626' }, // Red (>= 24% | >= 6.0x base)
};

export const getRiskLevel = (score: number): RiskLevel => {
  const s = score > 1 ? score : score * 100;
  if (s >= 24) return 'SEVERE';
  if (s >= 14) return 'HIGH';
  if (s >= 8) return 'MODERATE';
  return 'LOW';
};
