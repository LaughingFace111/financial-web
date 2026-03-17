-- 模块八：家庭协作与权限控制 (Family Shared Ledger)
CREATE TABLE account_memberships (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, user_id)
);

CREATE TABLE family_invitations (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  inviter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  token UUID NOT NULL UNIQUE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 模块九：周期性自动账单
CREATE TABLE recurring_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id),
  amount DECIMAL(18,2) NOT NULL,
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('income', 'expense')),
  cron_expr VARCHAR(100) NOT NULL,
  day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
  memo TEXT,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recurring_executions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES recurring_rules(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rule_id, scheduled_for)
);

-- 模块十：标签系统
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(16) NOT NULL DEFAULT '#6366f1',
  UNIQUE (user_id, name)
);

CREATE TABLE transaction_tags (
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- 模块十一：固定资产
CREATE TABLE assets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_cost DECIMAL(18,2) NOT NULL,
  residual_value DECIMAL(18,2) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX idx_account_memberships_user ON account_memberships(user_id);
CREATE INDEX idx_recurring_rules_next_run ON recurring_rules(is_active, next_run_at);
CREATE INDEX idx_transaction_tags_tag ON transaction_tags(tag_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
