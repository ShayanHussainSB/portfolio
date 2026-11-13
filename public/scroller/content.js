// Core engine. Feature scripts (night, pages, wpm, session) load after this one in the same scope and plug in
// by listening on `bus` (start, stop, tick, settings, advance) or by wrapping the `let` hooks marked "hook".
let s = { ...DEFAULTS };
const bus = new EventTarget();
const emit = (type) => bus.dispatchEvent(new Event(type));
// on = what the user asked for; level eases 0..1 so starts, stops and pauses glide instead of jerk.
let on = false, looping = false, level = 0, held = false;
let last = 0, carry = 0, sinceJump = 0, nextJump = null, aim = null, lastY = 0, pilledAt = 0, stuckFor = 0, pausedUntil = 0, target = null;
const RAMP = 500; // ms to ease fully in or out
const HOST = location.hostname.replace(/^www\./, '') || 'local';
let speed = () => s.sites[HOST] ?? s.pxs;                       // hook: px/s right now
let speedLabel = () => `${speed()} px/s`;                       // hook: how the pill names the speed
let jump = (from) => target.clientHeight * s.step;            // hook: px for the next jump from scroll position `from`
let canAdvance = () => true;                                    // hook: false stops at the end instead of next chapter
let pillInfo = () => ({});                                      // hook: { left, sleep, progress } for the pill
let pageState = () => ({ running: on, host: HOST, vh: innerHeight }); // hook: what the popup learns about this page

chrome.storage.local.get(DEFAULTS, (v) => { s = v; emit('settings'); });
chrome.storage.onChanged.addListener((c) => {
  for (const k in c) if (k in DEFAULTS) s[k] = c[k].newValue;
  emit('settings');
  if (on) badge();
});

// The page itself usually scrolls, but some readers scroll an inner box. Pick the biggest one that can.
function findTarget() {
  const root = document.scrollingElement || document.documentElement;
  if (root.scrollHeight > root.clientHeight + 1) return root;
  let best = root, area = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (el.scrollHeight <= el.clientHeight + 1) continue;
    if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
    const a = el.clientWidth * el.clientHeight;
    if (a > area) { area = a; best = el; }
  }
  return best;
}

function tick(now) {
  const dt = Math.min(now - last, 100); // ignore long gaps (tab in background)
  last = now;
  if (!target.isConnected) { target = findTarget(); aim = null; }
  // The page moved on its own (in-place chapter swap, keyboard paging): jump from where it is now.
  // A smooth jump still catching up only ever moves toward aim, however far behind a slow machine leaves it.
  const y = target.scrollTop, back = (y - lastY) * s.dir < -target.clientHeight / 2;
  if (aim !== null && (back || (y - aim) * s.dir > target.clientHeight)) aim = nextJump = null;
  lastY = y;
  if (on && reported !== location.href) report(); // in-place chapter change may have cleared the icon

  const goal = on && !held && now >= pausedUntil ? 1 : 0;
  level = goal > level ? Math.min(1, level + dt / RAMP) : goal < level ? Math.max(0, level - dt / RAMP) : level; // hold steady at the goal
  if (!on && !level) return (looping = false);

  const before = target.scrollTop;
  if (s.mode !== 'smooth') {
    if (goal) sinceJump += dt;
    // Aim from where the last jump will land, not where its smooth scroll is right now,
    // so quick jumps don't come up short.
    const from = aim ?? target.scrollTop;
    nextJump ??= jump(from);
    if (sinceJump >= (nextJump / speed()) * 1000) {
      sinceJump = 0;
      aim = Math.max(0, Math.min(target.scrollHeight - target.clientHeight, from + nextJump * s.dir));
      target.scrollTo({ top: aim, behavior: 'smooth' });
      nextJump = null;
    }
  } else {
    const ease = level * level * (3 - 2 * level); // smoothstep
    carry += (speed() * ease * dt) / 1000;
    const px = Math.floor(carry); // scrolling ignores sub-pixel amounts, so bank the fraction
    if (px) {
      carry -= px;
      // 'instant' matters: sites with CSS scroll-behavior:smooth would otherwise swallow each tiny step
      target.scrollBy({ top: px * s.dir, behavior: 'instant' });
    }
  }

  const atEdge = s.dir > 0
    ? target.scrollTop + target.clientHeight >= target.scrollHeight - 1
    : target.scrollTop <= 0;
  stuckFor = goal && atEdge && target.scrollTop === before ? stuckFor + dt : 0;
  if (stuckFor > 1500 && s.atEnd === 'stop') { stop(); level = 0; }
  if (stuckFor > 1500 && s.atEnd === 'next') advance();
  emit('tick');
  if (on && now - pilledAt > 500) badge(); // keep time left fresh

  requestAnimationFrame(tick);
}

