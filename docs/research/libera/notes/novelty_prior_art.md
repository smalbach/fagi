# Prior art and novelty assessment for the Fagi method (organs, drives, learned releasers, free-flow selection, sleep-generated experiments)

Method note: The primary PDFs (Sussex CSRP 434 tech report of Creatures, Wikipedia, Creatures Wiki/fandom, alanzucconi.com) were blocked by the network egress proxy, so Creatures details below come from search-result excerpts of those pages, not a full read. Every claim has a URL; claims I could not confirm are listed under Gaps. "Not found" means not found in the sources searched (about 25 web searches). It does not mean the thing does not exist.

## Q1. Creatures (Grand & Cliff) is the closest prior art: what did it have, and what did it lack?

### Takeaway
Creatures (1996–2001) already combined almost every high-level ingredient Fagi lists. It had simulated biochemistry with organs (from Creatures 2), chemoreceptors and emitters, hormones, drives whose rise is punishment and whose fall is reward (interoceptive drive-reduction reinforcement), a lifelong-learning neural network brain, genetics and mutation with breeding, and sleep during which the brain is trained offline. The main differences: Creatures' sleep rehearses innate genetic "instincts" (pre-specified good responses). It does not generate new questions to test the next day. Its brain is a sub-symbolic neural net, not readable self-written rules. Its decision lobe picks the highest-firing neuron, which is winner-take-all.

