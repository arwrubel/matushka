// ============================================================================
// MATUSHKA - Russian Language Teaching Materials Collector
// Clean, Functional Rewrite
// ============================================================================

// =============================================================================
// CONFIG
// =============================================================================

const WORKER_URL = 'https://matushka-api.arwrubel.workers.dev';
const DEBUG = new URLSearchParams(window.location.search).has('debug');

// =============================================================================
// i18n - Only translations actually used in UI
// =============================================================================

const TRANSLATIONS = {
  en: {
    // Page
    pageTitle: 'Matushka - Russian Language Teaching Materials',

    // Header
    appTitle: 'Matushka',
    skipToMain: 'Skip to main content',

    // Hero
    heroTitle: 'Russian Language Teaching Materials',
    heroSubtitle: 'Discover authentic Russian media content from trusted sources. Download audio files and generate proper academic citations.',

    // Search
    searchLabel: 'Search keywords',
    searchPlaceholder: 'Search videos...',
    searchBtn: 'Search',
    resetBtn: 'Reset',

    // Filters
    durationTitle: 'Duration (seconds)',
    minDuration: 'Min',
    maxDuration: 'Max',
    dateRangeTitle: 'Date Range',
    startDate: 'Start',
    endDate: 'End',
    categoriesTitle: 'Categories',
    sourcesTitle: 'Sources',
    maxResultsTitle: 'Max Results',
    maxResultsLabel: 'Number of results',

    // Categories
    catPolitics: 'Politics',
    catEconomy: 'Economy',
    catSociety: 'Society',
    catEducation: 'Education',
    catWorld: 'World',
    catSports: 'Sports',
    catCulture: 'Culture',
    catScience: 'Science',
    catTechnology: 'Technology',
    catMilitary: 'Military',
    catWeather: 'Weather',
    catTourism: 'Tourism',

    // Pedagogical Level
    levelTitle: 'Pedagogical Level',
    levelBeginner: 'Beginner',
    levelBeginnerDesc: '(slow, simple topics)',
    levelIntermediate: 'Intermediate',
    levelIntermediateDesc: '(standard news)',
    levelAdvanced: 'Advanced',
    levelAdvancedDesc: '(complex topics)',

    // Content Type
    contentTypeTitle: 'Content Type',
    typeNews: 'News Reports',
    typeInterview: 'Interviews',
    typeDocumentary: 'Documentaries',
    typeSpeech: 'Speeches',

    // Sources
    src1tv: 'Channel One (1TV)',
    srcSmotrim: 'Smotrim/Vesti',
    srcRt: 'RT Russian',
    srcIzvestia: 'Izvestia',
    srcNtv: 'NTV',
    srcRia: 'RIA Novosti',
    srcTass: 'TASS',
    srcKommersant: 'Kommersant',

    // Results
    resultsTitle: 'Results',
    sortLabel: 'Sort by',
    sortRelevance: 'Relevance',
    sortDateDesc: 'Date (newest)',
    sortDateAsc: 'Date (oldest)',
    sortDurationDesc: 'Duration (longest)',
    sortDurationAsc: 'Duration (shortest)',
    sortTitleAsc: 'Title (A-Z)',
    sortTitleDesc: 'Title (Z-A)',
    emptyStateTitle: 'Discover Russian Media',
    emptyStateDesc: 'Select your filters and click "Find Videos" to explore authentic Russian content for language learning.',
    selectForCitation: 'Select',
    watchVideo: 'Watch',

    // Citations & Actions
    selectedVideos: 'selected',
    citationsTitle: 'Citations',
    citationPlaceholder: 'Select videos to generate citations...',
    copyBtn: 'Copy Citations',
    downloadBtn: 'Download Audio',

    // Status
    loadingText: 'Loading...',
    loading: 'Loading...',
    loadingProgress: 'Loading {current} of {total}...',
    downloading: 'Downloading...',
    complete: 'Complete!',
    error: 'Error',
    noResults: 'No results found',
    selected: '{count} selected',
    selectSource: 'Please select at least one source',
    copySuccess: 'Copied to clipboard',
    copyFailed: 'Copy failed - check permissions',

    // Footer
    footerCopyright: 'Matushka 2024',
    versionLabel: 'Version'
  },

  ru: {
    // Page
    pageTitle: 'Матушка - Материалы для изучения русского языка',

    // Header
    appTitle: 'Матушка',
    skipToMain: 'Перейти к содержанию',

    // Hero
    heroTitle: 'Материалы для изучения русского языка',
    heroSubtitle: 'Находите аутентичный русскоязычный медиаконтент из надежных источников. Скачивайте аудиофайлы и создавайте академические ссылки.',

    // Search
    searchLabel: 'Поисковый запрос',
    searchPlaceholder: 'Поиск видео...',
    searchBtn: 'Поиск',
    resetBtn: 'Сброс',

    // Filters
    durationTitle: 'Длительность (секунд)',
    minDuration: 'Мин',
    maxDuration: 'Макс',
    dateRangeTitle: 'Период',
    startDate: 'Начало',
    endDate: 'Конец',
    categoriesTitle: 'Категории',
    sourcesTitle: 'Источники',
    maxResultsTitle: 'Лимит',
    maxResultsLabel: 'Количество',

    // Categories
    catPolitics: 'Политика',
    catEconomy: 'Экономика',
    catSociety: 'Общество',
    catEducation: 'Образование',
    catWorld: 'В мире',
    catSports: 'Спорт',
    catCulture: 'Культура',
    catScience: 'Наука',
    catTechnology: 'Технологии',
    catMilitary: 'Военное',
    catWeather: 'Погода',
    catTourism: 'Туризм',

    // Pedagogical Level
    levelTitle: 'Уровень сложности',
    levelBeginner: 'Начальный',
    levelBeginnerDesc: '(медленная речь, простые темы)',
    levelIntermediate: 'Средний',
    levelIntermediateDesc: '(стандартные новости)',
    levelAdvanced: 'Продвинутый',
    levelAdvancedDesc: '(сложные темы)',

    // Content Type
    contentTypeTitle: 'Тип контента',
    typeNews: 'Новости',
    typeInterview: 'Интервью',
    typeDocumentary: 'Документальное',
    typeSpeech: 'Выступления',

    // Sources
    src1tv: 'Первый канал',
    srcSmotrim: 'Смотрим/Вести',
    srcRt: 'RT на русском',
    srcIzvestia: 'Известия',
    srcNtv: 'НТВ',
    srcRia: 'РИА Новости',
    srcTass: 'ТАСС',
    srcKommersant: 'Коммерсантъ',

    // Results
    resultsTitle: 'Результаты',
    sortLabel: 'Сортировка',
    sortRelevance: 'Релевантность',
    sortDateDesc: 'Дата (новые)',
    sortDateAsc: 'Дата (старые)',
    sortDurationDesc: 'Длительность (длинные)',
    sortDurationAsc: 'Длительность (короткие)',
    sortTitleAsc: 'Название (А-Я)',
    sortTitleDesc: 'Название (Я-А)',
    emptyStateTitle: 'Откройте русские медиа',
    emptyStateDesc: 'Выберите фильтры и нажмите «Найти видео» для поиска материалов для изучения языка.',
    selectForCitation: 'Выбрать',
    watchVideo: 'Смотреть',

    // Citations & Actions
    selectedVideos: 'выбрано',
    citationsTitle: 'Цитаты',
    citationPlaceholder: 'Выберите видео для цитат...',
    copyBtn: 'Копировать цитаты',
    downloadBtn: 'Скачать аудио',

    // Status
    loadingText: 'Загрузка...',
    loading: 'Загрузка...',
    loadingProgress: 'Загрузка {current} из {total}...',
    downloading: 'Скачивание...',
    complete: 'Готово!',
    error: 'Ошибка',
    noResults: 'Ничего не найдено',
    selected: 'Выбрано: {count}',
    selectSource: 'Выберите хотя бы один источник',
    copySuccess: 'Скопировано',
    copyFailed: 'Ошибка копирования',

    // Footer
    footerCopyright: 'Матушка 2024',
    versionLabel: 'Версия'
  }
};

