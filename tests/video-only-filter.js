/**
 * Test: Verify only videos (not text articles) are returned in discovery results
 *
 * This test checks that:
 * 1. Discovered items have video streams (m3u8Url or mp4Url)
 * 2. Text-only articles are filtered out
 * 3. Each source returns playable content
 */

const https = require('https');

const API_BASE = 'https://matushka-api.arwrubel.workers.dev';

// All sources should return video content (via Rutube or native video)
const VIDEO_SOURCES = [
  'smotrim:news',
  '1tv:news',
  'rutube:news',
  'ntv:video',
  'tass:main',
  'kommersant:main',
  'rt:news',    // Now uses Rutube channel
  'ria:main'    // Now uses Rutube channel
];

// No text-only sources - all sources now return video content
const TEXT_SOURCES = [];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function testVideoFiltering() {
  console.log('========================================');
  console.log('   VIDEO-ONLY FILTER TEST');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Check that video sources return items with streams
  console.log('--- Test 1: Video sources should have stream URLs ---\n');

  for (const source of VIDEO_SOURCES) {
    const sourceName = source.split(':')[0].toUpperCase();
    try {
      const discoverUrl = `${API_BASE}/api/discover?sources=${encodeURIComponent(source)}&max=5&nocache=true`;
      const discoverRes = await fetch(discoverUrl);
      const data = JSON.parse(discoverRes.data);

      if (!data.success || !data.items || data.items.length === 0) {
        console.log(`  X ${sourceName}: No items discovered`);
        failed++;
        continue;
      }

      // Check first 3 items for video streams
      let hasVideo = false;
      let checkedCount = 0;

      for (let i = 0; i < Math.min(3, data.items.length); i++) {
        const item = data.items[i];
        checkedCount++;

        // Scrape to check for stream URL
        const scrapeUrl = `${API_BASE}/api/scrape?url=${encodeURIComponent(item.url)}`;
        const scrapeRes = await fetch(scrapeUrl);
        const scrapeData = JSON.parse(scrapeRes.data);

        if (scrapeData.success && scrapeData.metadata) {
          const meta = scrapeData.metadata;
          if (meta.m3u8Url || meta.mp4Url) {
            hasVideo = true;
            console.log(`  + ${sourceName}: Found video stream (item #${i+1})`);
            console.log(`    Title: "${(item.title || '').substring(0, 40)}..."`);
            console.log(`    Stream: ${meta.m3u8Url ? 'HLS' : 'MP4'}`);
            passed++;
            break;
          }
        }
      }

      if (!hasVideo) {
        console.log(`  X ${sourceName}: No video streams in first ${checkedCount} items`);
        failed++;
      }

    } catch (e) {
      console.log(`  X ${sourceName}: Error - ${e.message}`);
      failed++;
    }
  }

  // Test 2: Verify text sources are correctly identified as text-only
  console.log('\n--- Test 2: Text sources should return articles (no streams) ---\n');

  for (const source of TEXT_SOURCES) {
    const sourceName = source.split(':')[0].toUpperCase();
    try {
      const discoverUrl = `${API_BASE}/api/discover?sources=${encodeURIComponent(source)}&max=3`;
      const discoverRes = await fetch(discoverUrl);
      const data = JSON.parse(discoverRes.data);

      if (!data.success || !data.items || data.items.length === 0) {
        console.log(`  ? ${sourceName}: No items (may be expected)`);
        continue;
      }

      // Check if items are text articles (no stream)
      const item = data.items[0];
      const scrapeUrl = `${API_BASE}/api/scrape?url=${encodeURIComponent(item.url)}`;
      const scrapeRes = await fetch(scrapeUrl);
      const scrapeData = JSON.parse(scrapeRes.data);

      if (scrapeData.success && scrapeData.metadata) {
        const meta = scrapeData.metadata;
        if (!meta.m3u8Url && !meta.mp4Url) {
          console.log(`  + ${sourceName}: Correctly returns text articles (no stream)`);
          console.log(`    Title: "${(meta.title || '').substring(0, 40)}..."`);
          passed++;
        } else {
          console.log(`  ! ${sourceName}: Has video stream (unexpected)`);
        }
      }
    } catch (e) {
      console.log(`  ? ${sourceName}: Error - ${e.message}`);
    }
  }

  // Test 3: Check contentType field is set
  console.log('\n--- Test 3: Items should have contentType metadata ---\n');

  const testSource = 'smotrim:news';
  try {
    const discoverUrl = `${API_BASE}/api/discover?sources=${encodeURIComponent(testSource)}&max=5`;
    const discoverRes = await fetch(discoverUrl);
    const data = JSON.parse(discoverRes.data);

    if (data.success && data.items && data.items.length > 0) {
      let hasContentType = 0;
      let hasPedLevel = 0;

      for (const item of data.items) {
        if (item.contentType) hasContentType++;
        if (item.pedagogicalLevel) hasPedLevel++;
      }

      if (hasContentType === data.items.length) {
        console.log(`  + All ${data.items.length} items have contentType`);
        passed++;
      } else {
        console.log(`  X Only ${hasContentType}/${data.items.length} items have contentType`);
        failed++;
      }

      if (hasPedLevel === data.items.length) {
        console.log(`  + All ${data.items.length} items have pedagogicalLevel`);
        passed++;
      } else {
        console.log(`  X Only ${hasPedLevel}/${data.items.length} items have pedagogicalLevel`);
        failed++;
      }

      // Show sample
      const sample = data.items[0];
      console.log(`\n  Sample item metadata:`);
      console.log(`    contentType: ${sample.contentType}`);
      console.log(`    pedagogicalLevel: ${sample.pedagogicalLevel}`);
      console.log(`    category: ${sample.category}`);
    }
  } catch (e) {
    console.log(`  X Error: ${e.message}`);
    failed++;
  }

  // Summary
  console.log('\n========================================');
  console.log('   SUMMARY');
  console.log('========================================\n');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Result: ${failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('\n========================================\n');

  return failed === 0;
}

testVideoFiltering().then(success => {
  process.exit(success ? 0 : 1);
});
