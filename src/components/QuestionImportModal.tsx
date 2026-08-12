import React, { useState, useEffect } from 'react';
import { Subject, Paragraph, ExtractionResult } from '../types';
import { extractBatchFromText, parseKeyPointsText } from '../utils/extractor';
import { DBStore } from '../data/dbStore';
import { X, Sparkles, AlertTriangle, CheckCircle2, FileText, HelpCircle, Save, Plus, Trash2, Upload, MessageSquare } from 'lucide-react';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  paragraphs: Paragraph[];
  selectedParagraphId?: string;
  onSuccess: () => void;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  paragraphs,
  selectedParagraphId,
  onSuccess,
}) => {
  // Subject & Paragraph Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [paraId, setParaId] = useState<string>('');
  const [sourceType, setSourceType] = useState<'paragraph' | 'table'>('paragraph');

  // Filter paragraphs by selected subject
  const availableParagraphs = paragraphs.filter(p => !selectedSubjectId || p.subjectId === selectedSubjectId);

  useEffect(() => {
    if (isOpen) {
      if (selectedParagraphId) {
        const found = paragraphs.find(p => p.id === selectedParagraphId);
        if (found) {
          setSelectedSubjectId(found.subjectId);
          setParaId(found.id);
          return;
        }
      }
      const defaultSubj = selectedSubjectId || subjects[0]?.id || '';
      setSelectedSubjectId(defaultSubj);
      const matchParas = paragraphs.filter(p => !defaultSubj || p.subjectId === defaultSubj);
      if (matchParas.length > 0) {
        setParaId(matchParas[0].id);
      } else if (paragraphs.length > 0) {
        setSelectedSubjectId(paragraphs[0].subjectId);
        setParaId(paragraphs[0].id);
      }
    }
  }, [isOpen, selectedParagraphId, paragraphs, subjects]);

  const handleSubjectChange = (subjId: string) => {
    setSelectedSubjectId(subjId);
    const matchParas = paragraphs.filter(p => p.subjectId === subjId);
    if (matchParas.length > 0) {
      setParaId(matchParas[0].id);
    } else {
      setParaId('');
    }
  };

  const [rawKeyPointsText, setRawKeyPointsText] = useState('');
  const [rawQuestionsText, setRawQuestionsText] = useState('');

  // Step 1 = Input text, Step 2 = Mandatory Preview & Review
  const [step, setStep] = useState<1 | 2>(1);
  const [previewData, setPreviewData] = useState<ExtractionResult | null>(null);

  if (!isOpen) return null;

  // File Upload Handler for .txt / text files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawQuestionsText(prev => (prev ? prev + '\n\n' + text : text));
      }
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    if (!rawQuestionsText.trim() && !rawKeyPointsText.trim()) return;

    const parsed = extractBatchFromText(rawQuestionsText);

    // Merge manual key points if provided
    if (rawKeyPointsText.trim()) {
      const parsedKp = parseKeyPointsText(rawKeyPointsText);
      parsed.keyPoints = [...parsed.keyPoints, ...parsedKp];
    }

    setPreviewData(parsed);
    setStep(2); // Go to Mandatory Preview Screen
  };

  const handleFinalSave = () => {
    if (!previewData || !paraId) return;

    // Save key points if extracted
    if (previewData.keyPoints.length > 0) {
      DBStore.saveKeyPointsForParagraph(paraId, previewData.keyPoints);
    }

    // Save questions batch
    if (previewData.questions.length > 0) {
      DBStore.saveQuestionsBatch(paraId, sourceType, previewData.questions);
    }

    onSuccess();
    onClose();
    // Reset modal state
    setStep(1);
    setRawQuestionsText('');
    setRawKeyPointsText('');
    setPreviewData(null);
  };

  // Preview editable functions
  const handleUpdatePreviewQuestion = (index: number, updatedField: any) => {
    if (!previewData) return;
    const questions = [...previewData.questions];
    questions[index] = { ...questions[index], ...updatedField };
    setPreviewData({ ...previewData, questions });
  };

  const handleRemovePreviewQuestion = (index: number) => {
    if (!previewData) return;
    const questions = previewData.questions.filter((_, i) => i !== index);
    setPreviewData({ ...previewData, questions });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-pink-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-orange-400 text-white rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">
                خانة إضافة واستيراد الأسئلة دفعة واحدة
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1 ? 'اختر المادة والفقرة ثم ألصق نص الأسئلة من واتساب أو ملف وورد مباشرة' : 'شاشة المعاينة الإلزامية قبل الحفظ النهائي'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* STEP 1: SELECT SUBJECT & PARAGRAPH */}
          <div className="bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-orange-50/80 p-4.5 rounded-2xl border border-pink-200/80 space-y-3">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>📌 خطوة 1: تحديد المادة والفقرة المستهدفة</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dropdown 1: Subject Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">1. اختر المادة:</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-pink-500 shadow-sm"
                >
                  <option value="">-- اختر المادة --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Paragraph Selection (Filtered by Subject) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">2. اختر الفقرة:</label>
                <select
                  value={paraId}
                  onChange={e => setParaId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-pink-500 shadow-sm"
                >
                  <option value="">-- اختر الفقرة --</option>
                  {availableParagraphs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Source Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">3. نوع الأسئلة:</label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSourceType('paragraph')}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold transition-all ${
                      sourceType === 'paragraph'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    أسئلة الفقرة
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('table')}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold transition-all ${
                      sourceType === 'table'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    أسئلة الجدول
                  </button>
                </div>
              </div>
            </div>
          </div>

          {step === 1 ? (
            /* STEP 1: Paste Text Areas & Recommendation */
            <div className="space-y-4">
              {/* Recommendation Note on Paste vs Word File */}
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-emerald-900">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>نصيحة هامة: النسخ واللصق المباشر من واتساب أو وورد هو الأفضل والأسرع دائماً!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  نسخ نص الرسالة أو نص الوورد ولصقه مباشرة في الخانة أدناه يضمن تفكيك الأسئلة فوراً بدقة 100% دون أخطاء تنسيق الملفات.
                </p>
              </div>

              {/* Questions Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-pink-500" />
                    <span>خانة لصق الأسئلة (انسخ الأسئلة من واتساب أو وورد وألصقها هنا):</span>
                  </label>

                  {/* Optional File Upload button */}
                  <label className="cursor-pointer px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>أو اختر ملف نصي (.txt)</span>
                    <input
                      type="file"
                      accept=".txt,.text,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={9}
                  value={rawQuestionsText}
                  onChange={e => setRawQuestionsText(e.target.value)}
                  placeholder="انسخ النص من رسالة الواتس أو الوورد وألصقه هنا مباشرة...

مثال لنص الأسئلة:
1. ما هو دلالة العام قبل التخصيص عند الجمهور؟
أ) ظنية الدلالة
ب) قطعية الدلالة
ج) باطلة
د) موقوفة
الإجابة الصحيحة: أ
التعليل: لأن الشمول يحتمل ورود التخصيص..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-pink-500 focus:bg-white font-mono shadow-inner"
                />
              </div>

              {/* Key Points Optional Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>خانة إضافية للنقاط المفتاحية (اختياري - سطر لكل نقطة):</span>
                </label>
                <textarea
                  rows={2}
                  value={rawKeyPointsText}
                  onChange={e => setRawKeyPointsText(e.target.value)}
                  placeholder="• دلالة العام عند الجمهور ظنية...
• الحنفية يوجبون تخصيص العام بالمتواتر..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>
            </div>
          ) : (
            /* STEP 2: Mandatory Preview Screen */
            <div className="space-y-6">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <span>
                  🔍 <strong>معاينة النتائج:</strong> تم استخراج {previewData?.questions.length || 0} سؤالاً و {previewData?.keyPoints.length || 0} نقطة مفتاحية. يمكنك تعديل أي حقل قبل الحفظ النهائي.
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-pink-600 font-bold underline text-xs"
                >
                  العودة لصق النص
                </button>
              </div>

              {/* Extracted Key Points Preview */}
              {previewData && previewData.keyPoints.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    النقاط المفتاحية المستخرجة ({previewData.keyPoints.length}):
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {previewData.keyPoints.map((kp, kIdx) => (
                      <li key={kIdx}>{kp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Questions Preview */}
              <div className="space-y-4">
                {previewData?.questions.map((q, qIdx) => {
                  const hasWarning = q.confidence === 'warning';

                  return (
                    <div
                      key={qIdx}
                      className={`p-5 rounded-3xl border space-y-3 transition-all ${
                        hasWarning
                          ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-200'
                          : 'bg-white border-slate-200/90'
                      }`}
                    >
                      {/* Warning bar if uncertain */}
                      {hasWarning && (
                        <div className="flex items-center gap-2 text-rose-700 text-xs font-bold bg-rose-100 p-2 rounded-xl">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>تنبيه: {q.warningMessage || 'يرجى مراجعة الخيارات وتحديد الخيار الصحيح يدوياً!'}</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-extrabold text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                          سؤال #{qIdx + 1}
                        </span>
                        <button
                          onClick={() => handleRemovePreviewQuestion(qIdx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                          title="حذف هذا السؤال من الدفعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Editable Question Text */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">نص السؤال:</label>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={e =>
                            handleUpdatePreviewQuestion(qIdx, { questionText: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                        />
                      </div>

                      {/* Options & Radio for correct answer */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-600">
                          الخيارات (حدد الدائرة بقرب الخيار الصحيح):
                        </label>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctOptionIndex === optIdx;
                            return (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-opt-${qIdx}`}
                                  checked={isCorrect}
                                  onChange={() =>
                                    handleUpdatePreviewQuestion(qIdx, {
                                      correctOptionIndex: optIdx,
                                      confidence: 'high',
                                      warningMessage: undefined,
                                    })
                                  }
                                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const newOpts = [...q.options];
                                    newOpts[optIdx] = e.target.value;
                                    handleUpdatePreviewQuestion(qIdx, { options: newOpts });
                                  }}
                                  className={`flex-1 p-2 rounded-xl text-xs border ${
                                    isCorrect
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold'
                                      : 'border-slate-200 bg-slate-50'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Verbatim Explanation */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">التعليل الفقهي:</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={e =>
                            handleUpdatePreviewQuestion(qIdx, { explanation: e.target.value })
                          }
                          placeholder="التعليل الفقهي..."
                          className="w-full p-2.5 bg-orange-50/60 border border-orange-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold btn-press"
              >
                إلغاء
              </button>
              <button
                onClick={handleParseText}
                disabled={!rawQuestionsText.trim() && !rawKeyPointsText.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white rounded-xl text-xs font-extrabold disabled:opacity-40 shadow-sm btn-press"
              >
                استخراج ومعاينة الأسئلة
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold btn-press"
              >
                العودة للتعديل
              </button>
              <button
                onClick={handleFinalSave}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-sm btn-press flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الأسئلة في المادة والفقرة</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

