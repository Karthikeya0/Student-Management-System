# Online Voting System - Project Documentation

**Project Name:** Secure Online Voting System
**Developer:** Sushmita
**Date:** April 2026

---

## 1. Project Links (To be filled by student)
- **GitHub Repository Link:** `[PASTE YOUR GITHUB REPO LINK HERE]`
- **Code Explanation Video Link:** `[PASTE YOUR VIDEO LINK HERE]`
- **Project Overview Video Link:** `[PASTE YOUR VIDEO LINK HERE]`

---

## 2. Project Overview
The Secure Online Voting System is a web-based application designed to digitalize and streamline the voting process for college/university environments (like Student Council or Department Awards). It ensures transparency, ease of use, and security for voters, while providing a powerful administrative dashboard to manage elections.

### Key Objectives:
1. Eliminate paper-based voting.
2. Ensure a voter can only vote once per election.
3. Provide real-time analytics to the administrative team.
4. Guarantee a secure, user-friendly interface.

---

## 3. Technology Stack
- **Frontend Layer:** HTML5, Vanilla CSS3 (Custom Design System with animations), JavaScript (ES6+ Module Architecture).
- **Backend API Layer:** Python 3, Flask framework.
- **Database Layer:** SQLite (`flask-sqlalchemy`).
- **Communication:** RESTful API using asynchronous `fetch()` operations.

---

## 4. Complete Project Flow

The system features two primary user roles: **Admin** and **Voter**.

### 4.1. Registration & Authentication Flow
1. **Sign Up:** A new user navigates to the Registration page. They fill out their Name, Email, and Password. Upon submission, the system randomly assigns them a unique `Voter ID` (e.g., `VOT-2026-001`).
2. **Database Entry:** The user's details, including a hashed password, are securely stored in the SQLite database's `users` table.
3. **Login:** A user inputs their email and password. The system verifies these credentials via the Python `/api/users` endpoint. Based on the `role` flag (Admin or Voter), the system routes them to their respective dashboard.

### 4.2. Admin Flow (Election Management)
1. **Admin Dashboard:** The Admin logs in and views live statistics: Total Active Elections, Completed Elections, total registered voters, and overall turnout.
2. **Creating Elections:** The Admin navigates to the "Create Election" panel. They input the Election Title, Description, Date range, and list out the Candidates.
3. **Voters List:** The Admin can view a complete "Registered Voters" table tracking who has participated across elections. They can cleanly export this data as a `.csv` file.
4. **Monitoring:** As an election progresses, the Admin monitors live turnout. Features include force-closing an election early or deleting a drafted election.

### 4.3. Voter Flow (Casting Votes)
1. **Voter Dashboard:** The Voter logs in and sees a personalized dashboard featuring active elections, pending votes, and completed elections. Live countdown timers indicate how much time is left to vote.
2. **Voting Booth:** The Voter selects an active election they have not participated in yet. They review the candidates visually and securely select their preferred candidate.
3. **Verification & Constraints:** Upon clicking "Cast Vote":
   - The backend specifically queries the `votes` table to verify a constraint ensuring the user hasn't already voted in this exact `election_id`.
   - If clean, the vote is submitted, the candidate's total tally increments in the database, and a secure `Receipt Code` is assigned to the vote transaction.
4. **Vote Receipt:** The voter is instantly navigated to a "Vote Receipt" page loaded with a digital QR code and their transaction timestamp.
5. **Voting History:** Voters can visit the "Voting History" timeline to see all the votes they have previously cast safely stored on their record.

### 4.4. Results Evaluation Flow
1. **End Phase:** When the election timeline naturally expires (or the Admin manually ends it), the election status alters to `completed`.
2. **Automated Tally:** The system evaluates all the incremented vote counts from the SQLite back-end for that specific election.
3. **Analytics UI:** A gorgeous "Election Results" page goes public. It visualizes the total distribution of votes using customized Javascript-rendered Donut and Bar charts, officially declaring the winning candidate.
