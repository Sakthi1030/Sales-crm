/**
 * pages/Dashboard.jsx
 * Main overview: KPIs, revenue chart, lead sources, top reps, activity feed.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Filler,
} from 'chart.js';
import { reportsAPI } from '../utils/api';
import { KpiCard, Avatar, Spinner } from '../components/ui';
import { fmtMoney, fmtMoneyCompact, fmtDate } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SRC_COLORS = ['#4f7ef8','#22c55e','#f59e0b','#a855f7','#14b8a6','#ef4444'];

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const AXIS = {
  x: { grid: { display: false }, ticks: { color: '#5a6378', font: { size: 11 } }, border: { display: false } },
  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#5a6378', font: { size: 11 } }, border: { display: false } },
};

// Simulate realistic monthly revenue for demo (backend would supply real data)
function buildMonthlyRevenue() {
  const base = [210,195,280,320,290,380,420,395,450,510,480,560];
  return base.map(v => Math.round(v * (0.85 + Math.random() * 0.3)));
}

const ACTIVITY = [
  { text: 'New lead Jordan Smith added',              time: '2 min ago',  color: '#4f7ef8' },
  { text: 'Deal "Enterprise Platform" → Negotiation', time: '45 min ago', color: '#f59e0b' },
  { text: 'Apex Solutions renewed contract',          time: '2 hrs ago',  color: '#22c55e' },
  { text: 'Task completed: QBR prep',                time: '3 hrs ago',  color: '#a855f7' },
  { text: 'Lead converted → Customer: Blake A.',     time: 'Yesterday',  color: '#14b8a6' },
  { text: 'New deal added: Pro Suite $45,000',        time: 'Yesterday',  color: '#f59e0b' },
];

export default function Dashboard() {
  const [overview,  setOverview]  = useState(null);
  const [sources,   setSources]   = useState([]);
  const [repPerf,   setRepPerf]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const monthlyData = useRef(buildMonthlyRevenue());

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, src, rp] = await Promise.all([
          reportsAPI.overview(),
          reportsAPI.leadSources(),
          reportsAPI.repPerformance(),
        ]);
        setOverview(ov.data);
        setSources(src.data);
        setRepPerf(rp.data);
      } catch {
        // Use placeholder data if API isn't running
        setOverview({ total_revenue: 4280000, total_leads: 48, active_deals: 21, total_customers: 30 });
        setSources([
          { source: 'Website', count: 14 }, { source: 'Referral', count: 11 },
          { source: 'LinkedIn', count: 9 }, { source: 'Cold Call', count: 7 },
          { source: 'Email Campaign', count: 5 }, { source: 'Event', count: 2 },
        ]);
        setRepPerf([
          { name: 'Sarah Chen',   color: 'green',  revenue: 380000, closed_deals: 9,  win_rate: 60 },
          { name: 'Marcus Webb',  color: 'purple', revenue: 310000, closed_deals: 7,  win_rate: 54 },
          { name: 'Priya Patel',  color: 'amber',  revenue: 295000, closed_deals: 6,  win_rate: 50 },
          { name: 'Devon Clark',  color: 'teal',   revenue: 240000, closed_deals: 5,  win_rate: 45 },
          { name: 'Zoe Martinez', color: 'pink',   revenue: 190000, closed_deals: 4,  win_rate: 40 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  const revData = monthlyData.current;
  const maxRev  = Math.max(...revData);

  return (
    <div>
      <SectionHeader
        title="Sales Overview"
        sub="Last 12 months performance"
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Revenue"    value={fmtMoneyCompact(overview?.total_revenue)}  change="18.2% vs last year" up icon={<DollarIcon />} iconBg="rgba(79,126,248,0.15)" />
        <KpiCard label="Total Leads"      value={overview?.total_leads}                      change="12.4% this month"   up icon={<UsersIcon />}  iconBg="rgba(34,197,94,0.12)"  />
        <KpiCard label="Conversion Rate"  value="37%"                                        change="3.1% this quarter"  up icon={<TrendIcon />}  iconBg="rgba(245,158,11,0.12)" />
        <KpiCard label="Active Deals"     value={overview?.active_deals}                     change="2 stalled deals"    up={false} icon={<BriefIcon />} iconBg="rgba(168,85,247,0.12)" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Revenue bar */}
        <Card title="Monthly Revenue" sub="Jan – Dec 2024">
          <div style={{ position: 'relative', height: 220 }}>
            <Bar
              data={{
                labels: MONTHS,
                datasets: [{
                  data: revData,
                  backgroundColor: revData.map(v => v === maxRev ? '#4f7ef8' : 'rgba(79,126,248,0.35)'),
                  borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{
                ...CHART_DEFAULTS,
                scales: {
                  x: AXIS.x,
                  y: { ...AXIS.y, ticks: { ...AXIS.y.ticks, callback: v => '$' + v + 'K' } },
                },
              }}
            />
          </div>
        </Card>

        {/* Lead sources doughnut */}
        <Card title="Lead Sources">
          <div style={{ position: 'relative', height: 180 }}>
            <Doughnut
              data={{
                labels: sources.map(s => s.source),
                datasets: [{ data: sources.map(s => s.count), backgroundColor: SRC_COLORS, borderWidth: 0, hoverOffset: 6 }],
              }}
              options={{ ...CHART_DEFAULTS, cutout: '68%' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {sources.map((s, i) => (
              <span key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b93a8' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: SRC_COLORS[i], display: 'inline-block' }} />
                {s.source} {s.count}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Conversion funnel */}
        <Card title="Lead Conversion Funnel">
          <div style={{ position: 'relative', height: 190 }}>
            <Bar
              data={{
                labels: ['Leads', 'Contacted', 'Qualified', 'Closed'],
                datasets: [{
                  data: [48, 32, 18, 9],
                  backgroundColor: ['rgba(79,126,248,0.4)','rgba(245,158,11,0.4)','rgba(34,197,94,0.4)','rgba(34,197,94,0.9)'],
                  borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{ ...CHART_DEFAULTS, scales: { x: AXIS.x, y: AXIS.y } }}
            />
          </div>
        </Card>

        {/* Top reps */}
        <Card title="Top Sales Reps">
          {repPerf.slice(0, 5).map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6378', width: 18, fontFamily: 'monospace' }}>#{i + 1}</div>
              <Avatar name={r.name} color={r.color} size={28} fontSize={10} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#5a6378' }}>{r.closed_deals} closed · {r.win_rate}% win rate</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#f0f2f8' }}>{fmtMoney(r.revenue)}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Activity feed */}
        <Card title="Recent Activity">
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: '#5a6378', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Deals by stage */}
        <Card title="Deals by Stage">
          <div style={{ position: 'relative', height: 220 }}>
            <Bar
              data={{
                labels: ['Prospect', 'Qualified', 'Negotiation', 'Closed Won'],
                datasets: [{
                  data: [8, 7, 6, 9],
                  backgroundColor: ['rgba(79,126,248,0.7)','rgba(245,158,11,0.7)','rgba(168,85,247,0.7)','rgba(34,197,94,0.7)'],
                  borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{ ...CHART_DEFAULTS, indexAxis: 'y', scales: { x: AXIS.x, y: AXIS.y } }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#5a6378', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// Icons
function DollarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f7ef8" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function UsersIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function TrendIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function BriefIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
