/**
 * 《以撒的结合：忏悔》全道具中文图鉴与搜索引擎
 * Design Engineering Core Logic (Theme, Drawer, Hover Animation Popover, Keyboard Shortcuts)
 */

let allItems = [];
let currentQuality = 'all';
let currentType = 'all';
let currentStat = 'all';
let currentPool = 'all';
let searchQuery = '';

// Theme Management
const htmlEl = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggleBtn');

function initTheme() {
  const savedTheme = localStorage.getItem('isaac_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    htmlEl.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    htmlEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
  localStorage.setItem('isaac_theme', next);
}

themeToggleBtn.addEventListener('click', toggleTheme);

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const itemsGrid = document.getElementById('itemsGrid');
const displayedCount = document.getElementById('displayedCount');
const totalItemsCount = document.getElementById('totalItemsCount');
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filtersDrawer = document.getElementById('filtersDrawer');
const activeFilterBadge = document.getElementById('activeFilterBadge');
const activeTagContainer = document.getElementById('activeTagContainer');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const shortcutKbd = document.getElementById('shortcutKbd');

// Hover Preview Elements
const hoverPreviewPopover = document.getElementById('hoverPreviewPopover');
const previewItemWrap = document.getElementById('previewItemWrap');
const previewAura = document.getElementById('previewAura');
const previewBadge = document.getElementById('previewBadge');
const previewType = document.getElementById('previewType');
let hoverTimer = null;

// Modal Elements
const itemModal = document.getElementById('itemModal');
const modalClose = document.getElementById('modalClose');
const modalIconBox = document.getElementById('modalIconBox');
const modalTitleZh = document.getElementById('modalTitleZh');
const modalTitleEn = document.getElementById('modalTitleEn');
const modalQuote = document.getElementById('modalQuote');
const modalEffect = document.getElementById('modalEffect');
const modalStatSection = document.getElementById('modalStatSection');
const modalStatMatrix = document.getElementById('modalStatMatrix');
const modalId = document.getElementById('modalId');
const modalQuality = document.getElementById('modalQuality');
const modalCategory = document.getElementById('modalCategory');
const modalSource = document.getElementById('modalSource');
const modalPools = document.getElementById('modalPools');
const modalUnlock = document.getElementById('modalUnlock');

// Platform-aware shortcut indicator
if (navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
  shortcutKbd.textContent = '⌘ K';
} else {
  shortcutKbd.textContent = 'Ctrl K';
}

// Fetch and initialize dataset
async function init() {
  initTheme();

  if (window.ISAAC_ITEMS_DATA && Array.isArray(window.ISAAC_ITEMS_DATA)) {
    allItems = window.ISAAC_ITEMS_DATA;
    totalItemsCount.textContent = allItems.length;
    renderItems();
    return;
  }
  try {
    const resp = await fetch('items_data.json');
    if (!resp.ok) throw new Error('未能加载 items_data.json');
    allItems = await resp.json();
    totalItemsCount.textContent = allItems.length;
    renderItems();
  } catch (err) {
    itemsGrid.innerHTML = `
      <div class="empty-state">
        <h3>加载数据失败</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// Update Active Filter Badges and Tags
function updateFilterState() {
  let count = 0;
  let activeTags = [];

  if (currentQuality !== 'all') {
    count++;
    activeTags.push({ type: 'quality', label: `品质: Q${currentQuality}` });
  }
  if (currentType !== 'all') {
    count++;
    activeTags.push({ type: 'type', label: currentType === 'active' ? '主动道具' : '被动道具' });
  }
  if (currentStat !== 'all') {
    count++;
    activeTags.push({ type: 'stat', label: `属性: ${currentStat}` });
  }
  if (currentPool !== 'all') {
    count++;
    activeTags.push({ type: 'pool', label: `途径: ${currentPool}` });
  }

  if (count > 0) {
    activeFilterBadge.style.display = 'inline-block';
    activeFilterBadge.textContent = count;
  } else {
    activeFilterBadge.style.display = 'none';
  }

  // Render active tag pills
  activeTagContainer.innerHTML = activeTags.map(tag => `
    <div class="active-tag-pill" data-tag-type="${tag.type}" title="点击移除该筛选">
      <span>${tag.label}</span>
      <span>✕</span>
    </div>
  `).join('');
}

// Render cards
function renderItems() {
  updateFilterState();

  const filtered = allItems.filter(item => {
    // 1. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchZh = item.name_zh && item.name_zh.toLowerCase().includes(q);
      const matchEn = item.name_en && item.name_en.toLowerCase().includes(q);
      const matchAlias = item.alias && item.alias.toLowerCase().includes(q);
      const matchId = String(item.id).includes(q) || (q.startsWith('#') && String(item.id) === q.slice(1));
      const matchQuote = item.quote_zh && item.quote_zh.toLowerCase().includes(q);
      const matchEffect = item.effect && item.effect.toLowerCase().includes(q);
      const matchPool = item.pools_zh && item.pools_zh.toLowerCase().includes(q);
      const matchQ = q === `q${item.quality}` || q === `品质${item.quality}`;

      if (!matchZh && !matchEn && !matchAlias && !matchId && !matchQuote && !matchEffect && !matchPool && !matchQ) {
        return false;
      }
    }

    // 2. Quality Filter
    if (currentQuality !== 'all') {
      if (item.quality !== parseInt(currentQuality, 10)) return false;
    }

    // 3. Type Filter
    if (currentType !== 'all') {
      if (currentType === 'active' && !item.is_active) return false;
      if (currentType === 'passive' && item.is_active) return false;
    }

    // 4. Stat Filter
    if (currentStat !== 'all') {
      const hasStat = item.stat_modifiers && Object.keys(item.stat_modifiers).some(k => k.includes(currentStat));
      const hasTag = item.mechanic_tags && item.mechanic_tags.some(t => t.includes(currentStat));
      const hasEffect = item.effect && item.effect.includes(currentStat);
      if (!hasStat && !hasTag && !hasEffect) return false;
    }

    // 5. Pool Filter
    if (currentPool !== 'all') {
      if (!item.pools_zh || !item.pools_zh.includes(currentPool)) return false;
    }

    return true;
  });

  displayedCount.textContent = filtered.length;

  if (filtered.length === 0) {
    itemsGrid.innerHTML = `
      <div class="empty-state">
        <h3>未找到匹配的道具</h3>
        <p>可以尝试更换搜索关键词或重置筛选条件</p>
      </div>
    `;
    return;
  }

  itemsGrid.innerHTML = filtered.map(item => {
    const qBadgeCls = `badge-q${item.quality}`;
    
    // Stat badges preview
    let statsPreviewHtml = '';
    if (item.stat_modifiers && Object.keys(item.stat_modifiers).length > 0) {
      statsPreviewHtml = Object.entries(item.stat_modifiers).slice(0, 3).map(([k, v]) => {
        const shortName = k.split(' ')[0];
        return `<span class="stat-pill">${shortName} ${v}</span>`;
      }).join('');
    } else if (item.mechanic_tags && item.mechanic_tags.length > 0) {
      statsPreviewHtml = item.mechanic_tags.slice(0, 2).map(t => `<span class="tag-pill">${t}</span>`).join('');
    }

    const spriteCls = item.sprite_cls || `item reb-itm-new re-itm${item.id}`;

    return `
      <div class="item-card" data-id="${item.id}" tabindex="0" role="button" aria-label="${item.name_zh}">
        <div class="card-top">
          <div class="item-icon-wrapper">
            <div class="${spriteCls}"></div>
          </div>
          <div class="card-header-text">
            <div class="card-title-zh" title="${item.name_zh}">${item.name_zh}</div>
            <div class="card-title-en" title="${item.name_en}">${item.name_en}</div>
            <div class="card-badges">
              <span class="badge badge-id">#${item.id}</span>
              <span class="badge badge-quality ${qBadgeCls}">Q${item.quality}</span>
              ${item.is_active ? `<span class="badge badge-active">⚡ 主动</span>` : ''}
            </div>
          </div>
        </div>

        ${item.quote_zh ? `<div class="card-quote">"${item.quote_zh}"</div>` : ''}

        ${statsPreviewHtml ? `<div class="card-stats-preview">${statsPreviewHtml}</div>` : ''}

        <div class="card-footer">
          <span>${item.pools_zh.split('、')[0] || '常规道具池'}</span>
          <span>${item.source}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Hover Preview Popover Logic
function showHoverPreview(cardEl, itemId) {
  if (window.innerWidth < 768) return; // Skip on mobile
  const item = allItems.find(it => it.id === itemId);
  if (!item) return;

  const spriteCls = item.sprite_cls || `item reb-itm-new re-itm${item.id}`;
  previewItemWrap.innerHTML = `<div class="${spriteCls}"></div>`;
  
  // Set quality aura gradient
  const auraColors = {
    4: 'radial-gradient(circle, rgba(241, 196, 15, 0.45) 0%, rgba(241, 196, 15, 0) 70%)',
    3: 'radial-gradient(circle, rgba(192, 132, 252, 0.45) 0%, rgba(192, 132, 252, 0) 70%)',
    2: 'radial-gradient(circle, rgba(74, 222, 128, 0.45) 0%, rgba(74, 222, 128, 0) 70%)',
    1: 'radial-gradient(circle, rgba(148, 163, 184, 0.45) 0%, rgba(148, 163, 184, 0) 70%)',
    0: 'radial-gradient(circle, rgba(248, 113, 113, 0.45) 0%, rgba(248, 113, 113, 0) 70%)'
  };
  previewAura.style.background = auraColors[item.quality] || auraColors[2];

  previewBadge.textContent = `Q${item.quality} ${'⭐'.repeat(Math.max(1, item.quality))}`;
  previewType.textContent = item.is_active ? `⚡ ${item.charge || '主动'}` : '🛡️ 被动';

  // Position next to card
  const rect = cardEl.getBoundingClientRect();
  const popoverWidth = 142;
  const popoverHeight = 154;
  
  let left = rect.right + 12;
  let transformOrigin = 'center left';

  // If overflowing right edge, position on left side of card
  if (left + popoverWidth > window.innerWidth - 10) {
    left = rect.left - popoverWidth - 12;
    transformOrigin = 'center right';
  }

  let top = rect.top + (rect.height - popoverHeight) / 2;
  if (top < 10) top = 10;
  if (top + popoverHeight > window.innerHeight - 10) {
    top = window.innerHeight - popoverHeight - 10;
  }

  hoverPreviewPopover.style.transformOrigin = transformOrigin;
  hoverPreviewPopover.style.left = `${left}px`;
  hoverPreviewPopover.style.top = `${top}px`;
  hoverPreviewPopover.classList.add('visible');
}

function hideHoverPreview() {
  hoverPreviewPopover.classList.remove('visible');
}

// Open Detail Modal
function openModal(itemId) {
  hideHoverPreview();
  const item = allItems.find(it => it.id === itemId);
  if (!item) return;

  const spriteCls = item.sprite_cls || `item reb-itm-new re-itm${item.id}`;
  modalIconBox.innerHTML = `<div class="${spriteCls}" style="transform: scale(1.6);"></div>`;
  modalTitleZh.textContent = item.name_zh;
  modalTitleEn.textContent = item.name_en ? `${item.name_en} (内部ID: #${item.id})` : `#${item.id}`;
  modalQuote.textContent = item.quote_zh ? `"${item.quote_zh}" — ${item.quote_en || ''}` : '';

  modalEffect.textContent = item.effect || '暂无详细机制说明';
  modalId.textContent = `#${item.id}`;
  modalQuality.textContent = `Q${item.quality} ${'⭐'.repeat(Math.max(1, item.quality))}`;
  modalCategory.textContent = item.is_active ? `${item.category} (${item.charge || '特殊充能'})` : item.category;
  modalSource.textContent = item.source || '以撒官方版本';
  modalPools.textContent = item.pools_zh || '以游戏内生成为准';
  modalUnlock.textContent = item.unlock || '初始可用 / 默认已解锁';

  // Stat matrix
  if (item.stat_modifiers && Object.keys(item.stat_modifiers).length > 0) {
    modalStatSection.style.display = 'block';
    modalStatMatrix.innerHTML = Object.entries(item.stat_modifiers).map(([k, v]) => `
      <div class="stat-cell">
        <span class="stat-name">${k}</span>
        <span class="stat-val">${v}</span>
      </div>
    `).join('');
  } else if (item.mechanic_tags && item.mechanic_tags.length > 0) {
    modalStatSection.style.display = 'block';
    modalStatMatrix.innerHTML = item.mechanic_tags.map(t => `
      <div class="stat-cell">
        <span class="stat-name">机制特性</span>
        <span class="stat-val" style="color: var(--accent-purple);">${t}</span>
      </div>
    `).join('');
  } else {
    modalStatSection.style.display = 'none';
  }

  itemModal.classList.add('active');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  searchClear.style.display = searchQuery ? 'inline-flex' : 'none';
  renderItems();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.display = 'none';
  searchInput.focus();
  renderItems();
});

// Toggle Drawer (Collapsible)
filterToggleBtn.addEventListener('click', () => {
  const isOpen = filtersDrawer.classList.contains('open');
  if (isOpen) {
    filtersDrawer.classList.remove('open');
    filterToggleBtn.classList.remove('expanded');
  } else {
    filtersDrawer.classList.add('open');
    filterToggleBtn.classList.add('expanded');
  }
});

// Quick Quality Filters
document.getElementById('quickQualityFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#quickQualityFilters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentQuality = chip.dataset.quality;
  renderItems();
});

// Type Filter
document.getElementById('typeFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#typeFilters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentType = chip.dataset.type;
  renderItems();
});

