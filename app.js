// ============================================================================
// MATUSHKA - Russian Language Teaching Materials Collector
// Professional Edition for Academic Researchers
// ============================================================================

const WORKER_URL = 'https://matushka-api.arwrubel.workers.dev';

const CONFIG = {
  debug: true,
  enableAnimations: true
};

// ============================================================================
// INTERNATIONALIZATION (i18n) SYSTEM
// ============================================================================

const TRANSLATIONS = {
  en: {
    // Header & Branding
    title: "Matushka",
    subtitle: "Russian Language Teaching Materials Collector",
    tagline: "Find authentic Russian content for your classroom",

    // Navigation
    home: "Home",
    search: "Search",
    favorites: "Favorites",
    history: "History",
    settings: "Settings",
    help: "Help",
    about: "About",

    // Search Panel
    searchBtn: "Search for Content",
    resetBtn: "Reset Filters",
    advancedSearch: "Advanced Search",
    quickSearch: "Quick Search",
    searchPlaceholder: "Enter keywords...",

    // Duration Filters
    duration: "Duration",
    minSeconds: "Minimum Seconds",
    maxSeconds: "Maximum Seconds",
    anyDuration: "Any Duration",
    short: "Short (< 2 min)",
    medium: "Medium (2-10 min)",
    long: "Long (> 10 min)",

    // Date Filters
    dateRange: "Date Range",
    daysBack: "Days Back",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year",
    allTime: "All Time",
    customRange: "Custom Range",
    startDate: "Start Date",
    endDate: "End Date",

    // Categories - News Categories
    categories: "Categories",
    allCategories: "All Categories",
    catPolitics: "Politics",
    catEconomy: "Economy",
    catSociety: "Society",
    catWorld: "World",
    catSports: "Sports",
    catCulture: "Culture",
    catScience: "Science",
    catTechnology: "Technology",

    // Sources - Real Russian News Sources
    sources: "Sources",
    allSources: "All Sources",
    selectSources: "Select Sources",
    src1tv: "Channel One (Perviy Kanal)",
    srcVesti: "Vesti (Russia 24)",
    srcTass: "TASS",
    srcRia: "RIA Novosti",
    srcRt: "RT (Russia Today)",
    srcRbc: "RBC",
    srcKommersant: "Kommersant",
    srcLenta: "Lenta",
    srcGazeta: "Gazeta",
    srcIzvestia: "Izvestia",

    // Results
    maxItems: "Maximum Items",
    results: "Results",
    noResults: "No results found",
    resultCount: "Showing {count} results",
    loadMore: "Load More",
    sortBy: "Sort By",
    sortRelevance: "Relevance",
    sortDate: "Date",
    sortDuration: "Duration",
    sortPopularity: "Popularity",

    // Actions
    download: "Download Selected",
    downloadAll: "Download All",
    citations: "Export Citations",
    exportCSV: "Export as CSV",
    exportJSON: "Export as JSON",
    copyLink: "Copy Link",
    share: "Share",
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    preview: "Preview",
    openExternal: "Open in New Tab",

    // Status Messages
    loading: "Searching...",
    downloading: "Downloading...",
    processing: "Processing...",
    complete: "Complete!",
    error: "An error occurred",
    retry: "Retry",
    cancel: "Cancel",

    // Command Palette
    commandPalette: "Command Palette",
    typeCommand: "Type a command...",
    noCommands: "No matching commands",

    // Settings
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    autoTheme: "Auto",
    animations: "Animations",
    notifications: "Notifications",
    clearHistory: "Clear History",
    clearFavorites: "Clear Favorites",
    resetSettings: "Reset Settings",

    // Misc
    close: "Close",
    save: "Save",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    ok: "OK",
    back: "Back",
    forward: "Forward",
    refresh: "Refresh",

    // Time
    justNow: "Just now",
    minutesAgo: "{n} minutes ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} days ago",

    // Tooltips
    tooltipSearch: "Press / to focus search",
    tooltipDownload: "Press D to download selected",
    tooltipCitations: "Press C to export citations",
    tooltipTheme: "Press T to toggle theme",
    tooltipLanguage: "Press L to switch language",
    tooltipCommandPalette: "Press Ctrl+K for command palette",

    // Page & App
    pageTitle: "Matushka - Russian Language Teaching Materials",
    skipToMain: "Skip to main content",
    appTitle: "Matushka",
    appSubtitle: "Russian Language Teaching Materials Collector",

    // Configuration
    configTitle: "Search Configuration",
    durationTitle: "Duration",
    minDuration: "Minimum Duration",
    maxDuration: "Maximum Duration",
    durationHint: "Set duration range in seconds",

    // Date Range
    dateRangeTitle: "Date Range",
    dateHint: "Select date range for content",

    // Categories
    categoriesTitle: "Categories",

    // Sources
    sourcesTitle: "Sources",

    // Max Items
    maxItemsTitle: "Results Limit",
    maxItemsLabel: "Maximum Items",
    maxItemsHint: "Limit the number of results",

    // Search
    searchHint: "Click to search the archive",
    lastSearchLabel: "Last Search",

    // Results
    resultsTitle: "Search Results",
    sortLabel: "Sort by",
    sortDateDesc: "Date (Newest)",
    sortDateAsc: "Date (Oldest)",
    sortDurationDesc: "Duration (Longest)",
    sortDurationAsc: "Duration (Shortest)",
    sortTitleAsc: "Title (A-Z)",
    sortTitleDesc: "Title (Z-A)",

    // Empty State
    emptyStateTitle: "No Results Found",
    emptyStateDesc: "Try adjusting your search filters",

    // Loading
    loadingText: "Searching...",

    // Preview
    previewBtn: "Preview",

    // Citations
    citationsTitle: "Export Citations",
    citationAPA: "APA Format",
    citationMLA: "MLA Format",
    citationChicago: "Chicago Format",
    citationBibTeX: "BibTeX Format",
    citationPlaceholder: "Select items to generate citations",

    // Actions
    copyBtn: "Copy",
    downloadBtn: "Download",

    // Debug
    debugTitle: "Debug Console",
    clearDebugBtn: "Clear",
    verboseMode: "Verbose Mode",

    // Command Palette
    commandPaletteTitle: "Command Palette",
    cmdNavigate: "Navigate",
    cmdSelect: "Select",
    cmdClose: "Close",

    // Footer
    footerAboutTitle: "About",
    footerAboutText: "Matushka helps language teachers find authentic Russian content for their classrooms.",
    footerLinksTitle: "Links",
    footerHelp: "Help",
    footerAPI: "API Documentation",
    footerContact: "Contact Us",
    footerFeedback: "Send Feedback",
    footerLegalTitle: "Legal",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
    footerCookies: "Cookie Policy",
    footerDisclaimer: "This service is provided for educational purposes only.",
    footerCopyright: "All rights reserved.",
    versionLabel: "Version"
  },

  ru: {
    // Header & Branding
    title: "Матушка",
    subtitle: "Материалы для преподавания русского языка",
    tagline: "Находите аутентичный контент для вашего класса",

    // Navigation
    home: "Главная",
    search: "Поиск",
    favorites: "Избранное",
    history: "История",
    settings: "Настройки",
    help: "Помощь",
    about: "О программе",

    // Search Panel
    searchBtn: "Поиск контента",
    resetBtn: "Сбросить фильтры",
    advancedSearch: "Расширенный поиск",
    quickSearch: "Быстрый поиск",
    searchPlaceholder: "Введите ключевые слова...",

    // Duration Filters
    duration: "Длительность",
    minSeconds: "Минимум секунд",
    maxSeconds: "Максимум секунд",
    anyDuration: "Любая длительность",
    short: "Короткие (< 2 мин)",
    medium: "Средние (2-10 мин)",
    long: "Длинные (> 10 мин)",

    // Date Filters
    dateRange: "Период",
    daysBack: "Дней назад",
    today: "Сегодня",
    thisWeek: "Эта неделя",
    thisMonth: "Этот месяц",
    thisYear: "Этот год",
    allTime: "Всё время",
    customRange: "Свой период",
    startDate: "Начальная дата",
    endDate: "Конечная дата",

    // Categories - News Categories
    categories: "Категории",
    allCategories: "Все категории",
    catPolitics: "Политика",
    catEconomy: "Экономика",
    catSociety: "Общество",
    catWorld: "В мире",
    catSports: "Спорт",
    catCulture: "Культура",
    catScience: "Наука",
    catTechnology: "Технологии",

    // Sources - Real Russian News Sources
    sources: "Источники",
    allSources: "Все источники",
    selectSources: "Выберите источники",
    src1tv: "Первый канал",
    srcVesti: "Вести (Россия 24)",
    srcTass: "ТАСС",
    srcRia: "РИА Новости",
    srcRt: "RT (Russia Today)",
    srcRbc: "РБК",
    srcKommersant: "Коммерсантъ",
    srcLenta: "Лента",
    srcGazeta: "Газета",
    srcIzvestia: "Известия",

    // Results
    maxItems: "Максимум материалов",
    results: "Результаты",
    noResults: "Ничего не найдено",
    resultCount: "Показано {count} результатов",
    loadMore: "Загрузить ещё",
    sortBy: "Сортировать по",
    sortRelevance: "Релевантности",
    sortDate: "Дате",
    sortDuration: "Длительности",
    sortPopularity: "Популярности",

    // Actions
    download: "Скачать выбранное",
    downloadAll: "Скачать всё",
    citations: "Экспорт цитат",
    exportCSV: "Экспорт в CSV",
    exportJSON: "Экспорт в JSON",
    copyLink: "Копировать ссылку",
    share: "Поделиться",
    addToFavorites: "Добавить в избранное",
    removeFromFavorites: "Удалить из избранного",
    selectAll: "Выбрать всё",
    deselectAll: "Снять выбор",
    preview: "Предпросмотр",
    openExternal: "Открыть в новой вкладке",

    // Status Messages
    loading: "Поиск...",
    downloading: "Скачивание...",
    processing: "Обработка...",
    complete: "Готово!",
    error: "Произошла ошибка",
    retry: "Повторить",
    cancel: "Отмена",

    // Command Palette
    commandPalette: "Палитра команд",
    typeCommand: "Введите команду...",
    noCommands: "Команды не найдены",

    // Settings
    language: "Язык",
    theme: "Тема",
    lightTheme: "Светлая",
    darkTheme: "Тёмная",
    autoTheme: "Авто",
    animations: "Анимации",
    notifications: "Уведомления",
    clearHistory: "Очистить историю",
    clearFavorites: "Очистить избранное",
    resetSettings: "Сбросить настройки",

    // Misc
    close: "Закрыть",
    save: "Сохранить",
    confirm: "Подтвердить",
    yes: "Да",
    no: "Нет",
    ok: "ОК",
    back: "Назад",
    forward: "Вперёд",
    refresh: "Обновить",

    // Time
    justNow: "Только что",
    minutesAgo: "{n} минут назад",
    hoursAgo: "{n} часов назад",
    daysAgo: "{n} дней назад",

    // Tooltips
    tooltipSearch: "Нажмите / для поиска",
    tooltipDownload: "Нажмите D для скачивания",
    tooltipCitations: "Нажмите C для экспорта цитат",
    tooltipTheme: "Нажмите T для смены темы",
    tooltipLanguage: "Нажмите L для смены языка",
    tooltipCommandPalette: "Нажмите Ctrl+K для палитры команд",

    // Page & App
    pageTitle: "Матушка - Материалы для преподавания русского языка",
    skipToMain: "Перейти к основному содержанию",
    appTitle: "Матушка",
    appSubtitle: "Материалы для преподавания русского языка",

    // Configuration
    configTitle: "Настройки поиска",
    durationTitle: "Длительность",
    minDuration: "Минимальная длительность",
    maxDuration: "Максимальная длительность",
    durationHint: "Укажите диапазон длительности в секундах",

    // Date Range
    dateRangeTitle: "Период",
    dateHint: "Выберите период для контента",

    // Categories
    categoriesTitle: "Категории",

    // Sources
    sourcesTitle: "Источники",

    // Max Items
    maxItemsTitle: "Лимит результатов",
    maxItemsLabel: "Максимум материалов",
    maxItemsHint: "Ограничить количество результатов",

    // Search
    searchHint: "Нажмите для поиска в архиве",
    lastSearchLabel: "Последний поиск",

    // Results
    resultsTitle: "Результаты поиска",
    sortLabel: "Сортировать по",
    sortDateDesc: "Дате (сначала новые)",
    sortDateAsc: "Дате (сначала старые)",
    sortDurationDesc: "Длительности (сначала длинные)",
    sortDurationAsc: "Длительности (сначала короткие)",
    sortTitleAsc: "Названию (А-Я)",
    sortTitleDesc: "Названию (Я-А)",

    // Empty State
    emptyStateTitle: "Ничего не найдено",
    emptyStateDesc: "Попробуйте изменить параметры поиска",

    // Loading
    loadingText: "Поиск...",

    // Preview
    previewBtn: "Предпросмотр",

    // Citations
    citationsTitle: "Экспорт цитат",
    citationAPA: "Формат APA",
    citationMLA: "Формат MLA",
    citationChicago: "Формат Chicago",
    citationBibTeX: "Формат BibTeX",
    citationPlaceholder: "Выберите материалы для генерации цитат",

    // Actions
    copyBtn: "Копировать",
    downloadBtn: "Скачать",

    // Debug
    debugTitle: "Консоль отладки",
    clearDebugBtn: "Очистить",
    verboseMode: "Подробный режим",

    // Command Palette
    commandPaletteTitle: "Палитра команд",
    cmdNavigate: "Навигация",
    cmdSelect: "Выбрать",
    cmdClose: "Закрыть",

    // Footer
    footerAboutTitle: "О проекте",
    footerAboutText: "Матушка помогает преподавателям находить аутентичный русскоязычный контент для занятий.",
    footerLinksTitle: "Ссылки",
    footerHelp: "Помощь",
    footerAPI: "Документация API",
    footerContact: "Связаться с нами",
    footerFeedback: "Отправить отзыв",
    footerLegalTitle: "Правовая информация",
    footerPrivacy: "Политика конфиденциальности",
    footerTerms: "Условия использования",
    footerCookies: "Политика cookies",
    footerDisclaimer: "Этот сервис предоставляется только в образовательных целях.",
    footerCopyright: "Все права защищены.",
    versionLabel: "Версия"
  }
};

