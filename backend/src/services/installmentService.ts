import Decimal from 'decimal.js';
import { money } from '../lib/money';

export type InstallmentItem = {
  periodIndex: number;
  principal: string;
  fee: string;
};

export class InstallmentService {
  static buildPlan(totalAmount: string, feeRate: string, periods: number): InstallmentItem[] {
    const total = money(totalAmount);
    const totalFee = total.mul(feeRate).toDecimalPlaces(2);

    const basePrincipal = total.div(periods).toDecimalPlaces(2, Decimal.ROUND_DOWN);
    const baseFee = totalFee.div(periods).toDecimalPlaces(2, Decimal.ROUND_DOWN);

    let principalAcc = new Decimal(0);
    let feeAcc = new Decimal(0);

    return Array.from({ length: periods }, (_, idx) => {
      const periodIndex = idx + 1;
      const isLast = periodIndex === periods;
      const principal = isLast ? total.minus(principalAcc) : basePrincipal;
      const fee = isLast ? totalFee.minus(feeAcc) : baseFee;

      principalAcc = principalAcc.plus(principal);
      feeAcc = feeAcc.plus(fee);

      return { periodIndex, principal: principal.toFixed(2), fee: fee.toFixed(2) };
    });
  }
}