// Stat Filter
document.getElementById('statFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#statFilters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentStat = chip.dataset.stat;
  renderItems();
});

// Pool Filter
document.getElementById('poolFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#poolFilters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentPool = chip.dataset.pool;
  renderItems();
});

// Active tag dismiss click
activeTagContainer.addEventListener('click', (e) => {
  const pill = e.target.closest('.active-tag-pill');
  if (!pill) return;
  const tagType = pill.dataset.tagType;
  if (tagType === 'quality') {
    currentQuality = 'all';
    document.querySelectorAll('#quickQualityFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.quality === 'all'));
  } else if (tagType === 'type') {
    currentType = 'all';
    document.querySelectorAll('#typeFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.type === 'all'));
  } else if (tagType === 'stat') {
    currentStat = 'all';
    document.querySelectorAll('#statFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.stat === 'all'));
  } else if (tagType === 'pool') {
    currentPool = 'all';
    document.querySelectorAll('#poolFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.pool === 'all'));
  }
  renderItems();
});

// Reset All Filters
resetFiltersBtn.addEventListener('click', () => {
  currentQuality = 'all';
  currentType = 'all';
  currentStat = 'all';
  currentPool = 'all';
  searchQuery = '';
  searchInput.value = '';
  searchClear.style.display = 'none';

  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.quality === 'all' || c.dataset.type === 'all' || c.dataset.stat === 'all' || c.dataset.pool === 'all');
  });

  renderItems();
});

// Item Card Hover Delegation (Emil Kowalski Physics Popover)
itemsGrid.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.item-card');
  if (card && card.dataset.id) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      showHoverPreview(card, parseInt(card.dataset.id, 10));
    }, 60);
  }
});

