# 📊 WhatsApp Poll App - MERN Stack

A WhatsApp-style Poll application built with the MERN stack (MongoDB, Express, React, Node.js) featuring anonymous voting, cookie-based vote locking, custom dynamic options (2-6), admin authentication, multi-admin management, and analytics with Chart.js.

---

## 🌟 Key Features

- **🗳️ Anonymous Voting**: Users can view active polls and vote anonymously without registration.
- **🔒 Cookie-Locked Votes**: Prevents double-voting or changing options per poll via anonymous tokens stored in cookies and server-side tracking.
- **🔐 Admin Portal**: Secure JWT & httpOnly cookie-based authentication for super admins and sub-admins.
- **➕ Dynamic Poll Creation**: Admin can create polls with minimum 2 and maximum 6 options.
- **👥 Admin Management**: Super Admin can register, activate/deactivate, reset passwords, or delete other sub-admins.
- **📊 Interactive Analytics**: Real-time stats, bar charts (votes per poll), doughnut charts (option breakdown), poll rankings, and recent activity timeline.
- **🎨 WhatsApp Dark UI Theme**: Modern aesthetics with glassmorphism, responsive cards, and clean feedback modals.

---

## 📁 Project Structure

```
Polls/
├── server/                 # Node.js + Express Backend
│   ├── config/             # DB Connection (MongoDB Mongoose)
│   ├── middleware/         # Auth & SuperAdmin Guards
│   ├── models/             # Poll, Vote, and Admin Schemas
│   ├── routes/             # Auth, Poll, and Analytics Routes
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── server.js           # Server Entry Point
│
└── client/                 # React + Vite Frontend
    ├── src/
    │   ├── api/            # Axios instance with credentials
    │   ├── components/     # PollCard, PollForm, AnalyticsCard, Navbar, etc.
    │   ├── context/        # AuthContext for admin session
    │   ├── pages/          # UserHome, AdminLogin, AdminDashboard, AdminAnalytics, AdminManagement
    │   ├── App.jsx         # App Routing
    │   ├── index.css       # Global WhatsApp Dark CSS System
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB connection URI

### 2. Environment Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CLIENT_URL=http://localhost:5173
```

### 3. Installation & Running

#### Start Backend Server:
```bash
cd server
npm install
npm run dev
```

#### Start Frontend Client:
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Default Admin Credentials

| Role | Username | Password | Login URL |
|---|---|---|---|
| Super Admin | `admin` | `admin123` | `http://localhost:5173/admin/login` |
