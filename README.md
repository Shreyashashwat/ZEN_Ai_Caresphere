# CareSphere - AI-Powered Healthcare Management Platform
🏆 Built for Zen AI Hackathon

CareSphere is a comprehensive, AI-driven healthcare management platform that revolutionizes medication adherence and patient care through intelligent automation, predictive analytics, caregiver coordination, doctor-patient integration, and seamless Google Calendar sync.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Future Roadmap](#future-roadmap)

---

## Overview
CareSphere helps users set up personalized medication schedules and ensures timely intake through intelligent reminders, visual tracking dashboards, and AI-generated weekly health insights. Advanced AI features enhance user engagement by learning patterns, providing proactive suggestions, and connecting caregivers with patients in real-time.

---

## Features

### Basic Features
- **Medicine Schedule Setup:** Users can add pill name, dosage, time, and frequency.
- **Smart Notifications:** Receive timely reminders via browser alerts (Firebase Cloud Messaging) and email (Nodemailer).
- **Dose Tracking:** Simple log to track taken vs missed doses with reminder status.
- **User Dashboard:** View upcoming and past reminders in a clean dashboard.
- **CRUD Functionality:** Edit or delete medication schedules easily.
- **Data Visualization Dashboard:** Graphs showing adherence rates, missed doses, and trends over time.

### Advanced Features
- **AI-Powered Adherence Prediction:**
  - Detects user patterns (e.g., missing night doses).
  - Sends extra reminders before high-risk times via BullMQ job queues + Redis.
  - Offers proactive nudges, e.g., *"You usually forget your pill after dinner — should I remind you again in 15 minutes?"*

- **AI Chatbot Health Assistant (LangChain Agent):**
  - Users can ask natural language questions such as:
    - *"What pills do I need to take today?"*
    - *"Did I miss any dose yesterday?"*
    - *"Book me an appointment with my doctor."*
  - Powered by OpenAI GPT-4o-mini with tool-calling for medicines, reminders, appointments, and analytics.
  - Input & output guardrails for safe, medically responsible responses.

- **Weekly AI Health Insights (LLM Service):**
  - Powered by Google Gemini via LangChain.
  - Generates personalized, actionable health insights based on weekly adherence summaries.

- **Caregiver Module:**
  - Link caregivers to patients for shared oversight and real-time notifications.

- **Doctor-Patient Integration:**
  - Doctor and patient request/approval flow.
  - Appointment scheduling with reports.

- **Google Calendar Integration (Showstopper Feature):**
  - Medication schedules sync directly with Google Calendar.
  - AI assistant can auto-update calendar events if a dose is missed or rescheduled.

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js 19, Tailwind CSS, Chart.js, Recharts, React Calendar |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB (Mongoose) |
| Queue / Cache | Redis, BullMQ |
| Notifications | Firebase Cloud Messaging (FCM), Nodemailer |
| Integration | Google Calendar API, Google OAuth2 |
| Authentication | JWT-based Auth, bcrypt |
| AI Agent | LangChain, OpenAI GPT-4o-mini (FastAPI, port 8002) |
| LLM Service | LangChain Google Gemini (FastAPI, port 8001) |
| ML | HuggingFace Inference API |
| DevOps | Docker (Redis via docker-compose) |

---

## Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Python 3.10+
- MongoDB running locally or via Atlas
- Redis (via Docker recommended — see step 1)
- Firebase project setup for notifications
- OpenAI API key for the agent chatbot
- Google API key for the LLM insights service

---

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/CareSphere.git

# Move into project directory
cd CareSphere
```

There are **5 major components** to start:

---

#### 1. Redis (Docker)
```bash
# Start Redis using Docker Compose
docker-compose up -d
```

---

#### 2. BACKEND
```bash
# Move into backend folder
cd backend

# Install dependencies
npm install
```

Create a `.env` file in the `backend/` folder and add:
```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173

# Firebase
FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-file.json"

# Google OAuth / Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Nodemailer)
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# HuggingFace
HUGGINGFACE_API_KEY=your_huggingface_key
```

```bash
# Start the backend development server
npm run dev
```

---

#### 3. FRONTEND
```bash
# Move into frontend folder
cd frontend

# Install dependencies
npm install
```

Create a `.env` file in the `frontend/` folder and add:
```env
VITE_FIREBASE_VAPID_KEY=your_vite_vapid_key
VITE_BACKEND_URL=http://localhost:8000
```

```bash
# Start the frontend
npm run dev
```

---

#### 4. AGENT
```bash
# Move into agent folder
cd agent

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `agent/` folder and add:
```env
BACKEND_URL=http://localhost:8000
OPENAI_API_KEY=your_openai_api_key
```

```bash
# Move back to root and start the agent
cd ..
uvicorn agent.main:app --host 0.0.0.0 --port 8002 --reload
```

---

#### 5. LLM SERVICE
```bash
# Move into llm-services folder
cd llm-services

# Install dependencies
pip install -r requirement.txt
```

Create a `.env` file in the `llm-services/` folder and add:
```env
GOOGLE_API_KEY=your_google_api_key
```

```bash
# Start the LLM service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Folder Structure

```
CareSphere/
│
├── agent/                          # Python-based LangChain AI agent system
│   ├── guardrails/                 # Input & output safety validation for LLM
│   ├── prompts/                    # System prompt templates
│   ├── tools/                      # Tool-calling logic
│   │   ├── analytics_tools.py
│   │   ├── appointment_tools.py
│   │   ├── medicine_tools.py
│   │   └── reminder_tools.py
│   ├── utils/                      # Helper utilities (memory store, etc.)
│   ├── __init__.py
│   ├── agent_executor.py           # Core agent execution logic (GPT-4o-mini)
│   ├── main.py                     # FastAPI entry point (port 8002)
│   └── requirements.txt
│
├── backend/                        # Node.js + Express.js API
│   └── src/
│       ├── configs/                # Redis client configuration
│       │   └── redisClient.js
│       ├── controllers/            # Route controllers
│       ├── db/                     # MongoDB connection logic
│       ├── firebase/               # FCM notification logic & reminder cron jobs
│       ├── middleware/             # Auth & error middleware
│       ├── ml/                     # HuggingFace ML integration
│       ├── model/                  # Mongoose schemas
│       │   ├── user.model.js
│       │   ├── medicine.model.js
│       │   ├── reminderstatus.js
│       │   ├── caregiverLink.model.js
│       │   ├── doctor.js
│       │   ├── appointment.model.js
│       │   ├── appointmentReport.model.js
│       │   ├── doctorPatientRequest.model.js
│       │   ├── calendar.model.js
│       │   ├── insights.model.js
│       │   ├── aIAnalytics.model.js
│       │   ├── dailyHealthNode.model.js
│       │   └── notification.js
│       ├── queues/                 # BullMQ job queues + workers (Redis-backed)
│       │   ├── queue.js
│       │   ├── worker.js
│       │   └── check.js
│       ├── routes/                 # API route definitions
│       │   ├── user.routes.js
│       │   ├── medicine.routes.js
│       │   ├── reminder.routes.js
│       │   ├── chatbot.routes.js
│       │   ├── caregiver.routes.js
│       │   ├── doctorPatient.routes.js
│       │   ├── googleapis.routes.js
│       │   ├── googleCalender.routes.js
│       │   ├── ml.routes.js
│       │   └── weeklyInsights.routes.js
│       ├── utils/                  # Utility helpers
│       ├── app.js                  # Express app configuration
│       ├── constants.js
│       └── index.js                # Server entry point
│   ├── package.json
│   └── package-lock.json
│
├── frontend/                       # React 19 (Vite) frontend
│   ├── src/
│   │   ├── Firebase/               # Firebase client-side config
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # Global state management
│   │   ├── pages/                  # App pages (Dashboard, Login, etc.)
│   │   ├── utils/                  # Frontend helpers
│   │   ├── api.js                  # Axios API configuration
│   │   ├── App.jsx
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── package-lock.json
│
├── llm-services/                   # FastAPI microservice for AI/LLM weekly insights
│   ├── main.py                     # Google Gemini + LangChain insight generation (port 8001)
│   ├── test.py
│   └── requirement.txt
│
├── docker-compose.yml              # Redis Docker setup
├── .gitignore
└── README.md
```

---



## 🚀 Future Roadmap

### Phase 2: Mobile & Accessibility
- 📱 Progressive Web App (PWA) support for a mobile-friendly, installable experience
- 🌐 Multi-language support starting with Hindi and regional Indian languages
- 🔊 Voice-based reminder confirmations — confirm a dose taken via mic input
- ♿ Accessibility improvements for elderly users (larger text, high contrast mode)

### Phase 3: Smarter Health Tracking
- 📈 Monthly and yearly adherence trend reports with exportable PDF summaries
- 🩺 Vitals logging — let users optionally log blood pressure, sugar levels alongside medications
- 🏆 Streak-based gamification — reward consistent adherence with badges and milestones
- 📋 Shareable health summary reports for doctor appointments

### Phase 4: Platform Expansion
- ☁️ Full cloud deployment (frontend on Vercel, backend on Render/Railway)
- 🧪 Unit and integration tests for core backend routes and agent tools
- 🔐 Refresh token support and secure session management
- 🏥 Basic pharmacy tie-in — link a prescription and get low-stock alerts before you run out