const i18n = {
  currentLang: 'en',

  init() {
    const savedLang = localStorage.getItem('matushka_language');
    if (savedLang && TRANSLATIONS[savedLang]) {
      this.currentLang = savedLang;
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (TRANSLATIONS[browserLang]) {
        this.currentLang = browserLang;
      }
    }
    this.applyToPage();
    this.updateLanguageSelector();
    debug.log('i18n', `Initialized with language: ${this.currentLang}`);
  },

  setLanguage(lang) {
    if (!TRANSLATIONS[lang]) {
      debug.error('i18n', `Language not supported: ${lang}`);
      return;
    }
    this.currentLang = lang;
    localStorage.setItem('matushka_language', lang);
    this.applyToPage();
    this.updateLanguageSelector();
    debug.log('i18n', `Language changed to: ${lang}`);
  },

  t(key, params = {}) {
    const translations = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    let text = translations[key] || TRANSLATIONS.en[key] || key;

    // Replace parameters like {count}, {n}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });

    return text;
  },

  applyToPage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    document.documentElement.lang = this.currentLang;
  },

  updateLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      if (btn.dataset.lang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'ru' : 'en';
    this.setLanguage(newLang);
  }
};

// ============================================================================
// ENHANCED DEBUG LOGGER
// ============================================================================

