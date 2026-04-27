/* ============================================
   MAIN — SPA Router & Bootstrap
   ============================================ */

import DB from './storage.js';
import { renderLoginPage, renderRegisterPage, logout, getCurrentUser } from './auth.js';
import { renderVoterDashboard, renderVotingBooth, renderVotingHistory, cleanupVoter } from './voter.js';
import { renderAdminDashboard, renderCreateElection, renderVotersList } from './admin.js';
import { renderResults } from './results.js';

// ── Seed demo data on first load ──
await DB.seed();

// ── Navigation helper (global) ──
window.navigateTo = function (hash) {
  window.location.hash = hash;
};

// ── Update Navbar ──
function updateNavbar() {
  const user = getCurrentUser();
  const actions = document.getElementById('navbar-actions');
  if (!actions) return;

  if (user) {
    actions.innerHTML = `
      <div class="navbar-user">
        <div class="navbar-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <span class="navbar-username">${user.name}</span>
        <span class="badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}">${user.role}</span>
        <button class="btn btn-ghost btn-sm" id="logout-btn" onclick="window._logout()">Sign Out</button>
      </div>
    `;
  } else {
    actions.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="window.navigateTo('#/login')">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="window.navigateTo('#/register')">Register</button>
    `;
  }
}

window._logout = function () {
  logout();
};

// ── Router ──
async function router() {
  const hash = window.location.hash || '#/login';

  // Cleanup voter timers on every navigation
  if (typeof cleanupVoter === 'function') cleanupVoter();

  updateNavbar();

  // Route matching — order matters
  if (hash === '#/' || hash === '#/login' || hash === '') {
    renderLoginPage();
  } else if (hash === '#/register') {
    renderRegisterPage();
  } else if (hash === '#/voter') {
    await renderVoterDashboard();
  } else if (hash === '#/history') {
    await renderVotingHistory();
  } else if (hash.startsWith('#/vote/')) {
    const electionId = hash.replace('#/vote/', '');
    await renderVotingBooth(electionId);
  } else if (hash === '#/admin') {
    await renderAdminDashboard();
  } else if (hash === '#/admin/voters') {
    await renderVotersList();
  } else if (hash === '#/admin/create') {
    await renderCreateElection();
  } else if (hash.startsWith('#/results/')) {
    const electionId = hash.replace('#/results/', '');
    await renderResults(electionId);
  } else {
    // 404
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state" style="margin-top: 20vh;">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">Page Not Found</h3>
        <p class="empty-state-text">The page you're looking for doesn't exist.</p>
        <button class="btn btn-primary" onclick="window.navigateTo('#/login')">Go Home</button>
      </div>
    `;
  }
}

// ── Listen for hash changes ──
window.addEventListener('hashchange', router);

// ── Initial load ──
router();
