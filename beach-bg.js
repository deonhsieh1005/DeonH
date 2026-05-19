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

  /* ---- dark mode data ---- */

  var STAR_COLORS = [
    [255,250,195], [255,220,100], [200,230,255],
    [255,185,185], [255,255,255], [255,205,80],
  ];
  var stars = (function () {
    var arr = [];
    for (var i = 0; i < 190; i++) {
      var c = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      arr.push({
        x:     Math.random(),
        y:     Math.random() * 0.88,
        r:     Math.random() * 1.9 + 0.35,
        phase: Math.random() * Math.PI * 2,
        spd:   Math.random() * 0.02 + 0.004,
        col:   c,
        spark: Math.random() < 0.28,
      });
    }
    return arr;
  }());

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
      /* glow halo */
      var glow = ctx.createRadialGradient(mx, my, 0, mx, my, r * 4.5);
      glow.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.45) + ')');
      glow.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(mx, my, r * 4.5, 0, Math.PI * 2); ctx.fill();
      /* core */
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha + 0.15) + ')';
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
      /* cross sparkle on larger motes */
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

    /* wide ambient glow */
    var glow = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 4.0);
    glow.addColorStop(0,    'rgba(255,230,110,0.32)');
    glow.addColorStop(0.45, 'rgba(255,210, 90,0.11)');
    glow.addColorStop(1,    'rgba(255,190, 70,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, r * 4.0, 0, Math.PI * 2); ctx.fill();

    /* rotating rays */
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.003);
    for (var i = 0; i < 14; i++) {
      var a = (i / 14) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,220,120,0.48)';
      ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r + 7),  Math.sin(a) * (r + 7));
      ctx.lineTo(Math.cos(a) * (r + 30), Math.sin(a) * (r + 30));
      ctx.stroke();
    }
    ctx.restore();

    /* body */
    var dg = ctx.createRadialGradient(sx - r * 0.22, sy - r * 0.22, r * 0.04, sx, sy, r);
    dg.addColorStop(0,   '#FFFEF2');
    dg.addColorStop(0.25,'#FFF5B0');
    dg.addColorStop(0.62,'#FFE050');
    dg.addColorStop(1,   '#F0C028');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }

  function drawCloud(cx, cy, w) {
    var h = w * 0.55;
    var bd = [
      /* back row */
      [cx + w*0.06, cy + h*0.38, h*0.44],
      [cx + w*0.28, cy + h*0.30, h*0.50],
      [cx + w*0.54, cy + h*0.28, h*0.52],
      [cx + w*0.80, cy + h*0.34, h*0.44],
      /* front row */
      [cx + w*0.18, cy + h*0.04, h*0.54],
      [cx + w*0.46, cy - h*0.06, h*0.64],
      [cx + w*0.74, cy + h*0.06, h*0.52],
    ];
    function arcs() { bd.forEach(function(b){ ctx.arc(b[0],b[1],b[2],0,Math.PI*2); }); }

    /* 1. white fill */
    ctx.beginPath(); arcs();
    ctx.fillStyle = 'rgba(255,255,253,0.97)';
    ctx.fill();

    /* 2. diagonal hatching on shadow underside */
    ctx.save();
    ctx.beginPath(); arcs(); ctx.clip();
    ctx.strokeStyle = 'rgba(44,34,24,0.18)';
    ctx.lineWidth = 0.9; ctx.lineCap = 'butt';
    var dy = h * 0.72;
    for (var hx = cx - dy; hx < cx + w + dy; hx += 5) {
      ctx.beginPath();
      ctx.moveTo(hx,      cy + h*0.10);
      ctx.lineTo(hx + dy, cy + h*0.10 + dy);
      ctx.stroke();
    }
    ctx.restore();

    /* 3. outline each bump (back→front so front fills cover interior arcs) */
    bd.forEach(function(b, i) {
      if (i >= 4) {
        ctx.beginPath(); ctx.arc(b[0],b[1],b[2],0,Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,253,0.97)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(b[0],b[1],b[2],0,Math.PI*2);
      ctx.strokeStyle = 'rgba(36,28,20,0.62)';
      ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.stroke();
    });
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
     DARK MODE
  ============================================================ */

  function drawNightSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    '#030818');
    g.addColorStop(0.35, '#050d28');
    g.addColorStop(0.70, '#071235');
    g.addColorStop(1,    '#050920');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars() {
    stars.forEach(function (s) {
      var alpha = 0.5 + Math.sin(t * s.spd + s.phase) * 0.45;
      if (alpha < 0.05) alpha = 0.05;
      var r  = s.r * (0.8 + Math.sin(t * s.spd * 0.7 + s.phase) * 0.2);
      var sx = s.x * W, sy = s.y * H;
      var c  = s.col;
      /* glow halo */
      var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4.5);
      glow.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.35) + ')');
      glow.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(sx, sy, r * 4.5, 0, Math.PI * 2); ctx.fill();
      /* core */
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      /* cross sparkle on larger stars */
      if (s.spark && r > 1.1) {
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.55) + ')';
        ctx.lineWidth   = 0.7;
        var sl = r * 3.5;
        ctx.beginPath();
        ctx.moveTo(sx - sl, sy); ctx.lineTo(sx + sl, sy);
        ctx.moveTo(sx, sy - sl); ctx.lineTo(sx, sy + sl);
        ctx.stroke();
      }
    });
  }

  function _planetGlow(px, py, r, r0, g0, g1) {
    var glow = ctx.createRadialGradient(px, py, 0, px, py, r * r0);
    glow.addColorStop(0, g0); glow.addColorStop(1, g1);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(px, py, r * r0, 0, Math.PI * 2); ctx.fill();
  }

  function drawSaturn(px, py, r) {
    _planetGlow(px, py, r, 4.0, 'rgba(215,185,110,0.18)', 'rgba(215,185,110,0)');
    /* back ring */
    ctx.save(); ctx.translate(px, py);
    ctx.strokeStyle = 'rgba(195,168,100,0.52)'; ctx.lineWidth = r * 0.34;
    ctx.beginPath(); ctx.ellipse(0, 0, r*1.90, r*0.50, -0.20, Math.PI, Math.PI*2, false); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,205,130,0.28)'; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.ellipse(0, 0, r*2.15, r*0.57, -0.20, Math.PI, Math.PI*2, false); ctx.stroke();
    ctx.restore();
    /* body */
    var g = ctx.createRadialGradient(px - r*0.28, py - r*0.28, r*0.04, px, py, r);
    g.addColorStop(0, '#FFF8DC'); g.addColorStop(0.30, '#EDD878');
    g.addColorStop(0.65, '#C4A040'); g.addColorStop(1, '#856020');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = 'rgba(155,95,25,0.25)';
    ctx.fillRect(px - r, py - r*0.18, r*2, r*0.34);
    ctx.fillStyle = 'rgba(195,148,55,0.18)';
    ctx.fillRect(px - r, py + r*0.28, r*2, r*0.22);
    ctx.restore();
    /* front ring */
    ctx.save(); ctx.translate(px, py);
    ctx.strokeStyle = 'rgba(210,185,118,0.68)'; ctx.lineWidth = r * 0.34;
    ctx.beginPath(); ctx.ellipse(0, 0, r*1.90, r*0.50, -0.20, 0, Math.PI, false); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,215,140,0.35)'; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.ellipse(0, 0, r*2.15, r*0.57, -0.20, 0, Math.PI, false); ctx.stroke();
    ctx.restore();
  }

  function drawJupiter(px, py, r) {
    _planetGlow(px, py, r, 3.2, 'rgba(210,145,85,0.16)', 'rgba(210,145,85,0)');
    var g = ctx.createRadialGradient(px - r*0.26, py - r*0.26, r*0.04, px, py, r);
    g.addColorStop(0, '#FFF2E0'); g.addColorStop(0.35, '#E8B870');
    g.addColorStop(0.75, '#C07840'); g.addColorStop(1, '#7A3E1A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
    [ [-0.58,0.17,'rgba(175,85,35,0.42)'], [-0.28,0.13,'rgba(235,190,110,0.32)'],
      [-0.06,0.20,'rgba(155,68,28,0.48)'], [ 0.24,0.15,'rgba(215,162,78,0.30)'],
      [ 0.50,0.20,'rgba(145,60,22,0.40)'] ].forEach(function(b) {
      ctx.fillStyle = b[2]; ctx.fillRect(px - r, py + b[0]*r, r*2, b[1]*r);
    });
    ctx.fillStyle = 'rgba(185,55,38,0.58)';
    ctx.beginPath(); ctx.ellipse(px + r*0.30, py - r*0.07, r*0.23, r*0.13, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawEarth(px, py, r) {
    _planetGlow(px, py, r, 3.2, 'rgba(55,135,215,0.20)', 'rgba(55,135,215,0)');
    var g = ctx.createRadialGradient(px - r*0.24, py - r*0.24, r*0.04, px, py, r);
    g.addColorStop(0, '#C0E8FF'); g.addColorStop(0.38, '#2E9AE0');
    g.addColorStop(0.78, '#0F5AA8'); g.addColorStop(1, '#07386A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = 'rgba(48,136,58,0.78)';
    ctx.beginPath(); ctx.ellipse(px - r*0.26, py - r*0.08, r*0.20, r*0.40, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + r*0.18, py - r*0.16, r*0.30, r*0.20, 0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + r*0.16, py + r*0.20, r*0.13, r*0.24, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.ellipse(px - r*0.08, py - r*0.38, r*0.32, r*0.09, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + r*0.22, py + r*0.32, r*0.26, r*0.08, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    var atm = ctx.createRadialGradient(px, py, r*0.86, px, py, r*1.14);
    atm.addColorStop(0, 'rgba(100,185,255,0)'); atm.addColorStop(1, 'rgba(100,185,255,0.24)');
    ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(px, py, r*1.14, 0, Math.PI*2); ctx.fill();
  }

  function drawMars(px, py, r) {
    _planetGlow(px, py, r, 3.2, 'rgba(200,88,48,0.16)', 'rgba(200,88,48,0)');
    var g = ctx.createRadialGradient(px - r*0.26, py - r*0.26, r*0.04, px, py, r);
    g.addColorStop(0, '#FFB890'); g.addColorStop(0.38, '#D85528');
    g.addColorStop(0.78, '#9E3515'); g.addColorStop(1, '#5C1808');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = 'rgba(138,58,18,0.42)';
    ctx.beginPath(); ctx.ellipse(px + r*0.16, py + r*0.22, r*0.34, r*0.20, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(238,228,218,0.68)';
    ctx.beginPath(); ctx.ellipse(px, py - r*0.74, r*0.36, r*0.16, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawNeptune(px, py, r) {
    _planetGlow(px, py, r, 3.2, 'rgba(38,88,200,0.20)', 'rgba(38,88,200,0)');
    var g = ctx.createRadialGradient(px - r*0.24, py - r*0.24, r*0.04, px, py, r);
    g.addColorStop(0, '#A8CCFF'); g.addColorStop(0.35, '#2858E0');
    g.addColorStop(0.75, '#0E2CA8'); g.addColorStop(1, '#080F60');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = 'rgba(78,138,255,0.30)';
    ctx.fillRect(px - r, py - r*0.14, r*2, r*0.28);
    ctx.fillStyle = 'rgba(18,48,178,0.24)';
    ctx.fillRect(px - r, py + r*0.32, r*2, r*0.24);
    ctx.fillStyle = 'rgba(8,18,100,0.52)';
    ctx.beginPath(); ctx.ellipse(px - r*0.20, py + r*0.06, r*0.20, r*0.11, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawPlanets() {
    var s = Math.min(W, H);
    drawSaturn (W*0.12, H*0.22, s*0.052);
    drawJupiter(W*0.82, H*0.18, s*0.040);
    drawEarth  (W*0.68, H*0.74, s*0.028);
    drawMars   (W*0.90, H*0.50, s*0.020);
    drawNeptune(W*0.06, H*0.58, s*0.024);
  }

  /* waxing crescent — two-arc path: outer circle edge + shadow-circle terminator */
  function drawCrescent() {
    var mx = W * 0.38, my = H * 0.30;
    var r  = Math.min(W, H) * 0.155;
    var d  = r * 0.62;   /* shadow-circle offset leftward */

    /* compute intersection points of outer circle and shadow circle */
    var xi    = -d / 2;                          /* x of both tips, rel. to outer centre */
    var yi    = Math.sqrt(r * r - xi * xi);      /* y magnitude of both tips             */

    /* angles at the two tips, measured from outer-circle centre */
    var aTop  = Math.atan2(-yi, xi);             /* upper tip ≈ -108° */
    var aBot  = Math.atan2( yi, xi);             /* lower tip ≈ +108° */

    /* angles at the same tips, measured from shadow-circle centre (mx-d, my) */
    var sxi   = xi + d;                          /* = d/2 */
    var aTopS = Math.atan2(-yi, sxi);            /* upper tip ≈ -72° */
    var aBotS = Math.atan2( yi, sxi);            /* lower tip ≈ +72° */

    /* ambient glow centred on the crescent */
    var glow = ctx.createRadialGradient(mx, my, r * 0.3, mx, my, r * 3.8);
    glow.addColorStop(0,    'rgba(245,200,55,0.30)');
    glow.addColorStop(0.45, 'rgba(220,150,35,0.10)');
    glow.addColorStop(1,    'rgba(200,120,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(mx, my, r * 3.8, 0, Math.PI * 2); ctx.fill();

    /* crescent fill:
       1. outer arc CW from upper tip → lower tip (right/lit side of outer circle)
       2. shadow arc CCW from lower tip → upper tip (right/concave side of shadow circle = terminator) */
    var cg = ctx.createRadialGradient(mx + r * 0.22, my - r * 0.18, 0, mx, my, r);
    cg.addColorStop(0,    '#FFFDE5');
    cg.addColorStop(0.22, '#FADB38');
    cg.addColorStop(0.58, '#E89020');
    cg.addColorStop(1,    '#C06815');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(mx,     my, r, aTop,  aBot,  false);  /* outer edge, CW  */
    ctx.arc(mx - d, my, r, aBotS, aTopS, true);   /* terminator, CCW */
    ctx.closePath();
    ctx.fill();
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
    } else {
      drawNightSky();
      drawPlanets();
      drawStars();
      drawCrescent();
    }
    t++;
    raf = requestAnimationFrame(frame);
  }

  function sync() {
    canvas.style.display = 'block';
    document.body.style.background = 'transparent';
    if (!raf) frame();
  }

  init();
  sync();

  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.attributeName === 'data-theme') sync(); });
  }).observe(document.body, { attributes: true });

})();
