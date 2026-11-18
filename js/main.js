/* Ecoleaf V2 — interactions */
(function () {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Smooth scroll (Lenis) */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -80 });
    }));
  }

  /* Intro (home page): dark screen dissolves into the hero, then headline and nav fade up */
  const intro = document.querySelector('.intro-screen');
  const ready = () => doc.classList.add('is-ready');
  if (intro && doc.classList.contains('intro')) {
    const heroImg = document.querySelector('.hero-img');
    const imgReady = new Promise((res) => {
      if (!heroImg || heroImg.complete) return res();
      heroImg.addEventListener('load', res, { once: true });
      heroImg.addEventListener('error', res, { once: true });
      setTimeout(res, 2500);
    });
    if (lenis) lenis.stop();
    Promise.all([imgReady, new Promise((res) => setTimeout(res, 150))]).then(() => {
      doc.classList.add('intro-out');
      setTimeout(ready, 250);
      setTimeout(() => { doc.classList.add('intro-done'); intro.remove(); if (lenis) lenis.start(); }, 900);
    });
  } else {
    requestAnimationFrame(ready);
  }

  /* Header */
  const header = document.querySelector('.header');
  const overHero = !!document.querySelector('.hero, .phero');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-solid', !overHero || y > 30);
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !doc.classList.contains('nav-open'));
    lastY = y;
    parallax(y);
  }

  /* Parallax for hero backgrounds and image strip */
  const pBg = [...document.querySelectorAll('.hero .bg, .phero .bg')];
  const pStrip = [...document.querySelectorAll('.strip img')];
  function parallax(y) {
    if (reduce) return;
    pBg.forEach((el) => { el.style.transform = `translate3d(0, ${Math.min(y, innerHeight) * 0.18}px, 0)`; });
    pStrip.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `scale(1.12) translate3d(0, ${p * -40}px, 0)`;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  const burger = document.querySelector('.burger');
  if (burger) {
    const set = (open) => {
      doc.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (lenis) open ? lenis.stop() : lenis.start();
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => set(!doc.classList.contains('nav-open')));
    document.querySelectorAll('.mnav a').forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  /* Reveal */
  const rv = document.querySelectorAll('.rv, .clip');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  /* Count-up */
  const nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; co.unobserve(el);
      const end = +el.dataset.count, t0 = performance.now(), dur = 2400;
      (function tick(t) {
        const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 4));
        el.textContent = Math.round(v).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }), { threshold: 0.6 });
    nums.forEach((n) => { n.textContent = '0'; co.observe(n); });
  } else nums.forEach((n) => { n.textContent = (+n.dataset.count).toLocaleString('en-US'); });

  /* Carousels */
  document.querySelectorAll('[data-carousel]').forEach((c) => {
    const tr = c.querySelector('.car-track'), slides = tr.children, dots = c.querySelectorAll('.car-dots button');
    let i = 0, timer;
    const go = (n) => { i = (n + slides.length) % slides.length; tr.scrollTo({ left: tr.clientWidth * i }); };
    const mark = () => dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    tr.addEventListener('scroll', () => { i = Math.round(tr.scrollLeft / tr.clientWidth); mark(); }, { passive: true });
    c.querySelector('.prev').addEventListener('click', () => go(i - 1));
    c.querySelector('.next').addEventListener('click', () => go(i + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    const play = () => { if (!reduce) timer = setInterval(() => go(i + 1), 7000); };
    const stop = () => clearInterval(timer);
    c.addEventListener('mouseenter', stop); c.addEventListener('mouseleave', play);
    c.addEventListener('focusin', stop); c.addEventListener('focusout', play);
    mark(); play();
  });

  /* Project filters */
  const fb = document.querySelectorAll('[data-filter]');
  fb.forEach((b) => b.addEventListener('click', () => {
    fb.forEach((x) => x.classList.toggle('on', x === b));
    const f = b.dataset.filter;
    document.querySelectorAll('[data-cat]').forEach((c) => c.classList.toggle('hide', f !== 'all' && !c.dataset.cat.split(' ').includes(f)));
  }));

  /* Forms → Web3Forms (emails each submission to the address linked to the access key) */
  document.querySelectorAll('form[data-web3form]').forEach((form) => {
    const st = form.querySelector('.status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.querySelector('[name=botcheck]')?.checked) return;
      const btn = form.querySelector('button[type=submit]');
      st.className = 'status'; st.textContent = 'Sending…'; if (btn) btn.disabled = true;
      try {
        const r = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.success === false) throw 0;
        form.reset(); st.className = 'status ok';
        st.textContent = form.classList.contains('nl-form') ? "You're subscribed. Thank you." : "Thank you. We'll be in touch within one business day.";
      } catch (_) {
        st.className = 'status err'; st.textContent = 'Something went wrong. Please call 0917 155 2264 or email info.eldc@ecoleafdevtcorp.com.';
      } finally { if (btn) btn.disabled = false; }
    });
  });

  /* Pause off-screen videos */
  document.querySelectorAll('video[autoplay]').forEach((v) => {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  });

  /* About: drifting photo strip. Keeps moving on hover; trackpad swipe or drag scrolls it sideways */
  document.querySelectorAll('[data-gallery]').forEach((g) => {
    const tracks = [...g.querySelectorAll('.track')];
    if (!tracks.length) return;
    let off = 0, last = performance.now(), loop = 0, drag = null;
    const SPEED = 28; // px per second
    const measure = () => { loop = tracks[0].getBoundingClientRect().width; };
    measure(); window.addEventListener('resize', measure);
    const apply = () => {
      if (loop) off = ((off % loop) + loop) % loop;
      tracks.forEach((tr) => { tr.style.transform = `translate3d(${-off}px,0,0)`; });
    };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!reduce && !drag) off += SPEED * dt;
      apply(); requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    g.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); e.stopPropagation(); off += e.deltaX; apply(); }
    }, { passive: false });
    g.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { x: e.clientX, o: off, moved: false }; g.setPointerCapture(e.pointerId); g.classList.add('is-drag');
    });
    g.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      off = drag.o - dx; apply();
    });
    const end = () => { drag = null; g.classList.remove('is-drag'); };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('dragstart', (e) => e.preventDefault());
  });

  const y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
