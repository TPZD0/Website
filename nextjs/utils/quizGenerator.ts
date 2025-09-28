import { ExtractedPDFContent, analyzeContentType } from './pdfUtils';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export function generateQuizFromContent(content: ExtractedPDFContent, fileName: string): QuizQuestion[] {
  const contentType = analyzeContentType(content.text, fileName);
  const questions: QuizQuestion[] = [];
  
  // Extract sentences and key information from the content
  const sentences = content.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyTerms = content.keyTerms;
  
  // Generate questions based on content
  let questionCount = 0;
  
  // Generate definition questions from key terms
  for (const term of keyTerms.slice(0, 4)) {
    if (questionCount >= 10) break;
    
    const contextSentences = sentences.filter(s => 
      s.toLowerCase().includes(term.toLowerCase())
    );
    
    if (contextSentences.length > 0) {
      const question = generateDefinitionQuestion(term, contextSentences[0], questionCount + 1);
      if (question) {
        questions.push(question);
        questionCount++;
      }
    }
  }
  
  // Generate comprehension questions from sentences
  const importantSentences = sentences
    .filter(s => s.length > 50 && s.length < 200)
    .slice(0, 6);
    
  for (const sentence of importantSentences) {
    if (questionCount >= 10) break;
    
    const question = generateComprehensionQuestion(sentence, questionCount + 1);
    if (question) {
      questions.push(question);
      questionCount++;
    }
  }
  
  // Fill remaining slots with content-type specific questions
  while (questionCount < 10) {
    const question = generateContentSpecificQuestion(contentType, content.text, questionCount + 1);
    if (question) {
      questions.push(question);
      questionCount++;
    } else {
      break;
    }
  }
  
  return questions;
}

function generateDefinitionQuestion(term: string, context: string, id: number): QuizQuestion | null {
  try {
    // Create a definition question
    const question = `What is ${term}?`;
    
    // Extract a potential correct answer from context
    const contextWords = context.toLowerCase().split(/\s+/);
    const termIndex = contextWords.findIndex(word => word.includes(term.toLowerCase()));
    
    if (termIndex === -1) return null;
    
    // Get surrounding context for the correct answer
    const start = Math.max(0, termIndex - 3);
    const end = Math.min(contextWords.length, termIndex + 8);
    const correctAnswer = contextWords.slice(start, end).join(' ');
    
    // Generate plausible wrong answers
    const wrongAnswers = [
      `A process related to ${term} that occurs in different conditions`,
      `The opposite of ${term} in most scientific contexts`,
      `A theoretical concept that contradicts ${term}`
    ];
    
    // Randomize answer positions
    const answers = [correctAnswer, ...wrongAnswers];
    const shuffled = shuffleArray(answers);
    const correctIndex = shuffled.indexOf(correctAnswer);
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D';
    
    return {
      id: id.toString(),
      question,
      options: {
        A: shuffled[0],
        B: shuffled[1],
        C: shuffled[2],
        D: shuffled[3]
      },
      correctAnswer: correctLetter
    };
  } catch (error) {
    return null;
  }
}

function generateComprehensionQuestion(sentence: string, id: number): QuizQuestion | null {
  try {
    // Extract key information from the sentence
    const words = sentence.split(/\s+/);
    if (words.length < 8) return null;
    
    // Find potential question targets (numbers, names, concepts)
    const numbers = words.filter(word => /\d+/.test(word));
    const capitalizedWords = words.filter(word => /^[A-Z][a-z]+$/.test(word));
    
    let question: string;
    let correctAnswer: string;
    
    if (numbers.length > 0) {
      // Create a number-based question
      const number = numbers[0];
      question = sentence.replace(number, '____') + ' What is the missing number?';
      correctAnswer = number;
    } else if (capitalizedWords.length > 0) {
      // Create a name/concept-based question
      const concept = capitalizedWords[0];
      question = sentence.replace(concept, '____') + ' What is the missing term?';
      correctAnswer = concept;
    } else {
      // Create a general comprehension question
      const keyWord = words.find(word => word.length > 6) || words[Math.floor(words.length / 2)];
      question = `According to the text: "${sentence.substring(0, 100)}..." What is the main concept being discussed?`;
      correctAnswer = keyWord;
    }
    
    // Generate wrong answers
    const wrongAnswers = [
      'Alternative concept A',
      'Alternative concept B', 
      'Alternative concept C'
    ];
    
    const answers = [correctAnswer, ...wrongAnswers];
    const shuffled = shuffleArray(answers);
    const correctIndex = shuffled.indexOf(correctAnswer);
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D';
    
    return {
      id: id.toString(),
      question,
      options: {
        A: shuffled[0],
        B: shuffled[1],
        C: shuffled[2],
        D: shuffled[3]
      },
      correctAnswer: correctLetter
    };
  } catch (error) {
    return null;
  }
}

function generateContentSpecificQuestion(contentType: string, text: string, id: number): QuizQuestion | null {
  const textLower = text.toLowerCase();
  
  if (contentType === 'mathematics') {
    return generateMathQuestion(textLower, id);
  } else if (contentType === 'science') {
    return generateScienceQuestion(textLower, id);
  } else if (contentType === 'history') {
    return generateHistoryQuestion(textLower, id);
  } else {
    return generateGeneralQuestion(textLower, id);
  }
}

function generateMathQuestion(text: string, id: number): QuizQuestion | null {
  const mathQuestions = [
    {
      question: 'Based on the mathematical concepts in the document, which statement is most accurate?',
      options: {
        A: 'Mathematical proofs require empirical evidence',
        B: 'Mathematical theorems are based on logical reasoning',
        C: 'Mathematical formulas are always temporary',
        D: 'Mathematical concepts change frequently'
      },
      correctAnswer: 'B' as const
    }
  ];
  
  const selected = mathQuestions[0];
  return { ...selected, id: id.toString() };
}

function generateScienceQuestion(text: string, id: number): QuizQuestion | null {
  const scienceQuestions = [
    {
      question: 'According to scientific principles mentioned in the document, what is most important?',
      options: {
        A: 'Personal opinions about natural phenomena',
        B: 'Observable evidence and experimentation',
        C: 'Traditional beliefs about nature',
        D: 'Theoretical speculation without testing'
      },
      correctAnswer: 'B' as const
    }
  ];
  
  const selected = scienceQuestions[0];
  return { ...selected, id: id.toString() };
}

function generateHistoryQuestion(text: string, id: number): QuizQuestion | null {
  const historyQuestions = [
    {
      question: 'Based on the historical content in the document, what factor is most significant?',
      options: {
        A: 'Social and economic conditions of the time period',
        B: 'Individual personalities alone',
        C: 'Random chance events',
        D: 'Modern perspectives on past events'
      },
      correctAnswer: 'A' as const
    }
  ];
  
  const selected = historyQuestions[0];
  return { ...selected, id: id.toString() };
}

function generateGeneralQuestion(text: string, id: number): QuizQuestion | null {
  return {
    id: id.toString(),
    question: 'Based on the content of the document, what is the main focus?',
    options: {
      A: 'Providing detailed information on the topic',
      B: 'Entertaining the reader with stories',
      C: 'Selling products or services',
      D: 'Expressing personal opinions only'
    },
    correctAnswer: 'A'
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}