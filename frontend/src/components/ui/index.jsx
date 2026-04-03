/**
 * components/ui/index.jsx
 * Small, reusable UI primitives used throughout the app.
 */

import React from 'react';
import { STATUS_COLORS, AVATAR_COLORS, initials } from '../../utils/helpers';

// ── Badge ──────────────────────────────────────────────────
export function Badge({ status, children, style }) {
  const theme = STATUS_COLORS[status] || { bg: 'rgba(255,255,255,0.08)', color: '#8b93a8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 500, padding: '3px 9px',
      borderRadius: 20, whiteSpace: 'nowrap',
      background: theme.bg, color: theme.color,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────
export function Avatar({ name, color = 'accent', size = 30, fontSize = 11 }) {
  const bg = AVATAR_COLORS[color] || AVATAR_COLORS.accent;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize, fontWeight: 600,
      color: '#fff', flexShrink: 0, userSelect: 'none',
    }}>
      {initials(name)}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────
export function Button({ variant = 'outline', size = 'md', children, style, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 8, fontFamily: 'inherit', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent',
  };
  const sizes   = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '8px 16px', fontSize: 13 } };
  const variants = {
    primary: { background: '#4f7ef8', color: '#fff', borderColor: '#4f7ef8' },
    outline: { background: 'transparent', color: '#8b93a8', borderColor: 'rgba(255,255,255,0.14)' },
    danger:  { background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderColor: 'transparent' },
    ghost:   { background: 'transparent', color: '#5a6378', border: 'none', padding: '4px 8px' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div style={{
        background: '#161b27', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 14, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{
            cursor: 'pointer', color: '#5a6378', background: 'none',
            border: 'none', fontSize: 18, lineHeight: 1, padding: 0,
          }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 24px' }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FormField ──────────────────────────────────────────────
export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#8b93a8', marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: '100%', background: '#1e2538', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '9px 12px', color: '#f0f2f8',
  fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
};

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: '#4f7ef8', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ icon = '📭', text = 'Nothing here yet' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6378' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────
export function KpiCard({ label, value, change, up = true, icon, iconBg }) {
  return (
    <div style={{
      background: '#161b27', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: iconBg || 'rgba(79,126,248,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#5a6378', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#f0f2f8', margin: '6px 0', lineHeight: 1 }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: 12, color: up ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          {up ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────
export function Table({ headers, children, loading }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                color: '#5a6378', fontWeight: 500, textTransform: 'uppercase',
                fontSize: 11, letterSpacing: '0.06em', padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={headers.length} style={{ padding: 40, textAlign: 'center' }}><Spinner /></td></tr>
            : children}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 30, height: 30, borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          background: p === page ? '#4f7ef8' : 'transparent',
          color: p === page ? '#fff' : '#8b93a8',
          cursor: 'pointer', fontSize: 12.5,
        }}>{p}</button>
      ))}
      <span style={{ fontSize: 12, color: '#5a6378', marginLeft: 'auto' }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

// Inject global spin animation once
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
