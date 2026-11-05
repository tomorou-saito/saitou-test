'use strict';
(() => {
  const residents = window.RESIDENTS;
  const byId = new Map(residents.map(resident => [resident.id, resident]));
  const personalities = ['ぼんやり', 'ハキハキ', 'コワイ', 'キザ', '普通', '元気', 'オトナ', 'アネキ'];
  const storageKey = 'island-neighbor-note:v1';
  const pageSize = 30;
  const element = identifier => document.getElementById(identifier);
  const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  let state = {island: [], wish: []};
  let view = 'all';
  let currentPage = 1;
  let toastTimeout;
  let storageAvailable = true;
  let storageLoadIssue = '';

  function validateState(value) {
    if (!value || !Array.isArray(value.island) || !Array.isArray(value.wish)) throw new Error('島の仲間・欲しい住民のリストが見つかりません。');
    if (value.island.length > 10 || value.wish.length > residents.length) throw new Error('登録人数が上限を超えています。');
    for (const list of [value.island, value.wish]) {
      if (list.some(identifier => typeof identifier !== 'string' || !byId.has(identifier))) throw new Error('このアプリに存在しない住民が含まれています。');
      if (new Set(list).size !== list.length) throw new Error('同じ住民が重複しています。');
    }
    return {island: [...value.island], wish: [...value.wish]};
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) state = validateState(JSON.parse(saved));
  } catch (error) {
    storageLoadIssue = '保存済みの記録を読み込めませんでした。元データを保護するため、自動保存を停止しています。記録を書き出して保管してください。';
    storageAvailable = false;
  }

  function notify(message) {
    element('toast').textContent = message;
    element('toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element('toast').classList.remove('visible'), 4200);
  }

  function persist() {
    if (!storageAvailable) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch (error) {
      storageAvailable = false;
      return false;
    }
  }

  function avatar(resident, lazy = true) {
    if (resident.group === 'Ver.3.0') return `<span class="fallback-avatar" role="img" aria-label="${escape(resident.name)}（画像未収録）">${resident.species === 'トリ' ? '🐦' : resident.species === 'シカ' ? '🦌' : '🐿️'}</span>`;
    return `<img src="assets/${resident.id}.png" alt="${escape(resident.name)}" ${lazy ? 'loading="lazy"' : ''} width="128" height="128">`;
  }

  function counts() {
    return Object.fromEntries(personalities.map(personality => [personality, state.island.filter(identifier => byId.get(identifier).personality === personality).length]));
  }

  function renderNotebook() {
    element('island-count').textContent = `${state.island.length} / 10`;
    element('wish-count').textContent = state.wish.length;
    element('island-slots').innerHTML = Array.from({length: 10}, (_, index) => {
      const resident = byId.get(state.island[index]);
      return resident ? `<div class="slot"><div class="slot-avatar">${avatar(resident, false)}</div><button class="remove-slot" data-action="island" data-id="${resident.id}" aria-label="${escape(resident.name)}を島から外す">×</button><p>${escape(resident.name)}</p></div>` : `<div class="slot"><a href="#directory" class="slot-avatar slot-empty" aria-label="島の住民を追加する">＋</a><p>あき</p></div>`;
    }).join('');
    element('wish-preview').innerHTML = state.wish.length ? `<div class="wish-thumbs">${state.wish.slice(0, 5).map(identifier => avatar(byId.get(identifier), false)).join('')}${state.wish.length > 5 ? `<span class="small-label">+${state.wish.length - 5}</span>` : ''}</div>` : '<p class="wish-empty">住民カードの ♡ を押して、<br>いつか迎えたい子を記録しましょう。</p>';
    const personalityCounts = counts();
    const missing = personalities.filter(personality => !personalityCounts[personality]);
    element('missing-summary').textContent = state.island.length === 0 ? 'まずは島の仲間を登録すると、いない性格がわかります。' : missing.length ? `島にいない性格：${missing.join('・')}` : '8種類すべての性格がそろっています。';
    element('personality-chart').innerHTML = personalities.map(personality => `<div class="chart-row"><span>${personality}</span><div class="bar-track" role="meter" aria-label="${personality}の人数" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${personalityCounts[personality]}"><div class="bar-fill" style="width:${personalityCounts[personality] * 10}%"></div></div><span>${personalityCounts[personality]}名</span><span class="${personalityCounts[personality] ? 'present-tag' : 'missing-tag'}">${personalityCounts[personality] ? '島にいる' : '島にいない'}</span></div>`).join('');
  }

  function filteredResidents() {
    const query = normalize(element('search').value.trim());
    const animal = element('species').value;
    const personality = element('personality').value;
    const sort = element('sort').value;
    return residents.filter(resident => (!query || normalize(resident.name).includes(query) || normalize(resident.english).includes(query)) && (!animal || resident.species === animal) && (!personality || resident.personality === personality) && (view === 'all' || state[view].includes(resident.id))).sort((left, right) => (sort === 'name' ? 0 : left[sort].localeCompare(right[sort], 'ja')) || left.name.localeCompare(right.name, 'ja'));
  }

  function renderDirectory() {
    const filtered = filteredResidents();
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, pages);
    element('result-count').textContent = `${filtered.length} 名`;
    document.querySelectorAll('[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
      button.setAttribute('aria-pressed', button.dataset.view === view);
    });
    const tints = ['#eaf0e3', '#f2ead8', '#e6eeec', '#f3e6df', '#eee9f0'];
    element('resident-grid').innerHTML = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((resident, index) => {
      const onIsland = state.island.includes(resident.id);
      const wanted = state.wish.includes(resident.id);
      const [day, month] = resident.birthday.split('/');
      return `<article class="resident-card" style="--card-tint:${tints[index % tints.length]}"><button class="wish-button ${wanted ? 'selected' : ''}" data-action="wish" data-id="${resident.id}" aria-label="${escape(resident.name)}を欲しい住民${wanted ? 'から外す' : 'に登録する'}" aria-pressed="${wanted}">${wanted ? '♥' : '♡'}</button><div class="portrait">${onIsland ? '<span class="in-island">✓ 島の仲間</span>' : ''}${avatar(resident)}</div><div class="card-content"><h3>${escape(resident.name)}</h3><p class="card-english">${escape(resident.english)}</p><div class="card-meta"><span class="tag">${resident.species}</span><span class="tag personality-tag">${resident.personality}</span></div><p class="card-birthday">♧ ${month}月${day}日 生まれ</p><button class="add-button ${onIsland ? 'registered' : ''}" data-action="island" data-id="${resident.id}" ${!onIsland && state.island.length >= 10 ? 'disabled' : ''}>${onIsland ? '✓ 島から外す' : '＋ 島の仲間にする'}</button><p class="special-label">${resident.special ? `${resident.group}・amiiboで招待` : '自然訪問の対象'}</p></div></article>`;
    }).join('') || `<div class="empty-results"><h3>${view === 'wish' && !state.wish.length ? '欲しい住民はまだ登録されていません' : view === 'island' && !state.island.length ? '島の仲間はまだ登録されていません' : '条件に合う住民が見つかりませんでした'}</h3><p>「すべて」で住民を探すか、検索・絞り込み条件を変えてみてください。</p><button class="text-button" data-action="reset">検索条件をリセット →</button></div>`;
    const pageNumbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pages])].filter(page => page >= 1 && page <= pages).sort((left, right) => left - right);
    element('pagination').innerHTML = filtered.length ? `<button class="page-button" data-page="${currentPage - 1}" aria-label="前のページ" ${currentPage === 1 ? 'disabled' : ''}>‹</button>${pageNumbers.map((page, index) => `${index && page > pageNumbers[index - 1] + 1 ? '<span>…</span>' : ''}<button class="page-button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`).join('')}<button class="page-button" data-page="${currentPage + 1}" aria-label="次のページ" ${currentPage === pages ? 'disabled' : ''}>›</button>` : '';
  }

  function render() { renderNotebook(); renderDirectory(); }

  function toggle(identifier, list) {
    const resident = byId.get(identifier);
    if (!resident || !['island', 'wish'].includes(list)) return;
    const exists = state[list].includes(identifier);
    if (list === 'island' && !exists && state.island.length >= 10) return notify('島の仲間は最大10名です。先に1名外してください。');
    state[list] = exists ? state[list].filter(saved => saved !== identifier) : [...state[list], identifier];
    const saved = persist();
    render();
    notify(saved ? `${resident.name}を${list === 'island' ? '島の仲間' : '欲しい住民'}${exists ? 'から外しました' : 'に登録しました'}` : 'このブラウザには保存できません。記録を書き出して保管してください。');
  }

  const sources = `<h3>データと出典</h3><p>確認日：2026年11月5日。通常住民407名＋サンリオ6名＋Ver.3.0コラボ4名の計417名。特別な施設スタッフなどは含みません。</p><ul><li><a href="https://github.com/alexislours/ACNHAPI" target="_blank" rel="noopener noreferrer">ACNHAPI / Alexis Lours</a>：基本391名の日本語名・種族・性格・誕生日。JSONデータは <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>。本アプリで必要項目を抽出し、日本語化・追加住民を補完。</li><li><a href="https://nookipedia.com/wiki/Villager/New_Horizons" target="_blank" rel="noopener noreferrer">Nookipedia：住民一覧</a>、<a href="https://nookipedia.com/wiki/List_of_villager_IDs" target="_blank" rel="noopener noreferrer">住民ID一覧</a>：追加住民の属性・IDの照合。</li><li><a href="https://www.nintendo.com/jp/switch/acbaa/updates.html" target="_blank" rel="noopener noreferrer">任天堂：Ver.3.0無料アップデート</a>：追加4名とamiibo連携。</li><li><a href="https://animalcrossing.fandom.com/wiki/Campsite_(New_Horizons)" target="_blank" rel="noopener noreferrer">Animal Crossing Wiki：Campsite</a>、<a href="https://animalcrossingwiki.de/acnh/campingplatz" target="_blank" rel="noopener noreferrer">ドイツ語Wiki：Campingplatz</a>：自然訪問の性格傾向・訪問間隔。</li><li><a href="https://hyperts.net/acnh/camp/" target="_blank" rel="noopener noreferrer">hyperT：キャンプサイト厳選</a>：過去の人力統計。60%という記述は当時の推定で、数値の相違があるため本アプリの計算値には採用していません。</li><li>住民アイコン：<a href="https://acnhcdn.com/" target="_blank" rel="noopener noreferrer">ACNH CDN</a>、補助取得先：ACNHAPI。ゲーム画像は任天堂等の権利者のものです。データの利用条件は画像の利用許諾を意味しません。</li></ul><p>キャンプの数値はコミュニティ資料に基づく参考モデルです。任天堂が公開した公式確率ではなく、現行版での厳密な再検証はできていません。</p>`;

  function showDialog(title, content) {
    element('dialog-title').textContent = title;
    element('dialog-content').innerHTML = content;
    element('info-dialog').showModal();
  }

  function showCamp() {
    const personalityCounts = counts();
    const pool = residents.filter(resident => !resident.special && !state.island.includes(resident.id));
    const missing = personalities.filter(personality => !personalityCounts[personality]);
    const missingPool = pool.filter(resident => missing.includes(resident.personality));
    const probability = resident => (missing.length && missingPool.length ? .5 / pool.length + (missing.includes(resident.personality) ? .5 / missingPool.length : 0) : 1 / pool.length);
    const bars = personalities.map(personality => {
      const percent = pool.filter(resident => resident.personality === personality).reduce((sum, resident) => sum + probability(resident), 0) * 100;
      return `<div class="probability-row"><span>${personality}</span><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div><strong>${percent.toFixed(1)}%</strong></div>`;
    }).join('');
    const wishes = state.wish.map(identifier => byId.get(identifier)).map(resident => `<li>${escape(resident.name)}：${state.island.includes(resident.id) ? 'すでに島にいます' : resident.special ? '自然訪問の対象外。対応amiiboで招待' : `参考モデルで約${(probability(resident) * 100).toFixed(2)}% / 1訪問`}</li>`).join('');
    showDialog('キャンプサイトの性格メモ', `<p class="notice">島にいない性格があると、その性格の住民が自然訪問で選ばれやすいとされています。狙う子の性格が島にいるかどうかを、まず確認しましょう。</p><h3>自然訪問の参考モデル</h3><p>コミュニティWikiでは、50%を「島にいない性格の候補全体」、残り50%を「全性格の候補全体」から選ぶと説明されています。8性格がすべてそろうと、全候補からの抽選になります。性格ごとの人数が異なるため、8等分や「不在なら各50%」とはなりません。</p><p><strong>以下は実際の確率を保証するものではありません。</strong>通常住民407名から島の住民を除き、候補の住民を各枠内で均等に選ぶと仮定した計算です。過去の訪問・居住履歴、移住待ちなどの除外は未反映です。まだ島の住民をすべて登録していない場合も実情とは異なります。</p>${bars}<h3>欲しい住民との関係</h3>${wishes ? `<ul>${wishes}</ul>` : '<p>♡で欲しい住民を登録すると、この構成での参考値が表示されます。</p>'}<h3>覚えておきたい例外</h3><ul><li>キャンプサイト完成直後の最初の住民はキザ。上の通常の自然訪問モデルとは別です。</li><li>サンリオ6名・Ver.3.0コラボ4名は自然訪問の候補から除外しています。ただし島に住む場合は、島の性格構成に数えます。</li><li>過去に会った住民などの除外・一巡後の扱いにより、実際の候補は変わります。上のグラフは履歴のない簡易モデルです。</li><li>訪問が発生する確率と、誰が来るかの抽選は別です。前回の訪問から1・2日後は0%、3日後5%、4日後10%、5日後15%、6日後以降20%とされています。</li><li>1名の性格を減らすだけでは、その性格が「不在」になるとは限りません。同じ性格が複数いる場合に注意しましょう。</li></ul>${sources}`);
  }

  function showHelp() {
    showDialog('使い方・データと出典', `<h3>このてちょうの使い方</h3><ol><li>一覧から島にいる住民を探し「＋ 島の仲間にする」で登録。上限は10名です。外すときは登録済みボタンか島の仲間の×を押します。</li><li>迎えたい住民は♡で登録。島の仲間と欲しい住民は別々の記録なので、同じ子を両方に登録できます。</li><li>名前はひらがな・カタカナ・英語に対応。種族と性格も組み合わせて絞り込めます。</li><li>性格メモに島の人数と不在の性格を表示。「抽選のしくみ」で参考モデルを確認できます。</li></ol><h3>保存・バックアップ</h3><p>変更はこのブラウザのlocalStorageに自動保存されます。サーバーやGitHubに記録は送られません。同じ端末でも別ブラウザや別URLでは記録を共有しません。プライベートモードやブラウザのデータ削除で記録が消える場合があります。</p><p>「記録を書き出す」でJSONを保存し、別の端末で「記録を読み込む」と引き継げます。読み込みは確認後に現在の記録を置き換えます。ファイルを直接開いた場合の保存動作はブラウザ依存です。GitHub Pagesなど、同じURLで使うと安定します。</p>${sources}`);
  }

  function resetFilters() {
    element('search').value = ''; element('species').value = ''; element('personality').value = ''; currentPage = 1; renderDirectory();
  }

  for (const animal of [...new Set(residents.map(resident => resident.species))].sort((left, right) => left.localeCompare(right, 'ja'))) element('species').add(new Option(animal, animal));
  for (const personality of personalities) element('personality').add(new Option(personality, personality));
  for (const identifier of ['search', 'species', 'personality', 'sort']) element(identifier).addEventListener(identifier === 'search' ? 'input' : 'change', () => {currentPage = 1; renderDirectory();});
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]');
    if (action && !action.disabled) {
      if (action.dataset.action === 'reset') resetFilters();
      else {
        const {id: identifier, action: list} = action.dataset;
        toggle(identifier, list);
        const replacement = document.querySelector(`#resident-grid [data-id="${identifier}"][data-action="${list}"]`);
        if (replacement) replacement.focus({preventScroll: true});
      }
    }
    const tab = event.target.closest('[data-view]');
    if (tab) {view = tab.dataset.view; currentPage = 1; renderDirectory();}
    const page = event.target.closest('[data-page]');
    if (page && !page.disabled) {currentPage = Number(page.dataset.page); renderDirectory(); element('directory').scrollIntoView({block: 'start'});}
  });
  document.addEventListener('error', event => {
    if (event.target.tagName === 'IMG') {
      const fallback = document.createElement('span');
      fallback.className = 'fallback-avatar'; fallback.textContent = '☘'; fallback.setAttribute('role', 'img'); fallback.setAttribute('aria-label', event.target.alt);
      event.target.replaceWith(fallback);
    }
  }, true);
  element('clear-filters').addEventListener('click', resetFilters);
  element('show-wishes').addEventListener('click', () => {view = 'wish'; resetFilters(); element('directory').scrollIntoView();});
  element('help-button').addEventListener('click', showHelp);
  element('footer-sources').addEventListener('click', showHelp);
  element('camp-details').addEventListener('click', showCamp);
  element('close-dialog').addEventListener('click', () => element('info-dialog').close());
  element('info-dialog').addEventListener('click', event => {if (event.target === element('info-dialog') && (event.offsetX < 0 || event.offsetX > event.target.clientWidth || event.offsetY < 0 || event.offsetY > event.target.clientHeight)) element('info-dialog').close();});
  element('export').addEventListener('click', () => {
    const backup = {format: 'island-neighbor-note', version: 1, exportedAt: new Date().toISOString(), ...state};
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'しまのてちょう-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('バックアップを書き出しました');
  });
  element('import').addEventListener('click', () => element('import-file').click());
  element('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    try {
      if (!file) return;
      if (file.size > 200000) throw new Error('ファイルが大きすぎます。専用のバックアップJSONを選んでください。');
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'island-neighbor-note' || backup.version !== 1) throw new Error('対応していないバックアップ形式です。');
      const incoming = validateState(backup);
      if (!window.confirm(`現在の記録を、島の仲間${incoming.island.length}名・欲しい住民${incoming.wish.length}名に置き換えますか？`)) return;
      state = incoming; storageAvailable = true;
      const saved = persist(); render();
      notify(saved ? '記録を読み込みました' : '読み込みましたが自動保存できません。書き出して保管してください。');
    } catch (error) {notify(`読み込めませんでした：${error.message}`);}
    finally {event.target.value = '';}
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey) {
      try {state = event.newValue ? validateState(JSON.parse(event.newValue)) : {island: [], wish: []}; render(); notify('別のタブの変更を反映しました');} catch (error) {notify('別のタブの記録を読み込めませんでした');}
    }
  });
  render();
  if (storageLoadIssue) {showDialog('自動保存を利用できません', `<p>${storageLoadIssue}</p>`);}
})();
