import {
  Subject,
  Paragraph,
  KeyPoint,
  TableData,
  Question,
  ChangeLog,
  TrashItem,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_PARAGRAPHS,
  INITIAL_KEY_POINTS,
  INITIAL_TABLES,
  INITIAL_QUESTIONS,
  INITIAL_CHANGE_LOGS,
} from './initialData';

const KEYS = {
  SUBJECTS: 'sharia_app_subjects_v1',
  PARAGRAPHS: 'sharia_app_paragraphs_v1',
  KEY_POINTS: 'sharia_app_key_points_v1',
  TABLES: 'sharia_app_tables_v1',
  QUESTIONS: 'sharia_app_questions_v1',
  CHANGE_LOGS: 'sharia_app_change_logs_v1',
  TRASH: 'sharia_app_trash_v1',
  USER_ANSWERS: 'sharia_app_user_answers_v1',
  STARRED_QUESTIONS: 'sharia_app_starred_questions_v1',
  LAST_VISITED: 'sharia_app_last_visited_v1',
};

// Helper for local storage read with fallback
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

export class DBStore {
  // Initialize storage if empty
  static init() {
    if (!localStorage.getItem(KEYS.SUBJECTS)) {
      setItem(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    }
    if (!localStorage.getItem(KEYS.PARAGRAPHS)) {
      setItem(KEYS.PARAGRAPHS, INITIAL_PARAGRAPHS);
    }
    if (!localStorage.getItem(KEYS.KEY_POINTS)) {
      setItem(KEYS.KEY_POINTS, INITIAL_KEY_POINTS);
    }
    if (!localStorage.getItem(KEYS.TABLES)) {
      setItem(KEYS.TABLES, INITIAL_TABLES);
    }
    if (!localStorage.getItem(KEYS.QUESTIONS)) {
      setItem(KEYS.QUESTIONS, INITIAL_QUESTIONS);
    }
    if (!localStorage.getItem(KEYS.CHANGE_LOGS)) {
      setItem(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOGS);
    }
    if (!localStorage.getItem(KEYS.TRASH)) {
      setItem(KEYS.TRASH, []);
    }
    if (!localStorage.getItem(KEYS.USER_ANSWERS)) {
      setItem(KEYS.USER_ANSWERS, {});
    }
    if (!localStorage.getItem(KEYS.STARRED_QUESTIONS)) {
      setItem(KEYS.STARRED_QUESTIONS, []);
    }
    if (!localStorage.getItem(KEYS.LAST_VISITED)) {
      setItem(KEYS.LAST_VISITED, {});
    }
  }

  // --- SUBJECTS ---
  static getSubjects(): Subject[] {
    this.init();
    const subs = getItem<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    return subs.sort((a, b) => a.order - b.order);
  }

  static saveSubject(subject: Partial<Subject> & { name: string }): Subject {
    const subjects = this.getSubjects();
    const now = new Date().toISOString();
    let saved: Subject;

    if (subject.id) {
      const idx = subjects.findIndex(s => s.id === subject.id);
      if (idx !== -1) {
        subjects[idx] = {
          ...subjects[idx],
          ...subject,
          updatedAt: now,
        };
        saved = subjects[idx];
      } else {
        saved = {
          id: subject.id,
          name: subject.name,
          order: subject.order ?? subjects.length + 1,
          updatedAt: now,
        };
        subjects.push(saved);
      }
    } else {
      saved = {
        id: 'subj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: subject.name,
        order: subject.order ?? subjects.length + 1,
        updatedAt: now,
      };
      subjects.push(saved);
    }

    setItem(KEYS.SUBJECTS, subjects);
    return saved;
  }

  static deleteSubject(subjectId: string) {
    const subjects = this.getSubjects();
    const target = subjects.find(s => s.id === subjectId);
    if (!target) return;

    // Move to trash
    this.addToTrash({
      id: 'trash-' + Date.now(),
      itemType: 'subject',
      itemData: target,
      deletedAt: new Date().toISOString(),
      label: `مادة: ${target.name}`,
    });

    const updated = subjects.filter(s => s.id !== subjectId);
    setItem(KEYS.SUBJECTS, updated);
  }

  // --- PARAGRAPHS ---
  static getParagraphs(subjectId?: string): Paragraph[] {
    this.init();
    const paras = getItem<Paragraph[]>(KEYS.PARAGRAPHS, INITIAL_PARAGRAPHS);
    const filtered = subjectId ? paras.filter(p => p.subjectId === subjectId) : paras;
    return filtered.sort((a, b) => a.order - b.order);
  }

  static getParagraphById(paragraphId: string): Paragraph | undefined {
    return this.getParagraphs().find(p => p.id === paragraphId);
  }

  static saveParagraph(para: Partial<Paragraph> & { subjectId: string; title: string }): Paragraph {
    const paragraphs = this.getParagraphs();
    const now = new Date().toISOString();
    let saved: Paragraph;

    if (para.id) {
      const idx = paragraphs.findIndex(p => p.id === para.id);
      if (idx !== -1) {
        paragraphs[idx] = {
          ...paragraphs[idx],
          ...para,
          updatedAt: now,
        };
        saved = paragraphs[idx];
      } else {
        saved = {
          id: para.id,
          subjectId: para.subjectId,
          title: para.title,
          content: para.content ?? '',
          order: para.order ?? paragraphs.length + 1,
          hasTable: para.hasTable ?? false,
          mindMap: para.mindMap ?? '',
          updatedAt: now,
        };
        paragraphs.push(saved);
      }
    } else {
      saved = {
        id: 'para-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        subjectId: para.subjectId,
        title: para.title,
        content: para.content ?? '',
        order: para.order ?? paragraphs.length + 1,
        hasTable: para.hasTable ?? false,
        mindMap: para.mindMap ?? '',
        updatedAt: now,
      };
      paragraphs.push(saved);
    }

    setItem(KEYS.PARAGRAPHS, paragraphs);
    this.touchParagraphTimestamp(saved.id, 'تم تحديث معلومات الفقرة');
    return saved;
  }

  static deleteParagraph(paragraphId: string) {
    const paragraphs = this.getParagraphs();
    const target = paragraphs.find(p => p.id === paragraphId);
    if (!target) return;

    this.addToTrash({
      id: 'trash-' + Date.now(),
      itemType: 'paragraph',
      itemData: target,
      deletedAt: new Date().toISOString(),
      label: `فقرة: ${target.title}`,
    });

    const updated = paragraphs.filter(p => p.id !== paragraphId);
    setItem(KEYS.PARAGRAPHS, updated);
  }

  // --- KEY POINTS ---
  static getAllKeyPoints(): KeyPoint[] {
    this.init();
    return getItem<KeyPoint[]>(KEYS.KEY_POINTS, INITIAL_KEY_POINTS).sort((a, b) => a.order - b.order);
  }

  static getKeyPoints(paragraphId: string): KeyPoint[] {
    return this.getAllKeyPoints().filter(kp => kp.paragraphId === paragraphId);
  }

  static saveKeyPointsForParagraph(paragraphId: string, textLines: string[]) {
    const kps = getItem<KeyPoint[]>(KEYS.KEY_POINTS, INITIAL_KEY_POINTS);
    // Remove existing key points for this paragraph
    const otherKps = kps.filter(kp => kp.paragraphId !== paragraphId);

    const newKps: KeyPoint[] = textLines.map((line, idx) => ({
      id: 'kp-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4),
      paragraphId,
      text: line,
      order: idx + 1,
    }));

    setItem(KEYS.KEY_POINTS, [...otherKps, ...newKps]);
    this.touchParagraphTimestamp(paragraphId, `تم تحديث ${textLines.length} نقاط مفتاحية`);
  }

  // --- TABLES ---
  static getAllTables(): TableData[] {
    this.init();
    return getItem<TableData[]>(KEYS.TABLES, INITIAL_TABLES);
  }

  static getTableData(paragraphId: string): TableData | undefined {
    return this.getAllTables().find(t => t.paragraphId === paragraphId);
  }

  static saveTableData(
    paragraphId: string,
    headers: string[],
    rows: string[][],
    title?: string,
    imageUrl?: string
  ) {
    const tables = getItem<TableData[]>(KEYS.TABLES, INITIAL_TABLES);
    const existingIdx = tables.findIndex(t => t.paragraphId === paragraphId);

    const updatedTable: TableData = {
      id: existingIdx !== -1 ? tables[existingIdx].id : 'tbl-' + Date.now(),
      paragraphId,
      headers,
      rows,
      title,
      imageUrl,
    };

    if (existingIdx !== -1) {
      tables[existingIdx] = updatedTable;
    } else {
      tables.push(updatedTable);
    }

    // Set hasTable on paragraph to true if headers/rows or image exists
    const hasContent = headers.length > 0 || rows.length > 0 || Boolean(imageUrl);
    const paragraphs = this.getParagraphs();
    const pIdx = paragraphs.findIndex(p => p.id === paragraphId);
    if (pIdx !== -1) {
      paragraphs[pIdx].hasTable = hasContent;
      setItem(KEYS.PARAGRAPHS, paragraphs);
    }

    setItem(KEYS.TABLES, tables);
    this.touchParagraphTimestamp(paragraphId, 'تم تحديث بيانات الجدول للفقرة');
  }

  static deleteTableData(paragraphId: string) {
    const tables = getItem<TableData[]>(KEYS.TABLES, INITIAL_TABLES);
    const filtered = tables.filter(t => t.paragraphId !== paragraphId);
    setItem(KEYS.TABLES, filtered);

    const paragraphs = this.getParagraphs();
    const pIdx = paragraphs.findIndex(p => p.id === paragraphId);
    if (pIdx !== -1) {
      paragraphs[pIdx].hasTable = false;
      setItem(KEYS.PARAGRAPHS, paragraphs);
    }
  }

  // --- QUESTIONS ---
  static getQuestions(paragraphId?: string, sourceType?: 'paragraph' | 'table'): Question[] {
    this.init();
    let questions = getItem<Question[]>(KEYS.QUESTIONS, INITIAL_QUESTIONS);
    if (paragraphId) {
      questions = questions.filter(q => q.paragraphId === paragraphId);
    }
    if (sourceType) {
      questions = questions.filter(q => q.sourceType === sourceType);
    }
    return questions.sort((a, b) => a.order - b.order);
  }

  static getAllQuestions(): Question[] {
    this.init();
    return getItem<Question[]>(KEYS.QUESTIONS, INITIAL_QUESTIONS);
  }

  static saveQuestionsBatch(
    paragraphId: string,
    sourceType: 'paragraph' | 'table',
    questionsList: Array<{
      questionText: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }>
  ) {
    const allQuestions = this.getAllQuestions();
    const now = new Date().toISOString();

    const created: Question[] = questionsList.map((q, idx) => ({
      id: 'q-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4),
      paragraphId,
      sourceType,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || '',
      order: idx + 1,
      updatedAt: now,
    }));

    setItem(KEYS.QUESTIONS, [...allQuestions, ...created]);
    this.touchParagraphTimestamp(
      paragraphId,
      `تم استيراد وإضافة ${questionsList.length} أسئلة ${sourceType === 'table' ? 'جدول' : 'فقرة'}`
    );
  }

  static saveQuestion(qData: Partial<Question> & { paragraphId: string; questionText: string; options: string[]; correctOptionIndex: number }): Question {
    const allQuestions = this.getAllQuestions();
    const now = new Date().toISOString();
    let saved: Question;

    if (qData.id) {
      const idx = allQuestions.findIndex(q => q.id === qData.id);
      if (idx !== -1) {
        allQuestions[idx] = {
          ...allQuestions[idx],
          ...qData,
          updatedAt: now,
        };
        saved = allQuestions[idx];
      } else {
        saved = {
          id: qData.id,
          paragraphId: qData.paragraphId,
          sourceType: qData.sourceType ?? 'paragraph',
          questionText: qData.questionText,
          options: qData.options,
          correctOptionIndex: qData.correctOptionIndex,
          explanation: qData.explanation ?? '',
          order: qData.order ?? allQuestions.length + 1,
          updatedAt: now,
        };
        allQuestions.push(saved);
      }
    } else {
      saved = {
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        paragraphId: qData.paragraphId,
        sourceType: qData.sourceType ?? 'paragraph',
        questionText: qData.questionText,
        options: qData.options,
        correctOptionIndex: qData.correctOptionIndex,
        explanation: qData.explanation ?? '',
        order: qData.order ?? allQuestions.length + 1,
        updatedAt: now,
      };
      allQuestions.push(saved);
    }

    setItem(KEYS.QUESTIONS, allQuestions);
    this.touchParagraphTimestamp(qData.paragraphId, 'تم تعديل سؤال بالفقرة');
    return saved;
  }

  static deleteQuestionsBatch(questionIds: string[]) {
    if (questionIds.length === 0) return;
    const allQuestions = this.getAllQuestions();
    const toDelete = allQuestions.filter(q => questionIds.includes(q.id));

    toDelete.forEach(q => {
      this.addToTrash({
        id: 'trash-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        itemType: 'question',
        itemData: q,
        deletedAt: new Date().toISOString(),
        label: `سؤال: ${q.questionText.slice(0, 40)}...`,
      });
    });

    const updated = allQuestions.filter(q => !questionIds.includes(q.id));
    setItem(KEYS.QUESTIONS, updated);

    if (toDelete.length > 0) {
      this.touchParagraphTimestamp(
        toDelete[0].paragraphId,
        `تم حذف ${toDelete.length} أسئلة من الفقرة`
      );
    }
  }

  // --- AUTOMATIC TIMESTAMP UPDATE & CHANGE LOG (Section 2 & 7) ---
  static touchParagraphTimestamp(paragraphId: string, description: string) {
    const paragraphs = this.getParagraphs();
    const idx = paragraphs.findIndex(p => p.id === paragraphId);
    if (idx === -1) return;

    const now = new Date().toISOString();
    paragraphs[idx].updatedAt = now;
    setItem(KEYS.PARAGRAPHS, paragraphs);

    const subject = this.getSubjects().find(s => s.id === paragraphs[idx].subjectId);

    // Add log entry
    const logs = getItem<ChangeLog[]>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOGS);
    logs.unshift({
      id: 'log-' + Date.now(),
      paragraphId,
      paragraphTitle: paragraphs[idx].title,
      subjectName: subject?.name || 'مادة أصول الفقه',
      description,
      timestamp: now,
    });
    setItem(KEYS.CHANGE_LOGS, logs.slice(0, 50)); // keep last 50
  }

