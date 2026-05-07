const fs = require('fs');
const html = fs.readFileSync('fb_m_scrape.html', 'utf8');

const regex = /https:\/\/scontent[^"']*/g;
const matches = [...new Set(html.match(regex))]; // unique

console.log('Unique scontent urls in m.facebook:', matches.length);
matches.forEach((m, idx) => console.log(`URL ${idx + 1}: ${m}`));
