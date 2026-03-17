import cron from 'node-cron';
import Decimal from 'decimal.js';
import type { Pool } from 'pg';

function nextMonthSameDay(base: Date, day: number) {
  const d = new Date(base);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(Math.min(day, 28));
  return d;
}

export function startRecurringScheduler(pool: Pool) {
  cron.schedule('*/5 * * * *', async () => {
    const client = await pool.connect();
    try {
      const due = await client.query(
        `SELECT id, user_id, account_id, category_id, amount, direction, memo, next_run_at, COALESCE(day_of_month, 1) AS day_of_month
         FROM recurring_rules
         WHERE is_active = TRUE AND next_run_at <= NOW()
         ORDER BY next_run_at ASC
         LIMIT 200`
      );

      for (const rule of due.rows) {
        try {
          await client.query('BEGIN');
          const lock = await client.query('SELECT id FROM recurring_rules WHERE id=$1 FOR UPDATE', [rule.id]);
          if (!lock.rowCount) throw new Error('Rule not found');

          const tx = await client.query(
            `INSERT INTO transactions(user_id, account_id, category_id, amount, direction, memo, happened_at)
             VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`,
            [rule.user_id, rule.account_id, rule.category_id, new Decimal(rule.amount).toFixed(2), rule.direction, rule.memo]
          );

          await client.query(
            `INSERT INTO recurring_executions(rule_id, scheduled_for, transaction_id)
             VALUES($1,$2,$3)
             ON CONFLICT (rule_id, scheduled_for) DO NOTHING`,
            [rule.id, rule.next_run_at, tx.rows[0].id]
          );

          const nextRun = nextMonthSameDay(new Date(rule.next_run_at), Number(rule.day_of_month));
          await client.query(
            `UPDATE recurring_rules SET last_run_at = $2, next_run_at = $3 WHERE id = $1`,
            [rule.id, rule.next_run_at, nextRun.toISOString()]
          );
          await client.query('COMMIT');
        } catch {
          await client.query('ROLLBACK');
        }
      }
    } finally {
      client.release();
    }
  });
}
