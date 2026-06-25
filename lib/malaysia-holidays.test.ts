import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { getRamadanStart } from './malaysia-holidays';

test('getRamadanStart returns correct date for 2026', () => {
  const result = getRamadanStart();
  assert.equal(result, '2026-02-18');
});
