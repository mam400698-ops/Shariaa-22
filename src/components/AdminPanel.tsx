import React, { useState } from 'react';
import {
  Subject,
  Paragraph,
  Question,
  KeyPoint,
  TableData,
  TrashItem,
} from '../types';
import { DBStore } from '../data/dbStore';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Table as TableIcon,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Network,
  Image,
  Upload,
  MessageSquare,
  FileText,
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
  const [activeTab, setActiveTab] = useState<'subjects' | 'paragraphs' | 'questions' | 'tables' | 'trash'>('subjects');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIdFilter, setSelectedSubjectIdFilter] = useState<string>('all');

  // Question Multi-Select state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals & Forms State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSelectedParagraphId, setImportSelectedParagraphId] = useState<string | undefined>(undefined);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'batch_questions' | 'single_question' | 'paragraph' | 'subject' | 'empty_trash';
    targetId?: string;
    count?: number;
  }>({ isOpen: false, type: 'single_question' });

  // ----------------------------------------------------
  // 1) SUBJECT FORM STATE (خانة إضافة وتعديل المواد وتغيير اسمها)
  // ----------------------------------------------------
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');

  // ----------------------------------------------------
  // 2) PARAGRAPH FORM STATE (خانة إضافة وتعديل الفقرات)
  // ----------------------------------------------------
  const [editingParagraph, setEditingParagraph] = useState<Paragraph | null>(null);
  const [paraTitleInput, setParaTitleInput] = useState('');
  const [paraContentInput, setParaContentInput] = useState('');
  const [paraSubjectIdInput, setParaSubjectIdInput] = useState(subjects[0]?.id || '');
  const [paraKeyPointsInput, setParaKeyPointsInput] = useState('');
  const [paraHasTableInput, setParaHasTableInput] = useState(false);
  const [tableHeadersInput, setTableHeadersInput] = useState('');
  const [tableRowsInput, setTableRowsInput] = useState('');
  const [paraTableImageUrlInput, setParaTableImageUrlInput] = useState('');

  // Expanded paragraph IDs for inspecting questions
  const [expandedParagraphIds, setExpandedParagraphIds] = useState<string[]>([]);

  // ----------------------------------------------------
  // 3) QUESTION MANUAL FORM STATE (خانة إضافة أسئلة)
  // ----------------------------------------------------
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qSubjectId, setQSubjectId] = useState(subjects[0]?.id || '');
  const [qParagraphId, setQParagraphId] = useState(paragraphs[0]?.id || '');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qSourceType, setQSourceType] = useState<'paragraph' | 'table'>('paragraph');
  const [showQuestionAddCard, setShowQuestionAddCard] = useState(false);

  // Filtered paragraphs by selected subject for manual question form
  const filteredQParagraphs = paragraphs.filter(p => !qSubjectId || p.subjectId === qSubjectId);

  // ----------------------------------------------------
  // 4) DEDICATED TABLE FORM STATE (خانة الجداول والمقارنات)
  // ----------------------------------------------------
  const [tblSubjectId, setTblSubjectId] = useState(subjects[0]?.id || '');
  const [tblParagraphId, setTblParagraphId] = useState(paragraphs[0]?.id || '');
  const [tblTitleInput, setTblTitleInput] = useState('');
  const [tblImageUrlInput, setTblImageUrlInput] = useState('');
  const [tblHeadersInput, setTblHeadersInput] = useState('');
  const [tblRowsInput, setTblRowsInput] = useState('');
  const [editingTableParagraphId, setEditingTableParagraphId] = useState<string | null>(null);

  // Filtered paragraphs by selected subject for table form
  const filteredTblParagraphs = paragraphs.filter(p => !tblSubjectId || p.subjectId === tblSubjectId);

  // Filtered Questions list
  const filteredQuestions = questions.filter(q => {
    const matchSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedSubjectIdFilter === 'all') return matchSearch;

    const p = paragraphs.find(p => p.id === q.paragraphId);
    return matchSearch && p?.subjectId === selectedSubjectIdFilter;
  });

  // Toggle select all questions
  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map(q => q.id));
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(qId => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const toggleExpandParagraph = (id: string) => {
    if (expandedParagraphIds.includes(id)) {
      setExpandedParagraphIds(expandedParagraphIds.filter(pId => pId !== id));
    } else {
      setExpandedParagraphIds([...expandedParagraphIds, id]);
    }
  };

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
  const handleParaTableImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setParaTableImageUrlInput(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveParagraph = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paraTitleInput.trim() || !paraSubjectIdInput) return;

    const savedPara = DBStore.saveParagraph({
      id: editingParagraph?.id,
      subjectId: paraSubjectIdInput,
      title: paraTitleInput.trim(),
      content: paraContentInput.trim(),
      hasTable: paraHasTableInput,
    });

    // Save key points
    if (paraKeyPointsInput.trim()) {
      const lines = paraKeyPointsInput.split('\n').map(s => s.trim()).filter(Boolean);
      DBStore.saveKeyPointsForParagraph(savedPara.id, lines);
    }

    // Save table
    if (paraHasTableInput) {
      const headers = tableHeadersInput.trim()
        ? tableHeadersInput.split(',').map(s => s.trim())
        : [];
      const rows = tableRowsInput.trim()
        ? tableRowsInput
            .split('\n')
            .map(row => row.split(',').map(s => s.trim()))
            .filter(r => r.length > 0 && r[0] !== '')
        : [];

      DBStore.saveTableData(
        savedPara.id,
        headers,
        rows,
        undefined,
        paraTableImageUrlInput.trim() || undefined
      );
    }

    setEditingParagraph(null);
    setParaTitleInput('');
    setParaContentInput('');
    setParaKeyPointsInput('');
    setTableHeadersInput('');
    setTableRowsInput('');
    setParaTableImageUrlInput('');
    setParaHasTableInput(false);
    onRefreshData();
  };

  const handleEditParagraphClick = (p: Paragraph) => {
    setEditingParagraph(p);
    setParaSubjectIdInput(p.subjectId);
    setParaTitleInput(p.title);
    setParaContentInput(p.content || '');
    setParaHasTableInput(p.hasTable);

    const kps = keyPoints.filter(kp => kp.paragraphId === p.id);
    setParaKeyPointsInput(kps.map(kp => kp.text).join('\n'));

    const tbl = tables.find(t => t.paragraphId === p.id);
    if (tbl) {
      setTableHeadersInput(tbl.headers ? tbl.headers.join(', ') : '');
      setTableRowsInput(tbl.rows ? tbl.rows.map(r => r.join(', ')).join('\n') : '');
      setParaTableImageUrlInput(tbl.imageUrl || '');
    } else {
      setTableHeadersInput('');
      setTableRowsInput('');
      setParaTableImageUrlInput('');
    }

    setActiveTab('paragraphs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open manual question form pre-selected for a paragraph
  const handleAddQuestionToParagraphClick = (pId: string) => {
    setEditingQuestion(null);
    setQParagraphId(pId);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectIdx(0);
    setQExplanation('');
    setShowQuestionAddCard(true);
    setActiveTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open smart import for a specific paragraph
  const handleSmartImportForParagraphClick = (pId: string) => {
    setImportSelectedParagraphId(pId);
    setIsImportModalOpen(true);
  };

  // ----------------------------------------------------
  // HANDLERS FOR QUESTIONS
  // ----------------------------------------------------
  const handleSaveSingleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qParagraphId) return;

    DBStore.saveQuestion({
      id: editingQuestion?.id,
      paragraphId: qParagraphId,
      sourceType: qSourceType,
      questionText: qText.trim(),
      options: qOptions.map(o => o.trim()).filter(Boolean),
      correctOptionIndex: qCorrectIdx,
      explanation: qExplanation.trim(),
    });

    setEditingQuestion(null);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectIdx(0);
    setQExplanation('');
    setShowQuestionAddCard(false);
    onRefreshData();
  };

  // ----------------------------------------------------
  // 4) TABLE DEDICATED HANDLERS
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

  const handleSaveTableDedicated = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tblParagraphId) return;

    const headers = tblHeadersInput.trim() ? tblHeadersInput.split('|').map(s => s.trim()) : [];
    const rows = tblRowsInput.trim()
      ? tblRowsInput.split('\n').filter(r => r.trim()).map(r => r.split('|').map(c => c.trim()))
      : [];

    DBStore.saveTableData(
      tblParagraphId,
      headers,
      rows,
      tblTitleInput.trim() || undefined,
      tblImageUrlInput.trim() || undefined
    );

    onRefreshData();
    setTblTitleInput('');
    setTblImageUrlInput('');
    setTblHeadersInput('');
    setTblRowsInput('');
    setEditingTableParagraphId(null);
  };

  const handleEditTableClick = (tbl: TableData) => {
    const para = paragraphs.find(p => p.id === tbl.paragraphId);
    if (para) {
      setTblSubjectId(para.subjectId);
      setTblParagraphId(tbl.paragraphId);
    }
    setTblTitleInput(tbl.title || '');
    setTblImageUrlInput(tbl.imageUrl || '');
    setTblHeadersInput(tbl.headers ? tbl.headers.join(' | ') : '');
    setTblRowsInput(tbl.rows ? tbl.rows.map(r => r.join(' | ')).join('\n') : '');
    setEditingTableParagraphId(tbl.paragraphId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTableClick = (tbl: TableData) => {
    DBStore.deleteTableData(tbl.paragraphId);
    onRefreshData();
  };

  // Delete Action Executor
  const executeDeleteAction = () => {
    const { type, targetId } = confirmDeleteModal;

    if (type === 'batch_questions') {
      DBStore.deleteQuestionsBatch(selectedQuestionIds);
      setSelectedQuestionIds([]);
    } else if (type === 'single_question' && targetId) {
      DBStore.deleteQuestionsBatch([targetId]);
    } else if (type === 'paragraph' && targetId) {
      DBStore.deleteParagraph(targetId);
    } else if (type === 'subject' && targetId) {
      DBStore.deleteSubject(targetId);
    } else if (type === 'empty_trash') {
      DBStore.emptyTrash();
    }

    setConfirmDeleteModal({ isOpen: false, type: 'single_question' });
    onRefreshData();
  };

  const trashItems = DBStore.getTrash();

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-pink-950 to-orange-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>لوحة تحكّم الإدمن المحمية</span>
          </div>
          <h2 className="text-2xl font-black">إدارة المواد والفقرات والأسئلة</h2>
          <p className="text-xs text-slate-300">
            أضف وعدّل أسرع المواد والفقرات والأسئلة مع شاشة المعاينة الذكية وسلة المحذوفات.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setImportSelectedParagraphId(undefined);
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-2xl text-xs font-extrabold shadow-md btn-press flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>استيراد أسئلة ذكي</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold btn-press flex items-center gap-1.5 border border-white/20"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للموقع</span>
          </button>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. خانة إضافة وتعديل المواد ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('paragraphs')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2 ${
            activeTab === 'paragraphs'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>2. خانة إضافة الفقرات والأسئلة ({paragraphs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>3. خانة جميع الأسئلة ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2 ${
            activeTab === 'tables'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>4. خانة الجداول والمقارنات ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all btn-press flex items-center gap-2 ${
            activeTab === 'trash'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>سلة المحذوفات ({trashItems.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SUBJECTS (خانة إضافة وتعديل مواد وتغيير أسمائها) */}
      {/* ========================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {/* Add / Edit Subject Form */}
          <form
            onSubmit={handleSaveSubject}
            className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingSubject ? 'تغيير اسم المادة الحالية:' : 'إضافة مادة دراسية جديدة:'}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
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
                  {editingSubject ? 'حفظ تغيير الاسم' : '+ إضافة المادة'}
                </button>
              </div>
            </div>
          </form>

          {/* Subjects Cards Grid */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 text-sm">
              المواد المتاحة حالياً ({subjects.length}):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(s => {
                const subjParas = paragraphs.filter(p => p.subjectId === s.id);
                const subjParaIds = subjParas.map(p => p.id);
                const subjQuestions = questions.filter(q => subjParaIds.includes(q.paragraphId));

                return (
                  <div
                    key={s.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4 hover:border-pink-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-pink-500" />
                          <span>{s.name}</span>
                        </h5>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-1">
                          <span className="bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full">
                            {subjParas.length} فقرة
                          </span>
                          <span className="bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">
                            {subjQuestions.length} سؤال
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSubjectClick(s)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          title="تغيير اسم المادة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل الاسم</span>
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDeleteModal({
                              isOpen: true,
                              type: 'subject',
                              targetId: s.id,
                            })
                          }
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="حذف المادة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setParaSubjectIdInput(s.id);
                        setActiveTab('paragraphs');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-xl text-xs font-bold border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-pink-500" />
                      <span>إضافة فقرة جديدة لهذه المادة</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PARAGRAPHS & QUESTIONS ADDITION (خانة إضافة الفقرات وتنسيق الأسئلة) */}
      {/* ========================================================= */}
      {activeTab === 'paragraphs' && (
        <div className="space-y-6">
          {/* Create / Edit Paragraph Form */}
          <form
            onSubmit={handleSaveParagraph}
            className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingParagraph ? 'تعديل بيانات الفقرة:' : 'إضافة فقرة جديدة المضمون:'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">اختر المادة التابعة لها:</label>
                <select
                  value={paraSubjectIdInput}
                  onChange={e => setParaSubjectIdInput(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                >
                  <option value="">-- اختر المادة --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">عنوان الفقرة المفصل:</label>
                <input
                  type="text"
                  value={paraTitleInput}
                  onChange={e => setParaTitleInput(e.target.value)}
                  placeholder="مثال: دلالة العام والخاص عند الحنفية..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Key points text area */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                النقاط المفتاحية (سطر لكل نقطة - تظهر للطلاب أعلى الفقرة):
              </label>
              <textarea
                rows={3}
                value={paraKeyPointsInput}
                onChange={e => setParaKeyPointsInput(e.target.value)}
                placeholder="• دلالة العام عند الجمهور ظنية.&#10;• الحنفية يوجبون تخصيص العام بالمتواتر..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Explanation / Content */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">نص الفقرة الشارح (اختياري):</label>
              <textarea
                rows={3}
                value={paraContentInput}
                onChange={e => setParaContentInput(e.target.value)}
                placeholder="أدخل الشرح التفصيلي للفقرة إن وجد..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Table Option Checkbox & Image Upload */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-orange-700">
                <input
                  type="checkbox"
                  checked={paraHasTableInput}
                  onChange={e => setParaHasTableInput(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                />
                <TableIcon className="w-4 h-4" />
                <span>تحتوي هذه الفقرة على جدول مقارنة تفصيلي (صورة أو جدول نصي)</span>
              </label>

              {paraHasTableInput && (
                <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-3">
                  {/* Table Image Section */}
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-orange-900 flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-orange-600" />
                        <span>📷 إضافة الجدول كصورة (رفع ملف أو رابط صورة):</span>
                      </label>
                      <label className="cursor-pointer px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all btn-press">
                        <Upload className="w-3 h-3" />
                        <span>اختر صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleParaTableImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={paraTableImageUrlInput}
                      onChange={e => setParaTableImageUrlInput(e.target.value)}
                      placeholder="ضع رابط صورة الجدول مباشرة هاهنا (http/https)..."
                      className="w-full p-2 bg-slate-50 border border-orange-200 rounded-lg text-xs"
                    />

                    {paraTableImageUrlInput && (
                      <div className="relative border border-orange-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                        <span className="text-[10px] font-bold text-orange-700">معاينة صورة الجدول:</span>
                        <img
                          src={paraTableImageUrlInput}
                          alt="معاينة صورة الجدول"
                          className="max-h-36 mx-auto object-contain rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setParaTableImageUrlInput('')}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف الصورة</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Optional Text Table */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-orange-900 block">
                      أو عناوين أعمدة الجدول النصي (مفصولة بفاصلة):
                    </label>
                    <input
                      type="text"
                      value={tableHeadersInput}
                      onChange={e => setTableHeadersInput(e.target.value)}
                      placeholder="المذهب, الحكم الشرعي, الدليل"
                      className="w-full p-2.5 bg-white border border-orange-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-orange-900 block">
                      صفوف البيانات النصية (سطر لكل صف، القيم مفصولة بفاصلة):
                    </label>
                    <textarea
                      rows={3}
                      value={tableRowsInput}
                      onChange={e => setTableRowsInput(e.target.value)}
                      placeholder="الجمهور, تحريم بيع العينة, سداً للذريعة&#10;الشافعية, الجواز مع الكراهة, إعمال ظاهر العقد"
                      className="w-full p-2.5 bg-white border border-orange-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {editingParagraph && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingParagraph(null);
                    setParaTitleInput('');
                    setParaContentInput('');
                    setParaKeyPointsInput('');
                    setTableHeadersInput('');
                    setTableRowsInput('');
                    setParaTableImageUrlInput('');
                    setParaHasTableInput(false);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  إلغاء التعديل
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-xl text-xs font-extrabold btn-press shadow-sm"
              >
                {editingParagraph ? 'تعديل الفقرة' : 'حفظ الفقرة الجديدة'}
              </button>
            </div>
          </form>

          {/* DEDICATED QUICK QUESTION ADDITION SECTION INSIDE TAB 2 */}
          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-orange-50 p-6 rounded-3xl border border-pink-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-pink-500 text-white rounded-2xl shadow-sm shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    ⚡ إضافة أسئلة سريعة للفقرات (بالخانة 2)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    يمكنك لصق مجموعة أسئلة كاملة دفعة واحدة من الواتس/الوورد أو إضافة سؤال فردي.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImportSelectedParagraphId(qParagraphId || paragraphs[0]?.id);
                  setIsImportModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black shadow-md btn-press flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>لصق واستيراد أسئلة (من الواتس / الوورد)</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowQuestionAddCard(!showQuestionAddCard)}
                className="px-4 py-2 bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{showQuestionAddCard ? 'إغلاق نموذج إضافة سؤال فردي' : '+ إضافة سؤال فردي مباشر هنا'}</span>
              </button>
            </div>

            {showQuestionAddCard && (
              <form onSubmit={handleSaveSingleQuestion} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 pt-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">1. المادة:</label>
                    <select
                      value={qSubjectId}
                      onChange={e => {
                        const subjId = e.target.value;
                        setQSubjectId(subjId);
                        const match = paragraphs.filter(p => p.subjectId === subjId);
                        if (match.length > 0) setQParagraphId(match[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">2. الفقرة التابعة:</label>
                    <select
                      value={qParagraphId}
                      onChange={e => setQParagraphId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      {filteredQParagraphs.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">3. نوع السؤال:</label>
                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setQSourceType('paragraph')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                          qSourceType === 'paragraph' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        سؤال فقرة
                      </button>
                      <button
                        type="button"
                        onClick={() => setQSourceType('table')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                          qSourceType === 'table' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        سؤال جدول
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">نص السؤال:</label>
                  <textarea
                    rows={2}
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    placeholder="أدخل نص السؤال..."
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>الخيار {idx + 1}:</span>
                        <span className="text-[10px] text-slate-500">
                          {qCorrectIdx === idx ? '✓ الإجابة الصحيحة' : ''}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="qCorrectRadioTab2"
                          checked={qCorrectIdx === idx}
                          onChange={() => setQCorrectIdx(idx)}
                          className="w-4 h-4 text-pink-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const updated = [...qOptions];
                            updated[idx] = e.target.value;
                            setQOptions(updated);
                          }}
                          placeholder={`الخيار ${idx + 1}`}
                          required
                          className={`w-full p-2.5 border rounded-xl text-xs ${
                            qCorrectIdx === idx ? 'border-emerald-500 bg-emerald-50/50 font-bold' : 'border-slate-200 bg-slate-50'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">التعليل / الشرح المفصل:</label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={e => setQExplanation(e.target.value)}
                    placeholder="أدخل الشرح أو التعليل الذي يظهر للطالب..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-xl text-xs font-extrabold shadow-sm btn-press"
                  >
                    حفظ السؤال بالفقرة المختارة
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of Paragraphs with Direct Add Question Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-sm">
                قائمة الفقرات المتاحة ({paragraphs.length}):
              </h4>
            </div>

            {paragraphs.map(p => {
              const subj = subjects.find(s => s.id === p.subjectId);
              const pQuestions = questions.filter(q => q.paragraphId === p.id);
              const isExpanded = expandedParagraphIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
                >
                  {/* Paragraph Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-3 py-0.5 rounded-full mb-1 inline-block">
                        {subj?.name || 'مادة غير محددة'}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-base">{p.title}</h4>
                    </div>

                    {/* Paragraph Action Buttons (Adds Questions!) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Button to add question manually */}
                      <button
                        onClick={() => handleAddQuestionToParagraphClick(p.id)}
                        className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl text-xs font-extrabold border border-pink-200 btn-press flex items-center gap-1"
                        title="إضافة سؤال يدوياً لهذا الفقرة"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ سؤال يدوي</span>
                      </button>

                      {/* Button to batch import questions for this paragraph */}
                      <button
                        onClick={() => handleSmartImportForParagraphClick(p.id)}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-extrabold border border-orange-200 btn-press flex items-center gap-1"
                        title="استيراد ذكي للأسئلة بداخل هذه الفقرة"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        <span>استيراد أسئلة ذكي</span>
                      </button>

                      {/* Edit paragraph */}
                      <button
                        onClick={() => handleEditParagraphClick(p)}
                        className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تعديل الفقرة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete paragraph */}
                      <button
                        onClick={() =>
                          setConfirmDeleteModal({
                            isOpen: true,
                            type: 'paragraph',
                            targetId: p.id,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف الفقرة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Count & Expand Toggle */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>
                      عدد الأسئلة بهذه الفقرة: <strong className="text-pink-600">{pQuestions.length} سؤال</strong>
                    </span>

                    {pQuestions.length > 0 && (
                      <button
                        onClick={() => toggleExpandParagraph(p.id)}
                        className="text-pink-600 hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'إخفاء أسئلة الفقرة' : 'عرض أسئلة الفقرة'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Questions under this paragraph */}
                  {isExpanded && pQuestions.length > 0 && (
                    <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      {pQuestions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800">
                              #{qIdx + 1}) {q.questionText}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setQParagraphId(q.paragraphId);
                                  setQText(q.questionText);
                                  setQOptions([...q.options]);
                                  setQCorrectIdx(q.correctOptionIndex);
                                  setQExplanation(q.explanation);
                                  setQSourceType(q.sourceType);
                                  setShowQuestionAddCard(true);
                                  setActiveTab('questions');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-1 text-slate-400 hover:text-pink-600"
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
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={oIdx === q.correctOptionIndex ? 'font-bold text-emerald-700' : ''}
                              >
                                • {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: QUESTIONS MANAGEMENT (خانة إدارة كافة الأسئلة) */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Button or Form to add single question manually */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {editingQuestion ? 'تعديل السؤال الحالي:' : 'إضافة سؤال يدوياً:'}
                </h3>
              </div>

              {!showQuestionAddCard && !editingQuestion && (
                <button
                  onClick={() => setShowQuestionAddCard(true)}
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl text-xs font-bold border border-pink-200 btn-press"
                >
                  + إظهار نموذج إضافة سؤال
                </button>
              )}
            </div>

            {(showQuestionAddCard || editingQuestion) && (
              <form onSubmit={handleSaveSingleQuestion} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">1. المادة:</label>
                    <select
                      value={qSubjectId}
                      onChange={e => {
                        const subjId = e.target.value;
                        setQSubjectId(subjId);
                        const match = paragraphs.filter(p => p.subjectId === subjId);
                        if (match.length > 0) setQParagraphId(match[0].id);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">2. الفقرة التابعة:</label>
                    <select
                      value={qParagraphId}
                      onChange={e => setQParagraphId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      {filteredQParagraphs.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">3. نوع السؤال:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setQSourceType('paragraph')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${
                          qSourceType === 'paragraph'
                            ? 'bg-pink-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        سؤال فقرة
                      </button>
                      <button
                        type="button"
                        onClick={() => setQSourceType('table')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${
                          qSourceType === 'table' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        سؤال جدول
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">نص السؤال:</label>
                  <input
                    type="text"
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    placeholder="أدخل نص السؤال..."
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    الخيارات الأربعة (حدد الدائرة بقرب الخيار الصحيح):
                  </label>
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOptSelect"
                        checked={qCorrectIdx === idx}
                        onChange={() => setQCorrectIdx(idx)}
                        className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...qOptions];
                          newOpts[idx] = e.target.value;
                          setQOptions(newOpts);
                        }}
                        placeholder={`الخيار ${['أ', 'ب', 'ج', 'د'][idx]}...`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">التعليل الفقهي:</label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={e => setQExplanation(e.target.value)}
                    placeholder="أدخل التعليل الفقهي لتوضيح سبب الخيار الصحيح..."
                    className="w-full p-2.5 bg-orange-50/60 border border-orange-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowQuestionAddCard(false);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    إغلاق النموذج
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-pink-600 text-white rounded-xl text-xs font-extrabold hover:bg-pink-700 btn-press"
                  >
                    {editingQuestion ? 'تحديث السؤال' : 'حفظ السؤال'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Search & Filter bar for questions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث نصي في الأسئلة أو الخيارات أو التعليل..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedSubjectIdFilter}
                onChange={e => setSelectedSubjectIdFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
              >
                <option value="all">جميع المواد ({questions.length} سؤال)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {selectedQuestionIds.length > 0 && (
                <button
                  onClick={() =>
                    setConfirmDeleteModal({
                      isOpen: true,
                      type: 'batch_questions',
                      count: selectedQuestionIds.length,
                    })
                  }
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold shadow-sm btn-press flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف المحدد ({selectedQuestionIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Select All Checkbox */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 hover:text-pink-600"
            >
              {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-pink-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>تحديد كافة الأسئلة المعروضة ({filteredQuestions.length})</span>
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">لا يوجد أسئلة مطابقة للبحث</p>
              </div>
            ) : (
              filteredQuestions.map((q, qIdx) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const para = paragraphs.find(p => p.id === q.paragraphId);
                const subj = subjects.find(s => s.id === para?.subjectId);

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl p-5 border transition-all space-y-3 ${
                      isSelected ? 'border-pink-500 bg-pink-50/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleToggleSelectQuestion(q.id)}
                          className="text-pink-600 hover:opacity-80 transition-opacity"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-pink-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <span className="text-xs font-extrabold text-pink-700 bg-pink-100 px-3 py-0.5 rounded-full">
                          سؤال #{qIdx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {subj?.name} / {para?.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setQParagraphId(q.paragraphId);
                            setQText(q.questionText);
                            setQOptions([...q.options]);
                            setQCorrectIdx(q.correctOptionIndex);
                            setQExplanation(q.explanation);
                            setQSourceType(q.sourceType);
                            setShowQuestionAddCard(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                          title="تعديل السؤال"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDeleteModal({
                              isOpen: true,
                              type: 'single_question',
                              targetId: q.id,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف السؤال وسحبه للسلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm leading-relaxed pr-7">
                      {q.questionText}
                    </h4>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pr-7">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}
                          >
                            <span>
                              {['أ', 'ب', 'ج', 'د', 'هـ'][optIdx] || optIdx + 1}) {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-xs text-orange-900 bg-orange-50/70 p-2.5 rounded-xl border border-orange-200 pr-7">
                        💡 <strong>التعليل:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DEDICATED TABLES & COMPARISONS (خانة الجداول والمقارنات) */}
      {/* ========================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {/* Create / Edit Table Form */}
          <form
            onSubmit={handleSaveTableDedicated}
            className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">
                  {editingTableParagraphId ? 'تعديل جدول المقارنة الحالي:' : 'إضافة جدول مقارنة جديد (كصورة أو جدول نصي):'}
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك رفع صورة الجداول الجاهزة مباشرة أو إدخال جدول نصي منظم ورابطه بأي فقرة في أي مادة.
                </p>
              </div>
            </div>

            {/* Select Subject & Paragraph */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-orange-950 block">1. اختر المادة:</label>
                <select
                  value={tblSubjectId}
                  onChange={e => {
                    const subjId = e.target.value;
                    setTblSubjectId(subjId);
                    const match = paragraphs.filter(p => p.subjectId === subjId);
                    if (match.length > 0) setTblParagraphId(match[0].id);
                  }}
                  required
                  className="w-full p-3 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 shadow-xs"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-orange-950 block">2. اختر الفقرة التابع لها الجدول:</label>
                <select
                  value={tblParagraphId}
                  onChange={e => setTblParagraphId(e.target.value)}
                  required
                  className="w-full p-3 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 shadow-xs"
                >
                  {filteredTblParagraphs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">عنوان الجدول / موضوع المقارنة:</label>
              <input
                type="text"
                value={tblTitleInput}
                onChange={e => setTblTitleInput(e.target.value)}
                placeholder="مثال: جدول مقارنة الشافعية والحنفية في أحكام بيع العينة..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* IMAGE SECTION FOR TABLE ("و بدي ضيف الجدول ك صورة") */}
            <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-orange-600" />
                  <span>📷 إضافة الجدول كصورة (رفع ملف من الجهاز أو رابط صورة):</span>
                </label>

                <label className="cursor-pointer px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all btn-press">
                  <Upload className="w-3.5 h-3.5" />
                  <span>اختر صورة من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTableImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={tblImageUrlInput}
                  onChange={e => setTblImageUrlInput(e.target.value)}
                  placeholder="أو ضع رابط صورة الجدول مباشرة (http/https)..."
                  className="w-full p-2.5 bg-white border border-orange-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Image Preview Box */}
              {tblImageUrlInput && (
                <div className="relative border border-orange-200 rounded-2xl p-3 bg-white text-center max-w-md mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full inline-block">
                    معاينة صورة الجدول
                  </span>
                  <img
                    src={tblImageUrlInput}
                    alt="معاينة صورة الجدول"
                    className="max-h-48 mx-auto object-contain rounded-xl border border-slate-100 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setTblImageUrlInput('')}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الصورة</span>
                  </button>
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
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  إلغاء التعديل
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-extrabold shadow-md btn-press"
              >
                {editingTableParagraphId ? 'تعديل بيانات الجدول' : 'حفظ وإضافة الجدول للفقرة المختارة'}
              </button>
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
      {/* TAB 4: TRASH CAN (سلة المحذوفات) */}
      {/* ========================================================= */}
      {activeTab === 'trash' && (
        <div className="space-y-6">
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
