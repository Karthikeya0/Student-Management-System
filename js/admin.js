/* ============================================
   ADMIN — Admin Dashboard UI
   ============================================ */

import DB from './storage.js';
import { requireAuth } from './auth.js';
import {
  getAllElections, createElection, startElection,
  endElection, deleteElection, getOverallStats, getElectionStats
} from './elections.js';
import {
  formatDate, formatDateTime, showToast, getInitials,
  getAvatarColor, generateId, exportCSV
} from './utils.js';

const API_BASE = 'http://127.0.0.1:3000/api';

// ── Render Admin Dashboard ──
export async function renderAdminDashboard() {
  const user = requireAuth('admin');
  if (!user) return;

  const stats = await getOverallStats();
  const elections = await getAllElections();
  const main = document.getElementById('main-content');
  
  // Pre-fetch stats for each election to render cards synchronously later
  const electionCardsHtml = await Promise.all(elections.map(async (el) => {
    const elStats = await getElectionStats(el.id);
    return renderAdminElectionCard(el, elStats);
  }));

  main.innerHTML = `
    <div class="page-enter">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>🛡️ Admin Dashboard</h1>
          <p class="dashboard-greeting">Welcome back, <strong>${user.name}</strong></p>
        </div>
        <button class="btn btn-primary" onclick="window.navigateTo('#/admin/create')">
          ➕ Create Election
        </button>
      </div>

      <div class="stats-row stagger-children">
        <div class="stat-card">
          <div class="stat-card-icon blue">📊</div>
          <div class="stat-card-value">${stats.totalElections}</div>
          <div class="stat-card-label">Total Elections</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon green">✅</div>
          <div class="stat-card-value">${stats.activeElections}</div>
          <div class="stat-card-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon purple">🏁</div>
          <div class="stat-card-value">${stats.completedElections}</div>
          <div class="stat-card-label">Completed</div>
        </div>
        <div class="stat-card" onclick="window.navigateTo('#/admin/voters')" style="cursor:pointer; transition: transform 0.15s; border: 1px solid transparent;" onmouseover="this.style.borderColor='rgba(139,92,246,0.4)'" onmouseout="this.style.borderColor='transparent'">
          <div class="stat-card-icon amber">👥</div>
          <div class="stat-card-value">${stats.totalVoters}</div>
          <div class="stat-card-label">Registered Voters</div>
          <div style="font-size:0.7rem; color: var(--accent-purple); margin-top:4px;">Click to view →</div>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">📋 All Elections</h2>
          <span class="badge badge-blue">${elections.length} total</span>
        </div>
        ${elections.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🗳️</div>
            <h3 class="empty-state-title">No Elections Yet</h3>
            <p class="empty-state-text">Create your first election to get started.</p>
            <button class="btn btn-primary" onclick="window.navigateTo('#/admin/create')">Create Election</button>
          </div>
        ` : `
          <div class="elections-grid stagger-children">
            ${electionCardsHtml.join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderAdminElectionCard(election, stats) {
  const statusBadge = {
    draft: '<span class="badge badge-amber">📝 Draft</span>',
    active: '<span class="badge badge-green">🟢 Active</span>',
    completed: '<span class="badge badge-blue">🏁 Completed</span>',
  };

  return `
    <div class="election-card status-${election.status}">
      <div class="election-card-header">
        <div>
          <div class="election-card-title">${election.title}</div>
          ${statusBadge[election.status]}
        </div>
      </div>
      <p class="election-card-desc">${election.description}</p>
      <div class="election-card-meta">
        <span class="election-meta-item">👥 ${election.candidates.length} candidates</span>
        <span class="election-meta-item">🗳️ ${stats ? stats.totalVotes : 0} votes</span>
        <span class="election-meta-item">📅 ${formatDate(election.startDate)} — ${formatDate(election.endDate)}</span>
      </div>
      <div class="election-card-actions">
        ${election.status === 'draft' ? `
          <button class="btn btn-success btn-sm" onclick="window.adminAction('start', '${election.id}')">▶ Start</button>
          <button class="btn btn-danger btn-sm" onclick="window.adminAction('delete', '${election.id}')">🗑 Delete</button>
        ` : ''}
        ${election.status === 'active' ? `
          <button class="btn btn-danger btn-sm" onclick="window.adminAction('end', '${election.id}')">⏹ End</button>
        ` : ''}
        ${election.status === 'completed' ? `
          <button class="btn btn-primary btn-sm" onclick="window.navigateTo('#/results/${election.id}')">📊 Results</button>
          <button class="btn btn-ghost btn-sm" onclick="window.adminAction('export', '${election.id}')">📥 Export</button>
        ` : ''}
        ${election.status !== 'draft' ? `
          <button class="btn btn-ghost btn-sm" onclick="window.navigateTo('#/results/${election.id}')">👁 View</button>
        ` : ''}
      </div>
    </div>
  `;
}

// ── Admin Actions ──
window.adminAction = async function(action, electionId) {
  try {
    switch (action) {
      case 'start':
        await startElection(electionId);
        showToast('Election started successfully!', 'success');
        await renderAdminDashboard();
        break;
      case 'end':
        if (confirm('Are you sure you want to end this election? This cannot be undone.')) {
          await endElection(electionId);
          showToast('Election ended', 'info');
          await renderAdminDashboard();
        }
        break;
      case 'delete':
        if (confirm('Delete this election? All votes will be lost.')) {
          await deleteElection(electionId);
          showToast('Election deleted', 'warning');
          await renderAdminDashboard();
        }
        break;
      case 'export':
        const stats = await getElectionStats(electionId);
        const election = await DB.findElectionById(electionId);
        if (stats && election) {
          const data = stats.candidates.map(c => ({
            Rank: c.rank,
            Name: c.name,
            Party: c.party,
            Votes: c.votes,
            Percentage: c.percentage + '%',
          }));
          exportCSV(data, `${election.title.replace(/\\s+/g, '_')}_results.csv`);
          showToast('Results exported as CSV', 'success');
        }
        break;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ── Render Create Election ──
export async function renderCreateElection() {
  const user = requireAuth('admin');
  if (!user) return;

  const main = document.getElementById('main-content');
  window._tempCandidates = [];

  main.innerHTML = `
    <div class="page-enter create-form">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>➕ Create New Election</h1>
          <p>Set up a new election with candidates</p>
        </div>
        <button class="btn btn-ghost" onclick="window.navigateTo('#/admin')">← Back</button>
      </div>

      <div class="card mb-6">
        <h3 class="card-title mb-4">Election Details</h3>
        <form id="election-form">
          <div class="form-group">
            <label class="form-label" for="el-title">Election Title</label>
            <input type="text" class="form-input" id="el-title" placeholder="e.g. Student Council President 2026" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="el-desc">Description</label>
            <textarea class="form-textarea" id="el-desc" placeholder="Describe what this election is about..." required></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div class="form-group">
              <label class="form-label" for="el-start">Start Date</label>
              <input type="datetime-local" class="form-input" id="el-start" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="el-end">End Date</label>
              <input type="datetime-local" class="form-input" id="el-end" required>
            </div>
          </div>
        </form>
      </div>

      <div class="card mb-6">
        <h3 class="card-title mb-4">Candidates</h3>
        <div id="candidates-list" class="candidate-list"></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--space-3); align-items: end;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="cnd-name">Name</label>
            <input type="text" class="form-input" id="cnd-name" placeholder="Candidate name">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="cnd-party">Party / Category</label>
            <input type="text" class="form-input" id="cnd-party" placeholder="Party or category">
          </div>
          <button type="button" class="btn btn-outline" onclick="window.addTempCandidate()" style="height: 46px;">+ Add</button>
        </div>
        <span class="form-hint mt-4" style="display: block;">Minimum 2 candidates required</span>
      </div>

      <div class="flex gap-3">
        <button class="btn btn-primary btn-lg" onclick="window.submitElection()">Create Election</button>
        <button class="btn btn-ghost btn-lg" onclick="window.navigateTo('#/admin')">Cancel</button>
      </div>
    </div>
  `;
}

window._tempCandidates = [];

window.addTempCandidate = function() {
  const name = document.getElementById('cnd-name').value.trim();
  const party = document.getElementById('cnd-party').value.trim();
  if (!name) { showToast('Enter candidate name', 'warning'); return; }

  window._tempCandidates.push({ name, party: party || 'Independent', color: getAvatarColor(window._tempCandidates.length) });
  document.getElementById('cnd-name').value = '';
  document.getElementById('cnd-party').value = '';

  renderCandidatesList();
  showToast(`${name} added`, 'success');
};

window.removeTempCandidate = function(idx) {
  window._tempCandidates.splice(idx, 1);
  renderCandidatesList();
};

function renderCandidatesList() {
  const list = document.getElementById('candidates-list');
  if (!list) return;

  list.innerHTML = window._tempCandidates.map((c, i) => `
    <div class="candidate-item">
      <div class="candidate-avatar-sm" style="background: ${c.color}">${getInitials(c.name)}</div>
      <div class="candidate-item-info">
        <div class="candidate-item-name">${c.name}</div>
        <div class="candidate-item-party">${c.party}</div>
      </div>
      <button class="candidate-remove" onclick="window.removeTempCandidate(${i})">✕</button>
    </div>
  `).join('');
}

window.submitElection = async function() {
  const title = document.getElementById('el-title').value.trim();
  const description = document.getElementById('el-desc').value.trim();
  const startDate = document.getElementById('el-start').value;
  const endDate = document.getElementById('el-end').value;

  if (!title || !description || !startDate || !endDate) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (window._tempCandidates.length < 2) {
    showToast('Add at least 2 candidates', 'error');
    return;
  }

  if (new Date(endDate) <= new Date(startDate)) {
    showToast('End date must be after start date', 'error');
    return;
  }

  try {
    await createElection({
      title,
      description,
      candidates: window._tempCandidates,
      startDate,
      endDate,
    });
    showToast('Election created successfully!', 'success');
    window._tempCandidates = [];
    window.navigateTo('#/admin');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ── Render Registered Voters List ──
export async function renderVotersList() {
  const user = requireAuth('admin');
  if (!user) return;

  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading voters...</p></div>`;

  const [usersRes, votesRes] = await Promise.all([
    fetch(`${API_BASE}/users`),
    fetch(`${API_BASE}/votes`),
  ]);
  const allUsers = await usersRes.json();
  const allVotes = await votesRes.json();
  const voters = allUsers.filter(u => u.role === 'voter');

  const activeVotersCount = new Set(allVotes.map(v => v.voterId)).size;
  const turnoutPct = voters.length > 0 ? Math.round((activeVotersCount / voters.length) * 100) : 0;

  main.innerHTML = `
    <div class="page-enter">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>👥 Registered Voters</h1>
          <p>All voters registered in the system</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-outline btn-sm" onclick="window.adminExportVoters()">📥 Export CSV</button>
          <button class="btn btn-ghost" onclick="window.navigateTo('#/admin')">← Back</button>
        </div>
      </div>

      <div class="stats-row stagger-children" style="grid-template-columns: repeat(3,1fr); max-width: 640px;">
        <div class="stat-card">
          <div class="stat-card-icon blue">📋</div>
          <div class="stat-card-value">${voters.length}</div>
          <div class="stat-card-label">Total Registered</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon green">🗳️</div>
          <div class="stat-card-value">${allVotes.length}</div>
          <div class="stat-card-label">Total Votes Cast</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon purple">📊</div>
          <div class="stat-card-value">${turnoutPct}%</div>
          <div class="stat-card-label">Voter Turnout</div>
        </div>
      </div>

      ${voters.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <h3 class="empty-state-title">No Voters Registered</h3>
          <p class="empty-state-text">No voters have signed up yet.</p>
        </div>
      ` : `
        <div class="card" style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:var(--text-sm);">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle); text-align:left;">
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">#</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Name</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Email</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Voter ID</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Votes Cast</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Registered</th>
                <th style="padding:var(--space-3) var(--space-4); color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${voters.map((v, i) => {
                const voteCount = allVotes.filter(vote => vote.voterId === v.id).length;
                const initials = getInitials(v.name);
                const color = getAvatarColor(i);
                const regDate = v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
                return `
                  <tr style="border-bottom:1px solid var(--border-subtle); transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:var(--space-3) var(--space-4); color:var(--text-muted);">${i + 1}</td>
                    <td style="padding:var(--space-3) var(--space-4);">
                      <div style="display:flex; align-items:center; gap:var(--space-3);">
                        <div style="width:34px; height:34px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:white; flex-shrink:0;">${initials}</div>
                        <span style="font-weight:500; color:var(--text-primary);">${v.name}</span>
                      </div>
                    </td>
                    <td style="padding:var(--space-3) var(--space-4); color:var(--text-secondary);">${v.email}</td>
                    <td style="padding:var(--space-3) var(--space-4);">
                      <code style="background:var(--bg-subtle); padding:2px 8px; border-radius:4px; font-size:0.73rem; color:var(--accent-purple);">${v.voterId}</code>
                    </td>
                    <td style="padding:var(--space-3) var(--space-4); font-weight:600; color:${voteCount > 0 ? 'var(--accent-green)' : 'var(--text-muted)'};">${voteCount}</td>
                    <td style="padding:var(--space-3) var(--space-4); color:var(--text-muted);">${regDate}</td>
                    <td style="padding:var(--space-3) var(--space-4);">
                      ${voteCount > 0
                        ? '<span class="badge badge-green">✅ Voted</span>'
                        : '<span class="badge badge-amber">⏳ Not Voted</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  window.adminExportVoters = function() {
    const data = voters.map((v, i) => ({
      '#': i + 1,
      Name: v.name,
      Email: v.email,
      'Voter ID': v.voterId,
      'Votes Cast': allVotes.filter(vote => vote.voterId === v.id).length,
      'Registered On': v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '',
      Status: allVotes.some(vote => vote.voterId === v.id) ? 'Voted' : 'Not Voted',
    }));
    exportCSV(data, 'registered_voters.csv');
    showToast('Voters list exported as CSV', 'success');
  };
}
