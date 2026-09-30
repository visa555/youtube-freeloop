const CATEGORY_COLORS = {
  WAH:   { bg: '#3d2800', accent: '#f59e0b', text: '#fef3c7' },
  COMP:  { bg: '#052e16', accent: '#22c55e', text: '#dcfce7' },
  DRIVE: { bg: '#3d0000', accent: '#ef4444', text: '#fee2e2' },
  AMP:   { bg: '#0c1e3c', accent: '#3b82f6', text: '#dbeafe' },
  CAB:   { bg: '#2d0f6b', accent: '#a78bfa', text: '#ede9fe' },
  EQ:    { bg: '#0a2e3a', accent: '#22d3ee', text: '#cffafe' },
  NOISE: { bg: '#1f2937', accent: '#9ca3af', text: '#f3f4f6' },
  MOD:   { bg: '#042f2e', accent: '#2dd4bf', text: '#ccfbf1' },
  DELAY: { bg: '#3b0a26', accent: '#f472b6', text: '#fce7f3' },
  REVERB:{ bg: '#1e1b4b', accent: '#818cf8', text: '#e0e7ff' },
};

// ── Style Advisor ────────────────────────────────────────────────

function renderStyles() {
  const grid = document.getElementById('style-grid');
  grid.innerHTML = MUSIC_STYLES.map(style => `
    <div class="style-card" onclick="selectStyle('${style.id}')">
      <div class="style-icon">${style.icon}</div>
      <h3>${style.name}</h3>
      <p>${style.description}</p>
      <div class="artists">${style.artists.join(' · ')}</div>
    </div>
  `).join('');
}

function selectStyle(id) {
  const style = MUSIC_STYLES.find(s => s.id === id);
  if (!style) return;

  document.getElementById('style-selector').classList.add('hidden');
  document.getElementById('recommendation').classList.remove('hidden');

  document.getElementById('style-header').innerHTML = `
    <button class="back-btn" onclick="goBack()">← กลับ</button>
    <div class="style-title">
      <span class="style-icon-lg">${style.icon}</span>
      <div>
        <h2>${style.name}</h2>
        <p class="style-desc">${style.description}</p>
        <div class="artists">${style.artists.join(' · ')}</div>
      </div>
    </div>
  `;

  renderChain(style);
  renderTips(style.tips);
}

function renderChain(style) {
  const noteHtml = style.chainNote
    ? `<div class="chain-note">⚠ ${style.chainNote}</div>`
    : '';

  document.getElementById('chain-container').innerHTML = `
    <h3 class="section-label">Effect Chain</h3>
    ${noteHtml}
    <div class="chain-scroll">
      <div class="chain">
        ${style.chain.map((block, i) => renderBlock(block, i, style.chain)).join('')}
      </div>
    </div>
    <div class="chain-legend">
      <span class="legend-enabled">■ เปิดใช้งาน</span>
      <span class="legend-disabled">■ ปิด (optional)</span>
    </div>
  `;
}

function renderBlock(block, index, chain) {
  const colors = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.NOISE;
  const isLast = index === chain.length - 1;

  const paramsHtml = block.params.map(p => {
    if (p.unit !== undefined) {
      return `
        <div class="param param-unit">
          <span class="param-name">${p.name}</span>
          <span class="param-value-unit">${p.value}${p.unit}</span>
        </div>`;
    }
    return `
      <div class="param">
        <div class="param-top">
          <span class="param-name">${p.name}</span>
          <span class="param-value">${p.value}</span>
        </div>
        <div class="param-bar">
          <div class="param-fill" style="width:${p.value}%;background:${colors.accent}"></div>
        </div>
      </div>`;
  }).join('');

  const blockHtml = `
    <div class="effect-block ${block.enabled ? '' : 'block-disabled'}"
         style="background:${colors.bg};border-color:${block.enabled ? colors.accent : '#374151'}">
      <div class="block-header" style="background:${block.enabled ? colors.accent : '#374151'}">
        <span class="block-category">${block.category}</span>
        ${!block.enabled ? '<span class="off-badge">OFF</span>' : ''}
      </div>
      <div class="block-body" style="color:${colors.text}">
        <div class="model-name">${block.model}</div>
        <div class="params">${paramsHtml}</div>
      </div>
    </div>`;

  const arrowHtml = !isLast
    ? `<div class="arrow ${block.enabled ? '' : 'arrow-dim'}">›</div>`
    : '';

  return `<div class="block-wrapper">${blockHtml}${arrowHtml}</div>`;
}

