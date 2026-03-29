'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

type Feedback = {
  _id: string;
  title: string;
  category: string;
  status: string;
  ai_sentiment?: string;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-gray-100 text-gray-600',
  Negative: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  'In Review': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
};

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0, open: 0, avgPriority: '0', topTag: '—',
  });

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      params.set('sort', sortBy);
      params.set('page', String(page));
      params.set('limit', '10');

      const { data } = await api.get(`/api/feedback?${params}`);
      const feedbackItems: Feedback[] = data.data;
      setItems(feedbackItems);
      setTotal(data.meta.total);
      setPages(data.meta.pages);

      // Calculate stats
      const open = feedbackItems.filter(i => i.status !== 'Resolved').length;
      const withPriority = feedbackItems.filter(i => i.ai_priority);
      const avg = withPriority.length
        ? (withPriority.reduce((s, i) => s + (i.ai_priority || 0), 0) / withPriority.length).toFixed(1)
        : '0';
      const tagCounts: Record<string, number> = {};
      feedbackItems.forEach(i => i.ai_tags?.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }));
      const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      setStats({ total: data.meta.total, open, avgPriority: avg, topTag });
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, search, sortBy, page, router]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/api/feedback/${id}`, { status });
    fetchFeedback();
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this feedback permanently?')) return;
    await api.delete(`/api/feedback/${id}`);
    fetchFeedback();
  }

  async function reanalyze(id: string) {
    await api.post(`/api/feedback/${id}/reanalyze`);
    alert('Re-analysis triggered!');
    fetchFeedback();
  }

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const { data } = await api.get('/api/feedback/summary');
      setSummary(data.data.summary);
    } catch {
      setSummary('Could not load summary.');
    } finally {
      setSummaryLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('feedpulse_token');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top navbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <span className="font-semibold text-gray-900">FeedPulse</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-sm text-gray-500">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            View Submit Form
          </a>
          <button
            onClick={logout}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Feedback', value: stats.total },
            { label: 'Open Items', value: stats.open },
            { label: 'Avg Priority', value: stats.avgPriority },
            { label: 'Top Tag', value: stats.topTag },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* AI Summary section */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">AI Weekly Summary</h2>
            <button
              onClick={loadSummary}
              disabled={summaryLoading}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {summaryLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>
          {summary ? (
            <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
          ) : (
            <p className="text-sm text-gray-400">Click generate to get AI insights from the last 7 days.</p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
            />
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {['Bug', 'Feature Request', 'Improvement', 'Other'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {['New', 'In Review', 'Resolved'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt">Sort: Newest</option>
              <option value="ai_priority">Sort: Priority</option>
            </select>
          </div>
        </div>

        {/* Feedback list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No feedback found.</div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">

                    {/* Title row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      {item.ai_sentiment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SENTIMENT_COLORS[item.ai_sentiment] || 'bg-gray-100 text-gray-600'}`}>
                          {item.ai_sentiment}
                        </span>
                      )}
                      {item.ai_priority && (
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                          Priority: {item.ai_priority}/10
                        </span>
                      )}
                      {!item.ai_processed && (
                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                          AI pending...
                        </span>
                      )}
                    </div>

                    {/* AI Summary */}
                    {item.ai_summary && (
                      <p className="text-xs text-gray-500 mb-2">{item.ai_summary}</p>
                    )}

                    {/* Tags */}
                    {item.ai_tags && item.ai_tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {item.ai_tags.map(tag => (
                          <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Right side controls */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {['New', 'In Review', 'Resolved'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reanalyze(item._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Re-analyse
                      </button>
                      <button
                        onClick={() => deleteItem(item._id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {pages} ({total} total)
            </span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
