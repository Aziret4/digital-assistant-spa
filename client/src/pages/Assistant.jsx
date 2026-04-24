import { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { IconCopy, IconCheck, IconX, IconChat } from '../components/Icons';

const EXAMPLES = [
  'Сколько стоит подшить брюки?',
  'Когда будет готов мой заказ?',
  'Можно сшить платье на заказ?',
  'Какой у вас адрес и режим работы?',
  'Сколько стоит замена молнии на куртке?',
];

export default function Assistant() {
  const toast = useToast();

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
      toast.error(err.response?.data?.message || 'Ошибка при получении ответа');
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
      toast.success('Ответ скопирован в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать');
    }
  }

  function reset() {
    setQuestion('');
    setAnswer('');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Цифровой помощник</h1>
      </div>

      <p className="muted" style={{ marginBottom: 16 }}>
        Введите вопрос клиента — система предложит готовый текст ответа, который можно отправить в мессенджер.
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Вопрос клиента
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Например: Сколько стоит подшить брюки?"
            required
          />
        </label>

        <div className="examples">
          <div className="muted" style={{ marginBottom: 6 }}>Примеры вопросов:</div>
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
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
            <IconCheck /> {loading ? 'Генерация...' : 'Получить ответ'}
          </button>
          {(question || answer) && (
            <button type="button" className="secondary" onClick={reset}>
              <IconX /> Очистить
            </button>
          )}
        </div>
      </form>

      {!answer && !loading && (
        <div className="empty-state-inline">
          <IconChat width={32} height={32} />
          <p className="muted">Ответ появится здесь после отправки вопроса</p>
        </div>
      )}

      {answer && (
        <div className="card answer-card">
          <div className="answer-header">
            <h2>Предлагаемый ответ</h2>
            <button type="button" className="secondary small" onClick={copyAnswer}>
              <IconCopy width={14} height={14} /> Копировать
            </button>
          </div>
          <p className="answer-text">{answer}</p>
        </div>
      )}
    </div>
  );
}
