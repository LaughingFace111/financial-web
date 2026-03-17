import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const money = (value: Decimal.Value) => new Decimal(value).toDecimalPlaces(2);
export const add = (a: Decimal.Value, b: Decimal.Value) => money(new Decimal(a).plus(b));
export const sub = (a: Decimal.Value, b: Decimal.Value) => money(new Decimal(a).minus(b));
