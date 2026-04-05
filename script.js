/* ============================================================
   EcoRoads – script.js
   All interactivity: counters, payments, admin panel, modals
   ============================================================ */

'use strict';

/* ── Utilities ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

/* ── State ─────────────────────────────────────────────────── */
let selectedCause   = 'All Causes';
let selectedAmount  = 251;
let selectedMethod  = 'upi';
let totalRaised     = 3847250;   // ₹38,47,250
const GOAL          = 10000000;  // ₹1 Crore
let isAdminLoggedIn = false;

/* ─────────────────────────────────────────────────────────────
   1. NAVBAR – scroll effect + hamburger
   ───────────────────────────────────────────────────────────── */
const navbar    = $('navbar');
const hamburger = $('hamburger');
const navLinks  = $('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
});

// Close mobile menu on link click
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
  });
});

/* ─────────────────────────────────────────────────────────────
   2. ANIMATED COUNTERS (hero stats)
   ───────────────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.floor(ease * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      $$('[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
      counterObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) counterObserver.observe(heroStats);

/* ─────────────────────────────────────────────────────────────
   3. PROGRESS BAR ANIMATION
   ───────────────────────────────────────────────────────────── */
function updateProgressBar() {
  const pct = Math.min((totalRaised / GOAL) * 100, 100);
  const fill = $('progressFill');
  const display = $('totalRaisedDisplay');
  if (fill) {
    setTimeout(() => { fill.style.width = pct.toFixed(2) + '%'; }, 300);
  }
  if (display) display.textContent = fmt(totalRaised);

  // Milestone dots
  const milestones = [
    { node: document.querySelectorAll('.milestone-dot')[0], thresh: 0.25 },
    { node: document.querySelectorAll('.milestone-dot')[1], thresh: 0.50 },
    { node: document.querySelectorAll('.milestone-dot')[2], thresh: 0.75 },
  ];
  const ratio = totalRaised / GOAL;
  milestones.forEach(m => {
    if (m.node) m.node.classList.toggle('active', ratio >= m.thresh);
  });
}

const progressObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    updateProgressBar();
    progressObserver.disconnect();
  }
}, { threshold: 0.2 });

const pSection = document.querySelector('.progress-section');
if (pSection) progressObserver.observe(pSection);

/* ─────────────────────────────────────────────────────────────
   4. CAUSE SELECTOR (donate form)
   ───────────────────────────────────────────────────────────── */
const causeIconMap = {
  'All Causes'       : 'fas fa-globe-asia',
  'Pothole Repair'   : 'fas fa-road',
  'Garbage Management': 'fas fa-trash-alt',
  'Tree Planting'    : 'fas fa-seedling',
  'Tree Maintenance' : 'fas fa-tree',
};

function getImpactText(cause, amount) {
  if (amount < 100) {
    if (cause === 'Pothole Repair') return 'Contributes to repairing damaged road surfaces';
    if (cause === 'Garbage Management') return 'Helps fund roadside waste collection and disposal';
    if (cause === 'Tree Planting') return 'Contributes to planting native saplings on road dividers';
    if (cause === 'Tree Maintenance') return 'Supports care, watering, and maintenance for planted saplings';
    return 'Supports our ongoing green infrastructure and road safety initiatives';
  }

  if (cause === 'Pothole Repair') {
    const sqm = +(Math.max(0.2, amount / 125).toFixed(1));
    return `Helps repair ~${sqm} sq.m of damaged road surface`;
  } else if (cause === 'Garbage Management') {
    const kg = Math.ceil(amount / 5);
    return `Funds collection & disposal of ~${kg} kg of roadside waste`;
  } else if (cause === 'Tree Planting') {
    const trees = Math.max(1, Math.floor(amount / 250));
    return `Plants ${trees} native sapling${trees > 1 ? 's' : ''} on a road divider`;
  } else if (cause === 'Tree Maintenance') {
    const trees = Math.max(1, Math.floor(amount / 125));
    return `Covers 3-month care for ${trees} planted sapling${trees > 1 ? 's' : ''}`;
  } else {
    // All Causes
    const sqm = +(Math.max(0.1, amount / 251).toFixed(1));
    const bins = Math.max(1, Math.floor(amount / 125));
    return `Helps repair ~${sqm} sq.m of road + funds ${bins} waste-bin installation${bins > 1 ? 's' : ''}`;
  }
}

