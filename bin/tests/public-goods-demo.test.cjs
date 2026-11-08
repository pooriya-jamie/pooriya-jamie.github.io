/* Offline checks: run node --test bin/tests/public-goods-demo.test.cjs. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const demoPath = path.join(root, "public-goods-demo");
const Core = require(path.join(demoPath, "core.js"));
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(demoPath, "data.js"), "utf8"), sandbox);
const data = JSON.parse(JSON.stringify(sandbox.window.PUBLIC_GOODS_DEMO));
const clone = (value) => JSON.parse(JSON.stringify(value));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, String(actual) + " != " + String(expected));

test("public replay is one complete recorded 24-agent, six-round session", () => {
  assert.doesNotThrow(() => Core.validateData(data));
  assert.deepEqual(data.config, { agents: 24, rounds: 6, groupSize: 4, endowment: 20, mpcr: 0.4 });
  assert.equal(data.source.kind, "recorded-llm-session");
  assert.equal(data.source.runId, "live_20260918_152531");
  assert.equal(data.source.sessionId, 1);
  assert.equal(data.source.stage, 2);
  assert.equal(data.source.model, null);
  assert.equal(data.source.files.length, 2);
  data.source.files.forEach((file) => assert.match(file.sha256, /^[a-f0-9]{64}$/));
  assert.deepEqual(
    data.agents.map((agent) => agent.id).sort((a, b) => a - b),
    Array.from({ length: 24 }, (_, i) => i)
  );
  assert.deepEqual(
    data.rounds.map((round) => round.round),
    [1, 2, 3, 4, 5, 6]
  );
  assert.equal(
    data.rounds.reduce((count, round) => count + round.decisions.length, 0),
    144
  );
});

test("every round partitions all agents and no pair ever repeats", () => {
  const seenPairs = new Set();
  for (const round of data.rounds) {
    assert.equal(round.groups.length, 6);
    assert.equal(new Set(round.groups.map((group) => group.id)).size, 6);
    const participants = round.groups.flatMap((group) => group.members);
    assert.deepEqual(
      participants.slice().sort((a, b) => a - b),
      Array.from({ length: 24 }, (_, i) => i)
    );
    assert.equal(round.decisions.length, 24);
    assert.equal(new Set(round.decisions.map((decision) => decision.agentId)).size, 24);
    for (const group of round.groups) {
      assert.equal(group.members.length, 4);
      for (let i = 0; i < 4; i += 1) {
        for (let j = i + 1; j < 4; j += 1) {
          const pair = [group.members[i], group.members[j]].sort((a, b) => a - b).join(":");
          assert.ok(!seenPairs.has(pair), "Repeated pair " + pair);
          seenPairs.add(pair);
        }
      }
    }
  }
  assert.equal(seenPairs.size, 216);
});

test("all 144 recorded payoffs reconcile with the game rules and group totals", () => {
  for (const round of data.rounds) {
    const decisions = new Map(round.decisions.map((decision) => [decision.agentId, decision]));
    for (const group of round.groups) {
      const pool = group.members.reduce((sum, id) => sum + decisions.get(id).contribution, 0);
      let totalPayoff = 0;
      for (const id of group.members) {
        const decision = decisions.get(id);
        assert.ok(Number.isInteger(decision.contribution) && decision.contribution >= 0 && decision.contribution <= 20);
        const expected = 20 - decision.contribution + 0.4 * pool;
        near(decision.payoff, expected);
        const calculated = Core.calculatePayoff({
          contribution: decision.contribution,
          others: group.members.filter((member) => member !== id).map((member) => decisions.get(member).contribution),
        });
        near(calculated.totalPayoff, expected);
        near(calculated.pool, pool);
        near(calculated.groupTotalPayoff, 80 + 0.6 * pool);
        totalPayoff += decision.payoff;
      }
      near(totalPayoff, 80 + 0.6 * pool);
    }
  }
});

test("payoff calculator covers zero, full, and asymmetric contributions", () => {
  const zero = Core.calculatePayoff({ contribution: 0, others: [0, 0, 0] });
  near(zero.kept, 20);
  near(zero.pool, 0);
  near(zero.individualReturn, 0);
  near(zero.totalPayoff, 20);
  near(zero.groupTotalPayoff, 80);
  const full = Core.calculatePayoff({ contribution: 20, others: [20, 20, 20] });
  near(full.kept, 0);
  near(full.pool, 80);
  near(full.individualReturn, 32);
  near(full.totalPayoff, 32);
  near(full.groupTotalPayoff, 128);
  near(Core.calculatePayoff({ contribution: 0, others: [20, 20, 20] }).totalPayoff, 44);
  near(Core.calculatePayoff({ contribution: 20, others: [0, 0, 0] }).totalPayoff, 8);
  const custom = Core.calculatePayoff({ contribution: 3, others: [2, 4, 6], endowment: 10, mpcr: 0.5 });
  near(custom.pool, 15);
  near(custom.totalPayoff, 14.5);
  near(custom.groupTotalPayoff, 55);
});

test("payoff calculator rejects invalid contributions and group sizes", () => {
  for (const contribution of [-1, 21, NaN, Infinity]) {
    assert.throws(() => Core.calculatePayoff({ contribution, others: [0, 0, 0] }));
  }
  for (const others of [
    [0, 0],
    [0, 0, 0, 0],
    [0, -1, 0],
    [0, 21, 0],
    [0, NaN, 0],
  ]) {
    assert.throws(() => Core.calculatePayoff({ contribution: 5, others }));
  }
});

test("validation rejects missing or internally inconsistent replay records", () => {
  const changes = [
    (record) => record.rounds[0].decisions.pop(),
    (record) => {
      record.rounds[0].decisions[0].agentId = record.rounds[0].decisions[1].agentId;
    },
    (record) => {
      record.rounds[0].groups[0].members[0] = record.rounds[0].groups[0].members[1];
    },
    (record) => {
      record.rounds[0].groups[0].members[0] = 999;
    },
    (record) => {
      record.rounds[0].decisions[0].contribution = 21;
    },
    (record) => {
      record.rounds[0].decisions[0].payoff = NaN;
    },
    (record) => {
      record.rounds[0].decisions[0].payoff += 1;
    },
    (record) => {
      record.rounds[1] = { ...clone(record.rounds[0]), round: 2 };
    },
  ];
  for (const change of changes) {
    const changed = clone(data);
    change(changed);
    assert.throws(() => Core.validateData(changed));
  }
});

test("clamping keeps navigation within the recorded rounds", () => {
  assert.equal(Core.clampRound(data, -99), 1);
  assert.equal(Core.clampRound(data, 0), 1);
  assert.equal(Core.clampRound(data, 3), 3);
  assert.equal(Core.clampRound(data, 999), 6);
});

test("download record is a JSON-safe deep copy with only public top-level fields", () => {
  const augmented = clone(data);
  augmented.apiKey = "not-for-export";
  augmented.rawPrompts = ["not-for-export"];
  augmented.source.apiKey = "not-for-export";
  augmented.source.files[0].localPath = "not-for-export";
  augmented.agents[0].prompt = "not-for-export";
  augmented.rounds[0].decisions[0].thoughts = "not-for-export";
  const exported = Core.exportRecord(augmented);
  assert.deepEqual(Object.keys(exported).sort(), ["agents", "config", "description", "rounds", "source"]);
  assert.equal(typeof exported.description, "string");
  const { description, ...record } = exported;
  assert.deepEqual(record, data);
  const serialized = JSON.stringify(exported);
  assert.ok(!serialized.includes("not-for-export"));
  exported.rounds[0].decisions[0].contribution = -999;
  assert.notEqual(data.rounds[0].decisions[0].contribution, -999);
  assert.notEqual(augmented.rounds[0].decisions[0].contribution, -999);
});

test("all 144 snapshots expose the selected group, prior peers, and history only through that round", () => {
  const original = clone(data);
  for (const round of data.rounds) {
    for (const agent of data.agents) {
      const snapshot = Core.getSnapshot(data, round.round, agent.id);
      assert.deepEqual(snapshot.round, round);
      assert.deepEqual(snapshot.agent, agent);
      assert.deepEqual(
        snapshot.decision,
        round.decisions.find((item) => item.agentId === agent.id)
      );
      const group = round.groups.find((item) => item.members.includes(agent.id));
      assert.deepEqual(snapshot.group, group);
      assert.deepEqual(
        snapshot.groupDecisions,
        group.members.map((id) => round.decisions.find((item) => item.agentId === id))
      );
      const history = data.rounds
        .filter((item) => item.round <= round.round)
        .map((item) => ({ round: item.round, contribution: item.decisions.find((decision) => decision.agentId === agent.id).contribution }));
      assert.deepEqual(snapshot.history, history);
      if (round.round === 1) {
        assert.deepEqual(snapshot.previousPeers, []);
      } else {
        const previous = data.rounds[round.round - 2];
        const peers = previous.groups.find((item) => item.members.includes(agent.id)).members.filter((id) => id !== agent.id);
        assert.deepEqual(
          snapshot.previousPeers,
          peers.map((id) => ({ agentId: id, contribution: previous.decisions.find((item) => item.agentId === id).contribution }))
        );
        assert.ok(
          snapshot.previousPeers.every((peer) => !group.members.includes(peer.agentId)),
          "Previous partners must not be shown as current partners."
        );
      }
      const total = round.decisions.reduce((sum, item) => sum + item.contribution, 0);
      near(snapshot.summary.totalContribution, total);
      near(snapshot.summary.meanContribution, total / 24);
      near(snapshot.summary.meanPayoff, round.decisions.reduce((sum, item) => sum + item.payoff, 0) / 24);
    }
  }
  assert.deepEqual(data, original);
});

test("snapshot navigation clamps endpoints and defaults an unknown selection to the first agent", () => {
  assert.equal(Core.getSnapshot(data, -1, 0).round.round, 1);
  assert.equal(Core.getSnapshot(data, 100, 0).round.round, 6);
  assert.equal(Core.getSnapshot(data, 1, 999).agent.id, data.agents[0].id);
});
