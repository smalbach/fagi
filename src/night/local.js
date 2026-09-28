// The local night mind: no network, no model, deterministic. It honors the
// same contract as a real one (night/index.js) using only the input it is
// given, which proves the input is enough and lets batch and the tests run the
// whole path. It is deliberately modest:
//
//   - doubting each rule about traits that some fruit she tasted went against;
//   - a pair of traits every harmful fruit she tasted with both of them shares
//     (a conjunction the one-trait hypotheses of the night report cannot say),
//     replacing her one-trait rules on either trait that a good fruit went against;
//   - each of the report's questions about a fruit, as an explore proposal;
//   - each confident one-trait hypothesis of the report, as a rule.
// Nothing she already holds is proposed again.
//
// Whatever it proposes still has to pass the gate like any model's.

export function createLocalNight() {
  return {
    name: 'local',
    propose(input) {
      const proposals = [];
      const add = (p) => { if (proposals.length < input.allowed.proposals) proposals.push(p); };
      // What she already holds, to not propose it again.
      const holds = (all, verdict) => input.rules.some((r) => r.verdict === verdict && r.when.all
        && r.when.all.length === all.length && all.every((c) => r.when.all.includes(c)));

      // Her rules about traits that some fruit she tasted went against.
      for (const r of input.rules) {
        if (!r.when.all) continue;
        const covered = input.tasted.filter((k) => r.when.all.every((c) => k.traits.includes(c)) && !(r.except ?? []).includes(k.look));
        if (covered.some((k) => (r.verdict === 'avoid' ? k.felt > 0 : k.felt < 0))) add({ type: 'doubt', rule: r.id, why: 'a fruit she tasted went against it' });
      }

      // Pairs of traits shared by two or more harmful fruit and by no good one.
      const bad = input.tasted.filter((k) => k.felt < 0);
      const good = input.tasted.filter((k) => k.felt > 0);
      const pairs = new Map();
      for (const k of bad) {
        for (let i = 0; i < k.traits.length; i++) {
          for (let j = i + 1; j < k.traits.length; j++) {
            const id = [k.traits[i], k.traits[j]].sort().join('|');
            pairs.set(id, (pairs.get(id) ?? 0) + 1);
          }
        }
      }
      for (const [id, n] of [...pairs].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) {
        const all = id.split('|');
        if (n < 2 || good.some((k) => all.every((c) => k.traits.includes(c))) || holds(all, 'avoid')) continue;
        // Her one-trait 'avoid' rules on either trait that a good fruit went
        // against: the pair would replace them.
        const replaces = input.rules.filter((r) => r.verdict === 'avoid' && r.when.all?.length === 1 && all.includes(r.when.all[0])
          && good.some((k) => k.traits.includes(r.when.all[0]))).map((r) => r.id);
        add({ type: 'rule', when: { all }, verdict: 'avoid', why: `${n} fruit with both harmed her`, ...(replaces.length ? { replaces } : {}) });
      }

      for (const q of input.report.questions) {
        if (q.kind === 'taste' && input.seen.some((s) => s.look === q.key)) add({ type: 'explore', look: q.key });
      }

      for (const h of input.report.hypotheses) {
        const verdict = h.predict === 'harm' ? 'avoid' : 'prefer';
        if (h.confidence < 0.6 || h.exceptions > 0 || holds(h.when, verdict)) continue;
        add({ type: 'rule', when: { all: h.when }, verdict, why: 'the night report' });
      }
      return { proposals };
    },
  };
}
