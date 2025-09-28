import { useState } from 'react';
// Converted from TSX to JS: removed type definitions
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CalendarDays, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

export function Goals({ goals, addGoal, updateGoal, deleteGoal, setCurrentPage }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Add goal states
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalDueDate, setNewGoalDueDate] = useState('');
  
  // Edit goal states
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalDescription, setEditGoalDescription] = useState('');
  const [editGoalDueDate, setEditGoalDueDate] = useState('');

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoalName && newGoalDueDate) {
      addGoal({
        name: newGoalName,
        description: newGoalDescription.trim() || undefined,
        dueDate: newGoalDueDate,
        completed: false,
      });
      setNewGoalName('');
      setNewGoalDescription('');
      setNewGoalDueDate('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditGoal = (e) => {
    e.preventDefault();
    if (editingGoal && editGoalName && editGoalDueDate) {
      updateGoal(editingGoal.id, {
        name: editGoalName,
        description: editGoalDescription.trim() || undefined,
        dueDate: editGoalDueDate,
      });
      setEditingGoal(null);
      setEditGoalName('');
      setEditGoalDescription('');
      setEditGoalDueDate('');
      setIsEditDialogOpen(false);
    }
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setEditGoalName(goal.name);
    setEditGoalDescription(goal.description || '');
    setEditGoalDueDate(goal.dueDate);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingGoal(null);
    setEditGoalName('');
    setEditGoalDescription('');
    setEditGoalDueDate('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate, completed) => {
    return new Date(dueDate) < new Date() && !completed;
  };

  const completedGoals = goals.filter(goal => goal.completed);
  const pendingGoals = goals.filter(goal => !goal.completed);
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;

  const chartData = [
    { name: 'Completed', value: completedGoals.length, color: '#22c55e' },
    { name: 'Pending', value: pendingGoals.length, color: '#e5e7eb' },
  ];

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
          <h1>Goals</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>
                Create a new goal with a name and due date to track your progress.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Enter goal name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="goalDescription">Description (Optional)</Label>
                <Textarea
                  id="goalDescription"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="Add a description for your goal..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newGoalDueDate}
                  onChange={(e) => setNewGoalDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Goal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your goal details to keep your progress on track.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGoal} className="space-y-4">
            <div>
              <Label htmlFor="editGoalName">Goal Name</Label>
              <Input
                id="editGoalName"
                value={editGoalName}
                onChange={(e) => setEditGoalName(e.target.value)}
                placeholder="Enter goal name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editGoalDescription">Description (Optional)</Label>
              <Textarea
                id="editGoalDescription"
                value={editGoalDescription}
                onChange={(e) => setEditGoalDescription(e.target.value)}
                placeholder="Add a description for your goal..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editDueDate">Due Date</Label>
              <Input
                id="editDueDate"
                type="date"
                value={editGoalDueDate}
                onChange={(e) => setEditGoalDueDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Completion and Goals Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Completion Chart */}
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
                {completionRate.toFixed(1)}% Complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) => 
                          updateGoal(goal.id, { completed: !!checked })
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                          {goal.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Due {formatDate(goal.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={goal.completed ? 'default' : 'secondary'}>
                      {goal.completed ? 'Complete' : 'Pending'}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(goal)}
                        className="hover:bg-accent p-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteGoal(goal.id)}
                        className="text-destructive hover:text-destructive p-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {goals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No goals yet. Create your first goal to get started!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Goals ({pendingGoals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingGoals.map((goal) => (
                <div key={goal.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={(checked) => 
                        updateGoal(goal.id, { completed: !!checked })
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p>{goal.name}</p>
                      {goal.description && (
                        <p className="text-muted-foreground mt-1">{goal.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due {formatDate(goal.dueDate)}
                        </span>
                        {isOverdue(goal.dueDate, goal.completed) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(goal)}
                      className="hover:bg-accent"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingGoals.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No pending goals. Great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Goals ({completedGoals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="flex items-start justify-between p-4 border border-border rounded-lg bg-muted/50">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={(checked) => 
                        updateGoal(goal.id, { completed: !!checked })
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="line-through text-muted-foreground">{goal.name}</p>
                      {goal.description && (
                        <p className="text-muted-foreground mt-1 line-through">{goal.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due {formatDate(goal.dueDate)}
                        </span>
                        <Badge variant="default">Complete</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(goal)}
                      className="hover:bg-accent"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {completedGoals.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No completed goals yet. Keep working towards your goals!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
