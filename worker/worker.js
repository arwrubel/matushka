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
  military: { en: 'Military', ru: 'Военные' },
  sports: { en: 'Sports', ru: 'Спорт' },
  culture: { en: 'Culture', ru: 'Культура' },
  science: { en: 'Science', ru: 'Наука' },
  technology: { en: 'Technology', ru: 'Технологии' },
  weather: { en: 'Weather', ru: 'Погода' },
  crime: { en: 'Crime', ru: 'Криминал' },
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
      'news': { url: 'https://www.1tv.ru/news', categories: ['politics', 'society'] },
      'politics': { url: 'https://www.1tv.ru/news/politika', categories: ['politics'] },
      'economy': { url: 'https://www.1tv.ru/news/ekonomika', categories: ['economy'] },
      'society': { url: 'https://www.1tv.ru/news/obschestvo', categories: ['society'] },
      'world': { url: 'https://www.1tv.ru/news/v-mire', categories: ['politics', 'society'] },
      'sports': { url: 'https://www.1tv.ru/news/sport', categories: ['sports'] },
      'culture': { url: 'https://www.1tv.ru/news/kultura', categories: ['culture'] },
      'vremya': { url: 'https://www.1tv.ru/shows/vremya', categories: ['politics', 'society'], programId: 'vremya' },
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
      'news': { brandId: 5402, categories: ['politics', 'society'], name: 'Вести' },
      'russia24': { brandId: 58500, categories: ['politics', 'economy'], name: 'Вести в 20:00' },
      'vesti-nedeli': { brandId: 5206, categories: ['politics', 'society'], name: 'Вести недели' },
      // Россия Культура programs
      'culture-news': { brandId: 246379, categories: ['culture'], name: 'Новости культуры' },
      'culture-history': { brandId: 67400, categories: ['culture', 'society'], name: 'Рассказы из русской истории' },
      'culture-architecture': { brandId: 28287, categories: ['culture', 'tourism'], name: 'Роман в камне' },
      'culture-kremlin': { brandId: 68933, categories: ['culture', 'tourism'], name: 'Сокровища Московского Кремля' },
      // Additional culture/society programs
      'absolut-sluh': { brandId: 20892, categories: ['culture', 'society'], name: 'Абсолютный слух' },
      'pisma-provintsii': { brandId: 20920, categories: ['culture', 'society'], name: 'Письма из провинции' },
      'xx-vek': { brandId: 62153, categories: ['culture', 'society'], name: 'XX век' },
      'zemlya-ludey': { brandId: 63258, categories: ['culture', 'society', 'tourism'], name: 'Земля людей' },
      'kollektsiya': { brandId: 64923, categories: ['culture', 'society'], name: 'Коллекция' },
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
    usesRutube: true,  // Use Rutube channel for video content (RSS only has text articles)
    rutubeChannelId: 23174740,  // RT на русском channel (18,826 videos) - NOT 25547249 which is English
    sources: {
      'news': { url: 'https://russian.rt.com/', categories: ['politics', 'society'] },
      'russia': { url: 'https://russian.rt.com/russia', categories: ['politics', 'society'] },
      'world': { url: 'https://russian.rt.com/world', categories: ['politics', 'society'] },
      'business': { url: 'https://russian.rt.com/business', categories: ['economy'] },
      'sport': { url: 'https://russian.rt.com/sport', categories: ['sports'] },
      'video': { categories: ['politics', 'society'] },  // Rutube channel
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
      'video': { categories: ['politics', 'society'] },
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
      'video': { categories: ['politics', 'society'] },
    }
  },
  'izvestia': {
    name: 'Izvestia',
    nameRu: 'Известия',
    domain: 'iz.ru',
    usesRutube: true,
    rutubeChannelId: 23872322,  // 31,528+ videos
    sources: {
      'video': { categories: ['politics', 'society'] },
    }
  },
  // 'kommersant' removed - videos don't match expected economy category well

  // ============================================================================
  // INTERNATIONAL RUSSIAN-LANGUAGE NEWS
  // ============================================================================
  'euronews': {
    name: 'Euronews Russian',
    nameRu: 'Euronews на русском',
    domain: 'ru.euronews.com',
    rssFeed: 'https://ru.euronews.com/rss',
    sources: {
      'video': { categories: ['politics', 'society', 'economy', 'culture'] },
    }
  },
  'bbc': {
    name: 'BBC Russian',
    nameRu: 'Би-би-си',
    domain: 'bbc.com',
    videoPageUrl: 'https://www.bbc.com/russian/topics/c44vyp57qy4t',
    rssFeed: 'https://feeds.bbci.co.uk/russian/rss.xml',
    sources: {
      'video': { categories: ['politics', 'society', 'culture'] },
    }
  },

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
      'news': { categoryId: 13, categories: ['politics', 'society'] },
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
    sources: { 'video': { categories: ['culture', 'society'] } }
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
    sources: { 'video': { categories: ['culture', 'society'] } }
  },
  'kultura-tv': {
    name: 'Russia Kultura TV',
    nameRu: 'Телеканал Культура',
    domain: 'tvkultura.ru',
    usesRutube: true,
    rutubeChannelId: 24620649,  // 243 videos
    sources: { 'video': { categories: ['culture', 'society'] } }
  },
  'culture-rf': {
    name: 'Culture.RF',
    nameRu: 'Культура.РФ',
    domain: 'culture.ru',
    usesRutube: true,
    rutubeChannelId: 23630594,  // 299 videos
    sources: { 'video': { categories: ['culture', 'society', 'tourism'] } }
  },
  'digital-history': {
    name: 'Digital History',
    nameRu: 'Цифровая история',
    domain: 'digitalhistory.ru',
    usesRutube: true,
    rutubeChannelId: 23600725,  // 1,177 videos - historical lectures
    sources: { 'video': { categories: ['society', 'culture'] } }
  },
  'gorky-lit': {
    name: 'Gorky Literary Institute',
    nameRu: 'Литературный институт Горького',
    domain: 'litinstitut.ru',
    usesRutube: true,
    rutubeChannelId: 24195139,  // 1,456 videos - poetry, lectures
    sources: { 'video': { categories: ['culture', 'society'] } }
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
    sources: { 'video': { categories: ['society'] } }
  },
  'spbgu': {
    name: 'St. Petersburg State University',
    nameRu: 'СПбГУ',
    domain: 'spbu.ru',
    usesRutube: true,
    rutubeChannelId: 24725063,  // 1,596 videos
    sources: { 'video': { categories: ['society', 'science'] } }
  },
  'bauman': {
    name: 'Bauman University',
    nameRu: 'МГТУ Баумана',
    domain: 'bmstu.ru',
    usesRutube: true,
    rutubeChannelId: 24869232,  // 344 videos
    sources: { 'video': { categories: ['society', 'technology', 'science'] } }
  },
  'infourok': {
    name: 'Infourok',
    nameRu: 'Инфоурок',
    domain: 'infourok.ru',
    usesRutube: true,
    rutubeChannelId: 23464093,  // 1,366 videos - #1 education platform
    sources: { 'video': { categories: ['society'] } }
  },
  'pushkin-institute': {
    name: 'Pushkin Institute',
    nameRu: 'Институт Пушкина',
    domain: 'pushkin.institute',
    usesRutube: true,
    rutubeChannelId: 28373461,  // 67 videos - Russian language teaching
    sources: { 'video': { categories: ['society'] } }
  },
  'naukatv': {
    name: 'Nauka TV',
    nameRu: 'Наука ТВ',
    domain: 'naukatv.ru',
    usesRutube: true,
    rutubeChannelId: 26552402,
    sources: { 'video': { categories: ['science', 'technology', 'society'] } }
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
    sources: { 'video': { categories: ['tourism', 'society'] } }
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
    sources: { 'video': { categories: ['society', 'society'] } }
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
               'ministr sporta', 'minsport', 'pravitelstv', 'golod', 'goloda', 'moshennik',
               'школ', 'учебн', 'ученик', 'образован', 'shkol', 'uchebn', 'uchenik', 'obrazovan'],
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
      // Foreign leaders / Ukraine political context
      { keywords: ['зеленск', 'зеленского', 'байден', 'трамп', 'макрон', 'шольц'], weight: 4 },
      { keywords: ['азаров', 'порошенко', 'тимошенко', 'кличко'], weight: 4 },
      { keywords: ['украин', 'киев', 'верховная рада', 'рада'], weight: 3 },
      { keywords: ['управлен', 'внешнее управлен'], weight: 2 },
      { keywords: ['дипломати', 'геополитик', 'геополитическ'], weight: 4 },
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
      // Foreign leaders / Ukraine political context - Latin
      { keywords: ['zelensk', 'zelenskogo', 'bayden', 'tramp', 'makron', 'sholc'], weight: 4 },
      { keywords: ['azarov', 'poroshenko', 'timoshenko', 'klichko'], weight: 4 },
      { keywords: ['ukrain', 'kiev', 'verkhovnaya rada', 'rada'], weight: 3 },
      { keywords: ['upravlen', 'vneshnee upravlen'], weight: 2 },
      { keywords: ['diplomati', 'geopolitik', 'geopolitichesk'], weight: 4 },
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
      { keywords: ['импорт', 'экспорт', 'торговл'], weight: 3 },
      // Energy / resources
      { keywords: ['нефт', 'газпром', 'газ', 'трубопровод', 'транзит'], weight: 4 },
      { keywords: ['энергетик', 'энергоносител', 'опек', 'баррел'], weight: 3 },
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
  // NOTE: "world" category removed - international news is tagged by its specific category (politics, economy, etc.)
  // SOCIETY: Everyday life, human interest, community, health, family, social welfare, education
  // NOT government policy - that's politics.
  society: {
    positive: [
      // Cyrillic - social issues and everyday life
      { keywords: ['общество', 'социальн', 'социум'], weight: 4 },
      { keywords: ['граждан', 'население', 'жител', 'народ'], weight: 2 },
      { keywords: ['пенси', 'пенсионер', 'пособи', 'выплат', 'льгот'], weight: 3 },
      { keywords: ['здоровь', 'медицин', 'медик', 'больниц', 'врач', 'лечен', 'пациент', 'клиник', 'инсульт'], weight: 4 },
      { keywords: ['семья', 'семей', 'родител', 'брак', 'развод', 'свадьб'], weight: 3 },
      { keywords: ['ребенок', 'дети', 'детей', 'детск', 'младенец', 'новорожден'], weight: 3 },
      { keywords: ['волонтер', 'благотвор', 'помощь', 'донор'], weight: 3 },
      { keywords: ['голод', 'бездомн', 'сирот', 'инвалид', 'нищет'], weight: 3 },
      { keywords: ['праздник', 'юбилей', 'годовщин', 'торжеств'], weight: 2 },
      // Emergency services / professions (not weather/military, but society/human interest)
      { keywords: ['пожарн', 'огнеборц', 'спасател'], weight: 3 },
      { keywords: ['десантирован', 'отработк', 'отработали'], weight: 2 },
      // Mental health
      { keywords: ['психолог', 'депресс', 'тревожност', 'стресс', 'ментальн'], weight: 3 },
      // Social movements
      { keywords: ['протест', 'митинг', 'демонстрац', 'петиц', 'акция протест'], weight: 3 },
      // Demographics
      { keywords: ['рождаемост', 'смертност', 'миграц', 'демограф'], weight: 3 },
      // Disability and inclusion
      { keywords: ['инклюзи', 'доступная сред', 'ограничен возможност'], weight: 3 },
      // Diet, nutrition, health lifestyle
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
      // Education (merged from education category)
      { keywords: ['образован', 'обучен'], weight: 4 },
      { keywords: ['егэ', 'огэ'], weight: 5 },
      { keywords: ['учител', 'преподаватель', 'педагог'], weight: 4 },
      { keywords: ['университет', 'вуз', 'школ', 'студент'], weight: 3 },
      { keywords: ['экзамен', 'контрольн', 'зачет', 'стипенди'], weight: 3 },
      // EdTech / Online education
      { keywords: ['онлайн-курс', 'дистанционн обучен', 'вебинар', 'онлайн-образован'], weight: 3 },
      // Vocational training
      { keywords: ['профориентац', 'квалификац', 'переподготовк', 'профессиональн обучен'], weight: 3 },
      // Academic degrees
      { keywords: ['кандидат наук', 'доктор наук', 'защита диссертац', 'аспирантур', 'докторантур'], weight: 3 },
      // Infrastructure/transport projects (society, not technology)
      { keywords: ['проект', 'инфраструктур'], weight: 2 },
      { keywords: ['поезд', 'всм', 'железнодорожн', 'железная дорог', 'жд'], weight: 3 },
      { keywords: ['транспорт', 'метро', 'автобус', 'трамвай', 'троллейбус'], weight: 3 },
      { keywords: ['мост', 'тоннель', 'дорог', 'шоссе', 'автомагистрал'], weight: 3 },
      { keywords: ['строительств', 'реконструкц', 'инженер', 'возведен'], weight: 2 },
      // Animals / nature stories
      { keywords: ['животн', 'зоопарк', 'питомец', 'собак', 'кошк', 'кот '], weight: 3 },
      { keywords: ['пингвин', 'медведь', 'волк', 'лис', 'тигр', 'леопард'], weight: 3 },
      { keywords: ['птиц', 'рыб', 'дельфин', 'китов', 'акул'], weight: 3 },
      // Latin transliterations
      { keywords: ['obschestvo', 'socialn', 'socium'], weight: 4 },
      { keywords: ['grazhdan', 'naselen', 'zhitel', 'narod'], weight: 2 },
      { keywords: ['pensi', 'pensioner', 'posobi', 'vyplat', 'lgot'], weight: 3 },
      { keywords: ['zdorov', 'medicin', 'medik', 'bolnic', 'vrach', 'lechen', 'pacient', 'klinik', 'insult'], weight: 4 },
      { keywords: ['semya', 'semey', 'roditel', 'brak', 'razvod', 'svadyb'], weight: 3 },
      { keywords: ['rebenok', 'deti', 'detey', 'detsk', 'mladenec', 'novorozhden'], weight: 3 },
      { keywords: ['volonter', 'blagotvor', 'pomosch', 'donor'], weight: 3 },
      { keywords: ['golod', 'bezdomn', 'sirot', 'invalid', 'nischet'], weight: 3 },
      { keywords: ['prazdnik', 'yubiley', 'godovshin', 'torzhestvo'], weight: 2 },
      // Emergency services / professions - Latin
      { keywords: ['pozharn', 'ogneborec', 'spasatel'], weight: 3 },
      { keywords: ['desantirovan', 'otrabotk', 'otrabotali'], weight: 2 },
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
      // Education - Latin
      { keywords: ['obrazovan', 'obuchen'], weight: 4 },
      { keywords: ['ege', 'oge'], weight: 5 },
      { keywords: ['uchitel', 'prepodavatel', 'pedagog'], weight: 4 },
      { keywords: ['universitet', 'vuz', 'shkol', 'student'], weight: 3 },
      // EdTech/vocational/academic - Latin
      { keywords: ['onlayn-kurs', 'distancionn obuchen', 'vebinar', 'onlayn-obrazovan'], weight: 3 },
      { keywords: ['proforientac', 'kvalifikac', 'perepodgotovk'], weight: 3 },
      { keywords: ['kandidat nauk', 'doktor nauk', 'zashchita dissertac', 'aspirantur', 'doktorantur'], weight: 3 },
      // Animals/nature - Latin
      { keywords: ['zhivotn', 'zoopark', 'pitomec', 'sobak', 'koshk'], weight: 3 },
      { keywords: ['pingvin', 'medved', 'volk', 'lis', 'tigr', 'leopard'], weight: 3 },
    ],
    negative: ['спорт', 'дума', 'законопроект', 'военн', 'армия', 'министр',
               'sport', 'duma', 'zakonoproekt', 'voenn', 'armiya', 'ministr'],
    requiredScore: 3,
  },
  // CRIME: Criminal activity, law enforcement, court cases, fraud, violence
  crime: {
    positive: [
      // Cyrillic - Core crime terms
      { keywords: ['преступлен', 'преступник', 'криминал', 'уголовн'], weight: 5 },
      { keywords: ['убийств', 'убит', 'убил'], weight: 5 },
      { keywords: ['кража', 'грабеж', 'ограблен', 'разбой', 'воровств'], weight: 5 },
      { keywords: ['мошенник', 'мошенничеств', 'аферист', 'обман'], weight: 5 },
      { keywords: ['арест', 'задержан', 'задержали'], weight: 4 },
      { keywords: ['подозреваем', 'обвиняем', 'осужден', 'приговор'], weight: 4 },
      { keywords: ['суд', 'судебн', 'судья', 'присяжн', 'вердикт'], weight: 3 },
      { keywords: ['следствие', 'следователь', 'расследован'], weight: 4 },
      { keywords: ['прокуратур', 'прокурор'], weight: 4 },
      // Law enforcement
      { keywords: ['полиц', 'полицейск'], weight: 3 },
      { keywords: ['мвд', 'фсб', 'скр', 'следственный комитет'], weight: 4 },
      // Specific crimes
      { keywords: ['нападен', 'стрельб', 'ранен'], weight: 3 },
      { keywords: ['наркотик', 'наркоторговл', 'контрабанд'], weight: 5 },
      { keywords: ['террор', 'терракт', 'экстремизм', 'радикал'], weight: 4 },
      { keywords: ['взятк', 'коррупц', 'хищен', 'растрат'], weight: 4 },
      { keywords: ['похищен', 'заложник', 'захват', 'вымогательств'], weight: 5 },
      // Missing persons / bodies found
      { keywords: ['пропал', 'пропавш', 'исчез'], weight: 4 },
      { keywords: ['тело найден', 'тело обнаружен', 'найден труп', 'обнаружен труп'], weight: 5 },
      // Cybercrime
      { keywords: ['кибермошенник', 'фишинг', 'онлайн мошенничеств'], weight: 5 },
      // Latin transliterations
      { keywords: ['prestuplen', 'prestupnik', 'kriminal', 'ugolovn'], weight: 5 },
      { keywords: ['ubiystvo', 'ubit', 'ubil'], weight: 5 },
      { keywords: ['krazha', 'grabezh', 'ograblen', 'razboy', 'vorovstv'], weight: 5 },
      { keywords: ['moshennik', 'moshennichestvo', 'aferist', 'obman'], weight: 5 },
      { keywords: ['arest', 'zaderzhan', 'zaderzhali'], weight: 4 },
      { keywords: ['podozrevaem', 'obvinyaem', 'osuzhden', 'prigovor'], weight: 4 },
      { keywords: ['sud', 'sudebn', 'sudya', 'prisyazhn', 'verdikt'], weight: 3 },
      { keywords: ['sledstvie', 'sledovatel', 'rassledovan'], weight: 4 },
      { keywords: ['prokuratur', 'prokuror'], weight: 4 },
      { keywords: ['polic', 'policeysk'], weight: 3 },
      { keywords: ['mvd', 'fsb', 'skr', 'sledstvennyy komitet'], weight: 4 },
      { keywords: ['napaden', 'strelba', 'ranen'], weight: 3 },
      { keywords: ['narkotik', 'narkotorgovl', 'kontrabanda'], weight: 5 },
      { keywords: ['terror', 'terrakt', 'ekstremizm', 'radikal'], weight: 4 },
      { keywords: ['vzyatk', 'korrupc', 'khishchen', 'rastrat'], weight: 4 },
      { keywords: ['pokhishchen', 'zalozhnik', 'zakhvat', 'vymogatelstv'], weight: 5 },
      { keywords: ['propal', 'propavsh', 'ischez'], weight: 4 },
      { keywords: ['telo nayden', 'telo obnaruzhen', 'nayden trup', 'obnaruzhen trup'], weight: 5 },
    ],
    negative: ['лавин', 'наводнен', 'землетрясен', 'ураган', 'шторм', 'стихийн',
               'погод', 'циклон', 'тайфун', 'цунами', 'извержен',
               'lavin', 'navodnin', 'zemletryasen', 'uragan', 'shtorm', 'stikhiyn'],
    requiredScore: 4,
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
      { keywords: ['карнавал', 'масленица', 'маскарад'], weight: 4 },
      { keywords: ['проводы зимы', 'провожать зиму', 'провожали зиму', 'проводили зиму'], weight: 5 },
      { keywords: ['чучело', 'блинн', 'народн гулян'], weight: 3 },
      { keywords: ['праздник', 'праздничн', 'празднован', 'торжеств'], weight: 3 },
      { keywords: ['шествие', 'процессия'], weight: 3 },
      { keywords: ['традиц', 'обычай', 'обряд', 'ритуал', 'фольклор'], weight: 3 },
      { keywords: ['народн праздник', 'народн гулянье', 'народн традиц'], weight: 4 },
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
      { keywords: ['karnaval', 'maslenitsa', 'maskarad'], weight: 4 },
      { keywords: ['provody zimy', 'provozhat zimu', 'provozhali zimu', 'provodili zimu'], weight: 5 },
      { keywords: ['chuchelo', 'blinn', 'narodn gulyan'], weight: 3 },
      { keywords: ['prazdnik', 'prazdnichn', 'prazdnovan', 'torzhestvo'], weight: 3 },
      { keywords: ['shestvie', 'protsessiya'], weight: 3 },
      { keywords: ['tradits', 'obychay', 'obryad', 'ritual', 'folklor'], weight: 3 },
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
      // Archaeology
      { keywords: ['археолог', 'раскопк', 'артефакт', 'древн'], weight: 3 },
      // Behavioral/Social science
      { keywords: ['социолог', 'антрополог', 'психологич исследован'], weight: 3 },
      // Environmental science
      { keywords: ['экосистем', 'биоразнообраз', 'экология'], weight: 3 },
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
      // Archaeology - Latin
      { keywords: ['arkheolog', 'raskopk', 'artefakt', 'drevn'], weight: 3 },
      // Behavioral/Social science - Latin
      { keywords: ['sociolog', 'antropolog', 'psikhologich issledovan'], weight: 3 },
      // Environmental science - Latin
      { keywords: ['ekosistem', 'bioraznoobraz', 'ekologiya'], weight: 3 },
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
    negative: ['спорт', 'культур', 'военн', 'армия', 'всу', 'артиллер', 'бпла', 'сво', 'боев', 'фронт',
               'sport', 'kultur', 'voenn', 'armiya', 'vsu', 'artiller', 'bpla', 'svo', 'boev', 'front'],
    requiredScore: 3,
  },
  military: {
    positive: [
      // Cyrillic (enhanced from RT/Smotrim agent analysis)
      { keywords: ['военн', 'армия', 'армейск', 'вооружен', 'оружи', 'оружей'], weight: 4 },
      { keywords: ['минобороны', 'министерство обороны', 'генштаб'], weight: 4 },
      { keywords: ['бпла', 'пво', 'уничтожи', 'бригад', 'himars', 'дрон'], weight: 4 },
      { keywords: ['солдат', 'офицер', 'генерал', 'военнослужащ', 'бойц'], weight: 3 },
      { keywords: ['танк', 'ракет', 'артиллер', 'авиац', 'флот', 'подводн'], weight: 3 },
      { keywords: ['сво', 'спецоперац', 'боев', 'фронт', 'наступлен', 'оборон'], weight: 4 },
      { keywords: ['всу', 'нато', 'украин', 'днр', 'лнр', 'донбасс', 'донецк', 'запорож', 'харьков', 'херсон'], weight: 4 },
      { keywords: ['штурм', 'освобожд', 'потер', 'взрыв', 'атак', 'контрол'], weight: 3 },
      { keywords: ['учения', 'маневр', 'полигон', 'войск', 'позици'], weight: 3 },
      { keywords: ['пехот', 'десант', 'морпех', 'спецназ', 'снайпер', 'диверсант'], weight: 3 },
      // Military verbs / operations
      { keywords: ['ликвидац', 'ликвидирова', 'уничтожен', 'разгром'], weight: 4 },
      { keywords: ['воевать', 'воюют', 'воевал', 'воюет'], weight: 4 },
      { keywords: ['агент', 'шпион', 'разведк', 'разведчик', 'контрразвед'], weight: 3 },
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
      { keywords: ['bpla', 'pvo', 'unichtozhi', 'brigad', 'himars', 'dron'], weight: 4 },
      { keywords: ['soldat', 'oficer', 'general', 'voennosluzhasch', 'boytsy'], weight: 3 },
      { keywords: ['tank', 'raket', 'artiller', 'aviac', 'flot', 'podvodn'], weight: 3 },
      { keywords: ['svo', 'specoperac', 'boev', 'front', 'nastuplen', 'oboron'], weight: 4 },
      { keywords: ['vsu', 'nato', 'ukrain', 'dnr', 'lnr', 'donbass', 'doneck', 'zaporozh', 'harkov', 'kherson'], weight: 4 },
      { keywords: ['shturm', 'osvobozh', 'poter', 'vzryv', 'atak', 'udar', 'kontrol'], weight: 3 },
      { keywords: ['ucheniya', 'manevr', 'poligon', 'voysk', 'pozici', 'peredovoy'], weight: 3 },
      { keywords: ['pekhot', 'desant', 'morpekh', 'specnaz', 'snayper', 'diversant'], weight: 3 },
      // Military verbs / operations - Latin
      { keywords: ['likvidac', 'likvidirova', 'unichtozhen', 'razgrom'], weight: 4 },
      { keywords: ['voevat', 'voyuyut', 'voeval', 'voyuyet'], weight: 4 },
      { keywords: ['agent', 'shpion', 'razvedk', 'razvedchik', 'kontrrazved'], weight: 3 },
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
      // Civilian police/law enforcement - NOT "военная полиция" which IS military
      'мвд', 'следствие', 'прокуратур', 'гражданск суд',
      'mvd', 'sledstvie', 'prokuratur',
      // Missing persons context
      'пропавш', 'пропал', 'исчез', 'найден тело',
      'propavsh', 'propal', 'ischez', 'nayden telo',
    ],
    requiredScore: 3,
  },
  weather: {
    positive: [
      // Cyrillic - using more specific terms to avoid false positives
      { keywords: ['погода', 'погодн', 'метео'], weight: 5 },
      { keywords: ['прогноз погоды', 'температур воздух', 'градус мороз'], weight: 5 },
      { keywords: ['температурн', 'температура'], weight: 4 },
      { keywords: ['морозы', 'мороз', 'холод', 'жара', 'зной'], weight: 4 },
      { keywords: ['дожд', 'снегопад', 'снег', 'метель', 'пург', 'вьюга'], weight: 4 },
      { keywords: ['ветер', 'гроза', 'туман', 'облачн', 'осадк'], weight: 3 },
      { keywords: ['климат', 'потеплен', 'похолодан', 'заморозк'], weight: 4 },
      { keywords: ['гидрометцентр', 'синоптик', 'росгидромет'], weight: 5 },
      { keywords: ['ураган', 'шторм', 'наводнен', 'засух', 'тайфун', 'циклон'], weight: 5 },
      // Temperature-specific terms (avoid politics false positive)
      { keywords: ['качели', 'температурные качели'], weight: 5 },
      { keywords: ['аномальн', 'аномалия', 'рекордн температур'], weight: 4 },
      { keywords: ['оттепель', 'потепление', 'потеплен', 'резкое похолодан'], weight: 4 },
      { keywords: ['переправ', 'ледов переправ', 'ледоход'], weight: 4 },
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
      { keywords: ['оползень', 'сель', 'обвал'], weight: 4 },
      { keywords: ['лавина', 'лавин', 'сошла лавин', 'погибли в лавин'], weight: 5 },
      { keywords: ['погибли в лавин', 'погибли при наводнен', 'погибли при землетрясен', 'жертвы стихи'], weight: 5 },
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
      { keywords: ['opolzen', 'sel', 'obval'], weight: 4 },
      { keywords: ['lavina', 'lavin', 'soshla lavin', 'pogibli v lavin'], weight: 5 },
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
    // School/education context - NOT sports even if "мест" or "открылась" appears
    { pattern: /(школ[а-яё]*|учебн[а-яё]*|ученик[а-яё]*|образован[а-яё]*)[\s\S]{0,30}(открыл|построил|мест|класс)/gi, adjust: -20 },
    { pattern: /(shkol[a-z]*|uchebn[a-z]*|uchenik[a-z]*|obrazovan[a-z]*)[\s\S]{0,30}(otkryl|postroil|mest|klass)/gi, adjust: -20 },
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
    // Temperature content - strong boost
    { pattern: /температурн[а-яё]*\s*(качел|перепад|рекорд|аномал)/gi, adjust: +15 },
    { pattern: /temperatur[a-z]*\s*(kachel|perepad|rekord|anomal)/gi, adjust: +15 },
    // City + weather phenomenon = weather news
    { pattern: /(новосибирск|москва|петербург|екатеринбург|казань|сочи)[а-яё]*[\s\S]{0,20}(температурн|морозы|снег|дожд|штор|ураган|метел|пурга)/gi, adjust: +10 },
    // Hurricanes with names - always weather
    { pattern: /ураган[а-яё]*\s*["«]?[А-ЯЁA-Z]/gi, adjust: +15 },
    { pattern: /uragan[a-z]*\s*["«]?[A-Z]/gi, adjust: +15 },
    // Political figures in title — weather reports don't mention politicians by name
    { pattern: /(путин|лавров|мишустин|песков|захарова|медведев|зеленск|байден|трамп|макрон)[а-яё]*/gi, adjust: -8 },
    { pattern: /(putin|lavrov|mishustin|peskov|zakharova|medvedev|zelensk|bayden|tramp|makron)[a-z]*/gi, adjust: -8 },
    // News digest/compilation — weather is just one topic among many
    { pattern: /дайджест|главное за день|итоги дня/gi, adjust: -5 },
    { pattern: /daydzhest|glavnoe za den|itogi dnya/gi, adjust: -5 },
    // Firefighter training/exercises context — society, not weather
    { pattern: /пожарн[а-яё]*[\s\S]{0,20}(отработ|учени|тренировк|десантирован|подготовк)/gi, adjust: -15 },
    { pattern: /pozharn[a-z]*[\s\S]{0,20}(otrabotk|ucheni|trenirovk|desantirovan|podgotovk)/gi, adjust: -15 },
    // "лесные пожарные" = forest firefighters — society/profession context
    { pattern: /лесн[а-яё]*\s*пожарн/gi, adjust: -10 },
    { pattern: /lesn[a-z]*\s*pozharn/gi, adjust: -10 },
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
    // Firefighter "десантирование" = rappelling/deployment, NOT military airborne
    { pattern: /пожарн[а-яё]*[\s\S]{0,20}десант/gi, adjust: -20 },
    { pattern: /pozharn[a-z]*[\s\S]{0,20}desant/gi, adjust: -20 },
    { pattern: /десантирован[а-яё]*[\s\S]{0,20}(вертолёт|вертолет|пожарн)/gi, adjust: -20 },
    { pattern: /desantirovan[a-z]*[\s\S]{0,20}(vertolyot|vertolet|pozharn)/gi, adjust: -20 },

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

    // Diplomatic/political context — demote military when political vocabulary dominates
    { pattern: /(дипломат|дипломати|геополитик)[а-яё]*/gi, adjust: -10 },
    { pattern: /(diplomat|diplomati|geopolitik)[a-z]*/gi, adjust: -10 },
    // "Зеленский" + political verbs = politics, not military
    { pattern: /(зеленск|азаров|порошенко)[а-яё]*[\s\S]{0,30}(назвал|заявил|планирует|предложил|пытается)/gi, adjust: -15 },
    { pattern: /(zelensk|azarov|poroshenko)[a-z]*[\s\S]{0,30}(nazval|zayavil|planiruet|predlozhil|pytaetsya)/gi, adjust: -15 },
    // "готовят на смену" = succession, not combat
    { pattern: /готовят[\s\S]{0,15}на смену/gi, adjust: -15 },
    { pattern: /gotovyat[\s\S]{0,15}na smenu/gi, adjust: -15 },
    // "внешнее управление" = governance, not military
    { pattern: /внешне[а-яё]*\s*управлен/gi, adjust: -10 },
    { pattern: /vneshne[a-z]*\s*upravlen/gi, adjust: -10 },

    // Boost for ACTUAL military context (to compensate for crime penalties when military is present)
    { pattern: /(сво|всу|минобороны|генштаб|донецк|харьков|запорож|херсон|днр|лнр)/gi, adjust: +10 },
    { pattern: /(svo|vsu|minoborony|genshtab|doneck|kharkov|zaporozh|kherson|dnr|lnr)/gi, adjust: +10 },
    // "военная полиция" = Military Police, IS military
    { pattern: /военн[а-яё]*\s*полиц/gi, adjust: +15 },
    { pattern: /voenn[a-z]*\s*polic/gi, adjust: +15 },
    // Submarine/navy content
    { pattern: /(подлодк|подводн|субмарин|флот|кораб|фрегат|корвет)/gi, adjust: +8 },
    { pattern: /(podlodk|podvodn|submarin|flot|korabl|fregat|korvet)/gi, adjust: +8 },
    // Frontline/combat zone terms
    { pattern: /(передов|фронт|боев|наступлен|оборон)/gi, adjust: +8 },
    { pattern: /(peredov|front|boev|nastuplen|oboron)/gi, adjust: +8 },
  ],
  // education disambiguation removed - education merged into society
  politics: [
    // Boost when clear government terms present
    { pattern: /gosduma|госдума/gi, adjust: +5 },
    { pattern: /sovet\s*federacii|совет\s*федерации/gi, adjust: +5 },
    // Politicians making statements - boost politics (headline pattern "Лавров:")
    { pattern: /^(лавров|путин|песков|захарова|мид)[а-яё]*\s*:/gi, adjust: +15 },
    { pattern: /(лавров|путин|мишустин|песков|захарова|матвиенко|володин|медведев)[а-яё]*[\s\S]{0,30}(заявил|сказал|сообщил|отметил|подчеркнул|высказал|призвал|предупредил|раскритиковал)/gi, adjust: +10 },
    { pattern: /(lavrov|putin|mishustin|peskov|zakharova|matvienko|volodin|medvedev)[a-z]*[\s\S]{0,30}(zayavil|skazal|soobshchil|otmetil|podcherknul|vyskazal|prizval|predupredil|raskritikoval)/gi, adjust: +10 },
    // Foreign politicians making statements or in political context
    { pattern: /(зеленск|азаров|порошенко|байден|трамп|макрон|шольц)[а-яё]*[\s\S]{0,30}(заявил|сказал|назвал|призвал|предложил|планирует|пытается|готовят)/gi, adjust: +10 },
    { pattern: /(zelensk|azarov|poroshenko|bayden|tramp|makron|sholc)[a-z]*[\s\S]{0,30}(zayavil|skazal|nazval|prizval|predlozhil|planiruet|pytaetsya|gotovyat)/gi, adjust: +10 },
    // "Зеленский" + diplomatic/political words = politics, not military
    { pattern: /(зеленск|zelensk)[а-яёa-z]*[\s\S]{0,30}(дипломат|оружи|выпросит|смен|управлен)/gi, adjust: +10 },
    // "кого готовят на смену" = leadership succession = politics
    { pattern: /готовят[\s\S]{0,15}на смену/gi, adjust: +10 },
    { pattern: /gotovyat[\s\S]{0,15}na smenu/gi, adjust: +10 },
    // Official statements about Europe/NATO/West - this is diplomacy
    { pattern: /(европ|нато|запад|сша|америк)[а-яё]*[\s\S]{0,30}(заявлен|позици|требован|угроз|ответ)/gi, adjust: +8 },
    { pattern: /(evrop|nato|zapad|ssha|amerika)[a-z]*[\s\S]{0,30}(zayavlen|pozici|trebovan|ugroz|otvet)/gi, adjust: +8 },
    // Military response statements from officials - politics (diplomacy)
    { pattern: /(военн[а-яё]*\s*ответ|воен\s*действ)[а-яё]*/gi, adjust: +8 },
    // Election/voting context
    { pattern: /(выбор|голосован|референдум|избиратель)[а-яё]*/gi, adjust: +5 },
    // Weather content should NOT be politics
    { pattern: /(температурн|погод|метель|ураган|шторм|морозы|похолодан|потеплен|снегопад)[а-яё]*/gi, adjust: -20 },
    { pattern: /(temperatur|pogod|metel|uragan|shtorm|morozy|pokholodan|poteplen|snegopad)[a-z]*/gi, adjust: -20 },
  ],
  economy: [
    // Crime context - money amounts in crime stories are NOT economy news
    { pattern: /(мошенник|мошенничеств|украли|похитили|обманули|аферист)[а-яё]*/gi, adjust: -25 },
    { pattern: /(moshennik|moshennichestvo|ukrali|pokhitili|obmanuli|aferist)[a-z]*/gi, adjust: -25 },
    { pattern: /(кража|ограблен|хищен|растрат|взятк|вымогательств)[а-яё]*/gi, adjust: -20 },
    { pattern: /(krazha|ograblen|khishchen|rastrat|vzyatk|vymogatelstv)[a-z]*/gi, adjust: -20 },
    // Reduce score when politicians making statements (not economy news)
    // Pattern: "Лавров:" at start of headline, or "Lavrov заявил/сказал"
    { pattern: /^(лавров|путин|песков|захарова|мид|министр)[а-яё]*\s*:/gi, adjust: -20 },
    { pattern: /(лавров|путин|медведев|мид|министр иностран)[а-яё]*[\s\S]{0,30}(заявил|сказал|отметил|высказал|призвал|раскритиковал)/gi, adjust: -15 },
    { pattern: /(lavrov|putin|medvedev|mid|ministr inostran)[a-z]*[\s\S]{0,30}(zayavil|skazal|otmetil|vyskazal|prizval|raskritikoval)/gi, adjust: -15 },
    // Military terms in economy context - this is geopolitics, not economy
    { pattern: /(нападен|военн|армия|атак|удар)[а-яё]*[\s\S]{0,20}(европ|нато|россия)/gi, adjust: -20 },
    { pattern: /(napaden|voenn|armiya|atak|udar)[a-z]*[\s\S]{0,20}(evrop|nato|rossiya)/gi, adjust: -20 },
    // Geopolitical threats about industry - not economy news
    { pattern: /(промышленност|экономик)[а-яё]*[\s\S]{0,30}(угроз|нападен|атак|удар|разрушен)/gi, adjust: -15 },
    { pattern: /(promyshlennost|ekonomik)[a-z]*[\s\S]{0,30}(ugroz|napaden|atak|udar|razrushen)/gi, adjust: -15 },
    // When European industry discussed in crisis/threat context
    { pattern: /(европ|европейск)[а-яё]*[\s\S]{0,20}(промышленност|экономик)[а-яё]*[\s\S]{0,20}(кризис|угроз|потеря|обвал)/gi, adjust: -10 },
    // "военный ответ" - military response - definitely not economy
    { pattern: /военн[а-яё]*\s*(ответ|угроз|действ|операц)/gi, adjust: -25 },
    { pattern: /voenn[a-z]*\s*(otvet|ugroz|deystviy|operac)/gi, adjust: -25 },
    // "Европа/Европе/европейский" is NOT the Euro currency — penalize when "евро" matches only via "Европ"
    { pattern: /европ[а-яё]/gi, adjust: -15 },
    { pattern: /evrop[a-z]/gi, adjust: -15 },
    // Boost for actual economy reporting (true "евро" currency, not "Европа")
    { pattern: /(курс|рубл|доллар|биржа|акци|индекс)[а-яё]*/gi, adjust: +5 },
    { pattern: /(kurs|rubl|dollar|birzha|akci|indeks)[a-z]*/gi, adjust: +5 },
    // Boost when "евро" appears near financial context (actual Euro currency)
    { pattern: /евро[\s\S]{0,10}(курс|валют|обмен|стоимост|цен)/gi, adjust: +10 },
    { pattern: /evro[\s\S]{0,10}(kurs|valyut|obmen|stoimost|cen)/gi, adjust: +10 },
  ],
  crime: [
    // Military operations context — actual combat reporting is NOT crime
    { pattern: /(наступлен|оборон|обстрел|артиллер|бомбардировк|авиаудар)[а-яё]*/gi, adjust: -20 },
    { pattern: /(nastuplen|oboron|obstrel|artiller|bombardirovk|aviaudar)[a-z]*/gi, adjust: -20 },
    // But fraud/theft AGAINST military personnel IS crime — boost
    { pattern: /(мошенник|украли|обманули|похитили)[а-яё]*[\s\S]{0,30}(участник|военнослужащ|ветеран|сво)/gi, adjust: +15 },
    { pattern: /(moshennik|ukrali|obmanuli|pokhitili)[a-z]*[\s\S]{0,30}(uchastnik|voennosluzhashch|veteran|svo)/gi, adjust: +15 },
    // Political context — "грызня" (infighting), "смена" (succession) are politics, not crime
    { pattern: /(зеленск|азаров|путин|политик|дипломат|управлен)[а-яё]*/gi, adjust: -15 },
    { pattern: /(zelensk|azarov|putin|politik|diplomat|upravlen)[a-z]*/gi, adjust: -15 },
    // "готовят на смену" = succession, not crime
    { pattern: /готовят[\s\S]{0,15}на смену/gi, adjust: -15 },
    { pattern: /gotovyat[\s\S]{0,15}na smenu/gi, adjust: -15 },
  ],
  // world disambiguation removed - world category eliminated
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
    '/v-mire/': 'politics', '/world/': 'politics', '/mir/': 'politics',
    '/obschestvo/': 'society', '/society/': 'society',
    '/nauka/': 'science', '/science/': 'science', '/tech/': 'technology',
    '/obrazovanie/': 'society', '/education/': 'society',
    '/armiya/': 'military', '/military/': 'military', '/voennye/': 'military',
    '/proisshestviya/': 'crime', '/crime/': 'crime', '/kriminal/': 'crime',
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
// NEWS DIGEST / GENERIC BROADCAST FILTER
// ============================================================================
// Filters out multi-topic compilations, date-stamped news roundups, and
// generic broadcasts that only briefly mention several unrelated topics.
// These are not useful for focused language study.

function isNewsDigest(title, description, duration) {
  if (!title) return false;
  const t = title.toLowerCase();
  const d = (description || '').toLowerCase();

  // 1. Explicit digest/roundup markers in title
  if (/дайджест|daydzhest/i.test(title)) return true;
  if (/главное за день|glavnoe za den/i.test(title)) return true;
  if (/итоги дня|itogi dnya/i.test(title)) return true;
  if (/обзор за день|obzor za den/i.test(title)) return true;

  // 2. "Новости [date/time]" pattern — generic news for a date
  //    e.g., "Новости 21 февраля", "Новости за 60 секунд", "Новости дня"
  if (/^новости\s+(\d|за\s|дня|от\s|на\s)/i.test(title.trim())) return true;
  if (/^novosti\s+(\d|za\s|dnya|ot\s|na\s)/i.test(title.trim())) return true;

  // 3. "Вести [time/date]" or "Время [time/date]" — timestamped show episodes
  //    e.g., "Вести. 22 февраля 2026", "Вести в 20:00"
  if (/^вести[\s.]+(\d|в\s*\d)/i.test(title.trim())) return true;
  if (/^время[\s.]+(\d|в\s*\d)/i.test(title.trim())) return true;

  // 4. Multi-topic titles: 3+ "/" separators = listing unrelated stories
  //    e.g., "Topic A / Topic B / Topic C / Show Name"
  const slashCount = (title.match(/\s\/\s/g) || []).length;
  if (slashCount >= 2) return true;

  // 5. Short clips (under 90s) with 2 "/" — condensed roundups
  if (slashCount >= 1 && duration && duration <= 90) return true;

  // 6. Description-only digest markers (title may be vague)
  if (/смотрите в выпуске|smotrite v vypuske/i.test(d) && slashCount >= 1) return true;

  return false;
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
// RUSSIAN SNOWBALL STEMMER (Snowball algorithm for Russian language)
// Reference: https://snowballstem.org/algorithms/russian/stemmer.html
// Used for frequency-band vocabulary analysis of transcripts
// ============================================================================

const RUSSIAN_VOWELS = 'аеиоуыэюя';

function findRegions(word) {
  // RV: region after the first vowel
  let rv = word.length;
  for (let i = 0; i < word.length; i++) {
    if (RUSSIAN_VOWELS.includes(word[i])) { rv = i + 1; break; }
  }
  // R1: region after the first non-vowel following a vowel
  let r1 = word.length;
  for (let i = 1; i < word.length; i++) {
    if (!RUSSIAN_VOWELS.includes(word[i]) && RUSSIAN_VOWELS.includes(word[i - 1])) { r1 = i + 1; break; }
  }
  // R2: region after the first non-vowel following a vowel in R1
  let r2 = word.length;
  for (let i = r1 + 1; i < word.length; i++) {
    if (!RUSSIAN_VOWELS.includes(word[i]) && RUSSIAN_VOWELS.includes(word[i - 1])) { r2 = i + 1; break; }
  }
  return { rv, r1, r2 };
}

// Suffix groups sorted longest-first for each group
const PERFECTIVE_GERUND_1 = ['вшись', 'вши', 'в']; // preceded by а or я
const PERFECTIVE_GERUND_2 = ['ившись', 'ывшись', 'ивши', 'ывши', 'ив', 'ыв'];
const REFLEXIVE = ['сь', 'ся'];
const ADJECTIVE = [
  'ими', 'ыми', 'его', 'ого', 'ему', 'ому',
  'ее', 'ие', 'ые', 'ое', 'ей', 'ий', 'ый', 'ой',
  'ем', 'им', 'ым', 'ом', 'их', 'ых', 'ую', 'юю',
  'ая', 'яя', 'ою', 'ею',
];
const PARTICIPLE_1 = ['ющ', 'вш', 'ем', 'нн', 'щ']; // preceded by а or я
const PARTICIPLE_2 = ['ующ', 'ивш', 'ывш'];
const VERB_1 = [ // preceded by а or я
  'ете', 'йте', 'нно', 'ешь',
  'ла', 'на', 'ли', 'ем', 'ло', 'но', 'ет', 'ют', 'ны', 'ть',
  'й', 'л', 'н',
];
const VERB_2 = [
  'ейте', 'уйте', 'ила', 'ыла', 'ена', 'ило', 'ыло', 'ено',
  'ите', 'или', 'ыли', 'ует', 'уют', 'ены', 'ить', 'ыть', 'ишь',
  'ей', 'уй', 'ил', 'ыл', 'им', 'ым', 'ен', 'ят', 'ит', 'ыт',
  'ую', 'ю',
];
const NOUN = [
  'иями', 'ями', 'ами', 'иях', 'ией',
  'ие', 'ье', 'еи', 'ии', 'ей', 'ой', 'ий',
  'ям', 'ем', 'ам', 'ом', 'ах', 'ях',
  'ию', 'ью',
  'ев', 'ов', 'ия', 'ья',
  'а', 'е', 'и', 'й', 'о', 'у', 'ы', 'ь', 'ю', 'я',
];
const SUPERLATIVE = ['ейше', 'ейш'];
const DERIVATIONAL = ['ость', 'ост'];

function tryRemoveSuffix(word, suffixes, rv) {
  for (const s of suffixes) {
    if (word.endsWith(s) && word.length - s.length >= rv) {
      return word.slice(0, -s.length);
    }
  }
  return null;
}

function tryRemoveGroup1Suffix(word, suffixes, rv) {
  // Group 1 suffixes must be preceded by а or я
  for (const s of suffixes) {
    if (word.endsWith(s) && word.length - s.length >= rv) {
      const preceding = word[word.length - s.length - 1];
      if (preceding === 'а' || preceding === 'я') {
        return word.slice(0, -s.length);
      }
    }
  }
  return null;
}

/**
 * Russian Snowball stemmer.
 * @param {string} word - lowercase Russian word
 * @returns {string} stemmed form
 */
function russianStem(word) {
  if (!word || word.length < 2) return word;

  // Normalize ё → е
  word = word.replace(/ё/g, 'е');

  const { rv, r1, r2 } = findRegions(word);

  // Step 1: Try to remove endings in RV
  let result = null;

  // 1a: Try PERFECTIVE GERUND (group 1, then group 2)
  result = tryRemoveGroup1Suffix(word, PERFECTIVE_GERUND_1, rv);
  if (!result) result = tryRemoveSuffix(word, PERFECTIVE_GERUND_2, rv);

  if (!result) {
    // 1b: Remove REFLEXIVE if present
    let w = tryRemoveSuffix(word, REFLEXIVE, rv) || word;

    // 1c: Try ADJECTIVAL (PARTICIPLE + ADJECTIVE, or just ADJECTIVE)
    let adj = tryRemoveSuffix(w, ADJECTIVE, rv);
    if (adj) {
      // Try removing PARTICIPLE before the adjective ending
      let part = tryRemoveGroup1Suffix(adj, PARTICIPLE_1, rv);
      if (!part) part = tryRemoveSuffix(adj, PARTICIPLE_2, rv);
      result = part || adj;
    }

    if (!result) {
      // 1d: Try VERB (group 1, then group 2)
      result = tryRemoveGroup1Suffix(w, VERB_1, rv);
      if (!result) result = tryRemoveSuffix(w, VERB_2, rv);
    }

    if (!result) {
      // 1e: Try NOUN
      result = tryRemoveSuffix(w, NOUN, rv);
    }

    if (!result) result = w;
  }

  word = result;

  // Step 2: If word ends with и in RV, remove it
  if (word.endsWith('и') && word.length - 1 >= rv) {
    word = word.slice(0, -1);
  }

  // Step 3: If R2 contains DERIVATIONAL ending, remove it
  const deriv = tryRemoveSuffix(word, DERIVATIONAL, r2);
  if (deriv) word = deriv;

  // Step 4:
  // 4a: Undouble нн → н
  if (word.endsWith('нн')) {
    word = word.slice(0, -1);
  }
  // 4b: Remove SUPERLATIVE ending, then undouble нн
  else {
    const sup = tryRemoveSuffix(word, SUPERLATIVE, rv);
    if (sup) {
      word = sup;
      if (word.endsWith('нн')) word = word.slice(0, -1);
    }
    // 4c: Remove trailing ь
    else if (word.endsWith('ь') && word.length - 1 >= rv) {
      word = word.slice(0, -1);
    }
  }

  return word;
}

// ============================================================================
// MTLD — Measure of Textual Lexical Diversity (McCarthy & Jarvis 2010)
// Length-independent replacement for Type-Token Ratio
// ============================================================================

function computeMTLDPass(words, threshold) {
  let factors = 0;
  let tokensSeen = 0;
  const types = new Set();

  for (const w of words) {
    tokensSeen++;
    types.add(w);
    const ttr = types.size / tokensSeen;

    if (ttr <= threshold) {
      factors++;
      tokensSeen = 0;
      types.clear();
    }
  }

  // Partial factor for remainder
  if (tokensSeen > 0) {
    const ttr = types.size / tokensSeen;
    factors += (1 - ttr) / (1 - threshold);
  }

  return factors > 0 ? words.length / factors : words.length;
}

/**
 * Compute MTLD (bidirectional average).
 * @param {string[]} words - array of lowercase words
 * @param {number} threshold - TTR threshold (default 0.72)
 * @returns {number} MTLD score (higher = more diverse)
 */
function computeMTLD(words, threshold = 0.72) {
  if (words.length < 10) return words.length; // Too short for meaningful MTLD
  const forward = computeMTLDPass(words, threshold);
  const backward = computeMTLDPass([...words].reverse(), threshold);
  return +((forward + backward) / 2).toFixed(1);
}

// ============================================================================
// FREQUENCY BAND DATA (University of Leeds Russian Corpus)
// Generated by scripts/build-frequency-data.js from top 10,000 Russian words
// Band 1: top 1000 (high-freq, everyday) | Band 2: 1001-3000 (mid-freq)
// Band 3: 3001-5000 (low-mid-freq) | Band 4: 5001-10000 (low-freq, specialized)
// Words outside all bands = very rare/specialized
// ============================================================================

const FREQ_BAND_1 = new Set(["не","на","что","быт","он","эт","как","то","этот","по","но","мы","котор","из","сво","вы","ве","за","для","от","так","моч","все","ты","же","год","человек","один","тот","ил","есл","тольк","ег","бы","себ","врем","когд","ещ","уж","друг","сказа","до","мо","наш","чтоб","говор","сам","зна","вот","очен","нет","кто","при","да","ста","ден","перв","даж","можн","жизн","во","ни","дел","два","нов","раз","хотет","долж","ли","со","там","их","мног","работ","имет","посл","где","вопрос","рук","город","под","кажд","слов","мест","без","ну","ребенок","прост","бол","больш","над","чем","ваш","сдела","идт","зде","дела","сейчас","росс","видет","пот","ничт","через","мир","тепер","нескольк","дума","случа","сторон","хорош","тож","глаз","тогд","тут","дом","стра","об","сил","последн","работа","такж","лиц","жит","част","хот","женщин","систем","всегд","явля","вид","голов","проблем","конец","вед","межд","конечн","смотрет","пок","отношен","получ","русск","три","втор","имен","перед","лиш","образ","поня","деньг","поэт","поч","понима","москв","люб","однак","никт","час","нача","найт","счита","взя","земл","сегодн","вообщ","книг","пойт","возможн","некотор","оказа","прийт","компан","истор","высок","нужн","почт","оста","тво","результат","например","прав","групп","писа","сидет","пут","машин","наход","увидет","войн","каза","стоя","им","реш","никогд","сто","маленьк","ответ","вод","решен","бог","совс","язык","далек","дава","полн","российск","народ","власт","сраз","уровен","выйт","ноч","пор","спрос","развит","программ","никак","главн","двер","вмест","момент","закон","числ","цел","приня","написа","отец","правд","ног","стар","помощ","информац","тысяч","про","подобн","разн","общ","месяц","пройт","кром","минут","ма","процесс","ситуац","смоч","автор","начина","форм","голос","собствен","мысл","свет","качеств","школ","всяк","действ","мужчин","област","вниман","следова","использова","дорог","связ","марк","взгляд","услов","молод","скор","снов","любов","основн","станов","важн","жда","вдруг","игр","чита","стат","организац","средств","существова","душ","пыта","тел","посмотрет","обществ","жен","государств","остава","совершен","письм","состоян","вечер","настоя","назад","смысл","мер","сем","вещ","вернут","зат","причин","утр","рынок","действительн","происход","девушк","вест","скольк","тем","стол","проект","улиц","государствен","помн","называ","появ","нельз","бел","центр","опя","равн","прот","куд","недел","иде","особен","комнат","ин","цен","наконец","известн","сред","сын","деятельн","узна","игра","советск","лучш","движен","занима","точн","огромн","мам","задач","велик","количеств","чувств","иногд","слишк","смерт","достаточн","лежа","помоч","мнен","труд","пя","трет","быва","замет","готов","быстр","черн","сильн","порядок","чувствова","созда","пример","положен","век","продолжа","подума","муж","поскольк","уйт","воен","реч","пла","совет","политическ","стен","представля","слыша","ход","окн","ряд","прежд","показа","оп","тип","окол","отвеча","интерес","современ","плох","сердц","управлен","наук","сообщен","знач","прос","немн","газет","интересн","жив","необходим","материа","рол","откр","ко","представ","вполн","будт","рассказа","выход","ра","остав","получа","давн","арм","рабоч","четыр","боя","различн","долг","привест","президент","либ","событ","мен","красн","социальн","иска","большинств","бизнес","пуст","легк","правительств","прям","глав","член","суд","принима","рубл","миллион","приход","фильм","обычн","счет","спа","небольш","культур","текст","бра","документ","принцип","разговор","телефон","произойт","способ","течен","провест","пол","вокруг","проход","куп","родител","се","единствен","метр","сайт","парт","позволя","образован","зач","наверн","период","кстат","пар","квартир","заб","значен","внутрен","связа","требова","дал","основ","александр","желан","слуша","чут","номер","изменен","очеред","политик","класс","относ","факт","брат","собира","определен","довольн","производств","создан","район","особ","вер","спасиб","предприят","близк","экономическ","знаком","человеческ","местн","назва","неб","направлен","туд","уда","встреч","шаг","остальн","попаст","команд","добр","сша","исследован","обществен","мальчик","метод","повод","рост","снача","рассказыва","сон","уход","служб","населен","воздух","словн","кров","спрашива","зрен","врач","еха","нрав","знан","войт","предлож","использован","деся","палец","орга","доллар","держа","назван","похож","реальн","участ","род","приеха","наибол","девочк","крупн","мор","природ","магазин","врод","памя","весьм","объект","продукт","борьб","личн","каса","прич","провод","отдельн","успет","предмет","представител","плеч","национальн","музык","самолет","позиц","вспомн","американск","стара","гер","характер","размер","пит","средн","срок","институт","сет","солнц","серьезн","подойт","инач","серг","показыва","союз","дух","позвол","интернет","лес","журна","степен","предлага","территор","март","успех","искусств","участник","парен","свободн","гост","впроч","вариант","предложен","судьб","составля","товар","надея","действова","международн","способн","практическ","директор","европ","полност","поздн","песн","случ","ум","выбор","модел","рек","фирм","гражданин","товарищ","московск","нормальн","сознан","картин","умерет","апрел","источник","границ","состоя","всег","половин","операц","оценк","постоя","специалист","собак","компьютер","красив","технолог","дерев","гор","вход","миров","научн","умет","детск","корабл","жела","берег","широк","низк","уб","прекрасн","иб","будущ","внешн","литератур","тяжел","сотрудник","помога","бо","сложн","услыша","войск","структур","несмотр","пользова","защит","коротк","начальник","бумаг","установ","кра","ошибк","церков","вызва","соста","объясн","разв","сюд","сообщ","прошл","стольк","понят","длин","поддержк","подня","возраст","вста","трудн","лин","андр","услуг","счаст","рома","выглядет","ветер","возника","английск","оказыва","курс","отмет","поиск","пап","высш","теор","добав","бывш","пространств","уч","экономик","чист","специальн","потеря","брос","спин","поведен","служ","оруж","страх","страниц","враг","вызыва","двадца","руководител","откуд","горазд","карт","страшн","звук","камен","ожида","рассказ","обнаруж","хозяин","анализ","надежд","внов","господин","солдат","един","цвет","сест","круг","попытк","однажд","комментар","клиент","удар","владимир","крайн","баз","доктор","останов","означа","глядет","появля","доч","пожалуйст","республик","представлен","став","поеха","волос","принест","герман","отсутств","масс","процент","выбра","студент","здан","ребят","угол","конкретн","скорост","соглас","требован","любим","подход","бежа","адрес","видн","новост","открыт","список","возвраща","энерг","вывод","учител","возникнут","договор","сня","зависет","сфер","полож","западн","обязательн","немецк","примерн","безопасн","функц","ива","нек","учен","банк","удовольств","основан","чуж","ощущен","противник","объ","вперед","определ","писател","звезд","создава","знак","вовс","уверен","влиян","груд","контрол","двор","одновремен","пункт","радост","завтр","старш","заяв","впечатлен","практик","внутр","попрос","руководств","содержан","вол","январ","боев","хвата","вчер","реж","очередн","отда","здоров","раст","стоимост","правильн","километр","зва","шест","личност","физическ","регион","рот","больн","итог","предел","заня","может","читател","медлен","старик","проч","побед","элемент","естествен","обрат","встреча","женск","командир","август","вперв","секунд","счастлив","жител","видим","праздник","множеств","кажет","сумм","сцен","наскольк","ест","едв","техник","мал","подготовк","сожален","ух","историческ","занят","соответств","почувствова","существован","мужик","городск","октябр","недавн","нос","существ","абсолютн","облада","рамк","генера","благодар","попробова","французск","сентябр","лев","университет","частн","глубок","клуб","принадлежа","лет","застав","выражен","плат","спокойн","привод","одежд","рад","автомобил","продаж","закр","свят","финансов","декабр","театр","ссср","произведен","постро","деревн","направ","состав","рф","фонд","сестр","отлича","нест","крича","встрет","наблюда","запад","франц","отказа","обстоятельств","миха","золот","июн","обраща","темн","верс","министр","акц","губ","немец","дополнительн","сут","америк","холодн","феврал","цветок","центральн","профессиональн","завод","федеральн","федерац","техническ","пониман","рожден","ближайш","болезн","выступа","отправ","площад","родн"]);
const FREQ_BAND_2 = new Set(["стрем","станц","реша","обучен","зап","упаст","поддержива","настольк","вниз","значительн","напомина","ответствен","народн","европейск","офицер","июл","переда","корол","утвержда","позвон","реклам","никола","революц","явлен","отдел","вскор","фронт","художник","информацион","животн","пользовател","этап","ладн","стил","зелен","двига","норм","чег","попыта","передач","ценност","измен","фраз","работник","пет","мим","дат","капита","доход","фотограф","разработк","волн","собра","усил","ясн","профессор","рассматрива","ноябр","понрав","ча","указа","участвова","алекс","перевод","фактор","тих","кана","полезн","сравнен","северн","взросл","кабинет","вспомина","форум","духовн","слаб","подробн","наоборот","гражданск","итак","журналист","проведен","выполня","нынешн","лист","снег","обеспечен","комисс","законч","повер","слав","черт","древн","явн","бит","зуб","традиц","невозможн","переста","высот","иностра","председател","массов","звон","сосед","молча","украин","вып","дальн","прочита","приятн","налич","понятн","сад","пада","кухн","мастер","карма","детств","хват","сомнен","сотн","десяток","покупа","участок","обеща","согласн","строительств","разумеет","пив","исчезнут","тонк","устройств","смея","богат","ярк","соответствова","слез","библиотек","общен","частност","выполн","верн","отлич","поезд","официальн","мелк","продукц","применен","цар","поток","польз","обратн","меша","перейт","настроен","постепен","дво","редакц","нечт","толп","планет","поколен","реакц","умн","вероятн","механизм","птиц","относительн","сквоз","хозяйств","жертв","открыва","произнест","ученик","организм","посла","заявлен","достижен","вверх","бутылк","призна","определя","дол","уеха","мозг","рисунок","прежн","муз","зависим","дожд","реализац","улыбк","восток","собран","улыбнут","хлеб","бабушк","тен","испытыва","стих","домашн","полага","снима","сегодняшн","активн","получен","помещен","опасн","объяв","очевидн","кож","электрон","морск","нарушен","обеспеч","ужас","акт","содержа","инструмент","лидер","комитет","фигур","отсюд","пост","лагер","след","улыба","оставля","раздел","реальност","потер","зим","экра","мил","погибнут","традицион","здравствова","переход","крова","посвят","урок","секс","родин","вин","комплекс","сталин","зон","кол","звуча","коллег","бедн","появлен","издан","резк","поговор","евр","неч","бюджет","редк","разговарива","учет","княз","этаж","чест","признак","истин","замечательн","плака","потребн","придума","храм","заход","объясня","депутат","поступ","выбира","достигнут","сохран","предполага","глубин","приказ","категор","полет","игор","горяч","устро","стро","администрац","организова","эффект","летет","торгов","описан","риск","располож","лошад","коридор","подруг","соверш","партнер","исключен","конкурс","схем","ночн","разниц","весн","провер","возл","красот","тридца","рыб","доста","сумет","доб","опубликова","петр","аппарат","трубк","восточн","ключ","знаменит","тепл","фамил","включа","захотет","включ","чуд","взглянут","заключа","полк","кресл","напрот","обращен","описа","меня","че","восем","сер","присутствова","науч","министерств","ольг","кин","медицинск","налог","штат","железн","сведен","культурн","конфликт","предыдущ","середин","вряд","мертв","подарок","забыва","расчет","замеча","езд","теря","пожал","торговл","камер","тайн","преступлен","столиц","выполнен","эпох","больниц","выставк","выпуск","литературн","виктор","ссылк","уважен","последств","букв","изображен","творческ","фон","учебн","материальн","детал","заключен","вес","автобус","воспоминан","просьб","человечеств","корпус","вкус","спуст","выраст","миллиард","заседан","недостаток","принос","путин","заран","отделен","перспектив","конференц","разрешен","спаст","мощн","эффективн","угроз","прода","производ","обед","изучен","олег","обеспечива","поднима","сорок","дойт","отряд","скаж","поступа","нижн","южн","газ","четверт","печа","водк","дед","телевизор","бесед","повышен","крыш","звонок","ах","ан","контакт","приобрест","неужел","дам","мягк","уважа","допуст","творчеств","художествен","сутк","честн","ресурс","поверхн","свойств","привыкнут","доступ","вечн","брак","стекл","мероприят","обсужден","установк","случайн","пода","борот","мужск","горет","лишн","реформ","задан","приглас","билет","свеж","обязан","ввест","расход","ведущ","повторя","отечествен","владелец","оборудован","бед","сообща","англ","немедлен","должн","крик","семейн","дяд","показател","указыва","развива","формирован","сигна","назнач","кита","борис","исход","трав","лечен","ящик","учрежден","замок","воздейств","стул","слегк","светл","пропаст","учитыва","обстановк","соответствен","сказк","расстоян","набор","зло","шум","доказа","яв","цифр","слож","познаком","весел","мол","диск","удобн","оцен","коф","ше","ран","американец","шанс","книжк","произвест","игрок","чтен","лестниц","лодк","продава","вне","давлен","буквальн","потребител","убийств","религиозн","кусок","стратег","достоинств","постел","верхн","основа","процедур","исключительн","кадр","рассмотрет","штаб","встава","выступлен","извин","внимательн","юр","малыш","ед","милиц","ожидан","господ","изуча","философ","смех","громк","многочислен","жизнен","узк","блок","зайт","приб","страда","водител","концепц","оттуд","остр","присла","мост","поездк","компьютерн","разум","угодн","тишин","субъект","слух","разработа","благ","покупател","осен","мистер","париж","увеличен","удивительн","подготов","танк","должност","записа","зарплат","родственник","наступ","привет","пакет","зрител","мечта","преврат","рестора","раньш","законодательств","зада","внезапн","лун","охра","публикац","кивнут","обсужда","наверняк","напомн","логик","приезжа","повтор","син","сущност","отдава","проверк","следств","зерка","вдол","ладон","строк","жестк","ворот","иванович","передава","продолж","мечт","дмитр","питан","прибыл","файл","флот","интересова","религ","бож","плюс","кошк","саш","характерн","мар","толст","обща","пят","висет","способствова","ужасн","заказ","отличн","запас","исполнен","крыл","редактор","тон","оборон","дум","полковник","соседн","разреш","выпуст","заместител","достойн","кризис","спеш","спор","озер","термин","дик","кругл","дно","повернут","младш","сми","принят","эксперт","уничтож","характеристик","попада","совместн","следовательн","меньш","север","индивидуальн","темнот","дыхан","концерт","минимум","эксперимент","павел","предостав","региональн","пищ","переговор","интерв","агентств","умира","сход","крепк","покупк","генеральн","погод","ограничен","воспитан","христос","сюжет","китайск","тенденц","голуб","грех","присутств","производител","молодеж","проснут","атак","регистрац","окончан","доклад","клетк","летчик","кандидат","символ","везд","перевест","нужда","постара","непосредствен","сексуальн","неизвестн","несчастн","сло","музыкальн","помим","назначен","виноват","смен","положительн","мяс","выдел","парк","статус","тюрьм","полтор","наблюден","разобра","психологическ","покинут","болет","фактическ","глуп","преимуществ","протянут","соглашен","задн","доступн","предстоя","куч","задава","осторожн","устраива","насчет","бок","независим","объяснен","солнечн","выраз","трудност","дурак","ел","сотрудничеств","площадк","уста","кон","единиц","путешеств","классическ","обяза","кот","приказа","де","взаимодейств","импер","сомнева","православн","вздохнут","температур","броса","отрасл","труб","стандарт","отд","воспользова","отчет","добра","удава","страст","цивилизац","дивиз","масл","пациент","денежн","полиц","юг","ставк","соедин","юридическ","ирин","лета","молок","костюм","лоб","стака","сух","дворец","конч","промышлен","спорт","марин","обм","запрет","жал","демократ","взрыв","пушкин","стреля","молч","убива","стремлен","отказ","забот","судебн","нож","вагон","безусловн","популярн","нефт","послед","подписа","мышлен","суббот","округ","выступ","леч","рассчитыва","пятьдес","управля","веществ","академ","продолжен","сантиметр","навсегд","коллект","живот","штук","картинк","корен","затрат","деревя","возвращен","образец","земн","професс","школьн","вон","коммерческ","полов","сыгра","гостиниц","кампан","заболеван","утвержден","выдержа","сел","космическ","повезт","послуша","слушател","привезт","пауз","палат","кред","пьян","приложен","заплат","убед","сэр","сверх","различ","тро","отмеча","воскресен","восприят","грязн","доказательств","делов","пятниц","кольц","продавец","захват","персонаж","величин","напряжен","преподавател","крестьянин","отказыва","предполож","пойма","сельск","подожда","вершин","доск","японск","секрет","достига","защища","воспринима","выда","япон","ручк","одинаков","имуществ","кур","свидетельствова","подтверд","понедельник","строг","дыша","портрет","противоположн","схват","ядерн","порог","внест","окончательн","объединен","сектор","гуля","подар","луч","заключ","окружа","соверша","крут","привычк","уникальн","лейтенант","пресс","испытан","эмоц","применя","девя","вступ","транспорт","наступлен","проявлен","хвост","актер","ленин","рекламн","васил","воздушн","вслед","уголовн","свидетел","килограмм","экзам","вывест","тянут","ощуща","менеджер","цикл","удивлен","еврейск","разумн","инвестиц","надп","сумк","евген","сигарет","успешн","забра","нема","природн","облак","цитат","полос","рейтинг","реализова","таков","указан","поход","вынужден","владет","воин","атмосфер","том","поступок","обойт","баб","последова","памятник","офис","отел","телевиден","арх","осуществля","инженер","удив","нац","знакомств","режиссер","текущ","дневник","влия","санкт","бега","кнопк","сделк","неприятн","петербург","остаток","аспект","спортивн","поддержа","израил","программн","секретар","выясн","распространен","правов","океа","налогов","бесконечн","скрыва","посетител","мгновен","отсутствова","сохранен","умен","император","вселен","прож","намн","признан","губернатор","стад","тверд","останавлива","джон","инициатив","ремонт","масштаб","отпуст","терпет","пятнадца","летн","снижен","наступа","привлеч","выигра","дым","критик","выража","оплат","протяжен","параметр","лекц","танец","радова","распоряжен","щек","татья","заработа","обсуд","рубеж","интеллектуальн","коробк","агент","замен","критер","посыла","происхожден","эфир","смешн","потребова","приятел","семинар","вуз","рекомендова","сервер","публик","молитв","очк","таблиц","юн","сда","ненавидет","сопротивлен","справ","удач","полицейск","признава","сбор","мирн","колес","намерен","дружб","крест","неожида","ужин","двигател","длительн","планирова","юнош","талант","автомат","перем","звер","гол","дискусс","пережива","труп","прекрат","поворот","священник","сочинен","упражнен","наказан","стратегическ","моральн","чрезвычайн","упомянут","приближа","меч","обработк","мобильн","нын","непонятн","сложност","мешок","совест","дива","охот","трудов","наркотик","сообществ","гитлер","пассажир","областн","описыва","поэз","убра","закрыва","прем","рыночн","опуст","сценар","четк","психолог","код","жил","ув","экипаж","кат","контролирова","помощник","корм","лед","итал","кост","ассоциац","предпринимател","увелич","распростран","спектакл","порт","петрович","краск","дочк","предусмотрет","ракет","постановлен","зря","гряз","свидетельств","задума","крикнут","песок","темп","избежа","маш","потолок","аудитор","привычн","отпуск","гарр","тщательн","анекдот","ангел","монастыр","маршрут","необычн","пыл","прочест","приглаша","демократическ","проверя","идеальн","оборот","паден","бесплатн","надет","никуд","боец","ровн","введен","аргумент","ткан","казахста","переж","склад","яйц","запрос","нужд","довер","нежн","горл","столик","предназнач","формат","британск","покр","трат","съест","адвокат","опытн","пистолет","миш","подросток","бомб","башн","навстреч","подразделен","заведен","питер","навык","хозяйк","достав","вытащ","богатств","понадоб","верховн","мот","поражен","туалет","сохраня","белар","тревог","набра","остановк","дор","жесток","выходн","административн","дрожа","плод","судн","борт","прожива","самостоятельн","впоследств","контракт","диалог","пахнут","заговор","свадьб","тума","прибор","восторг","подчеркнут","лорд","качествен","лен","точност","превраща","выпуска","высказа","девчонк","персона","воскликнут","майор","оценива","обернут","молчан","побежа","мальчишк","предоставля","разда","оператор","конституц","карточк","подава","поселок","пораз","кодекс","аналогичн","беремен","хран","исследовател","исчеза","француз","замуж","препарат","игрушк","конструкц","сезон","формул","рассмотрен","заглянут","пробова","посад","дон","кулак","физик","всеобщ","насил","жест","нанест","исходн","вынуд","обслуживан","освобод","иван","англичанин","бригад","выз","дешев","капл","лаборатор","гибел","полчас","паспорт","подозрева","обязательств","горн","протокол","дар","рекомендац","лекарств","максимальн","объявлен","минимальн","одинок","мороз","замечан","карьер","отдыха","стандартн","высказыван","лов","шар","запомн","несомнен","дим","альб","вокза","надежн","записк","вооружен","разб","справедлив","страдан","нередк","осуществлен","дач","гарант","издел","партийн","космос","привлека","противореч","нервн","лондон","горьк","отнюд","украинск","воева","мог","тест","подъезд","приобрета","миг","оруд","сзад","скромн","чечн","пятн","заметн","почв","пул","груз","польш","коммунист","инструкц","двенадца","воображен","груб","аг","велет","германск","посет","проявля","разнообразн","отойт","сборник","глобальн","каф","факультет","куст","стихотворен","методик","догада","битв","советова","холод","удивля","разведк","успоко","потенциа","одиночеств","фантаз","якоб","производствен","мин","волк","прояв","ущерб","незнаком","мокр","расширен","закрича","палатк","салон","великолепн","образова","натал","разруш","отража","лезт","голод","выстрел","столет","ключев","шкаф","николаевич","победител","доверя","костер","жанр","зимн","вступа","философск","объективн","трагед","уезжа","священ","жалова","четверг","фестивал","ненавист","холм","частот","вечерн","контекст","коп","удовлетворен","узел","испыта","вред","жалк","финансирован","нигд","неплох","побыва","идеолог","зарегистрирова","командован","отрицательн","убежден","зван","жалет","ска","вторник","выш","непремен","обвинен","искусствен","вынест","исключ","антон","литр","иисус","учебник","тьма","превыша","лент","христианск","недостаточн","готовн","начальств","лесн","исполня","нагрузк","объедин","зарубежн","душевн","раб","корреспондент","спутник","цеп","пропуст","потенциальн","розов","почита","наташ","идеа","эпизод","учест","сетев","виз","орд","конкуренц","тан","колон","парламент","собор","танцева","соревнован","произнос","глупост","макс","эмоциональн","перенест","роз","городок","подтвержда","распределен","отправля","любител","бар","приличн","обзор","ст","претенз","позва","нападен","рубашк","итальянск","тоск","завтрак","ниж","пенс","восстановлен","турист","инвестор","переживан","сравн","мод","залож","разработчик","везт","рисова","возникновен","заказа","стенк","узнава","веден","единств","мощност","иностранец","статистик","предупред","волнова","повест","музыкант","пьес","десятилет","пожа","осозна","блестя","убийц","извест","печальн","улучшен","яблок","сибир","слев","заявля","местност","экспедиц","зарабатыва","прогресс","цитирова","пояс","королев","квадратн","заинтересова","выгодн","начальн","старух","огранич","нежел","аэродр","допуска","тороп","реагирова","союзник","раскр","корпорац","времен","надоест","задержа","сапог","мелоч","складыва","дисциплин","аз","транспортн","вначал","аэропорт","сокращен","воврем","миф","авторск","сбит","кусочек","берлин","польск","конкурент","существен","маск","жалоб","потреблен","опира","подп","прозрачн","авиац","коров","завест","лож","настаива","изуч","напиток","избра","освобожден","двойн","письмен","приготов","сойт","инвестицион","граф","зачаст","математик","густ","римск","студ","кремл","авторитет","отражен","наканун","мотор","измерен","небесн","подлин","исполн","восстанов","предварительн","искрен","избав","скрыт","экологическ","ки","вожд","компонент","наруш","гордост","невест","передн","отвест","вклад","ру","доказыва","отнест","соображен","глух","металл","неправильн","совещан","кратк","подходя","сопровожда","теоретическ","пребыван","нь","катастроф","окружен","процессор","профил","кварта","законодательн","эксплуатац","домик","пожар","головн","подъ","анатол","металлическ","чудесн","ленинград","слуг","осуществ","удачн","решительн","критическ","деятел","нажа","посоветова","рул","потрат","блин","дважд","спуска","негативн","свеч","медвед","оперативн","помеша","наверх","прогноз","опрос","собеседник","публичн","пожил","подсказа","супруг","устанавлива","мисс","свидан","дедушк","платформ","волод","горизонт","инд","увер","сахар","эволюц","мебел","типичн","пустын","оригинальн","обид","призыва","сочетан","заканчива","чашк","справк","прокуратур","артист","пожела","съезд","профессиона","позад","приобретен","принц","график","отдохнут","сдава","плем","ветк","сталкива","гнев","почтов","слабост","целик","консультант","крепост","церковн","разделя","разбира","правлен","сладк","вида","ствол","заверш","дожда","долин","довест","каталог","забор","фот","суров","невероятн","коллекц","благодарн","преодолет","пуга","целова","испуга","отчаян","спрята","призва","некогд","наград","обыкновен","подел","добыч","своеобразн","противн","царств","революцион","теч","молодец","изменя","ларин","преследова","немножк","ступен","корпоративн","взаимн","государ","легенд","оппозиц","установлен","посеща","посредств","ближн","вплот","градус","ора","экземпляр","демонстрирова","цифров","предположен","наст","тарелк","хранен","благородн","гроз","познан","торча","издательств","двинут","неудач","изда","пушк","слома","муниципальн","паст","снаряд","сумасшедш","мудрост","мрачн","исполнительн","ядр","историк","медицин","виртуальн","тесн","предок","россиянин","сок","плыт","грозн","рассужден","предприня","расположен","базов","сержант","великобритан","преступник","виден","класт","избирательн","электрическ","серебрян","гигантск","царск","словар","кафедр","тотчас","мыш","заказчик","смертн","нин","дурн","вследств","вредн","технологическ","блюд","посол","лап","поз","старин","волнен","веревк","придава","аккуратн","руковод","психическ","тет","нравствен","поставк","закрыт","размышлен","константин","беспоко","архитектур","математическ","прыга","связыва","наруша","срочн","одет","мук","приступ","отч","достава","излож","автоматическ","химическ","указ","школьник","запуст","обыча","общин","ламп","матер","столкнут","актуальн","ветера","рок","разр","лиценз","ошиба","зам","задумыва","организатор","прогулк","проща","королевск","пустот","опаса","подобра","ад","образовательн","рискова","комментирова","тренировк","ох","осознава","рассужда","ежедневн","гран","божествен","юмор","африк","банковск","страхов","уничтожен","устойчив","алкогол","пострада","дизайн","приговор","гарантирова","охотник","расследован","спальн","просмотр","соотношен","белорусск","проз","полномоч","располага","поправк","ощут","сканда","голодн","плам","логическ","совпада","одея","мышц","взаимоотношен","нарисова","изобража"]);
const FREQ_BAND_3 = new Set(["набира","укреплен","ввод","фабрик","сторонник","исследова","направля","съемк","слеп","пещер","энергетическ","рыж","учеб","утрен","поцелова","всемирн","оформлен","намер","подушк","соглаша","замысел","цветн","манер","возраз","приз","утверд","греческ","валер","талантлив","нич","монитор","дракон","регулярн","выстав","препятств","волшебн","истребител","матч","фонар","подтвержден","седьм","лифт","длит","настро","департамент","флаг","владен","элит","батаре","приключен","пособ","сервис","любопытн","покида","успева","коммунистическ","мудр","пуска","бледн","вор","обрест","дорожк","послан","внук","оконч","рассвет","склон","провинц","сформулирова","даб","недалек","подряд","пляж","выж","хозяйствен","поинтересова","пер","модн","перестава","игров","толк","спаса","избега","горд","заполн","маркетинг","железнодорожн","книжн","любопытств","ритм","завершен","подвиг","нерв","обманут","пилот","отз","голосован","миссис","христианин","стыдн","иллюз","ген","плава","держав","сплошн","невидим","радостн","академик","отт","записыва","трасс","екатерин","социалистическ","вад","рим","угрожа","помест","продвижен","проигра","наибольш","леонид","предоставлен","первоначальн","влож","протест","вынос","наполеон","ак","сооружен","сравнива","размест","михайлович","тяжест","бытов","турц","бюджетн","выгод","кавказ","уголок","максимум","перер","тренер","москвич","верх","удовлетвор","подавля","изобраз","шляп","репутац","добива","подчеркива","гроб","ошиб","поздравля","употреблен","александрович","напечата","выяв","бассейн","мэр","поясн","заявк","внедрен","валют","вра","кабин","системн","милиционер","прокурор","испан","служебн","брод","проговор","носител","неизбежн","куртк","отчаст","числен","незаметн","заслуж","достич","кладбищ","эх","утрат","славн","уча","посадк","икон","последовательн","двест","вчерашн","добавля","ботинок","шо","шта","шут","батальон","показан","повес","трога","рассчита","холодильник","ганапольск","арестова","училищ","копейк","ранен","взор","выброс","усмехнут","наполн","выскоч","контор","террорист","чемода","коммуникац","подвест","пес","инвалид","соблюда","натур","покача","распространя","приглашен","комиссар","вскоч","вслух","младенец","развернут","употребля","баланс","подозрен","алис","универсальн","послуж","размышля","морд","постановк","сражен","фрагмент","дыр","торгова","подва","коснут","ложн","семейств","привлекательн","плит","атомн","прерва","заслужива","разрушен","хор","девиц","рука","украст","социализм","шеф","атакова","секретн","столов","посещен","симпатичн","предупрежда","благоприятн","палк","бров","заснут","переводчик","посред","вырва","обещан","равновес","следовател","замерет","посольств","бесполезн","примен","финлянд","бумажк","бабк","нит","мастерск","приезд","подводн","планирован","пророк","федор","оа","возража","пачк","бизнесм","поначал","знам","охват","частичн","плот","библ","производительн","настройк","ветв","расшир","расста","неоднократн","грамм","печ","жутк","красавиц","изначальн","лиз","такс","сия","сол","смет","окруж","консультац","придержива","брюк","приветствова","увеличива","засмея","прозвуча","сперв","вражеск","повыс","китаец","платок","засыпа","ва","рак","просыпа","таинствен","программист","охранник","долож","наряд","коллективн","виде","биологическ","футбол","вступлен","бред","сброс","проклят","пород","посторон","куриц","грустн","чистот","либеральн","убежа","бумажн","отреза","обширн","происшеств","шосс","стуча","отмен","ям","ножк","подлежа","идиот","выплат","создател","соблюден","плен","снимок","ложк","топлив","наста","рожда","ковер","громадн","маг","сража","обня","заметк","фина","избирател","бессмыслен","счест","галере","полетет","строительн","монет","финанс","несчаст","жидкост","исправ","слышн","полгод","голосова","фундаментальн","столб","защитник","специфическ","гна","присущ","вирус","денис","бурн","выеха","обуслов","охраня","плотн","мыт","повлия","загадк","забавн","сунут","прошепта","безумн","твор","минус","свест","отход","доз","облик","резерв","проникнут","удержа","исполнител","присоедин","проеха","наслажда","дипл","цепочк","тащ","автомобильн","морал","мусор","арест","формирова","юрист","пропаганд","бород","тариф","беседова","нефтян","разделен","терпен","робот","шапк","выслуша","удал","откровен","худ","рядов","отбор","устал","старушк","уснут","выпаст","полюб","выделя","рыцар","дежурн","отрица","светла","частиц","динамик","педагог","ирак","всерьез","иоан","локот","свойствен","посидет","звен","ивановн","заслуг","продемонстрирова","преобразован","ол","регулирован","формальн","испорт","гостин","прята","шок","тур","банд","наслажден","уступа","законопроект","туч","близост","свернут","гитар","позитивн","балкон","щит","спокойств","всевозможн","тыл","догадыва","осмотрет","египет","привлечен","выпускник","недвижим","мон","поцел","прощен","обвиня","чемпионат","артиллер","собственник","невольн","доставк","оттенок","иск","поступлен","гипотез","командова","ввид","отъезд","размещен","пожалет","уверя","возбуд","театральн","лозунг","разглядыва","страхован","надолг","пребыва","развлечен","папк","юност","посуд","прикр","сформирова","стрелк","достоевск","обознач","маркс","принципиальн","доставля","фаз","напаст","сорт","кровав","обидет","фашист","турнир","звездн","проспект","вынут","стойк","прилож","грузовик","полден","свыш","устав","георг","стрельб","оформ","болот","контрольн","авар","интеллект","послыша","перечен","инстинкт","дорожн","строчк","возглавля","рас","классн","побереж","отозва","карл","крышк","желудок","васильевич","ведр","тактик","нул","молн","стекля","чеченск","японец","лавк","тезис","разглядет","внос","григор","плащ","оглянут","значим","принадлежн","рухнут","возраста","важност","сужден","заболет","компенсац","облегчен","валя","поставщик","христианств","уточн","недовольн","казак","наблюдател","рукоп","поглядет","пользован","платеж","смел","удержива","таблетк","изготовлен","медал","языков","ведомств","беспокойств","педагогическ","моряк","оправда","сед","поэтическ","джордж","мощ","желательн","приблиз","прида","ельцин","величайш","акцент","замолча","приблизительн","лома","правительствен","торжествен","предшествова","дьявол","руж","примечан","блеск","пальт","оптимальн","встав","вопрек","бунтма","халат","арабск","сниз","крыс","казн","служа","развод","драгоцен","колебан","мух","заодн","цк","капитализм","снг","весен","могуч","ледян","жар","разбуд","рассмея","предупрежден","нынч","велосипед","оон","фантастическ","рецепт","са","махнут","сме","творен","кредитн","картошк","мелод","загадочн","студенческ","отыска","вкусн","шестьдес","пробормота","потерпет","мастерств","радиостанц","конгресс","повсюд","внешност","пешк","персональн","бюр","раздража","столкновен","идеологическ","отлож","штраф","испанск","восприня","снит","муч","джо","дополнен","подчинен","цех","подчиня","волг","здравоохранен","наруж","сократ","упомина","прошедш","приоритет","бензин","ленинградск","обрадова","повыша","вмешательств","зерн","ток","стоянк","гонк","обув","занов","льгот","си","дневн","объединя","демонстрац","гармон","ориентац","модул","крым","подверга","пообеща","повседневн","милост","элементарн","анализирова","интерфейс","стрел","охватыва","дав","усилен","неверн","группировк","люк","восьм","турецк","претендова","отобра","праздничн","уст","перееха","квалификац","незначительн","сыр","незакон","ха","снежн","сергеевич","президентск","скучн","обма","зрелищ","купец","гриб","фрукт","ненужн","глянут","немал","бан","минова","передов","потряса","пулемет","туп","плоск","церемон","ступеньк","перенос","большевик","возбужден","живоп","советник","оригина","соперник","поруч","балл","бока","юбк","стр","экспорт","дра","новгород","худш","конституцион","вспышк","стабильн","прохож","сиден","людм","разведчик","нищ","разреша","обнаружива","альтернативн","функциональн","инспектор","нал","понест","интерпретац","отвернут","свин","потряст","рациональн","предъяв","латинск","прибав","охотн","воспитыва","желез","госпитал","геннад","поменя","намек","ван","хрен","вдво","оторва","климат","лук","целев","постройк","пленк","ира","старост","разнообраз","первичн","администратор","сопровожден","кожан","зме","биограф","отверст","экспертиз","белорусс","рюкзак","строен","кружк","ноутбук","галин","поклонник","поконч","молодежн","травм","стремительн","сорва","тетк","адмира","прислушива","аж","дур","бедр","потомок","тв","операцион","отня","освет","слон","полезт","предусматрива","печатн","любовн","непрерывн","панел","сдач","патрон","интеллигенц","магическ","феном","вертолет","парол","отечеств","гениальн","забира","рассылк","полноцен","печал","опор","освещен","пейзаж","печата","совершенств","артур","конча","боевик","овладет","снаруж","заглядыва","речк","совокупн","торговец","пиджак","величеств","каш","жажд","космонавт","пехот","драк","фашистск","диагноз","стесня","земельн","вытека","свод","иллюстрац","сереж","мыслен","возрожден","завоева","ежегодн","раздава","сибирск","солидн","обновлен","кошмар","композиц","сотов","интеграц","исключа","преимуществен","гуманитарн","натуральн","хитр","заста","проезд","диапазон","предпочтен","подхват","кукл","влюблен","прыжок","выделен","головк","чемпион","нанос","листок","периодическ","почетн","ногот","фунт","носок","ярост","колхоз","машинк","сверка","пред","мяч","николаевн","поврежден","мвд","топор","воплощен","ориентирова","изнутр","жарк","диет","ес","часов","поправ","присест","заработн","современник","канад","конверт","вен","ремен","отпуска","коммунизм","мм","наилучш","подземн","ус","ник","карандаш","вылетет","разряд","руга","заяц","вкладыва","любовник","зафиксирова","извлеч","нелеп","неподалек","индекс","принцесс","луж","сосуд","хаос","самоуправлен","трагическ","психик","асфальт","воинск","подела","орел","порта","уничтожа","реплик","паш","некуд","объявля","инфраструктур","никит","сесс","телеграмм","умствен","кинотеатр","ритуа","комплект","филиа","учительниц","вечност","танков","организацион","тренинг","сообраз","наивн","ознаком","коньяк","дефиц","оглядыва","отчетлив","зал","рва","сжеч","посчита","выдвинут","правител","паца","пожелан","поддержан","пенсионер","стук","сравнительн","рожа","обход","крестьянск","поддава","касс","простор","наказа","мент","здрав","программирован","сеанс","четвер","подружк","сжа","поест","столичн","возврат","скамейк","спортсм","телевизион","перечисл","юл","старт","св","скот","изобретен","обуча","усест","петровн","алгоритм","освоен","ката","перестройк","полев","продела","заст","работодател","кирпич","убежда","клиник","порожда","аренд","пропуска","предпочест","троп","сосредоточ","матрос","механическ","затылок","раздражен","водн","задумчив","инфляц","намет","локальн","потянут","степ","календар","закат","дожида","ширин","донос","оранжев","повред","поспеш","всюд","написан","шепта","субъективн","демон","десят","поп","гнезд","одиннадца","торжеств","модернизац","переписк","барьер","пита","митинг","прижа","опер","сознательн","госпож","самоубийств","прибега","ранг","мыл","поэм","коррупц","оркестр","запреща","шарик","жир","газов","грохот","орбит","финск","подразумева","палочк","вруч","пожалова","госдум","упорн","аромат","подбородок","минск","трист","осуд","надева","суп","оо","объят","полноч","вытянут","бур","разочарован","ок","совершенствован","общежит","упуст","аналитик","гражданств","огонек","разрабатыва","обитател","прочн","соседк","фильтр","тронут","ура","ерунд","реза","проника","мужеств","эстон","шофер","параллельн","прова","задержк","вправ","вопл","ур","кляст","жирн","товарн","недолг","сопротивля","гладк","призрак","провожа","условн","мышк","адекватн","таможен","захватыва","экскурс","супер","продолжительн","украшен","уменьшен","стройн","публикова","депресс","энергетик","радикальн","справля","уделя","вашингтон","сериа","разорва","овощ","противостоя","сновиден","виновн","фокус","обознача","пожарн","болта","проживан","буш","одева","симпт","переулок","бочк","поворачива","сомнительн","развест","болезнен","осколок","регулирова","тяжк","плоскост","раскрыва","закреп","дистанц","прилетет","годов","увлечен","обследован","дров","мад","отступ","терроризм","ричард","респондент","обряд","зар","привяза","издател","преда","отставк","заголовок","отступа","улучш","изредк","делегац","трамва","комбинац","попрост","завист","роскошн","окраин","скуча","потребительск","прохожден","подач","комед","мед","латв","экономист","решетк","парламентск","деревенск","специфик","функционирован","выключ","вольн","нот","альтернатив","расстреля","шампанск","женат","пропада","специализирова","дурацк","героин","девят","переб","руч","расслаб","перспективн","вспыхнут","гараж","уступ","екатеринбург","тестирован","джек","жук","чин","заполня","отброс","включен","новичок","преступн","идет","крыльц","издава","рубрик","поража","укреп","драм","концентрац","заблужден","налев","дев","перемещен","филипп","спектр","грец","командировк","маха","комплексн","щел","стальн","звуков","простот","актрис","ограничива","чудовищн","рог","грек","выезжа","прелест","глеб","помолча","поработа","чужд","осознан","коричнев","напрям","силов","недоумен","шкур","армейск","исл","иосиф","упаковк","неизмен","ликвидац","винтовк","перевозк","долгосрочн","отклик","абстрактн","неудачн","сюрприз","майкл","наследник","похорон","довод","мусульманин","наб","убира","менеджмент","огнен","окошк","аналитическ","благополучн","порц","тротуар","паник","рейс","рождеств","ручн","светск","обстоя","характеризова","мат","академическ","колеба","заперет","проб","сходств","вздрогнут","осмотр","терап","этническ","глазок","становлен","плакат","вечеринк","хх","основыва","покойн","обожа","блестет","бык","заработок","нем","владимирович","симпат","примитивн","прор","коэффициент","материнск","напрасн","степа","мишк","угада","индивид","поблагодар","восстан","республиканск","влажн","опуска","отвратительн","вылет","пик","пригод","верност","нормативн","павлович","дверц","удобств","импульс","однозначн","кива","приготовлен","ильич","литв","невин","повторен","наслед","поляк","сгорет","боков","пирамид","сволоч","различа","вежлив","татарин","потихоньк","ночева","кача","тираж","убит","череп","ит","чайник","кирилл","ларис","нетерпен","мак","убыток","эконом","легкост","улож","завидова","обнима","энтузиазм","допрос","отклонен","урожа","архитектор","авиацион","епископ","освеща","невысок","вылож","творец","турок","висок","подъеха","поручен","удовлетворя","пузыр","неожидан","ласков","приемлем","друж","смертельн","козел","тамар","жилищн","дерьм","выработа","увол","жилищ","кист","огород","секц","защитн","осво","абонент","гвозд","пенсион","запуск","очерк","лукашенк","наклон","равенств","реконструкц","новосибирск","яд","изб","культ","обезья","акционер","схватк","писан","составлен","спирт","медн","континент","встречн","убега","бомбардировщик","фантастик","опозда","сработа","портфел","сдержива","строител","руководствова","алексеевич","представительств","агрессивн","проголосова","серебр","наследств","базар","уличн","премьер","кружок","спуск","полнот","презентац","скидк","кгб","подключен","сердечн","категорическ","индийск","правоохранительн","жалост","твар","азербайджа","конструктор","сокровищ","колоссальн","перчатк","бедност","украша","ев","предельн","лиша","микрофон","уменьш","командн","аркад","деска","прибыт","формулировк","аналог","стимулирова","содейств","семьдес","тогдашн","колбас","пластиков","территориальн","корзин","свал","кинут","инструктор","превращен","непрост","задниц","имидж","иерарх","ссыла","стресс","экспериментальн","заплака","квадрат","полотенц","платон","содержим","клавиш","изложен","цивилизова","лишен","опасен","лампочк","юкос","индустр","перевернут","сельскохозяйствен","путешествова","молочн","стру","галстук","обманыва","гранат","нра","изм","обижа","вда","напада","кабел","туфл","сжима","изящн","накоп","превосход","пен","стату","обвин","трезв","монстр","протягива","распад","возражен","украс","береч","проводник","шага","высказыва","воз","неведом","проектирован","унест","прекращен","петербургск","устран","нежност","сынок","грамот","швец","хим","тысячелет","тревожн","заповед","пруд","входн","выживан","стыд","заменя","толка","бабочк","автономн","игнорирова","разойт","пробк","влюб","мрак","артиллерийск","подоб","восхищен","препятствова","отчая","ходорковск","совпаден","заброс","чаш","рам","бирж","поселен","мотивац","структурн","дит","валентин","оплачива","буржуазн","интуиц","спинк","ничут","снижа","отраз","араб","отвращен","исследовательск","ведьм","колодец","выгна","географическ","отста","анкет","роберт","марш","обслужива","заклинан","алл","ловушк","взятк","оказан","колледж","родительск","пароход","новогодн","грандиозн","упор","девк","бормота","издержк","расстройств","кла","незнакомец","овц","сосн","отвезт","промежуток","валютн","окрестн","толчок","фут","оболочк","выезд","дружеск","классификац","декларац","витал","функционирова","отступлен","нискольк","билл","разновидн","шерст","гром","мгу","тупик","интенсивн","одиночк","матушк","превосходств","конфет","преподава","ла","грамотн","этик","челюст","налож","романтическ","расстав","вмешива","приближен","переворот","бухгалтерск","необыкновен","проезжа","ползт","интонац","шведск","стереотип","нат","закономерн","собач","прикрыва","сумерк","разруша","дж","упоминан","благополуч","беженец","улетет","воспита","диссертац","оправдан","ролик","заряд","взвод","плева","преодолен","пластинк","эдуард","вздох","успокаива","марша","провал","отвергнут","изготов","редкост","придумыва","сотруднича","австрал","агресс","табличк","выстро","профилактик","группов","одобр","марс","вич","поля","поздрав","новеньк","уютн","подбира","очист","наполовин","сбежа","дут","гибк","выдержива","умоля","встро","ворон","гогол","поистин","выуч","гвард","джинс","очнут","жительств","заказыва","стимул","соотечественник","заложник","конвенц","отпечаток","выдач","покрыт","чересчур","должностн","армен","графическ","композитор","интимн","накр","швейцар","покрыва","отрывок","сук","зад","отстава","неподвижн","колонк","рюмк","печк","прит","владык","кадров","чудовищ","купол","тигр","плотност","выреза","смит","делен","жажда","сетк","эстетическ","олигарх","любезн","пута","всадник","австр","ответн","рыбк","излишн","газпр","юбил","ловк","салат","матриц","полотн","вблиз","документац","нелегк","ат","справочник","витрин","управленческ","повествован","киевск","палуб","дет","сотвор","поигра","капиталистическ","приватизац","союзн","оппонент","посредник","недовольств","официант","электричеств","налад","выб","плаван","щенок","спид","дальш","скол","старец","наполня","расписан","дипломат","задет","подав","кубок","вертикальн","сегмент","горшок","обидн","мамаш","неважн","навод","модератор","куша","подключ","сознава","средневеков","грудн","нибуд","па","давид","пирог","алеш","промежуточн","боб","ирон","отработа","осужда","афганиста","славянск","безум","закур","приподня","позабот","велич","изумлен","штурм","поисков","выработк","банальн","тетрад","серд","певец","вложен","шумет","поиска","доеха","исчезновен","склонност","лиг","набережн","энергичн","назнача","магнитн","негр","коммунальн","уговор","клавиатур","олимпиад","залезт","аппаратур","ликвидирова","поведа","армянин","страж","пограничн","злоб","оскорблен","кончик","букет","кассет","налет","профсоюз","посел","медсестр","обложк","кпк","позор","вдов","парижск","тихоньк","европеец","находк","шлем","меньшинств","нараста","сара","чувствительн","повторн","изобрест","престол","вздыха","бешен","купа"]);
const FREQ_BAND_4 = new Set(["пытк","навест","парочк","проанализирова","пристальн","критикова","здешн","мча","горожанин","вороб","кролик","фундамент","ба","спонсор","королевств","герцог","оборачива","ссор","внуша","оправдыва","именова","подвод","порядочн","роков","ступа","песенк","восемьдес","олен","настойчив","бараба","катер","платн","парус","любова","отключ","равнодушн","зажеч","коре","удаля","расстава","минувш","злост","вторжен","эр","рож","властн","тряпк","показ","залог","ферм","позна","порок","искр","оргазм","монопол","запланирова","койк","выигрыва","аптек","догна","парадокс","титул","треугольник","детект","подозрительн","кислород","враща","прыгнут","плавн","вампир","атрибут","витамин","аппет","завер","инстанц","отнын","отм","роскош","крошечн","напуга","ниш","маргарит","презерват","чеченец","глас","добровольн","враждебн","мартин","удален","немног","лю","кошелек","восстанавлива","восхища","распахнут","кор","неправд","криминальн","улов","поверх","бедств","барон","тяг","скольз","хирург","рыбак","фотоаппарат","рычаг","недоступн","простын","израильск","наименован","девян","прикладн","диаметр","колокол","побежда","аукцион","стон","проститутк","пятьсот","увлека","поглядыва","вар","жан","исламск","тор","месторожден","маркетингов","фирмен","пустяк","очаг","спет","символическ","глад","компромисс","жа","выставля","жилец","смелост","солнышк","кир","грузинск","капуст","уменьша","обеда","инновацион","дружн","вообража","сказыва","бессмертн","смутн","погибш","газетн","выкинут","тематик","погруз","розничн","путешественник","сажа","тройк","ка","обладател","индеец","лит","дизайнер","бег","дырк","бухгалтер","констатирова","преследован","подбор","спецслужб","хлопнут","прослед","вмеша","туристическ","ясност","блондинк","жоп","кпрф","отстаива","елк","поразительн","комп","прописа","обита","господств","загрузк","апостол","трус","внесен","инфекц","галактик","фсб","спичк","электроэнерг","интерьер","устранен","маневр","кпсс","мучительн","ал","договарива","облегч","компьютерр","полоск","русл","взлетет","предпосылк","отделя","холл","босс","предлог","олимпийск","шевел","ворова","извиня","предпринима","служен","казан","просторн","всяческ","сочувств","всероссийск","петл","сует","евангел","шумн","предста","статистическ","уговарива","ничтожн","подчин","эскадрил","медик","ревност","трещин","намерева","недр","камин","предъявля","противостоян","экспертн","прилавок","отчетн","продвига","гад","франк","линейн","протека","мотоцикл","доброт","сталинск","накоплен","престижн","скук","шепот","тропинк","шин","подполковник","батюшк","нервнича","мудрец","комсомольск","наркома","скака","беспорядок","герма","федорович","шпион","кипет","бревн","туризм","крив","го","докладыва","резинов","нол","ласк","шедевр","взорва","кос","удостоверен","каникул","бесчислен","просмотрет","взам","хлопа","допустим","пролетет","классик","пульт","мировоззрен","бак","станок","поспешн","наткнут","шахт","фашизм","полюс","любовниц","нейтральн","вторичн","нехорош","луг","осматрива","футбольн","военнослужа","засунут","занест","жидк","груст","бессознательн","насеком","партиза","молчалив","разбит","убедительн","эрик","венедикт","этак","таска","шагнут","излучен","очут","даш","армянск","замерзнут","вячесла","фракц","разноцветн","присыла","прибыва","бренд","возглав","хрупк","выпива","нап","будд","октябрьск","невыносим","сертификат","сказочн","вытаскива","чайн","мелька","адаптац","эшелон","дипломатическ","шка","фонта","заора","соединя","страстн","урод","людск","основател","лауреат","толкнут","конкурентн","ворва","котел","выявлен","проработа","тормоз","преодолева","патриарх","мониторинг","энциклопед","см","одесс","натянут","увезт","знаток","буд","трибун","виднет","соф","предпринимательств","хохота","застря","глоток","благотворительн","организовыва","принтер","недовер","ввп","прикосновен","конкурирова","кислот","ухажива","сходн","добыва","проволок","обрабатыва","сконча","чех","издалек","иерусал","смуща","морожен","белок","легендарн","усилива","смирн","табак","сообража","наня","преоблада","обозначен","моделирован","неясн","завет","поставля","предотврат","увест","владивосток","неловк","просвещен","кузнец","завернут","мурав","лопат","заеха","провинциальн","исток","откликнут","завал","богин","коляск","количествен","физионом","мелькнут","передвижен","отметк","прогрессивн","связк","классов","впада","привыка","раствор","нажима","превосходн","чрезмерн","возмущен","вылеза","завтрашн","джентльм","скача","влеч","влев","ассортимент","повар","устн","мусульманск","бегств","огурец","ребр","реценз","леш","прах","подоконник","пробежа","излага","толкован","прикрыт","ежел","лид","телекана","интерва","был","логичн","братец","губерн","постуча","тороплив","винт","деян","отдален","фиг","вик","православ","голланд","затруднен","брачн","горбач","порва","сар","багаж","толщин","трижд","нехватк","зажа","мистическ","чуш","синдр","сиян","веб","доктрин","тряст","истерик","штурма","уцелет","фланг","жева","такт","донест","глагол","обоснован","угод","генр","рекорд","хуа","открытк","итальянец","примет","электричк","хм","сугуб","прощан","лыс","круж","пышн","предвыборн","цирк","почк","колюч","президиум","клиническ","затронут","новинк","обруш","сбега","вознагражден","птич","орех","продума","презрен","речев","возбужда","спасител","равнин","подвергнут","сект","присво","отверга","предан","сбыт","массаж","злобн","горизонтальн","затянут","целостн","джеймс","посылк","балтийск","повестк","бездн","хакер","запасн","дож","вообраз","полярн","террор","якор","вправд","уравнен","бакс","разбор","согласова","персон","гореч","телесн","продюсер","католическ","покраснет","пролетариат","географ","архитектурн","гимназ","усво","сборн","анастас","помех","растеря","крейсер","васильевн","египетск","аплодисмент","дэвид","завяза","генетическ","сдержа","безработиц","вычислительн","поздравлен","перекресток","социологическ","конструктивн","митропол","сочиня","пошлин","солдатск","благосостоян","снят","кавказск","фальшив","грант","расстро","жюр","крем","достоверн","обоснова","пассивн","поклон","плюнут","звучан","теракт","древност","томас","ансамбл","крохотн","предательств","прохладн","метафор","резюм","фиксирова","грядущ","нор","печен","егор","тарака","русла","нтв","обочин","противоречив","близнец","старательн","преподаван","ос","героическ","выбрасыва","переезд","разм","предвидет","договорен","прижима","глин","переработк","трон","взнос","ксен","хвал","стрелков","пищев","ленинск","алтар","очаровательн","рванут","референдум","одобрен","гул","крючок","биолог","балет","квалифицирова","рыда","чайк","запрост","божеств","мета","порошок","выясня","пушкинск","документальн","добродетел","выписа","узор","высла","джим","стадион","дрож","человечек","подписыва","согласован","родд","трудя","либера","новорожден","секретарш","подсознан","подсказыва","проповед","запуска","факс","комфорт","трансформац","парашют","господствова","верхушк","горк","процентн","цензур","птичк","мутн","интриг","многолетн","стира","недар","неопределен","насквоз","сумочк","обломок","пересеч","шуб","загна","бокс","мамин","смир","рискнут","поблиз","ударн","петух","упира","компенсирова","немыслим","заветн","стрелок","античн","двадцат","убежищ","котенок","веда","визуальн","инженерн","кида","умерш","бес","упрек","ненадолг","отнима","драматическ","ягод","неприятел","личностн","нитк","сдвиг","неудобн","стоп","пыльн","благословен","уральск","крымск","вит","массивн","отправк","нищет","гимн","патриот","жрец","шестнадца","пристраст","гигант","бульвар","нарочн","дуб","присн","воздействова","словесн","синтез","уборк","сужд","шит","привоз","страничк","проглот","перехват","местечк","припомн","составн","шахмат","задыха","ущел","кристалл","десятк","шелков","цвест","промолча","перемен","университетск","сти","наружн","вилк","старичок","гал","пепел","частеньк","слыха","прихож","сплош","ведом","добира","полководец","мамочк","заверша","снест","избыток","импорт","повиснут","мурманск","механик","возмещен","спорн","борисович","влезт","взволнова","освобожда","динамическ","контур","гудет","раковин","выдержк","ячейк","бродск","андреевич","вал","моментальн","брэнд","зрел","проигрыва","страховк","тактическ","фигурк","базирова","лабиринт","поб","прислуша","разброса","ремесл","затрагива","ослаб","обыск","терпелив","выигрыш","обрета","акционерн","фрейд","низш","ввс","зо","рабств","сашк","вытерет","кают","попадан","окоп","практикова","конфигурац","надзор","приказыва","ярмарк","экспозиц","заключительн","хроник","скульптур","распоряд","библейск","косвен","ир","инспекц","откладыва","органическ","прорва","лга","разбойник","переходн","скам","погуля","обыден","террористическ","шоколад","брон","зрительн","предислов","пуговиц","треск","произвол","вдохновен","ленив","волшебник","оптимизм","ошибочн","приют","привязан","верст","африканск","унижен","медитац","расширя","отвод","банкир","неполн","ук","трактор","задолжен","интеллигентн","последовател","восемнадца","як","занавес","перет","щелкнут","прочтен","эмиграц","тая","гибнут","психиатр","хит","передвига","приемн","вцеп","тюремн","вылета","укол","стаж","привилег","фондов","струн","полин","налива","нахмур","веша","коалиц","колдун","погон","пронос","кубик","мех","солов","физиологическ","тревож","грипп","уплат","подсчет","окса","поглад","рассыпа","перебира","булгак","лыж","автоматизац","попол","бетон","прицел","лис","маяк","влиятельн","вихр","антен","венер","погиба","курорт","разочарова","замкнут","предшественник","плач","схож","племянник","попроща","оборудова","ас","стенд","приспособ","погуб","хитрост","отрыва","взлет","приветств","пропуск","родов","воспитател","осложнен","урон","руб","инцидент","издева","презира","игл","хроническ","алле","слива","пыла","вплотн","индикатор","извинен","алмаз","сэм","близ","побег","молоток","поверхностн","утонут","эколог","этическ","ребенк","рельс","наедин","бюллетен","пчел","бен","стал","отвлека","лошадин","раздум","оптическ","указател","гид","выраста","ускорен","побочн","тотальн","сокол","оглядет","хлопот","дополн","летоп","помеща","черв","возлож","диктатур","самец","поликлиник","негодя","собачк","налогообложен","шикарн","адресова","императорск","фасад","кайф","барышн","завоеван","гадост","имх","наплева","закупк","буржуаз","лад","жра","тещ","шрифт","контейнер","оскорб","шинел","палач","позаб","алкогольн","предчувств","михайловн","наставник","догоня","злит","сыт","подвижн","майк","отреагирова","пионер","норвег","сторож","вестник","восхожден","нект","санкц","прочитыва","празднова","разлож","бутерброд","сборк","испуг","соблазн","джип","питерск","слиян","значок","прическ","ласка","устава","похва","арсена","ускор","особняк","пож","просидет","литератор","поглоща","пресловут","приспособлен","цепля","бас","выпада","увольнен","просматрива","снабд","социолог","пересека","пират","лягушк","востребова","прозвищ","хохот","роман","четырнадца","погружа","комар","крайност","ар","оборонительн","потрясен","каблук","александровн","прелестн","впрям","расспрашива","общност","куз","обнов","удел","наземн","диктова","студентк","кухон","ет","свадебн","воспроизведен","пообща","текстов","мостик","накорм","бесла","виц","аборт","досад","мобильник","задолг","перебра","оград","репресс","приток","охотнич","имперск","гоня","паровоз","крепостн","продовольств","га","топ","продвинут","бронзов","обобщен","супружеск","злод","погаснут","гагарин","обр","гриш","звенет","рев","живописн","сочета","нежелательн","укладыва","нагл","дефект","рит","постигнут","блажен","нижегородск","ракетн","изрядн","извол","отб","элитн","убог","поединок","запира","дернут","емкост","очертан","придет","лопнут","ны","скрипк","лирическ","отрезок","казин","перемеща","невск","гарнизон","стукнут","борец","догадк","зубн","развал","ль","абзац","наказыва","взаимосвяз","понемног","диагностик","фрэнк","тост","превыс","хорошеньк","силуэт","милосерд","въеха","компетенц","воспроизвод","мундир","архангельск","развалин","скелет","чешск","влад","елизавет","свист","зловещ","сенатор","возмут","сочувствова","привязыва","сен","обреч","братств","нян","отзыва","умерен","лондонск","дуг","тонкост","приступа","отрицан","неблагоприятн","предател","миграц","эротическ","размахива","покойник","авт","кучк","мерседес","рождественск","жеч","селен","дискотек","надел","капитальн","несправедлив","влечен","стройк","солен","обывател","вглядыва","выбежа","сожалет","мертвец","безразличн","задержива","разноглас","выдвига","свердловск","пришелец","суш","возрастн","вытира","фермер","разворачива","узбекиста","возвыша","комплимент","репортаж","град","икр","рывок","пьер","гитлеровец","землетрясен","вывезт","нахожден","парадн","выдума","провозглас","коррекц","когот","изъя","порадова","присоединя","тоталитарн","резолюц","фотк","экзотическ","минеральн","походк","унос","родствен","бланк","матк","лебед","пасх","подбежа","взаимодействова","сундук","внучк","консервативн","краж","нулев","интеллигент","тонут","осмысл","лечебн","молдов","голландск","благода","парад","реабилитац","доброволец","ком","разбива","противодейств","разгар","крах","впред","выдава","земляк","давност","поощря","загорет","мыслител","незадолг","ректор","таможн","приоткр","обуч","руководя","похит","коробочк","клятв","телег","пляса","прихват","заведом","нетрудн","старшин","исправля","вооруж","кличк","чудн","осет","казахск","сбрасыва","вреза","ля","амбиц","лик","вынима","растительн","осваива","императриц","серег","павловн","бессмерт","репетиц","исправлен","грузов","казарм","рыбалк","изд","картофел","небрежн","отсек","ахматов","вычислен","лезв","вылезт","мерзк","косметик","проникновен","русскоязычн","тренирова","женьк","поперек","крошк","разгр","иркутск","подстав","тускл","намека","вставля","нежелан","приписыва","бунт","рощ","сан","терминолог","необычайн","пятерк","выглянут","штурмовик","пригодн","выручк","обил","распоряжа","снабжен","гормон","ющенк","слушан","укрепля","выт","брем","пробира","плеер","памятн","возвест","сдвинут","перева","курен","паутин","семнадца","снаряжен","доминирова","ткнут","навязыва","бессильн","азиатск","седл","гвардейск","правот","умолчан","полигон","журналистик","больничн","подчас","претендент","устрем","корон","прочност","модификац","болгар","поздорова","предсказа","повинова","коз","многократн","украинец","коварн","аккумулятор","револьвер","благослов","переспрос","обменива","сущ","закуск","планов","блокнот","гу","увлеч","почерк","прибежа","ценов","побра","перел","досуг","светов","супермаркет","ребеночек","реактор","пос","цариц","отбира","окраск","скорб","евросоюз","облигац","вспомогательн","маяковск","бюрократ","неинтересн","неповторим","устарет","утк","санитарн","вектор","унитаз","барак","мемуар","реестр","мерца","острот","стерет","кандидатур","ресниц","авторитетн","чердак","снейп","казен","сверстник","яркост","фин","бодр","слог","несовершеннолетн","кремлевск","торт","магнитофон","гада","методическ","оптимизац","смеша","озабот","куб","экс","пальм","оскорбля","башк","пушист","жадн","самар","молоденьк","листв","провокац","оснаст","реал","речн","ориентир","приоритетн","стив","чат","пятк","извн","комсомолец","альберт","сочин","британ","слит","национализм","подписан","раскрыт","эпидем","провайдер","линейк","заблуд","дрема","дверн","впаст","укр","тал","показательн","электроник","усадьб","лекарствен","софт","бомж","ненормальн","воплот","андре","австрийск","хребет","орл","марксизм","въезд","надлежа","аварийн","чек","мраморн","цент","пятер","патриотизм","чубайс","хранител","вывеск","дан","рыбн","импортн","ныт","дворянин","ть","спартак","вдобавок","тринадца","всем","прекраща","яхт","номинац","дрогнут","песчан","стартова","финансирова","заголовк","забега","загрязнен","гном","рон","хрущ","альф","моис","рассудок","долгожда","ирланд","прокомментирова","дополня","сейф","отцовск","май","минутк","обработа","троллейбус","специализац","одержа","постсоветск","фонарик","паук","подписк","бара","сэконом","могуществ","переп","координат","расцвет","утешен","кишк","стас","зя","тоннел","пошут","молекул","посередин","непониман","отрав","пк","потомств","взойт","верблюд","причиня","замедл","комбинат","зоопарк","детишк","прирост","беспомощн","листовк","стона","экстремальн","залива","канон","предотвращен","складк","рубах","насмешк","обо","достоян","задействова","придворн","певиц","блокад","гремет","дрян","занавеск","масштабн","воспитательн","уместн","алкоголик","процвета","возмуща","перечисля","праг","честност","рсфср","тьфу","дюйм","кастрюл","разыска","клейн","никитин","эволюцион","отдач","смыслов","врожден","разборк","поясня","гребен","самк","отомст","тайг","протестова","пульс","ощутим","приземл","искажен","помидор","кирпичн","димк","покушен","свитер","проектн","размеща","конкурсн","восход","извлека","блаженств","христ","приемник","ож","блокирова","налиц","спиртн","чертеж","изобил","попл","пир","упадок","негодован","пересечен","сата","безнадежн","партнерств","померет","улета","темнет","пшениц","пространствен","верова","употреб","празднован","посмея","некоммерческ","погас","склоня","откинут","бухт","берез","главнокоманд","мид","символизирова","индустриальн","глобализац","пожертвова","арт","мучен","ветерок","применительн","шекспир","цветов","крон","низ","монолог","сердит","вертикал","семенович","залп","ницш","фар","генератор","манипуляц","лавочк","грузин","исчерпа","дружок","швейцарск","пересмотрет","ядовит","татарск","риг","литовск","десант","казанск","засад","изгна","отвлеч","координац","детальн","поползт","мерк","чувствен","содействова","уезд","вертет","потребля","вращен","преград","разъяснен","резервн","могуществен","калифорн","казач","преемник","эльф","хова","римлянин","поднос","основательн","бум","осмел","андреевн","заведова","автомашин","нацел","пошел","сова","соседств","югослав","влаг","ми","неудобств","решим","воротник","сближен","безработн","храбр","троиц","ринут","предсказан","ассоциирова","вилл","фиолетов","вскрикнут","садик","жкх","шаблон","уперет","сбива","банкротств","оперирова","умел","бельг","соса","наглядн","сравним","всевышн","альянс","сбок","безобраз","партизанск","грунт","дэн","иллюстрирова","григорьевич","добавк","почтен","ваз","парадоксальн","крещен","штирлиц","милицейск","послевоен","обморок","хат","профессионализм","воронеж","подда","замира","сбо","быстрот","прилага","недопустим","выяснен","сергеевн","купюр","станисла","предписан","полуостр","крокод","полза","перец","вов","будк","подража","сорокин","пришел","джин","хранилищ","бедняг","раскольник","старан","непривычн","бор","венгр","дерга","произвольн","красавец","троцк","поспа","кормлен","контраст","нюанс","трактовк","есенин","шахматн","блог","хищник","некрасив","измеря","пух","шапочк","инсулин","нечист","либерализм","ди","подъезжа","очевидец","перм","жарен","прерыва","побужда","запет","коктейл","посмет","нлп","вспыхива","швырнут","вовлеч","прикоснут","изобретател","скользк","слюн","вскрыт","совпаст","лак","помча","белк","эмигрант","напарник","демографическ","монтаж","подмосков","отодвинут","пешеход","единичн","петьк","подл","избыточн","напряга","уточнен","устоя","недоразумен","судорожн","забива","робк","зажига","добавлен","офицерск","сирот","тележк","вырабатыва","следствен","подавлен","замешательств","красноярск","опровергнут","эскадр","опц","непредсказуем","стихийн","кинжа","облегча","обнаж","обнажен","правонарушен","активист","настольн","зате","предпринимательск","калитк","водян","ветх","ся","боеприпас","приказан","скотин","вручн","здоровен","пропорц","престиж","иуд","цветаев","спам","гонорар","варвар","пословиц","буфет","огнев","неотъемлем","водопад","славянин","стипенд","радиус","грамматик","вычисл","информирова","пафос","запута","боксер","хижин","золотист","ритуальн","участков","разва","пастух","пробива","пролета","типограф","прим","сострадан","субстанц","копа","султа","бана","майск","кит","широт","отоплен","шама","семен","копыт","напоследок","радуг","увлекательн","караул","раздумыва","методолог","впечатля","дюжин","термина","варшав","гамм","туннел","граб","персидск","спад","вздума","киоск","канцеляр","тыка","неограничен","яростн","разыскива","финальн","знатн","ревет","шрам","изыска","истечен","лидерств","ваканс","серебрист","уведомлен","чистк","цилиндр","компетентн","ср","династ","брошюр","трюк","обстрел","продавщиц","воскресн","роял","шепнут","патриотическ","уил","высочайш","угрюм","дворник","штамп","мыс","фюрер","житейск","чепух","алфав","трактат","отдела","нев","бразил","говн","взлета","дорогостоя","толкова","перекр","уточня","втро","пассажирск","транс","принудительн","воровств","надобн","нереальн","рк","одноклассник","списа","форд","штатн","правосуд","арк","свалк","негромк","кредитор","революционер","обильн","ильин","заповедник","пальчик","разлук","жуковск","мельниц","реформирован","заинтересован","эл","пристава","прикинут","расчетн","хорон","зеркальн","промысел","похудет","трогательн","заявител","вулка","продл","челябинск","бутылочк","зараст","упрям","систематическ","тоненьк","выкладыва","авангард","юстиц","сп","утеша","касьян","улучша","свар","курсант","сокраща","оскар","соратник","нелегальн","контактн","гипноз","боязн","недорог","опомн","перепута","испанец","расстрел","щедр","усмешк","идейн","вым","пополнен","растерян","румын","туг","одолет","скользнут","сперм","пестр","годовщин","визг","анонимн","маньяк","ужина","бережн","ленк","лазерн","срыва","передела","шов","налогоплательщик","поглот","мошенник","родств","уступк","подражан","мужествен","прапорщик","пьянств","безграничн","четверк","выдохнут","теплов","опаздыва","дарова","выписыва","потерпевш","пронзительн","эстонск","пейджер","передума","недостойн","запомина","носов","раздева","легион","арбитражн","овраг","квантов","разреза","пробужден","павильон","машинальн","лапк","скважин","пирожок","осужден","индивидуум","кант","сбережен","капельк","михайл","тощ","ландшафт","монарх","виноград","симон","пролож","издательск","миск","стартов","краткосрочн","гудок","побужден","судар","глота","уязвим","второстепен","курьер","выглядыва","оборва","коммерсант","папаш","офисн","инерц","очистк","дежурств","солидарн","равнодуш","лех","павл","сухопутн","диспл","кредитован","созрет","наемн","пласт","упуска","лимон","шишк","бля","краснет","сослов","татарста","изоляц","аппаратн","влагалищ","ржав","датчик","репортер","нетороплив","многообраз","топол","повязк","разбирательств","одобря","первобытн","вступительн","санатор","переписа","умудр","сверш","псевдон","комендант","сувенир","внушительн","стареньк","авра","фуражк","прикол","месячн","майерс","пожима","туалетн","нырнут","искушен","заросл","забав","диа","викторович","идентификац","содержательн","дискриминац","предназначен","фанат","эдик","собеседован","увод","летуч","бос","воп","клочок","снайпер","перебива","севастопол","пермск","хрустальн","гитлеровск","кп","зенитн","рассерд","выслушива","координатор","идентичн","полива","болельщик","комфортн","целесообразн","гайдар","чулок","осел","толик","неспособн","коленк","капиталист","ньютон","вариац","вовочк","футболк","рубк","девич","мусорн","пророчеств","разрушительн","усмотрен","колокольчик","пьяниц","гибкост","упрека","оформля","ступ","пивн","грешн","тусовк","терза","завещан","солженицын","ухудшен","увида","аквариум","продовольствен","суста","теоретик","двухэтажн","траектор","двойк","сталинград","посвяща","боярин","наутр","дк","проповедова","варен","скрипет","виновник","скатерт","пожен","сахарн","чарльз","психотерапевт","декорац","бриллиант","вещан","эвакуац","насущн","запяст","трех","законодател","бюрократическ","обозрен","неуверен","княгин","придурок","отстоя","джунгл","выращива","скинут","грош","мясн","покор","кинематограф","загруз","превзойт","спирал","выплачива","обител","втянут","наизуст","байка","выразительн","джоната","смут","учредител","улеч","нобелевск","быстреньк","скрип","выпивк","затея","штык","приезж","марф","юпитер","записн","шторм","навязчив","скоплен","корточк","укрыт","составител","наподоб","насчитыва","величествен","графин","истец","холдинг","навяза","заподозр","пастернак","продержа","раскал","притворя","коле","предназнача","кустарник","служител","врат","подскоч","кондиционер","прожектор","теперешн","восторжен","дозор","опережа","восста","шорох","кле","прокат","раздет","угост","дерзк","ненавистн","сенат","крас","указательн","поправля","проблемн","достопримечательн","самочувств","раис","харьк","негд","кланя","процветан","мишен","салфетк","экспанс","послушн","ледник","маркиз","розыск","таз","поттер","скверн","сувор","похвал","хулига","накладыва","тачк","рац","браун","поспор","разъясн","взвес","зов","выруч","процитирова","обитан","опухол","оговорк","мк","пересмотр","стержен","герб","вписыва","бинокл","прослав","выскакива","груш","упорств","вырыва","обеспоко","инициатор","учред","сдохнут","поговорк","отправлен","выхват","донесен","торг","инопланетянин","зрелост","грабеж","уныл","помойк","акул","эмпирическ","действен","норов","безупречн","несоответств","самосознан","экспресс","сент","измер","синяк","братск","вя","оптов","дивн","позвоночник","разгром","раздав","представа","звездочк","обязыва","тематическ","двоюродн","забыт","вражд","лирик","дмитриевич","иномарк","звонк","усад","кристин","тетушк","мишел","расстегнут","террас","конюшн","заграничн","псковск","вздрагива","инновац","улочк","косяк","парализова","поко","ворча","обдума","смущен","пленник","следован","дядьк","пробега","колот","лужк","весл","рис","проклина","редактирова","причудлив","подготовительн","надвига","трафик","сосок","опрокинут","поджида","предрассудок","правя","мотивирова","юношеск","жадност","виск","диалектик","взят","развлека","провоцирова","автоном","блеснут","штучк","машинист","элегантн","рассказчик","собрат","скобк","распуст","педагогик","рефлекс","дилер","спс","пробел","себестоим","форт","эстетик","сворачива","духовенств","помещик","приписа","эгоизм","абхаз","паха","драйвер","терапевт","ндс","скачок","гаван","земск","цельн","затихнут","вселенск","неприличн","угоща","идиотск","миллер","затмен","первенств","оперед","толков","оппозицион","оккупирова","насильствен","нажат","дежур","сменя","скоростн","опоздан","переодет","скудн","барин","диабет","воистин","ступн","съеда","раскол","предсказыва","обхват","контент","злоупотреблен","магистрал","сугроб","корейск","девиз","прил","стихнут","копирован","беззащитн","побледнет","козл","кавалер","стопк","адресат","прошлогодн","соус","поморщ","суверенитет","неформальн","веранд","рифм","малост","пробра","менталитет","яковл","ноздр","вонюч","лабораторн","распределя","ухват","выпрям","обрывок","призван","интегрирова","пластмассов","казахстанск","дивизион","оперет","хлебник","возглас","попуга","останк","трансляц","рейд","отличительн","притягива","исповед","травк","разраз","конв","кумир","футболист","древесин","мостов","выходец","невида","должник","бешенств","бархатн","подвержен","всматрива","бесшумн","инвестирова","педал","здорова","правдив","подсчита","внуш","выборк","зрачок","дева","бродяг","бесцен","тол","наставлен","атеист","хмыкнут","повозк","бонус","рыт","попутн","примечательн","карет","гаишник","переправ","возвышен","состязан","спец","вто","уродлив","спутников","вылеч","прогнозирова","присоединен","унаследова","стаканчик","светк","смугл","урага","шелк","зараз","фишк","преобразова","отслежива","эфирн","изгнан","мит","черепах","обменя","тим","уткнут","копирова","неприязн","праведн","маф","катушк","крестн","сшит","жириновск","док","буркнут","застрел","кувшин","альбац","вруча","телекомпан","лос","грет","безобидн","реактивн","погружен","сводк","подсудим","незнан","рекламирова","шокирова","журнальн","геометр","малышк","повлеч","карел","гнусн","загородн","риторик","декоративн","взаимопониман","покляст","легальн","пограничник","потеч","обследова","штор","выдумк","конек","мексик","цыга","нья","восклица","краев","подмигнут","монограф","куса","абсурд","эйнштейн","лихорадк","инет","вял","санитар","будн","ростовск","тамошн","паренек","сопоставлен","задева","алексеевн","всплеск","нарушител","лестничн","ходьб","прислон","шерстян","таксист","осмыслен","апельсин","расклад","спрыгнут","присяжн","эксклюзивн","покачива","смоленск","та","применим","сжига","выдав","беспроводн","браузер","ребятишк","метрополит","панорам","скромност","захлопнут","венец","ослаблен","воспроизводств","задержан","эсс","концептуальн","служанк","щетк","стимулирован","аспирант","навек","правозащитн","парадигм","регламент","сооруд","приуч","переполн","внедр","свежест","будильник","липк","озвуч","жизнедеятельн","приста","выписк","срыв","иголк","музейн","призрачн","ливен","охарактеризова","фургон","возобнов","воспроизвест","небывал","помаха","шнур","аристотел","поднест","карава","грызт","глотк","крыт","принуд","ларек","комсомол","гороскоп","удочк","нестандартн","незач","подруж","новгородск","оккупац","транспортировк","единомышленник","национа","садов","счетчик","имуществен","запечатлет","библиотечн","марат","пренебрега","сул","фед","сыщик","вскакива","кисел","вывоз","внушен","гендерн","интеллектуа","подтолкнут","присвоен","кончин","рапорт","красова","ри","непостижим","брежн","половинк","берегов","среза","чутк","полушар","задра","романтик","берлинск","старет","омск","лексик","прототип","побуд","зачет","итогов","отбрасыва","всплыт","брест","компактн","тоскова","перелет","беля","пронизыва","вибрац","сигар","влетет","подействова","венок","дружествен","своевремен","покорн","березовск","двенадцат","ро","гимнастик","миллиметр","спровоцирова","турген","пиратск","пролетарск","резиденц","языческ","соснов","кб","зин","напряч","швед","пучок","аллерг","непреодолим","канадск","кошач","наркоман","сладост","вдохнут","урегулирован","феликс","смертност","воспитанник","трапез","ким","отважн","тщетн","захар","наглост","наличн","сс","браслет","путевк","ежик","странност","мним","мобилизац","шур","разрыва","обострен","лих","чарл","прол","багажник","адск","лингвистическ","прикреп","вскинут","шашк","пружин","пристан","фронтов","эквивалент","косточк","умолкнут","пригород","свиса","алик","окон","невежеств","табуретк","развяза","нетерпелив","ревнова","степанович","приверженец","таджикиста","потерет","отсрочк","подкреплен","оклад","барм","вытесн","брюх","прибавля","джаз","факел","темперамент","смещен","участниц","байк","сводн","заимствова","капа","поднож","вынужда","листочек","удосто","очища","патолог","синон","планк","принужден","зонтик","подошв","сир","нквд","гнил","локомот","хирургическ","потащ","льготн","воронежск","доренк","делегат","параграф","унижа","обречен","отсчет","изумительн","расхожден","концертн","беспокойн","единен","наркотическ","катерин","подержа","светофор","путаниц","субсид","вс","материк","нашел","журналистск","перечислен","прип","фотографирова","отменя","калибр","странник","архивн","покуд","пообеда","днк","щелчок","тумбочк","католик","гегел","мифолог","погашен","гм","кар","осад","капризн","молот","тверск","сортир","обдумыва","белоснежн","васьк","расплат","хлынут","заботлив","усомн","трепет","познавательн","параллел","напор","разворот","курск","кишечник","чип","фр","предметн","вьетн","смежн","плитк","накрыва","рван","радиоактивн","наступательн","квот","оратор","нареза","окурок","чехословак","горничн","нагнут","проделыва","тимур","повсеместн","надела","рукоятк","джейн","ге","покос","бородат","однородн","фй","немаловажн","арбуз","язв","днепр","стражник","волев","типов","буйн","гаснут","довольствова","гармоничн","вскрича","разъ","воспален","жертвова","зен","видеокамер","всплыва","крушен","юбилейн","прикаса","богатыр","костыл","очищен","официантк","подростков","нехитр","мерзавец","дистанцион","окрас","словосочетан","шприц","еэс","аграрн","мирон","посланник","уполномоч","патент","репертуар","жалован","отчужден","нащупа","привиден","пиар","морщин","недоумева","теннис","пояснен","перечитыва","пашк","сюжетн","ог","уз","дискурс","подземел","болтовн","равня","бактер","простира","раунд","фу","иммигрант","доцент","эстрад","сарат","геометрическ","треща","совхоз","запретн","наташк","прогуля","парик","справочн","взира","общепринят","гумил","необъясним","сов","удельн","вышк","тропическ","геологическ","ассамбле","двойник","вероник","агитац","диктатор","гласност","отклон","мозгов","представительн","чум","мел","пенис","лицензион","созерцан","райск","валенок","экспонат","кипяток","купл","танцевальн","неофициальн","мечет","вавилон","электромагнитн","клюв","встревож","клевет","храброст","поклоня","выявля","уг","уполномочен","отталкива","имитирова","посвящен","ловл","динам","несложн","перифер","островок","позорн","клоун","днем","руш","доходн","проскоч","мига","лопатк","неуклюж","приостанов","реорганизац","нездоров","святын","завед","неохотн","кризисн","смыт","цска","интерпретирова","крюк","блужда","поощрен","туловищ","гектар","одиночн","веща","магистр","цветочек","формулирова","папирос","бляд","подталкива","вакуум","разыгрыва","тошнот","излуча","психиатрическ","неуместн","нанесен","расплачива","отраслев","односторон","черчилл","петровск","кооперат","би","окружн","нанима","сокровен","свистет","пионерск","холст","концерн","завтрака","обогна","контроллер","бесплодн","приморск","оттолкнут","раскладыва","рождаем","коттедж","стека","лагерн","заводск","образовыва","пропита","напроч","сосла","фигн","пехотн","растянут","инфаркт","писательск","жид","физиолог","плодотворн","шашлык","полис","прибрежн","бедняк","хмур","правозащитник","шата","абрамович","расписа","порочн","актерск","обаян","заполнен","трепета","бросок","самарск","чуя","ныря","иваныч","археолог","осест","диаграмм","распредел","конниц","голливуд","раскопк","эдвард","крылат","рос","геополитическ","пакетик","ярлык","беспощадн","прививк","воздержа","разведывательн","владисла","ответчик","марг","цезар","щелка","бушева","серийн","изолирова","контингент","рацион","подпольн","пьянк","всецел","настраива","клар","экспортн","азарт","вернер","мах","йог","самолюб","венгерск","кашел","вписа","ограб","иммунитет","фигурирова","обвест","аполлон","андерс","миллионер","ипотечн","высокопоставлен","дарвин","обк","закус","реализм","напева","вдох","наследствен","минфин","коврик","автограф","переселен","отр","переглянут","зайц","кейт","архиепископ","искусн","теорем","помилова","вексел","покур","конкурентоспособн","несовместим","разумет","бесспорн","объемн","синагог","лая","стиснут","мгла","владимировн","неприемлем","бомбардировк","алюминиев","сыпа","идентифицирова","впуст","отчеств","навеща","дебат","одар","ле","задуш","исказ","фридр","лидирова","предава","дтп","подмосковн","преувеличен","местонахожден","питательн","торжествова","комок","хлопок","докладчик","солом","притч","строф","опек","углублен","роня","джексон","мускул","новик","опровержен","подлец","обеден","консульств","этикетк","пуск","кисл","побоя","психотерап","дивиденд","любя","закинут","престарел","перегородк","восхитительн","губк","инициирова","мборот","миниатюрн","сидор","алта","неэффективн","умниц","перегрузк","большевистск","неудачник","чашечк","пластин","живет","нашеств","шоколадн","ман","присажива","прозва","обзавест","завладет","прусс","небыт","блиста","фольклор","богач","прибалтик","ирландск","каков","недостава","растая","ивр","болтянск","глыб","абориг","сея","разрез","воронк","разложен","забастовк","админ","патрул","банкет","сверхъестествен","агрегат","посыпа","получател","вдыха","лу","насыщен","котелок","цб","любимец","понижен","клок","дворянск","возлага","богородиц","полюбова","кора","полост","потрепа","голода","достаток","комментатор","нотариус","опустет","смятен","стабилизац","изъят","предпочтительн","возлюблен","мрамор","матрас","рейн","кона","трусик","наблюдательн","избран","подорва","окликнут","соч","покат","пропорциональн","переплет","макушк","устремля","радужн","леонт","бригадир","сла","взыва","артефакт","псих","сжат","товариществ","лазер","канав","брызг","рузвельт","зажигалк","мистик","преподавательск","суммарн","повида","грамматическ","киргиз","новизн","резинк","отстран","прилега","закладк","незабыва","дразн","электростанц","парод","прича","осведом","подраст","присмотрет","утеш","глинян","гримас","черед","выключа","азербайджанск","работоспособн","подсказк","хобб","львов","раввин","линз","порох","бессил","отравлен","верован","задрожа","остроумн","мельчайш","недуг","перрон","выстраива","жак","федоровн","неужт","националист","сверкнут","примыка","безуспешн","грабител","водо","однообразн","высадк","алексе","аккорд","чудак","замужеств","проспа","автобусн","дуэл","накинут","лихорадочн","глуб","неровн","кабак","грубост","превышен","прописк","восьмерк","табачн","релиз","путник","зареза","словечк","скомандова","прецедент","присяг","застрахова","укус","мошенничеств","кри","оживлен","штрих","скорпион","стянут","изнасилован","судорог","налетет","отображен","лукав","богослужен","охлажден","ознакомлен","топа","назл","вовк","накаплива","нехот","насильн","кольк","скульптор","оглавлен","голландец","твердост","ювелирн","визжа","воедин","приветлив","чреват","дядюшк","проблематик","каз","выбега","регистрирова","подброс","скрест","упакова","примирен","терет","зазвон","газон","курин","прислуг","полемик","прогулива","теплот","акустическ","ослепительн","атама","выпускн","завоп","методологическ","канат","племянниц","усердн","матв","избира","мачт","спешк","балк","переезжа","переступ","колокольн","отосла","джонс","выжива","ло","афин","машк","доброжелательн","неравенств","спецификац","карлик","рисован","ров","велика","одиннадцат","потемнет","дачн","раскачива","гра","бритв","подолг","интерактивн","молдав","вытягива","каск","дикар","вдал","танкист","семантическ","расстраива","пекин","зацеп","фыркнут","листа","послезавтр","смирен","свит","корк","эрекц","спецназ","совмест","сожра","спасательн","розетк","эдак","мосиенк","благородств","наименьш","эвм","неуловим","иранск","состоятельн","буфер","хлам","срабатыва","совершенствова","консул","деликатн","иракск","четырест","палестин","преподобн","гусениц","усовершенствован","узник","крис","катастрофическ","клин","ингушет","авторитарн","бегл","сослуживец","сербск","выкуп","цитирован","нормат","розыгрыш","преподнест","развязк","воззрен","эг","таиланд","слесар","пом","ташкент","мобилизова","нацистск","пластик","колод","хлебн","ул","влюбля","институциональн","выставочн","наслад","твет","совместим","константинович","высад","нарядн","тира","забвен","развлекательн","красноармеец","утоп","женитьб","мироздан","капот","ефрем","чикаг","комбинезон","постулат","противопостав","археологическ","директив","динамичн","еж","вологд","презрительн","приговарива","расправ","поручик","кругов","начинан","свекров","потрога","конвейер","строгост","настр","безымя","пузырек","вглуб","прокладк","заготовк","расстрелива","опорн","проф","разбежа","светильник","ухмыльнут","платежн","триумф","рент","сперед","псков","нпо","обладан","мышечн","идол","ганс","дистрибьютор","развертыван","распаст","добродушн","сенсац","бах","эксплуатирова","гривн","бран","размножен","изобразительн","полосат","причастн","наброс","химик","ходатайств","палестинск","съеха","баннер","вхожден","ион","трактова","избежан","врыва","колпак","глюк","жалобн","пониз","исповедова","наклоня","тапочк","синтетическ","популяц","клип","насмерт","социум","астрон","оберега","загоня","порекомендова","промелькнут","похлопа","хожден","безразлич","метел","аксиом","выспа","буддизм","спасительн","техникум","ввоз","продуктивн","павлик","взрыва","дубов","гостев","подставля","дин","датск","свечк","отворачива","носик","норвежск","вахт","окинут","красочн","стишок","феодальн","дагеста","муниципалитет","колхозн","устраня","подделк","нарк","толстяк","манипулирова","хищн","нечая","множествен","краснодарск","лермонт","кураж","опроверга","поклонен","шеств","биш","ик","оскорбительн","упрощен","почет","тимошенк","хабаровск","поболта","астрономическ","подб","перереза","джонсон","покаян","исцелен","одержим","военноплен","элизабет","нововведен","эвакуирова","натягива","томск","ск","аэс","рельеф","прощальн","коммерц","алкоголизм","безобразн","растворя","чужак","оливер","приведен","лом","крестьянств","нар","шарф","подтянут","дека","отмахнут","заемщик","папочк","комнатк","экстрен","затрудня","яросла","стиральн","бухар","извлечен","квитанц","транше","волокн","цру","профсоюзн","политолог","гражданк","фом","ласточк","картон","византийск","регистр","драматург","преуспет","форточк","чайковск","затоп","мигрант","поводок","ягодиц","подсистем","баночк","тюменск","напо","снабжа","подпол","политбюр","сертификац","информатик","покровител","проповедник","княжеств","дубинк","отделк","шнурок","струйк","затягива","спохват","пи","дальност","оговор","калининград","заткнут","манифест","натиск","отбива","бунин","вдалек","сношен","избива","милостив","намеча","шипет","намекнут","выздоровлен","таинств","малолетн","депутатск","нацист","трудоустройств","набок","лепесток","коммуникативн","опозна","тренировочн","стрелец","рубц","пятилетн","поучительн","сверток","баллон","попутчик","вывернут","услыха","доработк","вентилятор","энтузиаст","чертовск","десантник","веск","избавлен","устремлен","наследован","уклад","монастырск","напрашива","тракт","башмак","катан","распозна","перемест","опушк","пристро","подопечн","сопутствова","содружеств","витьк","компарт","камешек","волгоградск","кофейн","издевательств","тошн","рявкнут","буратин","свиреп","домен","эталон","цветочн","цыпленок","произношен","униз","шурша","ожесточен","споткнут","проекц","лошадк","гардероб","пром","пепельниц","провалива","ежемесячн","занос","авиакомпан","волч","галлюцинац","дорож","фет","балтик","почеса","энгельс","лужайк","бумажник","голливудск","ментальн","яковлевич","рассея","ностальг","нидерланд","ис","мох","расставан","трехмерн","иероглиф","изнасилова","корректировк","кинг","каприз","сливк","подсознательн","повелител","чад","зата","ярославл","отваг","уют","поужина","приднестров","спута","ауд","страховщик","ожив","перераспределен","владимирск","наведен","вт","кромк","вологодск","телохранител","сплетн","марксистск","корректн","анон","бугор","чехол","клинок","афиш","погреб","абстракц","дочерн","общечеловеческ","почин","бессонниц","овладен","отрабатыва","высунут","бородин","холмс","весом","нависнут","феникс","слета","мозаик","промокнут","упруг","алин","дальневосточн","окровавлен","слом","зачат","прилич","утечк","апр","парнишк","усерд","плотин","маршрутк","прибегнут","клав","напоминан","ожог","разгон","раздоб","закладыва","регистрацион","мстит","назарба","сабл","окт","простоя","преувеличива","ножниц","прослуша","бездомн","невзир","надзирател","трактир","разнест","насос","говоря","магазинчик","подлост","кроватк","озадач","вручен","дымк","контролер","высыла","безжалостн","профилактическ","хрипл","воткнут","овладева","неразумн","землянк","алтайск","чрез","грешник","гибдд","перевезт","начинк","котлет","учениц","забеременет","прусск","пухл","зева","ассистент","дошкольн","аргументац","трибуна","одарен","полумрак","целенаправлен","патологическ","поган","поросенок","пренебрежен","сфотографирова","мила","мыльн","прилета","павловск","эффектн","побеседова","ярославск","кошмарн","самооценк","социалист","клад","прибыльн","предосторожн","хутор","носилк","стебел","гравитацион","виток","разговорн","росп","запят","пулеметн","плацдарм","мужичок","циничн","воплоща","юрьевич","вдохновля","вяза","незамедлительн","резин","взыскан","медл","ломонос","передатчик","царапин","согнут","настоятельн","потруд","разор","альпинист","константинопол","распада","гадк","новшеств","тенев","трап","тайк","ржа","непохож","огорчен","прут","измуч","канцлер","иудейск","электорат","проясн","геолог","сочн","кыргызста","гастрол","рассуд","очарован","скотт","спб","смешива","барж","компас","кнут","обаятельн","телец","интуитивн","воскреснут","людовик","разгада","зашага","экстаз","ощуп","цыпочк","панк","брав","награжден","ускольза","двусторон","лэнгдон","переключен","степн","реставрац","бдительн","ахнут","дозвон","иш","тетрадк","морозн","леонард","наравн","разозл","водород","фараон","скуп","материализм","созвезд","сть","маловероятн","соседск","жорж","пламен","фе","погр","преждевремен","победн","возвод","взобра","консерв","мультимедийн","леп","миллиграмм","прикидыва","мятеж","сквер","доспех","вита","бычков","декрет","выдернут","переполня","калининградск","оспарива","предводител","лояльност","косметическ","трехлетн","скандальн","навал","пациентк","чугун","расслабля","прогоня","отгоня","цинизм","инструментальн","вкратц","шестерк","уклон","незаменим","пастор","чекист","кепк","сервисн","познава","тбилис","созна","трос","выкрикива","притащ","извива","дворянств","постига","шорт","алмат","подонок","викторовн","паркер","адъютант","неустойчив","блестящ","обозревател","повал","матф","соприкосновен","приманк","лентя","сант","белорус","нив","маст","флакон","логотип","оборотен","горст","кабельн","альман","прохлад","взад","ша","параз","папин","вздор","водоросл","подборк","гончар","ударен","снос","спасател","колготк","пакиста","свинец","пел","гамлет","конъюнктур","наемник","стемнет","шел","внедря","оборотн","святител","краст","закреплен","резонанс","трубочк","симфон","противотанков","избранник","улик","ремонтирова","генетик","захоронен","доверен","проворча","шпаг","продиктова","голодовк","углевод","сбербанк","кассов","избушк","затормоз","соломон","прокрича","высохнут","редактирован","негат","черпа","вильгельм","клапа","личик","альфред","заполуч","шлюх","совмеща","сережк","шланг","маргарет","миллилитр","позавтрака","игрушечн","поджеч","символик","перелива","обретен","совра","инвестирован","клубок","лотере","гк","распознава","святост","волост","предположительн","пробуд","британец","вестибюл","противовес","изобрета","петроград","припадок","наяв","притихнут","против","ринг","иерархическ","дворцов","заражен","сопоставим","озабочен","лукойл","самодельн","прикладыва","лавин","перелож","наивысш","загорел","увд","амнист","разогна","шестер","од","необъятн","изгиб","подкреп","волосат","мюнх","брюс","отсыла","ниточк","обогащен","уф","монгол","машеньк","разыгра","усвоен","интерфакс","карм","деградац","кипр","перевоз","разъясня","удачлив","мыслительн","молдавск","колониальн","монгольск","чел","позавидова","израильтянин","рейх","путеводител","соскуч","исчислен","подрыва","комбат","высоцк","самовар","бесследн","черноморск","миномет","волшебств","тин","порч","незамечен","лил","кабинк","сатурн","байт","прямоугольн","ост","смягч","пропагандистск","начист","интернациональн","беспрецедентн","пожертвован","громкост","лешк","угнета","метафизическ","истека","умудря","овор","португал","военачальник","расхохота","раздвинут","тридцат","гвардеец","воня","станиц","шварц","пирс","распечата","годн","туземец","подпрыгива","эмблем","имитац","мандельшт","непредвиден","телескоп","добросовестн","инстинктивн","дотянут","артиллерист","переписыва","согражданин","царевич","лохмат","прослушиван","наместник","дельфин","огд","рекламодател","похищен","пожира","адресн","пополн","лот","претерпет","халяв","пересчита","стационарн","неоспорим","ыт","сложен","семечк","доблестн","грянут","смешен","неудивительн","оперн","сигнализац","похмел","транз","шлюпк","перекус","креплен","фиксац","затвор","микроскоп","надоеда","угольн","флейт","тюмен","прикова","колечк","босик","покрышкин","взрывн","образцов","автоматизирова","партнерск","переброс","затрудн","дворик","аксессуар","поблескива","квн","мегабайт","мгц","шевченк","саймон","дыхательн","подгоня","мур","дарован","полков","легкомыслен","амстерд","врасплох","швыря","красотк","выборн","спланирова","унизительн","пианин","сопряч","девятнадца","вышеупомянут","лоток","дирекц","националистическ","торможен","удовлетворительн","вника","инфекцион","поэтик","землянин","стирк","дружин","съемочн","люстр","номенклатур","несуществ","реферат","ордер","позавчер","отремонтирова","абсурдн","светя","возн","регулятор","гильд","ват","отключен","свиток","готическ","затруднительн","серб","штрафн","амурск","уловк","застройк","пораст","рнб","компаньон","уклоня","джерр","насилова","андрюх","тосклив","опьянен","доверительн","истребительн","морга","завес","ром","поглощен","закуп","пристав","оргкомитет","физкультур","трен","душн","транзитн","дискомфорт","централизова","общенациональн","натыка","наполнен","канун","греф","помол","поссор","номинальн","синьор","метк","янв","нечеловеческ","мультфильм","эмм","курга","огорча","продлен","кверх","наушник","арендова","кардина","сосиск","детк","отстал","вымерет","мольб","удобрен","долговремен","господен","сырьев","культов","руин","индус","рязанск","ме","активизирова","скова","аспирантур","существительн","выл","гробниц","некрас","воцар","взмахнут","переселенец","ав","докторск","вобщ","пишущ","невестк","помад","ладошк","створк","хлопота","проигрыш","мираж","познер","ликова","консолидац","ночлег","неравн","филологическ","кротк","героизм","выходк","филолог","притяжен","зинаид","сконцентрирова","питт","почест","поджа","пронест","жгуч","коммент","ковал","афоризм","ушел","заправк","прихожанин","урн","веник","внима","редакцион","убереч","дамск","подоба","равномерн","психоанализ","каба","передышк","твер","др","зюган","задохнут","опробова","зародыш","вожден","австралийск","несовершен","спла","русалк","выруга","скат","тестов","зомб","настоятел","похваста","шлюз","ублюдок","усажива","герц","усилител","онлайн","треснут","недействительн","рыча","бункер","рыдан","властител","знаков","эквивалентн","загружа","усовершенствова","ценностн","избиен","диаспор","сковородк","хрустет","умысел","недобр","пряд","минутн","заигра","уборщиц","волосок","пустыр","морг","руд","хусейн","афганск","гош","щук","лыжн","абитуриент","озира","выгоня","зеланд","подпрыгнут","царствован","замыка","мтс","садд","перечита","наложен","фруктов","проектор","насмешлив","удержан","любительск","попк","додума","империализм","бездейств","неприят","пуд","андрюш","мыслим","снисходительн","лицензирован","ошелом","му","корабельн","приглуш","придт","гума","брюссел","риторическ","строев","заглуш","кеннед","клык","олицетворя","миниатюр","диспетчер","батарейк","фишер","утюг","отруб","побрест"]);

/**
 * Look up which frequency band a stemmed word falls into.
 * @param {string} stem - stemmed Russian word
 * @returns {number} 1-4 for bands, 5 for out-of-band (very rare)
 */
function getFrequencyBand(stem) {
  if (FREQ_BAND_1.has(stem)) return 1;
  if (FREQ_BAND_2.has(stem)) return 2;
  if (FREQ_BAND_3.has(stem)) return 3;
  if (FREQ_BAND_4.has(stem)) return 4;
  return 5; // Out of top 10,000
}

// ============================================================================
// RUSSIAN STOP WORDS (for lexical density calculation)
// ============================================================================

const RUSSIAN_STOP_WORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все',
  'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по',
  'только', 'её', 'мне', 'было', 'вот', 'от', 'меня', 'ещё', 'нет', 'о', 'из', 'ему',
  'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть',
  'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом',
  'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для',
  'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз',
  'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому',
  'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой', 'тем',
  'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'никогда', 'можно',
  'при', 'наконец', 'два', 'об', 'другой', 'хоть', 'после', 'над', 'больше', 'тот',
  'через', 'эти', 'нас', 'про', 'всего', 'них', 'какая', 'много', 'разве', 'три',
  'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед', 'иногда', 'лучше',
  'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю',
  'между', 'это', 'мы', 'её', 'эта', 'этих', 'которые', 'который', 'которая',
]);

// ============================================================================
// ENHANCED DISCOURSE & REGISTER MARKERS
// ============================================================================

const DISCOURSE_MARKERS = {
  // ILR 3+: Hedging — indicates nuanced, professional-level qualification
  hedging: [
    'возможно', 'вероятно', 'по-видимому', 'предположительно', 'по всей видимости',
    'не исключено', 'скорее всего', 'по некоторым данным', 'как представляется',
    'по оценкам', 'ориентировочно', 'приблизительно', 'в определённой степени',
  ],
  // ILR 3+: Modality — formal/legal register
  modality: [
    'необходимо', 'обязан', 'следует', 'вправе', 'надлежит',
    'предусматривает', 'предполагает', 'регламентирует', 'обуславливает',
    'целесообразно', 'допустимо', 'правомерно',
  ],
  // ILR 2+: Evidentiality — news/academic register
  evidentiality: [
    'по данным', 'согласно', 'как сообщает', 'по информации', 'по словам',
    'как стало известно', 'по сведениям', 'как заявил', 'как отметил',
    'по результатам', 'исходя из', 'ссылаясь на',
  ],
  // ILR 2+: Concession — complex argumentation
  concession: [
    'несмотря на', 'тем не менее', 'впрочем', 'между тем', 'вместе с тем',
    'в то же время', 'с другой стороны', 'при этом', 'однако',
    'при всём при том', 'хотя',
  ],
  // ILR 3+: Formal causal/logical chains
  causal: [
    'вследствие', 'в результате', 'в связи с', 'ввиду', 'в силу',
    'таким образом', 'следовательно', 'соответственно', 'исходя из этого',
    'в итоге', 'как следствие', 'обусловлен',
  ],
};

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
    else if (['science', 'technology', 'sports', 'society', 'crime'].includes(lowerCat)) {
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
  // IMPORTANT: Avoid generic terms like "новости" or "время" — they return
  // full broadcast episodes ("Выпуск новостей в 18:00") instead of individual stories.
  // Use specific topical keywords to get individual news segments.
  const SEARCH_KEYWORDS = {
    'news': ['россия', 'москва', 'репортаж', 'корреспондент'],
    'politics': ['политика', 'путин', 'правительство', 'госдума'],
    'economy': ['экономика', 'рубль', 'инфляция', 'бизнес'],
    'society': ['общество', 'социальный', 'люди', 'образование'],
    'sports': ['спорт', 'футбол', 'хоккей', 'олимпиада', 'чемпионат'],
    'culture': ['культура', 'театр', 'кино', 'музей', 'искусство'],
    'vremya': ['репортаж', 'сюжет'],
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
        };
      }
      return null;
    });

    const resolvedItems = await Promise.all(metadataPromises);
    for (const item of resolvedItems) {
      if (item && results.length < maxItems) {
        // Skip full broadcast episodes — these are not individual stories
        // e.g., "Выпуск новостей в 18:00 от 24.02.2026"
        const t = (item.title || '').toLowerCase();
        if (/выпуск\s+новост/i.test(t) || /^новости\s+\d/i.test(t) || /^время\s+\d/i.test(t)) {
          log('Skipping 1tv broadcast episode:', item.title?.substring(0, 60));
          continue;
        }
        // Skip digest/roundup titles
        if (isNewsDigest(item.title, item.description, item.duration)) {
          log('Skipping 1tv digest:', item.title?.substring(0, 60));
          continue;
        }
        results.push(item);
      }
    }
    log('Found', results.length, 'items from 1tv search.js (after filtering broadcasts)');
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
        results.push({
          ...item,
          category: item.inferredCategory,
          categories: [item.inferredCategory],
          contentType,
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
        results.push({
          ...item,
          category: itemCat,
          categories: item.inferredCategory ? [item.inferredCategory] : targetCategories,
          contentType,
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
              results.push({
                url,
                source: '1tv',
                sourceKey,
                title,
                category: inferredCategory,
                categories: inferredCategory ? [inferredCategory] : source.categories,
                contentType,
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
            });
          }
        }
        log('Found', results.length, 'videos from Smotrim API');

        // Fetch thumbnails from player API for items missing them
        const itemsNeedingThumbnails = results.filter(r => !r.thumbnail);
        if (itemsNeedingThumbnails.length > 0) {
          log('Fetching thumbnails for', itemsNeedingThumbnails.length, 'items');
          const batchSize = 5;
          for (let i = 0; i < itemsNeedingThumbnails.length; i += batchSize) {
            const batch = itemsNeedingThumbnails.slice(i, i + batchSize);
            await Promise.all(batch.map(async (item) => {
              try {
                const playerUrl = `${SITES['smotrim'].playerApi}/${item.videoId}/sid/smotrim`;
                const playerResp = await fetchWithHeaders(playerUrl, {
                  headers: { 'Accept': 'application/json' }
                });
                if (playerResp.ok) {
                  const playerData = await playerResp.json();
                  const mediaData = playerData?.data?.playlist?.medialist?.[0];
                  if (mediaData) {
                    item.thumbnail = mediaData.picture || mediaData.pictures?.['16:9'] || null;
                    // Also update duration if missing
                    if (!item.duration && mediaData.duration) {
                      item.duration = mediaData.duration;
                    }
                  }
                }
              } catch (e) {
                log('Player API thumbnail fetch failed for', item.videoId);
              }
            }));
          }
        }
      }
    } else {
      log('Smotrim API returned:', response.status);
    }
  } catch (e) {
    log('Smotrim API error:', e.message);
  }

  // Fallback: scrape the web page and fetch metadata from player API
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
        const videoIds = [];

        for (const match of videoIdMatches) {
          const videoId = match[1];
          if (!seenIds.has(videoId) && videoIds.length < maxItems) {
            seenIds.add(videoId);
            videoIds.push(videoId);
          }
        }
        log('Found', videoIds.length, 'video IDs from page scrape');

        // Fetch metadata from player API for each video (in parallel, batches of 5)
        const batchSize = 5;
        for (let i = 0; i < videoIds.length; i += batchSize) {
          const batch = videoIds.slice(i, i + batchSize);
          const metadataPromises = batch.map(async (videoId) => {
            try {
              const playerUrl = `${SITES['smotrim'].playerApi}/${videoId}/sid/smotrim`;
              const playerResp = await fetchWithHeaders(playerUrl, {
                headers: { 'Accept': 'application/json' }
              });
              if (playerResp.ok) {
                const playerData = await playerResp.json();
                const data = playerData?.data?.playlist?.medialist?.[0];
                if (data) {
                  return {
                    videoId,
                    title: data.anons || data.combinedTitle || null,
                    description: data.anons || null,
                    thumbnail: data.picture || data.pictures?.['16:9'] || null,
                    duration: data.duration || null,
                  };
                }
              }
            } catch (e) {
              log('Player API failed for video', videoId, e.message);
            }
            return { videoId, title: null, description: null, thumbnail: null, duration: null };
          });

          const metadataResults = await Promise.all(metadataPromises);

          for (const meta of metadataResults) {
            const url = `https://smotrim.ru/video/${meta.videoId}`;
            const title = meta.title;
            const description = meta.description;
            // Infer category from content
            const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url);
            const metadata = {
              title,
              description,
              url,
              duration: meta.duration,
              program: source.name,
              category: inferredCat || source.categories[0]
            };
            const contentType = detectContentType(metadata);
            metadata.contentType = contentType;
            results.push({
              url,
              source: 'smotrim',
              sourceKey,
              videoId: meta.videoId,
              title,
              description,
              thumbnail: meta.thumbnail,
              duration: meta.duration,
              program: source.name,
              category: inferredCat,
              categories: inferredCat ? [inferredCat] : source.categories,
              contentType,
            });
          }
        }
        log('Retrieved metadata for', results.length, 'videos');
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

          results.push({
            url,
            source: 'rt',
            sourceKey,
            videoId,
            title: slugTitle,
            category: urlCategory,
            categories: urlCategory ? [urlCategory] : source.categories,
            contentType,
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
  const seen = new Set();

  // Strategy 1: Scrape NTV NEWS SECTION - this is where actual news videos are
  // The main homepage has entertainment shows, but /novosti/ has real news
  try {
    log('Fetching NTV news section for news videos');
    const response = await fetchWithHeaders('https://www.ntv.ru/novosti/', {
      headers: { 'Accept-Encoding': 'identity' }
    });

    if (response.ok) {
      const html = await response.text();
      const videoMatches = html.matchAll(/\/video\/(\d+)/gi);

      for (const match of videoMatches) {
        const videoId = match[1];
        if (!seen.has(videoId)) {
          seen.add(videoId);
          videoIds.push(videoId);
        }
        if (videoIds.length >= maxItems * 2) break;
      }
      log('Found', videoIds.length, 'video IDs from NTV news section');
    }
  } catch (e) {
    log('NTV news section scrape error:', e.message);
  }

  // Strategy 2: Also try category-specific news pages if we need more (limit to 2 pages)
  if (videoIds.length < maxItems) {
    const newsPages = [
      'https://www.ntv.ru/novosti/politika/',
      'https://www.ntv.ru/novosti/obschestvo/',
      'https://www.ntv.ru/novosti/ekonomika/',
      'https://www.ntv.ru/novosti/mir/'
    ];

    for (const pageUrl of newsPages.slice(0, 2)) {
      if (videoIds.length >= maxItems) break;
      try {
        const response = await fetchWithHeaders(pageUrl, {
          headers: { 'Accept-Encoding': 'identity' }
        });
        if (response.ok) {
          const html = await response.text();
          const videoMatches = html.matchAll(/\/video\/(\d+)/gi);
          for (const match of videoMatches) {
            const videoId = match[1];
            if (!seen.has(videoId)) {
              seen.add(videoId);
              videoIds.push(videoId);
            }
            if (videoIds.length >= maxItems * 2) break;
          }
        }
      } catch (e) {
        log('NTV news page scrape error:', pageUrl, e.message);
      }
    }
    log('Found', videoIds.length, 'video IDs total after news pages');
  }

  // Strategy 3: Fallback to sitemap only if news pages failed
  if (videoIds.length < maxItems) {
    try {
      const sitemapUrl = SITES['ntv'].sitemap;
      log('Fetching NTV sitemap as fallback:', sitemapUrl);

      const response = await fetchWithHeaders(sitemapUrl, {
        headers: { 'Accept': 'application/xml, text/xml' }
      });

      if (response.ok) {
        const xml = await response.text();
        const urlMatches = xml.matchAll(/<loc>https?:\/\/(?:www\.)?ntv\.ru\/video\/(\d+)[^<]*<\/loc>/gi);

        for (const match of urlMatches) {
          const videoId = match[1];
          if (!seen.has(videoId)) {
            seen.add(videoId);
            videoIds.push(videoId);
          }
          if (videoIds.length >= maxItems * 2) break;
        }
        log('Found', videoIds.length, 'video IDs total after sitemap');
      }
    } catch (e) {
      log('NTV sitemap error:', e.message);
    }
  }

  // Strategy 3: Fetch metadata for videos in parallel (faster)
  // Limit to maxItems + small buffer to avoid CPU exhaustion on Cloudflare
  const idsToFetch = videoIds.slice(0, Math.min(maxItems + 5, 15));

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

        // Extract tags to filter out entertainment content
        const tagsMatch = xml.match(/<ovs:tag>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/ovs:tag>/i) ||
                          xml.match(/<keywords>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/keywords>/i);
        const tags = tagsMatch ? tagsMatch[1].toLowerCase() : '';

        // Skip entertainment shows (Маска, celebrity content, etc.)
        const entertainmentKeywords = ['маска', 'шоу-бизнес', 'знаменитости', 'артисты', 'сериал',
                                       'фестивали и конкурсы', 'музыка и музыканты', 'кино и сериалы',
                                       'волочкова', 'киркоров', 'развлечения'];
        const isEntertainment = entertainmentKeywords.some(kw =>
          tags.includes(kw) || title.toLowerCase().includes('маска')
        );

        if (isEntertainment) {
          log('Skipping NTV entertainment video:', title.substring(0, 50));
          return null;
        }

        let thumbnail = '';
        const splashMatch = xml.match(/<splash>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/splash>/);
        if (splashMatch) {
          thumbnail = splashMatch[1].trim();
          if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
        }

        const url = `https://ntv.ru/video/${videoId}/`;
        const inferredCategory = inferCategory(title + ' ' + (description || '') + ' ' + tags, url);
        const categories = inferredCategory
          ? [inferredCategory]
          : (SITES['ntv'].sources[sourceKey]?.categories || ['politics', 'society']);

        const decodedTitle = decodeHtmlEntities(title);
        const decodedDesc = decodeHtmlEntities(description) || null;
        const metadata = { title: decodedTitle, description: decodedDesc, url, duration, category: inferredCategory };
        const contentType = detectContentType(metadata);

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
// EURONEWS EXTRACTION
// ============================================================================

async function extractEuronews(url) {
  log('Extracting Euronews video:', url);

  const response = await fetchWithHeaders(url, {
    headers: { 'Accept': 'text/html' }
  });

  if (!response.ok) throw new Error(`Euronews page fetch failed: ${response.status}`);
  const html = await response.text();

  // Extract metadata from og tags
  const title = (html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                 html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i))?.[1] || null;
  const description = (html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/i))?.[1] || null;
  const thumbnail = (html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) ||
                     html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i))?.[1] || null;

  // Extract video URL from og:video, JSON-LD VideoObject, or data attributes
  let mp4Url = null;
  let m3u8Url = null;

  // Try og:video meta tag
  const ogVideo = (html.match(/<meta\s+(?:property|name)="og:video(?::url)?"\s+content="([^"]+)"/i) ||
                   html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:video(?::url)?"/i))?.[1];
  if (ogVideo) {
    if (ogVideo.includes('.mp4')) mp4Url = ogVideo;
    else if (ogVideo.includes('.m3u8')) m3u8Url = ogVideo;
  }

  // Try JSON-LD VideoObject
  if (!mp4Url && !m3u8Url) {
    const videoObjectMatch = html.match(/"@type"\s*:\s*"VideoObject"[\s\S]*?"contentUrl"\s*:\s*"([^"]+)"/);
    if (videoObjectMatch) {
      const contentUrl = videoObjectMatch[1];
      if (contentUrl.includes('.mp4')) mp4Url = contentUrl;
      else if (contentUrl.includes('.m3u8')) m3u8Url = contentUrl;
    }
  }

  // Try embedUrl from JSON-LD
  if (!mp4Url && !m3u8Url) {
    const embedMatch = html.match(/"@type"\s*:\s*"VideoObject"[\s\S]*?"embedUrl"\s*:\s*"([^"]+)"/);
    if (embedMatch) {
      const embedUrl = embedMatch[1];
      // Euronews often uses Dailymotion embeds
      if (embedUrl.includes('dailymotion.com')) {
        // Extract Dailymotion video ID and get stream URL
        const dmId = embedUrl.match(/video\/([a-z0-9]+)/i)?.[1];
        if (dmId) {
          try {
            const dmResponse = await fetchWithHeaders(`https://www.dailymotion.com/player/metadata/video/${dmId}`, {
              headers: { 'Accept': 'application/json' }
            });
            if (dmResponse.ok) {
              const dmData = await dmResponse.json();
              // Dailymotion provides HLS stream
              const hlsUrl = dmData?.qualities?.auto?.[0]?.url;
              if (hlsUrl) m3u8Url = hlsUrl;
            }
          } catch (e) {
            log('Dailymotion metadata fetch failed:', e.message);
          }
        }
      }
    }
  }

  // Try finding video source in HTML directly
  if (!mp4Url && !m3u8Url) {
    const srcMatch = html.match(/(?:src|source)\s*[=:]\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)/i);
    if (srcMatch) {
      if (srcMatch[1].includes('.mp4')) mp4Url = srcMatch[1];
      else if (srcMatch[1].includes('.m3u8')) m3u8Url = srcMatch[1];
    }
  }

  // Extract duration from JSON-LD
  let duration = null;
  const durationMatch = html.match(/"@type"\s*:\s*"VideoObject"[\s\S]*?"duration"\s*:\s*"(PT[^"]+)"/);
  if (durationMatch) {
    duration = parseIsoDuration(durationMatch[1]);
  }

  // Extract publish date
  const publishDate = (html.match(/<meta\s+(?:property|name)="article:published_time"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="article:published_time"/i))?.[1] || null;

  return {
    title: title ? decodeHtmlEntities(title) : null,
    description: description ? decodeHtmlEntities(description) : null,
    thumbnail,
    duration,
    publishDate,
    source: 'euronews',
    url,
    mp4Url,
    m3u8Url,
  };
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
  if (urlLower.includes('euronews.com')) return 'euronews';
  if (urlLower.includes('bbc.com') || urlLower.includes('bbc.co.uk')) return 'bbc';
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
    case 'euronews':
      return extractEuronews(url);
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
// TRANSCRIPT-BASED ILR ANALYSIS
// ============================================================================

