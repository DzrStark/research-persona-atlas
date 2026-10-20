const personaRelations = [
  { from: 13, to: 6, dimensions: [5], behavior: '从使用成熟结果转向检验结果', obstacle: '复现环境或数据不可得', prerequisite: '选取可公开复现的工作', action: '复现一个核心表格，记录偏差和失败设置。' },
  { from: 6, to: 14, dimensions: [10, 0], behavior: '从核验结论转向检查前提', obstacle: '容易把实验偏差误认为范式错误', prerequisite: '有至少一组可靠的对照证据', action: '把一个复现差异改写为关键假设，并设计反例。' },
  { from: 14, to: 15, dimensions: [11, 4], behavior: '从批判转向一般解释', obstacle: '抽象解释可能脱离证据', prerequisite: '能陈述至少两个待统一的现象', action: '提出共同机制，推导一项尚未测试的预测。' },
  { from: 5, to: 1, dimensions: [1], behavior: '保留稳健主线并扩大机会判断', obstacle: '信息过载打断原有研究', prerequisite: '每周可保留固定阅读窗口', action: '对三篇新论文比较问题价值、证据质量和切入成本。' },
  { from: 1, to: 2, dimensions: [6, 7], behavior: '把机会判断转为快速实验', obstacle: '频繁切换方向或算力排队', prerequisite: '能获得小实验资源并设置反馈节点', action: '选择一个机会，拆成一周内可完成的基线实验。' },
  { from: 2, to: 4, dimensions: [3, 0], behavior: '在交付之外留出探索预算', obstacle: '高风险研究不能保证短期产出', prerequisite: '有明确时间预算和停止条件', action: '分配不超过本周五分之一时间测试一个高不确定假设。' },
  { from: 7, to: 12, dimensions: [9, 0], behavior: '从工具功能转向真实需求', obstacle: '把功能数量误作需求价值', prerequisite: '能够接触使用场景或公开案例', action: '分析三个使用案例，写出其共同的未满足需求。' },
  { from: 12, to: 8, dimensions: [8, 9], behavior: '从单一需求转向系统协同', obstacle: '系统范围扩大导致难以归因', prerequisite: '明确组件接口和系统验收目标', action: '连接两个最小组件，设置端到端指标和模块消融。' },
  { from: 8, to: 0, dimensions: [0, 10], behavior: '从系统瓶颈重构研究问题', obstacle: '工程困难不一定是科学问题', prerequisite: '已有反复出现的系统瓶颈证据', action: '区分实现缺陷与共性限制，将一个限制转成可检验问题。' },
  { from: 3, to: 15, dimensions: [11], behavior: '从问题深度形成可迁移解释', obstacle: '个别现象难以支持普遍机制', prerequisite: '拥有多个条件下的观察', action: '整理共性与例外，限定理论的适用边界。' },
  { from: 11, to: 3, dimensions: [5, 11], behavior: '把持续积累转成机制理解', obstacle: '材料积累却缺少分析问题', prerequisite: '有可整理的长期记录', action: '选一组异常结果，集中分析其机制。' },
  { from: 9, to: 0, dimensions: [0], behavior: '把自主主线转成清晰的问题定义', obstacle: '独立判断缺少外部校验', prerequisite: '愿意邀请同行质询', action: '写一页问题陈述，向两位同行征求反例。' },
  { from: 10, to: 8, dimensions: [8], behavior: '把合作网络组织成研究系统', obstacle: '成员接口和责任不明确', prerequisite: '已达成共同研究目标', action: '画模块接口并为每个接口约定输入、输出和验收样例。' },
  { from: 0, to: 4, dimensions: [3, 7], behavior: '为新问题寻找低成本验证', obstacle: '问题范围太大', prerequisite: '可提出一个最小预测', action: '用最小数据子集检验新问题的首个假设。' },
  { from: 4, to: 6, dimensions: [5], behavior: '把探索线索转成可信证据', obstacle: '选择性报告成功结果', prerequisite: '保留实验记录及失败设置', action: '重复探索中的关键结果并加入对照。' },
  { from: 6, to: 3, dimensions: [4, 11], behavior: '从证据异常深入机制', obstacle: '验证任务占据所有时间', prerequisite: '已有可重复的异常现象', action: '围绕一个异常持续两周排查解释。' },
  { from: 1, to: 9, dimensions: [2, 4], behavior: '从追踪动态形成独立主线', obstacle: '外部热点频繁改变优先级', prerequisite: '有一定选题协商空间', action: '比较三个方向后确定一个季度主线和退出条件。' },
];

function edgeCost(edge, actual, target, priorities = []) {
  const effort = edge.dimensions.reduce((sum, dimension) =>
    sum + Math.abs((vectors[edge.to][dimension] - 1) * 25 - actual[dimension]) / 100, 0) / edge.dimensions.length;
  const alignment = edge.dimensions.reduce((sum, dimension) =>
    sum + Math.abs((vectors[edge.to][dimension] - 1) * 25 - target[dimension]) / 100, 0) / edge.dimensions.length;
  const priorityFactor = edge.dimensions.some(dimension => priorities.includes(dimension)) ? 0.9 : 1;
  return (1 + effort + 0.25 * alignment) * priorityFactor;
}

function planPath(start, goal, actual, target, priorities = [], relations = personaRelations) {
  if (![start, goal].every(value => Number.isInteger(value) && value >= 0 && value < 16)) throw new Error('无效的人格节点。');
  if ([actual, target].some(values => !Array.isArray(values) || values.length !== 12 || values.some(value => !Number.isFinite(value) || value < 0 || value > 100))) throw new Error('无效的维度向量。');
  const costs = Array(16).fill(Infinity);
  const previous = Array(16).fill(null);
  const remaining = new Set(Array.from({ length: 16 }, (value, index) => index));
  costs[start] = 0;
  while (remaining.size) {
    const current = [...remaining].sort((first, second) => costs[first] - costs[second] || first - second)[0];
    if (!Number.isFinite(costs[current]) || current === goal) break;
    remaining.delete(current);
    for (const edge of relations.filter(relation => relation.from === current && remaining.has(relation.to))) {
      const candidate = costs[current] + edgeCost(edge, actual, target, priorities);
      if (candidate < costs[edge.to]) {
        costs[edge.to] = candidate;
        previous[edge.to] = edge;
      }
    }
  }
  const changes = target.map((value, dimension) => ({ dimension, gap: value - actual[dimension] }))
    .sort((first, second) => Math.abs(second.gap) - Math.abs(first.gap));
  if (!Number.isFinite(costs[goal])) return { nodes: [], edges: [], changes, cost: null, fallback: true };
  const edges = [];
  let current = goal;
  while (current !== start) {
    const edge = previous[current];
    edges.unshift(edge);
    current = edge.from;
  }
  return { nodes: [start, ...edges.map(edge => edge.to)], edges, changes, cost: costs[goal], fallback: false };
}
