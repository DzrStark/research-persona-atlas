function shareImageSource(id) {
  const code = 'P' + String(id + 1).padStart(2, '0');
  const source = shareIllustrations[code];
  if (!source) throw new Error('未找到对应人物插画，请刷新页面后重试。');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
}

function loadShareImage(id) {
  return new Promise((resolve, reject) => {
    const illustration = new Image();
    const timeout = setTimeout(() => reject(new Error('人物插画加载超时，请重试。')), 10000);
    illustration.onload = () => { clearTimeout(timeout); resolve(illustration); };
    illustration.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('人物插画加载失败，请刷新页面后重试。'));
    };
    illustration.src = shareImageSource(id);
  });
}

async function loadShareImages(result) {
  const ids = [...new Set([result.actualRanking[0].id, result.idealRanking[0].id])];
  const images = await Promise.all(ids.map(async id => [id, await loadShareImage(id)]));
  return Object.fromEntries(images);
}

function drawShareCard(canvas, result, url, illustrations, includeChapters = true) {
  canvas.width = 1080;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持图片绘制。');
  const operations = [];
  let cursor = 74;
  const font = (size, bold = false) => (bold ? '700 ' : '') + size + 'px system-ui, "Microsoft YaHei", sans-serif';
  const paragraph = (text, size = 28, color = '#435565', bold = false, horizontal = 96, width = 888) => {
    context.font = font(size, bold);
    let line = '';
    const lines = [];
    for (const character of text) {
      if (character === '\n') { lines.push(line); line = ''; continue; }
      if (line && context.measureText(line + character).width > width) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
    if (line) lines.push(line);
    for (const content of lines) {
      operations.push({ kind: 'text', content, horizontal, vertical: cursor + size, size, color, bold });
      cursor += Math.ceil(size * 1.65);
    }
  };
  paragraph('RESEARCH PERSONA ATLAS', 25, '#236b8e', true, 64, 952);
  cursor += 6;
  paragraph('我的科研人格', 54, '#172330', true, 64, 952);
  paragraph('研究有很多种打开方式，这是我的这一种。', 25, '#63767c', false, 64, 952);
  cursor += 24;

  const addPortrait = (mode, ranking, mixed, uncertain) => {
    const id = ranking[0].id;
    if (!illustrations?.[id]) throw new Error('分享卡缺少人物插画，请重新生成。');
    const portrait = personaPortraits[id];
    const top = cursor;
    const panel = { kind: 'panel', top, height: 0, color: mode === 'actual' ? '#f7f3e9' : '#edf4f1' };
    operations.push(panel);
    cursor += 55;
    paragraph(mode === 'actual' ? 'ACTUAL / 实际画像' : 'ASPIRATIONAL / 理想画像', 23, '#526c72', true);
    cursor += 6;
    paragraph(uncertain ? '理想中的我，还在探索' :
      (mode === 'actual' ? '我是' : '我向往成为') + names[id], 44, '#17354a', true);
    paragraph(uncertain ? '候选：' + names[id] + ' · ' + names[ranking[1].id] :
      '副型：' + names[ranking[1].id] + ' · ' + en[id], 24, '#526c72');
    if (mixed) paragraph('两种风格比较接近，呈现混合特征。', 23, '#526c72');
    if (uncertain) paragraph('理想画像区分度不足，下面仅是探索候选，并不是确定的人格标签。', 24, '#526c72');
    cursor += 12;
    operations.push({ kind: 'image', id, horizontal: 210, vertical: cursor, width: 660, height: 495 });
    cursor += 535;
    paragraph('「' + portrait.motto + '」', 32, '#17354a', true);
    cursor += 12;
    if (mode === 'ideal' && !uncertain) paragraph('这是我希望靠近的研究状态，不代表现在已经如此。', 24, '#526c72');
    paragraph(mode === 'actual' ? portrait.story : portrait.story.replace(/^你是/, '这个角色是'));
    cursor += 16;
    paragraph('科研日常里的小剧场', 25, '#17354a', true);
    paragraph(portrait.scene, 26);
    cursor += 14;
    paragraph('这个角色带来的东西', 25, '#17354a', true);
    paragraph(portrait.gift, 26);
    cursor += 14;
    paragraph('给这个角色的小提醒', 25, '#17354a', true);
    paragraph(portrait.trap, 26);
    if (includeChapters) {
      for (const [title, body] of portraitChapters[id]) {
        cursor += 22;
        paragraph(title, 27, '#17354a', true);
        paragraph(body, 26);
      }
    }
    cursor += 18;
    panel.height = cursor - top;
    cursor += 30;
  };
  addPortrait('actual', result.actualRanking, result.mixedActual, false);
  addPortrait('ideal', result.idealRanking, result.mixedIdeal, result.flatIdeal || result.highIdeal);
  paragraph('角色没有高低等级，也不定义我的全部。', 26, '#17354a', true, 64, 952);
  paragraph('研究风格自省工具 · 不是能力评价或心理诊断', 23, '#526c72', false, 64, 952);
  cursor += 10;
  paragraph(url, 22, '#236b8e', false, 64, 952);
  canvas.height = Math.ceil(cursor + 54);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const operation of operations) {
    if (operation.kind === 'panel') {
      context.fillStyle = operation.color;
      context.fillRect(48, operation.top, 984, operation.height);
    } else if (operation.kind === 'image') {
      context.drawImage(illustrations[operation.id], operation.horizontal, operation.vertical, operation.width, operation.height);
    } else {
      context.font = font(operation.size, operation.bold);
      context.fillStyle = operation.color;
      context.fillText(operation.content, operation.horizontal, operation.vertical);
    }
  }
}

