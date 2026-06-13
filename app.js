// ZyntrixLeads - Lead Management & Outreach CRM
// Main application logic with LocalStorage persistence

let currentTab = 'dashboard';
let currentSubTab = 'history';
let leadsDatabase = [];
let templatesDatabase = [];
let sequencesDatabase = [];
let outreachHistoryDatabase = [];
let paymentsDatabase = [];
let enquiriesDatabase = [];
let configData = {};
let selectedLeadIds = new Set();

// ===== PHASE 1 FEATURES =====
let customFieldsDatabase = [];
const DEAL_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_COLORS = {
  'prospect': '#3b82f6',
  'qualified': '#8b5cf6',
  'proposal': '#f59e0b',
  'negotiation': '#ef4444',
  'won': '#10b981',
  'lost': '#6b7280'
};

// ===== PHASE 2: RETAINERS & CLIENTS =====
let clientsDatabase = [];
let retainersDatabase = [];
let servicesDatabase = [];
const RETAINER_STATUS = ['active', 'paused', 'ended'];
const SERVICE_STATUS = ['pending', 'in-progress', 'completed', 'on-hold'];

// ===== PHASE 3A: INVOICING & PAYMENTS =====
let invoicesDatabase = [];
const INVOICE_STATUS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

// ===== PHASE 3B: CLIENT PORTAL =====
let portalTokens = {};

// ===== PHASE 3C: AUTOMATION =====
let automationRules = [];
const AUTOMATION_TRIGGERS = ['invoice_created', 'payment_due', 'service_complete', 'retainer_renewal'];
const AUTOMATION_ACTIONS = ['send_email', 'create_invoice', 'update_status', 'send_reminder'];

// ===== PHASE 3D: REPORTING =====
let reportCache = {};

// ===== PERFORMANCE OPTIMIZATION =====
let filterDebounceTimer;
let currentFilterCache = { results: null, timestamp: 0 };
const FILTER_DEBOUNCE_MS = 300;

function debounceFilter() {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    filterLeads();
  }, FILTER_DEBOUNCE_MS);
}

// Memoized filter to avoid recalculating identical filters
function filterLeadsDataOptimized() {
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const status = document.getElementById('filter-status')?.value || '';
  const website = document.getElementById('filter-website')?.value || '';
  const state = document.getElementById('filter-state')?.value || '';
  const score = parseInt(document.getElementById('filter-score')?.value || 0);

  // Single pass through array instead of multiple filters
  const results = leadsDatabase.filter(l => {
    if (search && !(
      (l.name && l.name.toLowerCase().includes(search)) ||
      (l.email && l.email.toLowerCase().includes(search)) ||
      (l.phone && l.phone.includes(search))
    )) return false;
    if (status && l.status !== status) return false;
    if (website === '0' && l.website) return false;
    if (website === '1' && !l.website) return false;
    if (state && l.state !== state) return false;
    if (score > 0 && (l.score || 0) < score) return false;
    return true;
  });

  return results;
}

// ===== SAVED FILTERS FEATURE =====
let savedFilters = [];

function initSavedFilters() {
  savedFilters = JSON.parse(localStorage.getItem('zyntrix_filters')) || [];
}

function saveCurrentFilter(name) {
  const filter = {
    id: 'filter_' + Date.now(),
    name: name,
    search: document.getElementById('filter-search')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
    website: document.getElementById('filter-website')?.value || '',
    state: document.getElementById('filter-state')?.value || '',
    score: document.getElementById('filter-score')?.value || ''
  };
  savedFilters.push(filter);
  localStorage.setItem('zyntrix_filters', JSON.stringify(savedFilters));
  updateSavedFiltersList();
}

function applySavedFilter(filterId) {
  const filter = savedFilters.find(f => f.id === filterId);
  if (!filter) return;
  document.getElementById('filter-search').value = filter.search;
  document.getElementById('filter-status').value = filter.status;
  document.getElementById('filter-website').value = filter.website;
  document.getElementById('filter-state').value = filter.state;
  document.getElementById('filter-score').value = filter.score;
  filterLeads();
}

function deleteSavedFilter(filterId) {
  savedFilters = savedFilters.filter(f => f.id !== filterId);
  localStorage.setItem('zyntrix_filters', JSON.stringify(savedFilters));
  updateSavedFiltersList();
}

function updateSavedFiltersList() {
  const wrap = document.getElementById('saved-filters-wrap');
  if (!wrap) return;
  wrap.innerHTML = savedFilters.map(f => `
    <button class="btn btn-ghost btn-sm" onclick="applySavedFilter('${f.id}')" title="Load: ${f.name}" style="max-width:150px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">⭐ ${f.name}</button>
    <button class="btn btn-ghost btn-xs" onclick="deleteSavedFilter('${f.id}')" style="padding:0.2rem 0.4rem">×</button>
  `).join('');
}

// ===== FOLLOW-UP REMINDERS =====
function checkFollowUpsAlert() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSoon = leadsDatabase.filter(l => {
    if (!l.followup) return false;
    const dueDate = new Date(l.followup);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() <= today.getTime();
  });

  if (dueSoon.length > 0) {
    const badge = document.getElementById('followup-alert-badge');
    if (badge) {
      badge.textContent = dueSoon.length;
      badge.classList.remove('hidden');
    }
  }
}

// ===== DUPLICATE DETECTION =====
function findDuplicates(newLead) {
  return leadsDatabase.filter(l =>
    l.id !== newLead.id && (
      (l.phone && l.phone === newLead.phone && newLead.phone) ||
      (l.email && l.email === newLead.email && newLead.email) ||
      (l.name && l.name.toLowerCase() === newLead.name.toLowerCase())
    )
  );
}

function warnDuplicates(newLead) {
  const dupes = findDuplicates(newLead);
  if (dupes.length > 0) {
    return `⚠️ Found ${dupes.length} potential duplicate(s): ${dupes.map(d => d.name).join(', ')}`;
  }
  return null;
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadAllData();
  renderDashboard();
  loadConfigDetail();
});

function initializeApp() {
  // Load data from localStorage
  leadsDatabase = JSON.parse(localStorage.getItem('zyntrix_leads')) || [];
  templatesDatabase = JSON.parse(localStorage.getItem('zyntrix_templates')) || [];
  sequencesDatabase = JSON.parse(localStorage.getItem('zyntrix_sequences')) || [];
  outreachHistoryDatabase = JSON.parse(localStorage.getItem('zyntrix_outreach')) || [];
  paymentsDatabase = JSON.parse(localStorage.getItem('zyntrix_payments')) || [];
  enquiriesDatabase = JSON.parse(localStorage.getItem('zyntrix_enquiries')) || [];
  configData = JSON.parse(localStorage.getItem('zyntrix_config')) || {};
  customFieldsDatabase = JSON.parse(localStorage.getItem('zyntrix_custom_fields')) || [];
  clientsDatabase = JSON.parse(localStorage.getItem('zyntrix_clients')) || [];
  retainersDatabase = JSON.parse(localStorage.getItem('zyntrix_retainers')) || [];
  servicesDatabase = JSON.parse(localStorage.getItem('zyntrix_services')) || [];
  invoicesDatabase = JSON.parse(localStorage.getItem('zyntrix_invoices')) || [];
  automationRules = JSON.parse(localStorage.getItem('zyntrix_automation')) || [];
  portalTokens = JSON.parse(localStorage.getItem('zyntrix_portal_tokens')) || {};

  // Initialize default templates if none exist
  if (templatesDatabase.length === 0) {
    initializeDefaultTemplates();
  }

  // Load saved filters and check reminders
  initSavedFilters();
  checkFollowUpsAlert();

  // Set today's date in dashboard
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('dash-date').textContent = dateStr;
}

