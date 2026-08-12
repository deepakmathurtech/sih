import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/appStore';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import VerifyPage from './pages/VerifyPage';
import RelationshipsPage from './pages/RelationshipsPage';
import ProofEnvelopePage from './pages/ProofEnvelopePage';
import DelegationPage from './pages/DelegationPage';
import AuditLogPage from './pages/AuditLogPage';
import ArchitecturePage from './pages/ArchitecturePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="relationships" element={<RelationshipsPage />} />
            <Route path="proof-envelope" element={<ProofEnvelopePage />} />
            <Route path="delegation" element={<DelegationPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="architecture" element={<ArchitecturePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
