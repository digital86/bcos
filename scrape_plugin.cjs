const fs = require('fs');
const html = fs.readFileSync('fb_plugin.html', 'utf8');

const regex = /<img [^>]*src="([^"]+scontent[^"]+)"[^>]*>/gi;
let match;
const images = [];
while ((match = regex.exec(html)) !== null) {
  images.push(match[1]);
}
// Clean up HTML entities in image URLs
const decodedImages = [...new Set(images)].map(url => url.replace(/&amp;/g, '&'));

console.log('Found full images:', decodedImages.length);
decodedImages.forEach((url, idx) => console.log(`Img ${idx}: ${url.substring(0, 80)}...`));

const timeRegex = /<abbr title="([^"]+)"/i;
const timeMatch = timeRegex.exec(html);
console.log('Time match:', timeMatch ? timeMatch[1] : 'null');