function initializeDefaultTemplates() {
  const defaultTemplates = [
    {
      id: 'tpl_1',
      name: 'Cold Intro - No Website',
      subject: '{{business_name}} is leaving money on the table',
      body: `{{business_name}},

Quick observation: your competitors in {{city}} who have a web presence are capturing leads you're not even aware of.

We work with {{category}}s across Australia. Most see 30-50% more qualified inquiries within 60 days of launching a proper website. It's not about having a site – it's about having one that converts.

Here's what that looks like for your business:
• Local search visibility (show up when people search for {{category}} near you)
• Lead capture (calls, forms, bookings – all tracked)
• Professional credibility (competitors have it; you shouldn't be without it)

I've put together a 2-minute breakdown specific to {{category}}s in {{state}}. Worth a look?

{{from_name}}
{{from_email}}`
    },
    {
      id: 'tpl_2',
      name: 'Cold Intro - Has Website',
      subject: '{{business_name}} – your site is costing you sales',
      body: `{{business_name}},

I audit websites for {{category}}s. Most that exist today were built 3-5 years ago. Here's the problem: they don't convert.

I just reviewed yours. It's live, which is good. But it's not working hard enough for you.

Specific issues I see:
• Unclear value prop (visitors don't know why they should call YOU)
• No clear next step (forms aren't optimized for conversion)
• Slow load times (kills mobile traffic)
• Not ranking locally (SEO is weak)

The fix? 6-8 weeks, one-time investment. Most of our clients report 2-3x more qualified leads within 90 days.

Let's do a 15-minute audit call. You'll get specifics on what's broken and what we'd fix.

{{from_name}}`
    },
    {
      id: 'tpl_3',
      name: 'Warm Follow-up',
      subject: '{{business_name}} – case study inside',
      body: `{{business_name}},

I sent something over earlier. Didn't hear back – totally understand, inboxes are chaos.

I wanted to share something that might resonate: we just took a {{category}} in {{city}} from zero online presence to 18 qualified leads in their first month. Full breakdown attached.

Their situation was exactly like yours 90 days ago.

If there's any chance you'd consider moving on this, I'd rather talk now than have you regret it in six months.

Open to a quick call?

{{from_name}}`
    },
    {
      id: 'tpl_4',
      name: 'Urgent Follow-up',
      subject: '{{business_name}} – final message',
      body: `{{business_name}},

I'll be direct: this is my last attempt to reach you.

You probably don't need what I'm offering. Most businesses that don't respond are either:
• Already handling lead gen well (unlikely)
• Not ready to invest (fair enough)
• Genuinely missed the message (could be you)

If it's #3, this is your chance. If it's #1 or #2, no hard feelings – you know where to find me.

{{from_name}}`
    },
    {
      id: 'tpl_5',
      name: 'Qualified Lead - Authority Play',
      subject: '{{business_name}} – let\'s build this right',
      body: `{{business_name}},

I work with select {{category}}s who are serious about growth. We've built 80+ websites across Australia, mostly for businesses doing $500K-$5M revenue.

Here's our model:
• Fixed price (no surprises)
• 6-8 week turnaround
• Lead capture + conversion optimization included
• You own the site, the code, everything

Most clients see ROI within 90 days.

I'm only taking on 3 new projects this quarter. If you're interested in being one of them, let's talk this week.

{{from_name}}`
    },
    {
      id: 'tpl_6',
      name: 'Partnership - B2B Opportunity',
      subject: 'Partner opportunity – {{business_name}}',
      body: `{{business_name}} leadership team,

I'm reaching out because we've identified an opportunity to add a revenue stream to your business without any overhead.

Here's the model: You know {{category}}s. We build digital infrastructure that brings them customers. When you refer a prospect to us, we execute the full project – you get 15% commission on every deal that closes.

Last quarter alone, our partners did $60K+ in referral income.

This only works if you're selective about who you send our way. Meaning: we're looking for partners with good networks and high standards – not volume.

Are you interested in exploring this?

{{from_name}}
{{from_email}}`
    }
  ];

  templatesDatabase = defaultTemplates;
  saveTemplates();
}

// ===== SAVE/LOAD =====
function saveLeads() {
  localStorage.setItem('zyntrix_leads', JSON.stringify(leadsDatabase));
}

function saveTemplates() {
  localStorage.setItem('zyntrix_templates', JSON.stringify(templatesDatabase));
}

function saveSequences() {
  localStorage.setItem('zyntrix_sequences', JSON.stringify(sequencesDatabase));
}

function saveOutreach() {
  localStorage.setItem('zyntrix_outreach', JSON.stringify(outreachHistoryDatabase));
}

function savePayments() {
  localStorage.setItem('zyntrix_payments', JSON.stringify(paymentsDatabase));
}

function saveEnquiries() {
  localStorage.setItem('zyntrix_enquiries', JSON.stringify(enquiriesDatabase));
}

function saveConfig() {
  // Collect config data
  configData = {
    googleKey: document.getElementById('cfg-google-key')?.value || '',
    fromName: document.getElementById('cfg-from-name')?.value || '',
    fromEmail: document.getElementById('cfg-from-email')?.value || '',
    emailProvider: document.getElementById('cfg-email-provider')?.value || 'sendgrid',
    sendgridKey: document.getElementById('cfg-sendgrid-key')?.value || '',
    gmailPass: document.getElementById('cfg-gmail-pass')?.value || '',
    appUrl: document.getElementById('cfg-app-url')?.value || '',
    stripeKey: document.getElementById('cfg-stripe-key')?.value || '',
    stripeWebhook: document.getElementById('cfg-stripe-webhook')?.value || '',
    claudeKey: document.getElementById('cfg-claude-key')?.value || '',
    hunterKey: document.getElementById('cfg-hunter-key')?.value || ''
  };

  localStorage.setItem('zyntrix_config', JSON.stringify(configData));
  showMessage('Settings saved successfully', 'settings-msg');
}

function loadAllData() {
  // Config is loaded in initializeApp
  loadLeads();
  loadTemplates();
}

function loadLeads() {
  renderLeadsTable();
  updateLeadsCount();
}

function loadTemplates() {
  renderTemplatesList();
}

function showMessage(text, elementId) {
  const elem = document.getElementById(elementId);
  if (elem) {
    elem.textContent = text;
    elem.classList.remove('hidden');
    setTimeout(() => elem.classList.add('hidden'), 4000);
  }
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  currentTab = tabName;

  if (tabName === 'dashboard') {
    renderDashboard();
  } else if (tabName === 'leads') {
    renderLeadsTable();
  } else if (tabName === 'analytics') {
    renderAnalytics();
  } else if (tabName === 'enquiries') {
    loadEnquiries();
  } else if (tabName === 'followups') {
    renderFollowupsFullList();
  } else if (tabName === 'outreach') {
    renderSequencesList();
  } else if (tabName === 'pipeline') {
    renderPipeline();
  } else if (tabName === 'calendar') {
    renderCalendar();
  } else if (tabName === 'clients') {
    renderClients();
  } else if (tabName === 'retainers') {
    renderRetainers();
    populateClientDropdowns();
  } else if (tabName === 'services') {
    renderServices();
    populateClientDropdowns();
  } else if (tabName === 'invoices') {
    renderInvoices();
    populateClientDropdowns();
  } else if (tabName === 'reporting') {
    renderReporting();
  } else if (tabName === 'settings') {
    renderCustomFields();
  }
}

function populateClientDropdowns() {
  const selects = document.querySelectorAll('#retainer-client, #service-client, #invoice-client');
  selects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select client...</option>' + clientsDatabase.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join('');
    select.value = currentValue;
  });

  const retainerSelects = document.querySelectorAll('#invoice-retainer');
  retainerSelects.forEach(select => {
    const currentValue = select.value;
    const clientId = document.getElementById('invoice-client')?.value;
    const clientRetainers = retainersDatabase.filter(r => r.clientId === clientId);
    select.innerHTML = '<option value="">No retainer</option>' + clientRetainers.map(r =>
      `<option value="${r.id}">${r.serviceType} - $${r.amount}/mo</option>`
    ).join('');
    select.value = currentValue;
  });
}

