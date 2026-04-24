import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.register.passwordShort'));
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.register.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <div className="brand-logo">ЦП</div>
          <div>
            <h1>{t('auth.register.title')}</h1>
            <p className="muted">{t('auth.register.subtitle')}</p>
          </div>
        </div>

        <label>
          {t('auth.register.name')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          {t('auth.login.email')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          {t('auth.login.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="full-width">
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>

        <div className="auth-switch">
          {t('auth.register.haveAccount')} <Link to="/login">{t('auth.register.login')}</Link>
        </div>
      </form>
    </div>
  );
}
