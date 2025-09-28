// Lightweight sample data mirrored from the Figma export

export const initialGoals = [
  { id: '1', name: 'Complete Math Assignment', dueDate: '2025-09-15', completed: false },
  { id: '2', name: 'Study for History Quiz', dueDate: '2025-09-12', completed: true },
  { id: '3', name: 'Finish Science Project', dueDate: '2025-09-20', completed: false },
];

export const sampleQuizHistory = [
  {
    id: 'sample-1',
    title: 'PBL infographic Quiz',
    fileName: 'PBL_infographic.pdf',
    createdAt: '2025-09-12T14:48:00.000Z',
    attempts: [
      {
        score: 8,
        totalQuestions: 10,
        completedAt: '2025-09-12T15:30:00.000Z',
        answers: { '1': 'A', '2': 'B', '3': 'C', '4': 'B', '5': 'B', '6': 'C', '7': 'C', '8': 'B', '9': 'C', '10': 'C' },
      },
    ],
    lastResult: {
      score: 8,
      totalQuestions: 10,
      completedAt: '2025-09-12T15:30:00.000Z',
      answers: { '1': 'A', '2': 'B', '3': 'C', '4': 'B', '5': 'B', '6': 'C', '7': 'C', '8': 'B', '9': 'C', '10': 'C' },
    },
    flashcards: [
      { id: '1', question: 'What does PBL stand for?', answer: 'A. Problem-Based Learning' },
      { id: '2', question: 'Which is a key characteristic of PBL?', answer: 'B. Student-centered approach' },
    ],
    quizQuestions: [
      {
        id: '1',
        question: 'What does PBL stand for?',
        options: {
          A: 'Problem-Based Learning',
          B: 'Project-Based Learning',
          C: 'Process-Based Learning',
          D: 'Performance-Based Learning',
        },
        correctAnswer: 'A',
      },
      {
        id: '2',
        question: 'Which is a key characteristic of PBL?',
        options: {
          A: 'Teacher-centered lectures',
          B: 'Student-centered approach',
          C: 'Memorization focus',
          D: 'Individual work only',
        },
        correctAnswer: 'B',
      },
    ],
  },
  {
    id: 'sample-2',
    title: 'Robotic Arm Project Summary (1) Quiz',
    fileName: 'Robotic_Arm_Project_Summary (1).pdf',
    createdAt: '2025-09-12T14:46:00.000Z',
    attempts: [
      {
        score: 9,
        totalQuestions: 10,
        completedAt: '2025-09-12T14:50:00.000Z',
        answers: { '1': 'B', '2': 'C', '3': 'C', '4': 'C', '5': 'B', '6': 'B', '7': 'C', '8': 'B', '9': 'B', '10': 'B' },
      },
      {
        score: 7,
        totalQuestions: 10,
        completedAt: '2025-09-11T16:20:00.000Z',
        answers: { '1': 'B', '2': 'C', '3': 'C', '4': 'C', '5': 'A', '6': 'B', '7': 'A', '8': 'B', '9': 'B', '10': 'A' },
      },
    ],
    lastResult: {
      score: 9,
      totalQuestions: 10,
      completedAt: '2025-09-12T14:50:00.000Z',
      answers: { '1': 'B', '2': 'C', '3': 'C', '4': 'C', '5': 'B', '6': 'B', '7': 'C', '8': 'B', '9': 'B', '10': 'B' },
    },
    flashcards: [
      { id: '1', question: 'What type of motor is commonly used in robotic arms?', answer: 'B. Servo motor' },
      { id: '2', question: 'Which programming language is often used for robotics?', answer: 'C. Python' },
    ],
  },
];
