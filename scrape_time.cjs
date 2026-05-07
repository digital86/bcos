const fs = require('fs');
const html = fs.readFileSync('fb_plugin.html', 'utf8');

const matches = [...html.matchAll(/timestamp":(\d+)/gi)];
console.log('timestamps:', matches.map(m=>m[1]));

const dateMatches = [...html.matchAll(/date[^>]*>(.*?)<\/span>/gi)];
console.log('dates:', dateMatches.map(m=>m[1]));
