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
    durationTitle: 'Duration',
    durationLabel: 'Duration',
    minDuration: 'Min',
    maxDuration: 'Max',
    // Duration options
    durAny: '00:00',
    dur15s: '15 sec',
    dur30s: '30 sec',
    dur45s: '45 sec',
    dur1m: '1 min',
    dur2m: '2 min',
    dur3m: '3 min',
    dur5m: '5 min',
    dur10m: '10 min',
    dur15m: '15 min',
    dur30m: '30 min',
    dur1h: '1 hour',
    dur2h: '2 hours',
    dateRangeTitle: 'Date Range',
    dateRangeLabel: 'Date Range',
    startDate: 'Start',
    endDate: 'End',
    todayYesterday: 'Today & Yesterday',
    lastMonth: 'Last Month',
    allTime: 'All Time',
    byDates: 'By Dates',
    showPeriod: 'Show Results',
    categoriesTitle: 'Categories',
    sourcesTitle: 'Sources',
    maxResultsTitle: 'Max Results',
    maxResultsLabel: 'Number of results',
    moreFilters: 'More Filters',

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
    catCrime: 'Crime',
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

    // Sources (English names)
    src1tv: 'Channel One',
    srcSmotrim: 'Smotrim',
    srcRt: 'RT',
    srcIzvestia: 'Izvestia',
    srcNtv: 'NTV',
    // srcRia removed - videos have music instead of audio
    srcTass: 'TASS',
    // srcKommersant removed
    srcEuronews: 'Euronews',
    srcBbc: 'BBC',

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
    emptyStateTip: '💡 Tip: Start with 1-2 sources for faster results',
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
    selectVideos: 'Please select at least one video first',
    copySuccess: 'Copied to clipboard',
    copyFailed: 'Copy failed - check permissions',

    // ILR Analysis
    analyzeBtn: 'Analyze ILR',
    analyzingAudio: 'Transcribing and analyzing audio...',
    analyzeError: 'Analysis failed',
    ilrLevel: 'ILR Level',
    speechRate: 'Speech Rate',
    speechRateUnit: 'words/min',
    vocabDiversity: 'Vocab Diversity',
    avgSentence: 'Avg Sentence',
    avgSentenceUnit: 'words',
    advancedVocab: 'Advanced',
    intermediateVocab: 'Intermediate',
    beginnerVocab: 'Beginner',
    showTranscript: 'Show transcript',
    hideTranscript: 'Hide transcript',
    cachedResult: 'Cached result',
    transcriptTooShort: 'Transcript too short for ILR assessment',

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
    heroSubtitle: 'Находите аутентичный русскоязычный медиаконтент из надёжных источников. Скачивайте аудиофайлы и создавайте академические ссылки.',

    // Search
    searchLabel: 'Поисковый запрос',
    searchPlaceholder: 'Поиск видео...',
    searchBtn: 'Поиск',
    resetBtn: 'Очистить',

    // Filters
    durationTitle: 'Длительность',
    durationLabel: 'Длительность',
    minDuration: 'От',
    maxDuration: 'До',
    // Duration options
    durAny: '00:00',
    dur15s: '15 сек',
    dur30s: '30 сек',
    dur45s: '45 сек',
    dur1m: '1 мин',
    dur2m: '2 мин',
    dur3m: '3 мин',
    dur5m: '5 мин',
    dur10m: '10 мин',
    dur15m: '15 мин',
    dur30m: '30 мин',
    dur1h: '1 час',
    dur2h: '2 часа',
    dateRangeTitle: 'Выбрать период времени',
    dateRangeLabel: 'По датам',
    startDate: 'С',
    endDate: 'По',
    todayYesterday: 'За сегодня и вчера',
    lastMonth: 'За месяц',
    allTime: 'За всё время',
    byDates: 'По датам',
    showPeriod: 'Показать за этот период',
    categoriesTitle: 'Рубрики',
    sourcesTitle: 'Источники',
    maxResultsTitle: 'Количество',
    maxResultsLabel: 'Макс. результатов',
    moreFilters: 'Дополнительно',

    // Categories (matching Russian news sites)
    catPolitics: 'Политика',
    catEconomy: 'Экономика',
    catSociety: 'Общество',
    catEducation: 'Образование',
    catWorld: 'Мир',
    catSports: 'Спорт',
    catCulture: 'Культура',
    catScience: 'Наука',
    catTechnology: 'Технологии',
    catMilitary: 'Армия',
    catWeather: 'Погода',
    catCrime: 'Криминал',
    catTourism: 'Туризм',

    // Pedagogical Level
    levelTitle: 'Уровень',
    levelBeginner: 'Начальный',
    levelBeginnerDesc: '(медленная речь)',
    levelIntermediate: 'Средний',
    levelIntermediateDesc: '(новости)',
    levelAdvanced: 'Продвинутый',
    levelAdvancedDesc: '(сложные темы)',

    // Content Type
    contentTypeTitle: 'Формат',
    typeNews: 'Новости',
    typeInterview: 'Интервью',
    typeDocumentary: 'Документалистика',
    typeSpeech: 'Выступления',

    // Sources (in Russian)
    src1tv: 'Первый канал',
    srcSmotrim: 'Смотрим',
    srcRt: 'RT',
    srcIzvestia: 'Известия',
    srcNtv: 'НТВ',
    // srcRia removed - videos have music instead of audio
    srcTass: 'ТАСС',
    // srcKommersant removed
    srcEuronews: 'Euronews',
    srcBbc: 'Би-би-си',

    // Results
    resultsTitle: 'Результаты',
    sortLabel: 'Сортировать',
    sortRelevance: 'По релевантности',
    sortDateDesc: 'Сначала новые',
    sortDateAsc: 'Сначала старые',
    sortDurationDesc: 'Сначала длинные',
    sortDurationAsc: 'Сначала короткие',
    sortTitleAsc: 'Название (А-Я)',
    sortTitleDesc: 'Название (Я-А)',
    emptyStateTitle: 'Поиск видео',
    emptyStateDesc: 'Выберите источники и рубрики, затем нажмите «Поиск», чтобы найти новостные репортажи.',
    emptyStateTip: 'Совет: начните с 1-2 источников для быстрого результата',
    selectForCitation: 'Выбрать',
    watchVideo: 'Смотреть',

    // Citations & Actions
    selectedVideos: 'выбрано',
    citationsTitle: 'Библиография',
    citationPlaceholder: 'Выберите видео для создания библиографии...',
    copyBtn: 'Копировать',
    downloadBtn: 'Скачать аудио',

    // Status
    loadingText: 'Идёт поиск...',
    loading: 'Загрузка...',
    loadingProgress: 'Загружено {current} из {total}...',
    downloading: 'Скачивание...',
    complete: 'Готово!',
    error: 'Ошибка',
    noResults: 'Ничего не найдено',
    selected: '{count} выбрано',
    selectSource: 'Выберите хотя бы один источник',
    selectVideos: 'Сначала выберите хотя бы одно видео',
    copySuccess: 'Скопировано в буфер обмена',
    copyFailed: 'Не удалось скопировать',

    // ILR Analysis
    analyzeBtn: 'Анализ ILR',
    analyzingAudio: 'Транскрибирование и анализ аудио...',
    analyzeError: 'Ошибка анализа',
    ilrLevel: 'Уровень ILR',
    speechRate: 'Темп речи',
    speechRateUnit: 'слов/мин',
    vocabDiversity: 'Разн. лексики',
    avgSentence: 'Ср. предложение',
    avgSentenceUnit: 'слов',
    advancedVocab: 'Продвинутый',
    intermediateVocab: 'Средний',
    beginnerVocab: 'Начальный',
    showTranscript: 'Показать текст',
    hideTranscript: 'Скрыть текст',
    cachedResult: 'Из кэша',
    transcriptTooShort: 'Текст слишком короткий для оценки ILR',

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

  // Update document language for browser locale handling
  document.documentElement.lang = lang;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log('[Matushka] API response status:', response.status);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('Время ожидания истекло. Попробуйте ещё раз или выберите другой источник.');
    }
    throw e;
  }
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
    // Handle Smotrim's DD-MM-YYYY HH:MM:SS format from cached responses
    const smotrimMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
    const d = smotrimMatch
      ? new Date(+smotrimMatch[3], +smotrimMatch[2] - 1, +smotrimMatch[1], +(smotrimMatch[4]||0), +(smotrimMatch[5]||0))
      : new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(state.currentLanguage === 'ru' ? 'ru-RU' : 'en-US');
  } catch {
    return '';
  }
}

