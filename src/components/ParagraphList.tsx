import React, { useState } from 'react';
import { Subject, Paragraph, KeyPoint, Question, TableData } from '../types';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Table as TableIcon,
  HelpCircle,
  FileText,
  Search,
  Network,
  X,
  Layers,
  GitBranch,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ParagraphListProps {
  subject: Subject;
  paragraphs: Paragraph[];
  keyPoints: KeyPoint[];
  questions: Question[];
  tables: TableData[];
  onBack: () => void;
  onSelectParagraph: (paragraphId: string, initialMode?: 'paragraph' | 'table') => void;
  userAnswers: Record<string, number>;
}

export const ParagraphList: React.FC<ParagraphListProps> = ({
  subject,
  paragraphs,
  keyPoints,
  questions,
  tables,
  onBack,
  onSelectParagraph,
  userAnswers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Paragraph Buttons ( Table & Key Points )
  const [activeTableParagraphId, setActiveTableParagraphId] = useState<string | null>(null);
  const [activeKeyPointsParagraphId, setActiveKeyPointsParagraphId] = useState<string | null>(null);

  // Filtered paragraphs
  const filteredParagraphs = paragraphs.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Target paragraph for Table Modal
  const tablePara = activeTableParagraphId ? paragraphs.find(p => p.id === activeTableParagraphId) : null;
  const tableData = activeTableParagraphId ? tables.find(t => t.paragraphId === activeTableParagraphId) : null;
  const tableQuestions = activeTableParagraphId
    ? questions.filter(q => q.paragraphId === activeTableParagraphId && q.sourceType === 'table')
    : [];

  // Target paragraph for Key Points Modal
  const kpPara = activeKeyPointsParagraphId ? paragraphs.find(p => p.id === activeKeyPointsParagraphId) : null;
  const kpList = activeKeyPointsParagraphId
    ? keyPoints.filter(kp => kp.paragraphId === activeKeyPointsParagraphId)
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="p-2.5 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-300 text-slate-700 rounded-2xl transition-all btn-press flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4 text-pink-600" />
          <span>العودة لقائمة المواد</span>
        </button>

        <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          المادة الحالية: <span className="text-pink-600">{subject.name}</span>
        </div>
      </div>

      {/* Main Subject Header */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-orange-50 p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-pink-500 text-white rounded-2xl shadow-sm">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              {subject.name}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              تصفح الفقرات، جداول المقارنة، والنقاط المفتاحية للمادة.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PARAGRAPHS LIST */}
      {/* ========================================================= */}
      <div className="space-y-6">
        {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في عناوين الفقرات..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
            />
          </div>

          {/* List of Paragraphs */}
          <div className="space-y-5">
            {filteredParagraphs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                لا يوجد فقرات مطابقة للبحث في هذه المادة.
              </div>
            ) : (
              filteredParagraphs.map((para, idx) => {
                const paraKps = keyPoints.filter(kp => kp.paragraphId === para.id);
                const paraQuestions = questions.filter(
                  q => q.paragraphId === para.id && q.sourceType === 'paragraph'
                );
                const tblQuestions = questions.filter(
                  q => q.paragraphId === para.id && q.sourceType === 'table'
                );

                const paraTableData = tables.find(t => t.paragraphId === para.id);
                const hasTable = Boolean(
                  para.hasTable ||
                  (paraTableData && (Boolean(paraTableData.imageUrl) || (paraTableData.headers && paraTableData.headers.length > 0) || (paraTableData.rows && paraTableData.rows.length > 0))) ||
                  tblQuestions.length > 0
                );

                const answeredParaQCount = paraQuestions.filter(
                  q => userAnswers[q.id] !== undefined
                ).length;

                return (
                  <div
                    key={para.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-pink-300 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Paragraph Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                            فقرة #{idx + 1}
                          </span>
                          {hasTable && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1">
                              <TableIcon className="w-3.5 h-3.5" /> تتضمن جدول مقارنة
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 leading-snug pt-1">
                          {para.title}
                        </h3>
                      </div>

                      {/* Answered Progress */}
                      {paraQuestions.length > 0 && (
                        <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                          تم إنجاز: <span className="text-pink-600">{answeredParaQCount}</span> / {paraQuestions.length} سؤال
                        </div>
                      )}
                    </div>

                    {/* Brief Content Preview */}
                    {para.content && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 line-clamp-2">
                        {para.content}
                      </p>
                    )}

                    {/* SECTION: 3 DISTINCT BUTTONS FOR EACH PARAGRAPH (للفقرة في 3 أزرار) */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {/* Button 1: أسئلة */}
                      <button
                        onClick={() => onSelectParagraph(para.id, 'paragraph')}
                        className="flex-1 min-w-[120px] py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl text-xs font-extrabold shadow-sm btn-press flex items-center justify-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>أسئلة ({paraQuestions.length})</span>
                      </button>

                      {/* Button 2: جدول (برتقالي إذا منضاف جدول، رمادي إذا ما في) */}
                      <button
                        onClick={() => setActiveTableParagraphId(para.id)}
                        className={`flex-1 min-w-[120px] py-3 px-4 text-xs font-extrabold rounded-2xl shadow-sm btn-press flex items-center justify-center gap-2 transition-all ${
                          hasTable
                            ? 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white border border-orange-400/50'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 shadow-none'
                        }`}
                      >
                        <TableIcon className={`w-4 h-4 ${hasTable ? 'text-white' : 'text-slate-400'}`} />
                        <span>
                          {hasTable
                            ? `جدول المقارنة ${tblQuestions.length > 0 ? `(${tblQuestions.length} سؤال)` : ''}`
                            : 'جدول المقارنة (غير متاح)'}
                        </span>
                      </button>

                      {/* Button 3: نقاط مفتاحية */}
                      <button
                        onClick={() => setActiveKeyPointsParagraphId(para.id)}
                        className="flex-1 min-w-[120px] py-3 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 rounded-2xl text-xs font-extrabold shadow-sm btn-press flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-900" />
                        <span>نقاط مفتاحية ({paraKps.length})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* ========================================================= */}
      {/* MODAL 1: TABLE VIEW MODAL (مع زر أسئلة للجدول وقت نفوت عليه) */}
      {/* ========================================================= */}
      {activeTableParagraphId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-6 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <TableIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-orange-100 bg-black/20 px-3 py-0.5 rounded-full inline-block">
                    جدول مقارنة الفقرة
                  </span>
                  <h3 className="text-base sm:text-lg font-black">{tablePara?.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setActiveTableParagraphId(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {tableData ? (
                <div className="space-y-4">
                  {tableData.title && (
                    <h4 className="font-extrabold text-slate-800 text-sm">{tableData.title}</h4>
                  )}

                  {/* Table Image View */}
                  {tableData.imageUrl && (
                    <div className="rounded-2xl border border-orange-200 bg-white p-2 text-center shadow-sm">
                      <img
                        src={tableData.imageUrl}
                        alt={tableData.title || 'صورة جدول المقارنة'}
                        className="max-w-full max-h-[500px] mx-auto object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {/* Text Table Grid View */}
                  {tableData.headers && tableData.headers.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-orange-100/80 text-orange-950 font-black border-b border-orange-200">
                            {tableData.headers.map((h, i) => (
                              <th key={i} className="p-3.5 border-l last:border-l-0 border-orange-200">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="p-3.5 border-t border-l last:border-l-0 border-slate-200 text-slate-700 font-medium"
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
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <TableIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">لم يتم إدخال جدول مخصص لهذه الفقرة بعد.</p>
                </div>
              )}

              {/* CRITICAL USER REQUIREMENT: "زر اختبرني بهذا الجدول لا يطلع بلوحة المستخدم الا اذا كنت انا ضايفة اسئلة بخانة الجدول عند الادمن" */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-bold">
                  عدد أسئلة هذا الجدول: <strong className="text-orange-600">{tableQuestions.length} أسئلة</strong>
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTableParagraphId(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    إغلاق الجدول
                  </button>

                  {tableQuestions.length > 0 ? (
                    <button
                      onClick={() => {
                        const pId = activeTableParagraphId;
                        setActiveTableParagraphId(null);
                        if (pId) onSelectParagraph(pId, 'table');
                      }}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md btn-press flex items-center justify-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>اختبرني بأسئلة هذا الجدول ({tableQuestions.length})</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      (لا يوجد أسئلة جدول مضافة لهذه الفقرة بعد)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KEY POINTS MODAL (النقاط المفتاحية) */}
      {/* ========================================================= */}
      {activeKeyPointsParagraphId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-6 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-950/10 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-amber-950" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold bg-amber-950/10 px-3 py-0.5 rounded-full inline-block">
                    النقاط المفتاحية للدرس
                  </span>
                  <h3 className="text-base sm:text-lg font-black">{kpPara?.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setActiveKeyPointsParagraphId(null)}
                className="p-2 bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {kpList.length > 0 ? (
                <div className="space-y-3">
                  {kpList.map((kp, idx) => (
                    <div
                      key={kp.id}
                      className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-start gap-3"
                    >
                      <span className="p-1.5 bg-amber-500 text-white rounded-xl text-xs font-black shrink-0">
                        #{idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed pt-0.5">
                        {kp.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                  لا يوجد نقاط مفتاحية مدخلة لهذه الفقرة حتى الآن.
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setActiveKeyPointsParagraphId(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
