/* ===== BACKGROUND PATHS ===== */
(function () {
  var ns   = 'http://www.w3.org/2000/svg';
  var wrap = document.createElement('div');
  wrap.className = 'fl-wrap';
  wrap.setAttribute('aria-hidden', 'true');

  var svg = document.createElementNS(ns, 'svg');
  /* ViewBox centred on the path bundle (x≈152 is bundle centre, shifted up) */
  svg.setAttribute('viewBox', '-346 -160 996 500');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.classList.add('bg-paths-svg');

  /* 18 per side = 36 total — visible but not overloaded */
  var COUNT = 18;

  [1, -1].forEach(function (pos) {
    for (var i = 0; i < COUNT; i++) {
      var ax = -(380 - i * 5 * pos),  ay = -(189 + i * 6);
      var bx = -(312 - i * 5 * pos),  by =  216 - i * 6;
      var cx =  152 - i * 5 * pos,    cy =  343 - i * 6;
      var dx =  616 - i * 5 * pos,    dy =  470 - i * 6;
      var ex =  684 - i * 5 * pos,    ey =  875 - i * 6;

      var d = 'M' + ax + ' ' + ay +
              'C' + ax + ' ' + ay + ' ' + bx + ' ' + by + ' ' + cx + ' ' + cy +
              'C' + dx + ' ' + dy + ' ' + ex + ' ' + ey + ' ' + ex + ' ' + ey;

      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke-width', (0.4 + i * 0.03).toFixed(2));
      /* Subtle — visible but not glaring */
      path.setAttribute('stroke-opacity', Math.min(0.08 + i * 0.022, 0.45).toFixed(2));
      path.classList.add('bg-path');

      /* Long dash + small gap: looks continuous but breaks up slightly */
      var dur     = 28 + Math.random() * 18;
      var delay   = -(Math.random() * dur);
      var dashLen = (0.55 + Math.random() * 0.3).toFixed(3);
      var gapLen  = (0.05 + Math.random() * 0.1).toFixed(3);
      path.style.strokeDasharray   = dashLen + ' ' + gapLen;
      path.style.animationDuration = dur.toFixed(1) + 's';
      path.style.animationDelay    = delay.toFixed(1) + 's';

      svg.appendChild(path);
    }
  });

  wrap.appendChild(svg);
  document.body.insertBefore(wrap, document.body.firstChild);
}());

/* ===== FAQ ACCORDION ===== */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    /* Close all */
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    /* Open clicked if it was closed */
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

/* ===== DROPDOWN MENU ===== */
const dropdownBtn = document.getElementById('navDropdownBtn');
const dropdownMenu = document.getElementById('navDropdown');

dropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('open');
  dropdownBtn.classList.toggle('open');
});

dropdownMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    dropdownMenu.classList.remove('open');
    dropdownBtn.classList.remove('open');
  });
});

document.addEventListener('click', (e) => {
  if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target) && !hamburger.contains(e.target)) {
    dropdownMenu.classList.remove('open');
    dropdownBtn.classList.remove('open');
  }
});

/* ===== HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');

hamburger.addEventListener('click', () => {
  dropdownMenu.classList.toggle('open');
  dropdownBtn.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = dropdownMenu.classList.contains('open');
  spans[0].style.transform = isOpen ? 'translateY(7px) rotate(45deg)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '';
  spans[2].style.transform = isOpen ? 'translateY(-7px) rotate(-45deg)' : '';
});

dropdownMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    dropdownMenu.classList.remove('open');
    dropdownBtn.classList.remove('open');
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ===== TESTIMONIAL SLIDER (guarded) ===== */
const track = document.getElementById('testimonialTrack');
const dots   = document.querySelectorAll('.dot');

if (track && dots.length) {
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = +dot.dataset.index;
      const cardWidth = track.children[0].offsetWidth + 32;
      track.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });

  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / (track.children[0].offsetWidth + 32));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  });
}

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - navbar.offsetHeight - 16, behavior: 'smooth' });
  });
});

/* ===== TOAST ===== */
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ===== MODAL SYSTEM ===== */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal.is-open').forEach(m => {
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});

/* Close on backdrop/close button clicks */
document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeAllModals);
});

