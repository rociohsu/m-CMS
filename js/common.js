import { state } from './state.js';
import { renderAuthUI } from './auth.js';

export function renderAll() {
  renderCategoryCapsules();
  renderList();
  renderFAB();
  renderBatchBar();
  renderAuthUI();
  lucide.createIcons();
}

export function switchTab(tab) {
  state.activeTab = tab;
  state.isBatchMode = false;
  state.selectedIds = [];

  const btn = document.getElementById('batch-btn');
  const text = document.getElementById('batch-btn-text');
  if (btn && text) {
    btn.classList.add('bg-orange-50', 'text-orange-500');
    btn.classList.remove('bg-orange-500', 'text-white');
    text.innerText = '批次編輯';
  }

  ['main', 'addon', 'menu'].forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    if (tabBtn) {
      if (t === tab) {
        tabBtn.classList.add('border-orange-500', 'text-orange-500');
        tabBtn.classList.remove('border-transparent', 'text-gray-400');
      } else {
        tabBtn.classList.remove('border-orange-500', 'text-orange-500');
        tabBtn.classList.add('border-transparent', 'text-gray-400');
      }
    }
  });

  const bar = document.getElementById('search-category-bar');
  if (bar) {
    if (tab === 'main') {
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }

  renderAll();
}

export function renderCategoryCapsules() {
  const container = document.getElementById('category-capsules');
  if (!container) return;

  let html = `<button onclick="selectCategory('全部')" class="px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-colors ${state.activeCategory === '全部' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}">全部</button>`;

  state.categories.forEach(cat => {
    html += `<button onclick="selectCategory('${cat}')" class="px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-colors ${state.activeCategory === cat ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}">${cat}</button>`;
  });
  container.innerHTML = html;
}

export function selectCategory(cat) {
  state.activeCategory = cat;
  renderAll();
}

export function handleSearch(val) {
  state.searchTerm = val.trim().toLowerCase();
  renderList();
  lucide.createIcons();
}

export function renderList() {
  const container = document.getElementById('main-content');
  if (!container) return;

  if (state.activeTab === 'main') {
    renderMainItems(container);
  } else if (state.activeTab === 'addon') {
    renderAddonGroups(container);
  } else if (state.activeTab === 'menu') {
    renderScheduledMenus(container);
  }
}

