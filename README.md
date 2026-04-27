# Secure Online Voting System

A comprehensive, full-stack online voting application built for university and local elections. It offers a premium, response UI built entirely in Vanilla JS/CSS alongside a robust Python API backed by SQLite for secure data persistence.

## 🚀 Features

### For Voters:
- Secure JWT-style session tracking.
- Interactive **Voter Dashboard** displaying active/completed elections.
- Live active **Countdown Timers**.
- A guided, highly graphical **Voting Booth** locking in safe, constraint-checked votes.
- Instant, uniquely generated **QR Coded Vote Receipts**.
- Full personal **Voting History** timeline tracking.

### For Admins:
- Comprehensive **Admin Dashboard** tracking total turnout and live platform analytics.
- Integrated **Registered Voters** database complete with export-to-CSV capabilities.
- Advanced **Election Creation Engine**: setup dynamic candidates, custom branding colors, and set tight timeline windows.
- Terminate elections instantly or evaluate active standings.
- Generate powerful **Results Analytics**: Interactive JS Canvas Donut charts and responsive animated Bar graphs indicating vote distributions.

## 🛠️ Technology Stack

1. **Frontend**:
    - **Language**: HTML5, CSS3, JavaScript (ES6 Modules)
    - **Architecture**: Single Page Application (SPA), Client-Side Routing.
    - **Design System**: Zero-framework setup using custom CSS variables (dark-mode exclusive styling).
  
2. **Backend**:
    - **Framework**: Python 3, Flask.
    - **Database**: SQLite (via `flask-sqlalchemy`).
    - **API Architecture**: REST.

---

## 💻 Local Setup & Execution

1. Build your Python virtual environment (Recommended):
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install backend dependencies (`Flask`, `Flask-CORS`, `Flask-SQLAlchemy`):
```bash
pip install flask flask-cors flask-sqlalchemy
```

3. Boot up the unified web server:
```bash
python3 app.py
```
> The server automatically builds the local `instance/voting.db` SQLite database if it doesn't exist, and will instantly serve both the backend API and frontend static assets.

4. Navigate to the application in your browser:  
👉 **http://127.0.0.1:3000** 

---

## 📂 Project Organization

- `/css/` -> Features our custom design-system, `variables.css`, and modular component stylesheets.
- `/js/` -> Logic hubs separated by roles: `admin.js`, `voter.js`, `elections.js`, `auth.js`, all connected by our `main.js` SPA router.
- `index.html` -> The foundational wrapper embedding our `#main-content` app space.
- `app.py` -> The Flask Python monolith managing all application routes, models, and data security constraints.
- `Project_Documentation.md` -> A deep-dive architecture presentation covering system flows.
