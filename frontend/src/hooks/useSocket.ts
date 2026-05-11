import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

interface AuthState {
  token: string | null;
}

export const useSocket = () => {
  const token = useAuthStore((s: AuthState) => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket(token || undefined);
    return () => {
      // Keep persistent connection — don't disconnect on unmount
    };
  }, [token]);

  return socketRef.current;
};

export const usePollSocket = (
  pollId: string,
  onNewResponse?: (data: { pollId: string; totalResponses: number }) => void,
  onPublished?: (data: { pollId: string }) => void
) => {
  const token = useAuthStore((s: AuthState) => s.token);

  useEffect(() => {
    if (!pollId) return;
    const socket = getSocket(token || undefined);

    socket.emit('join:poll', pollId);

    if (onNewResponse) socket.on('response:new', onNewResponse);
    if (onPublished) socket.on('poll:published', onPublished);

    return () => {
      socket.emit('leave:poll', pollId);
      if (onNewResponse) socket.off('response:new', onNewResponse);
      if (onPublished) socket.off('poll:published', onPublished);
    };
  }, [pollId, token, onNewResponse, onPublished]);
};

export const useAnalyticsSocket = (
  pollId: string,
  onUpdate?: (data: { analytics: unknown }) => void
) => {
  const token = useAuthStore((s: AuthState) => s.token);

  useEffect(() => {
    if (!pollId || !token) return;
    const socket = getSocket(token);

    socket.emit('join:analytics', pollId);
    if (onUpdate) socket.on('analytics:update', onUpdate);

    return () => {
      socket.emit('leave:analytics', pollId);
      if (onUpdate) socket.off('analytics:update', onUpdate);
    };
  }, [pollId, token, onUpdate]);
};
