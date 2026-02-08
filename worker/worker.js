/**
 * Matushka Enhanced Cloudflare Worker
 *
 * Multi-site Russian news video discovery, metadata extraction, and audio extraction.
 * Supports: 1tv.ru, smotrim.ru, rt.com, rutube.ru, iz.ru (via Rutube)
 *
 * Discovery Methods:
 * - 1tv.ru: Schedule API + page scraping
 * - smotrim.ru: Official API (api.smotrim.ru)
 * - rt.com: RSS feeds + page scraping
 * - rutube.ru: Category API
 * - iz.ru: Rutube channel API (channel 23872322)
 *
 * @version 3.0.0
 * @license MIT
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  debug: true,
  maxSegments: 10,  // Max segments to process for audio extraction
  maxSegmentSize: 2 * 1024 * 1024,  // 2MB per segment max
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// News categories with Russian translations
const CATEGORIES = {
  politics: { en: 'Politics', ru: 'Политика' },
  economy: { en: 'Economy', ru: 'Экономика' },
  society: { en: 'Society', ru: 'Общество' },
  education: { en: 'Education', ru: 'Образование' },
  world: { en: 'World', ru: 'В мире' },
  sports: { en: 'Sports', ru: 'Спорт' },
  culture: { en: 'Culture', ru: 'Культура' },
  science: { en: 'Science', ru: 'Наука' },
  technology: { en: 'Technology', ru: 'Технологии' },
};

// Site configurations with discovery URLs, API endpoints, and category mappings
const SITES = {
  // ============================================================================
  // MAJOR NEWS NETWORKS
  // ============================================================================
  '1tv': {
    name: 'Channel One',
    nameRu: 'Первый канал',
    domain: '1tv.ru',
    scheduleApi: 'https://stream.1tv.ru/api/schedule.json',
    sitemapBase: 'https://www.1tv.ru/sitemap-news-',  // + YYYY.xml
    usesRutube: false,  // Disabled: Rutube channel is geo-restricted outside Russia
    rutubeChannelId: 23460655,  // 268,260+ videos - kept for reference
    sources: {
      'news': { url: 'https://www.1tv.ru/news', categories: ['politics', 'society', 'world'] },
      'politics': { url: 'https://www.1tv.ru/news/politika', categories: ['politics'] },
      'economy': { url: 'https://www.1tv.ru/news/ekonomika', categories: ['economy'] },
      'society': { url: 'https://www.1tv.ru/news/obschestvo', categories: ['society'] },
      'world': { url: 'https://www.1tv.ru/news/v-mire', categories: ['world'] },
      'sports': { url: 'https://www.1tv.ru/news/sport', categories: ['sports'] },
      'culture': { url: 'https://www.1tv.ru/news/kultura', categories: ['culture'] },
      'vremya': { url: 'https://www.1tv.ru/shows/vremya', categories: ['politics', 'world'], programId: 'vremya' },
      'video': { categories: ['politics', 'society', 'culture', 'sports'] },  // Rutube channel
    }
  },
  'smotrim': {
    name: 'Smotrim (VGTRK)',
    nameRu: 'Смотрим (ВГТРК)',
    domain: 'smotrim.ru',
    apiBase: 'https://api.smotrim.ru/api/v1',
    playerApi: 'https://player.smotrim.ru/iframe/datavideo/id',
    sources: {
      // News programs
      'news': { brandId: 5402, categories: ['politics', 'society', 'world'], name: 'Вести' },
      'russia24': { brandId: 58500, categories: ['politics', 'economy', 'world'], name: 'Вести в 20:00' },
      'vesti-nedeli': { brandId: 5206, categories: ['politics', 'world'], name: 'Вести недели' },
      // Россия Культура programs
      'culture-news': { brandId: 246379, categories: ['culture'], name: 'Новости культуры' },
      'culture-history': { brandId: 67400, categories: ['culture', 'education'], name: 'Рассказы из русской истории' },
      'culture-architecture': { brandId: 28287, categories: ['culture', 'tourism'], name: 'Роман в камне' },
      'culture-kremlin': { brandId: 68933, categories: ['culture', 'tourism'], name: 'Сокровища Московского Кремля' },
      // Additional culture/education programs
      'absolut-sluh': { brandId: 20892, categories: ['culture', 'education'], name: 'Абсолютный слух' },
      'pisma-provintsii': { brandId: 20920, categories: ['culture', 'society'], name: 'Письма из провинции' },
      'xx-vek': { brandId: 62153, categories: ['culture', 'education'], name: 'XX век' },
      'zemlya-ludey': { brandId: 63258, categories: ['culture', 'society', 'tourism'], name: 'Земля людей' },
      'kollektsiya': { brandId: 64923, categories: ['culture', 'education'], name: 'Коллекция' },
      'bolshaya-opera': { brandId: 71651, categories: ['culture'], name: 'Большая опера' },
    }
  },
  'rt': {
    name: 'RT на русском',
    nameRu: 'RT на русском',
    domain: 'russian.rt.com',
    rssFeeds: {
      'news': 'https://russian.rt.com/rss',
    },
    usesRutube: false,  // Disabled: Rutube channel has older content, use RSS for fresh news
    rutubeChannelId: 25547249,  // RT main Rutube channel (kept for reference)
    sources: {
      'news': { url: 'https://russian.rt.com/', categories: ['politics', 'world'] },
      'russia': { url: 'https://russian.rt.com/russia', categories: ['politics', 'society'] },
      'world': { url: 'https://russian.rt.com/world', categories: ['world', 'politics'] },
      'business': { url: 'https://russian.rt.com/business', categories: ['economy'] },
      'sport': { url: 'https://russian.rt.com/sport', categories: ['sports'] },
      'video': { categories: ['politics', 'world', 'society'] },  // Rutube channel
    },
    liveStreams: {
      'news': 'https://rt-glb.rttv.com/dvr/rtnews/playlist.m3u8',
      'doc': 'https://rt-glb.rttv.com/dvr/rtdoc/playlist.m3u8',
    }
  },
  'ntv': {
    name: 'NTV',
    nameRu: 'НТВ',
    domain: 'ntv.ru',
    xmlApi: 'https://www.ntv.ru/vi',
    sitemap: 'https://www.ntv.ru/exp/yandex/sitemap_last.jsp',
    usesRutube: true,
    rutubeChannelId: 23178409,  // 19,147+ videos
    sources: {
      'video': { categories: ['politics', 'society', 'world'] },
      'news': { url: 'https://ntv.ru/novosti/', categories: ['politics', 'society'] },
    }
  },
  // RIA Novosti removed - their Rutube videos have music instead of audio
  'tass': {
    name: 'TASS',
    nameRu: 'ТАСС',
    domain: 'tass.ru',
    usesRutube: true,
    rutubeChannelId: 23950585,  // 28,769+ videos
    sources: {
      'video': { categories: ['politics', 'society', 'world'] },
    }
  },
  'izvestia': {
    name: 'Izvestia',
    nameRu: 'Известия',
    domain: 'iz.ru',
    usesRutube: true,
    rutubeChannelId: 23872322,  // 31,528+ videos
    sources: {
      'video': { categories: ['politics', 'society', 'world'] },
    }
  },
  // 'kommersant' removed - videos don't match expected economy category well

  // ============================================================================
  // RUTUBE CATEGORY SEARCH
  // ============================================================================
  'rutube': {
    name: 'Rutube',
    nameRu: 'Рутуб',
    domain: 'rutube.ru',
    apiBase: 'https://rutube.ru/api',
    categoryIds: {
      'news': 13,
      'politics': 42,
      'science': 8,
      'society': 21,
      'sports': 14,
      'culture': 7,
    },
    sources: {
      'news': { categoryId: 13, categories: ['politics', 'world'] },
      'politics': { categoryId: 42, categories: ['politics'] },
      'society': { categoryId: 21, categories: ['society'] },
      'sports': { categoryId: 14, categories: ['sports'] },
      'science': { categoryId: 8, categories: ['science', 'technology'] },
      'culture': { categoryId: 7, categories: ['culture'] },
    }
  },

  // ============================================================================
  // SPORTS CHANNELS
  // ============================================================================
  'matchtv': {
    name: 'Match TV',
    nameRu: 'Матч ТВ',
    domain: 'matchtv.ru',
    usesRutube: true,
    rutubeChannelId: 657766,  // 15,049 videos
    sources: { 'video': { categories: ['sports'] } }
  },
  'rfs': {
    name: 'Russian Football Union',
    nameRu: 'РФС',
    domain: 'rfs.ru',
    usesRutube: true,
    rutubeChannelId: 25330192,  // 1,747 videos
    sources: { 'video': { categories: ['sports'] } }
  },
  'zenit': {
    name: 'FC Zenit',
    nameRu: 'ФК Зенит',
    domain: 'fc-zenit.ru',
    usesRutube: true,
    rutubeChannelId: 24809069,  // 2,234 videos
    sources: { 'video': { categories: ['sports'] } }
  },
  'khl': {
    name: 'KHL',
    nameRu: 'КХЛ',
    domain: 'khl.ru',
    usesRutube: true,
    rutubeChannelId: 923820,  // 2,316 videos
    sources: { 'video': { categories: ['sports'] } }
  },
  'sport-marathon': {
    name: 'Sport Marathon',
    nameRu: 'Спорт-Марафон',
    domain: 'sport-marafon.ru',
    usesRutube: true,
    rutubeChannelId: 46833047,  // 2,436 videos - skiing, hiking, climbing
    sources: { 'video': { categories: ['sports', 'tourism'] } }
  },

  // ============================================================================
  // CULTURE & ARTS CHANNELS
  // ============================================================================
  'bolshoi': {
    name: 'Bolshoi Theatre',
    nameRu: 'Большой театр',
    domain: 'bolshoi.ru',
    usesRutube: true,
    rutubeChannelId: 25271876,  // 391 videos - ballet, opera
    sources: { 'video': { categories: ['culture'] } }
  },
  'mariinsky': {
    name: 'Mariinsky Theatre',
    nameRu: 'Мариинский театр',
    domain: 'mariinsky.ru',
    usesRutube: true,
    rutubeChannelId: 996098,  // 149 videos
    sources: { 'video': { categories: ['culture'] } }
  },
  'tretyakov': {
    name: 'Tretyakov Gallery',
    nameRu: 'Третьяковская галерея',
    domain: 'tretyakovgallery.ru',
    usesRutube: true,
    rutubeChannelId: 25592111,  // 193 videos - art tours, lectures
    sources: { 'video': { categories: ['culture', 'education'] } }
  },
  'mosfilm': {
    name: 'Mosfilm',
    nameRu: 'Мосфильм',
    domain: 'mosfilm.ru',
    usesRutube: true,
    rutubeChannelId: 25963146,  // 752+ videos - classic Soviet/Russian films
    sources: { 'video': { categories: ['culture'] } }
  },
  'rtd': {
    name: 'RT Documentary',
    nameRu: 'RT Документальные',
    domain: 'rtd.rt.com',
    usesRutube: true,
    rutubeChannelId: 23239684,  // 856+ documentaries
    sources: { 'video': { categories: ['culture', 'world', 'society'] } }
  },
  'kultura-tv': {
    name: 'Russia Kultura TV',
    nameRu: 'Телеканал Культура',
    domain: 'tvkultura.ru',
    usesRutube: true,
    rutubeChannelId: 24620649,  // 243 videos
    sources: { 'video': { categories: ['culture', 'education'] } }
  },
  'culture-rf': {
    name: 'Culture.RF',
    nameRu: 'Культура.РФ',
    domain: 'culture.ru',
    usesRutube: true,
    rutubeChannelId: 23630594,  // 299 videos
    sources: { 'video': { categories: ['culture', 'education', 'tourism'] } }
  },
  'digital-history': {
    name: 'Digital History',
    nameRu: 'Цифровая история',
    domain: 'digitalhistory.ru',
    usesRutube: true,
    rutubeChannelId: 23600725,  // 1,177 videos - historical lectures
    sources: { 'video': { categories: ['education', 'culture'] } }
  },
  'gorky-lit': {
    name: 'Gorky Literary Institute',
    nameRu: 'Литературный институт Горького',
    domain: 'litinstitut.ru',
    usesRutube: true,
    rutubeChannelId: 24195139,  // 1,456 videos - poetry, lectures
    sources: { 'video': { categories: ['culture', 'education'] } }
  },
  'mmdm': {
    name: 'Moscow House of Music',
    nameRu: 'Московский Дом музыки',
    domain: 'mmdm.ru',
    usesRutube: true,
    rutubeChannelId: 24117476,  // 652 videos - concerts
    sources: { 'video': { categories: ['culture'] } }
  },

  // ============================================================================
  // EDUCATION CHANNELS
  // ============================================================================
  'edu-tv': {
    name: 'First Educational Channel',
    nameRu: 'Первый образовательный',
    domain: 'pervyobraz.ru',
    usesRutube: true,
    rutubeChannelId: 831005,  // 4,876 videos!
    sources: { 'video': { categories: ['education'] } }
  },
  'spbgu': {
    name: 'St. Petersburg State University',
    nameRu: 'СПбГУ',
    domain: 'spbu.ru',
    usesRutube: true,
    rutubeChannelId: 24725063,  // 1,596 videos
    sources: { 'video': { categories: ['education', 'science'] } }
  },
  'bauman': {
    name: 'Bauman University',
    nameRu: 'МГТУ Баумана',
    domain: 'bmstu.ru',
    usesRutube: true,
    rutubeChannelId: 24869232,  // 344 videos
    sources: { 'video': { categories: ['education', 'technology', 'science'] } }
  },
  'infourok': {
    name: 'Infourok',
    nameRu: 'Инфоурок',
    domain: 'infourok.ru',
    usesRutube: true,
    rutubeChannelId: 23464093,  // 1,366 videos - #1 education platform
    sources: { 'video': { categories: ['education'] } }
  },
  'pushkin-institute': {
    name: 'Pushkin Institute',
    nameRu: 'Институт Пушкина',
    domain: 'pushkin.institute',
    usesRutube: true,
    rutubeChannelId: 28373461,  // 67 videos - Russian language teaching
    sources: { 'video': { categories: ['education'] } }
  },
  'naukatv': {
    name: 'Nauka TV',
    nameRu: 'Наука ТВ',
    domain: 'naukatv.ru',
    usesRutube: true,
    rutubeChannelId: 26552402,
    sources: { 'video': { categories: ['science', 'technology', 'education'] } }
  },

  // ============================================================================
  // TOURISM & TRAVEL CHANNELS
  // ============================================================================
  'travel-interesting': {
    name: 'Interesting Travels',
    nameRu: 'Интересные путешествия',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 31492351,  // 821 videos - travel to various countries
    sources: { 'video': { categories: ['tourism'] } }
  },
  'family-travel': {
    name: 'Family on Suitcases',
    nameRu: 'Семья на чемоданах',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 23483581,  // 969 videos - family travel vlog
    sources: { 'video': { categories: ['tourism', 'society'] } }
  },
  'journey-countries': {
    name: 'Journey Through Countries',
    nameRu: 'Путешествие по странам',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 37122400,  // 323 videos
    sources: { 'video': { categories: ['tourism', 'world'] } }
  },

  // ============================================================================
  // LIFESTYLE & SOCIETY CHANNELS
  // ============================================================================
  'recipes': {
    name: 'Tasty Recipes',
    nameRu: 'Вкусные рецепты',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 28209940,  // 1,054 videos - cooking
    sources: { 'video': { categories: ['society'] } }
  },
  'kitchen-studio': {
    name: 'Kitchen Studio',
    nameRu: 'Студия КУХНЯ',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 32232531,  // 898 videos
    sources: { 'video': { categories: ['society'] } }
  },
  'dr-evdokimenko': {
    name: 'Dr. Evdokimenko',
    nameRu: 'Доктор Евдокименко',
    domain: 'evdokimenko.ru',
    usesRutube: true,
    rutubeChannelId: 23621163,  // 195 videos - health
    sources: { 'video': { categories: ['society'] } }
  },
  'health-school': {
    name: 'School of Health',
    nameRu: 'Школа здоровья',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 31251004,  // 342 videos
    sources: { 'video': { categories: ['society'] } }
  },
  'parenting': {
    name: 'Child Raising Tips',
    nameRu: 'Воспитание детей',
    domain: 'rutube.ru',
    usesRutube: true,
    rutubeChannelId: 63827681,  // 612 videos - parenting
    sources: { 'video': { categories: ['society', 'education'] } }
  },
  'rospotrebnadzor': {
    name: 'Rospotrebnadzor',
    nameRu: 'Роспотребнадзор',
    domain: 'rospotrebnadzor.ru',
    usesRutube: true,
    rutubeChannelId: 25263358,  // 128 videos - consumer protection
    sources: { 'video': { categories: ['society'] } }
  },

  // ============================================================================
  // ECONOMY & BUSINESS
  // ============================================================================
  'rbc': {
    name: 'RBC',
    nameRu: 'РБК',
    domain: 'rbc.ru',
    usesRutube: true,
    rutubeChannelId: 24141691,
    sources: { 'video': { categories: ['economy', 'politics'] } }
  },

  // ============================================================================
  // WEATHER & EMERGENCY
  // ============================================================================
  'mchs': {
    name: 'MChS Russia (EMERCOM)',
    nameRu: 'МЧС России',
    domain: 'mchs.gov.ru',
    usesRutube: true,
    rutubeChannelId: 23875424,  // 732+ videos
    sources: { 'video': { categories: ['weather', 'society', 'military'] } }
  },
};

// ============================================================================
// REQUEST THROTTLING - Prevent CPU overload from rapid requests
// ============================================================================

// Track recent requests to throttle if too many come in quickly
// With edge caching, most requests never hit the worker, so we can be more generous
const recentRequests = [];
const MAX_REQUESTS_PER_MINUTE = 60; // Increased from 30 - edge cache handles most traffic
const THROTTLE_WINDOW_MS = 60000; // 1 minute window

function shouldThrottle() {
  const now = Date.now();
  // Clean old entries
  while (recentRequests.length > 0 && recentRequests[0] < now - THROTTLE_WINDOW_MS) {
    recentRequests.shift();
  }
  // Check if we're over limit
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  // Add this request
  recentRequests.push(now);
  return false;
}

// ============================================================================
// CORS & RESPONSE HELPERS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(data, status = 200, cacheSeconds = 0) {
  const headers = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS
  };

  // Add cache headers for successful responses (allows browser/CDN caching)
  if (status === 200 && cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`;
    headers['CDN-Cache-Control'] = `max-age=${cacheSeconds}`;
  }

  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: true, message, status }, status);
}

function audioResponse(audioData, filename = 'audio.aac') {
  return new Response(audioData, {
    status: 200,
    headers: {
      'Content-Type': 'audio/aac',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...CORS_HEADERS
    }
  });
}

function log(...args) {
  if (CONFIG.debug) console.log('[Matushka]', ...args);
}

// ============================================================================
// FETCH HELPERS
// ============================================================================

async function fetchWithHeaders(url, options = {}) {
  const headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    ...options.headers
  };
  return fetch(url, { ...options, headers });
}

async function fetchJson(url) {
  const response = await fetchWithHeaders(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ============================================================================
// CATEGORY INFERENCE (weighted scoring with negative keywords)
// ============================================================================

// Enhanced category detection with weighted keywords and negative exclusions
// Includes both Cyrillic and Latin transliterations for 1tv URL matching
const CATEGORY_DETECTION = {
  sports: {
    positive: [
      // Cyrillic (from agent analysis)
      { keywords: ['спорт', 'футбол', 'хоккей', 'баскетбол', 'теннис', 'бокс', 'волейбол'], weight: 4 },
      { keywords: ['чемпион', 'чемпионат', 'олимп', 'олимпиад', 'кубок', 'турнир'], weight: 4 },
      { keywords: ['матч', 'финал', 'победа', 'поражени', 'пояс'], weight: 3 },
      { keywords: ['сборн', 'команд', 'тренер', 'игрок', 'вратарь', 'забит', 'забил'], weight: 3 },
      { keywords: ['атлет', 'фигурист', 'фигурн', 'плаван', 'гимнаст', 'шахмат'], weight: 3 },
      { keywords: ['лыж', 'биатлон', 'легкоатлет', 'хоккеист'], weight: 3 },
      // Ice skating terms (not "ледниковый период" alone - could be Ice Age geological)
      { keywords: ['ледовое шоу', 'танцы на льду', 'лёд и пламя', 'звёзды на льду'], weight: 5 },
      { keywords: ['коньки', 'катание на льду', 'каток', 'фигурное катан'], weight: 3 },
      { keywords: ['стадион', 'арена', 'соревнован'], weight: 2 },
      // Esports
      { keywords: ['киберспорт', 'esport', 'dota', 'counter-strike', 'cs2', 'valorant'], weight: 4 },
      // Motor sports
      { keywords: ['формула', 'гонк', 'гонщик', 'автоспорт', 'мотоспорт', 'ралли', 'f1'], weight: 3 },
      // Combat sports
      { keywords: ['мма', 'ufc', 'единоборств', 'борьб', 'дзюдо', 'самбо', 'карате'], weight: 3 },
      // Winter sports additions
      { keywords: ['керлинг', 'скелетон', 'бобслей', 'сноуборд', 'фристайл'], weight: 3 },
      // Latin transliterations (from 1tv agent analysis)
      { keywords: ['sport', 'futbol', 'hokkey', 'basketbol', 'tennis', 'boks', 'voleybol'], weight: 4 },
      { keywords: ['chempion', 'chempionat', 'olimp', 'olimpiad', 'kubok', 'turnir'], weight: 4 },
      { keywords: ['match', 'final', 'pobeda', 'porazheni'], weight: 3 },
      { keywords: ['sborn', 'komand', 'trener', 'igrok', 'vratar', 'zabit', 'zabil'], weight: 3 },
      { keywords: ['atlet', 'figurist', 'figurn', 'plavan', 'gimnast', 'shahmat'], weight: 3 },
      { keywords: ['lyzh', 'biatlon', 'legkoatlet', 'hokkeist', 'spartak'], weight: 3 },
      { keywords: ['stadion', 'arena', 'sorevnovan'], weight: 2 },
      // Esports/motor/combat - Latin
      { keywords: ['kibersport', 'esport', 'dota', 'counter-strike', 'cs2', 'valorant'], weight: 4 },
      { keywords: ['formula', 'gonk', 'gonschik', 'avtosport', 'motosport', 'ralli', 'f1'], weight: 3 },
      { keywords: ['mma', 'ufc', 'edinoborstv', 'borb', 'dzyudo', 'sambo', 'karate'], weight: 3 },
      { keywords: ['kerling', 'skeleton', 'bobsley', 'snoubord', 'fristayl'], weight: 3 },
    ],
    negative: ['министр спорта', 'минспорт', 'правительств', 'дума', 'закон о спорте', 'голод', 'sim boks',
               'ministr sporta', 'minsport', 'pravitelstv', 'golod', 'goloda', 'moshennik'],
    requiredScore: 3,
  },
  // POLITICS: Government actions, legislation, elections, diplomacy, official statements
  // If it's about GOVERNMENT DOING something → politics
  // If it's about PEOPLE/SOCIETY experiencing something → society
  politics: {
    positive: [
      // Cyrillic - Government and state actions
      { keywords: ['политик', 'политическ'], weight: 4 },
      { keywords: ['дума', 'парламент', 'депутат', 'фракц', 'законопроект', 'закон'], weight: 4 },
      { keywords: ['правительств', 'кабинет министров', 'премьер', 'мишустин'], weight: 4 },
      { keywords: ['президент', 'путин', 'кремл', 'администраци'], weight: 3 },
      { keywords: ['министр', 'министерств', 'ведомств', 'губернатор'], weight: 3 },
      { keywords: ['выбор', 'голосован', 'референдум', 'избиратель', 'кандидат'], weight: 4 },
      { keywords: ['указ', 'постановлен', 'распоряжен', 'декрет'], weight: 3 },
      { keywords: ['санкци', 'дипломат', 'посол', 'мид', 'лавров'], weight: 4 },
      { keywords: ['переговор', 'саммит', 'визит', 'встреча лидеров'], weight: 3 },
      { keywords: ['оппозиц', 'партия', 'единая россия', 'кпрф', 'лдпр'], weight: 3 },
      // Regional politics
      { keywords: ['мэр', 'мэри', 'глава региона', 'субъект федерации'], weight: 3 },
      // International organizations
      { keywords: ['брикс', 'шос', 'g7', 'g20', 'большая семерка'], weight: 3 },
      // Political processes
      { keywords: ['коалиц', 'коррупц', 'импичмент', 'отставк', 'назначен'], weight: 3 },
      { keywords: ['ратификац', 'вето', 'резолюц', 'мандат'], weight: 3 },
      // Latin transliterations
      { keywords: ['politik', 'politichesk'], weight: 4 },
      { keywords: ['duma', 'parlament', 'deputat', 'frakc', 'zakonoproekt', 'zakon'], weight: 4 },
      { keywords: ['pravitelstv', 'kabinet ministrov', 'premyer', 'mishustin'], weight: 4 },
      { keywords: ['prezident', 'putin', 'kreml', 'administraci'], weight: 3 },
      { keywords: ['ministr', 'ministerst', 'vedomstv', 'gubernator'], weight: 3 },
      { keywords: ['vybor', 'golosovan', 'referendum', 'izbiratel', 'kandidat'], weight: 4 },
      { keywords: ['ukaz', 'postanovlen', 'rasporyazhen', 'dekret'], weight: 3 },
      { keywords: ['sankci', 'diplomat', 'posol', 'mid', 'lavrov'], weight: 4 },
      { keywords: ['peregovor', 'sammit', 'vizit', 'vstrecha liderov'], weight: 3 },
      { keywords: ['oppozic', 'partiya', 'edinaya rossiya', 'kprf', 'ldpr'], weight: 3 },
      // Regional/Intl/Processes - Latin
      { keywords: ['mer', 'meri', 'glava regiona', 'subekt federacii'], weight: 3 },
      { keywords: ['briks', 'shos', 'bolshaya semerka'], weight: 3 },
      { keywords: ['koalic', 'korrupci', 'impichment', 'otstavk', 'naznachen'], weight: 3 },
      { keywords: ['ratifikac', 'veto', 'rezolyuc', 'mandat'], weight: 3 },
    ],
    // Exclude military operations, sports, pure society stories, and health/medical content
    negative: ['спорт', 'футбол', 'хоккей', 'матч', 'турнир', 'чемпион', 'фигурист',
               'войск', 'армия', 'всу', 'сво', 'харьков', 'донецк', 'военн', 'артиллер', 'бпла', 'штурм',
               // Health/medical - should be society, not politics
               'здоровь', 'медицин', 'врач', 'больниц', 'лечен', 'диет', 'витамин', 'организм',
               'мозг', 'сердц', 'давлен', 'питани', 'рецепт', 'совет врача', 'медицинск',
               'sport', 'futbol', 'hokkey', 'match', 'turnir', 'figurist',
               'voysk', 'armiya', 'vsu', 'svo', 'harkov', 'doneck', 'voenn', 'artiller', 'bpla', 'shturm',
               // Health/medical - Latin transliterations
               'zdorov', 'medicin', 'vrach', 'bolnic', 'lechen', 'diet', 'vitamin', 'organism',
               'mozg', 'serdc', 'davlen', 'pitani', 'recept', 'sovet vracha', 'medicinskiy'],
    requiredScore: 3,
  },
  economy: {
    positive: [
      // Cyrillic (enhanced from agent analysis)
      { keywords: ['экономик', 'экономическ'], weight: 4 },
      { keywords: ['рубл', 'доллар', 'евро', 'валют', 'курс валют'], weight: 4 },
      { keywords: ['ипотек', 'маткапитал', 'выплат', 'пособи', 'капитал'], weight: 4 },
      { keywords: ['банк', 'цб', 'центробанк', 'ставк'], weight: 3 },
      { keywords: ['инфляц', 'дефляц', 'ввп', 'рецесс', 'индексац'], weight: 3 },
      { keywords: ['производств', 'завод', 'промышленн', 'предприяти'], weight: 3 },
      { keywords: ['бизнес', 'предпринимател', 'компани'], weight: 2 },
      { keywords: ['акци', 'биржа', 'инвест', 'фонд', 'активы'], weight: 3 },
      { keywords: ['бюджет', 'налог', 'пошлин', 'тариф'], weight: 2 },
      { keywords: ['импорт', 'экспорт', 'торговл', 'санкци'], weight: 2 },
      // Tech economy
      { keywords: ['стартап', 'венчур', 'финтех', 'it-компани'], weight: 3 },
      { keywords: ['крипто', 'биткоин', 'блокчейн', 'криптовалют'], weight: 3 },
      // Employment
      { keywords: ['безработиц', 'занятост', 'рынок труд', 'вакансии'], weight: 3 },
      { keywords: ['зарплат', 'оклад', 'мрот', 'доход'], weight: 3 },
      // Real estate
      { keywords: ['недвижимост', 'застройщик', 'жилье', 'квартир'], weight: 3 },
      // Business news sources - when content references these, it's likely economy
      { keywords: ['рбк', 'rbc.ru', 'ведомости', 'vedomosti.ru'], weight: 3 },
      // Latin transliterations (from 1tv agent - gas/energy focus)
      { keywords: ['ekonomik', 'ekonomichesk'], weight: 4 },
      { keywords: ['rubl', 'dollar', 'evro', 'valyut', 'kurs valyut'], weight: 4 },
      { keywords: ['gaz', 'gazprom', 'tranzit', 'neft'], weight: 4 },
      { keywords: ['tseny', 'tsen', 'tarif', 'zolotovalyutn'], weight: 3 },
      { keywords: ['bank', 'centrobank', 'stavk', 'rezerv'], weight: 3 },
      { keywords: ['inflyac', 'deflyac', 'vvp', 'mrot', 'pensii'], weight: 3 },
      { keywords: ['biznes', 'predprinimatel', 'kompani', 'postavk'], weight: 2 },
      { keywords: ['akci', 'birzha', 'invest', 'fond', 'aktivy'], weight: 3 },
      { keywords: ['byudzhet', 'nalog', 'poshlin'], weight: 2 },
      // Tech/employment/real estate - Latin
      { keywords: ['startap', 'venchur', 'fintekh', 'it-kompani'], weight: 3 },
      { keywords: ['kripto', 'bitkoin', 'blokcheyn', 'kriptovalyut'], weight: 3 },
      { keywords: ['bezrabotic', 'zanyatost', 'rynok trud', 'vakansii'], weight: 3 },
      { keywords: ['zarplat', 'oklad', 'dokhod'], weight: 3 },
      { keywords: ['nedvizhimost', 'zastroyschik', 'zhilye', 'kvartir'], weight: 3 },
    ],
    negative: ['спорт', 'футбол', 'культур', 'театр', 'sport', 'futbol', 'kultur', 'teatr'],
    requiredScore: 3,
  },
  world: {
    positive: [
      // === GENERAL INTERNATIONAL TERMS ===
      { keywords: ['международн', 'мировой', 'глобальн'], weight: 3 },
      { keywords: ['зарубеж', 'иностран'], weight: 2 },

      // === MAJOR POWERS (existing) ===
      { keywords: ['сша', 'америк', 'вашингтон', 'белый дом'], weight: 3 },
      { keywords: ['китай', 'пекин', 'кнр', 'си цзиньпин'], weight: 3 },

      // === EUROPE ===
      { keywords: ['европ', 'евросоюз', 'брюссел', 'ес', 'еврокомисс'], weight: 3 },
      { keywords: ['великобритан', 'лондон', 'британ', 'англи'], weight: 3 },
      { keywords: ['германи', 'берлин', 'фрг', 'немец', 'бундестаг'], weight: 3 },
      { keywords: ['франци', 'париж', 'франц', 'елисейск'], weight: 3 },
      { keywords: ['итали', 'рим', 'итальян'], weight: 3 },
      { keywords: ['испани', 'мадрид', 'испан'], weight: 3 },
      { keywords: ['польш', 'варшав', 'польск'], weight: 3 },
      { keywords: ['белорус', 'минск', 'беларус'], weight: 3 },
      { keywords: ['молдов', 'кишинев'], weight: 3 },
      { keywords: ['грузи', 'тбилиси', 'грузинск'], weight: 2 },
      { keywords: ['армени', 'ереван', 'армянск'], weight: 3 },
      { keywords: ['азербайджан', 'баку'], weight: 3 },
      { keywords: ['латви', 'рига', 'латвийск'], weight: 3 },
      { keywords: ['литв', 'вильнюс', 'литовск'], weight: 3 },
      { keywords: ['эстони', 'таллин', 'эстонск'], weight: 3 },
      { keywords: ['финлянди', 'хельсинки', 'финск'], weight: 3 },
      { keywords: ['швеци', 'стокгольм', 'шведск'], weight: 3 },
      { keywords: ['норвеги', 'осло', 'норвежск'], weight: 3 },
      { keywords: ['дани', 'копенгаген', 'датск'], weight: 3 },
      { keywords: ['нидерланд', 'амстердам', 'голланд'], weight: 3 },
      { keywords: ['бельги', 'брюссел'], weight: 3 },
      { keywords: ['австри', 'вена', 'австрийск'], weight: 3 },
      { keywords: ['швейцари', 'берн', 'женева', 'цюрих'], weight: 3 },
      { keywords: ['чехи', 'прага', 'чешск'], weight: 3 },
      { keywords: ['словаки', 'братислав'], weight: 3 },
      { keywords: ['венгри', 'будапешт', 'венгерск'], weight: 3 },
      { keywords: ['румыни', 'бухарест'], weight: 3 },
      { keywords: ['болгари', 'софи', 'болгарск'], weight: 3 },
      { keywords: ['греци', 'афин', 'греческ'], weight: 3 },
      { keywords: ['сербия', 'белград', 'сербск'], weight: 3 },
      { keywords: ['хорвати', 'загреб'], weight: 3 },
      { keywords: ['словени', 'любляна'], weight: 3 },
      { keywords: ['португали', 'лиссабон'], weight: 3 },
      { keywords: ['ирланди', 'дублин'], weight: 3 },

      // === CIS / POST-SOVIET ===
      { keywords: ['казахстан', 'астана', 'нур-султан', 'казахск'], weight: 3 },
      { keywords: ['узбекистан', 'ташкент', 'узбекск'], weight: 3 },
      { keywords: ['туркменистан', 'ашхабад'], weight: 3 },
      { keywords: ['таджикистан', 'душанбе'], weight: 3 },
      { keywords: ['киргизи', 'бишкек', 'киргизск'], weight: 3 },

      // === ASIA ===
      { keywords: ['япони', 'токио', 'японск'], weight: 3 },
      { keywords: ['южная корея', 'сеул', 'южнокорейск'], weight: 3 },
      { keywords: ['северная корея', 'пхеньян', 'кндр', 'северокорейск'], weight: 3 },
      { keywords: ['инди', 'дели', 'индийск', 'моди'], weight: 3 },
      { keywords: ['пакистан', 'исламабад', 'пакистанск'], weight: 3 },
      { keywords: ['индонези', 'джакарта'], weight: 3 },
      { keywords: ['вьетнам', 'ханой', 'вьетнамск'], weight: 3 },
      { keywords: ['таиланд', 'бангкок', 'таиландск'], weight: 3 },
      { keywords: ['малайзи', 'куала-лумпур'], weight: 3 },
      { keywords: ['сингапур'], weight: 3 },
      { keywords: ['филиппин', 'манила'], weight: 3 },
      { keywords: ['тайван', 'тайбэй', 'тайваньск'], weight: 3 },
      { keywords: ['монголи', 'улан-батор'], weight: 3 },
      { keywords: ['бангладеш', 'дакка'], weight: 3 },
      { keywords: ['мьянма', 'бирм'], weight: 3 },
      { keywords: ['афганистан', 'кабул', 'афганск', 'талиб'], weight: 3 },

      // === MIDDLE EAST ===
      { keywords: ['иран', 'тегеран', 'иранск', 'персидск'], weight: 3 },
      { keywords: ['ирак', 'багдад', 'иракск'], weight: 3 },
      { keywords: ['сири', 'дамаск', 'сирийск'], weight: 3 },
      { keywords: ['израил', 'тель-авив', 'иерусалим', 'израильск'], weight: 3 },
      { keywords: ['палестин', 'газа', 'хамас', 'палестинск'], weight: 3 },
      { keywords: ['турци', 'анкара', 'стамбул', 'турецк', 'эрдоган'], weight: 3 },
      { keywords: ['саудовская арави', 'эр-рияд', 'саудовск'], weight: 3 },
      { keywords: ['оаэ', 'эмират', 'дубай', 'абу-даби'], weight: 3 },
      { keywords: ['катар', 'доха'], weight: 3 },
      { keywords: ['кувейт'], weight: 3 },
      { keywords: ['бахрейн'], weight: 3 },
      { keywords: ['оман', 'маскат'], weight: 3 },
      { keywords: ['йемен', 'сана', 'хусит'], weight: 3 },
      { keywords: ['ливан', 'бейрут', 'хезболла'], weight: 3 },
      { keywords: ['иордани', 'амман'], weight: 3 },

      // === AFRICA ===
      { keywords: ['египет', 'каир', 'египетск'], weight: 3 },
      { keywords: ['южная африк', 'йоханнесбург', 'претори', 'юар'], weight: 3 },
      { keywords: ['нигери', 'лагос', 'абуджа'], weight: 3 },
      { keywords: ['эфиопи', 'аддис-абеба'], weight: 3 },
      { keywords: ['кени', 'найроби'], weight: 3 },
      { keywords: ['марокко', 'рабат'], weight: 3 },
      { keywords: ['алжир'], weight: 3 },
      { keywords: ['туни'], weight: 3 },
      { keywords: ['ливи', 'триполи', 'ливийск'], weight: 3 },
      { keywords: ['судан', 'хартум'], weight: 3 },
      { keywords: ['гана', 'аккра'], weight: 3 },
      { keywords: ['танзани'], weight: 3 },
      { keywords: ['конго', 'киншаса'], weight: 3 },

      // === AMERICAS ===
      { keywords: ['канад', 'оттава', 'торонто', 'канадск'], weight: 3 },
      { keywords: ['мексик', 'мехико', 'мексиканск'], weight: 3 },
      { keywords: ['бразили', 'бразилья', 'рио', 'бразильск'], weight: 3 },
      { keywords: ['аргентин', 'буэнос-айрес', 'аргентинск'], weight: 3 },
      { keywords: ['чили', 'сантьяго', 'чилийск'], weight: 3 },
      { keywords: ['перу', 'лима', 'перуанск'], weight: 3 },
      { keywords: ['колумби', 'богота', 'колумбийск'], weight: 3 },
      { keywords: ['венесуэл', 'каракас', 'мадуро'], weight: 3 },
      { keywords: ['куба', 'гавана', 'кубинск'], weight: 3 },
      { keywords: ['эквадор', 'кито'], weight: 3 },
      { keywords: ['боливи', 'ла-пас'], weight: 3 },
      { keywords: ['уругвай', 'монтевидео'], weight: 3 },

      // === OCEANIA ===
      { keywords: ['австрали', 'сидней', 'канберра', 'мельбурн', 'австралийск'], weight: 3 },
      { keywords: ['новая зеланди', 'веллингтон', 'окленд', 'новозеландск'], weight: 3 },

      // === INTERNATIONAL ORGANIZATIONS ===
      { keywords: ['нато', 'оон', 'совбез', 'генассамбле'], weight: 3 },
      { keywords: ['асеан', 'мвф', 'всемирный банк', 'вто'], weight: 3 },
      { keywords: ['магатэ', 'юнеско', 'воз', 'юнисеф'], weight: 3 },
      { keywords: ['интерпол', 'международный суд', 'гаага'], weight: 3 },
      { keywords: ['брикс', 'шос', 'снг', 'еаэс'], weight: 3 },
      { keywords: ['g7', 'g20', 'большая семерка', 'большая двадцатка'], weight: 3 },

      // === WORLD LEADERS ===
      { keywords: ['байден', 'трамп', 'макрон', 'шольц'], weight: 2 },

      // === LATIN TRANSLITERATIONS (key ones) ===
      { keywords: ['mezhdunarodn', 'mirovoy', 'globaln'], weight: 3 },
      { keywords: ['ssha', 'amerika', 'vashington'], weight: 3 },
      { keywords: ['kitay', 'pekin', 'knr'], weight: 3 },
      { keywords: ['evrop', 'evrosoyuz', 'bryussel'], weight: 3 },
      { keywords: ['velikobritan', 'london', 'britan'], weight: 3 },
      { keywords: ['germani', 'berlin', 'frg'], weight: 3 },
      { keywords: ['franci', 'parizh'], weight: 3 },
      { keywords: ['itali', 'rim'], weight: 3 },
      { keywords: ['ispani', 'madrid'], weight: 3 },
      { keywords: ['polsh', 'varshav'], weight: 3 },
      { keywords: ['yaponi', 'tokio'], weight: 3 },
      { keywords: ['yuzhnaya koreya', 'seul'], weight: 3 },
      { keywords: ['indi', 'deli', 'indiysk'], weight: 3 },
      { keywords: ['iran', 'tegeran'], weight: 3 },
      { keywords: ['izrail', 'tel-aviv', 'ierusalim'], weight: 3 },
      { keywords: ['turci', 'ankara', 'stambul'], weight: 3 },
      { keywords: ['egipet', 'kair'], weight: 3 },
      { keywords: ['brazili', 'rio'], weight: 3 },
      { keywords: ['kanada', 'ottava', 'toronto'], weight: 3 },
      { keywords: ['meksik', 'mekhiko'], weight: 3 },
      { keywords: ['nato', 'oon', 'sovbez'], weight: 3 },
      { keywords: ['briks', 'shos', 'sng', 'eaes'], weight: 3 },
    ],
    negative: [
      'спорт', 'футбол', 'культур', 'sport', 'futbol', 'kultur',
      'турист', 'turist', 'отдых', 'otdykh',
    ],
    requiredScore: 3,
  },
  // SOCIETY: Everyday life, human interest, community, health, family, social welfare
  // NOT government policy - that's politics. NOT formal education - that's education.
  society: {
    positive: [
      // Cyrillic - social issues and everyday life
      { keywords: ['общество', 'социальн', 'социум'], weight: 4 },
      { keywords: ['граждан', 'население', 'жител', 'народ'], weight: 2 },
      { keywords: ['пенси', 'пенсионер', 'пособи', 'выплат', 'льгот'], weight: 3 },
      { keywords: ['здоровь', 'медицин', 'больниц', 'врач', 'лечен', 'пациент', 'клиник'], weight: 4 },
      { keywords: ['семья', 'семей', 'родител', 'брак', 'развод', 'свадьб'], weight: 3 },
      { keywords: ['ребенок', 'дети', 'детей', 'детск', 'младенец', 'новорожден'], weight: 3 },
      { keywords: ['волонтер', 'благотвор', 'помощь', 'донор'], weight: 3 },
      { keywords: ['голод', 'бездомн', 'сирот', 'инвалид', 'нищет'], weight: 3 },
      { keywords: ['праздник', 'юбилей', 'годовщин', 'торжеств'], weight: 2 },
      { keywords: ['авари', 'дтп', 'пожар', 'катастроф', 'трагед'], weight: 3 },
      { keywords: ['преступлен', 'убийств', 'кража', 'мошенник', 'арест'], weight: 3 },
      // Missing persons / crime news (HIGH WEIGHT - very specific to society/crime)
      { keywords: ['пропал', 'пропавш', 'исчез'], weight: 4 },
      { keywords: ['тело найден', 'тело обнаружен', 'найден труп', 'обнаружен труп'], weight: 5 },
      { keywords: ['нападен', 'стрельб', 'ранен', 'пострадал'], weight: 3 },
      // School attacks / violence - definitely society news
      { keywords: ['нападение на школ', 'стрельба в школ', 'школьный стрелок'], weight: 5 },
      // Mental health
      { keywords: ['психолог', 'депресс', 'тревожност', 'стресс', 'ментальн'], weight: 3 },
      // Social movements
      { keywords: ['протест', 'митинг', 'демонстрац', 'петиц', 'акция протест'], weight: 3 },
      // Demographics
      { keywords: ['рождаемост', 'смертност', 'миграц', 'демограф'], weight: 3 },
      // Disability and inclusion
      { keywords: ['инклюзи', 'доступная сред', 'ограничен возможност'], weight: 3 },
      // Diet, nutrition, health lifestyle (HIGH WEIGHT - very specific to society)
      { keywords: ['диетолог', 'диетическ', 'диета'], weight: 5 },
      { keywords: ['питани', 'рацион', 'калори', 'белок', 'углевод'], weight: 4 },
      { keywords: ['похудеть', 'похудени', 'набрать вес', 'сбросить вес', 'лишний вес'], weight: 5 },
      { keywords: ['здоровое питани', 'правильное питани', 'пп'], weight: 5 },
      { keywords: ['витамин', 'минерал', 'добавк', 'бад'], weight: 3 },
      { keywords: ['фитнес', 'тренировк', 'зож', 'здоровый образ'], weight: 4 },
      { keywords: ['блин', 'масленица', 'рецепт'], weight: 3 },
      { keywords: ['еда', 'продукт', 'пища', 'кулинар'], weight: 2 },
      // Consumer/lifestyle surveys
      { keywords: ['опрос', 'исследовани', 'аналитик', 'россиян'], weight: 2 },
      // Latin transliterations
      { keywords: ['obschestvo', 'socialn', 'socium'], weight: 4 },
      { keywords: ['grazhdan', 'naselen', 'zhitel', 'narod'], weight: 2 },
      { keywords: ['pensi', 'pensioner', 'posobi', 'vyplat', 'lgot'], weight: 3 },
      { keywords: ['zdorov', 'medicin', 'bolnic', 'vrach', 'lechen', 'pacient', 'klinik'], weight: 4 },
      { keywords: ['semya', 'semey', 'roditel', 'brak', 'razvod', 'svadyb'], weight: 3 },
      { keywords: ['rebenok', 'deti', 'detey', 'detsk', 'mladenec', 'novorozhden'], weight: 3 },
      { keywords: ['volonter', 'blagotvor', 'pomosch', 'donor'], weight: 3 },
      { keywords: ['golod', 'bezdomn', 'sirot', 'invalid', 'nischet'], weight: 3 },
      { keywords: ['prazdnik', 'yubiley', 'godovshin', 'torzhestvo'], weight: 2 },
      { keywords: ['avari', 'dtp', 'pozhar', 'katastro', 'traged'], weight: 3 },
      { keywords: ['prestuplen', 'ubiystvo', 'krazh', 'moshennik', 'arest'], weight: 3 },
      // Missing persons / crime news - Latin
      { keywords: ['propal', 'propavsh', 'ischez'], weight: 4 },
      { keywords: ['telo nayden', 'telo obnaruzhen', 'nayden trup', 'obnaruzhen trup'], weight: 5 },
      { keywords: ['napaden', 'strelba', 'ranen', 'postradal'], weight: 3 },
      // School attacks - Latin
      { keywords: ['napadeniye na shkol', 'strelba v shkol', 'shkolny strelok'], weight: 5 },
      // Mental health/movements/demographics - Latin
      { keywords: ['psikholog', 'depress', 'trevozhnost', 'stress', 'mentaln'], weight: 3 },
      { keywords: ['protest', 'miting', 'demonstrac', 'petici'], weight: 3 },
      { keywords: ['rozhdaemost', 'smertnost', 'migrac', 'demograf'], weight: 3 },
      { keywords: ['inklyuzi', 'dostupnaya sred'], weight: 3 },
      // Diet/nutrition - Latin
      { keywords: ['dietolog', 'dietichesk', 'dieta'], weight: 5 },
      { keywords: ['pitani', 'racion', 'kalori', 'belok', 'uglevod'], weight: 4 },
      { keywords: ['pokhudet', 'pokhudeni', 'nabrat ves', 'sbrosit ves', 'lishniy ves'], weight: 5 },
      { keywords: ['zdorovoe pitani', 'pravilnoe pitani', 'pp'], weight: 5 },
      { keywords: ['vitamin', 'mineral', 'dobavk', 'bad'], weight: 3 },
      { keywords: ['fitnes', 'trenirovk', 'zozh', 'zdorovyy obraz'], weight: 4 },
      { keywords: ['blin', 'maslenica', 'recept'], weight: 3 },
      { keywords: ['eda', 'produkt', 'pischa', 'kulinar'], weight: 2 },
      { keywords: ['opros', 'issledovani', 'analitik', 'rossiyan'], weight: 2 },
    ],
    negative: ['спорт', 'дума', 'законопроект', 'военн', 'армия', 'министр',
               'sport', 'duma', 'zakonoproekt', 'voenn', 'armiya', 'ministr'],
    requiredScore: 3,
  },
  // EDUCATION: Schools, universities, students, teachers, exams, academic life
  // NOTE: Generic "school" terms have LOW weight - need additional education context
  education: {
    positive: [
      // HIGH WEIGHT - Unambiguous education terms (rarely appear in non-education contexts)
      { keywords: ['образован', 'обучен'], weight: 5 },  // education, learning/training
      { keywords: ['егэ', 'огэ'], weight: 6 },  // Russian standardized exams - very specific
      { keywords: ['учител', 'преподаватель', 'педагог'], weight: 5 },  // teacher, instructor, educator
      { keywords: ['учебник', 'учебн', 'учебный'], weight: 5 },  // textbook, educational
      { keywords: ['урок', 'лекци', 'семинар'], weight: 4 },  // lesson, lecture, seminar
      { keywords: ['экзамен', 'контрольн', 'зачет', 'сессия'], weight: 4 },  // exam, test, credit, exam period
      { keywords: ['аттестат', 'диплом'], weight: 4 },  // certificate, diploma (academic context)
      { keywords: ['стипенди'], weight: 4 },  // scholarship
      { keywords: ['минобр', 'минпросвещ'], weight: 6 },  // Ministry of Education - definitive

      // MEDIUM WEIGHT - Generally education-related
      { keywords: ['университет', 'вуз'], weight: 4 },  // university, higher ed institution
      { keywords: ['профессор', 'доцент', 'ректор', 'декан'], weight: 4 },  // professor, dean, etc.
      { keywords: ['студент', 'студентк', 'аспирант', 'магистр', 'бакалавр'], weight: 3 },
      { keywords: ['колледж', 'техникум', 'лицей', 'гимназ'], weight: 3 },
      { keywords: ['выпускной', 'выпускник'], weight: 3 },  // graduation, graduate
      { keywords: ['грант'], weight: 3 },  // grant (educational context)

      // LOW WEIGHT - Ambiguous terms (appear in accident/crime news too)
      // "школ" alone is NOT enough - need other education terms to confirm
      { keywords: ['школ'], weight: 2 },  // school - reduced from 4 to 2
      { keywords: ['школьник', 'школьниц', 'ученик', 'ученица'], weight: 2 },  // students - reduced
      { keywords: ['институт'], weight: 2 },  // can be research institute, not education

      // Latin transliterations - same weight structure
      { keywords: ['obrazovan', 'obuchen'], weight: 5 },
      { keywords: ['ege', 'oge'], weight: 6 },
      { keywords: ['uchitel', 'prepodavatel', 'pedagog'], weight: 5 },
      { keywords: ['uchebnik', 'uchebn', 'uchebnyy'], weight: 5 },
      { keywords: ['urok', 'lekci', 'seminar'], weight: 4 },
      { keywords: ['ekzamen', 'kontroln', 'zachet', 'sessiya'], weight: 4 },
      { keywords: ['attestat', 'diplom'], weight: 4 },
      { keywords: ['stipendi'], weight: 4 },
      { keywords: ['minobr', 'minprosvesh'], weight: 6 },
      { keywords: ['universitet', 'vuz'], weight: 4 },
      { keywords: ['professor', 'docent', 'rektor', 'dekan'], weight: 4 },
      { keywords: ['student', 'studentk', 'aspirant', 'magistr', 'bakalavr'], weight: 3 },
      { keywords: ['kolledzh', 'tekhnikum', 'licey', 'gimnaz'], weight: 3 },
      { keywords: ['vypusknoy', 'vypusknik'], weight: 3 },
      { keywords: ['grant'], weight: 3 },
      { keywords: ['shkol'], weight: 2 },
      { keywords: ['shkolnik', 'shkolnic', 'uchenik', 'uchenica'], weight: 2 },
      { keywords: ['institut'], weight: 2 },
    ],
    // Avoid matching military/sports content AND accident/crime stories that mention schools
    negative: [
      // Sports/military (original)
      'спорт', 'военн', 'армия', 'sport', 'voenn', 'armiya',
      // Military commissars/conscription - NOT education
      'военком', 'воeнком', 'призыв', 'облав', 'мобилизац',
      'voenkom', 'prizyv', 'oblav', 'mobilizac',
      // Design bureaus/engineering - NOT education (e.g., "konstruktorskomu byuro")
      'конструкторск', 'кб', 'бюро', 'konstruktorsk', 'byuro',
      // Accidents and incidents - school bus crash, fire at school, etc.
      'авари', 'дтп', 'пожар', 'взрыв', 'катастроф', 'трагед', 'погиб', 'жертв',
      'avari', 'dtp', 'pozhar', 'vzryv', 'katastro', 'traged', 'pogib', 'zhertv',
      // Crimes - robbery at school, assault, etc.
      'убийств', 'нападен', 'ограблен', 'кража', 'преступлен', 'арест', 'задержан',
      'ubiystvo', 'napaden', 'ograblen', 'krazh', 'prestuplen', 'arest', 'zaderzhan',
      // Emergency situations
      'эвакуац', 'мчс', 'спасател', 'скорая', 'реанимац', 'больниц',
      'evakuac', 'mchs', 'spasatel', 'skoraya', 'reanimac', 'bolnic',
      // Violence/danger
      'стрельб', 'угроз', 'бомб', 'террор', 'захват', 'заложник',
      'strelba', 'ugroz', 'bomb', 'terror', 'zakhvat', 'zalozhnik',
    ],
    requiredScore: 3,  // Standard threshold (disambiguation rules handle edge cases)
  },
  culture: {
    positive: [
      // Cyrillic
      { keywords: ['культур', 'культурн'], weight: 4 },
      { keywords: ['искусств', 'художник', 'художествен'], weight: 3 },
      { keywords: ['театр', 'спектакл', 'постановк', 'премьер'], weight: 3 },
      { keywords: ['кино', 'фильм', 'режиссер', 'актер', 'актрис'], weight: 3 },
      { keywords: ['музей', 'выставк', 'галере', 'экспозиц'], weight: 3 },
      { keywords: ['концерт', 'фестивал', 'музык', 'песн', 'певец', 'певиц'], weight: 3 },
      { keywords: ['балет', 'опера', 'оперн', 'оперетт', 'танц', 'хореограф'], weight: 3 },
      { keywords: ['литератур', 'писател', 'книг', 'роман'], weight: 2 },
      // Architecture
      { keywords: ['архитектур', 'зодчеств', 'памятник', 'реставрац'], weight: 3 },
      // Fashion
      { keywords: ['мода', 'модн', 'дизайнер', 'кутюрье', 'подиум', 'показ мод'], weight: 3 },
      // Awards/Festivals
      { keywords: ['премия', 'лауреат', 'номинант', 'каннск', 'оскар', 'эмми', 'грэмми'], weight: 3 },
      // Photography/Media arts
      { keywords: ['фотограф', 'инсталляц', 'перформанс', 'граффити', 'стрит-арт'], weight: 3 },
      // Latin transliterations
      { keywords: ['kultur', 'kulturn'], weight: 4 },
      { keywords: ['iskusstv', 'khudozhnik', 'khudozhestven'], weight: 3 },
      { keywords: ['teatr', 'spektakl', 'postanovk', 'premyer'], weight: 3 },
      { keywords: ['kino', 'film', 'rezhisser', 'akter', 'aktris'], weight: 3 },
      { keywords: ['muzey', 'vystavk', 'galere', 'ekspozic'], weight: 3 },
      { keywords: ['koncert', 'festival', 'muzyk', 'pesn', 'pevec', 'pevic'], weight: 3 },
      { keywords: ['balet', 'opera', 'opern', 'operett', 'tanc', 'khoreograf'], weight: 3 },
      { keywords: ['literatur', 'pisatel', 'knig', 'roman'], weight: 2 },
      // Architecture/fashion/awards - Latin
      { keywords: ['arkhitektur', 'zodchestv', 'pamyatnik', 'restavrac'], weight: 3 },
      { keywords: ['moda', 'modn', 'dizayner', 'kutyurye', 'podium', 'pokaz mod'], weight: 3 },
      { keywords: ['premiya', 'laureat', 'nominant', 'kannskiy', 'oskar', 'emmi', 'gremmi'], weight: 3 },
      { keywords: ['fotograf', 'installyac', 'performans', 'graffiti', 'strit-art'], weight: 3 },
    ],
    negative: ['спорт', 'политик', 'экономик', 'фсб', 'мвд', 'спецслужб', 'операци', 'оператор',
               'sport', 'politik', 'ekonomik', 'fsb', 'mvd', 'spetssluzhb', 'operatsi', 'operator'],
    requiredScore: 3,
  },
  science: {
    positive: [
      // Cyrillic - Core science terms (high confidence)
      { keywords: ['научн', 'ученый', 'ученые'], weight: 4 },  // Removed 'наук' - too broad
      { keywords: ['научное открыт', 'научное исследован'], weight: 5 },  // Specific scientific phrases
      { keywords: ['эксперимент', 'лаборатор'], weight: 4 },  // Lab/experiment strong signals
      // Space science - very specific
      { keywords: ['космос', 'роскосмос', 'мкс', 'орбит', 'космонавт', 'астронавт'], weight: 4 },
      { keywords: ['ракета-носитель', 'космический корабл'], weight: 4 },
      // Medical/biological research
      { keywords: ['медицинск исследован', 'клиническ испытан', 'вакцин'], weight: 4 },
      { keywords: ['генетик', 'днк', 'рнк', 'геном', 'молекулярн'], weight: 4 },
      { keywords: ['биолог', 'микробиолог', 'вирусолог', 'эпидемиолог'], weight: 3 },
      // Physical sciences
      { keywords: ['физик', 'квантов', 'термоядерн', 'коллайдер'], weight: 4 },
      { keywords: ['химик', 'химическ реакц', 'синтез'], weight: 3 },
      // Scientific institutions (more specific)
      { keywords: ['российская академия наук', 'академия наук'], weight: 4 },
      { keywords: ['научный институт', 'исследовательск центр'], weight: 3 },
      // Innovation/discovery (more specific contexts)
      { keywords: ['изобрет', 'патент'], weight: 2 },
      { keywords: ['научн разработк', 'научн открыт'], weight: 3 },
      // Climate science
      { keywords: ['климатолог', 'глобальн потеплен', 'парников'], weight: 3 },
      // Latin transliterations - Core science terms
      { keywords: ['nauchn', 'uchenyy', 'uchenye'], weight: 4 },
      { keywords: ['nauchnoe otkryt', 'nauchnoe issledovan'], weight: 5 },
      { keywords: ['eksperiment', 'laborator'], weight: 4 },
      // Space science - Latin
      { keywords: ['kosmos', 'roskosmos', 'mks', 'orbit', 'kosmonavt', 'astronavt'], weight: 4 },
      { keywords: ['raketa-nositel', 'kosmicheskiy korabl'], weight: 4 },
      // Medical/biological - Latin
      { keywords: ['medicinskoe issledovan', 'klinicheskoe ispytan', 'vakcin'], weight: 4 },
      { keywords: ['genetik', 'dnk', 'rnk', 'genom', 'molekulyarn'], weight: 4 },
      { keywords: ['biolog', 'mikrobiolog', 'virusolog', 'epidemiolog'], weight: 3 },
      // Physical sciences - Latin
      { keywords: ['fizik', 'kvantov', 'termoyadern', 'kollayder'], weight: 4 },
      { keywords: ['khimik', 'khimichesk reakc', 'sintez'], weight: 3 },
      // Institutions - Latin
      { keywords: ['rossiyskaya akademiya nauk', 'akademiya nauk'], weight: 4 },
      { keywords: ['nauchnyy institut', 'issledovatelskiy centr'], weight: 3 },
      // Innovation - Latin
      { keywords: ['izobret', 'patent'], weight: 2 },
      { keywords: ['nauchn razrabotk', 'nauchn otkryt'], weight: 3 },
      // Climate - Latin
      { keywords: ['klimatolog', 'globalnoye poteplen', 'parnikov'], weight: 3 },
    ],
    // Expanded negative keywords to exclude books, literature, culture, publishing
    negative: [
      // Sports
      'спорт', 'sport',
      // Politics
      'политик', 'politik',
      // Books and literature (key exclusion for the reported issue)
      'книг', 'knig', 'книжн', 'knizhn',
      'литератур', 'literatur', 'писател', 'pisatel',
      'роман', 'roman', 'повест', 'povest', 'рассказ', 'rasskaz',
      'издательств', 'izdatelstv', 'издан', 'izdan',
      'библиотек', 'bibliotek', 'читател', 'chitatel',
      'поэт', 'poet', 'поэзи', 'poezi', 'стих', 'stikh',
      'премия литератур', 'premiya literatur',
      // Culture and arts
      'театр', 'teatr', 'музей', 'muzey', 'выставк', 'vystavk',
      'галере', 'galere', 'концерт', 'koncert', 'фестивал', 'festival',
      'кино', 'kino', 'фильм', 'film', 'режиссер', 'rezhisser',
      'актер', 'akter', 'актрис', 'aktris',
      'искусств', 'iskusstv', 'художник', 'khudozhnik',
      // Education (non-research)
      'школ', 'shkol', 'ученик', 'uchenik', 'учител', 'uchitel',
      'егэ', 'ege', 'экзамен', 'ekzamen',
    ],
    requiredScore: 4,  // Raised threshold to require stronger signals
  },
  technology: {
    positive: [
      // Cyrillic
      { keywords: ['технолог', 'технологическ', 'высокотехнологичн'], weight: 4 },
      { keywords: ['интернет', 'онлайн', 'цифров'], weight: 3 },
      { keywords: ['компьютер', 'программ', 'софт', 'приложен'], weight: 3 },
      { keywords: ['искусствен интеллект', 'нейросет', 'машинн обучен'], weight: 3 },
      { keywords: ['робот', 'автоматизац', 'дрон', 'беспилотн'], weight: 3 },
      { keywords: ['смартфон', 'гаджет', 'устройств'], weight: 2 },
      { keywords: ['связь', '5g', 'телеком'], weight: 2 },
      // Cybersecurity
      { keywords: ['кибербезопасност', 'хакер', 'взлом', 'утечк данн', 'шифрован'], weight: 4 },
      { keywords: ['кибератак', 'фишинг', 'вирус', 'вредоносн'], weight: 3 },
      // Crypto/Blockchain
      { keywords: ['криптовалют', 'блокчейн', 'nft', 'майнинг', 'токен'], weight: 3 },
      // IoT/Smart devices
      { keywords: ['интернет вещей', 'умный дом', 'носимы устройств'], weight: 3 },
      // Cloud/Infrastructure
      { keywords: ['облачн', 'серверн', 'дата-центр'], weight: 2 },
      // Startups
      { keywords: ['стартап', 'техногигант', 'сколково', 'иннополис'], weight: 3 },
      // Latin transliterations (removed short keywords like 'it', 'ii', 'set' that match too broadly)
      { keywords: ['tekhnolog', 'tekhnologichesk', 'vysokotekhnologichn'], weight: 4 },
      { keywords: ['internet', 'onlayn', 'cifrov', 'whatsapp', 'telegram', 'vkontakte'], weight: 3 },
      { keywords: ['kompyuter', 'programm', 'soft', 'prilozhen'], weight: 3 },
      { keywords: ['iskusstven intellekt', 'neyroset', 'mashinny obuchen', 'chatgpt'], weight: 3 },
      { keywords: ['robot', 'avtomatizac', 'dron', 'bespilotn'], weight: 3 },
      { keywords: ['smartfon', 'gadzhet', 'ustroysstv', 'iphone', 'android'], weight: 2 },
      { keywords: ['svyaz', '5g', 'telekom', 'sboy'], weight: 2 },
      // Cybersecurity/crypto/IoT - Latin
      { keywords: ['kiberbezopasnost', 'haker', 'vzlom', 'utechk dann', 'shifrovan'], weight: 4 },
      { keywords: ['kiberatak', 'fishing', 'virus', 'vredonosn'], weight: 3 },
      { keywords: ['kriptovalyut', 'blokcheyn', 'nft', 'mayning', 'token'], weight: 3 },
      { keywords: ['internet veschey', 'umniy dom', 'nosimy ustroystva'], weight: 3 },
      { keywords: ['oblachn', 'serverny', 'data-centr'], weight: 2 },
      { keywords: ['startap', 'tekhnogigant', 'skolkovo', 'innopolis'], weight: 3 },
    ],
    negative: ['спорт', 'культур', 'sport', 'kultur'],
    requiredScore: 3,
  },
  military: {
    positive: [
      // Cyrillic (enhanced from RT/Smotrim agent analysis)
      { keywords: ['военн', 'армия', 'армейск', 'вооружен', 'оружи', 'оружей'], weight: 4 },
      { keywords: ['минобороны', 'министерство обороны', 'генштаб'], weight: 4 },
      { keywords: ['бпла', 'пво', 'уничтожи', 'бригад', 'himars'], weight: 4 },
      { keywords: ['солдат', 'офицер', 'генерал', 'военнослужащ', 'бойц'], weight: 3 },
      { keywords: ['танк', 'ракет', 'артиллер', 'авиац', 'флот', 'подводн'], weight: 3 },
      { keywords: ['сво', 'спецоперац', 'боев', 'фронт', 'наступлен', 'оборон'], weight: 4 },
      { keywords: ['всу', 'нато', 'украин', 'днр', 'лнр', 'донбасс', 'донецк', 'запорож', 'харьков', 'херсон'], weight: 4 },
      { keywords: ['штурм', 'освобожд', 'потер', 'взрыв', 'атак', 'контрол'], weight: 3 },
      { keywords: ['учения', 'маневр', 'полигон', 'войск', 'позици'], weight: 3 },
      { keywords: ['пехот', 'десант', 'морпех', 'спецназ', 'снайпер', 'диверсант'], weight: 3 },
      // Military history
      { keywords: ['великая отечественная', 'вторая мировая', 'победа 1945', 'ветеран вов'], weight: 3 },
      // Weapons technology
      { keywords: ['гиперзвук', 'с-400', 'с-500', 'искандер', 'калибр', 'кинжал'], weight: 4 },
      { keywords: ['авангард', 'сармат', 'посейдон', 'буревестник', 'циркон'], weight: 4 },
      // Veterans/Military service
      { keywords: ['ветеран боев', 'участник сво', 'комбатант', 'демобилизац'], weight: 3 },
      { keywords: ['военн училищ', 'военн академи', 'кадет', 'суворовец'], weight: 3 },
      // Latin transliterations (from 1tv agent)
      { keywords: ['voenn', 'armiya', 'armeysk', 'vooruzhen', 'oruzhi', 'oruzhey'], weight: 4 },
      { keywords: ['minoborony', 'ministerstvo oborony', 'genshtab'], weight: 4 },
      { keywords: ['bpla', 'pvo', 'unichtozhi', 'brigad', 'himars'], weight: 4 },
      { keywords: ['soldat', 'oficer', 'general', 'voennosluzhasch', 'boytsy'], weight: 3 },
      { keywords: ['tank', 'raket', 'artiller', 'aviac', 'flot', 'podvodn'], weight: 3 },
      { keywords: ['svo', 'specoperac', 'boev', 'front', 'nastuplen', 'oboron'], weight: 4 },
      { keywords: ['vsu', 'nato', 'ukrain', 'dnr', 'lnr', 'donbass', 'doneck', 'zaporozh', 'harkov', 'kherson'], weight: 4 },
      { keywords: ['shturm', 'osvobozh', 'poter', 'vzryv', 'atak', 'udar', 'kontrol'], weight: 3 },
      { keywords: ['ucheniya', 'manevr', 'poligon', 'voysk', 'pozici', 'peredovoy'], weight: 3 },
      { keywords: ['pekhot', 'desant', 'morpekh', 'specnaz', 'snayper', 'diversant'], weight: 3 },
      // History/weapons/veterans - Latin
      { keywords: ['velikaya otechestvennaya', 'vtoraya mirovaya', 'pobeda 1945', 'veteran vov'], weight: 3 },
      { keywords: ['giperzvuk', 's-400', 's-500', 'iskander', 'kalibr', 'kinzhal'], weight: 4 },
      { keywords: ['avangard', 'sarmat', 'poseydon', 'burevestnik', 'cirkon'], weight: 4 },
      { keywords: ['veteran boev', 'uchastnik svo', 'kombatant', 'demobilizac'], weight: 3 },
      { keywords: ['voenn uchilisch', 'voenn akademi', 'kadet', 'suvorovets'], weight: 3 },
    ],
    negative: [
      'спорт', 'культур', 'экономик', 'sport', 'kultur', 'ekonomik',
      // Domestic crime - NOT military
      'преступник', 'криминал', 'уголовн', 'мошенник', 'кража',
      'prestupnik', 'kriminal', 'ugolovn', 'moshennik', 'krazha',
      // Police/law enforcement (not military)
      'полиц', 'мвд', 'следствие', 'прокуратур', 'суд',
      'polic', 'mvd', 'sledstvie', 'prokuratur', 'sud',
      // Missing persons context
      'пропавш', 'пропал', 'исчез', 'найден тело',
      'propavsh', 'propal', 'ischez', 'nayden telo',
    ],
    requiredScore: 3,
  },
  weather: {
    positive: [
      // Cyrillic - using more specific terms to avoid false positives
      { keywords: ['погода', 'погодн', 'метео'], weight: 4 },
      { keywords: ['прогноз погоды', 'температур воздух', 'градус мороз'], weight: 3 },
      { keywords: ['дожд', 'снегопад', 'ветер сильн', 'гроза', 'туман', 'облачн'], weight: 3 },
      { keywords: ['климат', 'потеплен', 'похолодан', 'заморозк'], weight: 3 },
      { keywords: ['гидрометцентр', 'синоптик', 'росгидромет'], weight: 4 },
      { keywords: ['ураган', 'шторм', 'наводнен', 'засух'], weight: 3 },
      // Climate change
      { keywords: ['глобальн потеплен', 'парников эффект', 'углеродн след', 'выбросы co2'], weight: 4 },
      // Extreme weather
      { keywords: ['экстремальн погод', 'стихийн бедств', 'чрезвычайн ситуац'], weight: 3 },
      // Air quality
      { keywords: ['качество воздух', 'смог', 'загрязнен воздух', 'пыльца'], weight: 3 },
      // Seasonal phenomena
      { keywords: ['ледоход', 'половодье', 'паводок', 'оттепель'], weight: 3 },
      // MChS/EMERCOM emergency terms (high weight for disaster content)
      { keywords: ['мчс', 'спасател', 'спасательн'], weight: 4 },
      { keywords: ['пожар', 'возгоран', 'пожарн', 'огнеборц'], weight: 4 },
      { keywords: ['землетрясен', 'сейсмическ', 'афтершок'], weight: 4 },
      { keywords: ['эвакуац', 'эвакуирова'], weight: 3 },
      { keywords: ['чс', 'чрезвычайн', 'катастроф', 'бедстви'], weight: 4 },
      { keywords: ['оползень', 'сель', 'лавина', 'обвал'], weight: 3 },
      { keywords: ['затоплен', 'подтоплен', 'разлив'], weight: 3 },
      { keywords: ['лесной пожар', 'природный пожар', 'ландшафтный пожар'], weight: 4 },
      // Latin transliterations
      { keywords: ['pogoda', 'pogodn', 'meteo'], weight: 4 },
      { keywords: ['prognoz pogody', 'temperatur vozdukh', 'gradus moroz'], weight: 3 },
      { keywords: ['dozhd', 'snegopad', 'veter siln', 'groza', 'tuman', 'oblachn'], weight: 3 },
      { keywords: ['klimat', 'poteplen', 'pokholodan', 'zamorozk'], weight: 3 },
      { keywords: ['gidrometcentr', 'sinoptik', 'rosgidromet'], weight: 4 },
      { keywords: ['uragan', 'shtorm', 'navodnin', 'zasukh', 'ekstremalnye moroz'], weight: 3 },
      // Climate/extreme/air - Latin
      { keywords: ['globaln poteplen', 'parnikov effekt', 'uglerodny sled', 'vybrosy co2'], weight: 4 },
      { keywords: ['ekstremalny pogoda', 'stikhiyn bedstviye', 'chrezvychayn situac'], weight: 3 },
      { keywords: ['kachestvo vozdukh', 'smog', 'zagryaznen vozdukh', 'pylca'], weight: 3 },
      { keywords: ['ledokhod', 'polovodye', 'pavodok', 'ottepel'], weight: 3 },
      // MChS/emergency - Latin
      { keywords: ['mchs', 'spasatel', 'spasatelny'], weight: 4 },
      { keywords: ['pozhar', 'vozgoran', 'pozharn', 'ogneborec'], weight: 4 },
      { keywords: ['zemletryasen', 'seismichesk', 'aftershok'], weight: 4 },
      { keywords: ['evakuac', 'evakuirova'], weight: 3 },
      { keywords: ['chs', 'chrezvychayn', 'katastrofa', 'bedstvi'], weight: 4 },
      { keywords: ['opolzen', 'sel', 'lavina', 'obval'], weight: 3 },
      { keywords: ['zatoplen', 'podtoplen', 'razliv'], weight: 3 },
      { keywords: ['lesnoy pozhar', 'prirodny pozhar', 'landshaftny pozhar'], weight: 4 },
    ],
    // Exclude New Year characters that contain weather-related roots
    negative: ['политик', 'экономик', 'спорт', 'politik', 'ekonomik', 'sport',
               'дед мороз', 'снегурочк', 'ded moroz', 'snegurochk', 'morozy i sneg'],
    requiredScore: 3,
  },
  tourism: {
    positive: [
      // Cyrillic - Core tourism terms (high weight)
      { keywords: ['туризм', 'турист', 'туристическ', 'туристск'], weight: 4 },
      { keywords: ['тур', 'туроператор', 'турагент', 'турпоезд', 'турпакет', 'турпутёвк'], weight: 4 },
      // Cyrillic - Travel and vacation (good weight)
      { keywords: ['путешеств', 'путёвк', 'путевк'], weight: 3 },
      { keywords: ['отдых', 'отдыхающ', 'отпуск', 'каникул'], weight: 3 },
      { keywords: ['курорт', 'санатор', 'пляж', 'горнолыжн'], weight: 3 },
      // Cyrillic - Accommodation (increased weight)
      { keywords: ['отель', 'гостиниц', 'гостевой дом', 'хостел'], weight: 3 },
      { keywords: ['бронирован', 'размещен', 'заселен', 'номер в отел'], weight: 3 },
      // Cyrillic - Excursions and attractions
      { keywords: ['экскурс', 'экскурси', 'достопримечател'], weight: 3 },
      // Cyrillic - Travel documents and transport
      { keywords: ['виза', 'загранпаспорт', 'авиабилет', 'чартер'], weight: 3 },
      // Cyrillic - Popular destinations (boost detection)
      { keywords: ['сочи', 'крым', 'анапа', 'геленджик', 'алтай', 'байкал', 'камчатк'], weight: 3 },
      { keywords: ['турция', 'египет', 'таиланд', 'мальдив', 'дубай', 'анталь'], weight: 3 },
      // Adventure tourism
      { keywords: ['экстремальн туризм', 'восхожден', 'альпинизм', 'дайвинг', 'рафтинг'], weight: 3 },
      // Eco-tourism
      { keywords: ['экотуризм', 'заповедник', 'национальн парк', 'агротуризм'], weight: 3 },
      // Medical/wellness tourism
      { keywords: ['лечебн туризм', 'санаторн', 'оздоровительн', 'спа-курорт'], weight: 3 },
      // Cruise/Transport
      { keywords: ['круиз', 'лайнер', 'теплоход', 'авиаперелет'], weight: 3 },
      // Travel surveys/trends (HIGH WEIGHT - very specific patterns)
      { keywords: ['куда поехать', 'куда поедут', 'куда россияне'], weight: 5 },
      { keywords: ['популярные город', 'популярные направлен', 'топ направлен'], weight: 5 },
      { keywords: ['россияне поедут', 'россияне выбира', 'россияне предпочита'], weight: 5 },
      { keywords: ['направлени для отдых', 'место для отдых'], weight: 4 },
      { keywords: ['выходные провести', 'праздники провести', 'праздничные дни'], weight: 3 },
      { keywords: ['23 феврал', '8 марта', 'майские праздник', 'новогодние каникул'], weight: 3 },
      { keywords: ['внутренний туризм', 'выездной туризм', 'въездной туризм'], weight: 4 },
      { keywords: ['турпоток', 'туристический поток', 'поток турист'], weight: 4 },
      // Latin transliterations - Core terms
      { keywords: ['turizm', 'turist', 'turistichesk', 'turistsk'], weight: 4 },
      { keywords: ['tur', 'turoperator', 'turagent', 'turpoezd', 'turpaket'], weight: 4 },
      // Latin transliterations - Travel and vacation
      { keywords: ['puteshestv', 'putevk', 'putyovk'], weight: 3 },
      { keywords: ['otdykh', 'otdykhayusch', 'otpusk', 'kanikul'], weight: 3 },
      { keywords: ['kurort', 'sanator', 'plyazh', 'gornolyzhyn'], weight: 3 },
      // Latin transliterations - Accommodation
      { keywords: ['otel', 'gostinic', 'gostevoy dom', 'khostel'], weight: 3 },
      { keywords: ['bronirovan', 'razmeschen', 'zaselen', 'nomer v otel'], weight: 3 },
      // Latin transliterations - Excursions
      { keywords: ['ekskurs', 'ekskursi', 'dostoprimechatel'], weight: 3 },
      // Latin transliterations - Documents and transport
      { keywords: ['viza', 'zagranpasport', 'aviabilet', 'charter'], weight: 3 },
      // Latin transliterations - Destinations
      { keywords: ['sochi', 'krym', 'anapa', 'gelendzhik', 'altay', 'baykal', 'kamchatk'], weight: 3 },
      { keywords: ['turciya', 'egipet', 'tailand', 'maldiv', 'dubay', 'antal'], weight: 3 },
      // Adventure/eco/medical/cruise - Latin
      { keywords: ['ekstremalny turizm', 'voskhozden', 'alpinizm', 'dayving', 'rafting'], weight: 3 },
      { keywords: ['ekoturizm', 'zapovednik', 'nacionalny park', 'agroturizm'], weight: 3 },
      { keywords: ['lechebn turizm', 'sanatorn', 'ozdoroviteln', 'spa-kurort'], weight: 3 },
      { keywords: ['kruiz', 'layner', 'teplokhod', 'aviaperelyet'], weight: 3 },
      // Travel surveys/trends - Latin
      { keywords: ['kuda poekhat', 'kuda poedut', 'kuda rossiyane'], weight: 5 },
      { keywords: ['populyarnye gorod', 'populyarnye napravlen', 'top napravlen'], weight: 5 },
      { keywords: ['rossiyane poedut', 'rossiyane vybirayut', 'rossiyane predpochitayut'], weight: 5 },
      { keywords: ['napravleni dlya otdykh', 'mesto dlya otdykh'], weight: 4 },
      { keywords: ['vykhodnye provesti', 'prazdniki provesti'], weight: 3 },
      { keywords: ['vnutrenniy turizm', 'vyezdnoy turizm', 'vezdnoy turizm'], weight: 4 },
      { keywords: ['turpotok', 'turisticheskiy potok', 'potok turist'], weight: 4 },
    ],
    // Reduced negative keywords - tourism news often mentions economy/politics tangentially
    negative: ['военн', 'армия', 'сво', 'всу', 'voenn', 'armiya', 'svo', 'vsu'],
    requiredScore: 3,
  },
};

// ============================================================================
// ENHANCED CATEGORY INFERENCE WITH WORD BOUNDARY MATCHING
// ============================================================================

// Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tokenize text into words (works with Cyrillic and Latin)
function tokenizeText(text) {
  // Match sequences of letters (Cyrillic \u0400-\u04FF or Latin a-zA-Z)
  return (text.toLowerCase().match(/[\u0400-\u04FF]+|[a-zA-Z]+/g) || []);
}

// Create word boundary regex for Russian (both Cyrillic and Latin)
// Uses PREFIX matching: "shkol" matches "shkolnyy", "shkolnik", etc.
// This is essential for Russian where words have many forms (cases, declensions)
function wordBoundaryMatch(text, word) {
  // For multi-word phrases, use includes (phrase matching)
  if (word.includes(' ')) {
    return text.includes(word);
  }
  // For single words, use PREFIX matching (word at start of a token)
  // This allows "shkol" to match "shkolnyy", "shkolnik", etc.
  try {
    const pattern = new RegExp(
      `(?<![\\u0400-\\u04FFa-zA-Z])${escapeRegex(word)}`,
      'i'
    );
    return pattern.test(text);
  } catch (e) {
    // Fallback: check if any token starts with the keyword
    const tokens = tokenizeText(text);
    const lowerWord = word.toLowerCase();
    return tokens.some(token => token.startsWith(lowerWord));
  }
}

// Disambiguation rules for problematic keywords
// These patterns, when matched, adjust the score for a category
const DISAMBIGUATION_RULES = {
  sports: [
    // "Ледниковый период" + show context = Ice skating TV show (sports)
    { pattern: /ледниковый\s+период[\s\S]{0,30}(шоу|выпуск|канал|сезон|эфир|участник|звёзд)/gi, adjust: +10 },
    { pattern: /(шоу|выпуск|канал|сезон|эфир)[\s\S]{0,30}ледниковый\s+период/gi, adjust: +10 },
    // "Ледниковый период" alone could be Ice Age (geological) - reduce sports score
    { pattern: /ледниковый\s+период(?![\s\S]{0,30}(шоу|выпуск|канал|сезон|эфир|участник))/gi, adjust: -5 },
    // "futbolka/futbolke/futbolku" = t-shirt, NOT football
    { pattern: /futbolk[aeiuoy]/gi, adjust: -15 },
    { pattern: /футболк[аеиоуюя]/gi, adjust: -15 },
    // "v futbolke" = in a t-shirt
    { pattern: /v\s+futbolk/gi, adjust: -15 },
    { pattern: /в\s+футболк/gi, adjust: -15 },
    // "sim boks" = SIM box fraud, NOT boxing
    { pattern: /sim[\s\-_]*boks/gi, adjust: -15 },
    { pattern: /сим[\s\-_]*бокс/gi, adjust: -15 },
    // "goloda/golod" = hunger, NOT goal
    { pattern: /golod[auy]?(?![a-z])/gi, adjust: -10 },
    { pattern: /голод[ау|ом|е]?(?![а-я])/gi, adjust: -10 },
  ],
  culture: [
    // "operator/operatsiya" = operator/operation, NOT opera
    { pattern: /operat[oeiu]/gi, adjust: -15 },
    { pattern: /операт[ое|ор|ив]/gi, adjust: -15 },
    { pattern: /operac[iy]/gi, adjust: -15 },
    { pattern: /операц[ия|ии|ию]/gi, adjust: -15 },
  ],
  weather: [
    // "Ded Moroz/Snegurochka" = Santa/Snow Maiden, NOT weather
    { pattern: /ded[\s\-_]*moroz/gi, adjust: -15 },
    { pattern: /дед[\s\-_]*мороз/gi, adjust: -15 },
    { pattern: /snegurochk/gi, adjust: -15 },
    { pattern: /снегурочк/gi, adjust: -15 },
    // "ugroza" = threat, NOT "groza" (thunderstorm)
    { pattern: /ugroz[auy]/gi, adjust: -10 },
    { pattern: /угроз[ау|ой|ы]/gi, adjust: -10 },
  ],
  military: [
    // "veteran" contains "veter" (wind) but is military
    { pattern: /veteran/gi, adjust: +5 },
    { pattern: /ветеран/gi, adjust: +5 },

    // "desant" (landing/paratroopers) in holiday/festive contexts is NOT military
    // e.g., "десант Дедов Морозов" = Santa Claus arrival at hospital
    { pattern: /десант[а-яё]*[\s\S]{0,20}(дед[а-яё]*\s*мороз|снегурочк|праздник|подарк|новогодн|рождеств|елк[аи])/gi, adjust: -20 },
    { pattern: /desant[a-z]*[\s\S]{0,20}(ded[a-z]*\s*moroz|snegurochk|prazdnik|podark|novogod|rozhdestvn|elka)/gi, adjust: -20 },
    { pattern: /(дед[а-яё]*\s*мороз|снегурочк|праздник|подарк|новогодн|рождеств)[\s\S]{0,20}десант/gi, adjust: -20 },
    { pattern: /(ded[a-z]*\s*moroz|snegurochk|prazdnik|podark|novogod|rozhdestvn)[\s\S]{0,20}desant/gi, adjust: -20 },

    // "desant" in hospital/children context is likely charity, not military
    { pattern: /десант[а-яё]*[\s\S]{0,20}(больниц|госпитал|дет[а-яё]*|ребенок|ребят|пациент)/gi, adjust: -15 },
    { pattern: /desant[a-z]*[\s\S]{0,20}(bolnic|gospital|det[a-z]*|rebenok|rebyat|pacient)/gi, adjust: -15 },
    { pattern: /(больниц|госпитал)[а-яё]*[\s\S]{0,20}десант/gi, adjust: -15 },

    // === DOMESTIC CRIME - NOT MILITARY ===
    // School attacks/shootings - crime news, not military operations
    { pattern: /нападен[а-яё]*[\s\S]{0,20}(школ|лице|гимназ|колледж|университет)/gi, adjust: -25 },
    { pattern: /napaden[a-z]*[\s\S]{0,20}(shkol|lice|gimnaz|kolledzh|universitet)/gi, adjust: -25 },
    { pattern: /(школ|лице|гимназ)[а-яё]*[\s\S]{0,20}(нападен|стрельб|стрелок)/gi, adjust: -25 },
    { pattern: /(shkol|lice|gimnaz)[a-z]*[\s\S]{0,20}(napaden|strelb|strelok)/gi, adjust: -25 },

    // Missing persons / bodies found - crime news
    { pattern: /тело[\s\S]{0,15}(пропавш|найден|обнаружен)/gi, adjust: -25 },
    { pattern: /telo[\s\S]{0,15}(propavsh|nayden|obnaruzhen)/gi, adjust: -25 },
    { pattern: /(пропал|пропавш|исчез)[а-яё]*[\s\S]{0,20}(ребенок|мальчик|девочк|подросток|человек)/gi, adjust: -25 },
    { pattern: /(propal|propavsh|ischez)[a-z]*[\s\S]{0,20}(rebenok|malchik|devochk|podrostok|chelovek)/gi, adjust: -25 },

    // Murder in civilian context (no military keywords nearby)
    { pattern: /убийств[а-яё]*[\s\S]{0,30}(семь|женщин|ребенк|супруг|сосед|знаком|квартир|дом[еуа])/gi, adjust: -20 },
    { pattern: /ubiystvo[a-z]*[\s\S]{0,30}(semya|zhenschin|rebenk|suprug|sosed|znakom|kvartir|dom[eua])/gi, adjust: -20 },

    // Crime terms that should reduce military score
    { pattern: /(преступлен|преступник|криминал|уголовн)[а-яё]*/gi, adjust: -15 },
    { pattern: /(prestuplen|prestupnik|kriminal|ugolovn)[a-z]*/gi, adjust: -15 },
    { pattern: /(задержан|арестован|подозрева|обвиняем)[а-яё]*/gi, adjust: -10 },
    { pattern: /(zaderzhan|arestovan|podozreva|obvinyaem)[a-z]*/gi, adjust: -10 },

    // Police/law enforcement context (not military)
    { pattern: /(полиц|мвд|следствие|следователь|прокуратур)[а-яё]*/gi, adjust: -15 },
    { pattern: /(polic|mvd|sledstvie|sledovatel|prokuratur)[a-z]*/gi, adjust: -15 },

    // Boost for ACTUAL military context (to compensate for crime penalties when military is present)
    { pattern: /(сво|всу|минобороны|генштаб|донецк|харьков|запорож|херсон|днр|лнр)/gi, adjust: +10 },
    { pattern: /(svo|vsu|minoborony|genshtab|doneck|kharkov|zaporozh|kherson|dnr|lnr)/gi, adjust: +10 },
  ],
  education: [
    // "vypusk novostey" = news broadcast, NOT graduation
    { pattern: /vypusk.*novost/gi, adjust: -15 },
    { pattern: /выпуск.*новост/gi, adjust: -15 },
    // TV program mentions
    { pattern: /programm.*perv/gi, adjust: -10 },
    { pattern: /программ.*перв/gi, adjust: -10 },
    // "Вести. Эфир" / "Vesti" news broadcasts - NOT education even if they mention students day
    { pattern: /вести\.\s*эфир/gi, adjust: -20 },
    { pattern: /vesti\.\s*efir/gi, adjust: -20 },
    { pattern: /вести\s+в\s+\d/gi, adjust: -15 },  // "Вести в 20:00" etc.

    // SCHOOL BUS / TRANSPORT accidents - "school" + transport/accident terms
    { pattern: /школьн[ыа-я]*\s*(автобус|транспорт|машин|авто)/gi, adjust: -20 },
    { pattern: /shkoln[a-z]*\s*(avtobus|transport|mashin|avto)/gi, adjust: -20 },
    { pattern: /(автобус|транспорт)[а-яё]*\s*(со\s+)?школьник/gi, adjust: -20 },
    { pattern: /(avtobus|transport)[a-z]*\s*(so\s+)?shkolnik/gi, adjust: -20 },

    // School + accident/crash/incident context
    { pattern: /школ[а-яё]*[\s\S]{0,30}(авари|дтп|столкн|перевернул|съехал)/gi, adjust: -20 },
    { pattern: /shkol[a-z]*[\s\S]{0,30}(avari|dtp|stolkn|perevernul|syekhal)/gi, adjust: -20 },
    { pattern: /(авари|дтп|столкн)[\s\S]{0,30}школ[а-яё]*/gi, adjust: -20 },
    { pattern: /(avari|dtp|stolkn)[\s\S]{0,30}shkol[a-z]*/gi, adjust: -20 },

    // School + fire/emergency context
    { pattern: /школ[а-яё]*[\s\S]{0,30}(пожар|возгоран|эвакуац|горел|загорел)/gi, adjust: -20 },
    { pattern: /shkol[a-z]*[\s\S]{0,30}(pozhar|vozgoran|evakuac|gorel|zagorel)/gi, adjust: -20 },
    { pattern: /(пожар|возгоран)[\s\S]{0,30}школ[а-яё]*/gi, adjust: -20 },
    { pattern: /(pozhar|vozgoran)[\s\S]{0,30}shkol[a-z]*/gi, adjust: -20 },

    // School + crime/violence context
    { pattern: /школ[а-яё]*[\s\S]{0,30}(нападен|стрельб|убийств|ранен|пострадал)/gi, adjust: -20 },
    { pattern: /shkol[a-z]*[\s\S]{0,30}(napaden|strelb|ubiystvo|ranen|postradal)/gi, adjust: -20 },

    // Student injured/killed - news about accidents, not education
    { pattern: /(школьник|ученик|ученица)[а-яё]*[\s\S]{0,20}(погиб|ранен|пострадал|госпитализ)/gi, adjust: -20 },
    { pattern: /(shkolnik|uchenik|uchenica)[a-z]*[\s\S]{0,20}(pogib|ranen|postradal|gospitaliz)/gi, adjust: -20 },

    // Boost for actual education content - curriculum, reform, teaching
    { pattern: /(образовательн|учебн)[а-яё]*\s*(програм|реформ|стандарт|план)/gi, adjust: +8 },
    { pattern: /(obrazovateln|uchebn)[a-z]*\s*(program|reform|standart|plan)/gi, adjust: +8 },
    { pattern: /(министерств|минобр)[а-яё]*\s*(образован|просвещен)/gi, adjust: +10 },
    { pattern: /ege|егэ|огэ|oge/gi, adjust: +8 },
  ],
  politics: [
    // Boost when clear government terms present
    { pattern: /gosduma|госдума/gi, adjust: +5 },
    { pattern: /sovet\s*federacii|совет\s*федерации/gi, adjust: +5 },
  ],
  science: [
    // BOOKS/LITERATURE - "открытие" can mean book launch, "выход книги" context
    { pattern: /(откры[лтв][а-яё]*|выход[а-яё]*|выше[лш][а-яё]*|презентаци[а-яё]*)[\s\S]{0,20}(книг[а-яё]*|роман[а-яё]*|повест[а-яё]*)/gi, adjust: -20 },
    { pattern: /(otkry[ltv][a-z]*|vykhod[a-z]*|vyshe[lsh][a-z]*|prezentaci[a-z]*)[\s\S]{0,20}(knig[a-z]*|roman[a-z]*|povest[a-z]*)/gi, adjust: -20 },
    // Book/literary awards - "награда", "премия" + book context
    { pattern: /(премия|награ[дж][а-яё]*|лауреат[а-яё]*)[\s\S]{0,20}(книг[а-яё]*|литератур[а-яё]*|писател[а-яё]*)/gi, adjust: -20 },
    { pattern: /(premiya|nagra[dzh][a-z]*|laureat[a-z]*)[\s\S]{0,20}(knig[a-z]*|literatur[a-z]*|pisatel[a-z]*)/gi, adjust: -20 },
    // Publishing context - "издательство", "издание", "тираж"
    { pattern: /(издательств[а-яё]*|издани[а-яё]*|тираж[а-яё]*|публикаци[а-яё]*)[\s\S]{0,20}(книг[а-яё]*|роман[а-яё]*)/gi, adjust: -20 },
    { pattern: /(izdatelstv[a-z]*|izdani[a-z]*|tirazh[a-z]*|publikaci[a-z]*)[\s\S]{0,20}(knig[a-z]*|roman[a-z]*)/gi, adjust: -20 },
    // Reading/library context - NOT science
    { pattern: /(чита[тле][а-яё]*|библиотек[а-яё]*)[\s\S]{0,20}(книг[а-яё]*|роман[а-яё]*)/gi, adjust: -15 },
    { pattern: /(chita[tl][a-z]*|bibliotek[a-z]*)[\s\S]{0,20}(knig[a-z]*|roman[a-z]*)/gi, adjust: -15 },
    // "открытие выставки" = exhibition opening, NOT scientific discovery
    { pattern: /откры[лтв][а-яё]*[\s\S]{0,15}выставк[а-яё]*/gi, adjust: -15 },
    { pattern: /otkry[ltv][a-z]*[\s\S]{0,15}vystavk[a-z]*/gi, adjust: -15 },
    // Academy of Arts, not Academy of Sciences
    { pattern: /академи[а-яё]*[\s\S]{0,10}(искусств|художеств|музык|театр)/gi, adjust: -15 },
    { pattern: /akademi[a-z]*[\s\S]{0,10}(iskusstv|khudozhestv|muzyk|teatr)/gi, adjust: -15 },
    // Literary institute context
    { pattern: /институт[а-яё]*[\s\S]{0,10}(литератур|культур|искусств)/gi, adjust: -15 },
    { pattern: /institut[a-z]*[\s\S]{0,10}(literatur|kultur|iskusstv)/gi, adjust: -15 },
    // Boost for clear scientific context
    { pattern: /(научн[а-яё]*|ученые?)\s*(открыт|исследован|эксперимент|лаборатор)/gi, adjust: +10 },
    { pattern: /(nauchn[a-z]*|ucheny[a-z]*)\s*(otkryt|issledovan|eksperiment|laborator)/gi, adjust: +10 },
    // Boost for space science
    { pattern: /(космос|роскосмос|мкс|космонавт|орбит)[а-яё]*/gi, adjust: +8 },
    { pattern: /(kosmos|roskosmos|mks|kosmonavt|orbit)[a-z]*/gi, adjust: +8 },
    // Boost for medical research
    { pattern: /(клиническ[а-яё]*|медицинск[а-яё]*)\s*(исследован|испытан|эксперимент)/gi, adjust: +10 },
    { pattern: /(klinichesk[a-z]*|medicinskoe)\s*(issledovan|ispytan|eksperiment)/gi, adjust: +10 },
  ],
};

