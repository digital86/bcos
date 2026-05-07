const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

const regex = /<img [^>]*src="([^"]+)"[^>]*>/gi;
let match;
const images = [];
while ((match = regex.exec(html)) !== null) {
  images.push(match[1]);
}

console.log('Found full images:', images.filter(url => url.includes('scontent')).length);
images.filter(url => url.includes('scontent')).forEach(url => console.log(url.substring(0, 50) + '...'));
