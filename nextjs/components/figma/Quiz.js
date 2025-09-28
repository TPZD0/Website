import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

import { Upload, FileText, RotateCcw, ChevronLeft, ChevronRight, Clock, Trash2, Edit2, Plus, ArrowLeft, Trophy } from 'lucide-react';
// Converted from TSX to JS: removed type definitions
import { extractTextFromPDF } from '@/utils/pdfUtils';
import { generateQuizFromContent } from '@/utils/quizGenerator';

export function Quiz({ quizHistory, addQuizSet, deleteQuizSet, renameQuizSet, setCurrentPage, navigateToQuiz, reloadHistory }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);


  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const generateQuiz = async () => {
    if (!uploadedFile) return;
    
    setIsGenerating(true);
    
    try {
      // First, upload the file to the backend
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('name', uploadedFile.name);
      const userId = localStorage.getItem('userId') || '1';
      formData.append('user_id', userId);

      // Upload file to backend
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.id;

      // Store file ID for later use when saving quiz results
      localStorage.setItem('lastUploadedFileId', fileId.toString());

      // Generate quiz using the uploaded file
      const quizFormData = new FormData();
      quizFormData.append('file_id', fileId.toString());
      quizFormData.append('num_questions', '10');
      quizFormData.append('difficulty', 'medium');

      const quizResponse = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        body: quizFormData
      });

      if (!quizResponse.ok) {
        throw new Error('Failed to generate quiz');
      }

      const quizResult = await quizResponse.json();
      
      // Transform the API response to match the expected format
      const generatedQuestions = quizResult.quiz.questions.map((q, index) => ({
        id: `q-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation
      }));

      setQuizQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowAnswer(false);
      setQuizCompleted(false);
      setScore(0);
      
      // Save to history
      const newQuizSet = {
        title: uploadedFile.name.replace('.pdf', '') + ' Quiz',
        fileName: uploadedFile.name,
        createdAt: new Date().toISOString(),
        flashcards: generatedQuestions.map(q => ({
          id: q.id,
          question: q.question,
          answer: `${q.correctAnswer}. ${q.options[q.correctAnswer]}`
        })),
        quizQuestions: generatedQuestions,
        attempts: [],
        lastResult: undefined
      };
      addQuizSet(newQuizSet);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setIsGenerating(false);
      
      // Show error message
      alert(`Error generating quiz: ${error.message}. Please make sure the backend is running and try again.`);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      // This is the last question, finish the quiz
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
    }
  };

  const selectAnswer = (answer) => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: answer });
    setShowAnswer(true);
  };

  const finishQuiz = async () => {
    // Calculate final score
    let finalScore = 0;
    quizQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setQuizCompleted(true);

    // Save quiz result to database
    try {
      const userId = localStorage.getItem('userId');
      if (userId && uploadedFile) {
        // Find the file ID from the most recent quiz generation
        const fileId = localStorage.getItem('lastUploadedFileId');
        
        if (fileId) {
          const formData = new FormData();
          formData.append('user_id', userId);
          formData.append('file_id', fileId);
          formData.append('quiz_data', JSON.stringify({
            questions: quizQuestions,
            title: uploadedFile.name.replace('.pdf', '') + ' Quiz'
          }));
          formData.append('user_answers', JSON.stringify(selectedAnswers));
          formData.append('score', finalScore.toString());
          formData.append('total_questions', quizQuestions.length.toString());
          formData.append('difficulty', 'medium');
          formData.append('completed', 'true');

          const response = await fetch('/api/ai/save-quiz-session', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            console.log('Quiz result saved to database');
            // Reload history to show the new quiz result
            if (reloadHistory) {
              reloadHistory();
            }
          } else {
            console.error('Failed to save quiz result');
          }
        }
      }
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const resetCards = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const startNewUpload = () => {
    setUploadedFile(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteQuizSet(id);
  };

  const handleEdit = (e, id, currentTitle) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (e, id) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      renameQuizSet(id, editingTitle);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  const openQuizDetail = async (quizSet) => {
    try {
      // If this is a quiz from the database, load the full quiz data
      if (quizSet.sessionId) {
        const response = await fetch(`/api/ai/quiz-session/${quizSet.sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          
          // Load the quiz questions from the database
          const questions = sessionData.quiz_data.questions || [];
          
          if (questions.length > 0) {
            setQuizQuestions(questions);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowAnswer(false);
            setQuizCompleted(false);
            setScore(0);
            setUploadedFile({ name: sessionData.file_name });
            
            // Store the file ID for potential re-saving
            localStorage.setItem('lastUploadedFileId', sessionData.file_id?.toString() || '');
          }
        } else {
          console.error('Failed to load quiz session');
        }
      } else if (quizSet.quizQuestions && quizSet.quizQuestions.length > 0) {
        // For locally generated quizzes
        navigateToQuiz(quizSet.id);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };



  const currentQuestion = quizQuestions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
          <h1>Make Quiz</h1>
        </div>
        <div className="flex items-center space-x-2">
          {quizQuestions.length > 0 && (
            <>
              {!quizCompleted && (
                <Badge variant="outline">
                  {currentQuestionIndex + 1} of {quizQuestions.length}
                </Badge>
              )}
              {quizCompleted && (
                <Badge variant="default">
                  Quiz Complete
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={resetCards}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={startNewUpload}>
                <Plus className="h-4 w-4 mr-2" />
                New Quiz
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div>
        {quizQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-8">
            <div className="space-y-8">
              {/* Upload Section with Dotted Border */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center space-x-3">
                    <Upload className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-medium">Upload PDF</h2>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Upload your study materials and get personalized quiz questions
                  </p>
                  
                  {!uploadedFile ? (
                    <div className="max-w-sm mx-auto">
                      <input
                        type="file"
                        accept=".txt,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="block">
                        <div className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors rounded-lg py-3 px-6 text-center font-medium">
                          Upload New Document
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{uploadedFile.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button 
                          onClick={generateQuiz} 
                          disabled={isGenerating}
                          className="px-8 py-3"
                        >
                          {isGenerating ? 'Generating Quiz...' : 'Generate Quiz Questions'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Quizzes Section */}
              {quizHistory.length > 0 && (
                <div>
                  <h3 className="mb-4">Previous Quizzes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizHistory.map((set) => (
                      <Card 
                        key={set.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => openQuizDetail(set)}
                      >
                        <CardHeader className="pb-2">
                          <div className="space-y-3">
                            <div>
                              {editingId === set.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full px-2 py-1 border rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => handleSaveEdit(e, set.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <CardTitle className="break-words leading-tight">{set.title}</CardTitle>
                              )}
                            </div>
                            {editingId !== set.id && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(e, set.id, set.title);
                                  }}
                                  className="h-8 px-3 text-xs"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Rename
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(e, set.id);
                                  }}
                                  className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{set.fileName}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(set.createdAt)}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                {set.flashcards.length} questions
                              </p>
                              {set.lastResult && (
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Latest: {set.lastResult.score}/{set.lastResult.totalQuestions}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {set.attempts.length} attempts
                                  </span>
                                </div>
                              )}
                              {!set.lastResult && set.attempts.length === 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Not attempted
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        ) : quizCompleted ? (
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {score}/{quizQuestions.length}
                </div>
                <p className="text-lg text-muted-foreground">
                  You got {score} out of {quizQuestions.length} questions correct
                </p>
                <div className="text-2xl">
                  {score === quizQuestions.length ? '🎉 Perfect Score!' : 
                   score >= quizQuestions.length * 0.8 ? '🌟 Great Job!' :
                   score >= quizQuestions.length * 0.6 ? '👍 Good Work!' :
                   '📚 Keep Studying!'}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetCards} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={startNewUpload}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg">{currentQuestion.question}</div>
              
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = selectedAnswer === key;
                  const isCorrect = key === currentQuestion.correctAnswer;
                  const showResult = showAnswer;
                  
                  let buttonVariant = "outline";
                  let className = "";
                  
                  if (showResult) {
                    if (isCorrect) {
                      buttonVariant = "default";
                      className = "bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
                    } else if (isSelected && !isCorrect) {
                      buttonVariant = "destructive";
                    }
                  } else if (isSelected) {
                    buttonVariant = "secondary";
                  }
                  
                  return (
                    <Button
                      key={key}
                      variant={buttonVariant}
                      className={`justify-start h-auto p-4 text-left whitespace-normal ${className}`}
                      onClick={() => !showAnswer && selectAnswer(key)}
                      disabled={showAnswer}
                    >
                      <span className="font-medium mr-3">{key}.</span>
                      <span>{value}</span>
                    </Button>
                  );
                })}
              </div>
              
              {showAnswer && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium text-green-800">
                    Correct Answer: {currentQuestion.correctAnswer}. {currentQuestion.options[currentQuestion.correctAnswer]}
                  </p>
                  {selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer && (
                    <p className="text-red-600 mt-2">
                      You selected: {selectedAnswer}. {currentQuestion.options[selectedAnswer]}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <Button 
                  onClick={nextQuestion}
                  disabled={!showAnswer}
                >
                  {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next'}
                  {currentQuestionIndex < quizQuestions.length - 1 && 
                    <ChevronRight className="h-4 w-4 ml-2" />
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
}
