function personaCode(id) {
  return 'P' + String(id + 1).padStart(2, '0');
}

function characterTile(id, href = 'portraits.html#' + personaCode(id)) {
  return '<a class="character-tile" href="' + href + '" data-persona="' + id + '">' +
    '<span class="tile-number">' + personaCode(id) + ' / ' + en[id] + '</span>' +
    '<img src="assets/personas/' + personaCode(id) + '.svg" alt="' + names[id] + '人物插画" width="480" height="360" loading="lazy">' +
    '<h3>' + names[id] + '</h3><p>「' + personaPortraits[id].motto + '」</p>' +
    '<span class="tile-keywords">' + personaDetails[id].keywords + '</span><span class="tile-open">认识这位角色 ↗</span></a>';
}

function resultSummary(result) {
  if (result.flatActual || result.flatIdeal || result.highIdeal) {
    const uncertain = result.flatActual && (result.flatIdeal || result.highIdeal) ? '实际与理想的回答都' : result.flatActual ? '实际回答' : '理想回答';
    return uncertain + '缺乏足够的相对差异，不足以确定人格。暂不贴标签，也不会随机分配角色。请结合最近的组会、实验和时间安排，区分真正优先的习惯；仍可查看原始维度与差距。';
  }
  const actualName = names[result.actualRanking[0].id];
  const idealName = names[result.idealRanking[0].id];
  const strongest = result.gaps.reduce((best, gap, position) => Math.abs(gap) > Math.abs(result.gaps[best]) ? position : best, 0);
  const opening = result.actualRanking[0].id === result.idealRanking[0].id ?
    '现在与理想都靠近' + actualName + '，同一种角色也能有不同的研究节奏。' :
    '现在的你更接近' + actualName + '：' + desc[result.actualRanking[0].id] + '你向往的方向则是' + idealName + '。';
  const uncertainty = result.mixedActual || result.mixedIdeal ? '主副型接近，可以一起对照。' : '';
  if (result.gaps.every(gap => gap === 0)) return opening + uncertainty + '这次回答中，实际习惯与理想投入一致。可以继续保持，也给未来的变化留一点空间。';
  return opening + uncertainty + '最明显的变化是希望在「' + dimensions[strongest][1] + '」上' +
    (result.gaps[strongest] > 0 ? '增加' : '减少') + '投入。值得调整的是时间与研究方式，差距不代表能力不足。';
}

function overviewArtwork(id) {
  return '<img src="assets/personas/' + personaCode(id) + '.svg" alt="' + names[id] + '人物插画" width="480" height="360">' +
    '<blockquote>「' + personaPortraits[id].motto + '」</blockquote>';
}

function mountCharacterShowcase() {
  const cast = document.querySelector('#heroCast');
  if (cast) {
    cast.innerHTML = [2, 6, 0].map(id => characterTile(id)).join('');
    cast.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
  }
  const discovery = document.querySelector('#homeCharacters');
  if (discovery) discovery.innerHTML = [7, 3, 10, 15].map(id => characterTile(id)).join('');
}
