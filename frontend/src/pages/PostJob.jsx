import React, { useState, useEffect } from "react";
import { createJob, getDepartments, getCurrentUser, axiosAuth } from "../services/api";
import { useNavigate } from "react-router-dom";
import SidebarHR from "../components/SidebarHR";
import TopNavbarHR from "../components/TopNavbarHR";
import { Wallet, BarChart2, Users, Briefcase, FileText, Sparkles, Loader } from "lucide-react";

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    department: "",
    type: "",
    location: "",
    remote_option: "",
    description: "",
    requiredSkills: [],
    skillInput: "",
    experience_level: "",
    education: "",
    benefits: [],
    application_deadline: "",
    enableAIScreening: false,
  });

  const [salaryMode, setSalaryMode] = useState("fixed"); // fixed, undisclosed, negotiable
  const [salaryAmount, setSalaryAmount] = useState("");
  
  const [status, setStatus] = useState({ message: "", type: "" }); 
  const [generatingJD, setGeneratingJD] = useState(false);

  // Removed "Remote Work" from benefits options
  const benefitsOptions = ["Health Insurance", "Paid Leave"];
  const [departments, setDepartments] = useState([]);

  // Fetch Departments
  useEffect(() => {
    async function fetchDepts() {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    }
    fetchDepts();
  }, []);

  // Fetch Current User (HR) Info to pre-fill Company Name
  useEffect(() => {
    async function fetchUserInfo() {
        try {
            const user = await getCurrentUser();
            if (user && user.company_name) {
                setFormData(prev => ({ ...prev, company: user.company_name }));
            }
        } catch (err) {
            console.error("Failed to fetch user info", err);
        }
    }
    fetchUserInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox" && benefitsOptions.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        benefits: checked
          ? [...prev.benefits, value]
          : prev.benefits.filter((b) => b !== value),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "remote_option") {
      // Logic for Remote Option changes
      if (value === "Remote") {
        // If Remote is selected, auto-fill location
        setFormData((prev) => ({ ...prev, [name]: value, location: "Remote" }));
      } else {
        // If switching to Hybrid or On-site, reset location to blank
        setFormData((prev) => ({ ...prev, [name]: value, location: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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

  const navigate = useNavigate();

  const showPill = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), 3000);
  };

  const handleGenerateJD = async () => {
    if (!formData.title || !formData.department || !formData.experience_level) {
      showPill("Please fill in Job Title, Department and Experience mandatorily to generate. Add education and skills for better response.", "error");
      return;
    }

    setGeneratingJD(true);
    try {
      const res = await axiosAuth.post('/gen-ai/generate-jd', {
        title: formData.title,
        department: formData.department,
        company_name: formData.company,
        skills: formData.requiredSkills,
        experience: formData.experience_level,
        education: formData.education
      });

      const data = res.data;
      let formattedDesc = data.generated_description || "";

      if (data.generated_responsibilities && data.generated_responsibilities.length > 0) {
        formattedDesc += "\n\nKey Responsibilities:\n" + data.generated_responsibilities.map(r => `• ${r}`).join("\n");
      }

      if (data.generated_qualifications && data.generated_qualifications.length > 0) {
        formattedDesc += "\n\nQualifications:\n" + data.generated_qualifications.map(q => `• ${q}`).join("\n");
      }

      setFormData(prev => ({ ...prev, description: formattedDesc }));
      showPill("Description generated with AI!", "success");
    } catch (err) {
      console.error(err);
      showPill("Failed to generate description. Please try again.", "error");
    }
    setGeneratingJD(false);
  };

  const handlePublish = async () => {
    const requiredFields = ['title', 'company', 'department', 'type', 'location', 'description', 'experience_level'];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        showPill(`Please fill in the ${field.replace('_', ' ')}`, "error");
        return;
      }
    }

    if (salaryMode === 'fixed' && !salaryAmount) {
        showPill("Please enter a salary amount.", "error");
        return;
    }

    let finalSalary = "Undisclosed";
    if (salaryMode === 'fixed') {
        finalSalary = salaryAmount;
    } else if (salaryMode === 'negotiable') {
        finalSalary = "Negotiable";
    }

    const payload = { 
        ...formData,
        salary: finalSalary
    };
    delete payload.skillInput;

    try {
      await createJob(payload);
      showPill("Job published successfully!", "success");
      setTimeout(() => {
        navigate("/dashboard-hr", { state: { activeTab: "recruitment" } });
      }, 1000);
    } catch (err) {
      showPill("Failed to publish job. Please try again.", "error");
    }
  };

  const tabConfig = [
    { tab: "dashboard", icon: BarChart2 },
    { tab: "employees", icon: Users },
    { tab: "recruitment", icon: Briefcase },
    { tab: "performance", icon: FileText },
    { tab: "analytics", icon: BarChart2 },
  ];
  const [activeTab, setActiveTab] = useState("postJob");

  // UPDATED: Navigation logic
  const handleTabClick = (tab) => {
    navigate("/dashboard-hr", { state: { activeTab: tab } });
  };

  return (
    <section className="min-h-screen flex bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] font-inter">
      <SidebarHR />
      <main className="flex-1 flex flex-col relative">
        <TopNavbarHR
          activeTab={activeTab}
          setActiveTab={handleTabClick}
          tabConfig={tabConfig}
        />
        
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

        <div className="p-8 flex flex-col gap-6">
          {/* Removed conditional renders for other tabs */}
          
          {activeTab === "postJob" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-[#013362]">Post New Job</h2>
                <div className="flex gap-3">
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-[#013362] to-[#005193] text-white shadow-md hover:opacity-90 transition-all transform hover:scale-105"
                  >
                    Publish Job
                  </button>
                </div>
              </div>

              <form className="grid lg:grid-cols-3 gap-6 w-full">
                {/* Left Side */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* Job Info */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-inner">
                    <h2 className="text-lg font-semibold mb-4">Job Information</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="Job Title *" name="title" value={formData.title} onChange={handleChange} />
                      
                      {/* Updated Company Name Input: Disabled */}
                      <Input 
                        label="Company Name *" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleChange} 
                        disabled={true} 
                      />
                      
                      <Select label="Select Department *" name="department" value={formData.department} onChange={handleChange} options={departments} />
                      <Select label="Employment Type *" name="type" value={formData.type} onChange={handleChange} options={["Full-Time", "Part-Time", "Contract", "Internship"]} />
                      <Select label="Remote Option *" name="remote_option" value={formData.remote_option} onChange={handleChange} options={["Remote", "Hybrid", "On-site"]} />
                      <Input 
                        label="Location *" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        disabled={formData.remote_option === "Remote"}
                      />
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium mb-1 block">Description *</label>
                      <textarea name="description" value={formData.description} onChange={handleChange} rows="8" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                      <button
                        type="button"
                        onClick={handleGenerateJD}
                        disabled={generatingJD}
                        className="mt-2 text-xs font-bold text-[#005193] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {generatingJD ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {generatingJD ? "Generating..." : "Generate with AI"}
                      </button>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-inner">
                    <h2 className="text-lg font-semibold mb-4">Requirements & Qualifications</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Required Skills</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.requiredSkills.map((skill, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 text-sm">
                              {skill}
                              <button type="button" className="ml-1 text-red-500 hover:text-red-700 font-bold" onClick={() => handleRemoveSkill(skill)}>&times;</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          name="skillInput"
                          value={formData.skillInput}
                          onChange={handleSkillInputChange}
                          onKeyDown={handleSkillInputKeyDown}
                          placeholder="Type a skill and press Enter"
                          className="p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Select label="Experience Level *" name="experience_level" value={formData.experience_level} onChange={handleChange} options={["Junior", "Mid", "Senior", "Lead"]} />
                      <Select label="Education" name="education" value={formData.education} onChange={handleChange} options={["Bachelor’s", "Master’s", "PhD"]} />
                    </div>
                  </div>

                  {/* Compensation */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-inner">
                    <h2 className="text-lg font-semibold mb-4">Compensation & Benefits</h2>
                    
                    {/* Salary Section */}
                    <div className="mb-6">
                        <label className="text-sm font-medium mb-2 block">Salary</label>
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="salaryMode" 
                                    value="fixed" 
                                    checked={salaryMode === "fixed"} 
                                    onChange={(e) => setSalaryMode(e.target.value)} 
                                />
                                Specific Amount
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="salaryMode" 
                                    value="negotiable" 
                                    checked={salaryMode === "negotiable"} 
                                    onChange={(e) => setSalaryMode(e.target.value)} 
                                />
                                Negotiable
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="salaryMode" 
                                    value="undisclosed" 
                                    checked={salaryMode === "undisclosed"} 
                                    onChange={(e) => setSalaryMode(e.target.value)} 
                                />
                                Undisclosed
                            </label>
                        </div>

                        {salaryMode === "fixed" && (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    placeholder="e.g. 50000" 
                                    value={salaryAmount} 
                                    onChange={(e) => setSalaryAmount(e.target.value)} 
                                    className="p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 w-48"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Benefits</label>
                      <div className="flex gap-6">
                        {benefitsOptions.map((b) => (
                          <label key={b} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" value={b} checked={formData.benefits.includes(b)} onChange={handleChange} />
                            {b}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col gap-6">
                  <div className="sticky top-28">
                    {/* Job Posting Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-inner mb-6">
                      <h2 className="text-lg font-semibold mb-4">Job Posting Settings</h2>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-sm font-medium block mb-1">Application Deadline</label>
                          <input type="date" name="application_deadline" value={formData.application_deadline} onChange={handleChange} className="w-full p-2 border rounded-xl" />
                        </div>
                        {/* <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="enableAIScreening" checked={formData.enableAIScreening} onChange={handleChange} />
                          Enable AI screening
                        </label> */}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </section>
  );
};

const Input = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 ${
        disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
      }`}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default PostJob;