function updateSummary() {
  const sc = $('summCause');
  const sa = $('summAmount');
  const sp = $('summPayment');
  const ii = $('impactItem');

  if (sc) sc.textContent = selectedCause;
  if (sa) sa.textContent = fmt(selectedAmount);
  if (sp) sp.textContent = { upi: 'UPI', card: 'Debit / Credit Card', netbanking: 'Net Banking' }[selectedMethod];

  if (ii) {
    const icon = causeIconMap[selectedCause] || 'fas fa-globe-asia';
    const text = getImpactText(selectedCause, selectedAmount);
    ii.innerHTML = `<i class="${icon}"></i><span id="impactText">${text}</span>`;
  }
}

$$('.cause-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    $$('.cause-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedCause = opt.querySelector('input').value;
    updateSummary();
  });
});

// Sync cause cards → donate section
$$('.btn-cause').forEach(btn => {
  btn.addEventListener('click', () => {
    const cause = btn.dataset.cause;
    $$('.cause-opt').forEach(opt => {
      const match = opt.querySelector('input').value === cause;
      opt.classList.toggle('selected', match);
      if (match) opt.querySelector('input').checked = true;
    });
    selectedCause = cause;
    updateSummary();
  });
});

/* ─────────────────────────────────────────────────────────────
   5. AMOUNT BUTTONS
   ───────────────────────────────────────────────────────────── */
$$('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.amount-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAmount = parseInt(btn.dataset.amount);
    $('customAmount').value = '';
    updateSummary();
  });
});

$('customAmount').addEventListener('input', e => {
  const val = parseInt(e.target.value);
  if (val > 0) {
    $$('.amount-btn').forEach(b => b.classList.remove('selected'));
    selectedAmount = val;
    updateSummary();
  }
});

/* ─────────────────────────────────────────────────────────────
   6. PAYMENT TABS
   ───────────────────────────────────────────────────────────── */
$$('.pay-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const method = tab.dataset.method;
    $$('.pay-tab').forEach(t => t.classList.remove('active'));
    $$('.payment-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = $('panel-' + method);
    if (panel) panel.classList.add('active');
    selectedMethod = method;
    updateSummary();
  });
});

/* ─────────────────────────────────────────────────────────────
   7. CARD PREVIEW (live update)
   ───────────────────────────────────────────────────────────── */
function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function detectCardScheme(num) {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n))  return 'fab fa-cc-visa';
  if (/^5[1-5]/.test(n)) return 'fab fa-cc-mastercard';
  if (/^3[47]/.test(n)) return 'fab fa-cc-amex';
  if (/^6/.test(n)) return 'fab fa-cc-discover';
  return '';
}

$('cardNumber') && $('cardNumber').addEventListener('input', e => {
  e.target.value = formatCardNumber(e.target.value);
  $('cardNumDisplay').textContent = e.target.value.padEnd(19, '•').slice(0, 19).replace(/[^ •]/g, (c, i) => i < e.target.value.length ? c : '•') || '•••• •••• •••• ••••';
  const scheme = detectCardScheme(e.target.value);
  const schemeEl = $('cardScheme');
  if (schemeEl) schemeEl.className = scheme || '';
});

$('cardName') && $('cardName').addEventListener('input', e => {
  $('cardNameDisplay').textContent = e.target.value.toUpperCase() || 'YOUR NAME';
});

$('cardExpiry') && $('cardExpiry').addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
  e.target.value = val;
  $('cardExpDisplay').textContent = val || 'MM/YY';
});

/* ─────────────────────────────────────────────────────────────
   8. UPI APP BUTTONS
   ───────────────────────────────────────────────────────────── */
