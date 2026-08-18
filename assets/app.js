(() => {
  const lineUrl = 'https://lin.ee/xo4sCJy';
  document.querySelectorAll('.js-line-link').forEach(a => a.href = lineUrl);

  const today = document.getElementById('todayText');
  if (today) {
    const parts = new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo', month:'numeric', day:'numeric' }).formatToParts(new Date());
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (month && day) today.textContent = `本日${month}月${day}日`;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.12, rootMargin:'0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  const intro = document.querySelector('.portal-intro');
  const stage = document.querySelector('.portal-stage');
  const copy = document.querySelector('.portal-copy');
  const anchor = document.querySelector('.portal-hole-anchor');
  const portal = document.querySelector('.portal-window');
  const scrollHint = document.querySelector('.portal-scroll');
  const sub = document.querySelector('.portal-sub');

  if (intro && stage && copy && anchor && portal && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const syncPortal = () => {
      const stageRect = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      const x = a.left + a.width / 2 - stageRect.left;
      const y = a.top + a.height / 2 - stageRect.top;
      const originX = a.left + a.width / 2 - c.left;
      const originY = a.top + a.height / 2 - c.top;
      portal.style.left = `${x}px`;
      portal.style.top = `${y}px`;
      gsap.set(copy, { transformOrigin: `${originX}px ${originY}px` });
      return { x, y };
    };

    const coverScale = () => {
      const d = Math.hypot(window.innerWidth, window.innerHeight);
      return Math.max(1, d / 18 * 1.18);
    };

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      syncPortal();
      gsap.set(portal, { scale:.45, autoAlpha:0, borderRadius:'50%', force3D:true });
      gsap.set(copy, { scale:1, autoAlpha:1, force3D:true });

      const tl = gsap.timeline({
        defaults:{ ease:'none' },
        scrollTrigger:{
          trigger:intro,
          start:'top top',
          end:() => `+=${Math.max(window.innerHeight * 2.4, 1500)}`,
          pin:stage,
          scrub:1,
          anticipatePin:1,
          invalidateOnRefresh:true,
          onRefresh:syncPortal
        }
      });

      tl.to([scrollHint, sub], { autoAlpha:0, y:-12, duration:.12 }, 0)
        .to(portal, { autoAlpha:1, scale:1.2, duration:.12 }, .10)
        .to(copy, { scale:18, duration:.63 }, .12)
        .to(portal, { scale:coverScale, borderRadius:'0%', duration:.62 }, .16)
        .to(copy, { autoAlpha:0, duration:.15 }, .62)
        .to(portal, { autoAlpha:1, duration:.18 }, .70);

      const refresh = () => { syncPortal(); ScrollTrigger.refresh(); };
      window.addEventListener('load', refresh, { once:true });
      return () => tl.scrollTrigger?.kill();
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      intro.style.height = 'auto';
      stage.style.height = '100vh';
      gsap.set(copy,{ autoAlpha:1, scale:1 });
      gsap.set(portal,{ autoAlpha:0 });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchorEl => {
    anchorEl.addEventListener('click', e => {
      const id = anchorEl.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 8, behavior:'smooth' });
    });
  });
})();
