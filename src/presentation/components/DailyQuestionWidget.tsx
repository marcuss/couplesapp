/**
 * DailyQuestionWidget
 * Dashboard widget for the daily question feature.
 *
 * States:
 * - Unanswered: shows question + text input + submit button
 * - Waiting: shows confirmation + "waiting for partner" message
 * - Reveal: shows both answers side by side
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Heart, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { DailyQuestionState } from '../../application/services/IDailyQuestionService';

type CoupleId = string;

interface Props {
  coupleId?: CoupleId;
}

export const DailyQuestionWidget: React.FC<Props> = ({ coupleId }) => {
  const { t, i18n } = useTranslation();
  const { user, partner } = useAuth();
  const { dailyQuestionService } = useServices();

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

  const effectiveCoupleId = coupleId ?? (user as { coupleId?: string } | null)?.coupleId ?? '';

  const loadData = useCallback(async () => {
    if (!effectiveCoupleId) return;
    const data = await dailyQuestionService.loadTodayData(effectiveCoupleId);
    setState(data);
  }, [effectiveCoupleId, dailyQuestionService]);

  useEffect(() => {
    if (effectiveCoupleId) {
      void dailyQuestionService.loadTodayData(effectiveCoupleId).then(data => setState(data));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCoupleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCoupleId || !state.question || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await dailyQuestionService.submitAnswer(
      effectiveCoupleId,
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

  // ── Loading ──────────────────────────────────────────────────────────────

  if (state.isLoading) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 flex items-center justify-center min-h-[120px] border border-rose-100 dark:border-rose-900">
        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
      </div>
    );
  }

  // ── Error / No couple ────────────────────────────────────────────────────

  if (state.error || !effectiveCoupleId) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 border border-rose-100 dark:border-rose-900">
        <div className="flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{state.error ?? t('dailyQuestion.noCouple', 'Connect with a partner to see your daily question')}</span>
        </div>
      </div>
    );
  }

  // ── No question available ─────────────────────────────────────────────────

  if (!state.question) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 border border-rose-100 dark:border-rose-900">
        <p className="text-rose-500 text-sm">{t('dailyQuestion.noQuestion', 'No question available today')}</p>
      </div>
    );
  }

  // ── Both answered — Reveal ────────────────────────────────────────────────

  if (state.bothAnswered) {
    return (
      <Link to="/daily-question" className="block group">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 border border-rose-100 dark:border-rose-900 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span className="text-xs font-medium text-rose-500 uppercase tracking-wide">
                {t('dailyQuestion.bothAnswered', "Today's Question")}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4 line-clamp-2">{questionText}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className="text-xs text-rose-400 font-medium mb-1">{user?.name ?? t('dailyQuestion.you', 'You')}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{state.myAnswer?.answer}</p>
            </div>
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className="text-xs text-pink-400 font-medium mb-1">{partner?.name ?? t('dailyQuestion.partner', 'Partner')}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{state.partnerAnswer?.answer}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Answered but waiting for partner ─────────────────────────────────────

  if (state.myAnswer) {
    return (
      <Link to="/daily-question" className="block group">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 border border-rose-100 dark:border-rose-900 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-medium text-rose-500 uppercase tracking-wide">
                {t('dailyQuestion.title', "Today's Question")}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4 line-clamp-2">{questionText}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              ✓ {t('dailyQuestion.yourAnswerSaved', 'Your answer saved.')}
              {' '}
              {t('dailyQuestion.waitingFor', 'Waiting for')}{' '}
              <strong>{partner?.name ?? t('dailyQuestion.partner', 'partner')}</strong>…
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ── Not yet answered — Show input ─────────────────────────────────────────

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-6 border border-rose-100 dark:border-rose-900">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-rose-500" />
        <span className="text-xs font-medium text-rose-500 uppercase tracking-wide">
          {t('dailyQuestion.title', "Today's Question")}
        </span>
      </div>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">{questionText}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder={t('dailyQuestion.answerPlaceholder', 'Share your thoughts...')}
          className="w-full rounded-xl border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-white/10 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none min-h-[80px]"
          rows={3}
          disabled={isSubmitting}
        />
        {submitError && (
          <p className="text-xs text-red-500">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !answerText.trim()}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('dailyQuestion.submitting', 'Saving...')}</>
          ) : (
            <><Heart className="w-4 h-4" />{t('dailyQuestion.submit', 'Share My Answer')}</>
          )}
        </button>
      </form>
    </div>
  );
};
