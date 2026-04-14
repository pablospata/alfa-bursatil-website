/* ============================================================
   ALFA BURSÁTIL — main.js
   Animations, scroll reveals, interactive effects
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navbar scroll effect ---------- */
  const navbar = document.querySelector('.navbar');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile Menu Toggle ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const navLinkItems = document.querySelectorAll('.nav-link-item');

  if (menuToggle && navLinks) {
    const toggleMenu = () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', toggleMenu);

    navLinkItems.forEach(item => {
      item.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  } else if (glow) {
    glow.remove();
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Animate counter numbers ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = prefix + current.toLocaleString('es-AR') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Chart line animation boost ---------- */
  const chartLine = document.querySelector('.chart-line');
  const chartArea = document.querySelector('.chart-area');
  if (chartLine) {
    const totalLength = chartLine.getTotalLength();
    chartLine.style.strokeDasharray = totalLength;
    chartLine.style.strokeDashoffset = totalLength;
    // Area
    if (chartArea) {
      chartArea.style.strokeDasharray = totalLength;
      chartArea.style.strokeDashoffset = totalLength;
    }
  }

  /* ---------- Typing / Ticker tape for hero badge ---------- */
  const tickerEl = document.querySelector('.hero-badge .ticker-text');
  if (tickerEl) {
    const words = ['Dashboards', 'Calculadoras', 'Monitores', 'Modelos', 'Análisis'];
    let idx = 0;
    const cycle = () => {
      tickerEl.style.opacity = '0';
      tickerEl.style.transform = 'translateY(6px)';
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        tickerEl.textContent = words[idx];
        tickerEl.style.opacity = '1';
        tickerEl.style.transform = 'translateY(0)';
      }, 300);
    };
    setInterval(cycle, 2800);
    tickerEl.style.transition = 'opacity .3s ease, transform .3s ease';
  }

  /* ---------- Smooth anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Parallax on hero visual ---------- */
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      heroVisual.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

});