['gpay-btn', 'phonepe-btn', 'paytm-btn'].forEach(id => {
  const btn = $(id);
  if (btn) {
    btn.addEventListener('click', () => {
      $$('.upi-app-btn').forEach(b => b.style.border = '');
      btn.style.border = '2px solid #22c55e';
      btn.style.background = 'rgba(34,197,94,0.12)';
      // Clear other buttons
      $$('.upi-app-btn').forEach(b => {
        if (b !== btn) b.style.background = '';
      });
    });
  }
});

/* Toggle optional email text */
const receiptCheckbox = $('receiptEmail');
const emailOptText = $('emailOptionalText');
if (receiptCheckbox && emailOptText) {
  receiptCheckbox.addEventListener('change', () => {
    emailOptText.style.display = receiptCheckbox.checked ? 'none' : 'inline';
  });
}

/* ─────────────────────────────────────────────────────────────
   9. DONATE FORM SUBMISSION
   ───────────────────────────────────────────────────────────── */
$('donateSubmitBtn').addEventListener('click', () => {
  const name  = $('donorName').value.trim();
  const email = $('donorEmail').value.trim();
  const phone = $('donorPhone').value.trim();
  const wantsReceipt = $('receiptEmail') ? $('receiptEmail').checked : false;

  if (!name) { shake($('donorName')); showToast('Please enter your name', 'error'); return; }
  if (wantsReceipt && !email) { shake($('donorEmail')); showToast('Email is required for receipt', 'error'); return; }
  if (email && !email.includes('@')) { shake($('donorEmail')); showToast('Please enter a valid email', 'error'); return; }
  if (!selectedAmount || selectedAmount < 10) { showToast('Minimum donation is ₹10', 'error'); return; }

  if (selectedMethod === 'upi') {
    const upiId = $('upiId').value.trim();
    const anyAppSelected = Array.from($$('.upi-app-btn')).some(b => b.style.border.includes('green') || b.style.background.includes('34,197'));
    if (!upiId && !anyAppSelected) { showToast('Please enter your UPI ID or select a UPI app', 'error'); return; }
  }

  if (selectedMethod === 'card') {
    const num = $('cardNumber').value.replace(/\s/g, '');
    if (num.length < 16) { shake($('cardNumber')); showToast('Enter a valid 16-digit card number', 'error'); return; }
    if (!$('cardName').value.trim()) { shake($('cardName')); showToast('Enter cardholder name', 'error'); return; }
    if ($('cardExpiry').value.length < 5) { shake($('cardExpiry')); showToast('Enter a valid expiry date', 'error'); return; }
    if ($('cardCvv').value.length < 3) { shake($('cardCvv')); showToast('Enter a valid CVV', 'error'); return; }
  }

  if (selectedMethod === 'netbanking') {
    if (!$('bankSelect').value) { showToast('Please select your bank', 'error'); return; }
  }

  // Simulate processing
  const btn = $('donateSubmitBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing…';
  btn.disabled = true;
  btn.style.opacity = '0.7';

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-shield-alt"></i> Donate Securely';
    btn.disabled = false;
    btn.style.opacity = '1';

    // Update total raised
    totalRaised += selectedAmount;
    updateProgressBar();

    // Add donor to feed
    const isAnon = $('anonymous').checked;
    addDonorToFeed(isAnon ? 'Anonymous' : name, selectedCause, selectedAmount, true, true);

    // Show success modal
    showSuccessModal(isAnon ? 'Friend' : name.split(' ')[0]);

    // Reset form (optional)
    $('donorName').value = '';
    $('donorEmail').value = '';
    $('donorPhone').value = '';
    $('upiId').value = '';
    $$('.upi-app-btn').forEach(b => { b.style.border = ''; b.style.background = ''; });
  }, 2200);
});

/* ─────────────────────────────────────────────────────────────
   10. SUCCESS MODAL
   ───────────────────────────────────────────────────────────── */
function showSuccessModal(donorFirstName) {
  $('modalDonorName').textContent = donorFirstName;
  $('modalAmount').textContent    = fmt(selectedAmount);
  $('modalCause').textContent     = selectedCause;
  $('txnId').textContent          = 'ECO-2026-' + Math.floor(100000 + Math.random() * 900000);
  $('txnDate').textContent        = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  $('successModal').style.display = 'flex';
  document.body.style.overflow    = 'hidden';
}

