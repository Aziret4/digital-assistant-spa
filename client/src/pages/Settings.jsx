import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import { IconCheck, IconTrash } from '../components/Icons';

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      const updatedUser = { ...user, name: data.name, email: data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(t('settings.profileUpdated'));
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();

    if (passwords.next !== passwords.confirm) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }
    if (passwords.next.length < 6) {
      toast.error(t('settings.passwordShort'));
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success(t('settings.passwordChanged'));
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();

    if (!window.confirm(t('settings.deleteAccountConfirm'))) return;

    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      toast.success(t('settings.accountDeleted'));
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <form className="card form" onSubmit={saveProfile}>
        <h2>{t('settings.profile')}</h2>
        <p className="muted">{t('settings.profileDesc')}</p>

        <div className="form-grid">
          <label>
            {t('auth.register.name')}
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </label>

          <label>
            {t('auth.login.email')}
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={savingProfile}>
            <IconCheck /> {savingProfile ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      <form className="card form" onSubmit={savePassword}>
        <h2>{t('settings.password')}</h2>
        <p className="muted">{t('settings.passwordDesc')}</p>

        <div className="form-grid">
          <label>
            {t('settings.currentPassword')}
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              required
            />
          </label>

          <label>
            {t('settings.newPassword')}
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              required
              minLength={6}
            />
          </label>

          <label>
            {t('settings.confirmPassword')}
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
              minLength={6}
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={savingPassword}>
            <IconCheck /> {savingPassword ? t('common.saving') : t('settings.changePassword')}
          </button>
        </div>
      </form>

      <form className="card form danger-zone" onSubmit={handleDelete}>
        <h2>{t('settings.danger')}</h2>
        <p className="muted">{t('settings.deleteWarning')}</p>

        <label>
          {t('settings.deleteConfirm')}
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="danger" disabled={deleting}>
            <IconTrash /> {deleting ? t('common.saving') : t('settings.deleteAccount')}
          </button>
        </div>
      </form>
    </div>
  );
}
