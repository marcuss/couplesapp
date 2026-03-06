/**
 * DailyQuestionPage
 * Full-page view of today's daily question.
 * Shows the question, answer input (if not answered), and reveals both answers once both partners have answered.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, MessageCircle, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { DailyQuestionState } from '../../application/services/IDailyQuestionService';

const CATEGORY_LABELS: Record<string, string> = {
  communication: '💬 Communication',
  intimacy: '💕 Intimacy',
  dreams: '🌟 Dreams',
  memories: '📸 Memories',
  values: '🌿 Values',
  fun: '😄 Fun',
  gratitude: '🙏 Gratitude',
  conflict: '🤝 Conflict',
  finances: '💰 Finances',
  growth: '🌱 Growth',
  family: '👨‍👩‍👧 Family',
  adventure: '🗺️ Adventure',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Light',
  2: 'Reflective',
  3: 'Deep',
};

export const DailyQuestionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, partner } = useAuth();
  const { dailyQuestionService } = useServices();

  const coupleId = (user as { coupleId?: string } | null)?.coupleId ?? '';

  const [state, setState] = useState<DailyQuestionState>({
    question: null,
    myAnswer: null,
    partnerAnswer: null,
    bothAnswered: false,
    isLoading: true,
    error: null,
  });
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!coupleId) return;
    const data = await dailyQuestionService.loadTodayData(coupleId);
    setState(data);
  }, [coupleId, dailyQuestionService]);

  useEffect(() => {
    if (coupleId) {
      void dailyQuestionService.loadTodayData(coupleId).then(data => setState(data));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !state.question || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await dailyQuestionService.submitAnswer(
      coupleId,
      state.question.questionId,
      user.id,
      answerText
    );

    if (result.ok) {
      setAnswerText('');
      await loadData();
    } else {
      setSubmitError(result.error ?? t('errors.generic'));
    }

    setIsSubmitting(false);
  };

  const lang = i18n.language?.slice(0, 2) || 'en';
  const questionText = state.question?.translations[lang] ?? state.question?.translations['en'] ?? '';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-950 dark:via-gray-900 dark:to-pink-950 px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard"
          className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors text-rose-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            {t('dailyQuestion.pageTitle', "Today's Question")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
        </div>
      </div>

      {/* Loading */}
      {state.isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
        </div>
      )}

      {/* Error */}
      {!state.isLoading && state.error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{state.error}</p>
        </div>
      )}

      {/* Question */}
      {!state.isLoading && state.question && (
        <div className="space-y-6">
          {/* Question card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 px-3 py-1 rounded-full font-medium">
                {CATEGORY_LABELS[state.question.category] ?? state.question.category}
              </span>
              <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 px-3 py-1 rounded-full font-medium">
                {DIFFICULTY_LABELS[state.question.difficulty] ?? 'Medium'}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{questionText}</p>
          </div>

          {/* Unanswered — show form */}
          {!state.myAnswer && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-rose-500" />
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  {t('dailyQuestion.yourAnswer', 'Your Answer')}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={t('dailyQuestion.answerPlaceholder', 'Share your thoughts honestly...')}
                  className="w-full rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/50 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  rows={5}
                  disabled={isSubmitting}
                />
                {submitError && (
                  <p className="text-sm text-red-500">{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !answerText.trim()}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t('dailyQuestion.submitting', 'Saving...')}</>
                  ) : (
                    <><Heart className="w-4 h-4 fill-white" />{t('dailyQuestion.submit', 'Share My Answer')}</>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                {t('dailyQuestion.revealHint', "You'll see your partner's answer after they reply too")}
              </p>
            </div>
          )}

          {/* Answered, waiting for partner */}
          {state.myAnswer && !state.bothAnswered && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h2 className="font-semibold text-gray-800 dark:text-white">
                    {t('dailyQuestion.yourAnswer', 'Your Answer')}
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{state.myAnswer.answer}</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-center gap-4">
                <Clock className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {t('dailyQuestion.waitingTitle', 'Waiting for your partner')}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {t('dailyQuestion.waitingFor', 'Waiting for')}{' '}
                    <strong>{partner?.name ?? t('dailyQuestion.partner', 'your partner')}</strong>{' '}
                    {t('dailyQuestion.toAnswer', 'to answer...')}
                    {' '}
                    {t('dailyQuestion.willReveal', "Their answer will be revealed once they reply.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Both answered — full reveal */}
          {state.bothAnswered && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mt-1">
                  {t('dailyQuestion.bothAnsweredBanner', 'You both answered! Here are your responses:')}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* My answer */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-rose-100 dark:border-rose-900">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-sm font-bold text-rose-600 dark:text-rose-300">
                      {(user?.name ?? 'Y').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {user?.name ?? t('dailyQuestion.you', 'You')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{state.myAnswer?.answer}</p>
                </div>

                {/* Partner's answer */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-pink-100 dark:border-pink-900">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-sm font-bold text-pink-600 dark:text-pink-300">
                      {(partner?.name ?? 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {partner?.name ?? t('dailyQuestion.partner', 'Partner')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{state.partnerAnswer?.answer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
