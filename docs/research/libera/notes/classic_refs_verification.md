# Classic action-selection, ethology and robotics references: verification

Method note: in this session WebFetch and curl were blocked by the egress proxy for every full-text host tried (era.ed.ac.uk, joannajbryson.org, sagepub, arxiv, PMC, scholarpedia, wikipedia, klha.at, tufts, biu.ac.il, Semantic Scholar, Crossref). Verification therefore rests on search-engine records from publisher and index pages: IEEE Xplore, T&F, SAGE, PubMed, PhilArchive, ERA handle, Cambridge, White Rose, and the CMU AI repository. No full text was read. Status labels:
- **VERIFIED**: bibliographic data confirmed by a publisher, index or repository record.
- **CORRECTED**: our version was wrong or imprecise.
- **PARTLY VERIFIED / UNVERIFIABLE**: say what is missing.

Items marked "(background knowledge)" come from the researcher's prior knowledge and could not be confirmed in this session.

## Q1. Exact citations: are the years and venues right?

### Takeaway
Almost every citation the project had was correct. Corrections:
- Maes "How to do the right thing" is **1989**, not 1990.
- Tyrrell's Adaptive Behavior paper runs to p. **419**, not 420.
- Hull 1943's publisher is "Appleton-Century", not "-Crofts".
- Hinde: the energy-model critique is **1960** (Symp. Soc. Exp. Biol. 14). The 1956 BJPS paper is a related critique of the unitary "drive" concept.
- "The world is its own best model" most likely comes from Brooks **1990** "Elephants don't play chess", not Brooks 1991.

### Cited Findings

