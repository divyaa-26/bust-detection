import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Mode } from '../types';

interface AppState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeSubdivision: string | null;
  setActiveSubdivision: (id: string | null) => void;
  activeRegionData: any | null;
  setActiveRegionData: (data: any | null) => void;
  leadTimeDays: number;
  setLeadTimeDays: (days: number) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('DEMO');
  const [activeSubdivision, setActiveSubdivision] = useState<string | null>(null);
  const [activeRegionData, setActiveRegionData] = useState<any | null>(null);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);

  return (
    <AppContext.Provider value={{ mode, setMode, activeSubdivision, setActiveSubdivision, activeRegionData, setActiveRegionData, leadTimeDays, setLeadTimeDays }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
