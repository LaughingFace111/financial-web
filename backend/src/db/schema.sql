CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('fund', 'credit', 'liability')),
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  credit_limit DECIMAL(18,2) NOT NULL DEFAULT 0,
  used_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
  remaining_principal DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('income', 'expense')),
  UNIQUE (user_id, name)
);

CREATE TABLE category_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  is_regex BOOLEAN NOT NULL DEFAULT FALSE,
  priority SMALLINT NOT NULL DEFAULT 100
);

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id),
  category_id BIGINT REFERENCES categories(id),
  external_ref VARCHAR(128),
  amount DECIMAL(18,2) NOT NULL,
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('income', 'expense', 'transfer')),
  memo TEXT,
  happened_at TIMESTAMPTZ NOT NULL,
  installment_plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  period_index INT NOT NULL,
  total_periods INT NOT NULL,
  principal DECIMAL(18,2) NOT NULL,
  fee DECIMAL(18,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  UNIQUE (transaction_id, period_index)
);

CREATE INDEX idx_transactions_user_happened_at ON transactions(user_id, happened_at DESC);
CREATE INDEX idx_category_rules_user_priority ON category_rules(user_id, priority);
