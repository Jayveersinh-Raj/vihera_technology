/* Vihera Technologies — site behaviour (no dependencies) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---- Header: solid once the page is scrolled ---------------------------- */

  var header = document.querySelector('[data-header]');
  if (header) {
    var setStuck = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  /* ---- Mobile menu -------------------------------------------------------- */

  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  if (menuToggle && menu) {
    var setMenu = function (open) {
      root.classList.toggle('menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuToggle.addEventListener('click', function () {
      setMenu(!root.classList.contains('menu-open'));
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('menu-open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.matchMedia('(min-width: 60.0625rem)').addEventListener('change', function (event) {
      if (event.matches) setMenu(false);
    });
  }

  /* ---- Reveal on scroll --------------------------------------------------- */

  var revealTargets = all('[data-reveal], [data-reveal-line]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- Home hero: the street elevation draws itself ----------------------- */

  var sceneArt = document.querySelector('[data-scene-art]');
  if (sceneArt) {
    if (reduceMotion) {
      sceneArt.classList.add('is-live', 'is-drawn');
    } else {
      requestAnimationFrame(function () { sceneArt.classList.add('is-live'); });
      // once drawn, drop the dash trick so the outlines match the other strokes
      window.setTimeout(function () { sceneArt.classList.add('is-drawn'); }, 3200);
    }
  }

  /* ---- Tabs with a sliding thumb (the "How we work" switch) --------------- */

  all('[data-tabs]').forEach(function (scope) {
    var list = scope.querySelector('[role="tablist"]');
    if (!list) return;
    var tabs = all('[role="tab"]', list);
    var thumb = list.querySelector('.segmented__thumb');

    function placeThumb() {
      var current = list.querySelector('[aria-selected="true"]');
      if (!thumb || !current) return;
      thumb.style.width = current.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + current.offsetLeft + 'px)';
    }

    function select(tab) {
      tabs.forEach(function (other) {
        var on = other === tab;
        other.setAttribute('aria-selected', String(on));
        other.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(other.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      placeThumb();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (event) {
        var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        var next = tabs[(index + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });

    placeThumb();
    window.addEventListener('resize', placeThumb);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeThumb);
  });

  /* ---- System explorer: list on one side, cutaway drawing on the other ---- */

  all('[data-explorer]').forEach(function (explorer) {
    var tabs = all('.explorer__tab', explorer);
    var parts = all('[data-sys]', explorer.querySelector('.explorer__stage'));
    var dwell = 6500;
    var index = 0;
    var timer = null;
    var autoplay = !reduceMotion;
    if (!tabs.length) return;

    explorer.style.setProperty('--dwell', dwell + 'ms');

    function show(next) {
      index = next;
      var system = tabs[index].getAttribute('data-sys');
      tabs.forEach(function (tab, n) { tab.setAttribute('aria-pressed', String(n === index)); });
      parts.forEach(function (part) {
        part.classList.toggle('is-on', part.getAttribute('data-sys').split(' ').indexOf(system) > -1);
      });
      explorer.setAttribute('data-active', system);
    }

    function play() {
      if (!autoplay || timer) return;
      explorer.classList.add('is-auto');
      timer = window.setInterval(function () { show((index + 1) % tabs.length); }, dwell);
    }

    function pause() {
      explorer.classList.remove('is-auto');
      window.clearInterval(timer);
      timer = null;
    }

    function choose(next) {
      autoplay = false;       // the visitor has taken over
      pause();
      show(next);
    }

    tabs.forEach(function (tab, n) {
      tab.addEventListener('click', function () { choose(n); });
      if (canHover) tab.addEventListener('mouseenter', function () { choose(n); });
    });

    show(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) play(); else pause(); });
      }, { threshold: 0.35 }).observe(explorer);
    }
  });

  /* ---- Smart Home hero: scene buttons drive the room illustration --------- */

  all('[data-scene-demo]').forEach(function (demo) {
    var buttons = all('[data-set]', demo);
    var order = buttons.map(function (button) { return button.getAttribute('data-set'); });
    var timer = null;
    var autoplay = !reduceMotion;

    function set(scene) {
      demo.setAttribute('data-scene', scene);
      buttons.forEach(function (button) {
        var on = button.getAttribute('data-set') === scene;
        button.setAttribute('aria-pressed', String(on));
        if (!on) return;
        all('[data-stat]', demo).forEach(function (stat) {
          var value = button.getAttribute('data-' + stat.getAttribute('data-stat'));
          if (value) stat.textContent = value;
        });
      });
    }

    function play() {
      if (!autoplay || timer) return;
      timer = window.setInterval(function () {
        var next = (order.indexOf(demo.getAttribute('data-scene')) + 1) % order.length;
        set(order[next]);
      }, 4200);
    }

    function pause() { window.clearInterval(timer); timer = null; }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        autoplay = false;
        pause();
        set(button.getAttribute('data-set'));
      });
    });

    set(demo.getAttribute('data-scene') || order[0]);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) play(); else pause(); });
      }, { threshold: 0.4 }).observe(demo);
    }
  });

  /* ---- Service index: highlight the section in view ----------------------- */

  var spyLinks = all('[data-spy] a');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (link) {
          var on = link.getAttribute('href') === '#' + entry.target.id;
          if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    spyLinks.forEach(function (link) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) spyObserver.observe(target);
    });
  }

  /* ---- Enquiry form: hands the message to the visitor's email app --------- */

  var form = document.querySelector('[data-enquiry]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var value = function (name) { return String(data.get(name) || '').trim(); };
      var lines = [
        'Name: ' + value('name'),
        'Email: ' + value('email'),
        value('phone') ? 'Phone: ' + value('phone') : '',
        'Interested in: ' + value('interest'),
        '',
        value('message')
      ].filter(function (line, n) { return line !== '' || n === 4; });

      window.location.href = 'mailto:' + form.getAttribute('data-enquiry') +
        '?subject=' + encodeURIComponent('Website enquiry — ' + value('interest')) +
        '&body=' + encodeURIComponent(lines.join('\r\n'));

      var note = form.querySelector('[data-enquiry-note]');
      if (note) note.hidden = false;
    });
  }

  /* ---- Footer year -------------------------------------------------------- */

  all('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
