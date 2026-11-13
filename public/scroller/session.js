// Session: "Stop after" (sleep timer and chapter limit) and time left in the chapter.
// A session starts when you press start and survives next-chapter page loads; stop then start is a fresh one.
const SESSION = 'scroller:session';
let session = null, sessionFirst = true; // { startedAt, chapters }: chapters = the one you're on, from 1
// chapter end (scroll y), when it was measured, last grew, unloaded images ahead; the shown time left
let endY = 0, endAt = 0, endGrewAt = -1e9, endHoles = false, leftShown = Infinity;
const saveSession = () => { try { sessionStorage.setItem(SESSION, JSON.stringify(session)); } catch {} };

bus.addEventListener('start', () => {
  let kept = null;
  if (resumed && sessionFirst) try { kept = JSON.parse(sessionStorage.getItem(SESSION)); } catch {}
  sessionFirst = false;
  session = kept?.startedAt ? kept : { startedAt: Date.now(), chapters: 1 };
  saveSession();
  endAt = 0; leftShown = Infinity;
});
bus.addEventListener('stop', () => (session = null));
// saved before the click: a full page load may follow right away
bus.addEventListener('advance', () => { if (session) { session.chapters++; saveSession(); } });

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// every frame (pauses included), so a setting changed mid-session applies at once
bus.addEventListener('tick', () => {
  const min = s.stopAfterMin;
  if (!on || !session || !(min > 0) || Date.now() - session.startedAt < min * 60000) return;
  stop(`Good night. Stopped after ${min >= 1 ? `${Math.round(min)} min` : plural(Math.round(min * 60), 'second')}.`);
});

const prevCanAdvance = canAdvance;
canAdvance = () => {
  const n = session?.chapters;
  if (s.stopAfterCh > 0 && n >= s.stopAfterCh) { stop(`That's ${plural(n, 'chapter')}. Good night.`); return false; }
  return prevCanAdvance();
};

// Where the chapter ends: the bottom of its last big image or of its main column of text. Comments, footers
// and recommendation grids come after it, so the document end would overshoot.
function findEnd(el, now) {
  const root = el === document.documentElement || el === document.body;
  const y0 = (root ? 0 : el.getBoundingClientRect().top) - el.scrollTop; // viewport y -> scroll y: subtract y0
  const wide = Math.min(400, el.clientWidth / 2), cols = new Map(), holes = [];
  let end = 0;
  for (const n of el.querySelectorAll('img, canvas, video, p')) {
    if (!n.offsetParent) continue; // hidden, or fixed (ads, overlays)
    const r = n.getBoundingClientRect(), bottom = r.bottom - y0;
    if (n.tagName === 'P') {
      // the main column is the parent with the most text; comments rarely beat the chapter itself
      const c = cols.get(n.parentElement) || { text: 0, bottom: 0 };
      cols.set(n.parentElement, { text: c.text + n.textContent.length, bottom: Math.max(c.bottom, bottom) });
    } else if (r.width >= wide && r.height >= 150) end = Math.max(end, bottom);
    else if (n.tagName === 'IMG' && r.height < 2 && !n.naturalWidth) holes.push(r.top - y0); // not loaded yet
  }
  let main = { text: 0, bottom: 0 };
  for (const c of cols.values()) if (c.text > main.text) main = c;
  end = Math.max(end, main.bottom);
  end = Math.min(end || el.scrollHeight, el.scrollHeight);
  if (endAt && end > endY + 50) endGrewAt = now; // lazy loading or an in-place chapter swap
  const ahead = (y) => (s.dir > 0 ? y > el.scrollTop : y < el.scrollTop + el.clientHeight);
  endHoles = holes.some((y) => ahead(y) && y < end + el.clientHeight);
  endY = end; endAt = now;
}

// '2:40 left', '45s left', '1h 05m left'; coarser steps the further out, so it ticks calmly.
function leftLabel(sec) {
  if (sec < 10) return 'almost done';
  if (sec < 57.5) return `${Math.round(sec / 5) * 5}s left`;
  if (sec < 3570) { const t = Math.round(sec / 10) * 10; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} left`; }
  const m = Math.round(sec / 60);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m left`;
}
// Sleep countdown: '45s', '12m', '1h 05m'. Rounds up, so it never claims 0m while time remains.
function sleepLabel(sec) {
  if (sec < 59) return `${Math.max(1, Math.ceil(sec))}s`;
  const m = Math.ceil(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

bus.addEventListener('settings', () => (leftShown = Infinity)); // speed or direction changed: follow at once
function sessionInfo() {
  const el = target || findTarget(), now = performance.now();
  if (!endAt || now - endAt > 1000) findEnd(el, now);
  const y = el.scrollTop, view = el.clientHeight;
  const raw = (s.dir > 0 ? Math.max(0, endY - y - view) : y) / speed();
  // follow it down freely, but only up on a real change, so a wobbly speed doesn't make it bounce
  if (raw < leftShown || raw > leftShown + Math.max(5, leftShown * 0.1)) leftShown = raw;
  const leftSec = Math.round(leftShown);
  const sleepSec = session && s.stopAfterMin > 0
    ? Math.max(0, Math.ceil(s.stopAfterMin * 60 - (Date.now() - session.startedAt) / 1000)) : null;
  return {
    left: leftLabel(leftSec), leftSec,
    estimating: s.atEnd === 'wait' || now - endGrewAt < 5000 || endHoles,
    progress: Math.min(1, Math.max(0, y / Math.max(1, endY - view))),
    sleep: sleepSec == null ? null : sleepLabel(sleepSec), sleepSec,
    chapter: session && s.atEnd === 'next' && s.stopAfterCh > 0 ? { n: session.chapters, of: s.stopAfterCh } : null,
  };
}

const prevPillInfo = pillInfo;
pillInfo = () => ({ ...prevPillInfo(), ...sessionInfo() });
const prevSessionState = pageState;
pageState = () => {
  const { sleepSec, leftSec, progress, estimating } = sessionInfo();
  return { ...prevSessionState(), session, sleepSec, leftSec, progress, estimating };
};
