import { create } from 'zustand';
import { Poll, Analytics } from '../types';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  analytics: Analytics | null;
  isLoading: boolean;
  setPolls: (polls: Poll[]) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  setAnalytics: (analytics: Analytics | null) => void;
  setLoading: (loading: boolean) => void;
  addPoll: (poll: Poll) => void;
  removePoll: (id: string) => void;
  updatePollInList: (poll: Poll) => void;
}

export const usePollStore = create<PollState>((set) => ({
  polls: [],
  currentPoll: null,
  analytics: null,
  isLoading: false,
  setPolls: (polls: Poll[]) => set({ polls }),
  setCurrentPoll: (poll: Poll | null) => set({ currentPoll: poll }),
  setAnalytics: (analytics: Analytics | null) => set({ analytics }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  addPoll: (poll: Poll) => set((state: PollState) => ({ polls: [poll, ...state.polls] })),
  removePoll: (id: string) =>
    set((state: PollState) => ({ polls: state.polls.filter((p: Poll) => p.id !== id) })),
  updatePollInList: (poll: Poll) =>
    set((state: PollState) => ({
      polls: state.polls.map((p: Poll) => (p.id === poll.id ? poll : p)),
    })),
}));
