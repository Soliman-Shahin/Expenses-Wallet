import { BRAND, BRAND_TRANSLATION_PARAMS } from './brand.config';

describe('consumer brand configuration', () => {
  it('defines the approved public identity and translation parameters', () => {
    expect(BRAND.productName).toBe('Madar Flow');
    expect(BRAND.companyName).toBe('Orbit Madar');
    expect(BRAND.attribution).toBe('Madar Flow by Orbit Madar');
    expect(BRAND_TRANSLATION_PARAMS.productName).toBe(BRAND.productName);
  });
});