export function renderMainItems(container) {
  const filtered = state.items.filter(item => {
    const matchesCategory = state.activeCategory === '全部' || item.category === state.activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-gray-400 text-[15px] italic">無符合之菜單項目</div>`;
    return;
  }

  let html = '';
  filtered.forEach((item, idx) => {
    const isSelected = state.selectedIds.includes(item.id);
    const isInactive = item.status !== 'active' || (item.stockEnabled && item.currentStock <= 0);
    const cardClass = `bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center space-x-4 
          ${isSelected ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100'} 
          ${isInactive ? 'bg-gray-50 opacity-60 grayscale-[0.5]' : ''} 
          ${!state.isBatchMode ? 'active:bg-gray-50 shadow-md' : ''}`;

    html += `
      <div 
        class="${cardClass}" 
        draggable="${!state.isBatchMode}"
        data-index="${idx}"
        data-list-type="main"
        ondragstart="handleDragStart(event, ${idx})"
        ondragover="handleDragOver(event)"
        ondragenter="handleDragEnter(${idx})"
        ondragend="handleDragEnd('main')"
        onclick="handleItemClick(event, ${item.id})"
      >
        ${state.isBatchMode ? `
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'}">
            ${isSelected ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
          </div>
        ` : `
          <div 
            class="p-1 text-gray-300 cursor-grab active:cursor-grabbing"
            ontouchstart="handleTouchStart(event, ${idx}, 'main')"
          >
            <i data-lucide="grip-vertical" class="w-6 h-6"></i>
          </div>
        `}

        <div class="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover pointer-events-none" />` : `<div class="w-full h-full flex items-center justify-center text-gray-300"><i data-lucide="image" class="w-6 h-6"></i></div>`}
          ${isInactive ? `
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span class="text-white text-[11px] font-bold px-1.5 py-0.5 border border-white rounded text-center leading-tight">
                ${item.status === 'inactive-today' ? '今日下架' : (item.stockEnabled && item.currentStock <= 0) ? '已售完' : '已下架'}
              </span>
            </div>
          ` : ''}
        </div>

        <div class="flex-grow min-w-0 pointer-events-none">
          <div class="flex justify-between items-start mb-1">
            <div class="flex items-center space-x-2 min-w-0">
              <h3 class="font-bold text-[15px] text-gray-900 truncate">${item.name}</h3>
              ${item.status !== 'active' ? `
                <span class="flex-shrink-0 text-[11px] px-1.5 py-0.5 rounded font-bold ${item.status === 'inactive-today' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}">
                  ${item.status === 'inactive-today' ? '停供' : '停售'}
                </span>
              ` : ''}
            </div>
            <span class="text-orange-500 font-bold ml-2 text-[15px]">$${item.price}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-1">
            ${item.tags ? item.tags.slice(0, 2).map(tag => `<span class="text-[13px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-medium">${tag}</span>`).join('') : ''}
            ${item.addonGroupIds ? item.addonGroupIds.map(gId => {
              const gp = state.addonGroups.find(g => g.id === gId);
              return gp ? `<span class="text-[13px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium flex items-center"><i data-lucide="link" class="w-3 h-3 mr-1"></i> ${gp.name}</span>` : '';
            }).join('') : ''}
            ${item.remarksEnabled ? `<span class="text-[13px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium flex items-center"><i data-lucide="message-square" class="w-3 h-3 mr-1"></i> 備註</span>` : ''}
          </div>
        </div>

        ${!state.isBatchMode ? `
          <div class="flex flex-col items-center space-y-2 flex-shrink-0 border-l border-gray-100 pl-3 ml-2">
            <button onclick="duplicateItem(event, ${item.id})" class="p-1 text-gray-400 hover:text-orange-500 transition-colors"><i data-lucide="copy" class="w-5 h-5"></i></button>
            <button onclick="openEditItem(event, ${item.id})" class="p-1 text-gray-400 hover:text-blue-500 transition-colors"><i data-lucide="edit-2" class="w-5 h-5"></i></button>
          </div>
        ` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

export function renderAddonGroups(container) {
  let html = `
    <div class="bg-orange-50 p-4 rounded-xl flex items-start space-x-3 mb-4">
      <i data-lucide="layers" class="text-orange-500 mt-1 w-[22px] h-[22px] flex-shrink-0"></i>
      <p class="text-[13px] text-orange-700 leading-relaxed">長按左側手柄可調整排序。下架規格會以紅色標示，提醒目前不對外提供點餐。</p>
    </div>
  `;

  state.addonGroups.forEach((group, idx) => {
    const isSelected = state.selectedIds.includes(group.id);
    const cardClass = `bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center space-x-3 ${isSelected ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100'} ${!state.isBatchMode ? 'active:bg-gray-50' : ''}`;

    html += `
      <div 
        class="${cardClass}"
        draggable="${!state.isBatchMode}"
        data-index="${idx}"
        data-list-type="addon"
        ondragstart="handleDragStart(event, ${idx})"
        ondragover="handleDragOver(event)"
        ondragenter="handleDragEnter(${idx})"
        ondragend="handleDragEnd('addon')"
        onclick="handleItemClick(event, '${group.id}')"
      >
        ${state.isBatchMode ? `
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'}">
            ${isSelected ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
          </div>
        ` : `
          <div 
            class="p-1 text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing"
            ontouchstart="handleTouchStart(event, ${idx}, 'addon')"
          >
            <i data-lucide="grip-vertical" class="w-6 h-6"></i>
          </div>
        `}

        <div class="flex-grow min-w-0 pointer-events-none">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center space-x-2 truncate">
              <h3 class="font-bold text-[15px] text-gray-900 truncate">${group.name}</h3>
              <span class="text-[13px] px-2 py-0.5 rounded-full ${group.selectionMode === 'single' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}">
                ${group.selectionMode === 'single' ? '單選' : '複選'}
              </span>
            </div>
            ${group.status !== 'active' ? `
              <div class="flex items-center px-2 py-0.5 rounded-full border text-[13px] font-bold ${group.status === 'inactive-today' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-red-50 border-red-100 text-red-500'}">
                ${group.status === 'inactive-today' ? '<i data-lucide="calendar-x" class="w-[14px] h-[14px] mr-1"></i>今日下架' : '<i data-lucide="stop-circle" class="w-[14px] h-[14px] mr-1"></i>已下架'}
              </div>
            ` : ''}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${group.options.map(opt => `
              <div class="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-[13px] flex items-center">
                <span class="text-gray-600">${opt.name}</span>
                ${opt.price > 0 ? `<span class="ml-1 text-orange-500">+$${opt.price}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        ${!state.isBatchMode ? `
          <div class="flex-shrink-0 border-l border-gray-100 pl-3 ml-2">
            <button onclick="openEditAddon(event, '${group.id}')" class="p-2 text-gray-400 hover:text-blue-500 transition-colors"><i data-lucide="edit-2" class="w-5 h-5"></i></button>
          </div>
        ` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

export function renderScheduledMenus(container) {
  let html = `
    <div class="bg-orange-50 p-4 rounded-xl flex items-start space-x-3 mb-4">
      <i data-lucide="calendar" class="text-orange-500 mt-1 w-[22px] h-[22px] flex-shrink-0"></i>
      <p class="text-[13px] text-orange-700 leading-relaxed">在這裡設定不同時段的菜單清單。顧客僅能在指定時間點購該清單內的商品。</p>
    </div>
  `;

  state.scheduledMenus.forEach((menu, idx) => {
    const isSelected = state.selectedIds.includes(menu.id);
    const cardClass = `bg-white rounded-2xl p-4 shadow-sm border transition-all flex items-center space-x-4 
          ${isSelected ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100'} 
          ${!state.isBatchMode ? 'active:bg-gray-50 shadow-md' : ''}`;

    html += `
      <div 
        class="${cardClass}"
        draggable="${!state.isBatchMode}"
        data-index="${idx}"
        data-list-type="menu"
        ondragstart="handleDragStart(event, ${idx})"
        ondragover="handleDragOver(event)"
        ondragenter="handleDragEnter(${idx})"
        ondragend="handleDragEnd('menu')"
        onclick="handleItemClick(event, '${menu.id}')"
      >
        ${state.isBatchMode ? `
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'}"></div>
        ` : `
          <div 
            class="p-1 text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing"
            ontouchstart="handleTouchStart(event, ${idx}, 'menu')"
          >
            <i data-lucide="grip-vertical" class="w-6 h-6"></i>
          </div>
        `}

        <div class="flex-grow min-w-0 pointer-events-none">
          <div class="flex justify-between items-start mb-1">
            <h3 class="font-bold text-[15px] text-gray-900 truncate">${menu.name}</h3>
            ${menu.status !== 'active' ? `
              <div class="flex items-center px-2 py-0.5 rounded-full border text-[13px] font-bold ${menu.status === 'inactive-today' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-red-50 border-red-100 text-red-500'}">
                ${menu.status === 'inactive-today' ? '<i data-lucide="calendar-x" class="w-[14px] h-[14px] mr-1"></i>今日下架' : '<i data-lucide="slash" class="w-[14px] h-[14px] mr-1"></i>已停用'}
              </div>
            ` : ''}
          </div>
          <div class="flex items-center text-[15px] text-gray-500 space-x-5">
            <div class="flex items-center"><i data-lucide="clock" class="mr-1.5 text-orange-400 w-4 h-4"></i>${menu.startTime} - ${menu.endTime}</div>
            <div class="flex items-center"><i data-lucide="layout-grid" class="mr-1.5 text-orange-400 w-4 h-4"></i>${menu.itemIds.length} 個品項</div>
          </div>
        </div>

        ${!state.isBatchMode ? `
          <div class="flex-shrink-0 border-l border-gray-100 pl-3 ml-2">
            <button onclick="openEditMenu(event, '${menu.id}')" class="p-2 text-gray-400 hover:text-blue-500 transition-colors"><i data-lucide="edit-2" class="w-5 h-5"></i></button>
          </div>
        ` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

export function renderFAB() {
  const fab = document.getElementById('global-fab');
  if (!fab) return;
  if (state.isBatchMode) {
    fab.classList.add('hidden');
  } else {
    fab.classList.remove('hidden');
  }
}

export function handleFabClick() {
  if (state.activeTab === 'main') {
    openModal();
  } else if (state.activeTab === 'addon') {
    openAddonModal();
  } else if (state.activeTab === 'menu') {
    openMenuModal();
  }
}

export function handleDragStart(e, idx) {
  state.draggedIndex = idx;
}

export function handleDragOver(e) {
  e.preventDefault();
}

export function handleDragEnter(idx) {
  if (state.draggedIndex === null || state.draggedIndex === idx) return;

  let list = [];
  if (state.activeTab === 'main') {
    list = state.items;
  } else if (state.activeTab === 'addon') {
    list = state.addonGroups;
  } else if (state.activeTab === 'menu') {
    list = state.scheduledMenus;
  }

  const draggedItem = list.splice(state.draggedIndex, 1)[0];
  list.splice(idx, 0, draggedItem);

  state.draggedIndex = idx;
  renderList();
}

export function handleDragEnd() {
  state.draggedIndex = null;
  renderAll();
}

export function handleTouchStart(e, idx, listType) {
  state.draggedIndex = idx;
  state.activeTouchListType = listType;

  window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
  window.addEventListener('touchend', handleWindowTouchEnd);

  const containerItem = document.querySelector(`[data-index="${idx}"][data-list-type="${listType}"]`);
  if (containerItem) {
    containerItem.classList.add('dragging-active');
  }
}

export function handleWindowTouchMove(e) {
  if (state.draggedIndex === null) return;
  e.preventDefault();

  const touch = e.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!element) return;

  const targetItem = element.closest(`[data-list-type="${state.activeTouchListType}"]`);
  if (!targetItem) return;

  const targetIdx = parseInt(targetItem.getAttribute('data-index'));
  if (isNaN(targetIdx) || targetIdx === state.draggedIndex) return;

  let list = [];
  if (state.activeTouchListType === 'main') {
    list = state.items;
  } else if (state.activeTouchListType === 'addon') {
    list = state.addonGroups;
  } else if (state.activeTouchListType === 'menu') {
    list = state.scheduledMenus;
  } else if (state.activeTouchListType === 'category') {
    list = state.categories;
  }

  const draggedItem = list.splice(state.draggedIndex, 1)[0];
  list.splice(targetIdx, 0, draggedItem);

  state.draggedIndex = targetIdx;

  if (state.activeTouchListType === 'main' || state.activeTouchListType === 'addon' || state.activeTouchListType === 'menu') {
    if (state.activeTouchListType === 'main') state.items = list;
    if (state.activeTouchListType === 'addon') state.addonGroups = list;
    if (state.activeTouchListType === 'menu') state.scheduledMenus = list;
    renderList();
  } else if (state.activeTouchListType === 'category') {
    state.categories = list;
    renderCategoryModalList();
  }

  const containerItem = document.querySelector(`[data-index="${state.draggedIndex}"][data-list-type="${state.activeTouchListType}"]`);
  if (containerItem) {
    containerItem.classList.add('dragging-active');
  }

  lucide.createIcons();
}

export function handleWindowTouchEnd() {
  window.removeEventListener('touchmove', handleWindowTouchMove);
  window.removeEventListener('touchend', handleWindowTouchEnd);

  state.draggedIndex = null;
  state.activeTouchListType = '';
  renderAll();
}

export function toggleBatchMode(force) {
  state.isBatchMode = (force !== undefined) ? force : !state.isBatchMode;
  state.selectedIds = [];

  const btn = document.getElementById('batch-btn');
  const text = document.getElementById('batch-btn-text');
  if (btn && text) {
    if (state.isBatchMode) {
      btn.classList.add('bg-orange-500', 'text-white');
      btn.classList.remove('bg-orange-50', 'text-orange-500');
      text.innerText = '取消批次';
    } else {
      btn.classList.add('bg-orange-50', 'text-orange-500');
      btn.classList.remove('bg-orange-500', 'text-white');
      text.innerText = '批次編輯';
    }
  }

  const restockBtn = document.getElementById('batch-restock-btn');
  if (restockBtn) {
    if (state.activeTab === 'main') {
      restockBtn.style.opacity = '1';
      restockBtn.disabled = false;
    } else {
      restockBtn.style.opacity = '0.2';
      restockBtn.disabled = true;
    }
  }

  renderAll();
}

export function handleItemClick(e, id) {
  if (!state.isBatchMode) return;
  e.stopPropagation();

  if (state.selectedIds.includes(id)) {
    state.selectedIds = state.selectedIds.filter(x => x !== id);
  } else {
    state.selectedIds.push(id);
  }

  renderAll();
}

export function batchSelectAll() {
  let currentList = [];
  if (state.activeTab === 'main') {
    currentList = state.items;
  } else if (state.activeTab === 'addon') {
    currentList = state.addonGroups;
  } else if (state.activeTab === 'menu') {
    currentList = state.scheduledMenus;
  }

  if (state.selectedIds.length === currentList.length) {
    state.selectedIds = [];
  } else {
    state.selectedIds = currentList.map(x => x.id);
  }
  renderAll();
}

export function renderBatchBar() {
  const bar = document.getElementById('batch-bar');
  const countText = document.getElementById('batch-count');

  if (!bar || !countText) return;
  if (state.isBatchMode && state.selectedIds.length > 0) {
    bar.classList.remove('hidden');
    countText.innerText = `已選取 ${state.selectedIds.length} 項`;
  } else {
    bar.classList.add('hidden');
  }
}

export function triggerBatchAction(action) {
  if (state.selectedIds.length === 0) return;

  if (state.activeTab === 'main') {
    if (action === 'delete') {
      state.items = state.items.filter(item => !state.selectedIds.includes(item.id));
    } else if (action === 'active' || action === 'inactive' || action === 'inactive-today') {
      state.items = state.items.map(item => {
        if (state.selectedIds.includes(item.id)) {
          return { ...item, status: action === 'active' ? 'active' : action };
        }
        return item;
      });
    } else if (action === 'restock') {
      state.items = state.items.map(item => {
        if (state.selectedIds.includes(item.id) && item.stockEnabled) {
          return { ...item, currentStock: item.autoRestock };
        }
        return item;
      });
    }
  } else if (state.activeTab === 'addon') {
    if (action === 'delete') {
      state.addonGroups = state.addonGroups.filter(g => !state.selectedIds.includes(g.id));
    } else if (action === 'active' || action === 'inactive' || action === 'inactive-today') {
      state.addonGroups = state.addonGroups.map(g => {
        if (state.selectedIds.includes(g.id)) {
          return { ...g, status: action === 'active' ? 'active' : action };
        }
        return g;
      });
    }
  } else if (state.activeTab === 'menu') {
    if (action === 'delete') {
      state.scheduledMenus = state.scheduledMenus.filter(m => !state.selectedIds.includes(m.id));
    } else if (action === 'active' || action === 'inactive' || action === 'inactive-today') {
      state.scheduledMenus = state.scheduledMenus.map(m => {
        if (state.selectedIds.includes(m.id)) {
          return { ...m, status: action === 'active' ? 'active' : action };
        }
        return m;
      });
    }
  }

  toggleBatchMode(false);
}

export function duplicateItem(e, id) {
  e.stopPropagation();
  const origin = state.items.find(x => x.id === id);
  if (!origin) return;

  const copy = {
    ...origin,
    id: Date.now(),
    name: `${origin.name} (副本)`,
    status: 'inactive'
  };

  state.items = [copy, ...state.items];
  renderAll();
}

export function previewImage(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      state.formData.image = evt.target.result;
      const preview = document.getElementById('item-img-preview');
      const previewContainer = document.getElementById('img-preview-container');
      const placeholder = document.getElementById('img-placeholder');
      if (preview) preview.src = evt.target.result;
      if (previewContainer) previewContainer.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

export function removeImage() {
  state.formData.image = null;
  const preview = document.getElementById('item-img-preview');
  const previewContainer = document.getElementById('img-preview-container');
  const placeholder = document.getElementById('img-placeholder');
  if (preview) preview.src = '';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
}

export function populateCategoryOptions() {
  const select = document.getElementById('item-category');
  if (!select) return;
  select.innerHTML = state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

export function renderItemTags() {
  const container = document.getElementById('item-tags-container');
  if (!container) return;
  container.innerHTML = (state.formData.tags || []).map((tag, index) => `
    <span class="inline-flex items-center bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[13px] font-medium border border-orange-100">
      ${tag}
      <button onclick="removeItemTag(${index})" class="ml-2 p-0.5 hover:bg-orange-200 rounded-full"><i data-lucide="x" class="w-3 h-3"></i></button>
    </span>
  `).join('');
  lucide.createIcons();
}

export function addTagFromInput() {
  const input = document.getElementById('tag-input');
  if (!input) return;

  const value = input.value.trim();
  if (value && !state.formData.tags.includes(value)) {
    state.formData.tags.push(value);
    input.value = '';
    renderItemTags();
  }
}

export function removeItemTag(index) {
  state.formData.tags.splice(index, 1);
  renderItemTags();
}

export function toggleItemRemarks() {
  state.formData.remarksEnabled = !state.formData.remarksEnabled;
  const btn = document.getElementById('btn-remarks-toggle');
  if (btn) {
    btn.innerHTML = state.formData.remarksEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  }
  lucide.createIcons();
}

export function toggleItemStock() {
  state.formData.stockEnabled = !state.formData.stockEnabled;
  const btn = document.getElementById('btn-stock-toggle');
  const fields = document.getElementById('stock-fields');
  const stockField = document.getElementById('item-stock');
  const restockField = document.getElementById('item-restock');

  if (btn) {
    btn.innerHTML = state.formData.stockEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  }
  if (fields) {
    if (state.formData.stockEnabled) {
      fields.classList.remove('hidden');
    } else {
      fields.classList.add('hidden');
    }
  }
  if (state.formData.stockEnabled) {
    if (stockField) stockField.value = state.formData.currentStock;
    if (restockField) restockField.value = state.formData.autoRestock;
  }
  lucide.createIcons();
}

export function setItemStatus(status) {
  state.formData.status = status;
  ['active', 'inactive', 'inactive-today'].forEach(s => {
    const btn = document.getElementById(`btn-status-${s}`);
    if (!btn) return;
    if (s === status) {
      btn.className = "flex-1 py-3 text-[13px] rounded-2xl transition-all bg-white shadow-md font-bold border border-gray-200 " +
        (s === 'active' ? 'text-green-600' : s === 'inactive' ? 'text-red-500' : 'text-blue-500');
    } else {
      btn.className = 'flex-1 py-3 text-[13px] rounded-2xl transition-all text-gray-500';
    }
  });
}

export function renderAddonSelectionInItem() {
  const container = document.getElementById('item-addons-list');
  if (!container) return;
  container.innerHTML = state.addonGroups.map(group => {
    const checked = state.formData.addonGroupIds.includes(group.id);
    return `
      <div onclick="toggleItemAddonLink('${group.id}')" class="flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${checked ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500'}">
        <span class="text-[15px] font-medium">${group.name}</span>
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}">
          ${checked ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

export function toggleItemAddonLink(gId) {
  if (state.formData.addonGroupIds.includes(gId)) {
    state.formData.addonGroupIds = state.formData.addonGroupIds.filter(id => id !== gId);
  } else {
    state.formData.addonGroupIds.push(gId);
  }
  renderAddonSelectionInItem();
}

export function openModal() {
  if (state.isBatchMode) return;
  state.editingItem = null;
  state.formData = {
    name: '',
    price: '',
    category: state.categories[0] || '未分類',
    description: '',
    status: 'active',
    tags: [],
    image: null,
    stockEnabled: false,
    currentStock: 0,
    autoRestock: 0,
    addonGroupIds: [],
    remarksEnabled: true
  };

  const deleteBtn = document.getElementById('delete-item-btn');
  if (deleteBtn) deleteBtn.classList.add('hidden');
  const title = document.getElementById('modal-item-title');
  if (title) title.innerText = '新增菜單品項';
  const nameInput = document.getElementById('item-name');
  const priceInput = document.getElementById('item-price');

  if (nameInput) nameInput.value = '';
  if (priceInput) priceInput.value = '';
  removeImage();
  populateCategoryOptions();
  setItemStatus('active');

  const remarksBtn = document.getElementById('btn-remarks-toggle');
  if (remarksBtn) remarksBtn.innerHTML = '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>';
  const stockBtn = document.getElementById('btn-stock-toggle');
  if (stockBtn) stockBtn.innerHTML = '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  const stockFields = document.getElementById('stock-fields');
  if (stockFields) stockFields.classList.add('hidden');
  const itemStock = document.getElementById('item-stock');
  const itemRestock = document.getElementById('item-restock');
  if (itemStock) itemStock.value = '';
  if (itemRestock) itemRestock.value = '';

  renderItemTags();
  renderAddonSelectionInItem();

  const modal = document.getElementById('modal-item');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

export function openEditItem(e, id) {
  e.stopPropagation();
  if (state.isBatchMode) return;
  const item = state.items.find(x => x.id === id);
  if (!item) return;

  state.editingItem = item;
  state.formData = JSON.parse(JSON.stringify(item));

  const title = document.getElementById('modal-item-title');
  if (title) title.innerText = '編輯菜單品項';
  const deleteBtn = document.getElementById('delete-item-btn');
  if (deleteBtn) deleteBtn.classList.remove('hidden');

  const nameInput = document.getElementById('item-name');
  const priceInput = document.getElementById('item-price');
  if (nameInput) nameInput.value = state.formData.name;
  if (priceInput) priceInput.value = state.formData.price;

  if (state.formData.image) {
    const preview = document.getElementById('item-img-preview');
    const previewContainer = document.getElementById('img-preview-container');
    const placeholder = document.getElementById('img-placeholder');
    if (preview) preview.src = state.formData.image;
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
  } else {
    removeImage();
  }

  populateCategoryOptions();
  const categoryInput = document.getElementById('item-category');
  if (categoryInput) categoryInput.value = state.formData.category;
  setItemStatus(state.formData.status);

  const remarksBtn = document.getElementById('btn-remarks-toggle');
  const stockBtn = document.getElementById('btn-stock-toggle');
  if (remarksBtn) remarksBtn.innerHTML = state.formData.remarksEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  if (stockBtn) stockBtn.innerHTML = state.formData.stockEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';

  const stockFields = document.getElementById('stock-fields');
  const itemStock = document.getElementById('item-stock');
  const itemRestock = document.getElementById('item-restock');
  if (state.formData.stockEnabled) {
    if (stockFields) stockFields.classList.remove('hidden');
    if (itemStock) itemStock.value = state.formData.currentStock;
    if (itemRestock) itemRestock.value = state.formData.autoRestock;
  } else {
    if (stockFields) stockFields.classList.add('hidden');
    if (itemStock) itemStock.value = '';
    if (itemRestock) itemRestock.value = '';
  }

  renderItemTags();
  renderAddonSelectionInItem();

  const modal = document.getElementById('modal-item');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

export function closeItemModal() {
  const modal = document.getElementById('modal-item');
  if (modal) modal.classList.add('hidden');
}

export function saveItem() {
  const nameInput = document.getElementById('item-name');
  const priceInput = document.getElementById('item-price');
  const categoryInput = document.getElementById('item-category');

  const name = nameInput?.value.trim();
  const price = parseFloat(priceInput?.value);
  const category = categoryInput?.value;

  if (!name || isNaN(price)) {
    alert('請填寫品項名稱與售價');
    return;
  }

  state.formData.name = name;
  state.formData.price = price;
  state.formData.category = category;

  if (state.formData.stockEnabled) {
    const currentStockInput = document.getElementById('item-stock');
    const autoRestockInput = document.getElementById('item-restock');
    state.formData.currentStock = parseInt(currentStockInput?.value) || 0;
    state.formData.autoRestock = parseInt(autoRestockInput?.value) || 0;
  }

  if (state.editingItem) {
    state.items = state.items.map(i => i.id === state.editingItem.id ? { ...state.formData } : i);
  } else {
    state.items = [{ ...state.formData, id: Date.now() }, ...state.items];
  }

  closeItemModal();
  renderAll();
}

export function deleteCurrentItem() {
  if (state.editingItem) {
    deleteItem(state.editingItem.id);
    closeItemModal();
  }
}

export function deleteItem(id) {
  state.items = state.items.filter(i => i.id !== id);
  renderAll();
}

export function setAddonGroupStatus(status) {
  state.addonFormData.status = status;
  ['active', 'inactive', 'inactive-today'].forEach(s => {
    const btn = document.getElementById(`btn-addon-status-${s}`);
    if (!btn) return;
    if (s === status) {
      btn.className = "flex-1 py-3 text-[13px] rounded-2xl transition-all bg-white shadow-md font-bold border border-gray-200 " +
        (s === 'active' ? 'text-green-600' : s === 'inactive' ? 'text-red-500' : 'text-blue-500');
    } else {
      btn.className = 'flex-1 py-3 text-[13px] rounded-2xl transition-all text-gray-500';
    }
  });
}

export function setAddonSelectionMode(mode) {
  state.addonFormData.selectionMode = mode;
  ['single', 'multiple'].forEach(m => {
    const btn = document.getElementById(`btn-addon-mode-${m}`);
    if (!btn) return;
    if (m === mode) {
      btn.className = `flex-1 py-2 text-[13px] rounded-xl transition-all bg-white shadow-sm font-bold ${m === 'single' ? 'text-blue-600' : 'text-purple-600'}`;
    } else {
      btn.className = 'flex-1 py-2 text-[13px] rounded-xl transition-all text-gray-500';
    }
  });
}

export function renderAddonFormOptions() {
  const container = document.getElementById('addon-options-list');
  if (!container) return;
  container.innerHTML = state.addonFormData.options.map((opt, index) => `
    <div class="bg-white border border-gray-100 p-5 rounded-[2.5rem] shadow-sm space-y-4 relative">
      <button onclick="removeAddonOption('${opt.id}')" class="absolute top-4 right-4 text-gray-300 hover:text-red-500"><i data-lucide="x" class="w-5 h-5"></i></button>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-[13px] font-bold text-gray-400 ml-1">選項名稱</label>
          <input type="text" placeholder="名稱" onchange="updateAddonOption('${opt.id}', 'name', this.value)" value="${opt.name}" class="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-[15px] font-bold outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <div class="space-y-1">
          <label class="text-[13px] font-bold text-gray-400 ml-1">加價金額</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-bold">$</span>
            <input type="number" placeholder="加價" onchange="updateAddonOption('${opt.id}', 'price', this.value)" value="${opt.price}" class="w-full bg-gray-50 border-none rounded-2xl pl-8 pr-4 py-3 text-[15px] font-bold outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>
      </div>
      <div>
        <label class="block text-[13px] font-bold text-gray-400 mb-2 ml-1 flex items-center">
          <i data-lucide="external-link" class="w-4 h-4 mr-1"></i> 觸發子規格設定 (複選)
        </label>
        <div class="flex flex-wrap gap-2">
          ${state.addonGroups.filter(g => g.id !== state.addonFormData.id).map(g => {
            const active = (opt.subGroupIds || []).includes(g.id);
            return `
              <button 
                type="button" 
                onclick="toggleSubGroupInOptionInline(${index}, '${g.id}')" 
                class="px-4 py-2 rounded-2xl text-[13px] border transition-all ${active ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-400'}"
              >
                ${g.name}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

export function addAddonOption() {
  const newItem = { id: 'opt_' + Date.now(), name: '', price: 0, subGroupIds: [] };
  state.addonFormData.options = [newItem, ...state.addonFormData.options];
  renderAddonFormOptions();
}

export function removeAddonOption(id) {
  state.addonFormData.options = state.addonFormData.options.filter(o => o.id !== id);
  renderAddonFormOptions();
}

export function updateAddonOption(id, field, value) {
  state.addonFormData.options = state.addonFormData.options.map(opt => {
    if (opt.id === id) {
      return { ...opt, [field]: field === 'price' ? (parseInt(value) || 0) : value };
    }
    return opt;
  });
}

export function toggleSubGroupInOptionInline(optIdx, gId) {
  const opt = state.addonFormData.options[optIdx];
  if (!opt.subGroupIds) opt.subGroupIds = [];
  if (opt.subGroupIds.includes(gId)) {
    opt.subGroupIds = opt.subGroupIds.filter(id => id !== gId);
  } else {
    opt.subGroupIds.push(gId);
  }
  renderAddonFormOptions();
}

export function openAddonModal(group = null) {
  if (state.isBatchMode) return;
  if (group) {
    state.addonFormData = JSON.parse(JSON.stringify(group));
    const title = document.getElementById('modal-addon-title');
    if (title) title.innerText = '編輯規格組';
    const deleteBtn = document.getElementById('delete-addon-group-btn');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
  } else {
    state.addonFormData = {
      id: 'g' + Date.now().toString(),
      name: '',
      status: 'active',
      selectionMode: 'single',
      options: [{ id: 'opt_' + Date.now(), name: '', price: 0, subGroupIds: [] }]
    };
    const title = document.getElementById('modal-addon-title');
    if (title) title.innerText = '新增規格組';
    const deleteBtn = document.getElementById('delete-addon-group-btn');
    if (deleteBtn) deleteBtn.classList.add('hidden');
  }

  const nameInput = document.getElementById('addon-group-name');
  if (nameInput) nameInput.value = state.addonFormData.name;
  setAddonGroupStatus(state.addonFormData.status);
  setAddonSelectionMode(state.addonFormData.selectionMode);
  renderAddonFormOptions();

  const modal = document.getElementById('modal-addon');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

export function closeAddonModal() {
  const modal = document.getElementById('modal-addon');
  if (modal) modal.classList.add('hidden');
}

export function saveAddonGroup() {
  const nameInput = document.getElementById('addon-group-name');
  const name = nameInput?.value.trim();
  if (!name) {
    alert('請輸入規格組名稱');
    return;
  }
  state.addonFormData.name = name;

  const existingIndex = state.addonGroups.findIndex(g => g.id === state.addonFormData.id);
  if (existingIndex > -1) {
    state.addonGroups[existingIndex] = { ...state.addonFormData };
  } else {
    state.addonGroups = [{ ...state.addonFormData }, ...state.addonGroups];
  }

  closeAddonModal();
  renderAll();
}

export function deleteCurrentAddonGroup() {
  if (state.addonFormData && state.addonFormData.id) {
    deleteAddonGroup(state.addonFormData.id);
    closeAddonModal();
  }
}

export function deleteAddonGroup(id) {
  state.addonGroups = state.addonGroups.filter(g => g.id !== id);
  renderAll();
}

export function openEditAddon(e, id) {
  e.stopPropagation();
  const group = state.addonGroups.find(g => g.id === id);
  if (group) {
    openAddonModal(group);
  }
}

export function setMenuStatus(status) {
  state.menuFormData.status = status;
  ['active', 'inactive', 'inactive-today'].forEach(s => {
    const btn = document.getElementById(`btn-menu-status-${s}`);
    if (!btn) return;
    if (s === status) {
      btn.className = "flex-1 py-3 text-[13px] rounded-2xl transition-all bg-white shadow-md font-bold border border-gray-200 " +
        (s === 'active' ? 'text-green-600' : s === 'inactive' ? 'text-red-500' : 'text-blue-500');
    } else {
      btn.className = 'flex-1 py-3 text-[13px] rounded-2xl transition-all text-gray-500';
    }
  });
}

export function renderMenuItemsSelectList() {
  const container = document.getElementById('menu-items-select-list');
  if (!container) return;

  const mainItems = state.items.filter(i => i.type === 'main');
  container.innerHTML = mainItems.map(item => {
    const checked = state.menuFormData.itemIds.includes(item.id);
    return `
      <div onclick="toggleItemInMenuSelect(${item.id})" class="flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${checked ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm font-bold' : 'bg-white border-gray-100 text-gray-500'}">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-gray-300"><i data-lucide="image" class="w-5 h-5"></i></div>`}
          </div>
          <span class="text-[15px] font-medium">${item.name}</span>
        </div>
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}">
          ${checked ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

export function toggleItemInMenuSelect(itemId) {
  if (state.menuFormData.itemIds.includes(itemId)) {
    state.menuFormData.itemIds = state.menuFormData.itemIds.filter(id => id !== itemId);
  } else {
    state.menuFormData.itemIds.push(itemId);
  }
  renderMenuItemsSelectList();
}

export function openMenuModal(menu = null) {
  if (state.isBatchMode) return;
  if (menu) {
    state.menuFormData = JSON.parse(JSON.stringify(menu));
    const title = document.getElementById('modal-menu-title');
    if (title) title.innerText = '編輯時段菜單';
    const deleteBtn = document.getElementById('delete-menu-btn');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
  } else {
    state.menuFormData = { id: 'm' + Date.now(), name: '', startTime: '09:00', endTime: '18:00', itemIds: [], status: 'active' };
    const title = document.getElementById('modal-menu-title');
    if (title) title.innerText = '新增時段菜單';
    const deleteBtn = document.getElementById('delete-menu-btn');
    if (deleteBtn) deleteBtn.classList.add('hidden');
  }

  const nameInput = document.getElementById('menu-name');
  const startInput = document.getElementById('menu-start');
  const endInput = document.getElementById('menu-end');
  if (nameInput) nameInput.value = state.menuFormData.name;
  if (startInput) startInput.value = state.menuFormData.startTime;
  if (endInput) endInput.value = state.menuFormData.endTime;
  setMenuStatus(state.menuFormData.status);
  renderMenuItemsSelectList();

  const modal = document.getElementById('modal-menu');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

export function closeMenuModal() {
  const modal = document.getElementById('modal-menu');
  if (modal) modal.classList.add('hidden');
}

export function saveScheduledMenu() {
  const nameInput = document.getElementById('menu-name');
  const startInput = document.getElementById('menu-start');
  const endInput = document.getElementById('menu-end');

  const name = nameInput?.value.trim();
  const start = startInput?.value;
  const end = endInput?.value;

  if (!name || !start || !end) {
    alert('請填寫完整時段菜單資訊');
    return;
  }

  state.menuFormData.name = name;
  state.menuFormData.startTime = start;
  state.menuFormData.endTime = end;

  const existingIndex = state.scheduledMenus.findIndex(m => m.id === state.menuFormData.id);
  if (existingIndex > -1) {
    state.scheduledMenus[existingIndex] = { ...state.menuFormData };
  } else {
    state.scheduledMenus = [{ ...state.menuFormData }, ...state.scheduledMenus];
  }

  closeMenuModal();
  renderAll();
}

export function deleteCurrentMenu() {
  if (state.menuFormData && state.menuFormData.id) {
    state.scheduledMenus = state.scheduledMenus.filter(m => m.id !== state.menuFormData.id);
    closeMenuModal();
    renderAll();
  }
}

export function openEditMenu(e, id) {
  e.stopPropagation();
  const menu = state.scheduledMenus.find(m => m.id === id);
  if (menu) {
    openMenuModal(menu);
  }
}

export function openStoreSettings() {
  const toggle = document.getElementById('btn-global-remarks-toggle');
  if (toggle) toggle.innerHTML = state.storeSettings.globalRemarksEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  renderCheckoutAddons();
  const modal = document.getElementById('modal-store-settings');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

export function closeStoreSettings() {
  const modal = document.getElementById('modal-store-settings');
  if (modal) modal.classList.add('hidden');
}

export function toggleGlobalRemarks() {
  state.storeSettings.globalRemarksEnabled = !state.storeSettings.globalRemarksEnabled;
  const toggle = document.getElementById('btn-global-remarks-toggle');
  if (toggle) toggle.innerHTML = state.storeSettings.globalRemarksEnabled ? '<i data-lucide="toggle-right" class="text-orange-500 w-11 h-11"></i>' : '<i data-lucide="toggle-left" class="text-gray-300 w-11 h-11"></i>';
  lucide.createIcons();
}

export function renderCheckoutAddons() {
  const container = document.getElementById('checkout-addons-list');
  if (!container) return;
  container.innerHTML = state.storeSettings.checkoutAddons.map(addon => `
    <div class="bg-white border border-gray-100 p-5 rounded-[2.5rem] shadow-sm space-y-4">
      <div class="flex items-center space-x-3">
        <input type="text" onchange="updateCheckoutAddonValue('${addon.id}', 'name', this.value)" class="flex-grow bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-bold outline-none" value="${addon.name}" />
        <button onclick="removeCheckoutAddon('${addon.id}')" class="p-2.5 text-gray-300 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 bg-gray-50 rounded-2xl px-4 py-2.5">
          <span class="text-[13px] text-gray-400 font-bold">NT$</span>
          <input type="number" onchange="updateCheckoutAddonValue('${addon.id}', 'price', this.value)" class="w-20 bg-transparent border-none p-0 text-[15px] font-bold outline-none" value="${addon.price}" />
        </div>
        <div class="flex bg-gray-100 p-1.5 rounded-2xl">
          <button onclick="updateCheckoutAddonValue('${addon.id}', 'status', 'active')" class="px-5 py-2 text-[13px] rounded-xl transition-all ${addon.status === 'active' ? 'bg-white text-green-600 shadow-sm font-bold' : 'text-gray-400'}">上架</button>
          <button onclick="updateCheckoutAddonValue('${addon.id}', 'status', 'inactive')" class="px-5 py-2 text-[13px] rounded-xl transition-all ${addon.status === 'inactive' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-gray-400'}">下架</button>
        </div>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

export function addNewCheckoutAddon() {
  const newItem = { id: 'ca_' + Date.now(), name: '新加購品', price: 0, status: 'active' };
  state.storeSettings.checkoutAddons = [newItem, ...state.storeSettings.checkoutAddons];
  renderCheckoutAddons();
}

export function removeCheckoutAddon(id) {
  state.storeSettings.checkoutAddons = state.storeSettings.checkoutAddons.filter(x => x.id !== id);
  renderCheckoutAddons();
}

export function updateCheckoutAddonValue(id, field, value) {
  state.storeSettings.checkoutAddons = state.storeSettings.checkoutAddons.map(addon => {
    if (addon.id === id) {
      return { ...addon, [field]: field === 'price' ? (parseInt(value) || 0) : value };
    }
    return addon;
  });
  if (field === 'status') renderCheckoutAddons();
}

export function openCategoryModal() {
  renderCategoryModalList();
  const modal = document.getElementById('modal-category');
  if (modal) modal.classList.remove('hidden');
}

export function closeCategoryModal() {
  const modal = document.getElementById('modal-category');
  if (modal) modal.classList.add('hidden');
  populateCategoryOptions();
}

export function renderCategoryModalList() {
  const container = document.getElementById('categories-list-container');
  if (!container) return;
  container.innerHTML = state.categories.map((cat, idx) => `
    <div 
      class="flex justify-between items-center p-5 border border-gray-100 rounded-[2rem] shadow-sm bg-white"
      draggable="true"
      data-index="${idx}"
      data-list-type="category"
      ondragstart="handleCategoryDragStart(event, ${idx})"
      ondragover="handleCategoryDragOver(event)"
      ondragenter="handleCategoryDragEnter(${idx})"
      ondragend="handleCategoryDragEnd()"
    >
      <div class="flex items-center space-x-4">
        <div 
          class="text-gray-300 cursor-move"
          ontouchstart="handleTouchStart(event, ${idx}, 'category')"
        >
          <i data-lucide="grip-vertical" class="w-6 h-6"></i>
        </div>
        <span class="text-[15px] font-bold">${cat}</span>
      </div>
      <button onclick="deleteCategory('${cat}')" class="text-red-400 p-3 hover:bg-red-50 rounded-full transition-colors">
        <i data-lucide="trash-2" class="w-[22px] h-[22px]"></i>
      </button>
    </div>
  `).join('');
  lucide.createIcons();
}

export function addCategory() {
  const input = document.getElementById('new-category-input');
  if (!input) return;
  const value = input.value.trim();
  if (value && !state.categories.includes(value)) {
    state.categories.push(value);
    input.value = '';
    renderCategoryModalList();
    renderCategoryCapsules();
    lucide.createIcons();
  }
}

export function deleteCategory(cat) {
  state.categories = state.categories.filter(c => c !== cat);
  state.items = state.items.map(item => {
    if (item.category === cat) {
      return { ...item, category: '未分類' };
    }
    return item;
  });
  if (!state.categories.includes('未分類')) {
    state.categories.push('未分類');
  }
  renderCategoryModalList();
  renderCategoryCapsules();
  renderList();
  lucide.createIcons();
}

export function handleCategoryDragStart(e, idx) {
  state.draggedCatIndex = idx;
}

export function handleCategoryDragOver(e) {
  e.preventDefault();
}

export function handleCategoryDragEnter(idx) {
  if (state.draggedCatIndex === null || state.draggedCatIndex === idx) return;
  const list = [...state.categories];
  const draggedItem = list.splice(state.draggedCatIndex, 1)[0];
  list.splice(idx, 0, draggedItem);
  state.categories = list;
  state.draggedCatIndex = idx;
  renderCategoryModalList();
}

export function handleCategoryDragEnd() {
  state.draggedCatIndex = null;
  renderCategoryCapsules();
  renderList();
  lucide.createIcons();
}

Object.assign(window, {
  renderAll,
  switchTab,
  selectCategory,
  handleSearch,
  handleFabClick,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragEnd,
  handleTouchStart,
  toggleBatchMode,
  handleItemClick,
  batchSelectAll,
  triggerBatchAction,
  duplicateItem,
  previewImage,
  removeImage,
  populateCategoryOptions,
  renderItemTags,
  addTagFromInput,
  removeItemTag,
  toggleItemRemarks,
  toggleItemStock,
  setItemStatus,
  renderAddonSelectionInItem,
  toggleItemAddonLink,
  openModal,
  openEditItem,
  closeItemModal,
  saveItem,
  deleteCurrentItem,
  deleteItem,
  setAddonGroupStatus,
  setAddonSelectionMode,
  renderAddonFormOptions,
  addAddonOption,
  removeAddonOption,
  updateAddonOption,
  toggleSubGroupInOptionInline,
  openAddonModal,
  closeAddonModal,
  saveAddonGroup,
  deleteCurrentAddonGroup,
  deleteAddonGroup,
  openEditAddon,
  setMenuStatus,
  renderMenuItemsSelectList,
  toggleItemInMenuSelect,
  openMenuModal,
  closeMenuModal,
  saveScheduledMenu,
  deleteCurrentMenu,
  openEditMenu,
  openStoreSettings,
  closeStoreSettings,
  toggleGlobalRemarks,
  renderCheckoutAddons,
  addNewCheckoutAddon,
  removeCheckoutAddon,
  updateCheckoutAddonValue,
  openCategoryModal,
  closeCategoryModal,
  renderCategoryModalList,
  addCategory,
  deleteCategory,
  handleCategoryDragStart,
  handleCategoryDragOver,
  handleCategoryDragEnter,
  handleCategoryDragEnd
});
