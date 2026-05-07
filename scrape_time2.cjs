const fs = require('fs');
const html = fs.readFileSync('fb_plugin.html', 'utf8');

// The plugin html has the time as a readable string somewhere or a unix timestamp
const textObjMatch = html.match(/"publish_time":(\d+)/) || html.match(/"creation_time":(\d+)/);
if (textObjMatch) console.log(textObjMatch[0], new Date(parseInt(textObjMatch[1])*1000).toISOString());
else console.log('no direct creation_time');

// Let's find any 10-digit number that corresponds to roughly recent years in unix time
const ts = [...html.matchAll(/1[6-7]\d{8}/g)];
if (ts) console.log('potential timestamps:', ts.slice(0, 5).map(m => new Date(parseInt(m[0])*1000).toISOString()));
