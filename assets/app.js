(() => {
  const lineUrl = 'https://lin.ee/xo4sCJy';
  document.querySelectorAll('.js-line-link').forEach(a => a.href = lineUrl);

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

  // Normal LP reveal animation.
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

    // Live DOM preview keeps the transition crisp at any zoom level.
    if (!portal.querySelector('.portal-site-frame')) {
      const frame = document.createElement('div');
      frame.className = 'portal-site-frame';
      frame.setAttribute('aria-hidden', 'true');

      const shellClone = shell.cloneNode(true);
      shellClone.classList.remove('real-shell');
      shellClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      shellClone.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      shellClone.querySelectorAll('a,button,summary,input,select,textarea').forEach(el => {
        el.setAttribute('tabindex', '-1');
      });
      frame.appendChild(shellClone);
      portal.appendChild(frame);
    }

    let tl;

    const syncPortal = () => {
      const stageRect = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      const x = a.left + a.width / 2 - stageRect.left;
      const y = a.top + a.height / 2 - stageRect.top;
      const originX = a.left + a.width / 2 - c.left;
      const originY = a.top + a.height / 2 - c.top;
      gsap.set(copy, { transformOrigin:`${originX}px ${originY}px` });
      return { x, y };
    };

    const getIntroDistance = () => Math.max(window.innerHeight * 3.1, 2100);

    const sizeIntro = () => {
      // The intro itself provides the scroll distance. pinSpacing is disabled,
      // so when the pin ends the real LP starts exactly at the top of viewport.
      intro.style.height = `${getIntroDistance()}px`;
    };

    const setStartState = () => {
      const p = syncPortal();
      gsap.set(stage, { autoAlpha:1, backgroundColor:'#ffffff' });
      gsap.set(copy, { scale:1, autoAlpha:1, force3D:true });
      gsap.set(portal, {
        width:12,
        height:34,
        left:p.x,
        top:p.y,
        borderRadius:6,
        autoAlpha:0,
        force3D:false
      });
      gsap.set([scrollHint, sub], { autoAlpha:1, y:0 });
    };

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      sizeIntro();
      setStartState();
      document.body.classList.add('intro-active');
      document.body.classList.remove('intro-complete');

      tl = gsap.timeline({
        defaults:{ ease:'none' },
        scrollTrigger:{
          trigger:intro,
          start:'top top',
          end:() => `+=${getIntroDistance()}`,
          pin:stage,
          pinSpacing:false,
          scrub:1,
          anticipatePin:1,
          invalidateOnRefresh:true,
          onEnterBack:() => {
            // Re-enter the intro when the user scrolls back up from the LP.
            intro.style.pointerEvents = '';
            document.body.classList.add('intro-active');
            document.body.classList.remove('intro-complete');
            gsap.set(stage, { autoAlpha:1, display:'grid' });
            gsap.set(portal, { autoAlpha:1, display:'block' });
          },
          onLeave:() => {
            // Hide the preview layer completely once the real LP takes over.
            intro.style.pointerEvents = 'none';
            document.body.classList.remove('intro-active');
            document.body.classList.add('intro-complete');
            gsap.set(portal, { autoAlpha:0, display:'none' });
            gsap.set(stage, { autoAlpha:0, display:'none' });
          },
          onLeaveBack:() => {
            // Fully restore the first screen when returning to page top.
            gsap.set(stage, { display:'grid' });
            gsap.set(portal, { display:'block' });
            intro.style.pointerEvents = '';
            document.body.classList.add('intro-active');
            document.body.classList.remove('intro-complete');
            setStartState();
          }
        }
      });

      tl.to([scrollHint, sub], { autoAlpha:0, y:-10, duration:.08 }, 0)
        // The digit "1" is the entrance point.
        .to(portal, { autoAlpha:1, duration:.06 }, .06)
        .to(copy, { scale:16, duration:.50 }, .10)
        // Expand the live LP preview from the "1" to fill the viewport.
        .to(portal, {
          left:() => window.innerWidth / 2,
          top:() => window.innerHeight / 2,
          width:() => window.innerWidth,
          height:() => window.innerHeight,
          borderRadius:0,
          duration:.50
        }, .18)
        .to(copy, { autoAlpha:0, duration:.12 }, .55)
        // Keep the completed LP preview pinned until the real LP reaches top.
        .to(portal, { autoAlpha:1, duration:.33 }, .67);

      const refresh = () => {
        sizeIntro();
        if (window.scrollY < 5) setStartState();
        ScrollTrigger.refresh();
      };

      window.addEventListener('load', refresh, { once:true });
      window.addEventListener('resize', refresh);

      return () => {
        window.removeEventListener('resize', refresh);
        tl?.scrollTrigger?.kill(true);
        tl?.kill();
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      intro.style.display = 'none';
      document.body.classList.remove('intro-active');
      document.body.classList.add('intro-complete');
      window.scrollTo(0, 0);
    });
  } else if (intro) {
    // If GSAP/CDN is unavailable, never trap the user on the intro screen.
    intro.style.display = 'none';
    document.body.classList.remove('intro-active');
    document.body.classList.add('intro-complete');
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
