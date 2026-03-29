import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getSummary,
  reanalyzeFeedback,
} from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/auth';

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many submissions. Try again in an hour.' },
});

const router = Router();

router.get('/summary', requireAuth, getSummary);
router.post('/', submitLimiter, createFeedback);      // ← limiter only here
router.get('/', requireAuth, getAllFeedback);
router.get('/:id', requireAuth, getFeedbackById);
router.patch('/:id', requireAuth, updateFeedback);
router.delete('/:id', requireAuth, deleteFeedback);
router.post('/:id/reanalyze', requireAuth, reanalyzeFeedback);

export default router;