(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PublicGoodsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const personaNames = {
    altruistic: 'Group-oriented', altruist: 'Group-oriented',
    'self-interested': 'Self-interested', self_interested: 'Self-interested',
    conditional: 'Conditional cooperator', uncertain: 'Cautious', baseline: 'Untyped'
  };
  const personaDescriptions = {
    altruistic: 'Assigned a preference for the group’s welfare.',
    altruist: 'Assigned a preference for the group’s welfare.',
    'self-interested': 'Assigned a preference for its own earnings.',
    self_interested: 'Assigned a preference for its own earnings.',
    conditional: 'Assigned a preference for reciprocity and fairness.',
    uncertain: 'Assigned a cautious, uncertain disposition.',
    baseline: 'Given the game instructions without a persona.'
  };
  function calculatePayoff({ contribution, others, endowment = 20, mpcr = 0.4 }) {
    if (!Number.isFinite(endowment) || endowment <= 0 || !Number.isFinite(mpcr) || mpcr < 0) throw new Error('Invalid game parameters.');
    if (!Array.isArray(others) || others.length !== 3) throw new Error('A group has three other participants.');
    const choices = [contribution, ...others];
    if (choices.some(x => !Number.isFinite(x) || x < 0 || x > endowment)) throw new Error('Contributions must be within the endowment.');
    const pool = choices.reduce((a, b) => a + b, 0);
    const kept = endowment - contribution;
    const individualReturn = mpcr * pool;
    return { kept, pool, individualReturn, totalPayoff: kept + individualReturn,
      groupTotalPayoff: 4 * endowment - pool + 4 * individualReturn };
  }
  function validateData(data) {
    if (!data || !data.config || !Array.isArray(data.agents) || !Array.isArray(data.rounds)) throw new Error('Replay data is missing.');
    const cfg = data.config;
    if (cfg.groupSize !== 4 || cfg.agents !== 24 || cfg.rounds !== 6 || cfg.endowment !== 20 || cfg.mpcr !== 0.4) throw new Error('Unexpected replay design.');
    if (data.agents.length !== cfg.agents || data.rounds.length !== cfg.rounds) throw new Error('Incomplete replay.');
    const ids = new Set(data.agents.map(a => a.id));
    if (ids.size !== cfg.agents || data.agents.some(a => !Number.isInteger(a.id) || typeof a.persona !== 'string')) throw new Error('Invalid agent records.');
    const met = new Set();
    data.rounds.forEach((round, index) => {
      if (round.round !== index + 1 || round.groups.length !== cfg.agents / cfg.groupSize || round.decisions.length !== cfg.agents) throw new Error('Incomplete round.');
      const seen = new Set();
      const decisions = new Map(round.decisions.map(d => [d.agentId, d]));
      if (decisions.size !== cfg.agents) throw new Error('Duplicate decisions.');
      round.groups.forEach(group => {
        if (group.members.length !== 4 || new Set(group.members).size !== 4) throw new Error('Invalid group.');
        group.members.forEach(id => {
          if (!ids.has(id) || seen.has(id) || !decisions.has(id)) throw new Error('Invalid membership.');
          seen.add(id);
          const decision = decisions.get(id);
          const expected = calculatePayoff({ contribution: decision.contribution,
            others: group.members.filter(other => other !== id).map(other => decisions.get(other).contribution),
            endowment: cfg.endowment, mpcr: cfg.mpcr });
          if (!Number.isFinite(decision.payoff) || Math.abs(expected.totalPayoff - decision.payoff) > 1e-7) throw new Error('Payoff does not match the game.');
        });
        group.members.forEach((a, i) => group.members.slice(i + 1).forEach(b => {
          const pair = [a, b].sort((x, y) => x - y).join(':');
          if (met.has(pair)) throw new Error('A pair meets twice.');
          met.add(pair);
        }));
      });
    });
    return true;
  }
  function clampRound(data, number) {
    const value = Number.isFinite(Number(number)) ? Math.round(Number(number)) : 1;
    return Math.max(1, Math.min(data.rounds.length, value));
  }
  function getSnapshot(data, roundNumber, agentId) {
    const number = clampRound(data, roundNumber);
    const round = data.rounds[number - 1];
    const agent = data.agents.find(a => a.id === agentId) || data.agents[0];
    const decision = round.decisions.find(d => d.agentId === agent.id);
    const group = round.groups.find(g => g.members.includes(agent.id));
    const groupDecisions = group.members.map(id => round.decisions.find(d => d.agentId === id));
    let previousPeers = [];
    if (number > 1) {
      const prior = data.rounds[number - 2];
      const priorGroup = prior.groups.find(g => g.members.includes(agent.id));
      previousPeers = priorGroup.members.filter(id => id !== agent.id).map(id => {
        const d = prior.decisions.find(item => item.agentId === id);
        return { agentId: id, contribution: d.contribution };
      });
    }
    const totalContribution = round.decisions.reduce((a, d) => a + d.contribution, 0);
    return { round, agent, decision, group, groupDecisions, previousPeers,
      history: data.rounds.slice(0, number).map(r => ({ round: r.round, contribution: r.decisions.find(d => d.agentId === agent.id).contribution })),
      summary: { totalContribution, meanContribution: totalContribution / data.config.agents,
        meanPayoff: round.decisions.reduce((a, d) => a + d.payoff, 0) / data.config.agents } };
  }
  function exportRecord(data) {
    return {
      description: 'Recorded numeric choices from one public-goods LLM simulation session. Hypothetical slider values are not included.',
      source: { kind: data.source.kind, runId: data.source.runId, sessionId: data.source.sessionId, stage: data.source.stage,
        description: data.source.description, model: data.source.model, modelStatus: data.source.modelStatus, interpretation: data.source.interpretation,
        files: data.source.files.map(file => ({ file: file.file, sha256: file.sha256 })) },
      config: { agents: data.config.agents, rounds: data.config.rounds, groupSize: data.config.groupSize, endowment: data.config.endowment, mpcr: data.config.mpcr },
      agents: data.agents.map(a => ({ id: a.id, persona: a.persona })),
      rounds: data.rounds.map(r => ({ round: r.round, groups: r.groups.map(g => ({ id: g.id, members: [...g.members] })),
        decisions: r.decisions.map(d => ({ agentId: d.agentId, contribution: d.contribution, payoff: d.payoff })) }))
    };
  }
  return { calculatePayoff, validateData, clampRound, getSnapshot, exportRecord, personaNames, personaDescriptions };
});
