// Converted from TSX to JS: removed type definitions
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CalendarDays, Target, CheckCircle, Brain, FileText, ArrowRight } from 'lucide-react';

export function Dashboard({ goalStats, setCurrentPage, updateGoalStats }) {
  const { totalGoals, completedGoals, pendingGoals, overdueGoals, completionRate, chartData } = goalStats;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && !goals.find(g => g.dueDate === dueDate)?.completed;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h1>Welcome!</h1>
        <p className="text-muted-foreground">Ready to continue your learning journey?</p>
      </div>

      {/* Goal Completion Chart */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Goal Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-muted-foreground">
                {completionRate}% Complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Goals Section */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Track your progress and stay motivated with your learning objectives.
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-primary">{totalGoals || 0}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-green-600">{completedGoals || 0}</span>
                <span className="text-muted-foreground">Complete</span>
              </div>
              {overdueGoals > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-red-600">{overdueGoals}</span>
                  <span className="text-muted-foreground">Overdue</span>
                </div>
              )}
            </div>
            <Button 
              onClick={() => setCurrentPage('goals')}
              className="w-full"
            >
              Manage Goals
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Summarizer Section */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>AI Summarizer</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Get concise summaries of your documents and texts for quick review.
            </p>
            <div className="text-sm text-muted-foreground">
              Extract key insights from lengthy materials instantly
            </div>
            <Button 
              onClick={() => setCurrentPage('summarizer')}
              className="w-full"
            >
              Summarize Content
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Quiz Section */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Make Quiz</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Upload documents and generate interactive quiz questions for better retention.
            </p>
            <div className="text-sm text-muted-foreground">
              Transform your study materials into effective learning tools
            </div>
            <Button 
              onClick={() => setCurrentPage('quiz')}
              className="w-full"
            >
              Create Quiz
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
