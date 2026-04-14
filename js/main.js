// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (nav) {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { 
      if (e.isIntersecting) { 
          e.target.classList.add('visible'); 
          observer.unobserve(e.target); 
      } 
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Language switcher
function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.textContent === lang.toUpperCase());
  });

  document.querySelectorAll('[data-it][data-en]').forEach(el => {
    const val = el.getAttribute('data-' + lang);
    if (!val) return;
    if (val.includes('<')) { 
        el.innerHTML = val; 
    } else { 
        el.textContent = val; 
    }
  });

  // Textarea placeholders
  document.querySelectorAll('[data-placeholder-it]').forEach(el => {
    el.placeholder = el.getAttribute('data-placeholder-' + lang);
  });

  document.title = lang === 'it'
    ? 'MadHat Works — Siti Web per Attività Locali'
    : 'MadHat Works — Websites for Local Business';
}

// --- Animated counters ---
function animateCounter(el, target, duration, suffix, isInfinity) {
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    // Ease out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.floor(eased * target);
    if (isInfinity && current >= target) {
      el.textContent = '∞';
    } else {
      el.textContent = current + suffix;
    }
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      counterObserver.unobserve(e.target);
      const el = e.target;
      if (el.id === 'stat-days')  animateCounter(el, 7,   900,  '',  false);
      if (el.id === 'stat-pct')   animateCounter(el, 100, 1100, '%', false);
      if (el.id === 'stat-inf')   animateCounter(el, 999, 1400, '',  true);
    }
  });
}, { threshold: 0.5 });

['stat-days','stat-pct','stat-inf'].forEach(id => {
  const el = document.getElementById(id);
  if (el) counterObserver.observe(el);
});

// --- Auto-open FAQ item on hash navigation ---
function openFaqById(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const btn = item.querySelector('.faq-q');
  const answer = item.querySelector('.faq-a');
  if (btn && answer) {
    btn.setAttribute('aria-expanded', 'true');
    answer.hidden = false;
    setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }
}
if (window.location.hash) {
  const id = window.location.hash.slice(1);
  if (id.startsWith('faq-')) openFaqById(id);
}
document.querySelectorAll('a[href^="#faq-"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    setTimeout(() => openFaqById(id), 50);
  });
});


document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.hidden = true;
    });
    // Toggle clicked
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
});
