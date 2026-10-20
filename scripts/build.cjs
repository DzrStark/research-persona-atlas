const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = ['index.html', 'portraits.html'];
const scripts = [...new Set(pages.flatMap(page => [...fs.readFileSync(path.join(root, page), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(match => match[1])))];
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const file of [...pages, 'styles.css', ...scripts]) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Static production files copied to dist; all asset paths are relative.');
