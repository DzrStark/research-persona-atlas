const backgroundOptions = {
  stage: ['本科', '硕士', '博士', '博士后', '研究机构', '工业界研究者', '其他', '不愿透露'],
  outcomes: ['理论机制', '算法方法', '评测基准', '数据集与工具', '系统工程', '现实应用'],
  constraints: ['时间不足', '算力或数据不足', '方法储备不足', '导师或团队支持不足', '选题自主权有限', '实验反馈周期过长', '其他'],
  improvements: ['选题质量', '执行速度', '论文质量', '研究深度', '创新程度', '科研协作'],
};

function sanitizeBackground(value) {
  const input = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.entries(backgroundOptions).map(([key, options]) => [
    key, Array.isArray(input[key]) ? [...new Set(input[key])].filter(item => options.includes(item)) : [],
  ]));
}

function backgroundForm(background) {
  const labels = { stage: '当前研究阶段', outcomes: '偏好的成果类型', constraints: '当前主要限制', improvements: '当前最想改善的问题' };
  return '<details><summary>可选：研究背景（可全部跳过，不参与人格评分）</summary>' +
    Object.entries(backgroundOptions).map(([key, options]) => '<fieldset><legend>' + labels[key] +
      '</legend>' + options.map(option => '<label class="background-option"><input type="' + (key === 'stage' ? 'radio' : 'checkbox') +
        '" name="' + key + '" value="' + option + '" ' + (background[key].includes(option) ? 'checked' : '') + '>' + option + '</label>').join('') + '</fieldset>').join('') +
    '<p>背景仅帮助解释，不进入原型评分，不会放入分享图片或网址。</p></details>';
}

function backgroundExplanation(background) {
  const messages = [];
  if (background.constraints.length) messages.push('你选择的限制为：' + background.constraints.join('、') + '。这些是自报条件，不证明差距的因果来源；可优先协商任务范围、资源或反馈周期。');
  if (background.outcomes.includes('现实应用')) messages.push('你偏好现实应用，可额外探索应用转译者。此偏好不改变类型排名，也不能证明你已具备应用转译能力；工程分低不会排除这种兴趣。');
  if (background.improvements.length) messages.push('你想改善：' + background.improvements.join('、') + '。可用其中一项作为两周行动的复盘目标。');
  return messages;
}
