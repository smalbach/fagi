#!/bin/bash
# Step 3b (step3b-protocolo.md): blind, tournament, with the mother's diary; then
# the transplant of generation 9 in this run and in step 3's blind tournament.
set -e
node research/code-culture/lineages.js --select tournament --blind --diary --lineages 10 --generations 20 --until 10 --size 24 --mutate 0.2 --tag diary-blind-tournament
node research/code-culture/transplant.js --run diary-blind-tournament --from 5000 --worlds 120
node research/code-culture/transplant.js --run full-blind-tournament --from 5000 --worlds 120 --gen 9
