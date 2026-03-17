import type { Request, Response } from 'express';
import type { Pool } from 'pg';

export function buildTagHandlers(pool: Pool) {
  return {
    upsertTransactionTags: async (req: Request, res: Response) => {
      const { transactionId, tagIds } = req.body as { transactionId: number; tagIds: number[] };
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM transaction_tags WHERE transaction_id = $1', [transactionId]);
        if (tagIds.length) {
          const values = tagIds.map((tagId, i) => `($1,$${i + 2})`).join(',');
          await client.query(`INSERT INTO transaction_tags(transaction_id, tag_id) VALUES ${values}`, [transactionId, ...tagIds]);
        }
        await client.query('COMMIT');
        return res.json({ ok: true });
      } catch (e) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: (e as Error).message });
      } finally {
        client.release();
      }
    },

    tagExpenseReport: async (req: Request, res: Response) => {
      const userId = Number((req as any).user?.sub);
      const tagId = Number(req.params.tagId);
      const { rows } = await pool.query(
        `SELECT date_trunc('month', t.happened_at) AS month,
                SUM(t.amount) AS total_expense
         FROM transactions t
         JOIN transaction_tags tt ON tt.transaction_id = t.id
         JOIN tags tg ON tg.id = tt.tag_id
         WHERE tg.user_id = $1
           AND tg.id = $2
           AND t.direction = 'expense'
         GROUP BY 1
         ORDER BY 1 DESC`,
        [userId, tagId]
      );
      return res.json({ series: rows });
    }
  };
}