function start() {
  on = true;
  sinceJump = stuckFor = pausedUntil = 0;
  nextJump = aim = null;
  if (!looping) {
    looping = true;
    target = findTarget();
    lastY = target.scrollTop;
    last = performance.now();
    carry = 0;
    requestAnimationFrame(tick);
  }
  emit('start');
  badge();
}
// msg: a farewell for the pill ("Good night…"); it lingers longer than the plain "Stopped".
function stop(msg) { on = false; held = false; emit('stop'); badge(msg, msg && 4000); }

// Tell the background script so the toolbar icon can show "ON".
let reported = null;
function report() {
  reported = on && location.href;
  try { chrome.runtime.sendMessage({ running: on })?.catch(() => {}); } catch {} // extension reloaded underneath us
}
const toggle = () => (on ? stop() : start());

// Best guess at the reader's "next chapter" control. Scored, because every site labels it differently.
const DIRS = /(?<![a-z])(prev|previous|back|next)(?![a-z])/g; // whole words: not "prevent", "backdrop"
function findNext() {
  let best = null, top = 1;
  const els = [...document.querySelectorAll('a[href], button, [role="button"], link[rel~="next"][href]')];
  const attrsOf = (el) => `${el.id} ${el.getAttribute('class') || ''} ${el.getAttribute('rel') || ''}`.toLowerCase();
  const shared = new Map(); // class strings used by more than one control
  for (const el of els) shared.set(attrsOf(el), (shared.get(attrsOf(el)) || 0) + 1);
  for (const el of els) {
    if (el.tagName !== 'LINK' && !el.getClientRects().length) continue; // hidden
    const label = `${el.textContent} ${el.getAttribute('aria-label') || ''} ${el.title || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
    const attrs = attrsOf(el);
    // prev, previous, back (not background). The link's own words or arrow decide first. Class names often name
    // both directions ("next-prev", BEM "prev-next__next"): there the last direction word counts, unless the
    // same classes sit on another control too (icon-only arrows), which is a coin flip. Stopping beats going back.
    if (/\bprev|\bback\b/.test(label) || /^[‹«←<\s]+/.test(label)) continue;
    const forward = /\bnext\b/.test(label) || /^[›»→>\s]+$/.test(label);
    const dirs = attrs.match(DIRS) || [];
    if (!forward && (dirs.at(-1) !== 'next' && dirs.length || new Set(dirs).size > 1 && shared.get(attrs) > 1)) continue;
    let score = 0;
    if (/\bnext\b/.test(label)) score += 2;
    if (/next/.test(attrs)) score += 1;
    if (!score) continue;
    if (el.tagName === 'LINK' || /\bnext\b/.test(el.getAttribute('rel') || '')) score += 1; // rel=next is the page saying so
    if (/chap|\bch\b|episode|\bep\b/.test(label + ' ' + attrs)) score += 2;
    if (/^[›»→>\s]+$/.test(label)) score += 1; // icon-only arrow
    if (/comment|reply|post|article|story/.test(label)) score -= 2; // "next page of comments" is not the chapter
    if (label.length > 40) score -= 2; // a sentence that happens to say "next"
    if (score > top) { top = score; best = el; }
  }
  return best;
}

// Open the next chapter and resume there. A full page load picks up via sessionStorage;
// readers that swap chapters in place just keep scrolling.
const RESUME = 'scroller:resume';
let advancedFrom = null;
function advance() {
  stuckFor = 0;
  const el = s.dir > 0 && canAdvance() && findNext();
  if (!on) return; // canAdvance stopped us with its own message
  if (!el || advancedFrom === location.href) { stop(); level = 0; return; } // nothing to follow, or it didn't move on
  advancedFrom = location.href;
  emit('advance');
  try { sessionStorage.setItem(RESUME, Date.now()); } catch {}
  badge('Next chapter…');
  if (el.tagName === 'LINK' || el.target === '_blank') location.href = el.href;
  else el.click();
}

let resumed = false; // this page load continues a next-chapter run
try {
  const t = +sessionStorage.getItem(RESUME);
  sessionStorage.removeItem(RESUME);
  if (Date.now() - t < 60000) {
    resumed = true;
    const go = () => setTimeout(start, 800); // let the first images settle
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  }
} catch {}

let nudge = function (up) { // hook
  const cur = speed();
  let pxs = Math.round(up ? cur * s.nudge : cur / s.nudge);
  if (pxs === cur) pxs += up ? 1 : -1; // small speeds would otherwise round back to themselves
  pxs = Math.min(MAX, Math.max(MIN, pxs));
  chrome.storage.local.set({ pxs, sites: { ...s.sites, [HOST]: pxs } });
};

// On-page pill, inside a shadow root so site CSS can't touch it.
// ● 40 px/s | ~2:40 left | ☾ 12m · 2/3, with a hairline of chapter progress along the bottom.
const MOON = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M10.2 7.6A4.6 4.6 0 0 1 4.4 1.8a4.6 4.6 0 1 0 5.8 5.8z" fill="currentColor"/></svg>';
let host, pill, hideTimer, parts;
// linger: ms a stopped-state message stays up.
function badge(text, linger = 1200) {
  pilledAt = performance.now();
  if (on !== !!reported) report();
  if (!s.badge) return host?.remove();
  if (!host) {
    host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      .p{position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;align-items:center;gap:9px;
        padding:8px 13px 9px 12px;border-radius:999px;overflow:hidden;pointer-events:none;
        font:600 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:0;
        color:#f5f5f5;background:#000000eb;border:1px solid #2e2e2e;box-shadow:0 8px 24px #0009,0 1px 2px #000;
        transition:opacity .3s cubic-bezier(.2,.8,.2,1),transform .3s cubic-bezier(.2,.8,.2,1)}
      .p.gone{opacity:0;transform:translateY(4px)}
      .dot{width:6px;height:6px;border-radius:50%;background:#737373;flex:none}
      .on .dot{background:#ff4f5a;animation:pulse 1.6s ease-in-out infinite}
      .held .dot{background:#a3a3a3}
      .bye .dot,.bm{display:none}.bye .bm{display:block;color:#f5f5f5}
      @keyframes pulse{50%{opacity:.35}}
      .seg{display:flex;align-items:center;gap:5px;white-space:nowrap}
      .seg+.seg::before{content:"";width:1px;height:11px;margin-right:4px;background:#ffffff2e}
      .dim{color:#a3a3a3}
      .seg svg{color:#a3a3a3;margin-top:-1px}
      [hidden]{display:none}
      .bar{position:absolute;left:14px;right:14px;bottom:0;height:2px;border-radius:2px;background:#ffffff14}
      .bar i{display:block;height:100%;width:calc(var(--p,0)*100%);border-radius:inherit;background:#f5f5f5a6;
        transition:width .6s linear}
      @media (prefers-reduced-motion:reduce){.p,.bar i{transition:none}.on .dot{animation:none}}
    </style><div class="p gone"><i class="dot"></i>${MOON.replace('<svg', '<svg class="bm"')}<span class="seg"></span><span class="seg dim"></span>`
      + `<span class="seg dim">${MOON}<span></span></span><span class="bar"><i></i></span></div>`;
    pill = root.querySelector('.p');
    const [label, left, sleep] = root.querySelectorAll('.seg');
    parts = { label, left, sleep, sleepText: sleep.querySelector('span'), bar: root.querySelector('.bar') };
  }
  if (!host.isConnected) document.documentElement.append(host);
  const info = (on && !text && pillInfo()) || {};
  const sleep = [info.sleep, info.chapter && `${info.chapter.n}/${info.chapter.of}`].filter(Boolean).join(' · ');
  pill.classList.toggle('on', on && !held);
  pill.classList.toggle('held', on && held);
  pill.classList.toggle('bye', !on && linger > 1200); // a farewell (sleep timer, chapter limit) gets the moon
  parts.label.textContent = text || (!on ? 'Stopped' : held ? 'Paused' : `${speedLabel()}${s.dir < 0 ? ' · up' : ''}`);
  parts.left.textContent = info.left ? (info.estimating ? '~' : '') + info.left : '';
  parts.left.hidden = !info.left;
  parts.sleepText.textContent = sleep;
  parts.sleep.hidden = !sleep;
  parts.bar.hidden = info.progress == null;
  parts.bar.style.setProperty('--p', Math.min(1, Math.max(0, info.progress ?? 0)));
  pill.classList.remove('gone');
  clearTimeout(hideTimer);
  if (!on) hideTimer = setTimeout(() => pill.classList.add('gone'), linger);
}

