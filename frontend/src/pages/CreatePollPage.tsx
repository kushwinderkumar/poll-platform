import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { usePollStore } from '../store/pollStore';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { CreatePollForm, CreateQuestionForm } from '../types';

const emptyQuestion = (): CreateQuestionForm => ({
  text: '',
  is_mandatory: true,
  options: ['', ''],
});

export const CreatePollPage: React.FC = () => {
  const navigate = useNavigate();
  const { addPoll } = usePollStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreatePollForm>({
    title: '',
    description: '',
    is_anonymous: false,
    expires_at: '',
    questions: [emptyQuestion()],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    if (form.questions.length === 0) e.questions = 'Add at least one question';

    form.questions.forEach((q, qi) => {
      if (!q.text.trim()) e[`q_${qi}_text`] = 'Question text is required';
      const validOptions = q.options.filter((o) => o.trim());
      if (validOptions.length < 2) e[`q_${qi}_options`] = 'At least 2 options required';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || undefined,
        questions: form.questions.map((q) => ({
          ...q,
          options: q.options.filter((o) => o.trim()),
        })),
      };

      const res = await api.post('/polls', payload);
      addPoll(res.data.data.poll);
      toast.success('Poll created successfully! 🎉');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: { message: string }[] } } };
      const msg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Failed to create poll';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  };

  const removeQuestion = (qi: number) => {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));
  };

  const updateQuestion = (qi: number, updates: Partial<CreateQuestionForm>) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === qi ? { ...q, ...updates } : q)),
    }));
  };

  const addOption = (qi: number) => {
    updateQuestion(qi, { options: [...form.questions[qi].options, ''] });
  };

  const removeOption = (qi: number, oi: number) => {
    const opts = form.questions[qi].options.filter((_, i) => i !== oi);
    updateQuestion(qi, { options: opts });
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const opts = form.questions[qi].options.map((o, i) => (i === oi ? value : o));
    updateQuestion(qi, { options: opts });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Poll</h1>
          <p className="text-gray-500 mt-1">Build your poll, add questions, and share it with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Details */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Poll Details
            </h2>
            <div className="space-y-4">
              <Input
                label="Poll Title"
                placeholder="e.g. Team Lunch Preferences"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                error={errors.title}
                required
              />
              <Textarea
                label="Description (optional)"
                placeholder="Add context or instructions for respondents..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
          </Card>

          {/* Settings */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Poll Settings
            </h2>
            <div className="space-y-4">
              {/* Anonymous toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Anonymous Responses</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.is_anonymous
                      ? 'Anyone can respond without logging in'
                      : 'Respondents must be logged in'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_anonymous: !form.is_anonymous })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    form.is_anonymous ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Expiry */}
              <Input
                label="Expiry Date & Time (optional)"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                hint="Leave empty for no expiry"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </Card>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Questions
              </h2>
              <span className="text-sm text-gray-500">{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
            </div>

            {errors.questions && (
              <p className="text-sm text-red-600 mb-3">{errors.questions}</p>
            )}

            <div className="space-y-4">
              {form.questions.map((q, qi) => (
                <Card key={qi} className="relative">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-primary-600 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                        Q{qi + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">Question {qi + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Mandatory toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.is_mandatory}
                          onChange={(e) => updateQuestion(qi, { is_mandatory: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-600 font-medium">Mandatory</span>
                      </label>
                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qi)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Enter your question..."
                    value={q.text}
                    onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    error={errors[`q_${qi}_text`]}
                    rows={2}
                    className="mb-4"
                  />

                  {/* Options */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Answer Options</p>
                    {errors[`q_${qi}_options`] && (
                      <p className="text-xs text-red-600 mb-2">{errors[`q_${qi}_options`]}</p>
                    )}
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qi, oi)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add option
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Question
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" loading={loading} fullWidth>
              Create Poll & Get Link
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
