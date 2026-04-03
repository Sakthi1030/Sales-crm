/**
 * pages/Leads.jsx — Full lead management with CRUD, filters, search, pagination.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { leadsAPI, teamAPI } from '../utils/api';
import { Badge, Avatar, Button, Modal, FormField, inputStyle, Table, Pagination, EmptyState, Spinner } from '../components/ui';
import { fmtMoney, fmtDate, debounce } from '../utils/helpers';
import { toast } from 'react-toastify';

const STATUSES  = ['all', 'new', 'contacted', 'qualified', 'lost'];
const PRIORITIES = ['high', 'medium', 'low'];
const SOURCES   = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event'];
const HEADERS   = ['Name', 'Company', 'Email', 'Status', 'Assigned To', 'Value', 'Priority', 'Created', 'Actions'];

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '', status: 'new',
  priority: 'medium', source: 'Website', value: '', assigned_to: '', notes: '',
};

export default function Leads({ onBadgeChange }) {
  const [leads,     setLeads]     = useState([]);
  const [meta,      setMeta]      = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [reps,      setReps]      = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  const fetchLeads = useCallback(async (page = 1, q = search, status = filter) => {
    setLoading(true);
    try {
      const params = { page, limit: 8, q: q || undefined, status: status !== 'all' ? status : undefined };
      const res = await leadsAPI.getAll(params);
      setLeads(res.data.data);
      setMeta(res.data.meta);
      onBadgeChange?.('leads', res.data.data.filter(l => l.status === 'new').length);
    } catch {
      // Fallback: show empty state
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  const debouncedSearch = useCallback(debounce((q) => { setSearch(q); fetchLeads(1, q, filter); }, 350), [filter]);

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    teamAPI.getAll().then(r => setReps(r.data)).catch(() => {});
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (lead) => {
    setEditing(lead.id);
    setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', company: lead.company || '', status: lead.status, priority: lead.priority, source: lead.source, value: lead.value, assigned_to: lead.assigned_to || '', notes: lead.notes || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      if (editing) {
        await leadsAPI.update(editing, form);
        toast.success('Lead updated');
      } else {
        await leadsAPI.create(form);
        toast.success('Lead created');
      }
      setModal(false);
      fetchLeads(meta.page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadsAPI.delete(id);
      toast.success('Lead deleted');
      fetchLeads(meta.page);
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Lead Management</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>{meta.total} leads total</div>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Lead</Button>
      </div>

      {/* Card */}
      <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setFilter(s); fetchLeads(1, search, s); }} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
                background: filter === s ? '#4f7ef8' : 'transparent',
                color: filter === s ? '#fff' : '#8b93a8', fontFamily: 'inherit',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
          <input
            placeholder="Search leads…"
            onChange={e => debouncedSearch(e.target.value)}
            style={{ ...inputStyle, width: 200, padding: '7px 12px' }}
          />
        </div>

        <Table headers={HEADERS} loading={loading}>
          {leads.length === 0 && !loading
            ? <tr><td colSpan={HEADERS.length}><EmptyState icon="🎯" text="No leads found. Add your first lead!" /></td></tr>
            : leads.map(l => (
              <tr key={l.id} style={{ cursor: 'default' }}>
                <td>
                  <div style={{ color: '#f0f2f8', fontWeight: 500 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#5a6378' }}>{l.source}</div>
                </td>
                <td style={{ color: '#8b93a8' }}>{l.company}</td>
                <td style={{ fontSize: 12, color: '#5a6378', fontFamily: 'monospace' }}>{l.email}</td>
                <td><Badge status={l.status}>{l.status.charAt(0).toUpperCase() + l.status.slice(1)}</Badge></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={l.rep_name || '?'} color={l.rep_color || 'accent'} size={22} fontSize={9} />
                    <span style={{ fontSize: 12 }}>{l.rep_name || '—'}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', color: '#4f7ef8' }}>{fmtMoney(l.value)}</td>
                <td><Badge status={l.priority}>{l.priority.charAt(0).toUpperCase() + l.priority.slice(1)}</Badge></td>
                <td style={{ fontSize: 12, color: '#5a6378' }}>{fmtDate(l.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>✎</Button>
                    <Button variant="ghost" size="sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(l.id)}>✕</Button>
                  </div>
                </td>
              </tr>
            ))}
        </Table>

        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={p => fetchLeads(p)} />
      </div>

      {/* Modal */}
      <Modal
        open={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Lead' : 'Add New Lead'}
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Lead'}
          </Button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Full Name"><input style={inputStyle} value={form.name} onChange={setF('name')} placeholder="John Smith" /></FormField>
          <FormField label="Email"><input style={inputStyle} value={form.email} onChange={setF('email')} placeholder="john@co.com" /></FormField>
          <FormField label="Company"><input style={inputStyle} value={form.company} onChange={setF('company')} placeholder="Acme Corp" /></FormField>
          <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={setF('phone')} placeholder="+1 (555) 000-0000" /></FormField>
          <FormField label="Status">
            <select style={inputStyle} value={form.status} onChange={setF('status')}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select style={inputStyle} value={form.priority} onChange={setF('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Est. Value ($)">
            <input style={inputStyle} type="number" value={form.value} onChange={setF('value')} placeholder="10000" />
          </FormField>
          <FormField label="Source">
            <select style={inputStyle} value={form.source} onChange={setF('source')}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Assigned To">
          <select style={inputStyle} value={form.assigned_to} onChange={setF('assigned_to')}>
            <option value="">Select rep…</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={setF('notes')} placeholder="Additional notes…" />
        </FormField>
      </Modal>
    </div>
  );
}
