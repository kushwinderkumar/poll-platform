import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Poll } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDistanceToNow, isPast } from 'date-fns';
import { getPollShareUrl } from '../../utils/shareUrl';

interface PollCardProps {
  poll: Poll;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onDelete, onPublish }) => {
  const isExpired = poll.expires_at ? isPast(new Date(poll.expires_at)) : false;
  const shareUrl = getPollShareUrl(poll.public_link);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusBadge = () => {
    if (poll.is_published) return <Badge variant="purple" dot>Published</Badge>;
    if (isExpired || !poll.is_active) return <Badge variant="danger" dot>Expired</Badge>;
    return <Badge variant="success" dot>Active</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base group-hover:text-primary-600 transition-colors">
              {poll.title}
            </h3>
            {poll.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{poll.description}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {poll.question_count ?? 0} questions
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {poll.response_count ?? 0} responses
          </span>
          {poll.is_anonymous && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Anonymous
            </span>
          )}
        </div>

        {poll.expires_at && (
          <p className="text-xs text-gray-400 mb-3">
            {isExpired
              ? `Expired ${formatDistanceToNow(new Date(poll.expires_at))} ago`
              : `Expires in ${formatDistanceToNow(new Date(poll.expires_at))}`}
          </p>
        )}

        {/* Share link */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs text-gray-500 truncate flex-1" title={shareUrl}>{shareUrl}</span>
          <button
            onClick={copyLink}
            className={`text-xs font-medium flex-shrink-0 transition-colors ${
              copied ? 'text-green-600' : 'text-primary-600 hover:text-primary-700'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/polls/${poll.id}/analytics`}>
            <Button variant="outline" size="sm" icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }>
              Analytics
            </Button>
          </Link>

          {!poll.is_published && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPublish?.(poll.id)}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Publish
            </Button>
          )}

          <button
            onClick={() => onDelete?.(poll.id)}
            className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete poll"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