// Apply disambiguation rules to adjust score
function getDisambiguationAdjustment(text, category) {
  const rules = DISAMBIGUATION_RULES[category] || [];
  let adjustment = 0;

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      adjustment += rule.adjust;
    }
    // Reset lastIndex for global regex
    rule.pattern.lastIndex = 0;
  }

  return adjustment;
}

// Infer category with weighted scoring, word boundaries, and disambiguation
function inferCategory(text, url) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  const lowerUrl = (url || '').toLowerCase();

  // PRIORITY 1: URL-based category detection (most reliable - sites pre-categorize content)
  const URL_CATEGORY_MAP = {
    '/ekonomika/': 'economy', '/economy/': 'economy', '/business/': 'economy',
    '/politika/': 'politics', '/politics/': 'politics',
    '/sport/': 'sports', '/sports/': 'sports',
    '/kultura/': 'culture', '/culture/': 'culture',
    '/v-mire/': 'world', '/world/': 'world', '/mir/': 'world',
    '/obschestvo/': 'society', '/society/': 'society',
    '/nauka/': 'science', '/science/': 'science', '/tech/': 'technology',
    '/obrazovanie/': 'education', '/education/': 'education',
    '/armiya/': 'military', '/military/': 'military', '/voennye/': 'military',
  };

  for (const [urlPattern, category] of Object.entries(URL_CATEGORY_MAP)) {
    if (lowerUrl.includes(urlPattern)) {
      return category; // Definitive match from URL
    }
  }

  const scores = {};

  for (const [category, config] of Object.entries(CATEGORY_DETECTION)) {
    let score = 0;
    let hasNegative = false;

    // Check negative keywords first (with word boundary matching)
    for (const negPhrase of config.negative || []) {
      if (wordBoundaryMatch(lowerText, negPhrase.toLowerCase())) {
        hasNegative = true;
        break;
      }
    }

    // Score positive keywords (only count once per group, with word boundaries)
    for (const group of config.positive) {
      for (const keyword of group.keywords) {
        if (wordBoundaryMatch(lowerText, keyword)) {
          score += group.weight;
          break; // Only count once per keyword group
        }
      }
    }

    // Apply disambiguation rules
    score += getDisambiguationAdjustment(lowerText, category);

    // Bonus for URL pattern match
    if (lowerUrl.includes(`/${category}/`) || lowerUrl.includes(`/${category}.`) ||
        lowerUrl.includes(`-${category}-`) || lowerUrl.includes(`_${category}_`)) {
      score += 5;
    }

    // Apply negative penalty
    if (hasNegative) {
      score = Math.floor(score * 0.3); // Reduce to 30% if negative keyword found
    }

    if (score >= config.requiredScore) {
      scores[category] = score;
    }
  }

  // Find best match
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    return sorted[0][0];
  }

  return null;
}

