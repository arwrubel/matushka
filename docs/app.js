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
    catWorld: 'World',
    catSports: 'Sports',
    catCulture: 'Culture',
    catScience: 'Science',
    catTechnology: 'Technology',

    // Sources
    src1tv: 'Channel One News',
    src1tvVremya: 'Vremya',
    srcSmotrim: 'Smotrim',
    srcRt: 'RT News',
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
    emptyStateDesc: 'Enter search terms and click Search to find videos.',
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
    catWorld: 'В мире',
    catSports: 'Спорт',
    catCulture: 'Культура',
    catScience: 'Наука',
    catTechnology: 'Технологии',

    // Sources
    src1tv: 'Первый канал - Новости',
    src1tvVremya: 'Время',
    srcSmotrim: 'Смотрим',
    srcRt: 'RT - Новости',
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
    emptyStateDesc: 'Введите запрос и нажмите Поиск.',
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
    countEl.textContent = `(${state.currentResults.length})`;
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
    if (emptyState) emptyState.hidden = false;
    announce(t('noResults'));
    return;
  }

  if (emptyState) emptyState.hidden = true;

  grid.innerHTML = results.map(item => `
    <article class="video-card" data-id="${item.id}" role="listitem">
      <div class="video-thumbnail">
        ${item.thumbnail
          ? `<img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">`
          : `<div class="thumbnail-placeholder"></div>`
        }
        ${item.duration ? `<span class="video-duration">${formatDuration(item.duration)}</span>` : ''}
      </div>
      <div class="video-info">
        <h3 class="video-title">${escapeHtml(item.title)}</h3>
        <p class="video-program">${escapeHtml(item.program || '')}</p>
        <p class="video-meta">
          <time class="video-date">${formatDate(item.publishedAt)}</time>
          <span class="video-source">${escapeHtml(item.source)}</span>
          ${item.category ? `<span class="video-category">${escapeHtml(item.category)}</span>` : ''}
        </p>
      </div>
      <div class="video-actions">
        <label class="select-video">
          <input type="checkbox" class="video-select" data-id="${item.id}"
                 ${state.selectedItems.has(item.id) ? 'checked' : ''}
                 aria-label="${t('selectForCitation')}">
          <span>${t('selectForCitation')}</span>
        </label>
        <a href="${escapeHtml(item.url)}" class="video-link" target="_blank" rel="noopener">${t('watchVideo')}</a>
      </div>
    </article>
  `).join('');

  // Attach checkbox handlers - direct event binding without re-render
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
    categories: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value)
  };
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
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.hidden = true;

  try {
    // Build discover params
    const discoverParams = {
      source: filters.sources.join(','),
      max: filters.maxResults * 2  // Request extra for filtering
    };

    if (filters.query) discoverParams.q = filters.query;
    if (filters.startDate) discoverParams.start_date = filters.startDate;
    if (filters.endDate) discoverParams.end_date = filters.endDate;

    // Step 1: Discover URLs
    const discovered = await apiDiscover(discoverParams);
    const urls = discovered.urls || [];

    log(`Discovered ${urls.length} URLs`);

    if (urls.length === 0) {
      renderResults([]);
      setLoading(false);
      return;
    }

    // Step 2: Scrape metadata in parallel batches
    const results = [];
    const batchSize = 5;
    const maxToProcess = Math.min(urls.length, filters.maxResults * 2);

    for (let i = 0; i < maxToProcess; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      setLoading(true, { current: results.length, total: filters.maxResults });

      const batchResults = await Promise.allSettled(batch.map(url => apiScrape(url)));

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value?.metadata) {
          const meta = result.value.metadata;
          const url = batch[idx];
          const duration = meta.duration || 0;

          // Apply duration filter
          if (duration < filters.minDuration || duration > filters.maxDuration) {
            return;
          }

          results.push({
            id: generateId(url),
            url: url,
            title: meta.title || 'Untitled',
            description: meta.description || '',
            program: meta.program || '',
            source: extractSource(url),
            thumbnail: meta.thumbnail || null,
            duration: duration,
            publishedAt: meta.published_at || new Date().toISOString(),
            category: meta.category || null,
            m3u8Url: meta.m3u8_url || null
          });
        }
      });

      // Stop early if we have enough
      if (results.length >= filters.maxResults) break;
    }

    // Apply category filter (client-side)
    let filtered = results;
    if (filters.categories.length > 0 && filters.categories.length < 8) {
      filtered = results.filter(item =>
        !item.category || filters.categories.includes(item.category.toLowerCase())
      );
    }

    // Trim to requested max
    filtered = filtered.slice(0, filters.maxResults);

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
    showError(t('noResults'));
    return;
  }

  const btn = document.getElementById('downloadCitationBtn');
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

  // Update tab states
  document.querySelectorAll('[role="tab"]').forEach(tab => {
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
  // Reset form
  document.getElementById('searchForm')?.reset();

  // Set default checkbox states
  document.querySelectorAll('input[name="category"]').forEach((cb, i) => {
    cb.checked = i < 4;
  });
  document.querySelectorAll('input[name="source"]').forEach((cb, i) => {
    cb.checked = i < 3;
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
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');

  if (startDate && !startDate.value) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate.value = weekAgo.toISOString().split('T')[0];
  }

  if (endDate && !endDate.value) {
    endDate.value = new Date().toISOString().split('T')[0];
  }
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

  // Citation format tabs
  document.querySelectorAll('[role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => {
      handleCitationFormatChange(tab.dataset.format);
    });
  });

  // Copy citations button
  document.getElementById('copyCitationBtn')?.addEventListener('click', handleCopyCitations);

  // Download audio button (in results header)
  document.getElementById('downloadAudioBtn')?.addEventListener('click', handleDownloadAudio);

  console.log('[Matushka] Initialization complete. Ready to search.');
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
