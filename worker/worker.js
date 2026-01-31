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
  world: { en: 'World', ru: 'В мире' },
  sports: { en: 'Sports', ru: 'Спорт' },
  culture: { en: 'Culture', ru: 'Культура' },
  science: { en: 'Science', ru: 'Наука' },
  technology: { en: 'Technology', ru: 'Технологии' },
};

// Site configurations with discovery URLs, API endpoints, and category mappings
const SITES = {
  '1tv': {
    name: 'Channel One',
    nameRu: 'Первый канал',
    domain: '1tv.ru',
    scheduleApi: 'https://stream.1tv.ru/api/schedule.json',
    sources: {
      'news': { url: 'https://www.1tv.ru/news', categories: ['politics', 'society', 'world'] },
      'politics': { url: 'https://www.1tv.ru/news/politika', categories: ['politics'] },
      'economy': { url: 'https://www.1tv.ru/news/ekonomika', categories: ['economy'] },
      'society': { url: 'https://www.1tv.ru/news/obschestvo', categories: ['society'] },
      'world': { url: 'https://www.1tv.ru/news/v-mire', categories: ['world'] },
      'sports': { url: 'https://www.1tv.ru/news/sport', categories: ['sports'] },
      'culture': { url: 'https://www.1tv.ru/news/kultura', categories: ['culture'] },
      'vremya': { url: 'https://www.1tv.ru/shows/vremya', categories: ['politics', 'world'], programId: 'vremya' },
    }
  },
  'smotrim': {
    name: 'Smotrim (VGTRK)',
    nameRu: 'Смотрим (ВГТРК)',
    domain: 'smotrim.ru',
    apiBase: 'https://api.smotrim.ru/api/v1',
    playerApi: 'https://player.smotrim.ru/iframe/datavideo/id',
    sources: {
      'news': { brandId: 5402, categories: ['politics', 'society', 'world'], name: 'Вести' },
      'russia24': { brandId: 58500, categories: ['politics', 'economy', 'world'], name: 'Вести в 20:00' },
      'vesti-nedeli': { brandId: 5206, categories: ['politics', 'world'], name: 'Вести недели' },
    }
  },
  'rt': {
    name: 'RT',
    nameRu: 'RT',
    domain: 'rt.com',
    rssFeeds: {
      'news': 'https://www.rt.com/rss/news/',
      'russia': 'https://www.rt.com/rss/russia/',
      'business': 'https://www.rt.com/rss/business/',
      'sport': 'https://www.rt.com/rss/sport/',
    },
    sources: {
      'news': { url: 'https://www.rt.com/news/', categories: ['politics', 'world'] },
      'russia': { url: 'https://www.rt.com/russia/', categories: ['politics', 'society'] },
      'business': { url: 'https://www.rt.com/business/', categories: ['economy'] },
      'sport': { url: 'https://www.rt.com/sport/', categories: ['sports'] },
    },
    liveStreams: {
      'news': 'https://rt-glb.rttv.com/dvr/rtnews/playlist.m3u8',
      'doc': 'https://rt-glb.rttv.com/dvr/rtdoc/playlist.m3u8',
    }
  },
  'rutube': {
    name: 'Rutube',
    nameRu: 'Рутуб',
    domain: 'rutube.ru',
    apiBase: 'https://rutube.ru/api',
    // Category IDs for discovery
    categoryIds: {
      'news': 13,       // Новости
      'politics': 42,   // Политика
      'science': 8,     // Наука и техника
      'society': 21,    // Общество
      'sports': 14,     // Спорт
      'culture': 7,     // Искусство
    },
    sources: {
      'news': { categoryId: 13, categories: ['politics', 'world'] },
      'politics': { categoryId: 42, categories: ['politics'] },
      'society': { categoryId: 21, categories: ['society'] },
    }
  },
  'izvestia': {
    name: 'Izvestia',
    nameRu: 'Известия',
    domain: 'iz.ru',
    usesRutube: true,
    rutubeChannelId: 23872322,  // Izvestia's Rutube channel
    sources: {
      'video': { categories: ['politics', 'society', 'world'] },
    }
  },
  'ntv': {
    name: 'NTV',
    nameRu: 'НТВ',
    domain: 'ntv.ru',
    xmlApi: 'http://www.ntv.ru/vi',  // Legacy XML API: /vi{video_id}/
    sitemap: 'https://www.ntv.ru/exp/yandex/sitemap_last.jsp',
    sources: {
      'video': { url: 'https://ntv.ru/video/', categories: ['politics', 'society', 'world'] },
      'news': { url: 'https://ntv.ru/novosti/', categories: ['politics', 'society'] },
    }
  },
  'ria': {
    name: 'RIA Novosti',
    nameRu: 'РИА Новости',
    domain: 'ria.ru',
    videoApi: 'https://nfw.ria.ru/flv/file/id',  // /id/{video_id}/type/mp4/nolog/1/
    sources: {
      'video': { url: 'https://ria.ru/video/', categories: ['politics', 'society', 'world'] },
    }
  },
  'tass': {
    name: 'TASS',
    nameRu: 'ТАСС',
    domain: 'tass.ru',
    usesRutube: true,
    rutubeChannelId: 23950585,  // TASS Rutube channel (29k+ videos)
    sources: {
      'video': { categories: ['politics', 'society', 'world'] },
    }
  },
  'kommersant': {
    name: 'Kommersant',
    nameRu: 'Коммерсантъ',
    domain: 'kommersant.ru',
    usesRutube: true,
    rutubeChannelId: 23923011,  // Kommersant Rutube channel (2k+ videos)
    sources: {
      'video': { categories: ['politics', 'economy', 'society'] },
    }
  },
};

