import React from 'react';
import { X, Star, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { Question } from '../types';

interface StarredQuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  starredQuestions: Question[];
  onToggleStar: (questionId: string) => void;
  onSelectParagraph: (paragraphId: string) => void;
}

export const StarredQuestionsDrawer: React.FC<StarredQuestionsDrawerProps> = ({
  isOpen,
  onClose,
  starredQuestions,
  onToggleStar,
  onSelectParagraph,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-r border-amber-100 flex flex-col">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">الأسئلة المحفوظة بنجمة ({starredQuestions.length})</h2>
                <p className="text-xs text-white/80">مراجعة سريعة للأسئلة المحددة للمراجعة لاحقاً</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {starredQuestions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <Star className="w-12 h-12 mx-auto text-amber-200 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-600">لم تقم بتعليم أي سؤال بنجمة حتى الآن</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  يمكنك الضغط على أزهار النجمة ⭐ جنب أي سؤال أثناء حل التمارين لتجميعه هنا للمراجعة.
                </p>
              </div>
            ) : (
              starredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-amber-200/70 bg-amber-50/30 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      سؤال #{idx + 1}
                    </span>
                    <button
                      onClick={() => onToggleStar(q.id)}
                      className="p-1.5 text-amber-500 hover:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      title="إزالة النجمة"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm leading-relaxed">
                    {q.questionText}
                  </h4>

                  {/* Options */}
                  <div className="space-y-1.5 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctOptionIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200/80 text-slate-600'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                      💡 {q.explanation}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onSelectParagraph(q.paragraphId);
                        onClose();
                      }}
                      className="text-xs text-pink-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      الانتقال إلى الفقرة الأصلية <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