function switchSub(subName) {
  document.querySelectorAll('[id^="sub-"]').forEach(s => s.classList.add('hidden'));
  document.getElementById(`sub-${subName}`)?.classList.remove('hidden');
  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-sub="${subName}"]`)?.classList.add('active');
  currentSubTab = subName;

  if (subName === 'templates') {
    renderTemplatesList();
  } else if (subName === 'sequences') {
    renderSequencesList();
  } else if (subName === 'history') {
    renderOutreachHistory();
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  const total = leadsDatabase.length;
  const noWebsite = leadsDatabase.filter(l => !l.website).length;
  const converted = leadsDatabase.filter(l => l.status === 'converted').length;
  const emailsSent = outreachHistoryDatabase.length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-no-website').textContent = noWebsite;
  document.getElementById('stat-converted').textContent = converted;
  document.getElementById('stat-emails-sent').textContent = emailsSent;

  renderRevenue();
  renderOpportunitiesDetected();
  renderFollowupsDue();
}

function renderRevenue() {
  let total = 0;
  let thisMonth = 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  paymentsDatabase.forEach(p => {
    total += p.amount;
    const pDate = new Date(p.date);
    if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      thisMonth += p.amount;
    }
  });

  document.getElementById('rev-total').textContent = '$' + total.toFixed(0);
  document.getElementById('rev-month').textContent = '$' + thisMonth.toFixed(0);
  document.getElementById('rev-count').textContent = paymentsDatabase.length;

  const recentPayments = paymentsDatabase.slice(-5).reverse();
  let html = '';
  recentPayments.forEach(p => {
    html += `<div style="padding:0.75rem;border-radius:8px;background:var(--surface2);display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;margin-bottom:0.5rem">
      <div><strong>${p.clientName || 'Unknown'}</strong><br><span style="color:var(--text-muted);font-size:0.8rem">${p.description || 'Payment'}</span></div>
      <div style="text-align:right"><strong style="color:#22c55e">$${p.amount.toFixed(2)}</strong><br><span style="color:var(--text-muted);font-size:0.8rem">${new Date(p.date).toLocaleDateString()}</span></div>
    </div>`;
  });
  document.getElementById('recent-payments-list').innerHTML = html || '<p style="color:var(--text-muted);font-size:0.85rem">No payments logged yet.</p>';
}

function renderOpportunitiesDetected() {
  const opps = leadsDatabase.filter(l => !l.website && l.status === 'new').slice(0, 5);
  let html = '';
  opps.forEach(opp => {
    html += `<div class="opp-card" onclick="viewLead('${opp.id}')">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <div style="font-weight:600;font-size:0.95rem">${opp.name || 'Unknown'}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${opp.category} • ${opp.city}, ${opp.state}</div>
        </div>
        <div class="score-badge" style="background:rgba(255,193,7,0.15);color:#ffc107;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.75rem;font-weight:600">${opp.score || 0}</div>
      </div>
      <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted)">No website – high opportunity</div>
    </div>`;
  });
  document.getElementById('opportunities-list').innerHTML = html || '<p style="color:var(--text-muted);font-size:0.85rem">No new opportunities detected.</p>';
}

function renderFollowupsDue() {
  const today = new Date().toISOString().split('T')[0];
  const due = leadsDatabase.filter(l => l.followupDate && l.followupDate <= today && l.status !== 'converted').slice(0, 5);

  if (due.length === 0) {
    document.getElementById('followups-widget').classList.add('hidden');
    return;
  }

  document.getElementById('followups-widget').classList.remove('hidden');
  let html = '';
  due.forEach(lead => {
    html += `<div style="padding:0.75rem;background:var(--surface2);border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;cursor:pointer" onclick="viewLead('${lead.id}')">
      <div><strong>${lead.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${lead.category} • ${lead.city}</span></div>
      <button class="btn btn-primary btn-sm">Follow Up</button>
    </div>`;
  });
  document.getElementById('followups-list').innerHTML = html;
}

// ===== LEADS TABLE =====
function renderLeadsTable() {
  const filtered = filterLeadsDataOptimized();
  const startIdx = 0;
  const endIdx = Math.min(startIdx + 20, filtered.length);
  const pageData = filtered.slice(startIdx, endIdx);

  let html = '';
  pageData.forEach(lead => {
    const hasWebsite = lead.website ? '✓' : '—';
    const websiteCell = lead.website ? `<a href="${lead.website}" target="_blank" style="color:var(--accent);text-decoration:none">${lead.website.replace('https://', '').substring(0, 25)}</a>` : '—';

    html += `<tr onclick="viewLead('${lead.id}')">
      <td><input type="checkbox" data-lead-id="${lead.id}" onchange="toggleLeadSelect(this)" /></td>
      <td><strong>${lead.name}</strong></td>
      <td>${lead.category}</td>
      <td>${lead.city}</td>
      <td>${lead.state}</td>
      <td>${lead.phone || '—'}</td>
      <td>${lead.email || '—'}</td>
      <td>${websiteCell}</td>
      <td><span style="background:rgba(255,193,7,0.15);color:#ffc107;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;font-weight:600">${lead.score || 0}</span></td>
      <td><span class="status-badge status-${lead.status}">${lead.status || 'new'}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="openLeadModal('${lead.id}');event.stopPropagation()">Edit</button></td>
    </tr>`;
  });

  document.getElementById('leads-tbody').innerHTML = html || '<tr><td colspan="11" style="text-align:center;padding:2rem;color:var(--text-muted)">No leads found. <a href="#" onclick="switchTab(\'find\');return false" style="color:var(--accent)">Import or find leads</a></td></tr>';
  updateLeadsCount();
}

function filterLeadsData() {
  let results = [...leadsDatabase];

  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const status = document.getElementById('filter-status')?.value || '';
  const website = document.getElementById('filter-website')?.value || '';
  const state = document.getElementById('filter-state')?.value || '';
  const score = parseInt(document.getElementById('filter-score')?.value || 0);

  if (search) {
    results = results.filter(l =>
      (l.name && l.name.toLowerCase().includes(search)) ||
      (l.email && l.email.toLowerCase().includes(search)) ||
      (l.phone && l.phone.includes(search))
    );
  }
  if (status) results = results.filter(l => l.status === status);
  if (website === '0') results = results.filter(l => !l.website);
  if (website === '1') results = results.filter(l => l.website);
  if (state) results = results.filter(l => l.state === state);
  if (score > 0) results = results.filter(l => (l.score || 0) >= score);

  return results;
}

function filterLeads() {
  renderLeadsTable();
  updateSavedFiltersList();
}

function updateLeadsCount() {
  const total = leadsDatabase.length;
  const filtered = filterLeadsData().length;
  document.getElementById('leads-count').textContent = filtered === total ? `${total} lead${total !== 1 ? 's' : ''}` : `${filtered} of ${total} leads`;
}

// ===== LEAD SELECTION =====
function toggleLeadSelect(checkbox) {
  const leadId = checkbox.dataset.leadId;
  if (checkbox.checked) {
    selectedLeadIds.add(leadId);
  } else {
    selectedLeadIds.delete(leadId);
  }
  updateBulkActions();
}

function toggleSelectAll() {
  const checkbox = document.getElementById('select-all');
  const filtered = filterLeadsData();

  if (checkbox.checked) {
    filtered.forEach(lead => selectedLeadIds.add(lead.id));
    document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => cb.checked = true);
  } else {
    selectedLeadIds.clear();
    document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => cb.checked = false);
  }
  updateBulkActions();
}

function updateBulkActions() {
  const count = selectedLeadIds.size;
  const btnDelete = document.getElementById('btn-delete-selected');
  const bulkWrap = document.getElementById('bulk-status-wrap');

  if (count > 0) {
    btnDelete.disabled = false;
    bulkWrap.style.display = 'flex';
  } else {
    btnDelete.disabled = true;
    bulkWrap.style.display = 'none';
  }
}

// ===== TEMPLATES =====
function renderTemplatesList() {
  let html = '';
  templatesDatabase.forEach(tpl => {
    html += `<div class="template-card" onclick="openTemplateModal('${tpl.id}')">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.95rem">${tpl.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem;line-height:1.4">${tpl.subject}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="useTemplate('${tpl.id}');event.stopPropagation()">Use</button>
      </div>
    </div>`;
  });
  document.getElementById('campaigns-list').innerHTML = html;
}

function openTemplateModal(tplId) {
  const tpl = templatesDatabase.find(t => t.id === tplId);
  if (!tpl) return;

  document.getElementById('tpl-id').value = tpl.id;
  document.getElementById('tpl-name').value = tpl.name;
  document.getElementById('tpl-subject').value = tpl.subject;
  document.getElementById('tpl-body').value = tpl.body;
  document.getElementById('template-modal-title').textContent = 'Edit Template';
  document.getElementById('template-modal').classList.remove('hidden');
}

function closeTemplateModal() {
  document.getElementById('template-modal').classList.add('hidden');
}

function saveTemplateFromModal() {
  const id = document.getElementById('tpl-id').value;
  const tpl = templatesDatabase.find(t => t.id === id);

  if (tpl) {
    tpl.name = document.getElementById('tpl-name').value;
    tpl.subject = document.getElementById('tpl-subject').value;
    tpl.body = document.getElementById('tpl-body').value;
    saveTemplates();
    renderTemplatesList();
    closeTemplateModal();
    showMessage('Template updated', 'outreach-modal');
  }
}

function deleteTemplateFromModal() {
  const id = document.getElementById('tpl-id').value;
  templatesDatabase = templatesDatabase.filter(t => t.id !== id);
  saveTemplates();
  renderTemplatesList();
  closeTemplateModal();
}

function showCampaignForm() {
  document.getElementById('new-template-modal').classList.remove('hidden');
}

function closeNewTemplateModal() {
  document.getElementById('new-template-modal').classList.add('hidden');
  document.getElementById('new-tpl-name').value = '';
  document.getElementById('new-tpl-subject').value = '';
  document.getElementById('new-tpl-body').value = '';
}

function saveNewTemplate() {
  const name = document.getElementById('new-tpl-name').value.trim();
  const subject = document.getElementById('new-tpl-subject').value.trim();
  const body = document.getElementById('new-tpl-body').value.trim();

  if (!name || !subject || !body) {
    alert('All fields are required');
    return;
  }

  const newTpl = {
    id: 'tpl_' + Date.now(),
    name,
    subject,
    body
  };

  templatesDatabase.push(newTpl);
  saveTemplates();
  renderTemplatesList();
  closeNewTemplateModal();
  showMessage('Template created', 'outreach-modal');
}

// ===== OUTREACH =====
function renderOutreachHistory() {
  const history = outreachHistoryDatabase.slice().reverse();
  let html = '';

  history.forEach(item => {
    const status = item.status || 'sent';
    const icon = status === 'failed' ? '❌' : status === 'opened' ? '👁' : '✓';
    html += `<div class="outreach-item">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
            <span style="font-size:1.1rem">${icon}</span>
            <strong>${item.toName || item.toEmail}</strong>
            <span style="color:var(--text-muted);font-size:0.8rem">${item.toEmail}</span>
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">${item.subject}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${new Date(item.sentAt).toLocaleString()}</div>
        </div>
        <span class="status-badge status-${status}">${status}</span>
      </div>
    </div>`;
  });

  document.getElementById('outreach-history').innerHTML = html || '<p style="color:var(--text-muted);font-size:0.85rem">No emails sent yet. Go to All Leads and select emails to send.</p>';
}

function openOutreachModal() {
  const selected = Array.from(selectedLeadIds);
  if (selected.length === 0) {
    alert('Select leads first');
    return;
  }

  const count = selected.length;
  document.getElementById('outreach-lead-count').innerHTML = `<strong>${count}</strong> lead${count !== 1 ? 's' : ''} selected`;
  document.getElementById('outreach-lead-count-2').innerHTML = `<strong>${count}</strong> lead${count !== 1 ? 's' : ''} selected`;

  renderOutreachTemplatePicker();
  document.getElementById('outreach-step-1').classList.remove('hidden');
  document.getElementById('outreach-step-2').classList.add('hidden');
  document.getElementById('outreach-footer-1').classList.remove('hidden');
  document.getElementById('outreach-footer-2').classList.add('hidden');
  document.getElementById('outreach-modal').classList.remove('hidden');
}

function renderOutreachTemplatePicker() {
  let html = '';
  templatesDatabase.forEach(tpl => {
    html += `<div class="template-picker-item" onclick="selectTemplate('${tpl.id}')">
      <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.25rem">${tpl.name}</div>
      <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.4">${tpl.subject}</div>
    </div>`;
  });
  document.getElementById('template-picker').innerHTML = html;
}

function selectTemplate(tplId) {
  const tpl = templatesDatabase.find(t => t.id === tplId);
  if (!tpl) return;

  document.getElementById('modal-subject').value = tpl.subject;
  document.getElementById('modal-body').value = tpl.body;
  document.getElementById('outreach-step-1').classList.add('hidden');
  document.getElementById('outreach-step-2').classList.remove('hidden');
  document.getElementById('outreach-footer-1').classList.add('hidden');
  document.getElementById('outreach-footer-2').classList.remove('hidden');
}

function closeOutreachModal() {
  document.getElementById('outreach-modal').classList.add('hidden');
  selectedLeadIds.clear();
  updateBulkActions();
}

function sendOutreach() {
  const subject = document.getElementById('modal-subject').value;
  const body = document.getElementById('modal-body').value;
  const delay = parseInt(document.getElementById('send-delay').value || 0);

  if (!subject || !body) {
    alert('Subject and body are required');
    return;
  }

  const selected = Array.from(selectedLeadIds);
  let sentCount = 0;

  selected.forEach((leadId, idx) => {
    const lead = leadsDatabase.find(l => l.id === leadId);
    if (lead && lead.email) {
      setTimeout(() => {
        const record = {
          id: 'outreach_' + Date.now() + '_' + idx,
          toName: lead.name,
          toEmail: lead.email,
          subject: replaceVariables(subject, lead),
          body: replaceVariables(body, lead),
          sentAt: new Date().toISOString(),
          status: 'sent',
          leadId: leadId
        };
        outreachHistoryDatabase.push(record);
        sentCount++;
      }, delay * idx);
    }
  });

  setTimeout(() => {
    saveOutreach();
    renderOutreachHistory();
    closeOutreachModal();
    showMessage(`${sentCount} emails queued for sending`, 'outreach-history');
  }, delay * selected.length + 500);
}

function replaceVariables(text, lead) {
  return text
    .replace(/{{business_name}}/g, lead.name || '')
    .replace(/{{city}}/g, lead.city || '')
    .replace(/{{state}}/g, lead.state || '')
    .replace(/{{category}}/g, lead.category || '')
    .replace(/{{phone}}/g, lead.phone || '')
    .replace(/{{from_name}}/g, configData.fromName || '')
    .replace(/{{from_email}}/g, configData.fromEmail || '');
}

// ===== LEADS CRUD =====
function viewLead(leadId) {
  const lead = leadsDatabase.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('crm-name').textContent = lead.name;
  document.getElementById('crm-meta').textContent = `${lead.category} • ${lead.city}, ${lead.state}`;

  const scoreBg = lead.score < 50 ? 'rgba(229,57,53,0.15)' : lead.score < 70 ? 'rgba(255,193,7,0.15)' : 'rgba(76,175,80,0.15)';
  const scoreColor = lead.score < 50 ? '#f44336' : lead.score < 70 ? '#ffc107' : '#4caf50';
  document.getElementById('crm-score-badge').innerHTML = `<div style="background:${scoreBg};color:${scoreColor};padding:1rem;border-radius:8px;text-align:center;font-size:2.5rem;font-weight:900">${lead.score || 0}</div>`;

  document.getElementById('crm-email').value = lead.email || '';
  document.getElementById('crm-phone').value = lead.phone || '';
  document.getElementById('crm-website-input').value = lead.website || '';
  document.getElementById('crm-followup').value = lead.followupDate || '';
  document.getElementById('crm-notes').value = lead.notes || '';

  if (lead.website) {
    document.getElementById('crm-website-link').href = lead.website;
    document.getElementById('crm-website-link').classList.remove('hidden');
  } else {
    document.getElementById('crm-website-link').classList.add('hidden');
  }

  // Status buttons
  document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-s="${lead.status || 'new'}"]`)?.classList.add('active');

  // Email history
  const history = outreachHistoryDatabase.filter(h => h.leadId === leadId);
  let historyHtml = '';
  history.forEach(h => {
    historyHtml += `<div style="padding:0.65rem;background:var(--surface2);border-radius:6px;margin-bottom:0.5rem;font-size:0.8rem">
      <div style="font-weight:600;color:var(--accent)">${h.subject}</div>
      <div style="color:var(--text-muted);margin-top:0.25rem">${new Date(h.sentAt).toLocaleString()}</div>
    </div>`;
  });
  document.getElementById('crm-history').innerHTML = historyHtml || '<p style="color:var(--text-muted);font-size:0.8rem">No emails sent yet.</p>';

  document.getElementById('crm-overlay').classList.remove('hidden');
  document.getElementById('crm-drawer').classList.remove('hidden');
}

