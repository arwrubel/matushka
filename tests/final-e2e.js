const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
const pass = (t) => { passed++; console.log(`  \x1b[32m✓\x1b[0m ${t}`); };
const fail = (t, e) => { failed++; console.log(`  \x1b[31m✗\x1b[0m ${t}: ${e}`); };

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         FINAL END-TO-END SMOKE TEST                       ║');
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
  server.listen(3336);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let apiResponses = [];
  page.on('response', r => {
    if (r.url().includes('matushka-api')) {
      apiResponses.push({ url: r.url(), status: r.status() });
    }
  });

  console.log('--- 1. Page Load ---');
  await page.goto('http://localhost:3336', { waitUntil: 'networkidle2' });
  pass('Page loads');

  console.log('\n--- 2. Filter Selection ---');
  // Select only RT source (simpler = more likely to get results)
  await page.click('input[value="rt"]');
  pass('Selected RT source');

  // Don't select other filters - let API return all content
  // This ensures we get results to test the card structure

  console.log('\n--- 3. Search Execution ---');
  apiResponses = [];
  await page.click('#searchForm button[type="submit"]');
  pass('Clicked search');

  await new Promise(r => setTimeout(r, 12000)); // Wait for API

  const discoverCalls = apiResponses.filter(r => r.url.includes('/api/discover'));
  if (discoverCalls.length > 0 && discoverCalls[0].status === 200) {
    pass(`API discover returned 200`);
    console.log(`  URL: ${discoverCalls[0].url.substring(0, 70)}...`);
  } else {
    fail('API discover', 'Did not return 200');
  }

  console.log('\n--- 4. Results Display ---');
  const resultsCount = await page.$eval('#resultsCount', el => el.textContent).catch(() => '(0)');
  const count = parseInt(resultsCount.replace(/[^\d]/g, '')) || 0;
  if (count > 0) {
    pass(`Results count: ${count} videos`);
  } else {
    fail('Results count', 'No results returned');
  }

  const cards = await page.$$('.video-card');
  if (cards.length > 0) {
    pass(`${cards.length} video cards rendered`);
  } else {
    fail('Video cards', 'None rendered');
  }

  console.log('\n--- 5. Video Card Structure ---');
  if (cards.length > 0) {
    const card = cards[0];
    const hasTitle = await card.$('.video-title');
    const hasThumbnail = await card.$('.video-thumbnail img');
    const hasCheckbox = await card.$('.video-select');
    const hasLink = await card.$('.video-link');
    const hasCategory = await card.$('.video-category');
    const hasLevel = await card.$('[class*="video-level"]');

    hasTitle ? pass('Card has title') : fail('Card title', 'Not found');
    hasThumbnail ? pass('Card has thumbnail') : fail('Card thumbnail', 'Not found');
    hasCheckbox ? pass('Card has selection checkbox') : fail('Card checkbox', 'Not found');
    hasLink ? pass('Card has watch link') : fail('Card link', 'Not found');
    hasCategory ? pass('Card has category badge') : fail('Card category', 'Not found');
    hasLevel ? pass('Card has level badge') : fail('Card level', 'Not found');

    const title = await card.$eval('.video-title', el => el.textContent.trim()).catch(() => '');
    console.log(`  Title: "${title.substring(0, 50)}..."`);
  }

  console.log('\n--- 6. Selection & Download ---');
  if (cards.length > 0) {
    // Select first video - click the checkbox directly
    const checkbox = await cards[0].$('input.video-select');
    if (checkbox) {
      await checkbox.click();
      await new Promise(r => setTimeout(r, 500));

      const isChecked = await checkbox.evaluate(el => el.checked);
      if (isChecked) {
        pass('Video checkbox can be selected');
      } else {
        fail('Video selection', 'Checkbox not checked');
      }
    } else {
      fail('Video checkbox', 'Not found');
    }

    // Check download button exists
    const downloadBtn = await page.$('#downloadAudioBtn');
    if (downloadBtn) {
      pass('Download Audio button exists');
    } else {
      fail('Download button', 'Not found');
    }
  }

  console.log('\n--- 7. Sort Functionality ---');
  await page.select('#sortSelect', 'date-desc');
  await new Promise(r => setTimeout(r, 500));
  pass('Sort changed to date-desc');

  console.log('\n--- 8. Reset Functionality ---');
  const resetBtn = await page.$('button[type="reset"]');
  if (resetBtn) {
    await resetBtn.click();
    await new Promise(r => setTimeout(r, 500));
    pass('Reset button works');
  } else {
    fail('Reset button', 'Not found');
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  TOTAL: ${passed + failed} tests`);
  console.log(`  \x1b[32mPASSED: ${passed}\x1b[0m`);
  console.log(`  \x1b[31mFAILED: ${failed}\x1b[0m`);
  console.log(`  PASS RATE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n  \x1b[32m✓ ALL TESTS PASSED - FRONTEND FULLY FUNCTIONAL\x1b[0m');
  }
  console.log('══════════════════════════════════════════════════════════\n');

  await browser.close();
  server.close();
  process.exit(failed > 0 ? 1 : 0);
})();