function generateId(url) {
  return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
}

function extractSource(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      '1tv.ru': 'Первый канал',
      'smotrim.ru': 'Смотрим',
      'rt.com': 'RT',
      'rutube.ru': 'Rutube',
      'iz.ru': 'Известия',
      'ru.euronews.com': 'Euronews',
      'bbc.com': 'Би-би-си',
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
          <div class="video-actions">
            <button class="btn-analyze" data-url="${escapeHtml(item.url)}" title="${t('analyzeBtn')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              ${t('analyzeBtn')}
            </button>
            <a href="${escapeHtml(item.url)}" class="video-link" target="_blank" rel="noopener">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Watch
            </a>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  // Attach checkbox handlers
  grid.querySelectorAll('.video-select').forEach(checkbox => {
    checkbox.addEventListener('change', handleSelectionChange);
  });

  // Attach analyze button handlers
  grid.querySelectorAll('.btn-analyze').forEach(btn => {
    btn.addEventListener('click', handleAnalyzeClick);
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
// ILR ANALYSIS
// =============================================================================

/**
 * Convert AAC audio to WAV format using the browser's AudioContext.
 * Returns a base64-encoded WAV string suitable for Whisper.
 */
async function convertAudioToWav(audioArrayBuffer) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
  const channelData = audioBuffer.getChannelData(0);  // mono
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Create WAV file
  const wavBuffer = new ArrayBuffer(44 + channelData.length * 2);
  const view = new DataView(wavBuffer);

  // WAV header
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + channelData.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);           // chunk size
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);    // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);            // block align
  view.setUint16(34, 16, true);           // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, channelData.length * 2, true);

  // Convert float32 PCM to int16
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(wavBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    const chunk = bytes.subarray(i, Math.min(i + 8192, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
  }

  audioCtx.close();
  return { base64: btoa(binary), duration, sampleRate };
}

async function handleAnalyzeClick(e) {
  const btn = e.currentTarget;
  const videoUrl = btn.dataset.url;
  const card = btn.closest('.video-card');
  if (!card || !videoUrl) return;

  // Prevent double-click
  if (btn.disabled) return;
  btn.disabled = true;
  btn.classList.add('analyzing');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-small"></span> ${t('analyzingAudio')}`;

  // Create or find analysis panel
  let panel = card.querySelector('.analysis-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'analysis-panel';
    card.querySelector('.video-content').appendChild(panel);
  }
  panel.innerHTML = `<div class="analysis-loading"><span class="spinner-small"></span> ${t('analyzingAudio')}</div>`;

  try {
    // Step 1: Check cache first (GET request)
    const cacheResp = await fetch(`${WORKER_URL}/api/analyze?url=${encodeURIComponent(videoUrl)}`);
    const cacheData = await cacheResp.json();
    if (cacheData.success && cacheData.cached) {
      panel.innerHTML = renderAnalysisResults(cacheData);
      attachTranscriptToggle(panel);
      return;
    }

    // Step 2: Download audio from worker
    panel.innerHTML = `<div class="analysis-loading"><span class="spinner-small"></span> ${t('downloading')}...</div>`;
    const audioResp = await fetch(`${WORKER_URL}/api/audio?url=${encodeURIComponent(videoUrl)}`);

    let audioBase64, audioDuration;

    if (audioResp.headers.get('content-type')?.includes('json')) {
      // MP4 source — server returns JSON with stream URL
      const audioJson = await audioResp.json();
      if (audioJson.streamUrl) {
        const mp4Resp = await fetch(audioJson.streamUrl);
        const mp4Buffer = await mp4Resp.arrayBuffer();
        const wav = await convertAudioToWav(mp4Buffer);
        audioBase64 = wav.base64;
        audioDuration = wav.duration;
      } else {
        throw new Error('No stream URL for MP4 source');
      }
    } else {
      // HLS source — server returns raw AAC audio
      const aacBuffer = await audioResp.arrayBuffer();
      const wav = await convertAudioToWav(aacBuffer);
      audioBase64 = wav.base64;
      audioDuration = wav.duration;
    }

    // Step 3: Send WAV to worker for Whisper + analysis
    panel.innerHTML = `<div class="analysis-loading"><span class="spinner-small"></span> ${t('analyzingAudio')}</div>`;
    const analyzeResp = await fetch(`${WORKER_URL}/api/analyze?url=${encodeURIComponent(videoUrl)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64, duration: audioDuration })
    });
    const data = await analyzeResp.json();

    if (!data.success) throw new Error(data.message || data.error || t('analyzeError'));

    panel.innerHTML = renderAnalysisResults(data);
    attachTranscriptToggle(panel);
  } catch (err) {
    panel.innerHTML = `<div class="analysis-error">${t('analyzeError')}: ${escapeHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('analyzing');
    btn.innerHTML = originalText;
  }
}

function attachTranscriptToggle(panel) {
  const toggleBtn = panel.querySelector('.transcript-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const excerpt = panel.querySelector('.transcript-excerpt');
      if (excerpt) {
        const isExpanded = excerpt.classList.toggle('expanded');
        excerpt.textContent = isExpanded ? excerpt.dataset.full : excerpt.dataset.short;
        toggleBtn.textContent = isExpanded ? t('hideTranscript') : t('showTranscript');
      }
    });
  }
}

function renderAnalysisResults(data) {
  const ilrLevel = data.ilrLevel;
  const ilrLabel = data.ilrLabel || '';
  const metrics = data.metrics || {};
  const transcript = data.transcript || {};
  const transcriptText = transcript.text || '';
  const excerpt = transcriptText.substring(0, 200);
  const hasMore = transcriptText.length > 200;

  // ILR badge color class
  let badgeClass = 'ilr-na';
  if (ilrLevel !== null && ilrLevel !== undefined) {
    if (ilrLevel <= 2) badgeClass = 'ilr-low';
    else if (ilrLevel === 3) badgeClass = 'ilr-mid';
    else badgeClass = 'ilr-high';
  }

  const ilrDisplay = ilrLevel !== null && ilrLevel !== undefined
    ? `<span class="ilr-badge ${badgeClass}">ILR ${ilrLevel}</span>
       <span class="ilr-label">${escapeHtml(ilrLabel)}</span>`
    : `<span class="ilr-badge ilr-na">—</span>
       <span class="ilr-label">${escapeHtml(data.ilrError || t('transcriptTooShort'))}</span>`;

  return `
    <div class="analysis-header">
      ${ilrDisplay}
      ${data.cached ? `<span class="cached-badge">${t('cachedResult')}</span>` : ''}
    </div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${metrics.speechRate ?? '—'}</div>
        <div class="metric-label">${t('speechRate')}<br><small>${t('speechRateUnit')}</small></div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.typeTokenRatio ?? '—'}</div>
        <div class="metric-label">${t('vocabDiversity')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.avgSentenceLength ?? '—'}</div>
        <div class="metric-label">${t('avgSentence')}<br><small>${t('avgSentenceUnit')}</small></div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.advancedVocabPercent ?? 0}%</div>
        <div class="metric-label">${t('advancedVocab')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.intermediateVocabPercent ?? 0}%</div>
        <div class="metric-label">${t('intermediateVocab')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.beginnerVocabPercent ?? 0}%</div>
        <div class="metric-label">${t('beginnerVocab')}</div>
      </div>
    </div>
    ${transcriptText ? `
      <div class="transcript-section">
        <div class="transcript-excerpt" data-full="${escapeHtml(transcriptText)}" data-short="${escapeHtml(excerpt)}${hasMore ? '...' : ''}">${escapeHtml(excerpt)}${hasMore ? '...' : ''}</div>
        ${hasMore ? `<button class="transcript-toggle">${t('showTranscript')}</button>` : ''}
      </div>
    ` : ''}
  `;
}

// =============================================================================
// SORTING
// =============================================================================

// Calculate relevance score for an item
function calculateRelevanceScore(item) {
  let score = 0;

  // Base score: items with more complete metadata are more relevant
  if (item.title) score += 10;
  if (item.description) score += 5;
  if (item.thumbnail) score += 3;
  if (item.duration && item.duration > 0) score += 2;
  if (item.publishDate || item.publishedAt) score += 2;

  // Prefer items with proper categories
  if (item.category) score += 3;
  if (item.categories && item.categories.length > 0) score += 2;

  // Prefer items with pedagogical level (indicates quality metadata)
  if (item.pedagogicalLevel) score += 3;

  // Recency bonus: newer content gets slight boost
  const pubDate = new Date(item.publishDate || item.publishedAt || 0);
  const daysSincePublish = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 7) score += 5;      // Last week
  else if (daysSincePublish < 30) score += 3; // Last month
  else if (daysSincePublish < 90) score += 1; // Last 3 months

  // Duration sweet spot: 1-10 minutes is ideal for learning
  const dur = item.duration || 0;
  if (dur >= 60 && dur <= 600) score += 4;    // 1-10 min: ideal
  else if (dur >= 30 && dur <= 900) score += 2; // 30s-15 min: good

  return score;
}

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
      // Sort by relevance score (higher = more relevant)
      sorted.sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a));
      break;
  }

  renderResults(sorted);
  log('Sorted by:', sortBy);
}

