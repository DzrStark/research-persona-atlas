const storageKey = 'research-persona-atlas-v1';

function readProgress(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(storageKey));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.answers) || parsed.answers.length > 36) return null;
    if (parsed.answers.some(answer => answer !== null && (!answer ||
      (answer.a !== undefined && !validRating(answer.a)) ||
      (answer.i !== undefined && !validRating(answer.i))))) return null;
    const picks = Array.isArray(parsed.picks) ? [...new Set(parsed.picks)].filter(value => Number.isInteger(value) && value >= 0 && value < 12) : [];
    const lowPriorities = Array.isArray(parsed.lowPriorities) ? [...new Set(parsed.lowPriorities)].filter(value => Number.isInteger(value) && value >= 0 && value < 12) : [];
    const missingIndex = questions.findIndex((question, position) => !validRating(parsed.answers[position]?.a) || !validRating(parsed.answers[position]?.i));
    const savedIndex = Number.isInteger(parsed.index) ? Math.max(0, Math.min(36, parsed.index)) : 0;
    const finished = parsed.finished === true && completeAnswers(parsed.answers) && picks.length === 3 &&
      lowPriorities.length <= 2 && !lowPriorities.some(value => picks.includes(value));
    return {
      answers: parsed.answers,
      index: missingIndex >= 0 && savedIndex > missingIndex ? missingIndex : savedIndex,
      picks,
      background: typeof sanitizeBackground === 'function' ? sanitizeBackground(parsed.background) : {},
      lowPriorities,
      finished,
    };
  } catch {
    return null;
  }
}

function writeProgress(storage, state) {
  try {
    storage.setItem(storageKey, JSON.stringify({ ...state, version: 1 }));
    return true;
  } catch {
    return false;
  }
}
