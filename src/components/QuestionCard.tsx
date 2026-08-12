import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { CheckCircle2, XCircle, Star, Sparkles, HelpCircle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  userAnswer?: number;
  onSelectOption: (optionIndex: number) => void;
  isStarred: boolean;
  onToggleStar: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  userAnswer,
  onSelectOption,
  isStarred,
  onToggleStar,
}) => {
  const [shakingOption, setShakingOption] = useState<number | null>(null);

  const isAnswered = userAnswer !== undefined;
  const isCorrect = isAnswered && userAnswer === question.correctOptionIndex;

  const handleOptionClick = (index: number) => {
    if (isAnswered) return; // Prevent changing after answered unless reset

    onSelectOption(index);

    if (index === question.correctOptionIndex) {
      // Trigger Confetti Celebratory Effect with Stars
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ec4899', '#f97316', '#eab308', '#a855f7'],
      });
    } else {
      // Trigger Shake animation
      setShakingOption(index);
      setTimeout(() => setShakingOption(null), 500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-6 relative overflow-hidden transition-all">
      {/* Top Header info */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-pink-100 text-pink-700 font-extrabold text-xs rounded-full">
            السؤال {questionIndex + 1} من {totalQuestions}
          </span>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {question.sourceType === 'table' ? 'أسئلة الجدول' : 'أسئلة الفقرة'}
          </span>
        </div>

        {/* Star Question Button */}
        <button
          onClick={onToggleStar}
          className={`p-2 rounded-xl border transition-all btn-press flex items-center gap-1.5 text-xs font-bold ${
            isStarred
              ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-amber-500'
          }`}
          title="حفظ السؤال للمراجعة لاحقاً"
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
          <span className="hidden sm:inline">{isStarred ? 'مميّز بنجمة' : 'تمبيز بنجمة'}</span>
        </button>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {question.options.map((optionText, idx) => {
          const isSelected = userAnswer === idx;
          const isCorrectOption = idx === question.correctOptionIndex;
          const isShaking = shakingOption === idx;

          let btnStyles =
            'border-slate-200 hover:border-pink-300 bg-slate-50/50 hover:bg-pink-50/40 text-slate-800';

          if (isAnswered) {
            if (isCorrectOption) {
              btnStyles =
                'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-200';
            } else if (isSelected && !isCorrect) {
              btnStyles =
                'border-rose-400 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-200';
            } else {
              btnStyles = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
            }
          }

          // Positional Option Prefix (أ، ب، ج، د)
          const optionPrefixes = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
          const prefix = optionPrefixes[idx] || `${idx + 1}`;

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleOptionClick(idx)}
              className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between text-sm sm:text-base btn-press ${btnStyles} ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isAnswered && isCorrectOption
                      ? 'bg-emerald-600 text-white'
                      : isAnswered && isSelected && !isCorrect
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {prefix}
                </span>
                <span className="font-medium">{optionText}</span>
              </div>

              {isAnswered && isCorrectOption && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner & Explanation */}
      {isAnswered && (
        <div className="space-y-3 pt-2 animate-fade-in">
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isCorrect ? (
              <>
                <div className="p-2 bg-emerald-500 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">إجابة صحيحة! أحسنت ⭐</h4>
                  <p className="text-xs opacity-90">ممتاز، واصل المراجعة بدقة.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-rose-500 text-white rounded-xl">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">إجابة خاطئة!</h4>
                  <p className="text-xs opacity-90">
                    الخيار الصحيح هو: الخيار ({['أ', 'ب', 'ج', 'د'][question.correctOptionIndex]}) — {question.options[question.correctOptionIndex]}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Verbatim Explanation */}
          {question.explanation && (
            <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 text-orange-950 text-xs sm:text-sm leading-relaxed space-y-1">
              <div className="font-bold text-orange-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-orange-600" />
                <span>التعليل الفقهي والمصدر الحرفي:</span>
              </div>
              <p className="mr-5 text-slate-700 font-medium">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
