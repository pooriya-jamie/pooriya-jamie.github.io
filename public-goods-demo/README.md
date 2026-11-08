# The cooperation lab

A browser-only public-goods experiment demo for Pooriya Jamie's website.

## Run

Open index.html directly, or serve the website repository with a static server and visit /public-goods-demo/. No installation, server-side computation, credentials, or LLM service is required. All scripts/styles are local, and playback uses the recorded session bundled in data.js.

The existing GitHub Pages/Jekyll deployment copies this directory unchanged. The demos listing entry is in _data/demos.yml and its screenshot is assets/img/demos/public-goods.png. No separate hosting service is needed.

## Interactions

- Play, pause, change playback speed, or choose a round.
- Select any agent. Its contribution, payoff, assigned approach, and previous-group feedback update together.
- Change the contribution slider to compute a hypothetical payoff with the other three contributions held fixed. This never alters the replay or the downloaded data.
- Download the recorded session as JSON, including source hashes.

The replay contains one authentic recorded LLM simulation session, not live responses or human participant data. Assigned dispositions do not guarantee that actions conform to those labels. No raw explanations are displayed. See DATA_PROVENANCE.md for sources and validation.

## Verification

From the website root, run Node's built-in tests:

    node --test bin/tests/public-goods-demo.test.cjs

The four-person payoff is 20 minus own contribution plus 0.4 times the group's total contribution. The UI shows prior-round groupmates as interaction context; it makes no claim that a visual connection establishes a causal influence.
