// ============================================================================
// MATUSHKA PREMIUM - Russian Language Teaching Materials Collector
// ============================================================================

const WORKER_URL = 'https://matushka-api.arwrubel.workers.dev';

const CONFIG = {
  debug: true,
  enableCursor: true,
  enableSounds: true,
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

    // Categories
    categories: "Categories",
    allCategories: "All Categories",
    news: "News",
    entertainment: "Entertainment",
    education: "Education",
    music: "Music",
    sports: "Sports",
    culture: "Culture",
    politics: "Politics",
    science: "Science",
    technology: "Technology",
    cooking: "Cooking",
    travel: "Travel",
    children: "Children's Content",

    // Sources
    sources: "Sources",
    allSources: "All Sources",
    selectSources: "Select Sources",

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

    // Gamification
    points: "Points",
    level: "Level",
    streak: "Day Streak",
    achievements: "Achievements",
    progress: "Progress",
    nextLevel: "Next Level",
    pointsToNext: "{points} points to next level",

    // Achievement Messages
    achievementUnlocked: "Achievement Unlocked!",
    newLevel: "Level Up!",
    streakContinued: "Streak Continued!",

    // Onboarding
    welcomeTitle: "Welcome to Matushka",
    welcomeMessage: "Let's take a quick tour of the features",
    skipTour: "Skip Tour",
    nextStep: "Next",
    prevStep: "Previous",
    finishTour: "Finish",

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
    soundEffects: "Sound Effects",
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
    tooltipCommandPalette: "Press Ctrl+K for command palette"
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

    // Categories
    categories: "Категории",
    allCategories: "Все категории",
    news: "Новости",
    entertainment: "Развлечения",
    education: "Образование",
    music: "Музыка",
    sports: "Спорт",
    culture: "Культура",
    politics: "Политика",
    science: "Наука",
    technology: "Технологии",
    cooking: "Кулинария",
    travel: "Путешествия",
    children: "Детский контент",

    // Sources
    sources: "Источники",
    allSources: "Все источники",
    selectSources: "Выберите источники",

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

    // Gamification
    points: "Очки",
    level: "Уровень",
    streak: "Дней подряд",
    achievements: "Достижения",
    progress: "Прогресс",
    nextLevel: "Следующий уровень",
    pointsToNext: "{points} очков до следующего уровня",

    // Achievement Messages
    achievementUnlocked: "Достижение разблокировано!",
    newLevel: "Новый уровень!",
    streakContinued: "Серия продолжается!",

    // Onboarding
    welcomeTitle: "Добро пожаловать в Матушку",
    welcomeMessage: "Давайте сделаем краткий обзор функций",
    skipTour: "Пропустить",
    nextStep: "Далее",
    prevStep: "Назад",
    finishTour: "Завершить",

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
    soundEffects: "Звуковые эффекты",
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
    tooltipCommandPalette: "Нажмите Ctrl+K для палитры команд"
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

    // Replace parameters like {count}, {points}, {n}
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
    // Update language toggle buttons (.lang-btn with .active class)
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
// GAMIFICATION MANAGER
// ============================================================================

const GamificationManager = {
  state: {
    points: 0,
    streak: 0,
    lastActiveDate: null,
    achievements: [],
    level: 1,
    totalSearches: 0,
    totalDownloads: 0,
    favorites: []
  },

  ACHIEVEMENTS: {
    FIRST_SEARCH: {
      id: 'first_search',
      title: 'First Steps',
      titleRu: 'Первые шаги',
      description: 'Complete your first search',
      descriptionRu: 'Выполните первый поиск',
      icon: '🔍',
      points: 10
    },
    TEN_SEARCHES: {
      id: 'ten_searches',
      title: 'Explorer',
      titleRu: 'Исследователь',
      description: 'Complete 10 searches',
      descriptionRu: 'Выполните 10 поисков',
      icon: '🗺️',
      points: 50
    },
    FIFTY_SEARCHES: {
      id: 'fifty_searches',
      title: 'Researcher',
      titleRu: 'Исследователь',
      description: 'Complete 50 searches',
      descriptionRu: 'Выполните 50 поисков',
      icon: '📚',
      points: 150
    },
    HUNDRED_SEARCHES: {
      id: 'hundred_searches',
      title: 'Scholar',
      titleRu: 'Учёный',
      description: 'Complete 100 searches',
      descriptionRu: 'Выполните 100 поисков',
      icon: '🎓',
      points: 300
    },
    FIRST_DOWNLOAD: {
      id: 'first_download',
      title: 'Collector',
      titleRu: 'Коллекционер',
      description: 'Download your first item',
      descriptionRu: 'Скачайте первый материал',
      icon: '📥',
      points: 15
    },
    TEN_DOWNLOADS: {
      id: 'ten_downloads',
      title: 'Archivist',
      titleRu: 'Архивариус',
      description: 'Download 10 items',
      descriptionRu: 'Скачайте 10 материалов',
      icon: '🗄️',
      points: 75
    },
    STREAK_3: {
      id: 'streak_3',
      title: '3-Day Streak',
      titleRu: '3 дня подряд',
      description: 'Use Matushka 3 days in a row',
      descriptionRu: 'Используйте Матушку 3 дня подряд',
      icon: '🔥',
      points: 30
    },
    STREAK_7: {
      id: 'streak_7',
      title: 'Weekly Warrior',
      titleRu: 'Недельный боец',
      description: 'Use Matushka 7 days in a row',
      descriptionRu: 'Используйте Матушку 7 дней подряд',
      icon: '⚔️',
      points: 100
    },
    STREAK_30: {
      id: 'streak_30',
      title: 'Monthly Master',
      titleRu: 'Месячный мастер',
      description: 'Use Matushka 30 days in a row',
      descriptionRu: 'Используйте Матушку 30 дней подряд',
      icon: '👑',
      points: 500
    },
    FIRST_FAVORITE: {
      id: 'first_favorite',
      title: 'Bookmark Beginner',
      titleRu: 'Начинающий собиратель',
      description: 'Add your first favorite',
      descriptionRu: 'Добавьте первое избранное',
      icon: '⭐',
      points: 10
    },
    NIGHT_OWL: {
      id: 'night_owl',
      title: 'Night Owl',
      titleRu: 'Ночная сова',
      description: 'Search after midnight',
      descriptionRu: 'Выполните поиск после полуночи',
      icon: '🦉',
      points: 25
    },
    EARLY_BIRD: {
      id: 'early_bird',
      title: 'Early Bird',
      titleRu: 'Ранняя пташка',
      description: 'Search before 6 AM',
      descriptionRu: 'Выполните поиск до 6 утра',
      icon: '🐦',
      points: 25
    },
    POLYGLOT: {
      id: 'polyglot',
      title: 'Polyglot',
      titleRu: 'Полиглот',
      description: 'Switch languages 5 times',
      descriptionRu: 'Переключите язык 5 раз',
      icon: '🌍',
      points: 20
    }
  },

  LEVEL_THRESHOLDS: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000],

  init() {
    this.loadState();
    this.checkStreak();
    this.updateUI();
    debug.log('Gamification', 'Initialized', this.state);
  },

  loadState() {
    const saved = localStorage.getItem('matushka_gamification');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      } catch (e) {
        debug.error('Gamification', 'Failed to load state', e);
      }
    }
  },

  saveState() {
    try {
      localStorage.setItem('matushka_gamification', JSON.stringify(this.state));
    } catch (e) {
      debug.error('Gamification', 'Failed to save state', e);
    }
  },

  checkStreak() {
    const today = new Date().toDateString();
    const lastActive = this.state.lastActiveDate;

    if (!lastActive) {
      this.state.streak = 1;
    } else if (lastActive === today) {
      // Same day, no change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive === yesterday.toDateString()) {
        this.state.streak++;
        this.showStreakAnimation();

        // Check streak achievements
        if (this.state.streak >= 3) this.unlockAchievement('STREAK_3');
        if (this.state.streak >= 7) this.unlockAchievement('STREAK_7');
        if (this.state.streak >= 30) this.unlockAchievement('STREAK_30');
      } else {
        this.state.streak = 1;
      }
    }

    this.state.lastActiveDate = today;
    this.saveState();
  },

  addPoints(amount) {
    const oldLevel = this.state.level;
    this.state.points += amount;

    // Calculate new level
    let newLevel = 1;
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.state.points >= this.LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    if (newLevel > oldLevel) {
      this.state.level = newLevel;
      this.showLevelUpAnimation(newLevel);
    }

    this.showPointsAnimation(amount);
    this.saveState();
    this.updateUI();
  },

  recordSearch() {
    this.state.totalSearches++;
    this.addPoints(5);

    // Check time-based achievements
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) this.unlockAchievement('NIGHT_OWL');
    if (hour >= 5 && hour < 6) this.unlockAchievement('EARLY_BIRD');

    // Check search count achievements
    if (this.state.totalSearches >= 1) this.unlockAchievement('FIRST_SEARCH');
    if (this.state.totalSearches >= 10) this.unlockAchievement('TEN_SEARCHES');
    if (this.state.totalSearches >= 50) this.unlockAchievement('FIFTY_SEARCHES');
    if (this.state.totalSearches >= 100) this.unlockAchievement('HUNDRED_SEARCHES');

    this.saveState();
    debug.log('Gamification', `Search recorded. Total: ${this.state.totalSearches}`);
  },

  recordDownload() {
    this.state.totalDownloads++;
    this.addPoints(10);

    if (this.state.totalDownloads >= 1) this.unlockAchievement('FIRST_DOWNLOAD');
    if (this.state.totalDownloads >= 10) this.unlockAchievement('TEN_DOWNLOADS');

    this.saveState();
    debug.log('Gamification', `Download recorded. Total: ${this.state.totalDownloads}`);
  },

  addFavorite(itemId) {
    if (!this.state.favorites.includes(itemId)) {
      this.state.favorites.push(itemId);
      this.addPoints(3);

      if (this.state.favorites.length === 1) {
        this.unlockAchievement('FIRST_FAVORITE');
      }

      this.saveState();
    }
  },

  removeFavorite(itemId) {
    const index = this.state.favorites.indexOf(itemId);
    if (index > -1) {
      this.state.favorites.splice(index, 1);
      this.saveState();
    }
  },

  unlockAchievement(key) {
    const achievement = this.ACHIEVEMENTS[key];
    if (!achievement) return;

    if (this.state.achievements.includes(achievement.id)) {
      return; // Already unlocked
    }

    this.state.achievements.push(achievement.id);
    this.addPoints(achievement.points);
    this.showAchievementToast(achievement);
    celebrateSuccess();

    this.saveState();
    debug.log('Gamification', `Achievement unlocked: ${achievement.title}`);
  },

  showPointsAnimation(amount) {
    if (!CONFIG.enableAnimations) return;

    const popup = document.createElement('div');
    popup.className = 'points-popup';
    popup.textContent = `+${amount}`;
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      pointer-events: none;
      z-index: 10000;
      animation: pointsFloat 1.5s ease-out forwards;
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
  },

  showStreakAnimation() {
    if (!CONFIG.enableAnimations) return;

    const popup = document.createElement('div');
    popup.className = 'streak-popup';
    popup.innerHTML = `🔥 ${this.state.streak} ${i18n.t('streak')}!`;
    popup.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 32px;
      font-weight: bold;
      color: #ff6b35;
      background: linear-gradient(135deg, #fff5f0, #ffe0d0);
      padding: 20px 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(255,107,53,0.3);
      pointer-events: none;
      z-index: 10000;
      animation: streakBounce 2s ease-out forwards;
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
  },

  showLevelUpAnimation(level) {
    if (!CONFIG.enableAnimations) return;

    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-icon">🎉</div>
        <div class="level-up-text">${i18n.t('newLevel')}</div>
        <div class="level-up-number">${level}</div>
      </div>
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.3s ease-out;
    `;

    const content = overlay.querySelector('.level-up-content');
    content.style.cssText = `
      text-align: center;
      color: white;
      animation: levelUpScale 0.5s ease-out;
    `;

    document.body.appendChild(overlay);
    celebrateSuccess();

    setTimeout(() => {
      overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => overlay.remove(), 300);
    }, 2500);
  },

  showAchievementToast(achievement) {
    const isRussian = i18n.currentLang === 'ru';
    const title = isRussian ? achievement.titleRu : achievement.title;
    const description = isRussian ? achievement.descriptionRu : achievement.description;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-label">${i18n.t('achievementUnlocked')}</div>
        <div class="achievement-title">${title}</div>
        <div class="achievement-desc">${description}</div>
        <div class="achievement-points">+${achievement.points} ${i18n.t('points')}</div>
      </div>
    `;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 10px 40px rgba(102,126,234,0.4);
      z-index: 10000;
      animation: slideInRight 0.5s ease-out;
      max-width: 350px;
    `;

    if (CONFIG.enableSounds) {
      playSuccessSound();
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.5s ease-out forwards';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  },

  updateUI() {
    // Update stats bar
    const pointsEl = document.getElementById('pointsCount');
    const levelEl = document.getElementById('levelCount');
    const streakEl = document.getElementById('streakCount');
    const progressEl = document.getElementById('levelProgressFill');

    if (pointsEl) pointsEl.textContent = this.state.points;
    if (levelEl) levelEl.textContent = this.state.level;
    if (streakEl) streakEl.textContent = this.state.streak;

    if (progressEl) {
      const currentThreshold = this.LEVEL_THRESHOLDS[this.state.level - 1] || 0;
      const nextThreshold = this.LEVEL_THRESHOLDS[this.state.level] || this.state.points;
      const progress = ((this.state.points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      progressEl.style.width = `${Math.min(progress, 100)}%`;
    }
  },

  getStats() {
    return {
      points: this.state.points,
      level: this.state.level,
      streak: this.state.streak,
      totalSearches: this.state.totalSearches,
      totalDownloads: this.state.totalDownloads,
      achievementsUnlocked: this.state.achievements.length,
      totalAchievements: Object.keys(this.ACHIEVEMENTS).length
    };
  }
};

// ============================================================================
// CELEBRATION EFFECTS
// ============================================================================

function celebrateSuccess() {
  if (!CONFIG.enableAnimations) return;

  createConfetti();
  if (CONFIG.enableSounds) {
    playSuccessSound();
  }
}

function createConfetti() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];
  const confettiCount = 150;

  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 3 + 2;
    const animationDelay = Math.random() * 0.5;

    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      top: -20px;
      opacity: ${Math.random() * 0.5 + 0.5};
      transform: rotate(${Math.random() * 360}deg);
      animation: confettiFall ${animationDuration}s ease-out ${animationDelay}s forwards;
    `;

    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }

    container.appendChild(confetti);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 5000);
}