// ============================================================================
// CONTENT TYPE DETECTION (news/interview/documentary/speech)
// ============================================================================

const CONTENT_TYPE_INDICATORS = {
  news: {
    keywords: [
      'новости', 'новость', 'сводка', 'выпуск', 'срочно', 'breaking', 'вести', 'время',
      'novosti', 'novost', 'svodka', 'vypusk', 'srochno', 'vesti', 'vremya',
      'хроника дня', 'главное', 'итоги дня', 'обзор',
      'khronika dnya', 'glavnoe', 'itogi dnya', 'obzor',
    ],
    urlPatterns: ['/news/', '/novosti/', '/bulletin/', '/vremya/', '/glavnoe/', '/itogi/'],
    programs: ['время', 'вести', 'новости', 'сегодня', 'известия', 'пятый канал', 'мир 24'],
    maxDuration: 300,
  },
  interview: {
    keywords: [
      'интервью', 'беседа', 'гость', 'разговор', 'эксклюзив', 'откровенн',
      'intervyu', 'beseda', 'gost', 'razgovor', 'eksklyuziv', 'otkrovenn',
      'диалог', 'встреча с', 'лицом к лицу', 'без купюр', 'прямой эфир с',
      'dialog', 'vstrecha s', 'licom k licu', 'bez kupyur', 'pryamoy efir s',
    ],
    urlPatterns: ['/interview/', '/talk/', '/интервью/', '/guest/', '/dialog/', '/vstrecha/'],
    programs: ['познер', 'интервью', 'гость в студии', 'один на один', 'вечер', 'соловьев', 'право знать', 'бесогон'],
    minDuration: 300,
  },
  documentary: {
    keywords: [
      'документальн', 'фильм', 'расследован', 'история', 'хроник', 'архив',
      'dokumentaln', 'film', 'rassledovan', 'istoriya', 'khronik', 'arkhiv',
      'спецпроект', 'специальный проект', 'историческ', 'ретроспектива',
      'specproekt', 'specialnyy proekt', 'istorichesk', 'retrospektiva',
    ],
    urlPatterns: ['/doc/', '/film/', '/documentary/', '/фильм/', '/special/', '/proekt/'],
    programs: ['документальн', 'история', 'расследование', 'специальный репортаж', 'военная приемка', 'авторская программа'],
    minDuration: 600,
  },
  reportage: {
    keywords: [
      'репортаж', 'корреспондент', 'прямое включен', 'с места событий', 'наш корр',
      'reportazh', 'korrespondent', 'pryamoe vklyuchen', 's mesta sobytiy', 'nash korr',
      'специальный корреспондент', 'сюжет', 'материал из', 'съемочная группа',
      'specialnyy korrespondent', 'syuzhet', 'material iz', 'syomochnaya gruppa',
    ],
    urlPatterns: ['/reportage/', '/report/', '/репортаж/', '/correspondent/', '/syuzhet/'],
    programs: ['специальный корреспондент', 'репортаж', 'сюжет дня', 'место событий'],
    durationRange: [120, 600],
  },
  speech: {
    keywords: [
      'обращени', 'выступлени', 'заявлени', 'речь', 'послание', 'пресс-конференц',
      'obrashcheni', 'vystupleni', 'zayavleni', 'rech', 'poslanie', 'press-konferenc',
      'брифинг', 'совещание', 'заседание', 'официальное заявление',
      'brifing', 'soveshchanie', 'zasedanie', 'oficialnoe zayavlenie',
    ],
    urlPatterns: ['/speech/', '/address/', '/statement/', '/обращение/', '/briefing/', '/zasedanie/'],
    programs: ['послание президента', 'прямая линия', 'большая пресс-конференция'],
    officialIndicators: ['президент', 'путин', 'министр', 'премьер', 'глава', 'мид', 'лавров', 'песков', 'захарова'],
  },
};

