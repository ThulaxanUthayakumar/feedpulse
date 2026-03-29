import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import { analyzeWithGemini } from '../services/gemini.service';

export async function createFeedback(req: Request, res: Response) {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;
    if (!title?.trim() || !description?.trim() || !category)
      return res.status(400).json({ success: false, error: 'Title, description, category required' });
    if (title.length > 120)
      return res.status(400).json({ success: false, error: 'Title too long' });
    if (description.length < 20)
      return res.status(400).json({ success: false, error: 'Description too short (min 20 chars)' });

    const feedback = await Feedback.create({ title: title.trim(), description: description.trim(), category, submitterName, submitterEmail });

    // Run AI in background — don't block the response
    analyzeWithGemini(feedback.title, feedback.description).then(async (r) => {
      if (r) await Feedback.findByIdAndUpdate(feedback._id, {
        ai_category: r.category, ai_sentiment: r.sentiment,
        ai_priority: r.priority_score, ai_summary: r.summary,
        ai_tags: r.tags, ai_processed: true,
      });
    });

    return res.status(201).json({ success: true, data: feedback, message: 'Feedback submitted!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAllFeedback(req: Request, res: Response) {
  try {
    const { category, status, sort = 'createdAt', order = 'desc', page = 1, limit = 10, search } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { ai_summary: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Feedback.find(filter).sort({ [sort as string]: order === 'asc' ? 1 : -1 }).skip(skip).limit(Number(limit)),
      Feedback.countDocuments(filter),
    ]);
    return res.json({ success: true, data: items, error: null, message: null, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFeedbackById(req: Request, res: Response) {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: item });
  } catch { return res.status(400).json({ success: false, error: 'Invalid ID' }); }
}

export async function updateFeedback(req: Request, res: Response) {
  try {
    const { status } = req.body;
    if (!['New', 'In Review', 'Resolved'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const item = await Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: item });
  } catch { return res.status(400).json({ success: false, error: 'Invalid ID' }); }
}

export async function deleteFeedback(req: Request, res: Response) {
  try {
    const item = await Feedback.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: null, message: 'Deleted' });
  } catch { return res.status(400).json({ success: false, error: 'Invalid ID' }); }
}

export async function getSummary(req: Request, res: Response) {
  try {
    const since = new Date(); since.setDate(since.getDate() - 7);
    const items = await Feedback.find({ createdAt: { $gte: since }, ai_processed: true });
    if (!items.length) return res.json({ success: true, data: { summary: 'No processed feedback in last 7 days.' } });
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({ model: 'gemini-1.5-flash' });
    const condensed = items.map(i => `- ${i.title}: ${i.ai_summary}`).join('\n');
    const result = await model.generateContent(`Top 3 themes from this feedback:\n${condensed}`);
    return res.json({ success: true, data: { summary: result.response.text() } });
  } catch (err: any) { return res.status(500).json({ success: false, error: err.message }); }
}

export async function reanalyzeFeedback(req: Request, res: Response) {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    const r = await analyzeWithGemini(item.title, item.description);
    if (!r) return res.status(500).json({ success: false, error: 'AI failed' });
    const updated = await Feedback.findByIdAndUpdate(item._id,
      { ai_category: r.category, ai_sentiment: r.sentiment, ai_priority: r.priority_score, ai_summary: r.summary, ai_tags: r.tags, ai_processed: true },
      { new: true });
    return res.json({ success: true, data: updated });
  } catch { return res.status(400).json({ success: false, error: 'Invalid ID' }); }
}