const debug = {
  logs: [],
  maxLogs: 1000,

  formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
  },

  createEntry(level, category, message, data) {
    return {
      timestamp: this.formatTime(),
      level,
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
  },

  output(entry) {
    if (!CONFIG.debug) return;

    const style = {
      log: 'color: #4a9eff',
      info: 'color: #10b981',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444'
    };

    const prefix = `[${entry.timestamp}] [${entry.category}]`;

    if (entry.data) {
      console[entry.level](`%c${prefix} ${entry.message}`, style[entry.level], '\n', entry.data);
    } else {
      console[entry.level](`%c${prefix} ${entry.message}`, style[entry.level]);
    }

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  },

  log(category, message, data) {
    this.output(this.createEntry('log', category, message, data));
  },

  info(category, message, data) {
    this.output(this.createEntry('info', category, message, data));
  },

  warn(category, message, data) {
    this.output(this.createEntry('warn', category, message, data));
  },

  error(category, message, data) {
    this.output(this.createEntry('error', category, message, data));
  },

  group(label) {
    if (CONFIG.debug) console.group(label);
  },

  groupEnd() {
    if (CONFIG.debug) console.groupEnd();
  },

  table(data) {
    if (CONFIG.debug) console.table(data);
  },

  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matushka-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  clearLogs() {
    this.logs = [];
    if (CONFIG.debug) console.clear();
  }
};

