/**
 * Matushka Cloudflare Worker
 *
 * Browser-based backend for the Matushka Russian Language Teaching Materials Collector.
 * Handles video discovery, metadata scraping, and m3u8 stream proxying from 1tv.ru.
 *
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Source URL mappings for 1tv.ru content sections
 * Maps friendly source IDs to their corresponding URLs
 */
const SOURCE_URLS = {
  'news-main': 'https://www.1tv.ru/news',
  'vremya': 'https://www.1tv.ru/shows/vremya',
  'pozner': 'https://www.1tv.ru/shows/pozner',
  'culture': 'https://www.1tv.ru/news/kultura',
  'sports': 'https://www.1tv.ru/news/sport',
  'dobroe-utro': 'https://www.1tv.ru/shows/dobroe-utro',
  'segodnya-vecherom': 'https://www.1tv.ru/shows/segodnya-vecherom'
};

/**
 * Default user agent for fetch requests
 * Mimics a standard desktop browser to avoid blocking
 */
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Default configuration values
 */
const DEFAULTS = {
  DAYS_BACK: 7,
  MAX_ITEMS: 50
};

// ============================================================================
// CORS HEADERS
// ============================================================================

/**
 * Standard CORS headers for all responses
 * Allows requests from any origin (GitHub Pages, local development, etc.)
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

/**
 * Creates a JSON response with CORS headers
 * @param {Object} data - Response data to serialize
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Response} Fetch API Response object
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

/**
 * Creates an error response with proper JSON structure
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Fetch API Response object
 */
function errorResponse(message, status = 400) {
  return jsonResponse({
    error: true,
    message,
    status
  }, status);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetches a URL with standard headers for 1tv.ru
 * @param {string} url - URL to fetch
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithHeaders(url) {
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });
}

/**
 * Extracts date from a 1tv.ru URL pattern
 * Supports formats like /news/YYYY-MM-DD/ or /YYYY/MM/DD/
 * @param {string} url - URL to parse
 * @returns {Date|null} Extracted date or null if not found
 */
function extractDateFromUrl(url) {
  // Pattern: /YYYY-MM-DD/ (most common on 1tv.ru)
  const dashPattern = /\/(\d{4})-(\d{2})-(\d{2})\//;
  let match = url.match(dashPattern);

  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Pattern: /YYYY/MM/DD/
  const slashPattern = /\/(\d{4})\/(\d{2})\/(\d{2})\//;
  match = url.match(slashPattern);

  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return null;
}

/**
 * Checks if a URL is likely a video/article page
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be a video page
 */
function isVideoUrl(url) {
  const videoPatterns = [
    /\/news\/[^/]+\/\d{4}-\d{2}-\d{2}\//,
    /\/shows\/[^/]+\/[^/]+/,
    /\/video\//,
    /\/watch\//,
    /\/\d{4}-\d{2}-\d{2}\//
  ];

  // Exclude navigation/category pages
  const excludePatterns = [
    /\/(news|shows|sport|doc)\/?$/,
    /\/page\/\d+/,
    /\?/
  ];

  const isVideo = videoPatterns.some(pattern => pattern.test(url));
  const isExcluded = excludePatterns.some(pattern => pattern.test(url));

  return isVideo && !isExcluded;
}

/**
 * Extracts program/show name from URL path
 * @param {string} url - URL to parse
 * @returns {string|null} Program name or null
 */
function extractProgramFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);

    if (pathParts.length >= 2) {
      if (pathParts[0] === 'shows' || pathParts[0] === 'programs') {
        // Convert kebab-case to Title Case
        return pathParts[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
      if (pathParts[0] === 'news' && pathParts.length >= 2) {
        // Check if second part is a category (not a date)
        if (!/^\d{4}/.test(pathParts[1])) {
          return pathParts[1]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }
  } catch (e) {
    // Invalid URL, ignore
  }
  return null;
}

/**
 * Parses HTML to extract links
 * Simple regex-based parser for Cloudflare Workers (no DOM available)
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {string[]} Array of absolute URLs
 */
function extractLinksFromHtml(html, baseUrl) {
  const links = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];

    // Skip anchors, javascript, and mailto links
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      continue;
    }

    // Convert relative URLs to absolute
    try {
      const absoluteUrl = new URL(href, baseUrl).href;

      // Only include 1tv.ru URLs
      if (absoluteUrl.includes('1tv.ru')) {
        links.push(absoluteUrl);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)]; // Remove duplicates
}

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

