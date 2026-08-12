import React, { useState } from 'react';
import { Paragraph, Question, KeyPoint, TableData } from '../types';
import {
  ArrowRight,
  Sparkles,
  Table as TableIcon,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { QuestionCard } from './QuestionCard';

interface ParagraphViewProps {
  paragraph: Paragraph;
  keyPoints: KeyPoint[];
  questions: Question[];
  tableData?: TableData;
  initialMode?: 'paragraph' | 'table';
  onBack: () => void;
  userAnswers: Record<string, number>;
  onSelectOption: (questionId: string, optionIndex: number) => void;
  onResetParagraphProgress: (paragraphId: string) => void;
  starredQuestionIds: string[];
  onToggleStarQuestion: (questionId: string) => void;
}

export const ParagraphView: React.FC<ParagraphViewProps> = ({
  paragraph,
  keyPoints,
  questions,
  tableData,
  initialMode = 'paragraph',
  onBack,
  userAnswers,
  onSelectOption,
  onResetParagraphProgress,
  starredQuestionIds,
  onToggleStarQuestion,
}) => {
  const [activeSourceType, setActiveSourceType] = useState<'paragraph' | 'table'>(initialMode);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Filter questions by activeSourceType ('paragraph' or 'table')
  const activeQuestions = questions.filter(q => q.sourceType === activeSourceType);
  const currentQuestion = activeQuestions[currentQuestionIndex];

  // Calculate score percentage
  const answeredCount = activeQuestions.filter(q => userAnswers[q.id] !== undefined).length;
  const correctCount = activeQuestions.filter(
    q => userAnswers[q.id] !== undefined && userAnswers[q.id] === q.correctOptionIndex
  ).length;

  const scorePercentage =
    activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;

  const isCompletedAll = activeQuestions.length > 0 && answeredCount === activeQuestions.length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="p-2.5 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-300 text-slate-700 rounded-2xl transition-all btn-press flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4 text-pink-600" />
          <span>العودة لقائمة الفقرات</span>
        </button>

        {/* Reset Progress Button for this specific paragraph */}
        <button
          onClick={() => {
            onResetParagraphProgress(paragraph.id);
            setCurrentQuestionIndex(0);
          }}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl transition-all btn-press flex items-center gap-1.5 text-xs font-bold"
          title="مسح إجابات هذا الدرس وإعادته من الصفر"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة تعبئة الفقرة من الصفر</span>
        </button>
      </div>

      {/* Paragraph Title & Summary */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-pink-100 text-pink-700 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
            {paragraph.title}
          </h2>
        </div>

        {/* Key Points before questions */}
        {keyPoints.length > 0 && (
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>النقاط المفتاحية والشرح المختصر:</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-950 list-disc list-inside font-medium pr-1">
              {keyPoints.map(kp => (
                <li key={kp.id}>{kp.text}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Paragraph content if present */}
        {paragraph.content && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {paragraph.content}
          </div>
        )}

        {/* SECTION 3.4: Table rendering if present */}
        {paragraph.hasTable && tableData && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-orange-700">
                <TableIcon className="w-4 h-4 text-orange-500" />
                <span>{tableData.title || 'جدول المقارنة والتفاصيل:'}</span>
              </div>

              {/* Mode switch button */}
              <button
                onClick={() => {
                  setActiveSourceType('table');
                  setCurrentQuestionIndex(0);
                }}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm btn-press flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>اختبرني بهذا الجدول</span>
              </button>
            </div>

            {/* Render Table Image if uploaded */}
            {tableData.imageUrl && (
              <div className="rounded-2xl border border-orange-200 bg-white p-2 text-center shadow-sm">
                <img
                  src={tableData.imageUrl}
                  alt={tableData.title || 'صورة جدول المقارنة'}
                  className="max-w-full max-h-[500px] mx-auto object-contain rounded-xl"
                />
              </div>
            )}

            {/* Render Text Table Grid if headers exist */}
            {tableData.headers && tableData.headers.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-orange-100/70 text-orange-950 font-black border-b border-orange-200">
                      {tableData.headers.map((h, i) => (
                        <th key={i} className="p-3 border-l last:border-l-0 border-orange-200/60">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-3 border-t border-l last:border-l-0 border-slate-200 text-slate-700 font-medium"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Source Type Selector Tabs (Paragraph Questions vs Table Questions) */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => {
            setActiveSourceType('paragraph');
            setCurrentQuestionIndex(0);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all btn-press flex items-center justify-center gap-1.5 ${
            activeSourceType === 'paragraph'
              ? 'bg-white text-pink-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>أسئلة الفقرة ({questions.filter(q => q.sourceType === 'paragraph').length})</span>
        </button>

        {paragraph.hasTable && (
          <button
            onClick={() => {
              setActiveSourceType('table');
              setCurrentQuestionIndex(0);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all btn-press flex items-center justify-center gap-1.5 ${
              activeSourceType === 'table'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>أسئلة الجدول ({questions.filter(q => q.sourceType === 'table').length})</span>
          </button>
        )}
      </div>

      {/* Question Jumper Grid & Progress */}
      {activeQuestions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>التنقل السريع بين الأسئلة:</span>
            <span className="text-pink-600">
              المجابة: {answeredCount} / {activeQuestions.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeQuestions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = currentQuestionIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all btn-press ${
                    isCurrent
                      ? 'ring-2 ring-pink-500 bg-pink-500 text-white scale-105 shadow-sm'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion ? (
        <div className="space-y-6">
          <QuestionCard
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={activeQuestions.length}
            userAnswer={userAnswers[currentQuestion.id]}
            onSelectOption={optIdx => onSelectOption(currentQuestion.id, optIdx)}
            isStarred={starredQuestionIds.includes(currentQuestion.id)}
            onToggleStar={() => onToggleStarQuestion(currentQuestion.id)}
          />

          {/* Navigation Controls (Back & Next) */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed btn-press flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السؤال السابق</span>
            </button>

            <button
              disabled={currentQuestionIndex === activeQuestions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-xs font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed btn-press flex items-center gap-1 shadow-sm"
            >
              <span>السؤال التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 text-slate-400 space-y-2">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold">لا يوجد أسئلة مضافة لهذا القسم حتى الآن</p>
        </div>
      )}

      {/* SECTION 3.5: Final Score Percentage Display */}
      {isCompletedAll && (
        <div className="p-6 bg-gradient-to-r from-pink-50 via-amber-50 to-orange-50 rounded-3xl border border-pink-200 shadow-md text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800">
            أكملت جميع أسئلة هذا القسم بنجاح!
          </h3>
          <div className="text-3xl font-black text-pink-600">
            النتيجة: {scorePercentage}%
          </div>
          <p className="text-xs text-slate-600">
            أجبت بشكل صحيح على {correctCount} من أصل {activeQuestions.length} سؤالاً.
          </p>
        </div>
      )}
    </div>
  );
};