function closeCrmDrawer() {
  document.getElementById('crm-overlay').classList.add('hidden');
  document.getElementById('crm-drawer').classList.add('hidden');
}

function saveCrmContact() {
  // Contact save logic
}

function saveCrmNotes() {
  // Notes save logic
}

function setCrmStatus(status) {
  // Status update logic
}

function openLeadModal(leadId) {
  const lead = leadsDatabase.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('edit-lead-id').value = lead.id;
  document.getElementById('edit-email').value = lead.email || '';
  document.getElementById('edit-phone').value = lead.phone || '';
  document.getElementById('edit-website').value = lead.website || '';
  document.getElementById('edit-status').value = lead.status || 'new';
  document.getElementById('edit-notes').value = lead.notes || '';
  document.getElementById('edit-followup').value = lead.followupDate || '';

  document.getElementById('lead-modal').classList.remove('hidden');
}

function closeLeadModal() {
  document.getElementById('lead-modal').classList.add('hidden');
}

function saveLeadEdit() {
  const id = document.getElementById('edit-lead-id').value;
  const lead = leadsDatabase.find(l => l.id === id);

  if (lead) {
    lead.email = document.getElementById('edit-email').value;
    lead.phone = document.getElementById('edit-phone').value;
    lead.website = document.getElementById('edit-website').value;
    lead.status = document.getElementById('edit-status').value;
    lead.notes = document.getElementById('edit-notes').value;
    lead.followupDate = document.getElementById('edit-followup').value;

    saveLeads();
    renderLeadsTable();
    closeLeadModal();
    closeCrmDrawer();
    showMessage('Lead updated', 'settings-msg');
  }
}

function deleteSelected() {
  if (selectedLeadIds.size === 0) return;

  if (confirm(`Delete ${selectedLeadIds.size} lead(s)? This cannot be undone.`)) {
    selectedLeadIds.forEach(id => {
      leadsDatabase = leadsDatabase.filter(l => l.id !== id);
    });
    saveLeads();
    selectedLeadIds.clear();
    renderLeadsTable();
    updateBulkActions();
  }
}

// ===== IMPORT/EXPORT =====
function triggerImport() {
  document.getElementById('csv-import-input').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const csv = e.target.result;
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const lead = {
        id: 'lead_' + Date.now() + '_' + i,
        name: values[headers.indexOf('name')] || '',
        email: values[headers.indexOf('email')] || '',
        phone: values[headers.indexOf('phone')] || '',
        website: values[headers.indexOf('website')] || '',
        category: values[headers.indexOf('category')] || '',
        city: values[headers.indexOf('city')] || '',
        state: values[headers.indexOf('state')] || '',
        status: values[headers.indexOf('status')] || 'new',
        score: parseInt(values[headers.indexOf('score')]) || 0,
        notes: values[headers.indexOf('notes')] || '',
        followupDate: values[headers.indexOf('followup_date')] || '',
        dealStage: 'prospect'
      };

      if (lead.name && (lead.email || lead.phone)) {
        leadsDatabase.push(lead);
      }
    }

    saveLeads();
    renderLeadsTable();
    showMessage(`Imported ${leadsDatabase.length} leads`, 'settings-msg');
  };

  reader.readAsText(file);
  event.target.value = '';
}

