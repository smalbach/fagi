// The local emulator: honors the same contract as a real API, but
// decides on the spot, with no network. It lets us test the whole path (observe →
// decide → apply) without depending on anyone, and it proves the contract
// is enough: everything it uses here comes from observation.js's JSON, no
// privileged access to the real world.

export function createLocalBackend() {
  return {
    name: 'local',
    async decide(observation) {
      const { candidates, needs, nestKnown, pantry } = observation;

      // Hungry and with a stocked pantry at home, better to draw on reserves than
      // risk an uncertain candidate.
      if (needs.hungerU > 0.5 && nestKnown && Object.values(pantry ?? {}).some((n) => n > 0)) {
        return { action: 'pantry', reason: { key: 'reason.api', params: { backend: 'local' } } };
      }

      const utilFn = candidates.filter((c) => c.verdict !== 'avoid');
      const best = utilFn.reduce((a, b) => (!a || b.score > a.score ? b : a), null);
      if (!best) return { action: 'explore', reason: { key: 'reason.api', params: { backend: 'local' } } };

      return {
        action: best.kind === 'water' ? 'seekWater' : (best.via === 'smell' ? 'track' : 'seekFood'),
        targetId: best.id,
        reason: { key: 'reason.api', params: { backend: 'local' } },
      };
    },
  };
}
