/* ============================================
   VOTER — Dashboard, Voting Booth, History
   ============================================ */

import DB from './storage.js';
import { requireAuth } from './auth.js';
import { getActiveElections, getCompletedElections, getElectionById, getElectionStats } from './elections.js';
import {
  formatDate, formatDateTime, formatTimeAgo, getCountdown,
  showToast, getInitials, generateId, generateReceiptCode, launchConfetti
} from './utils.js';

let countdownInterval = null;

// ── Render Voter Dashboard ──
export async function renderVoterDashboard() {
  const user = requireAuth('voter');
  if (!user) return;

  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  const activeElections = await getActiveElections();
  const completedElections = await getCompletedElections();
  const myVotes = await DB.getVotesByUser(user.id);
  const main = document.getElementById('main-content');
  
  const hasVoted = (elId) => myVotes.some(v => v.electionId === elId);
  const pendingVotesCount = activeElections.filter(e => !hasVoted(e.id)).length;

  main.innerHTML = `
    <div class="page-enter">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>🗳️ Voter Dashboard</h1>
          <p class="dashboard-greeting">Welcome, <strong>${user.name}</strong> · Voter ID: <code>${user.voterId}</code></p>
        </div>
        <button class="btn btn-ghost" onclick="window.navigateTo('#/history')">📜 My Voting History</button>
      </div>

      <div class="stats-row stagger-children">
        <div class="stat-card">
          <div class="stat-card-icon green">🟢</div>
          <div class="stat-card-value">${activeElections.length}</div>
          <div class="stat-card-label">Active Elections</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon blue">🗳️</div>
          <div class="stat-card-value">${myVotes.length}</div>
          <div class="stat-card-label">Votes Cast</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon purple">🏁</div>
          <div class="stat-card-value">${completedElections.length}</div>
          <div class="stat-card-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon amber">⏳</div>
          <div class="stat-card-value">${pendingVotesCount}</div>
          <div class="stat-card-label">Pending Votes</div>
        </div>
      </div>

      ${activeElections.length > 0 ? `
        <div class="dashboard-section">
          <div class="section-header">
            <h2 class="section-title">🟢 Active Elections</h2>
          </div>
          <div class="elections-grid stagger-children">
            ${activeElections.map(el => renderVoterElectionCard(el, hasVoted(el.id))).join('')}
          </div>
        </div>
      ` : ''}

      ${completedElections.length > 0 ? `
        <div class="dashboard-section">
          <div class="section-header">
            <h2 class="section-title">🏁 Completed Elections</h2>
          </div>
          <div class="elections-grid stagger-children">
            ${completedElections.map(el => `
              <div class="election-card status-completed">
                <div class="election-card-header">
                  <div>
                    <div class="election-card-title">${el.title}</div>
                    <span class="badge badge-blue">🏁 Completed</span>
                  </div>
                </div>
                <p class="election-card-desc">${el.description}</p>
                <div class="election-card-actions">
                  <button class="btn btn-primary btn-sm" onclick="window.navigateTo('#/results/${el.id}')">📊 View Results</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${activeElections.length === 0 && completedElections.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🗳️</div>
          <h3 class="empty-state-title">No Elections Available</h3>
          <p class="empty-state-text">No elections have been created yet. Check back later!</p>
        </div>
      ` : ''}
    </div>
  `;

  // Start countdown timers
  startCountdownTimers();
}

function renderVoterElectionCard(election, hasVotedStatus) {
  const countdown = getCountdown(election.endDate);

  return `
    <div class="election-card status-active">
      <div class="election-card-header">
        <div>
          <div class="election-card-title">${election.title}</div>
          ${hasVotedStatus
            ? '<span class="badge badge-green">✅ Voted</span>'
            : '<span class="badge badge-amber">⏳ Pending</span>'
          }
        </div>
      </div>
      <p class="election-card-desc">${election.description}</p>
      <div class="election-card-meta">
        <span class="election-meta-item">👥 ${election.candidates.length} candidates</span>
        <span class="election-meta-item">📅 Ends ${formatDate(election.endDate)}</span>
      </div>
      <div class="countdown" data-end="${election.endDate}">
        <div class="countdown-item"><span class="countdown-value" data-unit="days">${String(countdown.days).padStart(2, '0')}</span><span class="countdown-label">Days</span></div>
        <div class="countdown-item"><span class="countdown-value" data-unit="hours">${String(countdown.hours).padStart(2, '0')}</span><span class="countdown-label">Hours</span></div>
        <div class="countdown-item"><span class="countdown-value" data-unit="minutes">${String(countdown.minutes).padStart(2, '0')}</span><span class="countdown-label">Min</span></div>
        <div class="countdown-item"><span class="countdown-value" data-unit="seconds">${String(countdown.seconds).padStart(2, '0')}</span><span class="countdown-label">Sec</span></div>
      </div>
      <div class="election-card-actions" style="margin-top: var(--space-4);">
        ${hasVotedStatus
          ? `<button class="btn btn-ghost btn-sm" onclick="window.navigateTo('#/results/${election.id}')">📊 View Results</button>`
          : `<button class="btn btn-primary btn-sm" onclick="window.navigateTo('#/vote/${election.id}')">🗳️ Vote Now</button>`
        }
      </div>
    </div>
  `;
}

function startCountdownTimers() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    document.querySelectorAll('.countdown[data-end]').forEach(el => {
      const cd = getCountdown(el.dataset.end);
      const days = el.querySelector('[data-unit="days"]');
      const hours = el.querySelector('[data-unit="hours"]');
      const mins = el.querySelector('[data-unit="minutes"]');
      const secs = el.querySelector('[data-unit="seconds"]');
      if (days) days.textContent = String(cd.days).padStart(2, '0');
      if (hours) hours.textContent = String(cd.hours).padStart(2, '0');
      if (mins) mins.textContent = String(cd.minutes).padStart(2, '0');
      if (secs) secs.textContent = String(cd.seconds).padStart(2, '0');
    });
  }, 1000);
}

// ── Render Voting Booth ──
export async function renderVotingBooth(electionId) {
  const user = requireAuth('voter');
  if (!user) return;

  const election = await getElectionById(electionId);
  if (!election) {
    showToast('Election not found', 'error');
    window.navigateTo('#/voter');
    return;
  }

  if (election.status !== 'active') {
    showToast('This election is not active', 'warning');
    window.navigateTo('#/voter');
    return;
  }

  const voted = await DB.hasVoted(electionId, user.id);
  if (voted) {
    await renderAlreadyVoted(election, user);
    return;
  }

  const main = document.getElementById('main-content');
  window._selectedCandidate = null;

  main.innerHTML = `
    <div class="page-enter voting-page">
      <div class="voting-header">
        <button class="btn btn-ghost btn-sm mb-4" onclick="window.navigateTo('#/voter')" style="margin-bottom: var(--space-4);">← Back to Dashboard</button>
        <h1>${election.title}</h1>
        <p>${election.description}</p>
      </div>

      <div class="voting-instructions">
        <span class="voting-instructions-icon">ℹ️</span>
        <span>Select your preferred candidate below, then click "Cast Vote". Your vote is final and cannot be changed.</span>
      </div>

      <div class="candidates-grid stagger-children">
        ${election.candidates.map((c, i) => `
          <div class="candidate-card" data-candidate-id="${c.id}" onclick="window.selectCandidate('${c.id}')">
            <div class="candidate-check">✓</div>
            <div class="candidate-avatar" style="background: ${c.color || '#3b82f6'}">${getInitials(c.name)}</div>
            <div class="candidate-name">${c.name}</div>
            <div class="candidate-party">${c.party}</div>
            <div class="candidate-number">#${i + 1}</div>
          </div>
        `).join('')}
      </div>

      <div class="vote-action">
        <button class="btn btn-primary btn-lg" id="cast-vote-btn" disabled onclick="window.confirmVote('${electionId}')">
          🗳️ Cast Your Vote
        </button>
        <p>Select a candidate to enable voting</p>
      </div>
    </div>
  `;
}

window.selectCandidate = function(candidateId) {
  window._selectedCandidate = candidateId;

  document.querySelectorAll('.candidate-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.candidateId === candidateId);
  });

  const btn = document.getElementById('cast-vote-btn');
  if (btn) btn.disabled = false;
};

window.confirmVote = async function(electionId) {
  if (!window._selectedCandidate) return;

  const election = await getElectionById(electionId);
  if (!election) return;
  const candidate = election.candidates.find(c => c.id === window._selectedCandidate);
  if (!candidate) return;

  // Show confirmation modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Confirm Your Vote</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">You are about to vote for:</p>
      <div class="vote-confirm-candidate">
        <div class="vote-confirm-avatar" style="background: ${candidate.color || '#3b82f6'}">${getInitials(candidate.name)}</div>
        <div>
          <div class="vote-confirm-name">${candidate.name}</div>
          <div class="vote-confirm-party">${candidate.party}</div>
        </div>
      </div>
      <p style="color: var(--accent-amber); font-size: var(--text-sm); margin-top: var(--space-4);">⚠️ This action cannot be undone.</p>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="confirm-vote-btn">✅ Confirm Vote</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('confirm-vote-btn').addEventListener('click', async () => {
    overlay.remove();
    await castVote(electionId, window._selectedCandidate);
  });
};

async function castVote(electionId, candidateId) {
  const user = DB.getSession();
  if (!user) return;

  if (await DB.hasVoted(electionId, user.id)) {
    showToast('You have already voted in this election', 'error');
    return;
  }

  const receiptCode = generateReceiptCode();
  const vote = {
    id: generateId('vot'),
    electionId,
    candidateId,
    voterId: user.id,
    receiptCode,
    timestamp: new Date().toISOString(),
  };

  await DB.addVote(vote);
  launchConfetti();
  showToast('Your vote has been recorded!', 'success');

  // Show receipt
  const election = await getElectionById(electionId);
  const candidate = election.candidates.find(c => c.id === candidateId);
  renderVoteReceipt(election, candidate, receiptCode, vote.timestamp);
}

function renderVoteReceipt(election, candidate, receiptCode, timestamp) {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-enter voting-page">
      <div class="vote-receipt">
        <div class="vote-receipt-icon">🎉</div>
        <h2>Vote Cast Successfully!</h2>
        <p>Thank you for participating in the democratic process.</p>

        <div class="receipt-code">${receiptCode}</div>

        <div class="receipt-details">
          <div class="receipt-row">
            <span class="receipt-row-label">Election</span>
            <span class="receipt-row-value">${election.title}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Candidate</span>
            <span class="receipt-row-value">${candidate.name}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Party</span>
            <span class="receipt-row-value">${candidate.party}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Receipt Code</span>
            <span class="receipt-row-value" style="font-family: var(--font-mono);">${receiptCode}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Timestamp</span>
            <span class="receipt-row-value">${formatDateTime(timestamp)}</span>
          </div>
        </div>

        <div id="qr-code-container" style="margin: var(--space-6) auto; width: fit-content;"></div>

        <div class="flex gap-3 justify-center" style="justify-content: center;">
          <button class="btn btn-primary" onclick="window.navigateTo('#/results/${election.id}')">📊 View Results</button>
          <button class="btn btn-ghost" onclick="window.navigateTo('#/voter')">← Dashboard</button>
        </div>
      </div>
    </div>
  `;

  // Generate QR Code
  generateQRCode(receiptCode);
}

function generateQRCode(data) {
  const container = document.getElementById('qr-code-container');
  if (!container) return;

  const canvas = document.createElement('canvas');
  const size = 150;
  canvas.width = size;
  canvas.height = size;
  canvas.style.borderRadius = 'var(--radius-lg)';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const cellSize = 5;
  const gridSize = Math.floor(size / cellSize);
  let seed = 0;
  for (let i = 0; i < data.length; i++) seed += data.charCodeAt(i);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const mx = x < gridSize / 2 ? x : gridSize - 1 - x;
      const hash = ((mx * 31 + y * 17 + seed) * 2654435761) >>> 0;
      if (hash % 3 === 0) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  const drawCorner = (x, y) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, 35, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, y + 5, 25, 25);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 10, y + 10, 15, 15);
  };

  drawCorner(0, 0);
  drawCorner(size - 35, 0);
  drawCorner(0, size - 35);

  container.appendChild(canvas);

  const label = document.createElement('p');
  label.style.cssText = 'font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-2); text-align: center;';
  label.textContent = 'Vote Receipt QR Code';
  container.appendChild(label);
}

