import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePollSocket } from '../hooks/useSocket';
import { PublicPollData, AnswerInput, Question } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

export const PublicPollPage: React.FC = () => {
  const { link } = useParams<{ link: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<PublicPollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await api.get(`/polls/public/${link}`);
      setData(res.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        toast.error('Poll not found');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [link, navigate]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  usePollSocket(
    data?.poll?.id || '',
    (socketData) => {
      setLiveCount(socketData.totalResponses);
    },
    () => {
      toast('Poll results have been published!', { icon: '📢' });
      fetchPoll();
    }
  );

  const validate = (): boolean => {
    if (!data?.questions) return false;
    const e: Record<string, string> = {};
    data.questions.forEach((q: Question) => {
      if (q.is_mandatory && !answers[q.id]) {
        e[q.id] = 'This question is required';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, option_id]) => ({
          question_id,
          option_id,
        })),
      };
      await api.post(`/polls/public/${link}/respond`, payload);
      setSubmitted(true);
      toast.success('Response submitted! Thank you 🎉');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Failed to submit response';
      if (msg.includes('Authentication required')) {
        toast.error('Please log in to respond to this poll');
        navigate(`/login?redirect=/p/${link}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { poll, view, questions, alreadyResponded, analytics } = data;

  // Expired view
  if (view === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Poll Expired</h1>
          <p className="text-gray-500 mb-6">This poll is no longer accepting responses.</p>
          <p className="text-lg font-semibold text-gray-800">{poll.title}</p>
          {poll.expires_at && (
            <p className="text-sm text-gray-400 mt-2">
              Expired {formatDistanceToNow(new Date(poll.expires_at))} ago
            </p>
          )}
        </div>
      </div>
    );
  }

  // Results view
  if (view === 'results' && analytics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-white">
              <Badge variant="purple" className="mb-3 bg-white/20 text-white border-0">Published Results</Badge>
              <h1 className="text-2xl font-bold mb-1">{poll.title}</h1>
              {poll.description && <p className="text-white/80 text-sm">{poll.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
                <span>{analytics.total_responses} total responses</span>
              </div>
            </div>
          </div>

          {analytics.questions.map((qa, idx) => (
            <div key={qa.question.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{qa.question.text}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{qa.total_answers} responses</p>
                </div>
              </div>
              <div className="space-y-3">
                {qa.options.map((oa) => (
                  <div key={oa.option.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{oa.option.text}</span>
                      <span className="font-semibold text-gray-900">{oa.count} ({oa.percentage}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
                        style={{ width: `${oa.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Already responded
  if (alreadyResponded || submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {submitted ? 'Response Submitted!' : 'Already Responded'}
          </h1>
          <p className="text-gray-500 mb-2">
            {submitted
              ? 'Thank you for your feedback!'
              : 'You have already submitted a response to this poll.'}
          </p>
          <p className="text-lg font-semibold text-gray-800 mt-4">{poll.title}</p>
          {liveCount !== null && (
            <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {liveCount} total responses
            </p>
          )}
          {!isAuthenticated && (
            <Button className="mt-6" onClick={() => navigate('/register')}>
              Create Your Own Poll
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Poll form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Poll header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="info" className="bg-white/20 text-white border-0">
                {poll.is_anonymous ? '🔒 Anonymous' : '👤 Authenticated'}
              </Badge>
              {poll.expires_at && (
                <Badge variant="warning" className="bg-white/20 text-white border-0">
                  ⏱ Expires {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-1">{poll.title}</h1>
            {poll.description && <p className="text-white/80 text-sm">{poll.description}</p>}
            {liveCount !== null && (
              <p className="text-sm text-white/70 mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                {liveCount} responses so far
              </p>
            )}
          </div>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions?.map((q: Question, idx: number) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {q.text}
                    {q.is_mandatory && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {!q.is_mandatory && (
                    <span className="text-xs text-gray-400">Optional</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === opt.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      answers[q.id] === opt.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[q.id] === opt.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => {
                        setAnswers({ ...answers, [q.id]: opt.id });
                        setErrors({ ...errors, [q.id]: '' });
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm text-gray-800 font-medium">{opt.text}</span>
                  </label>
                ))}
              </div>

              {errors[q.id] && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors[q.id]}
                </p>
              )}
            </div>
          ))}

          <div className="pb-8">
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Submit Response
            </Button>
            {!isAuthenticated && !poll.is_anonymous && (
              <p className="text-center text-sm text-gray-500 mt-3">
                This poll requires you to{' '}
                <a href={`/login?redirect=/p/${link}`} className="text-primary-600 font-medium">
                  sign in
                </a>{' '}
                to respond
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
