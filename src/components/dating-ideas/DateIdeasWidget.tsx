/**
 * DateIdeasWidget
 * Expandable dashboard widget showing AI-generated date ideas for the user's city.
 *
 * States:
 *  collapsed  → header only with summary
 *  expanded   → shows first 3 ideas + "Ver más" toggle
 *  feedback   → inline feedback form after "No me gustaron"
 *  personalizing → spinner while generating custom ideas
 */

import React, { useState } from 'react';
import {
  Heart,
  ChevronDown,
  ChevronUp,
  MapPin,
  Frown,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DateIdeaCard } from './DateIdeaCard';
import { useDateIdeas } from '../../hooks/useDateIdeas';

const INITIAL_VISIBLE = 3;

const QUICK_CHIPS = [
  'Prefiero actividades al aire libre',
  'Busco algo más económico',
  'Me gusta la música en vivo',
  'Quiero algo más romántico',
  'Prefiero actividades culturales',
  'Algo aventurero y diferente',
];

interface DateIdeasWidgetProps {
  /** Explicit city from user profile (skip GPS when provided) */
  profileCity?: string | null;
  /** Authenticated user id (for feedback persistence) */
  userId?: string;
}

export const DateIdeasWidget: React.FC<DateIdeasWidgetProps> = ({
  profileCity,
  userId,
}) => {
  const { status, ideas, city, error, today, submitFeedback, reload } =
    useDateIdeas(profileCity);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const isLoading = status === 'loading' || status === 'detecting-city';
  const isPersonalizing = status === 'personalizing';
  const hasError = status === 'error';
  const isEmpty = status === 'empty';

  const displayedIdeas = ideas
    ? showAll
      ? ideas.ideas
      : ideas.ideas.slice(0, INITIAL_VISIBLE)
    : [];

  const hiddenCount = ideas ? Math.max(0, ideas.ideas.length - INITIAL_VISIBLE) : 0;

  // ── Format today's date ───────────────────────────────────────────────────
  const formattedDate = new Date(today + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ── Feedback submit ───────────────────────────────────────────────────────
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !userId || !city) return;
    setShowFeedback(false);
    setShowAll(false);
    await submitFeedback(userId, feedbackText.trim());
    setFeedbackText('');
  };

  // ─── Header (always visible) ─────────────────────────────────────────────
  const header = (
    <button
      className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl"
      onClick={() => setIsExpanded((v) => !v)}
      aria-expanded={isExpanded}
      aria-label="Ideas para tu cita"
      data-testid="dating-ideas-toggle"
    >
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <div>
          <span className="font-semibold text-gray-900 dark:text-white">
            Ideas para tu cita hoy
            {city && (
              <span className="font-normal text-gray-500 dark:text-gray-400">
                {' '}
                en {city}
              </span>
            )}
          </span>
          {ideas && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {ideas.ideas.length} ideas · {formattedDate}
            </p>
          )}
          {isLoading && (
            <p className="text-xs text-gray-400 mt-0.5">Cargando ideas…</p>
          )}
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
    </button>
  );

  // ─── Body ────────────────────────────────────────────────────────────────
  let body: React.ReactNode = null;

  if (isLoading || isPersonalizing) {
    body = (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">
          {isPersonalizing ? 'Generando sugerencias personalizadas…' : 'Buscando ideas…'}
        </span>
      </div>
    );
  } else if (hasError) {
    body = (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={reload}
          className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    );
  } else if (isEmpty) {
    body = (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <MapPin className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {city
            ? 'No hay ideas disponibles hoy'
            : 'Configura tu ciudad en el perfil para ver ideas'}
        </p>
        {city && (
          <button
            onClick={reload}
            className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generar ideas
          </button>
        )}
      </div>
    );
  } else if (showFeedback) {
    body = (
      <div className="px-4 pb-4 space-y-3" data-testid="feedback-form">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          ¿Cómo podemos mejorar las sugerencias?
        </p>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setFeedbackText(chip)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                feedbackText === chip
                  ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-rose-300'
              }`}
              data-testid="feedback-chip"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Free text */}
        <textarea
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          placeholder="O escribe tu preferencia…"
          rows={2}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          data-testid="feedback-textarea"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim()}
            className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="feedback-submit"
          >
            Generar nuevas sugerencias →
          </button>
          <button
            onClick={() => { setShowFeedback(false); setFeedbackText(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  } else if (ideas) {
    // City note
    const cityNote = ideas.cityNote ? (
      <p className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400 italic">
        📍 {ideas.cityNote}
      </p>
    ) : null;

    body = (
      <div className="pb-2" data-testid="ideas-list">
        {cityNote}

        {/* Ideas */}
        <div className="px-4 space-y-2">
          {displayedIdeas.map((idea) => (
            <DateIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>

        {/* Show more */}
        {hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-2 py-2 text-sm text-rose-500 hover:text-rose-600"
            data-testid="show-more-btn"
          >
            Ver todas las ideas ({hiddenCount} más)
          </button>
        )}

        {/* Divider */}
        <div className="mx-4 mt-3 border-t border-gray-100 dark:border-gray-700" />

        {/* Feedback trigger */}
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center justify-center gap-2 mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          data-testid="dislike-btn"
        >
          <Frown className="w-4 h-4" />
          No me gustaron estas sugerencias
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      data-testid="dating-ideas-widget"
    >
      {header}

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {body}
        </div>
      )}
    </div>
  );
};

export default DateIdeasWidget;
