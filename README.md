# FeedPulse — AI-Powered Product Feedback Platform

FeedPulse lets teams collect product feedback and uses Google Gemini AI to automatically categorise, prioritise, and summarise submissions.

## Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB, Mongoose
- **AI:** Google Gemini 1.5 Flash

## How to Run Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally

### Backend
```bash
cd backend
npm install
# Create .env with values shown below
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables (backend/.env)
```
MONGO_URI=mongodb://localhost:27017/feedpulse
GEMINI_API_KEY=your_key
JWT_SECRET=your_secret
PORT=4000
ADMIN_EMAIL=admin@feedpulse.com
ADMIN_PASSWORD=Admin123!
```

## Admin Login
- URL: http://localhost:3000/login
- Email: admin@feedpulse.com
- Password: Admin123!


