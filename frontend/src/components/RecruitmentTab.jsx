import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyJobs, getEmployees, getCandidates, axiosAuth, getCompanyApplications, updateApplicationStatus,
  scheduleInterview, getApplicationExplanation } from "../services/api";
import {
  Users,
  Briefcase,
  BarChart2,
  Lightbulb,
  TrendingUp,
  Plus,
  Mail,
  User,
  Code,
  Brush,
  Sparkles,
  Megaphone,
  ExternalLink,
  CheckCircle,
  XCircle,
  Calendar,
  UserPlus,
  HelpCircle,
  X,
  Loader,
  AlertCircle 
} from "lucide-react";

const RecruitmentTab = () => {
    const navigate = useNavigate();
    const [pillMessage, setPillMessage] = useState("");
    const [pillType, setPillType] = useState(""); // 'success' or 'error'
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [editFields, setEditFields] = useState({
    description: "",
    company: "",
    location: "",
    type: "",
    salary: "",
    tags: "",
    status: ""
  });
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentJobApplicants, setCurrentJobApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [explanationModal, setExplanationModal] = useState({ 
        show: false, 
        data: null, 
        loading: false,
        candidateName: ""
    });
  
  const [viewingJob, setViewingJob] = useState(null); 
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [holding, setHolding] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    link: "",
    type: "video" // video, phone, in_person
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewApplication, setReviewApplication] = useState(null);

  // New State for Smart Action Items
  const [actionItems, setActionItems] = useState([]);

  const handleShowExplanation = async (appId, candidateName) => {
        setExplanationModal({ show: true, data: null, loading: true, candidateName });
        try {
            const data = await getApplicationExplanation(appId);
            setExplanationModal(prev => ({ ...prev, loading: false, data }));
        } catch (err) {
            console.error(err);
            setExplanationModal(prev => ({ ...prev, loading: false, data: null })); 
        }
    };

    const closeExpModal = () => setExplanationModal({ show: false, data: null, loading: false, candidateName: "" });

  const handleSaveJob = async () => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      const payload = {
        description: editFields.description,
        company: editFields.company,
        department: editFields.department,
        location: editFields.location,
        type: editFields.type,
        remote_option: editFields.remote_option,
        experience_level: editFields.experience_level,
        education: editFields.education,
        salary: editFields.salary,
        tags: editFields.tags.split(',').map(t => t.trim()).filter(Boolean).join(','),
        benefits: Array.isArray(editFields.benefits) ? editFields.benefits.join(',') : (editFields.benefits || ''),
        application_deadline: editFields.application_deadline,
        status: editFields.status
      };
      await axiosAuth.put(`/hr/jobs/${selectedJob.id}`, payload);
      setJobs(jobs => jobs.map(j => j.id === selectedJob.id ? { ...j, ...editFields, tags: payload.tags.split(',') } : j));
      setShowModal(false);
      setSelectedJob(null);
      setPillMessage("Job updated successfully!");
      setPillType("success");
      setTimeout(() => setPillMessage("") , 3000);
    } catch (err) {
      setPillMessage("Failed to update job.");
      setPillType("error");
      setTimeout(() => setPillMessage("") , 3000);
    }
    setSaving(false);
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
        return;
    }

    setDeleting(true);
    try {
      await axiosAuth.delete(`/hr/jobs/${selectedJob.id}`);
      setJobs(jobs => jobs.filter(j => j.id !== selectedJob.id));
      setShowModal(false);
      setSelectedJob(null);
      
      setPillMessage("Job deleted successfully.");
      setPillType("success");
    } catch (err) {
      setPillMessage("Failed to delete job.");
      setPillType("error");
    }
    setDeleting(false);
    setTimeout(() => setPillMessage(""), 3000);
  };

  const handleHoldJob = async () => {
    if (!selectedJob) return;
    setHolding(true);
    try {
      await axiosAuth.put(`/hr/jobs/${selectedJob.id}`, { status: 'on hold' });
      setJobs(jobs => jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'on hold' } : j));
      setShowModal(false);
      setSelectedJob(null);
      
      setPillMessage("Job status updated to 'On Hold'.");
      setPillType("success");
    } catch (err) {
        setPillMessage("Failed to update status.");
        setPillType("error");
    }
    setHolding(false);
    setTimeout(() => setPillMessage(""), 3000);
  };

  const handleViewApplicants = async (job) => {
    setViewingJob(job);
    setShowApplicantsModal(true);
    setLoadingApplicants(true);
    try {
      const apps = await getCompanyApplications(job.id);
      const sortedApps = apps.sort((a, b) => {
        const scoreA = a.match_score || 0;
        const scoreB = b.match_score || 0;
        return scoreB - scoreA; 
      });
      setCurrentJobApplicants(sortedApps);
    } catch (err) {
      console.error("Failed to load applicants", err);
      setCurrentJobApplicants([]);
    }
    setLoadingApplicants(false);
  };

  const handleApplicationAction = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      
      // Update in main applicants list
      setCurrentJobApplicants(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));

      // Update in Review Modal if open
      if (reviewApplication && reviewApplication.id === appId) {
          setReviewApplication(prev => ({ ...prev, status: newStatus }));
      }
      
      // Update in Candidates list
      setCandidates(prev => prev.map(cand => 
        cand.id === appId ? { ...cand, status: newStatus } : cand
      ));

      // Update pipeline counts locally to reflect change immediately
      setPipelineCounts(prev => {
        return prev; 
      });
      
      setPillMessage(`Candidate ${newStatus === 'rejected' ? 'rejected' : 'moved to ' + newStatus.replace('_', ' ')}`);
      setPillType("success");
      setTimeout(() => setPillMessage(""), 3000);
    } catch (err) {
      console.error("Failed to update status", err);
      setPillMessage("Failed to update status");
      setPillType("error");
      setTimeout(() => setPillMessage("") , 3000);
    }
  };

  const openScheduleModal = (app) => {
    setSelectedAppForInterview(app);
    setScheduleForm({ date: "", time: "", link: "", type: "video" });
    setShowScheduleModal(true);
  };

  // --- Dynamic Input Handler ---
  const handleScheduleLinkChange = (e) => {
    const val = e.target.value;
    if (scheduleForm.type === 'phone') {
        // Allow only numbers
        if (/^\d*$/.test(val)) {
            setScheduleForm({ ...scheduleForm, link: val });
        }
    } else {
        setScheduleForm({ ...scheduleForm, link: val });
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppForInterview) return;

    try {
      const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();

      await scheduleInterview({
        application_id: selectedAppForInterview.id,
        stage: 'interviewing',
        scheduled_at: scheduledAt,
        location_type: scheduleForm.type,
        location_detail: scheduleForm.link
      });

      await handleApplicationAction(selectedAppForInterview.id, 'interviewing');

      setShowScheduleModal(false);
      setPillMessage("Interview scheduled successfully!");
      setPillType("success");
    } catch (err) {
      console.error(err);
      setPillMessage("Failed to schedule interview.");
      setPillType("error");
    }
    setTimeout(() => setPillMessage(""), 3000);
  };

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [pipelineCounts, setPipelineCounts] = useState({});

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Jobs
      const jobsData = await getMyJobs();
      const jobsWithIcons = (jobsData || []).map((job) => ({
        ...job,
        icon:
          /engineer|developer/i.test(job.title) ? Code :
          /design/i.test(job.title) ? Brush :
          /market|marketing/i.test(job.title) ? Megaphone : Briefcase,
        applications: job.applications_count || 0,
        qualified: job.qualified_count || 0,
      }));
      // Sort jobs by application count descending
      jobsWithIcons.sort((a, b) => b.applications - a.applications);
      setJobs(jobsWithIcons);

      // 2. Fetch Applications for Pipeline & Top Candidates
      try {
        const apps = await getCompanyApplications();
        
        const myJobIds = new Set((jobsData || []).map(j => j.id));

        const counts = {};
        const myApps = [];

        apps.forEach(app => {
            if (myJobIds.has(app.job_id)) {
                myApps.push(app); 
                const s = app.status;
                counts[s] = (counts[s] || 0) + 1;
            }
        });
        setPipelineCounts(counts);

        const highMatch = myApps.filter(app => (app.match_score || 0) >= 80);
        highMatch.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        const top5 = highMatch.slice(0, 5);

        const formattedCandidates = top5.map(app => ({
            ...app,
            name: app.candidate_name,
            role: app.job_title,
            match: `${Math.round(app.match_score)}%`
        }));
        setCandidates(formattedCandidates);

        const actions = [];
        const pendingHighMatch = myApps.filter(app => app.status === 'applied' && (app.match_score || 0) >= 80).length;
        if (pendingHighMatch > 0) {
          actions.push({
            type: 'urgent',
            title: 'Top Talent Waiting',
            desc: `${pendingHighMatch} candidates with >80% match score are waiting for review.`
          });
        }

        const activeInterviews = myApps.filter(app => app.status === 'interviewing').length;
        if (activeInterviews > 0) {
          actions.push({
            type: 'info',
            title: 'Interview Stage',
            desc: `You have ${activeInterviews} candidates currently in the interview stage.`
          });
        }

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const newAppsCount = myApps.filter(app => new Date(app.applied_at) > oneDayAgo).length;
        if (newAppsCount > 0) {
          actions.push({
            type: 'success',
            title: 'New Applications',
            desc: `${newAppsCount} new applications received in the last 24 hours.`
          });
        }

        if (actions.length === 0) {
          actions.push({ type: 'neutral', title: 'All Caught Up', desc: 'No urgent items requiring attention right now.' });
        }

        setActionItems(actions);

      } catch (err) {
        console.error("Error fetching data", err);
      }
    }
    fetchData();
  }, []);

  const handleReviewClick = (candidateApp) => {
      setReviewApplication(candidateApp);
      setShowReviewModal(true);
  };

  const totalJobPostings = jobs.length;
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applications || 0), 0);
  const qualifiedApplicants = jobs.reduce((sum, job) => sum + (job.qualified || 0), 0);
  const topMatchScore = candidates.length > 0 ? candidates[0].match : "0%";

  const metrics = [
    { label: "Total Job Postings", value: totalJobPostings, icon: Briefcase },
    { label: "Total Applicants", value: totalApplicants, icon: Users },
    { label: "Qualified Applicants", value: qualifiedApplicants, icon: CheckCircle },
    { label: "Top Match Score", value: topMatchScore, icon: Sparkles },
  ];

  // Helper for dynamic label and placeholder
  const getDynamicFieldProps = () => {
      switch(scheduleForm.type) {
          case 'phone':
              return { label: 'Phone Number', placeholder: 'e.g. 9876543210' };
          case 'in_person':
              return { label: 'Office Address', placeholder: 'e.g. Conference Room A, Building 3' };
          default:
              return { label: 'Meeting Link', placeholder: 'e.g. https://meet.google.com/...' };
      }
  };

  const fieldProps = getDynamicFieldProps();

  return (
    <div className="relative">
      {pillMessage && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-2 rounded-full font-semibold shadow-lg text-sm transition-all duration-300 animate-bounce ${pillType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
          {pillMessage}
        </div>
      )}

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#005193]" /> Recruitment
          </h1>
          <div className="flex gap-3">
            <a href="/post-job" className="flex items-center gap-2 bg-[#005193] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Post New Job
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center hover:shadow-md transition flex flex-col items-center"
            >
                <metric.icon className="h-6 w-6 mb-1 text-[#005193]" />
                <h3 className="text-xl font-extrabold text-[#013362]">{metric.value}</h3>
                <p className="text-gray-500 text-xs font-medium">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#005193]" /> Active Job Postings
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-[#F8FAFF] transition"
                >
                  <div className="flex items-center gap-3">
                    <job.icon className="h-6 w-6 text-[#005193]" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{job.title}</h3>
                      <div className="text-xs text-gray-500 flex gap-4 mt-1">
                        <span>{job.applications} applications</span>
                        <span>{job.qualified} qualified</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                  <button
                        className="text-sm bg-blue-50 text-[#005193] px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 flex items-center gap-1 transition"
                        onClick={() => handleViewApplicants(job)}
                    >
                    <Users className="w-4 h-4" /> Applicants
                  </button>
                  <button
                    className="text-sm border border-gray-300 text-[#005193] px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-50"
                    onClick={() => {
                      setSelectedJob(job);
                      setEditFields({
                        description: job.description || "",
                        company: job.company || job.company_name || "",
                        department: job.department || "",
                        type: job.type || job.type || "",
                        remote_option: job.remote_option || "",
                        location: job.location || "",
                        tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags || ""),
                        experience_level: job.experience_level || "",
                        education: job.education || job.education_level || "",
                        salary: job.salary || "",
                        benefits: Array.isArray(job.benefits) ? job.benefits : (job.benefits ? job.benefits.split(',').map(b => b.trim()) : []),
                        application_deadline: job.application_deadline || "",
                        status: job.status || ""
                      });
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  </div>
                      {showModal && selectedJob && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-4xl relative">
                            <button
                              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                              onClick={() => setShowModal(false)}
                              aria-label="Close"
                            >
                              ×
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-[#013362]">Edit Job</h2>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <div className="font-semibold text-[#005193] mb-2">{selectedJob.title}</div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.company || ''}
                                  onChange={e => setEditFields(f => ({ ...f, company: e.target.value }))}
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.department || ''}
                                  onChange={e => setEditFields(f => ({ ...f, department: e.target.value }))}
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.type || ''}
                                  onChange={e => setEditFields(f => ({ ...f, type: e.target.value }))}
                                >
                                  <option value="">Select...</option>
                                  <option>Full-Time</option>
                                  <option>Part-Time</option>
                                  <option>Contract</option>
                                  <option>Internship</option>
                                </select>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remote Option</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.remote_option || ''}
                                  onChange={e => setEditFields(f => ({ ...f, remote_option: e.target.value }))}
                                >
                                  <option value="">Select...</option>
                                  <option>Remote</option>
                                  <option>Hybrid</option>
                                  <option>On-site</option>
                                </select>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.location || ''}
                                  onChange={e => setEditFields(f => ({ ...f, location: e.target.value }))}
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#005193] min-h-[80px]"
                                  value={editFields.description}
                                  onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.tags}
                                  onChange={e => setEditFields(f => ({ ...f, tags: e.target.value }))}
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.experience_level || ''}
                                  onChange={e => setEditFields(f => ({ ...f, experience_level: e.target.value }))}
                                >
                                  <option value="">Select...</option>
                                  <option>Junior</option>
                                  <option>Mid</option>
                                  <option>Senior</option>
                                  <option>Lead</option>
                                </select>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#005193]"
                                  value={editFields.education || ''}
                                  onChange={e => setEditFields(f => ({ ...f, education: e.target.value }))}
                                >
                                  <option value="">Select...</option>
                                  <option value="Bachelor's">Bachelor's</option>
                                  <option value="Master's">Master's</option>
                                  <option>PhD</option>
                                </select>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                                <input 
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" 
                                  value={editFields.salary || ''} 
                                  onChange={e => setEditFields(f => ({ ...f, salary: e.target.value }))} 
                                  placeholder="e.g. 50000" 
                                />
                                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                                <div className="flex gap-4 flex-wrap">
                                  {['Health Insurance', 'Remote Work', 'Paid Leave'].map((b) => (
                                    <label key={b} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(editFields.benefits) ? editFields.benefits.includes(b) : false}
                                        onChange={e => setEditFields(f => ({
                                          ...f,
                                          benefits: e.target.checked
                                            ? [...(Array.isArray(f.benefits) ? f.benefits : []), b]
                                            : (Array.isArray(f.benefits) ? f.benefits.filter(x => x !== b) : [])
                                        }))}
                                      />
                                      {b}
                                    </label>
                                  ))}
                                </div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                                <input
                                  type="date"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                                  value={editFields.application_deadline || ''}
                                  onChange={e => setEditFields(f => ({ ...f, application_deadline: e.target.value }))}
                                />
                              </div>
                            </form>
                            <div className="flex flex-wrap justify-end gap-2 mt-8">
                              <button
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                                onClick={handleDeleteJob}
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete'}
                              </button>
                              <button
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                onClick={handleHoldJob}
                                disabled={holding}
                              >
                                {holding ? 'Holding...' : 'Hold Hiring'}
                              </button>
                              <button
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300"
                                onClick={() => setShowModal(false)}
                                disabled={saving || deleting || holding}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#005193] to-[#013362] text-white hover:opacity-90 transition"
                                onClick={handleSaveJob}
                                disabled={saving || deleting || holding}
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
              
              {explanationModal.show && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-[#005193] to-[#013362] px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" /> AI Match Analysis
                            </h3>
                            <button onClick={closeExpModal} className="text-white/80 hover:text-white transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                Analysis for <span className="font-semibold text-gray-800">{explanationModal.candidateName}</span>
                            </p>

                            {explanationModal.loading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                    <Loader className="w-8 h-8 text-[#005193] animate-spin" />
                                    <p className="text-sm text-gray-500 animate-pulse">Consulting AI model...</p>
                                </div>
                            ) : explanationModal.data ? (
                                <div className="space-y-4 text-sm">
                                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                                        <h4 className="font-bold text-green-800 mb-1 flex items-center gap-2">✅ Strengths</h4>
                                        <ul className="list-disc pl-4 text-green-800/80 space-y-1">
                                            {explanationModal.data.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>

                                    <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                        <h4 className="font-bold text-red-800 mb-1 flex items-center gap-2">⚠️ Missing / Gaps</h4>
                                        <ul className="list-disc pl-4 text-red-800/80 space-y-1">
                                            {explanationModal.data.missing?.map((m, i) => <li key={i}>{m}</li>)}
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                        <h4 className="font-bold text-gray-700 mb-1">🤖 AI Verdict</h4>
                                        <p className="text-gray-600 italic">"{explanationModal.data.verdict}"</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-red-500 py-4">Failed to load analysis.</div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={closeExpModal}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
              )}
                
              {showApplicantsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <div>
                        <h3 className="text-xl font-bold text-[#013362]">Applicants</h3>
                        <p className="text-sm text-gray-500">For role: <span className="font-semibold">{viewingJob ? viewingJob.title : ""}</span></p>
                      </div>
                      <button 
                        onClick={() => setShowApplicantsModal(false)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <span className="text-2xl">×</span>
                      </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                      {loadingApplicants ? (
                        <div className="flex justify-center py-10 text-gray-500">Loading applicants...</div>
                      ) : currentJobApplicants.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No applicants found for this job yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentJobApplicants.map((app) => (
                            <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-[#F7F8FF] transition">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#005193] font-bold text-lg">
                                  {app.candidate_name ? app.candidate_name[0].toUpperCase() : "U"}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#013362]">{app.candidate_name || "Unknown Candidate"}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                      app.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                                      app.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                                      app.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' : 
                                      app.status === 'offer_extended' ? 'bg-green-100 text-green-700' :
                                      app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                      app.status === 'hired' ? 'bg-teal-100 text-teal-700' :
                                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {app.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400">• Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              
                              <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                
                                {app.status === 'applied' && (
                                  <>
                                    <button
                                      onClick={() => openScheduleModal(app)} 
                                      title="Schedule Interview"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                                    >
                                      <Calendar className="w-4 h-4" />
                                      Interview
                                    </button>
                                    
                                    <button
                                      onClick={() => handleApplicationAction(app.id, 'rejected')}
                                      title="Reject Application"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {app.status === 'interviewing' && (
                                  <>
                                    <button
                                      onClick={() => handleApplicationAction(app.id, 'under_review')}
                                      title="Mark Interview as Completed"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark Interview as Completed
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {app.status === 'under_review' && (
                                  <>
                                    <button
                                      onClick={() => handleApplicationAction(app.id, 'offer_extended')}
                                      title="Extend Offer"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                    >
                                      <Briefcase className="w-4 h-4" />
                                      Offer
                                    </button>

                                    <button
                                      onClick={() => handleApplicationAction(app.id, 'rejected')}
                                      title="Reject Application"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {app.status === 'accepted' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/add-employee', { 
                                          state: { 
                                            candidate_id: app.user_id,
                                            application_id: app.id, 
                                            job_title: viewingJob?.title,
                                            department: viewingJob?.department,
                                            salary: viewingJob?.salary,
                                            employment_type: viewingJob?.type,
                                            location_type: viewingJob?.remote_option,
                                            specific_location: viewingJob?.location
                                          } 
                                        });
                                      }}
                                      title="Add as Employee"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Add as Employee
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}
                                
                                <a 
                                  href={`/profile/${app.user_id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm font-semibold text-[#005193] hover:underline bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition shadow-sm"
                                >
                                  View Profile <ExternalLink className="w-3 h-3" />
                                </a>

                                <div className="flex flex-col items-end mr-4 px-4 min-w-[100px]">
                                  <div className="flex items-baseline gap-1">
                                      <span className={`text-xl font-extrabold leading-none ${
                                          app.match_score >= 80 ? 'text-green-600' : 
                                          app.match_score >= 50 ? 'text-yellow-600' : 'text-red-500'
                                      }`}>
                                          {app.match_score ? Math.round(app.match_score) : 0}%
                                      </span>
                                      
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                          match
                                      </span>
                                  </div>
                                  
                                  <button 
                                      onClick={() => handleShowExplanation(app.id, app.candidate_name)}
                                      className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:border-blue-300 transition mt-1"
                                  >
                                      <HelpCircle className="w-3 h-3" /> Why?
                                  </button>
                                </div>
                              </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
                      <button 
                        onClick={() => setShowApplicantsModal(false)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
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
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400">
                Insights generated based on real-time data
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#013362] mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#005193]" /> Top Candidates (80%+)
            </h2>
            <div className="space-y-3">
              {candidates.length > 0 ? candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="flex justify-between items-center border border-gray-200 rounded-xl p-4 hover:bg-[#F8FAFF] transition"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-[#005193]" />
                    <div>
                      <h4 className="font-semibold text-gray-800">{cand.name}</h4>
                      <p className="text-xs text-gray-500">{cand.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#005193]">{cand.match} match</span>
                    <button 
                        onClick={() => handleReviewClick(cand)}
                        className="border border-gray-300 text-[#005193] px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50"
                    >
                      Review
                    </button>
                  </div>
                </div>
              )) : <div className="text-center text-gray-500 py-4">No top matches found.</div>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-md font-bold text-[#013362] mb-3">Hiring Pipeline</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {[
                    { key: 'applied', label: 'Applied', bg: 'bg-blue-50 text-blue-700' },
                    { key: 'interviewing', label: 'Interviewing', bg: 'bg-purple-50 text-purple-700' },
                    { key: 'under_review', label: 'Under Review', bg: 'bg-yellow-50 text-yellow-700' },
                    { key: 'offer_extended', label: 'Offer Extended', bg: 'bg-indigo-50 text-indigo-700' },
                    { key: 'accepted', label: 'Accepted', bg: 'bg-emerald-50 text-emerald-700' },
                    { key: 'hired', label: 'Hired', bg: 'bg-teal-50 text-teal-700' },
                    { key: 'rejected', label: 'Rejected', bg: 'bg-red-50 text-red-700' },
                ].map(status => (
                    <div key={status.key} className={`px-3 py-2 rounded-lg font-medium flex justify-between items-center ${status.bg}`}>
                        <span>{status.label}</span>
                        <span className="font-bold">{pipelineCounts[status.key] || 0}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Schedule Interview Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-[#013362] mb-4">Schedule Interview</h3>
              <p className="text-sm text-gray-600 mb-4">
                Candidate: <span className="font-semibold">{selectedAppForInterview?.candidate_name}</span>
              </p>
              
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full border rounded-lg p-2 text-sm"
                      value={scheduleForm.date}
                      onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      required
                      className="w-full border rounded-lg p-2 text-sm"
                      value={scheduleForm.time}
                      onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                  <select
                    className="w-full border rounded-lg p-2 text-sm"
                    value={scheduleForm.type}
                    onChange={e => setScheduleForm({...scheduleForm, type: e.target.value})}
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in_person">In-Person Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldProps.label}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={fieldProps.placeholder}
                    className="w-full border rounded-lg p-2 text-sm"
                    value={scheduleForm.link}
                    onChange={handleScheduleLinkChange}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowScheduleModal(false)} 
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-bold text-white bg-[#005193] rounded-lg hover:opacity-90"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
        {showReviewModal && reviewApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h3 className="text-xl font-bold text-[#013362]">Review Application</h3>
                            <p className="text-sm text-gray-500">Applicant for <span className="font-semibold">{reviewApplication.job_title}</span></p>
                        </div>
                        <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-[#F8FAFF]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#005193] font-bold text-lg">
                                  {reviewApplication.candidate_name ? reviewApplication.candidate_name[0].toUpperCase() : "U"}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#013362]">{reviewApplication.candidate_name || "Unknown Candidate"}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                      reviewApplication.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                                      reviewApplication.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                                      reviewApplication.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' : 
                                      reviewApplication.status === 'offer_extended' ? 'bg-green-100 text-green-700' :
                                      reviewApplication.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                      reviewApplication.status === 'hired' ? 'bg-teal-100 text-teal-700' :
                                      reviewApplication.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {reviewApplication.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400">• Applied {new Date(reviewApplication.applied_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              
                              <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                
                                {reviewApplication.status === 'applied' && (
                                  <>
                                    <button
                                      onClick={() => openScheduleModal(reviewApplication)} 
                                      title="Schedule Interview"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                                    >
                                      <Calendar className="w-4 h-4" />
                                      Interview
                                    </button>
                                    
                                    <button
                                      onClick={() => handleApplicationAction(reviewApplication.id, 'rejected')}
                                      title="Reject Application"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {reviewApplication.status === 'interviewing' && (
                                  <>
                                    <button
                                      onClick={() => handleApplicationAction(reviewApplication.id, 'under_review')}
                                      title="Mark Interview as Completed"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark Interview as Completed
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {reviewApplication.status === 'under_review' && (
                                  <>
                                    <button
                                      onClick={() => handleApplicationAction(reviewApplication.id, 'offer_extended')}
                                      title="Extend Offer"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                    >
                                      <Briefcase className="w-4 h-4" />
                                      Offer
                                    </button>

                                    <button
                                      onClick={() => handleApplicationAction(reviewApplication.id, 'rejected')}
                                      title="Reject Application"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}

                                {reviewApplication.status === 'accepted' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate('/add-employee', { 
                                          state: { 
                                            candidate_id: reviewApplication.user_id,
                                            application_id: reviewApplication.id,
                                            job_title: reviewApplication.job_title,
                                          } 
                                        });
                                      }}
                                      title="Add as Employee"
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Add as Employee
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  </>
                                )}
                                
                                <a 
                                  href={`/profile/${reviewApplication.user_id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm font-semibold text-[#005193] hover:underline bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition shadow-sm"
                                >
                                  View Profile <ExternalLink className="w-3 h-3" />
                                </a>

                                <div className="flex flex-col items-end mr-4 px-4 min-w-[100px]">
                                  <div className="flex items-baseline gap-1">
                                      <span className={`text-xl font-extrabold leading-none ${
                                          reviewApplication.match_score >= 80 ? 'text-green-600' : 
                                          reviewApplication.match_score >= 50 ? 'text-yellow-600' : 'text-red-500'
                                      }`}>
                                          {reviewApplication.match_score ? Math.round(reviewApplication.match_score) : 0}%
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                          match
                                      </span>
                                  </div>
                                  
                                  <button 
                                      onClick={() => handleShowExplanation(reviewApplication.id, reviewApplication.candidate_name)}
                                      className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:border-blue-300 transition mt-1"
                                  >
                                      <HelpCircle className="w-3 h-3" /> Why?
                                  </button>
                                </div>
                              </div>
                              </div>
                            </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
                        <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

      
    </div>
  );
};

export default RecruitmentTab;