// ============================================================================
// MICRO-INTERACTIONS
// ============================================================================

function createRipple(event) {
  if (!CONFIG.enableAnimations) return;

  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();

  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
    pointer-events: none;
  `;

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

function initCardTilt() {
  if (!CONFIG.enableAnimations) return;

  document.querySelectorAll('.result-card, .tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

function initButtonFeedback() {
  document.querySelectorAll('button, .btn').forEach(button => {
    button.addEventListener('click', (e) => {
      createRipple(e);
    });

    button.addEventListener('mousedown', () => {
      if (CONFIG.enableAnimations) {
        button.style.transform = 'scale(0.97)';
      }
    });

    button.addEventListener('mouseup', () => {
      if (CONFIG.enableAnimations) {
        button.style.transform = 'scale(1)';
      }
    });
  });
}

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

function initScrollAnimations() {
  if (!CONFIG.enableAnimations) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animation = el.dataset.animate || 'fadeInUp';
        el.classList.add('animated', animation);
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('[data-animate]').forEach(el => {
    el.classList.add('animate-hidden');
    observer.observe(el);
  });
}

function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    z-index: 10000;
    transition: width 0.1s ease-out;
    width: 0%;
  `;

  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / windowHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

// ============================================================================
// COMMAND PALETTE
// ============================================================================

const CommandPalette = {
  isOpen: false,
  element: null,
  input: null,
  list: null,
  selectedIndex: 0,
  filteredCommands: [],

  commands: [
    { id: 'search', label: 'Search', labelRu: 'Поиск', shortcut: '/', icon: 'S', action: () => document.getElementById('searchBtn')?.click() },
    { id: 'download', label: 'Download Citations', labelRu: 'Скачать цитаты', shortcut: 'd', icon: 'D', action: () => document.getElementById('downloadCitationBtn')?.click() },
    { id: 'citations', label: 'Copy Citations', labelRu: 'Копировать цитаты', shortcut: 'c', icon: 'C', action: () => document.getElementById('copyCitationBtn')?.click() },
    { id: 'theme', label: 'Toggle Theme', labelRu: 'Сменить тему', shortcut: 't', icon: 'T', action: () => toggleTheme() },
    { id: 'lang', label: 'Switch Language', labelRu: 'Сменить язык', shortcut: 'l', icon: 'L', action: () => i18n.toggleLanguage() },
    { id: 'reset', label: 'Reset Filters', labelRu: 'Сбросить фильтры', shortcut: 'r', icon: 'R', action: () => document.getElementById('resetBtn')?.click() },
    { id: 'selectAll', label: 'Select All Results', labelRu: 'Выбрать все результаты', shortcut: 'a', icon: 'A', action: () => selectAllResults() },
    { id: 'favorites', label: 'View Favorites', labelRu: 'Просмотр избранного', shortcut: 'f', icon: 'F', action: () => showFavorites() },
    { id: 'help', label: 'Show Help', labelRu: 'Показать справку', shortcut: '?', icon: '?', action: () => showHelp() },
    { id: 'sources', label: 'List Available Sources', labelRu: 'Список источников', shortcut: 's', icon: 'S', action: () => listAvailableSources() },
  ],

  init() {
    this.createElement();
    this.bindEvents();
  },

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'command-palette';
    this.element.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 100000;
      align-items: flex-start;
      justify-content: center;
      padding-top: 100px;
    `;

    const modal = document.createElement('div');
    modal.className = 'command-palette-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 25px 100px rgba(0,0,0,0.3);
      overflow: hidden;
      animation: slideDown 0.2s ease-out;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = i18n.t('typeCommand');
    this.input.className = 'command-palette-input';
    this.input.style.cssText = `
      width: 100%;
      padding: 20px 25px;
      border: none;
      font-size: 18px;
      outline: none;
      border-bottom: 1px solid #eee;
      box-sizing: border-box;
    `;

    this.list = document.createElement('div');
    this.list.className = 'command-palette-list';
    this.list.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
    `;

    modal.appendChild(this.input);
    modal.appendChild(this.list);
    this.element.appendChild(modal);
    document.body.appendChild(this.element);

    this.filteredCommands = [...this.commands];
    this.renderList();
  },

  bindEvents() {
    this.input.addEventListener('input', () => {
      this.filter(this.input.value);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
        this.renderList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.renderList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd) this.executeCommand(cmd.id);
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
  },

  open() {
    this.isOpen = true;
    this.element.style.display = 'flex';
    this.input.value = '';
    this.selectedIndex = 0;
    this.filter('');
    this.input.focus();
    debug.log('CommandPalette', 'Opened');
  },

  close() {
    this.isOpen = false;
    this.element.style.display = 'none';
    debug.log('CommandPalette', 'Closed');
  },

  filter(query) {
    const q = query.toLowerCase().trim();
    const isRussian = i18n.currentLang === 'ru';

    this.filteredCommands = this.commands.filter(cmd => {
      const label = isRussian ? cmd.labelRu : cmd.label;
      return label.toLowerCase().includes(q) || cmd.shortcut.includes(q);
    });

    this.selectedIndex = 0;
    this.renderList();
  },

  renderList() {
    const isRussian = i18n.currentLang === 'ru';

    if (this.filteredCommands.length === 0) {
      this.list.innerHTML = `<div style="padding: 20px; text-align: center; color: #999;">${i18n.t('noCommands')}</div>`;
      return;
    }

    this.list.innerHTML = this.filteredCommands.map((cmd, index) => {
      const label = isRussian ? cmd.labelRu : cmd.label;
      const isSelected = index === this.selectedIndex;

      return `
        <div class="command-item" data-id="${cmd.id}" style="
          padding: 15px 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          background: ${isSelected ? '#f0f4ff' : 'transparent'};
          border-left: 3px solid ${isSelected ? '#667eea' : 'transparent'};
        ">
          <span style="font-size: 16px; font-weight: bold; width: 24px; text-align: center;">${cmd.icon}</span>
          <span style="flex: 1;">${label}</span>
          <kbd style="
            background: #eee;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
          ">${cmd.shortcut}</kbd>
        </div>
      `;
    }).join('');

    this.list.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        this.executeCommand(item.dataset.id);
      });

      item.addEventListener('mouseenter', () => {
        this.selectedIndex = this.filteredCommands.findIndex(c => c.id === item.dataset.id);
        this.renderList();
      });
    });
  },

  executeCommand(id) {
    const cmd = this.commands.find(c => c.id === id);
    if (cmd) {
      this.close();
      cmd.action();
      debug.log('CommandPalette', `Executed command: ${id}`);
    }
  }
};

