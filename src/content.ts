/**
 * Every word on the site lives here. Edit freely; components only render it.
 * Claims must stay true (see PRODUCT.md "Evidence on Hand").
 */
export const content = {
  nav: { work: 'Work', about: 'About', contact: 'Write to me' },
  /** The hero drawing: traffic flowing through the four projects. */
  stream: {
    label: 'A live drawing of the request path. Traffic passes hitlimit, bunWay, Honeycomb and kaput, then returns 200.',
    you: 'You',
    youFrom: (city: string) => `You, from ${city}`,
    hint: 'Sweep across the stream to flood it. The limiter holds.',
    scroll: 'Scroll to fly the route',
    /** The flight's narration, one caption per stage. `limit` and `lanes` are the numbers the scene really runs with. */
    tour: (limit: number, lanes: number, city: string | null) => [
      {
        tag: '00 · fibre',
        title: 'You are light in a fibre.',
        body: `The bright pulse is your request${city ? `, from ${city}` : ''}. The blocks on the wall are transistors, switching as traffic passes.`,
      },
      {
        tag: '01 · hitlimit',
        title: 'First gate: the rate limit.',
        body: `A fixed window lets ${limit} requests a second through. The rest fall away with a 429, long before they reach anything expensive.`,
      },
      {
        tag: '02 · bunWay',
        title: 'Four films of middleware.',
        body: 'cors, helmet, requestId, responseTime. Each one stamps the response as it passes: the Express API, running on Bun.',
      },
      {
        tag: '03 · Honeycomb',
        title: `${lanes} lanes fold into one.`,
        body: 'That is compression. Thousands of records become one root on-chain, and any record can still prove it belongs.',
      },
      {
        tag: '04 · kaput',
        title: 'Somebody sends SIGTERM.',
        body: 'The server stops taking new work, and everything already in flight still lands. Nothing drops.',
      },
      { tag: '200 OK', title: 'You made it through.', body: 'So will your users. Keep scrolling to see how each piece works.' },
    ],
    hud: { inFlight: 'in flight', admitted: 'admitted', refused: 'turned away · 429' },
    rejected: (n: number) => `${n} turned away`,
    done: '200 OK',
  },
  projects: {
    hitlimit: {
      name: 'hitlimit',
      kind: 'Rate limiting',
      note: '8 stores, zero core dependencies',
      vision:
        'Rate limiting is the first thing a public API needs and the last thing anyone wants to write twice. hitlimit is one middleware for six frameworks and eight stores, with nothing else to install.',
    },
    bunway: {
      name: 'bunWay',
      kind: 'A framework for Bun',
      note: '26 middleware, Express-compatible',
      vision:
        'Bun is fast, and most Node servers are written for Express. bunWay keeps the Express API, (req, res, next) and all, and runs it on Bun, so moving over is an import, not a rewrite.',
    },
    state: {
      name: 'Honeycomb',
      kind: 'Web3 games on Solana',
      note: 'Compressed on-chain state, 1000× cheaper',
      vision:
        'Game studios want players to own what they earn, without every designer learning Solana. Honeycomb puts profiles, characters, resources and missions behind one API, and keeps that state on-chain for a thousandth of the cost.',
    },
    kaput: {
      name: 'kaput',
      kind: 'Graceful shutdown',
      note: 'Send the signal. Watch it finish.',
      vision:
        'A deploy should never cost anyone their request. kaput hears the shutdown signal, stops taking new traffic, lets what is in flight finish, and closes every connection in the right order. One import.',
    },
    scroller: {
      name: 'scroller',
      kind: 'Browser extension',
      note: 'Hands-free reading, Chrome and Firefox',
      vision:
        'Reading a long page shouldn’t need a hand on the wheel. Scroller moves any page at the pace you read, and remembers the speed you like on each site.',
    },
    usher: {
      name: 'Usher',
      kind: 'Cinema SaaS',
      note: 'In progress · private',
      vision:
        'A cinema’s counters, gates and food stalls all have to agree with each other. Usher is one system for the lot, built so the database itself refuses to sell a seat twice.',
    },
    quarry: {
      name: 'Quarry',
      kind: 'Lead intelligence',
      note: 'In progress · private',
      vision:
        'A list of businesses is not a list of leads. Quarry works out what each one is missing and what to sell them, and shows the evidence behind every point of the score.',
    },
  },
  /** Drafted from the facts in PRODUCT.md. TODO(Shayan): make each `vision` above sound like you. */
  /** The three on the main page, in order. Everything else lives behind "See all". */
  featured: ['hitlimit', 'quarry', 'scroller'] as const,
  all: {
    title: 'All work',
    count: (n: number) => `${n} projects, each one running in your tab`,
    close: 'Close',
    listTitle: '~/projects',
    command: 'ls -l ~/projects',
    summary: (n: number, seen: number) => `${n} projects. You have seen ${seen}; ${n - seen} more are one click away.`,
    seeAll: 'See all work',
    seeAllCommand: 'open --all',
  },
  terminal: {
    button: 'Terminal',
    title: 'Terminal',
    close: 'Close terminal',
    inputLabel: 'Command',
    logLabel: 'Terminal output',
    greeting: [
      'A terminal, in a web page. It really runs what you type.',
      '',
      '  help (or --help)    every command, and what it does',
      '  ssh guest@shayan    log in to the portfolio: files, projects, a secret',
      '',
      'Or press one of the suggestions under the prompt.',
    ],
    placeholder: 'type a command',
    tryLabel: 'try',
  },
  /** Private repos, still being built: their sheets model the rules (they don't run the code), no links. */
  upcoming: {
    title: 'Coming next',
    note: 'Private and still being built. These two sheets model their rules; they don’t run the private code.',
  },
  person: {
    name: 'Shayan M Hussain',
    role: 'Backend architect',
    years: '7+ years',
    location: 'Karachi → remote, anywhere',
    current: 'JointOps · open source for Node.js and Bun',
    email: 'shayanhussain48@gmail.com',
    github: 'https://github.com/ShayanHussainSB',
    linkedin: 'https://www.linkedin.com/in/shayanhussainsb',
  },

  hero: {
    headline: 'Throw anything at it. It holds.',
    sub: 'I’m Shayan M Hussain, a backend architect. I build the infrastructure, tools and open source that other developers put their products on.',
    cta: { label: 'Write to me' },
  },

  observation: {
    pending: 'Observing your request…',
    line: (id: string, city: string, region: string | null, rtt: number | null) =>
      rtt === null
        ? `Request ${id}, somewhere near ${city} by your clock. The edge is out of reach, so that is a guess.`
        : `Request ${id} arrived from ${city}${region ? ` through ${region}` : ''} in ${rtt} ms.`,
  },

  response: {
    status: 'HTTP/1.1 200 OK',
    headline: 'Let’s build what’s next.',
    body: 'Every system I have built started as somebody’s request. Send me yours.',
    linksLabel: 'Find me',
    links: [
      { id: 'github', label: 'GitHub', handle: 'ShayanHussainSB', href: 'https://github.com/ShayanHussainSB' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'in/shayanhussainsb', href: 'https://www.linkedin.com/in/shayanhussainsb' },
      { id: 'jointops', label: 'JointOps', handle: 'my open source', href: 'https://github.com/JointOps' },
      { id: 'email', label: 'Email', handle: 'shayanhussain48@gmail.com', href: 'mailto:shayanhussain48@gmail.com' },
    ],
    servedBy: 'Shayan M Hussain · Karachi',
    availability: 'open to remote work, worldwide',
    figure: 'Fig. 08 — The operator, off-call.',
    alt: 'Shayan, seen from behind in a yellow hoodie, looking across a still mountain lake at dawn, snow peaks mirrored in the water under a pastel sky.',
  },

  /** Project demos. Copy budget: one headline, one sentence, one real line of code. */
  stops: {
    sheetOf: 'of 08',
    detailsLabel: 'Spec sheet',
    edge: {
      sheet: '01',
      title: 'Edge',
      headline: 'The invisible work. The visible difference.',
      sentence: 'I’m Shayan. I build backend infrastructure, developer tools, and the foundations that let other people build.',
      // real line from api/whoami.ts
      code: "const { region, id } = parseVercelId(h.get('x-vercel-id'))",
      // TODO(Shayan): check line 2 claims your role accurately.
      bio: [
        'Backend architect, 7+ years. Karachi, working remote with teams anywhere.',
        'Honeycomb Protocol’s Web3 game infrastructure and its SDK generator; GameShift’s payment APIs.',
        'Now: open source for Node.js and Bun — hitlimit, bunWay, kaput.',
      ],
      portraitAlt: 'Shayan M Hussain, portrait.',
      figure: 'Fig. 01 — The operator, on-call.',
      callouts: [
        // x/y: % of the photo where the leader starts (hair, ear, hoodie)
        { text: '7+ yrs · backend', x: 66, y: 12 },
        { text: 'Karachi · UTC+5', x: 84, y: 40 },
        { text: 'JointOps · open source', x: 81, y: 88 },
      ],
      conditions: {
        title: 'Conditions at the edge',
        measuring: 'Measuring your link to the edge…',
        unknown: 'Edge unreachable from here: conditions unknown.',
        again: 'Measure again',
        rtt: 'RTT',
        jitter: 'JITTER',
        samples: 'samples',
        sky: { calm: 'calm', breezy: 'breezy', gusty: 'gusty' },
        announce: (median: number, jitter: number, sky: string) => `Round trip ${median} milliseconds, jitter ${jitter} milliseconds. Conditions ${sky}.`,
      },
      details: [
        'Five sequential requests to /api/whoami, each with cache: no-store, timed with performance.now() in your browser.',
        'RTT is the median. Jitter is the mean difference between consecutive samples (RFC 3550 style).',
        'The jitter sets how wide your request’s fringe is drawn: a steadier link draws a calmer line.',
      ],
    },
    hitlimit: {
      sheet: '02',
      title: 'Rate limiter',
      headline: 'Spend a request. Then spend too many.',
      sentence: 'That is the real hitlimit middleware, running in your tab: five requests every ten seconds, then 429.',
      code: "hitlimit({ limit: 5, window: '10s', response: { message: 'Slow down cowboy!' } })",
      send: 'Send request',
      burst: 'Send ×10',
      vessel: 'Requests left in this window',
      resetsIn: (s: number) => `window resets in ${s}s`,
      rejectedPile: (n: number) => `${n} rejected`,
      pileMore: (n: number) => `+${n} not drawn`,
      responseLabel: 'Last response from the middleware',
      announce200: (left: number) => `200 OK. ${left} ${left === 1 ? 'request' : 'requests'} left.`,
      announce429: (s: number) => `429 Too Many Requests. Retry after ${s} ${s === 1 ? 'second' : 'seconds'}.`,
      idle: 'No requests yet. The vessel is full.',
      benchRun: 'Benchmark my device',
      benchRunning: 'Running for one second…',
      bench: (n: string) => `Your device ran ${n} hitlimit checks in one second.`,
      benchNote: 'In a Web Worker: the real middleware, in-memory store, 1,024 rotating client keys.',
      benchFailed: 'Couldn’t run a Worker here, so no number. Nothing made up.',
      details: [
        '8 storage backends: memory, SQLite, Redis, Valkey, DragonflyDB, PostgreSQL, MongoDB, MySQL.',
        'Zero dependencies in the core. Six frameworks, with a Bun-native build (@joint-ops/hitlimit-bun).',
        'Tiered limits and auto-ban for repeat offenders. About 3.3K downloads a month.',
      ],
      install: 'bun add @joint-ops/hitlimit',
      repo: 'https://github.com/JointOps/hitlimit-monorepo',
      repoLabel: 'Source on GitHub',
    },
    bunway: {
      sheet: '03',
      title: 'Framework',
      headline: 'Change one import. Keep everything else.',
      sentence: 'These films are bunWay’s real middleware, running in your tab. Peel one off and watch its headers go.',
      // the README's own migration diff
      code: '- const express = require("express");\n+ import { bunway } from "bunway";',
      films: { cors: 'cors()', helmet: 'helmet()', requestId: 'requestId()', responseTime: 'responseTime()' },
      adds: (n: number) => `+${n} ${n === 1 ? 'header' : 'headers'}`,
      filmsLabel: 'Middleware layers, in order',
      responseLabel: 'Response headers',
      layerFailed: (layer: string, why: string) => `${layer} threw: ${why}`,
      announce: (layer: string, on: boolean, n: number) => `${layer} ${on ? 'on' : 'off'}: ${n} ${n === 1 ? 'header' : 'headers'} ${on ? 'added' : 'removed'}.`,
      details: [
        '26 middleware built in, zero dependencies, 2,423 tests.',
        'Same (req, res, next) as Express, so most migrations are the import.',
        'logger() and session() aren’t here: they write files and sign cookies with Bun and node:crypto, so in a browser they would have to be faked. These four run as published.',
      ],
      install: 'bun add bunway',
      repo: 'https://github.com/JointOps/bunway',
      repoLabel: 'Source on GitHub',
    },
    state: {
      sheet: '04',
      title: 'State',
      headline: 'Game state on-chain, for a thousandth of the cost.',
      sentence:
        'Honeycomb Protocol gives game developers Solana without the complexity: profiles, characters, resources, missions and staking behind one API. Its compression keeps that state in Merkle trees; your browser just built one from 4,096 example profiles. Check any of them against the root.',
      // real line from src/lib/merkle.ts (verify)
      code: 'siblings.forEach((s, k) => (h = (index >> k) & 1 ? pair(s, h) : pair(h, s)))',
      condensing: 'Compressing 4,096 profiles…',
      built: (ms: number) => `Built on your device in ${ms} ms: 8,191 Keccak-256 hashes.`,
      pick: 'Profile',
      record: (i: number) => `profile #${i}`,
      root: 'root',
      verified: 'Verified with 12 proof hashes, not 4,096.',
      rejected: 'Rejected: the recomputed root doesn’t match.',
      tamper: 'Tamper with this profile',
      untamper: 'Restore the profile',
      fieldLabel: '4,096 profiles; choose one with the slider',
      ladderLabel: (i: number, ok: boolean) => `Proof for profile ${i}: 12 sibling hashes from the profile up to the root. ${ok ? 'Verified.' : 'Rejected.'}`,
      sdkTitle: 'One schema, typed SDKs',
      schema: 'schema.graphql',
      // Honeycomb's SDKs, per docs.honeycombprotocol.com/llms.txt: JavaScript, C# (Unity), C++ (Unreal Engine), Godot
      sdks: ['JavaScript', 'C# · Unity', 'C++ · Unreal', 'Godot'],
      sdkNote: 'I built Honeycomb’s GraphQL-to-SDK generator: one schema, typed SDKs for web, Unity, Unreal Engine and Godot.',
      gameshift: 'Also: GameShift — NestJS aggregation, indexers, WebSockets and in-game payment APIs.',
      details: [
        'Honeycomb is modular: Hive Control (projects, users, profiles, delegated permissions), Character Manager, Resource Manager with crafting, Nectar Missions and Nectar Staking, all through one Edge Client API.',
        'Compression stores state as leaves in Solana Merkle trees and emits it through no-op transactions that an indexer (a fork of Metaplex’s DAS) reads back. Honeycomb’s benchmarks: creating a profile drops from 0.0052100 to 0.0000041 (99.92% less), starting a mission from 0.0024250 to 0.0000100.',
        'The 4,096 leaves here are example profiles generated in your browser, not Honeycomb data. Hashing follows Solana’s concurrent Merkle trees: Keccak-256, leaf = keccak(data), node = keccak(left ‖ right).',
      ],
    },
    kaput: {
      sheet: '05',
      title: 'Shutdown',
      headline: 'Kill it mid-request. Nothing drops.',
      sentence: 'This is the real kaput, running in your tab with your traffic in flight. Lift the cover and send SIGTERM.',
      // the README's zero-config usage
      code: "import '@joint-ops/kaput'",
      balancer: 'balancer',
      server: 'server :3000',
      counters: { inFlight: 'in flight', served: 'served', refused: 'refused at the balancer', dropped: 'dropped' },
      phase: { serving: 'serving', draining: 'draining · readiness 503', closing: 'closing resources', exited: 'exit 0' },
      coverUp: 'Lift the cover',
      coverDown: 'Lower the cover',
      sigterm: 'Send SIGTERM',
      restart: 'Restart the server',
      starting: 'Starting the server…',
      idle: 'Listening on :3000. Waiting for a signal.',
      resourcesLabel: 'Resources, in kaput’s close order',
      logLabel: 'kaput log',
      announce: {
        draining: 'SIGTERM sent. Readiness now fails, so the balancer stops routing. In-flight requests are finishing.',
        closing: 'Closing resources in order.',
        exited: (served: number, dropped: number) => `Exited 0. ${served} requests served, ${dropped} dropped.`,
      },
      offcall: {
        caption: 'exit 0 · on-call: off',
        alt: 'Shayan, off call, by a lake in the snow: grey hoodie, dark puffer jacket, snowy slopes behind.',
      },
      details: [
        'Close order is kaput’s own: the HTTP server first, then queue workers, caches, and databases last.',
        'The Prisma, Redis and BullMQ clients are stand-ins shaped like the real ones, each taking about 0.3 s to close. kaput’s detectors recognise, name and order them.',
        'The grace period is shortened to 2 s here (kaput’s default is 10 s) so you don’t have to wait.',
        'Zero config. Auto-detects Express, Fastify, Prisma, Redis, BullMQ, Mongoose and Knex. /health and /healthz endpoints.',
      ],
      install: 'npm install @joint-ops/kaput',
      repo: 'https://github.com/JointOps/kaput',
      repoLabel: 'Source on GitHub',
    },
    scroller: {
      sheet: '06',
      title: 'Reader',
      headline: 'Press S. Read with your hands free.',
      sentence: 'The page on the right runs Scroller’s own content script. Start it, change the speed, and hold Shift to pause.',
      // real line from extension/scripts/content.js (smooth mode)
      code: "target.scrollBy({ top: px * s.dir, behavior: 'instant' })",
      frameTitle: 'A drawn chapter, scrolled by Scroller',
      start: 'Start scrolling',
      stop: 'Stop',
      top: 'Back to top',
      speedLabel: 'Speed',
      // the extension's own presets (extension/scripts/defaults.js)
      presets: [
        ['Too damn slow', 2],
        ['Slow', 12],
        ['Reading', 40],
        ['Brisk', 120],
        ['Fast', 500],
        ['Too damn fast', 3000],
      ] as [string, number][],
      modeLabel: 'Feel',
      modes: { smooth: 'Glide', step: 'Jumps', pages: 'Pages' },
      keys: 'Click the page, then: S start/stop · hold Shift to pause · [ ] slower, faster',
      readout: (pxs: number, running: boolean) => `${pxs} px/s · ${running ? 'scrolling' : 'stopped'}`,
      details: [
        'The page loads Scroller 1.3.0’s own content scripts (core, pages, session), unmodified, with a stand-in for chrome.storage. The pill in its corner is the extension’s.',
        'Any speed from 1 to 5000 px/s, remembered per site. On text pages it switches to words per minute, measured from that page’s font, line height and column.',
        'Next chapter on its own, night mode, a sleep timer. Chrome and Firefox from one Manifest V3 codebase.',
        'The panels are drawn for this page; they are not from a real comic.',
      ],
      site: 'https://shayanhussainsb.github.io/scroller/',
      siteLabel: 'Install it',
      repo: 'https://github.com/ShayanHussainSB/scroller',
      repoLabel: 'Source on GitHub',
    },
    usher: {
      headline: 'Sell one seat twice. Watch it refuse.',
      // GitHub description, ShayanHussainSB/usher, verbatim
      sentence:
        'Multi-tenant cinema management and ticketing SaaS for Pakistani cinemas: counter sales, QR tickets, gate scanning, food orders, cashier shifts.',
      // real lines from packages/core/src/money.ts
      code: '/** Integer paisa; never a float. */\nexport type Paisa = number;',
      screen: 'Screen 1',
      mapLabel: 'Seat map. Pick a seat.',
      classes: { standard: 'Standard', recliner: 'Recliner' },
      picked: (seat: string, price: string) => `Seat ${seat} · ${price}`,
      pickFirst: 'Pick a seat on the map.',
      race: 'Sell from both counters at once',
      slip: 'Ticket',
      receipt: 'Your receipt',
      scanTicket: 'Scan ticket QR',
      scanReceipt: 'Scan receipt QR',
      logLabel: 'Counter and gate log',
      idle: 'Two counters, one show. Waiting for a sale.',
      log: {
        sold: (counter: number, seat: string, price: string) => `counter ${counter}  sold ${seat} · ${price}`,
        refused: (counter: number, seat: string) => `counter ${counter}  refused: ${seat} is already sold`,
        admit: (seat: string) => `gate       admit 1 · seat ${seat}`,
        used: (seat: string, at: string) => `gate       refused: ${seat} already used at ${at}`,
        receipt: 'gate       refused: this is a receipt, scan the ticket QR',
      },
      details: [
        'A model of the rules, not Usher’s code. In Usher, Postgres itself refuses the second sale (a partial unique index) and marks a QR used in a single update. Here a Map stands in for the table.',
        'Money is integer paisa end to end. The prices here are examples; the rupee format is Usher’s own formatPaisa.',
        'Phase 1 (foundation: login, cinemas, staff roles, audit log, CI) is done and deployed. Sales, gate and food come next. The repo is private.',
      ],
    },
    quarry: {
      headline: 'A lead score that shows its working.',
      // README, Lead-Intelligence-Engine-GMaps @ dev/shayan, verbatim
      sentence:
        "Finds local businesses, fills in what's known about them (contacts, owner, reviews, website, ads, domain, competitors) and scores them as sales leads for sellers of digital services. It reuses everything it already knows, so the same or a similar search never fetches the same data twice. Self-hosted, runs in Docker.",
      // real line from engine/src/quarry/parse/scoring.py
      code: 'value = top[0] * 0.6 + top[1] * 0.25 + top[2] * 0.15',
      business: 'Kopi Corner · Café · Taman Molek, JB',
      madeUp: 'made-up business, from Quarry’s scoring doc',
      factsLabel: 'Change what Quarry knows',
      website: { label: 'Website', own: 'Its own site', social: 'An Instagram page', none: 'None' },
      reviews: { label: 'Reviews on Maps', counts: [12, 120, 219] },
      facts: {
        old_copyright: 'Footer says © 2019',
        not_mobile: 'Not built for phones',
        rating_slipping: 'Rating slipping lately',
        low_reply_rate: 'Bad reviews go unanswered',
        mobile: 'Mobile number on Maps',
        free_email: 'Email is a gmail address',
        competitors_above: 'Rivals rank above it',
        unclaimed: 'Listing never claimed',
        closed: 'Marked closed',
      },
      needsReviews: '(needs 30+ reviews)',
      priority: 'Priority',
      sellThem: 'Sell them',
      noBucket: 'Nothing to sell: no call',
      pitch: 'Pitch',
      flagsLabel: 'Flags, each with its evidence',
      working: 'Working',
      // service ids → what the seller sells (docs/scoring.md, Services)
      services: {
        website_new: 'a first website',
        website_redesign: 'a better website',
        brand_identity: 'logo, digital identity',
        local_seo: 'SEO and the Google profile',
        reputation: 'review replies and rating recovery',
        ads_management: 'running ads well',
        social: 'social pages and WhatsApp',
        business_email: 'email on an own domain',
        booking_ordering: 'online booking or ordering',
      } as Record<string, string>,
      boostNames: {
        email: 'email',
        phone: 'phone',
        mobile: 'mobile',
        whatsapp: 'WhatsApp',
        ads: 'ads',
        reviews_50: '50+ reviews',
        reviews_200: '200+ reviews',
      } as Record<string, string>,
      penaltyNames: { no_contact: 'no contact', few_reviews: 'small place', closed_or_chain: 'closed' } as Record<string, string>,
      announce: (n: number, label: string) => `Priority ${n}, ${label}.`,
      details: [
        'The formula and weights are Quarry’s own (scoring.py, audit 1.9.0, and config/services.toml), ported to run in your tab. With Kopi Corner’s facts from the doc, the port gives the doc’s answer: 95, Hot.',
        'All code, no AI. Every flag quotes the fact behind it, and the same facts always give the same score.',
        'Reuse, from a real run: previewing “cafes in Taman Molek, Johor Bahru” found 76 businesses already known, reused 27, and planned 6 Maps loads.',
        'Built with Muhammad Rehan Rasool. In progress; the repo is private.',
      ],
    },
    record: {
      title: 'Why me',
      /** A conversation with the site. Each answer is facts from PRODUCT.md, said with a straight face. */
      ask: {
        headline: 'Don’t take my word for it. Ask the site.',
        sub: 'It has been briefed, and it doesn’t do modesty.',
        you: 'You',
        site: 'shayan.site',
        logLabel: 'Conversation with the site',
        opening: 'Shayan is busy building something, so you get me. Pick a question. I will be brief and I will be right.',
        chipsLabel: 'Questions you can ask',
        run: 'Run it',
        done: 'That is everything I was cleared to say. The rest he will tell you himself.',
        questions: [
          {
            q: 'Why him?',
            a: 'Because he builds the part that cannot go down. Rate limiters, shutdown paths, on-chain state: the things nobody notices until they fail. Seven years of making sure nobody notices.',
          },
          {
            q: 'Prove it.',
            a: 'Scroll up. hitlimit, Quarry and scroller are running in this tab right now. Not screenshots: the real code. Flood the limiter. I will wait.',
            link: { href: '#hitlimit', label: 'Go flood it' },
          },
          {
            q: 'What has he shipped?',
            a: 'At Honeycomb: the generator that turns one schema into SDKs for the web, Unity, Unreal and Godot, on a protocol that keeps game state on-chain for a thousandth of the cost. At GameShift: the payment APIs games charge through. In the open: hitlimit, bunWay with its 2,423 tests, and kaput. Also three hackathon podiums, if you are counting.',
          },
          { q: 'Say that in Brainfuck.', a: 'Gladly. It is the only language where nobody argues about style.', code: 'HIRE' },
          {
            q: 'Any secrets in here?',
            a: 'Three I will admit to. Press the ` key. Open the browser console. Read the response headers. There may be a fourth.',
          },
          {
            q: 'Is he available?',
            a: 'Yes. Remote, anywhere, from Karachi at UTC+5. He answers email faster than I render.',
            link: { href: 'mail', label: 'Write to him' },
          },
        ] as { q: string; a: string; code?: 'HIRE'; link?: { href: string; label: string } }[],
      },
      statsLabel: 'The numbers behind it',
      stats: [
        { to: 7, suffix: '+', label: 'years building backends' },
        { to: 1000, suffix: '×', label: 'cheaper on-chain state at Honeycomb' },
        { to: 4, suffix: '', label: 'SDK languages from one schema' },
        { to: 3, suffix: '', label: 'hackathon podiums: Sandstorm and Civic won, Grizzlython third' },
        { to: 2423, suffix: '', label: 'tests in bunWay' },
        { to: 3.3, suffix: 'K', label: 'hitlimit downloads a month' },
      ],
      stackLabel: 'Stack',
      stack: ['TypeScript', 'Node.js', 'Bun', 'NestJS', 'GraphQL', 'WebSockets'],
      // Rendered only once supplied (Shayan, 2026-11-12: hide until then).
      cv: null as null | { href: string; label: string },
      testimonials: [] as { quote: string; name: string; role: string }[],
    },
  },

  skipLink: 'Skip to content',
} as const

