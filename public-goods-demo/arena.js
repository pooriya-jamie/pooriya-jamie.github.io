/* Cascade Arena — renderer adapted from the research project's live_dashboard.html.
 * It consumes the public numeric recording only. Animation illustrates rematching;
 * no completion order, real-time duration, model responses, or reasoning is inferred.
 */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("arena"), ctx = canvas.getContext("2d");
const chartCv = $("chart"), chartCtx = chartCv.getContext("2d");
const scatCv = $("scatter"), scatCtx = scatCv.getContext("2d");
const inspector = $("inspector");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const STATIC = new URLSearchParams(location.search).has("static");
const S = {
  personas: {}, agents: new Map(), groups: {}, groupOf: {}, schedule: {}, hist: {}, chart: [],
  scatter: [], timeline: {}, edges: new Map(), cum: {}, poolTarget: {}, poolShown: {},
  poolPayout: {}, particles: [], floats: [], feedFilter: null, pinned: null, hover: null,
  trace: null, session: 1, period: 0, numPeriods: 6, numAgents: 24, endowment: 20, mpcr: 0.4,
  numSessions: 1, decided: 0, payoffPhase: true
};
let dataRef = null, rafId = null, animationEnd = 0, lastT = performance.now();
let W = 0, H = 0, DPR = 1, podCenters = {}, markerScale = 1;
function dispatch(type, detail) {
  document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
}
function paintSoon(duration = 0) {
  if (duration > 0 && !motion.matches && !STATIC) animationEnd = performance.now() + duration;
  if (rafId == null && !document.hidden) rafId = requestAnimationFrame(frame);
}

/* ============================== constants ============================== */
const PCOLORS = {
  "altruistic":      "#22e58f",
  "self-interested": "#ff5470",
  "conditional":     "#4ea0ff",
  "uncertain":       "#c77dff",
  "baseline":        "#ffb02e",
};
const PORDER = ["altruistic", "self-interested", "conditional", "uncertain", "baseline"];
const ACCENT = "#35e0c2", GOLD = "#ffd166", VIOLET = "#c77dff", BLUE = "#4ea0ff";

function contribColor(c) {
  if (c == null) return "#3a4666";
  const t = Math.max(0, Math.min(1, c / 20));
  const h = (352 + 148 * t) % 360;      // red -> amber -> green
  const s = 85 - 10 * t, l = 52 + 4 * t;
  return `hsl(${h} ${s}% ${l}%)`;
}
function ease(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; }

function agentLabel(id) { return "A" + String(id).padStart(2, "0"); }
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
function fmt(v, d = 1) { return v == null || !Number.isFinite(v) ? "–" : v.toFixed(d); }
function groupmates(period, id) {
  const groups = S.schedule[period];
  if (!groups) return [];
  for (const members of Object.values(groups)) if (members.includes(id)) return members.filter((m) => m !== id);
  return [];
}
function contribAt(period, id) {
  const h = S.hist[period];
  return h && h.contributions[id] != null ? h.contributions[id] : null;
}
/* What an agent observed before deciding in `period`: its groupmates' contributions in period-1. */
function observed(period, id) {
  if (period < 2) return null;
  const mates = groupmates(period - 1, id);
  const vals = mates.map((m) => ({ id: m, c: contribAt(period - 1, m) }));
  const known = vals.filter((v) => v.c != null).map((v) => v.c);
  return { mates: vals, avg: mean(known), own: contribAt(period - 1, id) };
}

function sizeCanvas(cv, c) {
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.round(r.width * DPR));
  cv.height = Math.max(1, Math.round(r.height * DPR));
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  return r;
}