function exportLeadsCSV() {
  const headers = ['Name', 'Email', 'Phone', 'Website', 'Category', 'City', 'State', 'Score', 'Status', 'Notes', 'Follow-up Date'];
  let csv = headers.join(',') + '\n';

  leadsDatabase.forEach(lead => {
    const row = [
      lead.name,
      lead.email,
      lead.phone,
      lead.website,
      lead.category,
      lead.city,
      lead.state,
      lead.score,
      lead.status,
      lead.notes,
      lead.followupDate
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',');
    csv += row + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zyntrix_leads_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// ===== ANALYTICS =====
function renderAnalytics() {
  // Placeholder analytics rendering
}

// ===== SETTINGS =====
function loadConfigDetail() {
  const html = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;font-size:0.85rem">
      <div>
        <span style="color:var(--text-muted)">Google API:</span>
        <span id="config-google" style="color:var(--accent)">${configData.googleKey ? '✓ Connected' : '✗ Not configured'}</span>
      </div>
      <div>
        <span style="color:var(--text-muted)">Email Provider:</span>
        <span style="color:var(--accent)">${configData.emailProvider || 'Not configured'}</span>
      </div>
      <div>
        <span style="color:var(--text-muted)">From Email:</span>
        <span style="color:var(--text)">${configData.fromEmail || '—'}</span>
      </div>
    </div>
  `;
  document.getElementById('config-detail').innerHTML = html;

  // Populate config fields
  document.getElementById('cfg-google-key').value = configData.googleKey || '';
  document.getElementById('cfg-from-name').value = configData.fromName || '';
  document.getElementById('cfg-from-email').value = configData.fromEmail || '';
  document.getElementById('cfg-email-provider').value = configData.emailProvider || 'sendgrid';
  document.getElementById('cfg-sendgrid-key').value = configData.sendgridKey || '';
  document.getElementById('cfg-gmail-pass').value = configData.gmailPass || '';
  document.getElementById('cfg-app-url').value = configData.appUrl || '';
  document.getElementById('cfg-stripe-key').value = configData.stripeKey || '';
  document.getElementById('cfg-stripe-webhook').value = configData.stripeWebhook || '';
  document.getElementById('cfg-claude-key').value = configData.claudeKey || '';
  document.getElementById('cfg-hunter-key').value = configData.hunterKey || '';
}

function testEmail() {
  alert('Email test: Feature coming soon');
}

function toggleVisible(id) {
  const elem = document.getElementById(id);
  const btn = event.target;
  if (elem.type === 'password') {
    elem.type = 'text';
    btn.textContent = 'Hide';
  } else {
    elem.type = 'password';
    btn.textContent = 'Show';
  }
}

function toggleProviderFields() {
  const provider = document.getElementById('cfg-email-provider').value;
  document.getElementById('sendgrid-fields').classList.toggle('hidden', provider !== 'sendgrid');
  document.getElementById('gmail-fields').classList.toggle('hidden', provider !== 'gmail');
}

// ===== PAYMENTS =====
function openLogPaymentModal() {
  document.getElementById('log-payment-modal').classList.remove('hidden');
}

function closeLogPaymentModal() {
  document.getElementById('log-payment-modal').classList.add('hidden');
}

function saveLogPayment() {
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const name = document.getElementById('pay-name').value;
  const email = document.getElementById('pay-email').value;
  const desc = document.getElementById('pay-desc').value;

  if (!amount || amount <= 0) {
    alert('Enter a valid amount');
    return;
  }

  const payment = {
    id: 'pay_' + Date.now(),
    amount,
    clientName: name,
    clientEmail: email,
    description: desc,
    date: new Date().toISOString()
  };

  paymentsDatabase.push(payment);
  savePayments();
  renderRevenue();
  closeLogPaymentModal();
  document.getElementById('pay-amount').value = '';
  document.getElementById('pay-name').value = '';
  document.getElementById('pay-email').value = '';
  document.getElementById('pay-desc').value = '';
  showMessage('Payment logged', 'settings-msg');
}

// ===== ENQUIRIES =====
function loadEnquiries() {
  renderEnquiriesList();
}

function renderEnquiriesList() {
  let html = '';
  enquiriesDatabase.forEach(enq => {
    html += `<div class="enquiry-card" onclick="openReplyModal('${enq.id}')">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div style="flex:1">
          <div><strong>${enq.name}</strong> <span style="color:var(--text-muted);font-size:0.85rem">${enq.email}</span></div>
          <div style="margin-top:0.25rem;color:var(--text-muted);font-size:0.85rem">${enq.subject}</div>
          <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted)">${new Date(enq.receivedAt).toLocaleString()}</div>
        </div>
        <span class="status-badge status-${enq.status}">${enq.status}</span>
      </div>
    </div>`;
  });
  document.getElementById('enquiries-list').innerHTML = html || '<p style="color:var(--text-muted)">No enquiries yet.</p>';
}

function openReplyModal(enqId) {
  const enq = enquiriesDatabase.find(e => e.id === enqId);
  if (!enq) return;

  document.getElementById('reply-enq-id').value = enq.id;
  document.getElementById('reply-to-info').textContent = `From: ${enq.name} (${enq.email})`;
  document.getElementById('reply-subject').value = `Re: ${enq.subject}`;
  document.getElementById('reply-body').value = '';
  document.getElementById('reply-modal').classList.remove('hidden');
}

function closeReplyModal() {
  document.getElementById('reply-modal').classList.add('hidden');
}

function sendReply() {
  alert('Reply sent! Feature integration coming soon.');
  closeReplyModal();
}

// ===== SEQUENCES =====
function renderSequencesList() {
  let html = '';
  sequencesDatabase.forEach(seq => {
    html += `<div class="sequence-card">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:0.5rem">${seq.name}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">${seq.steps.length} step${seq.steps.length !== 1 ? 's' : ''}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="viewSequenceLeads('${seq.id}')">View Leads</button>
      </div>
    </div>`;
  });
  document.getElementById('sequences-list').innerHTML = html || '<p style="color:var(--text-muted)">No sequences yet. Create one to send automated drip campaigns.</p>';
}

function showNewSequenceModal() {
  document.getElementById('sequence-modal').classList.remove('hidden');
}

function closeSequenceModal() {
  document.getElementById('sequence-modal').classList.add('hidden');
}

function saveSequence() {
  alert('Sequence save: Feature coming soon');
}

function viewSequenceLeads(seqId) {
  alert('View sequence leads: Feature coming soon');
}

function openAssignModal() {
  const selected = Array.from(selectedLeadIds);
  if (selected.length === 0) {
    alert('Select leads first');
    return;
  }

  document.getElementById('assign-lead-count').textContent = `${selected.length} lead${selected.length !== 1 ? 's' : ''} selected`;

  let html = '<option value="">Choose a sequence...</option>';
  sequencesDatabase.forEach(seq => {
    html += `<option value="${seq.id}">${seq.name}</option>`;
  });
  document.getElementById('assign-sequence-select').innerHTML = html;
  document.getElementById('assign-sequence-modal').classList.remove('hidden');
}

function closeAssignModal() {
  document.getElementById('assign-sequence-modal').classList.add('hidden');
}

function doAssignSequence() {
  alert('Assign sequence: Feature coming soon');
}

// ===== MISC =====
function findLeads() {
  alert('Find leads: Feature coming soon - integrate with Google Places API');
}

function openCustomEmail() {
  document.getElementById('outreach-step-1').classList.add('hidden');
  document.getElementById('outreach-step-2').classList.remove('hidden');
  document.getElementById('outreach-footer-1').classList.add('hidden');
  document.getElementById('outreach-footer-2').classList.remove('hidden');
  document.getElementById('modal-subject').value = '';
  document.getElementById('modal-body').value = '';
}

function backToTemplatePicker() {
  renderOutreachTemplatePicker();
  document.getElementById('outreach-step-1').classList.remove('hidden');
  document.getElementById('outreach-step-2').classList.add('hidden');
  document.getElementById('outreach-footer-1').classList.remove('hidden');
  document.getElementById('outreach-footer-2').classList.add('hidden');
}

function generateAiEmail() {
  alert('AI email generation: Feature coming soon - requires Claude API key');
}

function addAiOpener() {
  alert('AI opener: Feature coming soon');
}

function bulkUpdateStatus() {
  const status = document.getElementById('bulk-status-select').value;
  if (!status) return;

  selectedLeadIds.forEach(id => {
    const lead = leadsDatabase.find(l => l.id === id);
    if (lead) lead.status = status;
  });

  saveLeads();
  renderLeadsTable();
  selectedLeadIds.clear();
  updateBulkActions();
  showMessage(`Updated ${selectedLeadIds.size} leads`, 'settings-msg');
}

function useTemplate(tplId) {
  selectTemplate(tplId);
}

function crmFindEmail() {
  alert('Find email: Feature coming soon - integrate with Hunter.io or Apollo');
}

function openOutreachForSingle() {
  closeCrmDrawer();
  // Find the lead and select it
  alert('Send email: Feature coming soon');
}

function openNewSequenceModal() {
  showNewSequenceModal();
}

function addSequenceStep() {
  alert('Add sequence step: Feature coming soon');
}

function retryFailed() {
  alert('Retry failed: Feature coming soon');
}

function closeSeqLeadsModal() {
  document.getElementById('seq-leads-modal').classList.add('hidden');
}

function closeConfirm() {
  document.getElementById('confirm-modal').classList.add('hidden');
}

function doConfirm() {
  closeConfirm();
}

// ===== FOLLOW-UPS FULL LIST =====
function renderFollowupsFullList() {
  const today = new Date().toISOString().split('T')[0];
  const dueSoon = leadsDatabase.filter(l => l.followupDate && l.followupDate <= today && l.status !== 'converted');
  const upcoming = leadsDatabase.filter(l => l.followupDate && l.followupDate > today && l.status !== 'converted').sort((a, b) => new Date(a.followupDate) - new Date(b.followupDate));

  let html = '';

  if (dueSoon.length > 0) {
    html += '<div style="margin-bottom:2rem"><h3 style="color:var(--accent);margin-bottom:1rem">⚠️ Overdue</h3>';
    dueSoon.forEach(lead => {
      html += `<div style="padding:0.75rem;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;margin-bottom:0.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="viewLead('${lead.id}')">
        <div><strong>${lead.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${lead.category} • ${lead.city}</span></div>
        <span style="font-size:0.85rem;color:#f87171">Due: ${lead.followupDate}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (upcoming.length > 0) {
    html += '<div><h3 style="color:var(--blue);margin-bottom:1rem">📅 Upcoming</h3>';
    upcoming.slice(0, 10).forEach(lead => {
      html += `<div style="padding:0.75rem;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;margin-bottom:0.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="viewLead('${lead.id}')">
        <div><strong>${lead.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${lead.category} • ${lead.city}</span></div>
        <span style="font-size:0.85rem;color:var(--text-muted)">Due: ${lead.followupDate}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (dueSoon.length === 0 && upcoming.length === 0) {
    html = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No follow-ups scheduled</p>';
  }

  document.getElementById('followups-full-list').innerHTML = html;
}

// ===== DATA PERSISTENCE =====
function saveLeadsData() {
  localStorage.setItem('zyntrix_leads', JSON.stringify(leadsDatabase));
}

function saveAllData() {
  localStorage.setItem('zyntrix_leads', JSON.stringify(leadsDatabase));
  localStorage.setItem('zyntrix_templates', JSON.stringify(templatesDatabase));
  localStorage.setItem('zyntrix_sequences', JSON.stringify(sequencesDatabase));
  localStorage.setItem('zyntrix_outreach', JSON.stringify(outreachHistoryDatabase));
  localStorage.setItem('zyntrix_payments', JSON.stringify(paymentsDatabase));
  localStorage.setItem('zyntrix_enquiries', JSON.stringify(enquiriesDatabase));
  localStorage.setItem('zyntrix_config', JSON.stringify(configData));
  localStorage.setItem('zyntrix_filters', JSON.stringify(savedFilters));
  localStorage.setItem('zyntrix_custom_fields', JSON.stringify(customFieldsDatabase));
  localStorage.setItem('zyntrix_clients', JSON.stringify(clientsDatabase));
  localStorage.setItem('zyntrix_retainers', JSON.stringify(retainersDatabase));
  localStorage.setItem('zyntrix_services', JSON.stringify(servicesDatabase));
  localStorage.setItem('zyntrix_invoices', JSON.stringify(invoicesDatabase));
  localStorage.setItem('zyntrix_automation', JSON.stringify(automationRules));
  localStorage.setItem('zyntrix_portal_tokens', JSON.stringify(portalTokens));
}

// ===== PHASE 1: DEAL PIPELINE =====
function renderPipeline() {
  const wrap = document.getElementById('pipeline-board');
  if (!wrap) return;

  wrap.innerHTML = '';
  DEAL_STAGES.forEach(stage => {
    const leadsInStage = leadsDatabase.filter(l => (l.dealStage || 'prospect') === stage);
    const column = document.createElement('div');
    column.className = 'pipeline-column';
    column.innerHTML = `
      <div class="pipeline-header" style="border-top: 3px solid ${STAGE_COLORS[stage]}">
        <h3>${stage.charAt(0).toUpperCase() + stage.slice(1)}</h3>
        <span class="pipeline-count">${leadsInStage.length}</span>
      </div>
      <div class="pipeline-cards" data-stage="${stage}">
        ${leadsInStage.map(lead => `
          <div class="pipeline-card" draggable="true" data-lead-id="${lead.id}" ondragstart="dragStartLead(event)">
            <div class="pipeline-card-name">${lead.name}</div>
            <div class="pipeline-card-meta">${lead.city}, ${lead.state}</div>
            <div class="pipeline-card-amount">💰 Deal</div>
          </div>
        `).join('')}
      </div>
    `;
    wrap.appendChild(column);
  });
  setupDragDrop();
}

function dragStartLead(e) {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('leadId', e.target.closest('.pipeline-card').dataset.leadId);
}

function setupDragDrop() {
  const columns = document.querySelectorAll('.pipeline-cards');
  columns.forEach(col => {
    col.ondragover = (e) => { e.preventDefault(); col.style.backgroundColor = 'rgba(0,200,255,0.1)'; };
    col.ondragleave = () => { col.style.backgroundColor = ''; };
    col.ondrop = (e) => {
      e.preventDefault();
      col.style.backgroundColor = '';
      const leadId = e.dataTransfer.getData('leadId');
      const newStage = col.dataset.stage;
      const lead = leadsDatabase.find(l => l.id === leadId);
      if (lead) {
        lead.dealStage = newStage;
        saveLeads();
        renderPipeline();
      }
    };
  });
}

// ===== PHASE 1: CALENDAR VIEW =====
function renderCalendar() {
  const cal = document.getElementById('calendar-wrap');
  if (!cal) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = lastDay.getDate();
  const startOffset = firstDay.getDay();

  let html = `<div class="calendar-grid">`;

  // Month header
  html += `<div class="calendar-header">${firstDay.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</div>`;

  // Day names
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="calendar-day-header">${d}</div>`;
  });

  // Empty cells
  for (let i = 0; i < startOffset; i++) html += `<div class="calendar-cell empty"></div>`;

  // Days with follow-ups
  for (let day = 1; day <= days; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const followups = leadsDatabase.filter(l => l.followupDate === dateStr);
    html += `
      <div class="calendar-cell ${followups.length ? 'has-followup' : ''}">
        <div class="calendar-date">${day}</div>
        ${followups.length ? `<div class="calendar-count">${followups.length} tasks</div>` : ''}
      </div>
    `;
  }

  html += `</div>`;
  cal.innerHTML = html;
}

// ===== PHASE 1: CUSTOM FIELDS =====
function renderCustomFields() {
  const wrap = document.getElementById('custom-fields-list');
  if (!wrap) return;

  wrap.innerHTML = customFieldsDatabase.map(field => `
    <div class="custom-field-item" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border:1px solid var(--border);border-radius:6px;margin-bottom:0.5rem">
      <div>
        <strong>${field.name}</strong><br>
        <small style="color:var(--text-muted)">${field.type} • ${field.description || 'No description'}</small>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteCustomField('${field.id}')">Delete</button>
    </div>
  `).join('') || '<p style="color:var(--text-muted)">No custom fields yet. Add one below.</p>';
}

function addCustomField() {
  const name = document.getElementById('new-field-name')?.value;
  const type = document.getElementById('new-field-type')?.value;
  const description = document.getElementById('new-field-desc')?.value;

  if (!name || !type) {
    alert('Please fill in name and type');
    return;
  }

  const field = {
    id: 'cf_' + Date.now(),
    name,
    type,
    description,
    createdAt: new Date().toISOString()
  };

  customFieldsDatabase.push(field);
  saveAllData();
  renderCustomFields();

  document.getElementById('new-field-name').value = '';
  document.getElementById('new-field-desc').value = '';

  alert(`Custom field "${name}" added!`);
}

function deleteCustomField(id) {
  if (confirm('Delete this field? Data in leads may be lost.')) {
    customFieldsDatabase = customFieldsDatabase.filter(f => f.id !== id);
    saveAllData();
    renderCustomFields();
  }
}

// ===== PHASE 2: CLIENT MANAGEMENT =====
function renderClients() {
  const wrap = document.getElementById('clients-list');
  if (!wrap) return;

  wrap.innerHTML = clientsDatabase.map(client => `
    <div class="client-card" style="background:var(--surface2);padding:1.5rem;border-radius:12px;border:1px solid var(--border-light);margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <h3 style="margin-bottom:0.5rem">${client.name}</h3>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.75rem">${client.contactPerson || 'No contact'} • ${client.email || 'No email'}</p>
          <div style="display:flex;gap:1rem;font-size:0.85rem">
            <span>📞 ${client.phone || 'N/A'}</span>
            <span>🌐 ${client.website || 'N/A'}</span>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-ghost btn-sm" onclick="editClient('${client.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteClient('${client.id}')">Delete</button>
        </div>
      </div>
      <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-light)">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;font-size:0.9rem">
          <div><strong>Retainers:</strong> ${retainersDatabase.filter(r => r.clientId === client.id).length}</div>
          <div><strong>Status:</strong> <span style="color:#10b981">Active</span></div>
          <div><strong>Services:</strong> ${servicesDatabase.filter(s => s.clientId === client.id).length}</div>
        </div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-muted)">No clients yet. Create one below.</p>';
}

function openClientModal() {
  document.getElementById('client-modal').classList.remove('hidden');
  document.getElementById('client-id').value = '';
  document.getElementById('client-name').value = '';
  document.getElementById('client-email').value = '';
  document.getElementById('client-phone').value = '';
  document.getElementById('client-person').value = '';
  document.getElementById('client-website').value = '';
}

function saveClient() {
  const id = document.getElementById('client-id').value;
  const name = document.getElementById('client-name').value;
  const email = document.getElementById('client-email').value;
  const phone = document.getElementById('client-phone').value;
  const contactPerson = document.getElementById('client-person').value;
  const website = document.getElementById('client-website').value;

  if (!name) { alert('Client name required'); return; }

  if (id) {
    const client = clientsDatabase.find(c => c.id === id);
    if (client) {
      client.name = name;
      client.email = email;
      client.phone = phone;
      client.contactPerson = contactPerson;
      client.website = website;
    }
  } else {
    clientsDatabase.push({
      id: 'client_' + Date.now(),
      name, email, phone, contactPerson, website,
      createdAt: new Date().toISOString()
    });
  }

  saveAllData();
  renderClients();
  document.getElementById('client-modal').classList.add('hidden');
  alert('Client saved!');
}

function editClient(id) {
  const client = clientsDatabase.find(c => c.id === id);
  if (!client) return;
  document.getElementById('client-id').value = client.id;
  document.getElementById('client-name').value = client.name;
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-person').value = client.contactPerson || '';
  document.getElementById('client-website').value = client.website || '';
  document.getElementById('client-modal').classList.remove('hidden');
}

function deleteClient(id) {
  if (confirm('Delete this client? Associated retainers and services will remain.')) {
    clientsDatabase = clientsDatabase.filter(c => c.id !== id);
    saveAllData();
    renderClients();
  }
}

function closeClientModal() {
  document.getElementById('client-modal').classList.add('hidden');
}

// ===== PHASE 2: RETAINER MANAGEMENT =====
function renderRetainers() {
  const wrap = document.getElementById('retainers-list');
  if (!wrap) return;

  let totalMRR = 0;
  let totalARR = 0;
  const activeRetainers = retainersDatabase.filter(r => r.status === 'active');

  activeRetainers.forEach(r => {
    totalMRR += parseFloat(r.amount) || 0;
  });
  totalARR = totalMRR * 12;

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
      <div style="background:rgba(0,200,255,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(0,200,255,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Monthly Recurring Revenue</div>
        <div style="font-size:2rem;font-weight:900;color:var(--accent)">$${totalMRR.toFixed(0)}</div>
      </div>
      <div style="background:rgba(0,200,255,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(0,200,255,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Annual Recurring Revenue</div>
        <div style="font-size:2rem;font-weight:900;color:var(--accent)">$${totalARR.toFixed(0)}</div>
      </div>
      <div style="background:rgba(0,200,255,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(0,200,255,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Active Retainers</div>
        <div style="font-size:2rem;font-weight:900;color:var(--accent)">${activeRetainers.length}</div>
      </div>
    </div>
  `;

  wrap.innerHTML += retainersDatabase.map(r => {
    const client = clientsDatabase.find(c => c.id === r.clientId);
    const renewalDate = new Date(r.renewalDate);
    const today = new Date();
    const daysLeft = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));

    return `
      <div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:1.5rem;margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <h3 style="margin-bottom:0.25rem">${client?.name || 'Unknown Client'}</h3>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">${r.serviceType}</p>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;font-size:0.9rem">
              <div><strong>Amount:</strong> $${r.amount}/month</div>
              <div><strong>Status:</strong> <span style="color:${r.status === 'active' ? '#10b981' : '#ef4444'}">${r.status.toUpperCase()}</span></div>
              <div><strong>Start:</strong> ${new Date(r.startDate).toLocaleDateString()}</div>
              <div><strong>Renewal:</strong> ${renewalDate.toLocaleDateString()} (${daysLeft} days)</div>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-ghost btn-sm" onclick="editRetainer('${r.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRetainer('${r.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openRetainerModal() {
  document.getElementById('retainer-modal').classList.remove('hidden');
  document.getElementById('retainer-id').value = '';
  document.getElementById('retainer-client').value = '';
  document.getElementById('retainer-service').value = '';
  document.getElementById('retainer-amount').value = '';
  document.getElementById('retainer-status').value = 'active';
  document.getElementById('retainer-start').value = new Date().toISOString().split('T')[0];
  document.getElementById('retainer-renewal').value = '';
}

function saveRetainer() {
  const id = document.getElementById('retainer-id').value;
  const clientId = document.getElementById('retainer-client').value;
  const serviceType = document.getElementById('retainer-service').value;
  const amount = parseFloat(document.getElementById('retainer-amount').value);
  const status = document.getElementById('retainer-status').value;
  const startDate = document.getElementById('retainer-start').value;
  const renewalDate = document.getElementById('retainer-renewal').value;

  if (!clientId || !serviceType || !amount || !renewalDate) {
    alert('Please fill all required fields');
    return;
  }

  if (id) {
    const r = retainersDatabase.find(r => r.id === id);
    if (r) {
      r.clientId = clientId;
      r.serviceType = serviceType;
      r.amount = amount;
      r.status = status;
      r.startDate = startDate;
      r.renewalDate = renewalDate;
    }
  } else {
    retainersDatabase.push({
      id: 'ret_' + Date.now(),
      clientId, serviceType, amount, status, startDate, renewalDate,
      createdAt: new Date().toISOString()
    });
  }

  saveAllData();
  renderRetainers();
  document.getElementById('retainer-modal').classList.add('hidden');
  alert('Retainer saved!');
}

function editRetainer(id) {
  const r = retainersDatabase.find(r => r.id === id);
  if (!r) return;
  document.getElementById('retainer-id').value = r.id;
  document.getElementById('retainer-client').value = r.clientId;
  document.getElementById('retainer-service').value = r.serviceType;
  document.getElementById('retainer-amount').value = r.amount;
  document.getElementById('retainer-status').value = r.status;
  document.getElementById('retainer-start').value = r.startDate;
  document.getElementById('retainer-renewal').value = r.renewalDate;
  document.getElementById('retainer-modal').classList.remove('hidden');
}

function deleteRetainer(id) {
  if (confirm('Delete this retainer?')) {
    retainersDatabase = retainersDatabase.filter(r => r.id !== id);
    saveAllData();
    renderRetainers();
  }
}

function closeRetainerModal() {
  document.getElementById('retainer-modal').classList.add('hidden');
}

// ===== PHASE 2: SERVICE TRACKING =====
function renderServices() {
  const wrap = document.getElementById('services-list');
  if (!wrap) return;

  wrap.innerHTML = servicesDatabase.map(s => {
    const client = clientsDatabase.find(c => c.id === s.clientId);
    const percent = s.totalHours ? Math.round((s.hoursUsed / s.totalHours) * 100) : 0;

    return `
      <div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:1.5rem;margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
          <div>
            <h3 style="margin-bottom:0.25rem">${s.name}</h3>
            <p style="color:var(--text-muted);font-size:0.85rem">${client?.name || 'Unknown'}</p>
          </div>
          <span style="background:${s.status === 'completed' ? '#10b981' : s.status === 'in-progress' ? '#f59e0b' : '#6b7280'};color:white;padding:0.4rem 0.8rem;border-radius:6px;font-size:0.8rem;font-weight:600">${s.status.toUpperCase()}</span>
        </div>
        <p style="color:var(--text-muted);margin-bottom:1rem;font-size:0.9rem">${s.description}</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem;font-size:0.85rem">
          <div><strong>Due:</strong> ${new Date(s.dueDate).toLocaleDateString()}</div>
          <div><strong>Hours:</strong> ${s.hoursUsed}/${s.totalHours}h (${percent}%)</div>
          <div><strong>Created:</strong> ${new Date(s.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="background:var(--surface2);height:8px;border-radius:4px;margin-bottom:1rem;overflow:hidden">
          <div style="background:var(--accent);height:100%;width:${percent}%;transition:width 0.3s"></div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-ghost btn-sm" onclick="editService('${s.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-muted)">No services yet. Create one below.</p>';
}

function openServiceModal() {
  document.getElementById('service-modal').classList.remove('hidden');
  document.getElementById('service-id').value = '';
  document.getElementById('service-client').value = '';
  document.getElementById('service-name').value = '';
  document.getElementById('service-desc').value = '';
  document.getElementById('service-status').value = 'pending';
  document.getElementById('service-due').value = '';
  document.getElementById('service-hours').value = '';
  document.getElementById('service-used').value = '';
}

function saveService() {
  const id = document.getElementById('service-id').value;
  const clientId = document.getElementById('service-client').value;
  const name = document.getElementById('service-name').value;
  const description = document.getElementById('service-desc').value;
  const status = document.getElementById('service-status').value;
  const dueDate = document.getElementById('service-due').value;
  const totalHours = parseFloat(document.getElementById('service-hours').value) || 0;
  const hoursUsed = parseFloat(document.getElementById('service-used').value) || 0;

  if (!clientId || !name || !dueDate) {
    alert('Please fill required fields');
    return;
  }

  if (id) {
    const svc = servicesDatabase.find(s => s.id === id);
    if (svc) {
      svc.clientId = clientId;
      svc.name = name;
      svc.description = description;
      svc.status = status;
      svc.dueDate = dueDate;
      svc.totalHours = totalHours;
      svc.hoursUsed = hoursUsed;
    }
  } else {
    servicesDatabase.push({
      id: 'svc_' + Date.now(),
      clientId, name, description, status, dueDate, totalHours, hoursUsed,
      createdAt: new Date().toISOString()
    });
  }

  saveAllData();
  renderServices();
  document.getElementById('service-modal').classList.add('hidden');
  alert('Service saved!');
}

function editService(id) {
  const svc = servicesDatabase.find(s => s.id === id);
  if (!svc) return;
  document.getElementById('service-id').value = svc.id;
  document.getElementById('service-client').value = svc.clientId;
  document.getElementById('service-name').value = svc.name;
  document.getElementById('service-desc').value = svc.description;
  document.getElementById('service-status').value = svc.status;
  document.getElementById('service-due').value = svc.dueDate;
  document.getElementById('service-hours').value = svc.totalHours;
  document.getElementById('service-used').value = svc.hoursUsed;
  document.getElementById('service-modal').classList.remove('hidden');
}

function deleteService(id) {
  if (confirm('Delete this service?')) {
    servicesDatabase = servicesDatabase.filter(s => s.id !== id);
    saveAllData();
    renderServices();
  }
}

function closeServiceModal() {
  document.getElementById('service-modal').classList.add('hidden');
}
// ===== PHASE 3A: INVOICING & PAYMENTS =====
function renderInvoices() {
  const wrap = document.getElementById('invoices-list');
  if (!wrap) return;

  const stats = {
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  };

  invoicesDatabase.forEach(inv => {
    stats.total += parseFloat(inv.amount) || 0;
    if (inv.status === 'paid') stats.paid += parseFloat(inv.amount) || 0;
    if (['sent', 'draft'].includes(inv.status)) stats.pending += parseFloat(inv.amount) || 0;
    if (inv.status === 'overdue') stats.overdue += parseFloat(inv.amount) || 0;
  });

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem">
      <div style="background:rgba(0,200,255,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(0,200,255,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Total Revenue</div>
        <div style="font-size:2rem;font-weight:900;color:var(--accent)">$${stats.total.toFixed(0)}</div>
      </div>
      <div style="background:rgba(16,185,129,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(16,185,129,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Paid</div>
        <div style="font-size:2rem;font-weight:900;color:#10b981">$${stats.paid.toFixed(0)}</div>
      </div>
      <div style="background:rgba(245,158,11,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(245,158,11,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Pending</div>
        <div style="font-size:2rem;font-weight:900;color:#f59e0b">$${stats.pending.toFixed(0)}</div>
      </div>
      <div style="background:rgba(239,68,68,0.1);padding:1.5rem;border-radius:12px;border:1px solid rgba(239,68,68,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">Overdue</div>
        <div style="font-size:2rem;font-weight:900;color:#ef4444">$${stats.overdue.toFixed(0)}</div>
      </div>
    </div>
  ` + invoicesDatabase.map(inv => {
    const client = clientsDatabase.find(c => c.id === inv.clientId);
    const dueDate = new Date(inv.dueDate);
    const today = new Date();
    const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

    return `
      <div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:1.5rem;margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <h3 style="margin-bottom:0.25rem">${inv.invoiceNumber}</h3>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">${client?.name || 'Unknown'}</p>
          </div>
          <span style="background:${inv.status === 'paid' ? '#10b981' : inv.status === 'overdue' ? '#ef4444' : '#f59e0b'};color:white;padding:0.4rem 0.8rem;border-radius:6px;font-size:0.8rem;font-weight:600">${inv.status.toUpperCase()}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem;font-size:0.9rem">
          <div><strong>Amount:</strong> $${inv.amount}</div>
          <div><strong>Due:</strong> ${dueDate.toLocaleDateString()}</div>
          <div><strong>Issued:</strong> ${new Date(inv.issuedDate).toLocaleDateString()}</div>
          <div><strong>${inv.status === 'overdue' ? 'Overdue: ' + daysOverdue + ' days' : 'Due in: ' + Math.max(0, Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))) + ' days'}</strong></div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-ghost btn-sm" onclick="viewInvoice('${inv.id}')">View</button>
          <button class="btn btn-ghost btn-sm" onclick="editInvoice('${inv.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="sendInvoice('${inv.id}')">Send</button>
          <button class="btn btn-ghost btn-sm" onclick="markPaid('${inv.id}')">Mark Paid</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${inv.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-muted)">No invoices yet.</p>';
}

function openInvoiceModal() {
  document.getElementById('invoice-modal').classList.remove('hidden');
  document.getElementById('invoice-id').value = '';
  document.getElementById('invoice-client').value = '';
  document.getElementById('invoice-retainer').value = '';
  document.getElementById('invoice-amount').value = '';
  document.getElementById('invoice-due').value = new Date().toISOString().split('T')[0];
  document.getElementById('invoice-notes').value = '';
}

function saveInvoice() {
  const id = document.getElementById('invoice-id').value;
  const clientId = document.getElementById('invoice-client').value;
  const retainerId = document.getElementById('invoice-retainer').value;
  const amount = parseFloat(document.getElementById('invoice-amount').value);
  const dueDate = document.getElementById('invoice-due').value;
  const notes = document.getElementById('invoice-notes').value;

  if (!clientId || !amount || !dueDate) {
    alert('Please fill required fields');
    return;
  }

  if (id) {
    const inv = invoicesDatabase.find(i => i.id === id);
    if (inv) {
      inv.clientId = clientId;
      inv.retainerId = retainerId;
      inv.amount = amount;
      inv.dueDate = dueDate;
      inv.notes = notes;
    }
  } else {
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + String(invoicesDatabase.length + 1).padStart(4, '0');
    invoicesDatabase.push({
      id: 'inv_' + Date.now(),
      invoiceNumber,
      clientId,
      retainerId,
      amount,
      dueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      notes,
      createdAt: new Date().toISOString()
    });
  }

  saveAllData();
  renderInvoices();
  document.getElementById('invoice-modal').classList.add('hidden');
  alert('Invoice saved!');
}

function sendInvoice(id) {
  const inv = invoicesDatabase.find(i => i.id === id);
  if (!inv) return;
  inv.status = 'sent';
  inv.sentDate = new Date().toISOString().split('T')[0];
  saveAllData();
  renderInvoices();
  alert('Invoice marked as sent!');
}

function markPaid(id) {
  const inv = invoicesDatabase.find(i => i.id === id);
  if (!inv) return;
  inv.status = 'paid';
  inv.paidDate = new Date().toISOString().split('T')[0];
  saveAllData();
  renderInvoices();
  alert('Invoice marked as paid!');
}

function deleteInvoice(id) {
  if (confirm('Delete this invoice?')) {
    invoicesDatabase = invoicesDatabase.filter(i => i.id !== id);
    saveAllData();
    renderInvoices();
  }
}

function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.add('hidden');
}

function viewInvoice(id) {
  const inv = invoicesDatabase.find(i => i.id === id);
  const client = clientsDatabase.find(c => c.id === inv.clientId);
  if (!inv) return;
  alert(`Invoice: ${inv.invoiceNumber}\nClient: ${client?.name}\nAmount: $${inv.amount}\nDue: ${inv.dueDate}\nStatus: ${inv.status}`);
}

function editInvoice(id) {
  const inv = invoicesDatabase.find(i => i.id === id);
  if (!inv) return;
  document.getElementById('invoice-id').value = inv.id;
  document.getElementById('invoice-client').value = inv.clientId;
  document.getElementById('invoice-retainer').value = inv.retainerId || '';
  document.getElementById('invoice-amount').value = inv.amount;
  document.getElementById('invoice-due').value = inv.dueDate;
  document.getElementById('invoice-notes').value = inv.notes || '';
  document.getElementById('invoice-modal').classList.remove('hidden');
}

function renderReporting() {
  const wrap = document.getElementById('reporting-wrap');
  if (!wrap) return;

  const mRR = retainersDatabase.filter(r => r.status === 'active').reduce((a,r) => a + parseFloat(r.amount), 0);
  const aRR = mRR * 12;
  const totalRevenue = invoicesDatabase.filter(i => i.status === 'paid').reduce((a,i) => a + parseFloat(i.amount), 0);
  const pendingRevenue = invoicesDatabase.filter(i => i.status !== 'paid').reduce((a,i) => a + parseFloat(i.amount), 0);

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
      <div style="background:rgba(16,185,129,0.1);padding:2rem;border-radius:12px;border:1px solid rgba(16,185,129,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px">MRR</div>
        <div style="font-size:2.5rem;font-weight:900;color:#10b981">$${mRR.toFixed(0)}</div>
      </div>
      <div style="background:rgba(59,182,250,0.1);padding:2rem;border-radius:12px;border:1px solid rgba(59,182,250,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px">ARR</div>
        <div style="font-size:2.5rem;font-weight:900;color:#3bb6fa">$${aRR.toFixed(0)}</div>
      </div>
      <div style="background:rgba(245,158,11,0.1);padding:2rem;border-radius:12px;border:1px solid rgba(245,158,11,0.3)">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px">Pending</div>
        <div style="font-size:2.5rem;font-weight:900;color:#f59e0b">$${pendingRevenue.toFixed(0)}</div>
      </div>
    </div>
    <div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:2rem">
      <h3>Summary</h3>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:1rem;font-size:0.95rem">
        <li><strong>Total Clients:</strong> ${clientsDatabase.length}</li>
        <li><strong>Total Revenue (Paid):</strong> $${totalRevenue.toFixed(0)}</li>
        <li><strong>Pending Revenue:</strong> $${pendingRevenue.toFixed(0)}</li>
      </ul>
    </div>
  `;
}
