// ==========================================
// 1. FUNZIONI GLOBALI (Richiamate dall'HTML)
// ==========================================

// --- Gestione Lingua ---
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
  
    document.querySelectorAll('[data-placeholder-it]').forEach(el => {
        el.placeholder = el.getAttribute('data-placeholder-' + lang);
    });
  
    document.title = lang === 'it'
      ? 'MadHat Works — Siti Web per Attività Locali'
      : 'MadHat Works — Websites for Local Business';
}

// --- Gestione Menu Mobile ---
window.toggleMenu = function() {
    const links = document.getElementById('nav-links');
    const btn = document.getElementById('nav-hamburger');
    links.classList.toggle('open');
    btn.classList.toggle('open');
    
    // Accessibilità: dice agli screen reader se è aperto
    const isOpen = links.classList.contains('open');
    btn.setAttribute('aria-expanded', isOpen);
    
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

window.closeMenu = function() {
    const links = document.getElementById('nav-links');
    const btn = document.getElementById('nav-hamburger');
    links.classList.remove('open');
    btn.classList.remove('open');
    
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}


// ==========================================
// 2. MODULI (Logica divisa per sezioni)
// ==========================================

function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return; // 🛡️ Controllo sicurezza

    // Effetto blur allo scroll
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // Chiudi menu se si clicca fuori
    document.addEventListener('click', (event) => {
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.getElementById('nav-hamburger');
        if (navLinks && navLinks.classList.contains('open')) {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                window.closeMenu(); 
            }
        }
    });

    // Chiudi menu con il tasto ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeMenu();
    });

    // Chiudi menu se si allarga la finestra (ritorno a desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) window.closeMenu();
    });
}

function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length === 0) return;

    // Fa comparire gli elementi quando entrano nello schermo
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { 
            if (e.isIntersecting) { 
                e.target.classList.add('visible'); 
                observer.unobserve(e.target); 
            } 
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
}

function initCounters() {
    const elementsToObserve = ['stat-days', 'stat-pct', 'stat-inf']
        .map(id => document.getElementById(id))
        .filter(el => el !== null);

    if (elementsToObserve.length === 0) return; 

    function animateCounter(el, target, duration, suffix, isInfinity) {
        let start = null;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
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

    elementsToObserve.forEach(el => counterObserver.observe(el));
}

function initFAQ() {
    const faqButtons = document.querySelectorAll('.faq-q');
    if (faqButtons.length === 0) return;

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

    // Apri FAQ se c'è l'ancora nell'URL
    if (window.location.hash && window.location.hash.startsWith('#faq-')) {
        openFaqById(window.location.hash.slice(1));
    }

    document.querySelectorAll('a[href^="#faq-"]').forEach(link => {
        link.addEventListener('click', () => {
            const id = link.getAttribute('href').slice(1);
            setTimeout(() => openFaqById(id), 50);
        });
    });

    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const answer = btn.nextElementSibling;
            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            
            // Chiudi tutte le altre FAQ
            faqButtons.forEach(b => {
                b.setAttribute('aria-expanded', 'false');
                b.nextElementSibling.hidden = true;
            });
            
            // Apri quella cliccata
            if (!isOpen) {
                btn.setAttribute('aria-expanded', 'true');
                answer.hidden = false;
            }
        });
    });
}

function initSlider() {
    const slider = document.getElementById('testimonial-slider');
    const cards = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.getElementById('slider-dots');
    const container = document.querySelector('.testimonials-container');

    if (!slider || !dotsContainer || cards.length <= 1) return;

    window.sliderData = {
        currentSlide: 0,
        totalSlides: cards.length,
        interval: null
    };

    dotsContainer.innerHTML = ''; 
    cards.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => window.goToSlide(i);
        dotsContainer.appendChild(dot);
    });

    function startAutoplay() {
        if (!window.sliderData.interval) {
            window.sliderData.interval = setInterval(window.nextSlide, 5000); 
        }
    }

    function stopAutoplay() {
        clearInterval(window.sliderData.interval);
        window.sliderData.interval = null;
    }

    // GESTIONE SWIPE TOUCH
    let touchStartX = 0;
    let touchEndX = 0;

    if (container) {
        // Pausa mouse
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);
        
        // Touch e Swipe
        container.addEventListener('touchstart', (e) => {
            stopAutoplay();
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoplay(); // FIX: Ripristina scorrimento
        }, {passive: true});
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) window.nextSlide();
        if (touchEndX > touchStartX + swipeThreshold) window.prevSlide();
    }

    startAutoplay();
}

// Funzioni Globali per lo Slider
window.updateSlider = function() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    
    slider.style.transform = `translateX(-${window.sliderData.currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === window.sliderData.currentSlide);
    });
}

window.nextSlide = function() {
    window.sliderData.currentSlide = (window.sliderData.currentSlide + 1) % window.sliderData.totalSlides;
    window.updateSlider();
}

window.prevSlide = function() {
    window.sliderData.currentSlide = (window.sliderData.currentSlide - 1 + window.sliderData.totalSlides) % window.sliderData.totalSlides;
    window.updateSlider();
}

window.goToSlide = function(n) {
    window.sliderData.currentSlide = n;
    window.updateSlider();
}


// ==========================================
// 3. AVVIO (Run al caricamento pagina)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCounters();
    initFAQ();
    initSlider();
});