// =============================================================================
// STATE
// =============================================================================

const state = {
  selectedItems: new Set(),
  currentResults: [],
  currentLanguage: localStorage.getItem('matushka_lang') || 'en',
  currentCitationFormat: 'apa',
  isLoading: false
};

// =============================================================================
// DEBUG LOGGING
// =============================================================================

function log(...args) {
  if (DEBUG) {
    console.log('[Matushka]', ...args);
  }
}

function logError(...args) {
  console.error('[Matushka]', ...args);
}

// =============================================================================
// i18n FUNCTIONS
// =============================================================================

function t(key, params = {}) {
  const translations = TRANSLATIONS[state.currentLanguage] || TRANSLATIONS.en;
  let text = translations[key] || TRANSLATIONS.en[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

function applyTranslations() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  });

  // Sort select options
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.querySelectorAll('option').forEach(opt => {
      const key = opt.dataset.i18n;
      if (key) opt.textContent = t(key);
    });
  }

  document.documentElement.lang = state.currentLanguage;
  updateCitationPreview();
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  state.currentLanguage = lang;
  localStorage.setItem('matushka_lang', lang);

  // Update button states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  applyTranslations();
  log('Language set to:', lang);
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function apiDiscover(params) {
  const url = new URL(`${WORKER_URL}/api/discover`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  console.log('[Matushka] API discover:', url.toString());

  const response = await fetch(url);
  console.log('[Matushka] API response status:', response.status);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function apiScrape(videoUrl) {
  const url = `${WORKER_URL}/api/scrape?url=${encodeURIComponent(videoUrl)}`;
  log('API scrape:', videoUrl);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status}`);
  }
  return response.json();
}

async function apiDownloadAudio(videoUrl) {
  const url = `${WORKER_URL}/api/audio?url=${encodeURIComponent(videoUrl)}`;
  log('API audio:', videoUrl);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Audio download failed: ${response.status}`);
  }
  return response.blob();
}

