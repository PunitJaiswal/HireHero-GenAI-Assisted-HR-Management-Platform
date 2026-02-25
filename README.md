# 🧠 Hire Hero

A full-stack Recruitment Management and Job Seeking Platform built with **React (Vite)**, **Flask**, and **PostgreSQL**.
It streamlines recruitment workflows — from job posting, candidate tracking, and resume–JD matching,
to AI-driven insights and chatbot assistance using **Google Gemini API**.

---

## 🚀 Tech Stack

| Layer          | Technology                                 |
| -------------- | ------------------------------------------ |
| **Frontend**   | React (Vite) + Tailwind CSS + React Router |
| **Backend**    | Flask + SQLAlchemy + REST API Architecture |
| **Database**   | PostgreSQL                                 |
| **AI Chatbot** | Google Gemini API Integration              |
| **Auth**       | Context-based login (JWT-ready)            |
| **Styling**    | Tailwind CSS                               |

---

## 🏗️ Project Structure

```
soft-engg-project-sep-2025-se-SEP-35/
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ChatbotWidget.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ChatbotPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── chatbotService.js
│   │   └── styles/
│   │       └── globals.css
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── .env
│   ├── requirements.txt
│   └── run.py
│
└── database/
    ├── init_db.sql
    └── seed_data.sql
```

---

## ⚙️ Setup Guide

### 🧩 1. Clone the Repository

```bash
git clone https://github.com/23f1002051/soft-engg-project-sep-2025-se-SEP-35.git
cd soft-engg-project-sep-2025-se-SEP-35
```

---

### 🖥️ 2. Backend Setup (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate       # or venv\Scripts\activate (Windows)
pip install -r requirements.txt
python -m spacy download en_core_web_md  # Local language model for AI Match score
```

Create a `.env` file and update your credentials:

```bash
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/recruitment_db
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the server with database Seeding: To populate the database with rich, context-aware dummy data (HRs, Jobs, Candidates, Applications, Performance Reviews):

```bash
python run.py --seed
```

or to start server regularly:

```bash
python run.py
```

Backend runs at 👉 **http://localhost:5000**

---

### 💅 3. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at 👉 **http://localhost:3000**

The Vite proxy is already configured to forward all API calls from
`/api/*` → **http://localhost:5000/api/** (Flask backend).

---

🔐 Demo Credentials:

👤 HR Recruiter (For posting jobs & screening)
Email: hr1@gmail.com
Password: 123

🧑‍💻 Job Seeker (For applying & tracking status)
Email: js1@gmail.com
Password: 123

---

## 🧠 Key Features

-   **Job Posting & Management**
-   **Candidate Registration & Login**
-   **HR Dashboard for Recruiters**
-   **Chatbot Assistant** using Google Gemini for:
    -   JD Generation
    -   Resume-JD Matching Insights
    -   Candidate Q&A
-   **Responsive UI** built with Tailwind CSS
-   **React Router** navigation for modular pages
-   JWT-based authentication system
-   File upload for resume parsing
-   Advanced Gemini prompts for candidate evaluation
-   Role-based dashboards (Recruiter, Candidate)
-   Analytics & Reporting with Chart.js

---

## 🧰 Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start Vite frontend           |
| `python run.py`        | Start Flask backend           |
| `python run.py --seed` | Start Flask backend           |
| `npm run build`        | Build frontend for production |

---

## 🧑‍💻 Contributors

-   **Punit Kumar (23f1002051)** - Project Manager and Scrum Master
-   **Ayush Kumar (21f1002770)** – Lead Developer
-   **Geethanjaly MT (21f1006940)** - Documentation and Backend developer
-   **Laxmi Narayan (21f1003804)** - GenAI Integration and Tester
-   **Poornesh Rajeevamu U (21f1001683)** - GenAI Integration
-   **Pranav Joshi (22f3003006)** - Frontend Developer
-   **Praneet R (21f1003420)** - Backend Developer
-   **Siddhi Ganesh (21f1000100)** - Backend developer

---
