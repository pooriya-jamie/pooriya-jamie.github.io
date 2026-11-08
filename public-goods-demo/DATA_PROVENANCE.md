# Replay data provenance

This public replay contains session 1 from the saved run `live_20260918_152531`.
Session 1 is the first recorded session, selected for illustration rather than statistical representativeness.
It contains 24 LLM agents, six rounds, six groups of four per round, and 144 executed decisions.

The exporter reads the two source files below from the research project's saved `outputs/live_20260918_152531/` directory.
The original files remain unchanged. No API request or simulation is performed.

| Source file | SHA-256 of exact source bytes |
| --- | --- |
| `contribution_log_session_1.csv` | `6441346cc92029dc07c29b0fd28f7cc7134e52875cd18aac48a587e7eaed5643` |
| `schedule_session_1.json` | `d4dfc498d7aa3fb75483436efa1909cd579184a65c476bc7c95eb80c485d99c1` |

## Meaning of the values

Each agent receives 20 tokens per round. A decision's `contribution` is the recorded numeric action sent into the game calculations.
Its `payoff` is the saved payoff, checked against `20 - contribution + 0.4 * group contribution total`.
The 0.4 return goes to every group member, including agents contributing zero.
Group membership is copied from the saved schedule; agent and group IDs remain zero-based.
Stages, numeric values, identities, membership order, and persona keys are preserved.
Rounds, groups, and decision records are sorted for predictable display.

This is a replay of executed actions. No semantic recoding was applied, including where historical free-text explanations conflicted with a numeric action.
Persona labels describe assigned dispositions, not guaranteed behavior. A self-interested agent can therefore have a recorded positive contribution.
The baseline agents are untyped participants in mixed-persona groups; they are not a separate control population.
This single-session visualization does not establish causal influence, replication, or general human behavior.
The original model identity is not recorded in these decision files and is not inferred from today's configuration.

## Friendly display labels

The public data retains the original persona keys. The interface may use these labels:

| Source persona key | Display label |
| --- | --- |
| `altruistic` | Group-oriented |
| `self-interested` | Self-interested |
| `conditional` | Conditional cooperator |
| `uncertain` | Cautious |
| `baseline` | Untyped participant |

## Validation completed by the exporter

- Exactly 144 unique agent-round decisions, all stage 2, with no missing action, payoff, or fallback action.
- All 24 IDs appear exactly once in each of the six rounds.
- All 36 groups contain four distinct agents, and every CSV group agrees with the schedule.
- All 216 unordered pairings are distinct across the session.
- All 144 recorded payoffs match the payoff formula within 1e-9 tokens (maximum discrepancy: 0).
- Every contribution is an integer in [0, 20]; each agent has one consistent persona.

Only source identity, checksums, game rules, agent IDs/persona keys, groups, executed contributions, and payoffs are exported.
Raw explanations, prompts, API logs, credentials, API usage totals, participant data, and local absolute paths are excluded.

`data.js` SHA-256: `da9437469e3c1cb0f72da96782a8e6d9c1c0aa21d34c6dd9efa52e70849b9251`.

## Regenerate

The reusable `export_replay.py` is retained in the development workspace, outside the published website.
Run it with `--source-dir <saved-run-directory> --output-dir <public-goods-demo-directory>`.
The script uses only the Python standard library.
Validation completes before either public output is written. It updates only `data.js` and this provenance file in the selected output directory.
The data contract is `window.PUBLIC_GOODS_DEMO = { source, config, agents, rounds }`.
Each round has `groups: [{ id, members }]` and `decisions: [{ agentId, contribution, payoff }]`.
