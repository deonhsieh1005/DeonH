(function () {
  var stops = [
    ['#0f172a', '#1e3a5f'],  // deep navy     — top
    ['#1e1b4b', '#2d1b69'],  // deep indigo   — mid
    ['#0f172a', '#0a0f1e'],  // near black    — bottom
  ];

  function hexToRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function blendColor(a, b, t) {
    var ra = hexToRgb(a), rb = hexToRgb(b);
    return 'rgb(' + [0, 1, 2].map(function (i) {
      return Math.round(lerp(ra[i], rb[i], t));
    }).join(',') + ')';
  }

  function getColors(progress) {
    var n = stops.length - 1;
    var seg = Math.min(Math.floor(progress * n), n - 1);
    var t = progress * n - seg;
    return [
      blendColor(stops[seg][0], stops[seg + 1][0], t),
      blendColor(stops[seg][1], stops[seg + 1][1], t)
    ];
  }

  function update() {
    if (document.body.getAttribute('data-theme') === 'light') return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = scrollTop / maxScroll;
    var colors = getColors(progress);

    document.body.style.background =
      'linear-gradient(135deg, ' + colors[0] + ' 0%, ' + colors[1] + ' 100%)';

    // Subtle parallax on the header logo
    var logo = document.getElementById('logo');
    if (logo) logo.style.transform = 'translateY(' + (scrollTop * 0.25) + 'px)';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
