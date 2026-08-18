(() => {
  const lineUrl = 'https://lin.ee/xo4sCJy';
  document.querySelectorAll('.js-line-link').forEach(a => a.href = lineUrl);

  // Japan-local date in the flyer.
  const today = document.getElementById('zoomTodayText');
  if (today) {
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(new Date());
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (month && day) today.textContent = `本日${month}月${day}日`;
  }

  // Existing reveal animations for the normal web page.
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Scroll-linked zoom intro: pin + scrub + scale.
  const intro = document.querySelector('.zoom-intro');
  const stage = document.querySelector('.zoom-stage');
  const flyer = document.querySelector('.zoom-flyer');
  const hint = document.querySelector('.zoom-hint');
  const backdrop = document.querySelector('.zoom-backdrop');

  if (intro && stage && flyer && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    const initialScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const widthFit = (w < 600 ? w * 0.84 : Math.min(w * 0.40, 520)) / 720;
      const heightFit = (h * 0.72) / 1040;
      const cap = w < 600 ? 0.46 : 0.58;
      return Math.min(cap, widthFit, heightFit);
    };

    const coverScale = () => {
      const scaleX = window.innerWidth / 720;
      const scaleY = window.innerHeight / 1040;
      return Math.max(scaleX, scaleY) * 1.035;
    };

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(flyer, {
        scale: initialScale,
        autoAlpha: 1,
        borderRadius: 8,
        force3D: true
      });
      document.body.classList.add('zooming');

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: intro,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 1.75, 1150)}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => document.body.classList.add('zooming'),
          onEnterBack: () => document.body.classList.add('zooming'),
          onLeave: () => document.body.classList.remove('zooming'),
          onLeaveBack: () => document.body.classList.add('zooming')
        }
      });

      tl.to(hint, { autoAlpha: 0, y: -14, duration: 0.16 }, 0)
        .to(flyer, {
          scale: coverScale,
          borderRadius: 0,
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          duration: 0.88
        }, 0)
        .to(backdrop, { opacity: 0, duration: 0.18 }, 0.80)
        .to(flyer, { autoAlpha: 0.06, duration: 0.10 }, 0.90);

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener('load', refresh, { once: true });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        document.body.classList.remove('zooming');
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      const fit = Math.min((window.innerWidth * 0.90) / 720, (window.innerHeight * 0.86) / 1040, 0.8);
      gsap.set(flyer, { scale: fit, autoAlpha: 1 });
      gsap.set(hint, { autoAlpha: 0 });
      return () => gsap.set(flyer, { clearProps: 'transform,opacity,visibility' });
    });
  } else if (flyer) {
    // Graceful fallback if the CDN is unavailable.
    const fit = Math.min((window.innerWidth * 0.90) / 720, (window.innerHeight * 0.86) / 1040, 0.8);
    flyer.style.transform = `scale(${fit})`;
    flyer.style.opacity = '1';
    if (hint) hint.style.display = 'none';
  }

  // Smooth in-page navigation.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const header = document.querySelector('.site-header');
      const offset = target.classList.contains('zoom-intro') ? 0 : (header?.offsetHeight || 0) + 8;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
