import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { CategoryRuleEngine } from '../services/categoryRuleEngine';

export function buildImportHandlers(pool: Pool) {
  return {
    confirmStaging: async (req: Request, res: Response) => {
      const { userId, rows } = req.body;
      const { rows: rules } = await pool.query(
        'SELECT category_id AS "categoryId", pattern, is_regex AS "isRegex", priority FROM category_rules WHERE user_id IS NULL OR user_id = $1',
        [userId]
      );

      const normalized = rows.map((r: any) => ({
        ...r,
        categoryId: r.categoryId ?? CategoryRuleEngine.predictCategoryId(r, rules)
      }));

      const values = normalized
        .map(
          (r: any, i: number) =>
            `($1,$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4},'expense',$${i * 4 + 5})`
        )
        .join(',');

      const params = [userId, ...normalized.flatMap((r: any) => [r.accountId, r.categoryId, r.amount, r.happenedAt])];
      await pool.query(
        `INSERT INTO transactions(user_id, account_id, category_id, amount, direction, happened_at) VALUES ${values}`,
        params
      );

      return res.json({ inserted: normalized.length });
    }
  };
}
