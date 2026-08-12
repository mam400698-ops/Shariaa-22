import React, { useState, useEffect } from 'react';
import {
  Subject,
  Paragraph,
  Question,
  KeyPoint,
  TableData,
  ChangeLog,
} from './types';
import { DBStore } from './data/dbStore';
import { Navbar } from './components/Navbar';
import { SubjectList } from './components/SubjectList';
import { ParagraphList } from './components/ParagraphList';
import { ParagraphView } from './components/ParagraphView';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { StarredQuestionsDrawer } from './components/StarredQuestionsDrawer';

export default function App() {
  // DB State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);

  // Navigation State
  const [currentView, setCurrentView] = useState<'subjects' | 'paragraphs' | 'paragraph_detail' | 'admin'>('subjects');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [paragraphInitialMode, setParagraphInitialMode] = useState<'paragraph' | 'table'>('paragraph');

  // Admin & Modals State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isStarredOpen, setIsStarredOpen] = useState<boolean>(false);

  // Student State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [starredQuestionIds, setStarredQuestionIds] = useState<string[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Load Data
  const loadData = () => {
    DBStore.init();
    setSubjects(DBStore.getSubjects());
    setParagraphs(DBStore.getParagraphs());
    setQuestions(DBStore.getAllQuestions());
    setKeyPoints(DBStore.getAllKeyPoints());
    setTables(DBStore.getAllTables());
    setChangeLogs(DBStore.getChangeLogs());
    setUserAnswers(DBStore.getStudentAnswers());
    setStarredQuestionIds(DBStore.getStarredQuestionIds());
    setUnreadNotificationsCount(DBStore.getUnreadNotificationsCount());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update paragraph keyPoints & tables when selected paragraph changes
  useEffect(() => {
    if (selectedParagraphId) {
      setKeyPoints(DBStore.getKeyPoints(selectedParagraphId));
      const tbl = DBStore.getTableData(selectedParagraphId);
      setTables(tbl ? [tbl] : []);
      // Mark paragraph as visited for notifications calculation
      DBStore.updateLastVisitedParagraph(selectedParagraphId);
      setUnreadNotificationsCount(DBStore.getUnreadNotificationsCount());
    }
  }, [selectedParagraphId]);

  // Handlers
  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setCurrentView('paragraphs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectParagraph = (paragraphId: string, initialMode: 'paragraph' | 'table' = 'paragraph') => {
    setSelectedParagraphId(paragraphId);
    setParagraphInitialMode(initialMode);
    setCurrentView('paragraph_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    DBStore.setStudentAnswer(questionId, optionIndex);
    setUserAnswers(DBStore.getStudentAnswers());
  };

  const handleToggleStar = (questionId: string) => {
    DBStore.toggleStarredQuestionId(questionId);
    setStarredQuestionIds(DBStore.getStarredQuestionIds());
  };

  const handleResetParagraphProgress = (paraId: string) => {
    DBStore.resetParagraphAnswers(paraId);
    setUserAnswers(DBStore.getStudentAnswers());
  };

  const handleResetAllData = () => {
    DBStore.resetAllToDefault();
    loadData();
    setCurrentView('subjects');
  };

  // Selected Entities
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentParagraph = paragraphs.find(p => p.id === selectedParagraphId);

  // Starred Questions Objects
  const starredQuestionsList = questions.filter(q => starredQuestionIds.includes(q.id));

  return (
    <div className="min-h-screen bg-white text-slate-800 font-cairo flex flex-col selection:bg-pink-100 selection:text-pink-600">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          if (view === 'subjects') {
            setSelectedSubjectId(null);
            setSelectedParagraphId(null);
            setCurrentView('subjects');
          } else if (view === 'admin') {
            setCurrentView('admin');
          }
        }}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenStarred={() => setIsStarredOpen(true)}
        unreadCount={unreadNotificationsCount}
        starredCount={starredQuestionIds.length}
        onResetData={handleResetAllData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {currentView === 'subjects' && (
          <SubjectList
            subjects={subjects}
            paragraphs={paragraphs}
            questions={questions}
            onSelectSubject={handleSelectSubject}
            userAnswers={userAnswers}
          />
        )}

        {currentView === 'paragraphs' && currentSubject && (
          <ParagraphList
            subject={currentSubject}
            paragraphs={paragraphs.filter(p => p.subjectId === currentSubject.id)}
            keyPoints={keyPoints}
            questions={questions}
            tables={tables}
            onBack={() => setCurrentView('subjects')}
            onSelectParagraph={handleSelectParagraph}
            userAnswers={userAnswers}
          />
        )}

        {currentView === 'paragraph_detail' && currentParagraph && (
          <ParagraphView
            paragraph={currentParagraph}
            keyPoints={keyPoints}
            questions={questions.filter(q => q.paragraphId === currentParagraph.id)}
            tableData={tables.find(t => t.paragraphId === currentParagraph.id)}
            initialMode={paragraphInitialMode}
            onBack={() => setCurrentView('paragraphs')}
            userAnswers={userAnswers}
            onSelectOption={handleSelectOption}
            onResetParagraphProgress={handleResetParagraphProgress}
            starredQuestionIds={starredQuestionIds}
            onToggleStarQuestion={handleToggleStar}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            subjects={subjects}
            paragraphs={paragraphs}
            questions={questions}
            keyPoints={keyPoints}
            tables={tables}
            onRefreshData={loadData}
            onExitAdmin={() => setCurrentView('subjects')}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setCurrentView('admin');
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        logs={changeLogs}
        paragraphs={paragraphs}
        onSelectParagraph={paraId => handleSelectParagraph(paraId)}
      />

      <StarredQuestionsDrawer
        isOpen={isStarredOpen}
        onClose={() => setIsStarredOpen(false)}
        starredQuestions={starredQuestionsList}
        onToggleStar={handleToggleStar}
        onSelectParagraph={paraId => handleSelectParagraph(paraId)}
      />

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            تطبيق أسئلة ومراجعة كلية الشريعة — السنة الثالثة (الفصل الثاني)
          </p>
          <div className="flex items-center gap-2 font-bold text-pink-600">
            <span>خلفية بيضاء • ألوان وردية وبرتقالية • إشعارات محليّة</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
