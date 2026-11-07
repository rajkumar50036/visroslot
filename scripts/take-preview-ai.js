const puppeteer = require('puppeteer');

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to https://visroslot.netlify.app...');
  await page.goto('https://visroslot.netlify.app', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/preview_landing_updated.png' });
  console.log('Saved preview_landing_updated.png');
  
  // Also click the AI help button to test opened small box
  const aiButton = await page.$('button[aria-label="Open AI Help Chat"]');
  if (aiButton) {
    await aiButton.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/preview_ai_box_small.png' });
    console.log('Saved preview_ai_box_small.png');
  }

  await browser.close();
}

capture().catch(err => console.error(err));
