import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { 
  askChatbot, 
  getChatHistory, 
  clearChatHistory, 
  getApplications, 
  generateCoverLetter,
  startMockInterview, 
  submitMockInterview 
} from '../services/api';
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Briefcase, 
  Mic, 
  Play, 
  Award, 
  ChevronRight, 
  Loader 
} from "lucide-react";

const JobSeekerGenAI = () => {
  const [activeTool, setActiveTool] = useState("chatbot");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#005193]" /> Applicant AI Studio
        </h2>
        
        <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <ToolButton 
            active={activeTool === "chatbot"} 
            onClick={() => setActiveTool("chatbot")} 
            icon={MessageSquare} 
            label="AI Assistant" 
          />
          <ToolButton 
            active={activeTool === "cover-letter"} 
            onClick={() => setActiveTool("cover-letter")} 
            icon={FileText} 
            label="Cover Letter" 
          />
          <ToolButton 
            active={activeTool === "mock-interview"} 
            onClick={() => setActiveTool("mock-interview")} 
            icon={Mic} 
            label="Mock Interview" 
          />
        </div>
      </div>

      {/* Tool Content Area */}
      <div className="flex-1 bg-white/90 rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
        {activeTool === "chatbot" && <ChatbotTool />}
        {activeTool === "cover-letter" && <CoverLetterTool />}
        {activeTool === "mock-interview" && <MockInterviewTool />}
      </div>
    </div>
  );
};

// Helper Button Component
const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
      active ? "bg-[#005193] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

