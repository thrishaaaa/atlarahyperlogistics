// ── Navbar scroll behaviour ──────────────────────────────────────────────────
(function () {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  function onScroll() {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Active nav link ───────────────────────────────────────────────────────────
(function () {
  const links = document.querySelectorAll('.navbar__links a, .mobile-menu a');
  const path = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });
})();

// ── Hamburger / mobile menu ───────────────────────────────────────────────────
(function () {
  const btn = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
})();

// ── Scroll reveal ─────────────────────────────────────────────────────────────
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// ── Counter animation ─────────────────────────────────────────────────────────
(function () {
  const spans = document.querySelectorAll('[data-target]');
  if (!spans.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  spans.forEach(s => io.observe(s));
})();

// ── Intro logic & Mobile Video Autoplay Fix ───────────────────────────────────
(function () {
  const overlay  = document.getElementById('intro-overlay');
  const introVid = document.getElementById('intro-video');
  const fallback = document.getElementById('intro-fallback');
  const skipBtn  = document.getElementById('intro-skip');

  // Guard clause: if we aren't on the home page, don't run the video script
  if (!overlay || !introVid) return;

  function dismissIntro() {
    sessionStorage.setItem('introSeen', 'true');
    overlay.classList.add('fade-out');
    document.body.classList.remove('intro-active');
    setTimeout(() => overlay.remove(), 1100);
  }

  if (sessionStorage.getItem('introSeen')) {
    overlay.remove();
    document.body.classList.remove('intro-active');
  } else {
    // Show fallback animated logo while video loads / if it errors
    introVid.addEventListener('error', () => {
      introVid.style.display = 'none';
      fallback.classList.add('show');
      setTimeout(dismissIntro, 2800);
    });
    
    introVid.addEventListener('ended', dismissIntro);
    skipBtn.addEventListener('click', dismissIntro);

    // CRITICAL MOBILE FIX: Force hardware-level muting before playing
    introVid.muted = true;
    introVid.defaultMuted = true;
    introVid.setAttribute('playsinline', '');
    introVid.setAttribute('webkit-playsinline', '');

    const p = introVid.play();
    if (p !== undefined) {
      p.then(() => {
        // Video is successfully playing on mobile
      }).catch((err) => {
        // If OS hard-blocks it (e.g., Low Power Mode), gracefully show the fallback
        introVid.style.display = 'none';
        fallback.classList.add('show');
        setTimeout(dismissIntro, 2800);
      });
    }
  }
})();