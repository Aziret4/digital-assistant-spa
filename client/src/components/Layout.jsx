import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconHome,
  IconUsers,
  IconClipboard,
  IconBag,
  IconChat,
  IconLogout,
  IconMenu,
  IconX,
  IconSun,
  IconMoon,
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <div className="mobile-topbar">
        <button
          className="icon-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Открыть меню"
        >
          <IconMenu width={22} height={22} />
        </button>
        <div className="mobile-brand">Цифровой помощник</div>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Переключить тему"
          style={{ marginLeft: 'auto' }}
        >
          {theme === 'light' ? <IconMoon width={18} height={18} /> : <IconSun width={18} height={18} />}
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">ЦП</div>
          <div className="brand-text">
            <div className="brand-title">Цифровой помощник</div>
            <div className="brand-subtitle">Ателье</div>
          </div>
          <button
            className="icon-btn sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть меню"
          >
            <IconX width={18} height={18} />
          </button>
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

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? (
            <>
              <IconMoon width={16} height={16} /> <span>Тёмная тема</span>
            </>
          ) : (
            <>
              <IconSun width={16} height={16} /> <span>Светлая тема</span>
            </>
          )}
        </button>

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
