import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../services/api';
import { useAnalyticsSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Analytics, QuestionAnalytics } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { getPollShareUrl } from '../utils/shareUrl';

const COLORS = ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/polls/${id}/analytics`);
      setAnalytics(res.data.data.analytics);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useAnalyticsSocket(id || '', (data) => {
    setAnalytics(data.analytics as Analytics);
    setLiveIndicator(true);
    setTimeout(() => setLiveIndicator(false), 2000);
  });

  const handlePublish = async () => {
    if (!analytics) return;
    setPublishing(true);
    try {
      await api.post(`/polls/${id}/publish`);
      setAnalytics({ ...analytics, poll: { ...analytics.poll, is_published: true, is_active: false } });
      toast.success('Results published successfully!');
    } catch {
      toast.error('Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  const copyShareLink = () => {
    if (!analytics) return;
    const url = getPollShareUrl(analytics.poll.public_link);
    navigator.clipboard.writeText(url);
    toast.success('Link copied! Share it with anyone on your network 🔗');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  const { poll, total_responses, questions, recent_responses } = analytics;
  const shareUrl = getPollShareUrl(poll.public_link);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {poll.is_published ? (
                <Badge variant="purple" dot>Published</Badge>
              ) : poll.is_active ? (
                <Badge variant="success" dot>Active</Badge>
              ) : (
                <Badge variant="danger" dot>Expired</Badge>
              )}
              {poll.is_anonymous && <Badge variant="gray">Anonymous</Badge>}
              {liveIndicator && (
                <Badge variant="info" dot>Live Update</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyShareLink} icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }>
              Copy Link
            </Button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              }>
                View Poll
              </Button>
            </a>
            {!poll.is_published && (
              <Button size="sm" loading={publishing} onClick={handlePublish} icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }>
                Publish Results
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Responses',
              value: total_responses,
              icon: '💬',
              color: 'from-blue-500 to-blue-600',
            },
            {
              label: 'Questions',
              value: questions.length,
              icon: '❓',
              color: 'from-purple-500 to-purple-600',
            },
            {
              label: 'Avg. Completion',
              value: `${questions.length > 0
                ? Math.round(questions.reduce((s, q) => s + q.response_rate, 0) / questions.length)
                : 0}%`,
              icon: '📈',
              color: 'from-green-500 to-green-600',
            },
            {
              label: 'Status',
              value: poll.is_published ? 'Published' : poll.is_active ? 'Active' : 'Closed',
              icon: poll.is_published ? '📢' : poll.is_active ? '✅' : '🔒',
              color: 'from-orange-500 to-orange-600',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${stat.color} p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Poll info */}
        {poll.expires_at && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(poll.expires_at) > new Date()
                ? `Expires ${formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}`
                : `Expired ${formatDistanceToNow(new Date(poll.expires_at))} ago`}
            </div>
          </Card>
        )}

        {total_responses === 0 ? (
          <Card className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-500 mb-4">Share your poll link to start collecting responses</p>
            <Button onClick={copyShareLink} variant="outline">Copy Poll Link</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {questions.map((qa: QuestionAnalytics, idx: number) => {
              const barData = qa.options.map((oa) => ({
                name: oa.option.text.length > 20 ? oa.option.text.substring(0, 20) + '…' : oa.option.text,
                fullName: oa.option.text,
                count: oa.count,
                percentage: oa.percentage,
              }));

              const pieData = qa.options
                .filter((oa) => oa.count > 0)
                .map((oa) => ({
                  name: oa.option.text,
                  value: oa.count,
                }));

              return (
                <Card key={qa.question.id}>
                  <div className="flex items-start gap-3 mb-6">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{qa.question.text}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{qa.total_answers} answers</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{qa.response_rate}% response rate</span>
                        {qa.question.is_mandatory ? (
                          <Badge variant="danger" className="text-xs">Required</Badge>
                        ) : (
                          <Badge variant="gray" className="text-xs">Optional</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-3 mb-6">
                    {qa.options.map((oa, oIdx) => (
                      <div key={oa.option.id}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-700 font-medium">{oa.option.text}</span>
                          <span className="text-gray-500 font-semibold">
                            {oa.count} <span className="text-gray-400 font-normal">({oa.percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${oa.percentage}%`,
                              backgroundColor: COLORS[oIdx % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  {qa.total_answers > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      {/* Bar chart */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Response Count</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                              formatter={(value, _name, props) => [
                                `${value} (${props.payload.percentage}%)`,
                                props.payload.fullName,
                              ]}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {barData.map((_entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Pie chart */}
                      {pieData.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Distribution</p>
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((_entry, index) => (
                                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} responses`]} />
                              <Legend
                                formatter={(value) =>
                                  value.length > 15 ? value.substring(0, 15) + '…' : value
                                }
                                iconSize={10}
                                wrapperStyle={{ fontSize: '11px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Recent responses */}
            {recent_responses.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Responses
                </h3>
                <div className="space-y-2">
                  {recent_responses.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {r.respondent_name ? r.respondent_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="text-sm text-gray-700">
                          {r.respondent_name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(r.submitted_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
