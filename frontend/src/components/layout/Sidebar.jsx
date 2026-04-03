/**
 * components/layout/Sidebar.jsx
 * Left navigation sidebar with role-aware menu items and badge counts.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';

const NAV = [
  { path: '/',          label: 'Dashboard',  icon: IconGrid },
  { path: '/leads',     label: 'Leads',      icon: IconUsers,    badge: 'leads' },
  { path: '/customers', label: 'Customers',  icon: IconUser },
  { path: '/pipeline',  label: 'Pipeline',   icon: IconList,     badge: 'pipeline' },
  { path: '/tasks',     label: 'Tasks',      icon: IconCheck,    badge: 'tasks' },
  { path: '/reports',   label: 'Reports',    icon: IconBar },
];
const ADMIN_NAV = [
  { path: '/team', label: 'Team', icon: IconTeam },
];

export default function Sidebar({ badges = {} }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const active    = location.pathname;

  const go = (path) => navigate(path);

  return (
    <nav style={{
      width: 220, background: '#161b27',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0,
      height: '100vh', zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 32, height: 32, background: '#4f7ef8', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>N</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Nexus CRM</div>
          <div style={{ fontSize: 10, color: '#5a6378', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
            Sales Platform
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding: '10px 0' }}>
        <NavLabel>Main</NavLabel>
        {NAV.map(item => (
          <NavItem
            key={item.path}
            active={active === item.path || (item.path !== '/' && active.startsWith(item.path))}
            onClick={() => go(item.path)}
            Icon={item.icon}
            badge={item.badge ? badges[item.badge] : null}
          >
            {item.label}
          </NavItem>
        ))}
      </div>

      {/* Admin nav */}
      {isAdmin && (
        <div style={{ padding: '4px 0' }}>
          <NavLabel>Admin</NavLabel>
          {ADMIN_NAV.map(item => (
            <NavItem
              key={item.path}
              active={active === item.path}
              onClick={() => go(item.path)}
              Icon={item.icon}
            >
              {item.label}
            </NavItem>
          ))}
        </div>
      )}

      {/* User */}
      <div style={{
        marginTop: 'auto', padding: '14px 18px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Avatar name={user?.name} color={user?.avatar_color || 'accent'} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#5a6378', textTransform: 'capitalize' }}>{user?.role === 'admin' ? 'Administrator' : 'Sales Rep'}</div>
        </div>
        <button onClick={logout} title="Sign out" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#5a6378', padding: 4, flexShrink: 0,
        }}>
          <IconLogout />
        </button>
      </div>
    </nav>
  );
}

// ── Sub-components ─────────────────────────────────────────
function NavLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, color: '#5a6378', textTransform: 'uppercase',
      letterSpacing: '0.1em', fontWeight: 600, padding: '8px 18px 4px',
    }}>{children}</div>
  );
}

function NavItem({ children, active, onClick, Icon, badge }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
      color: active ? '#4f7ef8' : '#8b93a8', cursor: 'pointer',
      fontSize: 13.5, fontWeight: active ? 500 : 400,
      background: active ? 'rgba(79,126,248,0.15)' : 'transparent',
      borderLeft: `3px solid ${active ? '#4f7ef8' : 'transparent'}`,
      transition: 'all 0.15s',
    }}>
      <Icon size={15} />
      <span style={{ flex: 1 }}>{children}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: '#4f7ef8', color: '#fff', fontSize: 10, fontWeight: 600,
          padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
        }}>{badge}</span>
      )}
    </div>
  );
}

// ── Icons (inline SVG to avoid icon library deps) ──────────
function IconGrid({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconUsers({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconUser({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconList({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function IconCheck({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconBar({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IconTeam({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconLogout({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
