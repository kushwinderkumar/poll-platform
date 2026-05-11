import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { usePollStore } from '../store/pollStore';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/polls/PollCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Poll } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { polls, setPolls, removePoll, updatePollInList, isLoading, setLoading } = usePollStore();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; pollId: string | null }>({ open: false, pollId: null });
  const [publishModal, setPublishModal] = useState<{ open: boolean; pollId: string | null }>({ open: false, pollId: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/polls/my');
      setPolls(res.data.data.polls);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setPolls]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleDelete = async () => {
    if (!deleteModal.pollId) return;
    setActionLoading(true);
    try {
      await api.delete(`/polls/${deleteModal.pollId}`);
      removePoll(deleteModal.pollId);
      toast.success('Poll deleted');
      setDeleteModal({ open: false, pollId: null });
    } catch {
      toast.error('Failed to delete poll');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!publishModal.pollId) return;
    setActionLoading(true);
    try {
      await api.post(`/polls/${publishModal.pollId}/publish`);
      const updatedPoll = polls.find((p) => p.id === publishModal.pollId);
      if (updatedPoll) {
        updatePollInList({ ...updatedPoll, is_published: true, is_active: false } as Poll);
      }
      toast.success('Results published! Anyone with the link can now view them.');
      setPublishModal({ open: false, pollId: null });
    } catch {
      toast.error('Failed to publish poll');
    } finally {
      setActionLoading(false);
    }
  };

  const activePolls = polls.filter((p) => p.is_active && !p.is_published);
  const publishedPolls = polls.filter((p) => p.is_published);
  const expiredPolls = polls.filter((p) => !p.is_active && !p.is_published);

  const totalResponses = polls.reduce((sum, p) => sum + (p.response_count || 0), 0);

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Manage your polls and track responses</p>
        </div>
        <Link to="/polls/create">
          <Button
            size="lg"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Poll
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Polls', value: polls.length, icon: '📋', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: activePolls.length, icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'Published', value: publishedPolls.length, icon: '📢', color: 'bg-purple-50 text-purple-700' },
          { label: 'Total Responses', value: totalResponses, icon: '💬', color: 'bg-orange-50 text-orange-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Polls */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading your polls...</p>
          </div>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-500 mb-6">Create your first poll and start collecting responses</p>
          <Link to="/polls/create">
            <Button size="lg">Create Your First Poll</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activePolls.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Active Polls ({activePolls.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onDelete={(id) => setDeleteModal({ open: true, pollId: id })}
                    onPublish={(id) => setPublishModal({ open: true, pollId: id })}
                  />
                ))}
              </div>
            </section>
          )}

          {publishedPolls.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                Published Results ({publishedPolls.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onDelete={(id) => setDeleteModal({ open: true, pollId: id })}
                  />
                ))}
              </div>
            </section>
          )}

          {expiredPolls.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                Expired Polls ({expiredPolls.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiredPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onDelete={(id) => setDeleteModal({ open: true, pollId: id })}
                    onPublish={(id) => setPublishModal({ open: true, pollId: id })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, pollId: null })}
        title="Delete Poll"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this poll? This action cannot be undone and all responses will be lost.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteModal({ open: false, pollId: null })}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth loading={actionLoading} onClick={handleDelete}>
            Delete Poll
          </Button>
        </div>
      </Modal>

      {/* Publish Modal */}
      <Modal
        isOpen={publishModal.open}
        onClose={() => setPublishModal({ open: false, pollId: null })}
        title="Publish Results"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Publishing will close the poll and make the results publicly visible to anyone with the link. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setPublishModal({ open: false, pollId: null })}>
            Cancel
          </Button>
          <Button fullWidth loading={actionLoading} onClick={handlePublish}>
            Publish Results
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
