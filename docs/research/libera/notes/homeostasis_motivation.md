# Computational models of homeostasis, allostasis, interoception and motivation as building blocks for Fagi

Method note: Crossref, PubMed Central, eLife, HSE and City repository full texts were blocked by the egress proxy in this session. Bibliographic data was checked through web-search result pages that point to publisher or repository records (PMC, Nature, SAGE, UCL Discovery, Herts repository, etc.). Status labels: VERIFIED means title, authors, venue, year and volume/pages were confirmed by at least one search result pointing to a primary record. CORRECTED means the brief's citation was wrong. PARTIAL means the bibliographic record was confirmed but some details were not. Where I describe a mechanism from my own knowledge rather than from fetched text, I say so with "[background knowledge, not re-verified in full text]".

## Q1. Allostasis: Sterling & Eyer (1988); Sterling (2012)

### Takeaway
Allostasis replaces "defend a fixed setpoint by negative feedback" with "predict upcoming needs and move the setpoints and effectors ahead of time". For Fagi, this means the organs' setpoints, and the brain's estimate of future need, become learned and context-dependent instead of constants.

### Cited Findings
- VERIFIED: Sterling, P. & Eyer, J. (1988). "Allostasis: A new paradigm to explain arousal pathology." In S. Fisher & J. Reason (Eds.), *Handbook of Life Stress, Cognition and Health* (pp. 629–649). New York: Wiley. — [Wikipedia: Allostasis (reference list)](https://en.wikipedia.org/wiki/Allostasis); [WorldCat record of the handbook](https://search.worldcat.org/oclc/17234042)
- VERIFIED: Sterling, P. (2012). "Allostasis: a model of predictive regulation." *Physiology & Behavior* 106(1): 5–15 (April 2012). — [PMC record](https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604); [Qigong Institute abstract](https://www.qigonginstitute.org/abstract-print/16743)
- Core claim: the goal of regulation is not to keep the internal milieu constant but to keep adjusting it to promote survival and reproduction. Efficient regulation means anticipating needs and preparing to meet them before they arise. — [PMC4166604](https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604)
- Allostasis shifts the emphasis from a rigid internal setpoint to the brain interpreting environmental demands and coordinating bodily changes through neural and hormonal signals. — [Wikipedia: Allostasis](https://en.wikipedia.org/wiki/Allostasis)

### Inferences (Fagi implementation)
- **Mechanism:** each organ keeps a nominal setpoint `s0`. A "hypothalamus" module emits an effective setpoint `s_eff = s0 + Δs(context)`, where Δs is learned from how often a given context led to a later deficit. For example: night is coming, so raise the energy target and eat before sleeping; a hot zone is ahead, so drink pre-emptively. In a deterministic simulation, Δs can be a learned linear function of context features (time of day, zone, recent travel) trained on the deficit that followed k ticks later.
- **Testable prediction:** an allostatic Fagi eats or drinks *before* predictable demands (pre-sleep feeding, drinking before crossing a dry area). It should show smaller peak deficits but more total intake than a purely homeostatic Fagi with the same organs. Ablation (Δs = 0) should bring back purely reactive, larger-amplitude oscillations.
- Allostatic load could be tracked as accumulated |s_eff − s0| × time and coupled to fatigue or "stress", giving a measurable cost of chronic prediction.

### Gaps
- Sterling (2012) full text was not fetched (PMC was blocked), so no specific equations from it are cited. Sterling's treatment is mostly conceptual, not a formal model.

## Q2. Homeostatic reinforcement learning (HRRL): Keramati & Gutkin (2014)

### Takeaway
HRRL is almost exactly Fagi's current "reward = body delta" rule, put on a formal footing. Reward is the reduction in *drive*, where drive is a nonlinear distance from the setpoint in a multidimensional internal-state space. Under this definition, maximising discounted reward is equivalent to minimising deviation from the setpoint. The main things Fagi can take from it are (a) the nonlinear drive metric with exponents m and n, and (b) separating an orosensory *estimate* of the outcome, used at ingestion time, from the true post-ingestive outcome.

### Cited Findings
- VERIFIED: Keramati, M. & Gutkin, B. (2014). "Homeostatic reinforcement learning for integrating reward collection and physiological stability." *eLife* 3: e04811. doi:10.7554/eLife.04811 — [eLife](https://elifesciences.org/articles/04811); [PMC4270100](https://pmc.ncbi.nlm.nih.gov/articles/PMC4270100)
- The paper gives a normative theory in which internal states modulate learning, and proves mathematically that seeking reward is equivalent to the objective of physiological stability ("physiological rationality"). — [eLife](https://elifesciences.org/articles/04811)
- Delay discounting is shown to be a logical way to optimise homeostasis. The model also accounts for homeostasis failing to limit intake when salt-, sugar- or fat-loaded foods are freely available. — [eLife](https://elifesciences.org/articles/04811)
- Drive has free exponents m and n that set the nonlinear mapping from deviations to motivation. With m = n = 1 the drive reduces to Euclidean distance. The reward is the sequential drop in drive, r(t+1) ∝ D_t − D_{t+1}. — [Search summary of HRRL follow-up literature, citing Keramati & Gutkin](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.857009/full); [Yoshida et al. 2024, Neural Networks, "Emergence of integrated behaviors through direct optimization for homeostasis"](https://www.sciencedirect.com/science/article/pii/S0893608024003034)
- [background knowledge, not re-verified in full text] The drive is D(H) = (Σ_i |h*_i − h_i|^n)^(1/m), and reward is r(H_t, K_t) = D(H_t) − D(H_t + K_t), where K_t is the change the outcome makes to the internal state. The agent only has the orosensory properties of a food when it ingests it, so it uses an estimate K̂ derived from them. This is how the paper explains why orally ingested food reinforces behaviour while the same nutrient infused directly into the stomach (no orosensory estimate) reinforces it weakly or not at all. Mis-estimation from palatable taste (K̂ larger than K) explains overeating. Their claimed list of explained phenomena also includes anticipatory responding and risk aversion.

### Inferences (Fagi implementation)
- **Direct match to Fagi:** Fagi's reward = (state before − state after) is HRRL with m = n = 1 per variable, summed. Changes to adopt:
  1. **Use the nonlinear drive** `D = (Σ w_i·|s*_i − s_i|^n)^(1/m)` with n > m > 1. Eating then gives a large reward when starving and a small one when nearly sated, and multiple deficits interact. This one change produces risk aversion and diminishing returns for free.
  2. **Split the reward signal in two:** an immediate *taste-predicted* reward `r̂ = D(H) − D(H + K̂(taste))`, plus a delayed *post-ingestive* correction `δ = r_true − r̂` delivered when the stomach or blood actually changes. This fits the planned fast-satiety stomach and slow-nutrient organs. K̂ is learned per taste feature using the existing value+confidence memory.
  3. Keep a discount factor γ < 1. HRRL justifies it as homeostatically optimal, not as an ad hoc choice.
- **Testable predictions:**
  - (a) "Intragastric" test: if food is injected directly into the stomach with no taste event, Fagi should learn a weaker or slower preference for the location or action than for orally tasted food with the same nutrients.
  - (b) A "sweet but empty" food (high K̂, low real K) is overconsumed early. Then δ < 0 drives a slow downward revision of preference: conditioned taste devaluation.
  - (c) With n > 1, Fagi prefers a reliable small food source to a risky source with the same mean (risk aversion), and the preference grows with deficit.

### Gaps
- The paper's exact equation numbers and the details of its oral vs intragastric simulation could not be quoted from full text (eLife, PMC and City repository were all blocked). The formula and the orosensory-estimate mechanism above are from background knowledge and should be checked against https://elifesciences.org/articles/04811 before the final report quotes them.

## Q3. Interoceptive inference and active inference: Seth (2013); Seth & Friston (2016); Barrett & Simmons (2015); Friston (2010); Pezzulo, Rigoli & Friston (2015)

### Takeaway
These works treat interoception as *prediction*. The brain holds a generative model of bodily states, compares predictions with afferent signals (prediction error), and reduces the error either by updating beliefs or by acting: autonomic reflexes or behaviour. Setpoints become "prior preferences". For a deterministic JS creature, the full variational machinery is overkill. The useful, cheap kernel is: predict each interoceptive channel, compute precision-weighted prediction error, and let large persistent errors drive action and learning.

### Cited Findings
- VERIFIED: Seth, A. K. (2013). "Interoceptive inference, emotion, and the embodied self." *Trends in Cognitive Sciences* 17(11): 565–573. — [UCL FIL PDF](https://www.fil.ion.ucl.ac.uk/~karl/Interoceptive%20inference%20emotion%20and%20the%20embodied%20self..pdf); [Sussex repository](https://sro.sussex.ac.uk/id/eprint/49586/)
  - Emotions are cast as arising from actively inferred generative (predictive) models of the causes of interoceptive afferents, generalising appraisal theories. — [Qigong Institute abstract](https://qigonginstitute.org/abstract-print/15976)
- VERIFIED: Seth, A. K. & Friston, K. J. (2016). "Active interoceptive inference and the emotional brain." *Phil. Trans. R. Soc. B* 371: 20160007. — [PMC5062097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5062097/); [UCL Discovery](https://discovery-pp.ucl.ac.uk/id/eprint/1532767)
  - Bodily states are regulated by autonomic reflexes "enslaved by descending predictions" from deep generative models. Uncertainty (precision) has a key role and may map onto neuromodulation. — [PMC5062097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5062097/)
- VERIFIED: Barrett, L. F. & Simmons, W. K. (2015). "Interoceptive predictions in the brain." *Nature Reviews Neuroscience* 16(7): 419–429. PMID 26016744. — [Author PDF](https://www.affective-science.org/pubs/2015/barrett-simmons-nature-neuroscience-2015.pdf); [PMC4731102](https://pmc.ncbi.nlm.nih.gov/articles/PMC4731102/)
  - It introduces the EPIC (Embodied Predictive Interoception Coding) model: agranular visceromotor cortices issue interoceptive predictions, and interoceptive experience may largely reflect limbic predictions constrained by ascending visceral signals. — [PMC4731102](https://pmc.ncbi.nlm.nih.gov/articles/PMC4731102/)
- Related, for "body budget": Kleckner et al. (2017), "Evidence for a large-scale brain system supporting allostasis and interoception in humans", appears as a bioRxiv preprint in the search results. — [bioRxiv 098970](https://www.biorxiv.org/content/10.1101/098970v1) (PARTIAL: the journal version, Nature Human Behaviour 2017, was not confirmed in this session)
- VERIFIED: Friston, K. (2010). "The free-energy principle: a unified brain theory?" *Nature Reviews Neuroscience* 11(2): 127–138. Minimising variational free energy, an upper bound on surprise, is proposed to unify perception, action and learning. — [UCI-hosted PDF](https://sites.socsci.uci.edu/~rfutrell/readings/friston2010freeenergy.pdf)
- VERIFIED: Pezzulo, G., Rigoli, F. & Friston, K. (2015). "Active Inference, homeostatic regulation and adaptive behavioural control." *Progress in Neurobiology* 134: 17–35. doi:10.1016/j.pneurobio.2015.09.001. Pavlovian, habitual and goal-directed control are cast as successive hierarchical contextualisations of sensorimotor constructs within active inference. — [PMC4779150](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4779150/); [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1475385/)

### Inferences (Fagi implementation)
- **Cheap "interoceptive inference" layer:** for each channel c (glucose, osmolality, core temperature, muscle fatigue, nociception), Fagi keeps a prediction μ_c and a learned precision π_c (inverse variance of recent errors). The prediction error ε_c = π_c·(x_c − μ_c) does three jobs:
  1. It updates μ_c, which is perception.
  2. Errors on the *preferred* state (setpoint as prior) feed the drive reservoirs, which is action.
  3. It provides a "surprise" signal that sets the learning rate and the confidence stored in memory.

  Precision is a natural deterministic implementation of the "confidence" already present in Fagi's memory.
- **Emotion-like global state:** a running sum of precision-weighted interoceptive errors gives an "arousal" scalar. Its sign trend (errors shrinking or growing) gives a "valence" scalar. Seth and Barrett would read these as core affect. They can modulate the Tyrrell free-flow selector, for example by raising exploration under low arousal and positive valence.
- **Testable predictions:**
  - (a) A Fagi with a noisier sensor on one channel, which lowers that channel's precision, should respond more slowly to deficits on that channel and learn its food values more slowly.
  - (b) After predictable perturbations, such as nightly cooling, prediction errors should shrink over days while behaviour (nest-seeking before dusk) appears earlier. This is the allostatic signature.
- **Controversy:** the free-energy principle is debated as possibly unfalsifiable as a general principle. Practical implementations are expensive. I found no source in this session evaluating that critique, so it is listed under Gaps.

### Gaps
- No source fetched for critiques of FEP falsifiability. The journal version of Kleckner et al. 2017 was not confirmed.

## Q4. Somatic marker hypothesis: Damasio (1994); Bechara et al. (1997)

### Takeaway
Somatic markers are learned body-state ("gut feeling") signals that come to bias choices toward or away from options before explicit knowledge exists. The Iowa Gambling Task evidence is contested: Maia & McClelland (2004) showed that participants have more conscious knowledge than Bechara et al. detected. As an engineering idea, it maps neatly onto Fagi: stored interoceptive episodes come back as an anticipatory bodily state that biases action.

### Cited Findings
- VERIFIED: Bechara, A., Damasio, H., Tranel, D. & Damasio, A. R. (1997). "Deciding advantageously before knowing the advantageous strategy." *Science* 275(5304): 1293–1295. — [University of Iowa repository record](https://iro.uiowa.edu/esploro/outputs/journalArticle/Deciding-advantageously-before-knowing-the-advantageous/9984002580202771)
  - It reported that normal participants chose advantageously in a card game before they could state the strategy, supporting the idea that nonconscious somatic markers guide behaviour. — [Maia & McClelland 2004, PNAS (PMC528759)](https://pmc.ncbi.nlm.nih.gov/articles/PMC528759)
- CONTROVERSY: Maia, T. V. & McClelland, J. L. (2004), PNAS. Using more sensitive questionnaires, they found that participants report knowledge of the advantageous strategy *more reliably* than they act on it, so "there is no need to appeal to nonconscious somatic markers." — [PMC528759](https://pmc.ncbi.nlm.nih.gov/articles/PMC528759); [Stanford PDF](https://stanford.edu/%7Ejlmcc/papers/MaiaMcC04.pdf). Bechara et al. replied in TiCS 2005, and Maia & McClelland responded. — [Bechara et al. 2005 TiCS PDF](https://stanford.edu/%7Ejlmcc/papers/BecharaEtAl05_TiCS.pdf); [Maia & McClelland 2005 TiCS PDF](https://stanford.edu/%7Ejlmcc/papers/MaiaMcC05_TiCS.pdf)
- Damasio, A. R. (1994), *Descartes' Error: Emotion, Reason, and the Human Brain* (Putnam). This is the standard book reference. UNVERIFIED in this session (no publisher page fetched), but it is a well-known book.

### Inferences (Fagi implementation)
- **Mechanism:** when Fagi perceives a cue, such as a food's colour or smell, it retrieves stored episodes with that cue and *re-enacts* a weighted average of their body deltas as a transient "as-if" interoceptive signal: an anticipatory drop in stomach comfort, a nociceptor twinge, or a pleasant glow. This signal enters the action selector as if it were real interoception, with weight equal to memory confidence. This gives Fagi gut feelings without needing explicit reasoning.
- **Testable prediction:** in an IGT-like setup (patch A gives big meals but occasional nausea or pain; patch B gives modest, safe meals), Fagi with somatic re-enactment switches to B sooner than Fagi with only value memory. Ablating the re-enactment makes it keep sampling A ("VMPFC-lesion-like" behaviour).

### Gaps
- No modern computational model of somatic markers was retrieved in this session.

## Q5. Robot and animat motivation architectures: Cañamero (1997); Avila-García & Cañamero (2004/2005); Lewis & Cañamero (2016)

### Takeaway
Cañamero's line of work is the closest engineering precedent for Fagi. Homeostatic variables generate motivations, behaviours are selected by motivational intensity combined with external cues, and "hormones" globally modulate perception or motivation. Lewis & Cañamero (2016) show that pleasure, even pleasure unrelated to need satisfaction, improves viability and flexibility.

### Cited Findings
- VERIFIED: Cañamero, D. (1997). "Modeling motivations and emotions as a basis for intelligent behavior." In *Proceedings of the First International Conference on Autonomous Agents (Agents '97)*, pp. 148–155. ACM Press. — [Search record referencing ACM/dblp](https://dblp.uni-trier.de/pid/34/1508.html)
- CORRECTED/PARTIAL: I could not confirm an SAB 2004 paper titled "Using hormonal feedback to modulate action selection in a competitive scenario". What I could confirm:
  - Avila-García, O. & Cañamero, L. (2005). "Hormonal modulation of perception in motivation-based action selection architectures." In *Proceedings of the Symposium on Agents that Want and Like: Motivational and Emotional Roots of Cognition and Action*, AISB '05. — [Herts repository](https://uhra.herts.ac.uk/id/eprint/12751/); [Herts research profile](https://researchprofiles.herts.ac.uk/en/publications/hormonal-modulation-of-perception-in-motivation-based-action-sele/)
  - SAB 2004 (From Animals to Animats 8, MIT Press) existed, but the specific paper did not appear in the search results. — [Edinburgh record for SAB 2004 proceedings](https://www.research.ed.ac.uk/en/publications/from-animals-to-animats-8-proceedings-of-the-eighth-international/)
  - Status: UNVERIFIABLE for the SAB 2004 title. Check the SAB 2004 table of contents before citing it.
- Mechanism of the Avila-García & Cañamero work: hormone-like signals improve the adaptivity of motivation-based architectures by modulating perception, tested in dynamic, unpredictable robotic scenarios. — [Herts repository](https://uhra.herts.ac.uk/id/eprint/12751/)
- VERIFIED: Lewis, M. & Cañamero, L. (2016). "Hedonic quality or reward? A study of basic pleasure in homeostasis and decision making of a motivated autonomous robot." *Adaptive Behavior* 24(5): 267–291. doi:10.1177/1059712316666331. Open access, CC BY 3.0. — [SAGE](https://journals.sagepub.com/doi/10.1177/1059712316666331); [PMC5152795](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5152795/)
  - Three experiments compared pleasure that is related to need satisfaction with pleasure that is unrelated to it. Pleasure, including the unrelated kind, improved homeostatic management: better viability and more flexible adaptive behaviour. — [PMC5152795](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5152795/)

### Inferences (Fagi implementation)
- **Hormonal modulation of perception:** a slow "hormone" variable per drive (e.g. a ghrelin-like signal rising with time since the last meal) multiplies the *perceived salience* of matching cues (food smells) before they reach the free-flow selector. The deterministic rule is `cue_gain = 1 + k·hormone`. This is distinct from multiplying the drive itself.
- **Pleasure as a modulator:** a pleasure signal from the taste organ, produced by alliesthesia (Q7), temporarily raises the gain on the current behaviour's cues ("keep doing this"). This reproduces Lewis & Cañamero's finding that pleasure helps opportunistic consumption.
- **Testable prediction:** with hormonal cue gain, Fagi detects and switches to food from farther away when hungry, and ignores the same food when sated. Without it, detection range is fixed. Measure detection distance against deficit.

### Gaps
- The SAB 2004 paper title in the brief is unverified, and the exact hormone equations in Avila-García & Cañamero were not retrieved.

## Q6. Wanting vs liking: Hull, Toates, Berridge & Robinson (1998), Berridge (2009), Zhang et al. (2009)

### Takeaway
Pure drive reduction (Hull) cannot explain motivation by cues or wanting without need. Incentive theories (Toates; Berridge) add that cues acquire incentive value, and that "wanting" (incentive salience, dopaminergic) is separable from "liking" (hedonic impact, opioid hotspots). Zhang et al. (2009) give an explicit computational form in which the physiological state multiplies the learned cue value at the moment of re-encounter. This is ideal for Fagi's "learned releasers".

### Cited Findings
- VERIFIED: Berridge, K. C. & Robinson, T. E. (1998). "What is the role of dopamine in reward: hedonic impact, reward learning, or incentive salience?" *Brain Research Reviews* 28(3): 309–369. Dopamine may mediate incentive salience in a way that is separable from hedonia and reward learning. — [DrugBank article record](https://drugbank.ca/articles/A1545); [McGill PDF](https://lecerveau.mcgill.ca/flash/capsules/articles_pdf/dopamine.pdf)
- VERIFIED: Berridge, K. C. (2009). "'Liking' and 'wanting' food rewards: Brain substrates and roles in eating disorders." *Physiology & Behavior* 97(5): 537–550. It describes cubic-millimetre hedonic hotspots in nucleus accumbens and ventral pallidum where opioids amplify sensory pleasure. — [PMC2717031](https://pmc.ncbi.nlm.nih.gov/articles/PMC2717031); [NIH author manuscript PDF](https://www.wisebrain.org/media/Papers/LikingWantingFood.pdf)
- VERIFIED (added): Zhang, J., Berridge, K. C., Tindell, A. J., Smith, K. S. & Aldridge, J. W. (2009). "A neural computational model of incentive salience." *PLoS Computational Biology* 5(7): e1000437 (17 July 2009). The model modulates incentive salience by integrating changing physiological states with prior learning, supported by salt-appetite and drug-sensitisation data. — [PMC2703828](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2703828/); [MIT DSpace](https://dspace.mit.edu/handle/1721.1/54747)
- [background knowledge, not re-verified in full text] In Zhang et al., the cue's incentive value is computed as Ṽ(s_t) = r̃(r_t, κ) + γV(s_{t+1}), where κ is a physiological-state factor that can multiply (or log-add to) the learned reward. This lets a cue that was previously aversive, such as intense salt, become instantly "wanted" under salt deprivation without relearning.
- Toates, F. (1986), *Motivational Systems* (Cambridge University Press). UNVERIFIED in this session (no record fetched).

### Inferences (Fagi implementation)
- **Store liking and learn wanting separately:**
  - *Liking* `L(taste, state)` is the immediate hedonic value at consumption, computed by alliesthesia (Q7). It is not learned, but it is state-dependent.
  - *Learned value* `V(cue)` is the existing value+confidence memory, trained on the body delta (HRRL reward).
  - *Wanting* is computed at cue encounter: `W(cue) = κ(state) · V(cue)`, where κ is the current deficit of the drive that this cue's past episodes restored. W, not V, feeds the Lorenz reservoir's releaser and the Tyrrell selector.
  - This makes "learned releasers" concrete: a releaser is a cue whose V was learned, and its releasing power is gated by κ.
- **Testable predictions:**
  - (a) Instant revaluation: if Fagi has learned that a "salty" food is bad when not salt-deprived, then after a sudden salt or water imbalance it should approach that food on first re-encounter, without new learning trials. This is the Zhang/Berridge salt result. A pure TD-learner Fagi would need relearning trials.
  - (b) Dissociation: a manipulation that boosts wanting (a κ gain, like "sensitisation") increases approach and pursuit effort for a cue without increasing intake rate or liking at consumption.

### Gaps
- The exact κ equations of Zhang et al. were not quoted from full text (PMC blocked). Toates (1986) is unverified.

## Q7. Alliesthesia and satiety signals: Cabanac (1971), Blundell's satiety cascade, gut–brain signals, thirst anticipation (Zimmerman et al. 2016), AgRP neurons

### Takeaway
Cabanac's alliesthesia is the most directly implementable building block. The pleasantness of a stimulus is a function of internal state: sweet is pleasant when hungry and becomes unpleasant after glucose loading. Recent hypothalamic work (Knight lab, Sternson lab) shows that need neurons are *pre-emptively* silenced by the sight, smell or taste of food or water, before any physiological change. Betley et al. (2015) show these need neurons carry a negative-valence teaching signal whose *reduction* reinforces behaviour. Together these give a biologically grounded two-timescale design: fast sensory/oral prediction plus slow post-absorptive correction.

### Cited Findings
- VERIFIED: Cabanac, M. (1971). "Physiological role of pleasure." *Science* 173(4002): 1103–1107. It coins "alliesthesia" (allios = changed, esthesia = sensation). The pleasantness of a stimulus varies with internal state: thermal sensation depends on core temperature, and the pleasantness of orange odour and sweet taste drops after glucose or sucrose ingestion. Pleasure signals usefulness, so behaviour adapts to physiological aims. — [Wikipedia: Alliesthesia](https://www.wikipedia.com/wiki/Alliesthesia); [Scribd copy of Cabanac 1971](https://es.scribd.com/document/252975478/CABANAC-1971); [Biomedgrid review "Alliesthesia: up-date of the word and concept"](https://biomedgrid.com/fulltext/volume8/alliesthesia-up-date-of-the-word-and-concept.001293.php)
- VERIFIED (concept): Blundell & Burley (1987) satiety cascade. Satiation and satiety are shaped successively by **sensory, cognitive, post-ingestive and post-absorptive** influences over time. — [Wageningen document](https://edepot.wur.nl/293913); [Leeds Human Appetite Research Unit history](https://appetite-obesity.leeds.ac.uk/history-of-the-human-appetite-research-unit/). Exact 1987 bibliographic details (journal, pages) were not confirmed.
- VERIFIED: Zimmerman, C. A., Lin, Y.-C., Leib, D. E., Guo, L., Huey, E. L., Daly, G. E., Chen, Y. & Knight, Z. A. (2016). "Thirst neurons anticipate the homeostatic consequences of eating and drinking." *Nature* 537: 680–684 (2016). — [Nature](https://www.nature.com/articles/nature18950); [PMC5161740](https://pmc.ncbi.nlm.nih.gov/articles/PMC5161740)
  - Thirst-promoting SFO neurons receive oral-cavity inputs during eating and drinking and combine them with blood-composition information. This lets them predict how ingestion will change fluid balance and adjust behaviour pre-emptively. It explains drinking during meals, rapid satiation of thirst, and why oral cooling quenches thirst. — [Search summary of Nature/PMC record](https://www.nature.com/articles/nature18950); [Neuroscience News](https://neurosciencenews.com/thirst-neuroscience-4783/)
  - (Volume and pages 537:680–684 are from background knowledge; the search confirmed authors, title, journal and year.)
- VERIFIED: Chen, Y., Lin, Y.-C., Kuo, T.-W. & Knight, Z. A. (2015). "Sensory detection of food rapidly modulates arcuate feeding circuits." *Cell* 160(5): 829–841. Sensory detection of food alone rapidly reverses the hunger-induced activation of AgRP and POMC neurons before any food is eaten. The effect is modulated by palatability and nutritional state. — [PMC4373539](https://pmc.ncbi.nlm.nih.gov/articles/4373539); [eScholarship](https://escholarship.org/uc/item/0g9488dx)
- VERIFIED: Betley, J. N., Xu, S., Cao, Z. F. H., Gong, R., Magnus, C. J., Yu, Y. & Sternson, S. M. (2015). "Neurons for hunger and thirst transmit a negative-valence teaching signal." *Nature* 521(7551): 180–185. Mice avoid AGRP neuron activation (negative valence). Need-sensing neurons condition preferences for cues associated with nutrient or water intake through the *reduction* of this negative-valence signal. — [PubMed 25915020](https://pubmed.ncbi.nlm.nih.gov/25915020/); [RePEc record](https://ideas.repec.org/a/nat/nature/v521y2015i7551d10.1038_nature14416.html). Full author list is from background knowledge.
- Allen et al.: "Thirst-associated preoptic neurons encode an aversive motivational drive" (Allen, W. E., et al., *Science* 2017) was NOT verified in this session (not searched due to tool budget). UNVERIFIABLE here.
- Ghrelin, CCK and leptin as fast vs slow satiety signals: no primary source was fetched this session. This is standard physiology (CCK is short-term meal satiation, ghrelin is pre-meal hunger, leptin is long-term adiposity), but it is listed as a gap for citation purposes.

### Inferences (Fagi implementation)
- **Alliesthesia function for the taste organ:** `L(taste, state) = Σ_i a_i(taste) · (−∂D/∂h_i)` or, more simply, `L = a(taste) · tanh(k·deficit_i)`, with a sign flip past the setpoint (overshoot makes the same taste unpleasant). Thermal alliesthesia uses the same rule: warmth is pleasant when core temperature is below setpoint and unpleasant above it. This links a *fixed, innate* sensory signal ("sweet", "wet", "warm") to state without telling Fagi what is good. Fagi still has to learn which world objects produce which tastes. This is consistent with "born knowing nothing" about objects, because alliesthesia is a body property, not world knowledge.
- **Two-timescale stomach** (satiety cascade plus Knight-lab anticipation):
  - (1) *Sensory/oral phase:* the taste and volume entering the mouth immediately inhibit the relevant need signal by a learned predicted amount (pre-absorptive satiety). Fagi stops eating or drinking before blood values change.
  - (2) *Post-ingestive phase:* stomach distension gives fast mechanical satiety, a CCK-like signal.
  - (3) *Post-absorptive phase:* nutrients slowly reach the blood and update the true energy state.
  - The error between (1) and (3) trains the oral predictor. Osmoreceptors follow the same scheme for thirst: SFO-like neurons are pre-emptively quenched by "water on the tongue", and eating salty or dry food pre-emptively *raises* thirst. ADH or water retention is then the slow effector.
- **Betley-style learning signal:** the teaching signal should be the *reduction of need-neuron activity*, which can come from the anticipatory oral signal. This justifies Fagi's "reward = body delta", with the body delta measured on the need signal (prediction plus physiology) rather than raw physiology.
- **Testable predictions:**
  - (a) Fagi drinks during and right after meals of dry or salty food, before osmolality rises (Zimmerman).
  - (b) Drinking satiation ends within a few ticks, long before blood hydration recovers. If water is "sham-drunk" (taste without absorption), Fagi stops early, then resumes once the anticipatory inhibition decays and the true deficit reappears.
  - (c) Liking for a food falls within a meal (alliesthesia and sensory-specific satiety) even though the learned value V is unchanged. A second, different-tasting food is still eaten: a "dessert effect" if alliesthesia is taste-specific.

### Gaps
- The Allen et al. thirst paper and specific primary sources for ghrelin, CCK and leptin dynamics were not verified. Volume and pages for Blundell & Burley 1987 were not confirmed.

## Q8. Muscle fatigue models and the "central governor"

### Takeaway
Xia & Frey Law (2008) give a small, deterministic, three-compartment ODE model (resting, active, fatigued) that drops straight into Fagi's muscles with local fatigue. Noakes's "central governor" (the brain pre-emptively caps effort to protect homeostasis) is controversial and not accepted by most exercise physiologists. However, the *idea* of an anticipatory brain-level cap is computationally attractive and fits allostasis.

### Cited Findings
- VERIFIED: Xia, T. & Frey Law, L. A. (2008). "A theoretical approach for modeling peripheral muscle fatigue and recovery." *Journal of Biomechanics* 41(14): 3046–3052. doi:10.1016/j.jbiomech.2008.07.013. PMID 18789445. — [University of Iowa record](https://iro.uiowa.edu/esploro/outputs/journalArticle/A-theoretical-approach-for-modeling-peripheral/9984047678402771); [PMC3397684 (follow-up validation)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3397684)
  - Muscle units are in one of three states: resting (M_R), activated (M_A) or fatigued (M_F). A bounded proportional controller handles activation and deactivation, while fatigue rate F and recovery rate R govern transfer into and out of M_F. The model qualitatively reproduces Rohmert's endurance curves. — [Iowa record](https://iro.uiowa.edu/esploro/outputs/journalArticle/A-theoretical-approach-for-modeling-peripheral/9984047678402771)
  - Later work extended it, for example "A four-compartment controller model of muscle fatigue for static and dynamic tasks" (Frontiers in Physiology, 2025). — [Frontiers](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1518847/epub)
  - [background knowledge] The equations are dM_A/dt = C(t) − F·M_A; dM_F/dt = F·M_A − R·M_F; dM_R/dt = −C(t) + R·M_F. C(t) is a bounded proportional controller (gain L) driving M_A toward the target load TL, limited by available M_R.
- CONTROVERSY: the central governor model (Noakes) proposes that the CNS caps motor drive to prevent catastrophic homeostatic failure. It is "very controversial among exercise physiologists", with calls to abandon it from Marcora (2008) and Shephard (2009). A 2009 J Appl Physiol point–counterpoint (Noakes & Marino vs Ekblom) addressed it. — [Frontiers in Psychology 2016 mini-review](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00656/full); [Hopkins 2009, "The improbable central governor of maximal endurance performance", Sportscience 13: 9–12](https://sportsci.org/2009/wghgov.htm); [Shephard critique PDF](https://www.unm.edu/%7Errobergs/478Shephard.pdf)

### Inferences (Fagi implementation)
- **Per-muscle (or per-limb) Xia–Frey Law compartments:** each movement action requests a target load TL. Available force = M_A, capped by M_R. Speed scales with M_A / TL. Fatigue is purely local, so a limb used for digging fatigues while locomotion is still possible. Use per-tick Euler updates with fixed F and R: deterministic and cheap.
- **Central governor as a learned allostatic cap:** instead of claiming Noakes is right, implement an optional *anticipatory* effort cap `TL_max = g(predicted remaining distance, energy, core temperature)`. g is learned from past episodes in which exhaustion or overheating occurred. This is an allostatic controller in the Sterling sense, and it can be turned off to compare.
- **Testable predictions:**
  - (a) Endurance time falls hyperbolically with load (Rohmert-like) in the peripheral-only model.
  - (b) With the learned governor, Fagi "paces": it moves slower at the start of long known trips and shows an end-spurt when the nest is near (the remaining-distance prediction shrinks). Without the governor, it runs fast and collapses peripherally. This end-spurt is the classic behavioural evidence cited for central regulation, so it gives a falsifiable in-silico contrast.

### Gaps
- Marcora 2008 and Shephard 2009 were cited via a secondary review, not fetched directly.

