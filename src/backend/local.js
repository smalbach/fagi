// El emulador local: cumple el mismo contrato que una API de verdad, pero
// decide en el sitio, sin red. Sirve para probar el camino entero (observar →
// decidir → aplicar) sin depender de nadie, y es la prueba de que el contrato
// es suficiente: todo lo que usa aquí sale del JSON de observation.js, nada
// de acceso privilegiado al mundo real.

export function createLocalBackend() {
  return {
    name: 'local',
    async decide(observation) {
      const { candidates, needs, nestKnown, pantry } = observation;

      // Con hambre y despensa hecha en casa, mejor tirar de reservas que
      // arriesgarse a un candidato incierto.
      if (needs.hungerU > 0.5 && nestKnown && Object.values(pantry ?? {}).some((n) => n > 0)) {
        return { action: 'pantry', reason: { key: 'reason.api', params: { backend: 'local' } } };
      }

      const util = candidates.filter((c) => c.verdict !== 'avoid');
      const mejor = util.reduce((a, b) => (!a || b.score > a.score ? b : a), null);
      if (!mejor) return { action: 'explore', reason: { key: 'reason.api', params: { backend: 'local' } } };

      return {
        action: mejor.kind === 'water' ? 'seekWater' : (mejor.via === 'olfato' ? 'track' : 'seekFood'),
        targetId: mejor.id,
        reason: { key: 'reason.api', params: { backend: 'local' } },
      };
    },
  };
}
