/**
 * Matushka Enhanced Cloudflare Worker
 *
 * Multi-site Russian news video discovery, metadata extraction, and audio extraction.
 * Supports: 1tv.ru, smotrim.ru, rt.com, Rutube (for iz.ru, kommersant.ru)
 *
 * @version 2.0.0
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

// Site configurations with discovery URLs and category mappings
const SITES = {
  '1tv': {
    name: 'Channel One',
    nameRu: 'Первый канал',
    domain: '1tv.ru',
    sources: {
      'news': { url: 'https://www.1tv.ru/news', categories: ['politics', 'society', 'world'] },
      'politics': { url: 'https://www.1tv.ru/news/politika', categories: ['politics'] },
      'economy': { url: 'https://www.1tv.ru/news/ekonomika', categories: ['economy'] },
      'society': { url: 'https://www.1tv.ru/news/obschestvo', categories: ['society'] },
      'world': { url: 'https://www.1tv.ru/news/v-mire', categories: ['world'] },
      'sports': { url: 'https://www.1tv.ru/news/sport', categories: ['sports'] },
      'culture': { url: 'https://www.1tv.ru/news/kultura', categories: ['culture'] },
      'vremya': { url: 'https://www.1tv.ru/shows/vremya', categories: ['politics', 'world'] },
    }
  },
  'smotrim': {
    name: 'Smotrim (VGTRK)',
    nameRu: 'Смотрим (ВГТРК)',
    domain: 'smotrim.ru',
    apiBase: 'https://player.smotrim.ru/iframe',
    sources: {
      'news': { url: 'https://smotrim.ru/vesti', categories: ['politics', 'society', 'world'] },
      'russia24': { url: 'https://smotrim.ru/russia24', categories: ['politics', 'economy', 'world'] },
    }
  },
  'rt': {
    name: 'RT',
    nameRu: 'RT',
    domain: 'rt.com',
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
    // Used for iz.ru, kommersant.ru embeds
  },
  'izvestia': {
    name: 'Izvestia',
    nameRu: 'Известия',
    domain: 'iz.ru',
    usesRutube: true,
    sources: {
      'video': { url: 'https://iz.ru/video', categories: ['politics', 'society', 'world'] },
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

  log('Discovering from 1tv:', source.url);
  const response = await fetchWithHeaders(source.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  const links = extractLinks(html, source.url);
  const videoUrls = links.filter(link => {
    return link.includes('1tv.ru') &&
           /\/news\/[^/]+\/\d{4}-\d{2}-\d{2}\//.test(link);
  });

  return videoUrls.slice(0, maxItems).map(url => ({
    url,
    source: '1tv',
    categories: source.categories,
  }));
}

// --- SMOTRIM.RU ---

async function extractSmotrim(url) {
  log('Extracting from smotrim.ru:', url);

  // Extract video ID from URL
  const idMatch = url.match(/\/video\/(\d+)/);
  if (!idMatch) throw new Error('Could not extract video ID from smotrim.ru URL');
  const videoId = idMatch[1];

  // Fetch video data from API
  const apiUrl = `https://player.smotrim.ru/iframe/datavideo/id/${videoId}`;
  const data = await fetchJson(apiUrl);

  if (!data || !data.data) throw new Error('Invalid API response');

  const video = data.data;
  const playlist = video.playlist && video.playlist.medialist;

  let m3u8Url = null;
  let mp4Url = null;

  if (playlist && playlist.length > 0) {
    const media = playlist[playlist.length - 1];
    if (media.sources) {
      m3u8Url = media.sources.m3u8 || null;
      mp4Url = media.sources.mp4 || null;
    }
  }

  return {
    source: 'smotrim',
    sourceUrl: url,
    title: video.title || video.episodeTitle || 'Unknown',
    description: video.anons || null,
    thumbnail: video.picture || null,
    publishDate: video.datePublished || null,
    duration: video.duration || null,
    m3u8Url,
    mp4Url,
    streamType: m3u8Url ? 'hls' : 'mp4',
  };
}

// --- RT.COM ---

async function extractRt(url) {
  log('Extracting from rt.com:', url);
  const response = await fetchWithHeaders(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();

  const og = extractOpenGraph(html);
  const jsonLd = extractJsonLd(html);

  // Look for Video.js config or direct m3u8
  let m3u8Url = null;
  const m3u8Match = html.match(/src:\s*["']([^"']+\.m3u8[^"']*)["']/);
  if (m3u8Match) {
    m3u8Url = m3u8Match[1];
  }

  return {
    source: 'rt',
    sourceUrl: url,
    title: og.title || (jsonLd && jsonLd.name) || 'Unknown',
    description: og.description || (jsonLd && jsonLd.description) || null,
    thumbnail: og.image || null,
    publishDate: jsonLd && jsonLd.datePublished || null,
    duration: null,
    m3u8Url,
    streamType: 'hls',
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
    case 'kommersant':
      return extractRutubeFromPage(url);
    default:
      throw new Error(`Unsupported site: ${url}`);
  }
}

// ============================================================================
// AUDIO EXTRACTION
// ============================================================================

async function extractAudio(videoUrl) {
  log('Starting audio extraction for:', videoUrl);

  // First get metadata to find m3u8 URL
  const meta = await extractMetadata(videoUrl);

  if (!meta.m3u8Url) {
    throw new Error('No HLS stream found for this video');
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

  // Generate filename from title
  const safeTitle = (meta.title || 'audio')
    .replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
    .substring(0, 50);
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

  const results = [];

  // If specific source requested
  if (sourceParam) {
    const [siteId, sourceId] = sourceParam.split(':');
    if (siteId === '1tv') {
      const items = await discover1tv(sourceId, maxItems);
      results.push(...items);
    }
  } else {
    // Discover from all 1tv sources (default)
    for (const sourceId of Object.keys(SITES['1tv'].sources)) {
      try {
        const items = await discover1tv(sourceId, Math.floor(maxItems / 4));
        results.push(...items);
      } catch (e) {
        log('Discovery error for', sourceId, ':', e.message);
      }
    }
  }

  // Filter by category if requested
  let filtered = results;
  if (category) {
    filtered = results.filter(r => r.categories && r.categories.includes(category));
  }

  return jsonResponse({
    success: true,
    total: filtered.length,
    items: filtered.slice(0, maxItems),
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
    const { audioData, filename, metadata } = await extractAudio(targetUrl);
    return audioResponse(audioData, filename);
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
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #1a365d; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
    pre { background: #f0f0f0; padding: 15px; border-radius: 8px; overflow-x: auto; }
    .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
    .method { background: #48bb78; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🎬 Matushka API v2.0</h1>
  <p>Multi-site Russian news video extraction with audio support.</p>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/sources</code></p>
    <p>List all available sources and categories.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/discover?source=1tv:news&category=politics&max=20</code></p>
    <p>Discover videos from sources. All parameters optional.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/scrape?url=...</code></p>
    <p>Extract metadata and stream URL from a video page.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/proxy?url=...</code></p>
    <p>Proxy m3u8 playlists with CORS headers.</p>
  </div>

  <div class="endpoint">
    <p><span class="method">GET</span> <code>/api/audio?url=...</code></p>
    <p><strong>NEW:</strong> Extract audio from video as AAC file.</p>
  </div>

  <h2>Supported Sites</h2>
  <ul>
    <li><strong>1tv.ru</strong> - Channel One Russia</li>
    <li><strong>smotrim.ru</strong> - VGTRK / Vesti / Russia 24</li>
    <li><strong>rt.com</strong> - Russia Today</li>
    <li><strong>rutube.ru</strong> - Rutube (also for iz.ru, kommersant.ru embeds)</li>
  </ul>

  <h2>Categories</h2>
  <ul>
    <li>politics, economy, society, world</li>
    <li>sports, culture, science, technology</li>
  </ul>
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
