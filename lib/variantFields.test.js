import { describe, it, expect } from 'vitest';
import {
  SPEC_FIELDS,
  COMPOSITE_DIMENSION_FIELDS,
  formatSpecValue,
  extractPriceTiers,
  extractBullets,
  extractGroupedSpecs,
  discriminatingFields,
  pickDisplayFields,
} from './variantFields';

describe('SPEC_FIELDS', () => {
  it('has exactly 28 unique keys', () => {
    expect(SPEC_FIELDS).toHaveLength(28);
    expect(new Set(SPEC_FIELDS.map((f) => f.key)).size).toBe(28);
  });

  it('every field has a group', () => {
    for (const field of SPEC_FIELDS) {
      expect(field.group).toBeTruthy();
    }
  });
});

describe('formatSpecValue', () => {
  it('joins a value with its unit when the field has a unitKey', () => {
    const field = { key: 'break_strength', unitKey: 'break_strength_unit_of_measure' };
    expect(formatSpecValue({ break_strength: 990, break_strength_unit_of_measure: 'LB' }, field)).toBe('990 LB');
  });

  it('returns the bare value when the field has no unitKey', () => {
    const field = { key: 'color' };
    expect(formatSpecValue({ color: 'White' }, field)).toBe('White');
  });

  it('returns null for a missing or empty value', () => {
    const field = { key: 'color' };
    expect(formatSpecValue({ color: null }, field)).toBeNull();
    expect(formatSpecValue({ color: '' }, field)).toBeNull();
    expect(formatSpecValue({}, field)).toBeNull();
  });
});

describe('extractPriceTiers', () => {
  it('includes only tiers with a real price', () => {
    expect(
      extractPriceTiers({ one_four_units: '68.00', five_nine_units: null, ten_plus_units: '60.00', pallet_pricing: null })
    ).toEqual([
      { label: '1-4 units', price: 68 },
      { label: '10+ units', price: 60 },
    ]);
  });
});

describe('extractBullets', () => {
  it('drops empty and missing bullets, keeps real ones in order', () => {
    expect(extractBullets({ bullet_1: 'Strong', bullet_2: '', bullet_3: null, bullet_4: 'Durable' })).toEqual([
      'Strong',
      'Durable',
    ]);
  });
});

describe('extractGroupedSpecs', () => {
  it('groups populated scalar fields under their real group label, in group order', () => {
    const variant = {
      color: 'White',
      style: 'Standard Duty',
      break_strength: 990,
      break_strength_unit_of_measure: 'LB',
      size: '5/8" x 2790\'',
      quantity_case: 2,
    };
    const groups = extractGroupedSpecs(variant);
    expect(groups.map((g) => g.group)).toEqual(['Material & Performance', 'Dimensions', 'Packaging & Shipping']);
    expect(groups[0].specs).toEqual([
      { label: 'Color', value: 'White' },
      { label: 'Style', value: 'Standard Duty' },
      { label: 'Break strength', value: '990 LB' },
    ]);
  });

  it('omits a group entirely when none of its fields are populated', () => {
    const groups = extractGroupedSpecs({ color: 'White' });
    expect(groups.map((g) => g.group)).toEqual(['Material & Performance']);
  });

  it('joins a composite dimension field only when every part is present, with its unit', () => {
    const complete = extractGroupedSpecs({ pack_length: '15.00', pack_width: '15.00', pack_height: '16.00' });
    const packagingGroup = complete.find((g) => g.group === 'Packaging & Shipping');
    expect(packagingGroup.specs).toEqual([{ label: 'Package size (L x W x H)', value: '15.00 x 15.00 x 16.00 IN' }]);

    const incomplete = extractGroupedSpecs({ pack_length: '15.00', pack_width: '15.00' });
    const incompletePackagingGroup = incomplete.find((g) => g.group === 'Packaging & Shipping');
    expect(incompletePackagingGroup).toBeUndefined();
  });

  it('uses the real unit column for pallet size, not a hardcoded unit', () => {
    const groups = extractGroupedSpecs({
      pallet_length: 45,
      pallet_width: 45,
      pallet_height: 84,
      pallet_length_unit_of_measure: 'IN',
    });
    const packagingGroup = groups.find((g) => g.group === 'Packaging & Shipping');
    expect(packagingGroup.specs).toEqual([{ label: 'Pallet size (L x W x H)', value: '45 x 45 x 84 IN' }]);
  });

  it('returns an empty array for a variant with nothing populated', () => {
    expect(extractGroupedSpecs({})).toEqual([]);
  });
});

function row(overrides = {}) {
  return { id: 1, specValues: {}, ...overrides };
}

describe('discriminatingFields', () => {
  it('keeps only fields whose value differs somewhere in the row set', () => {
    const rows = [
      row({ specValues: { color: 'White', style: 'Standard Duty' } }),
      row({ specValues: { color: 'White', style: 'Heavy Duty' } }),
    ];
    const fields = discriminatingFields(rows);
    expect(fields.some((f) => f.key === 'style')).toBe(true);
    expect(fields.some((f) => f.key === 'color')).toBe(false);
  });

  it('caps the result at 5 fields even when more genuinely vary', () => {
    const rows = [
      row({ specValues: { color: 'White', material_type: 'A', style: 'A', product_finish: 'A', product_grade: 'A', unit: 'A' } }),
      row({ specValues: { color: 'Black', material_type: 'B', style: 'B', product_finish: 'B', product_grade: 'B', unit: 'B' } }),
    ];
    expect(discriminatingFields(rows)).toHaveLength(5);
  });
});

describe('pickDisplayFields', () => {
  const rows = [
    row({ specValues: { break_strength: 750 } }),
    row({ specValues: { break_strength: 750 } }),
  ];

  it('falls back to discriminatingFields when displayFields is null or undefined', () => {
    expect(pickDisplayFields(rows, null)).toEqual(discriminatingFields(rows));
    expect(pickDisplayFields(rows, undefined)).toEqual(discriminatingFields(rows));
  });

  it('honors an explicit selection even when the field does not vary across rows', () => {
    const result = pickDisplayFields(rows, ['break_strength']);
    expect(result.map((f) => f.key)).toEqual(['break_strength']);
  });

  it('honors an explicit empty array as "show zero extra columns", not a fallback', () => {
    expect(pickDisplayFields(rows, [])).toEqual([]);
  });
});
