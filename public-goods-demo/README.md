# Cascade Arena — browser replay

This is a static version of the research project's Cascade Arena dashboard. Open index.html or serve the website and visit /public-goods-demo/. All rendering and replay controls run in the browser. The original dashboard's live event connection is replaced by one saved, six-period session. No API key, model, or separate server is required.

- Play, pause, change speed, or select a period on the timeline. Six groups of four regroup each period. Colors and symbols are explained in the arena key.
- Hover over an agent to inspect its previous group; pin it via the arena, agent selector or decision feed. Labels A00–A23 match the recorded IDs. Links show contact history, not an estimated causal effect.
- The response chart plots recorded choices against the previous group's mean. Its fitted line is descriptive pooled OLS, not the study's Tobit estimate.
- Open the payoff calculator to change one agent's contribution, with its three partners' choices fixed. Both the replay and the JSON download retain the original decisions.

The data cover 24 simulated agents, 6 periods and 144 recorded decisions. Movement and token animations are illustrative; the recording does not supply individual response timings. The public feed includes numerical data only. See DATA_PROVENANCE.md for source hashes and field definitions.

The GitHub Pages project serves this directory as static assets. Its gallery entry is in _data/demos.yml and the screenshot is assets/img/demos/public-goods.png. From the repository root, use node --test bin/tests/public-goods*.test.cjs to run the data and replay checks in a shell that expands globs.
