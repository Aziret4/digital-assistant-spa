-- ============================================================
-- Миграция: добавление user_id в существующие таблицы
-- Выполнять ОДИН РАЗ для существующих БД (Neon + локальная)
-- ============================================================

-- 1. Очистка старых данных (без user_id они не имеют смысла)
DELETE FROM orders;
DELETE FROM requests;
DELETE FROM clients;

-- 2. Добавление колонки user_id с привязкой к пользователю
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- 3. Индексы для ускорения фильтрации по пользователю
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
