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

function matchPersonas(values) {
  if (values.length !== 12 || values.some(value => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error('需要 12 个有效的维度分数。');
  }
  return vectors.map((profile, id) => {
    const distance = Math.sqrt(profile.reduce((sum, value, position) => sum + ((value - 1) * 25 - values[position]) ** 2, 0) / 12);
    return { id, match: 100 - distance };
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
    actual, ideal, actualRanking, idealRanking, gaps,
    flatIdeal: spread < 10,
    highIdeal: meanIdeal >= 90 && spread <= 25,
    mixedActual: actualRanking[0].match - actualRanking[1].match < 3,
    mixedIdeal: idealRanking[0].match - idealRanking[1].match < 3,
  };
}
