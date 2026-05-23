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

  /* ---- dark mode wave data ---- */
  var waveLines = [];
  var waveMouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
  var WAVE = {
    waveSpeedX:    0.0125,
    waveSpeedY:    0.01,
    waveAmpX:      40,
    waveAmpY:      20,
    friction:      0.9,
    tension:       0.01,
    maxCursorMove: 120,
    xGap:          12,
    yGap:          36,
  };

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'beach-bg';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:none;';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) {
      if (waveMouse.x !== -9999) {
        waveMouse.vx = e.clientX - waveMouse.x;
        waveMouse.vy = e.clientY - waveMouse.y;
      }
      waveMouse.x = e.clientX;
      waveMouse.y = e.clientY;
    });
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initWaves();
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
     DARK MODE — WAVE LINES
     Physics: spring-based point grid, cursor repulsion, sin waves
  ============================================================ */

  function initWaves() {
    if (!W || !H) return;
    waveLines = [];
    var cols = Math.ceil(W / WAVE.xGap) + 2;
    var rows = Math.ceil(H / WAVE.yGap) + 2;
    // Row-based: each entry in waveLines is one horizontal line
    for (var j = 0; j < rows; j++) {
      var pts = [];
      for (var i = 0; i < cols; i++) {
        var ox = i * WAVE.xGap;
        var oy = j * WAVE.yGap;
        /* ph: column-based phase so each line has its own timing */
        var ph = i * 0.38 + Math.sin(i * 0.71) * 1.4;
        pts.push({ ox: ox, oy: oy, x: ox, y: oy, vx: 0, vy: 0, ph: ph });
      }
      waveLines.push(pts);
    }
  }

  function updateWaves() {
    var mx   = waveMouse.x;
    var my   = waveMouse.y;
    var mvx  = waveMouse.vx;
    var mvy  = waveMouse.vy;
    // Consume velocity — one-frame impulse so stationary cursor applies no force
    waveMouse.vx = 0;
    waveMouse.vy = 0;
    var maxD = WAVE.maxCursorMove;
    for (var j = 0; j < waveLines.length; j++) {       // j = row index
      var line = waveLines[j];
      for (var i = 0; i < line.length; i++) {           // i = col index
        var p  = line[i];
        /* three overlapping harmonics — different freqs + speeds break the uniform look */
        var ph = p.ph;
        var tx = p.ox
          + Math.cos(t * WAVE.waveSpeedX + j * 0.30 + ph * 0.5)  * 40
          + Math.cos(t * 0.0083          + j * 0.72 + ph * 2.1)  * 12
          + Math.cos(t * 0.0192          + j * 0.11 + ph * 0.44) * 18;
        var ty = p.oy
          + Math.sin(t * WAVE.waveSpeedY + i * 0.10 + ph * 1.3)  * 20
          + Math.sin(t * 0.0069          + i * 0.17 + ph)        * 8;
        /* cursor velocity push */
        var dx   = mx - p.ox;
        var dy   = my - p.oy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxD) {
          var strength = 1 - dist / maxD;
          p.vx += mvx * strength * 0.35;
          p.vy += mvy * strength * 0.35;
        }
        /* spring step */
        p.vx = p.vx * WAVE.friction + (tx - p.x) * WAVE.tension;
        p.vy = p.vy * WAVE.friction + (ty - p.y) * WAVE.tension;
        p.x += p.vx;
        p.y += p.vy;
      }
    }
  }

  function drawWaveLines() {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1.0;
    ctx.globalAlpha = 0.65;
    ctx.lineCap     = 'round';
    // One smooth horizontal curve per row
    for (var j = 0; j < waveLines.length; j++) {
      var line = waveLines[j];
      if (line.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (var i = 1; i < line.length - 1; i++) {
        var xc = (line[i].x + line[i + 1].x) * 0.5;
        var yc = (line[i].y + line[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(line[i].x, line[i].y, xc, yc);
      }
      ctx.lineTo(line[line.length - 1].x, line[line.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
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
      if (waveLines.length === 0) initWaves();
      ctx.fillStyle = '#0c0a08';
      ctx.fillRect(0, 0, W, H);
      updateWaves();
      drawWaveLines();
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
