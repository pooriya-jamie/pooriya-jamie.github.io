/* Replay controls for the static version of Cascade Arena. All values come from data.js. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.PUBLIC_GOODS_DEMO;
  const core = window.PublicGoodsCore;
  const arena = window.CascadeArena;
  const play = $('play-button'), picker = $('agent-select'), slider = $('contribution-slider');
  const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
  const label = id => 'A' + String(id).padStart(2, '0');
  const state = { round: 1, pin: null, playing: false, speed: 1, hypothetical: null };
  const announce = text => { $('announcement').textContent = text; };
  let timer = null, reference;

  function syncControls() {
    const atEnd = state.round === data.config.rounds;
    $('previous-round').disabled = state.round === 1;
    $('next-round').disabled = atEnd;
    $('clear-pin').disabled = state.pin === null;
    picker.value = state.pin === null ? '' : String(state.pin);
    play.setAttribute('aria-pressed', String(state.playing));
    $('play-label').textContent = state.playing ? 'Pause' : atEnd ? 'Replay' : 'Play';
    $('play-icon').textContent = state.playing ? 'Ⅱ' : '▶';
    $('status').className = atEnd ? 'done' : 'replay';
    $('statusText').textContent = state.playing ? 'REPLAYING' : atEnd ? 'COMPLETE' : 'PAUSED';
    $('runMode').textContent = 'Recorded session';
    $('elapsed').textContent = (data.config.agents * data.config.rounds) + ' choices';
    $('phaseLabel').textContent = 'SESSION ' + data.source.sessionId + ' · PERIOD ' + state.round + '/' + data.config.rounds;
    document.querySelector('header').style.setProperty('--progress', (100 * state.round / data.config.rounds) + '%');
  }
  function stop() { clearTimeout(timer); timer = null; state.playing = false; }
  function sandbox() {
    const s = core.getSnapshot(data, state.round, state.pin === null ? reference : state.pin);
    const value = state.hypothetical === null ? s.decision.contribution : state.hypothetical;
    const result = core.calculatePayoff({ contribution: value, others: s.groupDecisions.filter(d => d.agentId !== s.agent.id).map(d => d.contribution), endowment: data.config.endowment, mpcr: data.config.mpcr });
    $('whatif-agent').textContent = label(s.agent.id) + ' · P' + state.round;
    slider.value = String(value);
    slider.setAttribute('aria-valuetext', fmt(value) + ' tokens contributed; hypothetical payoff ' + fmt(result.totalPayoff));
    $('whatif-contribution').textContent = fmt(value);
    $('whatif-kept').textContent = fmt(result.kept);
    $('whatif-pool').textContent = fmt(result.pool);
    $('whatif-return').textContent = fmt(result.individualReturn);
    $('whatif-payoff').textContent = fmt(result.totalPayoff);
    const delta = result.totalPayoff - s.decision.payoff;
    $('whatif-delta').textContent = Math.abs(delta) < 1e-7 ? 'Matches the recorded payoff.' :
      (delta > 0 ? '+' : '−') + fmt(Math.abs(delta)) + ' tokens versus the recorded payoff (' + fmt(s.decision.payoff) + ').';
    $('reset-whatif').disabled = value === s.decision.contribution;
  }
  function render(animate = false) {
    arena.show(data, state.round, { animate, pin: state.pin });
    syncControls(); sandbox();
  }
  function schedule() {
    clearTimeout(timer);
    if (!state.playing) return;
    timer = setTimeout(() => {
      state.round = Math.min(state.round + 1, data.config.rounds);
      state.hypothetical = null;
      if (state.round === data.config.rounds) stop();
      render(true); schedule();
    }, 3000 / state.speed);
  }
  function seek(round) {
    stop(); state.round = core.clampRound(data, round); state.hypothetical = null;
    render(); announce('Recorded period ' + state.round + ' of ' + data.config.rounds + '.');
  }
  function select(id, fromArena = false) {
    if (id !== null && !data.agents.some(a => a.id === id)) return;
    stop(); state.pin = id; state.hypothetical = null;
    if (!fromArena) arena.pin(id);
    syncControls(); sandbox(); announce(id === null ? 'Showing all agents.' : 'Pinned ' + label(id) + ' in period ' + state.round + '.');
  }
  try {
    core.validateData(data);
    reference = (data.agents.find(a => a.persona === 'conditional') || data.agents[0]).id;
    data.agents.forEach(a => {
      const option = document.createElement('option'); option.value = String(a.id);
      option.textContent = label(a.id) + ' · ' + a.persona; picker.appendChild(option);
    });
    const chips = [[data.config.agents, ' agents'], [data.config.groupSize, ' per group'], [data.config.endowment, ' tokens'], [data.config.mpcr, ' MPCR'], [data.config.rounds, ' periods']];
    $('chips').replaceChildren(...chips.map(([value, title]) => {
      const item = document.createElement('span'), num = document.createElement('b');
      item.className = 'chip'; num.textContent = String(value); item.append(num, title); return item;
    }));
    render();
    $('waiting').style.display = 'none';
  } catch (error) {
    const bar = $('errbar'); bar.hidden = false; bar.style.display = 'block';
    bar.textContent = 'The recorded session could not be displayed. Please reload the page.';
    document.querySelectorAll('button,select,input').forEach(el => { el.disabled = true; });
    console.error('Replay initialization failed:', error); return;
  }
  play.addEventListener('click', () => {
    if (state.playing) stop();
    else {
      if (state.round === data.config.rounds) { state.round = 1; state.hypothetical = null; render(); }
      state.playing = true;
    }
    syncControls(); schedule(); announce(state.playing ? 'Playing recorded periods.' : 'Replay paused.');
  });
  $('playback-speed').addEventListener('change', e => { state.speed = Number(e.target.value); schedule(); });
  $('previous-round').addEventListener('click', () => seek(state.round - 1));
  $('next-round').addEventListener('click', () => seek(state.round + 1));
  // Listen on window so either bubbling DOM events or events dispatched on window work.
  window.addEventListener('arena-round', e => seek(e.detail.round));
  window.addEventListener('arena-select', e => select(e.detail.id, true));
  picker.addEventListener('change', () => select(picker.value === '' ? null : Number(picker.value)));
  $('clear-pin').addEventListener('click', () => select(null));
  $('show-summary').addEventListener('click', () => { stop(); syncControls(); arena.showSummary(); });
  slider.addEventListener('input', () => { stop(); state.hypothetical = Number(slider.value); syncControls(); sandbox(); });
  $('reset-whatif').addEventListener('click', () => { state.hypothetical = null; sandbox(); announce('Restored the recorded choice.'); });
  $('download-record').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(core.exportRecord(data), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'public-goods-session-1.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Downloaded the recorded session. Hypothetical choices are excluded.');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.playing) { stop(); syncControls(); } });
})();
