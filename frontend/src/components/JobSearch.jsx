import React, { useState, useEffect } from "react";
import { getJobs, applyToJob, getApplications } from '../services/api';

const JobSearch = ({ onViewJob }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [status, setStatus] = useState({ msg: '', type: '' });

  const [filters, setFilters] = useState({
    jobType: [],
    remoteOption: [],
    experienceLevel: [],
    education: [],
    minSalary: "",
    maxSalary: ""
  });

  // --- Helper: Salary Formatter ---
  const formatSalary = (amount, type) => {
    if (!amount) return "-";
    
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

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    try {
      await applyToJob(jobId);
      setStatus({ msg: 'Applied!', type: 'success' });
      
      // Update State & Cache immediately
      setAppliedJobIds(prev => {
          const newSet = new Set(prev).add(jobId);
          // Update Cache
          const cached = sessionStorage.getItem("job_search_cache");
          if (cached) {
              const parsed = JSON.parse(cached);
              parsed.appliedIds = Array.from(newSet);
              sessionStorage.setItem("job_search_cache", JSON.stringify(parsed));
          }
          return newSet;
      });

    } catch (err) {
      setStatus({ msg: 'Error. Try again.', type: 'error' });
    }
    setApplyingId(null);
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  useEffect(() => {
    async function fetchData() {
      // 1. Instant Load from Cache (Stale Data)
      const cached = sessionStorage.getItem("job_search_cache");
      if (cached) {
          try {
              const { jobs: cachedJobs, appliedIds: cachedIds } = JSON.parse(cached);
              setJobs(cachedJobs);
              setAppliedJobIds(new Set(cachedIds));
          } catch (e) {
              console.error("Cache parse error", e);
          }
      }

      // 2. Fetch Fresh Data (Revalidate)
      try {
        const [jobsData, appsData] = await Promise.all([getJobs(), getApplications()]);
        
        const appliedIds = new Set(appsData.map(app => app.job_id));
        
        // Update State
        setJobs(jobsData);
        setAppliedJobIds(appliedIds);

        // Update Cache
        sessionStorage.setItem("job_search_cache", JSON.stringify({
            jobs: jobsData,
            appliedIds: Array.from(appliedIds)
        }));
      } catch (err) {
          console.error("Fetch error", err);
      }
    }
    fetchData();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesJobType = filters.jobType.length === 0 || filters.jobType.includes(job.type);
    const matchesRemote = filters.remoteOption.length === 0 || filters.remoteOption.includes(job.remote_option);
    const matchesExp = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experience_level);
    const matchesEdu = filters.education.length === 0 || filters.education.includes(job.education);
    
    let matchesSalary = true;
    if (filters.minSalary || filters.maxSalary) {
        const jobSalary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, ''), 10) : 0;
        
        if (isNaN(jobSalary) || jobSalary === 0) {
             if (filters.minSalary || filters.maxSalary) matchesSalary = false;
        } else {
            if (filters.minSalary && jobSalary < parseInt(filters.minSalary)) matchesSalary = false;
            if (filters.maxSalary && jobSalary > parseInt(filters.maxSalary)) matchesSalary = false;
        }
    }

    return matchesSearch && matchesJobType && matchesRemote && matchesExp && matchesEdu && matchesSalary;
  });

  const getFilterCount = (category, value) => {
    return jobs.filter(job => {
      const matchesSearch = (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                            (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      
      const key = {
        'jobType': 'type',
        'remoteOption': 'remote_option',
        'experienceLevel': 'experience_level',
        'education': 'education'
      }[category];
      
      return job[key] === value;
    }).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] text-[#013362]">
      {/* Page Header */}
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Find Your Next Job</h1>

      {/* Search Bar */}
      <div className="bg-white/80 shadow rounded-2xl p-5 flex flex-wrap gap-3 md:gap-4 items-center border border-blue-100">
        <input
          type="text"
          placeholder="Job title, keywords or company"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-blue-50 border-none rounded-full px-5 py-3 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#013362] text-[#013362] placeholder:text-[#013362] text-sm shadow-sm"
        />
        <div className="flex gap-2 ml-auto mt-2 md:mt-0">
          <button className="px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-[#005193] to-[#013362] text-white shadow-lg hover:opacity-90 transition">
            Search Jobs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-8">
        {/* Filters Sidebar */}
        <aside className="bg-white p-5 rounded-2xl shadow-sm h-fit">
          <h3 className="font-bold text-xl text-[#013362] leading-tight mb-4">Quick Filters</h3>

          {/* Job Type Filter */}
          <div className="mb-5">
            <h4 className="font-bold mb-2 text-base text-[#013362]">Job Type</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map((type) => (
                <li key={type} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="accent-[#005193]"
                    checked={filters.jobType.includes(type)}
                    onChange={() => handleFilterChange('jobType', type)}
                  /> 
                  {type} <span className="text-gray-400 text-xs">({getFilterCount('jobType', type)})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Remote Option Filter */}
          <div className="mb-5">
            <h4 className="font-bold mb-2 text-base text-[#013362]">Remote Option</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              {['Remote', 'Hybrid', 'On-site'].map((opt) => (
                <li key={opt} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="accent-[#005193]"
                    checked={filters.remoteOption.includes(opt)}
                    onChange={() => handleFilterChange('remoteOption', opt)}
                  /> 
                  {opt} <span className="text-gray-400 text-xs">({getFilterCount('remoteOption', opt)})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Experience Level Filter */}
          <div className="mb-5">
            <h4 className="font-bold mb-2 text-base text-[#013362]">Experience Level</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              {['Junior', 'Mid', 'Senior', 'Lead'].map((level) => (
                <li key={level} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="accent-[#005193]"
                    checked={filters.experienceLevel.includes(level)}
                    onChange={() => handleFilterChange('experienceLevel', level)}
                  /> 
                  {level} <span className="text-gray-400 text-xs">({getFilterCount('experienceLevel', level)})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Education Filter */}
          <div className="mb-5">
            <h4 className="font-bold mb-2 text-base text-[#013362]">Education</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              {['Bachelor’s', 'Master’s', 'PhD'].map((edu) => (
                <li key={edu} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="accent-[#005193]"
                    checked={filters.education.includes(edu)}
                    onChange={() => handleFilterChange('education', edu)}
                  /> 
                  {edu} <span className="text-gray-400 text-xs">({getFilterCount('education', edu)})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Salary Range Filter */}
          <div className="mb-5">
            <h4 className="font-bold mb-2 text-base text-[#013362]">Salary Range</h4>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    name="minSalary"
                    placeholder="Min" 
                    value={filters.minSalary}
                    onChange={handleSalaryChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] outline-none"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="number" 
                    name="maxSalary"
                    placeholder="Max" 
                    value={filters.maxSalary}
                    onChange={handleSalaryChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] outline-none"
                />
            </div>
          </div>
        </aside>

        {/* Job Listings */}
        <main className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-blue-100 shadow p-6 hover:shadow-lg transition flex flex-col gap-2"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-2xl text-[#013362] leading-tight mb-2">{job.title}</h4>
                  <span className="inline-block mt-1 bg-white border border-blue-200 text-[#005193] text-sm font-extrabold rounded-full px-4 py-1.5 tracking-wide shadow-sm transition-all">{job.company}</span>
                </div>
                
                {/* Match Score Badge */}
                {job.match_score !== undefined && job.match_score !== null && (
                    <div className={`flex flex-col items-end px-3 py-1 rounded-lg border ${
                        job.match_score >= 80 ? "bg-green-50 border-green-200 text-green-700" :
                        job.match_score >= 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                        "bg-red-50 border-red-200 text-red-700"
                    }`}>
                        <span className="text-xl font-bold">{Math.round(job.match_score)}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Match</span>
                    </div>
                )}
              </div>

              {/* Job Detail Tags (Gray) */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">
                    {formatSalary(job.salary, job.type)}
                </span>
                {job.type && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">{job.type}</span>}
                {job.location && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">{job.location}</span>}
                {job.experience_level && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">{job.experience_level}</span>}
                {job.education && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">{job.education}</span>}
              </div>

              {/* Skill Tags (Blue) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(Array.isArray(job.tags) ? job.tags : typeof job.tags === 'string' ? job.tags.split(',').map(t => t.trim()).filter(Boolean) : []).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-1 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-2 items-end sm:items-center">
                <button
                  className="px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 text-[#005193] hover:underline bg-transparent border-none shadow-none transition"
                  onClick={() => onViewJob(job)} 
                >
                  View Details
                </button>
                <button
                  className={`px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 text-white shadow-lg transition ${
                    appliedJobIds.has(job.id) 
                      ? "bg-green-600 cursor-default opacity-80" 
                      : "bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-90"
                  }`}
                  onClick={() => !appliedJobIds.has(job.id) && handleApply(job.id)}
                  disabled={applyingId === job.id || appliedJobIds.has(job.id)}
                >
                  {applyingId === job.id 
                    ? 'Applying...' 
                    : appliedJobIds.has(job.id) 
                      ? 'Applied' 
                      : 'Apply Now'}
                </button>
                {status.msg && (
                  <div
                    style={{
                      position: 'fixed',
                      left: '50%',
                      bottom: 40,
                      transform: 'translateX(-50%)',
                      zIndex: 1000,
                      minWidth: 200,
                      padding: '12px 32px',
                      borderRadius: 9999,
                      fontWeight: 600,
                      textAlign: 'center',
                      background: status.type === 'success'
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : status.type === 'error'
                        ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
                        : 'linear-gradient(90deg, #60a5fa, #6366f1)',
                      color: '#fff',
                      boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
                      fontSize: 16,
                    }}
                  >
                    {status.msg}
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default JobSearch;