// ============================================================================
// API & CORE FUNCTIONALITY
// ============================================================================

let selectedItems = new Set();
let currentResults = [];
let favoriteItems = JSON.parse(localStorage.getItem('matushka_favorites') || '[]');

// Fetch available sources from API
async function listAvailableSources() {
  debug.log('API', 'Fetching available sources...');
  try {
    const response = await fetch(`${WORKER_URL}/api/sources`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    debug.info('API', 'Available sources:', data);
    showNotification(`Available sources: ${JSON.stringify(data)}`, 'info');
  } catch (error) {
    debug.error('API', 'Failed to fetch sources', error);
    showError(error.message);
  }
}

async function searchContent() {
  const searchBtn = document.getElementById('searchBtn');
  const resultsContainer = document.getElementById('resultsGrid');
  const loadingIndicator = document.getElementById('loadingSkeletons');
  const emptyState = document.getElementById('emptyState');

  debug.group('Search Operation');
  debug.log('Search', 'Starting search...');

  // Update UI
  if (searchBtn) {
    searchBtn.disabled = true;
    const btnText = searchBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = i18n.t('loading');
  }
  if (loadingIndicator) loadingIndicator.hidden = false;
  if (emptyState) emptyState.hidden = true;
  if (resultsContainer) resultsContainer.innerHTML = '';

  // Gather parameters
  const daysBack = parseInt(document.getElementById('daysBack')?.value) || 7;
  const maxItems = parseInt(document.getElementById('maxItems')?.value) || 20;
  const sources = getSelectedSources();

  // Build query parameters for GET request
  const params = new URLSearchParams();
  if (sources.length > 0) {
    params.append('sources', sources.join(','));
  }
  params.append('days_back', daysBack);
  params.append('max_items', maxItems);

  debug.log('Search', 'Parameters:', { sources, daysBack, maxItems });

  try {
    // Step 1: Discover URLs using GET /api/discover
    const discoverUrl = `${WORKER_URL}/api/discover?${params.toString()}`;
    debug.log('Search', `Calling: ${discoverUrl}`);

    const discoverResponse = await fetch(discoverUrl);

    if (!discoverResponse.ok) {
      throw new Error(`HTTP ${discoverResponse.status}: ${discoverResponse.statusText}`);
    }

    const discoverData = await discoverResponse.json();
    const urls = discoverData.urls || [];

    debug.info('Search', `Discovered ${urls.length} URLs`);

    if (urls.length === 0) {
      currentResults = [];
      renderResults([]);
      debug.groupEnd();
      return;
    }

    // Step 2: Scrape metadata for each URL using GET /api/scrape
    const results = [];
    for (const url of urls.slice(0, maxItems)) {
      try {
        const scrapeUrl = `${WORKER_URL}/api/scrape?url=${encodeURIComponent(url)}`;
        debug.log('Search', `Scraping: ${url}`);

        const scrapeResponse = await fetch(scrapeUrl);
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.metadata) {
            results.push({
              id: btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16),
              url: url,
              title: scrapeData.metadata.title || 'Untitled',
              description: scrapeData.metadata.description || '',
              source: extractSourceFromUrl(url),
              m3u8_url: scrapeData.metadata.m3u8_url || null,
              thumbnail: scrapeData.metadata.thumbnail || null,
              duration: scrapeData.metadata.duration || null,
              publishedAt: scrapeData.metadata.published_at || new Date().toISOString()
            });
          }
        }
      } catch (scrapeError) {
        debug.warn('Search', `Failed to scrape ${url}`, scrapeError);
      }
    }

    currentResults = results;
    debug.info('Search', `Scraped ${currentResults.length} items with metadata`);

    // Render results
    renderResults(currentResults);

  } catch (error) {
    debug.error('Search', 'Search failed', error);
    showError(i18n.t('error') + ': ' + error.message);
    if (emptyState) emptyState.hidden = false;
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      const btnText = searchBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = i18n.t('searchBtn');
    }
    if (loadingIndicator) loadingIndicator.hidden = true;
    debug.groupEnd();
  }
}

function extractSourceFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      '1tv.ru': 'Первый канал',
      'vesti.ru': 'Вести',
      'tass.com': 'ТАСС',
      'ria.ru': 'РИА Новости',
      'rt.com': 'RT',
      'rbc.ru': 'РБК',
      'kommersant.ru': 'Коммерсантъ',
      'lenta.ru': 'Лента',
      'gazeta.ru': 'Газета',
      'iz.ru': 'Известия'
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return 'Unknown';
  }
}

function renderResults(results) {
  const container = document.getElementById('resultsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  if (!container) return;

  if (resultsCount) {
    resultsCount.textContent = `(${results.length})`;
  }

  if (results.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  container.innerHTML = results.map((item, index) => renderResultCard(item, index)).join('');

  initCardTilt();
}

function renderResultCard(item, index) {
  const isSelected = selectedItems.has(item.id);
  const isFavorite = favoriteItems.includes(item.id);

  return `
    <div class="result-card tilt-card" data-id="${item.id}" data-animate="fadeInUp" style="
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 2px solid ${isSelected ? '#667eea' : 'transparent'};
      animation-delay: ${index * 0.05}s;
    ">
      ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" style="width: 100%; height: 160px; object-fit: cover;">` : '<div style="width: 100%; height: 160px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No thumbnail</div>'}
      <div style="padding: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; line-height: 1.4;">${escapeHtml(item.title)}</h4>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">${escapeHtml(item.source)} ${item.duration ? '| ' + formatDuration(item.duration) : ''}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="toggleItemSelection('${item.id}')" class="btn btn-small ${isSelected ? 'btn-primary' : 'btn-secondary'}">
            ${isSelected ? 'Selected' : 'Select'}
          </button>
          <button onclick="toggleFavorite('${item.id}')" class="btn btn-small" title="${i18n.t(isFavorite ? 'removeFromFavorites' : 'addToFavorites')}">
            ${isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button onclick="previewItem('${item.id}')" class="btn btn-small" title="${i18n.t('preview')}">
            Preview
          </button>
          ${item.m3u8_url ? `<button onclick="downloadItem('${item.id}')" class="btn btn-small btn-primary" title="Download">Download</button>` : ''}
          <a href="${item.url}" target="_blank" class="btn btn-small" title="${i18n.t('openExternal')}">Open</a>
        </div>
      </div>
    </div>
  `;
}

function toggleItemSelection(id) {
  if (selectedItems.has(id)) {
    selectedItems.delete(id);
  } else {
    selectedItems.add(id);
  }

  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.style.borderColor = selectedItems.has(id) ? '#667eea' : 'transparent';
  }

  updateSelectionCount();
  renderResults(currentResults);
}

function selectAllResults() {
  currentResults.forEach(item => selectedItems.add(item.id));
  renderResults(currentResults);
  updateSelectionCount();
}

function deselectAllResults() {
  selectedItems.clear();
  renderResults(currentResults);
  updateSelectionCount();
}

function updateSelectionCount() {
  debug.log('Selection', `Selected items: ${selectedItems.size}`);
}

function toggleFavorite(id) {
  const index = favoriteItems.indexOf(id);
  if (index > -1) {
    favoriteItems.splice(index, 1);
  } else {
    favoriteItems.push(id);
  }
  localStorage.setItem('matushka_favorites', JSON.stringify(favoriteItems));
  renderResults(currentResults);
}

function previewItem(id) {
  const item = currentResults.find(r => r.id === id);
  if (!item) return;

  const modal = document.createElement('div');
  modal.className = 'preview-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
  `;

  modal.innerHTML = `
    <div style="max-width: 800px; width: 90%; background: white; border-radius: 16px; overflow: hidden;">
      ${item.thumbnail ? `<img src="${item.thumbnail}" style="width: 100%; height: auto;">` : ''}
      <div style="padding: 20px;">
        <h3 style="margin: 0 0 10px 0;">${escapeHtml(item.title)}</h3>
        <p style="color: #666; margin-bottom: 10px;">${escapeHtml(item.description || '')}</p>
        <p style="color: #999; font-size: 12px;">Source: ${escapeHtml(item.source)} | URL: ${escapeHtml(item.url)}</p>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button onclick="this.closest('.preview-modal').remove()" class="btn btn-primary">${i18n.t('close')}</button>
          <a href="${item.url}" target="_blank" class="btn btn-secondary">Open Original</a>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

async function downloadItem(id) {
  const item = currentResults.find(r => r.id === id);
  if (!item || !item.m3u8_url) {
    showNotification('No downloadable stream found', 'warning');
    return;
  }

  debug.log('Download', `Downloading item: ${item.title}`);

  try {
    // Use the proxy endpoint to download the m3u8 stream
    const proxyUrl = `${WORKER_URL}/api/proxy?url=${encodeURIComponent(item.m3u8_url)}`;

    showNotification(i18n.t('downloading'), 'info');

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.m3u8`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(i18n.t('complete'), 'success');

  } catch (error) {
    debug.error('Download', 'Download failed', error);
    showError(error.message);
  }
}

async function downloadSelected() {
  if (selectedItems.size === 0) {
    showNotification(i18n.t('noResults'), 'warning');
    return;
  }

  const downloadBtn = document.getElementById('downloadCitationBtn');
  if (downloadBtn) {
    downloadBtn.disabled = true;
    const btnText = downloadBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = i18n.t('downloading');
  }

  debug.log('Download', `Downloading ${selectedItems.size} items`);

  try {
    const items = currentResults.filter(r => selectedItems.has(r.id));

    // Download items that have m3u8_url one by one
    let downloadedCount = 0;
    for (const item of items) {
      if (item.m3u8_url) {
        try {
          const proxyUrl = `${WORKER_URL}/api/proxy?url=${encodeURIComponent(item.m3u8_url)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.m3u8`;
            a.click();
            URL.revokeObjectURL(url);
            downloadedCount++;
          }
        } catch (e) {
          debug.warn('Download', `Failed to download ${item.title}`, e);
        }
      }
    }

    showNotification(`Downloaded ${downloadedCount} items`, 'success');

  } catch (error) {
    debug.error('Download', 'Download failed', error);
    showError(error.message);
  } finally {
    if (downloadBtn) {
      downloadBtn.disabled = false;
      const btnText = downloadBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = i18n.t('downloadBtn');
    }
  }
}

