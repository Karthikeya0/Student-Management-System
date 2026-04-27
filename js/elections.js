/* ============================================
   ELECTIONS — Data Model & CRUD Operations
   ============================================ */

import DB from './storage.js';
import { generateId, getAvatarColor } from './utils.js';

// ── Create Election ──
export async function createElection({ title, description, candidates, startDate, endDate }) {
  const user = DB.getSession();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');

  const election = {
    id: generateId('elc'),
    title,
    description,
    candidates: candidates.map((c, i) => ({
      id: generateId('cnd'),
      name: c.name,
      party: c.party,
      votes: 0,
      color: c.color || getAvatarColor(i),
    })),
    status: 'draft',
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  };

  return await DB.addElection(election);
}

// ── Get Elections ──
export async function getAllElections() {
  return await DB.getElections();
}

export async function getElectionById(id) {
  return await DB.findElectionById(id);
}

export async function getActiveElections() {
  const elections = await DB.getElections();
  return elections.filter(e => e.status === 'active');
}

export async function getCompletedElections() {
  const elections = await DB.getElections();
  return elections.filter(e => e.status === 'completed');
}

export async function getDraftElections() {
  const elections = await DB.getElections();
  return elections.filter(e => e.status === 'draft');
}

// ── Update Election ──
export async function updateElection(id, updates) {
  return await DB.updateElection(id, updates);
}

// ── Start Election ──
export async function startElection(id) {
  const election = await DB.findElectionById(id);
  if (!election) throw new Error('Election not found');
  if (election.candidates.length < 2) throw new Error('At least 2 candidates are required');

  return await DB.updateElection(id, {
    status: 'active',
    startDate: new Date().toISOString(),
  });
}

// ── End Election ──
export async function endElection(id) {
  return await DB.updateElection(id, {
    status: 'completed',
    endDate: new Date().toISOString(),
  });
}

// ── Delete Election ──
export async function deleteElection(id) {
  await DB.deleteElection(id);
}

// ── Add Candidate ──
export async function addCandidate(electionId, candidate) {
  const election = await DB.findElectionById(electionId);
  if (!election) throw new Error('Election not found');

  const newCandidate = {
    id: generateId('cnd'),
    name: candidate.name,
    party: candidate.party,
    votes: 0,
    color: candidate.color || getAvatarColor(election.candidates.length),
  };

  election.candidates.push(newCandidate);
  await DB.updateElection(electionId, { candidates: election.candidates });
  return newCandidate;
}

// ── Remove Candidate ──
export async function removeCandidate(electionId, candidateId) {
  const election = await DB.findElectionById(electionId);
  if (!election) throw new Error('Election not found');

  election.candidates = election.candidates.filter(c => c.id !== candidateId);
  await DB.updateElection(electionId, { candidates: election.candidates });
}

// ── Get Election Stats ──
export async function getElectionStats(electionId) {
  const election = await DB.findElectionById(electionId);
  if (!election) return null;

  const totalVotes = election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  const sortedCandidates = [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const winner = sortedCandidates[0];

  const users = await DB.getUsers();
  return {
    totalVotes,
    totalCandidates: election.candidates.length,
    candidates: sortedCandidates.map((c, i) => ({
      ...c,
      rank: i + 1,
      percentage: totalVotes > 0 ? ((c.votes || 0) / totalVotes * 100).toFixed(1) : '0.0',
    })),
    winner: totalVotes > 0 ? winner : null,
    totalRegisteredVoters: users.filter(u => u.role === 'voter').length,
  };
}

// ── Overall Stats ──
export async function getOverallStats() {
  const elections = await DB.getElections();
  const users = await DB.getUsers();
  const votes = await DB.getVotes();

  return {
    totalElections: elections.length,
    activeElections: elections.filter(e => e.status === 'active').length,
    completedElections: elections.filter(e => e.status === 'completed').length,
    draftElections: elections.filter(e => e.status === 'draft').length,
    totalVoters: users.filter(u => u.role === 'voter').length,
    totalVotesCast: votes.length,
  };
}