// ============================================================================
// CORS & RESPONSE HELPERS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
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
// HTML/TEXT PARSING UTILITIES
// ============================================================================

function decodeHtmlEntities(text) {
  if (!text) return '';
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' '
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
  const response = await fetchWithHeaders(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  const og = extractOpenGraph(html);
  const jsonLd = extractJsonLd(html);

  // Extract m3u8 URL
  let m3u8Url = null;
  const m3u8Patterns = [
    /https?:\/\/[^"'\s]+1internet\.tv[^"'\s]+master\.m3u8[^"'\s]*/gi,
    /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
    /["']([^"']+\.m3u8[^"']*)["']/gi,
  ];

  for (const pattern of m3u8Patterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      m3u8Url = matches[0].replace(/["']/g, '').replace(/\\\//g, '/');
      break;
    }
  }

  // Extract duration
  let duration = null;
  if (jsonLd && jsonLd.duration) {
    const match = jsonLd.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      duration = (parseInt(match[1] || 0) * 3600) +
                 (parseInt(match[2] || 0) * 60) +
                 parseInt(match[3] || 0);
    }
  }

  return {
    source: '1tv',
    sourceUrl: url,
    title: og.title || (jsonLd && jsonLd.headline) || 'Unknown',
    description: og.description || (jsonLd && jsonLd.description) || null,
    thumbnail: og.image || (jsonLd && jsonLd.thumbnailUrl) || null,
    publishDate: jsonLd && jsonLd.datePublished || null,
    duration,
    m3u8Url,
    streamType: 'hls',
  };
}

async function discover1tv(sourceKey, maxItems = 20) {
  const source = SITES['1tv'].sources[sourceKey];
  if (!source) throw new Error(`Unknown 1tv source: ${sourceKey}`);

  log('Discovering from 1tv:', sourceKey);
  const results = [];

  // Strategy 1: Try the schedule API for program-based content (vremya, news)
  if (sourceKey === 'vremya' || sourceKey === 'news') {
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
            results.push({
              url: fullUrl,
              source: '1tv',
              sourceKey,
              title: program.title || null,
              thumbnail: program.image || program.preview || null,
              publishDate: program.datetime || program.date || null,
              duration: program.duration || null,
              categories: source.categories,
            });
          }
        }
        log('Found', results.length, 'items from schedule API');
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
                      results.push({
                        url: fullUrl,
                        source: '1tv',
                        sourceKey,
                        title: item.title || item.name || item.headline || null,
                        thumbnail: item.image || item.preview || item.thumbnail || null,
                        publishDate: item.date || item.datetime || item.publishedAt || null,
                        duration: item.duration || null,
                        categories: source.categories,
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
              results.push({
                url,
                source: '1tv',
                sourceKey,
                categories: source.categories,
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
            results.push({
              url: `https://smotrim.ru/video/${videoId}`,
              source: 'smotrim',
              sourceKey,
              videoId,
              title: item.title || item.name || null,
              description: item.anons || item.description || null,
              thumbnail: item.picture || item.preview || item.thumbnail || null,
              publishDate: item.date || item.datePublished || item.created || null,
              duration: item.duration || null,
              program: item.brandTitle || source.name || null,
              categories: source.categories,
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
            results.push({
              url: `https://smotrim.ru/video/${videoId}`,
              source: 'smotrim',
              sourceKey,
              videoId,
              categories: source.categories,
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

  return {
    source: 'smotrim',
    sourceUrl: url,
    videoId,
    title: videoData.title || videoData.episodeTitle || 'Unknown',
    description: videoData.anons || videoData.description || null,
    thumbnail: videoData.picture || videoData.preview || null,
    publishDate: videoData.datePublished || videoData.date || null,
    duration: videoData.duration || null,
    program: videoData.brandTitle || null,
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
  const results = [];

  // Strategy 1: Use RSS feeds (more reliable)
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
          const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
          const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i);
          const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
          const mediaMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          const thumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);

          const url = linkMatch ? linkMatch[1].trim() : null;
          if (url && url.includes('rt.com')) {
            results.push({
              url,
              source: 'rt',
              sourceKey,
              title: titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : null,
              description: descMatch ? (descMatch[1] || descMatch[2] || '').trim() : null,
              publishDate: dateMatch ? dateMatch[1].trim() : null,
              thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
              mediaUrl: mediaMatch ? mediaMatch[1] : null,
              categories: source.categories,
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

  // Strategy 2: Scrape the web page
  if (results.length < maxItems) {
    try {
      log('Trying page scrape:', source.url);
      const response = await fetchWithHeaders(source.url);

      if (response.ok) {
        const html = await response.text();

        // Look for article links
        const linkMatches = html.matchAll(/href=["'](https?:\/\/(?:www\.)?rt\.com\/[^"']+\/\d+[^"']*)["']/gi);

        for (const match of linkMatches) {
          const url = match[1];
          // Filter for actual article URLs
          if (url.match(/\/\d+-[^/]+\/?$/) && !results.find(r => r.url === url)) {
            results.push({
              url,
              source: 'rt',
              sourceKey,
              categories: source.categories,
            });
          }
          if (results.length >= maxItems) break;
        }
        log('Found', results.length, 'items total');
      }
    } catch (e) {
      log('Page scrape error:', e.message);
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

  return {
    source: 'rt',
    sourceUrl: url,
    title: og.title || (jsonLd?.name) || (jsonLd?.headline) || 'Unknown',
    description: og.description || (jsonLd?.description) || null,
    thumbnail: og.image || (jsonLd?.thumbnailUrl) || null,
    publishDate: jsonLd?.datePublished || null,
    duration,
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

  // Fetch play options for stream URL
  const playUrl = `https://rutube.ru/api/play/options/${videoId}/?format=json`;
  let m3u8Url = null;
  try {
    const playData = await fetchJson(playUrl);
    if (playData.video_balancer) {
      m3u8Url = playData.video_balancer.m3u8 || playData.video_balancer.default;
    }
  } catch (e) {
    log('Could not fetch Rutube play options:', e.message);
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
            results.push({
              url: `https://rutube.ru/video/${videoId}/`,
              source: 'rutube',
              sourceKey,
              videoId,
              title: item.title || null,
              description: item.description || null,
              thumbnail: item.thumbnail_url || item.picture || null,
              publishDate: item.created_ts || item.publication_ts || null,
              duration: item.duration || null,
              author: item.author?.name || null,
              categories: source.categories,
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
            results.push({
              url: `https://rutube.ru/video/${item.id}/`,
              source: 'rutube',
              sourceKey,
              videoId: item.id,
              title: item.title || null,
              thumbnail: item.thumbnail_url || null,
              duration: item.duration || null,
              categories: source.categories,
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
            results.push({
              url: `https://rutube.ru/video/${videoId}/`,
              source: 'izvestia',
              sourceKey,
              videoId,
              title: item.title || null,
              description: item.description || null,
              thumbnail: item.thumbnail_url || item.picture || null,
              publishDate: item.created_ts || item.publication_ts || null,
              duration: item.duration || null,
              // Include iz.ru reference for citation purposes
              izvestiaRef: true,
              categories: site.sources.video.categories,
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
  const results = [];

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
        const url = match[1];
        const videoId = match[2];

        results.push({
          url,
          source: 'ntv',
          sourceKey,
          videoId,
          categories: SITES['ntv'].sources[sourceKey]?.categories || ['politics', 'society'],
        });

        if (results.length >= maxItems) break;
      }
      log('Found', results.length, 'videos from NTV sitemap');
    }
  } catch (e) {
    log('NTV sitemap error:', e.message);
  }

  // Strategy 2: Scrape video listing page
  if (results.length < maxItems) {
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
            const url = `https://ntv.ru/video/${videoId}/`;

            if (!results.find(r => r.videoId === videoId)) {
              results.push({
                url,
                source: 'ntv',
                sourceKey,
                videoId,
                categories: source.categories,
              });
            }

            if (results.length >= maxItems) break;
          }
          log('Found', results.length, 'videos total from NTV');
        }
      }
    } catch (e) {
      log('NTV page scrape error:', e.message);
    }
  }

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

      // Parse XML response
      const title = xml.match(/<title>([^<]+)<\/title>/)?.[1] || '';
      const description = xml.match(/<description>([^<]+)<\/description>/)?.[1] || '';
      const duration = parseInt(xml.match(/<duration>(\d+)<\/duration>/)?.[1] || '0');
      const thumbnail = xml.match(/<image>([^<]+)<\/image>/)?.[1] || '';
      const views = parseInt(xml.match(/<views>(\d+)<\/views>/)?.[1] || '0');

      // Extract MP4 URLs
      let mp4Url = null;
      let mp4UrlHd = null;

      // Standard quality
      const fileMatch = xml.match(/<file>([^<]+)<\/file>/);
      if (fileMatch) {
        mp4Url = fileMatch[1];
        if (mp4Url.startsWith('//')) mp4Url = 'https:' + mp4Url;
      }

      // HD quality
      const fileHdMatch = xml.match(/<filehires>[\s\S]*?<file>([^<]+)<\/file>[\s\S]*?<\/filehires>/);
      if (fileHdMatch) {
        mp4UrlHd = fileHdMatch[1];
        if (mp4UrlHd.startsWith('//')) mp4UrlHd = 'https:' + mp4UrlHd;
      }

      return {
        source: 'ntv',
        sourceUrl: url,
        videoId,
        title: decodeHtmlEntities(title),
        description: decodeHtmlEntities(description),
        thumbnail: thumbnail.startsWith('http') ? thumbnail : `https://ntv.ru${thumbnail}`,
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

// --- RIA.RU (RIA Novosti) ---

async function discoverRia(sourceKey = 'video', maxItems = 20) {
  log('Discovering from RIA Novosti:', sourceKey);
  const results = [];

  try {
    const response = await fetchWithHeaders('https://ria.ru/video/', {
      headers: { 'Accept-Language': 'ru-RU,ru;q=0.9' }
    });

    if (response.ok) {
      const html = await response.text();

      // Extract article URLs from video listing
      const urlMatches = html.matchAll(/href=["'](https:\/\/ria\.ru\/\d{8}\/[^"']+\.html)["']/gi);

      for (const match of urlMatches) {
        const url = match[1];

        // Extract date from URL
        const dateMatch = url.match(/\/(\d{4})(\d{2})(\d{2})\//);

        results.push({
          url,
          source: 'ria',
          sourceKey,
          publishDate: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null,
          categories: SITES['ria'].sources[sourceKey]?.categories || ['politics', 'society'],
        });

        if (results.length >= maxItems) break;
      }
      log('Found', results.length, 'videos from RIA');
    }
  } catch (e) {
    log('RIA discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

async function extractRia(url) {
  log('Extracting from RIA Novosti:', url);

  const response = await fetchWithHeaders(url, {
    headers: { 'Accept-Language': 'ru-RU,ru;q=0.9' }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  // Extract JSON-LD VideoObject schema
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let videoObject = null;

  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        if (data['@type'] === 'VideoObject') {
          videoObject = data;
          break;
        }
      } catch (e) { /* continue */ }
    }
  }

  if (!videoObject) {
    // Fallback to OpenGraph
    const og = extractOpenGraph(html);
    return {
      source: 'ria',
      sourceUrl: url,
      title: og.title || 'RIA Video',
      description: og.description || null,
      thumbnail: og.image || null,
      streamType: null,
    };
  }

  // Parse ISO 8601 duration (PT1M30S -> seconds)
  let duration = null;
  if (videoObject.duration) {
    const durMatch = videoObject.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (durMatch) {
      duration = (parseInt(durMatch[1] || 0) * 3600) +
                 (parseInt(durMatch[2] || 0) * 60) +
                 parseInt(durMatch[3] || 0);
    }
  }

  // Extract video ID from contentUrl
  let videoId = null;
  let mp4Url = videoObject.contentUrl || null;
  if (mp4Url) {
    const idMatch = mp4Url.match(/\/id\/(\d+)\//);
    videoId = idMatch ? idMatch[1] : null;
  }

  return {
    source: 'ria',
    sourceUrl: url,
    videoId,
    title: videoObject.name || '',
    description: videoObject.description || '',
    thumbnail: videoObject.thumbnailUrl || '',
    publishDate: videoObject.uploadDate || null,
    duration,
    mp4Url,
    streamType: 'mp4',
  };
}

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
          results.push({
            url: `https://rutube.ru/video/${item.id}/`,
            source: 'tass',
            sourceKey,
            videoId: item.id,
            title: item.title || null,
            description: item.description || null,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration: item.duration || null,
            categories: SITES['tass'].sources[sourceKey]?.categories || ['politics', 'society'],
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

// --- KOMMERSANT (via Rutube) ---

async function discoverKommersant(sourceKey = 'video', maxItems = 20) {
  const channelId = SITES['kommersant'].rutubeChannelId;
  log('Discovering from Kommersant via Rutube channel:', channelId);
  const results = [];

  try {
    const apiUrl = `https://rutube.ru/api/video/person/${channelId}/?format=json&page=1&page_size=${maxItems}`;
    log('Fetching Kommersant Rutube channel:', apiUrl);

    const response = await fetchWithHeaders(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          results.push({
            url: `https://rutube.ru/video/${item.id}/`,
            source: 'kommersant',
            sourceKey,
            videoId: item.id,
            title: item.title || null,
            description: item.description || null,
            thumbnail: item.thumbnail_url || null,
            publishDate: item.created_ts || null,
            duration: item.duration || null,
            categories: SITES['kommersant'].sources[sourceKey]?.categories || ['politics', 'economy'],
          });
        }
        log('Found', results.length, 'videos from Kommersant Rutube channel');
      }
    }
  } catch (e) {
    log('Kommersant discovery error:', e.message);
  }

  return results.slice(0, maxItems);
}

async function extractKommersant(url) {
  log('Extracting from Kommersant:', url);

  // Kommersant uses Rutube - delegate extraction
  if (url.includes('rutube.ru')) {
    const result = await extractRutube(url);
    result.source = 'kommersant';
    return result;
  }

  // If it's a kommersant.ru URL, look for Rutube embed
  try {
    const response = await fetchWithHeaders(url);
    if (response.ok) {
      const html = await response.text();

      // Look for Rutube embed
      const rutubeMatch = html.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i);
      if (rutubeMatch) {
        const result = await extractRutube(`https://rutube.ru/video/${rutubeMatch[1]}/`);
        result.source = 'kommersant';
        return result;
      }
    }
  } catch (e) {
    log('Kommersant page parse error:', e.message);
  }

  throw new Error('Could not extract Kommersant video - no Rutube embed found');
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
    case 'ria':
      return extractRia(url);
    case 'tass':
      return extractTass(url);
    case 'kommersant':
      return extractKommersant(url);
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

  if (!meta.m3u8Url) {
    throw new Error('No stream URL found for this video');
  }

  log('Found m3u8:', meta.m3u8Url);

  // Fetch m3u8 playlist
  const m3u8Response = await fetchWithHeaders(meta.m3u8Url);
  if (!m3u8Response.ok) throw new Error(`Failed to fetch m3u8: ${m3u8Response.status}`);
  const m3u8Content = await m3u8Response.text();

  const playlist = parseM3u8(m3u8Content, meta.m3u8Url);

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
    segmentPlaylist = parseM3u8(variantContent, variantUrl);
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

async function handleDiscover(url) {
  const sourceParam = url.searchParams.get('source');
  const category = url.searchParams.get('category');
  const maxItems = parseInt(url.searchParams.get('max') || '20');
  const sourcesParam = url.searchParams.get('sources'); // Comma-separated sources

  const results = [];
  const errors = [];

  // Parse sources to discover from
  let sourcesToDiscover = [];

  if (sourceParam) {
    // Single source specified
    sourcesToDiscover.push(sourceParam);
  } else if (sourcesParam) {
    // Multiple sources specified
    sourcesToDiscover = sourcesParam.split(',').map(s => s.trim());
  } else {
    // Default: discover from main sources of each site (9 sources)
    sourcesToDiscover = [
      '1tv:news', 'smotrim:news', 'rt:news', 'rutube:news', 'izvestia:video',
      'ntv:video', 'ria:video', 'tass:video', 'kommersant:video'
    ];
  }

  // Calculate items per source
  const itemsPerSource = Math.max(5, Math.ceil(maxItems / sourcesToDiscover.length));

  // Discover from each source
  for (const source of sourcesToDiscover) {
    const [siteId, sourceId] = source.split(':');

    try {
      let items = [];

      switch (siteId) {
        case '1tv':
          items = await discover1tv(sourceId || 'news', itemsPerSource);
          break;

        case 'smotrim':
          items = await discoverSmotrim(sourceId || 'news', itemsPerSource);
          break;

        case 'rt':
          items = await discoverRt(sourceId || 'news', itemsPerSource);
          break;

        case 'rutube':
          items = await discoverRutube(sourceId || 'news', itemsPerSource);
          break;

        case 'izvestia':
          items = await discoverIzvestia(sourceId || 'video', itemsPerSource);
          break;

        case 'ntv':
          items = await discoverNtv(sourceId || 'video', itemsPerSource);
          break;

        case 'ria':
          items = await discoverRia(sourceId || 'video', itemsPerSource);
          break;

        case 'tass':
          items = await discoverTass(sourceId || 'video', itemsPerSource);
          break;

        case 'kommersant':
          items = await discoverKommersant(sourceId || 'video', itemsPerSource);
          break;

        default:
          log('Unknown site:', siteId);
          errors.push({ source, error: `Unknown site: ${siteId}` });
          continue;
      }

      results.push(...items);
      log(`Discovered ${items.length} items from ${source}`);

    } catch (e) {
      log(`Discovery error for ${source}:`, e.message);
      errors.push({ source, error: e.message });
    }
  }

  // Filter by category if requested
  let filtered = results;
  if (category) {
    filtered = results.filter(r => r.categories && r.categories.includes(category));
  }

  // Sort by publish date (newest first) if available
  filtered.sort((a, b) => {
    if (!a.publishDate && !b.publishDate) return 0;
    if (!a.publishDate) return 1;
    if (!b.publishDate) return -1;
    return new Date(b.publishDate) - new Date(a.publishDate);
  });

  return jsonResponse({
    success: true,
    total: filtered.length,
    items: filtered.slice(0, maxItems),
    errors: errors.length > 0 ? errors : undefined,
  });
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
        return handleDiscover(url);
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

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};
