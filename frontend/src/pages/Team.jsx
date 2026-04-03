/**
 * pages/Team.jsx — Admin-only team management view.
 */

import React, { useEffect, useState } from 'react';
import { teamAPI, reportsAPI } from '../utils/api';
import { Avatar, Badge, Spinner, EmptyState } from '../components/ui';
import { fmtMoney, fmtDate } from '../utils/helpers';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [perf,    setPerf]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tm, rp] = await Promise.all([teamAPI.getAll(), reportsAPI.repPerformance()]);
        setMembers(tm.data);
        setPerf(rp.data);
      } catch {
        setMembers(DEMO_MEMBERS);
        setPerf(DEMO_PERF);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Merge perf data onto members
  const enriched = members.map(m => {
    const p = perf.find(r => r.id === m.id) || {};
    return { ...m, ...p };
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Team Management</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>{members.length} members</div>
        </div>
        <button style={{
          padding: '8px 16px', background: '#4f7ef8', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Invite Member</button>
      </div>

      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
        : (
          <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Rep','Role','Email','Leads','Deals Closed','Revenue','Win Rate','Last Active'].map(h => (
                      <th key={h} style={{ color: '#5a6378', fontWeight: 500, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={m.name} color={m.avatar_color || 'accent'} size={28} fontSize={10} />
                          <span style={{ fontWeight: 500, color: '#f0f2f8' }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Badge status={m.role}>{m.role === 'admin' ? 'Admin' : 'Sales Rep'}</Badge>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#5a6378', fontSize: 12, fontFamily: 'monospace' }}>{m.email}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#8b93a8' }}>{m.leads_count || '—'}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#22c55e' }}>{m.closed_deals || '—'}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', color: '#22c55e' }}>{m.revenue ? fmtMoney(m.revenue) : '—'}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {m.win_rate != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: '#252d42', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${m.win_rate}%`, background: m.win_rate > 50 ? '#22c55e' : '#f59e0b', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{m.win_rate}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#5a6378', fontSize: 12 }}>{fmtDate(m.last_login) || 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

const DEMO_MEMBERS = [
  { id: '1', name: 'Alex Kim',     email: 'admin@nexuscrm.io',  role: 'admin', avatar_color: 'accent', last_login: new Date().toISOString() },
  { id: '2', name: 'Sarah Chen',   email: 'sarah@nexuscrm.io',  role: 'rep',   avatar_color: 'green',  last_login: new Date().toISOString() },
  { id: '3', name: 'Marcus Webb',  email: 'marcus@nexuscrm.io', role: 'rep',   avatar_color: 'purple', last_login: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', name: 'Priya Patel',  email: 'priya@nexuscrm.io',  role: 'rep',   avatar_color: 'amber',  last_login: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', name: 'Devon Clark',  email: 'devon@nexuscrm.io',  role: 'rep',   avatar_color: 'teal',   last_login: new Date(Date.now() - 259200000).toISOString() },
  { id: '6', name: 'Zoe Martinez', email: 'zoe@nexuscrm.io',    role: 'rep',   avatar_color: 'pink',   last_login: new Date(Date.now() - 345600000).toISOString() },
];
const DEMO_PERF = [
  { id: '2', leads_count: 18, closed_deals: 9,  revenue: 380000, win_rate: 60 },
  { id: '3', leads_count: 15, closed_deals: 7,  revenue: 310000, win_rate: 54 },
  { id: '4', leads_count: 14, closed_deals: 6,  revenue: 295000, win_rate: 50 },
  { id: '5', leads_count: 12, closed_deals: 5,  revenue: 240000, win_rate: 45 },
  { id: '6', leads_count: 10, closed_deals: 4,  revenue: 190000, win_rate: 40 },
];
