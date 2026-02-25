import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { useNavigate } from "react-router-dom";
import { askChatbot, getChatHistory, clearChatHistory, getCurrentUser, getDepartments, getMyJobs, getCompanyApplications, axiosAuth } from "../services/api";
import { Send, Plus, Bot, BarChart2, FileText, Sparkles, MessageSquare, ClipboardList, PenTool, AlertCircle, CheckCircle, Users, Briefcase, Trash2 } from "lucide-react";
import SidebarHR from "../components/SidebarHR";
import TopNavbarHR from "../components/TopNavbarHR";

// Defined locally to match other pages
const tabConfig = [
  { tab: "dashboard", icon: BarChart2 },
  { tab: "employees", icon: Users },
  { tab: "recruitment", icon: Briefcase },
  { tab: "performance", icon: FileText },
  { tab: "analytics", icon: BarChart2 },
];

const HRGenAI = ({ onNewChat }) => {
  const [activeTab, setActiveTab] = useState("genai"); // Keeps 'genai' active to show we aren't on a main tab
  const [activeTool, setActiveTool] = useState("chatbot");
  const navigate = useNavigate();

  // UPDATED: Navigation logic
  const handleTabClick = (tab) => {
    navigate("/dashboard-hr", { state: { activeTab: tab } });
  };

  return (
    <section className="min-h-screen flex bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] font-inter">
      <SidebarHR />
      <main className="flex-1 flex flex-col">
        <TopNavbarHR 
            activeTab={activeTab} 
            setActiveTab={handleTabClick} 
            tabConfig={tabConfig} 
        />

        {/* GenAI Section - Always rendered since other tabs navigate away */}
        <div className="p-8 flex flex-col gap-6 h-full">
        <h2 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#005193]" /> HR GenAI Studio
        </h2>

        {/* Tools Navigation */}
        <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
            <ToolButton active={activeTool === "chatbot"} onClick={() => setActiveTool("chatbot")} icon={MessageSquare} label="AI Chatbot" />
            <ToolButton active={activeTool === "jd-gen"} onClick={() => setActiveTool("jd-gen")} icon={FileText} label="JD Generator" />
            <ToolButton active={activeTool === "interview-guide"} onClick={() => setActiveTool("interview-guide")} icon={ClipboardList} label="Interview Guide" />
            <ToolButton active={activeTool === "feedback-sum"} onClick={() => setActiveTool("feedback-sum")} icon={PenTool} label="Feedback Summarizer" />
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-auto">
            {activeTool === "chatbot" && <ChatbotTool onNewChat={onNewChat} />}
            {activeTool === "jd-gen" && <JDGeneratorTool />}
            {activeTool === "interview-guide" && <InterviewGuideTool />}
            {activeTool === "feedback-sum" && <FeedbackSummarizerTool />}
        </div>
        </div>
      </main>
    </section>
  );
};

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

// --- Sub-Tools ---

