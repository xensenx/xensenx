const fs   = require('fs');
const path = require('path');

const root  = path.join(__dirname, '..');
const posts = path.join(root, 'posts');

const rootFiles = fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => ({ file: path.join(root, f), src: 'src/js/dict.js' }));
const postFiles = fs.readdirSync(posts).filter(f => f.endsWith('.html')).map(f => ({ file: path.join(posts, f), src: '../src/js/dict.js' }));

let count = 0;
for (const { file, src } of [...rootFiles, ...postFiles]) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('dict.js')) {
    const tag = `  <script src="${src}" defer></script>\n</body>`;
    c = c.replace('</body>', tag);
    fs.writeFileSync(file, c, 'utf8');
    console.log('Injected:', path.relative(root, file));
    count++;
  } else {
    console.log('Already present:', path.relative(root, file));
  }
}
console.log('\nDone —', count, 'files updated.');