/* ===== BOOKING DATA ===== */
const SERVICES = [
  { name: 'Haircut',          price: 45, duration: 45 },
  { name: 'Kids Haircut',     price: 20, duration: 30 },
  { name: 'Beard Trim',       price: 25, duration: 20 },
  { name: 'The Package',      price: 70, duration: 75 },
];

const BARBERS = [
  { name: 'Marcus Reid',  role: 'Head Barber — Fade Specialist' },
  { name: 'Diego Santos', role: 'Master Barber — Beardsmith' },
  { name: 'Jordan Cole',  role: 'Barber — Classic Cuts & Lineups' },
];

/* Shop hours: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat */
const HOURS = {
  0: { open: 9, close: 17 },  /* Sun */
  1: null,                      /* Mon – closed */
  2: { open: 9, close: 19 },  /* Tue */
  3: { open: 9, close: 19 },  /* Wed */
  4: { open: 9, close: 19 },  /* Thu */
  5: { open: 9, close: 19 },  /* Fri */
  6: { open: 9, close: 17 },  /* Sat */
};

/* ===== BOOKING WIZARD STATE ===== */
const bk = {
  step: 1,
  service: null,
  barber: null,
  date: null,
  time: null,
  calYear: null,
  calMonth: null,
  prefillService: null,
  prefillBarber: null,
};