// =============================================================================
// UI HELPERS
// =============================================================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(state.currentLanguage === 'ru' ? 'ru-RU' : 'en-US');
  } catch {
    return '';
  }
}

function generateId(url) {
  return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

function extractSource(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      '1tv.ru': 'Первый канал',
      'smotrim.ru': 'Смотрим',
      'rt.com': 'RT',
      'rutube.ru': 'Rutube',
      'iz.ru': 'Известия'
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return 'Unknown';
  }
}

function sanitizeFilename(name) {
  return (name || 'audio').replace(/[^a-zA-Z0-9\u0400-\u04FF\s\-_]/g, '').substring(0, 50).trim() || 'audio';
}

function announce(message) {
  const announcer = document.getElementById('announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.setAttribute('role', 'alert');

  const configs = {
    error: { bg: '#dc2626', icon: '\u2716' },
    success: { bg: '#059669', icon: '\u2714' },
    info: { bg: '#4f46e5', icon: '\u2139' }
  };

  const config = configs[type] || configs.info;

  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: ${config.bg};
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    max-width: 360px;
    animation: slideInNotification 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  notification.innerHTML = `<span style="font-size: 16px;">${config.icon}</span><span>${escapeHtml(message)}</span>`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutNotification 0.3s cubic-bezier(0.65, 0, 0.35, 1)';
    setTimeout(() => notification.remove(), 300);
  }, type === 'error' ? 5000 : 3000);
}

