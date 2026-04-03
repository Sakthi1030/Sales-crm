/**
 * App.jsx — Root component. Sets up React Router, Auth, and the app shell.
 */

import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar  from './components/layout/Sidebar';
import Topbar   from './components/layout/Topbar';
import Login    from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads    from './pages/Leads';
import Customers from './pages/Customers';
import Pipeline  from './pages/Pipeline';
import Tasks    from './pages/Tasks';
import Reports  from './pages/Reports';
import Team     from './pages/Team';

// ── Page titles for topbar ─────────────────────────────────
const PAGE_TITLES = {
  '/':          'Dashboard',
  '/leads':     'Lead Management',
  '/customers': 'Customers',
  '/pipeline':  'Sales Pipeline',
  '/tasks':     'Tasks & Follow-ups',
  '/reports':   'Reports & Analytics',
  '/team':      'Team Management',
};

// ── Protected layout wrapper ───────────────────────────────
function AppShell() {
  const { user, loading, isAdmin } = useAuth();
  const [badges, setBadges] = useState({ leads: 0, pipeline: 0, tasks: 0 });

  const updateBadge = useCallback((key, val) => {
    setBadges(b => ({ ...b, [key]: val }));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#4f7ef8', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const path = window.location.pathname;
  const title = Object.entries(PAGE_TITLES).find(([k]) => path === k || (k !== '/' && path.startsWith(k)))?.[1] || 'Nexus CRM';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', color: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar badges={badges} />
      <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        <Topbar title={title} />
        <div style={{ padding: 24 }}>
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/leads"     element={<Leads     onBadgeChange={updateBadge} />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/pipeline"  element={<Pipeline  onBadgeChange={updateBadge} />} />
            <Route path="/tasks"     element={<Tasks     onBadgeChange={updateBadge} />} />
            <Route path="/reports"   element={<Reports />} />
            {isAdmin && <Route path="/team" element={<Team />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0f1117; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #252d42; border-radius: 3px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .Toastify__toast { background: #161b27 !important; color: #f0f2f8 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; font-family: 'DM Sans', sans-serif !important; }
          .Toastify__toast--success .Toastify__progress-bar { background: #22c55e !important; }
          .Toastify__toast--error   .Toastify__progress-bar { background: #ef4444 !important; }
        `}</style>

        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route path="/*"     element={<AppShell />} />
        </Routes>

        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Redirect already-authed users away from login
function LoginGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
