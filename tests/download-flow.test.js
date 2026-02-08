const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         FULL DOWNLOAD FLOW TEST                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Start server
  const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', 'docs', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(404); res.end('Not found'); }
      else { res.writeHead(200, {'Content-Type': types[ext] || 'text/plain'}); res.end(content); }
    });
  });
  server.listen(3337);
  console.log('✓ Server started\n');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Track all API calls
  const apiCalls = [];
  page.on('response', async r => {
    const url = r.url();
    if (url.includes('matushka-api')) {
      const info = { url: url.substring(0, 80), status: r.status() };
      if (url.includes('/api/audio')) {
        const headers = r.headers();
        info.contentType = headers['content-type'];
        info.contentLength = headers['content-length'];
      }
      apiCalls.push(info);
    }
  });

  console.log('--- Step 1: Load page and search ---');
  await page.goto('http://localhost:3337', { waitUntil: 'networkidle2' });
  console.log('✓ Page loaded');

  // Select RT (reliable source that returns results)
  await page.click('input[value="rt"]');
  console.log('✓ Selected RT source');

  // Search
  await page.click('#searchForm button[type="submit"]');
  console.log('✓ Clicked search');
  await new Promise(r => setTimeout(r, 12000));

  // Check results
  const count = await page.$eval('#resultsCount', el => el.textContent).catch(() => '(0)');
  console.log(`✓ Results: ${count}`);

  const cards = await page.$$('.video-card');
  if (cards.length === 0) {
    console.log('✗ No video cards found');
    await browser.close();
    server.close();
    process.exit(1);
  }
  console.log(`✓ ${cards.length} video cards displayed\n`);

  console.log('--- Step 2: Select videos for download ---');
  // Select first 2 videos
  const checkboxes = await page.$$('.video-select');
  if (checkboxes.length >= 2) {
    await checkboxes[0].click();
    await new Promise(r => setTimeout(r, 200));
    await checkboxes[1].click();
    await new Promise(r => setTimeout(r, 200));
    console.log('✓ Selected 2 videos');
  } else if (checkboxes.length >= 1) {
    await checkboxes[0].click();
    console.log('✓ Selected 1 video');
  }

  // Check selection count
  const selectionInfo = await page.$('#selectionInfo');
  const isHidden = await selectionInfo?.evaluate(el => el.hidden);
  if (!isHidden) {
    const selCount = await page.$eval('#selectionCount', el => el.textContent);
    console.log(`✓ Selection info shows: ${selCount} selected`);
  }

  console.log('\n--- Step 3: Test Download Audio button ---');
  const downloadBtn = await page.$('#downloadAudioBtn');
  if (downloadBtn) {
    console.log('✓ Download Audio button found');

    // Get button text/state
    const btnText = await downloadBtn.evaluate(el => el.textContent.trim());
    const isDisabled = await downloadBtn.evaluate(el => el.disabled);
    console.log(`  Button text: "${btnText}"`);
    console.log(`  Button disabled: ${isDisabled}`);

    // Clear API calls before clicking download
    apiCalls.length = 0;

    // Click download and wait
    console.log('\n  Clicking Download Audio...');
    await downloadBtn.click();
    await new Promise(r => setTimeout(r, 15000)); // Wait for audio extraction

    // Check what API calls were made
    console.log('\n--- Step 4: Check audio API calls ---');
    const audioCalls = apiCalls.filter(c => c.url.includes('/api/audio'));
    const scrapeCalls = apiCalls.filter(c => c.url.includes('/api/scrape'));

    console.log(`  Scrape API calls: ${scrapeCalls.length}`);
    console.log(`  Audio API calls: ${audioCalls.length}`);

    if (audioCalls.length > 0) {
      for (const call of audioCalls) {
        console.log(`\n  Audio call:`);
        console.log(`    Status: ${call.status}`);
        console.log(`    Content-Type: ${call.contentType || 'N/A'}`);
        console.log(`    Content-Length: ${call.contentLength || 'N/A'}`);

        if (call.status === 200 && call.contentType?.includes('audio')) {
          console.log(`    \x1b[32m✓ AUDIO DOWNLOAD SUCCESSFUL\x1b[0m`);
        } else if (call.status === 200) {
          console.log(`    ⚠ Response OK but may not be audio`);
        } else {
          console.log(`    \x1b[31m✗ Audio download failed\x1b[0m`);
        }
      }
    } else {
      console.log('  ⚠ No audio API calls detected');
      console.log('  (Download may use different mechanism or require more time)');
    }
  } else {
    console.log('✗ Download Audio button not found');
  }

  // Check for any error messages
  console.log('\n--- Step 5: Check for errors ---');
  const errorContainer = await page.$('#errorContainer');
  const errorHidden = await errorContainer?.evaluate(el => el.hidden);
  if (!errorHidden) {
    const errorText = await errorContainer.evaluate(el => el.textContent);
    console.log(`  Error shown: ${errorText}`);
  } else {
    console.log('  ✓ No errors displayed');
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('══════════════════════════════════════════════════════════\n');

  await browser.close();
  server.close();
})();
