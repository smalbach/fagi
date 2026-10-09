S=/private/tmp/claude-501/-Users-smalbach-Documents-first-agi/7a477bbb-039f-4f15-a32c-920b574202e5/scratchpad
B="node scripts/batch.js --organism --tyrrell --map-seed 42 --runs 16 --duration 3600 --dt 0.1 --seed 9100 --jobs 16"
SEL="--set SELECT.mode=freeflow+central --set SELECT.consume=4 --set SELECT.veto=1 --set SELECT.sequence=3"
for iv in 8 60 150 300; do
  $B --set TREE.interval=$iv --json $S/harsh-prog-$iv.json 2>&1 | tail -1
  $B --set TREE.interval=$iv $SEL --json $S/harsh-sel-$iv.json 2>&1 | tail -1
done
