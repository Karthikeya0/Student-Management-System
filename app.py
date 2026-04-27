"""
==================================================
  Online Voting System — Flask + SQLite Backend
==================================================
  Database: SQLite (voting.db)
  ORM:      Flask-SQLAlchemy
  API:      RESTful JSON endpoints
==================================================
"""

import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# ── App Setup ──────────────────────────────────
app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///voting.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db = SQLAlchemy(app)


# ══════════════════════════════════════════════
#   DATABASE MODELS
# ══════════════════════════════════════════════

class User(db.Model):
    __tablename__ = 'users'

    id          = db.Column(db.String(50), primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    email       = db.Column(db.String(150), unique=True, nullable=False)
    voter_id    = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role        = db.Column(db.String(20), default='voter', nullable=False)
    created_at  = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id':           self.id,
            'name':         self.name,
            'email':        self.email,
            'voterId':      self.voter_id,
            'passwordHash': self.password_hash,
            'role':         self.role,
            'createdAt':    self.created_at,
        }


class Election(db.Model):
    __tablename__ = 'elections'

    id          = db.Column(db.String(50), primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status      = db.Column(db.String(20), default='draft', nullable=False)
    start_date  = db.Column(db.String(50), nullable=False)
    end_date    = db.Column(db.String(50), nullable=False)
    created_by  = db.Column(db.String(50), nullable=False)
    created_at  = db.Column(db.String(50), nullable=False)

    candidates = db.relationship('Candidate', backref='election',
                                 cascade='all, delete-orphan', lazy=True)
    votes      = db.relationship('Vote', backref='election',
                                 cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id':          self.id,
            'title':       self.title,
            'description': self.description,
            'status':      self.status,
            'startDate':   self.start_date,
            'endDate':     self.end_date,
            'createdBy':   self.created_by,
            'createdAt':   self.created_at,
            'candidates':  [c.to_dict() for c in self.candidates],
        }


class Candidate(db.Model):
    __tablename__ = 'candidates'

    id          = db.Column(db.String(50), primary_key=True)
    election_id = db.Column(db.String(50), db.ForeignKey('elections.id'), nullable=False)
    name        = db.Column(db.String(100), nullable=False)
    party       = db.Column(db.String(100), nullable=False)
    votes       = db.Column(db.Integer, default=0, nullable=False)
    color       = db.Column(db.String(20), default='#3b82f6')

    def to_dict(self):
        return {
            'id':         self.id,
            'electionId': self.election_id,
            'name':       self.name,
            'party':      self.party,
            'votes':      self.votes,
            'color':      self.color,
        }


class Vote(db.Model):
    __tablename__ = 'votes'

    id           = db.Column(db.String(50), primary_key=True)
    election_id  = db.Column(db.String(50), db.ForeignKey('elections.id'), nullable=False)
    candidate_id = db.Column(db.String(50), nullable=False)
    voter_id     = db.Column(db.String(50), nullable=False)
    receipt_code = db.Column(db.String(50), nullable=False)
    timestamp    = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('election_id', 'voter_id', name='unique_vote_per_election'),
    )

    def to_dict(self):
        return {
            'id':          self.id,
            'electionId':  self.election_id,
            'candidateId': self.candidate_id,
            'voterId':     self.voter_id,
            'receiptCode': self.receipt_code,
            'timestamp':   self.timestamp,
        }


class SeedFlag(db.Model):
    __tablename__ = 'seed_flag'
    id     = db.Column(db.Integer, primary_key=True)
    seeded = db.Column(db.Boolean, default=False)


# ══════════════════════════════════════════════
#   STATIC FILE SERVING
# ══════════════════════════════════════════════

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')


