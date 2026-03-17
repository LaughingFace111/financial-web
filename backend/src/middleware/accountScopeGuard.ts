import type { NextFunction, Request, Response } from 'express';
import type { Pool } from 'pg';

export function accountScopeGuard(pool: Pool, minRole: 'viewer' | 'editor' | 'owner' = 'viewer') {
  const weight = { viewer: 1, editor: 2, owner: 3 };

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = Number((req as any).user?.sub);
    const accountId = Number(req.params.accountId || req.body.accountId || req.query.accountId);
    if (!userId || !accountId) return res.status(400).json({ message: 'accountId/user missing' });

    const { rows } = await pool.query(
      `SELECT role
       FROM account_memberships
       WHERE account_id = $1 AND user_id = $2
       UNION
       SELECT 'owner'::varchar AS role
       FROM accounts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [accountId, userId]
    );

    if (!rows.length) return res.status(403).json({ message: 'No access to account' });
    const currentRole = rows[0].role as 'viewer' | 'editor' | 'owner';
    if (weight[currentRole] < weight[minRole]) return res.status(403).json({ message: 'Insufficient role' });

    (req as any).accountRole = currentRole;
    next();
  };
}
