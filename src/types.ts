export interface Subject {
  id: string;
  name: string;
  order: number;
  updatedAt: string;
}

export interface Paragraph {
  id: string;
  subjectId: string;
  title: string;
  content?: string;
  order: number;
  hasTable: boolean;
  mindMap?: string;
  updatedAt: string;
}

export interface KeyPoint {
  id: string;
  paragraphId: string;
  text: string;
  order: number;
}

export interface TableData {
  id: string;
  paragraphId: string;
  title?: string;
  headers: string[];
  rows: string[][];
  imageUrl?: string;
}

export interface Question {
  id: string;
  paragraphId: string;
  sourceType: 'paragraph' | 'table';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  order: number;
  updatedAt: string;
}

export interface ChangeLog {
  id: string;
  paragraphId: string;
  paragraphTitle: string;
  subjectName: string;
  description: string;
  timestamp: string;
}

export interface TrashItem {
  id: string;
  itemType: 'subject' | 'paragraph' | 'keyPoint' | 'question';
  itemData: Subject | Paragraph | KeyPoint | Question;
  deletedAt: string;
  label: string;
}

export interface ExtractionResult {
  questions: Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    confidence: 'high' | 'medium' | 'low' | 'warning';
    warningMessage?: string;
  }>;
  keyPoints: string[];
  ignoredTexts: string[];
}
