/* ============================================
   RESULTS — Election Results & Charts
   ============================================ */

import DB from './storage.js';
import { getElectionById, getElectionStats } from './elections.js';
import { formatDate, formatDateTime, showToast } from './utils.js';
import { getCurrentUser } from './auth.js';

export async function renderResults(electionId) {
  const election = await getElectionById(electionId);
  if (!election) {
    showToast('Election not found', 'error');
    window.navigateTo('#/voter');
    return;
  }

  const stats = await getElectionStats(electionId);
  const main = document.getElementById('main-content');
  const user = getCurrentUser();
  const backRoute = user && user.role === 'admin' ? '#/admin' : '#/voter';

  main.innerHTML = `
    <div class="page-enter results-page">
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>📊 Election Results</h1>
          <p class="dashboard-greeting">${election.title}</p>
        </div>
        <button class="btn btn-ghost" onclick="window.navigateTo('${backRoute}')">← Back</button>
      </div>

      <!-- Status + meta -->
      <div class="results-meta card mb-6">
        <div class="results-meta-grid">
          <div class="results-meta-item">
            <span class="results-meta-label">Status</span>
            <span class="results-meta-value">
              ${election.status === 'active'
                ? '<span class="badge badge-green">🟢 Active</span>'
                : election.status === 'completed'
                ? '<span class="badge badge-blue">🏁 Completed</span>'
                : '<span class="badge badge-amber">📝 Draft</span>'}
            </span>
          </div>
          <div class="results-meta-item">
            <span class="results-meta-label">Total Votes</span>
            <span class="results-meta-value results-total-votes">${stats ? stats.totalVotes : 0}</span>
          </div>
          <div class="results-meta-item">
            <span class="results-meta-label">Candidates</span>
            <span class="results-meta-value">${election.candidates.length}</span>
          </div>
          <div class="results-meta-item">
            <span class="results-meta-label">Ends</span>
            <span class="results-meta-value">${formatDate(election.endDate)}</span>
          </div>
        </div>
      </div>

      ${stats && stats.winner && election.status === 'completed' ? `
        <!-- Winner Banner -->
        <div class="winner-banner card mb-6">
          <div class="winner-banner-icon">🏆</div>
          <div class="winner-banner-content">
            <div class="winner-banner-label">Winner</div>
            <div class="winner-banner-name">${stats.winner.name}</div>
            <div class="winner-banner-party">${stats.winner.party}</div>
            <div class="winner-banner-votes">${stats.winner.votes} votes · ${stats.totalVotes > 0 ? ((stats.winner.votes / stats.totalVotes) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
      ` : ''}

      <!-- Candidates bar chart -->
      ${stats ? `
        <div class="card mb-6">
          <h3 class="card-title mb-6">Vote Distribution</h3>
          <div class="results-bars stagger-children">
            ${stats.candidates.map((c, i) => `
              <div class="results-bar-row">
                <div class="results-bar-meta">
                  <div class="results-bar-rank">#${c.rank}</div>
                  <div class="results-bar-avatar" style="background: ${c.color}">${c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
                  <div class="results-bar-info">
                    <div class="results-bar-name">${c.name}</div>
                    <div class="results-bar-party">${c.party}</div>
                  </div>
                  <div class="results-bar-count">${c.votes} <span class="results-bar-pct">(${c.percentage}%)</span></div>
                </div>
                <div class="results-bar-track">
                  <div class="results-bar-fill" style="width: ${c.percentage}%; background: ${c.color}; animation-delay: ${i * 0.1}s;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Donut chart canvas -->
        <div class="card mb-6">
          <h3 class="card-title mb-4">Vote Share</h3>
          <div class="results-donut-wrapper">
            <canvas id="donut-chart" width="240" height="240"></canvas>
            <div class="results-donut-legend">
              ${stats.candidates.map(c => `
                <div class="results-legend-item">
                  <span class="results-legend-dot" style="background: ${c.color}"></span>
                  <span class="results-legend-name">${c.name}</span>
                  <span class="results-legend-pct">${c.percentage}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <h3 class="empty-state-title">No Votes Yet</h3>
          <p class="empty-state-text">Votes will appear here once voters start participating.</p>
        </div>
      `}
    </div>
  `;

  if (stats && stats.totalVotes > 0) {
    drawDonutChart(stats.candidates);
  }
}

function drawDonutChart(candidates) {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = candidates.reduce((s, c) => s + (c.votes || 0), 0);
  if (total === 0) return;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 90;
  const innerRadius = 52;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  candidates.forEach(c => {
    const slice = ((c.votes || 0) / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = c.color;
    ctx.fill();
    startAngle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#111827';
  ctx.fill();

  // Centre text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('total votes', cx, cy + 12);
}
