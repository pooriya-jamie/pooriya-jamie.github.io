/* Run with node --test bin/tests/public-goods-arena.test.cjs and an installed Playwright Chromium. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { text } = require('node:stream/consumers');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const entry = pathToFileURL(path.resolve(__dirname, '../../public-goods-demo/index.html')).href;
test('Cascade Arena replays the saved session offline in Chromium', { skip: !chromium && 'Playwright is optional. Install it and Chromium to run.' }, async (t) => {
  // An existing local Chromium installation can also be used via this optional override.
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('websocket', (socket) => failures.push('Unexpected WebSocket: ' + socket.url()));
  page.on('requestfailed', (request) => failures.push(request.url()));
  await page.route(/^https?:/, (route) => {
    failures.push('External request: ' + route.request().url());
    return route.abort();
  });
  await page.goto(entry);
  const read = (id) => page.locator('#' + id).innerText();
  await page.locator('#tl-1-1').waitFor();

  await t.test('seeking backward and forward rebuilds the totals, leader, feed, and scatterplot', async () => {
    assert.equal(Number(await read('stPool')), 206);
    assert.equal(await read('stDecided'), '24/24');
    assert.match(await read('feedCount'), /\b24\b/);
    await page.locator('#tl-1-6').click();
    assert.equal(Number(await read('stPool')), 181);
    assert.match(await read('stLeader'), /A21.*186/);
    assert.match(await read('feedCount'), /\b144\b/);
    assert.match(await read('scatterSub'), /\b120\b/);
    const end = await Promise.all(['stPool', 'stLeader', 'feedCount', 'scatterSub'].map(read));
    await page.locator('#tl-1-1').click();
    assert.equal(Number(await read('stPool')), 206);
    assert.match(await read('feedCount'), /\b24\b/);
    await page.locator('#next-round').click();
    assert.equal(Number(await read('stPool')), 209);
    await page.locator('#tl-1-6').click();
    assert.deepEqual(await Promise.all(['stPool', 'stLeader', 'feedCount', 'scatterSub'].map(read)), end);
  });

  await t.test('pinned-agent payoff edits leave the recorded session download intact', async () => {
    await page.locator('#tl-1-1').click();
    await page.locator('#agent-select').selectOption('0');
    await page.locator('#payoff-lab summary').click();
    assert.match(await read('whatif-agent'), /A00/);
    const slider = page.locator('#contribution-slider');
    const recorded = Number(await slider.inputValue());
    const originalPayoff = Number(await read('whatif-payoff'));
    const hypothetical = recorded === 0 ? 20 : 0;
    await slider.focus();
    await slider.press(hypothetical === 0 ? 'Home' : 'End');
    assert.equal(Number(await slider.inputValue()), hypothetical);
    assert.ok(Math.abs(Number(await read('whatif-payoff')) - (originalPayoff - 0.6 * (hypothetical - recorded))) < 1e-7);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#download-record').click();
    const download = await downloadEvent;
    const exported = JSON.parse(await text(await download.createReadStream()));
    const choice = exported.rounds[0].decisions.find((d) => d.agentId === 0);
    assert.equal(choice.contribution, recorded);
    assert.equal(choice.payoff, originalPayoff);
    assert.equal(exported.rounds.flatMap((round) => round.decisions).length, 144);
    assert.deepEqual(Object.keys(choice).sort(), ['agentId', 'contribution', 'payoff']);
  });

  assert.deepEqual(failures, [], 'The static replay should load entirely from local files without browser errors.');
});
