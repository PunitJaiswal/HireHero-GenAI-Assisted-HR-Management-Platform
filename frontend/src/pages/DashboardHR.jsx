import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import { getEmployees, getMyJobs, getCompanyApplications } from "../services/api";
import { 
  Download, Sparkles, AlertCircle, Users, Plus, Briefcase, 
  FileText, BarChart2, Calendar, TrendingUp, CheckCircle, 
  Clock, Activity, ChevronRight, UserCheck, Video, Phone, MapPin, X, ExternalLink
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import RecruitmentTab from "../components/RecruitmentTab";
import EmployeesTab from "../components/EmployeesTab";
import PerformanceTab from "../components/PerformanceTab";
import AnalyticsTab from "../components/AnalyticsTab";
import ProfileHR from "../components/ProfileHR";
import SidebarHR from "../components/SidebarHR";
import TopNavbarHR from "../components/TopNavbarHR";

export default function DashboardHR() {
    const location = useLocation(); 
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [username, setUsername] = useState("");
    
    // Metrics State
    const [metrics, setMetrics] = useState({
      totalEmployees: 0,
      newHires: 0,
      openPositions: 0,
      activeCandidates: 0, 
    });

    const [qualityData, setQualityData] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activeInterviews, setActiveInterviews] = useState([]);
    
    // New State for Interview Modal
    const [selectedInterview, setSelectedInterview] = useState(null);

    // Check for incoming tab state on mount
    useEffect(() => {
        if (location.state && location.state.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // Fetch Username
    useEffect(() => {
      async function fetchUsername() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.first_name || data.last_name) {
              setUsername(`${data.first_name || ''} ${data.last_name || ''}`.trim());
            } else {
              setUsername(data.username || data.email || "User");
            }
          }
        } catch (err) {
          setUsername("User");
        }
      }
      fetchUsername();
    }, []);

    // Main Data Fetch Effect
    useEffect(() => {
      async function fetchData() {
        try {
          const [employees, myJobs, applications] = await Promise.all([
            getEmployees(),
            getMyJobs(),
            getCompanyApplications(),
          ]);

          // --- Filter Applications for Current HR's Jobs ---
          const myJobIds = new Set(myJobs.map(j => j.id));
          const myApps = applications.filter(app => myJobIds.has(app.job_id));

          // 1. Calculate Core Metrics
          const totalEmployees = employees.length;
          const openPositions = myJobs.filter(j => !j.status || j.status.toLowerCase() === 'open').length;
          const newHires = myApps.filter(app => ['hired', 'accepted'].includes(app.status)).length;
          const activeStages = new Set(['interviewing', 'under_review', 'offer_extended']);
          const activeCandidates = myApps.filter(app => activeStages.has(app.status)).length;

          setMetrics({
            totalEmployees,
            newHires,
            openPositions,
            activeCandidates,
          });

          // 2. Candidate Quality Distribution (Pie Chart)
          const buckets = {
            high: 0,
            med: 0,
            low: 0
          };

          myApps.forEach(app => {
            const score = app.match_score || 0;
            if (score >= 80) buckets.high++;
            else if (score >= 50) buckets.med++;
            else buckets.low++;
          });

          setQualityData([
            { name: 'Top Talent (80%+)', value: buckets.high, color: '#10B981' },
            { name: 'Potential (50-79%)', value: buckets.med, color: '#F59E0B' },
            { name: 'Low Match (<50%)', value: buckets.low, color: '#EF4444' },
          ].filter(item => item.value > 0)); 

          // 3. Smart Action Items
          const actions = [];
          const pendingHighMatch = myApps.filter(app => app.status === 'applied' && (app.match_score || 0) >= 80).length;
          if (pendingHighMatch > 0) {
            actions.push({
              type: 'urgent',
              title: 'Top Talent Waiting',
              desc: `${pendingHighMatch} candidates with >80% match score are waiting for review.`
            });
          }

          const activeInterviewCount = myApps.filter(app => app.status === 'interviewing').length;
          if (activeInterviewCount > 0) {
            actions.push({
              type: 'info',
              title: 'Interview Stage',
              desc: `You have ${activeInterviewCount} candidates currently in the interview stage.`
            });
          }

          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          const newApps = myApps.filter(app => new Date(app.applied_at) > oneDayAgo).length;
          if (newApps > 0) {
            actions.push({
              type: 'success',
              title: 'New Applications',
              desc: `${newApps} new applications received in the last 24 hours.`
            });
          }

          if (actions.length === 0) {
            actions.push({ type: 'neutral', title: 'All Caught Up', desc: 'No urgent items requiring attention right now.' });
          }
          setActionItems(actions);

          // 4. Recent Activity Feed
          const activities = [];
          
          myJobs.forEach(job => {
              if (job.created_at) {
                  activities.push({
                      type: 'job',
                      title: `Posted new job: ${job.title}`,
                      date: new Date(job.created_at),
                      icon: Briefcase,
                      color: 'text-blue-600',
                      bg: 'bg-blue-100'
                  });
              }
          });

          myApps.forEach(app => {
              if (app.applied_at) {
                  activities.push({
                      type: 'application',
                      title: `New application for ${app.job_title || 'a job'}`,
                      date: new Date(app.applied_at),
                      icon: FileText,
                      color: 'text-purple-600',
                      bg: 'bg-purple-100'
                  });
              }
          });

          employees.forEach(emp => {
              if (emp.hired_at) {
                  activities.push({
                      type: 'hire',
                      title: `Hired ${emp.name}`,
                      date: new Date(emp.hired_at),
                      icon: UserCheck,
                      color: 'text-green-600',
                      bg: 'bg-green-100'
                  });
              }
          });

          activities.sort((a, b) => b.date - a.date);
          setRecentActivity(activities.slice(0, 10));

          // 5. Active Interviews List
          const interviewingCandidates = myApps
            .filter(app => app.status === 'interviewing')
            .map(app => ({
                id: app.id,
                user_id: app.user_id,
                name: app.candidate_name,
                role: app.job_title,
                score: Math.round(app.match_score || 0),
                interview: app.interview_details 
            }))
            .slice(0, 5); 
          setActiveInterviews(interviewingCandidates);

        } catch (err) {
          console.error("Error fetching dashboard data:", err);
        }
      }
      fetchData();
    }, []);

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

  return (
    <section className="min-h-screen flex bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] font-inter">
      <SidebarHR />
      <main className="flex-1 flex flex-col">
        <TopNavbarHR
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabConfig={[
            { tab: "dashboard", icon: BarChart2 },
            { tab: "employees", icon: Users },
            { tab: "recruitment", icon: Briefcase },
            { tab: "performance", icon: FileText },
            { tab: "analytics", icon: BarChart2 },
          ]}
        />

        <div className="p-8 flex flex-col gap-6">
          {activeTab === "dashboard" && (
            <>
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-[#013362]">
                  Welcome back, <span className="font-semibold">{username || "User"}</span>
                </h1>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Employees", value: metrics.totalEmployees, icon: Users },
                  { label: "New Hires via HireHero", value: metrics.newHires, icon: Plus },
                  { label: "Open Positions", value: metrics.openPositions, icon: Briefcase },
                  { label: "Active Candidates", value: metrics.activeCandidates, icon: Users },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition"
                  >
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                        <h3 className="text-2xl font-extrabold text-[#013362]">{item.value}</h3>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">
                        <item.icon className="h-6 w-6 text-[#005193]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Main 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COLUMN (66%) --- */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Candidate Quality Pie Chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#013362] mb-2 flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-[#005193]" /> Applicant Quality Distribution
                        </h2>
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="w-full md:w-1/2 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={qualityData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {qualityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 space-y-4 pl-4">
                                {qualityData.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{entry.value}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                        * Based on AI Match Scores against Job Descriptions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[#005193]" /> Recent Activity
                        </h2>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {recentActivity.map((act, i) => (
                                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className={`p-2 rounded-full mt-1 ${act.bg}`}>
                                        <act.icon className={`w-4 h-4 ${act.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">{act.title}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" /> {timeAgo(act.date)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <p className="text-sm text-gray-500 italic text-center py-4">No recent activity.</p>
                            )}
                        </div>
                    </div>

                    {/* Smart Action Items */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#005193]" /> Smart Action Items
                      </h2>
                      <div className="space-y-4">
                        {actionItems.map((action, i) => (
                          <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:bg-gray-50 transition">
                            {action.type === 'urgent' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
                            {action.type === 'info' && <Calendar className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />}
                            {action.type === 'success' && <Sparkles className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />}
                            {action.type === 'neutral' && <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />}
                            <div>
                              <p className="font-bold text-[#013362] text-sm">{action.title}</p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {action.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                </div>

                {/* --- RIGHT COLUMN (33%) --- */}
                <div className="space-y-6">
                    
                    {/* Active Interviews Panel */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-[#013362] flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[#005193]" /> Active Interviews
                            </h2>
                            <span className="bg-blue-100 text-[#005193] text-xs font-bold px-2 py-1 rounded-full">
                                {activeInterviews.length}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {activeInterviews.length > 0 ? activeInterviews.map((interview, i) => (
                                <div key={i} className="p-3 border border-gray-100 rounded-xl hover:bg-blue-50 transition group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{interview.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{interview.role}</p>
                                            
                                            {/* Interview Details on Card (Compact) with UK Date Format */}
                                            {interview.interview && (
                                                <div className="mt-2 text-xs text-gray-600 space-y-1">
                                                    <p className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-[#005193]" />
                                                        {new Date(interview.interview.scheduled_at).toLocaleDateString('en-GB')}
                                                    </p>
                                                    <p className="flex items-center gap-1">
                                                        {interview.interview.location_type === 'phone' ? (
                                                            <>
                                                                <Phone className="w-3 h-3 text-purple-600" />
                                                                <span className="font-semibold text-purple-600">Phone Interview</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {interview.interview.location_type === 'video' 
                                                                    ? <Video className="w-3 h-3 text-blue-600" />
                                                                    : <MapPin className="w-3 h-3 text-gray-600" />
                                                                }
                                                                <span className="truncate max-w-[150px]">{interview.interview.location_detail}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                {interview.score}% Match
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedInterview(interview)}
                                        className="w-full mt-3 py-1.5 text-xs text-[#005193] font-semibold border border-blue-100 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-1"
                                    >
                                        View Details <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No active interviews.</p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => navigate("/dashboard-hr", { state: { activeTab: "recruitment" } })}
                            className="w-full mt-4 py-2 text-sm text-[#005193] font-semibold border border-blue-100 rounded-lg hover:bg-blue-50 transition"
                        >
                            View Recruitment Board
                        </button>
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-gradient-to-br from-[#005193] to-[#013362] rounded-2xl p-6 shadow-md text-white">
                        <h3 className="text-lg font-bold mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-100 mb-4">
                            Use our AI Assistant to generate JDs, interview guides, or summarize feedback instantly.
                        </p>
                        <button 
                            onClick={() => navigate("/hr-genai")}
                            className="w-full bg-white text-[#005193] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" /> Open GenAI Studio
                        </button>
                    </div>

                </div>

              </div>
            </>
          )}

          {/* Feature Tabs */}
          {activeTab === "employees" && <EmployeesTab />}
          {activeTab === "recruitment" && <RecruitmentTab />}
          {activeTab === "performance" && <PerformanceTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "profile" && <ProfileHR />}
        </div>

        {/* --- Interview Details Modal --- */}
        {selectedInterview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-gradient-to-r from-[#005193] to-[#013362] px-6 py-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-200" /> Interview Details
                        </h3>
                        <button onClick={() => setSelectedInterview(null)} className="text-white/80 hover:text-white transition bg-white/10 p-1 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800">{selectedInterview.name}</h4>
                                <p className="text-sm text-gray-500">{selectedInterview.role}</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {selectedInterview.score}% Match
                                </span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-2 rounded-lg text-[#005193]">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Date & Time</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {/* Updated to UK format in Modal */}
                                        {new Date(selectedInterview.interview.scheduled_at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(selectedInterview.interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${selectedInterview.interview.location_type === 'phone' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {selectedInterview.interview.location_type === 'phone' ? <Phone className="w-5 h-5" /> : selectedInterview.interview.location_type === 'video' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                        {selectedInterview.interview.location_type === 'phone' ? 'Phone Number' : selectedInterview.interview.location_type === 'video' ? 'Meeting Link' : 'Location'}
                                    </p>
                                    <div className="text-sm font-medium text-gray-800 mt-1">
                                        {selectedInterview.interview.location_type === 'video' ? (
                                            <a 
                                                href={selectedInterview.interview.location_detail} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-blue-600 hover:underline flex items-center gap-1 break-all"
                                            >
                                                {selectedInterview.interview.location_detail} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : selectedInterview.interview.location_type === 'phone' ? (
                                            <span className="font-mono text-lg tracking-wide">{selectedInterview.interview.location_detail || "Not provided"}</span>
                                        ) : (
                                            <span>{selectedInterview.interview.location_detail}</span>
                                        )}
                                    </div>
                                    {selectedInterview.interview.location_type === 'phone' && (
                                        <p className="text-xs text-green-600 mt-1 font-semibold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Phone Interview
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-between gap-3 border-t border-gray-100">
                        <a 
                            href={`/profile/${selectedInterview.user_id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 py-2 text-center text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
                        >
                            View Profile
                        </a>
                        <button 
                            onClick={() => {
                                setSelectedInterview(null);
                                navigate("/dashboard-hr", { state: { activeTab: "recruitment" } });
                            }} 
                            className="flex-1 py-2 text-center text-sm font-semibold text-white bg-[#005193] rounded-lg hover:opacity-90 transition shadow-md"
                        >
                            Manage Application
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </section>
  );
}