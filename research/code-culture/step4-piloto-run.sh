#!/bin/bash
# Step 4 pilot (step4-piloto-protocolo.md): three formats, then the analysis.
set -e
A="--select tournament --rules --start oracle --invert-at 4 --set {\"HEALTH.poison\":200} --families stable,novel --lineages 6 --generations 8 --size 16 --mutate 0.3"
for f in code reasons evidence; do node research/code-culture/lineages.js $A --format $f --tag f-$f; done
node research/code-culture/step4-analyze.js --runs f-code,f-reasons,f-evidence
