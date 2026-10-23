import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('EDGE PROTECTION')).toBe('edge-protection');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify('Stretch Wrap & Film')).toBe('stretch-wrap-film');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -Boxes-  ')).toBe('boxes');
  });

  it('transliterates Turkish characters instead of stripping them', () => {
    expect(slugify('Alüminyum Folyo')).toBe('aluminyum-folyo');
  });

  it('transliterates every mapped Turkish character, including ASCII "I"', () => {
    expect(slugify('ÇĞİıÖŞÜI')).toBe('cgiiosui');
  });
});
