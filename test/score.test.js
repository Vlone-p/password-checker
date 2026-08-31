import { describe, it, expect } from 'vitest';
import { scorePassword } from '../logic.js';

describe('scorePassword', () => {
  it('should return empty for no password', () => {
    expect(scorePassword('').category).toBe('empty');
  });

  it('should flag common passwords', () => {
    const result = scorePassword('password123!');
    expect(result.tips.some(t => t.text.includes('common dictionary'))).toBe(true);
  });

  it('should not flag "compassword" as common', () => {
    const result = scorePassword('compassword');
    expect(result.tips.some(t => t.text.includes('common dictionary'))).toBe(false);
  });

  it('should rate weak passwords as weak', () => {
    expect(scorePassword('abc').category).toBe('weak');
  });

  it('should rate strong passwords as very-strong', () => {
    // Changed to a random string without common dictionary words
    expect(scorePassword('X7v#kL9@pQ2z-MnB4!').category).toBe('very-strong');
  });
});
