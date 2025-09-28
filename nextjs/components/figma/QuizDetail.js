import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Trophy, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
// Converted from TSX to JS: removed type definitions

export function QuizDetail({ quiz, setCurrentPage, updateQuizResult }) {
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const quizQuestions = quiz.quizQuestions || [];
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) return '🎉';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👍';
    return '📚';
  };

  const startQuiz = () => {
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const selectAnswer = (answer) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: answer });
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
    }
  };

  const finishQuiz = () => {
    let finalScore = 0;
    quizQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setQuizCompleted(true);
    
    // Save the result
    const result = {
      score: finalScore,
      totalQuestions: quizQuestions.length,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers
    };
    updateQuizResult(quiz.id, result);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowAnswer(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const getProgressPercentage = () => {
    const answered = Object.keys(selectedAnswers).length;
    return (answered / quizQuestions.length) * 100;
  };

  if (isQuizActive && !quizCompleted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsQuizActive(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Button>
            <h1>{quiz.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {currentQuestionIndex + 1} of {quizQuestions.length}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Progress: {Object.keys(selectedAnswers).length}/{quizQuestions.length}
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
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
      </div>
    );
  }

  if (isQuizActive && quizCompleted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsQuizActive(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Button>
            <h1>{quiz.title}</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(score, quizQuestions.length)}`}>
                {score}/{quizQuestions.length}
              </div>
              <p className="text-lg text-muted-foreground">
                You got {score} out of {quizQuestions.length} questions correct
              </p>
              <div className="text-2xl">
                {getScoreEmoji(score, quizQuestions.length)} {
                  score === quizQuestions.length ? 'Perfect Score!' : 
                  score >= quizQuestions.length * 0.8 ? 'Great Job!' :
                  score >= quizQuestions.length * 0.6 ? 'Good Work!' :
                  'Keep Studying!'
                }
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={restartQuiz} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => setIsQuizActive(false)}>
                View Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage('flashcards')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Quizzes</span>
          </Button>
          <h1>{quiz.title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{quizQuestions.length} questions</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Quiz Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{quizQuestions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{quiz.attempts.length}</div>
                  <div className="text-sm text-muted-foreground">Total Attempts</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Created: {formatDate(quiz.createdAt)}
                </div>
                <Button onClick={startQuiz} className="px-8">
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Latest Result */}
          {quiz.lastResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Latest Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className={`text-3xl font-bold ${getScoreColor(quiz.lastResult.score, quiz.lastResult.totalQuestions)}`}>
                      {quiz.lastResult.score}/{quiz.lastResult.totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((quiz.lastResult.score / quiz.lastResult.totalQuestions) * 100)}% correct
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">
                      {getScoreEmoji(quiz.lastResult.score, quiz.lastResult.totalQuestions)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(quiz.lastResult.completedAt)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={startQuiz} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quiz History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quiz.attempts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No attempts yet</div>
                  <Button onClick={startQuiz} className="mt-4">
                    Take First Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quiz.attempts.slice(0, 5).map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className={`font-medium ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                          {attempt.score}/{attempt.totalQuestions}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(attempt.completedAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {index === 0 ? 'Latest' : `Attempt ${index + 1}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {quiz.attempts.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{quiz.attempts.length - 5} more attempts
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Quiz Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File Name:</span>
                <span className="font-medium">{quiz.fileName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{quizQuestions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(quiz.createdAt)}</span>
              </div>
              {quiz.lastResult && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Taken:</span>
                  <span className="font-medium">{formatDate(quiz.lastResult.completedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

