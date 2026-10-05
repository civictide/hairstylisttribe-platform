const fs = require('fs'), path = require('path');
const bundle = require('./bundle');
const SC = require('../sim/scenarios');
const samples = SC.map((s) => ({ name: s.name, answers: s.answers }));
let html = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
html = html.replace('<script>/*__ENGINE__*/</script>', () => '<script>' + bundle + '</script>').replace('/*__SAMPLES__*/[]', () => JSON.stringify(samples).replace(/</g, '\\u003c'));
fs.writeFileSync(path.join(__dirname, '../dist/beauty-diagnostic.html'), html);
console.log('wrote dist/beauty-diagnostic.html', (html.length / 1024).toFixed(0) + ' KB');
