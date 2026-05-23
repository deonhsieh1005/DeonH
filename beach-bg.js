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
     LIGHT MODE — FLIP CLOCK
  ============================================================ */

  var FC = {
    hr:  { cur: -1, prv: 0, flip: 1.0, col: '#5B8FA8' },
    min: { cur: -1, prv: 0, flip: 1.0, col: '#3A8C7E' },
    SPD: 0.055,
  };

  function _p2(n) { return (n < 10 ? '0' : '') + n; }

  function _rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function _panelHalf(txt, x, y, w, h, col, top) {
    ctx.save();
    ctx.beginPath();
    if (top) {
      ctx.rect(x, y, w, h * 0.5);
    } else {
      ctx.rect(x, y + h * 0.5, w, h * 0.5);
    }
    ctx.clip();
    _rr(x, y, w, h, h * 0.06);
    ctx.fillStyle = col; ctx.fill();
    /* inner shadow at split line */
    var sg = ctx.createLinearGradient(0, y + h * 0.5 - (top ? 18 : 0), 0, y + h * 0.5 + (top ? 0 : 18));
    sg.addColorStop(0, top ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.35)');
    sg.addColorStop(1, top ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)');
    _rr(x, y, w, h, h * 0.06);
    ctx.fillStyle = sg; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    if (top) {
      ctx.rect(x, y, w, h * 0.5);
    } else {
      ctx.rect(x, y + h * 0.5, w, h * 0.5);
    }
    ctx.clip();
    ctx.fillStyle = '#E8C05A';
    ctx.font = '800 ' + (h * 0.62) + 'px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  function _flipPanel(fc, x, y, w, h) {
    var p   = fc.flip;
    var mid = y + h * 0.5;
    var r   = h * 0.06;
    var darkcol = fc.col;

    /* static bottom half = new value */
    _panelHalf(_p2(fc.cur), x, y, w, h, darkcol, false);

    if (p < 1.0) {
      /* static top half = new value (visible when fold reveals it) */
      _panelHalf(_p2(fc.cur), x, y, w, h, darkcol, true);

      if (p > 0.5) {
        /* phase 1: old top half collapses downward */
        var angle1 = (1 - p) * 2;          /* 0→1 as p goes 1→0.5 */
        var sv1    = Math.cos(angle1 * Math.PI * 0.5);
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, mid - y); ctx.clip();
        ctx.translate(0, mid); ctx.scale(1, sv1); ctx.translate(0, -mid);
        _panelHalf(_p2(fc.prv), x, y, w, h, darkcol, true);
        ctx.restore();
      } else {
        /* phase 2: new bottom half unfolds downward */
        var angle2 = p * 2;                /* 1→0 as p goes 0.5→0 */
        var sv2    = Math.cos((1 - angle2) * Math.PI * 0.5);
        ctx.save();
        ctx.beginPath(); ctx.rect(x, mid, w, h * 0.5); ctx.clip();
        ctx.translate(0, mid); ctx.scale(1, sv2); ctx.translate(0, -mid);
        _panelHalf(_p2(fc.cur), x, y, w, h, darkcol, false);
        ctx.restore();
      }
    } else {
      /* idle: show full previous value */
      _panelHalf(_p2(fc.cur), x, y, w, h, darkcol, true);
    }

    /* split line */
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 4, mid); ctx.lineTo(x + w - 4, mid); ctx.stroke();

    /* panel border */
    _rr(x, y, w, h, r);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function _drawLamp(wx, wy, s) {
    /* wall glow halo */
    var gx = wx + 60*s, gy = wy - 8*s;
    var halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, 170*s);
    halo.addColorStop(0,   'rgba(255,170,50,0.44)');
    halo.addColorStop(0.38,'rgba(240,110,10,0.22)');
    halo.addColorStop(1,   'rgba(200,80,0,0.00)');
    ctx.beginPath(); ctx.arc(gx, gy, 170*s, 0, TAU);
    ctx.fillStyle = halo; ctx.fill();

    /* wall backplate */
    _rr(wx - 11*s, wy - 26*s, 22*s, 52*s, 7*s);
    ctx.fillStyle = '#1C1C1C'; ctx.fill();
    _rr(wx - 11*s, wy - 26*s, 22*s, 52*s, 7*s);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    /* metal arm — horizontal → curves up → hangs down */
    ctx.save();
    ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 7*s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var ax = wx + 11*s, ay = wy;
    var bx = ax + 80*s, topY = ay - 84*s, hx = ax + 54*s;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, ay);
    ctx.arcTo(bx, topY, bx - 14*s, topY, 14*s);
    ctx.lineTo(hx + 14*s, topY);
    ctx.arcTo(hx, topY, hx, topY + 14*s, 14*s);
    ctx.lineTo(hx, topY + 30*s);
    ctx.stroke();
    ctx.restore();

    /* amber glass globe */
    var gW = 90*s, gH = 76*s, glx = hx - gW*0.5, gly = topY + 30*s;
    _rr(glx, gly, gW, gH, gH * 0.43);
    var ag = ctx.createRadialGradient(hx - gW*0.06, gly + gH*0.27, gH*0.04, hx + gW*0.08, gly + gH*0.52, gW*0.58);
    ag.addColorStop(0,    'rgba(255,198,78,0.94)');
    ag.addColorStop(0.42, 'rgba(220,104,14,0.90)');
    ag.addColorStop(1,    'rgba(100,28,4,0.74)');
    ctx.fillStyle = ag; ctx.fill();

    /* bottom diffuser */
    ctx.save();
    ctx.beginPath(); ctx.rect(glx, gly + gH*0.62, gW, gH*0.38); ctx.clip();
    _rr(glx, gly, gW, gH, gH * 0.43);
    var diff = ctx.createLinearGradient(0, gly + gH*0.62, 0, gly + gH);
    diff.addColorStop(0, 'rgba(255,236,196,0.94)');
    diff.addColorStop(1, 'rgba(255,215,165,0.90)');
    ctx.fillStyle = diff; ctx.fill();
    ctx.restore();

    /* specular highlight */
    ctx.save();
    _rr(glx, gly, gW, gH, gH * 0.43); ctx.clip();
    var spec = ctx.createRadialGradient(hx - gW*0.26, gly + gH*0.14, 0, hx - gW*0.14, gly + gH*0.26, gW*0.28);
    spec.addColorStop(0, 'rgba(255,255,255,0.30)');
    spec.addColorStop(1, 'rgba(255,255,255,0.00)');
    _rr(glx, gly, gW, gH, gH * 0.43); ctx.fillStyle = spec; ctx.fill();
    ctx.restore();

    /* globe outline */
    _rr(glx, gly, gW, gH, gH * 0.43);
    ctx.strokeStyle = 'rgba(60,15,2,0.36)'; ctx.lineWidth = 1.2; ctx.stroke();

    /* collar cap */
    _rr(hx - 9*s, gly - 4*s, 18*s, 7*s, 3*s);
    ctx.fillStyle = '#0E0A05'; ctx.fill();
  }

  function _drawTable(tx, ty, s) {
    var tw = 145*s, th = 128*s, tr = 17*s;

    /* feet */
    [0.22, 0.78].forEach(function(fx) {
      _rr(tx + tw*fx - 6.5*s, ty + th, 13*s, 9*s, 3*s);
      ctx.fillStyle = '#AFA49A'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.5; ctx.stroke();
    });

    /* outer body shadow */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 7;
    _rr(tx, ty, tw, th, tr); ctx.fillStyle = '#EEE9E4'; ctx.fill();
    ctx.restore();

    /* outer body */
    _rr(tx, ty, tw, th, tr);
    var bg2 = ctx.createLinearGradient(0, ty, 0, ty + th);
    bg2.addColorStop(0, '#F7F3F0'); bg2.addColorStop(1, '#E4DDD6');
    ctx.fillStyle = bg2; ctx.fill();
    _rr(tx, ty, tw, th, tr);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1; ctx.stroke();

    /* inner recess */
    var rp = 9*s;
    _rr(tx + rp, ty + rp, tw - rp*2, th - rp*2, tr * 0.52);
    ctx.fillStyle = 'rgba(0,0,0,0.048)'; ctx.fill();

    /* two drawer fronts */
    var dp = 11*s, dg = 5*s, dr = 12*s;
    var dw = tw - dp*2, dh = (th - dp*2 - dg) * 0.495;
    [ty + dp, ty + dp + dh + dg].forEach(function(dy) {
      _rr(tx + dp, dy, dw, dh, dr);
      var dkG = ctx.createLinearGradient(tx + dp, dy, tx + dp + dw, dy + dh);
      dkG.addColorStop(0,   '#E4C2C2');
      dkG.addColorStop(0.6, '#D4AEAE');
      dkG.addColorStop(1,   '#C89898');
      ctx.fillStyle = dkG; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.rect(tx + dp, dy, dw, dh * 0.34); ctx.clip();
      _rr(tx + dp, dy, dw, dh, dr);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      ctx.restore();
      _rr(tx + dp, dy, dw, dh, dr);
      ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 0.7; ctx.stroke();
    });

    /* stacked books on top */
    var bks = [
      { c: '#7498B4', w: 38*s, h: 6*s },
      { c: '#D97355', w: 32*s, h: 6*s },
      { c: '#9484B0', w: 35*s, h: 6*s },
    ];
    var bx = tx + tw * 0.56;
    bks.forEach(function(bk, i) {
      _rr(bx - bk.w*0.5 + i*2*s, ty - (bks.length - i) * (bk.h + 1), bk.w, bk.h, 2*s);
      ctx.fillStyle = bk.c; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.5; ctx.stroke();
    });
  }

  function drawClock() {
    var now  = new Date();
    var nowH = now.getHours();
    var nowM = now.getMinutes();

    /* tick hour */
    if (FC.hr.cur !== nowH) {
      FC.hr.prv = FC.hr.cur < 0 ? nowH : FC.hr.cur;
      FC.hr.cur = nowH;
      FC.hr.flip = FC.hr.cur < 0 ? 0 : 1.0;
    }
    /* tick minute */
    if (FC.min.cur !== nowM) {
      FC.min.prv = FC.min.cur < 0 ? nowM : FC.min.cur;
      FC.min.cur = nowM;
      FC.min.flip = FC.min.cur < 0 ? 0 : 1.0;
    }
    /* advance flips */
    if (FC.hr.flip  > 0) FC.hr.flip  = Math.max(0, FC.hr.flip  - FC.SPD);
    if (FC.min.flip > 0) FC.min.flip = Math.max(0, FC.min.flip - FC.SPD);

    /* warm brown radial background */
    var bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    bg.addColorStop(0,   '#C8A882');
    bg.addColorStop(0.5, '#A07850');
    bg.addColorStop(1,   '#5C3A18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* room objects */
    var rs = Math.min(W, H) / 700;
    _drawLamp(W * 0.09, H * 0.36, rs);
    _drawTable(W * 0.5 - 72.5 * rs, H * 0.695, rs);

    /* clock body */
    var cw = Math.min(W * 0.78, 540);
    var ch = cw * 0.44;
    var cx = (W - cw) * 0.5;
    var cy = (H - ch) * 0.5;
    var cr = ch * 0.13;

    /* body drop shadow */
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = 32;
    ctx.shadowOffsetY = 10;
    _rr(cx, cy, cw, ch, cr);
    ctx.fillStyle = '#8B1010'; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    /* body face gradient */
    var fg = ctx.createLinearGradient(0, cy, 0, cy + ch);
    fg.addColorStop(0,   '#D42020');
    fg.addColorStop(0.5, '#B01414');
    fg.addColorStop(1,   '#7A0A0A');
    _rr(cx, cy, cw, ch, cr);
    ctx.fillStyle = fg; ctx.fill();

    /* top highlight sheen */
    var ths = ctx.createLinearGradient(0, cy, 0, cy + ch * 0.45);
    ths.addColorStop(0,   'rgba(255,255,255,0.18)');
    ths.addColorStop(1,   'rgba(255,255,255,0.00)');
    _rr(cx, cy, cw, ch, cr);
    ctx.fillStyle = ths; ctx.fill();

    /* inner bezel */
    var pad  = ch * 0.095;
    var ibx  = cx + pad;
    var iby  = cy + pad;
    var ibw  = cw - pad * 2;
    var ibh  = ch - pad * 2;
    var ibr  = ibh * 0.07;
    _rr(ibx, iby, ibw, ibh, ibr);
    ctx.fillStyle = '#2A2A2A'; ctx.fill();

    /* two flip panels */
    var gap  = ibw * 0.040;
    var pw   = (ibw - gap * 3) * 0.5;
    var ph   = ibh - gap * 2;
    var p1x  = ibx + gap;
    var p2x  = ibx + gap * 2 + pw;
    var py   = iby + gap;

    _flipPanel(FC.hr,  p1x, py, pw, ph);
    _flipPanel(FC.min, p2x, py, pw, ph);

    /* colon dots */
    var dotX = ibx + ibw * 0.5;
    var dotR = ph * 0.065;
    ctx.fillStyle = '#E8C05A';
    ctx.beginPath(); ctx.arc(dotX, py + ph * 0.36, dotR, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(dotX, py + ph * 0.64, dotR, 0, TAU); ctx.fill();
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