// Global AI binding (set in fetch handler alongside KV_CACHE)
let AI_BINDING = null;

/**
 * Transcribe audio from a video URL using Cloudflare Workers AI Whisper.
 * @param {string} videoUrl - URL of the video to transcribe
 * @returns {Promise<{text: string, word_count: number, duration: number}>}
 */
async function transcribeAudio(videoUrl) {
  if (!AI_BINDING) {
    throw new Error('AI binding not available. Transcription requires Workers AI.');
  }

  log('Transcribing audio for:', videoUrl);

  // Get metadata to find stream URL
  const meta = await extractMetadata(videoUrl);

  let audioBytes;
  let segmentBuffers = [];

  if (meta.mp4Url && !meta.m3u8Url) {
    // For MP4 sources: fetch directly (limit to 10MB)
    log('Fetching MP4 for transcription:', meta.mp4Url);
    const resp = await fetchWithHeaders(meta.mp4Url, {
      headers: { 'Range': 'bytes=0-10485760' }
    });
    audioBytes = new Uint8Array(await resp.arrayBuffer());
  } else if (meta.m3u8Url) {
    // For HLS sources: fetch raw TS segments (Whisper handles MPEG-TS natively)
    let m3u8Url = meta.m3u8Url;
    if (typeof m3u8Url === 'object' && m3u8Url !== null) {
      m3u8Url = m3u8Url.auto || m3u8Url.hls || m3u8Url.default || Object.values(m3u8Url)[0];
    }

    log('Fetching m3u8 for transcription:', m3u8Url);
    const m3u8Response = await fetchWithHeaders(m3u8Url);
    if (!m3u8Response.ok) throw new Error(`Failed to fetch m3u8: ${m3u8Response.status}`);
    const m3u8Content = await m3u8Response.text();
    const finalM3u8Url = m3u8Response.url || m3u8Url;
    const playlist = parseM3u8(m3u8Content, finalM3u8Url);

    // Get lowest bandwidth variant for faster processing
    let segmentPlaylist = playlist;
    if (playlist.isMaster && playlist.variants.length > 0) {
      const sorted = playlist.variants.sort((a, b) => a.bandwidth - b.bandwidth);
      const variantUrl = sorted[0].url;
      const variantResponse = await fetchWithHeaders(variantUrl);
      if (!variantResponse.ok) throw new Error(`Failed to fetch variant: ${variantResponse.status}`);
      const variantContent = await variantResponse.text();
      const finalVariantUrl = variantResponse.url || variantUrl;
      segmentPlaylist = parseM3u8(variantContent, finalVariantUrl);
    }

    // Fetch raw TS segments (up to 10, ~40-60 seconds of audio)
    const segmentsToFetch = segmentPlaylist.segments.slice(0, CONFIG.maxSegments);
    log('Fetching', segmentsToFetch.length, 'raw TS segments for transcription');

    segmentBuffers = [];
    let totalSize = 0;
    for (const segment of segmentsToFetch) {
      try {
        const segResponse = await fetch(segment.url, {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (!segResponse.ok) continue;
        const segData = new Uint8Array(await segResponse.arrayBuffer());
        if (segData.length > CONFIG.maxSegmentSize) continue;
        segmentBuffers.push(segData);
        totalSize += segData.length;
      } catch (e) {
        log('Segment fetch error:', e.message);
      }
    }

    if (segmentBuffers.length === 0) {
      throw new Error('No audio segments could be fetched');
    }

    // Concatenate raw TS segments into single buffer
    audioBytes = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of segmentBuffers) {
      audioBytes.set(buf, offset);
      offset += buf.length;
    }
  } else {
    throw new Error('No stream URL found for this video');
  }

  log('Raw audio bytes for transcription:', audioBytes.length);

  // Also extract AAC-ADTS audio from the TS data for a second attempt
  // (The raw TS includes video which may confuse Whisper)
  const allAacFrames = [];
  if (meta.m3u8Url) {
    // Re-demux the TS segments to get clean AAC-ADTS audio
    for (const segData of segmentBuffers) {
      try {
        const frames = demuxTsAudio(segData);
        allAacFrames.push(...frames);
      } catch (e) {
        log('Demux error:', e.message);
      }
    }
  }

  // Try multiple audio formats with Whisper
  const audioVariants = [];

  // Variant 1: Raw TS data (MPEG-TS container)
  audioVariants.push({ data: audioBytes, label: 'raw-ts' });

  // Variant 2: Demuxed AAC-ADTS frames (if available)
  if (allAacFrames.length > 0) {
    const totalLen = allAacFrames.reduce((s, f) => s + f.length, 0);
    const aacData = new Uint8Array(totalLen);
    let pos = 0;
    for (const frame of allAacFrames) {
      aacData.set(frame, pos);
      pos += frame.length;
    }
    audioVariants.push({ data: aacData, label: 'aac-adts' });
  }

  // Helper to convert bytes to base64
  function toBase64(bytes) {
    let binaryStr = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binaryStr += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binaryStr);
  }

  // Use AAC-ADTS (audio-only, with headers) as preferred format
  const aacVariant = audioVariants.find(v => v.label === 'aac-adts');
  const tsVariant = audioVariants.find(v => v.label === 'raw-ts');

  // Try multiple combinations of format + encoding + model
  const attempts = [];
  if (aacVariant) {
    attempts.push({ data: aacVariant.data, label: 'aac-base64', encoding: 'base64' });
  }
  if (tsVariant) {
    attempts.push({ data: tsVariant.data, label: 'ts-base64', encoding: 'base64' });
  }

  for (const attempt of attempts) {
    try {
      let audioInput;
      if (attempt.encoding === 'base64') {
        audioInput = toBase64(attempt.data);
      }

      log(`Whisper attempt: ${attempt.label} (${attempt.data.length} bytes, base64=${audioInput.length})...`);

      // Try without language hint first (let auto-detect)
      const result = await AI_BINDING.run('@cf/openai/whisper-large-v3-turbo', {
        audio: audioInput
      });

      log(`Result: word_count=${result.word_count}, text_len=${(result.text || '').length}`);
      if (result.text && result.text.trim().length > 0) return result;

      // If auto-detect failed, try with explicit Russian
      const result2 = await AI_BINDING.run('@cf/openai/whisper-large-v3-turbo', {
        audio: audioInput,
        language: 'ru'
      });

      log(`Result (ru): word_count=${result2.word_count}, text_len=${(result2.text || '').length}`);
      if (result2.text && result2.text.trim().length > 0) return result2;
    } catch (e) {
      log(`${attempt.label} error:`, e.message);
    }
  }

  // All attempts failed — return empty result
  log('All Whisper attempts returned empty text');
  return { text: '', word_count: 0 };
}

