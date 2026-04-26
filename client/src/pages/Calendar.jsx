import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import { IconCalendar, IconArrowRight, IconX } from '../components/Icons';

const STATUS_CLASS = {
  'принят': 'cal-evt-accepted',
  'в работе': 'cal-evt-inwork',
  'готов': 'cal-evt-ready',
  'выдан': 'cal-evt-delivered',
  'отменен': 'cal-evt-cancelled',
};

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(date) {
  const first = startOfMonth(date);
  const dayOfWeek = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('ru-RU');
}

export default function Calendar() {
  const toast = useToast();
  const { t, lang } = useI18n();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || t('requests.loadError'));
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ordersByDate = useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (!o.deadline) continue;
      const key = ymd(new Date(o.deadline));
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [orders]);

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const today = new Date();

  const localeMap = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' };
  const locale = localeMap[lang] || 'ru-RU';

  const monthLabel = cursor.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = useMemo(() => {
    const base = new Date(2024, 0, 1);
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      result.push(d.toLocaleDateString(locale, { weekday: 'short' }));
    }
    return result;
  }, [locale]);

  const selectedDayOrders = selectedDay ? ordersByDate[ymd(selectedDay)] || [] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('calendar.title')}</h1>
      </div>

      <div className="card">
        <div className="cal-toolbar">
          <button className="secondary" onClick={() => setCursor(addMonths(cursor, -1))}>
            <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>
              <IconArrowRight width={16} height={16} />
            </span>
          </button>
          <div className="cal-month-label">{monthLabel}</div>
          <button className="secondary" onClick={() => setCursor(addMonths(cursor, 1))}>
            <IconArrowRight width={16} height={16} />
          </button>
          <button
            className="secondary"
            onClick={() => setCursor(startOfMonth(new Date()))}
            style={{ marginLeft: 8 }}
          >
            {t('calendar.today')}
          </button>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <>
            <div className="cal-weekdays">
              {weekDays.map((w, i) => (
                <div key={i} className="cal-weekday">{w}</div>
              ))}
            </div>
            <div className="cal-grid">
              {days.map((d, i) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = isSameDay(d, today);
                const dayOrders = ordersByDate[ymd(d)] || [];
                const visible = dayOrders.slice(0, 3);
                const more = dayOrders.length - visible.length;
                return (
                  <div
                    key={i}
                    className={`cal-cell ${inMonth ? '' : 'cal-cell-out'} ${isToday ? 'cal-cell-today' : ''} ${dayOrders.length ? 'cal-cell-has' : ''}`}
                    onClick={() => dayOrders.length && setSelectedDay(d)}
                  >
                    <div className="cal-cell-num">{d.getDate()}</div>
                    {visible.map((o) => (
                      <div
                        key={o.id}
                        className={`cal-evt ${STATUS_CLASS[o.status] || ''}`}
                        title={`${o.client_name || ''} — ${o.service_name || ''}`}
                      >
                        {o.service_name || '—'}
                      </div>
                    ))}
                    {more > 0 && <div className="cal-evt-more">+{more}</div>}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend">
              {Object.entries(STATUS_CLASS).map(([status, cls]) => (
                <div key={status} className="cal-legend-item">
                  <span className={`cal-legend-dot ${cls}`}></span>
                  {t(`orderStatus.${status}`)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedDay && (
        <div className="modal-backdrop" onClick={() => setSelectedDay(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <IconCalendar width={18} height={18} />{' '}
                {selectedDay.toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button className="icon-btn" onClick={() => setSelectedDay(null)}>
                <IconX width={18} height={18} />
              </button>
            </div>
            {selectedDayOrders.length === 0 ? (
              <p className="muted">{t('common.noData')}</p>
            ) : (
              <div className="modal-list">
                {selectedDayOrders.map((o) => (
                  <div key={o.id} className="modal-item">
                    <div className="modal-item-row">
                      <strong>{o.service_name || '—'}</strong>
                      <span className={`status-badge ${STATUS_CLASS[o.status] || ''}`.replace('cal-evt-', 'status-')}>
                        {t(`orderStatus.${o.status}`)}
                      </span>
                    </div>
                    <div className="modal-item-sub">
                      {o.client_name || '—'} · {formatAmount(o.amount)}
                    </div>
                    {o.comment && <div className="modal-item-comment">{o.comment}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
