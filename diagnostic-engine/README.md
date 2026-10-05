# Beauty Business Growth Diagnostic — intelligence layer

engine/taxonomy.js       personas, signal levels, status bands, 25 dimensions, ranking weights
engine/questions.js      the 55-question master matrix (structured, with trigger DSL)
engine/interventions.js  intervention ontology + "wouldn't spend money on" catalog
engine/rules.js          31 cross-answer reasoning rules
engine/model.js          economic model (individual + salon leverage layer)
engine/engine.js         routing → signals → derived signals → rules → statuses → top 3
engine/report.js         customer report + admin record
sim/scenarios.js         the 10 validation scenarios with expectations
sim/run.js               runs scenarios, asserts, writes sim/sims.json
sim/validate.js          checks every reference in the matrix resolves
build/export.js          builds dist/beauty-diagnostic-matrix.html and dist/matrix.json

Run:  node sim/validate.js && node sim/run.js && node build/export.js
