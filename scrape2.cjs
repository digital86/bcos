const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const regex = /.{0,50}"message":.{0,200}/gi;
const matches = [...html.matchAll(regex)];

fs.writeFileSync('fb_scripts.json', matches.map(m => m[0]).join('\n\n---\n\n'));
console.log('Saved matches count:', matches.length);
