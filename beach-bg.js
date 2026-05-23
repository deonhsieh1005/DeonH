(function () {
  'use strict';

  var canvas, ctx, raf, t = 0;
  var W, H;

  /* ---- light mode data ---- */
  var clouds = [
    { xRel: 0.04, yFrac: 0.10, w: 148 },
    { xRel: 0.30, yFrac: 0.06, w: 112 },
    { xRel: 0.56, yFrac: 0.13, w: 170 },
    { xRel: 0.76, yFrac: 0.07, w: 130 },
    { xRel: 0.16, yFrac: 0.28, w:  88 },
    { xRel: 0.68, yFrac: 0.26, w: 104 },
  ];

  var MOTE_COLORS = [
    [255,200, 80], [255,180, 55], [245,220,100],
    [255,225,140], [255,210, 95], [240,170, 60],
  ];
  var motes = (function () {
    var arr = [];
    for (var i = 0; i < 160; i++) {
      var c = MOTE_COLORS[Math.floor(Math.random() * MOTE_COLORS.length)];
      arr.push({
        x:     Math.random(),
        y:     Math.random() * 0.88,
        r:     Math.random() * 1.7 + 0.35,
        phase: Math.random() * Math.PI * 2,
        spd:   Math.random() * 0.018 + 0.004,
        col:   c,
        spark: Math.random() < 0.26,
      });
    }
    return arr;
  }());

  var GRASS_COLORS = ['#3AAD55','#2E9648','#48BB62','#267838','#56C46A','#1E6B34','#4DB85C','#338A42'];
  var grassBlades = (function () {
    var arr = [];
    for (var i = 0; i < 420; i++) {
      arr.push({
        x:     Math.random(),
        hFrac: 0.032 + Math.random() * 0.082,
        lean:  (Math.random() - 0.5) * 1.1,
        w:     1.2 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2,
        col:   GRASS_COLORS[Math.floor(Math.random() * GRASS_COLORS.length)],
      });
    }
    return arr;
  }());

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
     LIGHT MODE
  ============================================================ */

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    '#4A9CC8');
    g.addColorStop(0.38, '#8DCBE8');
    g.addColorStop(0.72, '#C8E8F5');
    g.addColorStop(1,    '#F4E1AE');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMotes() {
    motes.forEach(function (m) {
      var alpha = 0.28 + Math.sin(t * m.spd + m.phase) * 0.22;
      if (alpha < 0.06) alpha = 0.06;
      var r  = m.r * (0.8 + Math.sin(t * m.spd * 0.7 + m.phase) * 0.2);
      var mx = m.x * W, my = m.y * H;
      var c  = m.col;
      var glow = ctx.createRadialGradient(mx, my, 0, mx, my, r * 4.5);
      glow.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.45) + ')');
      glow.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(mx, my, r * 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha + 0.15) + ')';
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
      if (m.spark && r > 1.0) {
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.55) + ')';
        ctx.lineWidth   = 0.7;
        var sl = r * 3.5;
        ctx.beginPath();
        ctx.moveTo(mx - sl, my); ctx.lineTo(mx + sl, my);
        ctx.moveTo(mx, my - sl); ctx.lineTo(mx, my + sl);
        ctx.stroke();
      }
    });
  }

  function drawSun() {
    var sx = W * 0.74, sy = H * 0.20;
    var r  = Math.min(W, H) * 0.095;

    var glow = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 3.0);
    glow.addColorStop(0,   'rgba(235,205,40,0.22)');
    glow.addColorStop(1,   'rgba(235,205,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, r * 3.0, 0, Math.PI * 2); ctx.fill();

    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = '#EDD030';
    for (var ri = 0; ri < 12; ri++) {
      var ra = (ri / 12) * Math.PI * 2 + Math.sin(ri * 2.3) * 0.05;
      ctx.save(); ctx.rotate(ra);
      var rd1 = r * 1.20, rd2 = r * 1.65;
      var hw1 = r * 0.075, hw2 = r * 0.038;
      ctx.beginPath();
      ctx.moveTo(-hw1, -rd1);
      ctx.bezierCurveTo(-hw1*1.2, -(rd1+(rd2-rd1)*0.38), -hw2*1.1, -rd2+r*0.04, 0, -rd2);
      ctx.bezierCurveTo( hw2*1.1, -rd2+r*0.04,  hw1*1.2, -(rd1+(rd2-rd1)*0.38), hw1, -rd1);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    function sunPath() {
      var pts = 48;
      ctx.beginPath();
      for (var pi = 0; pi <= pts; pi++) {
        var pa = (pi / pts) * Math.PI * 2;
        var wob = 1 + 0.022 * Math.sin(pa*6+1.1)
                    + 0.014 * Math.sin(pa*11+2.3)
                    + 0.008 * Math.sin(pa*17+0.9);
        var px = sx + r * wob * Math.cos(pa);
        var py = sy + r * wob * Math.sin(pa);
        if (pi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    sunPath();
    ctx.fillStyle = '#DEBA1A';
    ctx.fill();

    ctx.save();
    sunPath(); ctx.clip();
    for (var yi = 0; yi < 30; yi++) {
      var yp  = sy - r * 0.88 + yi * (r * 1.76 / 29);
      var xsh = Math.sin(yi * 0.68 + 1.2) * r * 0.07;
      var alp = 0.08 + Math.abs(Math.sin(yi * 0.54)) * 0.07;
      ctx.strokeStyle = 'rgba(185,145,5,' + alp + ')';
      ctx.lineWidth   = 0.9 + Math.abs(Math.sin(yi * 1.1)) * 0.9;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(sx - r*0.90 + xsh, yp + Math.sin(yi*0.42)*1.5);
      ctx.lineTo(sx + r*0.90 + xsh, yp + Math.sin(yi*0.42+0.5)*1.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCloud(cx, cy, w) {
    var h  = w * 0.50;
    var bx = cx;
    var by = cy + h * 0.50;

    function path() {
      ctx.beginPath();
      ctx.moveTo(bx + w*0.02, by);
      ctx.lineTo(bx + w*0.98, by);
      ctx.bezierCurveTo(bx+w*1.02, by,        bx+w*1.02, by-h*0.24, bx+w*0.93, by-h*0.30);
      ctx.bezierCurveTo(bx+w*1.00, by-h*0.55, bx+w*0.82, by-h*0.62, bx+w*0.74, by-h*0.40);
      ctx.bezierCurveTo(bx+w*0.78, by-h*0.82, bx+w*0.62, by-h*0.88, bx+w*0.56, by-h*0.62);
      ctx.bezierCurveTo(bx+w*0.60, by-h*1.10, bx+w*0.36, by-h*1.10, bx+w*0.38, by-h*0.66);
      ctx.bezierCurveTo(bx+w*0.30, by-h*0.90, bx+w*0.16, by-h*0.80, bx+w*0.18, by-h*0.52);
      ctx.bezierCurveTo(bx+w*0.06, by-h*0.56, bx-w*0.01, by-h*0.35, bx+w*0.02, by-h*0.18);
      ctx.bezierCurveTo(bx-w*0.01, by-h*0.14, bx-w*0.01, by, bx+w*0.02, by);
      ctx.closePath();
    }

    ctx.save();
    ctx.translate(0, h * 0.10);
    path();
    var sg = ctx.createLinearGradient(cx + w*0.5, by - h*0.2, cx + w*0.5, by + h*0.12);
    sg.addColorStop(0, 'rgba(150,165,200,0)');
    sg.addColorStop(1, 'rgba(135,155,195,0.22)');
    ctx.fillStyle = sg; ctx.fill();
    ctx.restore();

    path();
    var g = ctx.createLinearGradient(cx + w*0.5, by - h*1.12, cx + w*0.5, by);
    g.addColorStop(0,    'rgba(255,255,255,0.97)');
    g.addColorStop(0.55, 'rgba(244,247,255,0.95)');
    g.addColorStop(1,    'rgba(212,220,238,0.88)');
    ctx.fillStyle = g; ctx.fill();
  }

  function drawClouds() {
    clouds.forEach(function (c) {
      drawCloud(c.xRel * W, c.yFrac * H, c.w);
    });
  }

  function drawGrass() {
    ctx.lineCap = 'round';
    grassBlades.forEach(function (b) {
      var bx   = b.x * W;
      var bh   = b.hFrac * H;
      var lean = b.lean + Math.sin(t * 0.011 + b.phase) * 0.10;
      var cpx  = bx + lean * bh * 0.38;
      var cpy  = H  - bh * 0.62;
      var tx   = bx + lean * bh;
      var ty   = H  - bh;
      ctx.strokeStyle = b.col;
      ctx.lineWidth   = b.w;
      ctx.beginPath();
      ctx.moveTo(bx, H);
      ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      ctx.stroke();
    });
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
      drawSky();
      drawMotes();
      drawSun();
      drawClouds();
      drawGrass();
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
