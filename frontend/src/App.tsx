import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import RealtimeDisagreement from './pages/RealtimeDisagreement';
import GovernanceAndValidation from './pages/GovernanceAndValidation';
import ForecasterFeedback from './pages/ForecasterFeedback';
import DataProviders from './pages/DataProviders';
import HistoricalReplay from './pages/HistoricalReplay';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="realtime" element={<RealtimeDisagreement />} />
            <Route path="governance" element={<GovernanceAndValidation />} />
            <Route path="feedback" element={<ForecasterFeedback />} />
            <Route path="data" element={<DataProviders />} />
            <Route path="history" element={<HistoricalReplay />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
