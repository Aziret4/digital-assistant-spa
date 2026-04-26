import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n, LANGUAGES } from '../context/I18nContext';
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
  IconSettings,
  IconCalendar,
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
  const { t, lang, setLang } = useI18n();
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
          aria-label="Menu"
        >
          <IconMenu width={22} height={22} />
        </button>
        <div className="mobile-brand">{t('brand.title')}</div>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Theme"
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
            <div className="brand-title">{t('brand.title')}</div>
            <div className="brand-subtitle">{t('brand.subtitle')}</div>
          </div>
          <button
            className="icon-btn sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end>
            <IconHome /> <span>{t('nav.home')}</span>
          </NavLink>
          <NavLink to="/clients">
            <IconUsers /> <span>{t('nav.clients')}</span>
          </NavLink>
          <NavLink to="/requests">
            <IconClipboard /> <span>{t('nav.requests')}</span>
          </NavLink>
          <NavLink to="/orders">
            <IconBag /> <span>{t('nav.orders')}</span>
          </NavLink>
          <NavLink to="/calendar">
            <IconCalendar /> <span>{t('nav.calendar')}</span>
          </NavLink>
          <NavLink to="/assistant">
            <IconChat /> <span>{t('nav.assistant')}</span>
          </NavLink>
          <NavLink to="/settings">
            <IconSettings /> <span>{t('nav.settings')}</span>
          </NavLink>
        </nav>

        <div className="lang-switcher">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${lang === l.code ? 'lang-btn-active' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? (
            <>
              <IconMoon width={16} height={16} /> <span>{t('theme.dark')}</span>
            </>
          ) : (
            <>
              <IconSun width={16} height={16} /> <span>{t('theme.light')}</span>
            </>
          )}
        </button>

        <div className="sidebar-user">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || t('common.user')}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title={t('common.logout')}>
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
