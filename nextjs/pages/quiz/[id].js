import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { QuizDetail } from '@/components/figma/QuizDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Settings, ArrowLeft } from 'lucide-react';

export default function QuizDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [quizSettings, setQuizSettings] = useState({
    num_questions: 5,
    difficulty: 'medium'
  });

  // Load available files for quiz generation
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const userId = localStorage.getItem('userId') || '1'; // Default to user 1
        const response = await fetch(`/api/ai/files-for-quiz/${userId}`);
        if (response.ok) {
          const filesData = await response.json();
          setFiles(filesData);
        }
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };
    loadFiles();
  }, []);

  // Generate quiz from selected file
  const generateQuiz = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file_id', selectedFile.id.toString());
      formData.append('num_questions', quizSettings.num_questions.toString());
      formData.append('difficulty', quizSettings.difficulty);

      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform the API response to match the expected quiz format
      const transformedQuiz = {
        id: `quiz-${selectedFile.id}-${Date.now()}`,
        title: `Quiz: ${result.file_name}`,
        fileName: result.file_name,
        createdAt: new Date().toISOString(),
        quizQuestions: result.quiz.questions.map((q, index) => ({
          id: `q-${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation
        })),
        attempts: [],
        lastResult: null
      };
      
      setQuiz(transformedQuiz);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuizResult = async (quizId, result) => {
    try {
      const userId = localStorage.getItem('userId') || '1';
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('file_id', selectedFile.id.toString());
      formData.append('quiz_data', JSON.stringify(quiz));
      formData.append('user_answers', JSON.stringify(result.answers));
      formData.append('score', result.score.toString());
      formData.append('total_questions', result.totalQuestions.toString());
      formData.append('difficulty', quizSettings.difficulty);
      formData.append('completed', 'true');

      await fetch('/api/ai/save-quiz-session', {
        method: 'POST',
        body: formData
      });
      
      console.log('Quiz result saved:', result);
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const setCurrentPage = (page) => router.push('/quiz');

  // If quiz is already generated, show the quiz interface
  if (quiz) {
    return (
      <div className="min-h-screen bg-background text-foreground px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <QuizDetail 
            quiz={quiz} 
            setCurrentPage={setCurrentPage} 
            updateQuizResult={updateQuizResult} 
          />
        </div>
      </div>
    );
  }

  // Show quiz generation interface
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/quiz')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Quizzes</span>
          </Button>
          <h1 className="text-2xl font-bold">Generate Quiz</h1>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Select PDF File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.length === 0 ? (
              <p className="text-muted-foreground">No PDF files available. Please upload some files first.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFile?.id === file.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedFile?.id === file.id && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Quiz Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <select
                value={quizSettings.num_questions}
                onChange={(e) => setQuizSettings({...quizSettings, num_questions: parseInt(e.target.value)})}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <select
                value={quizSettings.difficulty}
                onChange={(e) => setQuizSettings({...quizSettings, difficulty: e.target.value})}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={generateQuiz}
              disabled={!selectedFile || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                'Generate Quiz'
              )}
            </Button>
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This will create a {quizSettings.num_questions}-question {quizSettings.difficulty} quiz from "{selectedFile.name}"
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
