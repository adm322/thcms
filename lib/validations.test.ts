import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginSchema, CreateProgramSchema } from './validations';

describe('LoginSchema', () => {
  test('accepts valid email and password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    assert.equal(result.success, true);
  });

  test('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    assert.equal(result.success, false);
  });

  test('rejects empty password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: '' });
    assert.equal(result.success, false);
  });

  test('rejects missing email', () => {
    const result = LoginSchema.safeParse({ password: 'secret' });
    assert.equal(result.success, false);
  });

  test('rejects missing password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com' });
    assert.equal(result.success, false);
  });

  test('rejects empty object', () => {
    const result = LoginSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('CreateProgramSchema', () => {
  test('accepts minimal valid input (title only)', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Leadership 101' });
    assert.equal(result.success, true);
  });

  test('accepts full valid input', () => {
    const result = CreateProgramSchema.safeParse({
      title: 'Leadership 101',
      description: 'A leadership course',
      category: 'Leadership',
      durationHours: 8,
      maxParticipants: 30,
      pricePerPax: 250,
      locationType: 'onsite',
      syllabus: ['Module 1', 'Module 2'],
    });
    assert.equal(result.success, true);
  });

  test('rejects empty title', () => {
    const result = CreateProgramSchema.safeParse({ title: '' });
    assert.equal(result.success, false);
  });

  test('rejects missing title', () => {
    const result = CreateProgramSchema.safeParse({ description: 'No title' });
    assert.equal(result.success, false);
  });

  test('rejects negative durationHours', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', durationHours: -1 });
    assert.equal(result.success, false);
  });

  test('rejects zero durationHours', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', durationHours: 0 });
    assert.equal(result.success, false);
  });

  test('rejects non-integer maxParticipants', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', maxParticipants: 5.5 });
    assert.equal(result.success, false);
  });

  test('rejects negative pricePerPax', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', pricePerPax: -10 });
    assert.equal(result.success, false);
  });

  test('accepts zero pricePerPax', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', pricePerPax: 0 });
    assert.equal(result.success, true);
  });

  test('rejects invalid locationType', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', locationType: 'invalid' });
    assert.equal(result.success, false);
  });

  test('accepts all valid locationTypes', () => {
    for (const loc of ['onsite', 'online', 'hybrid']) {
      const result = CreateProgramSchema.safeParse({ title: 'Test', locationType: loc });
      assert.equal(result.success, true, `Expected locationType "${loc}" to be valid`);
    }
  });

  test('rejects non-array syllabus', () => {
    const result = CreateProgramSchema.safeParse({ title: 'Test', syllabus: 'not-an-array' });
    assert.equal(result.success, false);
  });
});
