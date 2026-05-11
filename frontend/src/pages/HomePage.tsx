import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-accent-900 font-sans">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">PollCraft</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-5 py-2 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-sm shadow-lg">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-white/80 hover:text-white font-medium text-sm transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-sm shadow-lg">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Real-time polls with live analytics
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Create polls that
          <span className="block bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
            people actually answer
          </span>
        </h1>

        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Build beautiful polls, share them instantly, and watch responses roll in with live analytics.
          Perfect for teams, events, and research.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/polls/create' : '/register'}
            className="px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 transition-all shadow-2xl hover:shadow-white/20 text-base"
          >
            Create Your First Poll →
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-base"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              From creation to analytics, PollCraft handles the full lifecycle of your polls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Real-time Updates',
                desc: 'Watch responses come in live with WebSocket-powered analytics. No refresh needed.',
              },
              {
                icon: '🔒',
                title: 'Anonymous & Authenticated',
                desc: 'Choose between anonymous responses or require login for accountability.',
              },
              {
                icon: '⏱️',
                title: 'Expiry Control',
                desc: 'Set expiry times on polls. They automatically close when time runs out.',
              },
              {
                icon: '📊',
                title: 'Rich Analytics',
                desc: 'Detailed breakdowns per question, option counts, and participation insights.',
              },
              {
                icon: '🔗',
                title: 'Shareable Links',
                desc: 'Every poll gets a unique public link. Share it anywhere, instantly.',
              },
              {
                icon: '📢',
                title: 'Publish Results',
                desc: 'Publish final results so anyone with the link can see the outcome.',
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start polling?</h2>
          <p className="text-white/80 text-lg mb-8">Join thousands of creators using PollCraft to gather feedback.</p>
          <Link
            to={isAuthenticated ? '/polls/create' : '/register'}
            className="inline-block px-10 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 transition-all shadow-2xl text-base"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
};
