import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconHome,
  IconUsers,
  IconClipboard,
  IconBag,
  IconChat,
  IconLogout,
} from './Icons';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return (first + second).toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">ЦП</div>
          <div className="brand-text">
            <div className="brand-title">Цифровой помощник</div>
            <div className="brand-subtitle">Ателье</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end>
            <IconHome /> <span>Главная</span>
          </NavLink>
          <NavLink to="/clients">
            <IconUsers /> <span>Клиенты</span>
          </NavLink>
          <NavLink to="/requests">
            <IconClipboard /> <span>Заявки</span>
          </NavLink>
          <NavLink to="/orders">
            <IconBag /> <span>Заказы</span>
          </NavLink>
          <NavLink to="/assistant">
            <IconChat /> <span>Помощник</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Пользователь'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Выйти">
            <IconLogout />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