function shareText(context, content, horizontal, vertical, width, size, maxHeight, color = '#234b45', bold = false) {
  let lines;
  let lineHeight;
  do {
    context.font = (bold ? '700 ' : '') + size + 'px "Microsoft YaHei", system-ui, sans-serif';
    lines = [];
    let line = '';
    for (const character of content) {
      if (character === '\n') { lines.push(line); line = ''; continue; }
      if (line && context.measureText(line + character).width > width) { lines.push(line); line = ''; }
      line += character;
    }
    if (line) lines.push(line);
    lineHeight = Math.ceil(size * 1.5);
    if (lines.length * lineHeight <= maxHeight || size <= 12) break;
    size--;
  } while (true);
  context.fillStyle = color;
  lines.forEach((line, position) => context.fillText(line, horizontal, vertical + size + position * lineHeight));
  return vertical + lines.length * lineHeight;
}

function drawSocialCard(canvas, result, url, illustrations) {
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持图片绘制。');
  const panel = (horizontal, vertical, width, height, color, radius = 24) => {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(horizontal, vertical, width, height, radius);
    context.fill();
  };
  context.fillStyle = '#f8f7f2';
  context.fillRect(0, 0, 1080, 1350);
  panel(60, 60, 44, 44, '#234b45', 12);
  panel(70, 71, 10, 23, '#e9bf8f', 4);
  panel(84, 71, 10, 23, '#9dcbbd', 4);
  shareText(context, 'RESEARCH PERSONA ATLAS', 122, 65, 880, 24, 45, '#387b6d', true);
  shareText(context, '我的科研双重人格', 60, 128, 960, 62, 100, '#234b45', true);
  shareText(context, '研究有很多种打开方式，这是我的这一种。', 64, 214, 952, 25, 45, '#63736e');
  for (const [position, mode] of ['actual', 'ideal'].entries()) {
    const ranking = mode === 'actual' ? result.actualRanking : result.idealRanking;
    const id = ranking[0].id;
    if (!illustrations?.[id]) throw new Error('分享卡缺少人物插画，请重新生成。');
    const mixed = mode === 'actual' ? result.mixedActual : result.mixedIdeal;
    const uncertain = mode === 'ideal' && (result.flatIdeal || result.highIdeal);
    const horizontal = 60 + position * 490;
    panel(horizontal, 292, 470, 620, mode === 'actual' ? '#f2e6d2' : '#e1eee6');
    shareText(context, mode === 'actual' ? '01 / 现在的我' : '02 / 想成为的我', horizontal + 28, 316, 414, 24, 44, mode === 'actual' ? '#94623d' : '#387b6d', true);
    shareText(context, uncertain ? '理想方向，仍在探索' : names[id], horizontal + 28, 367, 414, 45, 68, '#234b45', true);
    shareText(context, (uncertain ? '候选：' + names[id] + ' / ' : '副型：') + names[ranking[1].id], horizontal + 28, 437, 414, 22, 66, '#526a60');
    context.drawImage(illustrations[id], horizontal + 35, 512, 400, 300);
    shareText(context, personaPortraits[id].motto, horizontal + 28, 806, 414, 25, 80, '#234b45', true);
    if (uncertain || mixed) shareText(context, uncertain ? '仅作探索候选，理想区分度不足' : '主副型接近 · 可以一起对照', horizontal + 28, 886, 414, 17, 26, '#526a60');
  }
  shareText(context, '两张画像之间', 64, 946, 952, 22, 38, '#387b6d', true);
  shareText(context, resultSummary(result), 64, 993, 952, 27, 132, '#234b45');
  context.fillStyle = '#d6dfd3';
  context.fillRect(64, 1154, 952, 1);
  shareText(context, '你又是哪种科研人格？', 64, 1175, 952, 35, 60, '#234b45', true);
  let address = url.replace(/^https?:\/\//, '');
  if (address.length > 100) {
    try { address = new URL(url).host + '/…'; } catch { address = address.slice(0, 96) + '…'; }
  }
  shareText(context, address, 64, 1235, 952, 23, 55, '#387b6d');
  shareText(context, '科研人格图谱 · 研究风格自省，不是能力评价或心理诊断', 64, 1300, 952, 19, 32, '#63736e');
}

function mountShare(result) {
  let section = document.querySelector('#shareCard');
  if (!section) {
    section = document.createElement('section');
    section.id = 'shareCard';
    document.querySelector('#shareSlot').appendChild(section);
  }
  section.innerHTML = '<h3>把这两个自己，放进一张卡片。</h3><p>发给同门，看看谁会说「这也太像你了」。图片在本地生成，不包含原始回答或背景信息。</p><fieldset class="share-options"><legend>选择图片样式</legend><label><input type="radio" name="shareFormat" value="social" checked> 社交卡 · 4:5 双画像</label><label><input type="radio" name="shareFormat" value="report"> 完整报告长图 · 收藏细读</label></fieldset><div class="share-actions"><button class="button primary" id="createShare">生成我的科研人格卡 →</button><button class="button ghost" id="copySiteLink">复制测评链接</button></div><p id="shareStatus" role="status"></p><div id="sharePreview"></div>';
  const siteAddress = () => {
    const address = new URL(location.href);
    address.search = '';
    address.hash = '';
    return siteConfig.publicUrl || address.href;
  };
  document.querySelector('#copySiteLink').addEventListener('click', async () => {
    const status = document.querySelector('#shareStatus');
    try {
      await navigator.clipboard.writeText(siteAddress());
      status.textContent = '测评链接已复制；链接不含你的个人结果。';
    } catch {
      status.textContent = '请手动复制测评链接：' + siteAddress();
    }
  });
  section.querySelectorAll('[name="shareFormat"]').forEach(input => input.addEventListener('change', () => {
    document.querySelector('#sharePreview').replaceChildren();
    document.querySelector('#shareStatus').textContent = '样式已切换，请重新生成预览。';
  }));
  document.querySelector('#createShare').addEventListener('click', async () => {
    const status = document.querySelector('#shareStatus');
    const button = /** @type {HTMLButtonElement} */ (document.querySelector('#createShare'));
    button.disabled = true;
    status.textContent = '正在加载人物插画并排版……';
    document.querySelector('#sharePreview').replaceChildren();
    try {
      const report = /** @type {HTMLInputElement} */ (document.querySelector('[name="shareFormat"]:checked')).value === 'report';
      section.querySelectorAll('input').forEach(input => { input.disabled = true; });
      await document.fonts.ready;
      const illustrations = await loadShareImages(result);
      const canvas = document.createElement('canvas');
      if (report) drawShareCard(canvas, result, siteAddress(), illustrations, true);
      else drawSocialCard(canvas, result, siteAddress(), illustrations);
      const preview = document.querySelector('#sharePreview');
      preview.replaceChildren(canvas);
      canvas.style.width = 'min(100%, 540px)';
      canvas.style.height = 'auto';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', (report ? '完整报告长图' : '科研双画像社交卡') + '预览：' + resultSummary(result));
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('无法生成图片，请重试。');
      const file = new File([blob], 'research-persona-atlas.png', { type: 'image/png' });
      const save = document.createElement('button');
      save.className = 'button primary';
      save.textContent = '保存 PNG';
      save.onclick = () => {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      };
      preview.appendChild(save);
      if (navigator.canShare?.({ files: [file] })) {
        const native = document.createElement('button');
        native.className = 'button ghost';
        native.textContent = '系统分享 / 保存到手机';
        native.onclick = async () => {
          try { await navigator.share({ files: [file], title: '科研人格图谱' }); }
          catch (error) { if (error.name !== 'AbortError') status.textContent = '系统分享不可用，请使用保存 PNG。'; }
        };
        preview.appendChild(native);
      }
      status.textContent = (report ? '完整报告长图' : '1080 × 1350 社交卡') + '已生成，预览后可保存。';
    } catch (error) {
      status.textContent = error.message || '生成失败，请更换浏览器重试。';
    } finally {
      button.disabled = false;
      section.querySelectorAll('input').forEach(input => { input.disabled = false; });
    }
  });
}
