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