**Lorenz 1950: VERIFIED.**
- Lorenz, K. (1950). The comparative method in studying innate behaviour patterns. *Symposia of the Society for Experimental Biology*, 4 (Physiological Mechanisms in Animal Behaviour), 221–268. — [klha.at PDF record](http://klha.at/papers/1950-InnateBehavior.pdf); [ResearchGate](https://www.researchgate.net/publication/232562788_The_comparative_method_in_studying_innate_behavior_patterns)
- This paper presents the psychohydraulic model: "a series of reservoirs, each filled with 'reaction specific energy' appropriate to a particular behaviour pattern". In the model, sign stimuli and the IRM operate the outlet valve. — [search summary of klha.at / Springer "Instinct in the '50s"](https://link.springer.com/article/10.1007/sBIPH-004-0537-z)
- No DOI exists. The publisher was Cambridge University Press for the SEB.

**Hinde: VERIFIED (both papers exist). The energy-model critique is the 1960 paper.**
- Hinde, R. A. (1960). Energy models of motivation. *Symposia of the Society for Experimental Biology*, 14 (Models and Analogues in Biology), 199–213. PMID 13714429. — [PubMed](https://pubmed.ncbi.nlm.nih.gov/13714429/); [Stella & Rose listing of SEB vol. XIV "Models and Analogues in Biology"](https://stellabooks.com/books/no-author/symposia-of-the-society-for-experimental-biology-number-xiv/816001)
- Hinde, R. A. (1956). Ethological models and the concept of 'drive'. *British Journal for the Philosophy of Science*, 6(24), 321–331. — [PhilArchive](https://dc2.philarchive.org/rec/HINEMA)
- Search summary of the 1960 paper: "the physiological evidence did not support a literal energy build-up in the hydraulic model". — [PubMed record via search](https://pubmed.ncbi.nlm.nih.gov/13714429/)

**Tinbergen 1951: not re-checked this session (background knowledge).**
- Tinbergen, N. (1951). *The Study of Instinct*. Oxford: Clarendon Press. This is the standard citation. It presents the hierarchical model of instinct centres and the innate releasing mechanism (IRM). (background knowledge)

**Tyrrell 1993 thesis: VERIFIED.**
- Tyrrell, T. (1993). *Computational Mechanisms for Action Selection*. PhD thesis, Centre for Cognitive Science, University of Edinburgh. Stable URL: https://era.ed.ac.uk/handle/1842/20257 — [ERA handle](https://era.ed.ac.uk/handle/1842/20257); [ERA PDF bitstream](https://era.ed.ac.uk/bitstreams/a3a0f465-74df-438a-9a9d-5ed62a43d0da/download)

**Tyrrell 1993 Adaptive Behavior paper: CORRECTED (end page).**
- Tyrrell, T. (1993). The use of hierarchies for action selection. *Adaptive Behavior*, 1(4), 387–419. https://doi.org/10.1177/105971239300100401 — [SAGE](https://journals.sagepub.com/doi/10.1177/105971239300100401)
- The end page is 419, not 420.
- A version also appeared in the SAB'92 proceedings, *From Animals to Animats 2* (MIT Press, 1993). — [Stewart Wilson/Tyrrell pages, York book index](https://www-users.york.ac.uk/~ss44/books/pages/t/TobyTyrrell.htm)
- Companion paper: Tyrrell, T. (1994). An evaluation of Maes's bottom-up mechanism for behavior selection. *Adaptive Behavior*, 2(4), 307–348. https://doi.org/10.1177/105971239400200401 — [SAGE DOI](https://doi.org/10.1177/105971239400200401). The volume and issue come from the DOI; pages 307–348 are background knowledge.

**Rosenblatt & Payton 1989: VERIFIED.**
- Rosenblatt, J. K., & Payton, D. W. (1989). A fine-grained alternative to the subsumption architecture for mobile robot control. *Proc. International Joint Conference on Neural Networks (IJCNN 1989)*, Washington DC, vol. 2, pp. 317–323. IEEE. https://doi.org/10.1109/IJCNN.1989.118717 — [Semantic Scholar](https://www.semanticscholar.org/paper/A-fine-grained-alternative-to-the-subsumption-for-Rosenblatt-Payton/221935fa9bd67e35d53701e8a9c52e6d3e388543); [ResearchGate](https://www.researchgate.net/publication/224740448_A_fine-grained_alternative_to_the_subsumption_architecture_for_mobile_robot_control)
- The paper is from Hughes Research Laboratories. Abstract gist: an architecture that "permits more flexible arbitration of commands between behaviors and provides incrementally added behaviors with complete access to the internal state of existing behaviors". — [same](https://www.semanticscholar.org/paper/A-fine-grained-alternative-to-the-subsumption-for-Rosenblatt-Payton/221935fa9bd67e35d53701e8a9c52e6d3e388543)

**Brooks 1986: VERIFIED.**
- Brooks, R. A. (1986). A robust layered control system for a mobile robot. *IEEE Journal of Robotics and Automation*, 2(1), 14–23 (March 1986). https://doi.org/10.1109/JRA.1986.1087032 — [IEEE Xplore](https://ieeexplore.ieee.org/document/1087032)

**Brooks 1991: VERIFIED.**
- Brooks, R. A. (1991). Intelligence without representation. *Artificial Intelligence*, 47(1–3), 139–159. https://doi.org/10.1016/0004-3702(91)90053-M. The DOI is background knowledge. — [Vidal library](https://jmvidal.cse.sc.edu/lib/brooks91b.html); [UT Austin reading list](https://www.cs.utexas.edu/~shivaram/readings/b2hd-Brooks1991.html)

**Gat 1998: VERIFIED.**
- Gat, E. (1998). On three-layer architectures. In D. Kortenkamp, R. P. Bonasso & R. Murphy (Eds.), *Artificial Intelligence and Mobile Robots: Case Studies of Successful Robot Systems* (pp. 195–210). Menlo Park, CA: AAAI Press / Cambridge, MA: MIT Press. — [BIU-hosted PDF (search record)](https://u.cs.biu.ac.il/~galk/teach/current/intsys/readings/on-three-layer-arch-tla-1998.pdf)

**Maes "How to do the right thing": CORRECTED (the year is 1989).**
- Maes, P. (1989). How to do the right thing. *Connection Science*, 1(3), 291–323. https://doi.org/10.1080/09540098908915643 — [Taylor & Francis](https://www.tandfonline.com/doi/abs/10.1080/09540098908915643)
- The abstract says the paper "provides global parameters to tune action selection behavior … goal orientedness versus situation orientedness, bias towards ongoing plans versus adaptivity, and sensitivity to goal conflicts". — [T&F](https://www.tandfonline.com/doi/abs/10.1080/09540098908915643); [Tufts PDF](https://www.cs.tufts.edu/comp/150BBR/papers/maesactionselection.pdf)
- Maes, P. (1990). Situated agents can have goals. *Robotics and Autonomous Systems*, 6(1–2), 49–70. These details are background knowledge, not verified this session.

**Hull 1943: CORRECTED (publisher name).**
- Hull, C. L. (1943). *Principles of Behavior: An Introduction to Behavior Theory*. New York: Appleton-Century.
- A search summary gave "Appleton-Century-Crofts". The 1943 imprint was Appleton-Century; the firm became Appleton-Century-Crofts only in 1948, which is background knowledge. — [TECFA summary of Hull's drive reduction](https://tecfa.unige.ch/themes/sa2/act-app-dos2-fic-drive.htm)

**Toates 1986: VERIFIED.**
- Toates, F. M. (1986). *Motivational Systems*. Cambridge: Cambridge University Press (Problems in the Behavioural Sciences series). ISBN 9780521318945 (pbk). — [Cambridge UP](https://www.cambridge.org/9780521318945); [CiNii](https://ci.nii.ac.jp/ncid/BA00255366)

**Bryson 2000: VERIFIED (the title varies between versions).**
- Bryson, J. J. (2000). Hierarchy and sequence vs. full parallelism in action selection. In J.-A. Meyer, A. Berthoz, D. Floreano, H. Roitblat & S. W. Wilson (Eds.), *From Animals to Animats 6: Proc. 6th Int. Conf. on Simulation of Adaptive Behavior (SAB 2000)*, Paris (pp. 147–156). Cambridge, MA: MIT Press. — [Bath research portal](https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/); [Springer chapter citing pp. 147–156](https://link.springer.com/chapter/10.1007/3-540-36559-1_7)
- The editor list is background knowledge.
- One version is titled "...in reactive action selection architectures". — [Bryson site](https://www.joannajbryson.org/publications/hierarchy-and-sequence-vs-full-parallelism-in-reactive-action-selection-architectures-postscript)

**Redgrave, Prescott & Gurney 1999: VERIFIED.**
- Redgrave, P., Prescott, T. J., & Gurney, K. (1999). The basal ganglia: a vertebrate solution to the selection problem? *Neuroscience*, 89(4), 1009–1023. ISSN 0306-4522. DOI 10.1016/S0306-4522(98)00319-4 (background knowledge). — [White Rose eprints](https://eprints.whiterose.ac.uk/107033)

**Other related items found:**
- Crabbe, F. L. (2002). Compromise candidates in positive goal scenarios. *From Animals to Animats 7* (SAB 2002), MIT Press, pp. 105–106. — [Crabbe PTRS paper (search record)](https://www.usna.edu/Users/compsci/crabbe/_files/documents/ptrs-paper.pdf)
- Crabbe, F. L. (2007). Compromise strategies for action selection. *Phil. Trans. R. Soc. B*, 362(1485), 1559–1571. — [PubMed 17428780](https://pubmed.ncbi.nlm.nih.gov/17428780/). The volume and pages are background knowledge.
- Avila-García, O., & Cañamero, L. (2004). Using hormonal feedback to modulate action selection in a competitive scenario. *From Animals to Animats 8 (SAB'04)*. — [search record](https://www.researchgate.net/publication/221531251_Analyzing_the_Performance_of_Winner-Take-All_and_Voting-Based_Action_Selection_Policies_within_the_Two-Resource_Problem)
- Avila-García, O., Cañamero, L., & te Boekhorst, R. (2003). Analyzing the performance of "winner-take-all" and "voting-based" action selection policies within the two-resource problem. *ECAL 2003*, LNCS 2801. — [Springer](https://link.springer.com/chapter/10.1007/978-3-540-39432-7_79). The co-author list and LNCS number are background knowledge.

### Inferences
- When citing Maes's spreading-activation network, use Maes (1989) Connection Science. Cite Maes (1990) only for the goal-oriented extension.
- For the Hinde critique of "energy" models, cite Hinde (1960). Hinde (1956) supports a broader point: a single unitary "drive" variable is a misleading explanatory construct.

### Gaps
- No full text could be opened, so page-level quotations could not be checked for any item.
- The SEB 1950 volume title and the exact pages of Tinbergen were not re-checked this session.

## Q2. Are the attributed claims accurate?

### Takeaway
The claims are broadly accurate, with three refinements:
- Tyrrell compared *more* mechanisms than the project listed, including the Hullian "drive model" and Tinbergen's hierarchy.
- Tyrrell's requirement list has **14 items**.
- The "world is its own best model" wording should be attributed carefully.

### Cited Findings

**Lorenz.**
- The model's core is a reservoir of reaction-specific (action-specific) energy, with sign stimuli and the IRM acting on the outflow valve. — [klha.at record / search summary](http://klha.at/papers/1950-InnateBehavior.pdf)
- Our other claims are standard readings of the 1950 figure (background knowledge):
  - accumulation lowers the threshold, so a weaker stimulus suffices;
  - overflow produces vacuum activity;
  - performing the act drains the reservoir.
- Lorenz frames the drained behaviour as the consummatory act. The diagram's spring is the inhibitory higher centre, and the scale-pan weight is the stimulus.
- Status: **VERIFIED in substance**. The specific sub-claims rest on background knowledge.

**Hinde (1960).**
- Hinde argued that physiological evidence does not support a literal accumulating energy. — [PubMed 13714429](https://pubmed.ncbi.nlm.nih.gov/13714429/)
- From background knowledge: Hinde also argued that energy models confound distinct uses of "energy". In his view, behaviour often stops because of stimuli from the consummatory situation or goal, not because the energy is used up. He found such models heuristically useful but misleading as mechanisms.
- Status: **VERIFIED in gist**.

**Tinbergen (1951).**
- Hierarchical organisation of instinct centres with innate releasing mechanisms. Status: **accurate (background knowledge)**.

**Tyrrell (1993): the simulated environment.**
- Tyrrell's simulator ("ANIMALS") poses 15 sub-problems, "getting food, reproducing, not getting lost, being vigilant for predators, etc.", with many internal and external stimuli and 35 low-level actions. — [ERA handle / thesis abstract via search](https://era.ed.ac.uk/handle/1842/20257); [CMU AI repository "animals" package](https://www.cs.cmu.edu/afs/cs/project/ai-repository/ai/areas/agents/animals/0.html)
- Our list ("food, water, predators, mates, sleep, temperature…") is plausible but was not verified item by item.
- Correction: the number to cite is **15 sub-problems / 35 actions**.

**Tyrrell (1993): the mechanisms compared.**
- He compared "the drive model, Lorenz's psycho-hydraulic model and Maes' spreading activation network" against Rosenblatt & Payton-style hierarchies. — [ERA abstract via search](https://era.ed.ac.uk/handle/1842/20257)
- The thesis also covers Tinbergen's hierarchy. That is background knowledge, not confirmed by snippet.

**Tyrrell (1993): conclusion.** Status: **VERIFIED in substance**.
- Abstract wording: the Rosenblatt & Payton approach, "with free flow of information, combination of evidence, and the ability to select compromise candidates", is supported. The problem "is intrinsically hierarchical", so "free-flow hierarchies are more suitable for action selection than non-hierarchical mechanisms". — [search record of thesis/AB abstract](https://journals.sagepub.com/doi/10.1177/105971239300100401)
- Tyrrell named his extended version "Extended Rosenblatt & Payton" (ERP). — [Bryson NIPS workshop slides](https://www.princeton.edu/~yael/NIPSWorkshop/BrysonSlides.pdf)
- Tyrrell judged that central aspects of Maes's design make it "not able to deal well with animal like action selection problems". — [Tyrrell 1994](https://doi.org/10.1177/105971239400200401)
- Nuance on "winner-take-all is worse": Tyrrell's argument is that hierarchies passing *activation down without early decisions* (free-flow) beat hierarchies making a winner-take-all choice at each level. His case against WTA is specifically about decisions taken at higher nodes before lower-level information is combined. It is not a blanket claim against WTA at the final action level: ERP still picks the single most-activated action at the bottom. (Thesis framing from background knowledge.)

**Tyrrell (1993): the requirements list.** Status: **PARTLY VERIFIED**.
- The list has **14 requirements**, drawn from ethology. — [Crabbe 2007, PMC2440772 via search](https://pmc.ncbi.nlm.nih.gov/articles/PMC2440772/)
- Requirement 12, quoted exactly: **"Compromise Candidates: the need to be able to choose actions that, while not the best choice for any one sub-problem alone, are best when all sub-problems are considered simultaneously."** Tyrrell justified it with a "council-of-ministers" analogy. — [Crabbe 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2440772/)
- The other 13 could not be retrieved verbatim. From background knowledge (unverified), the list includes:
  - dealing with all types of sub-problems;
  - persistence;
  - activation proportional to current error;
  - contiguous action sequences;
  - interrupt if necessary;
  - opportunism;
  - prefer consummatory over appetitive actions;
  - real-valued sensory information;
  - balance dithering and persistence;
  - fair access / sharing time among sub-problems;
  - compromise candidates;
  - use all available information;
  - uncertainty of sensory information;
  - learning.
- Treat these labels as approximate until checked against the thesis (ERA PDF, Chapter 4 or similar).

**Rosenblatt & Payton.**
- Fine-grained decomposition of behaviours into many small decision units with flexible command arbitration. — [Semantic Scholar](https://www.semanticscholar.org/paper/A-fine-grained-alternative-to-the-subsumption-for-Rosenblatt-Payton/221935fa9bd67e35d53701e8a9c52e6d3e388543); [DAI Edinburgh record](https://www.dai.ed.ac.uk/daidb/papers/documents/mt93134.html)
- Status: **VERIFIED**.

**Brooks 1986.**
- Abstract: "Layers of control system are built to let the robot operate at increasing levels of competence… asynchronous modules that communicate over low-bandwidth channels. Higher-level layers can subsume the roles of lower levels by suppressing their outputs. However, lower levels continue to function as higher levels are added." — [IEEE Xplore](https://ieeexplore.ieee.org/document/1087032)
- So layers, suppression and incremental construction are all **VERIFIED**.
- The paper body defines suppression (on inputs) and inhibition (on outputs); that detail is background knowledge.

**Brooks 1991.**
- The central thesis is verified: with incremental construction and strict coupling to the world through perception and action, "reliance on representation disappears". — [UT reading list summary](https://www.cs.utexas.edu/~shivaram/readings/b2hd-Brooks1991.html)
- The exact phrase **"the world is its own best model"** could not be confirmed in Brooks 1991 by search.
- From background knowledge, that wording appears in Brooks, R. A. (1990), "Elephants don't play chess", *Robotics and Autonomous Systems* 6(1–2), 3–15. Brooks 1991 uses close wording ("use the world as its own model").
- Status: **CORRECTED / attribution uncertain**. Cite Brooks 1990 for the exact phrase, or paraphrase if citing 1991.

**Gat 1998.**
- The paper describes three-layer architectures. From background knowledge, these are a reactive controller, a sequencer and a deliberator, and Gat characterises the layers by how they handle internal state.
- Status: **citation VERIFIED, content from background knowledge**.

**Maes 1989.**
- Spreading activation with global tuning parameters that trade goal-orientedness against situatedness and bias for ongoing plans against adaptivity. — [T&F abstract](https://www.tandfonline.com/doi/abs/10.1080/09540098908915643)
- Status: **VERIFIED**.

**Hull 1943 and Toates 1986.**
- Hull: drive reduction reinforces stimulus–response bonds. — [TECFA](https://tecfa.unige.ch/themes/sa2/act-app-dos2-fic-drive.htm)
- Toates: an account of motivational systems (hunger, thirst, sex) bridging motivation and learning theory, and of the goal-directed side of motivation. — [Cambridge UP](https://www.cambridge.org/9780521318945)
- Attributing **incentive motivation** to Toates is fair. Toates is a leading proponent of incentive-motivation models, in which motivation arises from an interaction of internal state and external incentive stimuli. That characterisation is background knowledge; the CUP blurb stresses goal-directedness.
- Status: **VERIFIED (citation)**.

### Inferences
- Within the project's sources, the key design message is reliable: Tyrrell argues for combining evidence from all sub-problems and deciding only at the motor-action level.
- That message supports "organs + drives + free-flow" over a priority WTA hierarchy.

### Gaps
- The verbatim text of Tyrrell's other 13 requirements needs the ERA PDF, which was blocked.
- Tyrrell's numerical results tables could not be retrieved.

## Q3. Has later work challenged or refined Tyrrell's "free-flow is best"?

### Takeaway
Yes. Bryson (2000) reported that a reactive hierarchical, sequence-based system outperformed Tyrrell's fully parallel free-flow hierarchy, in Tyrrell's own simulated environment. Crabbe found that the compromise actions Tyrrell prized bring only a small benefit. Avila-García & Cañamero found that the better of WTA and voting depends on the environment. Redgrave, Prescott & Gurney argue that the vertebrate brain uses a centralised selector (the basal ganglia) on top of parallel competing systems. "Free-flow is best" should therefore be presented as Tyrrell's 1993 result, not a settled law.

### Cited Findings

**Bryson (2000).**
- The paper "presents experimental results demonstrating an artificial reactive hierarchy-based system that outperforms fully parallel systems in a highly dynamic environment with a large number of conflicting goals". The work was conducted in Tyrrell's Simulated Environment and extends his comparison of action selection mechanisms. — [Bath research portal abstract](https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/); [Bryson PDF record](https://www.joannajbryson.org/s/hierarchy-and-sequence-vs-full-parallelism-in-action-selection.pdf)
- Bryson's motivation: hierarchical organisation "has become an unfashionable model… replaced by models based on parallel distributed processes or dynamical systems theory". — [same](https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/)
- The system was Bryson's POSH / Edmund-style reactive plans: hierarchical, with action sequences and prioritised drive collections. — [Springer BOD chapter](https://link.springer.com/chapter/10.1007/3-540-36559-1_7); [Bryson slides](https://www.princeton.edu/~yael/NIPSWorkshop/BrysonSlides.pdf)

**Crabbe (2002, 2007).**
- Analysing Tyrrell's requirement 12, Crabbe concluded "that optimal compromise behaviour has a surprisingly small benefit over non-compromise behaviour in the experiments performed". — [Crabbe 2007 (search record)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2440772/); [PubMed](https://pubmed.ncbi.nlm.nih.gov/17428780/)

**Avila-García, Cañamero & te Boekhorst (2003).**
- Compared "winner-take-all" and "voting-based" policies in the two-resource problem. The search summary says the adequacy of each depends on environmental conditions. — [Springer](https://link.springer.com/chapter/10.1007/978-3-540-39432-7_79)
- Their follow-up (SAB'04) added hormonal feedback to modulate selection. — [search record](https://www.researchgate.net/publication/221531251_Analyzing_the_Performance_of_Winner-Take-All_and_Voting-Based_Action_Selection_Policies_within_the_Two-Resource_Problem)

**Redgrave, Prescott & Gurney (1999).**
- "A selection problem arises whenever competing systems seek simultaneous access to restricted resources." They propose that "the vertebrate basal ganglia have evolved as a centralized selection device, specialized to resolve conflicts over access to limited motor and cognitive resources". — [White Rose](https://eprints.whiterose.ac.uk/107033)
- Gurney, Prescott & Redgrave (2001) and later models provide computational basal-ganglia selection. — [ModelDB 83560](https://modeldb.science/83560?tab=7)

### Inferences
- The evidence favours a hybrid:
  - drives and organs compute continuous urgencies, combined as in free-flow;
  - a centralised selector with hysteresis or persistence (basal-ganglia-like, or a WTA with latching) commits to one action;
  - a few explicit action sequences cover multi-step behaviours.
- Bryson's result suggests that pure free-flow is not necessarily superior once a hierarchy has good sequencing.
- Crabbe's result suggests that compromise actions are a minor benefit and should not drive the design.
- The project's planned replacement of *priority-rule* WTA (fixed ordering) with *drive-weighted* selection is still supported by all of these works. None of them defends fixed-priority rules.

### Gaps
- Bryson's quantitative results (mean lifespan or offspring counts, significance tests) could not be extracted because the PDF was blocked. From background knowledge, she reported her agent surviving longer than Tyrrell's ERP, with metrics still tied to reproduction in Tyrrell's environment. This needs confirmation from the PDF.
- The exact conclusions of the Avila-García & Cañamero 2004 SAB paper were not retrieved.

## Q4. Is Tyrrell's simulated environment publicly available or reimplemented?

### Takeaway
Yes, apparently. The CMU AI Repository hosts an "animals" package under areas/agents/animals/, described as Tyrrell's ANIMALS simulation system. Bryson reused the environment for her 2000 experiments.

### Cited Findings
- The CMU Artificial Intelligence Repository package "areas/agents/animals/" describes "ANIMALS", which "examines the problem of action selection when dealing with realistic, animal-like situations". It has 15 sub-problems and 35 low-level actions. — [CMU AI Repository](https://www.cs.cmu.edu/afs/cs/project/ai-repository/ai/areas/agents/animals/0.html)
- Bryson "implements POSH action selection on a simulated environment developed by Tyrrell (1993)". — [Springer BOD chapter search record](https://link.springer.com/chapter/10.1007/3-540-36559-1_7); [Bath portal](https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/)

### Inferences
- The original code is probably 1990s C, which is an assumption. It could serve as a benchmark spec: sub-problems, stimuli and actions to port into the JS creature for a like-for-like comparison of the WTA, free-flow and hybrid selectors.

### Gaps
- The code's language and licence, and whether Bryson published her modified version, could not be checked because the CMU page fetch was blocked.
