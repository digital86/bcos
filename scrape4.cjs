const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const regex = /<meta property="og:image" content="(.*?)"/g;
const matches = [...html.matchAll(regex)];

console.log('og:image count:', matches.length);
matches.forEach((m, idx) => console.log(`Image ${idx + 1}: ${m[1]}`));
