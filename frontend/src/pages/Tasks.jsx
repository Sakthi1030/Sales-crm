/**
 * pages/Tasks.jsx — Task management with toggle, add, delete.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI, teamAPI } from '../utils/api';
import { Badge, Button, Modal, FormField, inputStyle, EmptyState, Spinner } from '../components/ui';
import { fmtDate } from '../utils/helpers';
import { toast } from 'react-toastify';

const EMPTY_FORM = { title: '', due_date: '', priority: 'Medium', link_type: 'lead', assigned_to: '', notes: '' };

export default function Tasks({ onBadgeChange }) {
  const [tasks,   setTasks]   = useState([]);
  const [reps,    setReps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tasksAPI.getAll();
      setTasks(res.data);
      onBadgeChange?.('tasks', res.data.filter(t => !t.done).length);
    } catch {
      setTasks(DEMO_TASKS);
      onBadgeChange?.('tasks', DEMO_TASKS.filter(t => !t.done).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); teamAPI.getAll().then(r => setReps(r.data)).catch(() => {}); }, []);

  const toggle = async (id) => {
    try {
      const res = await tasksAPI.toggle(id);
      setTasks(ts => ts.map(t => t.id === id ? res.data : t));
      onBadgeChange?.('tasks', tasks.filter(t => !t.done && t.id !== id).length + (res.data.done ? 0 : 1));
    } catch {
      // Optimistic update for demo
      setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }
  };

  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks(ts => ts.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch {
      setTasks(ts => ts.filter(t => t.id !== id));
    }
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Task title is required');
    setSaving(true);
    try {
      await tasksAPI.create(form);
      toast.success('Task created');
      setModal(false);
      load();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Tasks & Follow-ups</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>
            {pending.length} pending · {done.length} completed
          </div>
        </div>
        <Button variant="primary" onClick={() => { setForm({ ...EMPTY_FORM, due_date: new Date().toISOString().split('T')[0] }); setModal(true); }}>
          + Add Task
        </Button>
      </div>

      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={28} /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <TaskColumn title="Pending Tasks" tasks={pending} onToggle={toggle} onDelete={handleDelete} />
            <TaskColumn title="Completed" tasks={done} onToggle={toggle} onDelete={handleDelete} />
          </div>
        )}

      <Modal
        open={modal} onClose={() => setModal(false)} title="Add New Task"
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</Button>
        </>}
      >
        <FormField label="Task Title"><input style={inputStyle} value={form.title} onChange={setF('title')} placeholder="Follow up with client" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Due Date"><input style={inputStyle} type="date" value={form.due_date} onChange={setF('due_date')} /></FormField>
          <FormField label="Priority">
            <select style={inputStyle} value={form.priority} onChange={setF('priority')}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Link To">
            <select style={inputStyle} value={form.link_type} onChange={setF('link_type')}>
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="deal">Deal</option>
            </select>
          </FormField>
          <FormField label="Assigned To">
            <select style={inputStyle} value={form.assigned_to} onChange={setF('assigned_to')}>
              <option value="">Select rep…</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={setF('notes')} placeholder="Details…" />
        </FormField>
      </Modal>
    </div>
  );
}

function TaskColumn({ title, tasks, onToggle, onDelete }) {
  return (
    <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{title}</div>
      {tasks.length === 0
        ? <EmptyState icon={title.includes('Pending') ? '✅' : '📋'} text={title.includes('Pending') ? 'All caught up!' : 'No completed tasks'} />
        : tasks.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
            borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            {/* Checkbox */}
            <div
              onClick={() => onToggle(t.id)}
              style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: `1.5px solid ${t.done ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
                background: t.done ? '#22c55e' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 500,
                textDecoration: t.done ? 'line-through' : 'none',
                color: t.done ? '#5a6378' : '#f0f2f8',
              }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#5a6378', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {t.due_date && <span>Due: {fmtDate(t.due_date)}</span>}
                {t.rep_name && <span>· {t.rep_name}</span>}
                <Badge status={t.priority} style={{ fontSize: 10, padding: '1px 6px' }}>{t.priority}</Badge>
              </div>
            </div>

            <button onClick={() => onDelete(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#5a6378', fontSize: 13, padding: '2px 4px',
            }}>✕</button>
          </div>
        ))}
    </div>
  );
}

// ── Demo fallback data ─────────────────────────────────────
const DEMO_TASKS = [
  { id: 'd1', title: 'Follow up after demo', done: false, priority: 'High',   due_date: '2025-02-10', rep_name: 'Sarah Chen' },
  { id: 'd2', title: 'Send proposal document', done: false, priority: 'High',   due_date: '2025-02-12', rep_name: 'Marcus Webb' },
  { id: 'd3', title: 'Schedule onboarding call', done: false, priority: 'Medium', due_date: '2025-02-15', rep_name: 'Priya Patel' },
  { id: 'd4', title: 'Review contract terms', done: false, priority: 'Medium', due_date: '2025-02-18', rep_name: 'Devon Clark' },
  { id: 'd5', title: 'Collect NPS feedback', done: false, priority: 'Low',    due_date: '2025-02-20', rep_name: 'Zoe Martinez' },
  { id: 'd6', title: 'Send case study', done: true, priority: 'Medium', due_date: '2025-01-30', rep_name: 'Sarah Chen' },
  { id: 'd7', title: 'Quarterly business review prep', done: true, priority: 'High', due_date: '2025-01-28', rep_name: 'Marcus Webb' },
  { id: 'd8', title: 'Update CRM notes', done: true, priority: 'Low', due_date: '2025-01-25', rep_name: 'Priya Patel' },
];
