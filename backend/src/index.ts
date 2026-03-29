import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.routes';
import feedbackRoutes from './routes/feedback.routes';
import User from './models/User';

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, error: 'Too many submissions. Try again in an hour.' } });

app.use('/api/auth', authRoutes);
app.use('/api/feedback', limiter, feedbackRoutes);
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));

mongoose.connect(process.env.MONGO_URI!).then(async () => {
  console.log('✅ MongoDB connected');
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!exists) {
    await User.create({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    console.log('✅ Admin user created');
  }
  app.listen(process.env.PORT || 4000, () => console.log(`✅ Server on port ${process.env.PORT || 4000}`));
});