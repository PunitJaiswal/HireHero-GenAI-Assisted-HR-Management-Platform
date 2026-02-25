import React, { useState } from 'react';
import { getRecommendedJobs, getMyInterviews, applyToJob, getApplications, getProfileMe } from '../services/api';
import TopNavbarApplicant from "../components/TopNavbarApplicant";
import JobSearch from '../components/JobSearch';
import MyApplications from '../components/MyApplications';
import Chatbot from '../components/JobSeekerGenAI';
import ProfileApplicant from '../components/ProfileApplicant';
import { 
  Briefcase, Send, Eye, Users, Sparkles, FileText, 
  BarChart2, X, MapPin, Clock, IndianRupee, GraduationCap, Globe, Gift 
} from "lucide-react";

export default function DashboardApplicant() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState([
    { label: "Applications Sent", value: 0, sub: "", icon: Send },
    { label: "Profile Views", value: 0, sub: "Total Views", icon: Eye },
    { label: "Interview Requests", value: 0, sub: "", icon: Briefcase },
    { label: "AI Job Match", value: "0%", sub: "", icon: Sparkles },
  ]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  // --- MODAL STATE ---
  const [selectedJob, setSelectedJob] = useState(null); 
  const [appliedJobIds, setAppliedJobIds] = useState(new Set()); 
  const [applyingId, setApplyingId] = useState(null); 

  // --- Helper: Salary Formatter ---
  const formatSalary = (amount, type) => {
    if (!amount) return "Competitive";
    
    const cleanAmount = amount.toString().replace(/[^0-9.]/g, '');
    const value = parseFloat(cleanAmount);

    if (isNaN(value)) return amount;

    let formattedNumber = "";
    
    if (value >= 100000) {
        formattedNumber = `${parseFloat((value / 100000).toFixed(2))}L`; 
    } else if (value >= 1000) {
        formattedNumber = `${parseFloat((value / 1000).toFixed(2))}K`;
    } else {
        formattedNumber = value.toString();
    }

    let suffix = "";
    const lowerType = (type || "").toLowerCase();
    
    if (lowerType === "full-time" || lowerType === "part-time") {
        suffix = " per annum";
    } else if (lowerType === "internship") {
        suffix = " per month";
    } else if (lowerType === "contract") {
        suffix = " fixed";
    }

    return `₹${formattedNumber}${suffix}`;
  };

  React.useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 1. Fetch User Basic Info
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

          // 2. Fetch Profile Stats (Real Profile Views)
          try {
            const profileData = await getProfileMe();
            setStats(prev => prev.map(stat => 
                stat.label === "Profile Views" 
                ? { ...stat, value: profileData.views || 0 } 
                : stat
            ));
          } catch(e) {
            console.error("Failed to load profile views", e);
          }

        } catch {
          setUsername("User");
        }
      }
      
      try {
        const interviews = await getMyInterviews();
        setUpcomingInterviews(interviews.map(interview => ({
          id: interview.id,
          company: interview.company_name || "HireHero",
          role: interview.job_title || "Interview",
          date: new Date(interview.scheduled_at).toLocaleDateString(),
          time: new Date(interview.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          link: interview.location_detail,
          type: interview.location_type || 'video'
        })));
        
        setStats(prev => prev.map(stat =>
          stat.label === "Interview Requests"
            ? { ...stat, value: interviews.length, sub: "Scheduled" }
            : stat
        ));
      } catch (err) {
        setUpcomingInterviews([]);
      }

      try {
        const applications = await getApplications();
        setStats(prev => prev.map(stat =>
          stat.label === "Applications Sent"
            ? { ...stat, value: applications.length, sub: `+${applications.length} total` }
            : stat
        ));
        
        setRecentActivity(applications.map(app => ({
          icon: Send,
          color: "#005193",
          text: `Applied for ${app.title || 'Job'} at ${app.company || 'Company'}`, 
          time: app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "recently"
        })));

        const appliedIds = new Set(applications.map(app => app.job_id));
        setAppliedJobIds(appliedIds);

      } catch {}

      try {
          const recJobs = await getRecommendedJobs();
          setRecommendedJobs(recJobs);
          if (recJobs.length > 0) {
              setStats(prev => prev.map(stat => 
                  stat.label === "AI Job Match" 
                  ? { ...stat, value: `${Math.round(recJobs[0].match_score)}%`, sub: "Top Match" } 
                  : stat
              ));
          }
      } catch (e) { console.error(e); }
    }
    fetchData();
  }, []);

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    try {
      await applyToJob(jobId);
      setAppliedJobIds(prev => new Set(prev).add(jobId));
      alert("Application sent successfully!");
      
      const job = recommendedJobs.find(j => j.id === jobId);
      if(job) {
          setRecentActivity(prev => [{
              icon: Send,
              color: "#005193",
              text: `Applied for ${job.title} at ${job.company}`,
              time: "Just now"
          }, ...prev]);
      }
    } catch (err) {
      alert("Failed to apply. Please try again.");
    }
    setApplyingId(null);
  };

  return (
    <section className="min-h-screen flex flex-col bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] font-inter">
      <TopNavbarApplicant activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8 flex flex-col gap-6">
        {activeTab === "dashboard" && (
          <>
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-extrabold text-[#013362]">
                  Welcome, <span className="font-semibold">{username || "User"}</span>
              </h1>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center hover:shadow-md transition flex flex-col items-center">
                  {stat.icon && <stat.icon className="h-7 w-7 mb-2 text-[#005193]" />}
                  <h3 className="text-3xl font-extrabold text-[#013362]">{stat.value}</h3>
                  <p className="text-gray-500 mt-1 text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#013362] flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#005193]" /> AI Recommended Jobs (Top 5)
                  </h2>
                  <button onClick={() => setActiveTab("jobs")} className="text-[#005193] text-sm font-semibold hover:underline flex items-center gap-1">
                    <BarChart2 className="h-4 w-4" /> View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recommendedJobs.map((job, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-start border border-gray-200 rounded-lg px-4 py-3 hover:bg-[#F7F8FF] transition"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold uppercase text-gray-600">
                            {(job.company_name || job.company || "C")[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{job.title}</p>
                            <p className="text-sm text-gray-500">{job.company_name || job.company}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-bold">
                              {Math.round(job.match_score)}% Match
                          </span>
                          {(Array.isArray(job.tags) ? job.tags : typeof job.tags === 'string' ? job.tags.split(',').map(t => t.trim()).filter(Boolean) : []).map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
                              style={{ marginBottom: '2px' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <button 
                            onClick={() => setSelectedJob(job)}
                            className="px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 text-[#005193] hover:underline bg-transparent border-none shadow-none"
                        >
                          View Details
                        </button>
                        
                        <button 
                            onClick={() => !appliedJobIds.has(job.id) && handleApply(job.id)}
                            disabled={applyingId === job.id || appliedJobIds.has(job.id)}
                            className={`px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 text-white shadow-lg transition ${
                                appliedJobIds.has(job.id) 
                                ? "bg-green-600 cursor-default opacity-80" 
                                : "bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-90"
                            }`}
                        >
                          {applyingId === job.id ? "Sending..." : appliedJobIds.has(job.id) ? "Applied" : "Apply Now"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {recommendedJobs.length === 0 && <p className="text-gray-500 text-sm italic">No recommendations found yet. Try updating your profile skills.</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#005193]" /> Recent Activity
                </h2>
                <ul className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <item.icon className="h-5 w-5 mt-1" style={{ color: item.color }} />
                      <div>
                        <p className="text-sm text-gray-800">{item.text}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#005193]" /> Upcoming Interviews
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingInterviews.length > 0 ? upcomingInterviews.map((interview, i) => (
                  <div key={i} className="border rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-[#F7F8FF]">
                    <div>
                      <p className="font-medium text-gray-800">{interview.company}</p>
                      <p className="text-sm text-gray-500 capitalize">{interview.role}</p>
                      <p className="text-xs text-[#005193] font-semibold mt-1">
                        {interview.date} at {interview.time}
                      </p>
                    </div>
                    <div className="flex space-x-2 mt-3 md:mt-0 items-center">
                      {interview.type === 'video' ? (
                        <button 
                          onClick={() => window.open(interview.link, '_blank')}
                          disabled={!interview.link}
                          className="px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-[#005193] to-[#013362] text-white shadow-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                          Join Interview
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">
                            {interview.type === 'phone' ? 'Phone Call' : 'In Person'}
                          </span>
                          <span className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1.5 rounded-md block max-w-[200px] truncate" title={interview.link}>
                            {interview.link || 'Location pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm italic">No upcoming interviews scheduled.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab content */}
        {activeTab === "jobs" && <JobSearch onViewJob={setSelectedJob} />}
        {activeTab === "applications" && <MyApplications onViewJob={setSelectedJob} />}
        {activeTab === "profile" && <ProfileApplicant />}
        {activeTab === "chat" && <Chatbot />}
      </main>

      {/* --- UNIFIED JOB DETAILS MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* 1. Fixed Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start flex-shrink-0">
              <div>
                <h3 className="text-2xl font-extrabold text-[#013362]">{selectedJob.title}</h3>
                <p className="text-base text-gray-500 font-semibold mt-1">{selectedJob.company_name || selectedJob.company || "HireHero Company"}</p>
              </div>
              <button 
                  onClick={() => setSelectedJob(null)} 
                  className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"
              >
                  <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Content */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Tags Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                    <Clock className="w-5 h-5 text-[#005193] mb-1" />
                    <span className="text-xs text-gray-500 font-medium uppercase">Type</span>
                    <span className="text-sm font-bold text-[#005193]">{selectedJob.type || "Full-time"}</span>
                </div>
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col items-center text-center">
                    <IndianRupee className="w-5 h-5 text-green-700 mb-1" />
                    <span className="text-xs text-gray-500 font-medium uppercase">Salary</span>
                    {/* UPDATED SALARY FORMATTING */}
                    <span className="text-sm font-bold text-green-700">{formatSalary(selectedJob.salary, selectedJob.type)}</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col items-center text-center">
                    <MapPin className="w-5 h-5 text-purple-700 mb-1" />
                    <span className="text-xs text-gray-500 font-medium uppercase">Location</span>
                    <span className="text-sm font-bold text-purple-700">{selectedJob.location || "Remote"}</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                    <Briefcase className="w-5 h-5 text-orange-600 mb-1" />
                    <span className="text-xs text-gray-500 font-medium uppercase">Experience</span>
                    <span className="text-sm font-bold text-orange-600">{selectedJob.experience_level || "Not Specified"}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="prose prose-sm text-gray-700 max-w-none">
                        <h4 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Description
                        </h4>
                        <p className="whitespace-pre-wrap leading-relaxed">{selectedJob.description || "No description provided."}</p>
                    </div>

                    {selectedJob.tags && selectedJob.tags.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(selectedJob.tags) ? selectedJob.tags : typeof selectedJob.tags === 'string' ? selectedJob.tags.split(',') : []).map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200">{tag.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> Education
                        </h4>
                        <p className="text-sm text-gray-700 font-medium">{selectedJob.education || "Not Specified"}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Remote Policy
                        </h4>
                        <p className="text-sm text-gray-700 font-medium">{selectedJob.remote_option || "Not Specified"}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-3 border-b pb-2 flex items-center gap-2">
                            <Gift className="w-4 h-4" /> Benefits
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {selectedJob.benefits ? (
                                selectedJob.benefits.split(',').map((b, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {b.trim()}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500 italic">Not listed</li>
                            )}
                        </ul>
                    </div>
                </div>
              </div>
            </div>

            {/* 3. Fixed Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-white rounded-b-2xl">
              <button 
                  onClick={() => setSelectedJob(null)} 
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition"
              >
                  Close
              </button>
              <button
                className={`px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition transform active:scale-95 ${
                  appliedJobIds.has(selectedJob.id)
                    ? "bg-green-600 cursor-default opacity-90 shadow-none"
                    : "bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-95 hover:shadow-xl"
                }`}
                onClick={() => { 
                  if (!appliedJobIds.has(selectedJob.id)) {
                    handleApply(selectedJob.id); 
                    setSelectedJob(null); 
                  }
                }}
                disabled={applyingId === selectedJob.id || appliedJobIds.has(selectedJob.id)}
              >
                {applyingId === selectedJob.id 
                  ? 'Sending Application...' 
                  : appliedJobIds.has(selectedJob.id) 
                    ? 'Already Applied' 
                    : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}