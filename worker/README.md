# Matushka Cloudflare Worker

Backend API for the browser-based Matushka application. This Cloudflare Worker handles video discovery, metadata scraping, and m3u8 stream proxying from 1tv.ru.

## Deployment

### Option 1: Cloudflare Dashboard (Simplest)

1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers)
2. Click **Create a Service**
3. Give it a name (e.g., `matushka-api`)
4. Click **Create Service**
5. Click **Quick Edit** button
6. Delete the default code and paste the entire contents of `worker.js`
7. Click **Save and Deploy**

Your worker will be available at: `https://matushka-api.<your-subdomain>.workers.dev`

### Option 2: Wrangler CLI

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create `wrangler.toml` in this directory:
   ```toml
   name = "matushka-api"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

## API Endpoints

### GET /

Returns API information and available endpoints.

### GET /api/discover

Discover video URLs from 1tv.ru source pages.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sources` | string | all | Comma-separated source IDs |
| `days_back` | number | 7 | Days to look back (1-365) |
| `max_items` | number | 50 | Maximum URLs to return (1-500) |

**Example:**
```
GET /api/discover?sources=news-main,vremya&days_back=3&max_items=20
```

**Response:**
```json
{
  "success": true,
  "total": 15,
  "cutoff_date": "2024-01-22",
  "sources": {
    "news-main": { "count": 10, "error": null },
    "vremya": { "count": 5, "error": null }
  },
  "urls": [
    "https://www.1tv.ru/news/...",
    "..."
  ]
}
```

### GET /api/scrape

Scrape metadata and m3u8 URL from a single video page.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | 1tv.ru video page URL |

**Example:**
```
GET /api/scrape?url=https://www.1tv.ru/news/2024-01-25/...
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "source_url": "https://www.1tv.ru/news/...",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnail": "https://...",
    "publish_date": "2024-01-25",
    "program": "News",
    "duration_estimate": 180,
    "author": null,
    "site_name": "Первый канал",
    "m3u8_url": "https://...master.m3u8"
  }
}
```

### GET /api/proxy

Proxy an m3u8 stream for download.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | m3u8 stream URL |

**Example:**
```
GET /api/proxy?url=https://...master.m3u8
```

**Response:** Returns the m3u8 file content with `Content-Disposition` header for download.

### GET /api/sources

List available source IDs and their URLs.

**Response:**
```json
{
  "success": true,
  "sources": [
    { "id": "news-main", "url": "https://www.1tv.ru/news", "name": "News Main" },
    { "id": "vremya", "url": "https://www.1tv.ru/shows/vremya", "name": "Vremya" },
    ...
  ]
}
```

## Available Sources

| Source ID | URL | Category |
|-----------|-----|----------|
| `news-main` | https://www.1tv.ru/news | News |
| `vremya` | https://www.1tv.ru/shows/vremya | News Program |
| `pozner` | https://www.1tv.ru/shows/pozner | Interview |
| `culture` | https://www.1tv.ru/news/kultura | Culture |
| `sports` | https://www.1tv.ru/news/sport | Sports |
| `dobroe-utro` | https://www.1tv.ru/shows/dobroe-utro | Morning Show |
| `segodnya-vecherom` | https://www.1tv.ru/shows/segodnya-vecherom | Evening Show |

## CORS

All endpoints include CORS headers allowing requests from any origin:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Error Handling

All errors return JSON with the following structure:

```json
{
  "error": true,
  "message": "Error description",
  "status": 400
}
```

Common HTTP status codes:
- `400` - Bad request (invalid parameters)
- `404` - Endpoint not found
- `405` - Method not allowed
- `500` - Internal server error

## Usage with Frontend

Example JavaScript code for using the API:

```javascript
const API_BASE = 'https://matushka-api.your-subdomain.workers.dev';

// Discover videos
async function discoverVideos(sources, daysBack = 7) {
  const params = new URLSearchParams({
    sources: sources.join(','),
    days_back: daysBack
  });

  const response = await fetch(`${API_BASE}/api/discover?${params}`);
  return response.json();
}

// Get video metadata
async function getVideoMetadata(videoUrl) {
  const params = new URLSearchParams({ url: videoUrl });
  const response = await fetch(`${API_BASE}/api/scrape?${params}`);
  return response.json();
}

// Get download URL for m3u8
function getProxyUrl(m3u8Url) {
  const params = new URLSearchParams({ url: m3u8Url });
  return `${API_BASE}/api/proxy?${params}`;
}
```

## Limitations

1. **JavaScript-rendered content**: Some video pages on 1tv.ru load video URLs via JavaScript. Since Cloudflare Workers cannot execute JavaScript from fetched pages, m3u8 URLs may not be found for all videos. The API will return a warning in such cases.

2. **Rate limiting**: Cloudflare Workers have request limits. The free tier allows 100,000 requests/day.

3. **Subrequests**: Each worker request can make up to 50 subrequests (fetch calls). The `/api/discover` endpoint fetches multiple source pages in parallel.

## Development

To test locally with Wrangler:

```bash
wrangler dev
```

This starts a local development server at `http://localhost:8787`.

## License

MIT License - See main project LICENSE file.
