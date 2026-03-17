import type { Request, Response } from 'express';
import type { Pool } from 'pg';

export function buildFamilyHandlers(pool: Pool) {
  return {
    inviteMember: async (req: Request, res: Response) => {
      const inviterId = Number((req as any).user?.sub);
      const { accountId, inviteeEmail, token, expiresAt } = req.body;

      await pool.query(
        `INSERT INTO family_invitations (account_id, inviter_user_id, invitee_email, token, expires_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [accountId, inviterId, inviteeEmail, token, expiresAt]
      );
      return res.status(201).json({ ok: true });
    },

    acceptInvite: async (req: Request, res: Response) => {
      const userId = Number((req as any).user?.sub);
      const { token } = req.body;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const invite = await client.query(
          `UPDATE family_invitations
           SET status='accepted'
           WHERE token=$1 AND status='pending' AND expires_at > NOW()
           RETURNING account_id`,
          [token]
        );
        if (!invite.rowCount) throw new Error('Invitation invalid/expired');

        await client.query(
          `INSERT INTO account_memberships(account_id, user_id, role)
           VALUES($1,$2,'editor')
           ON CONFLICT (account_id, user_id) DO NOTHING`,
          [invite.rows[0].account_id, userId]
        );
        await client.query('COMMIT');
        return res.json({ ok: true });
      } catch (e) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: (e as Error).message });
      } finally {
        client.release();
      }
    },

    sharedLedger: async (req: Request, res: Response) => {
      const userId = Number((req as any).user?.sub);
      const accountId = Number(req.params.accountId);
      const { rows } = await pool.query(
        `SELECT t.id, t.amount, t.direction, t.memo, t.happened_at, t.user_id
         FROM transactions t
         WHERE t.account_id = $1
           AND (
              t.user_id = $2
              OR EXISTS (
                SELECT 1 FROM account_memberships am
                WHERE am.account_id = t.account_id AND am.user_id = $2
              )
           )
         ORDER BY t.happened_at DESC
         LIMIT 500`,
        [accountId, userId]
      );
      return res.json({ items: rows });
    },

    sharedDashboard: async (req: Request, res: Response) => {
      const userId = Number((req as any).user?.sub);
      const { rows } = await pool.query(
        `WITH visible_accounts AS (
           SELECT id AS account_id FROM accounts WHERE user_id = $1
           UNION
           SELECT account_id FROM account_memberships WHERE user_id = $1
         )
         SELECT date_trunc('month', t.happened_at) AS month,
                SUM(CASE WHEN t.direction='income' THEN t.amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN t.direction='expense' THEN t.amount ELSE 0 END) AS total_expense
         FROM transactions t
         JOIN visible_accounts v ON v.account_id = t.account_id
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT 12`,
        [userId]
      );
      return res.json({ monthly: rows });
    }
  };
}
