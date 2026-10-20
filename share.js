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

function mountShare(result) {
  let section = document.querySelector('#shareCard');
  if (!section) {
    section = document.createElement('section');
    section.id = 'shareCard';
    document.querySelector('#result').appendChild(section);
  }
  section.innerHTML = '<h3>分享我的科研人格</h3><p>将实际与理想的人物插画、台词和人格介绍一起保存为长图。先预览再保存；不包含原始回答、背景、资源限制或优先维度。</p><p><label><input type="checkbox" id="shareFullStory" checked> 包含完整五章解读（取消勾选可生成精简版）</label></p><button class="button primary" id="createShare">生成新版 PNG 人格长图</button><p id="shareStatus" role="status"></p><div id="sharePreview"></div>';
  document.querySelector('#createShare').addEventListener('click', async () => {
    const status = document.querySelector('#shareStatus');
    const button = /** @type {HTMLButtonElement} */ (document.querySelector('#createShare'));
    button.disabled = true;
    status.textContent = '正在加载人物插画并排版……';
    document.querySelector('#sharePreview').replaceChildren();
    try {
      await document.fonts.ready;
      const illustrations = await loadShareImages(result);
      const canvas = document.createElement('canvas');
      const address = new URL(location.href);
      address.search = '';
      address.hash = '';
      const includeChapters = /** @type {HTMLInputElement} */ (document.querySelector('#shareFullStory')).checked;
      drawShareCard(canvas, result, siteConfig.publicUrl || address.href, illustrations, includeChapters);
      const preview = document.querySelector('#sharePreview');
      preview.replaceChildren(canvas);
      canvas.style.width = 'min(100%, 540px)';
      canvas.style.height = 'auto';
      canvas.setAttribute('aria-label', '科研人格分享卡预览');
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
      status.textContent = '预览已生成，检查后可保存。';
    } catch (error) {
      status.textContent = error.message || '生成失败，请更换浏览器重试。';
    } finally {
      button.disabled = false;
    }
  });
}
