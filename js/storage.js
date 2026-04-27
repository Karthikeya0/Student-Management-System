/* ============================================
   STORAGE — Backend API Wrapper Server Sync
   ============================================ */

const API_BASE = 'http://127.0.0.1:3000/api';

const DB = {
  // ── Getters ──
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async getElections() {
    const res = await fetch(`${API_BASE}/elections`);
    return res.json();
  },

  async getVotes() {
    const res = await fetch(`${API_BASE}/votes`);
    return res.json();
  },

  // ── User Operations ──
  async addUser(user) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.json();
  },

  async findUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async findUserById(id) {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  },

  // ── Election Operations ──
  async addElection(election) {
    const res = await fetch(`${API_BASE}/elections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(election)
    });
    return res.json();
  },

  async updateElection(id, updates) {
    const res = await fetch(`${API_BASE}/elections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteElection(id) {
    await fetch(`${API_BASE}/elections/${id}`, { method: 'DELETE' });
  },

  async findElectionById(id) {
    const elections = await this.getElections();
    return elections.find(e => e.id === id);
  },

  // ── Vote Operations ──
  async addVote(vote) {
    const res = await fetch(`${API_BASE}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote)
    });
    return res.json();
  },

  async hasVoted(electionId, userId) {
    const votes = await this.getVotes();
    return votes.some(v => v.electionId === electionId && v.voterId === userId);
  },

  async getVotesForElection(electionId) {
    const votes = await this.getVotes();
    return votes.filter(v => v.electionId === electionId);
  },

  async getVotesByUser(userId) {
    const votes = await this.getVotes();
    return votes.filter(v => v.voterId === userId);
  },

  // ── Session ──
  setSession(user) {
    sessionStorage.setItem('ovs_session', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      voterId: user.voterId,
    }));
  },

  getSession() {
    const session = sessionStorage.getItem('ovs_session');
    return session ? JSON.parse(session) : null;
  },

  clearSession() {
    sessionStorage.removeItem('ovs_session');
  },

  // ── Seed Data ──
  async seed() {
    const res = await fetch(`${API_BASE}/seeded`);
    const { seeded } = await res.json();
    if (seeded) return;

    // Seed admin account
    const { hashPassword } = await import('./utils.js');
    const adminHash = await hashPassword('admin123');

    const adminUser = {
      id: 'usr_admin_001',
      name: 'Admin',
      email: 'admin@voting.com',
      voterId: 'ADM-001',
      passwordHash: adminHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    // Seed sample voters
    const voter1Hash = await hashPassword('voter123');
    const voter2Hash = await hashPassword('voter123');

    const voter1 = {
      id: 'usr_voter_001',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      voterId: 'VOT-2026-001',
      passwordHash: voter1Hash,
      role: 'voter',
      createdAt: new Date().toISOString(),
    };

    const voter2 = {
      id: 'usr_voter_002',
      name: 'Priya Patel',
      email: 'priya@example.com',
      voterId: 'VOT-2026-002',
      passwordHash: voter2Hash,
      role: 'voter',
      createdAt: new Date().toISOString(),
    };

    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const elections = [
      {
        id: 'elc_001',
        title: 'Student Council President 2026',
        description: 'Vote for the next student body president who will lead initiatives for campus improvement, student welfare, and academic excellence.',
        candidates: [
          { id: 'cnd_001', name: 'Ananya Gupta', party: 'Progress Alliance', votes: 12, color: '#3b82f6' },
          { id: 'cnd_002', name: 'Vikram Singh', party: 'Student Unity', votes: 8, color: '#8b5cf6' },
          { id: 'cnd_003', name: 'Meera Joshi', party: 'Innovation Front', votes: 15, color: '#10b981' },
          { id: 'cnd_004', name: 'Arjun Reddy', party: 'Campus First', votes: 6, color: '#f59e0b' },
        ],
        status: 'active',
        startDate: now.toISOString(),
        endDate: future.toISOString(),
        createdBy: 'usr_admin_001',
        createdAt: past.toISOString(),
      },
      {
        id: 'elc_002',
        title: 'Best Department Award 2026',
        description: 'Vote for the department that has shown exceptional performance in academics, research, and extracurricular activities.',
        candidates: [
          { id: 'cnd_005', name: 'Computer Science', party: 'Engineering', votes: 22, color: '#3b82f6' },
          { id: 'cnd_006', name: 'Electronics', party: 'Engineering', votes: 18, color: '#ec4899' },
          { id: 'cnd_007', name: 'Mechanical', party: 'Engineering', votes: 14, color: '#f59e0b' },
        ],
        status: 'completed',
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: past.toISOString(),
        createdBy: 'usr_admin_001',
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'elc_003',
        title: 'Annual Festival Theme',
        description: 'Choose the theme for this year\'s annual cultural festival. The winning theme will set the tone for all events and decorations.',
        candidates: [
          { id: 'cnd_008', name: 'Retro Revival', party: 'Theme', votes: 0, color: '#ef4444' },
          { id: 'cnd_009', name: 'Neon Nights', party: 'Theme', votes: 0, color: '#06b6d4' },
          { id: 'cnd_010', name: 'Enchanted Forest', party: 'Theme', votes: 0, color: '#10b981' },
        ],
        status: 'draft',
        startDate: future.toISOString(),
        endDate: new Date(future.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'usr_admin_001',
        createdAt: now.toISOString(),
      },
    ];

    const seededVotes = [
      { id: 'vot_s001', electionId: 'elc_002', candidateId: 'cnd_005', voterId: 'usr_voter_001', receiptCode: 'RCP-AB12-XY34', timestamp: past.toISOString() },
      { id: 'vot_s002', electionId: 'elc_002', candidateId: 'cnd_006', voterId: 'usr_voter_002', receiptCode: 'RCP-CD56-WZ78', timestamp: past.toISOString() },
    ];

    await fetch(`${API_BASE}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: [adminUser, voter1, voter2],
        elections: elections,
        votes: seededVotes
      })
    });
  },

  async reset() {
    // Left empty for now, or we can make a reset endpoint
  }
};

export default DB;