function detectContentType(metadata) {
  const { title, description, url, program, duration } = metadata;
  const text = `${title || ''} ${description || ''} ${program || ''}`.toLowerCase();
  const lowerUrl = (url || '').toLowerCase();

  const scores = {};

  for (const [type, config] of Object.entries(CONTENT_TYPE_INDICATORS)) {
    let score = 0;

    // Keyword matching
    for (const keyword of config.keywords) {
      if (text.includes(keyword)) {
        score += 2;
      }
    }

    // URL pattern matching
    for (const pattern of config.urlPatterns) {
      if (lowerUrl.includes(pattern)) {
        score += 4;
      }
    }

    // Program matching
    for (const prog of config.programs) {
      if (text.includes(prog.toLowerCase())) {
        score += 3;
      }
    }

    // Duration constraints
    if (duration) {
      if (config.maxDuration && duration <= config.maxDuration) score += 1;
      if (config.minDuration && duration >= config.minDuration) score += 2;
      if (config.durationRange && duration >= config.durationRange[0] && duration <= config.durationRange[1]) score += 2;
    }

    // Speech-specific: check for official indicators
    if (type === 'speech' && config.officialIndicators) {
      for (const indicator of config.officialIndicators) {
        if (text.includes(indicator)) {
          score += 2;
        }
      }
    }

    if (score > 0) {
      scores[type] = score;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && sorted[0][1] >= 3) {
    return sorted[0][0];
  }

  return 'news'; // Default to news
}

// ============================================================================
// PEDAGOGICAL LEVEL DETECTION (beginner/intermediate/advanced)
// ============================================================================

// ============================================================================
// ILR-BASED PEDAGOGICAL LEVEL ASSESSMENT
// Based on Interagency Language Roundtable (ILR) Listening Skill Level Descriptions
// See: https://www.govtilr.org/Skills/Listening.htm
// ============================================================================

// ILR Level Mapping:
// - Beginner = ILR 0+ to 1 (Elementary): Basic needs, simple transactions, slow/clear speech
// - Intermediate = ILR 1+ to 2+ (Limited Working): Routine topics, main ideas, normal speech
// - Advanced = ILR 3+ (Professional): Technical, inferential, argumentative content

// ============================================================================
// FACTOR 1: VOCABULARY COMPLEXITY (per ILR vocabulary breadth requirements)
// ============================================================================

// ILR 3+ vocabulary: Low-frequency, abstract, technical, requires inference
// These terms indicate content requiring professional-level comprehension
const ILR_ADVANCED_VOCAB = [
  // Political/Legal discourse (requires understanding implications, not just facts)
  'законопроект', 'резолюц', 'ратификац', 'имплементац', 'санкцион',
  'конституцион', 'парламентск', 'законодательн', 'исполнительн', 'судебн',
  'импичмент', 'вотум', 'инаугурац', 'плебисцит', 'референдум',
  // Economic/Financial (technical vocabulary)
  'макроэкономич', 'инфляцион', 'дефляцион', 'девальвац', 'ревальвац',
  'монетарн', 'фискальн', 'эмисси', 'котировк', 'капитализац',
  'рецесси', 'стагнац', 'стагфляц', 'дефолт', 'реструктуризац',
  // Geopolitical/Diplomatic (requires cultural/political background)
  'геополитич', 'дипломатич', 'стратегич', 'гегемон', 'суверенитет',
  'международн', 'двусторонн', 'многосторонн', 'интеграцион', 'экспанси',
  'аннекси', 'денонсац', 'демаркац', 'экстрадиц',
  // Academic/Abstract (conceptual thinking required)
  'концептуальн', 'парадигм', 'методолог', 'эмпирическ', 'теоретическ',
  'дискурс', 'детерминирован', 'легитимност', 'идеолог', 'доктрин',
  'конвергенц', 'дивергенц', 'плюрализм', 'релятивизм',
  // Military/Strategic (specialized domain)
  'боеготовност', 'контрнаступлен', 'стратегическ', 'тактическ',
  'эскалац', 'деэскалац', 'демилитаризац', 'денацификац',
  // Latin transliterations
  'zakonoproekt', 'rezoluci', 'ratifikaci', 'implementaci', 'sankcio',
  'makroekonomich', 'geopolitich', 'diplomatich', 'strategich',
  'konceptualn', 'paradigm', 'metodolog', 'empirichesk', 'diskurs',
];

// ILR 1+ to 2 vocabulary: Mid-frequency, topic-specific but accessible
// Routine work matters, current events, general interest
const ILR_INTERMEDIATE_VOCAB = [
  // Current events vocabulary
  'происшеств', 'инцидент', 'авария', 'катастроф', 'чрезвычайн',
  'расследован', 'подозреваем', 'задержан', 'арестован', 'обвинен',
  // Social/civic topics
  'митинг', 'протест', 'демонстрац', 'забастовк', 'петиц',
  'законопроект', 'реформ', 'инициатив', 'программ',
  // Professional contexts
  'специалист', 'эксперт', 'аналитик', 'представитель', 'официальн',
  'заявлени', 'комментари', 'пресс-конференц', 'брифинг',
  // Economic (accessible level)
  'бюджет', 'налог', 'тариф', 'субсиди', 'компенсац', 'пенси',
  'зарплат', 'инфляц', 'курс валют', 'процентн ставк',
  // World affairs (factual, not analytical)
  'переговор', 'соглашен', 'договор', 'визит', 'встреч',
  'саммит', 'конференц', 'форум', 'делегац',
  // Latin transliterations
  'proisshestvie', 'incident', 'avariya', 'katastrofa', 'chrezvychayn',
  'rassledovan', 'podozrevaem', 'zaderzhan', 'arestovan',
  'miting', 'protest', 'demonstrac', 'zabastovk',
];

// ILR 0+ to 1 vocabulary: High-frequency, everyday, predictable
// Basic survival, simple transactions, personal life
const ILR_BEGINNER_VOCAB = [
  // Basic daily life (ILR 1: "meals, lodging, transportation, time")
  'погода', 'температур', 'дождь', 'снег', 'солнц', 'облачн',
  'утро', 'день', 'вечер', 'ночь', 'сегодня', 'завтра', 'вчера',
  'час', 'минут', 'время', 'понедельник', 'вторник', 'среда',
  // Family and personal (ILR 1: "self, family, immediate environment")
  'семья', 'мама', 'папа', 'бабушка', 'дедушка', 'дети', 'ребёнок',
  'брат', 'сестра', 'муж', 'жена', 'друг', 'подруга',
  // Places and things
  'дом', 'квартира', 'улица', 'город', 'магазин', 'рынок',
  'школа', 'работа', 'офис', 'больница', 'аптека',
  // Basic actions and descriptions
  'хорошо', 'плохо', 'большой', 'маленький', 'новый', 'старый',
  'красивый', 'вкусный', 'интересный', 'важный',
  // Food and meals (ILR 1 topic)
  'еда', 'завтрак', 'обед', 'ужин', 'хлеб', 'вода', 'чай', 'кофе',
  // Transportation (ILR 1 topic)
  'автобус', 'метро', 'такси', 'поезд', 'самолёт', 'машина',
  // Holidays and celebrations (predictable, formulaic)
  'праздник', 'день рождения', 'новый год', 'поздравля',
  // Latin transliterations
  'pogoda', 'temperatura', 'dozhd', 'sneg', 'solnce', 'oblachno',
  'utro', 'den', 'vecher', 'noch', 'segodnya', 'zavtra', 'vchera',
  'semya', 'mama', 'papa', 'babushka', 'dedushka', 'deti',
  'dom', 'kvartira', 'ulica', 'gorod', 'magazin', 'shkola', 'rabota',
  'khorosho', 'plokho', 'bolshoy', 'malenkiy', 'novyy', 'staryy',
];

// ============================================================================
// FACTOR 2: DISCOURSE COMPLEXITY INDICATORS
// ILR distinguishes: facts (Level 2) vs. inferences/implications (Level 3+)
// ============================================================================

// Indicators of argumentative/inferential discourse (ILR 3+)
// "Can draw inferences from speech", "understand implications"
const ARGUMENTATIVE_INDICATORS = [
  // Opinion/analysis markers
  'по мнению', 'считает', 'полагает', 'утверждает', 'заявляет',
  'эксперты считают', 'аналитики полагают', 'по оценкам',
  // Inference/implication language
  'это означает', 'это свидетельствует', 'это говорит о',
  'можно предположить', 'очевидно что', 'по всей видимости',
  'вероятно', 'возможно', 'предположительно', 'по-видимому',
  // Cause-effect reasoning
  'в результате', 'вследствие', 'в связи с', 'поэтому', 'таким образом',
  'это приведёт к', 'это может означать', 'последствия',
  // Comparative/contrastive
  'в отличие от', 'по сравнению с', 'с другой стороны', 'однако', 'тем не менее',
  'несмотря на', 'вопреки', 'хотя', 'между тем',
  // Hypothetical/conditional (ILR 3: "hypothesizing, supported opinions")
  'если', 'в случае', 'при условии', 'гипотетически', 'теоретически',
  // Latin transliterations
  'po mneniyu', 'schitaet', 'polagaet', 'utverzhdaet', 'zayavlyaet',
  'eto oznachaet', 'eto svidetelstvuet', 'mozhno predpolozhit',
  'v rezultate', 'vsledstvie', 'v svyazi s', 'poetomu',
];

// Indicators of simple factual discourse (ILR 1-2)
// "Understand facts; i.e., the lines but not between or beyond the lines"
const FACTUAL_INDICATORS = [
  // Simple reporting verbs
  'произошло', 'случилось', 'состоялось', 'прошло', 'началось', 'закончилось',
  // Time/place specifics (factual anchoring)
  'в понедельник', 'во вторник', 'сегодня утром', 'вчера вечером',
  'в москве', 'в россии', 'в городе', 'на улице',
  // Simple announcements
  'сообщает', 'передаёт', 'информирует', 'объявляет',
  // Weather reports (ILR 1 territory)
  'ожидается', 'прогноз', 'температура составит', 'градусов',
  // Latin transliterations
  'proizoshlo', 'sluchilos', 'sostoyalos', 'proshlo', 'nachalos',
  'soobshchaet', 'peredayet', 'informiruet', 'obyavlyaet',
];

// ============================================================================
// FACTOR 3: TOPIC COMPLEXITY (per ILR topic guidelines)
// ============================================================================

// Topics requiring professional/abstract comprehension (ILR 3+)
const ADVANCED_TOPICS = {
  patterns: [
    // Political analysis
    /политическ[а-яё]*\s*(кризис|ситуац|анализ|прогноз)/gi,
    /геополитическ[а-яё]*/gi,
    /международн[а-яё]*\s*(отношен|полити|право)/gi,
    // Economic analysis
    /экономическ[а-яё]*\s*(прогноз|анализ|политик|кризис)/gi,
    /финансов[а-яё]*\s*(рын|систем|кризис)/gi,
    // Military/strategic
    /военн[а-яё]*\s*(операц|стратег|доктрин)/gi,
    /стратегическ[а-яё]*\s*(стабильност|паритет|вооружен)/gi,
    // Legal/constitutional
    /конституционн[а-яё]*/gi,
    /законодательн[а-яё]*\s*(процесс|инициатив|реформ)/gi,
    // Abstract/theoretical
    /теоретическ[а-яё]*/gi,
    /концептуальн[а-яё]*/gi,
  ],
};

// Topics accessible at intermediate level (ILR 2)
// "routine social conversations", "well-known current events"
const INTERMEDIATE_TOPICS = {
  patterns: [
    // Current events (factual)
    /произошл[а-яё]*\s*(авари|инцидент|происшеств)/gi,
    /чрезвычайн[а-яё]*\s*(ситуац|происшеств)/gi,
    // Social issues (accessible)
    /социальн[а-яё]*\s*(проблем|вопрос|поддержк)/gi,
    // Sports events
    /матч[а-яё]*/gi,
    /чемпионат[а-яё]*/gi,
    /соревнован[а-яё]*/gi,
    // Entertainment/culture news
    /премьер[а-яё]*\s*(фильм|спектакл)/gi,
    /концерт[а-яё]*/gi,
    /фестивал[а-яё]*/gi,
  ],
};

// ============================================================================
// FACTOR 4: TEXT TYPE / PROGRAM FORMAT
// Different formats have different ILR level requirements
// ============================================================================

const TEXT_TYPE_LEVELS = {
  // ILR 1: Simple, predictable, formulaic
  beginner: {
    programs: [
      'прогноз погоды', 'погода', 'доброе утро', 'утро россии',
      'мультфильм', 'детск', 'для детей',
    ],
    contentTypes: ['news'], // Only short, simple news briefs
    // Short weather/traffic reports, simple announcements
  },
  // ILR 2: "news stories similar to wire service reports"
  intermediate: {
    programs: [
      'новости', 'вести', 'время', 'сегодня', 'известия',
      'события', 'информационн', 'репортаж',
      'матч тв', 'спорт', 'футбол',
    ],
    contentTypes: ['news', 'reportage'],
    // Standard news reports, sports coverage, routine reporting
  },
  // ILR 3+: "speeches, lectures, briefings", "technical discussions"
  advanced: {
    programs: [
      'познер', 'соловьёв', 'вечер с', 'воскресный вечер',
      'итоги', 'аналитик', 'аналитическ', 'обзор',
      'интервью', 'эксклюзив', 'специальн',
      'военная приемка', 'документальн', 'расследован',
      'бесогон', 'право знать', 'время покажет',
    ],
    contentTypes: ['interview', 'documentary', 'speech'],
    // In-depth interviews, analytical programs, speeches
  },
};

// ============================================================================
// MAIN FUNCTION: ILR-BASED PEDAGOGICAL LEVEL ESTIMATION
// ============================================================================

function estimatePedagogicalLevel(metadata) {
  const { duration, category, program, contentType, title, description } = metadata;
  const lowerProgram = (program || '').toLowerCase();
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();

  // Scoring weights based on ILR research
  // Vocabulary and discourse complexity are strongest indicators
  const scores = { beginner: 0, intermediate: 0, advanced: 0 };

  // ========================================
  // VOCABULARY ANALYSIS (Weight: High)
  // Per ILR: vocabulary breadth is key differentiator
  // ========================================
  let advancedVocabCount = 0;
  let intermediateVocabCount = 0;
  let beginnerVocabCount = 0;

  for (const word of ILR_ADVANCED_VOCAB) {
    if (text.includes(word)) { advancedVocabCount++; }
  }
  for (const word of ILR_INTERMEDIATE_VOCAB) {
    if (text.includes(word)) { intermediateVocabCount++; }
  }
  for (const word of ILR_BEGINNER_VOCAB) {
    if (text.includes(word)) { beginnerVocabCount++; }
  }

  // Weight vocabulary findings
  // Multiple advanced terms strongly indicate ILR 3+
  if (advancedVocabCount >= 3) scores.advanced += 8;
  else if (advancedVocabCount >= 1) scores.advanced += 4;

  if (intermediateVocabCount >= 3) scores.intermediate += 5;
  else if (intermediateVocabCount >= 1) scores.intermediate += 2;

  if (beginnerVocabCount >= 4) scores.beginner += 4;
  else if (beginnerVocabCount >= 2) scores.beginner += 2;

  // ========================================
  // DISCOURSE COMPLEXITY (Weight: High)
  // ILR 3+: inference, argumentation
  // ILR 2: factual understanding
  // ========================================
  let argumentativeCount = 0;
  let factualCount = 0;

  for (const indicator of ARGUMENTATIVE_INDICATORS) {
    if (text.includes(indicator)) { argumentativeCount++; }
  }
  for (const indicator of FACTUAL_INDICATORS) {
    if (text.includes(indicator)) { factualCount++; }
  }

  // Argumentative discourse = ILR 3+
  if (argumentativeCount >= 2) scores.advanced += 6;
  else if (argumentativeCount >= 1) scores.advanced += 3;

  // Factual discourse = ILR 1-2
  if (factualCount >= 2 && argumentativeCount === 0) {
    scores.intermediate += 3;
    scores.beginner += 2;
  }

  // ========================================
  // TOPIC COMPLEXITY (Weight: Medium)
  // ========================================
  for (const pattern of ADVANCED_TOPICS.patterns) {
    if (pattern.test(text)) {
      scores.advanced += 3;
      break;
    }
  }

  for (const pattern of INTERMEDIATE_TOPICS.patterns) {
    if (pattern.test(text)) {
      scores.intermediate += 2;
      break;
    }
  }

  // Category as topic indicator
  if (category) {
    const lowerCat = category.toLowerCase();
    // ILR 3+ topics: politics, economy, military require professional comprehension
    if (['politics', 'economy', 'military'].includes(lowerCat)) {
      scores.advanced += 4;
    }
    // ILR 2 topics: world events, science, technology, sports
    else if (['world', 'science', 'technology', 'sports', 'society'].includes(lowerCat)) {
      scores.intermediate += 3;
    }
    // ILR 1 topics: weather, tourism, culture (everyday, predictable)
    else if (['weather', 'tourism', 'culture'].includes(lowerCat)) {
      scores.beginner += 4;
      scores.intermediate += 1; // Can also be intermediate
    }
  }

  // ========================================
  // PROGRAM/TEXT TYPE (Weight: Medium)
  // Per ILR: different formats require different levels
  // ========================================
  for (const prog of TEXT_TYPE_LEVELS.advanced.programs) {
    if (lowerProgram.includes(prog)) {
      scores.advanced += 4;
      break;
    }
  }
  for (const prog of TEXT_TYPE_LEVELS.intermediate.programs) {
    if (lowerProgram.includes(prog)) {
      scores.intermediate += 3;
      break;
    }
  }
  for (const prog of TEXT_TYPE_LEVELS.beginner.programs) {
    if (lowerProgram.includes(prog)) {
      scores.beginner += 5;
      break;
    }
  }

  // Content type scoring (per ILR text type guidelines)
  if (contentType) {
    if (contentType === 'speech') {
      // Speeches require ILR 3: "public addresses", "briefings"
      scores.advanced += 5;
    } else if (contentType === 'interview') {
      // In-depth interviews require inference
      scores.advanced += 4;
    } else if (contentType === 'documentary') {
      // Documentaries vary but typically intermediate+
      scores.intermediate += 2;
      scores.advanced += 2;
    } else if (contentType === 'reportage') {
      // Field reports: intermediate
      scores.intermediate += 3;
    } else if (contentType === 'news') {
      // News varies by complexity - check other factors
      scores.intermediate += 1;
    }
  }

  // ========================================
  // DURATION (Weight: Low - tiebreaker only)
  // Per research: passage length affects difficulty but is weak indicator
  // ========================================
  if (duration) {
    // Very short content is more accessible
    if (duration <= 90) scores.beginner += 1;
    // Extended discourse requires sustained comprehension (ILR 2+)
    else if (duration >= 600) scores.advanced += 1;
  }

  // ========================================
  // DETERMINE LEVEL
  // ========================================
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // If scores are very close (within 2 points), prefer intermediate as safe default
  if (sorted.length >= 2 && sorted[0][1] - sorted[1][1] <= 2) {
    // If tied between beginner and advanced, choose intermediate
    if ((sorted[0][0] === 'beginner' && sorted[1][0] === 'advanced') ||
        (sorted[0][0] === 'advanced' && sorted[1][0] === 'beginner')) {
      return 'intermediate';
    }
  }

  return sorted[0][0];
}

// ============================================================================
// HTML/TEXT PARSING UTILITIES
// ============================================================================

function decodeHtmlEntities(text) {
  if (!text) return '';
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
    '&laquo;': '«', '&raquo;': '»', '&mdash;': '—', '&ndash;': '–',
    '&hellip;': '…', '&bull;': '•', '&copy;': '©', '&reg;': '®',
    '&trade;': '™', '&euro;': '€', '&pound;': '£', '&yen;': '¥'
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return decoded;
}

function extractOpenGraph(html) {
  const og = {};
  const patterns = {
    title: /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    description: /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    image: /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    video: /<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i,
    url: /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    if (match) og[key] = decodeHtmlEntities(match[1]);
  }
  return og;
}

function extractJsonLd(html) {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (['VideoObject', 'NewsArticle'].includes(item['@type'])) return item;
        }
      } else if (data['@type'] && ['VideoObject', 'NewsArticle'].includes(data['@type'])) {
        return data;
      }
    } catch (e) { /* ignore parse errors */ }
  }
  return null;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const absolute = new URL(href, baseUrl).href;
      links.push(absolute);
    } catch (e) { /* invalid URL */ }
  }
  return [...new Set(links)];
}

