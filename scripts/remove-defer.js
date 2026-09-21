const fs   = require('fs');
const path = require('path');

const root  = 'f:/xensenx';
const posts = 'f:/xensenx/posts';

const all = [
  ...fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => path.join(root, f)),
  ...fs.readdirSync(posts).filter(f => f.endsWith('.html')).map(f => path.join(posts, f))
];

let count = 0;
for (const f of all) {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('dict.js')) {
    // Remove defer attribute from the dict.js script tag only
    const updated = c.replace(/(<script src="[^"]*dict\.js") defer/g, '$1');
    if (updated !== c) {
      fs.writeFileSync(f, updated, 'utf8');
      console.log('Removed defer:', path.basename(f));
      count++;
    }
  }
}
console.log('Done —', count, 'files updated');
