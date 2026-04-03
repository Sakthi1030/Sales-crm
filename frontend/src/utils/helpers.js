/**
 * utils/helpers.js — shared formatting and utility functions
 */

// Format a number as currency: 45000 → "$45,000"
export const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Format large numbers compactly: 1500000 → "$1.5M"
export const fmtMoneyCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return fmtMoney(v);
};

// Format ISO date string: "2024-03-15T..." → "Mar 15, 2024"
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Format ISO date to YYYY-MM-DD for <input type="date">
export const fmtDateInput = (d) =>
  d ? new Date(d).toISOString().split('T')[0] : '';

// Get initials from a full name: "Alex Kim" → "AK"
export const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

// Truncate long strings
export const truncate = (str, n = 40) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;

// Debounce — for search inputs
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

// Status badge colour map
export const STATUS_COLORS = {
  new:         { bg: 'rgba(79,126,248,0.15)',  color: '#4f7ef8' },
  contacted:   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  qualified:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  lost:        { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  prospect:    { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  negotiation: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  closed:      { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  high:        { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  medium:      { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  High:        { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  Medium:      { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  Low:         { bg: 'rgba(20,184,166,0.12)',  color: '#14b8a6' },
  low:         { bg: 'rgba(20,184,166,0.12)',  color: '#14b8a6' },
  admin:       { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  rep:         { bg: 'rgba(20,184,166,0.15)',  color: '#14b8a6' },
};

// Avatar colour map (matches DB avatar_color field)
export const AVATAR_COLORS = {
  accent: '#4f7ef8',
  green:  '#16a34a',
  purple: '#9333ea',
  amber:  '#d97706',
  teal:   '#0d9488',
  pink:   '#db2777',
};