function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const r = sizeCanvas(canvas, ctx);
  W = r.width; H = r.height;
  sizeCanvas(chartCv, chartCtx);
  sizeCanvas(scatCv, scatCtx);
  layoutPods();
  snap();
  drawChart(); drawScatter(); paintSoon();
}
function snap() {
  for (const a of S.agents.values()) { a.x = a.tx; a.y = a.ty; a.pulse = 0; }
  S.poolShown = { ...S.poolTarget };
  S.particles.length = 0; S.floats.length = 0; animationEnd = 0;
}
function showTip(id) {
  const a = S.agents.get(id);
  S.trace = a ? buildTrace(id) : null;
  if (!a) { inspector.style.display = "none"; paintSoon(); return; }
  const obs = observed(S.period, id), tr = S.trace;
  const after = a.prev == null ? "" : " · " + (a.contribution - a.prev > 0 ? "+" : "") + (a.contribution - a.prev) + " vs last";
  const source = obs ?
    '<div class="kv"><span class="k">Previous peers</span><span>Mean: <b>' + fmt(obs.avg) + '</b></span></div><div class="saw">' +
    obs.mates.map(m => '<span style="border-color:' + contribColor(m.c) + '">' + agentLabel(m.id) + ' <b>' + m.c + '</b></span>').join("") + '</div>' :
    '<div class="kv"><span class="k">Previous peers</span><span>None in the first round</span></div>';
  const chain = S.period >= 3 ? tr.d1.size + ' previous partners · ' + tr.d2.size + ' partners two rounds back'
    : S.period === 2 ? tr.d1.size + ' partners in round 1' : 'No previous partners.';
  inspector.innerHTML =
    '<div class="t-head" style="color:' + PCOLORS[a.persona] + '">' + agentLabel(id) + ' · ' + escapeHtml(a.persona)
    + '<span class="pin">' + (S.pinned != null ? "PINNED" : "PREVIEW") + '</span></div>'
    + '<div class="kv"><span class="k">Contributed</span><span><b>' + a.contribution + '</b> / ' + S.endowment + after + '</span></div>'
    + '<div class="kv"><span class="k">Payoff</span><span>' + fmt(a.payoff) + ' this round · ' + fmt(S.cum[id]) + ' to date</span></div>'
    + source + '<div class="chainNote">' + chain + '</div>';
  inspector.style.display = "block";
  inspector.classList.toggle("pinned", S.pinned != null);
  paintSoon();
}
function pin(id) {
  S.pinned = Number.isInteger(id) && S.agents.has(id) ? id : null;
  S.hover = null;
  showTip(S.pinned);
  for (const el of $("feedList").querySelectorAll("[data-aid]")) {
    el.setAttribute("aria-pressed", String(S.pinned === Number(el.dataset.aid)));
  }
}
function manualPin(id) {
  const next = id === S.pinned ? null : id;
  pin(next);
  dispatch("arena-select", { id: next });
}

function layoutPods() {
  const gids = Object.keys(S.groups);
  if (!gids.length) return;
  // Pods on a grid that follows the arena's aspect ratio (3x2 for six groups), so
  // neighbouring pods get a full cell of separation instead of one ring-radius.
  const n = gids.length;
  const keyNode = $("key");
  const keyH = getComputedStyle(keyNode).position === "absolute" ? keyNode.offsetHeight : 0;          // the key strip owns the bottom band
  const top = 26, bottom = keyH + 15, side = 9;
  const aw = Math.max(1,W - 2 * side), ah = Math.max(1,H - top - bottom);
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * aw / ah)) || 1));
  const rows = Math.ceil(n / cols);
  const cellW = aw / cols, cellH = ah / rows;
  gids.forEach((g, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const rowOffset = (cols - inRow) * cellW / 2;   // centre a short last row
    podCenters[g] = { x: side + rowOffset + (c + 0.5) * cellW, y: top + (r + 0.5) * cellH };
  });
  // agent slot radius: a clear band outside the pod ring (R=27), sized to the cell
  markerScale = Math.min(1, Math.max(0.58, Math.min(cellW,cellH) / 180));
  const slotR = Math.max(41 * markerScale, Math.min(84, Math.min(cellW, cellH) * 0.30));
  for (const [g, members] of Object.entries(S.groups)) {
    const pc = podCenters[g];
    members.forEach((aid, k) => {
      const ang = -Math.PI / 2 + (k / members.length) * Math.PI * 2;
      const a = S.agents.get(aid);
      if (a) {
        a.tx = pc.x + slotR * Math.cos(ang); a.ty = pc.y + slotR * Math.sin(ang);
        a.ux = Math.cos(ang); a.uy = Math.sin(ang);   // outward direction: labels go here
      }
    });
  }
}

function spawnParticles(agent, target, contribution) {
  if (!target) return;
  const n = Math.max(1, Math.round((contribution || 0) / 2));
  for (let i = 0; i < n; i++) {
    S.particles.push({
      sx: agent.x, sy: agent.y, ex: target.x, ey: target.y,
      t: -i * 0.09 - Math.random() * 0.08,
      color: contribColor(contribution),
      bend: (Math.random() - .5) * 60,
    });
  }
}
function floats(x, y, text, color, size, vx, vy) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  S.floats.push({ x, y, text, color, size: size || 13, age: 0, vx: vx || 0, vy: vy == null ? -18 : vy });
}

/* ============================== cascade trace ============================== */
function buildTrace(id) {
  const p = S.period;
  const d1 = new Set(groupmates(p - 1, id));
  const d2 = new Set(); const links2 = [];
  for (const a of d1) for (const aa of groupmates(p - 2, a)) if (aa !== id && !d1.has(aa)) { d2.add(aa); links2.push([a, aa]); }
  return { ego: id, d1, d2, links2, period: p };
}

