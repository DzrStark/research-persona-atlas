function radarMarkup(actual, ideal) {
  const point = (value, position, radius = 150) => {
    const angle = position * Math.PI / 6 - Math.PI / 2;
    return [230 + Math.cos(angle) * radius * value / 100, 220 + Math.sin(angle) * radius * value / 100];
  };
  const polygon = (values, radius = 150) => values.map((value, position) => point(value, position, radius).join(',')).join(' ');
  const rings = [25, 50, 75, 100].map(value =>
    '<polygon points="' + polygon(Array(12).fill(value)) + '" fill="none" stroke="#cbd6dd"/>').join('');
  const axes = dimensions.map((dimension, position) => {
    const [horizontal, vertical] = point(100, position);
    const [labelX, labelY] = point(100, position, 182);
    return '<line x1="230" y1="220" x2="' + horizontal + '" y2="' + vertical + '" stroke="#dce4e9"/>' +
      '<text x="' + labelX + '" y="' + (labelY + 4) + '" text-anchor="middle" font-size="12" fill="#172330">' + dimension[1] + '</text>';
  }).join('');
  return '<svg viewBox="0 0 460 440" role="img" aria-label="实际与理想的十二维雷达总览；下方可查看每维精确分数">' +
    rings + axes + '<polygon points="' + polygon(actual) + '" fill="#236b8e22" stroke="#236b8e" stroke-width="2"/>' +
    '<polygon points="' + polygon(ideal) + '" fill="none" stroke="#a34e1e" stroke-dasharray="6 4" stroke-width="2"/>' +
    '</svg><p>蓝色实线：实际 · 棕色虚线：理想。各圈依次为 25、50、75、100。图形面积不代表能力或成熟度。</p>';
}