const ChatbotTool = ({ onNewChat }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [botThinking, setBotThinking] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, botThinking]);

    const loadHistory = async () => {
        try {
            const history = await getChatHistory();
            if (history && history.length > 0) {
                setMessages(history);
            } else {
                setMessages([{ sender: "bot", text: "Hello! I am your HireHero AI Assistant. How may I assist you?" }]);
            }
        } catch (err) {
            console.error("Failed to load chat history");
            setMessages([{ sender: "bot", text: "Hello! I am your HireHero AI Assistant. How may I assist you?" }]);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setBotThinking(true);
        try {
            const data = await askChatbot(input);
            setBotThinking(false);
            const aiResponse = { sender: "bot", text: data.reply || "No response." };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (err) {
            setBotThinking(false);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Sorry, I encountered an error. Please try again." }
            ]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    const startNewChat = async () => {
        if (!confirm("Are you sure you want to clear your chat history?")) return;
        try {
            await clearChatHistory();
            setMessages([{ sender: "bot", text: "New chat started! How may I assist you today?" }]);
            if (onNewChat) onNewChat();
        } catch (err) {
            alert("Failed to clear history");
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[600px]">
            <div className="flex justify-end mb-4">
                <button onClick={startNewChat} className="text-sm text-[#005193] font-semibold flex items-center gap-1 hover:underline">
                    <Plus className="h-4 w-4" /> New Session
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === "user" ? "bg-[#005193] text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}`}>
                            {msg.sender === "bot" ? (
                                <div className="flex gap-2">
                                    <Bot className="w-4 h-4 mt-0.5 text-[#005193] shrink-0" />
                                    <div className="flex-1">
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
                                    </div>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {botThinking && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-2 rounded-full animate-pulse">AI is thinking...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                />
                <button onClick={handleSend} disabled={botThinking} className="bg-[#005193] text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                    <Send className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const JDGeneratorTool = () => {
    const [formData, setFormData] = useState({
        title: "", 
        company_name: "", 
        department: "",
        requiredSkills: [], 
        skillInput: "",      
        experience_level: "", 
        education: "",       
    });
    const [departments, setDepartments] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // NEW: State for Status Pill
    const [status, setStatus] = useState({ message: "", type: "" }); 

    // Constants for Selects
    const experienceOptions = ["Junior", "Mid", "Senior", "Lead"];
    const educationOptions = ["Bachelor’s", "Master’s", "PhD"];

    // Get User ID for Cache Key
    const userId = localStorage.getItem("user_id");
    const cacheKey = `hr_jd_generator_${userId || 'guest'}`;

    // NEW: Pill Function
    const showPill = (message, type) => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: "", type: "" }), 3000);
    };

    useEffect(() => {
        async function initData() {
            // ... (rest of useEffect content is unchanged)
            try {
                // Restore from Cache (Scoped to User)
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { result: savedResult, formData: savedForm } = JSON.parse(cached);
                    setResult(savedResult);
                    setFormData(prev => ({ 
                        ...prev, 
                        ...savedForm,
                        requiredSkills: savedForm.requiredSkills || [],
                        skillInput: savedForm.skillInput || "",
                        experience_level: savedForm.experience_level || "",
                        education: savedForm.education || ""
                    }));
                }

                // Fetch real data
                const [user, depts] = await Promise.all([
                    getCurrentUser(),
                    getDepartments()
                ]);
                
                setDepartments(depts || []);
                
                // Ensure company name is always up to date
                setFormData(prev => ({
                    ...prev,
                    company_name: user.company_name || ""
                }));
            } catch (err) {
                console.error("Failed to load user info or departments", err);
            }
        }
        initData();
    }, [cacheKey]);

    // Skill Tag Handlers (unchanged)
    const handleSkillInputChange = (e) => {
        setFormData((prev) => ({ ...prev, skillInput: e.target.value }));
    };

    const handleSkillInputKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && formData.skillInput.trim()) {
          e.preventDefault();
          const newSkill = formData.skillInput.trim();
          if (!formData.requiredSkills.includes(newSkill)) {
            setFormData((prev) => ({
              ...prev,
              requiredSkills: [...prev.requiredSkills, newSkill],
              skillInput: ""
            }));
          } else {
            setFormData((prev) => ({ ...prev, skillInput: "" }));
          }
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData((prev) => ({
          ...prev,
          requiredSkills: prev.requiredSkills.filter((s) => s !== skill)
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // UPDATED VALIDATION: Use showPill for error message
        if (!formData.title || !formData.department || !formData.experience_level) {
            showPill("Please fill in Job Title, Department, and Experience Level.", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                company_name: formData.company_name,
                department: formData.department,
                skills: formData.requiredSkills, 
                experience: formData.experience_level, 
                education: formData.education 
            };

            const res = await axiosAuth.post('/gen-ai/generate-jd', payload);
            setResult(res.data);
            
            // Show success pill
            showPill("Job Description generated successfully!", "success");

            // Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                result: res.data,
                formData: formData
            }));
        } catch (err) {
            showPill("Error generating JD. Please try again.", "error");
        }
        setLoading(false);
    };

    const clearCache = () => {
        setResult(null);
        setFormData(prev => ({ 
            ...prev, 
            title: "", 
            department: "",
            requiredSkills: [], 
            skillInput: "", 
            experience_level: "", 
            education: "" 
        }));
        localStorage.removeItem(cacheKey);
    };

    return (
        <div className="relative"> {/* Added relative for the pill positioning */}
            
            {/* NEW: Status Pill Display */}
            {status.message && (
                <div className="fixed top-24 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className={`px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce pointer-events-auto ${
                        status.type === 'success' 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {status.message}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 h-full">
                <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Generate Job Description</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Job Title - REQUIRED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                            <input 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none" 
                                name="title"
                                value={formData.title} 
                                onChange={handleFormChange} 
                                required 
                                placeholder="e.g. Senior Frontend Engineer"
                            />
                        </div>
                        
                        {/* Company Name (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed text-gray-500" 
                                value={formData.company_name} 
                                readOnly
                                disabled
                            />
                        </div>

                        {/* Department - REQUIRED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                name="department"
                                value={formData.department}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Select Department...</option>
                                {departments.map((dept, i) => (
                                    <option key={i} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* Experience Level - REQUIRED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                name="experience_level"
                                value={formData.experience_level}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Select Level...</option>
                                {experienceOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Education - OPTIONAL (Removed '*') */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                name="education"
                                value={formData.education}
                                onChange={handleFormChange}
                            >
                                <option value="">Select Education...</option>
                                {educationOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Required Skills - OPTIONAL */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                            <div className="flex flex-wrap gap-2 mb-2 min-h-[30px] border border-gray-300 rounded-lg p-2 bg-white">
                                {formData.requiredSkills.map((skill, idx) => (
                                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                                        {skill}
                                        <button type="button" className="ml-1 text-red-500 hover:text-red-700 font-bold leading-none" onClick={() => handleRemoveSkill(skill)}>&times;</button>
                                    </span>
                                ))}
                                {formData.requiredSkills.length === 0 && <span className="text-gray-400 text-xs italic">Optional. Enter skills to include in the JD.</span>}
                            </div>
                            <input
                              type="text"
                              name="skillInput"
                              value={formData.skillInput}
                              onChange={handleSkillInputChange}
                              onKeyDown={handleSkillInputKeyDown}
                              placeholder="Type a skill and press Enter or comma"
                              className="p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#005193] outline-none text-sm"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" disabled={loading || !formData.company_name} className="flex-1 bg-[#005193] text-white py-2 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition">
                                {loading ? "Generating..." : "Generate JD"}
                            </button>
                            {result && (
                                <button type="button" onClick={clearCache} className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Clear Result">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                
                {/* Result Display remains the same */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[600px]">
                    {result ? (
                        <div className="prose text-sm text-gray-800">
                            <h4 className="font-bold text-lg mb-2">Generated Job Description:</h4>
                            <div className="whitespace-pre-wrap">{result.generated_description}</div>
                            {result.generated_responsibilities && (
                                <>
                                    <h5 className="font-bold mt-4">Responsibilities:</h5>
                                    <ul className="list-disc pl-5">
                                        {result.generated_responsibilities?.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </>
                            )}
                            {result.generated_qualifications && (
                                <>
                                    <h5 className="font-bold mt-4">Qualifications:</h5>
                                    <ul className="list-disc pl-5">
                                        {result.generated_qualifications?.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center mt-20 flex flex-col items-center">
                            <FileText className="h-12 w-12 mb-2 opacity-20" />
                            Enter details to generate a JD
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InterviewGuideTool = () => {
    const [jdText, setJdText] = useState("");
    const [jobs, setJobs] = useState([]); // NEW: State for HR's posted jobs
    const [selectedJobId, setSelectedJobId] = useState(""); // NEW: State for selected job
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [status, setStatus] = useState({ message: "", type: "" }); 

    // Get User ID for Cache Key
    const userId = localStorage.getItem("user_id");
    const cacheKey = `hr_interview_guide_${userId || 'guest'}`;

    const showPill = (message, type) => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: "", type: "" }), 3000);
    };

    useEffect(() => {
        // Load cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { result: savedResult, jdText: savedText } = JSON.parse(cached);
            setResult(savedResult);
            setJdText(savedText);
        }
        
        // NEW: Fetch HR's jobs
        async function fetchJobs() {
            try {
                // getMyJobs fetches jobs posted by the current HR user
                const jobList = await getMyJobs();
                if (Array.isArray(jobList)) {
                    setJobs(jobList);
                }
            } catch (err) {
                console.error("Failed to fetch jobs:", err);
            }
        }
        fetchJobs();
    }, [cacheKey]);

    // NEW: Handler for Job Selection
    const handleJobSelect = (e) => {
        const jobId = e.target.value;
        setSelectedJobId(jobId);

        if (jobId) {
            // Ensure ID is parsed to match the original job object type
            const job = jobs.find(j => j.id === parseInt(jobId)); 
            if (job) {
                setJdText(job.description);
                showPill(`Job description for ${job.title} loaded.`, "success");
            }
        } else {
            setJdText("");
        }
    };
    
    // Handler for manual text input (only if no job is selected)
    const handleTextareaChange = (e) => {
        if (!selectedJobId) {
            setJdText(e.target.value);
        }
    };

    const handleSubmit = async () => {
        if (!jdText) {
            showPill("Please select a job or paste a Job Description.", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await axiosAuth.post('/gen-ai/generate-interview-guide', { job_description: jdText });
            setResult(res.data);
            
            showPill("Interview guide generated successfully!", "success");

            // Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                result: res.data,
                jdText: jdText 
            }));
        } catch (err) { 
            showPill("Error generating guide. Please try again.", "error");
        }
        setLoading(false);
    };

    const clearCache = () => {
        setResult(null);
        setJdText("");
        setSelectedJobId("");
        localStorage.removeItem(cacheKey);
        showPill("Session cleared.", "success");
    };

    return (
        <div className="relative">
            {/* Status Pill (REUSED centered logic) */}
            {status.message && (
                <div className="fixed top-24 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className={`px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce pointer-events-auto ${
                        status.type === 'success' 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {status.message}
                    </div>
                </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 h-full">
                <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Generate Interview Guide</h3>
                    <p className="text-xs text-gray-500 mb-4">Select an active job posting or paste a Job Description below to get tailored questions.</p>
                    
                    {/* NEW: Job Selection Dropdown */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Job Posting</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                            value={selectedJobId}
                            onChange={handleJobSelect}
                        >
                            <option value="">-- Select one of your active jobs --</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        className={`w-full border border-gray-300 rounded-lg p-3 h-64 focus:ring-2 focus:ring-[#005193] outline-none ${selectedJobId ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                        placeholder="Paste Job Description here..."
                        value={jdText}
                        onChange={handleTextareaChange}
                        disabled={!!selectedJobId} // Disable if a job is selected
                    ></textarea>
                    
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#005193] text-white py-2 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition">
                            {loading ? "Generating..." : "Generate Guide"}
                        </button>
                        {result && (
                            <button onClick={clearCache} className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Clear">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Result Display is unchanged */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[600px]">
                    {result ? (
                        <div className="space-y-4 text-sm text-gray-800">
                            <h4 className="font-bold text-lg border-b pb-2">Interview Guide: {result.job_title}</h4>
                            <div>
                                <h5 className="font-bold text-[#005193]">Behavioral Questions</h5>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {(result.behavioral_questions || []).map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-[#005193]">Technical Questions</h5>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {(result.technical_questions || []).map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-[#005193]">Scoring Rubric</h5>
                                <p className="whitespace-pre-wrap">{result.scoring_rubric}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center mt-20 flex flex-col items-center">
                            <ClipboardList className="h-12 w-12 mb-2 opacity-20" />
                            Select a job or paste JD to generate guide
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FeedbackSummarizerTool = () => {
    const [notes, setNotes] = useState("");
    const [applications, setApplications] = useState([]); 
    const [selectedAppId, setSelectedAppId] = useState(""); 
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [status, setStatus] = useState({ message: "", type: "" }); 

    // Get User ID for Cache Key
    const userId = localStorage.getItem("user_id");
    const cacheKey = `hr_feedback_summary_${userId || 'guest'}`;

    const showPill = (message, type) => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: "", type: "" }), 3000);
    };

    useEffect(() => {
        // Load cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { result: savedResult, notes: savedNotes } = JSON.parse(cached);
                setResult(savedResult);
                setNotes(savedNotes);
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        async function fetchApps() {
            try {
                const apps = await getCompanyApplications();
                if (Array.isArray(apps)) {
                    // Filter: Only show candidates relevant for feedback
                    const relevantApps = apps.filter(app => 
                        app.status === 'interviewing' || app.status === 'under_review'
                    );
                    setApplications(relevantApps);
                }
            } catch (err) {
                console.error("Failed to fetch applications", err);
            }
        }
        fetchApps();
    }, [cacheKey]);

    const handleSubmit = async () => {
        if (!notes) {
            showPill("Please enter interview notes.", "error");
            return;
        }
        setLoading(true);
        // Clear previous result to avoid showing stale data if error occurs
        setResult(null); 
        
        // Find selected application details
        const selectedApp = applications.find(app => app.id === parseInt(selectedAppId));

        try {
            const payload = { 
                raw_feedback_notes: notes,
                candidate_name: selectedApp ? selectedApp.candidate_name : "The Candidate",
                job_description: selectedApp ? selectedApp.job_description : ""
            };

            const res = await axiosAuth.post('/gen-ai/summarize-feedback', payload);
            
            // Validate response structure before setting state
            if (res.data && (res.data.recommendation || res.data.summary)) {
                setResult(res.data);
                showPill("Feedback summarized!", "success");
                
                // Save to Cache
                localStorage.setItem(cacheKey, JSON.stringify({
                    result: res.data,
                    notes: notes
                }));
            } else {
                throw new Error("Invalid response format");
            }

        } catch (err) { 
            console.error(err);
            showPill("Error generating summary. Rate limit may be exceeded.", "error");
            // Optional: Set an error state object to display in the UI
            setResult({ error: "Unable to generate summary. Please try again later." });
        }
        setLoading(false);
    };

    const clearCache = () => {
        setResult(null);
        setNotes("");
        setSelectedAppId("");
        localStorage.removeItem(cacheKey);
        showPill("Cleared.", "success");
    };

    return (
        <div className="relative">
            {/* Status Pill */}
            {status.message && (
                <div className="fixed top-24 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className={`px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce pointer-events-auto ${
                        status.type === 'success' 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {status.message}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 h-full">
                <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Summarize Interview Feedback</h3>
                    
                    {/* Application Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Candidate (Optional)</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#005193] outline-none"
                            value={selectedAppId}
                            onChange={(e) => setSelectedAppId(e.target.value)}
                        >
                            <option value="">-- No specific candidate --</option>
                            {applications.length > 0 ? (
                                applications.map(app => (
                                    <option key={app.id} value={app.id}>
                                        {app.candidate_name} — {app.job_title} ({app.status.replace('_', ' ')})
                                    </option>
                                ))
                            ) : (
                                <option disabled>No candidates in Interview/Review stage</option>
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Only showing candidates currently in <strong>Interviewing</strong> or <strong>Under Review</strong> stages.
                        </p>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">Paste raw interview notes from multiple interviewers.</p>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 h-64 focus:ring-2 focus:ring-[#005193] outline-none"
                        placeholder="Interviewer 1: Good technical skills... Interviewer 2: Communication was weak..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#005193] text-white py-2 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition">
                            {loading ? "Summarizing..." : "Summarize Feedback"}
                        </button>
                        {result && (
                            <button onClick={clearCache} className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Clear">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[600px]">
                    {result ? (
                        result.error ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <div className="bg-red-100 p-3 rounded-full mb-3">
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                </div>
                                <p className="font-semibold text-gray-700">Generation Failed</p>
                                <p className="text-sm mt-1">{result.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 text-sm text-gray-800">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg">Feedback Summary</h4>
                                    {/* FIX: Safe navigation with fallback for recommendation */}
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${(result.recommendation || "").toLowerCase().includes('hire') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {result.recommendation || "Review Needed"}
                                    </span>
                                </div>
                                <p className="italic text-gray-600">"{result.summary}"</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <h5 className="font-bold text-green-800 mb-2 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Strengths</h5>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {/* FIX: Safe navigation for strengths array */}
                                            {result.strengths && result.strengths.length > 0 
                                                ? result.strengths.map((s, i) => <li key={i}>{s}</li>)
                                                : <li className="text-gray-400 italic">No specific strengths parsed</li>
                                            }
                                        </ul>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <h5 className="font-bold text-red-800 mb-2 flex items-center gap-1"><span className="text-lg leading-3">-</span> Weaknesses</h5>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {/* FIX: Safe navigation for weaknesses array */}
                                            {result.weaknesses && result.weaknesses.length > 0
                                                ? result.weaknesses.map((w, i) => <li key={i}>{w}</li>)
                                                : <li className="text-gray-400 italic">No specific weaknesses parsed</li>
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-gray-400 text-center mt-20 flex flex-col items-center">
                            <PenTool className="h-12 w-12 mb-2 opacity-20" />
                            Paste notes to summarize
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HRGenAI;