$('closeModal').addEventListener('click', () => {
  $('successModal').style.display = 'none';
  document.body.style.overflow    = '';
});

$('successModal').addEventListener('click', e => {
  if (e.target === $('successModal')) {
    $('successModal').style.display = 'none';
    document.body.style.overflow    = '';
  }
});

/* ─────────────────────────────────────────────────────────────
   11. RECENT DONOR FEED
   ───────────────────────────────────────────────────────────── */
const seedDonors = [
  { name: 'Rahul S.',      cause: 'Pothole Repair',    amount: 501  },
  { name: 'Meena P.',      cause: 'Tree Planting',     amount: 1001 },
  { name: 'Anonymous',     cause: 'All Causes',        amount: 251  },
  { name: 'Karan V.',      cause: 'Garbage Management',amount: 151  },
  { name: 'Sunita R.',     cause: 'Tree Maintenance',  amount: 501  },
];

function getInitials(name) {
  if (name === 'Anonymous') return '🌿';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = [
  'linear-gradient(135deg,#166534,#15803d)',
  'linear-gradient(135deg,#0e7490,#0284c7)',
  'linear-gradient(135deg,#92400e,#d97706)',
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
];

function addDonorToFeed(name, cause, amount, prepend = true, highlight = false) {
  const feed = $('donorFeed');
  if (!feed) return;

  const idx   = Math.floor(Math.random() * avatarColors.length);
  const color = avatarColors[idx];
  const el    = document.createElement('div');
  el.className = 'donor-entry' + (highlight ? ' donor-highlight' : '');
  el.innerHTML = `
    <div class="donor-avatar" style="background:${color}">${getInitials(name)}</div>
    <div class="donor-entry-info">
      <div class="donor-entry-name">${name}</div>
      <div class="donor-entry-cause">${cause}</div>
    </div>
    <div class="donor-entry-amount">${fmt(amount)}</div>
  `;
  if (prepend && feed.firstChild) {
    feed.insertBefore(el, feed.firstChild);
    // Keep max 6 entries
    while (feed.children.length > 6) feed.removeChild(feed.lastChild);
  } else {
    feed.appendChild(el);
  }
}

// Seed with sample donors
seedDonors.forEach(d => addDonorToFeed(d.name, d.cause, d.amount, false));

// Simulate live incoming donors
const liveDonors = [
  { name: 'Aditya M.',  cause: 'Tree Planting',     amount: 251  },
  { name: 'Priya K.',   cause: 'Pothole Repair',     amount: 501  },
  { name: 'Anonymous',  cause: 'All Causes',         amount: 1001 },
  { name: 'Raj N.',     cause: 'Garbage Management', amount: 101  },
  { name: 'Sneha T.',   cause: 'Tree Maintenance',   amount: 2501 },
  { name: 'Mohammed A.',cause: 'Pothole Repair',     amount: 251  },
  { name: 'Lakshmi R.', cause: 'Tree Planting',      amount: 501  },
];
let liveIdx = 0;
setInterval(() => {
  const d = liveDonors[liveIdx % liveDonors.length];
  addDonorToFeed(d.name, d.cause, d.amount, true);
  liveIdx++;
}, 4500);

/* ─────────────────────────────────────────────────────────────
   12. ADMIN PANEL
   ───────────────────────────────────────────────────────────── */
// Updates data store
let updatesData = [
  {
    id: 1,
    title: '320 potholes filled in South Mumbai',
    category: 'Pothole Repair',
    catKey: 'pothole',
    body: 'Using ₹4.8 lakh from Q1 donations, our partner contractors patched 320 potholes across 12 wards in South Mumbai. Road condition surveys show a 68% improvement in smoothness rating.',
    amountUsed: 480000,
    location: 'South Mumbai, Maharashtra',
    date: '28 Mar 2026',
  },
  {
    id: 2,
    title: 'Roadside cleanup drive — 6.2 tonnes cleared',
    category: 'Garbage Management',
    catKey: 'garbage',
    body: '240 volunteers worked across 18 km of national highway roadside, clearing 6.2 tonnes of mixed waste. 42 new dustbins installed at 500m intervals along the stretch.',
    amountUsed: 240000,
    location: 'NH-48, Bengaluru–Mysore',
    date: '22 Mar 2026',
  },
  {
    id: 3,
    title: '1,800 saplings planted on Ring Road divider',
    category: 'Tree Planting',
    catKey: 'tree',
    body: '1,800 native saplings including Neem, Peepal and Gulmohar planted along the 9 km ring road divider. Each tree is GPS tagged for maintenance tracking.',
    amountUsed: 360000,
    location: 'Outer Ring Road, Hyderabad',
    date: '15 Mar 2026',
  },
  {
    id: 4,
    title: 'Saplings from Jan drive: 94% survival rate',
    category: 'Tree Maintenance',
    catKey: 'maintain',
    body: '3,200 saplings from the January planting drive have been watered, pruned and treated. 94% survival confirmed. 190 dead saplings replaced. Drip irrigation setup completed.',
    amountUsed: 185000,
    location: 'Western Express Highway, Mumbai',
    date: '10 Mar 2026',
  },
];

const catKeyMap = {
  'Pothole Repair'    : { key: 'pothole', cls: 'cat-pothole', icon: 'fas fa-road'     },
  'Garbage Management': { key: 'garbage', cls: 'cat-garbage', icon: 'fas fa-trash-alt'},
  'Tree Planting'     : { key: 'tree',    cls: 'cat-tree',    icon: 'fas fa-seedling' },
  'Tree Maintenance'  : { key: 'maintain',cls: 'cat-maintain',icon: 'fas fa-tree'     },
  'General Update'    : { key: 'general', cls: 'cat-general', icon: 'fas fa-info-circle'},
};

function renderUpdates() {
  const grid = $('updatesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  updatesData.slice().reverse().forEach(u => {
    const meta = catKeyMap[u.category] || catKeyMap['General Update'];
    const card = document.createElement('div');
    card.className = 'update-card';
    card.setAttribute('data-id', u.id);
    card.innerHTML = `
      <div class="update-card-header">
        <span class="update-category-badge ${meta.cls}">
          <i class="${meta.icon}"></i> ${u.category}
        </span>
        <span class="update-date">${u.date}</span>
      </div>
      <div class="update-card-body">
        <h3>${u.title}</h3>
        <p>${u.body}</p>
      </div>
      <div class="update-card-footer">
        <span class="update-spent">Amount Used: <strong>${fmt(u.amountUsed)}</strong></span>
        <span class="update-location"><i class="fas fa-map-marker-alt"></i> ${u.location}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

renderUpdates();

// Admin toggle → show login modal first
$('adminToggleBtn').addEventListener('click', () => {
  if (isAdminLoggedIn) {
    const panel = $('adminPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    $('adminToggleBtn').innerHTML = panel.style.display === 'none'
      ? '<i class="fas fa-user-shield"></i> Admin Panel'
      : '<i class="fas fa-times"></i> Close Admin Panel';
  } else {
    $('adminLoginModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('adminPassInput').focus(), 100);
  }
});

// Admin login
$('adminLoginBtn').addEventListener('click', handleAdminLogin);
$('adminPassInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdminLogin();
});

function handleAdminLogin() {
  const pass = $('adminPassInput').value;
  if (pass === 'admin123') {
    isAdminLoggedIn = true;
    $('adminLoginModal').style.display = 'none';
    document.body.style.overflow = '';
    $('adminPassInput').value = '';
    $('adminError').style.display = 'none';
    $('adminPanel').style.display = 'block';
    $('adminToggleBtn').innerHTML = '<i class="fas fa-times"></i> Close Admin Panel';
    showToast('Welcome, Admin! 🛡️', 'success');
    $('adminPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    $('adminError').style.display = 'block';
    shake($('adminPassInput'));
    $('adminPassInput').value = '';
  }
}

$('cancelLoginBtn').addEventListener('click', () => {
  $('adminLoginModal').style.display = 'none';
  document.body.style.overflow = '';
  $('adminPassInput').value = '';
  $('adminError').style.display = 'none';
});

$('adminLoginModal').addEventListener('click', e => {
  if (e.target === $('adminLoginModal')) {
    $('adminLoginModal').style.display = 'none';
    document.body.style.overflow = '';
  }
});

// Publish Update
$('publishUpdateBtn').addEventListener('click', () => {
  const title    = $('adminTitle').value.trim();
  const category = $('adminCategory').value;
  const amtRaw   = parseInt($('adminAmount').value);
  const location = $('adminLocation').value.trim();
  const body     = $('adminBody').value.trim();
  const newTotal = parseInt($('adminTotalRaised').value);

  if (!title)    { shake($('adminTitle'));    showToast('Update title is required', 'error'); return; }
  if (!body)     { shake($('adminBody'));     showToast('Update details are required', 'error'); return; }
  if (!location) { shake($('adminLocation'));showToast('Location is required', 'error'); return; }
  if (!amtRaw || amtRaw < 0) { shake($('adminAmount')); showToast('Enter a valid amount used', 'error'); return; }

  const newUpdate = {
    id: updatesData.length + 1,
    title, category, body,
    amountUsed: amtRaw,
    location,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
  updatesData.push(newUpdate);
  renderUpdates();

  // Update total raised if provided
  if (newTotal && newTotal > 0) {
    totalRaised = newTotal;
    updateProgressBar();
  }

  // Clear form
  $('adminTitle').value    = '';
  $('adminAmount').value   = '';
  $('adminLocation').value = '';
  $('adminBody').value     = '';

  showToast('✅ Update published successfully!', 'success');

  // Scroll to updates grid
  $('updatesGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Preview button
$('previewUpdateBtn').addEventListener('click', () => {
  const title = $('adminTitle').value.trim() || '(No title)';
  const body  = $('adminBody').value.trim()  || '(No details)';
  showToast(`Preview: "${title}" — ${body.slice(0, 60)}…`, 'info');
});

// Cancel admin
$('cancelAdminBtn').addEventListener('click', () => {
  $('adminPanel').style.display = 'none';
  $('adminToggleBtn').innerHTML = '<i class="fas fa-user-shield"></i> Admin Panel';
});

/* ─────────────────────────────────────────────────────────────
   13. SMOOTH SMOOTH TOAST NOTIFICATIONS
   ───────────────────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  // Remove existing toasts
  $$('.toast').forEach(t => t.remove());

  const colors = {
    success: { bg: '#166534', border: '#22c55e', icon: '✓' },
    error:   { bg: '#7f1d1d', border: '#ef4444', icon: '✕' },
    info:    { bg: '#1e3a5f', border: '#3b82f6', icon: 'ℹ' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
    background: ${c.bg}; color: #fff;
    border: 1px solid ${c.border};
    border-radius: 12px; padding: 0.9rem 1.25rem;
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.9rem; font-weight: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    max-width: 360px;
    animation: toastIn 0.35s cubic-bezier(0.23,1,0.32,1) forwards;
  `;
  toast.innerHTML = `
    <span style="width:22px;height:22px;border-radius:50%;background:${c.border};
    display:flex;align-items:center;justify-content:center;font-size:0.75rem;flex-shrink:0">${c.icon}</span>
    <span>${message}</span>
  `;

  // Inject keyframes once
  if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      @keyframes toastIn  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
      @keyframes toastOut { from { opacity:1; transform:none; } to { opacity:0; transform:translateY(10px); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ─────────────────────────────────────────────────────────────
   14. SHAKE ANIMATION for invalid inputs
   ───────────────────────────────────────────────────────────── */
function shake(el) {
  if (!el) return;
  el.style.animation = '';
  el.style.borderColor = '#ef4444';
  void el.offsetWidth; // reflow
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('keydown', () => { el.style.borderColor = ''; }, { once: true });
  setTimeout(() => { el.style.animation = ''; }, 400);
}

// Inject shake keyframes
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

/* ─────────────────────────────────────────────────────────────
   15. THREE.JS 3D HERO ANIMATION
   ───────────────────────────────────────────────────────────── */
(function initHero3D() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000, 0);

  /* ── Particle field ─────────── */
  const COUNT = 280;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    sizes[i]  = Math.random() * 2.5 + 0.5;
    speeds[i] = Math.random() * 0.4 + 0.1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  /* circular sprite texture */
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const ctx2d = spriteCanvas.getContext('2d');
  const grd = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0,   'rgba(134,239,172,1)');
  grd.addColorStop(0.4, 'rgba(34,197,94,0.6)');
  grd.addColorStop(1,   'rgba(22,163,74,0)');
  ctx2d.fillStyle = grd;
  ctx2d.fillRect(0, 0, 64, 64);
  const spriteTex = new THREE.CanvasTexture(spriteCanvas);

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    map: spriteTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    opacity: 0.85,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ── Floating torus ring ─────── */
  const torusGeo  = new THREE.TorusGeometry(2.2, 0.04, 16, 100);
  const torusMat  = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.18, wireframe: false });
  const torus     = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 3;
  scene.add(torus);

  const torus2Geo = new THREE.TorusGeometry(3.5, 0.025, 12, 80);
  const torus2Mat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.1, wireframe: false });
  const torus2    = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.rotation.x = -Math.PI / 4;
  torus2.rotation.z = Math.PI / 6;
  scene.add(torus2);

  /* ── Mouse interactivity ─────── */
  let mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ── Resize handler ─────────── */
  window.addEventListener('resize', () => {
    const hero = document.getElementById('home');
    if (!hero) return;
    const W = hero.clientWidth, H = hero.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* ── Animate loop ───────────── */
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    /* drift particles upward slowly */
    const positions = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 1] += speeds[i] * 0.008;
      if (positions[i * 3 + 1] > 7) positions[i * 3 + 1] = -7;
    }
    geo.attributes.position.needsUpdate = true;

    /* rotate tori */
    torus.rotation.z  += 0.003;
    torus2.rotation.y += 0.002;
    torus2.rotation.z -= 0.001;

    /* subtle mouse parallax on scene */
    scene.rotation.y = mouse.x * 0.06;
    scene.rotation.x = -mouse.y * 0.04;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ─────────────────────────────────────────────────────────────
   16. HERO 3D SECTION PARALLAX (IMAGE & CONTENT)
   ───────────────────────────────────────────────────────────── */
