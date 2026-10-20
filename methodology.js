function mountMethodology() {
  const section = document.createElement('details');
  section.className = 'methodology';
  section.innerHTML = '<summary>查看测评方法与全部原型参数</summary>' +
    '<p>实际画像描述过去六个月的行为，理想画像描述未来希望投入的工作方式，不是隐藏天赋。时间和资源有限，所有维度都高并不意味着更优秀。</p>' +
    '<p>每维 3 题：分数 =（均分 − 1）× 25。原型向量同样从 1–5 映射到 0–100。相似度 = 100 − 十二维均方根距离；它不是概率、人口百分位或能力分数。</p>' +
    '<p>前两名相差小于 3 分时提示混合特征。理想维度极差小于 10，或均值至少 90 且极差不超过 25 时提示区分度不足。阈值属于未经样本校准的设计规则。</p>' +
    '<p>灰线连接原型绝对差总和小于 18 的类型，表示设计相似关系，不是统计相关。蓝箭头来自人工设计的行为转变边；路径按个人分数、目标和优先维度计算成本，详见路线下方规则。</p>' +
    '<p>研究阶段、资源限制与成果偏好不参与类型评分。应用偏好只辅助解释，不证明能力。原型没有统一高低等级，路径不是经纵向研究验证的演化规律。</p>' +
    '<p>种子题库和原型尚无信度、效度或常模证据，仍存在社会赞许偏差。测评不用于精神健康诊断、科研能力评价或职业成功预测，与 MBTI 官方没有关系。</p>' +
    '<p>参数按以下维度顺序排列：' + dimensions.map(dimension => dimension.join(' ')).join('；') + '。</p>' +
    '<div class="parameter-table"><table><caption>16 × 12 原型参数（1–5）</caption><thead><tr><th>人格</th>' +
    dimensions.map(dimension => '<th scope="col">' + dimension[0] + '</th>').join('') +
    '</tr></thead><tbody>' + vectors.map((profile, position) => '<tr><th scope="row">' + names[position] + '</th>' +
      profile.map(value => '<td>' + value + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  document.querySelector('#about').appendChild(section);
}
