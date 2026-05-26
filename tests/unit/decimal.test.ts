import { moneyDiffers, multiplyMoney, roundMoney, sumMoney } from '../../src/utils/decimal';

describe('decimal money utils', () => {
  it('rounds away IEEE-754 noise to a fixed-4 string', () => {
    expect(roundMoney(1.1499999999999999)).toBe('1.1500');
    expect(roundMoney(0.7)).toBe('0.7000');
    expect(roundMoney('9218.75')).toBe('9218.7500');
    expect(roundMoney(0)).toBe('0.0000');
  });

  it('multiplies price × quantity exactly', () => {
    expect(multiplyMoney(1.25, 7375)).toBe('9218.7500');
    expect(multiplyMoney('0.7000', 1475)).toBe('1032.5000');
  });

  it('sums without floating-point drift', () => {
    expect(sumMoney(['1032.5000', '5812.5000'])).toBe('6845.0000');
    expect(sumMoney([0.1, 0.2])).toBe('0.3000');
  });

  it('detects drift beyond a cent', () => {
    expect(moneyDiffers('100.0000', '100.0050')).toBe(false);
    expect(moneyDiffers('100.0000', '100.5000')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(() => roundMoney('abc')).toThrow();
  });
});