async function exportCitations() {
  if (selectedItems.size === 0) {
    showNotification(i18n.t('noResults'), 'warning');
    return;
  }

  const activeTab = document.querySelector('.citation-tab.active');
  const format = activeTab?.dataset.format || 'apa';

  debug.log('Citations', `Exporting ${selectedItems.size} citations in ${format} format`);

  const items = currentResults.filter(r => selectedItems.has(r.id));
  const citations = items.map(item => formatCitation(item, format)).join('\n\n');

  try {
    await navigator.clipboard.writeText(citations);
    showNotification(i18n.t('complete'), 'success');
  } catch (e) {
    const citationText = document.getElementById('citationText');
    if (citationText) {
      citationText.innerHTML = `<code>${escapeHtml(citations)}</code>`;
    }
    showNotification('Citations copied to preview', 'info');
  }
}

function formatCitation(item, format = 'apa') {
  const date = new Date(item.publishedAt || Date.now());
  const year = date.getFullYear();
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accessDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  switch (format) {
    case 'mla':
      return `"${item.title}." ${item.source}, ${dateStr}. Web. ${accessDate}. <${item.url}>.`;
    case 'chicago':
      return `${item.source}. "${item.title}." Accessed ${accessDate}. ${item.url}.`;
    case 'bibtex':
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
      return `@online{${key}${year},\n  title = {${item.title}},\n  author = {${item.source}},\n  year = {${year}},\n  url = {${item.url}},\n  urldate = {${accessDate}}\n}`;
    case 'apa':
    default:
      return `${item.source}. (${year}, ${dateStr}). ${item.title}. Retrieved ${accessDate}, from ${item.url}`;
  }
}

function updateCitationPreview(format = 'apa') {
  const citationText = document.getElementById('citationText');
  if (!citationText) return;

  if (selectedItems.size === 0) {
    citationText.innerHTML = `<code>${i18n.t('citationPlaceholder') || 'Select videos to generate citations...'}</code>`;
    return;
  }

  const items = currentResults.filter(r => selectedItems.has(r.id));
  const citations = items.map(item => formatCitation(item, format)).join('\n\n');
  citationText.innerHTML = `<code style="white-space: pre-wrap;">${escapeHtml(citations)}</code>`;
}

