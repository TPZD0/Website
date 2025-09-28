import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Upload, FileText, Clock, Trash2, Edit2, Plus, ArrowLeft, BookOpen, Send, MessageCircle } from 'lucide-react';
// Converted from TSX to JS: removed type definitions
// Removed mock utilities - now using real backend API

export function Summarizer({ summaryHistory, addSummary, deleteSummary, renameSummary, setCurrentPage }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [userFiles, setUserFiles] = useState([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    setIsUploading(true);
    setSelectedSummary(null);

    try {
      // Get user data from localStorage
      const userId = localStorage.getItem('userId');

      if (!userId) {
        alert('Please log in to upload files.');
        return;
      }

      // Upload file to backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId.toString());
      formData.append('name', file.name.replace('.pdf', ''));

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      setUploadedFile(file);
      setUploadedFileId(result.id);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const generateSummary = async () => {
    if (!uploadedFileId) {
      alert('Please upload a file first.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call the AI summarization API
      const formData = new FormData();
      formData.append('file_id', uploadedFileId.toString());
      formData.append('max_length', '500');

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate summary');
      }

      const result = await response.json();
      
      // Parse summary into key points (split by newlines or sentences)
      const keyPoints = result.summary
        .split(/\n|\. /)
        .filter(point => point.trim().length > 10)
        .slice(0, 8) // Limit to 8 key points
        .map(point => point.trim().replace(/^\d+\.\s*/, ''));
      
      // Save to history
      addSummary({
        id: `sum-${result.file_id}-${Date.now()}`,
        title: `Summary of ${result.file_name}`,
        fileName: result.file_name,
        createdAt: new Date().toISOString(),
        content: result.summary,
        keyPoints: keyPoints.length > 0 ? keyPoints : ['Summary generated successfully'],
        wordCount: result.summary_word_count || result.summary.split(' ').length,
        fileId: result.file_id
      });
      
      // Reset upload state on success
      setUploadedFile(null);
      setUploadedFileId(null);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      alert(`Failed to generate summary: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const openSummary = (summary) => {
    setSelectedSummary(summary);
    setChatMessages([]);
    setChatInput('');
  };

  const generateChatResponse = async (question, summary) => {
    try {
      // Call the AI chat API
      const formData = new FormData();
      formData.append('file_id', summary.fileId.toString());
      formData.append('question', question);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get AI response');
      }

      const result = await response.json();
      return result.answer;
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      return `I'm sorry, I encountered an error while trying to answer your question. Please try again. Error: ${error.message}`;
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedSummary) return;
    
    const currentQuestion = chatInput;
    const userMessage = {
      id: Date.now().toString(),
      text: currentQuestion,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);
    
    try {
      // Get AI response
      const aiResponseText = await generateChatResponse(currentQuestion, selectedSummary);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in sendChatMessage:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your question. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startNewUpload = () => {
    setSelectedSummary(null);
    setUploadedFile(null);
    setUploadedFileId(null);
    setChatMessages([]);
    setChatInput('');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteSummary(id);
  };

  const handleEdit = (e, id, currentTitle) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (e, id) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      renameSummary(id, editingTitle);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

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
          <h1>AI Summarizer</h1>
        </div>
        <div className="flex items-center space-x-2">
          {selectedSummary && (
            <Button variant="outline" size="sm" onClick={startNewUpload}>
              <Plus className="h-4 w-4 mr-2" />
              New Upload
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div>
        {!selectedSummary ? (
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
                      Upload your study materials and get comprehensive summaries with key points
                    </p>
                    
                    {!uploadedFile ? (
                      <div className="max-w-sm mx-auto">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          disabled={isUploading}
                        />
                        <label htmlFor="file-upload" className="block">
                          <div className={`${isUploading ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/90 cursor-pointer'} text-primary-foreground transition-colors rounded-lg py-3 px-6 text-center font-medium`}>
                            {isUploading ? 'Uploading...' : 'Upload PDF Document'}
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
                            onClick={generateSummary} 
                            disabled={isGenerating || isUploading}
                            className="px-8 py-3"
                          >
                            {isGenerating ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating AI Summary...</span>
                              </div>
                            ) : 'Generate AI Summary'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous Summaries Section */}
                {summaryHistory.length > 0 && (
                  <div>
                    <h3 className="mb-4">Previous Summaries</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summaryHistory.map((summary) => (
                        <Card 
                          key={summary.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openSummary(summary)}
                        >
                          <CardHeader className="pb-2">
                            <div className="space-y-3">
                              <div>
                                {editingId === summary.id ? (
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
                                        onClick={(e) => handleSaveEdit(e, summary.id)}
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
                                  <CardTitle className="break-words leading-tight">{summary.title}</CardTitle>
                                )}
                              </div>
                              {editingId !== summary.id && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(e, summary.id, summary.title);
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
                                      handleDelete(e, summary.id);
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
                                <span>{summary.fileName}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(summary.createdAt)}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {summary.wordCount} words • {summary.keyPoints.length} key points
                                </p>
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{selectedSummary.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-3">Summary</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {selectedSummary.content}
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Ask Questions About This Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Ask me anything about this summary!</p>
                            <p className="text-sm mt-1">Try: "What are the key points?" or "Explain more about..."</p>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  message.isUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-line">{message.text}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        placeholder="Ask a question about the summary..."
                        className="flex-1"
                        disabled={isChatting}
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isChatting}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Key Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <ul className="space-y-3">
                      {selectedSummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                          <span className="text-muted-foreground leading-relaxed text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