/**
 * Get human-readable ILR level label, including plus levels.
 * @param {number} level - ILR level (e.g., 1, 1.5, 2, 2.5, 3, 3.5, 4)
 * @returns {string} Label like "ILR 2+ — Limited Working Proficiency, Plus"
 */
function ilrLevelLabel(level) {
  const labels = {
    0: 'ILR 0 — No Proficiency',
    0.5: 'ILR 0+ — Memorized Proficiency',
    1: 'ILR 1 — Elementary Proficiency',
    1.5: 'ILR 1+ — Elementary Proficiency, Plus',
    2: 'ILR 2 — Limited Working Proficiency',
    2.5: 'ILR 2+ — Limited Working Proficiency, Plus',
    3: 'ILR 3 — General Professional Proficiency',
    3.5: 'ILR 3+ — General Professional Proficiency, Plus',
    4: 'ILR 4 — Advanced Professional Proficiency',
    4.5: 'ILR 4+ — Advanced Professional Proficiency, Plus',
    5: 'ILR 5 — Functionally Native Proficiency'
  };
  return labels[level] || `ILR ${level % 1 === 0.5 ? Math.floor(level) + '+' : level}`;
}

/**
 * Clean transcript text for linguistic analysis.
 * Removes URLs, hashtags, mentions, and non-linguistic elements.
 * Based on DLI Auto-ILR manual recommendation to avoid agrammatical elements.
 */