/* ===== BUILD BOOKING MODAL ===== */
function buildServices() {
  const container = document.getElementById('bmServices');
  container.innerHTML = '';
  SERVICES.forEach(svc => {
    const btn = document.createElement('button');
    btn.className = 'bm-option';
    if (bk.service && bk.service.name === svc.name) btn.classList.add('selected');
    btn.innerHTML = `
      <span class="bm-option-name">${svc.name}</span>
      <span class="bm-option-meta">${svc.duration} min</span>
      <span class="bm-option-price">$${svc.price}</span>
    `;
    btn.addEventListener('click', () => {
      bk.service = svc;
      container.querySelectorAll('.bm-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    container.appendChild(btn);
  });
}

function buildBarbers() {
  const container = document.getElementById('bmBarbers');
  container.innerHTML = '';

  /* No preference option */
  const noPrefs = document.createElement('button');
  noPrefs.className = 'bm-barber-opt bm-no-pref';
  if (bk.barber === 'No Preference') noPrefs.classList.add('selected');
  noPrefs.innerHTML = `
    <div class="bm-barber-avatar">Any</div>
    <div><div class="bm-barber-name">No Preference</div><div class="bm-barber-role">First available barber</div></div>
  `;
  noPrefs.addEventListener('click', () => {
    bk.barber = 'No Preference';
    container.querySelectorAll('.bm-barber-opt').forEach(b => b.classList.remove('selected'));
    noPrefs.classList.add('selected');
  });
  container.appendChild(noPrefs);

  BARBERS.forEach(barber => {
    const initials = barber.name.split(' ').map(n => n[0]).join('');
    const btn = document.createElement('button');
    btn.className = 'bm-barber-opt';
    if (bk.barber === barber.name) btn.classList.add('selected');
    btn.innerHTML = `
      <div class="bm-barber-avatar">${initials}</div>
      <div><div class="bm-barber-name">${barber.name}</div><div class="bm-barber-role">${barber.role}</div></div>
    `;
    btn.addEventListener('click', () => {
      bk.barber = barber.name;
      container.querySelectorAll('.bm-barber-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    container.appendChild(btn);
  });
}

function buildCalendar() {
  const today = new Date();
  if (!bk.calYear)  bk.calYear  = today.getFullYear();
  if (!bk.calMonth) bk.calMonth = today.getMonth();

  const grid     = document.getElementById('bmCalGrid');
  const monthEl  = document.getElementById('bmCalMonth');
  const year     = bk.calYear;
  const month    = bk.calMonth;

  const first    = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();

  monthEl.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';

  /* Blank cells for offset */
  for (let i = 0; i < first; i++) {
    const empty = document.createElement('button');
    empty.className = 'bm-cal-day empty';
    empty.disabled = true;
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInM; d++) {
    const date   = new Date(year, month, d);
    const dow    = date.getDay();
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isClosed = !HOURS[dow];

    const btn = document.createElement('button');
    btn.className = 'bm-cal-day';
    btn.textContent = d;

    if (isPast || isClosed) {
      btn.disabled = true;
    } else {
      if (date.toDateString() === today.toDateString()) btn.classList.add('today');
      if (bk.date && date.toDateString() === bk.date.toDateString()) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        bk.date = date;
        grid.querySelectorAll('.bm-cal-day').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    }
    grid.appendChild(btn);
  }

  document.getElementById('bmCalPrev').onclick = () => {
    bk.calMonth--;
    if (bk.calMonth < 0) { bk.calMonth = 11; bk.calYear--; }
    buildCalendar();
  };
  document.getElementById('bmCalNext').onclick = () => {
    bk.calMonth++;
    if (bk.calMonth > 11) { bk.calMonth = 0; bk.calYear++; }
    buildCalendar();
  };
}

function buildTimes() {
  const container = document.getElementById('bmTimes');
  container.innerHTML = '';

  if (!bk.date) {
    container.innerHTML = '<p style="color:#888;font-size:.88rem;">Please select a date first.</p>';
    return;
  }

  const dow    = bk.date.getDay();
  const hours  = HOURS[dow];
  if (!hours) {
    container.innerHTML = '<p style="color:#888;font-size:.88rem;">Closed this day.</p>';
    return;
  }

  const duration = bk.service ? bk.service.duration : 30;
  const slots = [];
  for (let h = hours.open; h < hours.close; h++) {
    slots.push(`${h}:00`);
    if (h + 0.5 + duration / 60 <= hours.close) slots.push(`${h}:30`);
  }

  slots.forEach(slot => {
    const [h, m] = slot.split(':').map(Number);
    const label  = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const btn    = document.createElement('button');
    btn.className = 'bm-time';
    btn.textContent = label;
    if (bk.time === slot) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      bk.time = slot;
      container.querySelectorAll('.bm-time').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    container.appendChild(btn);
  });
}

function buildSummary() {
  const fmt = dt => dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const [h, m] = bk.time ? bk.time.split(':').map(Number) : [0, 0];
  const timeLabel = bk.time
    ? new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '—';

  document.getElementById('sumService').textContent = bk.service ? `${bk.service.name} — $${bk.service.price}` : '—';
  document.getElementById('sumBarber').textContent  = bk.barber  || '—';
  document.getElementById('sumDate').textContent    = bk.date    ? fmt(bk.date) : '—';
  document.getElementById('sumTime').textContent    = timeLabel;
  document.getElementById('sumPrice').textContent   = bk.service ? `$${bk.service.price}` : '$0';
}

/* Step indicator */
function updateSteps() {
  document.querySelectorAll('.bm-step').forEach(el => {
    const s = +el.dataset.step;
    el.classList.remove('active', 'done');
    if (s === bk.step) el.classList.add('active');
    else if (s < bk.step) el.classList.add('done');
  });
  const fill = document.getElementById('bmProgress');
  if (fill) fill.style.width = `${(bk.step / 5) * 100}%`;

  const footer = document.getElementById('bmFooter');
  const backBtn = document.getElementById('bmBack');
  const nextBtn = document.getElementById('bmNext');

  if (bk.step === 6) {
    footer.classList.add('hidden');
    return;
  }
  footer.classList.remove('hidden');
  backBtn.style.display = bk.step === 1 ? 'none' : '';
  nextBtn.textContent = bk.step === 5 ? 'Confirm Booking' : 'Next';
}

function showPane(step) {
  document.querySelectorAll('.bm-pane').forEach(p => p.classList.remove('active'));
  const pane = document.querySelector(`[data-pane="${step}"]`);
  if (pane) pane.classList.add('active');
}

function setFieldError(field, msg) {
  const group = field.closest('.form-group');
  if (group) {
    group.classList.add('error');
    let err = group.querySelector('.form-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'form-error';
      group.appendChild(err);
    }
    err.textContent = msg;
  }
}

function clearFieldError(field) {
  const group = field.closest('.form-group');
  if (group) {
    group.classList.remove('error');
    const err = group.querySelector('.form-error');
    if (err) err.remove();
  }
}

function validateStep() {
  switch (bk.step) {
    case 1: if (!bk.service) { showToast('Please select a service'); return false; } break;
    case 2: if (!bk.barber)  { showToast('Please select a barber'); return false; }  break;
    case 3: if (!bk.date)    { showToast('Please pick a date'); return false; }       break;
    case 4: if (!bk.time)    { showToast('Please pick a time'); return false; }       break;
    case 5: {
      const name  = document.getElementById('bmName');
      const email = document.getElementById('bmEmail');
      const phone = document.getElementById('bmPhone');
      let ok = true;

      [name, email, phone].forEach(f => {
        if (!f.value.trim()) {
          const label = f === name ? 'Name' : f === email ? 'Email' : 'Phone';
          setFieldError(f, `${label} is required`);
          ok = false;
        } else {
          clearFieldError(f);
        }
      });

      if (!ok) { showToast('Please fill in all required fields'); return false; }

      if (!email.value.includes('@') || !email.value.includes('.')) {
        setFieldError(email, 'Please enter a valid email');
        showToast('Please enter a valid email');
        return false;
      }

      if (phone.value.replace(/\D/g, '').length < 10) {
        setFieldError(phone, 'Please enter a valid phone number');
        showToast('Please enter a valid phone number');
        return false;
      }

      break;
    }
  }
  return true;
}

function goToStep(step) {
  bk.step = step;
  showPane(step);
  updateSteps();
  if (step === 2) buildBarbers();
  if (step === 3) buildCalendar();
  if (step === 4) buildTimes();
  if (step === 5) buildSummary();
  if (step === 6) buildConfirmation();
  /* Scroll modal body to top */
  const card = document.querySelector('.booking-modal-card');
  if (card) card.scrollTop = 0;
}

function buildConfirmation() {
  const fmt = dt => dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const [h, m] = bk.time ? bk.time.split(':').map(Number) : [0, 0];
  const timeLabel = bk.time
    ? new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  document.getElementById('bmConfirmSummary').innerHTML = `
    ${bk.service ? bk.service.name : ''} with ${bk.barber}<br>
    ${bk.date ? fmt(bk.date) : ''} at ${timeLabel}
  `;

  const name = document.getElementById('bmName').value;
  document.getElementById('bmConfirmText').textContent = `Thanks, ${name.split(' ')[0]}! We'll text you a confirmation shortly.`;
}

function resetBooking() {
  bk.step = 1;
  bk.service = null;
  bk.barber = null;
  bk.date = null;
  bk.time = null;
  bk.calYear = null;
  bk.calMonth = null;
  document.getElementById('bmName').value  = '';
  document.getElementById('bmEmail').value = '';
  document.getElementById('bmPhone').value = '';
  document.getElementById('bmNotes').value = '';
  buildServices();
  goToStep(1);
}

/* ===== LOCALSTORAGE BOOKING SYSTEM ===== */
function getBookings() {
  try { return JSON.parse(localStorage.getItem('fb_bookings') || '[]'); }
  catch { return []; }
}

function saveBooking(booking) {
  const bookings = getBookings();
  booking.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  booking.createdAt = new Date().toISOString();
  booking.status = 'confirmed';
  bookings.push(booking);
  localStorage.setItem('fb_bookings', JSON.stringify(bookings));
  return booking;
}

function deleteBooking(id) {
  const bookings = getBookings().filter(b => b.id !== id);
  localStorage.setItem('fb_bookings', JSON.stringify(bookings));
}

function getAdminPassword() {
  return localStorage.getItem('fb_admin_pw') || 'barbershop123';
}

function setAdminPassword(pw) {
  localStorage.setItem('fb_admin_pw', pw);
}

/* ===== BACKEND CONFIG (optional) ===== */
const BACKEND = 'http://localhost:3000';

fetch(BACKEND + '/api/config')
  .then(r => r.json())
  .then(cfg => {
    if (!cfg.phone) return;
    window._shopPhone = cfg.phone;
    const display = cfg.phone.replace(/(\+\d{1,3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    const stage = document.getElementById('voiceStatus');
    if (stage) {
      const callLink = document.createElement('a');
      callLink.href  = 'tel:' + cfg.phone;
      callLink.className = 'shop-call-link';
      callLink.innerHTML = display;
      callLink.style.cssText = 'display:block;margin-top:.5rem;color:var(--red);font-weight:700;font-size:1.1rem;letter-spacing:.05em;text-decoration:none;';
      stage.parentNode.insertBefore(callLink, stage.nextSibling);
    }
  })
  .catch(() => {});

/* Wire up Next / Back */
document.getElementById('bmNext').addEventListener('click', async () => {
  if (!validateStep()) return;
  if (bk.step < 5) { goToStep(bk.step + 1); return; }

  /* Step 5 → submit booking to backend */
  const btn = document.getElementById('bmNext');
  btn.textContent = 'Booking…';
  btn.disabled = true;

  const payload = {
    name:    document.getElementById('bmName').value.trim(),
    email:   document.getElementById('bmEmail').value.trim(),
    phone:   document.getElementById('bmPhone').value.trim(),
    notes:   document.getElementById('bmNotes').value.trim(),
    service: bk.service ? bk.service.name : '',
    price:   bk.service ? bk.service.price : 0,
    barber:  bk.barber  || 'No Preference',
    date:    bk.date    ? bk.date.toISOString().split('T')[0] : '',
    time:    bk.time    || ''
  };

  saveBooking(payload);
  showToast('Booking confirmed!');

  try {
    const res = await fetch(BACKEND + '/api/book', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Server error');
  } catch (err) {
    console.warn('Backend unavailable — booking saved locally:', err.message);
  }

  btn.disabled = false;
  goToStep(6);
});

document.getElementById('bmBack').addEventListener('click', () => {
  if (bk.step > 1) goToStep(bk.step - 1);
});

/* ===== OPEN BOOKING MODAL ===== */
function openBookingModal(prefillService, prefillBarber) {
  buildServices();
  if (prefillService) {
    const svc = SERVICES.find(s => s.name === prefillService);
    if (svc) {
      bk.service = svc;
      buildServices();
      if (prefillBarber) {
        bk.barber = prefillBarber;
        goToStep(2);
      } else {
        goToStep(2);
      }
    }
  } else if (prefillBarber) {
    bk.barber = prefillBarber;
    goToStep(1);
  } else {
    resetBooking();
  }
  openModal('bookingModal');
}

/* Bind all data-open-booking buttons */
document.querySelectorAll('[data-open-booking]').forEach(el => {
  el.addEventListener('click', () => {
    const svc    = el.dataset.prefillService || null;
    const barber = el.dataset.prefillBarber  || null;
    openBookingModal(svc, barber);
  });
});

/* Bind all data-open-voice buttons */
document.querySelectorAll('[data-open-voice]').forEach(el => {
  el.addEventListener('click', () => openModal('voiceModal'));
});

/* Re-bind close buttons inside modals (including the done button in confirmation) */
document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeAllModals);
});

/* ===== FORM VALIDATION ===== */
['bmName', 'bmEmail', 'bmPhone'].forEach(id => {
  const field = document.getElementById(id);
  if (field) {
    field.addEventListener('input', () => {
      if (field.value.trim()) {
        clearFieldError(field);
      }
    });
    field.addEventListener('blur', () => {
      if (field.id === 'bmEmail' && field.value.trim()) {
        if (!field.value.includes('@') || !field.value.includes('.')) {
          setFieldError(field, 'Please enter a valid email');
        }
      }
      if (field.id === 'bmPhone' && field.value.trim()) {
        if (field.value.replace(/\D/g, '').length < 10) {
          setFieldError(field, 'Please enter a valid phone number');
        }
      }
    });
  }
});

/* ===== AI VOICE — OpenAI powered ===== */

/*
 * CONFIGURATION: Paste your OpenAI API key below.
 * Get one at https://platform.openai.com/api-keys
 * For production, proxy this through your backend instead of exposing the key.
 */
const OPENAI_KEY = '';

const BARBERSHOP_SYSTEM_PROMPT = `You are the friendly AI receptionist for Fringe Benefits Barbershop.
Keep every response SHORT — 1 to 3 sentences max. Be warm, confident, and to the point.

SHOP INFO:
- Location: 83 Main Street, New Zealand
- Phone: (555) 123-4567
- Hours: Tue–Fri 9am–7pm · Sat–Sun 9am–5pm · Closed Mondays

SERVICES & PRICES:
- Haircut: $45 (45 min)
- Kids Haircut (12 & under): $20 (30 min)
- Beard Trim: $25 (20 min)
- The Package (haircut + beard + hot towel + lineup): $70 (75 min)

BARBERS:
- Marcus Reid — Head Barber, Fade Specialist (8 years)
- Diego Santos — Master Barber, Beardsmith (beard & shave expert)
- Jordan Cole — Barber, Classic Cuts & Lineups

BOOKING: To book, collect service, barber preference, date/time, then name & phone.
When all details are given, say "You're locked in!" and confirm back the details.`;

let conversationHistory = [];
let voiceActive        = false;
let voiceIsSpeaking    = false;
let speechRecognition  = null;
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceOrb        = document.getElementById('voiceOrb');
const voiceStatus     = document.getElementById('voiceStatus');
const voiceTranscript = document.getElementById('voiceTranscript');
const voiceStart      = document.getElementById('voiceStart');
const voiceEnd        = document.getElementById('voiceEnd');

function appendTranscript(text, role) {
  const empty = voiceTranscript.querySelector('.vt-empty');
  if (empty) empty.remove();
  const msg = document.createElement('div');
  msg.className = `vt-msg ${role}`;
  msg.textContent = text;
  voiceTranscript.appendChild(msg);
  voiceTranscript.scrollTop = voiceTranscript.scrollHeight;
}

async function callOpenAI(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: BARBERSHOP_SYSTEM_PROMPT },
          ...conversationHistory
        ],
        max_tokens: 160,
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data  = await res.json();
    const reply = data.choices[0].message.content.trim();
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch (err) {
    return "Sorry, I'm having trouble connecting right now. Please call us on (555) 123-4567 or use the booking card.";
  }
}

function speakText(text) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    voiceOrb.classList.remove('listening');
    voiceOrb.classList.add('speaking');

    const utt    = new SpeechSynthesisUtterance(text);
    utt.rate     = 1.05;
    utt.pitch    = 1.0;
    utt.volume   = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const pick   = voices.find(v =>
      v.lang === 'en-US' &&
      (v.name.includes('Google') || v.name.includes('Samantha') ||
       v.name.includes('Alex')   || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (pick) utt.voice = pick;

    utt.onend  = () => { voiceOrb.classList.remove('speaking'); resolve(); };
    utt.onerror = () => { voiceOrb.classList.remove('speaking'); resolve(); };
    window.speechSynthesis.speak(utt);
  });
}

/* Fallback demo conversation when no API key is set */
const demoFlow = [
  "Hey! Welcome to Fringe Benefits. What can I get you in for today — haircut, fade, beard trim, or the full package?",
  "Great choice! Do you have a preferred barber — Marcus, Diego, or Jordan — or should I find whoever's available first?",
  "Perfect. What day and time are you thinking? We're open Tuesday through Friday 9 to 7, and weekends 9 to 5.",
  "Got it. And last thing — can I grab your name and phone number so we can send you a confirmation?",
  "You're locked in! We'll text you the details before your appointment. See you at the chair.",
];
let demoIdx = 0;

async function handleUserSpeech(transcript) {
  voiceStatus.textContent = 'Processing…';
  appendTranscript(transcript, 'user');

  let reply;
  if (OPENAI_KEY) {
    reply = await callOpenAI(transcript);
  } else {
    await new Promise(r => setTimeout(r, 600));
    reply = demoFlow[demoIdx % demoFlow.length];
    demoIdx++;
    if (demoIdx >= demoFlow.length) {
      setTimeout(() => {
        stopVoice();
        closeModal('voiceModal');
        showToast("Booking request received! We'll confirm shortly.");
      }, 4000);
    }
  }

  appendTranscript(reply, 'ai');
  voiceStatus.textContent = 'Speaking…';
  await speakText(reply);

  if (voiceActive) {
    listenOnce();
  }
}

function listenOnce() {
  if (!voiceActive) return;

  if (!SpeechRecognitionAPI) {
    voiceStatus.textContent = 'Voice input not supported in this browser.';
    return;
  }

  if (speechRecognition) { try { speechRecognition.stop(); } catch(e) {} }

  speechRecognition = new SpeechRecognitionAPI();
  speechRecognition.continuous    = false;
  speechRecognition.interimResults = false;
  speechRecognition.lang          = 'en-US';

  voiceOrb.classList.add('listening');
  voiceStatus.textContent = 'Listening…';

  speechRecognition.onresult = async (event) => {
    const text = event.results[0][0].transcript.trim();
    voiceOrb.classList.remove('listening');
    await handleUserSpeech(text);
  };

  speechRecognition.onerror = (e) => {
    voiceOrb.classList.remove('listening');
    if (e.error === 'no-speech') {
      if (voiceActive) listenOnce();
    } else {
      voiceStatus.textContent = 'Mic error. Check browser permissions.';
      appendTranscript('⚠ Mic unavailable — use the booking card instead.', 'ai');
      document.getElementById('voiceFallback').hidden = false;
    }
  };

  speechRecognition.onend = () => {
    if (voiceActive && !voiceIsSpeaking) listenOnce();
  };

  try { speechRecognition.start(); } catch(e) {}
}

async function startVoice() {
  voiceActive   = true;
  demoIdx       = 0;
  conversationHistory = [];
  voiceStart.disabled = true;
  voiceEnd.disabled   = false;
  voiceTranscript.innerHTML = '';

  const greeting = OPENAI_KEY
    ? "Hey! Thanks for calling Fringe Benefits. How can I help you today?"
    : demoFlow[0];

  if (OPENAI_KEY) {
    demoIdx = 0;
  } else {
    demoIdx = 1;
  }

  appendTranscript(greeting, 'ai');
  voiceStatus.textContent = 'Speaking…';
  await speakText(greeting);
  if (OPENAI_KEY) conversationHistory.push({ role: 'assistant', content: greeting });

  if (voiceActive) {
    if (SpeechRecognitionAPI) {
      listenOnce();
    } else {
      voiceStatus.textContent = 'Voice not supported — demo mode running.';
      setTimeout(async () => {
        if (!voiceActive) return;
        await handleUserSpeech("I'd like to book a skin fade with Marcus on Saturday.");
      }, 1500);
    }
  }
}

function stopVoice() {
  voiceActive         = false;
  voiceIsSpeaking     = false;
  if (speechRecognition) { try { speechRecognition.stop(); } catch(e) {} speechRecognition = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  voiceOrb.classList.remove('listening', 'speaking');
  voiceStart.disabled = false;
  voiceEnd.disabled   = true;
  voiceStatus.textContent = 'Call ended';
}

voiceStart.addEventListener('click', startVoice);
voiceEnd.addEventListener('click',   stopVoice);

/* Sync disabled state on new buttons */
const _origStart = startVoice;
const _origStop  = stopVoice;

document.getElementById('voiceModal').addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close-modal') || e.target.classList.contains('modal-backdrop')) {
    stopVoice();
    voiceTranscript.innerHTML = '<div class="vt-empty">Your conversation will appear here.</div>';
    voiceStatus.textContent   = 'Tap the mic to start';
  }
});

/* ===== SCROLL-TRIGGERED ANIMATIONS ===== */
function animateCounter(el) {
  const target   = parseInt(el.dataset.counter, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 2000;
  const start    = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = Math.round(eased * target);

    if (target >= 1000) {
      el.textContent = (value / 1000).toFixed(value < 1000 ? 1 : 0) + 'K' + suffix;
    } else {
      el.textContent = value + suffix;
    }
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const delay = parseFloat(el.dataset.delay || 0) * 1000;

    setTimeout(() => {
      el.classList.add('is-visible');
      el.querySelectorAll('[data-counter]').forEach(animateCounter);
      if (el.dataset.counter) animateCounter(el);
    }, delay);

    scrollObserver.unobserve(el);
  });
}, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-animate]').forEach(el => scrollObserver.observe(el));

/* Safety fallback — if observer never fires (e.g. hidden iframe, layout quirk),
   make everything visible after 2.5 seconds so nothing stays invisible */
setTimeout(() => {
  document.querySelectorAll('[data-animate]:not(.is-visible)').forEach(el => {
    el.classList.add('is-visible');
  });
}, 2500);

/* ===== INIT ===== */
buildServices();
updateSteps();
showPane(1);
