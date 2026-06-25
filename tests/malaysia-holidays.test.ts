import { describe, it, expect } from 'vitest';
import { getHariRayaDates } from '../lib/malaysia-holidays';

describe('malaysia-holidays', () => {
  describe('getHariRayaDates', () => {
    it('should return the correct dates for Hari Raya', () => {
      expect(getHariRayaDates()).toEqual(["2026-04-20", "2026-04-21"]);
    });
  });
});