function frame(now) {
  rafId = null;
  if (W < 10 || H < 10 || document.hidden) return;
  const animating = animationEnd > now && !motion.matches && !STATIC;
  if (animationEnd && !animating) snap();
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  const tr = S.trace;
  const focusSet = tr ? new Set([tr.ego, ...tr.d1, ...tr.d2]) : null;

  // edges (observation network memory)
  for (const e of S.edges.values()) {
    const A = S.agents.get(e.a), B = S.agents.get(e.b);
    if (!A || !B) continue;
    const age = S.period - e.period;
    let alpha = Math.max(0.03, 0.22 - age * 0.055);
    if (focusSet) alpha *= 0.35;
    ctx.strokeStyle = `rgba(78,160,255,${alpha})`;
    ctx.lineWidth = age === 0 ? 1.4 : 1;
    ctx.beginPath();
    const mx = (A.x + B.x) / 2 + (A.y - B.y) * 0.12, my = (A.y + B.y) / 2 + (B.x - A.x) * 0.12;
    ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
  }

  // pods
  for (const [g, pc] of Object.entries(podCenters)) {
    if (!(g in S.groups)) continue;
    const target = S.poolTarget[g] || 0;
    S.poolShown[g] = (S.poolShown[g] || 0) + ((target - (S.poolShown[g] || 0)) * Math.min(1, dt * 4));
    const shown = S.poolShown[g];
    const members = S.groups[g];
    const maxPool = S.endowment * (members ? members.length : 4);
    const frac = Math.min(1, shown / maxPool);
    const R = 27 * markerScale;
    if (Number.isFinite(pc.x) && Number.isFinite(pc.y)) {
      const glow = ctx.createRadialGradient(pc.x, pc.y, 2, pc.x, pc.y, R * 2.4);
      glow.addColorStop(0, `rgba(53,224,194,${0.10 + frac * 0.25})`);
      glow.addColorStop(1, "rgba(53,224,194,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(pc.x, pc.y, R * 2.4, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = "rgba(53,224,194,.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(pc.x, pc.y, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = S.payoffPhase ? GOLD : ACCENT; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(pc.x, pc.y, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    ctx.lineCap = "butt";
    ctx.fillStyle = "#0a1226";
    ctx.beginPath(); ctx.arc(pc.x, pc.y, R - 4, 0, 7); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // inside the ring: the pool total only
    ctx.fillStyle = "#dbe6ff"; ctx.font = "700 15px Consolas, monospace";
    ctx.fillText(Math.round(shown), pc.x, pc.y - 3);
    ctx.fillStyle = "#5b6d96"; ctx.font = "8px Consolas, monospace";
    ctx.fillText("pool", pc.x, pc.y + 10);
    // above the ring: group + max; below: the payout, in the clear band before the agents
    ctx.fillStyle = "#5b6d96"; ctx.font = "9px Consolas, monospace";
    ctx.fillText(`G${+g + 1} · max ${maxPool}`, pc.x, pc.y - R - 10);
    if (S.payoffPhase && S.poolPayout && S.poolPayout[g] != null) {
      ctx.fillStyle = GOLD; ctx.font = "700 10px Consolas, monospace";
      ctx.fillText(`+${S.poolPayout[g].toFixed(1)} each`, pc.x, pc.y + R + 11);
    }
  }

  // cascade trace links (drawn under agents)
  if (tr) {
    const E = S.agents.get(tr.ego);
    ctx.lineCap = "round";
    for (const [a, aa] of tr.links2) {
      const A = S.agents.get(a), B = S.agents.get(aa); if (!A || !B) continue;
      ctx.strokeStyle = "rgba(199,125,255,.55)"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const a of tr.d1) {
      const A = S.agents.get(a); if (!A || !E) continue;
      ctx.strokeStyle = "rgba(53,224,194,.85)"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(A.x, A.y); ctx.stroke();
      // arrowhead toward ego
      const ang = Math.atan2(E.y - A.y, E.x - A.x), hx = E.x - Math.cos(ang) * 24, hy = E.y - Math.sin(ang) * 24;
      ctx.fillStyle = "rgba(53,224,194,.85)";
      ctx.beginPath(); ctx.moveTo(hx, hy);
      ctx.lineTo(hx - Math.cos(ang - .5) * 7, hy - Math.sin(ang - .5) * 7);
      ctx.lineTo(hx - Math.cos(ang + .5) * 7, hy - Math.sin(ang + .5) * 7); ctx.closePath(); ctx.fill();
    }
    ctx.lineCap = "butt";
  }

  // particles
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.t += dt * 1.15;
    if (p.t < 0) continue;
    if (p.t >= 1) { S.particles.splice(i, 1); continue; }
    const t = ease(p.t);
    const mx = (p.sx + p.ex) / 2 + p.bend, my = (p.sy + p.ey) / 2 - Math.abs(p.bend) * .4;
    const x = (1-t)*(1-t)*p.sx + 2*(1-t)*t*mx + t*t*p.ex;
    const y = (1-t)*(1-t)*p.sy + 2*(1-t)*t*my + t*t*p.ey;
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // agents
  for (const a of S.agents.values()) {
    const glide = !animating ? 1 : Math.min(1, dt * 4.5);
    a.x += (a.tx - a.x) * glide;
    a.y += (a.ty - a.y) * glide;
    if (a.pulse > 0) a.pulse = Math.max(0, a.pulse - dt * 1.6);
    const r = 17 * markerScale;
    const pcolor = PCOLORS[a.persona] || "#888";
    const dimmed = focusSet && !focusSet.has(a.id);
    ctx.globalAlpha = dimmed ? 0.28 : 1;

    if (a.pulse > 0) {
      ctx.strokeStyle = pcolor; ctx.globalAlpha = a.pulse * 0.7; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(a.x, a.y, r + (1 - a.pulse) * 26, 0, 7); ctx.stroke();
      ctx.globalAlpha = dimmed ? 0.28 : 1;
    }
    // focus halo
    if (tr && !dimmed) {
      const role = a.id === tr.ego ? ACCENT : (tr.d1.has(a.id) ? ACCENT : VIOLET);
      ctx.strokeStyle = role; ctx.lineWidth = a.id === tr.ego ? 3 : 1.5; ctx.globalAlpha = a.id === tr.ego ? 1 : 0.8;
      ctx.setLineDash(tr.d2.has(a.id) ? [3, 3] : []);
      ctx.beginPath(); ctx.arc(a.x, a.y, r + 9, 0, 7); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // body
    ctx.fillStyle = contribColor(a.contribution);
    if (a.contribution != null && !dimmed) { ctx.shadowColor = contribColor(a.contribution); ctx.shadowBlur = 14; }
    ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    // persona ring
    ctx.strokeStyle = pcolor; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(a.x, a.y, r + 3.5, 0, 7); ctx.stroke();
    // contribution number
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = a.contribution != null ? "#08101f" : "#7d8db3";
    ctx.font = "800 13px Consolas, monospace";
    ctx.fillText(a.contribution ?? "·", a.x, a.y + 0.5);
    // change badge vs own previous contribution
    if (a.contribution != null && a.prev != null && a.contribution !== a.prev) {
      const dlt = a.contribution - a.prev;
      ctx.font = "700 9px Consolas, monospace"; ctx.textAlign = "left";
      ctx.fillStyle = dlt > 0 ? "#22e58f" : "#ff5470";
      ctx.fillText((dlt > 0 ? "▲+" : "▼") + dlt, a.x + r - 2, a.y - r + 2);
    }
    // id label on the outer side of the agent (away from its pod)
    const ux = a.ux == null ? 0 : a.ux, uy = a.uy == null ? 1 : a.uy;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(219,230,255,.55)"; ctx.font = "9px Consolas, monospace";
    ctx.fillText(agentLabel(a.id), a.x + ux * (r + 14), a.y + uy * (r + 14));
    ctx.globalAlpha = 1;
  }

  // floats
  for (let i = S.floats.length - 1; i >= 0; i--) {
    const f = S.floats[i];
    f.age += dt;
    if (f.age > 2.2) { S.floats.splice(i, 1); continue; }
    f.x += f.vx * dt; f.y += f.vy * dt;
    ctx.globalAlpha = f.age < 1.6 ? 1 : 1 - (f.age - 1.6) / 0.6;
    ctx.font = `700 ${f.size}px Consolas, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // dark backing pill so the number stays legible over arcs and rings
    const tw = ctx.measureText(f.text).width + 10, th = f.size + 6;
    ctx.fillStyle = "rgba(7,11,20,.8)";
    ctx.beginPath(); ctx.roundRect(f.x - tw / 2, f.y - th / 2, tw, th, th / 2); ctx.fill();
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y + 0.5);
    ctx.globalAlpha = 1;
  }
  if (animating) paintSoon();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(120,150,220,.045)"; ctx.lineWidth = 1;
  const step = 46;
  for (let x = (W/2) % step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = (H/2) % step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

/* ============================== trend chart ============================== */
function buildLegend() {
  $("legend").innerHTML = PORDER.map(
    (p) => `<span><i style="background:${PCOLORS[p]}"></i>${p}</span>`
  ).join("") + `<span><i class="line" style="background:#fff"></i>all agents</span>`;
}
function drawChart() {
  const r = chartCv.getBoundingClientRect(); const w = r.width, h = r.height;
  chartCtx.clearRect(0, 0, w, h);
  const data = S.chart;
  const padL = 26, padR = 8, padT = 8, padB = 18;
  const iw = w - padL - padR, ih = h - padT - padB;
  chartCtx.strokeStyle = "#1d2a45"; chartCtx.lineWidth = 1;
  chartCtx.font = "9px Consolas, monospace"; chartCtx.fillStyle = "#97a9cb"; chartCtx.textAlign = "right";
  for (const gv of [0, 5, 10, 15, 20]) {
    const y = padT + ih * (1 - gv / 20);
    chartCtx.beginPath(); chartCtx.moveTo(padL, y); chartCtx.lineTo(w - padR, y); chartCtx.stroke();
    chartCtx.fillText(gv, padL - 5, y + 3);
  }
  if (!data.length) {
    chartCtx.textAlign = "center"; chartCtx.fillText("first period result will appear here", padL + iw / 2, padT + ih / 2);
    return;
  }
  const xAt = (i) => padL + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const yAt = (v) => padT + ih * (1 - Math.max(0, Math.min(20, v)) / 20);
  chartCtx.textAlign = "center";
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(3, Math.floor(iw / 40))));
  data.forEach((rec, i) => {
    if (rec.mark && i > 0) {
      chartCtx.strokeStyle = "rgba(255,255,255,.14)"; chartCtx.setLineDash([3, 4]);
      chartCtx.beginPath(); chartCtx.moveTo(xAt(i), padT); chartCtx.lineTo(xAt(i), padT + ih); chartCtx.stroke();
      chartCtx.setLineDash([]);
    }
    if (i % labelEvery === 0 || i === data.length - 1) chartCtx.fillText("S" + rec.session + "P" + rec.period, xAt(i), h - 5);
  });
  const series = PORDER.map((p) => ({ color: PCOLORS[p], get: (rec) => rec.byPersona[p], lw: 1.4, alpha: .85 }));
  series.push({ color: "#ffffff", get: (rec) => rec.overall, lw: 2.4, alpha: 1 });
  for (const s of series) {
    chartCtx.strokeStyle = s.color; chartCtx.lineWidth = s.lw; chartCtx.globalAlpha = s.alpha;
    chartCtx.beginPath();
    let started = false;
    data.forEach((rec, i) => {
      const v = s.get(rec);
      if (v == null) { started = false; return; }
      if (!started) { chartCtx.moveTo(xAt(i), yAt(v)); started = true; }
      else chartCtx.lineTo(xAt(i), yAt(v));
    });
    chartCtx.stroke(); chartCtx.globalAlpha = 1;
  }
  // latest overall value marker
  const last = data[data.length - 1];
  if (last.overall != null) {
    chartCtx.fillStyle = "#fff"; chartCtx.beginPath(); chartCtx.arc(xAt(data.length - 1), yAt(last.overall), 3, 0, 7); chartCtx.fill();
  }
}

/* ============================== response scatter (FC fig. 2) ============================== */
function drawScatter() {
  const r = scatCv.getBoundingClientRect(); const w = r.width, h = r.height;
  scatCtx.clearRect(0, 0, w, h);
  const padL = 26, padR = 10, padT = 8, padB = 18;
  const iw = w - padL - padR, ih = h - padT - padB;
  const xAt = (v) => padL + (Math.max(0, Math.min(20, v)) / 20) * iw;
  const yAt = (v) => padT + ih * (1 - Math.max(0, Math.min(20, v)) / 20);
  scatCtx.strokeStyle = "#1d2a45"; scatCtx.lineWidth = 1;
  scatCtx.font = "9px Consolas, monospace"; scatCtx.fillStyle = "#97a9cb";
  for (const gv of [0, 5, 10, 15, 20]) {
    scatCtx.textAlign = "right"; scatCtx.fillText(gv, padL - 5, yAt(gv) + 3);
    scatCtx.beginPath(); scatCtx.moveTo(padL, yAt(gv)); scatCtx.lineTo(w - padR, yAt(gv)); scatCtx.stroke();
    scatCtx.textAlign = "center"; scatCtx.fillText(gv, xAt(gv), h - 5);
  }
  // give = saw reference
  scatCtx.strokeStyle = "rgba(74,91,131,.7)"; scatCtx.setLineDash([3, 4]);
  scatCtx.beginPath(); scatCtx.moveTo(xAt(0), yAt(0)); scatCtx.lineTo(xAt(20), yAt(20)); scatCtx.stroke(); scatCtx.setLineDash([]);
  const pts = S.scatter;
  if (!pts.length) {
    scatCtx.textAlign = "center"; scatCtx.fillText("points appear from period 2 onward", padL + iw / 2, padT + ih / 2);
    $("scatterSub").textContent = "0 points · rounds 2–6";
    return;
  }
  for (const p of pts) {
    scatCtx.fillStyle = PCOLORS[p.persona] || "#888"; scatCtx.globalAlpha = 0.55;
    scatCtx.beginPath(); scatCtx.arc(xAt(p.x) + (Math.sin(p.y * 7 + p.x) * 1.5), yAt(p.y) + (Math.cos(p.x * 5) * 1.5), 2.6, 0, 7); scatCtx.fill();
  }
  scatCtx.globalAlpha = 1;
  // OLS fit
  const n = pts.length, mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  let sxx = 0, sxy = 0;
  for (const p of pts) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); }
  if (n >= 3 && sxx > 0) {
    const b = sxy / sxx, a = my - b * mx;
    scatCtx.strokeStyle = "#fff"; scatCtx.lineWidth = 2;
    scatCtx.beginPath(); scatCtx.moveTo(xAt(0), yAt(a)); scatCtx.lineTo(xAt(20), yAt(a + 20 * b)); scatCtx.stroke();
    $("scatterSub").textContent = `descriptive slope ${b.toFixed(2)} · n=${n}`;
  } else {
    $("scatterSub").textContent = `n=${n}`;
  }
}

function updateStats() {
  const contribs = [...S.agents.values()].map((a) => a.contribution).filter((c) => c != null);
  const m = mean(contribs);
  $("stMean").textContent = m == null ? "–" : m.toFixed(1);
  // delta vs previous period mean (from chart record)
  const prevRec = S.chart.length > 1 ? S.chart[S.chart.length - 2] : null;
  const prevMean = prevRec && !(prevRec.session === S.session && prevRec.period === S.period) ? prevRec.overall : null;
  const dEl = $("stMeanD");
  if (m != null && prevMean != null && contribs.length === S.numAgents) {
    const dlt = m - prevMean;
    dEl.textContent = (dlt >= 0 ? "▲" : "▼") + Math.abs(dlt).toFixed(1);
    dEl.className = "d " + (dlt >= 0 ? "up" : "down");
  } else { dEl.textContent = ""; }
  $("stDecided").textContent = S.decided + "/" + S.numAgents;
  const pool = Object.values(S.poolTarget).reduce((x, y) => x + y, 0);
  $("stPool").textContent = S.period ? `${pool}` : "–";
  $("stCoop").textContent = m == null ? "–" : Math.round((m / S.endowment) * 100) + "%";
  let best = null;
  for (const [id, v] of Object.entries(S.cum)) if (best == null || v > best[1]) best = [id, v];
  $("stLeader").textContent = best ? `${agentLabel(+best[0])} · ${(S.personas[+best[0]] || "")} · ${best[1].toFixed(1)}` : "–";
}

function agentAt(mx, my) {
  let closest = null;
  let bestDistance = Math.max(22, 26 * markerScale) ** 2;
  for (const agent of S.agents.values()) {
    const distance = (agent.x - mx) ** 2 + (agent.y - my) ** 2;
    if (distance < bestDistance) {
      closest = agent;
      bestDistance = distance;
    }
  }
  return closest;
}


function buildTimeline() {
  const track = $("tlTrack");
  track.innerHTML = '<div class="tlSession"><span class="sl mono">S' + S.session + '</span></div>';
  const strip = track.firstElementChild;
  for (let p = 1; p <= S.numPeriods; p++) {
    const cell = document.createElement("button");
    cell.type = "button"; cell.className = "tlCell"; cell.textContent = String(p);
    cell.id = "tl-" + S.session + "-" + p;
    cell.setAttribute("aria-label", "Go to round " + p);
    cell.addEventListener("click", () => dispatch("arena-round", { round: p }));
    strip.appendChild(cell);
  }
  const key = $("tlKey")?.querySelector(".bar");
  if (key) key.style.background = "linear-gradient(90deg, hsl(352 85% 52%), hsl(40 85% 54%) 32%, hsl(66 80% 55%) 50%, hsl(140 75% 55%))";
}
function updateTimeline() {
  for (let p = 1; p <= S.numPeriods; p++) {
    const cell = $("tl-" + S.session + "-" + p), m = S.timeline[p];
    const info = "Round " + p + (m == null ? "" : " · mean " + fmt(m) + " tokens");
    cell.style.background = m == null ? "" : contribColor(m);
    cell.dataset.tip = info; cell.title = info; cell.setAttribute("aria-label", info);
    cell.classList.toggle("cur", p === S.period);
    if (p === S.period) cell.setAttribute("aria-current", "step"); else cell.removeAttribute("aria-current");
  }
}
function buildFeedFilters() {
  const box = $("feedFilters");
  box.replaceChildren();
  for (const p of [null, ...PORDER]) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "fchip" + (p === S.feedFilter ? " on" : "");
    b.dataset.p = p || ""; b.setAttribute("aria-pressed", String(p === S.feedFilter));
    if (p) b.style.setProperty("--fc", PCOLORS[p]);
    b.innerHTML = (p ? '<i style="background:' + PCOLORS[p] + '"></i>' : "") + (p || "all");
    b.addEventListener("click", () => {
      S.feedFilter = p;
      for (const el of box.children) {
        const current = (el.dataset.p || null) === p;
        el.classList.toggle("on", current); el.setAttribute("aria-pressed", String(current));
      }
      applyFeedFilter();
    });
    box.appendChild(b);
  }
}
function applyFeedFilter() {
  for (const card of $("feedList").querySelectorAll(".card")) {
    card.classList.toggle("hidden", !!S.feedFilter && card.dataset.p !== S.feedFilter);
  }
}
function renderFeed(rounds) {
  const list = $("feedList"), fragment = document.createDocumentFragment();
  for (let i = rounds.length - 1; i >= 0; i--) {
    const round = rounds[i], divider = document.createElement("div");
    divider.className = "divider"; divider.textContent = "Session " + S.session + " · round " + round.round;
    fragment.appendChild(divider);
    for (const record of round.decisions) {
      const id = record.agentId, p = S.personas[id], c = record.contribution;
      const card = document.createElement("button");
      card.type = "button"; card.className = "card";
      card.dataset.aid = String(id); card.dataset.period = String(round.round); card.dataset.p = p;
      card.setAttribute("aria-label", "Inspect " + agentLabel(id) + " in round " + round.round + ". Contributed " + c + (c === 1 ? " token." : " tokens."));
      card.setAttribute("aria-pressed", String(S.pinned === id));
      card.style.setProperty("--pc", PCOLORS[p]); card.style.animation = "none";
      const obs = observed(round.round, id);
      const context = obs ? "Previous peers’ mean <b>" + fmt(obs.avg) + "</b> · own previous <b>" + obs.own + "</b>" : "First round · no previous feedback";
      card.innerHTML = '<span class="row1"><span class="aid">' + agentLabel(id) + '</span><span class="ptag">' + escapeHtml(p)
        + '</span><span class="amt" style="color:' + contribColor(c) + '">' + c + '</span></span><span class="ctx">' + context
        + '</span><span class="meta">S' + S.session + ' · P' + round.round + ' · payoff ' + fmt(record.payoff) + '</span>';
      fragment.appendChild(card);
    }
  }
  list.replaceChildren(fragment); list.scrollTop = 0;
  $("feedCount").textContent = rounds.length * S.numAgents + " decisions";
  applyFeedFilter();
}
$("feedList").addEventListener("click", e => {
  const card = e.target.closest(".card[data-aid]");
  if (!card || !$("feedList").contains(card)) return;
  const requestedRound = Number(card.dataset.period), id = Number(card.dataset.aid);
  if (requestedRound === S.period) { manualPin(id); return; }
  dispatch("arena-round", {round:requestedRound});
  pin(id); dispatch("arena-select", {id});
  $("feedList").querySelector('[data-aid="' + id + '"][data-period="' + requestedRound + '"]')?.focus({preventScroll:true});
});


function showSummary() {
  if (!S.period) return;
  const ranks = Object.entries(S.cum).sort((a,b) => b[1]-a[1] || Number(a[0])-Number(b[0])).slice(0,3);
  const box = $("summary");
  box.innerHTML = '<h3>SESSION ' + S.session + ' SUMMARY</h3><div class="sec">Mean contribution by round · through round ' + S.period
    + '</div><div class="periods">' + S.chart.map(r => '<span class="mono" title="Round ' + r.period + '" style="color:' + contribColor(r.overall) + '">' + fmt(r.overall) + '</span>').join("")
    + '</div><div class="sec">Mean contribution by persona</div><table>' + PORDER.map(p =>
      '<tr><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + PCOLORS[p] + ';margin-right:7px"></i>'
      + p + '</td><td class="mono">' + fmt(mean(S.chart.map(r=>r.byPersona[p]))) + '</td></tr>').join("")
    + '</table><div class="sec">Highest cumulative payoffs</div><table>' + ranks.map(([id,v]) =>
      '<tr><td>' + agentLabel(Number(id)) + '</td><td class="mono">' + fmt(v) + '</td></tr>').join("")
    + '</table><button type="button" class="close">Close summary</button>';
  summaryOpener = document.activeElement; box.style.display = "block";
  box.querySelector("button").focus({ preventScroll: true });
}
let summaryOpener = null;
function hideSummary(restoreFocus = false) {
  $("summary").style.display = "none";
  if (restoreFocus && summaryOpener?.isConnected) summaryOpener.focus({preventScroll:true});
  summaryOpener = null;
}
$("summary").addEventListener("click", () => hideSummary(true));
$("summary").addEventListener("keydown", e => { if (e.key === "Escape") {e.stopPropagation(); hideSummary(true);} });

/* Reconstruct the chronological period_start, decisions, and period_result facts
 * from the executed replay. No future outcomes enter any chart, history or feed.
 * Seeking is idempotent, so summing payoffs or extending edges cannot double-count.
 */
function show(data, period, {animate=false, pin: selected=null}={}) {
  const focusedCard = document.activeElement?.closest('#feedList .card[data-aid]');
  const restoreCard = focusedCard && {id:focusedCard.dataset.aid,period:focusedCard.dataset.period};
  const p = Math.min(data.rounds.length, Math.max(1, Math.trunc(Number(period)) || 1));
  const adjacent = dataRef === data && p === S.period + 1;
  const glide = animate && adjacent && !motion.matches && !STATIC && !document.hidden;
  const previousPositions = new Map(glide ? [...S.agents].map(([id,a])=>[id,[a.x,a.y]]) : []);
  const fresh = dataRef !== data;
  dataRef = data; S.session = data.source.sessionId; S.period = p;
  S.numPeriods = data.config.rounds; S.numAgents = data.config.agents;
  S.endowment = data.config.endowment; S.mpcr = data.config.mpcr;
  S.personas = Object.fromEntries(data.agents.map(a=>[a.id,a.persona]));
  S.agents = new Map(); S.schedule={}; S.hist={}; S.chart=[]; S.scatter=[]; S.edges=new Map();
  S.timeline={}; S.cum={}; S.poolTarget={}; S.poolPayout={}; S.poolShown={};
  S.floats=[]; S.particles=[]; S.groupOf={}; S.groups={}; S.hover=null; S.trace=null;
  S.decided = S.numAgents; S.payoffPhase = true; animationEnd=0;
  const completed = data.rounds.slice(0,p);
  for (const r of completed) {
    const groups=Object.fromEntries(r.groups.map(g=>[g.id,g.members]));
    const contributions=Object.fromEntries(r.decisions.map(d=>[d.agentId,d.contribution]));
    S.schedule[r.round]=groups; S.hist[r.round]={contributions};
    const byPersona=Object.fromEntries(PORDER.map(t=>[t,[]]));
    for (const d of r.decisions) {
      const id=d.agentId, persona=S.personas[id], obs=observed(r.round,id);
      byPersona[persona].push(d.contribution); S.cum[id]=(S.cum[id]||0)+d.payoff;
      if (obs) S.scatter.push({x:obs.avg,y:d.contribution,persona});
      if (r.round===p) {
        const xy=previousPositions.get(id)||[W/2,H/2];
        S.agents.set(id,{id,persona,x:xy[0],y:xy[1],tx:xy[0],ty:xy[1],contribution:d.contribution,
          prev:contribAt(p-1,id),payoff:d.payoff,pulse:0});
      }
    }
    const overall=mean(Object.values(contributions));
    S.chart.push({session:S.session,period:r.round,overall,byPersona:Object.fromEntries(PORDER.map(t=>[t,mean(byPersona[t])])),mark:r.round===1});
    S.timeline[r.round]=overall;
    for (const {id,members} of r.groups) {
      for (let i=0;i<members.length;i++) for (let j=i+1;j<members.length;j++) {
        S.edges.set(Math.min(members[i],members[j])+":"+Math.max(members[i],members[j]),{a:members[i],b:members[j],period:r.round});
      }
      if (r.round===p) {
        S.groups[id]=members; members.forEach(a=>{S.groupOf[a]=id;});
        S.poolTarget[id]=members.reduce((n,a)=>n+contributions[a],0);
        S.poolShown[id]=S.poolTarget[id]; S.poolPayout[id]=S.poolTarget[id]*S.mpcr;
      }
    }
  }
  if (fresh) { buildLegend(); buildTimeline(); buildFeedFilters(); resize(); }
  layoutPods();
  hideSummary();
  if (glide) {
    for (const a of S.agents.values()) {
      if (a.contribution>0) spawnParticles(a, podCenters[S.groupOf[a.id]], a.contribution);
      a.pulse=0.65;
      const pc=podCenters[S.groupOf[a.id]], dx=a.tx-pc.x, dy=a.ty-pc.y, dist=Math.hypot(dx,dy)||1;
      floats(a.tx+dx/dist*24, a.ty+dy/dist*24, "+" + fmt(a.payoff), ACCENT, 11, dx/dist*9, dy/dist*9-5);
    }
    paintSoon(1650);
  } else snap();
  updateStats(); updateTimeline(); drawChart(); drawScatter();
  S.pinned = Number.isInteger(selected) && S.agents.has(selected) ? selected : null;
  renderFeed(completed); showTip(S.pinned); paintSoon();
  if (restoreCard) $("feedList").querySelector('[data-aid="' + restoreCard.id + '"][data-period="' + restoreCard.period + '"]')?.focus({preventScroll:true});
  chartCv.setAttribute("aria-label", "Mean contribution by round through round " + p + ": " + S.chart.map(r=>fmt(r.overall)).join(", ") + " tokens.");
  scatCv.setAttribute("aria-label", "Previous peers’ mean versus the agent’s next contribution. " + S.scatter.length + " recorded decisions.");
}
canvas.addEventListener("pointermove", e => {
  if (e.pointerType === "touch" || S.pinned != null) return;
  const r=canvas.getBoundingClientRect(),hit=agentAt(e.clientX-r.left,e.clientY-r.top);
  const id=hit?.id ?? null;
  if (S.hover === id) return;
  S.hover=id; canvas.style.cursor=hit?"pointer":"crosshair"; showTip(id);
});
canvas.addEventListener("pointerleave",()=>{
  S.hover=null; if(S.pinned==null)showTip(null);
});
canvas.addEventListener("click",e=>{
  const r=canvas.getBoundingClientRect(),hit=agentAt(e.clientX-r.left,e.clientY-r.top);
  manualPin(hit?.id ?? null);
});
window.addEventListener("resize",resize);
if ("ResizeObserver" in window) {
  const observer=new ResizeObserver(resize);
  for(const c of [canvas,chartCv,scatCv])observer.observe(c);
}
motion.addEventListener("change",()=>{if(motion.matches){snap();paintSoon();}});
document.addEventListener("visibilitychange",()=>{
  if (document.hidden) {if (rafId!=null)cancelAnimationFrame(rafId);rafId=null;snap();}
  else paintSoon();
});
window.CascadeArena = Object.freeze({show, pin, showSummary});
})();