function playSuccessSound() {
  if (!CONFIG.enableSounds) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create a pleasant chime sound
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = audioContext.currentTime + (index * 0.1);
      const endTime = startTime + 0.5;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch (e) {
    debug.warn('Audio', 'Could not play sound', e);
  }
}

function playClickSound() {
  if (!CONFIG.enableSounds) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Silently fail
  }
}

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

function initMagneticButtons() {
  if (!CONFIG.enableAnimations) return;

  document.querySelectorAll('.magnetic-btn, .btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0)';
    });
  });
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
      playClickSound();
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
// CUSTOM CURSOR
// ============================================================================

function initCustomCursor() {
  if (!CONFIG.enableCursor) return;

  // Disable on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return;
  }

  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  cursorRing.style.cssText = `
    position: fixed;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(102, 126, 234, 0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transition: transform 0.15s ease-out, width 0.2s, height 0.2s, border-color 0.2s;
    transform: translate(-50%, -50%);
  `;

  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  cursorDot.style.cssText = `
    position: fixed;
    width: 8px;
    height: 8px;
    background: rgba(102, 126, 234, 0.8);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-50%, -50%);
  `;

  document.body.appendChild(cursorRing);
  document.body.appendChild(cursorDot);

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });

  // Smooth ring following
  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';

    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover states
  const hoverElements = 'a, button, .btn, input, select, textarea, .clickable, .result-card';

  document.querySelectorAll(hoverElements).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.width = '60px';
      cursorRing.style.height = '60px';
      cursorRing.style.borderColor = 'rgba(102, 126, 234, 0.8)';
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });

    el.addEventListener('mouseleave', () => {
      cursorRing.style.width = '40px';
      cursorRing.style.height = '40px';
      cursorRing.style.borderColor = 'rgba(102, 126, 234, 0.5)';
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });

  // Hide default cursor
  document.body.style.cursor = 'none';
  document.querySelectorAll('*').forEach(el => {
    el.style.cursor = 'none';
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

function initParallax() {
  if (!CONFIG.enableAnimations) return;

  const parallaxElements = document.querySelectorAll('[data-parallax]');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.5;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
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
  languageSwitchCount: 0,

  commands: [
    { id: 'search', label: 'Search', labelRu: 'Поиск', shortcut: '/', icon: '🔍', action: () => document.getElementById('searchBtn')?.click() },
    { id: 'download', label: 'Download Citations', labelRu: 'Скачать цитаты', shortcut: 'd', icon: '📥', action: () => document.getElementById('downloadCitationBtn')?.click() },
    { id: 'citations', label: 'Copy Citations', labelRu: 'Копировать цитаты', shortcut: 'c', icon: '📝', action: () => document.getElementById('copyCitationBtn')?.click() },
    { id: 'theme', label: 'Toggle Theme', labelRu: 'Сменить тему', shortcut: 't', icon: '🌓', action: () => toggleTheme() },
    { id: 'lang', label: 'Switch Language', labelRu: 'Сменить язык', shortcut: 'l', icon: '🌍', action: () => { i18n.toggleLanguage(); CommandPalette.trackLanguageSwitch(); } },
    { id: 'reset', label: 'Reset Filters', labelRu: 'Сбросить фильтры', shortcut: 'r', icon: '🔄', action: () => document.getElementById('resetBtn')?.click() },
    { id: 'selectAll', label: 'Select All Results', labelRu: 'Выбрать все результаты', shortcut: 'a', icon: '☑️', action: () => selectAllResults() },
    { id: 'favorites', label: 'View Favorites', labelRu: 'Просмотр избранного', shortcut: 'f', icon: '⭐', action: () => showFavorites() },
    { id: 'help', label: 'Show Help', labelRu: 'Показать справку', shortcut: '?', icon: '❓', action: () => showHelp() },
    { id: 'achievements', label: 'View Achievements', labelRu: 'Просмотр достижений', shortcut: 'g', icon: '🏆', action: () => showAchievements() },
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
          <span style="font-size: 20px;">${cmd.icon}</span>
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
  },

  trackLanguageSwitch() {
    this.languageSwitchCount++;
    if (this.languageSwitchCount >= 5) {
      GamificationManager.unlockAchievement('POLYGLOT');
    }
  }
};

// ============================================================================
// ONBOARDING MANAGER
// ============================================================================

const OnboardingManager = {
  currentStep: 0,
  overlay: null,
  tooltip: null,

  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Matushka',
      titleRu: 'Добро пожаловать в Матушку',
      message: 'Your tool for finding authentic Russian content for language teaching.',
      messageRu: 'Ваш инструмент для поиска аутентичного русского контента для преподавания языка.',
      target: null,
      position: 'center'
    },
    {
      id: 'search',
      title: 'Configure Search',
      titleRu: 'Настройте поиск',
      message: 'Set your filters for duration, date range, categories, and sources.',
      messageRu: 'Установите фильтры длительности, периода, категорий и источников.',
      target: '.config-panel',
      position: 'right'
    },
    {
      id: 'searchBtn',
      title: 'Start Searching',
      titleRu: 'Начните поиск',
      message: 'Click here to find content matching your criteria.',
      messageRu: 'Нажмите здесь, чтобы найти контент по вашим критериям.',
      target: '#searchBtn',
      position: 'bottom'
    },
    {
      id: 'results',
      title: 'Browse Results',
      titleRu: 'Просмотр результатов',
      message: 'Your search results will appear here. Select items to download.',
      messageRu: 'Здесь появятся результаты поиска. Выберите материалы для скачивания.',
      target: '#resultsSection',
      position: 'left'
    },
    {
      id: 'citations',
      title: 'Export Citations',
      titleRu: 'Экспорт цитат',
      message: 'Copy or download citations for your selected videos in various formats.',
      messageRu: 'Копируйте или скачивайте цитаты для выбранных видео в различных форматах.',
      target: '.citations-panel',
      position: 'top'
    },
    {
      id: 'gamification',
      title: 'Track Your Progress',
      titleRu: 'Отслеживайте прогресс',
      message: 'Earn points and achievements as you use Matushka!',
      messageRu: 'Зарабатывайте очки и достижения, используя Матушку!',
      target: '.stats-bar',
      position: 'bottom'
    },
    {
      id: 'complete',
      title: 'You\'re Ready!',
      titleRu: 'Вы готовы!',
      message: 'Press Ctrl+K anytime to open the command palette. Happy teaching!',
      messageRu: 'Нажмите Ctrl+K для открытия палитры команд. Удачного преподавания!',
      target: null,
      position: 'center'
    }
  ],

  init() {
    this.createOverlay();
    this.start();
  },

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99998;
      display: none;
    `;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'onboarding-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 99999;
      max-width: 400px;
      animation: fadeIn 0.3s ease-out;
    `;

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.tooltip);
  },

  start() {
    this.currentStep = 0;
    this.overlay.style.display = 'block';
    this.showStep(0);
    debug.log('Onboarding', 'Started');
  },

  showStep(index) {
    const step = this.steps[index];
    if (!step) {
      this.complete();
      return;
    }

    const isRussian = i18n.currentLang === 'ru';
    const title = isRussian ? step.titleRu : step.title;
    const message = isRussian ? step.messageRu : step.message;

    // Highlight target element
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        target.style.position = 'relative';
        target.style.zIndex = '99999';
        target.style.boxShadow = '0 0 0 4px #667eea, 0 0 20px rgba(102,126,234,0.5)';
        target.style.borderRadius = '8px';
      }
    }

    this.tooltip.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">${title}</h3>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: space-between;">
        <button class="onboarding-skip" style="
          padding: 10px 20px;
          border: none;
          background: #eee;
          border-radius: 8px;
          cursor: pointer;
        ">${i18n.t('skipTour')}</button>
        <div style="display: flex; gap: 10px;">
          ${index > 0 ? `<button class="onboarding-prev" style="
            padding: 10px 20px;
            border: 1px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
          ">${i18n.t('prevStep')}</button>` : ''}
          <button class="onboarding-next" style="
            padding: 10px 20px;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 8px;
            cursor: pointer;
          ">${index < this.steps.length - 1 ? i18n.t('nextStep') : i18n.t('finishTour')}</button>
        </div>
      </div>
      <div style="display: flex; gap: 6px; justify-content: center; margin-top: 15px;">
        ${this.steps.map((_, i) => `
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${i === index ? '#667eea' : '#ddd'};
          "></div>
        `).join('')}
      </div>
    `;

    // Position tooltip
    this.positionTooltip(step);

    // Bind events
    this.tooltip.querySelector('.onboarding-skip')?.addEventListener('click', () => this.complete());
    this.tooltip.querySelector('.onboarding-prev')?.addEventListener('click', () => this.prevStep());
    this.tooltip.querySelector('.onboarding-next')?.addEventListener('click', () => this.nextStep());
  },

  positionTooltip(step) {
    if (!step.target || step.position === 'center') {
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const target = document.querySelector(step.target);
    if (!target) {
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    this.tooltip.style.transform = 'none';

    switch (step.position) {
      case 'top':
        this.tooltip.style.top = `${rect.top - tooltipRect.height - 20}px`;
        this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'bottom':
        this.tooltip.style.top = `${rect.bottom + 20}px`;
        this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'left':
        this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${rect.left - tooltipRect.width - 20}px`;
        break;
      case 'right':
        this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${rect.right + 20}px`;
        break;
    }
  },

  nextStep() {
    this.clearHighlights();
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      this.showStep(this.currentStep);
    } else {
      this.complete();
    }
  },

  prevStep() {
    this.clearHighlights();
    this.currentStep = Math.max(0, this.currentStep - 1);
    this.showStep(this.currentStep);
  },

  clearHighlights() {
    document.querySelectorAll('[style*="z-index: 99999"]').forEach(el => {
      el.style.zIndex = '';
      el.style.boxShadow = '';
    });
  },

  complete() {
    this.clearHighlights();
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';
    localStorage.setItem('matushka_onboarding_complete', 'true');
    debug.log('Onboarding', 'Completed');

    // Celebration for completing onboarding
    celebrateSuccess();
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
// API & CORE FUNCTIONALITY
// ============================================================================

let selectedItems = new Set();
let currentResults = [];

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

  // Gather parameters - use date inputs instead of daysBack
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  const params = {
    minDuration: parseInt(document.getElementById('minDuration')?.value) || 0,
    maxDuration: parseInt(document.getElementById('maxDuration')?.value) || 60,
    startDate: startDate || null,
    endDate: endDate || null,
    categories: getSelectedCategories(),
    sources: getSelectedSources(),
    maxItems: parseInt(document.getElementById('maxItems')?.value) || 20
  };

  debug.log('Search', 'Parameters:', params);

  try {
    const response = await fetch(`${WORKER_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    currentResults = data.results || [];

    debug.info('Search', `Found ${currentResults.length} results`);

    // Record search for gamification
    GamificationManager.recordSearch();

    // Render results
    renderResults(currentResults);

    if (currentResults.length > 0 && GamificationManager.state.totalSearches === 1) {
      celebrateSuccess();
    }

  } catch (error) {
    debug.error('Search', 'Search failed', error);
    showError(i18n.t('error') + ': ' + error.message);
    // Show empty state on error
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

function renderResults(results) {
  const container = document.getElementById('resultsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  if (!container) return;

  // Update results count display
  if (resultsCount) {
    resultsCount.textContent = `(${results.length})`;
  }

  if (results.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  // Hide empty state when we have results
  if (emptyState) emptyState.hidden = true;

  // Render results directly into the grid container
  container.innerHTML = results.map((item, index) => renderResultCard(item, index)).join('');

  // Initialize card interactions
  initCardTilt();
}

function renderResultCard(item, index) {
  const isSelected = selectedItems.has(item.id);
  const isFavorite = GamificationManager.state.favorites.includes(item.id);

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
      ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" style="width: 100%; height: 160px; object-fit: cover;">` : ''}
      <div style="padding: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; line-height: 1.4;">${escapeHtml(item.title)}</h4>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">${escapeHtml(item.source)} • ${formatDuration(item.duration)}</p>
        <div style="display: flex; gap: 10px;">
          <button onclick="toggleItemSelection('${item.id}')" class="btn btn-small ${isSelected ? 'btn-primary' : 'btn-secondary'}">
            ${isSelected ? '✓' : '○'}
          </button>
          <button onclick="toggleFavorite('${item.id}')" class="btn btn-small" title="${i18n.t(isFavorite ? 'removeFromFavorites' : 'addToFavorites')}">
            ${isFavorite ? '★' : '☆'}
          </button>
          <button onclick="previewItem('${item.id}')" class="btn btn-small" title="${i18n.t('preview')}">
            ▶
          </button>
          <a href="${item.url}" target="_blank" class="btn btn-small" title="${i18n.t('openExternal')}">↗</a>
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
  playClickSound();
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
  // Selection count is shown via results count - no separate element needed
  debug.log('Selection', `Selected items: ${selectedItems.size}`);
}

function toggleFavorite(id) {
  if (GamificationManager.state.favorites.includes(id)) {
    GamificationManager.removeFavorite(id);
  } else {
    GamificationManager.addFavorite(id);
  }
  renderResults(currentResults);
  playClickSound();
}

function previewItem(id) {
  const item = currentResults.find(r => r.id === id);
  if (!item) return;

  // Create preview modal
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
      ${item.embedUrl ? `<iframe src="${item.embedUrl}" style="width: 100%; height: 450px; border: none;"></iframe>` :
        item.thumbnail ? `<img src="${item.thumbnail}" style="width: 100%; height: auto;">` : ''}
      <div style="padding: 20px;">
        <h3 style="margin: 0 0 10px 0;">${escapeHtml(item.title)}</h3>
        <p style="color: #666;">${escapeHtml(item.description || '')}</p>
        <button onclick="this.closest('.preview-modal').remove()" class="btn btn-primary">${i18n.t('close')}</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
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

    const response = await fetch(`${WORKER_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matushka-content-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    // Record download for gamification
    GamificationManager.recordDownload();

    showNotification(i18n.t('complete'), 'success');
    celebrateSuccess();

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

  // Get current citation format from active tab
  const activeTab = document.querySelector('.citation-tab.active');
  const format = activeTab?.dataset.format || 'apa';

  debug.log('Citations', `Exporting ${selectedItems.size} citations in ${format} format`);

  const items = currentResults.filter(r => selectedItems.has(r.id));
  const citations = items.map(item => formatCitation(item, format)).join('\n\n');

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(citations);
    showNotification(i18n.t('complete'), 'success');
  } catch (e) {
    // Fallback: show in citation preview
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

  switch (format) {
    case 'mla':
      return `"${item.title}." ${item.source}, ${dateStr}. ${item.url}.`;
    case 'chicago':
      return `${item.source}. "${item.title}." Accessed ${dateStr}. ${item.url}.`;
    case 'bibtex':
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
      return `@online{${key}${year},\n  title = {${item.title}},\n  author = {${item.source}},\n  year = {${year}},\n  url = {${item.url}}\n}`;
    case 'apa':
    default:
      return `${item.title}. (${dateStr}). ${item.source}. Retrieved from ${item.url}`;
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
  citationText.innerHTML = `<code>${escapeHtml(citations)}</code>`;
}

function resetFilters() {
  // Reset duration inputs
  const minDuration = document.getElementById('minDuration');
  const maxDuration = document.getElementById('maxDuration');
  const maxItems = document.getElementById('maxItems');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');

  if (minDuration) minDuration.value = '0';
  if (maxDuration) maxDuration.value = '60';
  if (maxItems) maxItems.value = '20';
  if (startDate) startDate.value = '';
  if (endDate) endDate.value = '';

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
  const favorites = currentResults.filter(r => GamificationManager.state.favorites.includes(r.id));
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
      <h4>${i18n.t('tooltipCommandPalette')}</h4>
      <ul>
        <li><kbd>/</kbd> - ${i18n.t('search')}</li>
        <li><kbd>d</kbd> - ${i18n.t('download')}</li>
        <li><kbd>c</kbd> - ${i18n.t('citations')}</li>
        <li><kbd>t</kbd> - ${i18n.t('theme')}</li>
        <li><kbd>l</kbd> - ${i18n.t('language')}</li>
      </ul>
      <button onclick="this.closest('.help-modal').remove()" class="btn btn-primary">${i18n.t('close')}</button>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

function showAchievements() {
  const modal = document.createElement('div');
  modal.className = 'achievements-modal';
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

  const isRussian = i18n.currentLang === 'ru';
  const achievements = Object.values(GamificationManager.ACHIEVEMENTS);

  modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 20px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h2>${i18n.t('achievements')}</h2>
      <p>${GamificationManager.state.achievements.length} / ${achievements.length}</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
        ${achievements.map(a => {
          const unlocked = GamificationManager.state.achievements.includes(a.id);
          return `
            <div style="
              padding: 20px;
              border-radius: 12px;
              background: ${unlocked ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5'};
              color: ${unlocked ? 'white' : '#999'};
              text-align: center;
            ">
              <div style="font-size: 32px; margin-bottom: 10px;">${a.icon}</div>
              <div style="font-weight: bold;">${isRussian ? a.titleRu : a.title}</div>
              <div style="font-size: 12px; margin-top: 5px;">${isRussian ? a.descriptionRu : a.description}</div>
              <div style="margin-top: 10px; font-size: 14px;">+${a.points} ${i18n.t('points')}</div>
            </div>
          `;
        }).join('')}
      </div>
      <button onclick="this.closest('.achievements-modal').remove()" class="btn btn-primary">${i18n.t('close')}</button>
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

    @keyframes pointsFloat {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
    }

    @keyframes streakBounce {
      0% { transform: translateX(-50%) scale(0); opacity: 0; }
      50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
      70% { transform: translateX(-50%) scale(0.95); }
      100% { transform: translateX(-50%) scale(1); opacity: 0; }
    }

    @keyframes levelUpScale {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
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
    .dark-theme .command-palette-modal,
    .dark-theme .onboarding-tooltip {
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

    .level-up-content .level-up-icon {
      font-size: 80px;
      animation: levelUpScale 0.5s ease-out;
    }

    .level-up-content .level-up-text {
      font-size: 24px;
      margin: 20px 0 10px;
    }

    .level-up-content .level-up-number {
      font-size: 72px;
      font-weight: bold;
      background: linear-gradient(135deg, #ffd700, #ff6b6b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .achievement-toast .achievement-icon {
      font-size: 40px;
    }

    .achievement-toast .achievement-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .achievement-toast .achievement-title {
      font-size: 18px;
      font-weight: bold;
    }

    .achievement-toast .achievement-desc {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 4px;
    }

    .achievement-toast .achievement-points {
      font-size: 14px;
      margin-top: 8px;
      color: #ffd700;
    }

    .achievement-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
    }

    .achievement-badge.unlocked {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .achievement-badge.locked {
      background: #f0f0f0;
      color: #999;
      filter: grayscale(1);
    }

    .stats-bar {
      display: flex;
      gap: 30px;
      padding: 15px 25px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }
  `;

  document.head.appendChild(style);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  debug.log('App', 'Initializing Matushka Premium...');

  // Inject styles
  injectAnimationStyles();

  // Load theme
  loadTheme();

  // Initialize systems
  i18n.init();
  GamificationManager.init();
  CommandPalette.init();

  // Check onboarding
  if (!localStorage.getItem('matushka_onboarding_complete')) {
    OnboardingManager.init();
  }

  // Initialize UI enhancements
  if (CONFIG.enableCursor) {
    initCustomCursor();
  }

  if (CONFIG.enableAnimations) {
    initScrollAnimations();
    initParallax();
    initScrollProgress();
    initCardTilt();
    initMagneticButtons();
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

  // Language toggle buttons (.lang-btn with data-lang attribute)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang) {
        i18n.setLanguage(lang);
        CommandPalette.trackLanguageSwitch();
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
      // Update citation preview based on format
      updateCitationPreview(tab.dataset.format);
    });
  });

  // Debug panel clear button
  document.getElementById('clearDebugBtn')?.addEventListener('click', () => {
    debug.clearLogs();
    const debugContent = document.getElementById('debugContent');
    if (debugContent) debugContent.textContent = '';
  });

  debug.info('App', 'Matushka Premium initialized successfully!');
  debug.table(GamificationManager.getStats());
});

// ============================================================================
// EXPORTS (for testing/debugging)
// ============================================================================

window.Matushka = {
  CONFIG,
  i18n,
  GamificationManager,
  CommandPalette,
  OnboardingManager,
  debug,
  searchContent,
  downloadSelected,
  exportCitations,
  resetFilters,
  celebrateSuccess
};
