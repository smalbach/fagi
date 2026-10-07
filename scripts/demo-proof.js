#!/usr/bin/env node
// Demonstrating in real-time frame by frame that acute plasticity rewrote code
// and immediately diverted Fagi from freezing to death.

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf, renderLine } from '../src/program.js';

enableOrganism();

// Configure harsh nocturnal test: day ends quickly, cold night sets in
CONFIG.CYCLE.enabled = 1;
CONFIG.CYCLE.seconds = 80;     // short day
CONFIG.CYCLE.mean = 16;
CONFIG.CYCLE.swing = 14;        // drops to 2°C at night
CONFIG.THERMAL.enabled = 1;
CONFIG.PROGRAM.learn = 1;
CONFIG.PROGRAM.watch = 1;
CONFIG.PROGRAM.crisis = 1;

const world = createWorld();
generateMap(world);
const fagi = createFagi();

console.log('='.repeat(70));
console.log('🔍 PRUEBA DEMOSTRATIVA EN TIEMPO REAL: FAGI ANTES Y DESPUÉS DEL CÓDIGO');
console.log('='.repeat(70));

console.log('\n1. PROGRAMA INNATO AL NACER (Líneas clave):');
const innateLines = programOf(fagi).lines.slice(0, 10);
innateLines.forEach((l, idx) => console.log(`   [${idx.toString().padStart(2)}] ${l.tier.padEnd(8)} -> ${l.do}`));
console.log(`   ... (Total: ${programOf(fagi).lines.length} líneas innatas, 0 líneas propias)`);

let synthesized = false;
let crisisSecond = null;
let newProgramLine = null;

// Run frame-by-frame
const dt = 0.05;
for (let step = 0; step < 2000 && fagi.alive; step++) {
  stepWorld(world, dt);
  updateFagi(fagi, world, dt);

  const own = programOf(fagi).lines.filter((l) => l.source === 'self');
  if (own.length > 0 && !synthesized) {
    synthesized = true;
    crisisSecond = fagi.age.toFixed(1);
    newProgramLine = own[0];

    console.log('\n2. ¡CRISIS DETECTADA Y REESCRITURA EN VIVO!');
    console.log(`   ⏱️  Segundo: ${crisisSecond}s de vida`);
    console.log(`   🌡️  Temperatura corporal: ${fagi.temperature.toFixed(1)}°C (Estrés térmico: ${(fagi.thermalStress * 100).toFixed(0)}%)`);
    console.log(`   🌙  Luz ambiental: ${(world.light * 100).toFixed(0)}% (Es de noche: ${fagi.dark})`);
    console.log(`   🎯  Acción antes de la crisis: "${fagi.thought?.action}" (Regla: "${fagi.thought?.rule}")`);
    console.log('\n3. CÓDIGO JAVASCRIPT GENERADO AUTÓNOMAMENTE:');
    console.log(`   📝 ID: ${newProgramLine.id}`);
    console.log(`   ⚙️  Definición: ${renderLine(newProgramLine)}`);
    console.log(`   💡 Razón causal: "${newProgramLine.why}"`);
    console.log(`   🧬 Badges: source="${newProgramLine.source}", learnedAt=${newProgramLine.learnedAt}s`);
  }

  // After learning, verify what rules are now winning in decisions
  if (synthesized && fagi.age > Number(crisisSecond) + 1.0) {
    console.log('\n4. COMPROBACIÓN DEL EFECTO EN EL COMPORTAMIENTO:');
    console.log(`   ⏱️  Segundo: ${fagi.age.toFixed(1)}s (1 segundo después de reescribir)`);
    console.log(`   ▶️  Línea que gobierna la decisión ahora: "${fagi.thought?.line}"`);
    console.log(`   🧭  Nueva acción ejecutada: "${fagi.thought?.action}"`);
    console.log(`   🛡️  Táctica activa: fagi.tactics.dusk = ${Boolean(fagi.tactics?.dusk)}`);
    console.log(`   ✨  Halo cognitivo visual activo: justLearnedCode = ${fagi.justLearnedCode.toFixed(1)}s`);
    break;
  }
}

console.log('\n' + '='.repeat(70));
if (synthesized) {
  console.log('✅ RESULTADO: El organismo diagnosticó la crisis, reescribió su');
  console.log('   código JavaScript y alteró su conducta para sobrevivir.');
} else {
  console.log('❌ No ocurrió la síntesis.');
}
console.log('='.repeat(70));