### Cited Findings
- Citation verified: Grand, S. & Cliff, D. (1998) "Creatures: Entertainment software agents with artificial life", Autonomous Agents and Multi-Agent Systems 1(1): 39–57. — [Springer Professional](https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520); [dblp](https://dblp.uni-trier.de/pid/84/3426.html)
- Abstract (as excerpted): each creature has "a neural network responsible for sensory-motor coordination and behavior selection, and an 'artificial biochemistry' that models a simple energy metabolism along with a 'hormonal' system that interacts with the neural network to model diffuse modulation of neuronal activity and staged ontogenetic development." — [Springer Professional](https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520); tech report version [Sussex CSRP 434](https://www.sussex.ac.uk/informatics/cogslib/reports/csrp/csrp434.pdf) (not readable here, egress blocked)
- Lifetime learning includes learning a simple verb-object language; creatures respond to positive and negative reinforcement. — [Wikipedia: Creatures series](https://en.wikipedia.org/wiki/Creatures_(video_game_series)) (search excerpt)
- Drives: "Norns possess simulated biological drives which give punishment when they are raised, and reward when they are lowered." Recently active connections get higher "susceptibility" and are most affected by reward and punishment. This is drive-reduction reinforcement through chemicals. — [Alan Zucconi, "The AI of Creatures"](https://www.alanzucconi.com/2020/07/27/the-ai-of-creatures/) and [Creatures Wiki: Instinct](https://creatures.fandom.com/wiki/Instinct) (search excerpts)
- Sleep: "Instincts are predefined 'good' responses to stimuli, contained in their genome, that are automatically learnt by creatures while they sleep… it is as if their mind is detached from their body and run through a series of scenarios to train their brain — effectively, they dream." — [Creatures Wiki: Instinct](https://creatures.fandom.com/wiki/Instinct) (search excerpt)
- In Creatures 2, an imbalance between reward and punishment in the genome meant many norns could not sleep properly. They therefore "did not get trained by instincts to do vital things like eat and sleep". This shows how much the system depended on innate, genome-specified instincts. — [Creatures Wiki: Instinct](https://creatures.fandom.com/wiki/Instinct) / [alt.games.creatures "The Problem With Norns"](https://groups.google.com/g/alt.games.creatures/c/RGqQ5gdPPG4/m/Cy3VNFXIbisJ) (search excerpts)
- Organs were introduced in Creatures 2 (heart, lungs and others). Each organ hosts chemical reactions (for example, sweating in the skin organ), has a "life force" (health) and a "clock rate" (reaction speed). — [Creatures Wiki: Organ](https://creatures.fandom.com/wiki/Organ) (search excerpt)
- The brain is organised in lobes (perception, concept, decision, verb). The verb lobe reports "the highest-firing neuron in the decision lobe", which implies winner-take-all selection of the action. — [Creatures Wiki: Verb lobe](https://creatures.fandom.com/wiki/Verb_lobe); [Creatures Wiki: Concept lobe](https://creatures.fandom.com/wiki/Concept_lobe); [creatures.wiki Decision lobe](https://creatures.wiki/Decision_lobe) (search excerpts)
- Creatures have unique genomes that are inherited and mutate; norns breed and pass on physical, biochemical and behavioural traits. — [Wikipedia: Creatures series](https://en.wikipedia.org/wiki/Creatures_(video_game_series)); [Creatures Wiki: Instinct](https://creatures.fandom.com/wiki/Instinct)
- Grand's later work: Grandroids (Kickstarter 2011) and Phantasia aimed at creatures built from "virtual neurons, enzymes, receptors, and genes", with Grand claiming a route to "some form of imagination". — [MIT Technology Review 2014](https://www.technologyreview.com/2014/09/18/171315/a-grand-quest-to-create-virtual-life/); [phantasia.life/about](https://phantasia.life/about)

### Inferences
- Reviewers will say that "an organism with organs, chemistry, drives, reward from drive change, genes, breeding and sleep" is Creatures. Fagi cannot claim novelty for any of these on its own, or for their bundle at the level of a slogan.
- Fagi's "learn from interoceptive reward = body-state delta" is essentially Creatures' drive-reduction reward (and Keramati & Gutkin's HRRL, see Q2). It is not novel.
- Differences that look real (based on the excerpts):
  - (a) Creatures ships innate instincts in the genome, rehearsed in sleep. Fagi claims no innate releasers.
  - (b) Creatures' sleep rehearses fixed scenarios. Fagi's sleep proposes new questions that become next-day experiments, filtered by experience.
  - (c) Creatures uses winner-take-all at the decision lobe. Fagi uses free-flow selection.
  - (d) Creatures has no readable symbolic rule output.
  - (e) Organs in Creatures are reaction sites in a shared chemical bath, not sensor/reflex modules that talk to a brain over latent, noisy nerves. This last point needs checking against the primary paper.

### Gaps
- Could not read the primary paper or tech report (egress blocked). I could not confirm the exact list of chemoreceptors/emitters, whether organs carry local reflexes, or whether the "concept lobe" does concept formation for uncategorised objects (this may overlap with Fagi item 5).
- Grand, Cliff & Malhotra (1997) Autonomous Agents '97 was not directly verified in this pass. It is likely the conference version, but this is unconfirmed.
- Grand's "Lucy" robot was not researched (no tool budget left).

## Q2. Closest prior art for each other component

### Takeaway
Each Fagi component has clear precedents:
- homeostatic or drive-based reward: Keramati & Gutkin 2014, Yoshida et al. 2024, Cañamero, PSI/MicroPsi
- Lorenz-style releasers and drives in synthetic creatures: Blumberg 1994
- learning which stimuli matter: Blumberg et al. 2002
- free-flow hierarchies: Rosenblatt & Payton; Tyrrell 1993
- embodied body-plus-nervous-system simulation: Tu & Terzopoulos 1994, NeuroMechFly, BAAIWorm, Vaxenburg 2025
- evolving ecologies with Hebbian brains: Polyworld
- readable rule learners in animats: Wilson ZCS
- wake-sleep or offline consolidation: DreamCoder, Tadros 2022, Dyna
- daily reflection and planning in agents: Generative Agents
- self-written code skills: Voyager

### Cited Findings
**Homeostatic or interoceptive reward**
- Keramati, M. & Gutkin, B. (2014) "Homeostatic reinforcement learning for integrating reward collection and physiological stability", eLife 3:e04811 (doi 10.7554/eLife.04811). Reward is defined as reduction of drive (distance from the internal setpoint), and the paper proves reward-seeking is equivalent to physiological stability. — [eLife](https://elifesciences.org/articles/04811); [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4270100)
- Yoshida, N. et al. (2024) "Emergence of integrated behaviors through direct optimization for homeostasis", Neural Networks 177:106379. Deep RL on a real robot optimises homeostasis directly and yields integrated behaviours from motor-level control, described as "the world's first real robot system to achieve the emergence of integrated behaviors based solely on the principle of homeostasis". — [search excerpt / related arXiv 2507.04998](https://arxiv.org/pdf/2507.04998); [Yoshida 2021 NeurIPS-W "Embodiment perspective of reward definition"](https://mlanthology.org/neuripsw/2021/yoshida2021neuripsw-embodiment); [dblp](https://dblp.org/pid/142/3129)
- Man, K. & Damasio, A. (2019) "Homeostasis and soft robotics in the design of feeling machines", Nature Machine Intelligence 1: 446–452. This is a proposal or perspective paper, not an implemented creature. NOTE: the brief lists "Man, Damasio & Neven". The sources found name only Kingson Man and Antonio Damasio, so the citation as given should be checked before use. — [TechXplore 2019](https://techxplore.com/news/2019-11-ai-chapter-machines.html); [Science News](https://www.sciencenews.org/?p=958214)
- Lewis, M. & Cañamero, L. (2016) "Hedonic quality or reward? A study of basic pleasure in homeostasis and decision making of a motivated autonomous robot", Adaptive Behavior 24(5): 267–291. The robot has homeostatic variables and pleasure modulating action selection. Follow-up: Lones, Lewis & Cañamero (2018), a hormone-driven epigenetic mechanism (receptor regulation). — [UH repository](https://uhra.herts.ac.uk/id/eprint/5545/); [UH 2018](https://uhra.herts.ac.uk/id/eprint/6680/)
- Lowe, R. & Ziemke, T. (2011) "The feeling of action tendencies: on the emotional regulation of goal-directed behavior", Frontiers in Psychology 2:346 (doi 10.3389/fpsyg.2011.00346). This is theoretical: feelings are framed as predictions of action tendency within prediction–feedback loops. — [Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2011.00346/full)
- Bach, J. (2009) Principles of Synthetic Intelligence. PSI: An Architecture of Motivated Cognition, Oxford UP. It covers physiological, social and cognitive (uncertainty reduction, competence) drives based on Dörner's PSI theory, implemented as MicroPsi, with neuro-symbolic representations. — [OUP](https://academic.oup.com/book/1947)

**Ethological drives, releasers and their learning**
- Blumberg, B. (1994) "Action-selection in Hamsterdam: Lessons from ethology", SAB'94 (From Animals to Animats 3), MIT Press, pp. 108–117. It uses ethology-inspired, Lorenz-style releasing mechanisms and motivations. — [cited in arXiv cs/0211040](https://arxiv.org/pdf/cs/0211040)
- Blumberg, B., Downie, M., Ivanov, Y., Berlin, M., Johnson, M.P., Tomlinson, B. (2002) "Integrated learning for interactive synthetic characters", SIGGRAPH 2002. This is real-time RL for synthetic creatures informed by animal training. The creature learns which stimuli (including clicker or trainer cues) predict reward, which partly overlaps with "learned releasers". — [SIGGRAPH history](https://history.siggraph.org/?p=118428); [MIT Synthetic Characters publications](https://characters.media.mit.edu/publications.html)
- Gershenson's model for combining external and internal stimuli in action selection discusses Lorenz's psycho-hydraulic model. — [arXiv cs/0211040](https://arxiv.org/pdf/cs/0211040)

**Free-flow action selection**
- Tyrrell, T. (1993) PhD thesis "Computational Mechanisms for Action Selection", Univ. of Edinburgh. It extends Rosenblatt & Payton into a "free-flow hierarchy" and shows it outperforming winner-take-all and Maes's network in a simulated animal environment. Also Tyrrell (1993) "The use of hierarchies for action selection", Adaptive Behavior 1(4): 387–419. — [Edinburgh Research Archive](https://era.ed.ac.uk/handle/1842/20257); [Bryson's critique "hierarchy and sequence vs full parallelism"](https://www.joannajbryson.org/s/hierarchy-and-sequence-vs-full-parallelism-in-action-selection.pdf)

**Embodied body and nervous-system simulations**
- Tu, X. & Terzopoulos, D. (1994) "Artificial fishes: physics, locomotion, perception, behavior", SIGGRAPH 94, pp. 43–50. Muscle-actuated bodies, perception and motivational behaviour (hunger, libido, fear) in one autonomous agent. — [SIGGRAPH history](https://history.siggraph.org/?p=119677); [PDF](https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Tu94.pdf)
- Lobato-Ríos, V. et al. (2022) NeuroMechFly, Nature Methods (11 May 2022): biomechanics, muscle models and neural controller in physics simulation. — [EPFL news](https://actu.epfl.ch/news/neuromechfly-a-digital-twin-of-drosophila/); [Infoscience](https://infoscience.epfl.ch/handle/20.500.14299/187973)
- Vaxenburg, R. et al. (2025) "Whole-body physics simulation of fruit fly locomotion", Nature 643, doi 10.1038/s41586-025-09029-4 (MuJoCo, deep-RL controllers). — [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12310536/); [Janelia](https://janelia.org/news/artificial-intelligence-brings-a-virtual-fly-to-life)
- Zhao, M. et al. / Lei Ma team (2024) BAAIWorm / MetaWorm, "An integrative data-driven model simulating C. elegans brain, body and environment interactions", Nature Computational Science (Dec 2024). It has a closed loop with a biophysical model of all 302 neurons, a body and an environment, and reproduces chemotaxis toward food. — [bioRxiv](https://www.biorxiv.org/content/10.1101/2024.02.22.581686.full.pdf); [OpenAlex DOI 10.1038/s43588-024-00738-w](https://api.openalex.org/works/doi:10.1038%2FS43588-024-00738-W)
- None of these models motivation from interoceptive organs or learned values. They focus on biomechanics, locomotion and connectome fidelity (this is my inference from the descriptions above).

**Artificial-life ecologies**
- Yaeger, L. (1994) Polyworld combines "biologically motivated genetics, simple simulated physiologies and metabolisms, Hebbian learning in arbitrary neural network architectures, a visual perceptive mechanism", energy and eating, mating and evolution. — [Temple slides](https://cis.temple.edu/tagit/presentations/PolyWorld.pdf); [Yaeger & Sporns](https://www.shinyverse.org/larryy/YaegerSporns.EvoNeurComplex.pdf)

**Rule-based and interpretable animat learning**
- Wilson, S.W. (1991) "The animat path to AI", in From Animals to Animats (SAB'90), MIT Press. — [York page](https://www-users.york.ac.uk/~ss44/books/pages/w/StewartWWilson.htm); [DTIC](https://apps.dtic.mil/sti/pdfs/ADA255809.pdf)
- Wilson, S.W. (1994) "ZCS: A zeroth level classifier system", Evolutionary Computation 2(1): 1–18. Condition-action rules evolved and reinforced in animat (Woods) environments, with Q-learning-like credit assignment. — [UWE repository](https://uwe-repository.worktribe.com/OutputFile/1079603)

**Sleep, offline and reflection mechanisms**
- Ellis, K. et al. (2021) DreamCoder, PLDI 2021: wake-sleep library learning. Sleep refactors programs and trains a recognition model by "dreaming" problems. Not embodied, and there are no drives. — [PLDI page](https://pldi21.sigplan.org/details/pldi-2021-papers/55/DreamCoder-Bootstrapping-Inductive-Program-Synthesis-with-Wake-Sleep-Library-Learnin); [PDF](https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf)
- Tadros, T. et al. (2022) "Sleep-like unsupervised replay reduces catastrophic forgetting in artificial neural networks", Nature Communications 13 (doi 10.1038/s41467-022-34938-7). Offline Hebbian, noisy replay consolidates memory. It does not generate experiments. — [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9755223/)
- Sutton's Dyna (1990): interleaves real experience with simulated rollouts from a learned model ("planning" offline). — [UAlberta papersdb](https://papersdb.cs.ualberta.ca/~papersdb/view_publication.php?pub_id=506)
- Park, J.S. et al. (2023) Generative Agents: agents "remember and reflect on days past as they plan the next day". Reflection runs a few times per simulated day and feeds the next day's plans. This is LLM-based and has no body or drives. — [arXiv 2304.03442](https://arxiv.org/pdf/2304.03442v1); [Google Research](https://research.google/pubs/generative-agents-interactive-simulacra-of-human-behavior/)
- Wang, G. et al. (2023) Voyager: an embodied agent (Minecraft) with an automatic curriculum (it proposes its own next tasks) and an ever-growing skill library of executable, interpretable code, verified against environment feedback (TMLR 2024). — [arXiv 2305.16291](https://arxiv.org/abs/2305.16291v2); [TMLR](https://mlanthology.org/tmlr/2024/wang2024tmlr-voyager)

### Inferences
- Items 1 to 3 (organs, drives with reward from body-state change, free-flow selection) are each established. The organ-as-module-with-nerve-latency-and-noise detail and the reflexes-in-organs design (Brooks-like) are engineering choices. Reviewers would probably treat them as design rather than scientific novelty.
- Item 5 (readable self-written rules): Voyager writes executable code skills, and LCS (ZCS/XCS) learn readable condition-action rules. Fagi's version differs because rules are synthesised from learned values with hysteresis, without an LLM, and inside a homeostatic creature. That is a narrower but plausible distinction.
- Item 4 (sleep generates questions, which become experiments the next day): the nearest are Creatures' sleep-time instinct rehearsal, Generative Agents' day-end reflection that plans the next day, Voyager's automatic curriculum, and DreamCoder's wake-sleep. None of the sources found combine all of these: (i) a homeostatic embodied creature, (ii) sleep-phase generation of hypotheses or questions, (iii) scheduling them as next-day embodied experiments, and (iv) an acceptance gate based on lived evidence.
- Item 6 (colony, genes, culture, breeding) is well covered by Creatures, Polyworld and the wider ALife tradition. Preregistered experiments are a methodological practice, not a system novelty, although it is unusual in ALife.

### Gaps
- Did not verify Rosenblatt & Payton's original paper (1989, IJCNN "A fine-grained alternative to the subsumption architecture for mobile robot control"). This comes from memory and is UNVERIFIED.
- Did not search Holland's Echo, Framsticks, Avida, Tierra, Sims 1994, ALIEN or Lenia (budget). From general knowledge they are evolutionary and lack interoceptive learning, but this is unverified here.
- Did not find the Yoshida 2024 paper's own page (only secondary excerpts and the related arXiv 2507.04998). Volume and article number 177:106379 come from a search excerpt.
- Did not verify whether any work combines Tyrrell-style free-flow selection with learned (non-innate) releasers or drives. Not found in searched sources.
- No source found for an animat that is born with no innate food or poison knowledge and learns preferences purely from post-ingestive (interoceptive) consequences, as in conditioned taste aversion. The search returned only biology. Not found does not mean it does not exist: Blumberg-group and Cañamero-group papers may contain this and should be checked.

## Q3. Gap analysis and candidate novelty claims

### Takeaway
Nothing in Fagi is new as a single component. Any novelty lies in a specific, testable combination: (a) a creature with no innate releasers whose drive releasers are learned from interoceptive organ signals, (b) feeding a free-flow (not winner-take-all) selector, and (c) a sleep phase that produces falsifiable questions, tested as next-day embodied experiments and admitted only on lived evidence, (d) with the learned policy exported as readable rules. Claims must be phrased as "to our knowledge, not found in searched sources".

### Cited Findings
- Already done:
  - organs with biochemistry, drives, reward from drive reduction, genetics, breeding, sleep-time brain training: Creatures ([Springer](https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520); [Creatures Wiki Instinct](https://creatures.fandom.com/wiki/Instinct))
  - homeostatic reward theory: [Keramati & Gutkin 2014](https://elifesciences.org/articles/04811)
  - free-flow hierarchies: [Tyrrell 1993](https://era.ed.ac.uk/handle/1842/20257)
  - Lorenz-style releasers in synthetic creatures: [Blumberg 1994](https://arxiv.org/pdf/cs/0211040)
  - Hebbian brains in evolving ecologies: [Polyworld](https://cis.temple.edu/tagit/presentations/PolyWorld.pdf)
- Partly done:
  - learning which stimuli predict reward in synthetic creatures ([Blumberg et al. 2002](https://history.siggraph.org/?p=118428))
  - day-end reflection that plans the next day ([Generative Agents](https://arxiv.org/pdf/2304.03442v1))
  - self-proposed tasks plus code skill library verified by the environment ([Voyager](https://arxiv.org/abs/2305.16291v2))
  - offline sleep consolidation ([Tadros 2022](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9755223/); [DreamCoder](https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf))
  - readable rule learning in animats ([ZCS](https://uwe-repository.worktribe.com/OutputFile/1079603))

### Inferences
**Candidate novelty claims** (conservative wording):
1. "To our knowledge (searched sources), no artificial creature combines (i) zero innate releasers or instincts, where all drive releasers are acquired from interoceptive organ signals, with (ii) free-flow action selection. Creatures relies on genome-specified instincts and a highest-activity decision lobe. Blumberg-style characters use designed releasers with learned refinements."
2. "We did not find an embodied homeostatic agent whose sleep phase generates explicit questions or hypotheses that are scheduled as the next day's embodied experiments and accepted only when lived evidence supports them. Prior sleep mechanisms rehearse innate instincts (Creatures), replay or consolidate (Tadros 2022, Dyna), or refactor programs (DreamCoder). Day-end reflection and planning exists in LLM agents without bodies or drives (Generative Agents)."
3. "Learned homeostatic values are compiled into a human-readable rule DSL with hysteresis, without an LLM, giving an inspectable trace from organ signal to learned value to rule. LCS rules are evolved rather than distilled from values. Voyager's code is LLM-written."
4. (Weaker, methodological) "Preregistered behavioural experiments on an ALife creature." This is a contribution to rigour, not a claim of mechanism novelty.

**Falsifiable hypotheses:**
- H1: Agents with learned releasers (no innate food or poison knowledge) reach homeostatic viability comparable to agents with innate releasers within N days, and adapt faster after a mid-life swap of which item is nutritious or toxic. Prediction: an innate-releaser control shows longer perseveration after the swap.
- H2: Free-flow selection outperforms winner-take-all on viability and on compromise behaviour (for example, approaching food that lies on the way to water) under the same learned values. This replicates Tyrrell's result with learned rather than designed drives. It could fail.
- H3: Sleep-proposed experiments with an evidence gate reduce time-to-correct-belief about hidden taste chemistry, compared with (a) no sleep phase and (b) sleep replay only, while keeping the false-belief adoption rate below that of an ungated condition.
- H4: Organ-level nerve latency and noise worsen performance unless reflexes live in organs. Ablating organ reflexes under latency should reduce survival more than the same ablation at zero latency (an interaction effect).

**Likely reviewer objections ("not new")**: "This is Creatures plus Keramati–Gutkin plus Tyrrell." "Drive-reduction reward is classic Hull/Creatures." "Sleep consolidation is well known (Creatures dreaming, Dyna, Tadros)." "Self-written code is Voyager or LCS." "Genes, culture and colonies are standard ALife." "Organs and nerves as message passing are an engineering detail." The defence must rest on the specific combination and on ablation evidence (H1–H4), not on the components.

### Gaps
- Searches for "sleep generates experiments" turned up mostly LLM co-scientist systems (for example, [AI Sleep Co-Scientist](https://arxiv.org/html/2607.25175v1)). These are not embodied creatures. I found no ALife or animat work matching claim 2, but the search was not exhaustive. Sources still to check: Oudeyer's intrinsically motivated goal exploration (IMGEP), Schmidhuber's artificial curiosity "experiments", and the SAB/ALIFE proceedings.
- I could not check Grand's Grandroids/Phantasia "imagination" mechanism in detail. It could overlap with claim 2 (imagination-based planning) and must be read before claiming novelty.
- The Creatures "concept lobe" may overlap with Fagi's concept formation (item 5). Not verified.
