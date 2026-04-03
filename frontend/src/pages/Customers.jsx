/**
 * pages/Customers.jsx
 */

import React, { useEffect, useState, useCallback } from 'react';
import { customersAPI, teamAPI } from '../utils/api';
import { Avatar, Button, Modal, FormField, inputStyle, Table, Pagination, EmptyState, Spinner, Badge } from '../components/ui';
import { fmtMoney, fmtDate, debounce } from '../utils/helpers';
import { toast } from 'react-toastify';

const INDUSTRIES = ['Technology','Finance','Healthcare','Retail','Manufacturing','Education','Media','Real Estate'];
const HEADERS = ['Customer','Company','Email','Phone','Customer Since','Lifetime Value','Actions'];
const EMPTY_FORM = { name:'', email:'', phone:'', company:'', industry:'Technology', lifetime_value:'', account_manager:'' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [meta,      setMeta]      = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,   setLoading]   = useState(true);
  const [reps,      setReps]      = useState([]);
  const [modal,     setModal]     = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({ page, limit: 8, q: q || undefined });
      setCustomers(res.data.data);
      setMeta(res.data.meta);
    } catch {
      setCustomers(DEMO_CUSTOMERS);
      setMeta({ total: DEMO_CUSTOMERS.length, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(debounce((q) => load(1, q), 350), []);

  useEffect(() => { load(); teamAPI.getAll().then(r => setReps(r.data)).catch(() => {}); }, []);

  const viewCustomer = async (id) => {
    try {
      const res = await customersAPI.getOne(id);
      setSelected(res.data);
    } catch {
      setSelected(customers.find(c => c.id === id) || null);
    }
    setViewModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    setSaving(true);
    try {
      await customersAPI.create({ ...form, lifetime_value: parseFloat(form.lifetime_value) || 0 });
      toast.success('Customer added');
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Customer Management</div>
          <div style={{ fontSize: 13, color: '#5a6378', marginTop: 2 }}>{meta.total} customers</div>
        </div>
        <Button variant="primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>+ Add Customer</Button>
      </div>

      <div style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            placeholder="Search customers…"
            onChange={e => debouncedSearch(e.target.value)}
            style={{ ...inputStyle, width: 240, padding: '7px 12px' }}
          />
        </div>

        <Table headers={HEADERS} loading={loading}>
          {customers.length === 0 && !loading
            ? <tr><td colSpan={HEADERS.length}><EmptyState icon="👥" text="No customers yet" /></td></tr>
            : customers.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={c.name} color={c.rep_color || 'accent'} size={28} fontSize={10} />
                    <span style={{ color: '#f0f2f8', fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ color: '#8b93a8' }}>{c.company}</td>
                <td style={{ fontSize: 12, color: '#5a6378', fontFamily: 'monospace' }}>{c.email}</td>
                <td style={{ fontSize: 12, color: '#5a6378' }}>{c.phone}</td>
                <td style={{ fontSize: 12, color: '#5a6378' }}>{fmtDate(c.created_at)}</td>
                <td style={{ fontFamily: 'monospace', color: '#22c55e' }}>{fmtMoney(c.lifetime_value)}</td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => viewCustomer(c.id)}>View</Button>
                </td>
              </tr>
            ))}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={p => load(p)} />
      </div>

      {/* Add modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Customer"
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</Button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Full Name"><input style={inputStyle} value={form.name} onChange={setF('name')} placeholder="Jane Doe" /></FormField>
          <FormField label="Company"><input style={inputStyle} value={form.company} onChange={setF('company')} placeholder="Corp Inc" /></FormField>
          <FormField label="Email"><input style={inputStyle} value={form.email} onChange={setF('email')} placeholder="jane@corp.com" /></FormField>
          <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={setF('phone')} placeholder="+1 (555) 000-0000" /></FormField>
          <FormField label="Industry">
            <select style={inputStyle} value={form.industry} onChange={setF('industry')}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </FormField>
          <FormField label="Lifetime Value ($)"><input style={inputStyle} type="number" value={form.lifetime_value} onChange={setF('lifetime_value')} placeholder="50000" /></FormField>
        </div>
      </Modal>

      {/* View modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Customer Details" width={560}>
        {selected && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Avatar name={selected.name} color={selected.rep_color || 'accent'} size={44} fontSize={15} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: '#5a6378' }}>{selected.company} · {selected.industry}</div>
              </div>
              <Badge status="qualified" style={{ marginLeft: 'auto' }}>Active</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                ['Email', selected.email, '#4f7ef8'],
                ['Phone', selected.phone, null],
                ['Customer Since', fmtDate(selected.created_at), null],
                ['Lifetime Value', fmtMoney(selected.lifetime_value), '#22c55e'],
                ['Account Manager', selected.rep_name || '—', null],
                ['Industry', selected.industry, null],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#5a6378', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: color || '#f0f2f8' }}>{val}</div>
                </div>
              ))}
            </div>
            {selected.interactions?.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Interaction History</div>
                {selected.interactions.map((inter, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < selected.interactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f7ef8', flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{inter.type}</div>
                      <div style={{ fontSize: 11, color: '#5a6378', marginTop: 2 }}>{fmtDate(inter.created_at)} · {inter.rep_name}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

// Demo data fallback
const DEMO_CUSTOMERS = Array.from({ length: 8 }, (_, i) => ({
  id: `dc-${i}`, name: ['Alex Kim','Jordan Smith','Morgan Lee','Taylor Brown','Casey Davis','Riley Garcia','Jamie Wilson','Avery Taylor'][i],
  company: ['Apex Solutions','BlueSky Tech','Cascade Systems','Delta Analytics','Echo Media','Frontier Digital','Gravity Labs','Horizon AI'][i],
  email: `contact${i}@company${i}.com`, phone: `+1 (555) ${200+i}00-${1000+i}`,
  industry: ['Technology','Finance','Healthcare','Retail','Manufacturing','Education','Media','Real Estate'][i],
  lifetime_value: (i + 1) * 28000, created_at: new Date(2022, i, 15).toISOString(),
  rep_color: ['green','purple','amber','teal','pink','accent','green','purple'][i],
}));
