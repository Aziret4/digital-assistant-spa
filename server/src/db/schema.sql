-- ============================================================
-- SQL-схема для дипломного проекта
-- Цифровой помощник для малого бизнеса (ателье)
-- ============================================================

-- Таблица пользователей системы (владелец / сотрудник ателье)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица клиентов ателье (привязана к пользователю-владельцу)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(100),
  source VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок от клиентов (привязана к пользователю-владельцу)
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  service_type VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'новая'
    CHECK (status IN ('новая', 'в обработке', 'подтверждена', 'отклонена', 'переведена в заказ')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов (привязана к пользователю-владельцу)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
  service_name VARCHAR(150) NOT NULL,
  amount NUMERIC(10, 2) DEFAULT 0,
  deadline DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'принят'
    CHECK (status IN ('принят', 'в работе', 'готов', 'выдан', 'отменен')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения запросов с фильтром по пользователю
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
