/* DKS Women , built with the scroll-video-landing-page skill (fullpage + cta-fastscroll, verbatim). */

/* fullpage-scrub.js , DKS scroll-scrub (dks-happening pattern)
   The WHOLE document scroll drives a fixed full-page background <video>:
   frame 1 at the top (hero), last frame at the bottom (behind the form/CTA).
   Optional pinned .story (500vh) cross-fades .story-point items in the middle.

   Required markup:
     <div id="video-bg"><video class="scrub-video" muted playsinline preload="auto" poster="scrub-poster.jpg">
       <source src="scrub.mp4" type="video/mp4"></video></div>
     <div id="video-scrim"></div>
     ... content (z-index:2) ...
     <section class="story" id="story"><div class="story-sticky">
        <div class="story-point">...</div> x5
     </div></section>   (optional)
*/
(function () {
  'use strict';
  var video = document.querySelector('#video-bg .scrub-video');
  var story = document.getElementById('story');                 // optional
  var points = [].slice.call(document.querySelectorAll('.story-point'));
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp01(n) { return Math.min(1, Math.max(0, n)); }

  if (reduced) { points.forEach(function (p) { p.classList.add('active'); }); return; }
  if (video) { try { video.load(); } catch (e) {} }

  function update() {
    if (video) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? clamp01(window.pageYOffset / max) : 0;
      var dur = video.duration;                 // read LIVE every frame , never cache
      if (dur && isFinite(dur)) {
        var t = progress * (dur - 0.05);
        if (Math.abs(video.currentTime - t) > 0.01) { try { video.currentTime = t; } catch (e) {} }
      }
    }
    if (story && points.length) {
      var dist = story.offsetHeight - window.innerHeight;
      var sp = dist > 0 ? clamp01((-story.getBoundingClientRect().top) / dist) : 0;
      var idx = Math.floor(sp * points.length - 0.0001);
      if (idx < 0) idx = 0;
      if (idx > points.length - 1) idx = points.length - 1;
      for (var i = 0; i < points.length; i++) { points[i].classList.toggle('active', i === idx); }
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (video) {
    ['loadedmetadata', 'loadeddata', 'durationchange', 'canplay'].forEach(function (ev) {
      video.addEventListener(ev, update);
    });
  }
  update();
})();

/* cta-fastscroll.js , DKS floating CTA + fast animated scroll (dks-happening pattern)
   Any [data-fast-register] button + a floating pill scroll fast (animated) to #register.
   The scrubbed video visibly races forward during the animation.

   Required markup:
     <button id="float-register" class="float-register" hidden>לחץ כאן להרשמה</button>
     ... <button data-fast-register>להרשמה מהירה</button> ...
     <section id="register"> ... </section>  and  <section id="hero"> ... </section>
   CSS: html { scroll-behavior: auto; }  (native smooth fights the JS animation)
        .float-register { position: fixed; ... opacity:0; transition:opacity .3s; }
        .float-register.visible { opacity: 1; pointer-events: auto; } */
(function () {
  'use strict';
  var registerEl = document.getElementById('register');
  var pill = document.getElementById('float-register');
  var hero = document.getElementById('hero');
  if (!registerEl) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fastScrollToRegister() {
    var targetY = registerEl.getBoundingClientRect().top + window.pageYOffset;
    if (reduced) { window.scrollTo(0, targetY); return; }
    var startY = window.pageYOffset, delta = targetY - startY, duration = 1400, start = performance.now(), cancelled = false;
    function cleanup() { ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, cancel); }); }
    function cancel() { cancelled = true; cleanup(); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, cancel, { passive: true }); }); // user takes back control
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function frame(now) {
      if (cancelled) return;
      var p = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + delta * ease(p));
      if (p < 1) requestAnimationFrame(frame); else cleanup();
    }
    requestAnimationFrame(frame);
  }

  document.querySelectorAll('[data-fast-register]').forEach(function (b) { b.addEventListener('click', fastScrollToRegister); });

  if (pill && hero) {
    pill.hidden = false;
    pill.addEventListener('click', fastScrollToRegister);
    // rect-based visibility in the scroll handler , NOT IntersectionObserver.
    // IO never fires in some embedded webviews (e.g. the Claude preview panel),
    // which left the pill permanently hidden there. Two getBoundingClientRect
    // calls per scroll tick are cheap and behave identically everywhere.
    function refresh() {
      var vh = window.innerHeight;
      var hr = hero.getBoundingClientRect();
      var rr = registerEl.getBoundingClientRect();
      var heroVisible = hr.bottom > vh * 0.05 && hr.top < vh * 0.95;
      var registerVisible = rr.bottom > vh * 0.15 && rr.top < vh * 0.85;
      pill.classList.toggle('visible', !heroVisible && !registerVisible);
    }
    window.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    refresh();
  }
})();