/**
 * Extracts Open Graph meta tags from HTML
 * @param {string} html - HTML content
 * @returns {Object} Object with og:* values
 */
function extractOpenGraphTags(html) {
  const ogData = {};

  const ogPatterns = {
    title: /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    description: /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    image: /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    video: /<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i,
    type: /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i,
    siteName: /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    url: /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i
  };

  // Also check reversed attribute order (content before property)
  const ogPatternsReversed = {
    title: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    description: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    image: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    video: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video["']/i,
    type: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:type["']/i,
    siteName: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    url: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i
  };

  for (const [key, pattern] of Object.entries(ogPatterns)) {
    const match = html.match(pattern) || html.match(ogPatternsReversed[key]);
    if (match) {
      ogData[key] = decodeHtmlEntities(match[1].trim());
    }
  }

  return ogData;
}

/**
 * Extracts JSON-LD structured data from HTML
 * @param {string} html - HTML content
 * @returns {Object|null} Parsed JSON-LD data or null
 */
function extractJsonLd(html) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Handle arrays of JSON-LD objects
      if (Array.isArray(data)) {
        for (const item of data) {
          if (['VideoObject', 'NewsArticle', 'Article'].includes(item['@type'])) {
            return item;
          }
        }
      } else if (data && typeof data === 'object') {
        if (['VideoObject', 'NewsArticle', 'Article'].includes(data['@type'])) {
          return data;
        }
        // Handle nested @graph
        if (data['@graph'] && Array.isArray(data['@graph'])) {
          for (const item of data['@graph']) {
            if (['VideoObject', 'NewsArticle', 'Article'].includes(item['@type'])) {
              return item;
            }
          }
        }
      }
    } catch (e) {
      // Invalid JSON, try next script
    }
  }

  return null;
}

/**
 * Extracts standard meta tags from HTML
 * @param {string} html - HTML content
 * @returns {Object} Object with meta tag values
 */
function extractMetaTags(html) {
  const metaData = {};

  // Description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (descMatch) {
    metaData.description = decodeHtmlEntities(descMatch[1].trim());
  }

  // Author
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["']/i);
  if (authorMatch) {
    metaData.author = decodeHtmlEntities(authorMatch[1].trim());
  }

  // Publish date (various formats)
  const datePatterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
    /<meta[^>]+name=["']publish_date["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i
  ];

  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      metaData.publishDate = match[1].trim();
      break;
    }
  }

  return metaData;
}

/**
 * Extracts the page title from HTML
 * @param {string} html - HTML content
 * @returns {string|null} Page title or null
 */
function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (match) {
    // Clean up title (often has site name suffix)
    let title = decodeHtmlEntities(match[1].trim());
    // Remove common suffixes like " - Первый канал" or " | 1tv.ru"
    title = title.replace(/\s*[-|]\s*(Первый канал|1tv\.ru|Channel One).*$/i, '');
    return title;
  }
  return null;
}

/**
 * Decodes HTML entities in a string
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => String.fromCharCode(parseInt(num)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

/**
 * Extracts m3u8 URL from page HTML
 * Searches for 1internet.tv patterns and master.m3u8 references
 * @param {string} html - HTML content
 * @returns {string|null} m3u8 URL or null
 */
