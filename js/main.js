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

// ── Job share helper (used on careers.html & admin.html) ─────────────────────
// Any element with data-share-job="<id>" data-share-title="<title>" becomes
// a share trigger. Always points at the PUBLIC apply.html listing page —
// never the admin page — regardless of which page the click came from.
(function () {
  function buildShareUrl(jobId) {
    return `${window.location.origin}/apply.html?job=${encodeURIComponent(jobId)}`;
  }

  function closeAllSharePopovers() {
    document.querySelectorAll('.share-popover').forEach(el => el.remove());
  }

  function openSharePopover(url, text, anchorEl) {
    closeAllSharePopovers();
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const links = [
      { label: 'WhatsApp', href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
      { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
      { label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
      { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
      { label: 'Email', href: `mailto:?subject=${encodedText}&body=${encodedUrl}` },
    ];

    const popover = document.createElement('div');
    popover.className = 'share-popover';
    popover.innerHTML = `
      <button type="button" class="share-popover__copy">🔗 Copy link</button>
      ${links.map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('')}
      <button type="button" class="share-popover__close" aria-label="Close">✕</button>
    `;
    document.body.appendChild(popover);

    const rect = anchorEl.getBoundingClientRect();
    const popW = popover.offsetWidth || 220;
    popover.style.top = `${window.scrollY + rect.bottom + 8}px`;
    popover.style.left = `${Math.max(8, Math.min(window.scrollX + rect.left, window.scrollX + document.documentElement.clientWidth - popW - 12))}px`;

    popover.querySelector('.share-popover__copy').addEventListener('click', async (e) => {
      try {
        await navigator.clipboard.writeText(url);
        e.target.textContent = '✓ Copied!';
        setTimeout(() => { if (e.target) e.target.textContent = '🔗 Copy link'; }, 1600);
      } catch {
        window.prompt('Copy this link:', url);
      }
    });
    popover.querySelector('.share-popover__close').addEventListener('click', closeAllSharePopovers);
  }

  async function shareJob(jobId, title, anchorEl) {
    const url = buildShareUrl(jobId);
    const text = `We're hiring: ${title} at Atlara Hyperlogistics`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user cancelled, do nothing
        // otherwise fall through to the popover
      }
    }
    openSharePopover(url, text, anchorEl);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-share-job]');
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      shareJob(trigger.dataset.shareJob, trigger.dataset.shareTitle || 'this role', trigger);
      return;
    }
    if (!event.target.closest('.share-popover')) closeAllSharePopovers();
  });

  window.AtlaraShare = { shareJob, buildShareUrl };
})();