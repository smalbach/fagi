// Phylogenetic Code Tree: Tracks the evolutionary lineage of self-rewritten code.
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md, Phase 5)
//
// Records every programmatic mutation (synthesized lines, macro chains, night dreams)
// across generations and provides structured export as JSON and Mermaid diagrams
// for scientific reporting and visual analysis.

export function createPhylogeny() {
  return {
    nodes: new Map(), // ruleId -> { id, who, generation, time, source, from, over, chain, why, parentId }
    events: [],
    lineages: new Map(), // fagiId -> [ruleIds]
  };
}

export function phylogenyOf(world) {
  return (world.codePhylogeny ??= createPhylogeny());
}

// Record a program mutation event
export function noteCodeMutation(world, fagi, news) {
  if (!world || !news?.id) return;
  const phy = phylogenyOf(world);
  const gen = fagi.generation ?? 0;
  const time = Math.round((world.time ?? fagi.age ?? 0) * 10) / 10;

  // Find if this specializes a previous rule by looking for prefix/from match
  let parentId = null;
  if (news.from) {
    for (const [id, node] of phy.nodes.entries()) {
      if (node.from === news.from && id !== news.id && news.id.startsWith(node.from)) {
        parentId = id;
      }
    }
  }

  const node = {
    id: news.id,
    who: fagi.id ?? 1,
    generation: gen,
    time,
    source: news.source ?? 'self',
    from: news.from ?? null,
    over: news.over ?? null,
    chain: news.chain ?? null,
    why: news.why ?? '',
    parentId,
  };

  phy.nodes.set(news.id, node);
  phy.events.push(node);

  const entityLineage = phy.lineages.get(fagi.id) ?? [];
  entityLineage.push(news.id);
  phy.lineages.set(fagi.id, entityLineage);
}

// Generates an exportable Mermaid Diagram representing the code phylogeny
export function renderPhylogenyMermaid(world) {
  const phy = phylogenyOf(world);
  if (!phy.nodes.size) {
    return 'graph TD\n  Root["Innate Primordial Program (0 mutations)"]';
  }

  const lines = ['graph TD', '  Root["Innate Primordial Program"]'];
  const seenConnections = new Set();

  for (const [id, node] of phy.nodes.entries()) {
    const safeId = id.replace(/[^A-Za-z0-9_]/g, '_');
    const sourceBadge = node.source === 'night' ? '🌙 NIGHT' : node.source === 'told' ? '👥 TOLD' : '🧠 SELF';
    const chainNote = node.chain ? ` [macro: ${node.chain.join(' → ')}]` : '';
    const label = `"${safeId}<br/><b>${sourceBadge}</b> Gen ${node.generation} @ ${node.time}s<br/>${chainNote}"`;
    lines.push(`  ${safeId}[${label}]`);

    if (node.parentId) {
      const parentSafeId = node.parentId.replace(/[^A-Za-z0-9_]/g, '_');
      const conn = `${parentSafeId} --> ${safeId}`;
      if (!seenConnections.has(conn)) {
        seenConnections.add(conn);
        lines.push(`  ${conn}`);
      }
    } else {
      const conn = `Root --> ${safeId}`;
      if (!seenConnections.has(conn)) {
        seenConnections.add(conn);
        lines.push(`  ${conn}`);
      }
    }
  }

  return lines.join('\n');
}

// Summary metrics for scientific reporting
export function summarizePhylogeny(world) {
  const phy = phylogenyOf(world);
  const totalInnovations = phy.nodes.size;
  const bySource = { self: 0, night: 0, told: 0 };
  const byGen = {};

  for (const node of phy.nodes.values()) {
    bySource[node.source] = (bySource[node.source] ?? 0) + 1;
    byGen[node.generation] = (byGen[node.generation] ?? 0) + 1;
  }

  return {
    totalInnovations,
    bySource,
    byGeneration: byGen,
    eventsCount: phy.events.length,
    activeEntitiesWithCode: phy.lineages.size,
  };
}

// Exports the complete phylogeny tree as formatted JSON string
export function exportPhylogenyJson(world) {
  const phy = phylogenyOf(world);
  return JSON.stringify({
    summary: summarizePhylogeny(world),
    events: phy.events,
    nodes: Object.fromEntries(phy.nodes),
    lineages: Object.fromEntries(phy.lineages),
  }, null, 2);
}