const heroSection = document.getElementById('home');
const heroImg = document.getElementById('heroParallaxImg');
const heroContent = document.querySelector('.hero-content');
const heroOrbs = document.querySelectorAll('.orb');

if (heroSection && heroImg) {
  // 3D Tilt on mouse move
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalized coordinates from -1 to 1
    const xNorm = (x / rect.width - 0.5) * 2;
    const yNorm = (y / rect.height - 0.5) * 2;
    
    // Smooth 3D transform for image
    // Rotations: Move mouse up (negative yNorm), image rotates to face up (positive rotateX)
    heroImg.style.transform = `scale(1.15) rotateX(${-yNorm * 8}deg) rotateY(${xNorm * 8}deg) translate3d(${xNorm * 15}px, ${yNorm * 15}px, 0)`;
    
    // Parallax text content for extra 3D depth
    if (heroContent) {
      heroContent.style.transform = `perspective(1000px) rotateX(${yNorm * 3}deg) rotateY(${-xNorm * 3}deg) translateZ(20px)`;
    }
  }, { passive: true });

  // Reset transforms on mouse leave
  heroSection.addEventListener('mouseleave', () => {
    heroImg.style.transform = `scale(1.15) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)`;
    if (heroContent) {
      heroContent.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    }
  });

  // Basic scroll translation (subtle vertical shift only)
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroH = heroSection.offsetHeight;
    if (scrolled < heroH) {
      const pct = scrolled / heroH;
      // Combine scroll translateY via a css variable or just keep it simple with parent.
      // Easiest is to let 3D tilt dominate and skip explicit scroll parallax if it clashes with mousemove
      // Instead, we fade the image slightly on scroll
      heroImg.style.opacity = 1 - (pct * 0.5);
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   17. ENHANCED SCROLL REVEAL – data-reveal system
   ───────────────────────────────────────────────────────────── */
function attachReveal(el, type, delay) {
  el.setAttribute('data-reveal', type || '');
  if (delay) el.style.setProperty('--reveal-delay', delay + 's');
}

/* Cause cards – 3D perspective flip */
document.querySelectorAll('.cause-card').forEach((el, i) => {
  attachReveal(el, 'flip', i * 0.1);
});

/* How-it-works step items – bounce */
document.querySelectorAll('.step-item').forEach((el, i) => {
  attachReveal(el, '', i * 0.12);
});

/* Testimonial cards – scale */
document.querySelectorAll('.testimonial-card').forEach((el, i) => {
  attachReveal(el, 'scale', i * 0.1);
});

/* Breakdown items – fade up */
document.querySelectorAll('.breakdown-item').forEach((el, i) => {
  attachReveal(el, '', i * 0.07);
});

/* Donate form & sidebar */
const donateForm = document.querySelector('.donate-form-card');
const donateSide = document.querySelector('.donate-sidebar');
if (donateForm) attachReveal(donateForm, 'left', 0);
if (donateSide) attachReveal(donateSide, 'right', 0.15);

/* Trust badges */
document.querySelectorAll('.trust-item').forEach((el, i) => {
  attachReveal(el, 'scale', i * 0.08);
});

/* Footer columns */
const footerBrand = document.querySelector('.footer-brand');
if (footerBrand) attachReveal(footerBrand, '', 0);
document.querySelectorAll('.footer-links-col').forEach((el, i) => {
  attachReveal(el, '', i * 0.07 + 0.1);
});

/* Stat-section items */
document.querySelectorAll('.total-raised-badge').forEach(el => attachReveal(el, 'right', 0.1));

/* IntersectionObserver for data-reveal */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeRevealEls() {
  document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
}
observeRevealEls();

/* ─────────────────────────────────────────────────────────────
   18. SECTION HEADER ANIMATION (data-section-animate)
   ───────────────────────────────────────────────────────────── */
const sectionAnimObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
      sectionAnimObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-section-animate]').forEach(sec => {
  sectionAnimObs.observe(sec);
});

