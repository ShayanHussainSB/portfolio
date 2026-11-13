// Snap to pages: in 'pages' mode each jump lands with the next page image's top edge at the top of the
// reading area (just below any sticky header). Pages taller than the screen are read a screen at a time first.
// Block scope keeps these names out of the global scope the other feature scripts share.
{
  const NEAR = 8; // px; a page top this close is the one we're already on

  // Page tops as scroll positions of `target` (already shifted for the header), plus the header height.
  // Re-measured every jump, so lazy-loaded pages and in-place chapter swaps are picked up.
  const layout = () => {
    const viewTop = target === document.scrollingElement ? 0 : target.getBoundingClientRect().top + target.clientTop;
    // lazy images with no layout yet, logos, avatars and 728x90 banners all fail the size test
    const rects = [...target.querySelectorAll('img, canvas')].map((el) => el.getBoundingClientRect())
      .filter((r) => r.width >= 200 && r.height >= 200);
    const wide = rects.reduce((a, r) => (r.width > a.width ? r : a), { width: 0 });
    // pages share the reading column; side ads (often fixed) sit beside it
    const pages = rects.filter((r) => r.width >= wide.width * 0.4 && r.right > wide.left && r.left < wide.right);
    // a fixed or sticky bar over the top of the column would hide the top of the page under it
    let head = 0;
    if (wide.width) for (const el of document.elementsFromPoint(wide.left + wide.width / 2, viewTop + 1)) {
      if (el.contains(target) || !/fixed|sticky/.test(getComputedStyle(el).position)) continue;
      const h = el.getBoundingClientRect().bottom - viewTop;
      if (h < target.clientHeight / 3) head = Math.max(head, h); // not a full-screen overlay
    }
    head = Math.round(head);
    return { head, tops: pages.map((r) => Math.round(r.top - viewTop + target.scrollTop) - head) };
  };

  const prev = jump;
  jump = (from) => {
    if (s.mode !== 'pages') return prev(from);
    const { head, tops } = layout();
    const next = s.dir > 0
      ? Math.min(...tops.filter((t) => t > from + NEAR))
      : Math.max(...tops.filter((t) => t < from - NEAR));
    if (!isFinite(next)) return prev(from); // no pages ahead (text page, or past the last one)
    const gap = Math.abs(next - from), vis = target.clientHeight - head;
    // next page top already on screen: snap to it. Otherwise there's unseen page in between: step through it.
    return gap <= vis ? gap : vis * s.step;
  };
}
