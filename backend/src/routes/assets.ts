import type { Request, Response } from 'express';
import type { Pool } from 'pg';

export function buildAssetHandlers(pool: Pool) {
  return {
    assetDetail: async (req: Request, res: Response) => {
      const userId = Number((req as any).user?.sub);
      const assetId = Number(req.params.assetId);

      const asset = await pool.query(
        `SELECT id, name, asset_type AS "assetType", purchase_date AS "purchaseDate", purchase_cost AS "purchaseCost", residual_value AS "residualValue", status
         FROM assets
         WHERE id = $1 AND user_id = $2`,
        [assetId, userId]
      );
      if (!asset.rowCount) return res.status(404).json({ message: 'Asset not found' });

      const spend = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_spend
         FROM transactions
         WHERE asset_id = $1 AND direction = 'expense'`,
        [assetId]
      );
      const details = await pool.query(
        `SELECT id, happened_at, amount, memo, category_id
         FROM transactions
         WHERE asset_id = $1
         ORDER BY happened_at DESC`,
        [assetId]
      );

      return res.json({
        asset: asset.rows[0],
        totalSpend: spend.rows[0].total_spend,
        transactions: details.rows
      });
    }
  };
}
