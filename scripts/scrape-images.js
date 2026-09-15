// scripts/scrape-images.js
// Downloads photos from the current live site into _stage4-src/scraped/
// Run with: node scripts/scrape-images.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../_stage4-src/scraped');

const IMAGES = [
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/project/1.png', name: 'project-1.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/project/2.png', name: 'project-2.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/project/3.png', name: 'project-3.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/project/4.png', name: 'project-4.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/about3.png', name: 'about3.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/mid.png', name: 'mid.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/before.png', name: 'before.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/after.png', name: 'after.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/mainslider1.png', name: 'mainslider1.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/mainslider2.png', name: 'mainslider2.png' },
  { url: 'https://www.conservatoryconversions.co.uk/assets/images/resources/mainslider3.png', name: 'mainslider3.png' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`${res.statusCode} - ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const img of IMAGES) {
    const dest = path.join(OUTPUT_DIR, img.name);
    try {
      await download(img.url, dest);
      console.log(`✅ ${img.name}`);
    } catch (err) {
      console.error(`❌ ${img.name} — ${err.message}`);
    }
  }
  console.log(`\nDone. Files saved to _stage4-src/scraped/`);
}

run();