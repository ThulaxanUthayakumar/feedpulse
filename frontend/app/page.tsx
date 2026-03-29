'use client';
import { useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'];

export default function SubmitPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Bug',
    submitterName: '',
    submitterEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.description.trim().length < 20)
      e.description = 'Description must be at least 20 characters';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail))
      e.submitterEmail = 'Invalid email format';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus('loading');
    try {
      await api.post('/api/feedback', form);
      setStatus('success');
      setMessage('Feedback submitted! Our AI is analysing it now.');
      setForm({ title: '', description: '', category: 'Bug', submitterName: '', submitterEmail: '' });
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Submission failed. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">FeedPulse</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3">Submit Feedback</h1>
          <p className="text-gray-500 text-sm mt-1">
            Help us build what matters. AI will analyse your submission instantly.
          </p>
        </div>

        {/* Success message */}
        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ {message}
          </div>
        )}

        {/* Error message */}
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={120}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Brief description of your feedback"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${form.description.length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                {form.description.length}/1000
              </span>
            </div>
            <textarea
              maxLength={1000}
              rows={4}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe in detail (min 20 characters)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                type="text"
                value={form.submitterName}
                onChange={e => setForm(p => ({ ...p, submitterName: e.target.value }))}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={e => setForm(p => ({ ...p, submitterEmail: e.target.value }))}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.submitterEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.submitterEmail}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Admin?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </main>
  );
}