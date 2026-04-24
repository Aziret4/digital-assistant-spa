import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconUsers } from '../components/Icons';

const SOURCES = [
  { value: '', label: '— не указано —' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'phone', label: 'Телефон' },
  { value: 'website', label: 'Сайт' },
  { value: 'другое', label: 'Другое' },
];

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  email: '',
  source: '',
  notes: '',
};

export default function Clients() {
  const toast = useToast();

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
      toast.error(err.response?.data?.message || 'Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
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
        toast.success('Клиент обновлён');
      } else {
        await api.post('/clients', form);
        toast.success('Клиент добавлен');
      }
      cancelForm();
      await loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить клиента?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Клиент удалён');
      await loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Клиенты</h1>
        {!showForm && (
          <button onClick={startAdd}>
            <IconPlus /> Добавить клиента
          </button>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать клиента' : 'Новый клиент'}</h2>

          <div className="form-grid">
            <label>
              ФИО *
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Телефон
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+996..."
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Источник
              <select name="source" value={form.source} onChange={handleChange}>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Заметки
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              <IconCheck /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" className="secondary" onClick={cancelForm}>
              <IconX /> Отмена
            </button>
          </div>
        </form>
      )}

      {!loading && clients.length > 0 && (
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Поиск по имени, телефону, email, заметкам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="filter-count">
            Показано {filteredClients.length} из {clients.length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card"><p>Загрузка...</p></div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title="Клиентов пока нет"
          description="Добавьте первого клиента, чтобы начать работу"
          action={
            <button onClick={startAdd}>
              <IconPlus /> Добавить клиента
            </button>
          }
        />
      ) : filteredClients.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос" />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Источник</th>
                <th>Заметки</th>
                <th className="col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.source || '—'}</td>
                  <td className="notes-cell">{c.notes || '—'}</td>
                  <td className="col-actions">
                    <button className="secondary small" onClick={() => startEdit(c)}>
                      <IconEdit width={14} height={14} /> Изменить
                    </button>
                    <button className="danger small" onClick={() => handleDelete(c.id)}>
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