const same = (a, b) => a.length === 1 ? a.toLowerCase() === b.toLowerCase() : a === b;

addEventListener('keydown', (e) => {
  const t = e.target;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (same(e.key, s.holdKey)) {
    if (on && !held) { held = true; badge(); }
    // modifiers pass through so Shift+click etc. keep working; other keys would scroll the page
    if (on && !MODIFIERS.includes(e.key)) e.preventDefault();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (same(e.key, s.key)) toggle();
  else if (on && same(e.key, s.fasterKey)) nudge(true);
  else if (on && same(e.key, s.slowerKey)) nudge(false);
  else return;
  e.preventDefault();
  e.stopPropagation();
}, true);

const release = () => { if (held) { held = false; badge(); } };
addEventListener('keyup', (e) => same(e.key, s.holdKey) && release(), true);
addEventListener('blur', release); // key let go while the window was in the background

// Your own scrolling wins instantly; we ease back in two seconds after you stop.
const manual = () => {
  aim = nextJump = null; // you moved the page; jump from wherever you left it
  if (on && s.pauseOnManual) { pausedUntil = performance.now() + 2000; level = 0; }
};
addEventListener('wheel', manual, { passive: true, capture: true });
addEventListener('touchmove', manual, { passive: true, capture: true });

chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg === 'toggle') toggle();
  reply(pageState());
});
