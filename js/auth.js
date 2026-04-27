/* ============================================
   AUTH — Registration, Login, Session
   ============================================ */

import DB from './storage.js';
import { generateId, hashPassword, isValidEmail, showToast, getInitials } from './utils.js';

// ── Render Login Page ──
export function renderLoginPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-hero-icon">🗳️</div>
            <h1>Online Voting System</h1>
            <p>A secure, transparent, and efficient way to cast your vote. Exercise your democratic right with confidence.</p>
            <ul class="auth-hero-features">
              <li>Secure encrypted voting</li>
              <li>One vote per election guaranteed</li>
              <li>Real-time results & analytics</li>
              <li>Digital receipt for every vote</li>
            </ul>
          </div>
        </div>
        <div class="auth-form-container">
          <div class="auth-form-header">
            <h2 id="auth-form-title">Welcome Back</h2>
            <p id="auth-form-subtitle">Sign in to access your dashboard</p>
          </div>

          <div class="role-toggle" id="role-toggle">
            <button class="role-toggle-btn active" data-role="voter" id="toggle-voter">🗳️ Voter</button>
            <button class="role-toggle-btn" data-role="admin" id="toggle-admin">🛡️ Admin</button>
          </div>

          <form class="auth-form" id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input type="email" class="form-input" id="login-email" placeholder="Enter your email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="login-btn">Sign In</button>
          </form>

          <div class="auth-switch" id="auth-switch-register">
            <p>Don't have an account? <a onclick="window.navigateTo('#/register')">Register here</a></p>
          </div>

          <div id="admin-hint" class="hidden" style="margin-top: var(--space-4); padding: var(--space-3) var(--space-4); background: rgba(139, 92, 246, 0.08); border-radius: var(--radius-md); border: 1px solid rgba(139, 92, 246, 0.15);">
            <small style="color: var(--accent-purple);">
              <strong>Demo Admin:</strong> admin@voting.com / admin123
            </small>
          </div>
        </div>
      </div>
    </div>
  `;

  // Role toggle
  const toggleBtns = document.querySelectorAll('.role-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.dataset.role;
      const hint = document.getElementById('admin-hint');
      const switchReg = document.getElementById('auth-switch-register');
      if (role === 'admin') {
        hint.classList.remove('hidden');
        switchReg.classList.add('hidden');
      } else {
        hint.classList.add('hidden');
        switchReg.classList.remove('hidden');
      }
    });
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      await login(email, password);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

// ── Render Register Page ──
export function renderRegisterPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-hero-icon">📝</div>
            <h1>Create Your Account</h1>
            <p>Register as a voter to participate in elections and make your voice heard.</p>
            <ul class="auth-hero-features">
              <li>Quick and easy registration</li>
              <li>Secure password encryption</li>
              <li>Instant access to active elections</li>
              <li>Track your voting history</li>
            </ul>
          </div>
        </div>
        <div class="auth-form-container">
          <div class="auth-form-header">
            <h2>Create Account</h2>
            <p>Register as a new voter</p>
          </div>

          <form class="auth-form" id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input type="text" class="form-input" id="reg-name" placeholder="Enter your full name" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input type="email" class="form-input" id="reg-email" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-voterid">Voter ID</label>
              <input type="text" class="form-input" id="reg-voterid" placeholder="e.g. VOT-2026-001" required>
              <span class="form-hint">This is your unique voter identification number</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input type="password" class="form-input" id="reg-password" placeholder="Min. 6 characters" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-confirm">Confirm Password</label>
              <input type="password" class="form-input" id="reg-confirm" placeholder="Re-enter your password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="register-btn">Create Account</button>
          </form>

          <div class="auth-switch">
            <p>Already have an account? <a onclick="window.navigateTo('#/login')">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const voterId = document.getElementById('reg-voterid').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const btn = document.getElementById('register-btn');

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      await register(name, email, voterId, password);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// ── Login Logic ──
async function login(email, password) {
  const user = await DB.findUserByEmail(email);
  if (!user) {
    throw new Error('No account found with this email');
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    throw new Error('Incorrect password');
  }

  DB.setSession(user);
  showToast(`Welcome back, ${user.name}!`, 'success');

  setTimeout(() => {
    if (user.role === 'admin') {
      window.navigateTo('#/admin');
    } else {
      window.navigateTo('#/voter');
    }
  }, 300);
}

// ── Register Logic ──
async function register(name, email, voterId, password) {
  if (await DB.findUserByEmail(email)) {
    throw new Error('An account with this email already exists');
  }

  const hash = await hashPassword(password);
  const user = {
    id: generateId('usr'),
    name,
    email,
    voterId,
    passwordHash: hash,
    role: 'voter',
    createdAt: new Date().toISOString(),
  };

  await DB.addUser(user);
  DB.setSession(user);
  showToast('Account created successfully!', 'success');

  setTimeout(() => {
    window.navigateTo('#/voter');
  }, 300);
}

// ── Logout ──
export function logout() {
  DB.clearSession();
  showToast('Logged out successfully', 'info');
  window.navigateTo('#/login');
}

// ── Get Current User ──
export function getCurrentUser() {
  return DB.getSession();
}

// ── Auth Guard ──
export function requireAuth(role = null) {
  const user = getCurrentUser();
  if (!user) {
    window.navigateTo('#/login');
    return null;
  }
  if (role && user.role !== role) {
    showToast('Access denied', 'error');
    window.navigateTo('#/login');
    return null;
  }
  return user;
}
