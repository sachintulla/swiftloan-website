/* =========================================================
   SwiftLoan.ai — Interactions
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');

  /* ---------- year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- nav: scroll shadow + back-to-top ---------- */
  const nav = $('#nav');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- mobile menu ---------- */
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const toggleMenu = (open) => {
    const willOpen = open ?? !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', willOpen);
    nav.classList.toggle('menu-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
    document.body.style.overflow = willOpen ? 'hidden' : '';
  };
  navToggle.addEventListener('click', () => toggleMenu());
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- language toggle (EN/HI) ---------- */
  $$('.langtoggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.langtoggle__btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.documentElement.setAttribute('lang', btn.dataset.lang === 'HI' ? 'hi' : 'en');
    });
  });

  /* ---------- scroll reveal ---------- */
  const revealTargets = [
    '.section__head', '.svc-card', '.journey__step', '.ai__feat', '.ai__panel',
    '.sec-card', '.review', '.partners__col', '.stat', '.calc', '.tracker',
    '.apply__form', '.faq__item', '.logostrip'
  ];
  const revealEls = $$(revealTargets.join(','));
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 60 + 'ms';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  /* ---------- animated stat counters ---------- */
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    const isMoney = target >= 1000;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      let val = target * eased;
      let out;
      if (target >= 100000) out = (val / 100000).toFixed(val >= 100000 ? 1 : 0) + 'L';
      else out = Math.round(val).toLocaleString('en-IN');
      // custom formatting per stat
      if (el.dataset.count === '2400') out = '₹' + Math.round(val).toLocaleString('en-IN');
      else if (el.dataset.count === '500000') out = Math.round(val).toLocaleString('en-IN');
      el.textContent = out + (p === 1 ? suffix : (suffix ? '' : ''));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = out + suffix;
    };
    requestAnimationFrame(step);
  };
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  $$('.stat__num').forEach(el => statIO.observe(el));

  /* ---------- match list stagger ---------- */
  const matchIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        $$('.match-row', e.target).forEach((row, i) => {
          setTimeout(() => row.classList.add('in'), 250 + i * 220);
        });
        matchIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  const matchList = $('#matchList');
  if (matchList) matchIO.observe(matchList);

  /* ---------- EMI CALCULATOR ---------- */
  const amount = $('#amount'), rate = $('#rate'), tenure = $('#tenure');
  const amountOut = $('#amountOut'), rateOut = $('#rateOut'), tenureOut = $('#tenureOut');
  const emiOut = $('#emiOut'), principalOut = $('#principalOut'),
        interestOut = $('#interestOut'), totalOut = $('#totalOut');
  const donut = $('#donut');
  const R = 52, CIRC = 2 * Math.PI * R;

  const fmtAmountLabel = (v) => {
    if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + 'Cr';
    if (v >= 100000)   return '₹' + (v / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    return '₹' + (v / 1000) + 'K';
  };

  const calcEMI = () => {
    const P = +amount.value;
    const annual = +rate.value;
    const n = +tenure.value;
    const r = annual / 12 / 100;
    const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - P;

    amountOut.textContent = fmtINR(P);
    rateOut.textContent = annual.toFixed(1) + '%';
    tenureOut.textContent = n + ' month' + (n > 1 ? 's' : '');
    emiOut.textContent = fmtINR(emi);
    principalOut.textContent = fmtINR(P);
    interestOut.textContent = fmtINR(interest);
    totalOut.textContent = fmtINR(total);

    const principalRatio = P / total;
    if (donut) {
      donut.setAttribute('r', R);
      donut.style.strokeDasharray = `${(principalRatio * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`;
    }
  };
  [amount, rate, tenure].forEach(el => el && el.addEventListener('input', calcEMI));
  if (amount) { donut.style.strokeDasharray = `0 ${CIRC}`; calcEMI(); }

  /* ---------- APPLICATION TRACKER ---------- */
  const demoApps = {
    'SL-2048': {
      type: 'Personal Loan', amount: '₹5,00,000',
      stage: 3,
      steps: [
        { t: 'Application submitted', d: 'Received on 12 Mar, 10:24 AM' },
        { t: 'Eligibility check', d: 'Soft check across 18 lenders — passed' },
        { t: 'Offers matched', d: '4 offers found · best rate 10.49% p.a.' },
        { t: 'eKYC & verification', d: 'In progress — complete your video KYC' },
        { t: 'Loan approved', d: 'Pending verification' },
        { t: 'Amount disbursed', d: 'Funds credited to your bank account' }
      ],
      footIcon: 'hourglass_top',
      foot: 'Action needed: complete your eKYC to move forward.'
    },
    'SL-3110': {
      type: 'Business Loan', amount: '₹15,00,000',
      stage: 5,
      steps: [
        { t: 'Application submitted', d: 'Received on 02 Mar, 4:11 PM' },
        { t: 'Eligibility check', d: 'GST & bank-flow analysed — passed' },
        { t: 'Offers matched', d: '3 offers found · best rate 14.00% p.a.' },
        { t: 'eKYC & verification', d: 'Completed on 04 Mar' },
        { t: 'Loan approved', d: 'Approved by MetroCredit NBFC' },
        { t: 'Amount disbursed', d: '₹15,00,000 credited on 06 Mar' }
      ],
      footIcon: 'check_circle',
      foot: 'All done! Your loan has been fully disbursed.'
    }
  };

  const trackForm = $('#trackForm');
  const appId = $('#appId');
  const trackerEmpty = $('#trackerEmpty');
  const trackerBody = $('#trackerBody');
  const tkSteps = $('#tkSteps');

  const renderTracker = (id) => {
    const key = id.trim().toUpperCase();
    const app = demoApps[key];
    if (!app) {
      trackerEmpty.hidden = false;
      trackerBody.hidden = true;
      trackerEmpty.innerHTML =
        '<span class="msi tracker__empty-ic">search_off</span><p>No application found for <b>' +
        (key || '—') + '</b>.<br>Try demo IDs <b>SL-2048</b> or <b>SL-3110</b>.</p>';
      return;
    }
    trackerEmpty.hidden = true;
    trackerBody.hidden = false;
    $('#tkId').textContent = key;
    $('#tkType').textContent = app.type;
    $('#tkAmount').textContent = app.amount;
    tkSteps.innerHTML = '';
    app.steps.forEach((s, i) => {
      const done = i < app.stage;
      const active = i === app.stage;
      const li = document.createElement('li');
      li.className = done ? 'done' : (active ? 'active' : '');
      li.innerHTML =
        '<span class="step__dot">' + (done ? '<span class="msi">check</span>' : (i + 1)) + '</span>' +
        '<div class="step__body"><b>' + s.t + '</b><span>' + s.d + '</span></div>';
      tkSteps.appendChild(li);
      requestAnimationFrame(() => {
        li.style.opacity = 0; li.style.transform = 'translateY(8px)';
        li.style.transition = 'opacity .4s, transform .4s';
        setTimeout(() => { li.style.opacity = 1; li.style.transform = 'none'; }, 80 * i);
      });
    });
    $('#tkFoot').innerHTML = '<span class="msi">' + app.footIcon + '</span>' + app.foot;
  };

  if (trackForm) {
    trackForm.addEventListener('submit', (e) => { e.preventDefault(); renderTracker(appId.value); });
    $$('.linkbtn[data-demo]').forEach(b =>
      b.addEventListener('click', () => { appId.value = b.dataset.demo; renderTracker(b.dataset.demo); })
    );
  }

  /* ---------- LEAD FORM validation ---------- */
  const leadForm = $('#leadForm');
  const formSuccess = $('#formSuccess');

  const validators = {
    loanType:   v => v ? '' : 'Please select a loan type.',
    loanAmount: v => (!v ? 'Enter an amount.' : (+v < 50000 ? 'Minimum amount is ₹50,000.' : '')),
    fullName:   v => (v.trim().length < 3 ? 'Enter your full name.' : ''),
    phone:      v => (/^[6-9]\d{9}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit mobile number.'),
    email:      v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  };

  const setErr = (name, msg) => {
    const field = $('#' + name);
    const errEl = $('.err[data-for="' + name + '"]');
    if (field) field.classList.toggle('invalid', !!msg);
    if (errEl) errEl.textContent = msg;
    return !msg;
  };

  if (leadForm) {
    // inline validation on blur
    Object.keys(validators).forEach(name => {
      const f = $('#' + name);
      if (f) f.addEventListener('blur', () => setErr(name, validators[name](f.value)));
      if (f) f.addEventListener('input', () => { if (f.classList.contains('invalid')) setErr(name, validators[name](f.value)); });
    });

    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      Object.keys(validators).forEach(name => {
        const valid = setErr(name, validators[name]($('#' + name).value));
        ok = ok && valid;
      });
      const consent = $('#consent');
      const consentOk = consent.checked;
      $('.err[data-for="consent"]').textContent = consentOk ? '' : 'Please provide your consent to continue.';
      ok = ok && consentOk;

      if (!ok) {
        const firstInvalid = leadForm.querySelector('.invalid') ||
          (!consentOk ? consent : null);
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // simulate submission
      const btn = $('#leadSubmit');
      btn.textContent = 'Matching you with lenders…';
      btn.disabled = true;
      setTimeout(() => {
        const id = 'SL-' + Math.floor(1000 + Math.random() * 9000);
        $('#genId').textContent = id;
        leadForm.querySelectorAll('.field,.field-row,.consent,.err,#leadSubmit,.apply__disclaimer,.apply__form-head')
          .forEach(el => el.style.display = 'none');
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1100);
    });
  }

  /* ---------- FAQ: single-open accordion ---------- */
  const faqItems = $$('#faqList .faq__item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) faqItems.forEach(o => { if (o !== item) o.open = false; });
    });
  });

  /* ---------- active nav link on scroll ---------- */
  const sections = $$('main section[id]');
  const navAnchors = $$('.nav__links a[href^="#"]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navAnchors.forEach(a =>
          a.style.color = a.getAttribute('href') === '#' + id ? 'var(--primary)' : '');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

})();
