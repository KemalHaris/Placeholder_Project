document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*1. HERO CAROUSEL*/
  const carouselFrame = document.getElementById('heroCarousel');
  const track = document.getElementById('carouselTrack');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const dots = Array.from(document.querySelectorAll('.dot-btn'));
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const slideCounter = document.getElementById('slideCounter');

  const AUTOPLAY_MS = 5500;
  const totalSlides = slides.length;

  let currentIndex = 0;
  let timer = null;
  let userPaused = prefersReducedMotion;
  let hovering = false;
  let keyboardFocused = false;

  carouselFrame.style.setProperty('--autoplay-ms', `${AUTOPLAY_MS}ms`);

  function updateCarousel(newIndex) {
    currentIndex = (newIndex + totalSlides) % totalSlides;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === currentIndex);
    });

    dots.forEach((dot, idx) => {
      const active = idx === currentIndex;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    slideCounter.textContent =
      `${String(currentIndex + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
  }

  // Restart the progress-bar animation from zero
  function restartProgressBar() {
    carouselFrame.classList.remove('is-autoplaying');
    void carouselFrame.offsetWidth; // force reflow so the animation replays
    carouselFrame.classList.add('is-autoplaying');
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      updateCarousel(currentIndex + 1);
      restartProgressBar();
    }, AUTOPLAY_MS);
    restartProgressBar();
    track.setAttribute('aria-live', 'off');
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    carouselFrame.classList.remove('is-autoplaying');
    track.setAttribute('aria-live', 'polite');
  }

  function syncAutoPlay() {
    const shouldRun = !userPaused && !hovering && !keyboardFocused && !document.hidden;
    if (shouldRun) startTimer();
    else stopTimer();
  }

  function goTo(index) {
    updateCarousel(index);
    if (timer) startTimer();
  }

  function updatePlayPauseButton() {
    playPauseBtn.textContent = userPaused ? 'Play' : 'Pause';
    playPauseBtn.setAttribute(
      'aria-label',
      userPaused ? 'Start automatic slide rotation' : 'Pause automatic slide rotation'
    );
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.target))));

  playPauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    updatePlayPauseButton();
    syncAutoPlay();
  });

  // Pointer events + mouse check: on phones a tap fires a fake "mouseenter" that never
  // un-fires, which would leave autoplay stuck paused until the user tapped elsewhere.
  carouselFrame.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    syncAutoPlay();
  });
  carouselFrame.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    syncAutoPlay();
  });

  carouselFrame.addEventListener('focusin', (event) => {
    if (event.target.matches(':focus-visible')) {
      keyboardFocused = true;
      syncAutoPlay();
    }
  });
  carouselFrame.addEventListener('focusout', (event) => {
    if (!carouselFrame.contains(event.relatedTarget)) {
      keyboardFocused = false;
      syncAutoPlay();
    }
  });

  document.addEventListener('visibilitychange', syncAutoPlay);

  carouselFrame.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(currentIndex + 1);
    }
  });

  // Touch swipe
  let touchStartX = null;
  let touchStartY = null;

  carouselFrame.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  carouselFrame.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    touchStartX = touchStartY = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: true });

  updateCarousel(0);
  updatePlayPauseButton();
  syncAutoPlay();

  /* 3. SCROLL REVEAL */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll('.section-header, .product-card, .mascot-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach((el) => {
      const siblings = Array.from(el.parentElement.children);
      el.style.setProperty('--reveal-delay', `${(siblings.indexOf(el) % 5) * 80}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /*4. CLICK CONFETTI ON CARDS*/
  const confettiColors = ['#ffd43b', '#9775fa', '#51cf66', '#fff3bf', '#e5dbff'];

  function burstConfetti(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.style.left = `${x - 6}px`;
      bit.style.top = `${y - 6}px`;
      bit.style.backgroundColor = confettiColors[i % confettiColors.length];
      bit.style.borderRadius = i % 2 ? '50%' : '3px';
      document.body.appendChild(bit);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 60 + Math.random() * 60;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      const animation = bit.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy + 40}px) rotate(${Math.random() * 360}deg) scale(0.4)`, opacity: 0 }
        ],
        { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      animation.onfinish = () => bit.remove();
    }
  }

  if (!prefersReducedMotion) {
    document.querySelectorAll('.product-card, .mascot-card').forEach((card) => {
      card.addEventListener('click', (event) => burstConfetti(event.clientX, event.clientY));
    });
  }

  /*5. BACK TO TOP BUTTON*/
  const backToTopBtn = document.getElementById('backToTopBtn');
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});
