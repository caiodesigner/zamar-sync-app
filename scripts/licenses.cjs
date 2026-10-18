const fs = require('node:fs');
const path = require('node:path');
const lock = JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const rows = Object.entries(lock.packages).filter(([name]) => name).map(([location, p]) => `| ${location.replaceAll('|','\\|')} | ${p.version || '—'} | ${p.license || 'Verificar pacote'} | ${p.dev ? 'Desenvolvimento' : 'Produção'} |`);
fs.writeFileSync('docs/dependencias-e-licencas.md', '# Dependências e licenças\n\nInventário gerado do package-lock.json. Metadados não substituem a conferência dos avisos do artefato. Inclui ferramentas de desenvolvimento.\n\n| Pacote/localização | Versão | Licença declarada | Uso |\n| --- | --- | --- | --- |\n' + rows.join('\n') + '\n');
let notices = 'Zamar Sync — avisos de componentes de terceiros\n\nElectron e Chromium: consulte também LICENSE.electron.txt e LICENSES.chromium.html no pacote.\n\n';
for (const name of ['react','react-dom','scheduler']) {
 const file = path.join('node_modules',name,'LICENSE');
 notices += `\n=== ${name} ===\n` + fs.readFileSync(file,'utf8') + '\n';
}
fs.writeFileSync('THIRD_PARTY_NOTICES.txt', notices.trimEnd() + '\n');
