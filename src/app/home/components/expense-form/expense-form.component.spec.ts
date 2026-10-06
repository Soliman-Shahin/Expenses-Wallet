import { FormControl } from '@angular/forms';
import { ExpenseFormComponent } from './expense-form.component';

describe('ExpenseFormComponent data validation', () => {
  const component = Object.create(ExpenseFormComponent.prototype) as any;
  const validator = component.amountValidator();

  it('accepts positive decimal amounts and normalizes comma decimals', () => {
    expect(validator(new FormControl('12,50'))).toBeNull();
    expect(component.normalizeAmount('12,50')).toBe(12.5);
  });

  it('rejects zero, negative, malformed, and non-finite amounts', () => {
    for (const value of ['0', '-1', '1.2.3', '1,2.3', 'NaN', 'Infinity']) {
      expect(validator(new FormControl(value))).toEqual({ amount: true });
    }
  });

  it('normalizes a local calendar date to local noon', () => {
    const date = component.localCalendarIso(new Date(2026, 8, 16, 23, 30));
    const normalized = new Date(date);
    expect(normalized.getFullYear()).toBe(2026);
    expect(normalized.getMonth()).toBe(8);
    expect(normalized.getDate()).toBe(16);
    expect(normalized.getHours()).toBe(12);
  });
});