async function renderAlreadyVoted(election, user) {
  const votes = await DB.getVotes();
  const vote = votes.find(v => v.electionId === election.id && v.voterId === user.id);
  const candidate = election.candidates.find(c => c.id === vote.candidateId);

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-enter voting-page">
      <div class="already-voted">
        <div class="already-voted-icon">✅</div>
        <h2>You've Already Voted</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-6);">You cast your vote in "${election.title}" on ${formatDateTime(vote.timestamp)}</p>

        <div class="receipt-details" style="max-width: 400px; margin: 0 auto var(--space-6);">
          <div class="receipt-row">
            <span class="receipt-row-label">Candidate</span>
            <span class="receipt-row-value">${candidate ? candidate.name : 'Unknown'}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Receipt</span>
            <span class="receipt-row-value" style="font-family: var(--font-mono);">${vote.receiptCode}</span>
          </div>
        </div>

        <div class="flex gap-3 justify-center" style="justify-content: center;">
          <button class="btn btn-primary" onclick="window.navigateTo('#/results/${election.id}')">📊 View Results</button>
          <button class="btn btn-ghost" onclick="window.navigateTo('#/voter')">← Dashboard</button>
        </div>
      </div>
    </div>
  `;
}

// ── Render Voting History ──
export async function renderVotingHistory() {
  const user = requireAuth('voter');
  if (!user) return;

  const votes = await DB.getVotesByUser(user.id);
  const main = document.getElementById('main-content');
  
  // Prefetch elections to map them properly
  const activeElections = await getActiveElections();
  const completedElections = await getCompletedElections();
  const allElections = activeElections.concat(completedElections);
  const elMap = {};
  allElections.forEach(e => { elMap[e.id] = e; });

  main.innerHTML = `
    <div class="page-enter">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>📜 Voting History</h1>
          <p>Your complete voting record</p>
        </div>
        <button class="btn btn-ghost" onclick="window.navigateTo('#/voter')">← Back</button>
      </div>

      ${votes.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No Votes Yet</h3>
          <p class="empty-state-text">You haven't cast any votes. Visit the dashboard to see active elections.</p>
          <button class="btn btn-primary" onclick="window.navigateTo('#/voter')">View Elections</button>
        </div>
      ` : `
        <div class="history-timeline stagger-children">
          ${votes.map(vote => {
            const election = elMap[vote.electionId] || { title: 'Unknown Election', candidates: [] };
            const candidate = election.candidates.find(c => c.id === vote.candidateId);
            return `
              <div class="history-item">
                <div class="history-item-icon">🗳️</div>
                <div class="history-item-info">
                  <div class="history-item-title">${election.title}</div>
                  <div class="history-item-meta">
                    <span>👤 ${candidate ? candidate.name : 'Unknown'}</span>
                    <span>📅 ${formatDateTime(vote.timestamp)}</span>
                  </div>
                  <div class="history-item-receipt">${vote.receiptCode}</div>
                </div>
                ${election.id ? `
                  <button class="btn btn-ghost btn-sm" onclick="window.navigateTo('#/results/${election.id}')">📊</button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

// Cleanup on navigation
export function cleanupVoter() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}