function cleanTranscriptForAnalysis(text) {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#\S+/g, '')
    .replace(/@\S+/g, '')
    .replace(/[^\p{L}\p{N}\s.,!?;:\u2014\u2013\-()""«»]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count how many words in a list match any term in a vocabulary array.
 * Used as supplementary domain-specific signal alongside frequency bands.
 * @param {string[]} words - Lowercase word list from transcript
 * @param {string[]} vocabList - Vocabulary stems to match
 * @returns {number} Percentage of words matching (0-100)
 */
function vocabMatchPercent(words, vocabList) {
  if (words.length === 0) return 0;
  const matched = words.filter(w => vocabList.some(v => w.includes(v)));
  return +((matched.length / words.length) * 100).toFixed(1);
}

/**
 * Count discourse markers in text across all categories.
 * @param {string} text - Transcript text (original case)
 * @returns {object} Counts per category and total
 */
function countDiscourseMarkers(text) {
  const lower = text.toLowerCase();
  const counts = { total: 0, hedging: 0, modality: 0, evidentiality: 0, concession: 0, causal: 0 };
  for (const [category, markers] of Object.entries(DISCOURSE_MARKERS)) {
    for (const marker of markers) {
      let idx = 0;
      while ((idx = lower.indexOf(marker, idx)) !== -1) {
        counts[category]++;
        counts.total++;
        idx += marker.length;
      }
    }
  }
  return counts;
}

/**
 * Compute RKI/TORFL lexical coverage using frequency band data.
 * Maps existing frequency bands to CEFR levels via RKI minimums:
 *   Band1 (1K) ≈ A1-A2, Bands1+2 (3K) ≈ B1, Bands1+2+3 (5K) ≈ B2, All bands (10K) ≈ C1
 * Returns the lowest CEFR level where cumulative coverage ≥ 95%.
 *
 * @param {number[]} bandCounts - Array of [band1, band2, band3, band4, outOfBand] counts
 * @param {number} totalWords - Total stemmed words analyzed
 * @returns {{level: string, coverage: object}}
 */
function computeRkiCoverage(bandCounts, totalWords) {
  if (totalWords === 0) return { level: 'A1', coverage: { A1: 1, B1: 1, B2: 1, C1: 1 } };
  const cum1 = bandCounts[0] / totalWords;
  const cum2 = (bandCounts[0] + bandCounts[1]) / totalWords;
  const cum3 = (bandCounts[0] + bandCounts[1] + bandCounts[2]) / totalWords;
  const cum4 = (bandCounts[0] + bandCounts[1] + bandCounts[2] + bandCounts[3]) / totalWords;
  const coverage = {
    A1: +cum1.toFixed(3),
    B1: +cum2.toFixed(3),
    B2: +cum3.toFixed(3),
    C1: +cum4.toFixed(3)
  };
  if (cum1 >= 0.95) return { level: 'A1', coverage };
  if (cum2 >= 0.95) return { level: 'B1', coverage };
  if (cum3 >= 0.95) return { level: 'B2', coverage };
  if (cum4 >= 0.95) return { level: 'C1', coverage };
  return { level: 'C2', coverage };
}

/**
 * Compute Russian-adapted Flesch readability (Matskovskiy/Oborneva formula).
 * Score interpretation: 90-100 very easy, 70-90 easy, 50-70 moderate, 30-50 difficult, 0-30 very difficult.
 *
 * @param {number} avgSentenceLength - Average words per sentence
 * @param {number} avgSyllablesPerWord - Average syllables (Cyrillic vowels) per word
 * @returns {number} Readability score clamped to 0-100
 */
function computeReadability(avgSentenceLength, avgSyllablesPerWord) {
  const score = 206.835 - (1.3 * avgSentenceLength) - (60.1 * avgSyllablesPerWord);
  return +Math.max(0, Math.min(100, score)).toFixed(1);
}

/**
 * Map ILR level to CEFR equivalent per interagency roundtable standards.
 * @param {number} ilr - ILR level (1, 1.5, 2, 2.5, 3, 3.5, 4)
 * @returns {string} CEFR level (A2, B1, B2, C1, C2)
 */
function ilrToCefr(ilr) {
  if (ilr <= 1) return 'A2';
  if (ilr <= 1.5) return 'B1';
  if (ilr <= 2) return 'B1';
  if (ilr <= 2.5) return 'B2';
  if (ilr <= 3) return 'C1';
  if (ilr <= 3.5) return 'C1';
  return 'C2';
}

/**
 * Split Russian text into sentences, handling abbreviations correctly.
 * Naive split on [.!?] breaks on В.Д., г.(год), ст.(статья), п.(пункт),
 * С.(страница), см.(смотри), т.д./т.п., № NNN-XX, etc.
 * Protects abbreviation periods before splitting.
 */
function splitRussianSentences(text) {
  if (!text || !text.trim()) return [];
  let t = text;
  // 1. Protect single uppercase letter + period (initials: В.Д., К.В., Г.А.)
  t = t.replace(/([А-ЯA-Z])\.(?=[А-ЯA-Z\s,;—–\-(])/g, '$1\u0000');
  // 2. Protect common Russian abbreviations + period before whitespace/colon
  //    Aggressive: protects even before uppercase (legal texts have "ст. Конституции")
  t = t.replace(/([\s\d(,;:—–\-])(г|ст|п|ч|др|руб|тыс|млн|млрд|проф|акад|гл|изд|рис|табл|абз|вып|ул|пр|корп|стр|обл|д|р|с|С)\.([\s:])/g, '$1$2\u0000$3');
  // 3. Protect "см.", "ср.", "напр." (cross-references, often before colon)
  t = t.replace(/([\s(,;:—–\-])(см|ср|напр)\.([\s:])/g, '$1$2\u0000$3');
  // 4. Protect "т.д.", "т.п.", "т.е." (contractions)
  t = t.replace(/([\s(,;:—–\-])т\.([дпеДПЕ])\./g, '$1т\u0000$2\u0000');
  // 5. Protect legal document numbers: "№ NNN-XX." and "№ NNN."
  t = t.replace(/(№\s*[\d]+(?:-[А-ЯA-Za-z\/]+)?)\./g, '$1\u0000');
  // 6. Protect year references in parenthetical citations: "2022."
  t = t.replace(/(\d{4})\.([\s,;)\]])/g, '$1\u0000$2');
  // Split on remaining sentence-ending punctuation
  return t.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

/**
 * Analyze transcript text using corpus-backed linguistic features.
 * Uses Snowball stemmer, University of Leeds frequency bands, MTLD,
 * and enhanced discourse markers for defensible ILR estimation.
 *
 * @param {string} text - Full transcript text
 * @param {number} durationSeconds - Audio duration for speech rate
 * @returns {object} Linguistic metrics object
 */
function analyzeTranscript(text, durationSeconds) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const sentences = splitRussianSentences(text);
  const cyrillicWords = words.filter(w => /^[а-яё-]+$/i.test(w) && w.length >= 2);

  // --- Stemming & frequency band analysis ---
  const bandCounts = [0, 0, 0, 0, 0]; // bands 1-4 + out-of-band
  const stems = [];
  for (const w of cyrillicWords) {
    const stem = russianStem(w.replace(/[^а-яё]/g, ''));
    if (stem.length < 2) continue;
    stems.push(stem);
    const band = getFrequencyBand(stem);
    bandCounts[band - 1]++;
  }
  const totalStemmed = stems.length || 1;

  const freqBand1Percent = +(bandCounts[0] / totalStemmed * 100).toFixed(1);
  const freqBand2Percent = +(bandCounts[1] / totalStemmed * 100).toFixed(1);
  const freqBand3Percent = +(bandCounts[2] / totalStemmed * 100).toFixed(1);
  const freqBand4Percent = +(bandCounts[3] / totalStemmed * 100).toFixed(1);
  const outOfBandPercent = +(bandCounts[4] / totalStemmed * 100).toFixed(1);

  // --- MTLD (replaces TTR) ---
  const mtld = computeMTLD(stems);

  // --- Lexical density: content words / total words ---
  const contentWordCount = cyrillicWords.filter(w => !RUSSIAN_STOP_WORDS.has(w)).length;
  const lexicalDensity = cyrillicWords.length > 0
    ? +(contentWordCount / cyrillicWords.length * 100).toFixed(1) : 0;

  // --- Average word length (Cyrillic only) ---
  const avgWordLength = cyrillicWords.length > 0
    ? +(cyrillicWords.reduce((sum, w) => sum + w.replace(/[^а-яё]/g, '').length, 0) / cyrillicWords.length).toFixed(1)
    : 0;

  // --- Polysyllabic ratio (4+ vowels = polysyllabic) ---
  const russianVowels = /[аеёиоуыэюя]/gi;
  const polysyllabicCount = cyrillicWords.filter(w => {
    return (w.match(russianVowels) || []).length >= 4;
  }).length;
  const polysyllabicRatio = cyrillicWords.length > 0
    ? +(polysyllabicCount / cyrillicWords.length * 100).toFixed(1) : 0;

  // --- Enhanced clause complexity (expanded subordinators) ---
  const subordinators = /(?:^|\s)(?:который|которая|которое|которые|которых|которому|которой|которым|которого|которую|которыми|котором|потому что|так как|если|хотя|несмотря на то что|несмотря на|когда|пока|чтобы|где|куда|откуда|поскольку|причём|притом|ибо|ведь|в то время как|после того как|до того как|при условии что|в случае если|благодаря тому что|ввиду того что)(?:\s|$|,)/gi;
  const conjunctionCount = (text.match(subordinators) || []).length;
  // Comma+что subordination: most frequent clause marker in formal/legal Russian
  const chtoSubordination = (text.match(/,\s*что(?=\s)/g) || []).length;
  // Formal prepositional subordination (legal/specialized register markers)
  const prepositionalSub = (text.match(/(?:в соответствии с|на основании|в отношении|в силу|в связи с|с учётом|с учетом|в порядке|в рамках|в целях|в части)(?=\s)/gi) || []).length;
  const clauseCount = conjunctionCount + chtoSubordination + prepositionalSub;
  const clauseComplexity = sentences.length > 0 ? +(clauseCount / sentences.length).toFixed(2) : 0;

  // --- Discourse markers ---
  const discourse = countDiscourseMarkers(text);
  const discoursePerSentence = sentences.length > 0
    ? +(discourse.total / sentences.length).toFixed(2) : 0;

  // --- Legacy vocab matching (supplementary domain signal) ---
  const domainAdvancedPercent = vocabMatchPercent(words, ILR_ADVANCED_VOCAB);

  // --- Average syllables per word (Cyrillic vowels) ---
  const totalSyllables = cyrillicWords.reduce((sum, w) => {
    return sum + (w.match(russianVowels) || []).length;
  }, 0);
  const avgSyllablesPerWord = cyrillicWords.length > 0
    ? +(totalSyllables / cyrillicWords.length).toFixed(2) : 0;

  // --- Russian Flesch readability (Matskovskiy/Oborneva) ---
  const avgSentLen = sentences.length > 0 ? words.length / sentences.length : 0;
  const readability = computeReadability(avgSentLen, avgSyllablesPerWord);

  // --- RKI/TORFL lexical coverage ---
  const rkiCoverage = computeRkiCoverage(bandCounts, totalStemmed);

  return {
    wordCount: words.length,
    speechRate: durationSeconds > 0 ? Math.round(words.length / (durationSeconds / 60)) : null,
    mtld,
    avgSentenceLength: sentences.length > 0 ? +(words.length / sentences.length).toFixed(1) : 0,
    avgWordLength,
    polysyllabicRatio,
    clauseComplexity,
    lexicalDensity,
    freqBand1Percent,
    freqBand2Percent,
    freqBand3Percent,
    freqBand4Percent,
    outOfBandPercent,
    discoursePerSentence,
    discourseHedging: discourse.hedging,
    discourseModality: discourse.modality,
    domainAdvancedPercent,
    avgSyllablesPerWord,
    readability,
    rkiCoverage,
  };
}

/**
 * Estimate ILR level from transcript linguistic metrics.
 * Uses corpus-backed frequency bands, MTLD, discourse markers, and standard
 * features. Each feature is backed by established computational linguistics
 * methodology (University of Leeds corpus, Snowball stemmer, MTLD algorithm).
 *
 * @param {object} metrics - Output from analyzeTranscript()
 * @returns {{level: number, label: string, method: string}}
 */
function estimateIlrFromMetrics(metrics) {
  let score = 0;
  const components = {};

  // Frequency confidence: frequency-based metrics are less reliable for shorter
  // texts where a small sample inflates out-of-band percentages. Scale scores
  // proportionally up to 100 words where frequency data becomes reliable.
  const freqConfidence = Math.min(1, (metrics.wordCount || 0) / 100);

  // --- Speech rate (0-3 points) ---
  let speechRateScore = 0;
  if (metrics.speechRate !== null) {
    if (metrics.speechRate >= 150) speechRateScore = 3;
    else if (metrics.speechRate >= 120) speechRateScore = 2;
    else if (metrics.speechRate >= 90) speechRateScore = 1;
  }
  score += speechRateScore;
  components.speechRate = speechRateScore;

  // --- MTLD: lexical diversity (0-2 points) ---
  let mtldScore = 0;
  if (metrics.mtld >= 80) mtldScore = 2;
  else if (metrics.mtld >= 30) mtldScore = 1;
  score += mtldScore;
  components.mtld = mtldScore;

  // --- Average sentence length (0-7 points) ---
  // Strongest single differentiator across all ILR levels
  let sentLenScore = 0;
  if (metrics.avgSentenceLength >= 55) sentLenScore = 7;
  else if (metrics.avgSentenceLength >= 40) sentLenScore = 6;
  else if (metrics.avgSentenceLength >= 30) sentLenScore = 5;
  else if (metrics.avgSentenceLength >= 22) sentLenScore = 4;
  else if (metrics.avgSentenceLength >= 17) sentLenScore = 3;
  else if (metrics.avgSentenceLength >= 12) sentLenScore = 2;
  else if (metrics.avgSentenceLength >= 7) sentLenScore = 1;
  score += sentLenScore;
  components.sentLen = sentLenScore;

  // --- Lexical sophistication: frequency band analysis (0-4 points) ---
  const lowFreqPercent = metrics.freqBand3Percent + metrics.freqBand4Percent + metrics.outOfBandPercent;
  let lexSophScore = 0;
  if (lowFreqPercent > 35) lexSophScore = 4;
  else if (lowFreqPercent > 25) lexSophScore = 3;
  else if (lowFreqPercent > 18) lexSophScore = 2;
  else if (lowFreqPercent > 10) lexSophScore = 1;
  lexSophScore = Math.round(lexSophScore * freqConfidence * 2) / 2;
  score += lexSophScore;
  components.lexSoph = lexSophScore;

  // --- Lexical density (0-2 points) ---
  let lexDensScore = 0;
  if (metrics.lexicalDensity > 65) lexDensScore = 2;
  else if (metrics.lexicalDensity > 55) lexDensScore = 1;
  lexDensScore = Math.round(lexDensScore * freqConfidence * 2) / 2;
  score += lexDensScore;
  components.lexDens = lexDensScore;

  // --- Average word length (0-5 points) ---
  let wordLenScore = 0;
  if (metrics.avgWordLength >= 9.5) wordLenScore = 5;
  else if (metrics.avgWordLength >= 8.8) wordLenScore = 4;
  else if (metrics.avgWordLength >= 8.0) wordLenScore = 3;
  else if (metrics.avgWordLength >= 6.8) wordLenScore = 2;
  else if (metrics.avgWordLength >= 5.5) wordLenScore = 1;
  score += wordLenScore;
  components.wordLen = wordLenScore;

  // --- Polysyllabic ratio (0-5 points) ---
  let polysylScore = 0;
  if (metrics.polysyllabicRatio >= 60) polysylScore = 5;
  else if (metrics.polysyllabicRatio >= 50) polysylScore = 4;
  else if (metrics.polysyllabicRatio >= 40) polysylScore = 3;
  else if (metrics.polysyllabicRatio >= 25) polysylScore = 2;
  else if (metrics.polysyllabicRatio >= 12) polysylScore = 1;
  score += polysylScore;
  components.polysyl = polysylScore;

  // --- Clause complexity (0-4 points) ---
  // Finer granularity to differentiate ILR 3 (policy, avg cl=0.42) from 3.5 (legal, avg cl=0.95)
  let clauseScore = 0;
  if (metrics.clauseComplexity > 2.0) clauseScore = 4;
  else if (metrics.clauseComplexity > 1.2) clauseScore = 3;
  else if (metrics.clauseComplexity > 0.7) clauseScore = 2;
  else if (metrics.clauseComplexity > 0.2) clauseScore = 1;
  score += clauseScore;
  components.clause = clauseScore;

  // --- Discourse complexity (0-3 points) ---
  let discScore = 0;
  if (metrics.discoursePerSentence > 1.0) discScore = 3;
  else if (metrics.discoursePerSentence > 0.4) discScore = 2;
  else if (metrics.discoursePerSentence > 0.1) discScore = 1;
  score += discScore;
  components.disc = discScore;

  // --- Supplementary domain signal (+1 bonus) ---
  let domainScore = 0;
  if (metrics.domainAdvancedPercent > 2) domainScore = 1;
  score += domainScore;
  components.domain = domainScore;

  // --- RKI coverage level (0-2 points) ---
  let rkiScore = 0;
  if (metrics.rkiCoverage && (metrics.wordCount || 0) >= 100) {
    const rkiLevel = metrics.rkiCoverage.level;
    if (rkiLevel === 'C2') rkiScore = 2;
    else if (rkiLevel === 'C1') rkiScore = 1.5;
    else if (rkiLevel === 'B2') rkiScore = 1;
    else if (rkiLevel === 'B1') rkiScore = 0.5;
  }
  score += rkiScore;
  components.rki = rkiScore;

  // --- Readability score (0-2 points) ---
  let readScore = 0;
  if (metrics.readability !== undefined) {
    if (metrics.readability < 20) readScore = 2;
    else if (metrics.readability < 35) readScore = 1.5;
    else if (metrics.readability < 50) readScore = 1;
  }
  score += readScore;
  components.read = readScore;

  // --- Out-of-band vocabulary density (0-3 points) ---
  // Words outside the top-10K frequency list indicate specialized/academic
  // vocabulary. Gated behind avgWordLength >= 7.5 because simple texts also
  // show 15% OOB due to proper nouns, informal words, and list coverage gaps.
  // Only professional/academic texts with long words benefit from this boost.
  const outOfBandPct = metrics.outOfBandPercent || 0;
  let oobScore = 0;
  if (metrics.avgWordLength >= 7.5) {
    if (outOfBandPct > 25) oobScore = 3;
    else if (outOfBandPct > 20) oobScore = 2;
    else if (outOfBandPct > 16) oobScore = 1;
    oobScore = Math.round(oobScore * freqConfidence * 2) / 2;
  }
  score += oobScore;
  components.oob = oobScore;

  // Map score to ILR level (max ~43 points)
  let level;
  if (score <= 7) level = 1;
  else if (score <= 14) level = 1.5;
  else if (score <= 21) level = 2;
  else if (score <= 26) level = 2.5;
  else if (score <= 30) level = 3;
  else if (score <= 33) level = 3.5;
  else level = 4;

  return { level, score, components, label: ilrLevelLabel(level), method: 'transcript-analysis' };
}

/**
 * Handle /api/analyze requests — transcribe audio and assess ILR level.
 */
async function handleAnalyze(url, request) {
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return errorResponse('Missing required parameter: url');
  }

  if (!AI_BINDING) {
    return errorResponse('AI transcription not available. Workers AI binding not configured.', 503);
  }

  // Check KV cache first
  const cacheKey = `analysis:${btoa(targetUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
  if (KV_CACHE) {
    try {
      const cached = await KV_CACHE.get(cacheKey, 'json');
      if (cached) {
        log('Returning cached analysis for:', targetUrl);
        return jsonResponse({ ...cached, cached: true });
      }
    } catch (e) {
      log('Cache read error:', e.message);
    }
  }

  try {
    let transcriptText = '';
    let audioDuration = 0;

    // POST: Frontend sends pre-converted WAV audio (browser decoded AAC → WAV)
    if (request && request.method === 'POST') {
      log('Received POST with audio data from frontend');
      const body = await request.json();
      const audioBase64 = body.audio;  // base64-encoded WAV
      audioDuration = body.duration || 0;

      if (!audioBase64) {
        return errorResponse('POST body must include "audio" (base64 WAV)');
      }

      log('Audio base64 length:', audioBase64.length, 'duration:', audioDuration);
      const whisperResult = await AI_BINDING.run('@cf/openai/whisper-large-v3-turbo', {
        audio: audioBase64,
        language: 'ru',
        task: 'transcribe'
      });

      transcriptText = (whisperResult.text || '').trim();
      audioDuration = whisperResult.duration || audioDuration;
      log('Whisper result: word_count=', whisperResult.word_count, 'text_len=', transcriptText.length);
    } else {
      // GET: Server-side extraction (works for MP4 sources)
      log('Step 1: Server-side transcription...');
      const whisperResult = await transcribeAudio(targetUrl);
      transcriptText = (whisperResult.text || '').trim();
      audioDuration = whisperResult.duration || whisperResult.word_count * 0.4 || 0;
    }

    if (!transcriptText) {
      return errorResponse('Transcription produced no text. The audio may be music-only or too short.');
    }

    // Step 2: Clean transcript for analysis (DLI manual: avoid agrammatical elements)
    const cleanedText = cleanTranscriptForAnalysis(transcriptText);

    // Step 3: Compute linguistic metrics using corpus-backed features
    log('Step 2: Computing linguistic metrics...');
    const metrics = analyzeTranscript(cleanedText, audioDuration);

    // Step 4: Estimate ILR level using corpus-backed scorer
    log('Step 3: Assessing ILR level...');
    const ilrResult = estimateIlrFromMetrics(metrics);

    // Build response
    const cefrLevel = ilrToCefr(ilrResult.level);
    const result = {
      success: true,
      url: targetUrl,
      ilrLevel: ilrResult.level,
      ilrLabel: ilrResult.label,
      cefrLevel,
      ilrMethod: ilrResult.method || 'transcript-analysis',
      ilrError: ilrResult.error || null,
      transcript: {
        text: transcriptText,
        wordCount: metrics.wordCount,
        duration: audioDuration
      },
      metrics: {
        speechRate: metrics.speechRate,
        mtld: metrics.mtld,
        avgSentenceLength: metrics.avgSentenceLength,
        avgWordLength: metrics.avgWordLength,
        polysyllabicRatio: metrics.polysyllabicRatio,
        clauseComplexity: metrics.clauseComplexity,
        lexicalDensity: metrics.lexicalDensity,
        freqBand1Percent: metrics.freqBand1Percent,
        freqBand2Percent: metrics.freqBand2Percent,
        freqBand3Percent: metrics.freqBand3Percent,
        freqBand4Percent: metrics.freqBand4Percent,
        outOfBandPercent: metrics.outOfBandPercent,
        discoursePerSentence: metrics.discoursePerSentence,
        domainAdvancedPercent: metrics.domainAdvancedPercent,
        readability: metrics.readability,
        avgSyllablesPerWord: metrics.avgSyllablesPerWord,
        rkiCoverage: metrics.rkiCoverage,
      },
      cached: false
    };

    // Cache result for 24 hours
    if (KV_CACHE) {
      try {
        await KV_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
        log('Analysis cached for:', targetUrl);
      } catch (e) {
        log('Cache write error:', e.message);
      }
    }

    return jsonResponse(result);
  } catch (e) {
    log('Analysis error:', e);
    return errorResponse(`Analysis failed: ${e.message}`, 500);
  }
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
          categories: ['politics', 'society'],
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
            categories: inferredCat ? [inferredCat] : ['science', 'technology', 'society'],
            contentType,
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

// ============================================================================
// EURONEWS RUSSIAN - RSS feed + article page scraping
// ============================================================================
async function discoverEuronews(sourceKey = 'video', maxItems = 20) {
  const site = SITES['euronews'];
  log('Discovering from Euronews Russian via RSS feed');
  const results = [];

  try {
    // Step 1: Fetch RSS feed
    const rssUrl = site.rssFeed;
    const rssResponse = await fetchWithHeaders(rssUrl, {
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
    });

    if (!rssResponse.ok) {
      log('Euronews RSS fetch failed:', rssResponse.status);
      return [];
    }

    const rssText = await rssResponse.text();

    // Step 2: Parse RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;
    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     itemXml.match(/<title>(.*?)<\/title>/))?.[1] || null;
      const link = (itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) ||
                    itemXml.match(/<link>(.*?)<\/link>/))?.[1] || null;
      const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || null;
      const description = (itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                           itemXml.match(/<description>(.*?)<\/description>/))?.[1] || null;

      if (title && link) {
        items.push({ title: title.trim(), link: link.trim(), pubDate, description: description?.trim() || null });
      }
    }

    log(`Euronews RSS: found ${items.length} total items`);

    // Step 3: Filter for video URLs only, skip "no comment" (unnarrated footage)
    const videoItems = items.filter(item => {
      const url = item.link.toLowerCase();
      if (!url.includes('/video/')) return false;
      if (url.includes('nocomment') || url.includes('no-comment')) return false;
      if (item.title.toLowerCase().includes('no comment')) return false;
      return true;
    });

    log(`Euronews: ${videoItems.length} video items after filtering`);

    // Step 4: Map URL path to category
    function euronewsUrlCategory(url) {
      // /my-europe/ is too broad — stories about European culture, weather, etc.
      // Let keyword inference handle it instead of blindly assigning politics
      if (url.includes('/business/')) return 'economy';
      if (url.includes('/culture/')) return 'culture';
      if (url.includes('/travel/')) return 'tourism';
      if (url.includes('/green/')) return 'science';
      if (url.includes('/health/')) return 'society';
      if (url.includes('/next/')) return 'technology';
      return null;
    }

    // Step 5: Fetch article pages in parallel for thumbnail/duration
    const itemsToProcess = videoItems.slice(0, maxItems);
    const articleFetches = itemsToProcess.map(async (item) => {
      const url = item.link.replace(/^http:/, 'https:');
      let thumbnail = null;
      let duration = null;

      try {
        const articleResponse = await fetchWithHeaders(url, {
          headers: { 'Accept': 'text/html' }
        });

        if (articleResponse.ok) {
          const html = await articleResponse.text();

          // Extract og:image for thumbnail
          const ogImage = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) ||
                          html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i);
          if (ogImage) thumbnail = ogImage[1];

          // Extract duration from JSON-LD VideoObject
          const videoObjectMatch = html.match(/"@type"\s*:\s*"VideoObject"[\s\S]*?"duration"\s*:\s*"(PT[^"]+)"/);
          if (videoObjectMatch) {
            duration = parseIsoDuration(videoObjectMatch[1]);
          }

          // Fallback: try data attributes or meta tags for duration
          if (!duration) {
            const durationMeta = html.match(/duration["']?\s*[:=]\s*["']?(\d+)/i);
            if (durationMeta) {
              const dur = parseInt(durationMeta[1]);
              // Duration could be in seconds or milliseconds
              duration = dur > 10000 ? Math.round(dur / 1000) : dur;
            }
          }
        }
      } catch (e) {
        log(`Euronews article fetch error for ${url}:`, e.message);
      }

      // Infer category from URL path or title
      const urlCategory = euronewsUrlCategory(item.link);
      const inferredCat = urlCategory || inferCategory((item.title || '') + ' ' + (item.description || ''), url);

      const sourceConfig = site.sources?.[sourceKey] || site.sources?.['video'] || {};
      const defaultCategories = sourceConfig.categories || [];

      const metadata = {
        title: item.title,
        description: item.description,
        url,
        duration,
        category: inferredCat || defaultCategories[0] || null
      };
      const contentType = detectContentType(metadata);

      return {
        url,
        source: 'euronews',
        sourceKey,
        videoId: url.split('/').filter(Boolean).pop() || null,
        title: item.title,
        description: item.description,
        thumbnail,
        publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        duration,
        category: inferredCat || defaultCategories[0] || null,
        categories: inferredCat ? [inferredCat] : defaultCategories,
        contentType,
      };
    });

    const fetchedResults = await Promise.all(articleFetches);
    results.push(...fetchedResults);
    log(`Euronews: returning ${results.length} video results`);

  } catch (e) {
    log('Euronews discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

// Helper: parse ISO 8601 duration (PT10M55S) to seconds
function parseIsoDuration(iso) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseFloat(match[3] || 0);
  return Math.round(hours * 3600 + minutes * 60 + seconds);
}

// ============================================================================
// BBC RUSSIAN - __NEXT_DATA__ JSON parsing from video listing page
// ============================================================================
async function discoverBbc(sourceKey = 'video', maxItems = 20) {
  const site = SITES['bbc'];
  log('Discovering from BBC Russian via __NEXT_DATA__');
  const results = [];

  try {
    const pageUrl = site.videoPageUrl;
    const response = await fetchWithHeaders(pageUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      }
    });

    if (!response.ok) {
      log('BBC video page fetch failed:', response.status);
      return [];
    }

    const html = await response.text();
    log(`BBC: fetched video listing page (${html.length} bytes)`);

    // Extract __NEXT_DATA__ JSON from script tag
    const nextDataMatch = html.match(/__NEXT_DATA__[^>]*type="application\/json">([\s\S]*?)<\/script>/);
    if (!nextDataMatch) {
      log('BBC: __NEXT_DATA__ not found in page');
      return [];
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const curations = nextData?.props?.pageProps?.pageData?.curations;

    if (!curations || !Array.isArray(curations)) {
      log('BBC: no curations found in __NEXT_DATA__');
      return [];
    }

    // Collect all video items from all sections, deduplicate by ID
    const seen = new Set();
    const sourceConfig = site.sources?.[sourceKey] || site.sources?.['video'] || {};
    const defaultCategories = sourceConfig.categories || [];

    for (const curation of curations) {
      const summaries = curation.summaries || [];
      for (const item of summaries) {
        // Only include video items
        if (item.type !== 'video') continue;
        if (!item.title || !item.link) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id);

        const title = item.title;
        const url = item.link;
        const description = item.description || title;

        // Parse duration from ISO 8601 (e.g., "PT10M55S")
        const duration = item.duration ? parseIsoDuration(item.duration) : null;

        // Build thumbnail URL - BBC uses {width} placeholder
        let thumbnail = null;
        if (item.imageUrl) {
          thumbnail = item.imageUrl.replace('{width}', '640');
        }

        const publishDate = item.firstPublished || null;

        // Infer category from title + description
        const inferredCat = inferCategory((title || '') + ' ' + (description || ''), url);

        const metadata = {
          title,
          description,
          url,
          duration,
          category: inferredCat || defaultCategories[0] || null
        };
        const contentType = detectContentType(metadata);

        results.push({
          url,
          source: 'bbc',
          sourceKey,
          videoId: item.id || url.split('/').pop() || null,
          title,
          description,
          thumbnail,
          publishDate,
          duration,
          category: inferredCat || defaultCategories[0] || null,
          categories: inferredCat ? [inferredCat] : defaultCategories,
          contentType,
        });

        if (results.length >= maxItems) break;
      }
      if (results.length >= maxItems) break;
    }

    log(`BBC: found ${results.length} video items from __NEXT_DATA__`);

  } catch (e) {
    log('BBC discovery error:', e.message);
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
                'distribution', 'start_date', 'end_date', 'content_types',
                'contentType'];
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
      maxItems: maxItems,
    },
    delivered: {
      categories: {},
      dateRange: null,
      contentTypes: {},
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
      ['sports', 'economy', 'science', 'technology', 'culture', 'tourism', 'weather', 'crime', 'society', 'military', 'politics'].includes(cat)
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
            sourcesByCategory[cat] = ['mchs:video', '1tv:news', 'rt:news', 'smotrim:news', 'tass:video'];
            break;
          case 'politics':
            sourcesByCategory[cat] = ['1tv:politics', 'rt:news', 'tass:video'];
            break;
          case 'military':
            sourcesByCategory[cat] = ['1tv:news', 'rt:news', 'ria:video'];
            break;
          case 'society':
            sourcesByCategory[cat] = ['smotrim:news', '1tv:society', 'izvestia:video', 'rt:russia', 'tass:video'];
            break;
          case 'crime':
            sourcesByCategory[cat] = ['1tv:news', 'rt:news', 'izvestia:video', 'tass:video'];
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

        // International Russian-language news
        'euronews': () => discoverEuronews(sourceId || 'video', SOURCE_FETCH_SIZE),
        'bbc': () => discoverBbc(sourceId || 'video', SOURCE_FETCH_SIZE),

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
      // Smotrim API can be slow too, give all main sources extra time
      const timeoutMs = (siteId === 'ntv' || siteId === 'tass' || siteId === '1tv' || siteId === 'smotrim' || siteId === 'rt' || siteId === 'euronews' || siteId === 'bbc') ? 8000 : 3000;
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
  log(`After URL deduplication: ${filtered.length} items`);

  // Filter out general news recap/compilation videos
  // These are full broadcasts or "60 seconds" summaries, not specific stories
  const beforeRecapFilter = filtered.length;
  filtered = filtered.filter(item => {
    const title = (item.title || '').toLowerCase();
    // Full broadcast episodes: "Вести. Эфир от 10.02.2026 (16:30)"
    if (/(?:эфир|efir)\s+(?:от|ot)\s+\d/i.test(title)) return false;
    // "Новости за 60 секунд" / "Новости за минуту"
    if (/(?:новост|novost)[а-яёa-z]*\s+(?:за\s+)?(?:\d+\s+секунд|минуту|\d+\s+sekund|minutu)/i.test(title)) return false;
    // "Выпуск новостей" / general news roundups
    if (/(?:выпуск|vypusk)\s+(?:новостей|novostey)/i.test(title)) return false;
    // General "Вести" full broadcast without specific topic
    if (/^вести\.\s*эфир/i.test(title)) return false;
    // "Итоги дня" / "Итоги недели" - summary compilations
    if (/(?:итоги|itogi)\s+(?:дня|недели|dnya|nedeli)/i.test(title)) return false;
    return true;
  });
  if (beforeRecapFilter !== filtered.length) {
    log(`Filtered out ${beforeRecapFilter - filtered.length} recap/compilation videos`);
  }

  // Filter out content without spoken words (music-only, raw footage, full broadcasts)
  // Language learning requires actual spoken Russian - filter aggressively
  const beforeSpeechFilter = filtered.length;
  filtered = filtered.filter(item => {
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const text = title + ' ' + desc;
    const dur = item.duration || 0;

    // --- Explicit no-speech indicators ---
    if (/(?:музык|music|playlist|плейлист|подборка\s+музык|сборник|mix\b|remix)/i.test(text)) return false;
    if (/(?:слайд[-\s]?шоу|slideshow|фотогалере|photo\s*gallery)/i.test(text)) return false;
    if (/(?:без\s+комментари|без\s+слов|no\s+comment|no\s+words)/i.test(text)) return false;
    if (/(?:релакс|relax|ambient|медитаци|asmr|белый\s+шум|white\s+noise)/i.test(text)) return false;
    if (/(?:^клип(?=\s|$)|музыкальный\s+клип|music\s+video)/i.test(text)) return false;
    if (/(?:timelapse|таймлапс|аэросъёмк|аэросъемк)/i.test(text) && !/(?:репортаж|сюжет|корреспондент)/i.test(text)) return false;

    // --- Full broadcasts (too long, not individual segments) ---
    if (dur > 2400) { // Over 40 minutes = full newscast
      log('Filtering full broadcast:', title.substring(0, 60), `(${dur}s)`);
      return false;
    }

    // --- Known full-broadcast program names (>8 min = full episode, not a clip) ---
    if (dur > 480) {
      const fullBroadcastPrograms = /^(?:сегодня|новости дня|новости|вести|время|итоги дня|итоги недели|60 минут|вечер|утро россии|доброе утро|информбюро)/i;
      if (fullBroadcastPrograms.test(title)) {
        log('Filtering known broadcast program:', title.substring(0, 60), `(${dur}s)`);
        return false;
      }
      // Also catch "Program | date" format like "Новости дня | 20 февраля 2026 г."
      if (/(?:новости|вести|сегодня|итоги)\s*[\|—–]\s*\d{1,2}/i.test(title)) {
        log('Filtering program+date broadcast:', title.substring(0, 60), `(${dur}s)`);
        return false;
      }
    }

    // --- Title is just a date (e.g., "15 февраля 2026 года") = full broadcast ---
    if (/^\d{1,2}\s+(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-яё]*\s+\d{4}/i.test(title) && !title.includes(':')) {
      log('Filtering date-only title:', title.substring(0, 60));
      return false;
    }

    // --- Raw footage / B-roll at any duration ---
    if (/(?:^кадры(?=\s|$)|видеокадры|^видео\s|видеозапись|видеозаписи)/i.test(title)) {
      // Only filter if no narration indicators
      if (!/(?:сообщ|заяви|рассказ|объясн|коммент|корреспондент|сюжет|репортаж)/i.test(text)) {
        log('Filtering footage/recording:', title.substring(0, 60), `(${dur}s)`);
        return false;
      }
    }

    // --- Live streams / direct broadcasts ---
    if (/(?:прямой\s+эфир|прямая\s+трансляция|live\s+stream|livestream|стрим(?=\s|$))/i.test(text) && dur > 1800) {
      log('Filtering live stream:', title.substring(0, 60), `(${dur}s)`);
      return false;
    }

    // --- Hashtag-only or very short descriptions suggesting no editorial content ---
    if (desc && desc.length < 30 && /^[#@\s\w]+$/.test(desc) && dur > 0 && dur < 60) {
      if (!/(?:сообщ|заяви|рассказ|объясн)/i.test(title)) {
        log('Filtering hashtag-only short clip:', title.substring(0, 60));
        return false;
      }
    }

    // --- Very short clips (under 15s) - almost always just footage with music ---
    if (dur > 0 && dur < 15) {
      // Exception: keep if description suggests narration
      if (!/(?:сообщ|заяви|рассказ|объясн|коммент|корреспондент|сюжет)/i.test(text)) {
        log('Filtering very short clip:', title.substring(0, 60), `(${dur}s)`);
        return false;
      }
    }

    return true;
  });
  if (beforeSpeechFilter !== filtered.length) {
    log(`Filtered out ${beforeSpeechFilter - filtered.length} non-speech items`);
  }

  // Deduplicate by title similarity (same story from same source)
  const seenTitles = new Map(); // normalized title -> first item
  const beforeTitleDedup = filtered.length;
  filtered = filtered.filter(item => {
    if (!item.title) return true;
    // Normalize title: remove "Вести." prefix, dates, timestamps, lowercase
    const normalized = item.title.toLowerCase()
      .replace(/^вести\.\s*/i, '')
      .replace(/\d{2}[.\-/]\d{2}[.\-/]\d{2,4}/g, '')
      .replace(/\(\d{2}:\d{2}\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);  // Compare first 60 chars
    const key = `${item.source}:${normalized}`;
    if (seenTitles.has(key)) {
      log('Removing title duplicate:', item.title?.substring(0, 50));
      return false;
    }
    seenTitles.set(key, item);
    return true;
  });
  if (beforeTitleDedup !== filtered.length) {
    log(`After title deduplication: ${filtered.length} items (removed ${beforeTitleDedup - filtered.length} duplicates)`);
  }

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
        // Include items without dates - they're likely recent/current
        return true;
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

  // Filter out news digests, roundups, and generic broadcasts
  // These are multi-topic compilations not useful for focused language study
  const beforeDigestFilter = filtered.length;
  filtered = filtered.filter(r => !isNewsDigest(r.title, r.description, r.duration));
  if (filtered.length < beforeDigestFilter) {
    log(`Filtered ${beforeDigestFilter - filtered.length} news digests/roundups (${beforeDigestFilter} → ${filtered.length})`);
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

      // Sort items into category buckets - prefer inferred category over fallback
      for (const item of filtered) {
        const itemCat = (item.category || '').toLowerCase();
        if (itemCat && categoryBuckets[itemCat] !== undefined) {
          categoryBuckets[itemCat].push(item);
        } else if (!itemCat && item.categories && Array.isArray(item.categories)) {
          // Only use fallback categories when no inferred category exists
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

      // Take up to idealPerCategory from each bucket that has items
      // Categories with fewer items just contribute what they have
      for (const cat of requestedCategories) {
        const bucket = categoryBuckets[cat] || [];
        const take = Math.min(idealPerCategory, bucket.length);
        for (let i = 0; i < take; i++) {
          finalResults.push(bucket[i]);
        }
        distributionInfo[cat] = take;
      }

      log('Even distribution: ideal=', idealPerCategory, 'taken=', JSON.stringify(distributionInfo));

      // Redistribute remaining quota round-robin from categories that have extras
      let remainder = maxItems - finalResults.length;
      if (remainder > 0) {
        let added = true;
        while (remainder > 0 && added) {
          added = false;
          for (const cat of requestedCategories) {
            if (remainder <= 0) break;
            const bucket = categoryBuckets[cat] || [];
            const alreadyTaken = distributionInfo[cat];
            if (alreadyTaken < bucket.length) {
              finalResults.push(bucket[alreadyTaken]);
              distributionInfo[cat]++;
              remainder--;
              added = true;
            }
          }
        }
      }

      log('Final distribution:', distributionInfo);

    } else {
      // Single category or weighted distribution - simple filter
      // Prefer inferred category (r.category) over fallback categories array
      finalResults = filtered.filter(r => {
        const itemCat = (r.category || '').toLowerCase();
        if (itemCat) {
          // Has a specifically inferred category — use it exclusively
          return requestedCategories.includes(itemCat);
        }
        // No inferred category — check fallback categories array
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

  // Normalize publishDate to ISO format for frontend compatibility
  for (const item of finalResults) {
    if (typeof item.publishDate === 'string') {
      const m = item.publishDate.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
      if (m) {
        item.publishDate = `${m[3]}-${m[2]}-${m[1]}T${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}`;
      }
    }
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

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/analyze?url=...</code></p>
    <p>Transcribe audio and assess ILR level. Uses Whisper for transcription and MIT Auto-ILR for level assessment. Returns ILR level, transcript, and linguistic metrics. Results cached 24h.</p>
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

  const url = new URL(request.url);
  const path = url.pathname;

  // Allow POST for /api/analyze (receives audio data from frontend)
  if (request.method !== 'GET' && !(request.method === 'POST' && path === '/api/analyze')) {
    return errorResponse('Method not allowed', 405);
  }

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
      case '/api/analyze':
        return handleAnalyze(url, request);
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
    // Set KV cache and AI binding references from environment
    KV_CACHE = env.MATUSHKA_CACHE || null;
    AI_BINDING = env.AI || null;

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
