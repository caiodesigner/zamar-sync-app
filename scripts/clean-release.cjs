// Remove only known artifacts of older versions, after verifying all current packages.
// User data and unpacked packages of the current build are deliberately preserved.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { version } = require('../package.json');
const directory = path.resolve(__dirname, '../release');
const current = [
 `zamar-sync-${version}-win-x64.zip`,
 `zamar-sync-${version}-linux-x86_64.AppImage`,
 `zamar-sync-${version}-linux-x64.tar.gz`
];
for (const name of current) {
 const file = path.join(directory,name);
 const expected = fs.readFileSync(`${file}.sha256`,'utf8').trim().split(/\s+/)[0];
 const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if (expected !== actual) throw new Error(`Integridade inválida: ${name}. Nenhuma versão será removida.`);
}
const removed = [];
for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
 const match = entry.name.match(/^zamar-sync-(\d+\.\d+\.\d+)-(?:linux|win)-.+\.(?:zip|AppImage|tar\.gz)(?:\.sha256)?$/);
 if (entry.isFile() && match && match[1] !== version) {
  fs.unlinkSync(path.join(directory,entry.name)); removed.push(entry.name);
 }
}
console.log(JSON.stringify({version,removed,preserved:'data, current unpacked packages and current artifacts'},null,2));
