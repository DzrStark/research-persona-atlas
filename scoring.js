function validRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function completeAnswers(responses) {
  return Array.isArray(responses) && responses.length === questions.length &&
    questions.every((question, position) => validRating(responses[position]?.a) && validRating(responses[position]?.i));
}

function dimensionScores(responses, kind) {
  if (!completeAnswers(responses) || !['a', 'i'].includes(kind)) {
    throw new Error('必须完成全部 36 题的实际与理想回答后才能计分。');
  }
  return dimensions.map((dimension, dimensionIndex) => {
    const values = questions.flatMap((question, position) => question.d === dimensionIndex ? [responses[position][kind]] : []);
    return (values.reduce((sum, value) => sum + value, 0) / values.length - 1) * 25;
  });
}

const scoringVersion = 'relative-profile-v2';

function centeredProfile(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map(value => value - mean);
  const norm = Math.hypot(...centered);
  return centered.map(value => norm > 1e-10 ? value / norm : 0);
}

function lowDifferentiation(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  return Math.max(...values) - Math.min(...values) < 10 || deviation < 5;
}

function profileUncertain(result, mode) {
  return mode === 'actual' ? result.flatActual : result.flatIdeal || result.highIdeal;
}

function matchPersonas(values) {
  if (values.length !== 12 || values.some(value => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error('需要 12 个有效的维度分数。');
  }
  const normalized = centeredProfile(values);
  return vectors.map((profile, id) => {
    const correlation = centeredProfile(profile).reduce((sum, value, position) => sum + value * normalized[position], 0);
    return { id, match: 50 * (1 + Math.max(-1, Math.min(1, correlation))) };
  }).sort((first, second) => second.match - first.match || first.id - second.id);
}

function assess(responses) {
  const actual = dimensionScores(responses, 'a');
  const ideal = dimensionScores(responses, 'i');
  const actualRanking = matchPersonas(actual);
  const idealRanking = matchPersonas(ideal);
  const gaps = ideal.map((value, position) => value - actual[position]);
  const meanIdeal = ideal.reduce((sum, value) => sum + value, 0) / ideal.length;
  const spread = Math.max(...ideal) - Math.min(...ideal);
  return {
    actual, ideal, actualRanking, idealRanking, gaps, scoringVersion,
    flatActual: lowDifferentiation(actual),
    flatIdeal: lowDifferentiation(ideal),
    highIdeal: meanIdeal >= 90 && spread <= 25,
    mixedActual: actualRanking[0].match - actualRanking[1].match < 3,
    mixedIdeal: idealRanking[0].match - idealRanking[1].match < 3,
  };
}
