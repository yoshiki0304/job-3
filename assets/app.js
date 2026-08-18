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
  const anchor = document.querySelector('.portal-one-anchor');
  const portal = document.querySelector('.portal-window');
  const scrollHint = document.querySelector('.portal-scroll');
  const sub = document.querySelector('.portal-sub');
  const shell = document.querySelector('.page-shell');

  if (intro && stage && copy && anchor && portal && shell && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Build a live DOM preview of the actual site instead of enlarging a tiny bitmap.
    // This keeps text and images crisp during the portal transition.
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

    const syncPortal = () => {
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

      const tl = gsap.timeline({
        defaults:{ ease:'none' },
        scrollTrigger:{
          trigger:intro,
          start:'top top',
          end:() => `+=${Math.max(window.innerHeight * 2.35, 1500)}`,
          pin:stage,
          scrub:1,
          anticipatePin:1,
          invalidateOnRefresh:true,
          onRefresh:syncPortal,
          onLeave:() => gsap.set(portal, { autoAlpha:0 }),
          onEnterBack:() => gsap.set(portal, { autoAlpha:1 })
        }
      });

      tl.to([scrollHint, sub], { autoAlpha:0, y:-10, duration:.10 }, 0)
        // The digit "1" becomes the entrance point.
        .to(portal, { autoAlpha:1, duration:.08 }, .08)
        .to(copy, { scale:15, duration:.58 }, .10)
        // Expand the live-site window from the "1" to the whole viewport.
        .to(portal, {
          left:() => window.innerWidth / 2,
          top:() => window.innerHeight / 2,
          width:() => window.innerWidth,
          height:() => window.innerHeight,
          borderRadius:0,
          duration:.58
        }, .18)
        .to(copy, { autoAlpha:0, duration:.14 }, .57)
        .to(stage, { backgroundColor:'rgba(255,255,255,0)', duration:.12 }, .72);

      const refresh = () => {
        syncPortal();
        ScrollTrigger.refresh();
      };
      window.addEventListener('load', refresh, { once:true });
      window.addEventListener('resize', syncPortal);

      return () => {
        window.removeEventListener('resize', syncPortal);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      intro.style.display = 'none';
    });
  } else if (intro) {
    // If GSAP/CDN is unavailable, never trap the user on the intro screen.
    intro.style.display = 'none';
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
