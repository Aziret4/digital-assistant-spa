import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../api/axios';
import { useI18n } from '../context/I18nContext';

const REQUEST_STATUS_COLORS = {
  'новая': '#3b82f6',
  'в обработке': '#f59e0b',
  'подтверждена': '#10b981',
  'отклонена': '#9ca3af',
  'переведена в заказ': '#8b5cf6',
};

const ORDER_STATUS_COLORS = {
  'принят': '#3b82f6',
  'в работе': '#f59e0b',
  'готов': '#10b981',
  'выдан': '#14b8a6',
  'отменен': '#9ca3af',
};

function countByStatus(items, colorsMap, translate) {
  const counts = {};
  for (const item of items) {
    const s = item.status;
    counts[s] = (counts[s] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({
    name: translate(name),
    rawName: name,
    value,
    color: colorsMap[name] || '#9ca3af',
  }));
}

function sumByOrderStatus(orders, translate) {
  const sums = {};
  for (const o of orders) {
    const s = o.status;
    sums[s] = (sums[s] || 0) + Number(o.amount || 0);
  }
  return Object.entries(sums).map(([name, value]) => ({
    name: translate(name),
    rawName: name,
    value: Math.round(value),
    color: ORDER_STATUS_COLORS[name] || '#9ca3af',
  }));
}

function revenueByMonth(orders) {
  const map = {};
  for (const o of orders) {
    if (!o.created_at) continue;
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + Number(o.amount || 0);
  }
  const sortedKeys = Object.keys(map).sort();
  return sortedKeys.map((key) => ({
    month: key,
    revenue: Math.round(map[key]),
  }));
}

function topClients(orders) {
  const map = {};
  for (const o of orders) {
    const name = o.client_name || '—';
    if (!map[name]) map[name] = { name, total: 0, count: 0 };
    map[name].total += Number(o.amount || 0);
    map[name].count += 1;
  }
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({ ...c, total: Math.round(c.total) }));
}

export default function Dashboard() {
  const { t } = useI18n();

  const [stats, setStats] = useState({
    clients: 0,
    requestsTotal: 0,
    requestsActive: 0,
    ordersTotal: 0,
    ordersInWork: 0,
    totalRevenue: 0,
  });
  const [requestsChart, setRequestsChart] = useState([]);
  const [ordersChart, setOrdersChart] = useState([]);
  const [amountChart, setAmountChart] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topClientsChart, setTopClientsChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, requestsRes, ordersRes] = await Promise.all([
          api.get('/clients'),
          api.get('/requests'),
          api.get('/orders'),
        ]);

        const requests = requestsRes.data;
        const orders = ordersRes.data;

        const totalRevenue = orders
          .filter((o) => o.status === 'выдан')
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);

        setStats({
          clients: clientsRes.data.length,
          requestsTotal: requests.length,
          requestsActive: requests.filter(
            (r) => r.status === 'новая' || r.status === 'в обработке'
          ).length,
          ordersTotal: orders.length,
          ordersInWork: orders.filter((o) => o.status === 'в работе').length,
          totalRevenue: Math.round(totalRevenue),
        });

        setRequestsChart(countByStatus(requests, REQUEST_STATUS_COLORS, (s) => t(`requestStatus.${s}`)));
        setOrdersChart(countByStatus(orders, ORDER_STATUS_COLORS, (s) => t(`orderStatus.${s}`)));
        setAmountChart(sumByOrderStatus(orders, (s) => t(`orderStatus.${s}`)));
        setRevenueChart(revenueByMonth(orders));
        setTopClientsChart(topClients(orders));
      } catch (err) {
        setError(err.response?.data?.message || t('dashboard.error'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;
  if (error) return <div className="page"><div className="error">{error}</div></div>;

  const hasRequests = requestsChart.length > 0;
  const hasOrders = ordersChart.length > 0;
  const hasRevenue = revenueChart.length > 0;
  const hasTopClients = topClientsChart.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.clients')}</div>
          <div className="stat-value">{stats.clients}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('dashboard.requests')}</div>
          <div className="stat-value">{stats.requestsTotal}</div>
          <div className="stat-sub">{t('dashboard.active')}: {stats.requestsActive}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('dashboard.orders')}</div>
          <div className="stat-value">{stats.ordersTotal}</div>
          <div className="stat-sub">{t('dashboard.inWork')}: {stats.ordersInWork}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('dashboard.totalRevenue')}</div>
          <div className="stat-value">{stats.totalRevenue.toLocaleString('ru-RU')}</div>
          <div className="stat-sub">сом</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>{t('dashboard.chart.requestsByStatus')}</h2>
          {hasRequests ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={requestsChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.value}
                >
                  {requestsChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">{t('common.noData')}</p>
          )}
        </div>

        <div className="chart-card">
          <h2>{t('dashboard.chart.ordersByStatus')}</h2>
          {hasOrders ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={ordersChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.value}
                >
                  {ordersChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">{t('common.noData')}</p>
          )}
        </div>
      </div>

      <div className="chart-card wide">
        <h2>{t('dashboard.chart.revenue')}</h2>
        {hasRevenue ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueChart} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString('ru-RU')}`} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">{t('common.noData')}</p>
        )}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>{t('dashboard.chart.amountByStatus')}</h2>
          {hasOrders ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={amountChart} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('ru-RU')}`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {amountChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">{t('common.noData')}</p>
          )}
        </div>

        <div className="chart-card">
          <h2>{t('dashboard.chart.topClients')}</h2>
          {hasTopClients ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topClientsChart}
                layout="vertical"
                margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" stroke="#737373" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#737373" fontSize={12} width={100} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('ru-RU')}`} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
