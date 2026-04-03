/**
 * components/layout/Topbar.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NOTIFS = [
  { id: 1, title: 'New lead assigned to you',               time: '2 min ago',   unread: true  },
  { id: 2, title: 'Deal "Enterprise Platform" → Negotiation', time: '1 hr ago',    unread: true  },
  { id: 3, title: 'Task overdue: Follow up after demo',     time: '3 hrs ago',   unread: true  },
  { id: 4, title: 'Apex Solutions renewed contract',        time: 'Yesterday',   unread: false },
  { id: 5, title: 'Weekly performance report ready',        time: '2 days ago',  unread: false },
];

export default function Topbar({ title, onSearch }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs,    setNotifs]    = useState(NOTIFS);
  const navigate = useNavigate();

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, unread: false })));

  return (
    <div style={{
      height: 56, background: '#161b27', borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 90,
    }}>
      {/* Title */}
      <div style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{title}</div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#1e2538', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '7px 12px', width: 240,
      }}>
        <SearchIcon />
        <input
          placeholder="Search leads, customers…"
          onChange={e => onSearch?.(e.target.value)}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: '#f0f2f8', fontFamily: 'inherit', fontSize: 13, width: '100%',
          }}
        />
      </div>

      {/* Notification bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen(o => !o)}
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#1e2538', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#8b93a8',
            position: 'relative',
          }}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7, background: '#ef4444',
              borderRadius: '50%', border: '1.5px solid #161b27',
            }} />
          )}
        </button>

        {/* Notif panel */}
        {notifOpen && (
          <div style={{
            position: 'absolute', top: 40, right: 0, width: 310,
            background: '#161b27', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, zIndex: 200, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
              <span
                onClick={markAllRead}
                style={{ fontSize: 11, color: '#4f7ef8', cursor: 'pointer' }}
              >
                Mark all read
              </span>
            </div>
            {notifs.map(n => (
              <div key={n.id} style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', gap: 8, cursor: 'pointer',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50', marginTop: 4, flexShrink: 0,
                  background: n.unread ? '#4f7ef8' : 'transparent',
                  border: n.unread ? 'none' : '1px solid transparent',
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: n.unread ? 500 : 400 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: '#5a6378', marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a6378" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function BellIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
