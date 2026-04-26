import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import EmptyState from '../components/EmptyState';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconUsers, IconDownload } from '../components/Icons';
import { exportToCsv } from '../utils/exportCsv';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  email: '',
  source: '',
  notes: '',
};

export default function Clients() {
  const toast = useToast();
  const { t } = useI18n();

  const SOURCES = [
    { value: '', label: t('common.notSpecified') },
    { value: 'whatsapp', label: t('source.whatsapp') },
    { value: 'instagram', label: t('source.instagram') },
    { value: 'telegram', label: t('source.telegram') },
    { value: 'phone', label: t('source.phone') },
    { value: 'website', label: t('source.website') },
    { value: 'другое', label: t('source.other') },
  ];

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  async function loadClients() {
    setLoading(true);
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const fields = [c.full_name, c.phone, c.email, c.notes].filter(Boolean);
      return fields.some((f) => String(f).toLowerCase().includes(q));
    });
  }, [clients, search]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(client) {
    setForm({
      full_name: client.full_name || '',
      phone: client.phone || '',
      email: client.email || '',
      source: client.source || '',
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form);
        toast.success(t('clients.updated'));
      } else {
        await api.post('/clients', form);
        toast.success(t('clients.added'));
      }
      cancelForm();
      await loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('clients.deleteConfirm'))) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success(t('clients.deleted'));
      await loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.deleteError'));
    }
  }

  function sourceLabel(value) {
    if (!value) return '—';
    const item = SOURCES.find((s) => s.value === value);
    return item ? item.label : value;
  }

  function handleExport() {
    const headers = [
      { key: 'full_name', label: t('clients.fullName') },
      { key: 'phone', label: t('clients.phone') },
      { key: 'email', label: t('clients.email') },
      { key: 'source', label: t('clients.source') },
      { key: 'notes', label: t('clients.notes') },
    ];
    exportToCsv(`clients-${new Date().toISOString().slice(0, 10)}.csv`, headers, filteredClients);
    toast.success(t('common.exported'));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('clients.title')}</h1>
        {!showForm && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {clients.length > 0 && (
              <button className="secondary" onClick={handleExport}>
                <IconDownload width={16} height={16} /> {t('common.export')}
              </button>
            )}
            <button onClick={startAdd}>
              <IconPlus /> {t('clients.add').replace('+ ', '')}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('clients.edit') : t('clients.new')}</h2>

          <div className="form-grid">
            <label>
              {t('clients.fullName')} *
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              {t('clients.phone')}
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+996..."
              />
            </label>

            <label>
              {t('clients.email')}
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              {t('clients.source')}
              <select name="source" value={form.source} onChange={handleChange}>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t('clients.notes')}
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              <IconCheck /> {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" className="secondary" onClick={cancelForm}>
              <IconX /> {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {!loading && clients.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder={t('clients.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="filter-count">
            {t('common.showing')} {filteredClients.length} {t('common.of')} {clients.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>{t('common.loading')}</p></div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title={t('clients.empty.title')}
          description={t('clients.empty.description')}
          action={
            <button onClick={startAdd}>
              <IconPlus /> {t('clients.add').replace('+ ', '')}
            </button>
          }
        />
      ) : filteredClients.length === 0 ? (
        <EmptyState title={t('common.notFound')} description={t('common.notFoundHint')} />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('clients.fullName')}</th>
                <th>{t('clients.phone')}</th>
                <th>{t('clients.email')}</th>
                <th>{t('clients.source')}</th>
                <th>{t('clients.notes')}</th>
                <th className="col-actions">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{sourceLabel(c.source)}</td>
                  <td className="notes-cell">{c.notes || '—'}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(c)}>
                      <IconEdit width={14} height={14} /> {t('common.edit')}
                    </button>
                    <button className="danger small" onClick={() => handleDelete(c.id)}>
                      <IconTrash width={14} height={14} /> {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
