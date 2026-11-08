(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.PUBLIC_GOODS_DEMO;
  const core = window.PublicGoodsCore;
  const number = value => Number.isInteger(value) ? String(value) : value.toFixed(1);
  const label = id => 'Agent ' + String(id + 1).padStart(2, '0');
  let timer = null;
  let state;
  try {
    core.validateData(data);
    const first = data.agents.find(a => a.persona === 'conditional') || data.agents[0];
    state = { round: 1, agentId: first.id, playing: false, speed: 1, hypothetical: null };
  } catch (error) {
    $('load-error').hidden = false;
    $('load-error').textContent = 'The replay could not be loaded. Please reload the page.';
    document.querySelectorAll('button, input, select').forEach(el => { el.disabled = true; });
    return;
  }
  function announce(message) { $('announcement').textContent = message; }
  function playback() {
    clearTimeout(timer);
    if (!state.playing) return;
    timer = setTimeout(() => {
      state.round += 1;
      state.hypothetical = null;
      if (state.round >= data.config.rounds) state.playing = false;
      render();
      playback();
    }, 2600 / state.speed);
  }
  function pause() { state.playing = false; clearTimeout(timer); }
  function setRound(round) {
    pause();
    state.round = core.clampRound(data, round);
    state.hypothetical = null;
    render();
    announce('Round ' + state.round + ' of 6. ' + label(state.agentId) + ' remains selected.');
  }
  function renderGroups(snapshot) {
    const active = document.activeElement;
    const focusedId = active && active.dataset ? active.dataset.agent : undefined;
    const observed = new Set(snapshot.previousPeers.map(p => p.agentId));
    const decisions = new Map(snapshot.round.decisions.map(d => [d.agentId, d]));
    $('network-grid').innerHTML = snapshot.round.groups.map((group, index) => {
      const pool = group.members.reduce((sum, id) => sum + decisions.get(id).contribution, 0);
      const selected = group.members.includes(state.agentId);
      return '<section class="group-card' + (selected ? ' is-active' : '') + '" aria-label="Group ' + (index + 1) + '">' +
        '<div class="group-header"><h3 class="group-name">Group ' + String(index + 1).padStart(2, '0') + '</h3><span class="group-pool">' + number(pool) + ' in pool</span></div>' +
        '<div class="group-agents">' + group.members.map(id => {
          const d = decisions.get(id);
          const a = data.agents.find(item => item.id === id);
          const selectedAgent = id === state.agentId;
          return '<button type="button" class="agent-node' + (selectedAgent ? ' is-selected' : '') + (observed.has(id) ? ' is-observed' : '') + '" data-agent="' + id + '" aria-pressed="' + selectedAgent + '" aria-label="' + label(id) + ', ' + (core.personaNames[a.persona] || a.persona) + ', contributed ' + number(d.contribution) + ' of 20 tokens" style="--contribution:' + d.contribution / 20 + ';--agent-fill:' + (12 + d.contribution * 3.6) + '%">' +
          '<span class="agent-id">' + String(id + 1).padStart(2, '0') + '</span><span class="agent-amount">' + number(d.contribution) + '<small>/20</small></span></button>';
        }).join('') + '</div><p class="group-return">Pool return <strong>' + number(pool * data.config.mpcr) + '</strong> each</p></section>';
    }).join('');
    if (focusedId !== undefined) {
      const target = $('network-grid').querySelector('[data-agent="' + focusedId + '"]');
      if (target) target.focus({ preventScroll: true });
    }
  }
  function renderChart() {
    const points = data.rounds.slice(0, state.round).map((round, i) => {
      const mean = round.decisions.reduce((sum, d) => sum + d.contribution, 0) / data.config.agents;
      return { x: 40 + i * 100, y: 76 - mean * 2.8, mean, round: i + 1 };
    });
    let svg = '<title>Average contribution per agent, through round ' + state.round + '</title><desc>' + points.map(p => 'Round ' + p.round + ': ' + p.mean.toFixed(1) + ' tokens').join('; ') + '</desc>';
    svg += '<line x1="40" x2="540" y1="76" y2="76" stroke="currentColor" opacity=".13" />';
    svg += '<line x1="40" x2="540" y1="20" y2="20" stroke="currentColor" opacity=".08" stroke-dasharray="3 5" />';
    svg += '<text x="4" y="24" class="chart-label">20</text><text x="12" y="80" class="chart-label">0</text>';
    if (points.length > 1) svg += '<polyline points="' + points.map(p => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="var(--teal, #157f75)" stroke-width="2.5" />';
    for (let i = 0; i < 6; i++) {
      const point = points[i];
      svg += '<text x="' + (40 + i * 100) + '" y="100" text-anchor="middle" class="chart-label">' + (i + 1) + '</text>';
      if (point) svg += '<circle cx="' + point.x + '" cy="' + point.y + '" r="' + (i + 1 === state.round ? 5 : 3) + '" fill="var(--teal, #157f75)" /><text x="' + point.x + '" y="' + (point.y - 11) + '" text-anchor="middle" class="chart-value">' + point.mean.toFixed(1) + '</text>';
    }
    $('contribution-chart').innerHTML = svg;
  }
  function renderWhatIf(snapshot) {
    const contribution = state.hypothetical === null ? snapshot.decision.contribution : state.hypothetical;
    const others = snapshot.groupDecisions.filter(d => d.agentId !== state.agentId).map(d => d.contribution);
    const result = core.calculatePayoff({ contribution, others, endowment: data.config.endowment, mpcr: data.config.mpcr });
    $('contribution-slider').value = contribution;
    $('contribution-slider').setAttribute('aria-valuetext', contribution + ' tokens contributed; hypothetical payoff ' + number(result.totalPayoff));
    $('whatif-contribution').textContent = number(contribution);
    $('whatif-kept').textContent = number(result.kept);
    $('whatif-pool').textContent = number(result.pool);
    $('whatif-return').textContent = number(result.individualReturn);
    $('whatif-payoff').textContent = number(result.totalPayoff);
    const delta = result.totalPayoff - snapshot.decision.payoff;
    $('whatif-delta').textContent = Math.abs(delta) < 1e-7 ? 'Matches this agent’s recorded choice.' :
      (delta > 0 ? '+' : '−') + number(Math.abs(delta)) + ' tokens versus the recorded payoff. Others’ choices stay fixed.';
    $('reset-whatif').disabled = state.hypothetical === null || contribution === snapshot.decision.contribution;
  }
  function render() {
    const snapshot = core.getSnapshot(data, state.round, state.agentId);
    $('round-number').textContent = String(state.round).padStart(2, '0');
    $('round-subtitle').textContent = state.round === 1 ? 'The first choice. No previous group to learn from.' : 'New groups. Feedback from the previous round.';
    $('round-status').textContent = state.playing ? 'Playing recorded choices' : state.round === 6 ? 'Session complete · replay anytime' : 'Recorded session · paused';
    $('play-label').textContent = state.playing ? 'Pause session' : state.round === 6 ? 'Replay session' : 'Play session';
    $('play-button').setAttribute('aria-pressed', String(state.playing));
    if ($('play-icon')) $('play-icon').textContent = state.playing ? 'Ⅱ' : '▶';
    $('previous-round').disabled = state.round === 1;
    $('next-round').disabled = state.round === 6;
    document.querySelectorAll('[data-round]').forEach(button => {
      const selected = Number(button.dataset.round) === state.round;
      button.classList.toggle('is-current', selected);
      button.classList.toggle('is-complete', Number(button.dataset.round) < state.round);
      button.setAttribute('aria-pressed', String(selected));
      if (selected) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    $('mean-contribution').textContent = snapshot.summary.meanContribution.toFixed(1);
    $('total-contribution').textContent = number(snapshot.summary.totalContribution);
    $('mean-payoff').textContent = snapshot.summary.meanPayoff.toFixed(1);
    renderGroups(snapshot);
    $('agent-name').textContent = label(state.agentId);
    $('agent-persona').textContent = core.personaNames[snapshot.agent.persona] || snapshot.agent.persona;
    $('agent-contribution').textContent = number(snapshot.decision.contribution);
    $('agent-payoff').textContent = number(snapshot.decision.payoff);
    $('agent-history').innerHTML = data.rounds.map((r, index) => {
      const item = snapshot.history[index];
      return '<span class="history-item' + (r.round === state.round ? ' is-current' : '') + '"><span class="history-value">' + (item ? number(item.contribution) : '—') + '</span><span class="history-stick" style="--bar-height:' + (item ? Math.max(5, item.contribution / 20 * 100) : 0) + '%"></span><span class="history-round">R' + r.round + '</span></span>';
    }).join('');
    $('agent-observation').textContent = state.round === 1 ? 'No previous-round feedback. This is the agent’s first decision.' :
      'In round ' + (state.round - 1) + ', its three groupmates contributed ' + snapshot.previousPeers.map(p => number(p.contribution)).join(', ') + ' tokens. Their current positions are marked in blue.';
    $('agent-reasoning').textContent = core.personaDescriptions[snapshot.agent.persona] || 'A participant in the recorded experiment.';
    renderChart();
    renderWhatIf(snapshot);
  }
  $('network-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-agent]');
    if (!button) return;
    pause(); state.agentId = Number(button.dataset.agent); state.hypothetical = null;
    render(); announce(label(state.agentId) + ' selected. Its recorded contribution is ' + core.getSnapshot(data, state.round, state.agentId).decision.contribution + ' tokens.');
  });
  $('round-controls').addEventListener('click', event => { const button = event.target.closest('[data-round]'); if (button) setRound(Number(button.dataset.round)); });
  $('previous-round').addEventListener('click', () => setRound(state.round - 1));
  $('next-round').addEventListener('click', () => setRound(state.round + 1));
  $('play-button').addEventListener('click', () => {
    if (state.playing) pause();
    else { if (state.round === 6) state.round = 1; state.playing = true; state.hypothetical = null; }
    render(); playback(); announce(state.playing ? 'Playing the recorded session.' : 'Replay paused.');
  });
  $('playback-speed').addEventListener('change', event => { state.speed = Number(event.target.value); playback(); });
  $('contribution-slider').addEventListener('input', event => { pause(); state.hypothetical = Number(event.target.value); renderWhatIf(core.getSnapshot(data, state.round, state.agentId)); $('play-label').textContent = state.round === 6 ? 'Replay session' : 'Play session'; if ($('play-icon')) $('play-icon').textContent = '▶'; $('play-button').setAttribute('aria-pressed', 'false'); $('round-status').textContent = 'Recorded session · paused'; });
  $('reset-whatif').addEventListener('click', () => { state.hypothetical = null; renderWhatIf(core.getSnapshot(data, state.round, state.agentId)); announce('Restored the recorded contribution.'); });
  $('download-record').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(core.exportRecord(data), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'public-goods-session-1.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Downloaded the recorded session. Hypothetical slider values are excluded.');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.playing) { pause(); render(); } });
  render();
})();
