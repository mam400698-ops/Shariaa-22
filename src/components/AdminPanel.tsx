import React, { useState, useEffect } from 'react';
import {
  Subject,
  Paragraph,
  Question,
  KeyPoint,
  TableData,
  TrashItem,
} from '../types';
import { DBStore } from '../data/dbStore';
import { extractBatchFromText } from '../utils/extractor';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  Table as TableIcon,
  BookOpen,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { QuestionImportModal } from './QuestionImportModal';

interface AdminPanelProps {
  subjects: Subject[];
  paragraphs: Paragraph[];
  questions: Question[];
  keyPoints: KeyPoint[];
  tables: TableData[];
  onRefreshData: () => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  subjects,
  paragraphs,
  questions,
  keyPoints,
  tables,
  onRefreshData,
  onExitAdmin,
}) => {
  // STRICT USER REQUIREMENT: Exactly 3 main tabs!
  // 1. manage_all: unified editing for subjects, paragraphs, keypoints, and questions
  // 2. tables: comparison tables
  // 3. trash: trash bin
  const [activeTab, setActiveTab] = useState<'manage_all' | 'tables' | 'trash'>('manage_all');

  // Search & Filter state for management tree
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIdFilter, setSelectedSubjectIdFilter] = useState<string>('all');

  // Delete modal state
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'batch_questions' | 'single_question' | 'paragraph' | 'subject' | 'empty_trash';
    targetId?: string;
    count?: number;
  }>({ isOpen: false, type: 'single_question' });

  // Batch import modal trigger
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSelectedParagraphId, setImportSelectedParagraphId] = useState<string | undefined>(undefined);

  // ----------------------------------------------------
  // 1) SUBJECT FORM STATE
  // ----------------------------------------------------
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');

  // ----------------------------------------------------
  // 2) PARAGRAPH CREATION & SAVED WORKSTATION STATE
  // ----------------------------------------------------
  const [editingParagraph, setEditingParagraph] = useState<Paragraph | null>(null);
  const [paraTitleInput, setParaTitleInput] = useState('');
  const [paraSubjectIdInput, setParaSubjectIdInput] = useState(subjects[0]?.id || '');
  
  // Currently active saved paragraph for adding key points & questions
  const [activeSavedParagraphId, setActiveSavedParagraphId] = useState<string | null>(null);

  // Key points input for saved paragraph
  const [inlineKeyPointsText, setInlineKeyPointsText] = useState('');

  // Questions batch paste text for saved paragraph
  const [inlineQuestionsPasteText, setInlineQuestionsPasteText] = useState('');

  // Questions single creation form for saved paragraph
  const [inlineQText, setInlineQText] = useState('');
  const [inlineQOptions, setInlineQOptions] = useState<string[]>(['', '', '', '']);
  const [inlineQCorrectIdx, setInlineQCorrectIdx] = useState(0);
  const [inlineQExplanation, setInlineQExplanation] = useState('');
  const [inlineQSourceType, setInlineQSourceType] = useState<'paragraph' | 'table'>('paragraph');

  // Inline question editor state (for modifying existing questions)
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQOptions, setEditQOptions] = useState<string[]>(['', '', '', '']);
  const [editQCorrectIdx, setEditQCorrectIdx] = useState(0);
  const [editQExplanation, setEditQExplanation] = useState('');

  // ----------------------------------------------------
  // 3) TABLES FORM STATE
  // ----------------------------------------------------
  const [tblSubjectId, setTblSubjectId] = useState(subjects[0]?.id || '');
  const [tblParagraphId, setTblParagraphId] = useState(paragraphs[0]?.id || '');
  const [tblTitleInput, setTblTitleInput] = useState('');
  const [tblImageUrlInput, setTblImageUrlInput] = useState('');
  const [tblHeadersInput, setTblHeadersInput] = useState('');
  const [tblRowsInput, setTblRowsInput] = useState('');
  const [editingTableParagraphId, setEditingTableParagraphId] = useState<string | null>(null);

  // Filtered paragraphs for table form
  const filteredTblParagraphs = paragraphs.filter(p => !tblSubjectId || p.subjectId === tblSubjectId);

  // Hierarchy Expansion state
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const [expandedParagraphIds, setExpandedParagraphIds] = useState<string[]>([]);

  // Keep dropdowns valid
  useEffect(() => {
    if (subjects.length > 0) {
      if (!tblSubjectId || !subjects.some(s => s.id === tblSubjectId)) {
        setTblSubjectId(subjects[0].id);
      }
      if (!paraSubjectIdInput || !subjects.some(s => s.id === paraSubjectIdInput)) {
        setParaSubjectIdInput(subjects[0].id);
      }
    }
  }, [subjects]);

  // 1) Sync available paragraph when selected subject changes in Tables tab
  useEffect(() => {
    if (tblSubjectId) {
      const avail = paragraphs.filter(p => p.subjectId === tblSubjectId);
      if (avail.length > 0) {
        if (!avail.some(p => p.id === tblParagraphId)) {
          setTblParagraphId(avail[0].id);
        }
      } else {
        setTblParagraphId('');
      }
    }
  }, [tblSubjectId, paragraphs]);

  // 2) Auto-sync table input fields when tblParagraphId changes or tables update
  useEffect(() => {
    if (!tblParagraphId) {
      setTblTitleInput('');
      setTblImageUrlInput('');
      setTblHeadersInput('');
      setTblRowsInput('');
      setEditingTableParagraphId(null);
      return;
    }

    const existingTbl = tables.find(t => t.paragraphId === tblParagraphId);
    if (existingTbl) {
      setTblTitleInput(existingTbl.title || '');
      setTblImageUrlInput(existingTbl.imageUrl || '');
      setTblHeadersInput(existingTbl.headers ? existingTbl.headers.join(' | ') : '');
      setTblRowsInput(existingTbl.rows ? existingTbl.rows.map(r => r.join(' | ')).join('\n') : '');
      setEditingTableParagraphId(existingTbl.paragraphId);
    } else {
      setTblTitleInput('');
      setTblImageUrlInput('');
      setTblHeadersInput('');
      setTblRowsInput('');
      setEditingTableParagraphId(null);
    }
  }, [tblParagraphId, tables]);

  // When activeSavedParagraphId changes, sync its key points
  useEffect(() => {
    if (activeSavedParagraphId) {
      const kps = keyPoints.filter(kp => kp.paragraphId === activeSavedParagraphId);
      setInlineKeyPointsText(kps.map(kp => kp.text).join('\n'));
    }
  }, [activeSavedParagraphId, keyPoints]);

  const trashItems: TrashItem[] = DBStore.getTrashItems();

  // ----------------------------------------------------
  // HANDLERS FOR SUBJECTS
  // ----------------------------------------------------
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;

    DBStore.saveSubject({
      id: editingSubject?.id,
      name: subjectNameInput.trim(),
    });

    setSubjectNameInput('');
    setEditingSubject(null);
    onRefreshData();
  };

  const handleEditSubjectClick = (s: Subject) => {
    setEditingSubject(s);
    setSubjectNameInput(s.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------
  // HANDLERS FOR PARAGRAPHS
  // ----------------------------------------------------
  const handleSaveParagraph = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paraTitleInput.trim() || !paraSubjectIdInput) return;

    const savedPara = DBStore.saveParagraph({
      id: editingParagraph?.id,
      subjectId: paraSubjectIdInput,
      title: paraTitleInput.trim(),
    });

    // Set saved paragraph as active workstation
    setActiveSavedParagraphId(savedPara.id);
    setEditingParagraph(null);
    setParaTitleInput('');
    onRefreshData();
  };

  const handleSelectParagraphForWorkstation = (p: Paragraph) => {
    setActiveSavedParagraphId(p.id);
    setEditingParagraph(p);
    setParaTitleInput(p.title);
    setParaSubjectIdInput(p.subjectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Key Points for Active Saved Paragraph
  const handleSaveInlineKeyPoints = () => {
    if (!activeSavedParagraphId) return;
    const lines = inlineKeyPointsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    DBStore.saveKeyPointsForParagraph(activeSavedParagraphId, lines);
    onRefreshData();
    alert('تم حفظ النقاط المفتاحية للفقرة بنجاح! ✨');
  };

  // Instant Batch Questions Extractor & Saver for Active Saved Paragraph
  const handleBatchExtractInline = () => {
    if (!activeSavedParagraphId || !inlineQuestionsPasteText.trim()) return;

    const parsed = extractBatchFromText(inlineQuestionsPasteText);
    if (parsed.questions.length === 0) {
      alert('لم يتم التعرف على أسئلة في النص الملصوق! يرجى التأكد من التنسيق.');
      return;
    }

    let addedCount = 0;
    parsed.questions.forEach(q => {
      DBStore.addQuestion({
        paragraphId: activeSavedParagraphId,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || '',
        sourceType: 'paragraph',
      });
      addedCount++;
    });

    setInlineQuestionsPasteText('');
    onRefreshData();
    alert(`تم استخراج وإضافة ${addedCount} سؤال بنجاح لهذه الفقرة! 🎉`);
  };

  // Instant Single Question Saver for Active Saved Paragraph
  const handleAddSingleInlineQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSavedParagraphId || !inlineQText.trim()) return;

    const cleanedOptions = inlineQOptions.map(o => o.trim()).filter(Boolean);
    if (cleanedOptions.length < 2) {
      alert('يرجى إدخال خيارين على الأقل للسؤال!');
      return;
    }

    DBStore.addQuestion({
      paragraphId: activeSavedParagraphId,
      questionText: inlineQText.trim(),
      options: inlineQOptions.map((o, idx) => o.trim() || `خيار ${idx + 1}`),
      correctOptionIndex: inlineQCorrectIdx,
      explanation: inlineQExplanation.trim(),
      sourceType: inlineQSourceType,
    });

    setInlineQText('');
    setInlineQOptions(['', '', '', '']);
    setInlineQCorrectIdx(0);
    setInlineQExplanation('');
    onRefreshData();
  };

  // Save Edit for Existing Question
  const handleSaveEditedQuestion = (qId: string) => {
    if (!editQText.trim()) return;

    DBStore.updateQuestion(qId, {
      questionText: editQText.trim(),
      options: editQOptions.map((o, idx) => o.trim() || `خيار ${idx + 1}`),
      correctOptionIndex: editQCorrectIdx,
      explanation: editQExplanation.trim(),
    });

    setEditingQId(null);
    onRefreshData();
  };

  // ----------------------------------------------------
  // HANDLERS FOR TABLES
  // ----------------------------------------------------
  const handleTableImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTblImageUrlInput(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tblParagraphId) {
      alert('يرجى اختيار الفقرة التابع لها الجدول!');
      return;
    }

    const headers = tblHeadersInput.trim()
      ? tblHeadersInput.split('|').map(s => s.trim())
      : [];

    const rows = tblRowsInput.trim()
      ? tblRowsInput
          .split('\n')
          .map(row => row.split('|').map(s => s.trim()))
          .filter(r => r.length > 0 && r[0] !== '')
      : [];

    DBStore.saveTableData(
      tblParagraphId,
      headers,
      rows,
      tblTitleInput.trim() || undefined,
      tblImageUrlInput.trim() || undefined
    );

    setTblTitleInput('');
    setTblImageUrlInput('');
    setTblHeadersInput('');
    setTblRowsInput('');
    setEditingTableParagraphId(null);
    onRefreshData();
    alert('تم حفظ بيانات الجدول بنجاح! ✨');
  };

  const handleEditTableClick = (tbl: TableData) => {
    const para = paragraphs.find(p => p.id === tbl.paragraphId);
    if (para) {
      setTblSubjectId(para.subjectId);
    }
    setTblParagraphId(tbl.paragraphId);
    setTblTitleInput(tbl.title || '');
    setTblImageUrlInput(tbl.imageUrl || '');
    setTblHeadersInput(tbl.headers ? tbl.headers.join(' | ') : '');
    setTblRowsInput(tbl.rows ? tbl.rows.map(r => r.join(' | ')).join('\n') : '');
    setEditingTableParagraphId(tbl.paragraphId);
    setActiveTab('tables');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTableClick = (tbl: TableData) => {
    setConfirmDeleteModal({
      isOpen: true,
      type: 'table',
      targetId: tbl.paragraphId,
    });
  };

  // ----------------------------------------------------
  // DELETE CONFIRMATION EXECUTOR
  // ----------------------------------------------------
  const executeDeleteAction = () => {
    if (confirmDeleteModal.type === 'single_question' && confirmDeleteModal.targetId) {
      DBStore.deleteQuestion(confirmDeleteModal.targetId);
    } else if (confirmDeleteModal.type === 'paragraph' && confirmDeleteModal.targetId) {
      DBStore.deleteParagraph(confirmDeleteModal.targetId);
      if (activeSavedParagraphId === confirmDeleteModal.targetId) {
        setActiveSavedParagraphId(null);
      }
    } else if (confirmDeleteModal.type === 'subject' && confirmDeleteModal.targetId) {
      DBStore.deleteSubject(confirmDeleteModal.targetId);
    } else if (confirmDeleteModal.type === 'table' && confirmDeleteModal.targetId) {
      DBStore.deleteTableData(confirmDeleteModal.targetId);
      if (tblParagraphId === confirmDeleteModal.targetId) {
        setTblTitleInput('');
        setTblImageUrlInput('');
        setTblHeadersInput('');
        setTblRowsInput('');
        setEditingTableParagraphId(null);
      }
    } else if (confirmDeleteModal.type === 'empty_trash') {
      DBStore.emptyTrash();
    }

    setConfirmDeleteModal({ isOpen: false, type: 'single_question' });
    onRefreshData();
  };

  // Active saved paragraph object
  const activeSavedParagraph = paragraphs.find(p => p.id === activeSavedParagraphId);
  const activeSavedSubject = subjects.find(s => s.id === activeSavedParagraph?.subjectId);
  const activeSavedQuestions = questions.filter(q => q.paragraphId === activeSavedParagraphId);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">لوحة التحكم والإدارة</h2>
            <p className="text-xs text-slate-500 font-bold">
              إضافة وتعديل المواد، الفقرات، المقارنات، واستيراد الأسئلة فوراً.
            </p>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

      {/* STRICT USER REQUIREMENT: EXACTLY 3 MAIN TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('manage_all')}
          className={`px-5 py-3.5 rounded-2xl text-xs font-black transition-all btn-press flex items-center justify-center gap-2 ${
            activeTab === 'manage_all'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. إضافة وتعديل الشامل (مواد، فقرات، أسئلة)</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`px-5 py-3.5 rounded-2xl text-xs font-black transition-all btn-press flex items-center justify-center gap-2 ${
            activeTab === 'tables'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>2. خانة الجداول والمقارنات ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`px-5 py-3.5 rounded-2xl text-xs font-black transition-all btn-press flex items-center justify-center gap-2 ${
            activeTab === 'trash'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>3. سلة المحذوفات ({trashItems.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: UNIFIED MANAGEMENT (المواد + الفقرات + الأسئلة) */}
      {/* ========================================================= */}
      {activeTab === 'manage_all' && (
        <div className="space-y-8 animate-fade-in">
          {/* SECTION 1: SUBJECTS ADDITION / EDITING */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    {editingSubject ? 'تعديل اسم المادة الدراسية:' : '1️⃣ إضافة أو تغيير مادة دراسية:'}
                  </h3>
                  <p className="text-xs text-slate-500">أدخل اسم المادة لإضافتها للنظام أو اختر مادة لتعديل اسمها.</p>
                </div>
              </div>

              {subjects.length > 0 && (
                <span className="text-xs font-extrabold bg-pink-50 text-pink-700 px-3 py-1 rounded-full border border-pink-200">
                  {subjects.length} مواد متاحة
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSubject} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={subjectNameInput}
                onChange={e => setSubjectNameInput(e.target.value)}
                placeholder="أدخل اسم المادة (مثال: الفقه المقارن - السنة الثالثة)..."
                required
                className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-pink-500 focus:bg-white"
              />
              <div className="flex gap-2">
                {editingSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjectNameInput('');
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white rounded-2xl text-xs font-extrabold btn-press shadow-md"
                >
                  {editingSubject ? 'حفظ تغيير الاسم' : '+ حفظ المادة'}
                </button>
              </div>
            </form>

            {/* List of Subjects Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-bold text-slate-500">المواد الحالية:</span>
              {subjects.map(s => (
                <div
                  key={s.id}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-800"
                >
                  <span>{s.name}</span>
                  <button
                    onClick={() => handleEditSubjectClick(s)}
                    className="text-slate-400 hover:text-pink-600"
                    title="تعديل اسم المادة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDeleteModal({
                        isOpen: true,
                        type: 'subject',
                        targetId: s.id,
                      })
                    }
                    className="text-slate-400 hover:text-rose-600"
                    title="حذف المادة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: PARAGRAPH CREATION FORM */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {editingParagraph ? 'تعديل الفقرة:' : '2️⃣ إضافة فقرة جديدة:'}
                </h3>
                <p className="text-xs text-slate-500">
                  اختر المادة ثم أدخل عنوان الفقرة واكبس زر الحفظ لفتح خانة النقاط المفتاحية وإضافة الأسئلة فوراً.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveParagraph} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المادة التابعة لها:</label>
                  <select
                    value={paraSubjectIdInput}
                    onChange={e => setParaSubjectIdInput(e.target.value)}
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الفقرة (الدرس):</label>
                  <input
                    type="text"
                    value={paraTitleInput}
                    onChange={e => setParaTitleInput(e.target.value)}
                    placeholder="مثال: تعريف بيع العينة وحكمه الشرعي..."
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {editingParagraph && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingParagraph(null);
                      setParaTitleInput('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl text-xs font-black shadow-md btn-press flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 حفظ الفقرة وتفعيل إضافة الأسئلة لها</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: SAVED PARAGRAPH WORKSTATION (APPEARS IMMEDIATELY AFTER SAVING OR SELECTING A PARAGRAPH) */}
          {activeSavedParagraph ? (
            <div className="bg-gradient-to-br from-pink-50/90 via-purple-50/40 to-slate-50 border-2 border-pink-300 rounded-3xl p-6 shadow-md space-y-6 animate-scale-up">
              {/* Header Box */}
              <div className="bg-white p-4 rounded-2xl border border-pink-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full inline-block">
                    الفقرة المفعلة حالياً للإضافة والتعديل:
                  </span>
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <span>{activeSavedParagraph.title}</span>
                    <span className="text-xs text-slate-500 font-bold">({activeSavedSubject?.name})</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTblSubjectId(activeSavedParagraph.subjectId);
                      setTblParagraphId(activeSavedParagraph.id);
                      setActiveTab('tables');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-orange-200 transition-colors btn-press"
                  >
                    <TableIcon className="w-4 h-4 text-orange-600" />
                    <span>
                      {tables.some(t => t.paragraphId === activeSavedParagraph.id)
                        ? '✏️ تعديل جدول المقارنة'
                        : '+ إضافة جدول مقارنة لهذه الفقرة'}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveSavedParagraphId(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                    <span>إغلاق هذه الفقرة</span>
                  </button>
                </div>
              </div>

              {/* 3.1 KEY POINTS SECTION */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <span>🔑 النقاط المفتاحية لهذه الفقرة:</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">سطر لكل نقطة مفتاحية</span>
                </div>

                <textarea
                  rows={3}
                  value={inlineKeyPointsText}
                  onChange={e => setInlineKeyPointsText(e.target.value)}
                  placeholder={`أدخل النقاط المفتاحية الهامة لهذه الفقرة (سطر لكل نقطة):\nمثال:\nبيع العينة محرم عند جمهور الفقهاء\nيشترط لبيع العينة عودة السلعة للبائع بنفس الثمن أو أقل`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold leading-relaxed focus:outline-none focus:border-pink-500"
                />

                <button
                  onClick={handleSaveInlineKeyPoints}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold shadow-sm btn-press flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ النقاط المفتاحية</span>
                </button>
              </div>

              {/* 3.2 INSTANT QUESTIONS ADDITION (PASTE OR SINGLE FORM - NO POPUPS NEEDED!) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                    <span>إضافة الأسئلة فوراً لهذه الفقرة:</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    يمكنك لصق مجموعة أسئلة كاملة دفعة واحدة لاستخراجها فوراً، أو إضافة أسئلة فردية مباشرة.
                  </p>
                </div>

                {/* Option A: Instant Text Batch Extractor */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-900 text-xs flex items-center gap-1.5">
                      <span>⚡ الطريقة الأسرع: لصق نص أسئلة متعددة واستخراجها فوراً</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      تلقائي
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={inlineQuestionsPasteText}
                    onChange={e => setInlineQuestionsPasteText(e.target.value)}
                    placeholder={`الصق نص الأسئلة هنا بالشكل الطبيعي:\nمثال:\n1) ما هو حكم بيع العينة؟\nأ) واجب\nب) حرام عند الجمهور\nج) مستحب\nد) مباح مطلقاً\nالإجابة الصحيحة: ب\nالتعليل: سداً لذريعة الربا.`}
                    className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold leading-relaxed focus:outline-none focus:border-amber-500"
                  />

                  <button
                    onClick={handleBatchExtractInline}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md btn-press flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ استخراج وإضافة كافة الأسئلة المكتوبة فوراً</span>
                  </button>
                </div>
              </div>

              {/* 3.3 LIST OF QUESTIONS CURRENTLY ATTACHED TO THIS PARAGRAPH */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    أسئلة هذه الفقرة الحالية ({activeSavedQuestions.length} سؤال):
                  </h4>
                  {activeSavedQuestions.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      جاهزة لاختبارات الطلاب
                    </span>
                  )}
                </div>

                {activeSavedQuestions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-bold">
                    لا توجد أسئلة مضافة بعد لهذه الفقرة. استخدم الخيارات أعلاه لإضافة أول سؤال!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSavedQuestions.map((q, qIdx) => {
                      const isEditingThisQ = editingQId === q.id;

                      if (isEditingThisQ) {
                        return (
                          <div key={q.id} className="p-4 bg-pink-50/70 border-2 border-pink-300 rounded-2xl space-y-3">
                            <span className="font-bold text-xs text-pink-800">تعديل السؤال #{qIdx + 1}:</span>
                            <input
                              type="text"
                              value={editQText}
                              onChange={e => setEditQText(e.target.value)}
                              className="w-full p-2.5 bg-white border border-pink-200 rounded-xl text-xs font-bold"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              {editQOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-pink-100 text-xs">
                                  <input
                                    type="radio"
                                    name={`editQRadio_${q.id}`}
                                    checked={editQCorrectIdx === oIdx}
                                    onChange={() => setEditQCorrectIdx(oIdx)}
                                    className="accent-pink-600"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={e => {
                                      const updated = [...editQOptions];
                                      updated[oIdx] = e.target.value;
                                      setEditQOptions(updated);
                                    }}
                                    className="w-full bg-transparent font-bold"
                                  />
                                </div>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={editQExplanation}
                              onChange={e => setEditQExplanation(e.target.value)}
                              placeholder="التعليل..."
                              className="w-full p-2 bg-white border border-pink-200 rounded-xl text-xs font-bold"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingQId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleSaveEditedQuestion(q.id)}
                                className="px-4 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-bold"
                              >
                                حفظ التعديل
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-extrabold text-slate-800">
                              #{qIdx + 1}) {q.questionText}
                            </p>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingQId(q.id);
                                  setEditQText(q.questionText);
                                  setEditQOptions([...q.options]);
                                  setEditQCorrectIdx(q.correctOptionIndex);
                                  setEditQExplanation(q.explanation);
                                }}
                                className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
                                title="تعديل هذا السؤال"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setConfirmDeleteModal({
                                    isOpen: true,
                                    type: 'single_question',
                                    targetId: q.id,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                title="حذف هذا السؤال"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={`px-2 py-1 rounded-lg ${
                                  oIdx === q.correctOptionIndex
                                    ? 'bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200'
                                    : 'bg-white border border-slate-100'
                                }`}
                              >
                                {['أ', 'ب', 'ج', 'د'][oIdx]}) {opt}
                              </span>
                            ))}
                          </div>

                          {q.explanation && (
                            <p className="text-[10px] text-slate-500 font-medium pt-1">
                              💡 الشرح: {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center space-y-2">
              <Sparkles className="w-8 h-8 text-pink-400 mx-auto" />
              <h4 className="font-extrabold text-slate-700 text-sm">لم يتم تحديد فقرة مفعلة بعد</h4>
              <p className="text-xs text-slate-500">
                احفظ فقرة جديدة أعلاه أو اختر فقرة سابقة أدناه لفتح واجهة إضافة أسئلتها ونقاطها المفتاحية.
              </p>
            </div>
          )}

          {/* SECTION 4: HIERARCHICAL MANAGEMENT TREE (المواد -> الفقرات -> الأسئلة) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <div>
                <h3 className="font-black text-slate-800 text-base">
                  3️⃣ شجرة استعراض وتعديل وحذف المحتوى الشامل:
                </h3>
                <p className="text-xs text-slate-500">
                  عرض جميع المواد والفقرات والأسئلة مع إمكانية تعديل أي عنصر أو حذفه بنقرة واحدة.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالنصوص..."
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full md:w-48"
                />

                <select
                  value={selectedSubjectIdFilter}
                  onChange={e => setSelectedSubjectIdFilter(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="all">كل المواد ({subjects.length})</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {subjects
                .filter(s => selectedSubjectIdFilter === 'all' || s.id === selectedSubjectIdFilter)
                .map(subj => {
                  const subjParas = paragraphs.filter(p => p.subjectId === subj.id);

                  return (
                    <div key={subj.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      {/* Subject Row */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-pink-500" />
                          <h4 className="font-black text-slate-800 text-base">{subj.name}</h4>
                          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {subjParas.length} فقرة
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditSubjectClick(subj)}
                            className="px-3 py-1 bg-slate-100 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-lg text-xs font-bold"
                          >
                            تعديل الاسم
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDeleteModal({
                                isOpen: true,
                                type: 'subject',
                                targetId: subj.id,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Paragraphs under this subject */}
                      <div className="space-y-2 pr-4">
                        {subjParas.length === 0 ? (
                          <p className="text-xs text-slate-400 font-bold">لا توجد فقرات لهذه المادة بعد.</p>
                        ) : (
                          subjParas.map(p => {
                            const pQuestions = questions.filter(q => q.paragraphId === p.id);
                            const isSelectedForWorkstation = activeSavedParagraphId === p.id;

                            return (
                              <div
                                key={p.id}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                  isSelectedForWorkstation
                                    ? 'bg-pink-50/80 border-pink-300'
                                    : 'bg-slate-50/80 border-slate-200'
                                } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                              >
                                <div>
                                  <h5 className="font-extrabold text-slate-800 text-xs">{p.title}</h5>
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    {pQuestions.length} أسئلة مضافة
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleSelectParagraphForWorkstation(p)}
                                    className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-extrabold shadow-xs btn-press"
                                  >
                                    تعديل وإضافة الأسئلة
                                  </button>

                                  <button
                                    onClick={() =>
                                      setConfirmDeleteModal({
                                        isOpen: true,
                                        type: 'paragraph',
                                        targetId: p.id,
                                      })
                                    }
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TABLES & COMPARISONS (خانة الجداول والمقارنات) */}
      {/* ========================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-6 animate-fade-in">
          {/* Add / Edit Table Form */}
          <form
            onSubmit={handleSaveTable}
            className="bg-white p-6 rounded-3xl border border-orange-200/90 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                <TableIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {editingTableParagraphId ? '✏️ تعديل جدول المقارنة الحالي:' : 'إضافة جدول مقارنة جديد (كصورة أو جدول نصي):'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTableParagraphId
                    ? 'يمكنك معاينة الجدول المضاف حالياً، تغيير الصورة أو حذفها، وتحديث العنوان أو الجداول النصية.'
                    : 'يمكنك رفع صورة الجداول الجاهزة مباشرة أو إدخال جدول نصي منظم ورابطه بأي فقرة في أي مادة.'}
                </p>
              </div>
            </div>

            {/* Select Subject & Paragraph for Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">المادة الدراسية:</label>
                <select
                  value={tblSubjectId}
                  onChange={e => setTblSubjectId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">الفقرة التابع لها الجدول:</label>
                <select
                  value={tblParagraphId}
                  onChange={e => setTblParagraphId(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {filteredTblParagraphs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الجدول / موضوع المقارنة:</label>
              <input
                type="text"
                value={tblTitleInput}
                onChange={e => setTblTitleInput(e.target.value)}
                placeholder="مثال: جدول المقارنة بين الشروط والأركان..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            {/* IMAGE TABLE UPLOAD SECTION */}
            <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-3">
              <label className="text-xs font-extrabold text-orange-900 block">
                رفع صورة الجدول جاهزة (مستحسن لسهولة العرض):
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={tblImageUrlInput}
                  onChange={e => setTblImageUrlInput(e.target.value)}
                  placeholder="أدخل رابط صورة مباشر أو ارفع صورة من أجهزتك..."
                  className="flex-1 p-3 bg-white border border-orange-200 rounded-xl text-xs font-bold"
                />

                <label className="cursor-pointer px-3.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all btn-press shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{tblImageUrlInput ? 'تغيير الصورة / رفع جديدة' : 'اختر صورة من الجهاز'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTableImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview Box */}
              {tblImageUrlInput && (
                <div className="relative border border-orange-200 rounded-2xl p-4 bg-white text-center max-w-md mx-auto space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs border-b border-orange-100 pb-2">
                    <span className="font-extrabold text-orange-800 flex items-center gap-1">
                      🖼️ معاينة صورة الجدول الحالية:
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      مرفقة بالجدول
                    </span>
                  </div>
                  <img
                    src={tblImageUrlInput}
                    alt="معاينة صورة الجدول"
                    className="max-h-56 mx-auto object-contain rounded-xl border border-slate-100 shadow-xs"
                  />
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTblImageUrlInput('')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200 shadow-xs btn-press"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف الصورة نهائياً</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TEXT TABLE SECTION (OPTIONAL) */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                أو إدخال الجدول كنص منسق (اختياري - مفصول بـ |):
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  value={tblHeadersInput}
                  onChange={e => setTblHeadersInput(e.target.value)}
                  placeholder="عناوين الأعمدة (مثال: المذهب | الحكم | الدليل)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={tblRowsInput}
                  onChange={e => setTblRowsInput(e.target.value)}
                  placeholder={`صفوف الجدول (سطر لكل صف مفصول بـ |):\nمثال:\nالجمهور | تحريم بيع العينة | سداً للذريعة\nالشافعية | الجواز مع الكراهة | إعمال الظاهر`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {editingTableParagraphId ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteModal({
                      isOpen: true,
                      type: 'table',
                      targetId: tblParagraphId,
                    });
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 btn-press"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف هذا الجدول بالكامل</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {editingTableParagraphId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTableParagraphId(null);
                      setTblTitleInput('');
                      setTblImageUrlInput('');
                      setTblHeadersInput('');
                      setTblRowsInput('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    تفريغ الحقول
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black shadow-md btn-press flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTableParagraphId ? 'تعديل وحفظ بيانات الجدول' : 'حفظ وإضافة الجدول للفقرة المختارة'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* List of Existing Tables Across All Subjects */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm">
              قائمة الجداول المضافة حالياً ({tables.length}):
            </h4>

            {tables.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <TableIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">لا توجد جداول مضافة حتى الآن. يمكنك إضافة جدولك الأول أعلاه!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tables.map(tbl => {
                  const para = paragraphs.find(p => p.id === tbl.paragraphId);
                  const subj = subjects.find(s => s.id === para?.subjectId);
                  const tblQuestions = questions.filter(q => q.paragraphId === tbl.paragraphId && q.sourceType === 'table');

                  return (
                    <div
                      key={tbl.id}
                      className="bg-white p-5 rounded-3xl border border-orange-200/80 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                            {subj?.name || 'مادة'} ← {para?.title || 'فقرة'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {tblQuestions.length} أسئلة جدول
                          </span>
                        </div>

                        <h5 className="font-black text-slate-800 text-sm">
                          {tbl.title || 'جدول مقارنة'}
                        </h5>

                        {/* Image Preview Badge */}
                        {tbl.imageUrl && (
                          <div className="p-2 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                            <img
                              src={tbl.imageUrl}
                              alt="صورة الجدول"
                              className="w-16 h-12 object-cover rounded-lg border border-orange-200 shrink-0"
                            />
                            <div className="text-[11px] text-orange-900 font-bold">
                              <span>تم إرفاق صورة للجدول</span>
                              <p className="text-[10px] text-orange-700 font-normal">جاهزة للعرض للطلاب</p>
                            </div>
                          </div>
                        )}

                        {tbl.headers && tbl.headers.length > 0 && (
                          <div className="text-[11px] text-slate-600 font-medium line-clamp-1">
                            الأعمدة: {tbl.headers.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Table Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setImportSelectedParagraphId(tbl.paragraphId);
                            setIsImportModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold border border-orange-200 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          <span>استيراد أسئلة لهذا الجدول</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditTableClick(tbl)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="تعديل الجدول"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTableClick(tbl)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف الجدول"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TRASH CAN (سلة المحذوفات) */}
      {/* ========================================================= */}
      {activeTab === 'trash' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                سلة المحذوفات المؤقتة ({trashItems.length})
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك استرجاع أي عنصر محذوف أو إفراغ السلة نهائياً.
              </p>
            </div>

            {trashItems.length > 0 && (
              <button
                onClick={() =>
                  setConfirmDeleteModal({
                    isOpen: true,
                    type: 'empty_trash',
                  })
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold btn-press shadow-sm"
              >
                إفراغ السلة نهائياً
              </button>
            )}
          </div>

          <div className="space-y-3">
            {trashItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <RotateCcw className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">سلة المحذوفات فارغة حالياً</p>
              </div>
            ) : (
              trashItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.itemType}
                    </span>
                    <p className="font-bold text-slate-800 text-xs">{item.label}</p>
                  </div>

                  <button
                    onClick={() => {
                      DBStore.restoreTrashItem(item.id);
                      onRefreshData();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold btn-press flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>استرجاع (Restore)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* QUESTION BATCH IMPORT MODAL */}
      <QuestionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        subjects={subjects}
        paragraphs={paragraphs}
        selectedParagraphId={importSelectedParagraphId}
        onSuccess={onRefreshData}
      />

      {/* CONFIRMATION DELETE MODAL */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800">
              {confirmDeleteModal.type === 'empty_trash'
                ? 'إفراغ سلة المحذوفات نهائياً؟'
                : confirmDeleteModal.type === 'table'
                ? 'تأكيد حذف جدول المقارنة؟'
                : `متأكد إنك بدك تحذف ${
                    confirmDeleteModal.count ? `${confirmDeleteModal.count} سؤال` : 'هذا العنصر'
                  }؟`}
            </h3>
            <p className="text-xs text-slate-500">
              {confirmDeleteModal.type === 'empty_trash'
                ? 'سيتم حذف جميع العناصر من السلة بغير رجعة.'
                : 'سيتم نقل العنصر إلى سلة المحذوفات حيث يمكنك استرجاعه لاحقاً.'}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={executeDeleteAction}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-extrabold text-xs hover:bg-rose-700 btn-press"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, type: 'single_question' })}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 btn-press"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