// ============================================================================
// M3U8 PARSING
// ============================================================================

function parseM3u8(content, baseUrl) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const segments = [];
  const variants = [];
  let isMaster = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXT-X-STREAM-INF')) {
      isMaster = true;
      // Next line is variant URL
      const nextLine = lines[i + 1];
      if (nextLine && !nextLine.startsWith('#')) {
        const url = nextLine.startsWith('http') ? nextLine : new URL(nextLine, baseUrl).href;
        const bwMatch = line.match(/BANDWIDTH=(\d+)/);
        variants.push({
          url,
          bandwidth: bwMatch ? parseInt(bwMatch[1]) : 0
        });
      }
    } else if (line.startsWith('#EXTINF')) {
      // Next line is segment URL
      const nextLine = lines[i + 1];
      if (nextLine && !nextLine.startsWith('#')) {
        const url = nextLine.startsWith('http') ? nextLine : new URL(nextLine, baseUrl).href;
        const durMatch = line.match(/#EXTINF:([\d.]+)/);
        segments.push({
          url,
          duration: durMatch ? parseFloat(durMatch[1]) : 0
        });
      }
    }
  }

  return { isMaster, variants, segments };
}

// ============================================================================
// MPEG-TS DEMUXING FOR AUDIO EXTRACTION
// ============================================================================

const TS_PACKET_SIZE = 188;
const TS_SYNC_BYTE = 0x47;

function demuxTsAudio(tsData) {
  const view = new DataView(tsData.buffer);
  const audioFrames = [];
  let audioPid = null;
  let pmtPid = null;

  // First pass: find PAT and PMT to get audio PID
  for (let offset = 0; offset + TS_PACKET_SIZE <= tsData.length; offset += TS_PACKET_SIZE) {
    if (tsData[offset] !== TS_SYNC_BYTE) continue;

    const pid = ((tsData[offset + 1] & 0x1F) << 8) | tsData[offset + 2];
    const payloadStart = (tsData[offset + 1] & 0x40) !== 0;
    const hasAdaptation = (tsData[offset + 3] & 0x20) !== 0;
    const hasPayload = (tsData[offset + 3] & 0x10) !== 0;

    if (!hasPayload) continue;

    let payloadOffset = offset + 4;
    if (hasAdaptation) {
      payloadOffset += 1 + tsData[offset + 4];
    }

    // PAT (PID 0)
    if (pid === 0 && payloadStart && !pmtPid) {
      if (tsData[payloadOffset] === 0) payloadOffset++; // pointer field
      // Skip table header, find PMT PID
      const sectionLength = ((tsData[payloadOffset + 1] & 0x0F) << 8) | tsData[payloadOffset + 2];
      const programOffset = payloadOffset + 8;
      if (programOffset + 4 <= offset + TS_PACKET_SIZE) {
        pmtPid = ((tsData[programOffset + 2] & 0x1F) << 8) | tsData[programOffset + 3];
        log('Found PMT PID:', pmtPid);
      }
    }

    // PMT
    if (pmtPid && pid === pmtPid && payloadStart && !audioPid) {
      if (tsData[payloadOffset] === 0) payloadOffset++; // pointer field
      const sectionLength = ((tsData[payloadOffset + 1] & 0x0F) << 8) | tsData[payloadOffset + 2];
      const programInfoLength = ((tsData[payloadOffset + 10] & 0x0F) << 8) | tsData[payloadOffset + 11];
      let streamOffset = payloadOffset + 12 + programInfoLength;

      while (streamOffset + 5 <= payloadOffset + 3 + sectionLength - 4) {
        const streamType = tsData[streamOffset];
        const elementaryPid = ((tsData[streamOffset + 1] & 0x1F) << 8) | tsData[streamOffset + 2];
        const esInfoLength = ((tsData[streamOffset + 3] & 0x0F) << 8) | tsData[streamOffset + 4];

        // Stream type 0x0F = AAC, 0x03/0x04 = MP3, 0x81 = AC3
        if (streamType === 0x0F || streamType === 0x03 || streamType === 0x04 || streamType === 0x81) {
          audioPid = elementaryPid;
          log('Found audio PID:', audioPid, 'type:', streamType);
          break;
        }
        streamOffset += 5 + esInfoLength;
      }
    }

    if (audioPid) break;
  }

  if (!audioPid) {
    log('No audio PID found, using common defaults');
    // Try common audio PIDs
    audioPid = 0x0101;
  }

  // Second pass: extract audio PES packets
  let pesBuffer = new Uint8Array(0);

  for (let offset = 0; offset + TS_PACKET_SIZE <= tsData.length; offset += TS_PACKET_SIZE) {
    if (tsData[offset] !== TS_SYNC_BYTE) continue;

    const pid = ((tsData[offset + 1] & 0x1F) << 8) | tsData[offset + 2];
    if (pid !== audioPid) continue;

    const payloadStart = (tsData[offset + 1] & 0x40) !== 0;
    const hasAdaptation = (tsData[offset + 3] & 0x20) !== 0;
    const hasPayload = (tsData[offset + 3] & 0x10) !== 0;

    if (!hasPayload) continue;

    let payloadOffset = offset + 4;
    if (hasAdaptation) {
      payloadOffset += 1 + tsData[offset + 4];
    }

    const payloadLength = offset + TS_PACKET_SIZE - payloadOffset;
    if (payloadLength <= 0) continue;

    if (payloadStart && pesBuffer.length > 0) {
      // Extract AAC frames from completed PES packet
      const frames = extractAacFrames(pesBuffer);
      audioFrames.push(...frames);
      pesBuffer = new Uint8Array(0);
    }

    // Append payload to PES buffer
    const newBuffer = new Uint8Array(pesBuffer.length + payloadLength);
    newBuffer.set(pesBuffer);
    newBuffer.set(tsData.slice(payloadOffset, payloadOffset + payloadLength), pesBuffer.length);
    pesBuffer = newBuffer;
  }

  // Process final PES packet
  if (pesBuffer.length > 0) {
    const frames = extractAacFrames(pesBuffer);
    audioFrames.push(...frames);
  }

  log('Extracted', audioFrames.length, 'audio frames');
  return audioFrames;
}

function extractAacFrames(pesData) {
  const frames = [];
  if (pesData.length < 9) return frames;

  // Check PES start code
  if (pesData[0] !== 0 || pesData[1] !== 0 || pesData[2] !== 1) {
    // Not a PES packet, might be raw AAC
    return extractRawAacFrames(pesData);
  }

  // Skip PES header
  const pesHeaderLength = pesData[8];
  let offset = 9 + pesHeaderLength;

  return extractRawAacFrames(pesData.slice(offset));
}

function extractRawAacFrames(data) {
  const frames = [];
  let offset = 0;

  while (offset + 7 <= data.length) {
    // Look for ADTS sync word (0xFFF)
    if (data[offset] === 0xFF && (data[offset + 1] & 0xF0) === 0xF0) {
      // ADTS header found
      const frameLength = ((data[offset + 3] & 0x03) << 11) |
                         (data[offset + 4] << 3) |
                         ((data[offset + 5] & 0xE0) >> 5);

      if (frameLength > 0 && offset + frameLength <= data.length) {
        frames.push(data.slice(offset, offset + frameLength));
        offset += frameLength;
      } else {
        offset++;
      }
    } else {
      offset++;
    }
  }

  return frames;
}

function combineAudioFrames(frames) {
  const totalLength = frames.reduce((sum, f) => sum + f.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const frame of frames) {
    result.set(frame, offset);
    offset += frame.length;
  }
  return result;
}

// ============================================================================
// SITE-SPECIFIC EXTRACTORS
// ============================================================================

// --- 1TV.RU ---

async function extract1tv(url) {
  log('Extracting from 1tv.ru:', url);

  // Extract news_id from URL: /news/2025-12-22/529283-title -> 529283
  const newsIdMatch = url.match(/\/news\/\d{4}-\d{2}-\d{2}\/(\d+)/);
  if (!newsIdMatch) {
    throw new Error('Could not extract news ID from 1tv URL');
  }
  const newsId = newsIdMatch[1];

  // Use the video_materials.json API - this is the official 1tv video API
  const apiUrl = `https://www.1tv.ru/video_materials.json?news_id=${newsId}&single=true`;
  log('Fetching 1tv video API:', apiUrl);

  const response = await fetchWithHeaders(apiUrl);
  if (!response.ok) throw new Error(`1tv API error: ${response.status}`);

  const data = await response.json();
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('No video data returned from 1tv API');
  }

  const video = data[0];

  // Extract m3u8 URL from sources
  let m3u8Url = null;
  let mp4Url = null;

  if (video.sources && Array.isArray(video.sources)) {
    for (const source of video.sources) {
      if (source.type === 'application/x-mpegURL' && source.src) {
        m3u8Url = source.src;
        if (!m3u8Url.startsWith('http')) m3u8Url = 'https:' + m3u8Url;
      } else if (source.type === 'video/mp4' && source.src) {
        mp4Url = source.src;
        if (!mp4Url.startsWith('http')) mp4Url = 'https:' + mp4Url;
      }
    }
  }

  // Fallback to mbr (multi-bitrate) array for MP4
  if (!mp4Url && video.mbr && Array.isArray(video.mbr)) {
    const hdSource = video.mbr.find(m => m.name === 'hd') || video.mbr[0];
    if (hdSource && hdSource.src) {
      mp4Url = hdSource.src;
      if (!mp4Url.startsWith('http')) mp4Url = 'https:' + mp4Url;
    }
  }

  // Infer category from title and URL
  const title = video.title || 'Первый канал';
  const description = video.description || null;
  const duration = video.duration || null;
  const inferredCategory = inferCategory(title + ' ' + (description || ''), url);
  log('Inferred category for 1tv:', inferredCategory, 'from title:', title);

  // Detect content type and pedagogical level
  const metadata = { title, description, url, duration };
  const contentType = detectContentType(metadata);
  metadata.contentType = contentType;
  metadata.category = inferredCategory;
  const pedagogicalLevel = estimatePedagogicalLevel(metadata);

  return {
    source: '1tv',
    sourceUrl: url,
    videoId: newsId,
    title: title,
    description: description,
    thumbnail: video.poster || video.poster_thumb || null,
    publishDate: video.date_air || null,
    duration: duration,
    category: inferredCategory,
    categories: inferredCategory ? [inferredCategory] : null,
    contentType: contentType,
    pedagogicalLevel: pedagogicalLevel,
    m3u8Url,
    mp4Url,
    streamType: m3u8Url ? 'hls' : 'mp4',
  };
}

// Helper function to extract news ID from 1tv URL
function extractNewsIdFrom1tvUrl(url) {
  // URL format: /news/2025-12-22/529290-v_rabote_whatsapp...
  const match = url.match(/\/news\/\d{4}-\d{2}-\d{2}\/(\d+)/);
  return match ? match[1] : null;
}

// Helper function to extract title from 1tv URL slug (fallback for when API fails)
function extractTitleFrom1tvUrl(url) {
  // URL format: /news/2025-12-22/529290-v_rabote_whatsapp_v_rossii_proizoshel_massovyy_sboy
  const match = url.match(/\/news\/\d{4}-\d{2}-\d{2}\/\d+-(.+?)(?:\?|#|$)/);
  if (!match) return null;

  const slug = match[1];
  // Replace underscores with spaces and capitalize first letter
  const title = slug.replace(/_/g, ' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// Fetch real Russian title and metadata from 1tv video API
async function fetch1tvMetadata(newsId) {
  try {
    const apiUrl = `https://www.1tv.ru/video_materials.json?news_id=${newsId}&single=true`;
    const response = await fetchWithHeaders(apiUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const video = data[0];
    return {
      title: video.title || null,
      description: video.description || null,
      thumbnail: video.poster || video.poster_thumb || null,
      duration: video.duration || null,
      publishDate: video.date_air || null,
    };
  } catch (e) {
    log('1tv metadata fetch error for', newsId, ':', e.message);
    return null;
  }
}

// Source-level cache - caches individual source results for 30 minutes
// This allows different queries to reuse source data (news doesn't change fast)
const SOURCE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes - sources update slowly
const sourceCache = new Map();

async function getCachedSourceResults(sourceId, fetchFn, skipCache = false) {
  const cacheKey = `source:${sourceId}`;
  const MIN_VALID_RESULTS = 2; // Cache is considered stale if fewer than this

  // Helper to validate cached data
  const isValidCache = (data) => {
    if (!data) return false;
    if (Array.isArray(data) && data.length < MIN_VALID_RESULTS) return false;
    return true;
  };

  if (!skipCache) {
    // Check memory cache first
    const cached = sourceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SOURCE_CACHE_TTL) {
      if (isValidCache(cached.data)) {
        log('Source cache hit:', sourceId, '- items:', cached.data?.length || 0);
        return cached.data;
      } else {
        log('Source cache invalid (too few results), refetching:', sourceId);
      }
    }

    // Check KV cache
    if (KV_CACHE) {
      try {
        const kvCached = await KV_CACHE.get(cacheKey, 'json');
        if (kvCached && isValidCache(kvCached)) {
          log('Source KV cache hit:', sourceId, '- items:', kvCached?.length || 0);
          sourceCache.set(cacheKey, { data: kvCached, timestamp: Date.now() });
          return kvCached;
        } else if (kvCached) {
          log('Source KV cache invalid (too few results), refetching:', sourceId);
        }
      } catch (e) {
        log('Source KV error:', e.message);
      }
    }
  } else {
    log('Source cache bypass:', sourceId);
  }

  // Fetch fresh data
  log('Source cache miss, fetching:', sourceId);
  const data = await fetchFn();

  // Only cache if we got valid results
  if (isValidCache(data)) {
    // Cache in memory
    sourceCache.set(cacheKey, { data, timestamp: Date.now() });

    // Cache in KV
    if (KV_CACHE) {
      try {
        await KV_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 600 }); // 10 min
      } catch (e) {
        log('Source KV write error:', e.message);
      }
    }
  } else {
    log('Not caching empty/invalid results for:', sourceId);
  }

  return data;
}

async function discover1tv(sourceKey, maxItems = 20) {
  const site = SITES['1tv'];
  const source = site.sources[sourceKey];
  if (!source) throw new Error(`Unknown 1tv source: ${sourceKey}`);

  log('Discovering from 1tv:', sourceKey);

  const results = [];

  // Category-specific search keywords for 1TV search API
  const SEARCH_KEYWORDS = {
    'news': ['новости', 'сегодня', 'россия'],
    'politics': ['политика', 'путин', 'правительство', 'госдума'],
    'economy': ['экономика', 'рубль', 'инфляция', 'бизнес'],
    'society': ['общество', 'социальный', 'люди'],
    'world': ['мир', 'международный', 'сша', 'европа', 'украина'],
    'sports': ['спорт', 'футбол', 'хоккей', 'олимпиада', 'чемпионат'],
    'culture': ['культура', 'театр', 'кино', 'музей', 'искусство'],
    'vremya': ['время', 'новости'],
  };

  // Strategy 1: Use 1TV search.js API (returns fresh content with Russian titles)
  try {
    const keywords = SEARCH_KEYWORDS[sourceKey] || SEARCH_KEYWORDS['news'];
    const today = new Date().toISOString().split('T')[0];
    // Use 6 months ago for broader date range (date filtering happens client-side)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const seenUrls = new Set();
    const urlsToProcess = [];

    // Try multiple keywords to get more diverse results
    const keywordsToTry = keywords.slice(0, 2); // Try up to 2 keywords
    for (const searchKeyword of keywordsToTry) {
      if (urlsToProcess.length >= maxItems * 2) break;

      const searchUrl = `https://www.1tv.ru/search.js?from=${sixMonthsAgo}&to=${today}&limit=${maxItems + 5}&offset=0&q=text%3A${encodeURIComponent(searchKeyword)}`;
      log('Trying 1tv search.js API:', searchUrl);

      const response = await fetchWithHeaders(searchUrl);
      if (response.ok) {
        const jsContent = await response.text();

        // Extract news URLs from the JavaScript response
        const urlPattern = /href=\\"(\/news\/\d{4}-\d{2}-\d{2}\/(\d+)-[^"\\]+)\\"/g;
        const matches = [...jsContent.matchAll(urlPattern)];

        for (const match of matches) {
          const path = match[1];
          const newsId = match[2];
          const url = `https://www.1tv.ru${path}`;

          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          urlsToProcess.push({ url, newsId });
        }
      }
    }

    log('Found', urlsToProcess.length, 'total URLs from search.js');

    // Fetch metadata in parallel (limit concurrency to avoid timeout)
    const batchSize = Math.min(urlsToProcess.length, maxItems + 5, 15);
    const batch = urlsToProcess.slice(0, batchSize);

    const metadataPromises = batch.map(async ({ url, newsId }) => {
      const meta = await fetch1tvMetadata(newsId);
      if (meta && meta.title) {
        const inferredCategory = inferCategory(meta.title + ' ' + (meta.description || ''), url);
        const metadata = { title: meta.title, description: meta.description, url, duration: meta.duration, category: inferredCategory };
        const contentType = detectContentType(metadata);
        const pedagogicalLevel = estimatePedagogicalLevel(metadata);

        return {
          url,
          source: '1tv',
          sourceKey,
          videoId: newsId,
          title: meta.title,
          description: meta.description,
          thumbnail: meta.thumbnail,
          publishDate: meta.publishDate,
          duration: meta.duration,
          category: inferredCategory || source.categories?.[0],
          categories: inferredCategory ? [inferredCategory] : source.categories || [],
          contentType,
          pedagogicalLevel,
        };
      }
      return null;
    });

    const resolvedItems = await Promise.all(metadataPromises);
    for (const item of resolvedItems) {
      if (item && results.length < maxItems) {
        results.push(item);
      }
    }
    log('Found', results.length, 'items from 1tv search.js');
  } catch (e) {
    log('1tv search.js error:', e.message);
  }

  // Strategy 2: Fallback to sitemap if search didn't work
  if (results.length < maxItems) {
    const isSpecializedSource = sourceKey !== 'news' && sourceKey !== 'vremya';
    const targetCategories = source.categories || [];

    // Sitemap as fallback method (1tv category pages are client-rendered)
    try {
    const currentYear = new Date().getFullYear();
    // Fetch more items for specialized sources to ensure enough matches after filtering
    const fetchMultiplier = isSpecializedSource ? 10 : 3;
    let candidateItems = [];

    // Step 1: Collect URLs from sitemap
    let sitemapUrls = [];
    for (const year of [currentYear, currentYear - 1]) {
      if (sitemapUrls.length >= maxItems * fetchMultiplier) break;

      const sitemapUrl = `${SITES['1tv'].sitemapBase}${year}.xml`;
      log('Trying 1tv sitemap:', sitemapUrl);

      const response = await fetchWithHeaders(sitemapUrl);
      if (response.ok) {
        const xml = await response.text();

        // Filter for news URLs with video feeds (those with ovs:feed)
        const videoFeedPattern = /<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<ovs:feed>([^<]+)<\/ovs:feed>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g;
        const videoMatches = [...xml.matchAll(videoFeedPattern)];

        // Get most recent items first
        const sortedMatches = videoMatches.reverse();

        for (const match of sortedMatches) {
          if (sitemapUrls.length >= maxItems * fetchMultiplier) break;

          const [, url, feedUrl, lastmod] = match;
          if (url && url.includes('/news/')) {
            const newsId = extractNewsIdFrom1tvUrl(url);
            if (newsId) {
              sitemapUrls.push({ url, feedUrl, lastmod, newsId });
            }
          }
        }
        log('Found', sitemapUrls.length, 'URLs from sitemap');
      }
    }

    // Step 2: Fetch real Russian titles from API in parallel (limit to avoid timeout)
    const urlsToFetch = sitemapUrls.slice(0, Math.min(maxItems + 5, 15));
    log('Fetching Russian titles for', urlsToFetch.length, 'items...');

    const metadataPromises = urlsToFetch.map(async (item) => {
      const meta = await fetch1tvMetadata(item.newsId);
      if (meta && meta.title) {
        // Got real Russian title - use it for category inference
        const inferredCategory = inferCategory(meta.title + ' ' + (meta.description || ''), item.url);
        return {
          url: item.url,
          source: '1tv',
          sourceKey,
          videoId: item.newsId,
          title: meta.title,  // Real Russian title!
          description: meta.description,
          thumbnail: meta.thumbnail,
          videoFeed: item.feedUrl,
          publishDate: meta.publishDate || (item.lastmod ? item.lastmod.split('T')[0] : null),
          duration: meta.duration,
          inferredCategory,
        };
      }
      // Fallback to transliterated title if API fails
      const fallbackTitle = extractTitleFrom1tvUrl(item.url);
      const inferredCategory = fallbackTitle ? inferCategory(fallbackTitle, item.url) : null;
      return {
        url: item.url,
        source: '1tv',
        sourceKey,
        videoId: item.newsId,
        title: fallbackTitle,
        videoFeed: item.feedUrl,
        publishDate: item.lastmod ? item.lastmod.split('T')[0] : null,
        inferredCategory,
      };
    });

    const resolvedItems = await Promise.all(metadataPromises);
    candidateItems = resolvedItems.filter(item => item !== null);
    log('Got metadata for', candidateItems.length, 'items');

    // For specialized sources, filter to only items whose inferred category matches target
    if (isSpecializedSource && targetCategories.length > 0) {
      log('Filtering for specialized source categories:', targetCategories);
      const filtered = candidateItems.filter(item => {
        // Only include if we successfully inferred a category that matches target
        const itemCat = (item.inferredCategory || '').toLowerCase();
        return itemCat && targetCategories.some(tc => tc.toLowerCase() === itemCat);
      });
      log('After category filter:', filtered.length, 'items match');

      // Add filtered items up to maxItems, now with final category set
      for (const item of filtered) {
        if (results.length >= maxItems) break;
        const metadata = { title: item.title, description: item.description, url: item.url, duration: item.duration, category: item.inferredCategory };
        const contentType = detectContentType(metadata);
        metadata.contentType = contentType;
        const pedagogicalLevel = estimatePedagogicalLevel(metadata);
        results.push({
          ...item,
          category: item.inferredCategory,
          categories: [item.inferredCategory],
          contentType,
          pedagogicalLevel,
        });
      }
    } else {
      // For general news, take all items up to maxItems
      for (const item of candidateItems) {
        if (results.length >= maxItems) break;
        const itemCat = item.inferredCategory || targetCategories[0] || 'society';
        const metadata = { title: item.title, description: item.description, url: item.url, duration: item.duration, category: itemCat };
        const contentType = detectContentType(metadata);
        metadata.contentType = contentType;
        const pedagogicalLevel = estimatePedagogicalLevel(metadata);
        results.push({
          ...item,
          category: itemCat,
          categories: item.inferredCategory ? [item.inferredCategory] : targetCategories,
          contentType,
          pedagogicalLevel,
        });
      }
    }

    log('Final results from sitemap:', results.length, 'items');
    } catch (e) {
      log('Sitemap discovery failed:', e.message);
    }
  }  // End of Strategy 2 (sitemap fallback)

  // Strategy 3: Try the schedule API for program-based content (vremya, news)
  if (results.length < maxItems && (sourceKey === 'vremya' || sourceKey === 'news')) {
    try {
      log('Trying 1tv schedule API...');
      const scheduleData = await fetchJson(SITES['1tv'].scheduleApi);

      if (scheduleData?.channel?.schedule?.program) {
        const programs = scheduleData.channel.schedule.program;
        for (const program of programs) {
          // Filter by program type for vremya
          if (sourceKey === 'vremya' && !program.title?.toLowerCase().includes('время')) {
            continue;
          }

          if (program.link || program.url) {
            const url = program.link || program.url;
            const fullUrl = url.startsWith('http') ? url : `https://www.1tv.ru${url}`;
            if (!results.find(r => r.url === fullUrl)) {
              const title = program.title || null;
              const inferredCat = title ? inferCategory(title, fullUrl) : null;
              const metadata = { title, url: fullUrl, duration: program.duration, category: inferredCat || source.categories[0] };
              const contentType = detectContentType(metadata);
              metadata.contentType = contentType;
              const pedagogicalLevel = estimatePedagogicalLevel(metadata);
              results.push({
                url: fullUrl,
                source: '1tv',
                sourceKey,
                title,
                thumbnail: program.image || program.preview || null,
                publishDate: program.datetime || program.date || null,
                duration: program.duration || null,
                category: inferredCat,
                categories: inferredCat ? [inferredCat] : source.categories,
                contentType,
                pedagogicalLevel,
              });
            }
          }
        }
        log('Found', results.length, 'items after schedule API');
      }
    } catch (e) {
      log('Schedule API failed:', e.message);
    }
  }

  // Strategy 2: Scrape the category page
  if (results.length < maxItems) {
    try {
      log('Trying page scrape for:', source.url);
      const response = await fetchWithHeaders(source.url);
      if (response.ok) {
        const html = await response.text();

        // Try __NEXT_DATA__ first
        const nextDataMatch = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            const pageProps = nextData?.props?.pageProps;

            // Search through various data locations
            const dataLocations = [
              pageProps?.data?.items,
              pageProps?.data?.news,
              pageProps?.data?.videos,
              pageProps?.items,
              pageProps?.news,
              pageProps?.videos,
              pageProps?.initialData?.items,
              pageProps?.ssrData?.items,
            ];

            for (const items of dataLocations) {
              if (Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                  const itemUrl = item.url || item.link || item.href || item.path ||
                    (item.slug ? `/news/${item.slug}` : null) ||
                    (item.id ? `/news/${item.id}` : null);

                  if (itemUrl) {
                    const fullUrl = itemUrl.startsWith('http') ? itemUrl : `https://www.1tv.ru${itemUrl}`;
                    // Avoid duplicates
                    if (!results.find(r => r.url === fullUrl)) {
                      const title = item.title || item.name || item.headline || null;
                      const description = item.description || item.anons || null;
                      const inferredCat = title ? inferCategory((title || '') + ' ' + (description || ''), fullUrl) : null;
                      const metadata = { title, description, url: fullUrl, duration: item.duration, category: inferredCat || source.categories[0] };
                      const contentType = detectContentType(metadata);
                      metadata.contentType = contentType;
                      const pedagogicalLevel = estimatePedagogicalLevel(metadata);
                      results.push({
                        url: fullUrl,
                        source: '1tv',
                        sourceKey,
                        title,
                        thumbnail: item.image || item.preview || item.thumbnail || null,
                        publishDate: item.date || item.datetime || item.publishedAt || null,
                        duration: item.duration || null,
                        category: inferredCat,
                        categories: inferredCat ? [inferredCat] : source.categories,
                        contentType,
                        pedagogicalLevel,
                      });
                    }
                  }
                }
                log('Found', results.length, 'items from __NEXT_DATA__');
                break;
              }
            }
          } catch (e) {
            log('Failed to parse __NEXT_DATA__:', e.message);
          }
        }

        // Fallback: Extract links from HTML
        if (results.length === 0) {
          const links = extractLinks(html, source.url);
          const newsLinks = links.filter(link => {
            return link.includes('1tv.ru') &&
                   (/\/news\/[^/]+\/\d{4}-\d{2}-\d{2}/.test(link) ||
                    /\/news\/\d{4}-\d{2}-\d{2}/.test(link) ||
                    /\/shows\/[^/]+\/[^/]+\/\d{4}/.test(link));
          });

          for (const url of newsLinks) {
            if (!results.find(r => r.url === url)) {
              const title = extractTitleFrom1tvUrl(url);
              const inferredCategory = title ? inferCategory(title, url) : null;
              const metadata = { title, url, category: inferredCategory || source.categories[0] };
              const contentType = detectContentType(metadata);
              metadata.contentType = contentType;
              const pedagogicalLevel = estimatePedagogicalLevel(metadata);
              results.push({
                url,
                source: '1tv',
                sourceKey,
                title,
                category: inferredCategory,
                categories: inferredCategory ? [inferredCategory] : source.categories,
                contentType,
                pedagogicalLevel,
              });
            }
          }
          log('Found', results.length, 'items from link extraction');
        }
      }
    } catch (e) {
      log('Page scrape failed:', e.message);
    }
  }

  return results.slice(0, maxItems);
}

