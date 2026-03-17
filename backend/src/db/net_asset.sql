SELECT
  u.id AS user_id,
  COALESCE(SUM(CASE WHEN a.type = 'fund' THEN a.balance ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN a.type = 'credit' THEN a.used_credit ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN a.type = 'liability' THEN a.remaining_principal ELSE 0 END), 0)
  AS net_assets
FROM users u
LEFT JOIN accounts a ON a.user_id = u.id
WHERE u.id = $1
GROUP BY u.id;
