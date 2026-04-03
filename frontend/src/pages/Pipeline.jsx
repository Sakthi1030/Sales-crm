/**
 * pages/Pipeline.jsx — Visual Kanban sales pipeline.
 * Deals are grouped into columns: Prospect → Qualified → Negotiation → Closed Won
 */

import React, { useEffect, useState, useCallback } from 'react';
import { dealsAPI, teamAPI } from '../utils/api';
import { Badge, Avatar, Button, Modal, FormField, inputStyle, Spinner } from '../components/ui';
import { fmtMoney, fmtDate, fmtDateInput } from '../utils/helpers';
import { toast } from 'react-toastify';

const STAGES = ['prospect', 'qualified', 'negotiation', 'closed'];
const STAGE_LABELS = { prospect: 'Prospect', qualified: 'Qualified', negotiation: 'Negotiation', closed: 'Closed Won' };
const STAGE_COLORS = { prospect: '#4f7ef8', qualified: '#f59e0b', negotiation: '#a855f7', closed: '#22c55e' };
const PROB_MAP     = { prospect: 20, qualified: 50, negotiation: 75, closed: 100 };

const EMPTY_FORM = {
  name: '', company: '', value: '', stage: 'prospect',
  probability: '20', close_date: '', assigned_to: '', notes: '',
};

