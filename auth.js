// ZyntrixLeads Authentication System
// © 2026 ZyntrixLeads. All rights reserved.

const AUTH_CONFIG = {
  admin: {
    email: 'zyntrixautomation@gmail.com',
    password: 'LeadsAPP2001$',
    role: 'ADMIN'
  }
};

let currentUser = null;

function initAuth() {
  const stored = localStorage.getItem('zynt_user_session');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      showApp();
    } catch (e) {
      showLogin();
    }
  } else {
    showLogin();
  }
}

function handleLogin() {
  const email = document.getElementById('login-email')?.value || '';
  const password = document.getElementById('login-password')?.value || '';
  const errorMsg = document.getElementById('login-error');

  if (!email || !password) {
    if (errorMsg) errorMsg.textContent = 'Please enter email and password';
    if (errorMsg) errorMsg.style.display = 'block';
    return;
  }

  // Check credentials
  if (email === AUTH_CONFIG.admin.email && password === AUTH_CONFIG.admin.password) {
    currentUser = {
      email: AUTH_CONFIG.admin.email,
      role: 'ADMIN',
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('zynt_user_session', JSON.stringify(currentUser));
    showApp();
    initializeApp();
  } else {
    // Guest/User mode (read-only)
    currentUser = {
      email: email,
      role: 'VIEWER',
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('zynt_user_session', JSON.stringify(currentUser));
    showApp();
    initializeApp();
    lockViewerMode();
  }
}

function showLogin() {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  if (loginContainer) loginContainer.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'none';
}

function showApp() {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  if (loginContainer) loginContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'block';
  updateUserBadge();
}

function lockViewerMode() {
  // Hide admin-only features
  const editButtons = document.querySelectorAll('[data-admin-only]');
  editButtons.forEach(btn => btn.style.display = 'none');

  // Disable settings
  const settingsBtn = document.querySelector('[data-tab="settings"]');
  if (settingsBtn) settingsBtn.style.display = 'none';

  // Add viewer mode indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: rgba(248, 113, 113, 0.15);
    border: 1px solid rgba(248, 113, 113, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    color: #f87171;
    z-index: 1000;
    backdrop-filter: blur(10px);
  `;
  indicator.textContent = '👁️ PREVIEW MODE - Read-only';
  document.body.appendChild(indicator);
}

function updateUserBadge() {
  let badge = document.getElementById('user-role-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'user-role-badge';
    badge.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: rgba(0, 200, 255, 0.1);
      border: 1px solid rgba(0, 200, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #00c8ff;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(badge);
  }

  const icon = currentUser.role === 'ADMIN' ? '🔐' : '👁️';
  const mode = currentUser.role === 'ADMIN' ? 'ADMIN MODE' : 'PREVIEW MODE';
  badge.innerHTML = `${icon} ${mode} <button onclick="handleLogout()" style="background:none;border:none;color:#00c8ff;cursor:pointer;font-size:0.8rem;margin-left:0.5rem">Logout</button>`;
}

function handleLogout() {
  localStorage.removeItem('zynt_user_session');
  currentUser = null;
  showLogin();
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function isAdmin() {
  return currentUser && currentUser.role === 'ADMIN';
}

function checkAdminAccess(action) {
  if (!isAdmin()) {
    alert(`⚠️ This action (${action}) is only available in Admin mode. You're currently in Preview mode.`);
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);
