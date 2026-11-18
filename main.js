/* ESTÚDIO ALVOR — interações (arquivo completo) */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mq.matches;

  /* header */
  const header = $('#hdr');
  const hero   = $('.hero');

  function syncHeader() {
    if (!header) return;
    const limit = (hero ? hero.offsetHeight : window.innerHeight) - 96;
    header.classList.toggle('is-scrolled', window.scrollY > limit);
  }

  /* menu mobile */
  const burger = $('#burger');
  const menu   = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    if (!burger || !menu) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    header?.classList.toggle('is-menu', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      window.setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 420);
    }
  }

  burger?.addEventListener('click', () => setMenu(!menuOpen));
  $$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); burger?.focus(); }
  });

  /* carrossel do hero */
  const slides     = $$('.hero__slide');
  const counterNow = $('#slideNow');
  const counterTot = $('#slideTot');
  const playBtn    = $('#play');
  let index = 0;
  let playing = !reduced;
  let timer = null;

  if (counterTot) counterTot.textContent = pad(slides.length);

  function paintPlay() {
    if (!playBtn) return;
    playBtn.classList.toggle('is-paused', !playing);
    playBtn.setAttribute('aria-pressed', String(!playing));
    playBtn.setAttribute('aria-label', playing ? 'Pausar apresentação' : 'Retomar apresentação');
  }

  function show(next) {
    if (!slides.length) return;
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    if (counterNow) counterNow.textContent = pad(index + 1);
  }

  const stopAuto = () => window.clearInterval(timer);

  function startAuto() {
    stopAuto();
    if (!playing || reduced || slides.length < 2) return;
    timer = window.setInterval(() => show(index + 1), 7000);
  }

  $$('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      show(index + Number(btn.dataset.dir || 1));
      startAuto();
    });
  });

  playBtn?.addEventListener('click', () => {
    playing = !playing;
    paintPlay();
    startAuto();
  });

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopAuto() : startAuto();
  });
  hero?.addEventListener('pointerenter', stopAuto);
  hero?.addEventListener('pointerleave', startAuto);

  show(0);
  paintPlay();
  startAuto();

  requestAnimationFrame(() => requestAnimationFrame(() => hero?.classList.add('is-ready')));

  mq.addEventListener?.('change', (e) => {
    reduced = e.matches;
    playing = !reduced;
    paintPlay();
    startAuto();
  });

  /* revelações no scroll */
  const revealTargets = $$('[data-reveal], [data-mask]');

  revealTargets.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty('--delay', `${Number(el.dataset.delay)}ms`);
  });

  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* contagem dos indicadores */
  function runCount(el) {
    const target = Number(el.dataset.count) || 0;
    if (reduced) { el.textContent = String(target); return; }
    const duration = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => { c.textContent = c.dataset.count; });
  }

  /* parallax discreto */
  const parallaxEls = $$('[data-parallax]');
  let parallaxQueued = false;

  function runParallax() {
    parallaxQueued = false;
    if (reduced || window.innerWidth < 900) {
      parallaxEls.forEach((el) => { el.style.transform = ''; });
      return;
    }
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const box = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
      if (!box || box.bottom < -240 || box.top > vh + 240) return;
      const speed  = Number(el.dataset.parallax) || 0.06;
      const offset = (box.top + box.height / 2 - vh / 2) * -speed;
      el.style.transform = `translate3d(0,${offset.toFixed(2)}px,0)`;
    });
  }

  function queueParallax() {
    if (parallaxQueued) return;
    parallaxQueued = true;
    requestAnimationFrame(runParallax);
  }

  /* depoimentos */
  const voiceData = [
    { quote: 'Chegamos com um terreno difícil e muitas dúvidas. O estúdio devolveu um projeto que parece ter sempre existido ali — e conduziu a obra sem que precisássemos apagar incêndio.', name: 'Marina Costa', role: 'Proprietária · Casa Mantiqueira' },
    { quote: 'O que mais me marcou foi a disciplina do processo: cada etapa chegava documentada, cada dúvida respondida com desenho, não com discurso.', name: 'Helena Prado', role: 'Proprietária · Apartamento Jardins' },
    { quote: 'Trabalhar com o estúdio foi acompanhar uma equipe que discute a espessura de uma esquadria com o mesmo rigor com que discute o partido do edifício.', name: 'Bruno Salgado', role: 'Gestor cultural · Pavilhão Serra' },
    { quote: 'A casa foi feita para o nosso jeito de viver, não para uma revista. Isso é mais raro do que parece.', name: 'Clara Nogueira', role: 'Proprietária · Casa Litoral' }
  ];

  const voicesGrid = $('#voicesGrid');
  const perPage    = 2;
  const pageCount  = Math.max(1, Math.ceil(voiceData.length / perPage));
  let voicePage    = 0;

  const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join('').toUpperCase();

  const voiceMarkup = (v) => `
    <article class="voice">
      <p class="voice__quote">${v.quote}</p>
      <div class="voice__who">
        <span class="voice__av" aria-hidden="true">${initials(v.name)}</span>
        <div>
          <p class="voice__name">${v.name}</p>
          <p class="voice__role">${v.role}</p>
        </div>
      </div>
    </article>`;

  function renderVoices() {
    if (!voicesGrid) return;
    const slice = voiceData.slice(voicePage * perPage, voicePage * perPage + perPage);
    voicesGrid.innerHTML = slice.map(voiceMarkup).join('');
  }

  function changeVoices(dir) {
    if (!voicesGrid || pageCount < 2) return;
    voicePage = (voicePage + dir + pageCount) % pageCount;
    voicesGrid.classList.add('is-fading');
    window.setTimeout(() => {
      renderVoices();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        voicesGrid.classList.remove('is-fading');
      }));
    }, reduced ? 0 : 260);
  }

  renderVoices();
  $('#vPrev')?.addEventListener('click', () => changeVoices(-1));
  $('#vNext')?.addEventListener('click', () => changeVoices(1));

  /* formulário */
  const form     = $('#form');
  const formDone = $('#formDone');

  function setFieldError(field, message) {
    const wrap = field.closest('.field');
    const err  = document.getElementById(`err-${field.id}`);
    wrap?.classList.toggle('is-error', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) {
      err.textContent = message || '';
      if (message) field.setAttribute('aria-describedby', err.id);
      else field.removeAttribute('aria-describedby');
    }
  }

  const validators = {
    nome:  (v) => v.trim().length >= 3 ? '' : 'Informe seu nome completo.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Informe um e-mail válido.',
    tel:   (v) => !v.trim() || v.replace(/\D/g, '').length >= 10 ? '' : 'Telefone incompleto.',
    tipo:  (v) => v ? '' : 'Selecione o tipo de projeto.',
    msg:   (v) => v.trim().length >= 10 ? '' : 'Conte um pouco mais (mínimo 10 caracteres).'
  };

  const formFields = ['nome', 'email', 'tel', 'tipo', 'msg']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  formFields.forEach((field) => {
    const evt = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(evt, () => {
      const check = validators[field.id];
      if (check && check(field.value) === '') setFieldError(field, '');
    });
    field.addEventListener('blur', () => {
      const check = validators[field.id];
      if (check && field.value.trim()) setFieldError(field, check(field.value));
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    formFields.forEach((field) => {
      const check = validators[field.id];
      if (!check) return;
      const message = check(field.value);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    const submitBtn = $('.form__btn', form);
    submitBtn?.classList.add('is-loading');
    if (submitBtn) submitBtn.disabled = true;

    // Protótipo sem backend. Troque a linha abaixo por:
    // await fetch('https://seu-endpoint', { method: 'POST', body: new FormData(form) });
    await new Promise((resolve) => window.setTimeout(resolve, 1300));

    form.hidden = true;
    if (formDone) {
      formDone.hidden = false;
      formDone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
  });

  /* newsletter */
  const news    = $('#news');
  const newsMsg = $('#newsMsg');

  news?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newsEmail', news);
    if (!input || !newsMsg) return;

    const ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim());
    if (!ok) {
      newsMsg.textContent = 'Informe um e-mail válido.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    newsMsg.textContent = 'Inscrição confirmada. Obrigado.';
    news.reset();
  });

  /* ano + eventos globais */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  window.addEventListener('scroll', () => { syncHeader(); queueParallax(); }, { passive: true });
  window.addEventListener('resize', () => { syncHeader(); queueParallax(); });

  syncHeader();
  queueParallax();

  document.body.classList.add('ready');
})();
