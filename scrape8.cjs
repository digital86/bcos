const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const regex = /<meta [^>]*content="[^"]*"[^>]*>/gi;
const matches = [...new Set(html.match(regex))]; // unique

console.log('All meta tags:');
matches.forEach((m, idx) => console.log(m));