/* ─────────────────────────────────────────────────────────────
   19. BUG FIX – re-observe update-cards after renderUpdates
   (cards are created dynamically so we hook into renderUpdates)
   ───────────────────────────────────────────────────────────── */
const _origRenderUpdates = renderUpdates;
/* Patch renderUpdates to attach reveal + re-observe after render */
window.renderUpdates = function() {
  _origRenderUpdates();
  document.querySelectorAll('.update-card:not([data-reveal])').forEach((el, i) => {
    attachReveal(el, '', i * 0.08);
    revealObs.observe(el);
  });
};
/* Run once for initial cards already rendered */
document.querySelectorAll('.update-card').forEach((el, i) => {
  attachReveal(el, '', i * 0.08);
  revealObs.observe(el);
});

/* ─────────────────────────────────────────────────────────────
   20. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
   ───────────────────────────────────────────────────────────── */
const sections    = document.querySelectorAll('section[id]');
const navLinkEls  = document.querySelectorAll('.nav-link:not(.nav-cta)');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navLinkEls.forEach(link => {
    link.style.color      = '';
    link.style.background = '';
    if (link.getAttribute('href') === '#' + current) {
      link.style.color      = '#4ade80';
      link.style.background = 'rgba(34,197,94,0.08)';
    }
  });
}, { passive: true });

/* ─────────────────────────────────────────────────────────────
   21. INIT SUMMARY
   ───────────────────────────────────────────────────────────── */
updateSummary();

/* ─────────────────────────────────────────────────────────────
   22. SMOOTH SCROLL for all anchor links
   ───────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