itemsGrid.addEventListener('mouseout', (e) => {
  const card = e.target.closest('.item-card');
  if (card) {
    clearTimeout(hoverTimer);
    hideHoverPreview();
  }
});

// Item Card Click Delegation & Keyboard Enter
itemsGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.item-card');
  if (card && card.dataset.id) {
    openModal(parseInt(card.dataset.id, 10));
  }
});

itemsGrid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const card = e.target.closest('.item-card');
    if (card && card.dataset.id) {
      openModal(parseInt(card.dataset.id, 10));
    }
  }
});

// Close Modal
modalClose.addEventListener('click', () => {
  itemModal.classList.remove('active');
});

itemModal.addEventListener('click', (e) => {
  if (e.target === itemModal) {
    itemModal.classList.remove('active');
  }
});

// Global Keyboard Shortcuts (Ctrl+K / ⌘K / / / Escape)
document.addEventListener('keydown', (e) => {
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && document.activeElement !== searchInput)) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }

  if (e.key === 'Escape') {
    if (itemModal.classList.contains('active')) {
      itemModal.classList.remove('active');
    } else if (document.activeElement === searchInput) {
      searchInput.blur();
    }
  }
});

// Hide popover on window scroll
window.addEventListener('scroll', hideHoverPreview, { passive: true });

// Initialize on DOM ready
init();