  static getChangeLogs(): ChangeLog[] {
    this.init();
    return getItem<ChangeLog[]>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOGS);
  }

  // --- TRASH (Section 4.5) ---
  static getTrash(): TrashItem[] {
    this.init();
    return getItem<TrashItem[]>(KEYS.TRASH, []);
  }

  static addToTrash(item: TrashItem) {
    const trash = this.getTrash();
    trash.unshift(item);
    setItem(KEYS.TRASH, trash);
  }

  static restoreTrashItem(trashId: string) {
    const trash = this.getTrash();
    const item = trash.find(t => t.id === trashId);
    if (!item) return;

    if (item.itemType === 'subject') {
      const subjects = this.getSubjects();
      subjects.push(item.itemData as Subject);
      setItem(KEYS.SUBJECTS, subjects);
    } else if (item.itemType === 'paragraph') {
      const paragraphs = this.getParagraphs();
      paragraphs.push(item.itemData as Paragraph);
      setItem(KEYS.PARAGRAPHS, paragraphs);
    } else if (item.itemType === 'question') {
      const questions = this.getAllQuestions();
      questions.push(item.itemData as Question);
      setItem(KEYS.QUESTIONS, questions);
    }

    const updatedTrash = trash.filter(t => t.id !== trashId);
    setItem(KEYS.TRASH, updatedTrash);
  }

  static emptyTrash() {
    setItem(KEYS.TRASH, []);
  }

  // --- STUDENT LOCAL PROGRESS & VISITS (Section 3.5 & 7) ---
  static getStudentAnswers(): Record<string, number> {
    this.init();
    return getItem<Record<string, number>>(KEYS.USER_ANSWERS, {});
  }

  static setStudentAnswer(questionId: string, optionIndex: number) {
    const answers = this.getStudentAnswers();
    answers[questionId] = optionIndex;
    setItem(KEYS.USER_ANSWERS, answers);
  }

  static resetParagraphAnswers(paragraphId: string) {
    const answers = this.getStudentAnswers();
    const questions = this.getQuestions(paragraphId);
    const qIds = questions.map(q => q.id);

    qIds.forEach(id => {
      delete answers[id];
    });

    setItem(KEYS.USER_ANSWERS, answers);
  }

  static getStarredQuestionIds(): string[] {
    this.init();
    return getItem<string[]>(KEYS.STARRED_QUESTIONS, []);
  }

  static toggleStarredQuestionId(questionId: string): boolean {
    const starred = this.getStarredQuestionIds();
    const idx = starred.indexOf(questionId);
    let isNowStarred = false;

    if (idx !== -1) {
      starred.splice(idx, 1);
      isNowStarred = false;
    } else {
      starred.push(questionId);
      isNowStarred = true;
    }

    setItem(KEYS.STARRED_QUESTIONS, starred);
    return isNowStarred;
  }

  static getLastVisitedParagraphs(): Record<string, string> {
    this.init();
    return getItem<Record<string, string>>(KEYS.LAST_VISITED, {});
  }

  static updateLastVisitedParagraph(paragraphId: string) {
    const visits = this.getLastVisitedParagraphs();
    visits[paragraphId] = new Date().toISOString();
    setItem(KEYS.LAST_VISITED, visits);
  }

  static getUnreadNotificationsCount(): number {
    const visits = this.getLastVisitedParagraphs();
    const paragraphs = this.getParagraphs();

    let count = 0;
    paragraphs.forEach(p => {
      const lastVisit = visits[p.id];
      if (!lastVisit || new Date(p.updatedAt) > new Date(lastVisit)) {
        count++;
      }
    });

    return count;
  }

  static resetAllToDefault() {
    localStorage.clear();
    this.init();
  }
}
