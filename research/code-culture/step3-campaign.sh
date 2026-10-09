#!/bin/bash
# Step 3 campaign (step3-protocolo.md): four conditions, then the transplant of each.
set -e
A="--lineages 10 --generations 20 --size 24 --mutate 0.2"
node research/code-culture/lineages.js --select tournament $A --tag full-tournament
node research/code-culture/lineages.js --select random $A --tag full-random
node research/code-culture/lineages.js --select tournament --blind $A --tag full-blind-tournament
node research/code-culture/lineages.js --select random --blind $A --tag full-blind-random
for t in full-tournament full-random full-blind-tournament full-blind-random; do
  node research/code-culture/transplant.js --run $t --from 5000 --worlds 120
done
