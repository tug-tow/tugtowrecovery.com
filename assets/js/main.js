// Tug & Tow Recovery – tiny progressive enhancement. Site works without JS.
(function () {
  // Mobile menu toggle
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Quote form: builds a message and opens WhatsApp, SMS or email. No data is stored or sent to a server.
  var PHONE_WA = '447866000888';
  var PHONE_SMS = '07866000888';
  var EMAIL = 'tug-tow@hotmail.com';

  function buildMessage(form) {
    var get = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };
    var lines = ['Quote request – Tug & Tow Recovery website', ''];
    var add = function (label, v) { if (v) lines.push(label + ': ' + v); };
    add('Name', get('name'));
    add('Phone', get('phone'));
    add('Service', get('service'));
    add('Vehicle', get('vehicle'));
    add('Collect from', get('from'));
    add('Take to', get('to'));
    add('When', get('when'));
    var d = get('details');
    if (d) { lines.push(''); lines.push(d); }
    return lines.join('\n');
  }

  document.querySelectorAll('form.js-quote').forEach(function (form) {
    var err = form.querySelector('.form-error');
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.querySelectorAll('[data-send]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (!form.elements['name'].value.trim() || !form.elements['from'].value.trim()) {
          if (err) err.textContent = 'Please add your name and where the vehicle is.';
          (form.elements['name'].value.trim() ? form.elements['from'] : form.elements['name']).focus();
          return;
        }
        if (err) err.textContent = '';
        var msg = buildMessage(form);
        var how = b.getAttribute('data-send');
        var url;
        if (how === 'whatsapp') url = 'https://wa.me/' + PHONE_WA + '?text=' + encodeURIComponent(msg);
        else if (how === 'sms') url = 'sms:' + PHONE_SMS + '?&body=' + encodeURIComponent(msg);
        else url = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request – ' + (form.elements['service'].value || 'vehicle recovery')) + '&body=' + encodeURIComponent(msg);
        if (how === 'whatsapp') window.open(url, '_blank', 'noopener'); else window.location.href = url;
      });
    });
  });
})();

