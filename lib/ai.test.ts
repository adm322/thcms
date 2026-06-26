import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQuizQuestions,
  analyzeEvaluationComments,
  enhanceDescription,
  getSmartRecommendations,
  analyzeTrainingNeeds,
} from './ai';

// All tests exercise the mock/fallback paths (no OPENAI_API_KEY set)
beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe('generateQuizQuestions', () => {
  test('returns questions for a leadership topic', async () => {
    const qs = await generateQuizQuestions('leadership', 3);
    assert.ok(qs.length > 0);
    assert.ok(qs.length <= 3);
    for (const q of qs) {
      assert.ok(q.text);
      assert.ok(['MCQ', 'TRUE_FALSE'].includes(q.type));
      assert.ok(Array.isArray(q.options));
      assert.ok(q.options.length >= 2);
      assert.ok(q.correctAnswer);
      assert.ok(typeof q.points === 'number');
    }
  });

  test('returns questions for a compliance topic', async () => {
    const qs = await generateQuizQuestions('compliance', 2);
    assert.ok(qs.length > 0);
    assert.ok(qs.length <= 2);
  });

  test('returns questions for a technical topic', async () => {
    const qs = await generateQuizQuestions('technical');
    assert.ok(qs.length > 0);
  });

  test('returns questions for a team topic', async () => {
    const qs = await generateQuizQuestions('team building', 2);
    assert.ok(qs.length > 0);
  });

  test('returns questions for a communication topic', async () => {
    const qs = await generateQuizQuestions('communication skills');
    assert.ok(qs.length > 0);
  });

  test('falls back to leadership+team for unknown topics', async () => {
    const qs = await generateQuizQuestions('quantum physics', 5);
    assert.ok(qs.length > 0);
    assert.ok(qs.length <= 5);
  });

  test('defaults to 5 questions when count is omitted', async () => {
    const qs = await generateQuizQuestions('leadership');
    assert.ok(qs.length <= 5);
  });

  test('MCQ questions have exactly 4 options', async () => {
    const qs = await generateQuizQuestions('leadership', 5);
    const mcqs = qs.filter(q => q.type === 'MCQ');
    for (const q of mcqs) {
      assert.equal(q.options.length, 4);
    }
  });

  test('TRUE_FALSE questions have exactly 2 options', async () => {
    const qs = await generateQuizQuestions('leadership', 5);
    const tfs = qs.filter(q => q.type === 'TRUE_FALSE');
    for (const q of tfs) {
      assert.equal(q.options.length, 2);
      assert.ok(q.options.includes('True'));
      assert.ok(q.options.includes('False'));
    }
  });
});

describe('analyzeEvaluationComments', () => {
  test('returns positive sentiment for positive comments', async () => {
    const result = await analyzeEvaluationComments([
      { participant: 'Alice', text: 'Excellent and amazing trainer, great content' },
      { participant: 'Bob', text: 'Best training ever, very useful and practical' },
    ]);
    assert.equal(result.sentiment, 'positive');
    assert.ok(Array.isArray(result.themes));
    assert.ok(result.themes.length > 0);
    assert.ok(result.summary.length > 0);
    assert.ok(Array.isArray(result.strengths));
    assert.ok(Array.isArray(result.improvements));
  });

  test('returns negative sentiment for negative comments', async () => {
    const result = await analyzeEvaluationComments([
      { participant: 'Alice', text: 'Poor and boring content, bad pacing' },
      { participant: 'Bob', text: 'Confusing and difficult, a waste of time' },
    ]);
    assert.equal(result.sentiment, 'negative');
  });

  test('returns mixed sentiment for mixed comments', async () => {
    // 2 positive words (great, helpful) and 1 negative (need) → mixed
    const result = await analyzeEvaluationComments([
      { participant: 'Alice', text: 'Great and helpful trainer but need more exercises' },
    ]);
    assert.equal(result.sentiment, 'mixed');
  });

  test('includes themes array', async () => {
    const result = await analyzeEvaluationComments([
      { participant: 'Alice', text: 'Great session' },
    ]);
    assert.ok(result.themes.includes('Training Delivery'));
    assert.ok(result.themes.includes('Content Relevance'));
  });
});

describe('enhanceDescription', () => {
  test('returns a non-empty description', async () => {
    const result = await enhanceDescription('Leadership 101', ['Team management', 'Communication']);
    assert.ok(result.length > 0);
  });

  test('includes the program title in the output', async () => {
    const result = await enhanceDescription('Advanced Excel', ['Formulas', 'Pivot tables']);
    assert.ok(result.includes('Advanced Excel'));
  });

  test('returns multi-paragraph text', async () => {
    const result = await enhanceDescription('Test Program', ['Point 1']);
    assert.ok(result.includes('\n\n'));
  });
});

describe('getSmartRecommendations', () => {
  test('returns 3 recommendations', async () => {
    const result = await getSmartRecommendations(
      ['Leadership'],
      50,
      [{ department: 'Engineering', count: 30 }]
    );
    assert.equal(result.length, 3);
  });

  test('excludes already-taken categories', async () => {
    const result = await getSmartRecommendations(
      ['Leadership', 'Technical'],
      50,
      [{ department: 'HR', count: 10 }]
    );
    for (const r of result) {
      assert.ok(!r.toLowerCase().includes('leadership'));
      assert.ok(!r.toLowerCase().includes('technical'));
    }
  });

  test('still returns 3 even with many past categories', async () => {
    const result = await getSmartRecommendations(
      ['Leadership', 'Technical', 'Soft Skills', 'Compliance', 'Team Building'],
      100,
      [{ department: 'Sales', count: 20 }]
    );
    assert.equal(result.length, 3);
  });
});

describe('analyzeTrainingNeeds', () => {
  test('returns default structure with empty responses', async () => {
    const result = await analyzeTrainingNeeds([]);
    assert.ok(Array.isArray(result.recommendedCategories));
    assert.ok(result.recommendedCategories.length > 0);
    assert.ok(result.explanation.length > 0);
    assert.ok(Array.isArray(result.suggestedPrograms));
    assert.ok(result.suggestedPrograms.length > 0);
  });

  test('returns Leadership and Soft Skills as defaults', async () => {
    const result = await analyzeTrainingNeeds([
      { question: 'What skills does your team lack?', answer: 'Communication' },
    ]);
    assert.ok(result.recommendedCategories.includes('Leadership'));
    assert.ok(result.recommendedCategories.includes('Soft Skills'));
  });
});
