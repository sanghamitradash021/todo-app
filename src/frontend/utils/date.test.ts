import { describe, it, expect } from 'vitest';
import { startOfToday } from './date';

describe('startOfToday', () => {
  it('returns a Date object', () => {
    expect(startOfToday()).toBeInstanceOf(Date);
  });

  it('returns midnight — hours, minutes, seconds, ms are all 0', () => {
    const d = startOfToday();
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it('returns today\'s date (year, month, day match new Date())', () => {
    const now = new Date();
    const d = startOfToday();
    expect(d.getFullYear()).toBe(now.getFullYear());
    expect(d.getMonth()).toBe(now.getMonth());
    expect(d.getDate()).toBe(now.getDate());
  });

  it('returns a value less than or equal to the current time', () => {
    expect(startOfToday().getTime()).toBeLessThanOrEqual(Date.now());
  });
});
