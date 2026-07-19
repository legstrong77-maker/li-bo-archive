(() => {
  const data = window.ARCHIVE_DATA || { resources: [], timeline: [] };
  const hostedDocumentBase = 'https://github.com/legstrong77-maker/li-bo-archive/releases/download/v1.0-content/';
  const isGitHubPages = typeof location !== 'undefined' && location.hostname.endsWith('github.io');
  const resources = (data.resources || []).map((item) => {
    if (isGitHubPages && item.localFile?.startsWith('assets/documents/')) {
      return { ...item, localFile: `${hostedDocumentBase}${item.localFile.split('/').pop()}` };
    }
    return item;
  });
  const timeline = data.timeline || [];
  const state = { kind: 'all', category: 'all', query: '', visible: 12, timelineYear: 'all' };
  const typeLabels = { document: '文件 DOCUMENT', video: '影音 VIDEO', link: '連結 LINK' };
  const kindNames = { document: '文件', video: '影音', link: '外部連結' };
  const categoryNames = { '旅行與山': '旅行與山', '工作與人': '工作與人', '科技與時代': '科技與時代', '生活觀察': '生活觀察' };

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const formatDate = (date) => date.replaceAll('.', ' / ');
  const getFiltered = () => resources.filter((item) => {
    const haystack = `${item.title} ${item.note} ${item.date} ${item.category}`.toLowerCase();
    return (state.kind === 'all' || item.kind === state.kind)
      && (state.category === 'all' || item.category === state.category)
      && (!state.query || haystack.includes(state.query.toLowerCase()));
  });

  const makeTimelineBrief = (entry) => {
    const linked = entry.links.map((url) => resources.find((item) => item.url === url)).filter(Boolean);
    const titles = linked.map((item) => item.title).filter(Boolean);
    const cleanTitles = titles.map((title) => title.replace(/\.(pdf|docx?)$/i, '').trim());
    const text = entry.text.filter((value) => !value.startsWith('http')).join(' ');
    const joined = `${cleanTitles.join(' ')} ${text}`;
    const day = joined.match(/Day\s*([1-9][0-9]?)/i)?.[1] || '';
    let topic = titles[0] || '生活札記';
    let summary = '';
    let outline = [];

    if (/甘卓萬/.test(joined)) {
      const dayMap = {
        1: ['甘卓萬群峰｜行程規劃與出發', '整理登山計畫、路線背景與出發前的準備，讓一次高山行走先從計畫開始。', ['路線與行程安排', '登山準備與交通', '同行者的出發心情']],
        2: ['甘卓萬群峰｜進山與十粒溪營地', '記錄進入山徑後的林道、里程與營地選擇，也把體力分配和山路變化放進當日筆記。', ['進山路線與林道', '十粒溪營地與里程', '體力和安全判斷']],
        3: ['甘卓萬群峰｜東西燒焦了', '聚焦行程中突發的疲憊與不順，從「燒焦」的插曲看見山行最真實的狼狽與調整。', ['當日山況與突發狀況', '隊伍節奏的調整', '把挫折寫成記憶']],
        4: ['甘卓萬群峰｜低溫與霧雨', '在低溫、霧雨與視線受限的條件下前進，記錄山友如何保持節奏、互相照應。', ['天候與路況', '保暖和行走策略', '同行者之間的信賴']],
        5: ['甘卓萬群峰｜恐懼的總和', '把高山裡累積的恐懼、疲勞與不確定攤開來看，也記錄繼續前進所需要的判斷。', ['恐懼與體力極限', '風險判斷', '堅持前進的理由']],
        6: ['甘卓萬群峰｜造林大鐵牌', '從山徑上的標誌與造林痕跡，回看人與山林如何留下彼此的記號。', ['路標與山林記憶', '當日路線紀錄', '行走中的觀察']],
        7: ['甘卓萬群峰｜擁抱栗栖溪', '以抵達栗栖溪作為收束，整理完成縱走後的身體感、景色與隊伍共同走過的路。', ['最後一段路程', '溪谷與自然景色', '完成行程後的回望']],
      }[Number(day)];
      if (dayMap) [topic, summary, outline] = dayMap;
      else {
        topic = '甘卓萬縱走｜冷靜與信賴';
        summary = '用年末的一段登山回望，記錄面對斷崖與十八連峰時，隊伍如何靠冷靜、信賴與堅持走過不安。';
        outline = ['斷崖與十八連峰的挑戰', '隊伍如何處理擔心與懷疑', '2024 年的堅持與新年展望'];
      }
    } else if (/南湖中央尖/.test(joined)) {
      topic = `南湖中央尖｜Day ${day || '行程'} 的山行紀錄`;
      summary = `整理南湖中央尖縱走第 ${day || '一'} 天的路線、營地與山況，將當日行走節奏和同行者的感受留在一頁裡。`;
      outline = ['當日路線與山屋／營地', '天候、地形與體力', '同行者的行走筆記'];
    } else if (/爸爸帶我去南極/.test(joined)) {
      topic = `爸爸帶我去南極｜第 ${day || '一'} 章`;
      summary = `以圖文旅行日誌記錄南極行程第 ${day || '一'} 章，從沿途景色、船上生活到父子同行，把遠方寫成可以回看的記憶。`;
      outline = ['旅程路線與當日見聞', '南極景色與影像', '父子同行的生活片段'];
    } else if (/爸爸帶我去澳洲/.test(joined)) {
      topic = `爸爸帶我去澳洲｜第 ${day || '一'} 章`;
      summary = `整理澳洲旅行第 ${day || '一'} 章的行程與觀察，在城市、自然景觀和移動之間，留下家人一起旅行的節奏。`;
      outline = ['澳洲行程與地點', '沿途景色與照片', '家人同行的旅行感受'];
    } else if (/爸爸帶我去摩洛哥/.test(joined)) {
      topic = `爸爸帶我去摩洛哥｜第 ${day || '一'} 章`;
      summary = `從摩洛哥旅行第 ${day || '一'} 章出發，整理當地街景、文化與移動經驗，也保留旅行中意外遇見的人事物。`;
      outline = ['旅行路線與城市風景', '文化觀察與生活細節', '家人同行的旅行片段'];
    } else if (/關山嶺山/.test(joined)) {
      topic = '關山嶺山｜老友間的約定';
      summary = '以一次和老朋友的登山約定為主軸，記錄重新上路、一起看山，以及多年情誼如何在行走中延續。';
      outline = ['約定與行程背景', '山路和沿途風景', '老朋友的同行記憶'];
    } else if (/公益|年終手冊/.test(joined)) {
      topic = '工作與公益｜把一年交代給一起走的人';
      summary = '回顧公司一年來的公益參與、部門工作與全廠活動，重點不只在成果，也在於讓每個人知道自己身處的團隊正在做什麼。';
      outline = ['年度工作與部門報告', '公益活動與社會參與', '企業文化與共同記憶'];
    } else if (/教學週記/.test(joined)) {
      const week = joined.match(/第\s*([0-9]+)\s*週/);
      topic = `教學週記｜2025／2026 第 ${week?.[1] || ''} 週`;
      summary = '把一週的教學現場整理成可回看的筆記，包含班級經營、學生互動、課程觀察與教師自己的反思。';
      outline = ['本週教學事件', '學生與班級觀察', '下一週的調整方向'];
    } else if (/品質保證/.test(joined)) {
      topic = '品質保證的極限';
      summary = '從品質管理與製造現場出發，討論標準、責任與改善的邊界，思考一套制度如何真正被人執行。';
      outline = ['品質標準與現場問題', '制度和人的責任', '改善與持續追蹤'];
    } else if (/桌曆|AI/.test(joined)) {
      topic = 'AI 與工作記憶｜把照片變成日曆';
      summary = '把舊照片交給 AI 重新轉譯成公司月曆，從意外的成果回看影像、工作團隊與新工具之間的關係。';
      outline = ['照片與素材來源', 'AI 生成與視覺轉換', '對工作記憶的新想像'];
    } else if (/尾牙|上海書城|培訓研發/.test(joined)) {
      topic = '工作裡的人｜尾牙、故事與培訓';
      summary = '從公司活動、同事故事與培訓研發經驗出發，記錄制度之外的人情、傳承與一起工作的日常。';
      outline = ['活動與團隊日常', '同事故事與工作記憶', '培訓、研發與傳承'];
    } else if (/火箭|半導體|車用電子/.test(joined)) {
      topic = '火箭、半導體與產學合作';
      summary = '從火箭展覽、半導體影片與競賽消息出發，記錄產業如何和學校研究、學生培訓及未來人才連在一起。';
      outline = ['火箭與半導體內容', '展覽、競賽與研究現場', '支持學生與產學合作的想法'];
    } else if (/金門|同袍|服役|退伍|卡通風格/.test(joined)) {
      topic = '金門記憶與同袍情誼';
      summary = '把金門服役時期的記憶、同袍合照與多年後的重逢放在一起，回看時間過去仍沒有改變的守護心情。';
      outline = ['軍旅記憶與金門經驗', '同袍合照與多年後的重逢', '退伍後仍留下的守護信念'];
    } else if (/國會|國防|海巡|預算|大罷免|台海|關稅|抗議|國運/.test(joined)) {
      topic = '台灣安全與公共議題';
      summary = '針對台灣的政治、國家安全、國際情勢與公共政策留下直接評論，從個人立場整理對制度與社會方向的判斷。';
      outline = ['事件與政策背景', '國家安全與公共責任', '李博對社會方向的觀察'];
    } else if (/化學|CST|chemical/i.test(joined)) {
      topic = '化學學會改名與時代語境';
      summary = '從台灣化學學會的網站與名稱變化出發，觀察專業組織如何面對身份、語言與台灣社會的時代脈絡。';
      outline = ['網站與組織名稱', '身份與語言的變化', '李博對事件的即時觀察'];
    } else if (/貓|天竺鼠|圖片/.test(joined)) {
      topic = '生活裡的小幽默';
      summary = '用一張圖片或一個生活片段記錄當下的心情，讓嚴肅的工作與時代之外，也保留輕鬆、可愛的一面。';
      outline = ['圖片／插畫內容', '當下的生活情緒', '分享給朋友的理由'];
    } else if (text) {
      topic = text.length > 26 ? `${text.slice(0, 26)}…` : text;
      summary = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      outline = ['原始分享的核心事件', '李博當下的觀察', '留下這則記錄的意義'];
    } else {
      const titlePreview = cleanTitles.slice(0, 2).join('、') || '一份生活分享';
      if (cleanTitles.length) {
        topic = titlePreview;
        summary = `本日收錄「${titlePreview}」，先從標題整理出主題入口，再保留文件或影像供你在本站閱讀完整內容。`;
        outline = ['主題入口與內容背景', '文件／影像中的可讀重點', '回到原始分享查看細節'];
      } else {
        topic = '日期索引｜未命名的分享';
        summary = '這個日期目前只留下時間索引，原始記事沒有附上文字、圖片或文件；本站保留位置，避免用猜測填補內容。';
        outline = ['日期節點已保留', '目前沒有可摘要的原始內容', '之後補入資料即可回到這裡閱讀'];
      }
    }
    return { topic, summary, outline, linked };
  };

  const cardMarkup = (item, index) => `
    <article class="archive-card reveal is-visible" data-resource-id="${index}">
      <div class="archive-card-media">
        ${item.thumbnail ? `<img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)} 預覽" loading="lazy" onerror="this.style.display='none'" />` : ''}
        <span class="archive-card-type">${escapeHtml(typeLabels[item.kind] || '分享 LINK')}</span>
      </div>
      <div class="archive-card-body">
        <span class="archive-card-date">${escapeHtml(formatDate(item.date))} · ${escapeHtml(categoryNames[item.category] || item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="archive-card-note">${escapeHtml(item.note || '李博的原始分享，點開查看完整內容。')}</p>
        <span class="archive-card-open">查看收藏 <span>↗</span></span>
      </div>
    </article>`;

  const renderArchive = () => {
    const filtered = getFiltered();
    const shown = filtered.slice(0, state.visible);
    const grid = qs('[data-archive-grid]');
    grid.innerHTML = shown.length ? shown.map((item) => cardMarkup(item, resources.indexOf(item))).join('') : '<div class="timeline-empty">找不到符合條件的分享，換個關鍵字試試。</div>';
    qs('[data-result-count]').textContent = filtered.length;
    qs('[data-filter-status]').textContent = state.query || state.kind !== 'all' || state.category !== 'all' ? `目前顯示 ${filtered.length} 筆` : `顯示全部 ${resources.length} 筆`;
    qs('[data-load-more]').classList.toggle('is-hidden', shown.length >= filtered.length);
  };

  const renderTimeline = () => {
    const entries = timeline.filter((entry) => state.timelineYear === 'all' || entry.date.startsWith(state.timelineYear)).slice().reverse();
    let lastYear = '';
    const markup = entries.map((entry) => {
      const year = entry.date.slice(0, 4);
      const brief = makeTimelineBrief(entry);
      const links = entry.links.slice(0, 3).map((link) => {
        const resource = resources.find((item) => item.url === link);
        if (resource && resource.kind !== 'video') {
          const label = (resource.title || (resource.kind === 'document' ? '文件' : '本站快照')).replace(/\.pdf$/i, '').slice(0, 18);
          return `<button type="button" title="${escapeHtml(resource.title)}" data-resource-id="${resources.indexOf(resource)}">${escapeHtml(label)} ↗</button>`;
        }
        return `<a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">觀看 YouTube 影片 ↗</a>`;
      }).join('');
      const outline = brief.outline.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      const yearMarker = year !== lastYear ? `<div class="timeline-year-marker"><span>${year}</span><i></i></div>` : '';
      lastYear = year;
      return `${yearMarker}<article class="timeline-item reveal is-visible"><div><div class="timeline-date">${escapeHtml(formatDate(entry.date))}</div><div class="timeline-weekday">${escapeHtml(entry.weekday.replace(/[^一-鿿]/g, ''))}</div></div><div class="timeline-copy"><span class="timeline-topic-label">主旨</span><h3 class="timeline-title">${escapeHtml(brief.topic)}</h3><p class="timeline-content">${escapeHtml(brief.summary)}</p><ul class="timeline-outline">${outline}</ul></div><div class="timeline-links">${links}</div></article>`;
    }).join('');
    qs('[data-timeline-list]').innerHTML = markup || '<div class="timeline-empty">這一年沒有時間節點。</div>';
    qs('[data-timeline-count]').textContent = `${entries.length} 個時間節點`;
  };

  const openModal = (item) => {
    const modal = qs('[data-modal]');
    qs('[data-modal-meta]').textContent = `${formatDate(item.date)}  ·  ${kindNames[item.kind]}  ·  ${item.category}`;
    qs('[data-modal-title]').textContent = item.title;
    const modalNote = qs('[data-modal-note]');
    if (item.localFile && item.kind === 'document') modalNote.textContent = `${item.note || '李博在生活存檔裡留下的一份文件。'} 這份文件已收錄到本站，左側可直接閱讀完整內容。`;
    else if (item.localFile) modalNote.textContent = `${item.note || '李博在生活存檔裡留下的一份分享。'} 這則內容已轉為本站快照，可直接在這裡閱讀。`;
    else if (item.kind === 'video') modalNote.textContent = item.note || '李博分享的一部影片。影片播放保留在 YouTube。';
    else modalNote.textContent = item.note || '這則社群分享目前保留李博的摘要與日期；原始頁面需要外部平台權限，本站不會將你導向外部連結。';
    const modalMedia = qs('[data-modal-media]');
    if (item.localFile) modalMedia.innerHTML = `<iframe class="modal-pdf" src="${escapeHtml(item.localFile)}#page=1&zoom=page-width" title="${escapeHtml(item.title)}" loading="lazy"></iframe>`;
    else if (item.thumbnail) modalMedia.innerHTML = `<img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)} 預覽" onerror="this.style.display='none'" />`;
    else modalMedia.innerHTML = '<div class="modal-media-placeholder"><span>LB</span></div>';
    const modalLink = qs('[data-modal-link]');
    if (item.kind === 'video') {
      modalLink.style.display = 'inline-flex';
      modalLink.href = item.url;
      modalLink.innerHTML = '在 YouTube 播放 <span>↗</span>';
    } else {
      modalLink.style.display = 'none';
      modalLink.removeAttribute('href');
    }
    modal.querySelector('.modal-card').classList.toggle('is-document-reader', Boolean(item.localFile));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    qs('[data-modal-close]').focus();
  };
  const closeModal = () => {
    const modal = qs('[data-modal]');
    modal.querySelector('.modal-card').classList.remove('is-document-reader');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
  };

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-resource-id]');
    if (card && !event.target.closest('a')) openModal(resources[Number(card.dataset.resourceId)]);
    if (event.target.closest('[data-modal-close]')) closeModal();
    const featuredResource = event.target.closest('[data-open-resource]');
    if (featuredResource) {
      const resource = resources.find((item) => item.driveId === featuredResource.dataset.openResource);
      if (resource) openModal(resource);
    }
    const room = event.target.closest('[data-room-filter]');
    if (room) { state.category = room.dataset.roomFilter; qs('[data-category]').value = state.category; state.visible = 12; renderArchive(); }
    const kindLink = event.target.closest('[data-kind-filter]');
    if (kindLink) { state.kind = kindLink.dataset.kindFilter; qsa('[data-kind]').forEach((button) => button.classList.toggle('is-active', button.dataset.kind === state.kind)); state.visible = 12; renderArchive(); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
  qs('[data-search]').addEventListener('input', (event) => { state.query = event.target.value.trim(); state.visible = 12; renderArchive(); });
  qs('[data-category]').addEventListener('change', (event) => { state.category = event.target.value; state.visible = 12; renderArchive(); });
  qsa('[data-kind]').forEach((button) => button.addEventListener('click', () => { state.kind = button.dataset.kind; state.visible = 12; qsa('[data-kind]').forEach((item) => item.classList.toggle('is-active', item === button)); renderArchive(); }));
  qsa('[data-timeline-year]').forEach((button) => button.addEventListener('click', () => { state.timelineYear = button.dataset.timelineYear; qsa('[data-timeline-year]').forEach((item) => item.classList.toggle('is-active', item === button)); renderTimeline(); }));
  qs('[data-load-more]').addEventListener('click', () => { state.visible += 12; renderArchive(); });
  qsa('.primary-nav a').forEach((link) => link.addEventListener('click', () => { qs('[data-menu-toggle]').click(); }));

  const header = qs('[data-header]');
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 30), { passive: true });
  qs('[data-menu-toggle]').addEventListener('click', (event) => { const open = header.classList.toggle('menu-open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });

  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .08 });
  qsa('.reveal').forEach((element) => revealObserver.observe(element));

  renderArchive();
  renderTimeline();
})();
