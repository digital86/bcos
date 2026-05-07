const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const titleMatch = html.match(/<title>(.*?)<\/title>/);
console.log('Title:', titleMatch ? titleMatch[1] : 'null');

const descMatch = html.match(/<meta name="description" content="(.*?)"/);
if (descMatch) {
    console.log('Desc length:', descMatch[1].length);
    console.log('Desc preview:', descMatch[1].substring(0, 200));
} else {
    console.log('No desc found');
}
