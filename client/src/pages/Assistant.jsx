import { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import { IconCopy, IconCheck, IconX, IconChat } from '../components/Icons';

const EXAMPLES = {
  ru: [
    'Сколько стоит подшить брюки?',
    'Когда будет готов мой заказ?',
    'Можно сшить платье на заказ?',
    'Какой у вас адрес и режим работы?',
    'Сколько стоит замена молнии на куртке?',
  ],
  ky: [
    'Шымды кыска кылуу канча турат?',
    'Менин буйрутмам качан даяр болот?',
    'Көйнөктү буйрутма менен тигүүгө болобу?',
    'Дарегиңиз жана иш убактыңыз кандай?',
    'Курткага молния алмаштыруу канча турат?',
  ],
  en: [
    'How much does it cost to hem pants?',
    'When will my order be ready?',
    'Can you sew a custom dress?',
    'What is your address and working hours?',
    'How much to replace a jacket zipper?',
  ],
};

export default function Assistant() {
  const toast = useToast();
  const { t, lang } = useI18n();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAnswer('');
    try {
      const { data } = await api.post('/assistant/ask', { question });
      setAnswer(data.answer);
    } catch (err) {
      toast.error(err.response?.data?.message || t('assistant.error'));
    } finally {
      setLoading(false);
    }
  }

  function useExample(text) {
    setQuestion(text);
    setAnswer('');
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      toast.success(t('assistant.copied'));
    } catch {
      toast.error(t('assistant.copyError'));
    }
  }

  function reset() {
    setQuestion('');
    setAnswer('');
  }

  const examples = EXAMPLES[lang] || EXAMPLES.ru;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('assistant.title')}</h1>
      </div>

      <p className="muted" style={{ marginBottom: 16 }}>
        {t('assistant.subtitle')}
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          {t('assistant.question')}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder={t('assistant.placeholder')}
            required
          />
        </label>

        <div className="examples">
          <div className="muted" style={{ marginBottom: 6 }}>{t('assistant.examples')}</div>
          <div className="example-chips">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                className="chip"
                onClick={() => useExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading || question.trim().length < 2}>
            <IconCheck /> {loading ? t('assistant.generating') : t('assistant.getAnswer')}
          </button>
          {(question || answer) && (
            <button type="button" className="secondary" onClick={reset}>
              <IconX /> {t('assistant.clear')}
            </button>
          )}
        </div>
      </form>

      {!answer && !loading && (
        <div className="empty-state-inline">
          <IconChat width={32} height={32} />
          <p className="muted">{t('assistant.emptyState')}</p>
        </div>
      )}

      {answer && (
        <div className="card answer-card">
          <div className="answer-header">
            <h2>{t('assistant.answerTitle')}</h2>
            <button type="button" className="secondary small" onClick={copyAnswer}>
              <IconCopy width={14} height={14} /> {t('assistant.copy')}
            </button>
          </div>
          <p className="answer-text">{answer}</p>
        </div>
      )}
    </div>
  );
}
