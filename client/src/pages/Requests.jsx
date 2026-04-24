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
  IconArrowRight,
  IconClipboard,
} from '../components/Icons';

const STATUSES = [
  'новая',
  'в обработке',
  'подтверждена',
  'отклонена',
  'переведена в заказ',
];

const EDITABLE_STATUSES = STATUSES.filter((s) => s !== 'переведена в заказ');

const EMPTY_FORM = {
  client_id: '',
  title: '',
  description: '',
  service_type: '',
  status: 'новая',
};

const EMPTY_CONVERT = {
  service_name: '',
  amount: '',
  deadline: '',
  comment: '',
};

function statusClass(status) {
  const map = {
    'новая': 'status-new',
    'в обработке': 'status-progress',
    'подтверждена': 'status-confirmed',
    'отклонена': 'status-rejected',
    'переведена в заказ': 'status-converted',
  };
  return `status-badge ${map[status] || ''}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

export default function Requests() {
  const toast = useToast();
  const { t } = useI18n();

  const SERVICE_TYPES = [
    { value: '', label: t('common.notSpecified') },
    { value: 'подшив', label: t('service.hemming') },
    { value: 'ремонт', label: t('service.repair') },
    { value: 'замена молнии', label: t('service.zipper') },
    { value: 'пошив', label: t('service.sewing') },
    { value: 'другое', label: t('service.other') },
  ];

  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [convertId, setConvertId] = useState(null);
  const [convertForm, setConvertForm] = useState(EMPTY_CONVERT);
  const [converting, setConverting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [reqRes, clientsRes] = await Promise.all([
        api.get('/requests'),
        api.get('/clients'),
      ]);
      setRequests(reqRes.data);
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

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      const fields = [r.title, r.description, r.client_name, r.service_type].filter(Boolean);
      return fields.some((f) => String(f).toLowerCase().includes(q));
    });
  }, [requests, search, statusFilter]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleConvertChange(e) {
    setConvertForm({ ...convertForm, [e.target.name]: e.target.value });
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    closeConvert();
  }

  function startEdit(r) {
    setForm({
      client_id: r.client_id,
      title: r.title || '',
      description: r.description || '',
      service_type: r.service_type || '',
      status: r.status || 'новая',
    });
    setEditingId(r.id);
    setShowForm(true);
    closeConvert();
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startConvert(r) {
    setConvertId(r.id);
    setConvertForm({
      service_name: r.service_type || r.title || '',
      amount: '',
      deadline: '',
      comment: '',
    });
    closeForm();
  }

  function closeConvert() {
    setConvertId(null);
    setConvertForm(EMPTY_CONVERT);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
      };
      if (editingId) {
        await api.put(`/requests/${editingId}`, payload);
        toast.success(t('requests.updated'));
      } else {
        await api.post('/requests', payload);
        toast.success(t('requests.created'));
      }
      closeForm();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleConvertSubmit(e) {
    e.preventDefault();
    setConverting(true);
    try {
      const payload = {
        service_name: convertForm.service_name,
        amount: convertForm.amount ? Number(convertForm.amount) : 0,
        deadline: convertForm.deadline || null,
        comment: convertForm.comment || null,
      };
      await api.post(`/requests/${convertId}/convert`, payload);
      toast.success(t('requests.converted'));
      closeConvert();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t('requests.convertError'));
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('requests.deleteConfirm'))) return;
    try {
      await api.delete(`/requests/${id}`);
      toast.success(t('requests.deleted'));
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || t('clients.deleteError'));
    }
  }

  function canConvert(status) {
    return status !== 'переведена в заказ' && status !== 'отклонена';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('requests.title')}</h1>
        {!showForm && !convertId && (
          <button onClick={startAdd}>
            <IconPlus /> {t('requests.add').replace('+ ', '')}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('requests.edit') : t('requests.new')}</h2>

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
              {t('requests.serviceType')}
              <select name="service_type" value={form.service_type} onChange={handleChange}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label>
              {t('requests.name')} *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              {t('requests.status')}
              <select name="status" value={form.status} onChange={handleChange}>
                {EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`requestStatus.${s}`)}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t('requests.description')}
            <textarea
              name="description"
              value={form.description}
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

      {convertId && (
        <form className="card form" onSubmit={handleConvertSubmit}>
          <h2>{t('requests.convertTitle')}</h2>

          <div className="form-grid">
            <label>
              {t('orders.serviceName')} *
              <input
                name="service_name"
                value={convertForm.service_name}
                onChange={handleConvertChange}
                required
              />
            </label>

            <label>
              {t('orders.amount')}
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={convertForm.amount}
                onChange={handleConvertChange}
                placeholder="0"
              />
            </label>

            <label>
              {t('orders.deadline')}
              <input
                name="deadline"
                type="date"
                value={convertForm.deadline}
                onChange={handleConvertChange}
              />
            </label>
          </div>

          <label>
            {t('orders.comment')}
            <textarea
              name="comment"
              value={convertForm.comment}
              onChange={handleConvertChange}
              rows={2}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={converting}>
              <IconCheck /> {converting ? t('requests.converting') : t('requests.convertAction')}
            </button>
            <button type="button" className="secondary" onClick={closeConvert}>
              <IconX /> {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {!loading && requests.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder={t('requests.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('common.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`requestStatus.${s}`)}</option>
            ))}
          </select>
          <span className="filter-count">
            {t('common.showing')} {filteredRequests.length} {t('common.of')} {requests.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>{t('common.loading')}</p></div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={IconClipboard}
          title={t('requests.empty.title')}
          description={t('requests.empty.description')}
          action={
            <button onClick={startAdd}>
              <IconPlus /> {t('requests.add').replace('+ ', '')}
            </button>
          }
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState title={t('common.notFound')} description={t('common.notFoundHint')} />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('requests.client')}</th>
                <th>{t('requests.name')}</th>
                <th>{t('requests.serviceType')}</th>
                <th>{t('requests.status')}</th>
                <th>{t('requests.date')}</th>
                <th className="col-actions">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.client_name || '—'}</td>
                  <td>{r.title}</td>
                  <td>{r.service_type || '—'}</td>
                  <td><span className={statusClass(r.status)}>{t(`requestStatus.${r.status}`)}</span></td>
                  <td>{formatDate(r.created_at)}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(r)}>
                      <IconEdit width={14} height={14} /> {t('common.edit')}
                    </button>
                    {canConvert(r.status) && (
                      <button className="small" onClick={() => startConvert(r)}>
                        <IconArrowRight width={14} height={14} /> {t('requests.toOrder')}
                      </button>
                    )}
                    <button className="danger small" onClick={() => handleDelete(r.id)}>
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