// --- SMOTRIM.RU ---

async function discoverSmotrim(sourceKey, maxItems = 20) {
  const source = SITES['smotrim'].sources[sourceKey];
  if (!source) throw new Error(`Unknown smotrim source: ${sourceKey}`);

  log('Discovering from smotrim:', sourceKey, 'brandId:', source.brandId);
  const results = [];

  try {
    // Use the official Smotrim API
    const apiUrl = `${SITES['smotrim'].apiBase}/videos?brands=${source.brandId}&limit=${maxItems}&offset=0`;
    log('Fetching Smotrim API:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const videoId = item.id || item.video_id;
          if (videoId) {
            const title = item.combinedTitle || item.episodeTitle || item.title || item.name || null;
            const description = item.anons || item.description || null;
            const url = `https://smotrim.ru/video/${videoId}`;
            const duration = item.duration || null;
            const program = item.brandTitle || source.name || null;
            // Infer SINGLE category from content
            const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url);
            // Add content type and pedagogical level
            const metadata = { title, description, url, duration, program, category: inferredCat || source.categories[0] };
            const contentType = detectContentType(metadata);
            metadata.contentType = contentType;
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);
            results.push({
              url,
              source: 'smotrim',
              sourceKey,
              videoId,
              title,
              description,
              thumbnail: item.picture || item.preview || item.thumbnail || null,
              publishDate: item.dateRec || item.date || item.datePublished || item.created || null,
              duration,
              program,
              category: inferredCat,  // SINGLE inferred category
              categories: inferredCat ? [inferredCat] : source.categories,
              contentType,
              pedagogicalLevel,
            });
          }
        }
        log('Found', results.length, 'videos from Smotrim API');
      }
    } else {
      log('Smotrim API returned:', response.status);
    }
  } catch (e) {
    log('Smotrim API error:', e.message);
  }

  // Fallback: scrape the web page
  if (results.length === 0) {
    try {
      const pageUrl = `https://smotrim.ru/brand/${source.brandId}`;
      log('Trying page scrape:', pageUrl);

      const response = await fetchWithHeaders(pageUrl);
      if (response.ok) {
        const html = await response.text();

        // Look for video IDs in the page
        const videoIdMatches = html.matchAll(/\/video\/(\d+)/g);
        const seenIds = new Set();

        for (const match of videoIdMatches) {
          const videoId = match[1];
          if (!seenIds.has(videoId)) {
            seenIds.add(videoId);
            const url = `https://smotrim.ru/video/${videoId}`;
            // Use source categories for fallback (no title/description available)
            const metadata = { url, category: source.categories[0] };
            const contentType = detectContentType(metadata);
            metadata.contentType = contentType;
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);
            results.push({
              url,
              source: 'smotrim',
              sourceKey,
              videoId,
              categories: source.categories,
              contentType,
              pedagogicalLevel,
            });
          }
        }
        log('Found', results.length, 'videos from page scrape');
      }
    } catch (e) {
      log('Page scrape failed:', e.message);
    }
  }

  return results.slice(0, maxItems);
}

async function extractSmotrim(url) {
  log('Extracting from smotrim.ru:', url);

  // Extract video ID from URL
  const idMatch = url.match(/\/video\/(\d+)/);
  if (!idMatch) throw new Error('Could not extract video ID from smotrim.ru URL');
  const videoId = idMatch[1];

  let videoData = null;
  let m3u8Url = null;
  let mp4Url = null;

  // Strategy 1: Try the main API first
  try {
    const mainApiUrl = `${SITES['smotrim'].apiBase}/video/${videoId}`;
    log('Trying main API:', mainApiUrl);
    const mainData = await fetchJson(mainApiUrl);

    if (mainData?.data) {
      videoData = mainData.data;
      // Check for stream URLs in main API response
      if (videoData.sources) {
        m3u8Url = videoData.sources.m3u8 || videoData.sources.hls || null;
        mp4Url = videoData.sources.mp4 || null;
      }
      log('Got metadata from main API');
    }
  } catch (e) {
    log('Main API failed:', e.message);
  }

  // Strategy 2: Use player API for stream URLs (more reliable for streams)
  try {
    const playerApiUrl = `${SITES['smotrim'].playerApi}/${videoId}`;
    log('Trying player API:', playerApiUrl);
    const playerData = await fetchJson(playerApiUrl);

    if (playerData?.data) {
      // Use player data for metadata if main API failed
      if (!videoData) {
        videoData = playerData.data;
      }

      // Get stream URLs from player API (priority)
      const playlist = playerData.data.playlist?.medialist;
      if (playlist && playlist.length > 0) {
        // Get highest quality version (last in list)
        const media = playlist[playlist.length - 1];
        if (media.sources) {
          m3u8Url = media.sources.m3u8 || m3u8Url;
          mp4Url = media.sources.mp4 || mp4Url;
        }
      }
      log('Got stream URLs from player API');
    }
  } catch (e) {
    log('Player API failed:', e.message);
  }

  if (!videoData) {
    throw new Error('Could not fetch video data from Smotrim APIs');
  }

  const title = videoData.title || videoData.episodeTitle || 'Unknown';
  const description = videoData.anons || videoData.description || null;
  const duration = videoData.duration || null;
  const program = videoData.brandTitle || null;

  // Infer category and detect content type/level
  const inferredCategory = inferCategory(title + ' ' + (description || ''), url);
  const metadata = { title, description, url, duration, program };
  const contentType = detectContentType(metadata);
  metadata.contentType = contentType;
  metadata.category = inferredCategory;
  const pedagogicalLevel = estimatePedagogicalLevel(metadata);

  return {
    source: 'smotrim',
    sourceUrl: url,
    videoId,
    title,
    description,
    thumbnail: videoData.picture || videoData.preview || null,
    publishDate: videoData.datePublished || videoData.date || null,
    duration,
    program,
    category: inferredCategory,
    categories: inferredCategory ? [inferredCategory] : null,
    contentType,
    pedagogicalLevel,
    m3u8Url,
    mp4Url,
    streamType: m3u8Url ? 'hls' : (mp4Url ? 'mp4' : null),
  };
}

// --- RT.COM ---

async function discoverRt(sourceKey, maxItems = 20) {
  const site = SITES['rt'];
  const source = site.sources[sourceKey];
  if (!source) throw new Error(`Unknown RT source: ${sourceKey}`);

  log('Discovering from RT:', sourceKey);

  // Always use Rutube channel for RT (RSS feed returns text articles, not videos)
  if (site.usesRutube && site.rutubeChannelId) {
    log('Using RT Rutube channel for video content');
    return discoverRutubeChannel('rt', sourceKey, maxItems);
  }

  const results = [];

  // Strategy 1: Use RSS feeds (for text news - fallback only)
  const rssFeed = site.rssFeeds[sourceKey] || site.rssFeeds.news;
  if (rssFeed) {
    try {
      log('Fetching RSS feed:', rssFeed);
      const response = await fetchWithHeaders(rssFeed, {
        headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
      });

      if (response.ok) {
        const xml = await response.text();

        // Parse RSS items
        const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);

        for (const itemMatch of itemMatches) {
          const itemXml = itemMatch[1];

          // Extract fields from RSS item
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
          const linkMatch = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>|<link>(.*?)<\/link>/i);
          const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i);
          const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
          const mediaMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          const thumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);

          const url = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : null;
          if (url && (url.includes('rt.com') || url.includes('russian.rt.com'))) {
            const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : null;
            const description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : null;

            // Infer category from title and description instead of using hardcoded categories
            const inferredCategory = inferCategory((title || '') + ' ' + (description || ''), url);

            // Detect content type and pedagogical level
            const metadata = { title, description, url, duration: null, category: inferredCategory };
            const contentType = detectContentType(metadata);
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);

            results.push({
              url,
              source: 'rt',
              sourceKey,
              title,
              description,
              publishDate: dateMatch ? dateMatch[1].trim() : null,
              thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
              mediaUrl: mediaMatch ? mediaMatch[1] : null,
              category: inferredCategory,
              categories: inferredCategory ? [inferredCategory] : source.categories || [],
              contentType,
              pedagogicalLevel,
            });
          }

          if (results.length >= maxItems) break;
        }
        log('Found', results.length, 'items from RSS');
      }
    } catch (e) {
      log('RSS feed error:', e.message);
    }
  }

  // Strategy 2: Scrape the video section page for actual video content
  if (results.length < maxItems) {
    try {
      const videoPageUrl = 'https://russian.rt.com/nnn/video';
      log('Trying RT video page scrape:', videoPageUrl);
      const response = await fetchWithHeaders(videoPageUrl);

      if (response.ok) {
        const html = await response.text();

        // Look for video links (contain /video/ in path)
        const linkMatches = html.matchAll(/href=["']((?:https?:\/\/russian\.rt\.com)?\/[^"']*\/video\/[^"']+)["']/gi);
        const seen = new Set();

        for (const match of linkMatches) {
          let url = match[1];
          if (!url.startsWith('http')) {
            url = 'https://russian.rt.com' + url;
          }

          // Skip duplicates and generic video page links
          if (seen.has(url) || url === 'https://russian.rt.com/video') continue;
          seen.add(url);

          // Extract title from URL path
          const pathMatch = url.match(/\/video\/(\d+)-(.+)$/);
          const videoId = pathMatch ? pathMatch[1] : null;
          const slugTitle = pathMatch ? pathMatch[2].replace(/-/g, ' ') : null;

          // Infer category from URL path
          const urlCategory = inferCategory(slugTitle || url, url);

          // Detect content type and pedagogical level
          const metadata = { title: slugTitle, description: null, url, duration: null, category: urlCategory };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'rt',
            sourceKey,
            videoId,
            title: slugTitle,
            category: urlCategory,
            categories: urlCategory ? [urlCategory] : source.categories,
            contentType,
            pedagogicalLevel,
          });

          if (results.length >= maxItems) break;
        }
        log('Found', results.length, 'video items from RT');
      }
    } catch (e) {
      log('RT video page scrape error:', e.message);
    }
  }

  return results.slice(0, maxItems);
}

async function extractRt(url) {
  log('Extracting from rt.com:', url);
  const response = await fetchWithHeaders(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  const og = extractOpenGraph(html);
  const jsonLd = extractJsonLd(html);

  // RT uses MP4 via JW Player, not HLS
  let mp4Url = null;
  let m3u8Url = null;

  // Look for MP4 URL in JW Player config (primary method)
  const mp4Patterns = [
    /file:\s*["']([^"']+\.mp4[^"']*)["']/i,
    /src:\s*["']([^"']+\.mp4[^"']*)["']/i,
    /"file":\s*"([^"]+\.mp4[^"]*)"/i,
    /https?:\/\/[^"'\s]+mf\.b37mrtl\.ru[^"'\s]+\.mp4/gi,
    /https?:\/\/[^"'\s]+cdn[^"'\s]+\.mp4/gi,
  ];

  for (const pattern of mp4Patterns) {
    const match = html.match(pattern);
    if (match) {
      mp4Url = match[1] || match[0];
      mp4Url = mp4Url.replace(/\\\//g, '/');
      log('Found MP4 URL:', mp4Url);
      break;
    }
  }

  // Fallback: Look for m3u8 (less common for RT)
  if (!mp4Url) {
    const m3u8Match = html.match(/(?:file|src):\s*["']([^"']+\.m3u8[^"']*)["']/i);
    if (m3u8Match) {
      m3u8Url = m3u8Match[1].replace(/\\\//g, '/');
      log('Found m3u8 URL:', m3u8Url);
    }
  }

  // Extract duration from JSON-LD
  let duration = null;
  if (jsonLd?.duration) {
    const match = jsonLd.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      duration = (parseInt(match[1] || 0) * 3600) +
                 (parseInt(match[2] || 0) * 60) +
                 parseInt(match[3] || 0);
    }
  }

  const title = og.title || (jsonLd?.name) || (jsonLd?.headline) || 'Unknown';
  const description = og.description || (jsonLd?.description) || null;

  // Infer category and detect content type/level
  const inferredCategory = inferCategory(title + ' ' + (description || ''), url);
  const metadata = { title, description, url, duration };
  const contentType = detectContentType(metadata);
  metadata.contentType = contentType;
  metadata.category = inferredCategory;
  const pedagogicalLevel = estimatePedagogicalLevel(metadata);

  return {
    source: 'rt',
    sourceUrl: url,
    title,
    description,
    thumbnail: og.image || (jsonLd?.thumbnailUrl) || null,
    publishDate: jsonLd?.datePublished || null,
    duration,
    category: inferredCategory,
    categories: inferredCategory ? [inferredCategory] : null,
    contentType,
    pedagogicalLevel,
    mp4Url,
    m3u8Url,
    streamType: mp4Url ? 'mp4' : (m3u8Url ? 'hls' : null),
  };
}

function getRtLiveStream(channel = 'news') {
  const streams = SITES.rt.liveStreams;
  return streams[channel] || streams.news;
}

// --- RUTUBE ---

async function extractRutube(url) {
  log('Extracting from rutube:', url);

  // Extract video ID
  const idMatch = url.match(/(?:video|embed)\/([a-f0-9]{32})/i);
  if (!idMatch) throw new Error('Could not extract Rutube video ID');
  const videoId = idMatch[1];

  // Fetch video metadata
  const metaUrl = `https://rutube.ru/api/video/${videoId}/?format=json`;
  const meta = await fetchJson(metaUrl);

  // Check for geo-restrictions in metadata
  const restrictions = meta.restrictions?.country;
  const isRestricted = restrictions?.restricted && restrictions.restricted.length > 10;
  if (isRestricted) {
    log('Video is geo-restricted in most countries');
    return {
      source: 'rutube',
      sourceUrl: url,
      title: meta.title || 'Unknown',
      description: meta.description || null,
      thumbnail: meta.thumbnail_url || null,
      publishDate: meta.created_ts || null,
      duration: meta.duration || null,
      m3u8Url: null,
      streamType: 'hls',
      restricted: true,
      restrictionMessage: 'Видео недоступно по решению правообладателя (geo-restricted)',
    };
  }

  // Fetch play options for stream URL
  const playUrl = `https://rutube.ru/api/play/options/${videoId}/?format=json`;
  let m3u8Url = null;
  let restricted = false;
  let restrictionMessage = null;

  try {
    const playData = await fetchJson(playUrl);

    // Check if response indicates blocking
    if (playData.detail && playData.detail.type === 'blocking_rule') {
      restricted = true;
      restrictionMessage = playData.detail.languages?.[0]?.title || 'Video unavailable';
      log('Rutube video blocked:', restrictionMessage);
    } else if (playData.video_balancer) {
      m3u8Url = playData.video_balancer.m3u8 || playData.video_balancer.default;
    }
  } catch (e) {
    log('Could not fetch Rutube play options:', e.message);
    // Try to extract from embed page as fallback
    try {
      const embedUrl = `https://rutube.ru/play/embed/${videoId}/`;
      const embedResp = await fetchWithHeaders(embedUrl);
      const embedHtml = await embedResp.text();
      const m3u8Match = embedHtml.match(/["']([^"']*\.m3u8[^"']*?)["']/);
      if (m3u8Match) {
        m3u8Url = m3u8Match[1].replace(/\\u0026/g, '&');
        log('Found m3u8 from embed page');
      }
    } catch (embedErr) {
      log('Embed page fallback failed:', embedErr.message);
    }
  }

  return {
    source: 'rutube',
    sourceUrl: url,
    title: meta.title || 'Unknown',
    description: meta.description || null,
    thumbnail: meta.thumbnail_url || null,
    publishDate: meta.created_ts || null,
    duration: meta.duration || null,
    m3u8Url,
    streamType: 'hls',
    restricted,
    restrictionMessage,
  };
}

// Detect Rutube embed in a page (for iz.ru, kommersant.ru)
async function extractRutubeFromPage(url) {
  log('Looking for Rutube embed in:', url);
  const response = await fetchWithHeaders(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  // Look for Rutube iframe
  const embedMatch = html.match(/rutube\.ru\/(?:play\/)?embed\/([a-f0-9]{32})/i);
  if (embedMatch) {
    const rutubeUrl = `https://rutube.ru/video/${embedMatch[1]}`;
    return extractRutube(rutubeUrl);
  }

  throw new Error('No Rutube embed found on page');
}

async function discoverRutube(sourceKey, maxItems = 20) {
  const site = SITES['rutube'];
  const source = site.sources[sourceKey];
  if (!source) throw new Error(`Unknown Rutube source: ${sourceKey}`);

  log('Discovering from Rutube:', sourceKey, 'categoryId:', source.categoryId);
  const results = [];

  try {
    // Use Rutube's category API
    const apiUrl = `${site.apiBase}/video/category/${source.categoryId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching Rutube category API:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const videoId = item.id;
          if (videoId) {
            const title = item.title || null;
            const description = item.description || null;
            const url = `https://rutube.ru/video/${videoId}/`;
            const duration = item.duration || null;

            // Infer category from title and description
            const inferredCategory = inferCategory((title || '') + ' ' + (description || ''), url);
            const categories = inferredCategory ? [inferredCategory] : source.categories;

            // Detect content type and pedagogical level
            const metadata = { title, description, url, duration, category: inferredCategory };
            const contentType = detectContentType(metadata);
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);

            results.push({
              url,
              source: 'rutube',
              sourceKey,
              videoId,
              title,
              description,
              thumbnail: item.thumbnail_url || item.picture || null,
              publishDate: item.created_ts || item.publication_ts || null,
              duration,
              author: item.author?.name || null,
              category: inferredCategory,
              categories,
              contentType,
              pedagogicalLevel,
            });
          }
        }
        log('Found', results.length, 'videos from Rutube API');
      }
    } else {
      log('Rutube API returned:', response.status);
    }
  } catch (e) {
    log('Rutube API error:', e.message);
  }

  // Fallback: Try search API
  if (results.length === 0) {
    try {
      const searchTerms = {
        'news': 'новости',
        'politics': 'политика',
        'society': 'общество',
      };
      const query = searchTerms[sourceKey] || 'новости';
      const searchUrl = `${site.apiBase}/search/video/?query=${encodeURIComponent(query)}&format=json&page=1&page_size=${maxItems}`;

      log('Trying Rutube search API:', searchUrl);
      const response = await fetchWithHeaders(searchUrl);

      if (response.ok) {
        const data = await response.json();
        if (data?.results) {
          for (const item of data.results) {
            const title = item.title || null;
            const url = `https://rutube.ru/video/${item.id}/`;
            const duration = item.duration || null;

            // Infer category from title
            const inferredCategory = inferCategory(title || '', url);
            const categories = inferredCategory ? [inferredCategory] : source.categories;

            // Detect content type and pedagogical level
            const metadata = { title, description: null, url, duration, category: inferredCategory };
            const contentType = detectContentType(metadata);
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);

            results.push({
              url,
              source: 'rutube',
              sourceKey,
              videoId: item.id,
              title,
              thumbnail: item.thumbnail_url || null,
              duration,
              category: inferredCategory,
              categories,
              contentType,
              pedagogicalLevel,
            });
          }
          log('Found', results.length, 'videos from search');
        }
      }
    } catch (e) {
      log('Search API error:', e.message);
    }
  }

  return results.slice(0, maxItems);
}

async function discoverIzvestia(sourceKey = 'video', maxItems = 20) {
  const site = SITES['izvestia'];
  const channelId = site.rutubeChannelId;

  log('Discovering from Izvestia via Rutube channel:', channelId);
  const results = [];

  try {
    // Use Rutube's person (channel) API directly
    // This bypasses iz.ru entirely (which has Cloudflare protection)
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching Rutube channel API:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const videoId = item.id;
          if (videoId) {
            const title = item.title || null;
            const description = item.description || null;
            const url = `https://rutube.ru/video/${videoId}/`;

            // Infer category from title and description
            const inferredCategory = inferCategory((title || '') + ' ' + (description || ''), url);
            const categories = inferredCategory ? [inferredCategory] : site.sources.video.categories;

            // Detect content type and pedagogical level
            const metadata = { title, description, url, duration: item.duration || null, category: inferredCategory };
            const contentType = detectContentType(metadata);
            const pedagogicalLevel = estimatePedagogicalLevel(metadata);

            results.push({
              url,
              source: 'izvestia',
              sourceKey,
              videoId,
              title,
              description,
              thumbnail: item.thumbnail_url || item.picture || null,
              publishDate: item.created_ts || item.publication_ts || null,
              duration: item.duration || null,
              // Include iz.ru reference for citation purposes
              izvestiaRef: true,
              category: inferredCategory,
              categories,
              contentType,
              pedagogicalLevel,
            });
          }
        }
        log('Found', results.length, 'videos from Izvestia Rutube channel');
      }
    } else {
      log('Rutube channel API returned:', response.status);
    }
  } catch (e) {
    log('Izvestia discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

// Extract from Izvestia - delegates to Rutube
async function extractIzvestia(url) {
  log('Extracting from Izvestia:', url);

  // If it's already a Rutube URL, extract directly
  if (url.includes('rutube.ru')) {
    const result = await extractRutube(url);
    result.source = 'izvestia';
    return result;
  }

  // Otherwise try to find Rutube embed on iz.ru page
  return extractRutubeFromPage(url);
}

// --- NTV.RU ---

async function discoverNtv(sourceKey = 'video', maxItems = 20) {
  log('Discovering from NTV:', sourceKey);
  const videoIds = [];

  // Strategy 1: Use sitemap for recent videos
  try {
    const sitemapUrl = SITES['ntv'].sitemap;
    log('Fetching NTV sitemap:', sitemapUrl);

    const response = await fetchWithHeaders(sitemapUrl, {
      headers: { 'Accept': 'application/xml, text/xml' }
    });

    if (response.ok) {
      const xml = await response.text();

      // Parse video URLs from sitemap
      const urlMatches = xml.matchAll(/<loc>(https?:\/\/(?:www\.)?ntv\.ru\/video\/(\d+)[^<]*)<\/loc>/gi);

      for (const match of urlMatches) {
        const videoId = match[2];
        videoIds.push(videoId);
        if (videoIds.length >= maxItems * 2) break; // Fetch extra for filtering
      }
      log('Found', videoIds.length, 'video IDs from NTV sitemap');
    }
  } catch (e) {
    log('NTV sitemap error:', e.message);
  }

  // Strategy 2: Scrape video listing page
  if (videoIds.length < maxItems * 2) {
    try {
      const source = SITES['ntv'].sources[sourceKey];
      if (source?.url) {
        const response = await fetchWithHeaders(source.url);

        if (response.ok) {
          const html = await response.text();

          // Extract video IDs from the page
          const videoMatches = html.matchAll(/href=["'](?:https?:\/\/(?:www\.)?ntv\.ru)?\/video\/(\d+)\/?["']/gi);

          for (const match of videoMatches) {
            const videoId = match[1];
            if (!videoIds.includes(videoId)) {
              videoIds.push(videoId);
            }
            if (videoIds.length >= maxItems * 2) break;
          }
          log('Found', videoIds.length, 'video IDs total from NTV');
        }
      }
    } catch (e) {
      log('NTV page scrape error:', e.message);
    }
  }

  // Strategy 3: Fetch metadata for videos in parallel (faster)
  // Limit to 10 to stay within timeout - better to return fewer than timeout
  const idsToFetch = videoIds.slice(0, Math.min(maxItems + 3, 10));

  const fetchMeta = async (videoId) => {
    try {
      const apiUrl = `${SITES['ntv'].xmlApi}${videoId}/`;
      const response = await fetchWithHeaders(apiUrl);

      if (response.ok) {
        const xml = await response.text();

        // Parse XML response - handles CDATA wrappers
        const extractCdata = (tag) => {
          const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([^<\\]]+)(?:\\]\\]>)?</${tag}>`));
          return match ? match[1].trim() : '';
        };

        const title = extractCdata('title');
        if (!title) return null;

        const description = extractCdata('description');
        const duration = parseInt(xml.match(/<totaltime>(\d+)<\/totaltime>/)?.[1] || '0');

        let thumbnail = '';
        const splashMatch = xml.match(/<splash>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/splash>/);
        if (splashMatch) {
          thumbnail = splashMatch[1].trim();
          if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
        }

        const url = `https://ntv.ru/video/${videoId}/`;
        const inferredCategory = inferCategory(title + ' ' + (description || ''), url);
        const categories = inferredCategory
          ? [inferredCategory]
          : (SITES['ntv'].sources[sourceKey]?.categories || ['politics', 'society']);

        const decodedTitle = decodeHtmlEntities(title);
        const decodedDesc = decodeHtmlEntities(description) || null;
        const metadata = { title: decodedTitle, description: decodedDesc, url, duration, category: inferredCategory };
        const contentType = detectContentType(metadata);
        const pedagogicalLevel = estimatePedagogicalLevel(metadata);

        return {
          url,
          source: 'ntv',
          sourceKey,
          videoId,
          title: decodedTitle,
          description: decodedDesc,
          thumbnail: thumbnail || null,
          duration,
          category: inferredCategory,
          categories,
          contentType,
          pedagogicalLevel,
        };
      }
    } catch (e) {
      log('NTV metadata fetch error for video', videoId, ':', e.message);
    }
    return null;
  };

  // Fetch all in parallel
  const metaResults = await Promise.all(idsToFetch.map(fetchMeta));
  const results = metaResults.filter(r => r !== null);

  log('Discovered', results.length, 'videos with metadata from NTV');
  return results.slice(0, maxItems);
}

async function extractNtv(url) {
  log('Extracting from NTV:', url);

  // Extract video ID from URL
  const idMatch = url.match(/\/video\/(\d+)/);
  if (!idMatch) throw new Error('Could not extract NTV video ID');
  const videoId = idMatch[1];

  // Use legacy XML API - most reliable method
  try {
    const apiUrl = `${SITES['ntv'].xmlApi}${videoId}/`;
    log('Fetching NTV XML API:', apiUrl);

    const response = await fetchWithHeaders(apiUrl);
    if (response.ok) {
      const xml = await response.text();

      // Parse XML response - handles CDATA wrappers
      const extractCdata = (tag) => {
        const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([^<\\]]+)(?:\\]\\]>)?</${tag}>`));
        return match ? match[1].trim() : '';
      };

      const title = extractCdata('title');
      const description = extractCdata('description');
      const duration = parseInt(xml.match(/<totaltime>(\d+)<\/totaltime>/)?.[1] || '0');
      const views = parseInt(xml.match(/<views>(\d+)<\/views>/)?.[1] || '0');

      // Thumbnail (splash field)
      let thumbnail = '';
      const splashMatch = xml.match(/<splash>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/splash>/);
      if (splashMatch) {
        thumbnail = splashMatch[1].trim();
        if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
      }

      // Extract MP4 URLs - both file (SD) and hifile (HD)
      let mp4Url = null;
      let mp4UrlHd = null;

      // Standard quality (file tag)
      const fileMatch = xml.match(/<file>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/file>/);
      if (fileMatch) {
        mp4Url = fileMatch[1].trim();
        if (mp4Url.startsWith('//')) mp4Url = 'https:' + mp4Url;
      }

      // HD quality (hifile tag)
      const hifileMatch = xml.match(/<hifile>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/hifile>/);
      if (hifileMatch) {
        mp4UrlHd = hifileMatch[1].trim();
        if (mp4UrlHd.startsWith('//')) mp4UrlHd = 'https:' + mp4UrlHd;
      }

      return {
        source: 'ntv',
        sourceUrl: url,
        videoId,
        title: decodeHtmlEntities(title),
        description: decodeHtmlEntities(description),
        thumbnail,
        duration,
        views,
        mp4Url: mp4UrlHd || mp4Url,
        mp4UrlSd: mp4Url,
        streamType: 'mp4',
      };
    }
  } catch (e) {
    log('NTV XML API error:', e.message);
  }

  // Fallback: Parse page for metadata
  try {
    const response = await fetchWithHeaders(url);
    if (response.ok) {
      const html = await response.text();
      const og = extractOpenGraph(html);
      const jsonLd = extractJsonLd(html);

      return {
        source: 'ntv',
        sourceUrl: url,
        videoId,
        title: og.title || (jsonLd?.name) || 'NTV Video',
        description: og.description || (jsonLd?.description) || null,
        thumbnail: og.image || null,
        duration: null,
        streamType: 'mp4',
      };
    }
  } catch (e) {
    log('NTV page parse error:', e.message);
  }

  throw new Error('Could not extract NTV video');
}

// --- RIA.RU (RIA Novosti) - REMOVED ---
// RIA Novosti removed - their Rutube videos have background music instead of spoken audio
// This makes the content unsuitable for language learning

// --- TASS (via Rutube) ---

async function discoverTass(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['tass'].rutubeChannelId;
  log('Discovering from TASS via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching TASS Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;

          // Infer SINGLE category from title and description
          const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url);
          const duration = item.duration || null;

          // Detect content type and pedagogical level
          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'tass',
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat,  // SINGLE inferred category
            categories: inferredCat ? [inferredCat] : SITES['tass'].sources[sourceKey]?.categories || ['politics', 'society'],
            contentType,
            pedagogicalLevel,
          });
        }
        log('Found', results.length, 'videos from TASS Rutube channel');
      }
    }
  } catch (e) {
    log('TASS discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

async function extractTass(url) {
  log('Extracting from TASS:', url);

  // TASS uses Rutube - delegate extraction
  if (url.includes('rutube.ru')) {
    const result = await extractRutube(url);
    result.source = 'tass';
    return result;
  }

  // If it's a tass.ru URL, look for Rutube embed
  try {
    const response = await fetchWithHeaders(url);
    if (response.ok) {
      const html = await response.text();

      // Look for Rutube embed
      const rutubeMatch = html.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i);
      if (rutubeMatch) {
        const result = await extractRutube(`https://rutube.ru/video/${rutubeMatch[1]}/`);
        result.source = 'tass';
        return result;
      }
    }
  } catch (e) {
    log('TASS page parse error:', e.message);
  }

  throw new Error('Could not extract TASS video - no Rutube embed found');
}

