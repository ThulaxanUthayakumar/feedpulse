import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  title: string; description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string; submitterEmail?: string;
  ai_category?: string; ai_sentiment?: string;
  ai_priority?: number; ai_summary?: string;
  ai_tags?: string[]; ai_processed: boolean;
  createdAt: Date; updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  title: { type: String, required: true, maxlength: 120, trim: true },
  description: { type: String, required: true, minlength: 20, trim: true },
  category: { type: String, enum: ['Bug', 'Feature Request', 'Improvement', 'Other'], required: true },
  status: { type: String, enum: ['New', 'In Review', 'Resolved'], default: 'New' },
  submitterName: { type: String, trim: true },
  submitterEmail: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  ai_category: String, ai_sentiment: String,
  ai_priority: { type: Number, min: 1, max: 10 },
  ai_summary: String, ai_tags: [String],
  ai_processed: { type: Boolean, default: false },
}, { timestamps: true });

FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ ai_priority: -1 });
FeedbackSchema.index({ createdAt: -1 });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);