# ══════════════════════════════════════════════
#   USER ENDPOINTS
# ══════════════════════════════════════════════

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    user = User(
        id            = data['id'],
        name          = data['name'],
        email         = data['email'],
        voter_id      = data['voterId'],
        password_hash = data['passwordHash'],
        role          = data.get('role', 'voter'),
        created_at    = data.get('createdAt', datetime.utcnow().isoformat()),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


# ══════════════════════════════════════════════
#   ELECTION ENDPOINTS
# ══════════════════════════════════════════════

@app.route('/api/elections', methods=['GET'])
def get_elections():
    elections = Election.query.all()
    return jsonify([e.to_dict() for e in elections])


@app.route('/api/elections', methods=['POST'])
def add_election():
    data = request.json
    election = Election(
        id          = data['id'],
        title       = data['title'],
        description = data['description'],
        status      = data.get('status', 'draft'),
        start_date  = data['startDate'],
        end_date    = data['endDate'],
        created_by  = data['createdBy'],
        created_at  = data.get('createdAt', datetime.utcnow().isoformat()),
    )
    db.session.add(election)

    # Add candidates
    for c in data.get('candidates', []):
        candidate = Candidate(
            id          = c['id'],
            election_id = election.id,
            name        = c['name'],
            party       = c['party'],
            votes       = c.get('votes', 0),
            color       = c.get('color', '#3b82f6'),
        )
        db.session.add(candidate)

    db.session.commit()
    return jsonify(election.to_dict()), 201


@app.route('/api/elections/<election_id>', methods=['PUT'])
def update_election(election_id):
    election = Election.query.get_or_404(election_id)
    data = request.json

    # Update scalar fields
    for field, col in [('title', 'title'), ('description', 'description'),
                       ('status', 'status'), ('startDate', 'start_date'),
                       ('endDate', 'end_date')]:
        if field in data:
            setattr(election, col, data[field])

    # Update candidates list if provided
    if 'candidates' in data:
        # Delete old candidates and re-insert
        Candidate.query.filter_by(election_id=election_id).delete()
        for c in data['candidates']:
            candidate = Candidate(
                id          = c['id'],
                election_id = election_id,
                name        = c['name'],
                party       = c['party'],
                votes       = c.get('votes', 0),
                color       = c.get('color', '#3b82f6'),
            )
            db.session.add(candidate)

    db.session.commit()
    return jsonify(election.to_dict())


@app.route('/api/elections/<election_id>', methods=['DELETE'])
def delete_election(election_id):
    election = Election.query.get_or_404(election_id)
    db.session.delete(election)
    db.session.commit()
    return jsonify({'success': True})


# ══════════════════════════════════════════════
#   VOTE ENDPOINTS
# ══════════════════════════════════════════════

@app.route('/api/votes', methods=['GET'])
def get_votes():
    votes = Vote.query.all()
    return jsonify([v.to_dict() for v in votes])


@app.route('/api/votes', methods=['POST'])
def add_vote():
    data = request.json

    # Enforce one vote per election per voter (DB-level constraint as backup)
    existing = Vote.query.filter_by(
        election_id=data['electionId'],
        voter_id=data['voterId']
    ).first()
    if existing:
        return jsonify({'error': 'Already voted in this election'}), 400

    vote = Vote(
        id           = data['id'],
        election_id  = data['electionId'],
        candidate_id = data['candidateId'],
        voter_id     = data['voterId'],
        receipt_code = data['receiptCode'],
        timestamp    = data.get('timestamp', datetime.utcnow().isoformat()),
    )
    db.session.add(vote)

    # Atomically increment candidate vote count
    candidate = Candidate.query.get(data['candidateId'])
    if candidate:
        candidate.votes += 1

    db.session.commit()
    return jsonify(vote.to_dict()), 201


# ══════════════════════════════════════════════
#   SEED ENDPOINTS
# ══════════════════════════════════════════════

@app.route('/api/seeded', methods=['GET'])
def is_seeded():
    flag = SeedFlag.query.first()
    return jsonify({'seeded': bool(flag and flag.seeded)})


@app.route('/api/seed', methods=['POST'])
def seed_db():
    data = request.json

    # Seed users
    for u in data.get('users', []):
        if not User.query.get(u['id']):
            db.session.add(User(
                id            = u['id'],
                name          = u['name'],
                email         = u['email'],
                voter_id      = u['voterId'],
                password_hash = u['passwordHash'],
                role          = u.get('role', 'voter'),
                created_at    = u.get('createdAt', datetime.utcnow().isoformat()),
            ))

    # Seed elections + candidates
    for e in data.get('elections', []):
        if not Election.query.get(e['id']):
            election = Election(
                id          = e['id'],
                title       = e['title'],
                description = e['description'],
                status      = e.get('status', 'draft'),
                start_date  = e['startDate'],
                end_date    = e['endDate'],
                created_by  = e['createdBy'],
                created_at  = e.get('createdAt', datetime.utcnow().isoformat()),
            )
            db.session.add(election)
            for c in e.get('candidates', []):
                db.session.add(Candidate(
                    id          = c['id'],
                    election_id = e['id'],
                    name        = c['name'],
                    party       = c['party'],
                    votes       = c.get('votes', 0),
                    color       = c.get('color', '#3b82f6'),
                ))

    # Seed votes
    for v in data.get('votes', []):
        if not Vote.query.get(v['id']):
            db.session.add(Vote(
                id           = v['id'],
                election_id  = v['electionId'],
                candidate_id = v['candidateId'],
                voter_id     = v['voterId'],
                receipt_code = v['receiptCode'],
                timestamp    = v.get('timestamp', datetime.utcnow().isoformat()),
            ))

    # Mark as seeded
    flag = SeedFlag.query.first()
    if not flag:
        db.session.add(SeedFlag(seeded=True))
    else:
        flag.seeded = True

    db.session.commit()
    return jsonify({'success': True})


# ══════════════════════════════════════════════
#   STARTUP
# ══════════════════════════════════════════════

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3000, debug=True)
