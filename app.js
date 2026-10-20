let answers=[];
let index=0;
const $=s=>document.querySelector(s); const quiz=$('#quiz');
function renderQuestion() {
  const question = questions[index];
  const count = answers.filter(answer => validRating(answer?.a) && validRating(answer?.i)).length;
  $('#progressText').textContent = count + ' / 36';
  $('#progressBar').style.width = count / 36 * 100 + '%';
  quiz.innerHTML = '<div class="question"><div class="question-meta">Q' + (index + 1) + ' · ' + dimensions[question.d][1] +
    '</div><h3 tabindex="-1">' + question.text + '</h3><div class="answer-grid">' +
    box('actual', '我的实际表现', '过去六个月：1 几乎没有 · 2 偶尔 · 3 有时 · 4 经常 · 5 常态', answers[index]?.a) +
    box('ideal', '我的理想状态', '未来六个月时间有限：1 不投入 · 2 少量 · 3 适度 · 4 重要习惯 · 5 核心方式', answers[index]?.i) +
    '</div><p id="answerError" role="alert"></p><div class="quiz-footer"><button class="button ghost" id="prev" ' +
    (index ? '' : 'disabled') + '>← 上一题</button><button class="button primary" id="next">' +
    (index === 35 ? '选择优先方向 →' : '下一题 →') + '</button></div></div>';
  quiz.onchange = event => {
    if (!['a', 'i'].includes(event.target.name)) return;
    answers[index] = { ...answers[index], [event.target.name]: Number(event.target.value) };
    finished = false;
    $('#result').classList.add('hidden');
    saveCurrent();
    const completed = answers.filter(answer => validRating(answer?.a) && validRating(answer?.i)).length;
    $('#progressText').textContent = completed + ' / 36';
    $('#progressBar').style.width = completed / 36 * 100 + '%';
  };
  $('#prev').onclick = () => { index--; saveCurrent(); renderQuestion(); };
  $('#next').onclick = () => {
    if (!validRating(answers[index]?.a) || !validRating(answers[index]?.i)) {
      $('#answerError').textContent = '请分别回答实际表现与理想状态。';
      return;
    }
    index++;
    saveCurrent();
    if (index < 36) renderQuestion(); else showPriority();
  };
  quiz.querySelector('h3').focus();
}
function box(kind,title,sub,val){return `<div class="answer-box ${kind}"><h4>${title}</h4><small>${sub}</small><div class="scale">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${kind==='actual'?'a':'i'}" value="${n}" ${val===n?'checked':''}>${n}</label>`).join('')}</div></div>`}
function showPriority() {
  quiz.classList.add('hidden');
  $('#priority').classList.remove('hidden');
  $('#priority').innerHTML = '<h3>选择未来最想强化的 3 个维度</h3><p>时间和精力有限，请选择优先方向。此选择不会改变任何原始评分。</p><div class="priority-grid">' +
    dimensions.map((dimension, position) => '<label><input type="checkbox" value="' + position + '" ' +
      (picks.includes(position) ? 'checked' : '') + '>' + dimension.join(' ') + '</label>').join('') +
    '</div><details><summary>可选：未来暂不重点投入的 1–2 个维度</summary><div id="lowPriorities">' +
    dimensions.map((dimension, position) => '<label class="background-option"><input type="checkbox" value="' + position + '" ' +
      (lowPriorities.includes(position) ? 'checked' : '') + '>' + dimension[1] + '</label>').join('') +
    '</div></details>' + backgroundForm(background) +
    '<p id="priorityError" role="alert"></p><button class="button ghost" id="backAnswers">修改回答</button> <button class="button primary" id="finish">查看我的图谱 →</button>';
  $('#priority').onchange = () => {
    picks = [...document.querySelectorAll('.priority-grid input:checked')].map(input => Number(input.getAttribute('value')));
    lowPriorities = [...document.querySelectorAll('#lowPriorities input:checked')].map(input => Number(input.getAttribute('value')));
    background = Object.fromEntries(Object.keys(backgroundOptions).map(key => [key, [...document.querySelectorAll('[name="' + key + '"]:checked')].map(input => input.getAttribute('value'))]));
    finished = false;
    saveCurrent();
  };
  $('#backAnswers').onclick = () => {
    index = 35;
    $('#priority').classList.add('hidden');
    quiz.classList.remove('hidden');
    saveCurrent();
    renderQuestion();
  };
  $('#finish').onclick = () => {
    if (picks.length !== 3) {
      $('#priorityError').textContent = '请恰好选择 3 个优先方向。';
      return;
    }
    if (lowPriorities.length > 2 || lowPriorities.some(position => picks.includes(position))) {
      $('#priorityError').textContent = '低优先维度最多选 2 项，且不能与重点维度重复。';
      return;
    }
    if (!completeAnswers(answers)) return;
    finished = true;
    saveCurrent();
    renderResult();
  };
}
function scores(kind) { return dimensionScores(answers, kind); }
function rank(values) { return matchPersonas(values).map(item => ({ ...item, match: Math.round(item.match) })); }
function renderResult() {
  const result = assess(answers);
  const advice = resultAdvice(result);
  $('#quizIntro').classList.remove('hidden');
  quiz.classList.add('hidden');
  $('#startBtn').textContent = '调整优先方向与背景 →';
  let editButton = $('#editBtn');
  if (!editButton) {
    editButton = document.createElement('button');
    editButton.id = 'editBtn';
    editButton.className = 'button ghost';
    editButton.textContent = '修改原始回答';
    $('#restartBtn').before(editButton);
  }
  editButton.onclick = () => {
    index = 0;
    finished = false;
    saveCurrent();
    begin();
  };
  let radar = $('#radarOverview');
  if (!radar) {
    radar = document.createElement('div');
    radar.id = 'radarOverview';
    $('#bars').before(radar);
  }
  radar.innerHTML = radarMarkup(result.actual, result.ideal);
  for (const { prefix, ranking, mixed } of [
    { prefix: 'actual', ranking: result.actualRanking, mixed: result.mixedActual },
    { prefix: 'ideal', ranking: result.idealRanking, mixed: result.mixedIdeal },
  ]) {
    const uncertain = prefix === 'ideal' && (result.flatIdeal || result.highIdeal);
    $('#' + prefix + 'Name').textContent = uncertain ? '理想方向，仍在探索' : names[ranking[0].id];
    $('#' + prefix + 'Desc').textContent = uncertain ?
      '当前理想评分区分度不足。下面的人格只是探索候选，先看看哪种描述让你产生共鸣。' : desc[ranking[0].id];
    $('#' + prefix + 'Match').textContent = (uncertain ? '探索候选：' + names[ranking[0].id] + ' · ' : '') +
      '副型：' + names[ranking[1].id] +
      (mixed ? '，两种风格都值得对照。' : '。');
    $('#' + prefix + 'Artwork').innerHTML = overviewArtwork(ranking[0].id);
  }
  $('#resultSummary').textContent = resultSummary(result);
  $('#fullReadings').innerHTML = [
    { mode: 'actual', ranking: result.actualRanking, uncertain: false },
    { mode: 'ideal', ranking: result.idealRanking, uncertain: result.flatIdeal || result.highIdeal },
  ].map(({ mode, ranking, uncertain }) => '<details class="full-reading"><summary>' +
    (mode === 'actual' ? '现在的我' : uncertain ? '理想探索候选' : '想成为的我') + ' · ' + names[ranking[0].id] +
    '<span>展开人物故事与五章解读</span></summary><div class="portrait-content">' +
    portraitMarkup(ranking[0].id, mode, uncertain) + '</div></details>').join('');
  $('#bars').innerHTML = '<p>实线：实际 · 虚线：理想。差距 = 理想 − 实际，不是能力分数。</p>' +
    dimensions.map((dimension, position) =>
      '<details><summary>' + dimension[1] + '：实际 ' + result.actual[position].toFixed(1) +
      ' / 理想 ' + result.ideal[position].toFixed(1) + ' / 差距 ' +
      (result.gaps[position] > 0 ? '+' : '') + result.gaps[position].toFixed(1) +
      '</summary><div class="bar"><i style="width:' + result.actual[position] + '%"></i></div>' +
      '<div class="bar ideal-bar"><i style="width:' + result.ideal[position] + '%"></i></div>' +
      '<p>' + advice.rows[position].context + '</p><p>' + advice.rows[position].meaning +
      '</p><p>行动：' + advice.rows[position].action + '</p></details>').join('');
  const priorities = picks.map(position => dimensions[position][1]).join('、');
  const gapRows = [...advice.rows].sort((first, second) => Math.abs(second.gap) - Math.abs(first.gap)).slice(0, 3);
  $('#advice').innerHTML = '<p><b>你的优先方向：</b>' + priorities + '。这些选择单独保存，不改变分数。</p>' +
    (result.gaps.every(gap => gap === 0) ? '<p>实际与理想完全一致，不存在本模型可见的差距。</p>' :
      gapRows.map(row => '<p><b>' + dimensions[row.position][1] + '</b>：' + row.meaning + ' ' + row.action + '</p>').join('')) +
    advice.tensions.map(tension => '<p><b>资源取舍：</b>' + tension + '</p>').join('') +
    '<p>差距也可能来自时间、资源或选题权限。未提供背景时，无法据此判断原因。</p>' +
    backgroundExplanation(background).map(message => '<p>' + message + '</p>').join('') +
    (lowPriorities.length ? '<p>你暂不重点投入：' + lowPriorities.map(position => dimensions[position][1]).join('、') + '。可为这些任务设置时间上限。</p>' : '');
  $('#result').classList.remove('hidden');
  mountShare(result);
  $('#priority').classList.add('hidden');
  $('#progressText').textContent = '36 / 36';
  $('#progressBar').style.width = '100%';
  drawGraph(result.actualRanking[0].id, result.idealRanking[0].id);
  $('#result').scrollIntoView({ behavior: 'smooth' });
}
const routes=[[13,6,14,15],[5,1,2,4],[7,12,8,0]];let activeRoute=[];
let graphActual = null;
let graphIdeal = null;
let graphTarget = null;
function drawGraph(actualId, idealId, targetId = idealId) {
  graphActual = actualId;
  graphIdeal = idealId;
  graphTarget = targetId;
  const svg = $('#graph');
  svg.setAttribute('role', 'group');
  svg.innerHTML = '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#236b8e"/></marker></defs>';
  const positions = names.map((name, position) => {
    const angle = -Math.PI / 2 + position * 2 * Math.PI / 16;
    return [450 + 350 * Math.cos(angle), 280 + 210 * Math.sin(angle)];
  });
  let plan = null;
  const assessed = finished && completeAnswers(answers) ? assess(answers) : null;
  const idealUncertain = assessed && (assessed.flatIdeal || assessed.highIdeal);
  if (Number.isInteger(actualId) && Number.isInteger(targetId)) {
    const actual = assessed ? assessed.actual : vectors[actualId].map(value => (value - 1) * 25);
    const target = assessed && targetId === idealId ? assessed.ideal : vectors[targetId].map(value => (value - 1) * 25);
    plan = planPath(actualId, targetId, actual, target, picks);
  }
  activeRoute = plan?.nodes || [];
  function addLine(first, second, className) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const [startX, startY] = positions[first];
    const [endX, endY] = positions[second];
    const distance = Math.hypot(endX - startX, endY - startY);
    element.setAttribute('x1', String(startX + (endX - startX) * 29 / distance));
    element.setAttribute('y1', String(startY + (endY - startY) * 29 / distance));
    element.setAttribute('x2', String(endX - (endX - startX) * 30 / distance));
    element.setAttribute('y2', String(endY - (endY - startY) * 30 / distance));
    element.setAttribute('class', className);
    svg.appendChild(element);
  }
  for (let first = 0; first < 16; first++) {
    for (let second = first + 1; second < 16; second++) {
      const difference = vectors[first].reduce((sum, value, position) => sum + Math.abs(value - vectors[second][position]), 0);
      if (difference < 18) addLine(first, second, 'edge');
    }
  }
  for (const edge of plan?.edges || []) addLine(edge.from, edge.to, 'path-edge');
  names.forEach((name, position) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const labels = [
      position === actualId ? '实主' : '',
      position === idealId ? (idealUncertain ? '理候选' : '理主') : '',
      assessed && position === assessed.actualRanking[1].id ? '实副' : '',
      assessed && position === assessed.idealRanking[1].id ? (idealUncertain ? '候选2' : '理副') : '',
      position === targetId ? '目标' : '',
    ].filter(Boolean);
    node.setAttribute('class', 'node ' + (position === actualId ? 'actual ' : '') + (position === idealId ? 'ideal ' : '') + (activeRoute.includes(position) ? 'on-route' : ''));
    node.dataset.id = String(position);
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', name + ' ' + labels.join('、'));
    const [horizontal, vertical] = positions[position];
    node.innerHTML = '<title>' + name + '：' + desc[position] + '</title><circle cx="' + horizontal + '" cy="' + vertical + '" r="25"/>' +
      (position === actualId && position === idealId ? '<circle class="dual-ring" cx="' + horizontal + '" cy="' + vertical + '" r="31"/>' : '') +
      '<text x="' + horizontal + '" y="' + (vertical + 4) + '">P' + String(position + 1).padStart(2, '0') + '</text>' +
      '<text x="' + horizontal + '" y="' + (vertical + 43) + '">' + name + '</text>' +
      '<text x="' + horizontal + '" y="' + (vertical + 57) + '">' + labels.join('·') + '</text>';
    node.onclick = () => selectNode(position);
    node.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(position); }
    };
    svg.appendChild(node);
  });
  const select = $('#targetSelect');
  select.innerHTML = '<option value="">选择一个目标人格</option>' + names.map((name, position) => '<option value="' + position + '">' + name + '</option>').join('');
  select.value = targetId === null ? '' : String(targetId);
  select.onchange = () => {
    if (select.value === '') return;
    if (graphActual === null) { selectNode(Number(select.value)); return; }
    drawGraph(graphActual, graphIdeal, Number(select.value));
  };
  let stages = $('#pathStages');
  if (!stages) { stages = document.createElement('section'); stages.id = 'pathStages'; $('#atlas').appendChild(stages); }
  (assessed ? $('#resultRoute') : $('#atlas')).appendChild(stages);
  stages.innerHTML = plan ?
    '<h3>从 ' + names[actualId] + ' 到 ' + names[targetId] + '</h3><p>' +
    (assessed ? (idealUncertain ? '理想画像区分度不足；当前仅以候选原型探索：' : '测评理想型：') : '示例原型，不是个人测评；示例终点：') +
    names[idealId] + '；当前探索目标：' + names[targetId] + '。路径是启发式建议，不是成长规律或高低等级。</p>' +
    (plan.fallback ? '<p>没有合适的人工设计中间路线，改用维度差距计划：</p>' + plan.changes.slice(0, 3).map(change =>
      '<p>' + dimensions[change.dimension][1] + '：' + (Math.abs(change.gap) < 10 ? '与目标接近，保持并复盘。' : change.gap > 0 ? '增加投入。' + dimensionAdvice[change.dimension][2] : '减少投入，先记录一周用时并设定时间上限。') + '</p>').join('') :
      plan.edges.length ? plan.edges.map((edge, position) =>
        '<article><h4>' + (position + 1) + '. ' + names[edge.from] + ' → ' + names[edge.to] + '</h4><p>' + edge.behavior +
        '；调整维度：' + edge.dimensions.map(dimension => dimensions[dimension][1]).join('、') +
        '。</p><p>行动：' + edge.action + '</p><p>适用前提：' + edge.prerequisite + '；风险：' + edge.obstacle + '。</p></article>').join('') :
        '<p>实际与目标主型相同，无需人为安排类型转变；仍可参考逐维差距调整投入。</p>') +
      '<details><summary>路径成本如何计算</summary><p>每条边成本 =（1 + 当前分数与下一节点所需维度的平均绝对差 / 100 + 0.25 × 下一节点与目标维度的平均绝对差 / 100）× 优先级系数。涉及优先维度时系数为 0.9，否则为 1。使用 Dijkstra 寻找成本最小的有向路线，未使用节点几何距离。所有边都是人工设计假设。</p></details>' :
    '<p>完成测评后可从自己的实际画像规划路径。也可先查看三条示例：</p>' +
      routes.map((route, position) => '<button class="button ghost" data-example="' + position + '">' + route.map(node => names[node]).join(' → ') + '</button>').join('');
  if (plan && !assessed) {
    stages.insertAdjacentHTML('beforeend', '<button class="button ghost" id="returnExamples">返回全部示例</button>');
    $('#returnExamples').onclick = () => drawGraph(null, null);
  }
  stages.querySelectorAll('[data-example]').forEach(button => {
    button.onclick = () => {
      const route = routes[Number(button.dataset.example)];
      drawGraph(route[0], route.at(-1));
    };
  });
  if (Number.isInteger(targetId)) selectNode(targetId);
}
function selectNode(id) {
  if (!Number.isInteger(id) || id < 0 || id >= names.length) return;
  document.querySelectorAll('.node').forEach(node => node.classList.toggle('selected', Number(node.getAttribute('data-id')) === id));
  const detail = personaDetails[id];
  const confusing = vectors.map((profile, position) => ({
    position,
    distance: profile.reduce((sum, value, dimension) => sum + Math.abs(value - vectors[id][dimension]), 0),
  })).filter(item => item.position !== id).sort((first, second) => first.distance - second.distance)[0].position;
  const distinctions = dimensions.map((dimension, position) => ({
    position, difference: vectors[id][position] - vectors[confusing][position],
  })).sort((first, second) => Math.abs(second.difference) - Math.abs(first.difference)).slice(0, 2);
  $('#nodeDetail').innerHTML = '<span class="tag">P' + String(id + 1).padStart(2, '0') + ' · ' + en[id] +
    '</span><h3>' + names[id] + '</h3><p>' + detail.keywords + '</p><p>' + detail.behavior +
    '</p><p><b>优势：</b>' + detail.strength + '</p><p><b>风险：</b>' + detail.risk +
    '</p><p><b>主要维度：</b>' + dimensions.filter((dimension, position) => vectors[id][position] >= 4).map(dimension => dimension[1]).join('、') +
    '</p><p><b>容易混淆：</b>' + names[confusing] + '。在设计原型中，本型的' +
    distinctions.map(item => dimensions[item.position][1] + (item.difference > 0 ? '更突出' : '投入较少')).join('、') +
    '。这些差异不是能力等级。</p>' +
    personaRelations.filter(edge => edge.from === id).map(edge => '<p>可探索 ' + names[edge.to] + '：' + edge.action + '</p>').join('') +
    (id === 12 ? '<p>应用导向不能仅凭工程分数推断；成果偏好只能辅助解释，不能证明转译能力。</p>' : '') +
    '<p><a class="text-link" href="portraits.html#P' + String(id + 1).padStart(2, '0') +
    '">阅读完整人格解读 →</a></p><button class="button primary" id="useTarget">设为探索目标</button>';
  $('#useTarget').onclick = () => {
    if (graphActual === null) {
      $('#nodeDetail').insertAdjacentHTML('beforeend', '<p>请先完成测评以获取个人起点，或查看图谱下方的示例路线。</p>');
      return;
    }
    drawGraph(graphActual, graphIdeal, id);
  };
}
let picks = [];
let lowPriorities = [];
let background = sanitizeBackground({});
let finished = false;
const storageNotice = document.createElement('p');
storageNotice.setAttribute('role', 'status');
$('#test').appendChild(storageNotice);
function saveCurrent() {
  let saved = false;
  try { saved = writeProgress(localStorage, { answers, index, picks, lowPriorities, background, finished }); } catch {}
  storageNotice.textContent = saved ? '已保存在此浏览器。' : '浏览器无法保存，当前仍可答题；离开或刷新将丢失进度。';
}
function begin() {
  $('#result').classList.add('hidden');
  finished = false;
  saveCurrent();
  drawGraph(null, null);
  $('#nodeDetail').innerHTML = '<p>正在修改测评。重新完成后更新个人位置与路线。</p>';
  $('#quizIntro').classList.add('hidden');
  if (index >= 36) { showPriority(); return; }
  quiz.classList.remove('hidden');
  renderQuestion();
}
function resetAssessment() {
  answers = [];
  index = 0;
  picks = [];
  lowPriorities = [];
  background = sanitizeBackground({});
  finished = false;
  let removed = true;
  try { localStorage.removeItem(storageKey); localStorage.removeItem('atlasAnswers'); }
  catch { removed = false; }
  $('#result').classList.add('hidden');
  $('#quizIntro').classList.remove('hidden');
  $('#priority').classList.add('hidden');
  quiz.classList.add('hidden');
  $('#progressText').textContent = '0 / 36';
  $('#progressBar').style.width = '0%';
  $('#startBtn').textContent = '进入第一题 →';
  storageNotice.textContent = removed ? '当前测评已清空。' : '会话内测评已清空，但无法删除浏览器存储。请在浏览器设置中清除此站点数据。';
  $('#nodeDetail').innerHTML = '<p>点击任意节点开始探索。</p>';
  drawGraph(null, null);
  location.hash = 'test';
}
$('#startBtn').onclick = begin;
$('#restartBtn').onclick = resetAssessment;
const clearButton = document.createElement('button');
clearButton.className = 'button ghost';
clearButton.textContent = '清空本地测评数据';
clearButton.onclick = resetAssessment;
$('#about').appendChild(clearButton);
let restored = null;
try { restored = readProgress(localStorage); } catch {}
if (restored) {
  answers = restored.answers;
  index = restored.index;
  picks = restored.picks;
  lowPriorities = restored.lowPriorities;
  background = restored.background;
  finished = restored.finished;
  $('#startBtn').textContent = finished ? '修改已保存的回答 →' : '继续上次测评 →';
  $('#progressText').textContent = answers.filter(answer => validRating(answer?.a) && validRating(answer?.i)).length + ' / 36';
}
drawGraph(null,null);
mountCharacterShowcase();
if (finished) renderResult();
mountGraphControls();
mountMethodology();
const repositoryLink = /** @type {HTMLAnchorElement} */ (document.querySelector('footer a'));
if (/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(siteConfig.repositoryUrl)) {
  repositoryLink.href = siteConfig.repositoryUrl;
  repositoryLink.textContent = '查看源码 · 欢迎 Star';
} else {
  repositoryLink.removeAttribute('href');
  repositoryLink.textContent = '仓库地址待配置';
}
