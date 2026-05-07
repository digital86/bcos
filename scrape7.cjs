const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const regex = /<meta property="[^"]*time[^"]*" content="(.*?)"/gi;
const matches = [...new Set(html.match(regex))]; // unique

console.log('Unique time tags:', matches.length);
matches.forEach((m, idx) => console.log(`Time tag ${idx + 1}: ${m}`));

const scriptRegex = /"creation_time":(\d+)/gi;
const smatches = [...new Set(html.match(scriptRegex))];
console.log('Script times:', smatches);