function showError(message) {
  showNotification(`${t('error')}: ${message}`, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

// =============================================================================
// LOADING STATE
// =============================================================================

function setLoading(loading, progress = null) {
  state.isLoading = loading;

  const indicator = document.getElementById('loadingIndicator');
  const progressBar = document.getElementById('progressBar');
  const loadingStatus = document.getElementById('loadingStatus');
  const submitBtns = document.querySelectorAll('button[type="submit"]');

  if (indicator) {
    indicator.hidden = !loading;
  }

  if (progressBar && progress) {
    const percent = Math.round((progress.current / progress.total) * 100);
    progressBar.style.width = `${percent}%`;
  } else if (progressBar && loading) {
    // Indeterminate - animate
    progressBar.style.width = '30%';
  } else if (progressBar) {
    progressBar.style.width = '0%';
  }

  if (loadingStatus) {
    if (progress) {
      loadingStatus.textContent = t('loadingProgress', { current: progress.current, total: progress.total });
    } else if (loading) {
      loadingStatus.textContent = t('loading');
    } else {
      loadingStatus.textContent = '';
    }
  }

  submitBtns.forEach(btn => {
    btn.disabled = loading;
  });

  if (loading) {
    announce(progress ? t('loadingProgress', progress) : t('loading'));
  }
}

// =============================================================================
// RESULTS RENDERING
// =============================================================================

function updateResultsCount() {
  const countEl = document.getElementById('resultsCount');
  if (countEl) {
    const count = state.currentResults.length;
    countEl.textContent = count > 0 ? count : '';
  }
}

function updateSelectionCount() {
  const count = state.selectedItems.size;
  const countEl = document.getElementById('selectionCount');
  const selectionInfo = document.getElementById('selectionInfo');

  if (countEl) {
    countEl.textContent = count;
  }
  if (selectionInfo) {
    selectionInfo.hidden = count === 0;
  }

  announce(t('selected', { count }));
  updateCitationPreview();
}

function renderResults(results) {
  const grid = document.getElementById('resultsGrid');
  const emptyState = document.getElementById('emptyState');

  if (!grid) return;

  state.currentResults = results;
  updateResultsCount();

  if (results.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    announce(t('noResults'));
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = results.map(item => `
    <article class="video-card" data-id="${item.id}" role="listitem">
      <label class="card-select">
        <input type="checkbox" class="video-select" data-id="${item.id}"
               ${state.selectedItems.has(item.id) ? 'checked' : ''}
               aria-label="${t('selectForCitation')}">
        <span class="checkmark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      </label>
      <div class="video-thumbnail">
        ${item.thumbnail
          ? `<img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">`
          : `<div style="width:100%;height:100%;background:#e2e8f0;"></div>`
        }
        ${item.duration ? `<span class="video-duration">${formatDuration(item.duration)}</span>` : ''}
        ${item.pedagogicalLevel ? `<span class="video-level ${item.pedagogicalLevel}">${escapeHtml(item.pedagogicalLevel)}</span>` : ''}
      </div>
      <div class="video-content">
        <div class="video-badges">
          <span class="video-source">${escapeHtml(item.source?.toUpperCase() || '')}</span>
          ${item.category ? `<span class="video-category">${escapeHtml(item.category)}</span>` : ''}
        </div>
        <h3 class="video-title">${escapeHtml(item.title)}</h3>
        <p class="video-description">${escapeHtml((item.description || item.program || '').substring(0, 120))}${(item.description || item.program || '').length > 120 ? '...' : ''}</p>
        <div class="video-footer">
          <time class="video-date">${formatDate(item.publishedAt)}</time>
          <a href="${escapeHtml(item.url)}" class="video-link" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Watch
          </a>
        </div>
      </div>
    </article>
  `).join('');

  // Attach checkbox handlers
  grid.querySelectorAll('.video-select').forEach(checkbox => {
    checkbox.addEventListener('change', handleSelectionChange);
  });

  announce(`${results.length} ${t('resultsTitle').toLowerCase()}`);
}

function handleSelectionChange(e) {
  const id = e.target.dataset.id;
  if (e.target.checked) {
    state.selectedItems.add(id);
  } else {
    state.selectedItems.delete(id);
  }
  updateSelectionCount();
}

// =============================================================================
// SORTING
// =============================================================================

function sortResults(sortBy) {
  if (state.currentResults.length === 0) return;

  const sorted = [...state.currentResults];

  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
      break;
    case 'duration-desc':
      sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0));
      break;
    case 'duration-asc':
      sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      break;
    case 'title-asc':
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', state.currentLanguage));
      break;
    case 'title-desc':
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', state.currentLanguage));
      break;
    case 'relevance':
    default:
      // Keep original order
      break;
  }

  renderResults(sorted);
  log('Sorted by:', sortBy);
}

// =============================================================================
// SEARCH
// =============================================================================

function getFilterValues() {
  return {
    query: document.getElementById('searchQuery')?.value.trim() || '',
    minDuration: parseInt(document.getElementById('minDuration')?.value) || 0,
    maxDuration: parseInt(document.getElementById('maxDuration')?.value) || 3600,
    startDate: document.getElementById('startDate')?.value || '',
    endDate: document.getElementById('endDate')?.value || '',
    maxResults: parseInt(document.getElementById('maxResults')?.value) || 20,
    sources: Array.from(document.querySelectorAll('input[name="source"]:checked')).map(cb => cb.value),
    categories: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value),
    levels: Array.from(document.querySelectorAll('input[name="level"]:checked')).map(cb => cb.value),
    contentTypes: Array.from(document.querySelectorAll('input[name="contentType"]:checked')).map(cb => cb.value)
  };
}

// Category to specialized source mapping
const CATEGORY_SOURCE_MAP = {
  '1tv': {
    sports: '1tv:sports',
    economy: '1tv:economy',
    culture: '1tv:culture',
    society: '1tv:society',
    default: '1tv:news'
  },
  'smotrim': {
    default: 'smotrim:news'
  },
  'rt': {
    sports: 'rt:sport',
    economy: 'rt:business',
    default: 'rt:news'
  },
  'ntv': { default: 'ntv:video' },
  'ria': { default: 'ria:video' },
  'tass': { default: 'tass:video' },
  'kommersant': { default: 'kommersant:video' },
  'izvestia': { default: 'izvestia:video' }
};

// Expand sources based on selected categories
// e.g., "1tv" + categories["sports", "economy"] -> ["1tv:sports", "1tv:economy", "1tv:news"]
function expandSourcesWithCategories(sources, categories) {
  const expanded = new Set();

  for (const source of sources) {
    const mapping = CATEGORY_SOURCE_MAP[source];
    if (!mapping) {
      // Unknown source, pass through as-is
      expanded.add(source);
      continue;
    }

    // Always add the default source for general news
    expanded.add(mapping.default);

    // Add specialized sources for selected categories (limit to first 2 categories)
    const limitedCategories = categories.slice(0, 2);
    for (const cat of limitedCategories) {
      const specialized = mapping[cat.toLowerCase()];
      if (specialized && expanded.size < 4) {
        expanded.add(specialized);
      }
    }
  }

  // IMPORTANT: Limit to max 3 sources to prevent worker timeout
  const result = Array.from(expanded).slice(0, 3);
  console.log('[Matushka] Limited sources to:', result);
  return result;
}

// Even distribution across categories using round-robin merge
function rebalanceResults(results, categories, maxResults) {
  if (categories.length <= 1) return results.slice(0, maxResults);

  // Create category buckets
  const buckets = {};
  for (const cat of categories) {
    buckets[cat.toLowerCase()] = [];
  }

  // Sort items into buckets
  for (const item of results) {
    const cat = (item.category || '').toLowerCase();
    if (buckets[cat] !== undefined) {
      buckets[cat].push(item);
    }
  }

  // Round-robin merge
  const balanced = [];
  let idx = 0;
  while (balanced.length < maxResults) {
    let added = false;
    for (const cat of categories) {
      const bucket = buckets[cat.toLowerCase()];
      if (bucket && bucket[idx]) {
        balanced.push(bucket[idx]);
        if (balanced.length >= maxResults) break;
        added = true;
      }
    }
    if (!added) break; // All buckets exhausted
    idx++;
  }

  return balanced;
}

async function performSearch(e) {
  console.log('[Matushka] performSearch called');
  if (e) e.preventDefault();
  if (state.isLoading) return;

  const filters = getFilterValues();
  console.log('[Matushka] Search filters:', filters);

  // Validate
  if (filters.sources.length === 0) {
    showError(t('selectSource'));
    return;
  }

  setLoading(true);
  state.selectedItems.clear();  // Clear previous selections
  updateSelectionCount();
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.hidden = true;

  try {
    // Expand sources based on selected categories
    // For 1tv, map category selections to category-specific sources
    const expandedSources = expandSourcesWithCategories(filters.sources, filters.categories);
    log('Expanded sources:', expandedSources);

    // Build discover params (match worker API)
    // Keep max_items reasonable to prevent worker timeout
    const discoverParams = {
      sources: expandedSources.join(','),
      max_items: Math.min(filters.maxResults + 10, 30),  // Cap at 30 to prevent timeout
      distribution: 'even'  // Request even distribution across categories
    };

    if (filters.query) discoverParams.query = filters.query;
    if (filters.startDate) discoverParams.start_date = filters.startDate;
    if (filters.endDate) discoverParams.end_date = filters.endDate;
    if (filters.categories.length > 0 && filters.categories.length < 11) {
      discoverParams.categories = filters.categories.join(',');
    }
    if (filters.levels.length > 0 && filters.levels.length < 3) {
      discoverParams.levels = filters.levels.join(',');
    }
    if (filters.contentTypes.length > 0 && filters.contentTypes.length < 4) {
      discoverParams.content_types = filters.contentTypes.join(',');
    }

    // Step 1: Discover videos - the API already returns rich metadata
    const discovered = await apiDiscover(discoverParams);
    const items = discovered.items || [];

    log(`Discovered ${items.length} items`);

    if (items.length === 0) {
      renderResults([]);
      setLoading(false);
      return;
    }

    // Step 2: Use discovery metadata directly (it's already rich for most sources)
    // Only scrape if discovery metadata is incomplete
    const results = [];
    const itemsToProcess = items.slice(0, filters.maxResults * 2);

    for (let i = 0; i < itemsToProcess.length && results.length < filters.maxResults; i++) {
      const item = itemsToProcess[i];
      setLoading(true, { current: results.length + 1, total: Math.min(itemsToProcess.length, filters.maxResults) });

      let duration = item.duration || 0;

      // Apply duration filter (only if we have duration data)
      if (duration > 0 && (duration < filters.minDuration || duration > filters.maxDuration)) {
        continue;
      }

      // Use discovery metadata - it's already good for Smotrim, TASS, Kommersant, NTV
      let title = item.title || item.description?.substring(0, 80) || 'Video';
      let description = item.description || '';
      let thumbnail = item.thumbnail || null;
      let program = item.program || '';
      let publishedAt = item.publishDate || item.publishedAt || null;

      // Track category, content type, and pedagogical level
      let category = item.categories?.[0] || item.category || null;
      let contentType = item.contentType || null;
      let pedagogicalLevel = item.pedagogicalLevel || null;

      // For sources with incomplete discovery data (like 1tv), scrape to get full metadata
      if (!title || title === 'Video' || !thumbnail || !category) {
        try {
          const scraped = await apiScrape(item.url);
          if (scraped?.metadata) {
            const meta = scraped.metadata;
            title = meta.title || title;
            description = meta.description || description;
            thumbnail = meta.thumbnail || thumbnail;
            program = meta.program || program;
            publishedAt = meta.publishDate || publishedAt;
            // Get duration from scrape if we don't have it
            if (!duration && meta.duration) {
              duration = meta.duration;
            }
            // Get inferred category from scrape (for 1tv)
            if (!category && meta.category) {
              category = meta.category;
              log('Got inferred category from scrape:', category);
            }
            // Get content type and level from scrape
            if (!contentType && meta.contentType) {
              contentType = meta.contentType;
            }
            if (!pedagogicalLevel && meta.pedagogicalLevel) {
              pedagogicalLevel = meta.pedagogicalLevel;
            }
          }
        } catch (e) {
          log('Scrape failed for', item.url, e.message);
        }
      }

      // Skip items with no useful title
      if (!title || title === 'Unknown' || title === 'Video') {
        continue;
      }

      results.push({
        id: generateId(item.url),
        url: item.url,
        title: title,
        description: description,
        program: program,
        source: item.source || extractSource(item.url),
        thumbnail: thumbnail,
        duration: duration,
        publishedAt: publishedAt || new Date().toISOString(),
        category: category,
        contentType: contentType,
        pedagogicalLevel: pedagogicalLevel,
        m3u8Url: null
      });
    }

    // Apply client-side filters as fallback (API should have already filtered)
    let filtered = results;

    // Category filter
    if (filters.categories.length > 0 && filters.categories.length < 11) {
      filtered = filtered.filter(item =>
        !item.category || filters.categories.includes(item.category.toLowerCase())
      );
    }

    // Content type filter
    if (filters.contentTypes.length > 0 && filters.contentTypes.length < 4) {
      filtered = filtered.filter(item =>
        !item.contentType || filters.contentTypes.includes(item.contentType.toLowerCase())
      );
    }

    // Pedagogical level filter
    if (filters.levels.length > 0 && filters.levels.length < 3) {
      filtered = filtered.filter(item =>
        !item.pedagogicalLevel || filters.levels.includes(item.pedagogicalLevel.toLowerCase())
      );
    }

    // Apply even distribution client-side if API didn't
    if (filters.categories.length > 1) {
      filtered = rebalanceResults(filtered, filters.categories, filters.maxResults);
    } else {
      filtered = filtered.slice(0, filters.maxResults);
    }

    log(`Final results: ${filtered.length}`);
    renderResults(filtered);

  } catch (error) {
    console.error('[Matushka] Search failed:', error);
    showError(error.message);
    renderResults([]);
  } finally {
    setLoading(false);
  }
}

// =============================================================================
// AUDIO DOWNLOAD
// =============================================================================

async function handleDownloadAudio() {
  if (state.selectedItems.size === 0) {
    showError(t('selectVideos') || 'Please select videos first');
    return;
  }

  const btn = document.getElementById('downloadAudioBtn');
  const originalText = btn?.textContent;
  if (btn) {
    btn.textContent = t('downloading');
    btn.disabled = true;
  }

  const selected = state.currentResults.filter(r => state.selectedItems.has(r.id));

  for (const item of selected) {
    try {
      log('Downloading audio:', item.title);
      const blob = await apiDownloadAudio(item.url);

      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${sanitizeFilename(item.title)}.aac`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      logError('Download failed for:', item.title, err);
      showError(`${item.title}: ${err.message}`);
    }
  }

  if (btn) {
    btn.textContent = originalText;
    btn.disabled = false;
  }

  showSuccess(t('complete'));
}

// =============================================================================
// CITATIONS
// =============================================================================

function formatCitation(item, format) {
  const date = new Date(item.publishedAt || Date.now());
  const year = date.getFullYear();
  const dateFormatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accessDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  switch (format) {
    case 'mla':
      return `"${item.title}." ${item.source}, ${dateFormatted}. Web. ${accessDate}. <${item.url}>.`;

    case 'chicago':
      return `${item.source}. "${item.title}." Accessed ${accessDate}. ${item.url}.`;

    case 'bibtex':
      const key = (item.title || 'video').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
      return `@online{${key}${year},
  title = {${item.title}},
  author = {${item.source}},
  year = {${year}},
  url = {${item.url}},
  urldate = {${accessDate}}
}`;

    case 'apa':
    default:
      return `${item.source}. (${year}, ${dateFormatted}). ${item.title}. Retrieved ${accessDate}, from ${item.url}`;
  }
}

function updateCitationPreview() {
  const output = document.getElementById('citationText');
  const panel = document.getElementById('citationsPanel');

  // Show/hide citations panel based on selection
  if (panel) {
    panel.hidden = state.selectedItems.size === 0;
  }

  if (!output) return;

  if (state.selectedItems.size === 0) {
    output.innerHTML = `<code>${t('citationPlaceholder')}</code>`;
    return;
  }

  const selected = state.currentResults.filter(r => state.selectedItems.has(r.id));
  const citations = selected.map(item => formatCitation(item, state.currentCitationFormat)).join('\n\n');
  output.innerHTML = `<code style="white-space: pre-wrap;">${escapeHtml(citations)}</code>`;
}

async function handleCopyCitations() {
  if (state.selectedItems.size === 0) {
    showError(t('noResults'));
    return;
  }

  const selected = state.currentResults.filter(r => state.selectedItems.has(r.id));
  const citations = selected.map(item => formatCitation(item, state.currentCitationFormat)).join('\n\n');

  try {
    await navigator.clipboard.writeText(citations);
    showSuccess(t('copySuccess'));
  } catch (err) {
    logError('Copy failed:', err);
    showError(t('copyFailed'));
  }
}

function handleCitationFormatChange(format) {
  state.currentCitationFormat = format;

  // Update tab states (supports both old and new HTML)
  document.querySelectorAll('[role="tab"], .format-btn').forEach(tab => {
    const isSelected = tab.dataset.format === format;
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    tab.classList.toggle('active', isSelected);
  });

  updateCitationPreview();
}

// =============================================================================
// RESET
// =============================================================================

function handleReset() {
  // Clear search query
  const searchQuery = document.getElementById('searchQuery');
  if (searchQuery) searchQuery.value = '';

  // Reset duration
  const minDuration = document.getElementById('minDuration');
  const maxDuration = document.getElementById('maxDuration');
  if (minDuration) minDuration.value = '0';
  if (maxDuration) maxDuration.value = '3600';

  // Reset max results
  const maxResults = document.getElementById('maxResults');
  if (maxResults) maxResults.value = '20';

  // Reset all checkboxes - nothing selected
  document.querySelectorAll('input[name="category"]').forEach(cb => {
    cb.checked = false;
  });

  document.querySelectorAll('input[name="source"]').forEach(cb => {
    cb.checked = false;
  });

  document.querySelectorAll('input[name="level"]').forEach(cb => {
    cb.checked = false;
  });

  document.querySelectorAll('input[name="contentType"]').forEach(cb => {
    cb.checked = false;
  });

  // Set default dates
  setDefaultDates();

  // Clear state
  state.selectedItems.clear();
  state.currentResults = [];

  // Clear UI
  const grid = document.getElementById('resultsGrid');
  const emptyState = document.getElementById('emptyState');
  const selectionInfo = document.getElementById('selectionInfo');
  if (grid) grid.innerHTML = '';
  if (emptyState) emptyState.hidden = false;
  if (selectionInfo) selectionInfo.hidden = true;

  updateResultsCount();
  updateCitationPreview();

  showSuccess(t('complete'));
  log('Form reset');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function setDefaultDates() {
  // Don't set default dates - most news sources only retain 1-2 days of content
  // Setting a date range by default causes most searches to return 0 results
  // Users can manually set date ranges if they want to filter by date
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');

  // Only set end date to today for reference (users often want "up to today")
  if (endDate && !endDate.value) {
    endDate.value = new Date().toISOString().split('T')[0];
  }
  // Leave start date empty - no date filtering by default
}

function injectStyles() {
  // Check if styles already injected
  if (document.getElementById('matushka-dynamic-styles')) return;

  const style = document.createElement('style');
  style.id = 'matushka-dynamic-styles';
  style.textContent = `
    /* Button press feedback */
    .btn:active {
      transform: translateY(0) scale(0.98) !important;
    }

    /* Checkbox animation */
    .checkbox-group input[type="checkbox"]:checked {
      animation: checkPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes checkPop {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Selection pulse for video cards */
    .video-card:has(.video-select:checked) {
      animation: selectionPulse 0.3s ease;
    }

    @keyframes selectionPulse {
      0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      100% { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1); }
    }
  `;
  document.head.appendChild(style);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function init() {
  console.log('[Matushka] Initializing...');

  // Inject additional styles
  injectStyles();

  // Apply translations
  applyTranslations();

  // Set initial language button states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === state.currentLanguage;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Set default dates
  setDefaultDates();

  // === EVENT LISTENERS ===

  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Search form submission
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', performSearch);
    searchForm.addEventListener('reset', (e) => {
      e.preventDefault();
      handleReset();
    });
  }

  // Sort dropdown
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    sortResults(e.target.value);
  });

  // Citation format tabs (both old and new HTML structures)
  document.querySelectorAll('[role="tab"], .format-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      handleCitationFormatChange(tab.dataset.format);
    });
  });

  // Sidebar toggle for mobile
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 &&
          sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Copy citations button
  document.getElementById('copyCitationBtn')?.addEventListener('click', handleCopyCitations);

  // Download audio button (in results header)
  document.getElementById('downloadAudioBtn')?.addEventListener('click', handleDownloadAudio);

  log('Matushka initialized');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// =============================================================================
// EXPORTS (for debugging)
// =============================================================================

if (DEBUG) {
  window.Matushka = {
    state,
    performSearch,
    handleReset,
    setLanguage,
    t,
    getFilterValues
  };
}
