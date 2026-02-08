const https = require('https');

const API_BASE = 'https://matushka-api.arwrubel.workers.dev';

const SOURCES = [
  'smotrim:news',
  'rt:news',
  '1tv:news',
  'rutube:news',
  'ntv:video',
  'ria:main',
  'tass:main',
  'kommersant:main'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 60000 }, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => data = Buffer.concat([data, chunk]));
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function testSource(sourceKey) {
  const sourceName = sourceKey.split(':')[0].toUpperCase();
  console.log('\n--- ' + sourceName + ' (' + sourceKey + ') ---');

  try {
    // 1. Discover
    const discoverUrl = API_BASE + '/api/discover?sources=' + encodeURIComponent(sourceKey) + '&max=5';
    const discoverRes = await fetch(discoverUrl);
    const discoverData = JSON.parse(discoverRes.data.toString());

    if (!discoverData.success || !discoverData.items || discoverData.items.length === 0) {
      console.log('  X Discovery failed');
      return { source: sourceName, status: 'discover_failed' };
    }
    console.log('  + Discovered ' + discoverData.items.length + ' videos');

    // Try up to 3 videos to find one with a stream
    for (let i = 0; i < Math.min(3, discoverData.items.length); i++) {
      const video = discoverData.items[i];
      if (i === 0) console.log('  Title: "' + (video.title || '').substring(0, 45) + '..."');

      // 2. Scrape
      const scrapeUrl = API_BASE + '/api/scrape?url=' + encodeURIComponent(video.url);
      const scrapeRes = await fetch(scrapeUrl);
      const scrapeData = JSON.parse(scrapeRes.data.toString());

      if (!scrapeData.success) continue;

      const meta = scrapeData.metadata;
      if (meta.restricted) continue;

      if (!meta.m3u8Url && !meta.mp4Url) continue;

      console.log('  + Stream: ' + (meta.m3u8Url ? 'HLS' : 'MP4') + (i > 0 ? ' (video #' + (i+1) + ')' : ''));

      // 3. Audio extraction
      const audioUrl = API_BASE + '/api/audio?url=' + encodeURIComponent(video.url);
      const audioRes = await fetch(audioUrl);
      const contentType = audioRes.headers['content-type'] || '';

      if (contentType.includes('audio') || contentType.includes('octet-stream')) {
        const size = audioRes.data.length;
        console.log('  + AUDIO OK: ' + (size / 1024).toFixed(1) + ' KB');
        return { source: sourceName, status: 'ok', size: size };
      }

      // Check for MP4 response
      const audioData = JSON.parse(audioRes.data.toString());
      if (audioData.streamType === 'mp4') {
        console.log('  + MP4 URL returned for download');
        return { source: sourceName, status: 'ok_mp4' };
      }
    }

    console.log('  ! No video streams in first 3 items (text articles)');
    return { source: sourceName, status: 'no_stream' };

  } catch (e) {
    console.log('  X Error: ' + e.message);
    return { source: sourceName, status: 'error', error: e.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('   ALL SOURCES DOWNLOAD TEST');
  console.log('========================================');

  const results = [];
  for (const src of SOURCES) {
    results.push(await testSource(src));
  }

  console.log('\n========================================');
  console.log('   SUMMARY');
  console.log('========================================\n');

  const ok = results.filter(r => r.status === 'ok' || r.status === 'ok_mp4');
  const restricted = results.filter(r => r.status === 'restricted');
  const noStream = results.filter(r => r.status === 'no_stream');
  const failed = results.filter(r => !['ok','ok_mp4','restricted','no_stream'].includes(r.status));

  console.log('WORKING (' + ok.length + '/' + SOURCES.length + '):');
  ok.forEach(r => console.log('  + ' + r.source + (r.size ? ' (' + (r.size/1024).toFixed(0) + 'KB)' : ' (MP4)')));

  if (noStream.length) {
    console.log('\nNO VIDEO STREAM (' + noStream.length + '):');
    noStream.forEach(r => console.log('  - ' + r.source + ' (text articles only)'));
  }

  if (restricted.length) {
    console.log('\nGEO-RESTRICTED (' + restricted.length + '):');
    restricted.forEach(r => console.log('  - ' + r.source));
  }

  if (failed.length) {
    console.log('\nFAILED (' + failed.length + '):');
    failed.forEach(r => console.log('  X ' + r.source + ': ' + (r.error || r.status)));
  }

  console.log('\n========================================\n');
}

main();
