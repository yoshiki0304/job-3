(() => {
  const lineUrl = 'https://lin.ee/xo4sCJy';
  document.querySelectorAll('.js-line-link').forEach(a => a.href = lineUrl);

  // Always begin from the intro when the page is opened normally.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  const today = document.getElementById('todayText');
  if (today) {
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone:'Asia/Tokyo', month:'numeric', day:'numeric'
    }).formatToParts(new Date());
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (month && day) today.textContent = `本日${month}月${day}日`;
  }

  // Normal section reveal animation.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.10, rootMargin:'0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  const intro = document.querySelector('.portal-intro');
  const stage = document.querySelector('.portal-stage');
  const copy = document.querySelector('.portal-copy');
  const anchor = document.querySelector('.portal-one-anchor');
  const portal = document.querySelector('.portal-window');
  const scrollHint = document.querySelector('.portal-scroll');
  const sub = document.querySelector('.portal-sub');
  const shell = document.querySelector('.page-shell');

  if (intro && stage && copy && anchor && portal && shell && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Show the real LP design inside the portal during the zoom.
    // This is DOM, not a low-resolution screenshot, so it stays sharp.
    if (!portal.querySelector('.portal-site-frame')) {
      const frame = document.createElement('div');
      frame.className = 'portal-site-frame';
      frame.setAttribute('aria-hidden', 'true');

      const shellClone = shell.cloneNode(true);
      shellClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      shellClone.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      shellClone.querySelectorAll('a,button,summary,input,select,textarea').forEach(el => {
        el.setAttribute('tabindex', '-1');
      });
      frame.appendChild(shellClone);
      portal.appendChild(frame);
    }

    let finished = false;
    let tl;

    const syncPortal = () => {
      // This is called at the top of the page before the zoom begins.
      const stageRect = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      const x = a.left + a.width / 2 - stageRect.left;
      const y = a.top + a.height / 2 - stageRect.top;
      const originX = a.left + a.width / 2 - c.left;
      const originY = a.top + a.height / 2 - c.top;
      gsap.set(portal, { left:x, top:y });
      gsap.set(copy, { transformOrigin:`${originX}px ${originY}px` });
      return { x, y };
    };

    const finishIntro = () => {
      if (finished) return;
      finished = true;

      // Keep the portal visible until the exact moment we switch to the real LP.
      gsap.set(portal, { autoAlpha:1 });

      requestAnimationFrame(() => {
        const st = tl?.scrollTrigger;
        if (st) st.kill(true);
        if (tl) tl.kill();

        // Remove the whole intro and its pin-spacing, then start the actual LP at TOP.
        intro.style.display = 'none';
        portal.style.display = 'none';
        stage.style.display = 'none';
        document.documentElement.classList.add('intro-complete');

        // Stop touch/mouse momentum from skipping past the LP top during the handoff.
        const oldOverflow = document.body.style.overflow;
        const oldBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);

        requestAnimationFrame(() => window.scrollTo(0, 0));
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.style.overflow = oldOverflow;
          document.documentElement.style.scrollBehavior = oldBehavior;
          // Refresh reveal positions after the document height changes.
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, 120);
      });
    };

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const pos = syncPortal();
      gsap.set(portal, {
        width:12,
        height:34,
        left:pos.x,
        top:pos.y,
        borderRadius:6,
        autoAlpha:0,
        force3D:false
      });
      gsap.set(copy, { scale:1, autoAlpha:1, force3D:true });
      gsap.set(stage, { backgroundColor:'#ffffff' });

      tl = gsap.timeline({
        defaults:{ ease:'none' },
        scrollTrigger:{
          trigger:intro,
          start:'top top',
          end:() => `+=${Math.max(window.innerHeight * 2.1, 1350)}`,
          pin:stage,
          scrub:1,
          anticipatePin:1,
          invalidateOnRefresh:true,
          onLeave:finishIntro
        }
      });

      tl.to([scrollHint, sub], { autoAlpha:0, y:-10, duration:.10 }, 0)
        // The number "1" is the entrance point.
        .to(portal, { autoAlpha:1, duration:.07 }, .07)
        .to(copy, { scale:16, duration:.58 }, .10)
        // Grow the live LP preview from the "1" until it fills the viewport.
        .to(portal, {
          left:() => window.innerWidth / 2,
          top:() => window.innerHeight / 2,
          width:() => window.innerWidth,
          height:() => window.innerHeight,
          borderRadius:0,
          duration:.56
        }, .18)
        .to(copy, { autoAlpha:0, duration:.14 }, .58)
        // Hold the finished LP preview on screen until pinning ends.
        .to(portal, { autoAlpha:1, duration:.24 }, .76);

      const refreshAtTop = () => {
        if (finished) return;
        if (window.scrollY < 5) {
          gsap.set(copy, { scale:1, autoAlpha:1 });
          const p = syncPortal();
          gsap.set(portal, { left:p.x, top:p.y, width:12, height:34, borderRadius:6, autoAlpha:0 });
        }
        ScrollTrigger.refresh();
      };

      window.addEventListener('load', refreshAtTop, { once:true });
      window.addEventListener('resize', refreshAtTop);

      return () => {
        window.removeEventListener('resize', refreshAtTop);
        if (!finished) {
          tl?.scrollTrigger?.kill(true);
          tl?.kill();
        }
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      intro.style.display = 'none';
      window.scrollTo(0, 0);
    });
  } else if (intro) {
    // If GSAP/CDN is unavailable, never trap the user on the intro screen.
    intro.style.display = 'none';
    window.scrollTo(0, 0);
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchorEl => {
    anchorEl.addEventListener('click', e => {
      const id = anchorEl.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 8,
        behavior:'smooth'
      });
    });
  });
})();