/** First-person Solana story. Interactive examples are labelled separately from shipped work. */
export const journeyStory = [
  {
    title: 'The art was the beginning.',
    text: 'I started with NFT communities. Behind the portraits, I built the smart contracts and full-stack experiences that gave people something to do with what they owned.',
    detail:
      'Sol Patrol, The Fracture, BONK and Mad Lads are part of that chapter. My work spanned Anchor and Rust on-chain, with GraphQL, Node and React around it.',
    topic: 'NFT communities',
    mechanism: 'An asset has an identity, an owner and a life beyond its image.',
  },
  {
    title: 'Ownership became a world.',
    text: 'Raffles and staking led me into on-chain games. At Honeycomb, I worked on the infrastructure for profiles, characters, resources and missions behind one API.',
    detail:
      'A game should be able to send a character on a mission, track its state and return a reward without its designers having to become Solana engineers.',
    topic: 'Game infrastructure',
    mechanism: 'Build your party, pick a destination and bring back resources. Ownership stays with you while the mission changes the asset’s state.',
  },
  {
    title: 'Scale the world. Shrink the cost.',
    text: 'More players mean more state. I worked on compressed accounts on the SVM: Borsh, zero-copy layouts and Merkle roots, keeping data verifiable while making it far cheaper to put on-chain.',
    detail:
      'Honeycomb’s published profile benchmark drops from 0.0052100 to 0.0000041 SOL. The important part is keeping verification: alter a record and its proof must fail.',
    topic: 'State compression',
    mechanism: 'Fold 64 records into one root. Then change a record and see why its proof no longer fits.',
  },
  {
    title: 'The chain needs a way back.',
    text: 'Writing a program is part of the job. Applications also need to find assets and react when their state changes. My work reaches into Rust, gRPC and digital asset tooling.',
    detail:
      'Honeycomb’s compression pipeline emits state for an indexer, a fork of Metaplex’s Digital Asset Standard API. GameShift added aggregation, indexers, WebSockets and in-game payment APIs.',
    topic: 'Streams & indexing',
    mechanism:
      'Request a level-up: backend → on-chain transaction → DAS → database → GraphQL refetch → client. Disconnect DAS to see indexing fall behind while transactions continue.',
  },
  {
    title: 'Make the hard part usable.',
    text: 'I built Honeycomb’s GraphQL-to-SDK generator so one schema could reach web developers and teams building in Unity, Unreal Engine and Godot.',
    detail:
      'That is the thread through my work: smart contracts, state, indexers and the developer tools that connect them. I build the systems other developers can build on.',
    topic: 'Developer tooling',
    mechanism: 'One schema, several language surfaces. These short examples illustrate the shape of typed SDK output.',
  },
] as const
