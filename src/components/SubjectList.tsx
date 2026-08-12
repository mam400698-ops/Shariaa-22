import React, { useState } from 'react';
import { Subject, Paragraph, Question } from '../types';
import { BookOpen, Search, ArrowLeft, Shield, Sparkles, Layers, KeyRound } from 'lucide-react';

interface SubjectListProps {
  subjects: Subject[];
  paragraphs: Paragraph[];
  questions: Question[];
  onSelectSubject: (subjectId: string) => void;
  userAnswers: Record<string, number>;
  onOpenAdminLogin?: () => void;
}

export const SubjectList: React.FC<SubjectListProps> = ({
  subjects,
  paragraphs,
  questions,
  onSelectSubject,
  userAnswers,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-6 sm:p-8 text-white shadow-xl shadow-pink-100">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-32 h-32 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>السنة الثالثة — الفصل الثاني</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            اختبر معلوماتك ومراجعك في مواد الشريعة الإسلامية
          </h2>

          <p className="text-sm text-white/90 leading-relaxed font-medium">
            اختر المادة للبدء بمراجعة الفقرات والنقاط المفتاحية، وحل الأسئلة المحلولة والتعليلات الفقهية بدقة.
          </p>
        </div>
      </div>

      {/* Admin Panel Quick Access Banner */}
      {onOpenAdminLogin && (
        <div className="bg-gradient-to-r from-slate-900 via-pink-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-pink-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500 text-white rounded-xl shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>لوحة تحكّم وتعديل الأسئلة (الإدمن)</span>
                <span className="text-[10px] bg-pink-500/30 text-pink-300 px-2 py-0.5 rounded-full border border-pink-400/30">خاص بالمعلمين</span>
              </h4>
              <p className="text-xs text-slate-300 font-medium">
                إضافة المواد، الفقرات، المقارنات، واستيراد الأسئلة دفعة واحدة.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdminLogin}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-md transition-all btn-press flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>الدخول لوحة التحكم</span>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المادة..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-bold self-end sm:self-auto">
          إجمالي المواد: <span className="text-pink-600">{subjects.length}</span>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject, index) => {
          const subParagraphs = paragraphs.filter(p => p.subjectId === subject.id);
          const paraIds = subParagraphs.map(p => p.id);
          const subQuestions = questions.filter(q => paraIds.includes(q.paragraphId));

          const answeredCount = subQuestions.filter(q => userAnswers[q.id] !== undefined).length;
          const progressPct = subQuestions.length > 0 ? Math.round((answeredCount / subQuestions.length) * 100) : 0;

          // Color accents cycling pink & orange
          const isEven = index % 2 === 0;

          return (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className="group bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-pink-300 shadow-sm hover:shadow-xl hover:shadow-pink-50 transition-all duration-200 cursor-pointer flex flex-col justify-between btn-press relative overflow-hidden"
            >
              {/* Top Accent Stripe */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isEven ? 'bg-gradient-to-r from-pink-500 to-rose-400' : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      isEven
                        ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-500 group-hover:text-white'
                        : 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'
                    } transition-colors`}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-pink-100 group-hover:text-pink-700 transition-colors">
                    {subParagraphs.length} فقرات
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-pink-600 transition-colors mb-1">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{subQuestions.length} سؤال متوفر للمراجعة</span>
                  </p>
                </div>

                {/* Progress bar */}
                {subQuestions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span>التقدم المكتمل</span>
                      <span className="text-pink-600">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isEven ? 'bg-gradient-to-r from-pink-500 to-rose-400' : 'bg-gradient-to-r from-orange-400 to-amber-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-pink-600 group-hover:text-orange-600 transition-colors">
                <span>استعراض الفقرات والأسئلة</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