// --- KOMMERSANT - REMOVED ---
// Kommersant removed - videos don't match expected economy category well

// --- MCHS RUSSIA / EMERCOM (via Rutube) ---

async function discoverMchs(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['mchs'].rutubeChannelId;
  log('Discovering from MChS Russia via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching MChS Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;

          // MChS content is primarily weather/disaster/emergency related
          // Infer category, defaulting to 'weather' for emergency content
          let inferredCat = inferCategory((title || '') + ' ' + (description || ''), url);

          // If no category inferred, check for emergency/disaster keywords
          if (!inferredCat) {
            const text = ((title || '') + ' ' + (description || '')).toLowerCase();
            const emergencyKeywords = ['мчс', 'спасат', 'пожар', 'наводнен', 'стихи', 'бедстви',
                                       'ураган', 'шторм', 'землетряс', 'эвакуац', 'чрезвычайн'];
            if (emergencyKeywords.some(kw => text.includes(kw))) {
              inferredCat = 'weather';
            }
          }

          const duration = item.duration || null;

          // Detect content type and pedagogical level
          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'mchs',
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat || 'weather',  // Default to weather for MChS
            categories: inferredCat ? [inferredCat] : ['weather', 'society'],
            contentType,
            pedagogicalLevel,
          });
        }
        log('Found', results.length, 'videos from MChS Rutube channel');
      }
    }
  } catch (e) {
    log('MChS discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

async function extractMchs(url) {
  log('Extracting from MChS:', url);

  // MChS uses Rutube - delegate extraction
  if (url.includes('rutube.ru')) {
    const result = await extractRutube(url);
    result.source = 'mchs';
    return result;
  }

  // If it's a mchs.gov.ru URL, look for Rutube embed
  try {
    const response = await fetchWithHeaders(url);
    if (response.ok) {
      const html = await response.text();

      // Look for Rutube embed
      const rutubeMatch = html.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i);
      if (rutubeMatch) {
        const result = await extractRutube(`https://rutube.ru/video/${rutubeMatch[1]}/`);
        result.source = 'mchs';
        return result;
      }
    }
  } catch (e) {
    log('MChS page parse error:', e.message);
  }

  throw new Error('Could not extract MChS video - no Rutube embed found');
}

// ============================================================================
// UNIFIED EXTRACTION
// ============================================================================

function detectSite(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('1tv.ru')) return '1tv';
  if (urlLower.includes('smotrim.ru') || urlLower.includes('russia.tv') || urlLower.includes('vgtrk.ru')) return 'smotrim';
  if (urlLower.includes('rt.com') || urlLower.includes('rttv.com')) return 'rt';
  if (urlLower.includes('rutube.ru')) return 'rutube';
  if (urlLower.includes('iz.ru')) return 'izvestia';
  if (urlLower.includes('ntv.ru')) return 'ntv';
  if (urlLower.includes('ria.ru')) return 'ria';
  if (urlLower.includes('tass.ru') || urlLower.includes('tass.com')) return 'tass';
  if (urlLower.includes('kommersant.ru')) return 'kommersant';
  return null;
}

async function extractMetadata(url) {
  const site = detectSite(url);

  switch (site) {
    case '1tv':
      return extract1tv(url);
    case 'smotrim':
      return extractSmotrim(url);
    case 'rt':
      return extractRt(url);
    case 'rutube':
      return extractRutube(url);
    case 'izvestia':
      return extractIzvestia(url);
    case 'ntv':
      return extractNtv(url);
    // case 'ria' removed - videos have music instead of audio
    case 'tass':
      return extractTass(url);
    // case 'kommersant' removed
    default:
      throw new Error(`Unsupported site: ${url}`);
  }
}

// ============================================================================
// AUDIO EXTRACTION
// ============================================================================

async function extractAudio(videoUrl) {
  log('Starting audio extraction for:', videoUrl);

  // First get metadata to find stream URL
  const meta = await extractMetadata(videoUrl);

  // Generate filename from title
  const safeTitle = (meta.title || 'audio')
    .replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
    .substring(0, 50);

  // Handle MP4 sources (RT uses MP4)
  if (meta.mp4Url && !meta.m3u8Url) {
    log('Found MP4 source:', meta.mp4Url);

    // For MP4, we return the URL for client-side download
    // (Full MP4 extraction is too heavy for Workers)
    return {
      streamUrl: meta.mp4Url,
      streamType: 'mp4',
      filename: `${safeTitle}.mp4`,
      metadata: meta,
      message: 'MP4 stream URL provided for download'
    };
  }

  // Check if video is geo-restricted
  if (meta.restricted) {
    throw new Error(meta.restrictionMessage || 'Video is geo-restricted and unavailable');
  }

  if (!meta.m3u8Url) {
    throw new Error('No stream URL found for this video');
  }

  // Normalize m3u8Url - handle cases where it's an object like {auto: "..."}
  let m3u8Url = meta.m3u8Url;
  if (typeof m3u8Url === 'object' && m3u8Url !== null) {
    m3u8Url = m3u8Url.auto || m3u8Url.hls || m3u8Url.default || Object.values(m3u8Url)[0];
  }
  if (!m3u8Url || typeof m3u8Url !== 'string') {
    throw new Error('Invalid m3u8 URL format');
  }

  log('Found m3u8:', m3u8Url);

  // Fetch m3u8 playlist
  const m3u8Response = await fetchWithHeaders(m3u8Url);
  if (!m3u8Response.ok) throw new Error(`Failed to fetch m3u8: ${m3u8Response.status}`);
  const m3u8Content = await m3u8Response.text();

  // Use the final URL after redirects as base URL for resolving relative paths
  const finalM3u8Url = m3u8Response.url || m3u8Url;
  log('Final m3u8 URL after redirect:', finalM3u8Url);

  const playlist = parseM3u8(m3u8Content, finalM3u8Url);

  // If master playlist, get first variant
  let segmentPlaylist = playlist;
  if (playlist.isMaster && playlist.variants.length > 0) {
    // Sort by bandwidth, get lowest for faster processing
    const sorted = playlist.variants.sort((a, b) => a.bandwidth - b.bandwidth);
    const variantUrl = sorted[0].url;
    log('Fetching variant playlist:', variantUrl);

    const variantResponse = await fetchWithHeaders(variantUrl);
    if (!variantResponse.ok) throw new Error(`Failed to fetch variant: ${variantResponse.status}`);
    const variantContent = await variantResponse.text();
    // Use final URL after any redirects
    const finalVariantUrl = variantResponse.url || variantUrl;
    segmentPlaylist = parseM3u8(variantContent, finalVariantUrl);
  }

  if (segmentPlaylist.segments.length === 0) {
    throw new Error('No segments found in playlist');
  }

  // Fetch and process segments (limit to prevent timeout)
  const segmentsToProcess = segmentPlaylist.segments.slice(0, CONFIG.maxSegments);
  log('Processing', segmentsToProcess.length, 'segments');

  const allAudioFrames = [];

  for (const segment of segmentsToProcess) {
    try {
      log('Fetching segment:', segment.url);
      const segResponse = await fetch(segment.url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!segResponse.ok) {
        log('Segment fetch failed:', segResponse.status);
        continue;
      }

      const segData = new Uint8Array(await segResponse.arrayBuffer());
      if (segData.length > CONFIG.maxSegmentSize) {
        log('Segment too large, skipping');
        continue;
      }

      const frames = demuxTsAudio(segData);
      allAudioFrames.push(...frames);
    } catch (e) {
      log('Error processing segment:', e.message);
    }
  }

  if (allAudioFrames.length === 0) {
    throw new Error('No audio data could be extracted');
  }

  const audioData = combineAudioFrames(allAudioFrames);
  log('Total audio size:', audioData.length, 'bytes');

  const filename = `${safeTitle}.aac`;

  return { audioData, filename, metadata: meta };
}

// ============================================================================
// API HANDLERS
// ============================================================================

async function handleSources() {
  const sources = [];

  for (const [siteId, site] of Object.entries(SITES)) {
    if (site.sources) {
      for (const [sourceId, source] of Object.entries(site.sources)) {
        sources.push({
          id: `${siteId}:${sourceId}`,
          site: siteId,
          siteName: site.name,
          siteNameRu: site.nameRu,
          url: source.url,
          categories: source.categories,
        });
      }
    }
    if (site.liveStreams) {
      for (const [streamId, streamUrl] of Object.entries(site.liveStreams)) {
        sources.push({
          id: `${siteId}:live:${streamId}`,
          site: siteId,
          siteName: site.name,
          siteNameRu: site.nameRu,
          url: streamUrl,
          isLive: true,
          categories: ['politics', 'world'],
        });
      }
    }
  }

  return jsonResponse({
    success: true,
    categories: CATEGORIES,
    sources,
  });
}

// ============================================================================
// SPECIALIZED SOURCE DISCOVERY FUNCTIONS
// ============================================================================

// Match TV - Sports content via Rutube channel
async function discoverMatchtv(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['matchtv'].rutubeChannelId;
  log('Discovering from Match TV via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching Match TV Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;
          const duration = item.duration || null;

          // Sports is the primary category for Match TV
          const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url) || 'sports';

          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'matchtv',
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat,
            categories: inferredCat ? [inferredCat] : ['sports'],
            contentType,
            pedagogicalLevel,
          });
        }
        log('Found', results.length, 'videos from Match TV Rutube channel');
      }
    }
  } catch (e) {
    log('Match TV discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

// RBC - Economics/Business content via Rutube channel
async function discoverRbc(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['rbc'].rutubeChannelId;
  log('Discovering from RBC via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching RBC Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;
          const duration = item.duration || null;

          // Economy is the primary category for RBC
          const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url) || 'economy';

          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'rbc',
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat,
            categories: inferredCat ? [inferredCat] : ['economy', 'politics'],
            contentType,
            pedagogicalLevel,
          });
        }
        log('Found', results.length, 'videos from RBC Rutube channel');
      }
    }
  } catch (e) {
    log('RBC discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

// Nauka TV - Science/Technology content via Rutube channel
async function discoverNaukatv(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['naukatv'].rutubeChannelId;
  log('Discovering from Nauka TV via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching Nauka TV Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;
          const duration = item.duration || null;

          // Science is the primary category for Nauka TV
          const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url) || 'science';

          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: 'naukatv',
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat,
            categories: inferredCat ? [inferredCat] : ['science', 'technology', 'education'],
            contentType,
            pedagogicalLevel,
          });
        }
        log('Found', results.length, 'videos from Nauka TV Rutube channel');
      }
    }
  } catch (e) {
    log('Nauka TV discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

// ============================================================================
// GENERIC RUTUBE CHANNEL DISCOVERY
// ============================================================================

/**
 * Generic function to discover videos from any Rutube channel.
 * Works for any site with usesRutube: true in SITES config.
 *
 * @param {string} siteId - The site ID from SITES config (e.g., 'bolshoi', 'travel-interesting')
 * @param {string} sourceKey - The source key (usually 'video')
 * @param {number} maxItems - Maximum items to return
 * @returns {Promise<Array>} Array of discovered video items
 */
async function discoverRutubeChannel(siteId, sourceKey = 'video', maxItems = 20) {
  const site = SITES[siteId];
  if (!site || !site.usesRutube || !site.rutubeChannelId) {
    log(`Invalid Rutube channel config for site: ${siteId}`);
    return [];
  }

  const channelId = site.rutubeChannelId;
  log(`Discovering from ${site.name} via Rutube channel:`, channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log(`Fetching ${siteId} Rutube channel:`, apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        // Get default categories from site config
        const sourceConfig = site.sources?.[sourceKey] || site.sources?.['video'] || {};
        const defaultCategories = sourceConfig.categories || [];
        const defaultCategory = defaultCategories[0] || null;

        for (const item of data.results) {
          const title = item.title || null;
          const description = item.description || null;
          const url = `https://rutube.ru/video/${item.id}/`;
          const duration = item.duration || null;

          // Infer category from content, fallback to site's default category
          const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url) || defaultCategory;

          const metadata = { title, description, url, duration, category: inferredCat };
          const contentType = detectContentType(metadata);
          const pedagogicalLevel = estimatePedagogicalLevel(metadata);

          results.push({
            url,
            source: siteId,
            sourceKey,
            videoId: item.id,
            title,
            description,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration,
            category: inferredCat,
            categories: inferredCat ? [inferredCat] : defaultCategories,
            contentType,
            pedagogicalLevel,
          });
        }
        log(`Found ${results.length} videos from ${site.name} Rutube channel`);
      }
    }
  } catch (e) {
    log(`${site.name} discovery error:`, e.message);
  }

  return results.slice(0, maxItems);
}

// Cache configuration - AGGRESSIVE to minimize CPU usage
// Cloudflare free tier has 10ms CPU limit, so we cache heavily
const CACHE_TTL = 30 * 60; // 30 minutes in seconds (for KV) - news doesn't change fast
const CACHE_TTL_MS = CACHE_TTL * 1000; // 30 minutes in milliseconds
const EDGE_CACHE_TTL = 20 * 60; // 20 minutes for edge/CDN cache (slightly shorter for fresher data)

// Source-level cache TTL (longer than request cache for efficiency)
const SOURCE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for source data - sources update slowly

// In-memory cache as first-level cache (fastest)
const memoryCache = new Map();

function getCacheKey(url) {
  // Create a normalized cache key from URL params
  const params = new URLSearchParams(url.search);
  const keys = ['source', 'sources', 'category', 'categories', 'max', 'max_items',
                'distribution', 'start_date', 'end_date', 'levels', 'content_types',
                'pedagogicalLevel', 'contentType'];
  const parts = keys.map(k => `${k}=${params.get(k) || ''}`).join('&');
  return 'discover:' + parts;
}

// Global KV reference (set in fetch handler)
let KV_CACHE = null;

// Helper to cache response to Cloudflare Edge (CDN)
async function cacheToEdge(cache, cacheKey, response) {
  try {
    // Clone response and add cache-control headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${EDGE_CACHE_TTL}, s-maxage=${EDGE_CACHE_TTL}`);
    headers.set('CDN-Cache-Control', `max-age=${EDGE_CACHE_TTL}`);
    headers.set('Vary', 'Accept-Encoding');

    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

    await cache.put(cacheKey, cachedResponse);
    log('Stored in edge cache');
  } catch (e) {
    log('Edge cache write error:', e.message);
  }
}