// =============================================================================
// SEARCH
// =============================================================================

function getFilterValues() {
  const minDur = parseInt(document.getElementById('minDuration')?.value) || 0;
  const maxDur = parseInt(document.getElementById('maxDuration')?.value) || 0;
  return {
    query: document.getElementById('searchQuery')?.value.trim() || '',
    minDuration: minDur,
    maxDuration: maxDur === 0 ? Infinity : maxDur, // 0 means "Any" = no limit
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
    society: 'rt:russia',
    default: 'rt:news'
  },
  'ntv': { default: 'ntv:video' },
  // 'ria' removed - videos have music instead of audio
  'tass': { default: 'tass:video' },
  // 'kommersant' removed
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

function getCitationSourceName(source) {
  const names = {
    '1tv': 'Первый канал', 'smotrim': 'Смотрим', 'rt': 'RT',
    'ntv': 'НТВ', 'tass': 'ТАСС', 'izvestia': 'Известия',
    'kommersant': 'Коммерсантъ', 'euronews': 'Euronews',
    'bbc': 'BBC Russian', 'rutube': 'Rutube',
  };
  return names[(source || '').toLowerCase()] || source;
}

function formatMlaDate(date) {
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
    'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCitation(item, format) {
  const date = new Date(item.publishedAt || Date.now());
  const year = date.getFullYear();
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const pubDateFull = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isoDate = date.toISOString().split('T')[0];
  const now = new Date();
  const accessIso = now.toISOString().split('T')[0];
  const source = getCitationSourceName(item.source);

  switch (format) {
    // MLA 9th: "Title." Source, Day Mon. Year, URL. Accessed Day Mon. Year.
    case 'mla':
      return `"${item.title}." ${source}, ${formatMlaDate(date)}, ${item.url}. Accessed ${formatMlaDate(now)}.`;

    // Chicago 17th (Bibliography): Source. "Title." Source video. Month Day, Year. URL.
    case 'chicago':
      return `${source}. "${item.title}." ${source} video. ${pubDateFull}. ${item.url}.`;

    // BibLaTeX @online: ISO dates, double-braced corporate author
    case 'bibtex':
      const key = (item.title || 'video').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
      return `@online{${key}${year},
  title = {${item.title}},
  author = {{${source}}},
  date = {${isoDate}},
  url = {${item.url}},
  urldate = {${accessIso}},
  note = {Video}
}`;

    // APA 7th: Source. (Year, Month Day). Title [Video]. URL
    case 'apa':
    default:
      return `${source}. (${year}, ${monthDay}). ${item.title} [Video]. ${item.url}`;
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

  // Reset duration (0 = Any)
  const minDuration = document.getElementById('minDuration');
  const maxDuration = document.getElementById('maxDuration');
  if (minDuration) minDuration.value = '0';
  if (maxDuration) maxDuration.value = '0';

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

  // Set document language for browser locale (affects date picker format)
  document.documentElement.lang = state.currentLanguage;

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
