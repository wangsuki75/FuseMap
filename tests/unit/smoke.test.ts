import { describe, it, expect } from 'vitest';
import { BRANDS } from '../../src/core/palette/types';

describe('骨架自检', () => {
  it('品牌注册表应包含六个品牌', () => {
    expect(BRANDS).toHaveLength(6);
  });
});