// ===== Live strip, picker, count-ups, scroll reveal. Real data only; everything fails gracefully. =====
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Live UK time (Europe/London), ticking every second
  var clock = document.getElementById('uk-clock'), dateEl = document.getElementById('uk-date');
  if (clock && window.Intl) {
    var tf = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    var df = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' });
    var tick = function () { var n = new Date(); clock.textContent = tf.format(n); clock.setAttribute('datetime', n.toISOString()); if (dateEl) dateEl.textContent = df.format(n) + ' · UK time'; };
    tick(); setInterval(tick, 1000);
  }

  // Current weather for Sandy from Open-Meteo (free, keyless)
  var wx = document.getElementById('wx');
  if (wx && window.fetch) {
    var tEl = document.getElementById('wx-temp'), dEl = document.getElementById('wx-desc'), tipEl = document.getElementById('wx-tip');
    var CODES = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with hail'};
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + wx.getAttribute('data-lat') + '&longitude=' + wx.getAttribute('data-lon') +
      '&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation&daily=temperature_2m_min&timezone=Europe%2FLondon&forecast_days=1&wind_speed_unit=mph';
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      clearTimeout(to);
      var c = d && d.current; if (!c || typeof c.temperature_2m !== 'number') throw new Error('no data');
      var t = Math.round(c.temperature_2m), code = c.weather_code, gust = c.wind_gusts_10m || 0;
      var low = d.daily && d.daily.temperature_2m_min ? d.daily.temperature_2m_min[0] : t;
      tEl.textContent = t + '°C';
      dEl.textContent = (CODES[code] || 'Current conditions') + (gust ? ' · gusts ' + Math.round(gust) + ' mph' : '');
      var tip = '', warn = false;
      if (Math.min(t, low) <= 2) { tip = 'Icy roads likely tonight. Save our number: 07866 000888.'; warn = true; }
      else if ([45, 48].indexOf(code) > -1) { tip = 'Fog about. Use dipped headlights, slow down and leave a bigger gap.'; warn = true; }
      else if ([71,73,75,77,85,86].indexOf(code) > -1) { tip = 'Snow about. Take it steady, and save our number in case you get stuck.'; warn = true; }
      else if (code >= 95) { tip = 'Thunderstorms around. Watch for standing water and debris on the road.'; warn = true; }
      else if (gust >= 40) { tip = 'Strong gusts. Take care on exposed roads like the A1 and A421, especially near high-sided vehicles.'; warn = true; }
      else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || c.precipitation > 0) { tip = 'Wet roads. Allow double the stopping distance.'; }
      else { tip = 'Good driving conditions right now. If anything changes, we\'re on call 24/7.'; }
      tipEl.textContent = tip; tipEl.classList.toggle('is-warn', warn);
      wx.setAttribute('data-live', 'true');
    }).catch(function () {
      clearTimeout(to);
      tEl.textContent = '';
      dEl.textContent = 'Live weather is unavailable right now.';
      tipEl.textContent = 'Check the Met Office before you travel. Whatever the weather, we\'re on call 24/7.';
      wx.setAttribute('data-live', 'false');
    });
  }

  // "What do you need?" quick picker
  var PICK = {
    breakdown: ['Broken down? Flat battery, flat tyre, locked out or won\'t start, we come to you and either get you going or get the vehicle moved.', 'services.html#breakdown', 'Breakdown help'],
    accident: ['If anyone is hurt, or you\'re in a dangerous spot on a live carriageway, call 999 first. Then call us for accident recovery, day or night.', 'services.html#recovery', 'Accident recovery'],
    delivery: ['Need a car or van moved? We collect and deliver around Sandy and Bedfordshire, for sales, auctions, garages and moves.', 'services.html#transport', 'Delivery & transport'],
    unwanted: ['Any unwanted vehicles removed. Please call for more information.', 'free-vehicle-collection.html', 'Unwanted vehicles removed'],
    sell: ['We buy cars, vans and bikes. Call for more information.', 'we-buy-any-vehicle.html', 'We buy cars, vans & bikes']
  };
  var panel = document.getElementById('pick-panel');
  if (panel) {
    var txt = document.getElementById('pick-text'), more = document.getElementById('pick-more'), call = document.getElementById('pick-call');
    var btns = document.querySelectorAll('[data-pick]');
    btns.forEach(function (b) {
      b.setAttribute('role', 'button'); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-controls', 'pick-panel');
      b.addEventListener('click', function (e) {
        var k = b.getAttribute('data-pick'), v = PICK[k]; if (!v) return;
        e.preventDefault();
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        txt.textContent = v[0]; more.setAttribute('href', v[1]); more.textContent = v[2] + ' →';
        call.lastChild.textContent = k === 'sell' || k === 'unwanted' ? 'Call 07866 000888 for more information' : 'Call 07866 000888';
        panel.hidden = false;
        panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
      });
    });
  }

  // Count-up stats (true numbers only; the real value is already in the HTML)
  var counts = document.querySelectorAll('.count[data-to]');
  function runCount(el) {
    var to = +el.getAttribute('data-to'), from = +(el.getAttribute('data-from') || 0), t0 = null, dur = 1400;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); }
    el.textContent = from; requestAnimationFrame(step);
  }

  if (reduce || !('IntersectionObserver' in window)) return;

  if (counts.length) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }); }, { threshold: 0.6 });
    counts.forEach(function (c) { co.observe(c); });
  }

  // Scroll reveal
  var targets = document.querySelectorAll('main section:not(.hero) .wrap > *, main .grid > *, main .steps > *, main .stat-list > *, main .live-grid > *');
  if (!targets.length) return;
  document.documentElement.classList.add('js-reveal');
  var ro = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(function (el) {
    if (el.closest('.grid, .steps, .stat-list, .live-grid') && el.parentElement.matches('.grid, .steps, .stat-list, .live-grid')) {
      el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentElement.children, el) % 4) * 90 + 'ms';
    }
    el.classList.add('reveal'); ro.observe(el);
  });
})();
