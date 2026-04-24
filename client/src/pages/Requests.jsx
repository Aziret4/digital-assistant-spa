import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
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

const SERVICE_TYPES = [
  { value: '', label: '— не указано —' },
  { value: 'подшив', label: 'Подшив' },
  { value: 'ремонт', label: 'Ремонт одежды' },
  { value: 'замена молнии', label: 'Замена молнии' },
  { value: 'пошив', label: 'Пошив' },
  { value: 'другое', label: 'Другое' },
];

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
      toast.error(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
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
        toast.success('Заявка обновлена');
      } else {
        await api.post('/requests', payload);
        toast.success('Заявка создана');
      }
      closeForm();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка сохранения');
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
      toast.success('Заявка переведена в заказ');
      closeConvert();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка перевода в заказ');
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить заявку?')) return;
    try {
      await api.delete(`/requests/${id}`);
      toast.success('Заявка удалена');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  }

  function canConvert(status) {
    return status !== 'переведена в заказ' && status !== 'отклонена';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Заявки</h1>
        {!showForm && !convertId && (
          <button onClick={startAdd}>
            <IconPlus /> Добавить заявку
          </button>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать заявку' : 'Новая заявка'}</h2>

          <div className="form-grid">
            <label>
              Клиент *
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
              >
                <option value="">— выберите клиента —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </label>

            <label>
              Тип услуги
              <select name="service_type" value={form.service_type} onChange={handleChange}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label>
              Название *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Статус
              <select name="status" value={form.status} onChange={handleChange}>
                {EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Описание
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              <IconCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" className="secondary" onClick={closeForm}>
              <IconX /> Отмена
            </button>
          </div>
        </form>
      )}

      {convertId && (
        <form className="card form" onSubmit={handleConvertSubmit}>
          <h2>Перевести заявку в заказ</h2>

          <div className="form-grid">
            <label>
              Название услуги *
              <input
                name="service_name"
                value={convertForm.service_name}
                onChange={handleConvertChange}
                required
              />
            </label>

            <label>
              Сумма
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
              Срок
              <input
                name="deadline"
                type="date"
                value={convertForm.deadline}
                onChange={handleConvertChange}
              />
            </label>
          </div>

          <label>
            Комментарий
            <textarea
              name="comment"
              value={convertForm.comment}
              onChange={handleConvertChange}
              rows={2}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={converting}>
              <IconCheck /> {converting ? 'Создание...' : 'Создать заказ'}
            </button>
            <button type="button" className="secondary" onClick={closeConvert}>
              <IconX /> Отмена
            </button>
          </div>
        </form>
      )}

      {!loading && requests.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Поиск по названию, описанию, клиенту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="filter-count">
            Показано {filteredRequests.length} из {requests.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>Загрузка...</p></div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={IconClipboard}
          title="Заявок пока нет"
          description="Создайте первую заявку от клиента"
          action={
            <button onClick={startAdd}>
              <IconPlus /> Добавить заявку
            </button>
          }
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или фильтр" />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Название</th>
                <th>Тип услуги</th>
                <th>Статус</th>
                <th>Дата</th>
                <th className="col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.client_name || '—'}</td>
                  <td>{r.title}</td>
                  <td>{r.service_type || '—'}</td>
                  <td><span className={statusClass(r.status)}>{r.status}</span></td>
                  <td>{formatDate(r.created_at)}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(r)}>
                      <IconEdit width={14} height={14} /> Изменить
                    </button>
                    {canConvert(r.status) && (
                      <button className="small" onClick={() => startConvert(r)}>
                        <IconArrowRight width={14} height={14} /> В заказ
                      </button>
                    )}
                    <button className="danger small" onClick={() => handleDelete(r.id)}>
                      <IconTrash width={14} height={14} /> Удалить
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
