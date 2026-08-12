import { ExtractionResult } from '../types';

/**
 * Strict Rule-Based Question & Key Point Extractor
 * Follows Section 5 of Specifications strictly:
 * - Position-based option mapping (options[0], options[1]...)
 * - Verbatim extraction without AI rewriting
 * - Ignore narrative/meta conversation
 * - Support variable option count
 * - Flag uncertain questions for mandatory admin preview review
 */
export function extractBatchFromText(rawText: string): ExtractionResult {
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const keyPoints: string[] = [];
  const ignoredTexts: string[] = [];
  const extractedQuestions: ExtractionResult['questions'] = [];

  let inKeyPointsSection = false;
  let inQuestionsSection = false;

  // Temporary buffers for current question being parsed
  let currentQText = '';
  let currentOptions: string[] = [];
  let currentAnswerText = '';
  let currentExplanation = '';

  const finalizeCurrentQuestion = () => {
    if (!currentQText && currentOptions.length === 0) return;

    let confidence: 'high' | 'medium' | 'low' | 'warning' = 'high';
    let warningMessage = '';

    if (!currentQText) {
      confidence = 'warning';
      warningMessage = 'نص السؤال مفقود!';
    } else if (currentOptions.length < 2) {
      confidence = 'warning';
      warningMessage = 'عدد الخيارات أقل من 2!';
    }

    // Determine correct option index by POSITION (Rule 1)
    let correctIndex = -1;

    if (currentAnswerText) {
      const cleanAnswer = currentAnswerText.trim();

      // Check if answer specifies an option label like أ, ب, ج, د or 1, 2, 3, 4
      const symbolMatch = cleanAnswer.match(/^[أبجدوه1234546789]/i) || cleanAnswer.match(/(أ|ب|ج|د|1|2|3|4)/);
      const symbol = symbolMatch ? symbolMatch[0] : '';

      if (symbol === 'أ' || symbol === '1' || cleanAnswer.includes('الأول')) {
        correctIndex = 0;
      } else if (symbol === 'ب' || symbol === '2' || cleanAnswer.includes('الثاني')) {
        correctIndex = 1;
      } else if (symbol === 'ج' || symbol === '3' || cleanAnswer.includes('الثالث')) {
        correctIndex = 2;
      } else if (symbol === 'د' || symbol === '4' || cleanAnswer.includes('الرابع')) {
        correctIndex = 3;
      } else if (symbol === 'هـ' || symbol === 'ه' || symbol === '5' || cleanAnswer.includes('الخامس')) {
        correctIndex = 4;
      } else {
        // Search if cleanAnswer matches exact string of one of the options
        const matchedOptIdx = currentOptions.findIndex(opt =>
          opt.includes(cleanAnswer) || cleanAnswer.includes(opt)
        );
        if (matchedOptIdx !== -1) {
          correctIndex = matchedOptIdx;
        }
      }
    }

    if (correctIndex === -1 || correctIndex >= currentOptions.length) {
      correctIndex = 0; // Default fallback to first option
      confidence = 'warning';
      warningMessage = warningMessage
        ? `${warningMessage} + لم يتم التعرف على الخيار الصحيح بدقة!`
        : 'لم يتم التعرف على الخيار الصحيح بدقة، يرجى تحديده يدوياً!';
    }

    if (!currentExplanation) {
      if (confidence !== 'warning') {
        confidence = 'medium';
      }
    }

    extractedQuestions.push({
      questionText: currentQText,
      options: currentOptions,
      correctOptionIndex: correctIndex,
      explanation: currentExplanation,
      confidence,
      warningMessage: warningMessage || undefined,
    });

    // Reset buffer
    currentQText = '';
    currentOptions = [];
    currentAnswerText = '';
    currentExplanation = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter narrative/meta phrases (Rule 3)
    if (
      line.match(/^(أهلاً بك|بسم الله|نتمنى لك|عزيزي الطالب|ختاماً|تحياتنا|ملاحظة هامة: عزيزي)/i)
    ) {
      ignoredTexts.push(line);
      continue;
    }

    // Section headers
    if (line.match(/^#*\s*(النقاط المفتاحية|نقاط أساسية|الأفكار الرئيسية)/i)) {
      inKeyPointsSection = true;
      inQuestionsSection = false;
      continue;
    }

    if (line.match(/^#*\s*(أسئلة|الأسئلة|أسئلة الفقرة|اختبار|MCQ)/i)) {
      inQuestionsSection = true;
      inKeyPointsSection = false;
      continue;
    }

    // Parsing Key Points
    if (inKeyPointsSection && !inQuestionsSection) {
      if (line.match(/^[•\-\*1234567890١٢٣٤٥٦٧٨٩٠]/)) {
        const cleanKp = line.replace(/^[•\-\*1234567890١٢٣٤٥٦٧٨٩٠\.\)\s]+/, '').trim();
        if (cleanKp) keyPoints.push(cleanKp);
      } else if (line.length > 5 && !line.includes('؟')) {
        keyPoints.push(line);
      }
      continue;
    }

    // Question start detection
    const isQuestionStart =
      line.match(/^(\d+|[١٢٣٤٥٦٧٨٩٠]+)[\.\-\)]\s*/) ||
      line.match(/^(س\d*|سؤال|السؤال)\s*(\d*|[\.\-\)]):?/i) ||
      (line.endsWith('؟') && currentOptions.length > 0) ||
      (line.includes('؟') && !line.startsWith('أ)') && !line.startsWith('ب)') && !line.startsWith('ج)'));

    if (isQuestionStart) {
      // Finalize previous question if exists
      finalizeCurrentQuestion();
      inQuestionsSection = true;

      // Clean question prefix
      let cleanQ = line
        .replace(/^(\d+|[١٢٣٤٥٦٧٨٩٠]+)[\.\-\)]\s*/, '')
        .replace(/^(س\d*|سؤال|السؤال)\s*(\d*|[\.\-\)]):?\s*/i, '')
        .trim();

      currentQText = cleanQ;
      continue;
    }

    // Answer detection line ("الإجابة الصحيحة:" or "الجواب:")
    if (line.match(/^(الإجابة الصحيحة|الإجابة|الجواب الصحيح|الجواب|الخيار الصحيح)\s*:/i)) {
      currentAnswerText = line.replace(/^(الإجابة الصحيحة|الإجابة|الجواب الصحيح|الجواب|الخيار الصحيح)\s*:\s*/i, '').trim();
      continue;
    }

    // Explanation detection line ("التعليل:" or "السبب:")
    if (line.match(/^(التعليل|السبب|التوضيح|الشرح)\s*:/i)) {
      currentExplanation = line.replace(/^(التعليل|السبب|التوضيح|الشرح)\s*:\s*/i, '').trim();
      continue;
    }

    // Option line detection (e.g., أ) الخيار الأول or 1) الخيار)
    const optionMatch = line.match(/^([أبجدوه123456789]|\d+|[١٢٣٤٥٦٧٨٩٠]+)[\)\.\-\s]\s*(.+)/);
    if (optionMatch && (currentQText || inQuestionsSection)) {
      const optionVal = optionMatch[2].trim();
      if (optionVal) {
        currentOptions.push(optionVal);
      }
      continue;
    }

    // If we are currently inside a question and line doesn't match above, append to appropriate field
    if (currentQText && currentOptions.length === 0) {
      currentQText += ' ' + line;
    } else if (currentExplanation) {
      currentExplanation += ' ' + line;
    } else if (currentOptions.length > 0) {
      // Might be continuation of last option or answer
      if (line.startsWith('الإجابة') || line.startsWith('الجواب')) {
        currentAnswerText = line.replace(/.*:\s*/, '').trim();
      } else if (line.startsWith('التعليل')) {
        currentExplanation = line.replace(/.*:\s*/, '').trim();
      } else {
        currentOptions[currentOptions.length - 1] += ' ' + line;
      }
    }
  }

  // Finalize last item
  finalizeCurrentQuestion();

  return {
    questions: extractedQuestions,
    keyPoints,
    ignoredTexts,
  };
}

/**
 * Split key points string line-by-line or bullet-by-bullet
 */
export function parseKeyPointsText(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map(line => line.replace(/^[•\-\*1234567890١٢٣٤٥٦٧٨٩٠\.\)\s]+/, '').trim())
    .filter(Boolean);
}
