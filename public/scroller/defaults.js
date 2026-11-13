// Shared by the page script and the popup.
const DEFAULTS = {
  key: 's', fasterKey: ']', slowerKey: '[',
  holdKey: 'Shift',      // hold to pause, release to carry on
  nudge: 1.25,          // faster multiplies speed by this, slower divides by it
  pxs: 40,              // speed in pixels per second (last used; the starting speed for new sites)
  sites: {},            // hostname -> px/s, remembered automatically
  favs: [],             // hostnames you starred; none until you add them
  mode: 'smooth',       // 'smooth' = continuous glide, 'step' = jump a chunk of screen, 'pages' = snap to each page image
  step: 0.75,           // fraction of the screen per jump in step mode
  dir: 1,               // 1 = down, -1 = up
  atEnd: 'stop',        // 'stop', 'wait' (for lazy-loaded pages) or 'next' (open the next chapter)
  pauseOnManual: true,  // pause briefly when you scroll yourself
  badge: true,          // on-page status pill
  // Speed in words per minute, for text pages (novels, articles). Converted to px/s from the page's own layout.
  wpm: 250,             // last used wpm; the starting point for text sites
  wpmSites: {},         // hostname -> wpm, remembered automatically
  units: {},            // hostname -> 'px' | 'wpm' when you override the automatic choice
  // Night: a dimmer, a warm tint and focus mode, drawn over the page (never a CSS filter on the page itself).
  night: true,
  nightWhen: 'scrolling', // 'scrolling' = while Scroller runs on the tab (and while paused), 'always' = whenever a page is open
  dim: 0.2,             // 0..0.8 darkness of the dimmer
  warm: 0,              // 0..1 strength of the warm tint
  focus: false,         // darken everything beside the reading column
  // Stop after (bedtime). 0 = off.
  stopAfterMin: 0,      // minutes since you pressed start, pauses included
  stopAfterCh: 0,       // chapters opened by Next chapter
};
const MIN = 1, MAX = 5000;
const MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta'];
const PRESETS = [
  ['Too damn slow', 2],
  ['Slow', 12],
  ['Reading', 40],
  ['Brisk', 120],
  ['Fast', 500],
  ['Too damn fast', 3000],
];
// Words per minute for text pages.
const WPM_MIN = 50, WPM_MAX = 1500;
const WPM_PRESETS = [
  ['Savoring', 120],
  ['Relaxed', 180],
  ['Reading', 250],
  ['Brisk', 350],
  ['Fast', 500],
  ['Skimming', 800],
];
