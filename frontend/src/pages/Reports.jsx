/**
 * pages/Reports.jsx — Analytics & performance reporting.
 */

import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Filler,
} from 'chart.js';
import { reportsAPI } from '../utils/api';
import { KpiCard, Spinner } from '../components/ui';
import { fmtMoney, fmtMoneyCompact } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler);

const AXIS = {
  x: { grid: { display: false }, ticks: { color: '#5a6378', font: { size: 11 } }, border: { display: false } },
  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#5a6378', font: { size: 11 } }, border: { display: false } },
};
const OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [repPerf,  setRepPerf]  = useState([]);
  const [sources,  setSources]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, rp, src] = await Promise.all([
          reportsAPI.overview(),
          reportsAPI.repPerformance(),
          reportsAPI.leadSources(),
        ]);
        setOverview(ov.data);
        setRepPerf(rp.data);
        setSources(src.data);
      } catch {
        setOverview({ total_revenue: 4280000, total_leads: 48, active_deals: 21, total_customers: 30 });
        setRepPerf(DEMO_REPS);
        setSources(DEMO_SOURCES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  const winRate = repPerf.length
    ? Math.round(repPerf.reduce((a, r) => a + (r.win_rate || 0), 0) / repPerf.length)
    : 0;

  const closedDeals = repPerf.reduce((a, r) => a + (r.closed_deals || 0), 0);
  const avgDeal = repPerf.length && closedDeals
    ? Math.round(repPerf.reduce((a, r) => a + (r.revenue || 0), 0) / closedDeals)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Reports & Analytics</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>Performance insights for your team</div>
        </div>
        <button style={{
          padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 8, color: '#8b93a8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
        }}>↓ Export PDF</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Revenue"  value={fmtMoneyCompact(overview?.total_revenue)} change="18.2%"  up />
        <KpiCard label="Win Rate"       value={`${winRate}%`}                            change="4.1%"   up />
        <KpiCard label="Deals Closed"   value={closedDeals}                              change="3 this month" up />
        <KpiCard label="Avg Deal Size"  value={fmtMoney(avgDeal)}                        change="2.3%"   up={false} />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Revenue by rep */}
        <ChartCard title="Revenue by Rep">
          <Bar
            data={{
              labels: repPerf.map(r => r.name.split(' ')[0]),
              datasets: [{
                data: repPerf.map(r => Math.round((r.revenue || 0) / 1000)),
                backgroundColor: ['#4f7ef8','#22c55e','#a855f7','#f59e0b','#14b8a6','#ec4899'],
                borderRadius: 5, borderSkipped: false,
              }],
            }}
            options={{ ...OPTS, scales: { x: AXIS.x, y: { ...AXIS.y, ticks: { ...AXIS.y.ticks, callback: v => '$' + v + 'K' } } } }}
          />
        </ChartCard>

        {/* Win rate trend */}
        <ChartCard title="Win Rate Trend (Monthly)">
          <Line
            data={{
              labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
              datasets: [{
                data: [28,31,29,35,38,32,40,44,41,47,45,52],
                borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)',
                tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#22c55e',
              }],
            }}
            options={{ ...OPTS, scales: { x: AXIS.x, y: { ...AXIS.y, ticks: { ...AXIS.y.ticks, callback: v => v + '%' } } } }}
          />
        </ChartCard>

        {/* Lead sources doughnut */}
        <ChartCard title="Deals by Industry">
          <Doughnut
            data={{
              labels: ['Technology','Finance','Healthcare','Retail','Manufacturing','Education'],
              datasets: [{
                data: [28,18,15,12,10,7],
                backgroundColor: ['#4f7ef8','#22c55e','#f59e0b','#a855f7','#14b8a6','#ef4444'],
                borderWidth: 0, hoverOffset: 4,
              }],
            }}
            options={{ ...OPTS, cutout: '60%' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['Technology','Finance','Healthcare','Retail','Manufacturing','Education'].map((ind, i) => (
              <span key={ind} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b93a8' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ['#4f7ef8','#22c55e','#f59e0b','#a855f7','#14b8a6','#ef4444'][i], display: 'inline-block' }} />
                {ind}
              </span>
            ))}
          </div>
        </ChartCard>

        {/* New leads monthly */}
        <ChartCard title="New Leads per Month">
          <Line
            data={{
              labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
              datasets: [{
                data: [12,18,15,22,28,24,30,27,35,32,38,42],
                borderColor: '#4f7ef8', backgroundColor: 'rgba(79,126,248,0.08)',
                tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#4f7ef8',
              }],
            }}
            options={{ ...OPTS, scales: { x: AXIS.x, y: AXIS.y } }}
          />
        </ChartCard>
      </div>

      {/* Rep performance table */}
      <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Rep Performance Breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Rep','Leads','Total Deals','Closed','Revenue','Win Rate'].map(h => (
                <th key={h} style={{ color: '#5a6378', fontWeight: 500, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repPerf.map(r => (
              <tr key={r.id || r.name}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontWeight: 500, color: '#f0f2f8' }}>{r.name}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#8b93a8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{r.leads_count || 0}</td>
                <td style={{ padding: '12px 14px', color: '#8b93a8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{r.total_deals || 0}</td>
                <td style={{ padding: '12px 14px', color: '#22c55e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{r.closed_deals || 0}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#22c55e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{fmtMoney(r.revenue || 0)}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: '#252d42', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.win_rate || 0}%`, background: (r.win_rate || 0) > 50 ? '#22c55e' : '#f59e0b', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{r.win_rate || 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{title}</div>
      <div style={{ position: 'relative', height: 220 }}>{children}</div>
    </div>
  );
}

// Demo fallbacks
const DEMO_REPS = [
  { name: 'Sarah Chen',   revenue: 380000, closed_deals: 9,  total_deals: 15, leads_count: 18, win_rate: 60 },
  { name: 'Marcus Webb',  revenue: 310000, closed_deals: 7,  total_deals: 13, leads_count: 15, win_rate: 54 },
  { name: 'Priya Patel',  revenue: 295000, closed_deals: 6,  total_deals: 12, leads_count: 14, win_rate: 50 },
  { name: 'Devon Clark',  revenue: 240000, closed_deals: 5,  total_deals: 11, leads_count: 12, win_rate: 45 },
  { name: 'Zoe Martinez', revenue: 190000, closed_deals: 4,  total_deals: 10, leads_count: 10, win_rate: 40 },
];
const DEMO_SOURCES = [
  { source: 'Website', count: 14 }, { source: 'Referral', count: 11 },
  { source: 'LinkedIn', count: 9 }, { source: 'Cold Call', count: 7 },
];
