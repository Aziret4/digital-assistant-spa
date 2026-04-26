import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import EmptyState from '../components/EmptyState';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconBag,
  IconDownload,
} from '../components/Icons';
import { exportToCsv } from '../utils/exportCsv';

const STATUSES = ['принят', 'в работе', 'готов', 'выдан', 'отменен'];

const EMPTY_FORM = {
  client_id: '',
  service_name: '',
  amount: '',
  deadline: '',
  status: 'принят',
  comment: '',
};

function statusClass(status) {
  const map = {
    'принят': 'status-accepted',
    'в работе': 'status-inwork',
    'готов': 'status-ready',
    'выдан': 'status-delivered',
    'отменен': 'status-cancelled',
  };
  return `status-badge ${map[status] || ''}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('ru-RU');
}

function toDateInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Orders() {
  const toast = useToast();
  const { t } = useI18n();

  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/clients'),
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('requests.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      const fields = [o.service_name, o.client_name, o.comment].filter(Boolean);
      return fields.some((f) => String(f).toLowerCase().includes(q));
    });
  }, [orders, search, statusFilter]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(o) {
    setForm({
      client_id: o.client_id,
      service_name: o.service_name || '',
      amount: o.amount || '',
      deadline: toDateInputValue(o.deadline),
      status: o.status || 'принят',
      comment: o.comment || '',
    });
    setEditingId(o.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        amount: form.amount ? Number(form.amount) : 0,
        deadline: form.deadline || null,
      };
      if (editingId) {
        await api.put(`/orders/${editingId}`, payload);
        toast.success(t('orders.updated'));
      } else {
        await api.post('/orders', payload);
        toast.success(t('orders.created'));
      }
      closeForm();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('orders.deleteConfirm'))) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success(t('orders.deleted'));
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.deleteError'));
    }
  }

  function handleExport() {
    const headers = [
      { key: 'client_name', label: t('requests.client') },
      { key: 'service_name', label: t('orders.service') },
      { key: 'amount', label: t('orders.amount') },
      { key: 'deadline', label: t('orders.deadline') },
      { key: 'status', label: t('orders.status') },
      { key: 'comment', label: t('orders.comment') },
      { key: 'created_at', label: t('orders.createdAt') },
    ];
    const rows = filteredOrders.map((o) => ({
      ...o,
      status: t(`orderStatus.${o.status}`),
      deadline: formatDate(o.deadline),
      created_at: formatDate(o.created_at),
    }));
    exportToCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success(t('common.exported'));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('orders.title')}</h1>
        {!showForm && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {orders.length > 0 && (
              <button className="secondary" onClick={handleExport}>
                <IconDownload width={16} height={16} /> {t('common.export')}
              </button>
            )}
            <button onClick={startAdd}>
              <IconPlus /> {t('orders.add').replace('+ ', '')}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('orders.edit') : t('orders.new')}</h2>

          <div className="form-grid">
            <label>
              {t('requests.client')} *
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('common.selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </label>

            <label>
              {t('orders.serviceName')} *
              <input
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              {t('orders.amountLabel')}
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
              />
            </label>

            <label>
              {t('orders.deadline')}
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
              />
            </label>

            <label>
              {t('orders.status')}
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`orderStatus.${s}`)}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t('orders.comment')}
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              <IconCheck /> {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" className="secondary" onClick={closeForm}>
              <IconX /> {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {!loading && orders.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('common.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`orderStatus.${s}`)}</option>
            ))}
          </select>
          <span className="filter-count">
            {t('common.showing')} {filteredOrders.length} {t('common.of')} {orders.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>{t('common.loading')}</p></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={IconBag}
          title={t('orders.empty.title')}
          description={t('orders.empty.description')}
          action={
            <button onClick={startAdd}>
              <IconPlus /> {t('orders.add').replace('+ ', '')}
            </button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState title={t('common.notFound')} description={t('common.notFoundHint')} />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('requests.client')}</th>
                <th>{t('orders.service')}</th>
                <th>{t('orders.amount')}</th>
                <th>{t('orders.deadline')}</th>
                <th>{t('orders.status')}</th>
                <th>{t('orders.createdAt')}</th>
                <th className="col-actions">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.client_name || '—'}</td>
                  <td>{o.service_name}</td>
                  <td>{formatAmount(o.amount)}</td>
                  <td>{formatDate(o.deadline)}</td>
                  <td><span className={statusClass(o.status)}>{t(`orderStatus.${o.status}`)}</span></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(o)}>
                      <IconEdit width={14} height={14} /> {t('common.edit')}
                    </button>
                    <button className="danger small" onClick={() => handleDelete(o.id)}>
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