async function handleDiscover(url, request) {
  const cacheKey = getCacheKey(url);
  const skipCache = url.searchParams.get('nocache') === 'true' || url.searchParams.get('refresh') === 'true';

  // Level 0: Check Cloudflare Edge Cache (CDN-level, runs BEFORE worker CPU)
  // This is the most important cache layer - it prevents worker execution entirely
  const cache = caches.default;
  const edgeCacheKey = new Request(url.toString(), { method: 'GET' });

  // Helper to validate cached response (don't serve empty results from cache)
  const isValidCachedResponse = (data) => {
    if (!data) return false;
    // If the cached response has 0 items, consider it invalid and refetch
    if (data.total === 0 || (data.items && data.items.length === 0)) return false;
    return true;
  };

  if (!skipCache) {
    try {
      const edgeCached = await cache.match(edgeCacheKey);
      if (edgeCached) {
        // For edge cache, we can't easily inspect content, so just return it
        // Edge cache has shorter TTL (20 min) so stale data clears faster
        log('Edge cache hit - zero CPU');
        return edgeCached;
      }
    } catch (e) {
      log('Edge cache check error:', e.message);
    }

    // Level 1: Check in-memory cache (instant, minimal CPU)
    const memCached = memoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < CACHE_TTL_MS) {
      if (isValidCachedResponse(memCached.data)) {
        log('Memory cache hit - items:', memCached.data?.total || 0);
        const response = jsonResponse({ ...memCached.data, cached: 'memory' });
        cacheToEdge(cache, edgeCacheKey, response.clone());
        return response;
      } else {
        log('Memory cache invalid (empty results), refetching');
      }
    }

    // Level 2: Check KV cache (persistent, shared across workers)
    if (KV_CACHE) {
      try {
        const kvCached = await KV_CACHE.get(cacheKey, 'json');
        if (kvCached && isValidCachedResponse(kvCached)) {
          log('KV cache hit - items:', kvCached?.total || 0);
          memoryCache.set(cacheKey, { data: kvCached, timestamp: Date.now() });
          const response = jsonResponse({ ...kvCached, cached: 'kv' });
          cacheToEdge(cache, edgeCacheKey, response.clone());
          return response;
        } else if (kvCached) {
          log('KV cache invalid (empty results), refetching');
          // Delete the invalid cache entry
          await KV_CACHE.delete(cacheKey);
        }
      } catch (e) {
        log('KV cache error:', e.message);
      }
    }
  } else {
    log('Cache bypass requested');
  }

  // Clean memory cache if too large
  if (memoryCache.size > 50) {
    const now = Date.now();
    for (const [key, entry] of memoryCache) {
      if (now - entry.timestamp > CACHE_TTL_MS) memoryCache.delete(key);
    }
  }

  const sourceParam = url.searchParams.get('source');
  const category = url.searchParams.get('category'); // Legacy single category
  const categoriesParam = url.searchParams.get('categories'); // New: comma-separated
  const contentTypesParam = url.searchParams.get('content_types'); // New: comma-separated
  const levelsParam = url.searchParams.get('levels'); // New: comma-separated
  const distribution = url.searchParams.get('distribution') || 'even'; // New: even|weighted
  const maxItems = parseInt(url.searchParams.get('max') || url.searchParams.get('max_items') || url.searchParams.get('maxResults') || '20');
  const sourcesParam = url.searchParams.get('sources'); // Comma-separated sources

  // Parse date range filters
  const startDateParam = url.searchParams.get('start_date');
  const endDateParam = url.searchParams.get('end_date');

  // Convert to Date objects for comparison
  let startDate = null;
  let endDate = null;
  if (startDateParam) {
    startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
  }
  if (endDateParam) {
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  }

  const results = [];
  const errors = [];

  // Feedback tracking - what was requested vs what was delivered
  const feedback = {
    request: {
      categories: null,
      dateRange: null,
      contentTypes: null,
      pedagogicalLevels: null,
      maxItems: maxItems,
    },
    delivered: {
      categories: {},
      dateRange: null,
      contentTypes: {},
      pedagogicalLevels: {},
      totalItems: 0,
    },
    adjustments: [],
    sourcesUsed: [],
  };

  // Parse filter arrays
  // Support both ?category=politics,economy and ?categories=politics,economy
  let requestedCategories = [];
  if (categoriesParam) {
    requestedCategories = categoriesParam.split(',').map(c => c.trim().toLowerCase()).filter(c => c);
  } else if (category) {
    // Also split single category param on comma for convenience
    requestedCategories = category.split(',').map(c => c.trim().toLowerCase()).filter(c => c);
  }
  feedback.request.categories = requestedCategories.length > 0 ? requestedCategories : null;
  log('Requested categories:', requestedCategories);

  let requestedContentTypes = [];
  if (contentTypesParam) {
    requestedContentTypes = contentTypesParam.split(',').map(c => c.trim().toLowerCase());
  }
  feedback.request.contentTypes = requestedContentTypes.length > 0 ? requestedContentTypes : null;

  let requestedLevels = [];
  if (levelsParam) {
    requestedLevels = levelsParam.split(',').map(l => l.trim().toLowerCase());
  }
  feedback.request.pedagogicalLevels = requestedLevels.length > 0 ? requestedLevels : null;

  // Track date range request
  if (startDateParam || endDateParam) {
    feedback.request.dateRange = {
      start: startDateParam || null,
      end: endDateParam || null,
    };
  }

  // Parse sources to discover from
  let sourcesToDiscover = [];

  // Map generic sources to category-specific sources when categories are selected
  const CATEGORY_SOURCE_KEYS = {
    '1tv': { economy: '1tv:economy', politics: '1tv:politics', sports: '1tv:sports', culture: '1tv:culture', world: '1tv:world', society: '1tv:society' },
    'rt': { politics: 'rt:russia', world: 'rt:world', economy: 'rt:business', sports: 'rt:sport' },
    'smotrim': { culture: 'smotrim:culture-news', economy: 'smotrim:russia24', politics: 'smotrim:news' },
    // Rutube-based sources - use video endpoint (they have general content, filtering happens later)
    'tass': { economy: 'tass:video', politics: 'tass:video', world: 'tass:video', military: 'tass:video' },
    // 'kommersant' removed
    // RIA removed - videos have music instead of audio
    'ntv': { economy: 'ntv:video', politics: 'ntv:video', society: 'ntv:video' },
    'izvestia': { economy: 'izvestia:video', politics: 'izvestia:video', society: 'izvestia:video' },
  };

  const mapSourceToCategory = (source) => {
    if (source.includes(':')) return source; // Already has source key
    if (requestedCategories.length === 0) return source + ':news'; // No category filter

    const sourceMap = CATEGORY_SOURCE_KEYS[source.toLowerCase()];
    if (sourceMap) {
      // Find first matching category
      for (const cat of requestedCategories) {
        if (sourceMap[cat]) {
          log(`Mapping ${source} + ${cat} → ${sourceMap[cat]}`);
          return sourceMap[cat];
        }
      }
    }
    return source + ':news'; // Default to news
  };

  if (sourceParam) {
    // Single source specified
    sourcesToDiscover.push(mapSourceToCategory(sourceParam));
  } else if (sourcesParam) {
    // Multiple sources specified - map each to category-specific source
    sourcesToDiscover = sourcesParam.split(',').map(s => mapSourceToCategory(s.trim()));
  } else {
    // Smart source selection based on requested categories
    // Use specialized sources for specific categories, general sources for mixed queries
    const hasSpecializedCategory = requestedCategories.some(cat =>
      ['sports', 'economy', 'science', 'technology', 'culture', 'tourism', 'weather', 'education', 'society', 'military', 'world', 'politics'].includes(cat)
    );

    if (requestedCategories.length > 0 && hasSpecializedCategory) {
      // Use targeted sources for specific categories
      // IMPORTANT: Ensure each category gets at least one source before limiting
      // Group sources by their originating category
      const sourcesByCategory = {};
      let tempSources = [];
      for (const cat of requestedCategories) {
        sourcesByCategory[cat] = [];
        switch (cat) {
          case 'sports':
            sourcesByCategory[cat] = ['matchtv:video', 'khl:video', 'rfs:video', 'zenit:video', 'sport-marathon:video', 'rutube:sports', '1tv:sports'];
            break;
          case 'economy':
            sourcesByCategory[cat] = ['rbc:video', '1tv:economy'];
            break;
          case 'science': case 'technology':
            sourcesByCategory[cat] = ['naukatv:video', 'bauman:video', 'spbgu:video', 'rutube:science', 'rt:news'];
            break;
          case 'culture':
            sourcesByCategory[cat] = ['bolshoi:video', 'mosfilm:video', 'mariinsky:video', 'tretyakov:video', 'mmdm:video', 'digital-history:video', 'culture-rf:video', 'gorky-lit:video', 'kultura-tv:video', 'rtd:video', 'rutube:culture', '1tv:culture', 'smotrim:culture-news'];
            break;
          case 'tourism':
            sourcesByCategory[cat] = ['travel-interesting:video', 'family-travel:video', 'journey-countries:video', 'sport-marathon:video', 'smotrim:news'];
            break;
          case 'weather':
            sourcesByCategory[cat] = ['mchs:video', '1tv:news', 'rt:news'];
            break;
          case 'politics':
            sourcesByCategory[cat] = ['1tv:politics', 'rt:news', 'tass:video'];
            break;
          case 'military':
            sourcesByCategory[cat] = ['1tv:news', 'rt:news', 'ria:video'];
            break;
          case 'world':
            sourcesByCategory[cat] = ['rt:world', '1tv:world', 'tass:video', 'rtd:video'];
            break;
          case 'society':
            sourcesByCategory[cat] = ['recipes:video', 'parenting:video', 'health-school:video', 'dr-evdokimenko:video', 'kitchen-studio:video', 'rospotrebnadzor:video', 'smotrim:news', '1tv:society', 'izvestia:video'];
            break;
          case 'education':
            sourcesByCategory[cat] = ['edu-tv:video', 'infourok:video', 'spbgu:video', 'pushkin-institute:video', 'bauman:video', 'digital-history:video', 'tretyakov:video', 'rutube:science', 'smotrim:news'];
            break;
          default:
            sourcesByCategory[cat] = ['1tv:news', 'rt:news'];
            break;
        }
      }

      // First pass: take one source from each category (ensures coverage)
      const usedSources = new Set();
      for (const cat of requestedCategories) {
        for (const src of sourcesByCategory[cat]) {
          if (!usedSources.has(src)) {
            tempSources.push(src);
            usedSources.add(src);
            break;
          }
        }
      }

      // Second pass: add more sources up to limit
      // Single category: max 2 sources for speed, multi-category: max 4 sources
      const maxSources = requestedCategories.length === 1 ? 2 : 4;
      for (const cat of requestedCategories) {
        if (tempSources.length >= maxSources) break;
        for (const src of sourcesByCategory[cat]) {
          if (!usedSources.has(src) && tempSources.length < maxSources) {
            tempSources.push(src);
            usedSources.add(src);
          }
        }
      }

      sourcesToDiscover = tempSources;
      log('Category-targeted sources (balanced):', requestedCategories, '→', sourcesToDiscover);

    } else {
      // Default: discover from main sources (general query - limited to 4 for performance)
      sourcesToDiscover = [
        '1tv:news', 'rt:news', 'tass:video'
      ];
    }
  }

  // Final safety limit - max 4 sources to prevent CPU timeout
  // With shorter timeouts per source (3s) and parallel fetching, 4 sources is safe
  if (sourcesToDiscover.length > 4) {
    log('Final limiting sources from', sourcesToDiscover.length, 'to 4');
    sourcesToDiscover = sourcesToDiscover.slice(0, 4);
  }

  // Check if date range is "historical" (more than 3 days ago)
  // RSS feeds only have recent content, but 1tv sitemap and Rutube channels have archives
  const isHistoricalSearch = startDate && (Date.now() - startDate.getTime()) > 3 * 24 * 60 * 60 * 1000;

  if (isHistoricalSearch) {
    log('Historical date range detected, prioritizing archive sources');
    // Prioritize sources with historical data: 1tv (sitemap), all Rutube-based channels
    const archiveSources = [
      '1tv', 'tass', 'kommersant', 'izvestia', 'mchs', 'rutube', 'matchtv', 'rbc', 'naukatv',
      // Sports channels
      'rfs', 'zenit', 'khl', 'sport-marathon',
      // Culture channels
      'bolshoi', 'mariinsky', 'tretyakov', 'mosfilm', 'rtd', 'kultura-tv', 'culture-rf', 'digital-history', 'gorky-lit', 'mmdm',
      // Education channels
      'edu-tv', 'spbgu', 'bauman', 'infourok', 'pushkin-institute',
      // Tourism channels
      'travel-interesting', 'family-travel', 'journey-countries',
      // Society/Lifestyle channels
      'recipes', 'kitchen-studio', 'dr-evdokimenko', 'health-school', 'parenting', 'rospotrebnadzor',
      // Other Rutube-based
      'ria', 'ntv'
    ];
    // Move archive sources to front
    sourcesToDiscover.sort((a, b) => {
      const aIsArchive = archiveSources.some(s => a.startsWith(s));
      const bIsArchive = archiveSources.some(s => b.startsWith(s));
      if (aIsArchive && !bIsArchive) return -1;
      if (!aIsArchive && bIsArchive) return 1;
      return 0;
    });
    // Add 1tv:news if not already present (has best historical coverage via sitemap)
    if (!sourcesToDiscover.some(s => s.startsWith('1tv'))) {
      sourcesToDiscover.unshift('1tv:news');
      if (sourcesToDiscover.length > 2) sourcesToDiscover = sourcesToDiscover.slice(0, 2);
    }
    log('Reordered sources for historical search:', sourcesToDiscover);
  }

  // Calculate items per source (fetch extra for filtering headroom)
  // When date filtering is applied, fetch more since many items will be filtered out
  const hasDateFilter = startDate || endDate;
  const dateFilterMultiplier = hasDateFilter ? 2 : 1; // Double fetch when date filtering
  const categoryMultiplier = requestedCategories.length > 1 ? 2 : 1.5;
  const itemsPerSource = Math.min(hasDateFilter ? 15 : 8, Math.max(5, Math.ceil((maxItems * categoryMultiplier * dateFilterMultiplier) / sourcesToDiscover.length)));

  // Helper: fetch with timeout to prevent slow sources from blocking
  // Use 3 second timeout to stay under Cloudflare CPU limits
  const fetchWithTimeout = async (fetchFn, timeoutMs = 3000) => {
    return Promise.race([
      fetchFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Source fetch timeout')), timeoutMs)
      )
    ]).catch(e => {
      log('Source timed out or errored:', e.message);
      return []; // Return empty array on timeout, don't block other sources
    });
  };

  // Discover from each source (with SOURCE-LEVEL caching + timeout protection)
  // Each source caches up to 20 items (or more for historical searches)
  // Historical searches need more items since many will be filtered out by date
  // REDUCED to save CPU time - fetch fewer items per source
  const SOURCE_FETCH_SIZE = isHistoricalSearch ? 30 : 15;

  for (const source of sourcesToDiscover) {
    const [siteId, sourceId] = source.split(':');
    const cacheSourceKey = `${siteId}:${sourceId || 'default'}`;

    try {
      let items = [];

      // Map site IDs to their discover functions
      const discoverFunctions = {
        // Major news networks (custom discover functions)
        '1tv': () => discover1tv(sourceId || 'news', SOURCE_FETCH_SIZE),
        'smotrim': () => discoverSmotrim(sourceId || 'news', SOURCE_FETCH_SIZE),
        'rt': () => discoverRt(sourceId || 'news', SOURCE_FETCH_SIZE),
        'rutube': () => discoverRutube(sourceId || 'news', SOURCE_FETCH_SIZE),
        'izvestia': () => discoverIzvestia(sourceId || 'video', SOURCE_FETCH_SIZE),
        'ntv': () => discoverNtv(sourceId || 'video', SOURCE_FETCH_SIZE),
        // 'ria' removed - videos have music instead of audio
        'tass': () => discoverTass(sourceId || 'video', SOURCE_FETCH_SIZE),
        // 'kommersant' removed
        'matchtv': () => discoverMatchtv(sourceId || 'video', SOURCE_FETCH_SIZE),
        'rbc': () => discoverRbc(sourceId || 'video', SOURCE_FETCH_SIZE),
        'naukatv': () => discoverNaukatv(sourceId || 'video', SOURCE_FETCH_SIZE),
        'mchs': () => discoverMchs(sourceId || 'video', SOURCE_FETCH_SIZE),

        // Sports channels (via generic Rutube discovery)
        'rfs': () => discoverRutubeChannel('rfs', sourceId || 'video', SOURCE_FETCH_SIZE),
        'zenit': () => discoverRutubeChannel('zenit', sourceId || 'video', SOURCE_FETCH_SIZE),
        'khl': () => discoverRutubeChannel('khl', sourceId || 'video', SOURCE_FETCH_SIZE),
        'sport-marathon': () => discoverRutubeChannel('sport-marathon', sourceId || 'video', SOURCE_FETCH_SIZE),

        // Culture & Arts channels
        'bolshoi': () => discoverRutubeChannel('bolshoi', sourceId || 'video', SOURCE_FETCH_SIZE),
        'mariinsky': () => discoverRutubeChannel('mariinsky', sourceId || 'video', SOURCE_FETCH_SIZE),
        'tretyakov': () => discoverRutubeChannel('tretyakov', sourceId || 'video', SOURCE_FETCH_SIZE),
        'mosfilm': () => discoverRutubeChannel('mosfilm', sourceId || 'video', SOURCE_FETCH_SIZE),
        'rtd': () => discoverRutubeChannel('rtd', sourceId || 'video', SOURCE_FETCH_SIZE),
        'kultura-tv': () => discoverRutubeChannel('kultura-tv', sourceId || 'video', SOURCE_FETCH_SIZE),
        'culture-rf': () => discoverRutubeChannel('culture-rf', sourceId || 'video', SOURCE_FETCH_SIZE),
        'digital-history': () => discoverRutubeChannel('digital-history', sourceId || 'video', SOURCE_FETCH_SIZE),
        'gorky-lit': () => discoverRutubeChannel('gorky-lit', sourceId || 'video', SOURCE_FETCH_SIZE),
        'mmdm': () => discoverRutubeChannel('mmdm', sourceId || 'video', SOURCE_FETCH_SIZE),

        // Education channels
        'edu-tv': () => discoverRutubeChannel('edu-tv', sourceId || 'video', SOURCE_FETCH_SIZE),
        'spbgu': () => discoverRutubeChannel('spbgu', sourceId || 'video', SOURCE_FETCH_SIZE),
        'bauman': () => discoverRutubeChannel('bauman', sourceId || 'video', SOURCE_FETCH_SIZE),
        'infourok': () => discoverRutubeChannel('infourok', sourceId || 'video', SOURCE_FETCH_SIZE),
        'pushkin-institute': () => discoverRutubeChannel('pushkin-institute', sourceId || 'video', SOURCE_FETCH_SIZE),

        // Tourism & Travel channels
        'travel-interesting': () => discoverRutubeChannel('travel-interesting', sourceId || 'video', SOURCE_FETCH_SIZE),
        'family-travel': () => discoverRutubeChannel('family-travel', sourceId || 'video', SOURCE_FETCH_SIZE),
        'journey-countries': () => discoverRutubeChannel('journey-countries', sourceId || 'video', SOURCE_FETCH_SIZE),

        // Lifestyle & Society channels
        'recipes': () => discoverRutubeChannel('recipes', sourceId || 'video', SOURCE_FETCH_SIZE),
        'kitchen-studio': () => discoverRutubeChannel('kitchen-studio', sourceId || 'video', SOURCE_FETCH_SIZE),
        'dr-evdokimenko': () => discoverRutubeChannel('dr-evdokimenko', sourceId || 'video', SOURCE_FETCH_SIZE),
        'health-school': () => discoverRutubeChannel('health-school', sourceId || 'video', SOURCE_FETCH_SIZE),
        'parenting': () => discoverRutubeChannel('parenting', sourceId || 'video', SOURCE_FETCH_SIZE),
        'rospotrebnadzor': () => discoverRutubeChannel('rospotrebnadzor', sourceId || 'video', SOURCE_FETCH_SIZE),
      };

      const discoverFn = discoverFunctions[siteId];

      if (!discoverFn) {
        log('Unknown site:', siteId);
        errors.push({ source, error: `Unknown site: ${siteId}` });
        continue;
      }

      // Use source-level cache with timeout - this is the key optimization!
      // The cache stores pre-fetched results that can be sliced for different queries
      // NTV needs extra time for parallel metadata fetches, 1TV needs time for API title lookups
      const timeoutMs = (siteId === 'ntv' || siteId === 'tass' || siteId === '1tv') ? 8000 : 3000;
      const allSourceItems = await fetchWithTimeout(
        () => getCachedSourceResults(cacheSourceKey, discoverFn, skipCache),
        timeoutMs
      );

      // Slice to requested items (source cache has more, we just take what we need)
      items = (allSourceItems || []).slice(0, itemsPerSource);

      results.push(...items);
      if (items.length > 0) {
        feedback.sourcesUsed.push({ source, itemsFound: items.length });
      }
      log(`Discovered ${items.length} items from ${source} (source cache: ${allSourceItems?.length || 0})`);

    } catch (e) {
      log(`Discovery error for ${source}:`, e.message);
      errors.push({ source, error: e.message });
    }
  }

  // Track total items found before filtering
  const totalBeforeFiltering = results.length;

  // Apply filters
  let filtered = results;

  // Deduplicate by URL (normalize URLs first)
  const seenUrls = new Set();
  filtered = filtered.filter(item => {
    const normalizedUrl = (item.url || '').replace(/\/$/, '').toLowerCase();
    if (seenUrls.has(normalizedUrl)) {
      log('Removing duplicate:', normalizedUrl);
      return false;
    }
    seenUrls.add(normalizedUrl);
    return true;
  });
  log(`After deduplication: ${filtered.length} items`);

  // Filter out text-only content (no video/audio) - REQUIRE duration > 0
  const beforeVideoFilter = filtered.length;
  filtered = filtered.filter(item => {
    // Must have duration > 0 to be considered video/audio content
    if (item.duration && item.duration > 0) return true;
    // Filter out text-only articles (even if they have videoId - could be placeholder)
    log('Filtering out text-only item (no duration):', item.title?.substring(0, 50));
    return false;
  });
  if (beforeVideoFilter !== filtered.length) {
    log(`After video filter: ${filtered.length} items (removed ${beforeVideoFilter - filtered.length} text-only)`);
  }

  // Filter by date range if specified
  if (startDate || endDate) {
    const beforeDateFilter = filtered.length;
    filtered = filtered.filter(item => {
      if (!item.publishDate) {
        // Exclude items without dates when date filtering is active
        return false;
      }

      // Normalize various date formats
      let itemDate;
      const dateValue = item.publishDate;
      if (dateValue instanceof Date) {
        itemDate = dateValue;
      } else if (typeof dateValue === 'number') {
        // Unix timestamp (seconds or milliseconds)
        itemDate = new Date(dateValue < 10000000000 ? dateValue * 1000 : dateValue);
      } else if (typeof dateValue === 'string') {
        // Handle Smotrim's DD-MM-YYYY HH:MM:SS format (e.g., "01-02-2026 17:00:00")
        const smotrimMatch = dateValue.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
        if (smotrimMatch) {
          const [, day, month, year, hour = '0', min = '0', sec = '0'] = smotrimMatch;
          itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day),
                              parseInt(hour), parseInt(min), parseInt(sec));
        } else {
          // Try standard parsing (handles YYYY-MM-DD, RFC 2822, ISO 8601)
          itemDate = new Date(dateValue);
        }
      }

      if (!itemDate || isNaN(itemDate.getTime())) {
        return false;
      }

      if (startDate && itemDate < startDate) {
        return false;
      }
      if (endDate && itemDate > endDate) {
        return false;
      }
      return true;
    });
    log(`After date filter (${startDateParam || 'any'} to ${endDateParam || 'any'}): ${filtered.length} items (was ${beforeDateFilter})`);
  }

  // Filter by content type if requested
  if (requestedContentTypes.length > 0) {
    filtered = filtered.filter(r =>
      !r.contentType || requestedContentTypes.includes(r.contentType.toLowerCase())
    );
  }

  // Filter by pedagogical level if requested
  if (requestedLevels.length > 0) {
    filtered = filtered.filter(r =>
      !r.pedagogicalLevel || requestedLevels.includes(r.pedagogicalLevel.toLowerCase())
    );
  }

  // Sort by publish date (newest first) before category distribution
  filtered.sort((a, b) => {
    if (!a.publishDate && !b.publishDate) return 0;
    if (!a.publishDate) return 1;
    if (!b.publishDate) return -1;
    return new Date(b.publishDate) - new Date(a.publishDate);
  });

  // Apply category filtering with even distribution
  let finalResults = [];
  const distributionInfo = {};

  if (requestedCategories.length > 0) {
    if (distribution === 'even' && requestedCategories.length > 1) {
      // STRICT EVEN DISTRIBUTION: Each category gets the SAME number of items
      // If a category has fewer items, we take fewer from ALL categories to maintain balance
      const numCategories = requestedCategories.length;
      const idealPerCategory = Math.floor(maxItems / numCategories);

      // Collect items into category buckets
      const categoryBuckets = {};
      for (const cat of requestedCategories) {
        categoryBuckets[cat] = [];
      }

      // Sort items into category buckets - check primary category and categories array
      for (const item of filtered) {
        const itemCat = (item.category || '').toLowerCase();
        if (itemCat && categoryBuckets[itemCat] !== undefined) {
          categoryBuckets[itemCat].push(item);
        } else if (item.categories && Array.isArray(item.categories)) {
          for (const cat of item.categories) {
            const lowerCat = (cat || '').toLowerCase();
            if (categoryBuckets[lowerCat] !== undefined) {
              categoryBuckets[lowerCat].push(item);
              break;
            }
          }
        }
      }

      // Log bucket sizes for debugging
      log('Category bucket sizes:', Object.fromEntries(
        Object.entries(categoryBuckets).map(([k, v]) => [k, v.length])
      ));

      // Find the minimum available items across all requested categories
      // This determines the maximum we can take from EACH category while staying even
      const minAvailable = Math.min(
        ...requestedCategories.map(cat => (categoryBuckets[cat] || []).length)
      );

      // The actual per-category limit is the lesser of: ideal distribution OR min available
      const perCategory = Math.min(idealPerCategory, minAvailable);

      log('Even distribution: ideal=', idealPerCategory, 'minAvailable=', minAvailable, 'using=', perCategory);

      // Take exactly perCategory from each bucket (TRULY EVEN)
      for (const cat of requestedCategories) {
        const bucket = categoryBuckets[cat] || [];
        for (let i = 0; i < perCategory && i < bucket.length; i++) {
          finalResults.push(bucket[i]);
        }
        distributionInfo[cat] = Math.min(perCategory, bucket.length);
      }

      // Handle remainder: if we have room for more items and all categories have extras
      const totalTaken = finalResults.length;
      let remainder = maxItems - totalTaken;

      if (remainder > 0) {
        // Try to add one more from each category in round-robin fashion
        // Only add if ALL categories can contribute (to stay even)
        let canAddMore = requestedCategories.every(cat =>
          (categoryBuckets[cat] || []).length > distributionInfo[cat]
        );

        while (remainder >= numCategories && canAddMore) {
          for (const cat of requestedCategories) {
            const bucket = categoryBuckets[cat] || [];
            const alreadyTaken = distributionInfo[cat];
            if (bucket[alreadyTaken]) {
              finalResults.push(bucket[alreadyTaken]);
              distributionInfo[cat]++;
              remainder--;
            }
          }
          canAddMore = requestedCategories.every(cat =>
            (categoryBuckets[cat] || []).length > distributionInfo[cat]
          );
        }
      }

      log('Final distribution:', distributionInfo);

    } else {
      // Single category or weighted distribution - simple filter
      finalResults = filtered.filter(r => {
        const itemCat = (r.category || '').toLowerCase();
        if (itemCat && requestedCategories.includes(itemCat)) {
          return true;
        }
        if (r.categories && Array.isArray(r.categories)) {
          return r.categories.some(cat => requestedCategories.includes((cat || '').toLowerCase()));
        }
        return false;
      }).slice(0, maxItems);

      // Record distribution info
      for (const cat of requestedCategories) {
        distributionInfo[cat] = finalResults.filter(r =>
          (r.category || '').toLowerCase() === cat
        ).length;
      }
    }
  } else {
    // No category filter
    finalResults = filtered.slice(0, maxItems);
  }

  // Populate delivered feedback
  feedback.delivered.totalItems = finalResults.length;

  // Calculate delivered category distribution
  // Use item.category if present, otherwise use first element from item.categories array
  for (const item of finalResults) {
    let cat = 'uncategorized';
    if (item.category) {
      cat = item.category.toLowerCase();
    } else if (item.categories && item.categories.length > 0) {
      cat = item.categories[0].toLowerCase();
    }
    feedback.delivered.categories[cat] = (feedback.delivered.categories[cat] || 0) + 1;
  }

  // Calculate delivered content type distribution
  for (const item of finalResults) {
    const ct = (item.contentType || 'unknown').toLowerCase();
    feedback.delivered.contentTypes[ct] = (feedback.delivered.contentTypes[ct] || 0) + 1;
  }

  // Calculate delivered pedagogical level distribution
  for (const item of finalResults) {
    const level = (item.pedagogicalLevel || 'unknown').toLowerCase();
    feedback.delivered.pedagogicalLevels[level] = (feedback.delivered.pedagogicalLevels[level] || 0) + 1;
  }

  // Calculate date range of delivered items
  const dates = finalResults
    .map(item => item.publishDate ? new Date(item.publishDate) : null)
    .filter(d => d && !isNaN(d.getTime()))
    .sort((a, b) => a - b);
  if (dates.length > 0) {
    feedback.delivered.dateRange = {
      earliest: dates[0].toISOString().split('T')[0],
      latest: dates[dates.length - 1].toISOString().split('T')[0],
    };
  }

  // Check for adjustments and add explanations
  if (feedback.request.categories && requestedCategories.length > 0) {
    const requestedCount = requestedCategories.length;
    const idealPerCategory = Math.floor(maxItems / requestedCount);

    for (const cat of requestedCategories) {
      const delivered = feedback.delivered.categories[cat] || 0;
      if (delivered < idealPerCategory) {
        feedback.adjustments.push({
          type: 'category_shortage',
          category: cat,
          requested: idealPerCategory,
          delivered: delivered,
          reason: `Only ${delivered} items found for "${cat}" category (requested ${idealPerCategory}). Consider expanding date range or selecting additional sources.`,
        });
      }
    }
  }

  if (finalResults.length < maxItems) {
    feedback.adjustments.push({
      type: 'total_shortage',
      requested: maxItems,
      delivered: finalResults.length,
      reason: `Only ${finalResults.length} items found matching your criteria (requested ${maxItems}). Try broadening your filters.`,
    });
  }

  // Add hint for historical searches with sparse results
  if (isHistoricalSearch && finalResults.length < maxItems / 2) {
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    feedback.adjustments.push({
      type: 'historical_search_note',
      reason: `Searching ${daysSinceStart} days ago. RSS-based sources (RT, Smotrim) only retain recent content. For historical searches, 1tv and Rutube-based sources have better archives. Try expanding your date range or using sources like 1tv:news, tass:video.`,
    });
  }

  // Build response data
  const responseData = {
    success: true,
    total: finalResults.length,
    items: finalResults,
    distribution: Object.keys(distributionInfo).length > 0 ? {
      mode: distribution,
      categories: distributionInfo,
    } : undefined,
    feedback: {
      request: feedback.request,
      delivered: feedback.delivered,
      adjustments: feedback.adjustments.length > 0 ? feedback.adjustments : undefined,
      sourcesUsed: feedback.sourcesUsed,
    },
    errors: errors.length > 0 ? errors : undefined,
  };

  // Cache the response at all levels (reduces CPU usage on repeated requests)
  // But DON'T cache empty results - they may be temporary failures
  const shouldCache = responseData.total > 0 || (responseData.items && responseData.items.length > 0);

  if (shouldCache) {
    // Level 1: Memory cache (instant access within same worker instance)
    memoryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Level 2: KV cache (persistent, shared across all workers)
    if (KV_CACHE) {
      try {
        await KV_CACHE.put(cacheKey, JSON.stringify(responseData), {
          expirationTtl: CACHE_TTL
        });
        log('Cached to KV:', cacheKey.substring(0, 50));
      } catch (e) {
        log('KV cache write error:', e.message);
      }
    }
  } else {
    log('Not caching empty response for:', cacheKey.substring(0, 50));
  }

  // Use 5 minute browser cache (shorter than edge cache - users can refresh for fresh data)
  const response = jsonResponse(responseData, 200, 300);

  // Store in edge cache only if we have results
  if (shouldCache) {
    cacheToEdge(cache, edgeCacheKey, response.clone());
  }

  return response;
}

async function handleScrape(url) {
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return errorResponse('Missing required parameter: url');
  }

  try {
    const metadata = await extractMetadata(targetUrl);
    return jsonResponse({
      success: true,
      metadata,
    });
  } catch (e) {
    return errorResponse(`Scrape failed: ${e.message}`, 500);
  }
}

async function handleProxy(url) {
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return errorResponse('Missing required parameter: url');
  }

  try {
    const response = await fetchWithHeaders(targetUrl);
    if (!response.ok) {
      return errorResponse(`Proxy fetch failed: ${response.status}`, response.status);
    }

    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    // Process m3u8 to make URLs absolute
    let processed = content;
    if (targetUrl.includes('.m3u8')) {
      const baseDir = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      processed = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('http')) {
          return trimmed.startsWith('/')
            ? new URL(trimmed, targetUrl).href
            : baseDir + trimmed;
        }
        return line;
      }).join('\n');
    }

    return new Response(processed, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...CORS_HEADERS,
      }
    });
  } catch (e) {
    return errorResponse(`Proxy failed: ${e.message}`, 500);
  }
}

async function handleAudio(url) {
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return errorResponse('Missing required parameter: url');
  }

  try {
    const result = await extractAudio(targetUrl);

    // If MP4 source, return the URL for client-side handling
    if (result.streamType === 'mp4') {
      return jsonResponse({
        success: true,
        streamType: 'mp4',
        streamUrl: result.streamUrl,
        filename: result.filename,
        metadata: result.metadata,
        message: 'MP4 source detected. Use the streamUrl for direct download.',
      });
    }

    // For HLS sources, return the extracted audio
    return audioResponse(result.audioData, result.filename);
  } catch (e) {
    log('Audio extraction error:', e);
    return errorResponse(`Audio extraction failed: ${e.message}`, 500);
  }
}

function handleRoot() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Matushka API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f8fafc; }
    h1 { color: #1e40af; }
    h2 { color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto; }
    .endpoint { margin: 20px 0; padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .method { background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85em; }
    .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .source-card { background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .source-card h4 { margin: 0 0 8px 0; color: #1e40af; }
    .source-card ul { margin: 0; padding-left: 20px; font-size: 0.9em; }
    .tag { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin: 2px; }
  </style>
</head>
<body>
  <h1>🎬 Matushka API v3.0</h1>
  <p>Multi-site Russian news video discovery and audio extraction for language education.</p>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/sources</code></p>
    <p>List all available sources, categories, and their configurations.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/discover</code></p>
    <p>Discover videos from multiple sources. Returns video metadata with URLs.</p>
    <p><strong>Parameters:</strong></p>
    <ul>
      <li><code>source</code> - Single source (e.g., <code>1tv:news</code>, <code>smotrim:news</code>, <code>rt:news</code>)</li>
      <li><code>sources</code> - Multiple sources, comma-separated (e.g., <code>1tv:news,smotrim:news,rt:news</code>)</li>
      <li><code>category</code> - Filter by category (politics, economy, society, world, sports, culture, science, technology)</li>
      <li><code>max</code> - Maximum results (default: 20)</li>
    </ul>
    <p><strong>Example:</strong> <code>/api/discover?sources=1tv:news,smotrim:news&category=politics&max=10</code></p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/scrape?url=...</code></p>
    <p>Extract full metadata and stream URLs from a specific video page.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/proxy?url=...</code></p>
    <p>Proxy m3u8 playlists with CORS headers for client-side playback.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/audio?url=...</code></p>
    <p>Extract audio from video. Returns AAC for HLS sources, or MP4 stream URL for direct download.</p>
  </div>

  <h2>Supported Sources</h2>
  <div class="source-grid">
    <div class="source-card">
      <h4>1tv.ru (Первый канал)</h4>
      <ul>
        <li>1tv:news - News</li>
        <li>1tv:vremya - Vremya</li>
        <li>1tv:politics - Politics</li>
        <li>1tv:economy - Economy</li>
        <li>1tv:world - World</li>
      </ul>
      <p><span class="tag">Schedule API</span> <span class="tag">HLS</span></p>
    </div>
    <div class="source-card">
      <h4>smotrim.ru (ВГТРК)</h4>
      <ul>
        <li>smotrim:news - Vesti</li>
        <li>smotrim:russia24 - Vesti 20:00</li>
        <li>smotrim:vesti-nedeli - Weekly</li>
      </ul>
      <p><span class="tag">Official API</span> <span class="tag">HLS/MP4</span></p>
    </div>
    <div class="source-card">
      <h4>rt.com (RT)</h4>
      <ul>
        <li>rt:news - News</li>
        <li>rt:russia - Russia</li>
        <li>rt:business - Business</li>
        <li>rt:sport - Sport</li>
      </ul>
      <p><span class="tag">RSS Feeds</span> <span class="tag">MP4</span></p>
    </div>
    <div class="source-card">
      <h4>rutube.ru (Рутуб)</h4>
      <ul>
        <li>rutube:news - News</li>
        <li>rutube:politics - Politics</li>
        <li>rutube:society - Society</li>
      </ul>
      <p><span class="tag">Category API</span> <span class="tag">HLS</span></p>
    </div>
    <div class="source-card">
      <h4>iz.ru (Известия)</h4>
      <ul>
        <li>izvestia:video - All videos</li>
      </ul>
      <p><span class="tag">Rutube Channel</span> <span class="tag">HLS</span></p>
    </div>
  </div>

  <h2>Categories</h2>
  <p>
    <span class="tag">politics</span>
    <span class="tag">economy</span>
    <span class="tag">society</span>
    <span class="tag">world</span>
    <span class="tag">sports</span>
    <span class="tag">culture</span>
    <span class="tag">science</span>
    <span class="tag">technology</span>
  </p>

  <h2>Usage Example</h2>
  <pre>
// Discover recent news from multiple sources
fetch('/api/discover?sources=1tv:news,smotrim:news&max=10')
  .then(r => r.json())
  .then(data => {
    data.items.forEach(video => {
      console.log(video.title, video.url);
    });
  });

// Extract metadata from a specific video
fetch('/api/scrape?url=https://www.1tv.ru/news/...')
  .then(r => r.json())
  .then(data => {
    console.log(data.metadata.m3u8Url);
  });
  </pre>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html', ...CORS_HEADERS }
  });
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    switch (path) {
      case '/':
      case '/api':
      case '/api/':
        return handleRoot();
      case '/api/sources':
        return handleSources();
      case '/api/discover':
        return handleDiscover(url, request);
      case '/api/scrape':
        return handleScrape(url);
      case '/api/proxy':
        return handleProxy(url);
      case '/api/audio':
        return handleAudio(url);
      default:
        return errorResponse(`Unknown endpoint: ${path}`, 404);
    }
  } catch (e) {
    log('Request error:', e);
    return errorResponse(`Server error: ${e.message}`, 500);
  }
}

// Cache warming queries - run by cron trigger
const WARM_QUERIES = [
  'max=20',
  'sources=1tv:news&max=10',
  'sources=rt:news&max=10',
  'sources=tass:video&max=10',
  'category=sports&max=10',
  'category=politics&max=10',
  'category=economy&max=10',
  'category=military&max=10',
];

async function warmCache(env) {
  KV_CACHE = env.MATUSHKA_CACHE || null;
  const baseUrl = 'https://matushka-api.arwrubel.workers.dev/api/discover';
  let warmed = 0;

  for (const query of WARM_QUERIES) {
    try {
      const url = new URL(`${baseUrl}?${query}`);
      // Call handleDiscover directly to warm cache
      await handleDiscover(url);
      warmed++;
      // Small delay between queries
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log('Warm error:', query, e.message);
    }
  }

  console.log(`Cache warmed: ${warmed}/${WARM_QUERIES.length} queries`);
}

export default {
  // Handle HTTP requests
  async fetch(request, env, ctx) {
    // Set KV cache reference from environment binding
    KV_CACHE = env.MATUSHKA_CACHE || null;

    // Allow OPTIONS requests through without throttling (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Rate limit check to prevent CPU exhaustion
    if (shouldThrottle()) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Rate limited. Please try again in a few seconds.',
          retryAfter: 5
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Retry-After': '5'
          }
        }
      );
    }

    try {
      return await handleRequest(request);
    } catch (e) {
      // Global error handler - always return CORS headers
      console.error('Global worker error:', e);
      return new Response(
        JSON.stringify({ error: true, message: 'Worker error: ' + e.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
  },

  // Handle scheduled/cron triggers - warms cache every 5 minutes
  async scheduled(event, env, ctx) {
    console.log('Cron trigger fired, warming cache...');
    ctx.waitUntil(warmCache(env));
  }
};
