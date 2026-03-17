import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { InstallmentService } from '../services/installmentService';

export function buildTransactionHandlers(pool: Pool) {
  return {
    createCreditInstallment: async (req: Request, res: Response) => {
      const client = await pool.connect();
      try {
        const { userId, accountId, categoryId, amount, feeRate, periods, memo, happenedAt } = req.body;
        const plan = InstallmentService.buildPlan(amount, feeRate, periods);

        await client.query('BEGIN');

        const [accountUpdate, txInsert] = await Promise.all([
          client.query(
            `UPDATE accounts
             SET used_credit = used_credit + $1
             WHERE id = $2 AND user_id = $3 AND type='credit' AND (credit_limit - used_credit) >= $1`,
            [amount, accountId, userId]
          ),
          client.query(
            `INSERT INTO transactions(user_id, account_id, category_id, amount, direction, memo, happened_at)
             VALUES ($1,$2,$3,$4,'expense',$5,$6) RETURNING id`,
            [userId, accountId, categoryId, amount, memo, happenedAt]
          )
        ]);

        if (accountUpdate.rowCount !== 1) throw new Error('Insufficient credit available');

        const transactionId = txInsert.rows[0].id;
        const values = plan
          .map(
            (item, i) =>
              `($1,$2,${item.periodIndex},${periods},${item.principal},${item.fee},(DATE $3 + INTERVAL '${i + 1} month'))`
          )
          .join(',');

        await client.query(
          `INSERT INTO installments(user_id, transaction_id, period_index, total_periods, principal, fee, due_date)
           VALUES ${values}`,
          [userId, transactionId, happenedAt]
        );

        await client.query('COMMIT');
        return res.status(201).json({ transactionId, plan });
      } catch (error) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: (error as Error).message });
      } finally {
        client.release();
      }
    }
  };
}