function resetFilters() {
  const daysBack = document.getElementById('daysBack');
  const maxItems = document.getElementById('maxItems');

  if (daysBack) daysBack.value = '7';
  if (maxItems) maxItems.value = '20';

  // Reset checkboxes to their default state (first two checked in each group)
  document.querySelectorAll('input[name="category"]').forEach((cb, index) => {
    cb.checked = index < 2;
  });
  document.querySelectorAll('input[name="source"]').forEach((cb, index) => {
    cb.checked = index < 2;
  });

  selectedItems.clear();
  currentResults = [];

  const results = document.getElementById('resultsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  if (results) results.innerHTML = '';
  if (emptyState) emptyState.hidden = false;
  if (resultsCount) resultsCount.textContent = '(0)';

  debug.log('Filters', 'Reset complete');
  showNotification(i18n.t('complete'), 'success');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSelectedCategories() {
  const checkboxes = document.querySelectorAll('input[name="category"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedSources() {
  const checkboxes = document.querySelectorAll('input[name="source"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  const colors = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#667eea'
  };

  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showError(message) {
  showNotification(message, 'error');
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-theme');
  localStorage.setItem('matushka_theme', isDark ? 'dark' : 'light');
  debug.log('Theme', `Switched to ${isDark ? 'dark' : 'light'} theme`);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('matushka_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

function showFavorites() {
  const favorites = currentResults.filter(r => favoriteItems.includes(r.id));
  if (favorites.length === 0) {
    showNotification(i18n.t('noResults'), 'info');
    return;
  }
  renderResults(favorites);
}

function showHelp() {
  const modal = document.createElement('div');
  modal.className = 'help-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 20px; max-width: 600px; width: 90%;">
      <h2>${i18n.t('help')}</h2>
      <h4>Keyboard Shortcuts</h4>
      <ul>
        <li><kbd>Ctrl+K</kbd> - ${i18n.t('commandPalette')}</li>
        <li><kbd>/</kbd> - ${i18n.t('search')}</li>
        <li><kbd>d</kbd> - ${i18n.t('download')}</li>
        <li><kbd>c</kbd> - ${i18n.t('citations')}</li>
        <li><kbd>t</kbd> - ${i18n.t('theme')}</li>
        <li><kbd>l</kbd> - ${i18n.t('language')}</li>
        <li><kbd>r</kbd> - ${i18n.t('resetBtn')}</li>
      </ul>
      <h4>Available Sources</h4>
      <ul>
        <li>1tv.ru - ${i18n.t('src1tv')}</li>
        <li>vesti.ru - ${i18n.t('srcVesti')}</li>
        <li>tass.com - ${i18n.t('srcTass')}</li>
        <li>ria.ru - ${i18n.t('srcRia')}</li>
        <li>rt.com - ${i18n.t('srcRt')}</li>
        <li>rbc.ru - ${i18n.t('srcRbc')}</li>
        <li>kommersant.ru - ${i18n.t('srcKommersant')}</li>
        <li>lenta.ru - ${i18n.t('srcLenta')}</li>
        <li>gazeta.ru - ${i18n.t('srcGazeta')}</li>
        <li>iz.ru - ${i18n.t('srcIzvestia')}</li>
      </ul>
      <button onclick="this.closest('.help-modal').remove()" class="btn btn-primary">${i18n.t('close')}</button>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// ============================================================================
// CSS ANIMATIONS (Injected)
// ============================================================================

function injectAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes slideInRight {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100px); opacity: 0; }
    }

    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeInUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes rippleEffect {
      to { transform: scale(4); opacity: 0; }
    }

    .animate-hidden {
      opacity: 0;
      transform: translateY(30px);
    }

    .animated {
      animation-duration: 0.6s;
      animation-fill-mode: both;
    }

    .animated.fadeInUp {
      animation-name: fadeInUp;
    }

    .dark-theme {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --text-primary: #eee;
      --text-secondary: #aaa;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .dark-theme .result-card,
    .dark-theme .command-palette-modal {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .dark-theme .command-palette-input {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: #333;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;

  document.head.appendChild(style);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  debug.log('App', 'Initializing Matushka...');

  // Inject styles
  injectAnimationStyles();

  // Load theme
  loadTheme();

  // Initialize systems
  i18n.init();
  CommandPalette.init();

  // Initialize UI enhancements
  if (CONFIG.enableAnimations) {
    initScrollAnimations();
    initScrollProgress();
    initCardTilt();
  }

  initButtonFeedback();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      CommandPalette.open();
      return;
    }

    // Don't process shortcuts if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Quick shortcuts
    switch (e.key) {
      case '/':
        e.preventDefault();
        document.getElementById('searchBtn')?.focus();
        break;
      case 'd':
        downloadSelected();
        break;
      case 'c':
        exportCitations();
        break;
      case 't':
        toggleTheme();
        break;
      case 'l':
        i18n.toggleLanguage();
        break;
      case 'r':
        resetFilters();
        break;
      case 'Escape':
        if (CommandPalette.isOpen) {
          CommandPalette.close();
        }
        break;
    }
  });

  // Bind button events
  document.getElementById('searchBtn')?.addEventListener('click', searchContent);
  document.getElementById('resetBtn')?.addEventListener('click', resetFilters);
  document.getElementById('downloadCitationBtn')?.addEventListener('click', downloadSelected);
  document.getElementById('copyCitationBtn')?.addEventListener('click', exportCitations);

  // Language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang) {
        i18n.setLanguage(lang);
      }
    });
  });

  // Collapsible panels
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !isExpanded);
      const content = header.nextElementSibling;
      if (content && content.classList.contains('collapsible-content')) {
        content.hidden = isExpanded;
      }
    });
  });

  // View toggle buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      const view = btn.dataset.view;
      const resultsGrid = document.getElementById('resultsGrid');
      if (resultsGrid) {
        resultsGrid.className = view === 'list' ? 'results-grid results-list' : 'results-grid';
      }
    });
  });

  // Citation format tabs
  document.querySelectorAll('.citation-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.citation-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      updateCitationPreview(tab.dataset.format);
    });
  });

  // Debug panel clear button
  document.getElementById('clearDebugBtn')?.addEventListener('click', () => {
    debug.clearLogs();
    const debugContent = document.getElementById('debugContent');
    if (debugContent) debugContent.textContent = '';
  });

  debug.info('App', 'Matushka initialized successfully!');
});

// ============================================================================
// EXPORTS (for testing/debugging)
// ============================================================================

window.Matushka = {
  CONFIG,
  i18n,
  CommandPalette,
  debug,
  searchContent,
  downloadSelected,
  exportCitations,
  resetFilters,
  listAvailableSources
};
