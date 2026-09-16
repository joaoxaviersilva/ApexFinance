import { describe, expect, it } from 'vitest';

import { Money } from './money.js';

describe('Money', () => {
  it('creates a monetary value from integer cents', () => {
    const money = Money.fromCents(1050);

    expect(money.cents).toBe(1050);
  });

  it('adds two monetary values without floating point arithmetic', () => {
    const first = Money.fromCents(1050);
    const second = Money.fromCents(525);

    const result = first.add(second);

    expect(result.cents).toBe(1575);
  });

  it('subtracts one monetary value from another', () => {
    const first = Money.fromCents(2000);
    const second = Money.fromCents(750);

    const result = first.subtract(second);

    expect(result.cents).toBe(1250);
  });

  it('rejects non-integer cents', () => {
    expect(() => Money.fromCents(10.5)).toThrow('Money must be represented using integer cents.');
  });
});