function extractM3u8Url(html) {
  // Common patterns for 1tv.ru video streams
  const patterns = [
    // 1internet.tv CDN pattern (most common)
    /https?:\/\/[^"'\s]+1internet\.tv[^"'\s]+master\.m3u8[^"'\s]*/gi,
    /https?:\/\/[^"'\s]+1internet\.tv[^"'\s]+\.m3u8[^"'\s]*/gi,

    // Generic m3u8 patterns
    /https?:\/\/[^"'\s]+master\.m3u8[^"'\s]*/gi,
    /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,

    // Video source elements
    /src=["']([^"']+\.m3u8[^"']*)["']/gi,

    // JSON embedded URLs (escaped slashes)
    /https?:\\\/\\\/[^"'\s]+\.m3u8[^"'\s]*/gi
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Get the first match and clean it up
      let url = matches[0];

      // Handle src="..." pattern
      if (url.startsWith('src=')) {
        const srcMatch = url.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          url = srcMatch[1];
        }
      }

      // Unescape JSON-style URLs
      url = url.replace(/\\\//g, '/');

      // Remove trailing quotes or special chars
      url = url.replace(/["'<>\s].*$/, '');

      // Validate it's a proper URL
      try {
        new URL(url);
        return url;
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

/**
 * Estimates video duration from various sources in the page
 * @param {string} html - HTML content
 * @param {Object} jsonLd - JSON-LD data if available
 * @returns {number|null} Duration in seconds or null
 */
function estimateDuration(html, jsonLd) {
  // Check JSON-LD first
  if (jsonLd && jsonLd.duration) {
    // ISO 8601 duration format (e.g., "PT5M30S")
    const match = jsonLd.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  // Check for duration in meta tags
  const durationMeta = html.match(/<meta[^>]+(?:name|property)=["'](?:duration|video:duration)["'][^>]+content=["']([^"']+)["']/i);
  if (durationMeta) {
    const seconds = parseInt(durationMeta[1]);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }

  // Check for duration text in page (e.g., "5:30" or "1:05:30")
  const durationText = html.match(/(?:duration|длительность)[^0-9]*(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (durationText) {
    if (durationText[3]) {
      // Hours:minutes:seconds
      return parseInt(durationText[1]) * 3600 + parseInt(durationText[2]) * 60 + parseInt(durationText[3]);
    } else {
      // Minutes:seconds
      return parseInt(durationText[1]) * 60 + parseInt(durationText[2]);
    }
  }

  return null;
}

/**
 * Extracts comprehensive metadata from a video page
 * @param {string} html - HTML content
 * @param {string} url - Page URL
 * @returns {Object} Metadata object
 */
function extractMetadata(html, url) {
  const ogData = extractOpenGraphTags(html);
  const jsonLd = extractJsonLd(html);
  const metaTags = extractMetaTags(html);

  const metadata = {
    source_url: url
  };

  // Title (priority: OG > JSON-LD > title tag)
  metadata.title = ogData.title ||
                   (jsonLd && (jsonLd.name || jsonLd.headline)) ||
                   extractTitle(html) ||
                   'Unknown Title';

  // Description
  metadata.description = ogData.description ||
                         (jsonLd && jsonLd.description) ||
                         metaTags.description ||
                         null;

  // Thumbnail
  metadata.thumbnail = ogData.image ||
                       (jsonLd && jsonLd.thumbnailUrl) ||
                       null;

  // Publish date
  metadata.publish_date = (jsonLd && jsonLd.datePublished) ||
                          metaTags.publishDate ||
                          extractDateFromUrl(url)?.toISOString().split('T')[0] ||
                          null;

  // Program/show name
  metadata.program = extractProgramFromUrl(url) ||
                     (jsonLd && jsonLd.isPartOf && jsonLd.isPartOf.name) ||
                     null;

  // Duration estimate
  metadata.duration_estimate = estimateDuration(html, jsonLd);

  // Author
  metadata.author = metaTags.author ||
                    (jsonLd && jsonLd.author && (typeof jsonLd.author === 'string' ? jsonLd.author : jsonLd.author.name)) ||
                    null;

  // Site name
  metadata.site_name = ogData.siteName || 'Первый канал';

  // m3u8 URL
  metadata.m3u8_url = extractM3u8Url(html);

  return metadata;
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * Handles GET /api/discover
 * Discovers video URLs from source pages
 *
 * Query parameters:
 * - sources: comma-separated list of source IDs (default: all)
 * - days_back: number of days to look back (default: 7)
 * - max_items: maximum items to return (default: 50)
 *
 * @param {URL} url - Request URL with query parameters
 * @returns {Promise<Response>} JSON response with video URLs
 */
async function handleDiscover(url) {
  try {
    // Parse query parameters
    const sourcesParam = url.searchParams.get('sources');
    const daysBack = parseInt(url.searchParams.get('days_back') || DEFAULTS.DAYS_BACK);
    const maxItems = parseInt(url.searchParams.get('max_items') || DEFAULTS.MAX_ITEMS);

    // Validate days_back
    if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
      return errorResponse('Invalid days_back parameter (must be 1-365)', 400);
    }

    // Validate max_items
    if (isNaN(maxItems) || maxItems < 1 || maxItems > 500) {
      return errorResponse('Invalid max_items parameter (must be 1-500)', 400);
    }

    // Determine which sources to fetch
    let sourceIds = sourcesParam ? sourcesParam.split(',').map(s => s.trim()) : Object.keys(SOURCE_URLS);

    // Validate source IDs
    const invalidSources = sourceIds.filter(id => !SOURCE_URLS[id]);
    if (invalidSources.length > 0) {
      return errorResponse(`Invalid source IDs: ${invalidSources.join(', ')}. Valid sources: ${Object.keys(SOURCE_URLS).join(', ')}`, 400);
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Fetch all source pages in parallel
    const fetchPromises = sourceIds.map(async (sourceId) => {
      const sourceUrl = SOURCE_URLS[sourceId];

      try {
        const response = await fetchWithHeaders(sourceUrl);

        if (!response.ok) {
          console.error(`Failed to fetch ${sourceUrl}: ${response.status}`);
          return { sourceId, urls: [], error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        const allLinks = extractLinksFromHtml(html, sourceUrl);

        // Filter to video URLs only
        const videoUrls = allLinks.filter(link => isVideoUrl(link));

        // Filter by date
        const filteredUrls = videoUrls.filter(videoUrl => {
          const urlDate = extractDateFromUrl(videoUrl);
          // Include if no date found (can't determine age) or if within range
          return !urlDate || urlDate >= cutoffDate;
        });

        return { sourceId, urls: filteredUrls };

      } catch (error) {
        console.error(`Error fetching ${sourceUrl}:`, error);
        return { sourceId, urls: [], error: error.message };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Combine all URLs and remove duplicates
    const allUrls = [];
    const urlSet = new Set();
    const sourceResults = {};

    for (const result of results) {
      sourceResults[result.sourceId] = {
        count: result.urls.length,
        error: result.error || null
      };

      for (const url of result.urls) {
        if (!urlSet.has(url)) {
          urlSet.add(url);
          allUrls.push(url);

          if (allUrls.length >= maxItems) {
            break;
          }
        }
      }

      if (allUrls.length >= maxItems) {
        break;
      }
    }

    return jsonResponse({
      success: true,
      total: allUrls.length,
      cutoff_date: cutoffDate.toISOString().split('T')[0],
      sources: sourceResults,
      urls: allUrls
    });

  } catch (error) {
    console.error('Discover error:', error);
    return errorResponse(`Discovery failed: ${error.message}`, 500);
  }
}

/**
 * Handles GET /api/scrape
 * Scrapes metadata and m3u8 URL from a single video page
 *
 * Query parameters:
 * - url: the 1tv.ru video page URL to scrape
 *
 * @param {URL} reqUrl - Request URL with query parameters
 * @returns {Promise<Response>} JSON response with metadata
 */
async function handleScrape(reqUrl) {
  try {
    const targetUrl = reqUrl.searchParams.get('url');

    if (!targetUrl) {
      return errorResponse('Missing required parameter: url', 400);
    }

    // Validate URL
    try {
      const urlObj = new URL(targetUrl);
      if (!urlObj.hostname.includes('1tv.ru')) {
        return errorResponse('URL must be from 1tv.ru domain', 400);
      }
    } catch (e) {
      return errorResponse('Invalid URL format', 400);
    }

    // Fetch the page
    const response = await fetchWithHeaders(targetUrl);

    if (!response.ok) {
      return errorResponse(`Failed to fetch page: HTTP ${response.status}`, response.status);
    }

    const html = await response.text();

    // Extract all metadata
    const metadata = extractMetadata(html, targetUrl);

    // Check if we found an m3u8 URL
    if (!metadata.m3u8_url) {
      return jsonResponse({
        success: true,
        warning: 'No m3u8 URL found in page source. Video may require JavaScript to load.',
        metadata
      });
    }

    return jsonResponse({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return errorResponse(`Scraping failed: ${error.message}`, 500);
  }
}

/**
 * Handles GET /api/proxy
 * Proxies an m3u8 stream for download
 *
 * Query parameters:
 * - url: the m3u8 URL to proxy
 *
 * @param {URL} reqUrl - Request URL with query parameters
 * @returns {Promise<Response>} Stream response with proper headers
 */
async function handleProxy(reqUrl) {
  try {
    const targetUrl = reqUrl.searchParams.get('url');

    if (!targetUrl) {
      return errorResponse('Missing required parameter: url', 400);
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch (e) {
      return errorResponse('Invalid URL format', 400);
    }

    // Check if it's an m3u8 URL
    if (!targetUrl.includes('.m3u8')) {
      return errorResponse('URL must be an m3u8 stream', 400);
    }

    // Fetch the stream
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.1tv.ru/'
      }
    });

    if (!response.ok) {
      return errorResponse(`Failed to fetch stream: HTTP ${response.status}`, response.status);
    }

    // Get content type from response or default to m3u8
    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    // Generate filename from URL
    const urlPath = new URL(targetUrl).pathname;
    const filename = urlPath.split('/').pop() || 'stream.m3u8';

    // Create response with download headers
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...CORS_HEADERS
    };

    // For m3u8 playlist files, we need to process the content
    // to make segment URLs absolute
    const content = await response.text();

    // If this is a master playlist, rewrite relative URLs
    const processedContent = processM3u8Content(content, targetUrl);

    return new Response(processedContent, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return errorResponse(`Proxy failed: ${error.message}`, 500);
  }
}

/**
 * Processes m3u8 content to make relative URLs absolute
 * @param {string} content - m3u8 playlist content
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {string} Processed content with absolute URLs
 */
function processM3u8Content(content, baseUrl) {
  const lines = content.split('\n');
  const baseUrlObj = new URL(baseUrl);
  const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);

  return lines.map(line => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments/tags
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return line;
    }

    // Check if it's a relative URL
    if (!trimmedLine.startsWith('http://') && !trimmedLine.startsWith('https://')) {
      // Make it absolute
      if (trimmedLine.startsWith('/')) {
        // Root-relative
        return `${baseUrlObj.origin}${trimmedLine}`;
      } else {
        // Path-relative
        return `${baseDir}${trimmedLine}`;
      }
    }

    return line;
  }).join('\n');
}

/**
 * Returns list of available sources
 * @returns {Response} JSON response with source information
 */
function handleSources() {
  const sources = Object.entries(SOURCE_URLS).map(([id, url]) => ({
    id,
    url,
    name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }));

  return jsonResponse({
    success: true,
    sources
  });
}

/**
 * Returns API health status and documentation
 * @returns {Response} JSON response with API info
 */
function handleRoot() {
  return jsonResponse({
    name: 'Matushka API',
    version: '1.0.0',
    description: 'Backend API for Matushka - Russian Language Teaching Materials Collector',
    endpoints: {
      '/api/discover': {
        method: 'GET',
        description: 'Discover video URLs from 1tv.ru source pages',
        params: {
          sources: 'Comma-separated source IDs (optional, default: all)',
          days_back: 'Number of days to look back (optional, default: 7)',
          max_items: 'Maximum items to return (optional, default: 50)'
        }
      },
      '/api/scrape': {
        method: 'GET',
        description: 'Scrape metadata and m3u8 URL from a video page',
        params: {
          url: '1tv.ru video page URL (required)'
        }
      },
      '/api/proxy': {
        method: 'GET',
        description: 'Proxy m3u8 stream for download',
        params: {
          url: 'm3u8 stream URL (required)'
        }
      },
      '/api/sources': {
        method: 'GET',
        description: 'List available source IDs and their URLs'
      }
    },
    sources: Object.keys(SOURCE_URLS)
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Main request handler for the Cloudflare Worker
 * Routes requests to appropriate handlers based on path
 *
 * @param {Request} request - Incoming request
 * @returns {Promise<Response>} Response
 */
async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  // Only allow GET requests for API endpoints
  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Route to appropriate handler
  switch (path) {
    case '/':
    case '/api':
    case '/api/':
      return handleRoot();

    case '/api/discover':
      return handleDiscover(url);

    case '/api/scrape':
      return handleScrape(url);

    case '/api/proxy':
      return handleProxy(url);

    case '/api/sources':
      return handleSources();

    default:
      return errorResponse(`Unknown endpoint: ${path}`, 404);
  }
}

// ============================================================================
// WORKER EXPORT
// ============================================================================

/**
 * Cloudflare Worker event handler
 * Uses the modern ES modules syntax for Workers
 */
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
};
