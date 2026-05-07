const fs = require('fs');
const html = fs.readFileSync('fb_scrape.html', 'utf8');

// Facebook often puts raw post data in a script containing RequireStore or something similar
// Let's just find anything containing "creation_time" or "message" or "images"
const data = [];

// Try to extract JSON-like strings from scripts
const scripts = html.match(/<script type="application\/json"(.*?)>(.*?)<\/script>/g);
if (scripts) {
    for (const script of scripts) {
        if (script.includes('"creation_time"') || script.includes('"message"')) {
            data.push(script);
        }
    }
}
fs.writeFileSync('fb_scripts.json', data.join('\n'));
console.log('Saved scripts count:', data.length);
