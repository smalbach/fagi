#!/bin/bash
# Step 3c (step3c-protocolo.md): with and without the mother's diary, then the analysis.
set -e
A="--select tournament --rules --start caution --set {\"HEALTH.poison\":200} --families stable,novel --lineages 10 --generations 10 --size 24 --mutate 0.2"
node research/code-culture/lineages.js $A --diary --tag rule-diary
node research/code-culture/lineages.js $A --tag rule-nodiary
node research/code-culture/step3c-analyze.js --runs rule-diary,rule-nodiary --worlds 60
