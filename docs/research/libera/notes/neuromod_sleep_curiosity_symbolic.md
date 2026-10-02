# Neuromodulation, sleep/replay, curiosity, and self-written rules as building blocks for Fagi

Scope: verified citations, the core mechanism of each work, how it would fit Fagi's redesign (organs, nerves with latency and noise, a deterministic message bus, Lorenz-like drives with learned releasers, free-flow action selection), and a falsifiable prediction for each.
Verification legend: VERIFIED means title, venue, volume and pages were confirmed against a publisher, repository or index page. CORRECTED means the brief's citation was wrong and the fix is given. PARTIAL means a conflict remains.

---

## Q1. Hormones and neuromodulators as global modulators: what are the mechanisms, and are the citations correct?

### Takeaway
There are two families. (1) Artificial endocrine systems: a slow, diffusing scalar "hormone" is secreted by glands in response to internal or external state. It decays over time and multiplicatively modulates network weights, sensor gains or motivations (Neal & Timmis; Timmis, Neal & Thorniley; Avila-García & Cañamero; Shen's Digital Hormone Model for distributed modules). (2) Computational neuromodulation: a few global scalars set the meta-parameters of learning and choice. In Doya's mapping, dopamine is the TD error, serotonin the discount γ, noradrenaline the inverse temperature β, and acetylcholine the learning rate α. Yu & Dayan split uncertainty into expected uncertainty (ACh) and unexpected uncertainty (NE). Both families fit naturally as "humoral" broadcast channels on Fagi's message bus, in parallel with the point-to-point nerves.

### Cited Findings
- **Neal, M. & Timmis, J. (2003). "Timidity: A useful emotional mechanism for robot control?" *Informatica* 27(2/4): 197–204.** Status: VERIFIED for title, journal, year and pages. The issue number appears as 4 in some records and 2 in others, so cite pp. 197–204. Mechanism: an Artificial Endocrine System interacts with an artificial neural network. Its behavior "could be classified as emotive" and is framed as homeostasis-inspired generation of behavior. — [Kent pubs](https://www.cs.kent.ac.uk/pubs/2003/1635); [Aberystwyth record](https://research.aber.ac.uk/cy/publications/timidity-a-useful-emotional-mechanism-for-robot-control/); [KAR](https://kar.kent.ac.uk/13852)
- **Timmis, J., Neal, M. & Thorniley, J. (2009). "An adaptive neuro-endocrine system for robotic systems." *IEEE Workshop on Robotic Intelligence in Informationally Structured Space (RiiSS 2009)*, Nashville, 30 Mar – 2 Apr 2009.** Status: VERIFIED (2009, IEEE workshop proceedings). Mechanism: the adaptive artificial neural-endocrine (AANE) system learns on-line associations between sensor data and actions. It copes with sensor degradation and failure, ran on real robots for prolonged periods, and is described as "a step towards… homeostasis for prolonged autonomy." — [Aberystwyth record](https://research.aber.ac.uk/en/publications/an-adaptive-neuro-endocrine-system-for-robotic-systems/)
- **Shen, W.-M., Will, P., Galstyan, A. & Chuong, C.-M. (2004). "Hormone-inspired self-organization and distributed control of robotic swarms." *Autonomous Robots* 17(1): 93–105. DOI 10.1023/B:AURO.0000032940.08116.f1.** Status: CORRECTED. The brief listed "Shen, Salemi et al." The 2004 *Autonomous Robots* paper is by Shen, Will, Galstyan & Chuong and concerns *robotic swarms*. Mechanism: the Digital Hormone Model (DHM) uses local communication, signal propagation and stochastic reactions. It is probabilistic, fault-tolerant and "can be easily tasked to change global behavior." It was demonstrated on feather-bud pattern formation and on swarm targeting, self-repair and pitfall avoidance. — [ISI PRL page](https://robots.isi.edu/prl/b2hd-shen2004hormone-inspired-self-organization-and-distributed-control.html); [Springer](https://link.springer.com/article/10.1023/B:AURO.0000032940.08116.f1)
  - The Shen + Salemi paper is a different work: **Shen, W.-M., Salemi, B. & Will, P. (2002). "Hormone-inspired adaptive communication and distributed control for CONRO self-reconfigurable robots." *IEEE Trans. Robotics and Automation* 18(5): 700–712.** Hormone-like messages propagate between physically coupled modules to coordinate locomotion and reconfiguration. — [ISI PRL page](https://robots.isi.edu/prl/b2hd-shen2002hormone-inspired-adaptive-communication-and-distributed.html)
- **Avila-García, O. & Cañamero, L. (2005). "Hormonal modulation of perception in motivation-based action selection architectures."** Status: VERIFIED for authors, title and year. The venue is in the University of Hertfordshire repository; it is believed to be the AISB'05 symposium "Agents that Want and Like" proceedings, but that was not confirmed on the record page, so treat the venue as UNVERIFIED. Mechanism: within the animat approach, motivations combine internal deficits with external cues. Artificial hormones modulate *perception* (incentive salience of cues) to improve adaptivity in dynamic and unpredictable robot scenarios. — [UH research profile](https://researchprofiles.herts.ac.uk/en/publications/hormonal-modulation-of-perception-in-motivation-based-action-sele/); [UHRA](https://uhra.herts.ac.uk/handle/2299/9886)
- **Krichmar, J. L. (2008). "The neuromodulatory system: A framework for survival and adaptive behavior in a challenging world." *Adaptive Behavior* 16(6): 385–399.** Status: VERIFIED. Mechanism: the vertebrate neuromodulatory systems (DA, 5-HT, NE, ACh) drive "value-laden responses to environmental challenges." The paper is a framework for neurorobots in which modulators switch the agent between modes (e.g., exploit vs. explore, approach vs. withdraw). — found via citing literature such as [Frontiers in Neurorobotics 2013 (PMC3564231)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3564231) and [arXiv 2105.10461](https://arxiv.org/pdf/2105.10461)
- **Doya, K. (2002). "Metalearning and neuromodulation." *Neural Networks* 15(4–6): 495–506. DOI 10.1016/S0893-6080(02)00044-8, PMID 12371507.** Status: VERIFIED. It appeared in a 2002 special issue on computational models of neuromodulation. Mapping: dopamine is the TD error; serotonin is the discount factor γ; noradrenaline is the inverse temperature β of softmax (the exploration–exploitation trade-off); acetylcholine is the learning rate α. — [Neural Networks special issue TOC (connectionists)](https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2002-August/020829.html); [dblp NN vol. 15](https://dblp1.uni-trier.de/db/journals/nn/nn15.html); mapping summarized in [Emotion in RL agents survey, arXiv 1705.05172](https://arxiv.org/pdf/1705.05172) and [Lifelong RL via Neuromodulation, arXiv 2408.08446](https://arxiv.org/pdf/2408.08446)
- **Yu, A. J. & Dayan, P. (2005). "Uncertainty, neuromodulation, and attention." *Neuron* 46(4): 681–692.** Status: VERIFIED. Mechanism: ACh reports *expected uncertainty*, the known unreliability of cues within a context. NE reports *unexpected uncertainty*, i.e., unsignaled context switches that produce strongly unexpected observations. The two signals interact to support near-optimal inference and learning in noisy, changing environments. A related paper, Yu & Dayan, "Norepinephrine and neural interrupts" (NIPS 2005), treats NE as a "reset/interrupt." — [ModelDB citation](https://modeldb.science/citations/233488); [NIPS 2005](https://proceedings.neurips.cc/paper/2005/hash/b2ea5e977c5fc1ccfa74171a9723dd61-Abstract.html)

### Inferences
- **What Fagi already has implicitly.**
  - Interoceptive reward already plays the role of a dopamine-like TD error.
  - The "doubt everything after a surprise" behavior is an unexpected-uncertainty (NE) reset.
  - The hysteresis on rules is a fixed, hand-set confidence threshold.
  - The Lorenz drives are already a slow, hydraulic, hormone-like state.

  What is missing is to make these *explicit global scalars on the bus*, so that one signal coherently retunes many organs, instead of each organ hard-coding its own parameters.
- **Proposal: "Humors" as bus broadcast channels.** Add 3–5 scalar hormone channels on the deterministic message bus. Each one has a gland (the producer organ), a secretion rule, an exponential decay half-life, and a receptor gain per consuming organ. Unlike nerves, they have no per-target addressing: every subscribed organ reads the same value at tick *t* (with an optional diffusion delay). A Doya-style mapping onto existing Fagi parameters:
  - **DA**: the interoceptive reward prediction error from episodes. It gates Hebbian sense→concept synapse updates (three-factor Hebbian rule: Δw = η · pre · post · DA).
  - **5-HT**: the discount or patience over how far ahead the free-flow selector values options. It rises with satiety and safety near the nest and falls with hunger (Lorenz drive level). Low 5-HT means more impulsive, near-reward choices.
  - **NE**: (a) the softmax temperature in free-flow selection, and (b) a "reset" signal emitted when the surprise exceeds k·σ. That reset lowers confidence on rules touching the surprising concept, which formalizes "doubt everything after a surprise" as Yu & Dayan's unexpected uncertainty.
  - **ACh**: the learning rate on value and confidence estimates, raised by *expected* uncertainty, i.e., the known variance of a concept's outcome. It is also a gain on sensory nerves relative to top-down priors (attention).
  - **"Cortisol"/stress** (Neal & Timmis timidity): a slow hormone secreted on damage or aversive bites. It suppresses approach to novel concepts and lengthens nerve-response hysteresis. This is the endocrine "timidity" mechanism.
- **Receptor plasticity (AANE-style).** Following Timmis, Neal & Thorniley, let the receptor gains themselves adapt slowly, e.g., downregulate under chronic hormone exposure. A failing or noisy nerve should then reduce its own contribution, which gives graceful degradation as organs and nerves are perturbed.
- **Determinism.** All of the above are scalar ODE or difference equations updated in a fixed bus order. They are fully reproducible with the seeded RNG; only NE-temperature sampling draws from the RNG.
- **Falsifiable predictions.**
  1. *Unexpected vs expected uncertainty.* Use two seeded worlds. In world A, a food type's reward is noisy but stationary (expected uncertainty). In world B, the same mean reward flips sign at day N (unexpected uncertainty). With separate ACh/NE channels, Fagi in A should *not* drop rule confidence after single bad bites, and in B should re-learn within fewer bites than a single-learning-rate baseline. If ACh/NE separation gives no difference in bites-to-relearn over ≥20 seeds, the mapping adds nothing.
  2. *Timidity.* After a single toxic bite, a stress hormone with a half-life of H ticks should produce a measurable, decaying reduction in approach to *novel* concepts, not only to the toxic one. Latency to the first novel bite should scale with H. If novel approach is unaffected, the hormone is not acting globally.
  3. *Serotonin/patience.* Raising 5-HT tonically, e.g., when satiated, should increase choice of distant high-value food over near low-value food. The effect should be monotonic in γ.

### Gaps
- Krichmar 2008: no publisher page was fetched (the SAGE page was not retrieved). Volume, issue and pages were confirmed only via secondary citations, consistently.
- The exact venue of Avila-García & Cañamero (2005) was not confirmed. A related Cañamero-lab paper exists ("The importance of the body in affect-modulated action selection…"), but its details were not retrieved.
- The issue number of Neal & Timmis (2003) differs across indexes (2 vs 4).

---

## Q2. Sleep-dependent consolidation and replay: what does each theory claim, and which mechanisms suit a deterministic simulation?

### Takeaway
Six ideas, all compatible and all implementable offline in Fagi's nest phase:
1. Replay: place-cell co-firing during waking is re-expressed in sleep (Wilson & McNaughton 1994).
2. Complementary learning systems: a fast episodic store teaches a slow structured store through *interleaved* replay, which avoids catastrophic interference (CLS; McClelland et al. 1995; Kumaran et al. 2016).
3. Synaptic homeostasis: waking learning potentiates synapses, and sleep renormalizes or downscales them (SHY; Tononi & Cirelli 2006, 2014).
4. Model-based "dreaming": simulated experience from a learned model trains values or policy (Dyna 1991; World Models 2018; Dreamer 2020).
5. NREM replay abstracts rules, and REM replay recombines memories to create novel associations (Lewis, Knoblich & Poe 2018).
6. Dreams are noise-injected, corrupted inputs that fight overfitting (Hoel 2021).

Fagi's nightly phase already does a little of (2) and (5) (it proposes questions). The redesign could add explicit replay, downscaling, imagined rollouts and "corrupted dreams."

### Cited Findings
- **Wilson, M. A. & McNaughton, B. L. (1994). "Reactivation of hippocampal ensemble memories during sleep." *Science* 265(5172): 676–679.** Status: VERIFIED. Mechanism: in three rats, place cells that co-fired at the same locations during behavior showed increased co-firing in *subsequent* slow-wave sleep compared with sleep before the task. "Information acquired during active behavior is thus re-expressed in hippocampal circuits during sleep." — [PubMed 8036517](https://pubmed.ncbi.nlm.nih.gov/8036517/)
- **McClelland, J. L., McNaughton, B. L. & O'Reilly, R. C. (1995). "Why there are complementary learning systems in the hippocampus and neocortex: Insights from the successes and failures of connectionist models of learning and memory." *Psychological Review* 102(3): 419–457.** Status: VERIFIED. Mechanism: the hippocampus rapidly stores sparse, pattern-separated episodes and reinstates them in the neocortex. Neocortical synapses change "a little on each reinstatement," so the slow system integrates across episodes and extracts structure. Interleaving avoids catastrophic interference. — [Stanford PDF](https://stanford.edu/%7Ejlmcc/papers/McCMcNaughtonOReilly95.pdf)
- **Kumaran, D., Hassabis, D. & McClelland, J. L. (2016). "What learning systems do intelligent agents need? Complementary learning systems theory updated." *Trends in Cognitive Sciences* 20(7): 512–534. DOI 10.1016/j.tics.2016.05.004.** Status: VERIFIED. Updates: replay permits *goal-dependent weighting* of experience statistics, i.e., prioritized replay rather than uniform replay. Recurrent activation of hippocampal traces supports some generalization. Neocortical learning can be *rapid* when new information is consistent with known structure (schemas). — [Stanford PDF](https://web.stanford.edu/~jlmcc/papers/KumaranHassabisMcClelland16FinalMS.pdf)
- **Tononi, G. & Cirelli, C. (2006). "Sleep function and synaptic homeostasis." *Sleep Medicine Reviews* 10(1): 49–62.** Status: VERIFIED. SHY: waking plasticity produces a net increase in synaptic strength. Sleep downscales strength to a baseline that is energetically sustainable and beneficial for learning. — [PubMed 16376591](https://pubmed.ncbi.nlm.nih.gov/16376591/)
- **Tononi, G. & Cirelli, C. (2014). "Sleep and the price of plasticity: From synaptic and cellular homeostasis to memory consolidation and integration." *Neuron* 81(1): 12–34.** Status: VERIFIED. Waking learning increases energy needs, decreases signal-to-noise and saturates learning. During sleep, spontaneous activity renormalizes net synaptic strength. Downscaling is selective, so strongly or repeatedly activated traces survive better relative to the rest, which improves SNR. — [PMC3921176](https://pmc.ncbi.nlm.nih.gov/articles/3921176/); [Lab page](https://cirelli-tononi-lab.psychiatry.wisc.edu/?p=1666)
- **Sutton, R. S. (1991). "Dyna, an integrated architecture for learning, planning, and reacting."** Status: PARTIAL. It is widely cited as *ACM SIGART Bulletin* 2(4): 160–163 (1991). The University of Alberta papersdb lists it under AAAI proceedings, pp. 160–163, 1991, and the DOI could not be checked because Crossref was blocked. Use "SIGART Bulletin 2(4):160–163" with that caveat. Mechanism: the same learning rule updates values from real experience *and* from simulated experience generated by a learned (possibly incorrect) world model. Planning is incremental, and execution is fully reactive, with "no planning [intervening] between perception and action." — [UAlberta papersdb](https://papersdb.cs.ualberta.ca/~papersdb/view_publication.php?pub_id=500); [SIGART vol. 2 index](https://vldb.org/dblp/db/journals/sigart/sigart2.html)
- **Ha, D. & Schmidhuber, J. (2018). "Recurrent world models facilitate policy evolution." *NeurIPS 2018 (Advances in NeurIPS 31)*.** The arXiv preprint "World Models" is 1803.10122; the NeurIPS version is a separate listing. Status: VERIFIED for the NeurIPS version. Mechanism: a generative recurrent model is trained unsupervised. A compact controller is evolved on its features, and an agent is trained *entirely inside its own dream* and transferred back to the real environment. — [NeurIPS proceedings](https://papers.nips.cc/paper/7512-recurrent-world-models-facilitate-policy-evolution); [arXiv 1809.01999](https://arxiv.org/pdf/1809.01999)
- **Hafner, D., Lillicrap, T., Ba, J. & Norouzi, M. (2020). "Dream to control: Learning behaviors by latent imagination." *ICLR 2020*. arXiv 1912.01603.** Status: VERIFIED. Mechanism: behaviors are learned purely from trajectories imagined in a learned latent world model, with value gradients backpropagated through the imagined rollouts. — [ICLR 2020](https://iclr.cc/virtual/2020/poster/1737); [Project page](https://danijar.com/project/dreamer/)
- **Lewis, P. A., Knoblich, G. & Poe, G. (2018). "How memory replay in sleep boosts creative problem-solving." *Trends in Cognitive Sciences* 22(6): 491–503.** Status: VERIFIED for authors, title, journal and June 2018. Volume and pages are recalled from memory and are consistent with June 2018, but were not shown on the fetched pages. Mechanism: NREM replay *abstracts rules* from learned information. REM replay *promotes novel associations*. Iterative interleaving of NREM and REM across the night builds and then restructures knowledge frameworks. The authors sketch a computational model to test this. — [PMC7543772](https://pmc.ncbi.nlm.nih.gov/articles/PMC7543772/); [Cardiff ORCA](https://orca.cardiff.ac.uk/id/eprint/111453/)
- **Hoel, E. (2021). "The overfitted brain: Dreams evolved to assist generalization." *Patterns* 2(5): 100244. DOI 10.1016/j.patter.2021.100244.** Status: VERIFIED. Mechanism: daily learning overfits. Dreams supply *corrupted, sparse, hallucinatory* inputs generated stochastically, analogous to noise injection, dropout or data augmentation in deep networks, which improves generalization. Dream loss should therefore impair generalization but not memorization. — [PMC8134940](https://pmc.ncbi.nlm.nih.gov/articles/PMC8134940); [arXiv 2007.09560](https://arxiv.org/pdf/2007.09560)

### Inferences
- **What Fagi already has.** A nightly consolidation in the nest that converts doubts into next-day experiments. This is a hypothesis-generation phase in the spirit of Lewis et al.'s REM-like recombination, plus a curiosity hook. What Fagi lacks is: (i) explicit *replay of stored episodes* to update values and synapses offline (Dyna/CLS); (ii) *synaptic downscaling* of the Hebbian sense→concept weights (SHY); and (iii) staged NREM→REM cycles with distinct jobs.
- **Proposal: a "Sleep organ" with three deterministic stages, run while drives are low and Fagi is in the nest.**
  1. **NREM-replay (CLS + Dyna).** Sample episodes from the day buffer with *prioritized* weights, where priority = |interoceptive RPE| × recency × drive-relevance (Kumaran 2016's goal-dependent weighting). Use a seeded RNG. Interleave each replayed episode with older consolidated episodes or prototypes to avoid interference. Replay updates value and confidence slowly, with a small α (the "neocortical" store), while the day buffer is the fast store. Only rules whose consolidated value and confidence cross the hysteresis band are (re)written. This is where the symbolic rule synthesizer should run (see Q4).
  2. **SHY downscaling.** Multiply all Hebbian sense→concept weights by a factor <1, or subtract a constant, after replay. Synapses re-potentiated by replay survive; one-off coincidences decay. This bounds weight growth over many simulated days and should raise the selectivity of concepts.
  3. **REM-dream (recombination + Hoel noise).** Generate synthetic episodes by recombining features of different concepts, e.g., the color of A with the smell of B, or by corrupting sensory vectors with seeded noise and dropout. Run them through the world model to produce *predictions with high disagreement*. These become the morning's doubts and questions, which is the existing mechanism, now grounded in a principled generator. Optionally, imagined Dyna rollouts update values only when the model's confidence is high.
- **Nerves during sleep.** During sleep, gate external sensory nerves off (raise the threshold) and route replay through the same internal concept→value pathways. This makes "replay" literally reuse the organ graph, as in Ha & Schmidhuber's training inside the dream.
- **Falsifiable predictions.**
  1. *Replay improves sample efficiency (Dyna).* With replay enabled, Fagi should reach a criterion (e.g., ≥90% correct accept/reject of foods) in fewer *real* bites than with replay ablated, across ≥20 seeds. No difference refutes the benefit at Fagi's scale.
  2. *Interleaving prevents interference (CLS).* After learning food set A, then set B, Fagi's accuracy on A should drop less with interleaved replay (B + old A) than with B-only replay.
  3. *SHY downscaling improves selectivity.* Without downscaling, the mean Hebbian weight and the number of active sense→concept links should grow roughly linearly with days, and false-positive concept activations should rise. With downscaling, both should plateau.
  4. *Hoel noise aids generalization, not memorization.* Train on N food exemplars. With noisy REM dreams, accuracy on *novel* exemplars of the same category should rise, while accuracy on trained exemplars stays unchanged.
  5. *Lewis et al. ordering.* NREM (rule abstraction) followed by REM (recombination) should yield more *useful* next-day experiments than the reverse order or REM only. "Useful" means experiments that change a rule.

### Gaps
- The volume and pages of Lewis et al. 2018 are not shown on fetched pages (22(6):491–503 is from memory).
- The Dyna venue conflict (SIGART Bulletin vs AAAI) is unresolved; the DOI lookup was blocked.
- The arXiv 1803.10122 "World Models" preprint was not separately fetched.
- No direct sources were fetched on prioritized experience replay (Schaul et al. 2016), which would support the priority formula.

---

## Q3. Curiosity and self-generated experiments: which mechanisms best fit Fagi's "trial bites"?

### Takeaway
- Schmidhuber (1991) rewards *improvement* of the world model (curiosity), which yields boredom when learning saturates.
- Oudeyer, Kaplan & Hafner (2007) operationalize this as *learning progress* (LP), computed per region of sensorimotor space. Agents prefer situations that are neither too predictable nor too unpredictable, which avoids noise traps.
- Gottlieb et al. (2013) frame curiosity and attention as information-seeking with a value of information.
- King et al. (2009) close the loop with a robot scientist that generates hypotheses and chooses experiments to test them.

Fagi's question-driven trial bites are a primitive robot-scientist loop. The key upgrade is to *score candidate experiments by expected learning progress per concept*, not raw uncertainty, so Fagi does not get stuck repeatedly testing inherently random foods.

### Cited Findings
- **Schmidhuber, J. (1991). "A possibility for implementing curiosity and boredom in model-building neural controllers." In *Proc. Int. Conf. on Simulation of Adaptive Behavior: From Animals to Animats* (SAB'90 proceedings, MIT Press/Bradford, 1991), pp. 222–227.** Status: VERIFIED for title, venue and year. Page numbers are from memory and were not shown in the results. Mechanism: a curious model-building controller provokes situations where it *expects to learn*. It is a four-network system using Q-learning to maximize the expected temporal derivative of the reliability of future predictions. When predictions stop improving, the reward vanishes, which produces boredom. — [mlanthology](https://mlanthology.org/misc/1991/schmidhuber1991misc-curious); [TUM mediatum](https://mediatum.ub.tum.de/node?id=814958)
- **Oudeyer, P.-Y., Kaplan, F. & Hafner, V. V. (2007). "Intrinsic motivation systems for autonomous mental development." *IEEE Transactions on Evolutionary Computation* 11(2): 265–286.** Status: VERIFIED for vol., issue and start page 265. The end page 286 is standard but not shown. Mechanism: Intelligent Adaptive Curiosity (IAC). The sensorimotor space is split into regions, each with its own expert predictor. The reward is the *decrease of prediction error over a time window* (learning progress) in each region. This pushes the robot toward situations "neither too predictable nor too unpredictable" and produces developmental stages. — [EPFL Infoscience](https://infoscience.epfl.ch/record/115468?ln=en); [PDF (HU Berlin)](https://adapt.informatik.hu-berlin.de/pub/papers/ims.pdf)
- **Gottlieb, J., Oudeyer, P.-Y., Lopes, M. & Baranes, A. (2013). "Information-seeking, curiosity, and attention: Computational and neural mechanisms." *Trends in Cognitive Sciences* 17(11): 585–593.** Status: VERIFIED. It reviews information seeking across machine learning (intrinsic motivation, active learning), eye movements in natural behavior, and the psychology and neuroscience of curiosity. Attention and curiosity are treated as active sampling decisions with a value of information. — [PMC4193662](https://pmc.ncbi.nlm.nih.gov/articles/PMC4193662)
- **King, R. D., Rowland, J., Oliver, S. G., Young, M., Aubrey, W., Byrne, E., Liakata, M., Markham, M., Pir, P., Soldatova, L. N., Sparkes, A., Whelan, K. E. & Clare, A. (2009). "The automation of science." *Science* 324(5923): 85–89.** Status: VERIFIED. Mechanism: the Robot Scientist "Adam" autonomously generated functional-genomics hypotheses about *S. cerevisiae*, designed and ran experiments on lab automation, and interpreted the results. Its conclusions were confirmed by manual experiments. This is a closed hypothesis → experiment → revision loop with a logical knowledge representation. — [Aberystwyth record](https://research.aber.ac.uk/en/publications/the-automation-of-science/); [WRAP](https://wrap.warwick.ac.uk/id/eprint/54739)

### Inferences
- **What Fagi already has.** The overnight doubt generator plus next-day trial bites is a robot-scientist loop: hypothesize, experiment, update. What is missing:
  - (i) an *explicit utility* for choosing which experiment to run;
  - (ii) *learning-progress bookkeeping* to detect unlearnable concepts (noise traps);
  - (iii) integration of curiosity as a *drive* competing in free-flow selection, rather than a scheduled agenda.
- **Proposal: a curiosity drive with learned releasers.**
  - Make curiosity a Lorenz-style drive whose "reservoir" fills with time and with accumulated LP opportunities.
  - Releasers are the concepts with the highest *expected learning progress*. Per concept c, maintain prediction error e_c(t) over sliding windows. LP_c = mean(e_c over older window) − mean(e_c over recent window), following the IAC formula. Concepts with high error but zero LP are tagged "inherently noisy" and lose curiosity value. That is boredom, and it prevents compulsive re-tasting of random foods.
  - In free-flow selection, curiosity adds a bonus κ·LP_c to the activation of actions that probe concept c, e.g., a small trial bite or a sniff. κ is scaled by safety: low stress hormone and adequate energy (Lorenz hunger is not critical). This ties curiosity to the hormones of Q1: NE raises exploration and stress suppresses it.
  - Overnight, the Sleep organ ranks the doubts proposed by REM-recombination by expected LP times cost-safety, which is a value of information (Gottlieb et al.). Only the top-k become the next day's "experiment agenda," and each is logged with the hypothesis it tests (Adam-style provenance). After the experiment, record whether the rule changed, so the hypothesis generator itself can be scored.
  - The calculation is deterministic: LP uses windowed means over the episode log, and ties are broken by seeded RNG.
- **Falsifiable predictions.**
  1. *Noise-trap avoidance (IAC).* Place a "slot-machine" food with purely random reward next to a learnable food. A raw-uncertainty curiosity Fagi should keep sampling the slot machine. An LP-curiosity Fagi should stop sampling it after a bounded number of bites and shift effort to the learnable food. Measure the fraction of experimental bites spent on the noise source over days.
  2. *Developmental ordering.* With LP-curiosity, Fagi should master concepts in order of learnability (easy → hard), producing stage-like plateaus in per-concept error. Random experiment choice should not produce this order.
  3. *Experiment quality.* Value-of-information–ranked overnight experiments should change more rules per bite than randomly selected doubts.

### Gaps
- Oudeyer's later learning-progress papers (e.g., Baranes & Oudeyer SAGG-RIAC 2013; Oudeyer & Kaplan 2007 "What is intrinsic motivation?" *Frontiers in Neurorobotics*) were not verified in this pass.
- The page numbers of Schmidhuber 1991 are not confirmed by fetched sources.
- Adam's hypothesis-selection criterion (e.g., cost-weighted, logic-based abduction) was not retrieved in detail. Only the closed-loop design is confirmed.

---

## Q4. Self-written symbolic rules and programs: what prior work matches Fagi's JS-DSL rules, and what would improve them?

### Takeaway
Fagi's rule synthesizer, which turns learned value and confidence into DSL rules with hysteresis, sits between learning classifier systems (LCS/XCS) and program-synthesis library learning.
- XCS contributes *accuracy-based* rule fitness and credit assignment.
- DreamCoder contributes a literal *wake/sleep* cycle: wake solves tasks with the current library; sleep *abstracts* reusable sub-programs into the library and *dreams* fantasy tasks to train the search policy.
- Voyager contributes an ever-growing *skill library of executable code*, verified by environment feedback.
- ILP contributes logic rules induced from positive and negative examples with background knowledge.
- Lake et al. supply the rationale: causal models, compositionality, learning-to-learn.

The best upgrade is a DreamCoder-like "compression" step during sleep. It refactors the day's rules into shared sub-predicates, and those sub-predicates become new concepts.

### Cited Findings
- **Ellis, K., Wong, C., Nye, M., Sablé-Meyer, M., Morales, L., Hewitt, L., Cary, L., Solar-Lezama, A. & Tenenbaum, J. B. (2021). "DreamCoder: Bootstrapping inductive program synthesis with wake-sleep library learning." *Proc. 42nd ACM SIGPLAN Int. Conf. on Programming Language Design and Implementation (PLDI '21)*, June 20–25, 2021.** Status: VERIFIED for venue and year. The author list is from the CSAIL PDF filename "EllisWNSMHCST21" and is consistent with the list above. Mechanism:
  - Input is a corpus of synthesis tasks given by examples. The system learns (i) a *library* of program components and (ii) a *neural search policy*, which bootstrap each other via wake-sleep approximate Bayesian learning.
  - The sleep "abstraction" phase uses an E-graph–based refactoring algorithm to find common sub-components across solved programs, building a progressively deeper library.
  - The sleep "dreaming" phase trains the recognition model on replayed and fantasized tasks.
  - It was evaluated on eight domains, including planning, inverse graphics and equation discovery.
  - Sources: [PLDI'21 page](https://pldi21.sigplan.org/details/pldi-2021-papers/55/DreamCoder-Bootstrapping-Inductive-Program-Synthesis-with-Wake-Sleep-Library-Learnin); [CSAIL PDF](https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf); [MIT DSpace](https://dspace.mit.edu/handle/1721.1/145949)
- **Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L. & Anandkumar, A. (2023). "Voyager: An open-ended embodied agent with large language models." arXiv:2305.16291.** Status: VERIFIED as arXiv May 2023. The author list is from memory and consistent with the NVIDIA/Caltech/UT Austin/Stanford/UW-Madison affiliation; it was later published at TMLR, which was not checked. Mechanism: (1) an automatic curriculum maximizing exploration; (2) an ever-growing skill library of *executable code*; (3) iterative prompting with environment feedback, execution errors and self-verification. Skills are "temporally extended, interpretable, and compositional," which "alleviates catastrophic forgetting." It obtained 3.3× more unique items than the prior state of the art. — [arXiv 2305.16291](https://arxiv.org/abs/2305.16291v2)
- **Lake, B. M., Ullman, T. D., Tenenbaum, J. B. & Gershman, S. J. (2017). "Building machines that learn and think like people." *Behavioral and Brain Sciences* 40: e253.** Status: VERIFIED. It argues that human-like learners should (1) build *causal models* supporting explanation; (2) ground learning in intuitive physics and psychology; and (3) use *compositionality* and *learning-to-learn*. — [arXiv 1604.00289](https://arxiv.org/abs/1604.00289); [MIT DSpace](https://dspace.mit.edu/handle/1721.1/102089)
- **Muggleton, S. (1991). "Inductive logic programming." *New Generation Computing* 8(4): 295–318. DOI 10.1007/BF03037089.** Status: VERIFIED. ILP is the seminal formulation of inducing logic programs (rules) from positive and negative examples plus background knowledge. — [Unpaywall/DOI](https://unpaywall.org/10.1007%2FBF03037089); [ChessProgramming bio](https://www.ChessProgramming.org/Stephen_Muggleton)
- **Wilson, S. W. (1995). "Classifier fitness based on accuracy." *Evolutionary Computation* 3(2): 149–175.** Status: VERIFIED. XCS replaced strength-based fitness with fitness based on the *accuracy* of a rule's payoff prediction. Each condition→action rule keeps a prediction p, an error ε and a fitness F. A niche-based genetic algorithm generalizes rules; Q-learning-like updates assign credit. Historically used in animat tasks such as "Woods" environments. — [Monash lecture notes](https://www.csse.monash.edu.au/~jonmc/CSE451/Topics/Resources/FIT4012_1_Lecture8.pdf); [arXiv 1211.0424](https://arxiv.org/pdf/1211.0424)
- Holland's original classifier systems (Holland 1975/1986) were not separately verified in this pass.

### Inferences
- **What Fagi already has.** Rule synthesis from (value, confidence) with hysteresis is essentially a hand-designed XCS without the genetic algorithm. Value maps to XCS prediction p, confidence to accuracy and error ε, and hysteresis to a fitness threshold for rule deletion and creation. Concepts for things with no innate category are like ILP *predicate invention*. The nightly phase is half of DreamCoder's sleep: it generates "dreams" (questions) but does not *refactor the rule library*.
- **Proposal: three upgrades to the "Rule organ."**
  1. **XCS-style rule bookkeeping.** Each DSL rule carries a prediction, an error, a fitness, an experience count and a niche. Actions proposed by matching rules feed free-flow selection with fitness-weighted votes. Credit comes from DA (the TD error) on the bus. Generalization uses deterministic operators (e.g., widen a numeric threshold, drop a condition), proposed during sleep and kept only if replay accuracy does not fall. This gives the "subsumption" of specific rules by general ones.
  2. **DreamCoder-style abstraction in sleep.** After NREM replay, scan all rules for repeated condition sub-expressions, e.g., `smell>0.6 && color=="red"` appearing in several rules. Promote one to a named predicate or *new concept* when it reduces total description length (MDL: library size + Σ rule sizes). This is a simplified, deterministic version of DreamCoder's compression. A greedy common-subexpression search over the DSL AST is enough; E-graphs are not needed. The new predicate becomes a node that Hebbian sense→concept synapses can attach to, closing the loop between symbolic and subsymbolic learning.
  3. **Voyager-style verification and library.** Store rules and skills as executable JS functions with provenance: the episodes that justified them, and the experiment that confirmed them. A new rule enters the active library only after (a) replay verification on stored episodes and (b) at least one confirming real-world experiment from the curiosity agenda. This is a self-verification gate. Retired rules are archived, not deleted, so they can be revived on a context switch (NE reset). This mitigates forgetting.
- **Organ/bus integration.**
  - Rules are an organ that *subscribes* to concept-activation messages and *publishes* action-bias messages.
  - Hormones modulate it: ACh scales the rule-learning rate, NE lowers all rule confidences on a surprise, and stress raises the threshold for approach rules.
  - Drives gate which rule niches are active (e.g., food rules only when hunger exceeds its releaser threshold).
- **Falsifiable predictions.**
  1. *Compression → transfer.* With abstraction on, introduce a new food sharing a sub-feature combination with known foods. Fagi should form a correct rule for it in fewer bites than without abstraction, because the invented predicate already exists. Neither ablation nor MDL compression showing an advantage across ≥20 seeds refutes the claim.
  2. *Library size scaling.* With DreamCoder-style refactoring, the total DSL token count should grow sublinearly with the number of learned foods. Without it, growth should be roughly linear.
  3. *Accuracy vs strength (XCS).* When food payoffs differ in variance, accuracy-based rule fitness should keep reliable low-payoff rules, e.g., "never eat blue: always −1." Value-only fitness tends to discard them. Measure the frequency of repeated poisoning.
  4. *Verification gate.* Rules admitted only after a confirming experiment should show a lower later retraction rate than rules admitted on replay evidence alone.

### Gaps
- The exact author list and later venue of Voyager (TMLR 2024?) were not verified.
- The DreamCoder author list is inferred from the PDF filename and memory.
- Holland's LCS papers and Wilson's animat-specific XCS applications (e.g., "Woods2") were not fetched.

---

## Q5. Synthesis: which pieces Fagi already has implicitly, and how they plug into organs, nerves, drives and free-flow

### Takeaway
Fagi already contains rudimentary versions of most mechanisms: interoceptive RPE (dopamine), surprise-triggered doubt (NE reset), nightly hypothesis generation (REM recombination and the robot-scientist loop), and value/confidence rules with hysteresis (XCS-like). The redesign's message bus offers a natural place to make them explicit:
- hormones are broadcast scalars, as distinct from addressed nerves;
- sleep is a phase of the bus schedule in which sensory nerves are gated and replay traffic flows;
- curiosity is a Lorenz drive whose releasers are concepts with high learning progress;
- rules are an organ with XCS bookkeeping plus a sleep-time abstraction pass.

### Cited Findings
- Doya's four-modulator mapping provides a parameter-level contract for the hormone channels. — [Neural Networks 2002 special issue](https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2002-August/020829.html); summary in [arXiv 1705.05172](https://arxiv.org/pdf/1705.05172)
- Yu & Dayan's ACh/NE split matches Fagi's "doubt after surprise" behavior as unexpected-uncertainty handling. — [ModelDB](https://modeldb.science/citations/233488)
- CLS, SHY, Dyna and Hoel each specify a distinct, ablatable sleep operation: interleaved replay, downscaling, simulated updates and noisy dreams. — [McClelland 1995 PDF](https://stanford.edu/%7Ejlmcc/papers/McCMcNaughtonOReilly95.pdf); [Tononi & Cirelli 2014](https://pmc.ncbi.nlm.nih.gov/articles/3921176/); [Hoel 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8134940)
- IAC learning progress provides a concrete releaser metric for a curiosity drive. — [Oudeyer et al. 2007 PDF](https://adapt.informatik.hu-berlin.de/pub/papers/ims.pdf)
- DreamCoder's sleep abstraction provides the template for rule-library compression. — [CSAIL PDF](https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf)

### Inferences
- **Suggested bus additions.** Each is deterministic given the seed.
  - `hormone.<name>` topics carry a scalar level, a gland, a half-life and per-organ receptor gains. Examples: DA, 5HT, NE, ACh, STRESS.
  - `sleep.phase` takes the values `NREM_REPLAY`, `DOWNSCALE`, `REM_DREAM` and `WAKE`. While asleep, the sensory nerve threshold is set to ∞ and internal replay messages are injected with tagged provenance, so organs can distinguish real messages from replayed ones.
  - The `drive.curiosity` reservoir is fed by ΣLP. Its releasers are `concept.LP > θ`. Its output is a bias on probe actions in free-flow selection.
  - The `rule.*` organ publishes fitness-weighted action biases. During sleep it runs generalization and abstraction passes and emits `concept.new` for invented predicates.
- **Nerve latency and noise interact with hormones.** NE or ACh could *reduce* the effective noise of sensory nerves (a gain increase, "attention") at an energy cost. That gives a principled reason for latency and noise parameters to be state-dependent rather than fixed.
- **Experimental discipline.** Every mechanism above is an *ablation flag*, so each prediction can be tested as on vs off over N seeds with fixed worlds. This fits Fagi's deterministic, seeded simulation. Report effect sizes with seed-level confidence intervals.
- **Priority suggestion.** Considering cost and expected payoff, a reasonable order is:
  1. Doya/Yu-Dayan hormone channels, which mostly re-parameterize existing code;
  2. LP-curiosity, which fixes noise traps in trial bites;
  3. NREM replay and SHY downscaling;
  4. DreamCoder-style rule abstraction;
  5. Hoel-noise REM dreams.

### Gaps
- No source was found that combines *all* of these in one animat. The integration proposed here is an inference, not an established architecture.
- No source was found quantifying how much SHY downscaling helps in small Hebbian networks of Fagi's size. That is an open empirical question for the simulation itself.
