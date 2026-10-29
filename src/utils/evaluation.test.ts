import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeWords,
  findMissingWords,
  evaluateStudentSpeech,
  calculateStarRating,
} from './evaluation';
import { DIALOGUE_TURNS } from '../types/dialogue';

test('tokenizeWords handles punctuation and contractions', () => {
  const words = tokenizeWords("I'm sorry, I spoke like that!");
  assert.deepEqual(words, ['i', 'm', 'sorry', 'i', 'spoke', 'like', 'that']);
});

test('findMissingWords identifies missing target keywords', () => {
  const missing = findMissingWords(['sorry', 'spoke'], ['i', 'am', 'sorry']);
  assert.deepEqual(missing, ['spoke']);

  const noneMissing = findMissingWords(['sorry', 'spoke'], ['i', 'spoke', 'and', 'sorry']);
  assert.deepEqual(noneMissing, []);
});

test('evaluateStudentSpeech handles empty speech (no_speech)', () => {
  const turn1 = DIALOGUE_TURNS[0];
  const result = evaluateStudentSpeech('', turn1, 0);
  assert.equal(result.isSuccess, false);
  assert.equal(result.feedbackType, 'no_speech');
  assert.ok(result.feedbackKo.includes('괜찮아요!'));
});

test('evaluateStudentSpeech succeeds when all key words are present (clean match)', () => {
  const turn1 = DIALOGUE_TURNS[0];
  const result = evaluateStudentSpeech("I'm sorry I spoke like that.", turn1, 0);
  assert.equal(result.isSuccess, true);
  assert.equal(result.isSmallWordMissing, false);
  assert.equal(result.feedbackType, 'success');
  assert.ok(result.feedbackEn.includes('Thanks for telling me calmly'));
});

test('evaluateStudentSpeech marks small word missing when key words match but a small word was omitted', () => {
  const turn1 = DIALOGUE_TURNS[0];
  // Target: "I'm sorry I spoke like that." Key words: "sorry", "spoke". Omitted "like that"
  const result = evaluateStudentSpeech('Sorry I spoke.', turn1, 0);
  assert.equal(result.isSuccess, true);
  assert.equal(result.isSmallWordMissing, true);
  assert.equal(result.feedbackType, 'success_small_missing');
  assert.ok(result.feedbackEn.includes('Try adding the small word next time'));
});

test('evaluateStudentSpeech applies recast on 1st failure', () => {
  const turn1 = DIALOGUE_TURNS[0];
  const result = evaluateStudentSpeech('I am tired.', turn1, 0);
  assert.equal(result.isSuccess, false);
  assert.equal(result.feedbackType, 'recast');
  assert.ok(result.feedbackEn.includes('Nice try! You can say'));
});

test('evaluateStudentSpeech applies elicitation on 2nd failure', () => {
  const turn1 = DIALOGUE_TURNS[0];
  const result = evaluateStudentSpeech('I am tired.', turn1, 1);
  assert.equal(result.isSuccess, false);
  assert.equal(result.feedbackType, 'elicitation');
  assert.ok(result.feedbackEn.includes('Almost! Try the missing word: "S__"'));
});

test('evaluateStudentSpeech applies chunking on 3rd failure', () => {
  const turn1 = DIALOGUE_TURNS[0];
  const result = evaluateStudentSpeech('I am tired.', turn1, 2);
  assert.equal(result.isSuccess, false);
  assert.equal(result.feedbackType, 'chunking');
  assert.ok(result.feedbackEn.includes("I'm sorry"));
});

test('calculateStarRating correctly scores skipped count according to PRD', () => {
  assert.equal(calculateStarRating(0), 3); // 0 skips -> 3 stars
  assert.equal(calculateStarRating(1), 2); // 1 skip -> 2 stars
  assert.equal(calculateStarRating(2), 1); // 2 skips -> 1 star
  assert.equal(calculateStarRating(4), 1); // 4 skips -> 1 star
});
