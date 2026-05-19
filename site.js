(function () {
  'use strict';

  // ---- Theme toggle ----
  var themeBtn = document.getElementById('theme-btn');

  function setTheme(t) {
    document.body.setAttribute('data-theme', t);
    localStorage.setItem('deon-theme', t);
    if (themeBtn) {
      themeBtn.innerHTML = t === 'dark'
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    }
    // background is managed by beach-bg.js (kept transparent)
  }

  setTheme(localStorage.getItem('deon-theme') || 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // ---- Audio button ----
  var audioBtn = document.getElementById('audio-btn');

  function updateAudioBtn(on) {
    if (!audioBtn) return;
    audioBtn.classList.toggle('active', on);
    audioBtn.title = on ? 'Pause lo-fi music' : 'Play lo-fi music';
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', function () {
      if (!window.deonAudio) return;
      var on = window.deonAudio.toggle();
      updateAudioBtn(on);
      localStorage.setItem('deon-audio', on ? '1' : '0');
    });
  }

  // Restore audio on first interaction after a full page load
  if (localStorage.getItem('deon-audio') === '1') {
    updateAudioBtn(true);
    var _restore = function (e) {
      document.removeEventListener('click', _restore, true);
      if (e.target.closest('#audio-btn')) return;
      if (window.deonAudio && !window.deonAudio.isPlaying()) {
        window.deonAudio.toggle();
      }
    };
    document.addEventListener('click', _restore, true);
  }

  // ---- Home button ----
  var homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', function () {
      var onInner = !!document.querySelector('.window.page-window');
      if (onInner) {
        enterHomePage();
      }
      // already on homepage — do nothing
    });
  }

  // ---- Click sounds on all interactive elements ----
  document.addEventListener('click', function (e) {
    var target = e.target.closest('a, button');
    if (!target) return;
    if (target.id === 'audio-btn') return;
    if (window.deonAudio) window.deonAudio.playClick();
  });

  // ---- SPA navigation ----
  // All inner-page content lives here — no fetch() needed, works on file:// too.
  var PAGES = {
    'blogs.html': {
      title:     'blogs',
      pageTitle: 'deon’s website – Blogs',
      body:      '<p style="color:var(--text-soft);font-size:0.95em;padding:20px 0">No blog posts yet. Check back soon!</p>'
    },
    'photos.html': {
      title:     'photos',
      pageTitle: 'deon’s website – Photos',
      body:      '<p style="color:var(--text-soft);font-size:0.95em;padding:20px 0">No photos yet. Check back soon!</p>'
    },
    'about.html': {
      title:     'about',
      pageTitle: 'deon’s website – About',
      body:      '<div style="padding:28px 32px 32px"><div style="margin-bottom:28px"><h2 style="font-size:1.45em;font-weight:700;margin:0 0 6px;color:var(--text)">Hi, I&rsquo;m Deon.</h2><p style="color:var(--text-soft);line-height:1.80;font-size:0.95em;margin:0">Aspiring biomedical engineer who is driven to expand his knowledge in medical device operation and maintenance to bridge the gap between physicians and manufacturers.</p></div><div style="display:grid;gap:22px"><div style="display:flex;gap:16px;align-items:flex-start"><div style="width:36px;height:36px;border-radius:10px;background:var(--accent-muted,rgba(100,180,255,0.12));display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><i class="fa-solid fa-briefcase-medical" style="color:var(--accent);font-size:0.85em"></i></div><div><p style="font-weight:600;color:var(--text);margin:0 0 4px;font-size:0.92em;text-transform:uppercase;letter-spacing:0.06em">Work</p><p style="color:var(--text-soft);line-height:1.75;font-size:0.93em;margin:0">Clinical Specialist &mdash; <strong style="color:var(--text)">Boston Scientific</strong></p></div></div><div style="display:flex;gap:16px;align-items:flex-start"><div style="width:36px;height:36px;border-radius:10px;background:var(--accent-muted,rgba(100,180,255,0.12));display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><i class="fa-solid fa-graduation-cap" style="color:var(--accent);font-size:0.85em"></i></div><div><p style="font-weight:600;color:var(--text);margin:0 0 4px;font-size:0.92em;text-transform:uppercase;letter-spacing:0.06em">Education</p><p style="color:var(--text-soft);line-height:1.75;font-size:0.93em;margin:0">B.S. Biomedical Engineering &mdash; <strong style="color:var(--text)">University of California, Davis</strong><br>Class of 2025</p></div></div><div style="display:flex;gap:16px;align-items:flex-start"><div style="width:36px;height:36px;border-radius:10px;background:var(--accent-muted,rgba(100,180,255,0.12));display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><i class="fa-solid fa-person-hiking" style="color:var(--accent);font-size:0.85em"></i></div><div><p style="font-weight:600;color:var(--text);margin:0 0 8px;font-size:0.92em;text-transform:uppercase;letter-spacing:0.06em">Hobbies</p><div style="display:flex;flex-wrap:wrap;gap:8px"><span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid var(--border);color:var(--text-soft);font-size:0.87em"><i class="fa-solid fa-golf-ball-tee" style="color:var(--accent)"></i> Single-digit handicap golfer</span><span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid var(--border);color:var(--text-soft);font-size:0.87em"><i class="fa-solid fa-mountain-sun" style="color:var(--accent)"></i> Hiking &amp; national parks</span><span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid var(--border);color:var(--text-soft);font-size:0.87em"><i class="fa-solid fa-person-skiing" style="color:var(--accent)"></i> Skiing</span></div></div></div><div style="display:flex;gap:16px;align-items:flex-start"><div style="width:36px;height:36px;border-radius:10px;background:var(--accent-muted,rgba(100,180,255,0.12));display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><i class="fa-solid fa-language" style="color:var(--accent);font-size:0.85em"></i></div><div><p style="font-weight:600;color:var(--text);margin:0 0 10px;font-size:0.92em;text-transform:uppercase;letter-spacing:0.06em">Languages</p><div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;gap:10px"><span class="fi fi-us" style="font-size:1.1em;border-radius:3px"></span><span style="color:var(--text);font-size:0.93em">English</span><span style="color:var(--text-soft);font-size:0.85em">Native</span></div><div style="display:flex;align-items:center;gap:10px"><span class="fi fi-tw" style="font-size:1.1em;border-radius:3px"></span><span style="color:var(--text);font-size:0.93em">Mandarin <span style="color:var(--text-soft);font-size:0.88em">(Taiwan)</span></span><span style="color:var(--text-soft);font-size:0.85em">Native</span></div><div style="display:flex;align-items:center;gap:10px"><span class="fi fi-jp" style="font-size:1.1em;border-radius:3px"></span><span style="color:var(--text);font-size:0.93em">Japanese</span><span style="color:var(--text-soft);font-size:0.85em">Conversational</span></div></div></div></div></div></div>'
    },
    'contact.html': {
      title:     'contact',
      pageTitle: 'deon’s website – Contact',
      body:      '<ul class="contact-list"><li><a href="https://www.instagram.com/deonh_1005" target="_blank"><i class="fa-brands fa-instagram"></i>@deonh_1005</a></li><li><i class="fa-brands fa-weixin"></i>WeChat: DeonHsieh1005</li><li><a href="https://www.linkedin.com/in/deon-hsieh-562829266" target="_blank"><i class="fa-brands fa-linkedin"></i>Deon Hsieh</a></li><li><a href="mailto:deonhsieh1005@gmail.com"><i class="fa-solid fa-envelope"></i>deonhsieh1005@gmail.com</a></li></ul>'
    }
  };

  // Country pages
  var COUNTRIES = [
    { file: 'usa.html',    title: 'united states', pageTitle: 'deon’s website – United States', flag: 'fi-us' },
    { file: 'taiwan.html', title: 'taiwan',         pageTitle: 'deon’s website – Taiwan',        flag: 'fi-tw' },
    { file: 'china.html',  title: 'china',          pageTitle: 'deon’s website – China',         flag: 'fi-cn' },
    { file: 'japan.html',  title: 'japan',          pageTitle: 'deon’s website – Japan',         flag: 'fi-jp' },
  ];
  COUNTRIES.forEach(function (c) {
    PAGES[c.file] = {
      title:     c.title,
      pageTitle: c.pageTitle,
      body:      '<p style="color:var(--text-soft);font-size:0.95em;padding:20px 0">No photos yet for this country.</p>'
    };
  });

  // Month archive pages
  ['january','february','march','april','may','june',
   'july','august','september','october','november','december'
  ].forEach(function (m) {
    var cap = m.charAt(0).toUpperCase() + m.slice(1);
    PAGES[m + '.html'] = {
      title:     m + ' 2025',
      pageTitle: 'deon’s website – ' + cap + ' 2025',
      body:      '<p style="color:var(--text-soft);font-size:0.95em;padding:20px 0">No posts yet for this month.</p>'
    };
  });

  // Capture home-only DOM nodes on initial load (null when starting on an inner page)
  var _desktop  = document.querySelector('.desktop');
  var _iconNav  = document.querySelector('.icon-nav');
  var _footer   = document.querySelector('.site-footer');
  var _homeHero = document.querySelector('.hero');         // null on inner pages
  var _homeGrid = document.querySelector('.desktop-grid'); // null on inner pages

  function updateNav(href) {
    document.querySelectorAll('.nav-tile').forEach(function (tile) {
      tile.classList.toggle('current', tile.getAttribute('href') === href);
    });
  }

  // Swap title + body when already showing an inner-page window
  function applyInnerPage(href) {
    var page    = PAGES[href];
    var titleEl = document.querySelector('.window-title');
    var bodyEl  = document.querySelector('.window-body');
    if (titleEl) titleEl.textContent = page.title;
    if (bodyEl)  bodyEl.innerHTML    = page.body;
    document.title = page.pageTitle;
    updateNav(href);
  }

  // Build the .window.page-window element for an inner page
  function buildWindow(page) {
    var el = document.createElement('div');
    el.className = 'window page-window';
    el.innerHTML =
      '<div class="window-bar">' +
        '<div class="dots">' +
          '<span class="dot red"></span>' +
          '<span class="dot yellow"></span>' +
          '<span class="dot green"></span>' +
        '</div>' +
        '<span class="window-title">' + page.title + '</span>' +
      '</div>' +
      '<div class="window-body">' + page.body + '</div>';
    return el;
  }

  // Transition: homepage → inner page
  function enterInnerPage(href, skipPush) {
    var page = PAGES[href];
    // Detach home-only elements (kept in memory for restoration)
    if (_homeHero && _homeHero.parentNode) _homeHero.parentNode.removeChild(_homeHero);
    if (_homeGrid && _homeGrid.parentNode) _homeGrid.parentNode.removeChild(_homeGrid);
    // Match the margin inner pages use
    if (_iconNav) _iconNav.style.marginTop = '36px';
    // Insert window before footer
    var win = buildWindow(page);
    if (_footer && _footer.parentNode) _footer.parentNode.insertBefore(win, _footer);
    else if (_desktop) _desktop.appendChild(win);
    document.title = page.pageTitle;
    updateNav(href);
    if (!skipPush) history.pushState({ href: href }, '', href);
  }

  // Transition: inner page → homepage
  function enterHomePage(skipPush) {
    if (!_homeHero) {
      // We never had home content (started on inner page) — fall back to full load
      window.location.href = 'index.html';
      return;
    }
    var win = document.querySelector('.window.page-window');
    if (win && win.parentNode) win.parentNode.removeChild(win);
    if (_iconNav) _iconNav.style.marginTop = '';
    // Re-attach home sections in original order
    if (_desktop && _iconNav) _desktop.insertBefore(_homeHero, _iconNav);
    if (_desktop && _footer)  _desktop.insertBefore(_homeGrid, _footer);
    document.title = 'deon’s website';
    updateNav('index.html');
    if (!skipPush) history.pushState({ href: 'index.html' }, '', 'index.html');
  }

  // Unified nav-tile click handler (works from both homepage and inner pages)
  document.querySelectorAll('.nav-tile').forEach(function (tile) {
    tile.addEventListener('click', function (e) {
      var href = tile.getAttribute('href');
      if (!PAGES[href]) return; // not an SPA target — let browser navigate normally
      e.preventDefault();
      var onInner = !!document.querySelector('.window.page-window');
      if (onInner) {
        applyInnerPage(href);
        history.pushState({ href: href }, '', href);
      } else {
        enterInnerPage(href);
      }
    });
  });

  // Country link handler
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.country-list a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!PAGES[href]) return;
    e.preventDefault();
    var onInner = !!document.querySelector('.window.page-window');
    if (onInner) {
      applyInnerPage(href);
      history.pushState({ href: href }, '', href);
    } else {
      enterInnerPage(href);
    }
  });

  // Archive month link handler
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.archive-list a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!PAGES[href]) return;
    e.preventDefault();
    var onInner = !!document.querySelector('.window.page-window');
    if (onInner) {
      applyInnerPage(href);
      history.pushState({ href: href }, '', href);
    } else {
      enterInnerPage(href);
    }
  });

  // Record initial history state so browser back/forward works
  var _initHref = window.location.pathname.split('/').pop() || 'index.html';
  if (!history.state) history.replaceState({ href: _initHref || 'index.html' }, '', window.location.href);

  // Handle browser back / forward
  window.addEventListener('popstate', function (e) {
    if (!e.state || !e.state.href) return;
    var href = e.state.href;
    var onInner = !!document.querySelector('.window.page-window');

    if (href === 'index.html' || href === '') {
      if (onInner) enterHomePage(true);
    } else if (PAGES[href]) {
      if (onInner) {
        applyInnerPage(href);
      } else {
        enterInnerPage(href, true);
      }
    }
  });

})();
