(function () {
  'use strict';

  var canvas, ctx, raf, t = 0;
  var W, H;

  var TAU = Math.PI * 2;

  /* ---- dark mode wave config ---- */
  var WAVE = { xGap: 12, yGap: 36 };

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'beach-bg';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:none;';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!isLight()) renderBooks();
  }

  function isLight() {
    return document.body.getAttribute('data-theme') === 'light';
  }

  /* ============================================================
     LIGHT MODE — LIVE CLOCK
  ============================================================ */

  function drawClock() {
    /* soft warm wall */
    ctx.fillStyle = '#EDE8E0';
    ctx.fillRect(0, 0, W, H);

    var cx     = W * 0.5;
    var cy     = H * 0.5;
    var outerR = Math.min(W, H) * 0.44;
    var innerR = outerR * 0.700;

    _clockBezel(cx, cy, outerR, innerR);
    _clockFace(cx, cy, innerR);
    _clockNumbers(cx, cy, innerR);
    _clockHands(cx, cy, innerR);
  }

  function _clockBezel(cx, cy, outerR, innerR) {
    /* base red */
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, TAU);
    ctx.fillStyle = '#CC1212'; ctx.fill();

    /* pillowy highlight — lighter at upper-left, darker at lower-right */
    var hl = ctx.createRadialGradient(
      cx - outerR * 0.20, cy - outerR * 0.36, innerR * 0.45,
      cx, cy, outerR * 1.02
    );
    hl.addColorStop(0,    'rgba(255,110,110,0.00)');
    hl.addColorStop(0.40, 'rgba(255,100,100,0.34)');
    hl.addColorStop(0.70, 'rgba(200,50,50,0.06)');
    hl.addColorStop(1,    'rgba(70,0,0,0.42)');
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, TAU);
    ctx.fillStyle = hl; ctx.fill();

    /* inner-edge shadow where bezel meets face */
    var is = ctx.createRadialGradient(cx, cy, innerR * 0.84, cx, cy, innerR * 1.08);
    is.addColorStop(0, 'rgba(0,0,0,0)');
    is.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, TAU);
    ctx.fillStyle = is; ctx.fill();
  }

  function _clockFace(cx, cy, r) {
    /* cream fill */
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = '#FDF6EB'; ctx.fill();

    /* graph-paper grid clipped to face */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    var gs = Math.round(r * 0.088);
    ctx.strokeStyle = 'rgba(185,35,35,0.16)'; ctx.lineWidth = 0.7;
    for (var gx = cx % gs; gx < W; gx += gs) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = cy % gs; gy < H; gy += gs) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.restore();

    /* subtle face rim */
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = 'rgba(160,25,25,0.22)'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function _clockNumbers(cx, cy, r) {
    var nr = r * 0.78;
    var fs = r * 0.185;
    ctx.fillStyle    = '#CC1212';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = '900 ' + fs + 'px "Trebuchet MS", Arial, sans-serif';
    for (var n = 1; n <= 12; n++) {
      var a = (n / 12) * TAU - Math.PI * 0.5;
      ctx.fillText(n, cx + Math.cos(a) * nr, cy + Math.sin(a) * nr);
    }
  }

  function _hand(cx, cy, angle, len, wid, tail) {
    ctx.save();
    ctx.strokeStyle = '#CC1212'; ctx.lineWidth = wid; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * (tail || 0), cy - Math.sin(angle) * (tail || 0));
    ctx.lineTo(cx + Math.cos(angle) * len,         cy + Math.sin(angle) * len);
    ctx.stroke();
    ctx.restore();
  }

  function _clockHands(cx, cy, r) {
    var now = new Date();
    var sec = now.getSeconds() + now.getMilliseconds() / 1000;
    var min = now.getMinutes() + sec / 60;
    var hrs = (now.getHours() % 12) + min / 60;

    _hand(cx, cy, hrs / 12 * TAU - Math.PI * 0.5, r * 0.50, r * 0.058);
    _hand(cx, cy, min / 60 * TAU - Math.PI * 0.5, r * 0.70, r * 0.040);
    _hand(cx, cy, sec / 60 * TAU - Math.PI * 0.5, r * 0.74, r * 0.016, r * 0.20);

    /* center cap */
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.055, 0, TAU);
    ctx.fillStyle = '#CC1212'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.024, 0, TAU);
    ctx.fillStyle = '#FDF6EB'; ctx.fill();
  }

  /* ============================================================
     DARK MODE — ILLUSTRATED BOOKSHELF
  ============================================================ */

  var BOOKSHELF = [
    { t: 'THE DESIGN OF\nEVERYDAY\nTHINGS',  bg: '#F0E4C8', tc: '#2A1A08', w: 22, hf: 0.56 },
    { t: 'GOLF',                               bg: '#F5C518', tc: '#000000', w: 42, hf: 0.68 },
    { t: 'BIOMEDICAL\nENGINEERING',           bg: '#C41E3A', tc: '#FFFFFF', w: 24, hf: 0.60 },
    { t: 'TAIWAN',                             bg: '#1D4ED8', tc: '#FFFFFF', w: 30, hf: 0.54 },
    { t: 'JAPAN',                              bg: '#DC2626', tc: '#FFFFFF', w: 28, hf: 0.65 },
    { t: 'CHINA',                              bg: '#B91C1C', tc: '#FBBF24', w: 28, hf: 0.58 },
    { t: 'UNITED\nSTATES',                    bg: '#1E3A5F', tc: '#FFFFFF', w: 26, hf: 0.52 },
    { t: 'HIKING\nNATIONAL\nPARKS',          bg: '#4A7C59', tc: '#FFFFFF', w: 24, hf: 0.64 },
    { t: 'SKIING',                             bg: '#BAE6FD', tc: '#1E3A5F', w: 26, hf: 0.50 },
    { t: 'SINGLE-DIGIT\nHANDICAP',           bg: '#166534', tc: '#FFFFFF', w: 22, hf: 0.58 },
    { t: 'UC DAVIS',                           bg: '#002855', tc: '#CFC493', w: 32, hf: 0.62 },
    { t: 'BOSTON\nSCIENTIFIC',               bg: '#0F172A', tc: '#60A5FA', w: 26, hf: 0.60 },
    { t: 'MANDARIN',                           bg: '#F97316', tc: '#FFFFFF', w: 26, hf: 0.54 },
    { t: 'JAPANESE',                           bg: '#7C3AED', tc: '#FFFFFF', w: 26, hf: 0.62 },
    { t: 'CLINICAL\nSTUDIES',                 bg: '#0E7490', tc: '#FFFFFF', w: 24, hf: 0.56 },
    { t: 'MEDICAL\nDEVICES',                  bg: '#1F4A6F', tc: '#FFFFFF', w: 24, hf: 0.52 },
    { t: 'THE ART\nOF TRAVEL',               bg: '#BE185D', tc: '#FFFFFF', w: 26, hf: 0.58 },
    { t: 'PHOTO\nALBUM',                      bg: '#1C1917', tc: '#E7E5E4', w: 30, hf: 0.53 },
    { t: 'DEON',                               bg: '#D97706', tc: '#000000', w: 38, hf: 0.72 },
    { t: 'GOLF\nARCHITECTURE',               bg: '#78350F', tc: '#FDE68A', w: 24, hf: 0.60 },
    { t: 'EAST ASIA',                          bg: '#BE123C', tc: '#FFFFFF', w: 28, hf: 0.54 },
    { t: 'TRAIL\nRUNNING',                    bg: '#854D0E', tc: '#FFFFFF', w: 24, hf: 0.56 },
    { t: 'CARDIOVASCULAR\nDEVICES',          bg: '#7F1D1D', tc: '#FCA5A5', w: 22, hf: 0.62 },
    { t: 'PACIFIC\nRIM',                      bg: '#164E63', tc: '#7DD3FC', w: 24, hf: 0.54 },
    { t: 'TYPOGRAPHY',                         bg: '#F5F5F0', tc: '#1C1917', w: 22, hf: 0.58 },
    { t: 'INTERACTION\nDESIGN',              bg: '#1E1B4B', tc: '#A5B4FC', w: 24, hf: 0.56 },
    { t: 'BIOMECHANICS',                       bg: '#14532D', tc: '#FFFFFF', w: 24, hf: 0.60 },
    { t: 'ENGINEERING\nSOLUTIONS',           bg: '#374151', tc: '#F3F4F6', w: 26, hf: 0.56 },
    { t: 'WINTER\nSPORTS',                    bg: '#E2E8F0', tc: '#1E3A5F', w: 24, hf: 0.52 },
    { t: 'GLOBE\nTROTTER',                    bg: '#5B21B6', tc: '#FFFFFF', w: 26, hf: 0.58 },
  ];

  function renderBooks() {
    if (!W || !H) return;

    /* dark room background */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0806');
    bg.addColorStop(1, '#110e0a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var shelfY = H * 0.80;
    var shelfH = Math.max(8, H * 0.018);

    /* floor */
    ctx.fillStyle = '#080605';
    ctx.fillRect(0, shelfY + shelfH, W, H - shelfY - shelfH);

    /* shelf drop shadow */
    var ss = ctx.createLinearGradient(0, shelfY + shelfH, 0, shelfY + shelfH + 22);
    ss.addColorStop(0, 'rgba(0,0,0,0.6)');
    ss.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ss; ctx.fillRect(0, shelfY + shelfH, W, 22);

    /* wood shelf */
    var sw = ctx.createLinearGradient(0, shelfY, 0, shelfY + shelfH);
    sw.addColorStop(0, '#9B7040'); sw.addColorStop(0.6, '#7B5228'); sw.addColorStop(1, '#4A2810');
    ctx.fillStyle = sw; ctx.fillRect(0, shelfY, W, shelfH);
    /* grain */
    ctx.save(); ctx.globalAlpha = 0.10; ctx.strokeStyle = '#3A1E08'; ctx.lineWidth = 1;
    for (var gi = 8; gi < W; gi += 48 + ((gi * 7) % 32)) {
      ctx.beginPath(); ctx.moveTo(gi, shelfY); ctx.lineTo(gi + 12, shelfY + shelfH); ctx.stroke();
    }
    ctx.restore();

    /* book spine path helper (rounded top corners only) */
    function spinePath(bx, by, bw, bh) {
      var r = Math.min(3, bw * 0.3);
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
    }

    var GAP = 3;
    var totalW = 0;
    for (var bi = 0; bi < BOOKSHELF.length; bi++) totalW += BOOKSHELF[bi].w + GAP;

    /* center the tile, then extend left to fill edge */
    var startX = ((W - totalW) / 2) % totalW;
    if (startX > 0) startX -= totalW;

    var x = startX, pass = 0;
    while (x < W + 40) {
      var b    = BOOKSHELF[pass % BOOKSHELF.length];
      /* slight height jitter so repeat tiles look different */
      var jit  = [1, 0.93, 1.05, 0.97, 1.02][pass % 5];
      var bH   = shelfY * b.hf * jit;
      var bY   = shelfY - bH;

      /* drop shadow to the right */
      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(x + b.w, bY + 8, 5, bH);

      /* book body */
      spinePath(x, bY, b.w, bH);
      ctx.fillStyle = b.bg; ctx.fill();

      /* spine sheen left→right */
      var sg = ctx.createLinearGradient(x, 0, x + b.w, 0);
      sg.addColorStop(0,    'rgba(255,255,255,0.22)');
      sg.addColorStop(0.35, 'rgba(255,255,255,0.05)');
      sg.addColorStop(1,    'rgba(0,0,0,0.20)');
      spinePath(x, bY, b.w, bH);
      ctx.fillStyle = sg; ctx.fill();

      /* outline */
      spinePath(x, bY, b.w, bH);
      ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 0.5; ctx.stroke();


      x += b.w + GAP;
      pass++;
    }
  }

  /* ============================================================
     MAIN LOOP
  ============================================================ */

  function frame() {
    W = canvas.width; H = canvas.height;
    if (isLight()) {
      drawClock();
      t++;
      raf = requestAnimationFrame(frame);
    } else {
      raf = null;
      renderBooks();   /* static — draw once, no loop */
    }
  }

  function sync() {
    canvas.style.display = 'block';
    document.body.style.background = 'transparent';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    frame();
  }

  init();
  sync();

  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.attributeName === 'data-theme') sync(); });
  }).observe(document.body, { attributes: true });

})();
