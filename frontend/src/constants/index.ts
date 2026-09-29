import type { RiskLevel } from '../types';

export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 27, color: '#00F2FE' }, // Cyan
  MODERATE: { min: 28, max: 49, color: '#F59E0B' }, // Amber
  HIGH: { min: 50, max: 74, color: '#FF4D4D' }, // Red (light)
  SEVERE: { min: 75, max: 100, color: '#93000A' }, // Deep Red
};

export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 75) return 'SEVERE';
  if (score >= 50) return 'HIGH';
  if (score >= 28) return 'MODERATE';
  return 'LOW';
};