// --- Sub-Component: Chatbot Tool ---
const ChatbotTool = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Use a ref for the container instead of a dummy element at the bottom
  const chatContainerRef = useRef(null);

  const suggestions = [
    "Check status for my applications",
    "What is the estimated salary for the Data Scientist role?",
    "Do I have any upcoming interviews? Where can I find them?",
    "Can I update my resume?",
    "Should I apply for the Senior Accountant role?",
  ];

  useEffect(() => {
    loadHistory();
  }, []);

  // Smart Scroll Logic
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const { scrollHeight, clientHeight } = container;
      // Only scroll if there is actual overflow (scrollbar exists)
      if (scrollHeight > clientHeight) {
        container.scrollTo({
          top: scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, loading]); 

  const loadHistory = async () => {
    try {
      const history = await getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([{ sender: "bot", text: "Hello! I am your HireHero AI Assistant. How may I assist you?" }]);
      }
    } catch (err) {
      setMessages([{ sender: "bot", text: "Hello! I am your HireHero AI Assistant. How may I assist you?" }]);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    const userMsg = { sender: "user", text: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askChatbot(text);
      const botReply = res.reply || "Sorry, I couldn't understand that.";
      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "Error connecting to chatbot." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleClearChat = async () => {
    if(!confirm("Are you sure you want to clear your chat history?")) return;
    try {
      await clearChatHistory();
      setMessages([{ sender: "bot", text: "New chat started! How may I assist you today?" }]);
    } catch (err) {
      alert("Failed to clear history");
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-gray-200 bg-gray-50/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Suggestions</h3>
          <button className="flex items-center gap-1 text-[#005193] text-xs font-semibold hover:underline" onClick={handleClearChat}>
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 hover:border-[#005193] hover:text-[#005193] transition duration-200 shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.sender === "user" ? "bg-gray-200" : "bg-blue-100"}`}>
                  {msg.sender === "bot" ? <Bot className="w-5 h-5 text-[#005193]" /> : <User className="w-5 h-5 text-gray-600" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.sender === "user" ? "bg-[#005193] text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"}`}>
                  {msg.sender === "bot" ? (
                    <ReactMarkdown
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="flex items-start gap-3 max-w-[80%]">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-[#005193]" />
                 </div>
                 <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none text-gray-500 text-sm italic">
                    AI is typing...
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#005193] transition-all"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#005193] text-white rounded-lg hover:bg-[#013362] disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: Cover Letter Generator Tool ---
const CoverLetterTool = () => {
  const [applications, setApplications] = useState([]); // Renamed from jobs
  const [selectedJob, setSelectedJob] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await getApplications(); // Fetch user's applications
        setApplications(res || []);
      } catch (err) {
        console.error("Failed to fetch applications");
      }
    }
    fetchApps();
  }, []);

  const handleGenerate = async () => {
    if (!selectedJob) {
      alert("Please select a job first.");
      return;
    }
    setLoading(true);
    setGeneratedDraft("");
    try {
      const res = await generateCoverLetter({
        job_id: selectedJob,
        user_notes: userNotes
      });
      setGeneratedDraft(res.generated_draft);
    } catch (err) {
      setGeneratedDraft("Error generating cover letter. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 h-full">
      {/* Input Section */}
      <div className="p-8 border-r border-gray-200 overflow-y-auto bg-gray-50/30">
        <h3 className="text-lg font-bold text-[#013362] mb-1">Generate Cover Letter</h3>
        <p className="text-sm text-gray-500 mb-6">Select a job you have applied to and add your personal notes to generate a tailored cover letter.</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Target Job</label>
            <div className="relative">
              <select 
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005193] bg-white pr-10"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
              >
                <option value="">-- Choose a job --</option>
                {applications.map(app => (
                  <option key={app.id} value={app.job_id}>
                    {app.title} at {app.company}
                  </option>
                ))}
              </select>
              <Briefcase className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Notes (Optional)</label>
            <textarea 
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005193] h-40 resize-none"
              placeholder="e.g. Emphasize my 5 years of experience with Python and my leadership in the last project..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#005193] hover:bg-[#013362] text-white py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating Draft...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate Cover Letter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="p-8 bg-white overflow-y-auto relative">
        {generatedDraft ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Generated Draft</h3>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#005193] transition"
              >
                {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copySuccess ? "Copied!" : "Copy Text"}
              </button>
            </div>
            <textarea 
              className="w-full h-[calc(100%-3rem)] p-6 bg-gray-50 border border-gray-200 rounded-xl text-sm leading-relaxed text-gray-800 focus:outline-none focus:border-blue-300 resize-none font-serif"
              value={generatedDraft}
              readOnly
            />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium">Your cover letter will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Mock Interview Tool ---
const MockInterviewTool = () => {
  const [stage, setStage] = useState('setup'); // setup, active, processing, results
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Interview State
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState([]); // Array of { question, answer }
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await getApplications();
        setApplications(res || []);
      } catch (err) { console.error(err); }
    }
    fetchApps();
  }, []);

  const handleStart = async () => {
    if (!selectedJob) return alert("Select a job first");
    setLoading(true);
    try {
      const res = await startMockInterview(selectedJob);
      setQuestions(res.questions);
      setStage('active');
      setCurrentQIndex(0);
      setAnswers([]);
      setCurrentAnswer("");
    } catch (err) { alert("Failed to start interview"); }
    setLoading(false);
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) return alert("Please type an answer.");
    
    const newAnswers = [...answers, { 
        question: questions[currentQIndex], 
        answer: currentAnswer 
    }];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
    } else {
        // Finished last question
        submitInterview(newAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
      setStage('processing');
      try {
          const result = await submitMockInterview({
              job_id: selectedJob,
              answers: finalAnswers
          });
          setReport(result);
          setStage('results');
      } catch (err) {
          alert("Error grading interview.");
          setStage('setup');
      }
  };

  const handleRetake = () => {
      setStage('setup');
      setReport(null);
      setAnswers([]);
  };

  // --- RENDERERS ---

  if (stage === 'setup') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-blue-50 text-[#005193] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#013362] mb-2">AI Mock Interview</h3>
                  <p className="text-sm text-gray-500 mb-6">
                      Select a job you've applied for. The AI will generate 5 relevant questions and grade your answers.
                  </p>
                  
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-[#005193] outline-none"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                  >
                    <option value="">-- Select Target Job --</option>
                    {applications.map(app => (
                        <option key={app.id} value={app.job_id}>{app.title} at {app.company}</option>
                    ))}
                  </select>

                  <button 
                    onClick={handleStart} 
                    disabled={loading}
                    className="w-full bg-[#005193] text-white py-3 rounded-xl font-bold shadow hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Start Session
                  </button>
              </div>
          </div>
      );
  }

  if (stage === 'active') {
      const progress = ((currentQIndex + 1) / questions.length) * 100;
      return (
          <div className="h-full flex flex-col max-w-3xl mx-auto p-8">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
                  <div className="bg-[#005193] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-gray-500 text-sm uppercase font-bold mb-2">Question {currentQIndex + 1} of {questions.length}</h4>
                  <h2 className="text-2xl font-bold text-[#013362] mb-6 leading-relaxed">
                      {questions[currentQIndex]}
                  </h2>
                  
                  <textarea 
                      className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005193] outline-none resize-none text-gray-700 leading-relaxed"
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      autoFocus
                  />
              </div>

              <div className="mt-8 flex justify-end">
                  <button 
                      onClick={handleNextQuestion}
                      className="bg-[#005193] text-white px-8 py-3 rounded-xl font-bold shadow hover:opacity-90 transition flex items-center gap-2"
                  >
                      {currentQIndex === questions.length - 1 ? "Submit Interview" : "Next Question"}
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>
      );
  }

  if (stage === 'processing') {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center">
              <Loader className="w-12 h-12 text-[#005193] animate-spin mb-4" />
              <h3 className="text-xl font-bold text-gray-800">Grading your interview...</h3>
              <p className="text-gray-500 mt-2">Analyzing your answers against the Job Description.</p>
          </div>
      );
  }

  if (stage === 'results' && report) {
      return (
          <div className="h-full overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                  {/* Header Score */}
                  <div className="bg-[#005193] text-white rounded-2xl p-8 mb-8 flex items-center justify-between shadow-lg">
                      <div>
                          <h2 className="text-3xl font-bold mb-2">Interview Report</h2>
                          <p className="opacity-90 max-w-xl">{report.overall_feedback}</p>
                      </div>
                      <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                          <div className="text-4xl font-extrabold">{report.overall_score}/10</div>
                          <div className="text-xs uppercase font-bold opacity-80 mt-1">Overall Score</div>
                      </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-6">
                      {report.question_evaluations.map((evalItem, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-bold text-gray-800 text-lg w-3/4">Q{idx+1}: {evalItem.question}</h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      evalItem.rating >= 8 ? 'bg-green-100 text-green-700' :
                                      evalItem.rating >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      Rating: {evalItem.rating}/10
                                  </span>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Your Answer</p>
                                  <p className="text-sm text-gray-700 italic">"{answers[idx]?.answer}"</p>
                              </div>

                              <div>
                                  <p className="text-xs text-[#005193] uppercase font-bold mb-1 flex items-center gap-1">
                                      <Award className="w-3 h-3" /> AI Feedback
                                  </p>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                      {evalItem.feedback}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-8 text-center pb-8">
                      <button 
                          onClick={handleRetake}
                          className="text-[#005193] font-bold hover:underline"
                      >
                          Start New Session
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return null;
};

export default JobSeekerGenAI;