function renderTips(tips) {
  document.getElementById('tips-container').innerHTML = `
    <div class="tips">
      <h3 class="section-label">Tips จาก Sound Engineer</h3>
      <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>
  `;
}

function goBack() {
  document.getElementById('recommendation').classList.add('hidden');
  document.getElementById('style-selector').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Navigation ───────────────────────────────────────────────────

function switchView(view) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('tab-active', btn.dataset.view === view);
  });

  const isEffects = view === 'effects';
  document.getElementById('style-selector').classList.toggle('hidden', isEffects);
  document.getElementById('recommendation').classList.add('hidden');
  document.getElementById('effect-list').classList.toggle('hidden', !isEffects);

  if (isEffects) initEffectList();
}

// ── Effect List ──────────────────────────────────────────────────

let _effectListReady = false;
let _activeCategory = 'all';
let _searchQuery = '';

function initEffectList() {
  if (_effectListReady) return;
  _effectListReady = true;

  // Build category filter chips
  const filtersEl = document.getElementById('category-filters');
  filtersEl.innerHTML = [
    `<button class="chip chip-active" data-cat="all" onclick="setCategoryFilter('all')">ทั้งหมด</button>`,
    ...EFFECTS_DATA.map(cat => {
      const color = (CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.NOISE).accent;
      return `<button class="chip" data-cat="${cat.id}" onclick="setCategoryFilter('${cat.id}')"
                style="--chip-color:${color}">${cat.label}</button>`;
    })
  ].join('');

  // Search listener
  document.getElementById('effect-search').addEventListener('input', e => {
    _searchQuery = e.target.value.toLowerCase().trim();
    renderEffectResults();
  });

  renderEffectResults();
}

function setCategoryFilter(catId) {
  _activeCategory = catId;
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('chip-active', c.dataset.cat === catId)
  );
  renderEffectResults();
}

function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'),
    '<mark class="hl">$1</mark>');
}

function renderEffectResults() {
  const q = _searchQuery;
  const container = document.getElementById('effect-results');

  const filtered = EFFECTS_DATA
    .filter(cat => _activeCategory === 'all' || cat.id === _activeCategory)
    .map(cat => ({
      ...cat,
      effects: cat.effects.filter(e =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.desc.toLowerCase().includes(q) ||
        (e.basedOn && e.basedOn.toLowerCase().includes(q))
      )
    }))
    .filter(cat => cat.effects.length > 0);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>ไม่พบ effect ที่ตรงกับ "<strong>${q}</strong>"</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(cat => {
    const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.NOISE;
    const totalShown = cat.effects.length;
    const totalAll = EFFECTS_DATA.find(c => c.id === cat.id)?.effects.length ?? totalShown;

    const cards = cat.effects.map(e => {
      const basedOnHtml = e.basedOn
        ? `<div class="ecard-based">Based on: ${highlight(e.basedOn, q)}</div>`
        : '';
      return `
        <div class="ecard" style="background:${colors.bg};border-color:${colors.accent}22">
          <div class="ecard-head" style="background:${colors.accent}">
            <span class="ecard-cat">${cat.category}</span>
            <span class="ecard-no">No.${e.no}</span>
          </div>
          <div class="ecard-body" style="color:${colors.text}">
            <div class="ecard-name">${highlight(e.name, q)}</div>
            ${basedOnHtml}
            <div class="ecard-desc">${highlight(e.desc, q)}</div>
          </div>
        </div>`;
    }).join('');

    const countLabel = q && totalShown < totalAll
      ? `${totalShown} / ${totalAll}`
      : `${totalAll}`;

    const noteHtml = cat.noNote
      ? `<span class="cat-note">${cat.noNote}</span>`
      : '';

    return `
      <div class="cat-section">
        <div class="cat-header">
          <span class="cat-dot" style="background:${colors.accent}"></span>
          <span class="cat-label">${cat.label}</span>
          ${noteHtml}
          <span class="cat-count">${countLabel} effects</span>
        </div>
        <div class="ecards-grid">${cards}</div>
      </div>`;
  }).join('');
}

// ── Init ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderStyles);
