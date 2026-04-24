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
  IconBag,
} from '../components/Icons';

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
  return num.toLocaleString('ru-RU') + ' сом';
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
      toast.error(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
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
        toast.success('Заказ обновлён');
      } else {
        await api.post('/orders', payload);
        toast.success('Заказ создан');
      }
      closeForm();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить заказ?')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Заказ удалён');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Заказы</h1>
        {!showForm && (
          <button onClick={startAdd}>
            <IconPlus /> Добавить заказ
          </button>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать заказ' : 'Новый заказ'}</h2>

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
              Название услуги *
              <input
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Сумма (сом)
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
              Срок
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
              />
            </label>

            <label>
              Статус
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Комментарий
            <textarea
              name="comment"
              value={form.comment}
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

      {!loading && orders.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Поиск по услуге, клиенту, комментарию..."
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
            Показано {filteredOrders.length} из {orders.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>Загрузка...</p></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={IconBag}
          title="Заказов пока нет"
          description="Создайте заказ или переведите заявку в заказ"
          action={
            <button onClick={startAdd}>
              <IconPlus /> Добавить заказ
            </button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или фильтр" />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Услуга</th>
                <th>Сумма</th>
                <th>Срок</th>
                <th>Статус</th>
                <th>Создан</th>
                <th className="col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.client_name || '—'}</td>
                  <td>{o.service_name}</td>
                  <td>{formatAmount(o.amount)}</td>
                  <td>{formatDate(o.deadline)}</td>
                  <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(o)}>
                      <IconEdit width={14} height={14} /> Изменить
                    </button>
                    <button className="danger small" onClick={() => handleDelete(o.id)}>
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
