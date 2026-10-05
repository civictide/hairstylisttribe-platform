// Bundles the CommonJS engine into one browser script exposing window.BD = { engine, report }.
const fs = require('fs');
const path = require('path');
const mods = ['taxonomy', 'questions', 'interventions', 'rules', 'model', 'engine', 'report'];
let out = '(function(){var __m={},__c={};function require(n){n=n.replace("./","");if(__c[n])return __c[n].exports;var mod={exports:{}};__c[n]=mod;__m[n](mod,mod.exports,require);return mod.exports;}\n';
for (const m of mods) out += `__m[${JSON.stringify(m)}]=function(module,exports,require){\n${fs.readFileSync(path.join(__dirname, '../engine', m + '.js'), 'utf8')}\n};\n`;
out += 'window.BD={engine:require("engine"),report:require("report"),taxonomy:require("taxonomy")};})();';
module.exports = out;
if (require.main === module) { fs.writeFileSync(path.join(__dirname, '../dist/engine.bundle.js'), out); console.log('bundle', out.length); }