export default function Pipeline({ onBadgeChange }) {
  const [deals,   setDeals]   = useState({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [reps,    setReps]    = useState([]);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, sumRes] = await Promise.all([dealsAPI.getAll(), dealsAPI.summary()]);
      const grouped = {};
      STAGES.forEach(s => { grouped[s] = []; });
      allRes.data.forEach(d => { if (grouped[d.stage]) grouped[d.stage].push(d); });
      setDeals(grouped);
      setSummary(sumRes.data);
      onBadgeChange?.('pipeline', grouped.negotiation?.length || 0);
    } catch {
      // demo fallback
      const demo = {
        prospect:    Array.from({ length: 8 }, (_, i) => demoCard('prospect', i)),
        qualified:   Array.from({ length: 7 }, (_, i) => demoCard('qualified', i)),
        negotiation: Array.from({ length: 6 }, (_, i) => demoCard('negotiation', i)),
        closed:      Array.from({ length: 9 }, (_, i) => demoCard('closed', i)),
      };
      setDeals(demo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); teamAPI.getAll().then(r => setReps(r.data)).catch(() => {}); }, []);

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({ ...EMPTY_FORM, close_date: today });
    setModal(true);
  };

  const setF = (k) => (e) => {
    const val = e.target.value;
    setForm(f => ({
      ...f, [k]: val,
      ...(k === 'stage' ? { probability: String(PROB_MAP[val] || 20) } : {}),
    }));
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Deal name is required');
    setSaving(true);
    try {
      await dealsAPI.create({ ...form, value: parseFloat(form.value) || 0, probability: parseInt(form.probability) || 20 });
      toast.success('Deal created');
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (dealId, newStage) => {
    try {
      await dealsAPI.updateStage(dealId, newStage);
      toast.success(`Moved to ${STAGE_LABELS[newStage]}`);
      load();
    } catch {
      toast.error('Failed to move deal');
    }
  };

  const totalPipeline = Object.values(deals).flat().reduce((a, d) => a + (parseFloat(d.value) || 0), 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Sales Pipeline</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>
            Total pipeline: <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmtMoney(totalPipeline)}</span>
          </div>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Deal</Button>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STAGES.map(stage => {
          const col     = deals[stage] || [];
          const colVal  = col.reduce((a, d) => a + (parseFloat(d.value) || 0), 0);
          const color   = STAGE_COLORS[stage];
          return (
            <div key={stage} style={{ background: '#1e2538', borderRadius: 14, padding: 14 }}>
              {/* Column header */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 4 }}>{STAGE_LABELS[stage]}</div>
                <div style={{ fontSize: 12, color: '#5a6378' }}>{col.length} deals · {fmtMoney(colVal)}</div>
              </div>

              {/* Cards */}
              {col.map(deal => (
                <DealCard key={deal.id} deal={deal} color={color} onMove={moveStage} stages={STAGES} stageLabels={STAGE_LABELS} />
              ))}

              {col.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a6378', fontSize: 12 }}>
                  No deals here
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        open={modal} onClose={() => setModal(false)} title="Add New Deal"
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Deal'}</Button>
        </>}
      >
        <FormField label="Deal Name"><input style={inputStyle} value={form.name} onChange={setF('name')} placeholder="Enterprise Subscription" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Company"><input style={inputStyle} value={form.company} onChange={setF('company')} placeholder="Acme Corp" /></FormField>
          <FormField label="Value ($)"><input style={inputStyle} type="number" value={form.value} onChange={setF('value')} placeholder="25000" /></FormField>
          <FormField label="Stage">
            <select style={inputStyle} value={form.stage} onChange={setF('stage')}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </FormField>
          <FormField label="Probability (%)"><input style={inputStyle} type="number" value={form.probability} onChange={setF('probability')} min="0" max="100" /></FormField>
          <FormField label="Close Date"><input style={inputStyle} type="date" value={form.close_date} onChange={setF('close_date')} /></FormField>
          <FormField label="Assigned To">
            <select style={inputStyle} value={form.assigned_to} onChange={setF('assigned_to')}>
              <option value="">Select rep…</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={setF('notes')} placeholder="Deal notes…" />
        </FormField>
      </Modal>
    </div>
  );
}

// ── Deal Card ──────────────────────────────────────────────
function DealCard({ deal, color, onMove, stages, stageLabels }) {
  const [menu, setMenu] = useState(false);

  return (
    <div style={{
      background: '#161b27', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: 14, marginBottom: 10,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{deal.name}</div>
        {/* Stage move menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(m => !m)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#5a6378',
            fontSize: 14, padding: '0 4px', lineHeight: 1,
          }}>⋯</button>
          {menu && (
            <div style={{
              position: 'absolute', right: 0, top: 20, background: '#252d42',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 10,
              minWidth: 140, overflow: 'hidden',
            }}>
              {stages.filter(s => s !== deal.stage).map(s => (
                <div key={s} onClick={() => { onMove(deal.id, s); setMenu(false); }} style={{
                  padding: '9px 14px', fontSize: 12, cursor: 'pointer', color: '#8b93a8',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  → {stageLabels[s]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#5a6378', marginBottom: 10 }}>{deal.company}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>{fmtMoney(deal.value)}</div>
        {deal.rep_name && <Avatar name={deal.rep_name} color={deal.rep_color || 'accent'} size={22} fontSize={9} />}
      </div>

      {deal.close_date && (
        <div style={{ fontSize: 11, color: '#5a6378', marginBottom: 8 }}>Close: {fmtDate(deal.close_date)}</div>
      )}

      {/* Probability bar */}
      <div style={{ height: 3, background: '#252d42', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${deal.probability}%`, background: color, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, color: '#5a6378', marginTop: 4 }}>{deal.probability}% probability</div>
    </div>
  );
}

// ── Demo card generator for fallback ──────────────────────
const DEMO_NAMES    = ['Enterprise Platform','Pro Suite','Growth Package','Starter Bundle','API License','Support Plan','Cloud Migration','Analytics Suite'];
const DEMO_COMPANIES = ['Apex Solutions','BlueSky Tech','Cascade Systems','Delta Analytics','Echo Media','Frontier Digital','Gravity Labs','Horizon AI'];
const DEMO_REPS     = [{ name: 'Sarah Chen', color: 'green' }, { name: 'Marcus Webb', color: 'purple' }, { name: 'Priya Patel', color: 'amber' }];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const probMap = { prospect: [10, 30], qualified: [40, 60], negotiation: [65, 85], closed: [100, 100] };
function demoCard(stage, i) {
  const [pMin, pMax] = probMap[stage];
  const rep = DEMO_REPS[i % 3];
  return {
    id: `demo-${stage}-${i}`,
    name: DEMO_NAMES[i % 8],
    company: DEMO_COMPANIES[i % 8],
    value: rnd(5000, 150000),
    stage,
    probability: rnd(pMin, pMax),
    close_date: new Date(Date.now() + rnd(7, 120) * 86400000).toISOString(),
    rep_name: rep.name,
    rep_color: rep.color,
  };
}
