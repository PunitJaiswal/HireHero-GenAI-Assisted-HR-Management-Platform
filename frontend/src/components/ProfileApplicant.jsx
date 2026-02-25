const BACKEND_BASE = "/api"; // Adjusted to relative path for proxy
import React, { useState, useRef, useEffect } from "react";
import { getProfileMe, updateProfileMe, uploadResume, uploadProfilePic, addExperience } from '../services/api';
import { addEducation, deleteEducation, deleteExperience } from '../services/api';
import { BookOpen, Trash2 } from "lucide-react";
import { Camera, Eye, Download, Link2, Plus, X, User, Mail, Phone, MapPin, Save } from "lucide-react";
import TopNavbarApplicant from "../components/TopNavbarApplicant";

const ProfileApplicant = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profilePic, setProfilePic] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef();
  const [profile, setProfile] = useState({
    fullName: "",
    role: "",
    location: "",
    email: "",
    phone: "",
    summary: "",
    completeness: 0,
    experiences: [],
    educations: [],
  });

  const [showEduModal, setShowEduModal] = useState(false);
  const [newEdu, setNewEdu] = useState({
      degree: "",
      institution: "",
      start_date: "",
      end_date: "",
      description: ""
  });

  const [showExpModal, setShowExpModal] = useState(false);
  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    start_date: "",
    end_date: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  // Use display_user_id for profile API, numeric user_id for backend
  const userId = localStorage.getItem('display_user_id') || '1';
  const [status, setStatus] = useState({ msg: '', type: '' });

  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    // Check if valid date
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const p = await getProfileMe(userId);
        let fullName = p.full_name || ((p.first_name || '') + ' ' + (p.last_name || '')).trim();
        let username = p.first_name + p.phone.slice(-3);
        setProfile({
          user_id: p.user_id,
          fullName,
          username: username || '',
          role: p.role || '',
          location: p.location || '',
          email: p.email || '',
          phone: p.phone || '',
          summary: p.summary || '',
          completeness: p.completeness || 0,
          experiences: p.experiences || [],
          educations: p.educations || [],
          profile_pic: p.profile_pic || '',
          resume: p.resume || '',
        });
      } catch {
        setStatus({ msg: 'Could not load profile.', type: 'error' });
      }
    }
    fetchProfile();
  }, [userId]);

  const handlePreviewProfile = () => {
    if (!profile.user_id) {
        setStatus({ msg: 'User ID missing. Save profile first.', type: 'error' });
        return;
    }
    const url = `${window.location.origin}/profile/${profile.user_id}`;
    
    // Open in a new tab ('_blank')
    window.open(url, '_blank');
  };

  const handleShareProfile = () => {
    if (!profile.user_id) {
        setStatus({ msg: 'User ID missing. Save profile first.', type: 'error' });
        return;
    }
    
    const url = `${window.location.origin}/profile/${profile.user_id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setStatus({ msg: 'Public profile link copied to clipboard!', type: 'success' });
      setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
    }).catch(() => {
      setStatus({ msg: 'Failed to copy link.', type: 'error' });
    });
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const response = await updateProfileMe(userId, {
        location: profile.location,
        phone: profile.phone,
        summary: profile.summary
      });
      if (response && typeof response.completeness === 'number') {
        setProfile(prev => ({
          ...prev,
          completeness: response.completeness
        }));
      }
      setStatus({ msg: 'Changes saved successfully!', type: 'success' });
    } catch (error){
      console.error("Save failed:", error);
      setStatus({ msg: 'Failed to save changes.', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      try {
        const res = await uploadProfilePic(userId, file);
        if (res && typeof res.completeness === 'number') {
            setProfile(prev => ({ ...prev, completeness: res.completeness, profile_pic: res.profile_pic_url }));
        }
        setStatus({ msg: 'Profile picture uploaded!', type: 'success' });
      } catch {
        setStatus({ msg: 'Failed to upload profile picture.', type: 'error' });
      }
      setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      try {
        const res = await uploadResume(userId, file);
        if (res && typeof res.completeness === 'number') {
            setProfile(prev => ({ ...prev, completeness: res.completeness, resume: res.resume_url }));
        }
        setStatus({ msg: 'Resume uploaded successfully!', type: 'success' });
      } catch {
        setStatus({ msg: 'Failed to upload resume.', type: 'error' });
      }
      setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
        await addEducation(newEdu);
        setStatus({ msg: 'Education added!', type: 'success' });
        setShowEduModal(false);
        setNewEdu({ degree: "", institution: "", start_date: "", end_date: "", description: "" });
        const p = await getProfileMe(userId);
        setProfile(prev => ({ ...prev, educations: p.educations || [], completeness: p.completeness }));
    } catch {
        setStatus({ msg: 'Failed to add education.', type: 'error' });
    }
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
};

const handleDeleteEducation = async (id) => {
    if(!confirm("Delete this education entry?")) return;
    try {
        await deleteEducation(id);
        const p = await getProfileMe(userId);
        setProfile(prev => ({ ...prev, educations: p.educations || [], completeness: p.completeness }));
        setStatus({ msg: 'Education deleted.', type: 'success' });
    } catch {
        setStatus({ msg: 'Failed to delete education.', type: 'error' });
    }
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
};

  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      await addExperience(newExp);
      setStatus({ msg: 'Experience added!', type: 'success' });
      setShowExpModal(false);
      setNewExp({ title: "", company: "", start_date: "", end_date: "", description: "" });
      const p = await getProfileMe(userId);
      setProfile(prev => ({ ...prev, experiences: p.experiences || [], completeness: p.completeness }));
    } catch {
      setStatus({ msg: 'Failed to add experience.', type: 'error' });
    }
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  const handleDeleteExperience = async (id) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;
    try {
      await deleteExperience(id);
      setStatus({ msg: 'Experience deleted!', type: 'success' });
      const p = await getProfileMe(userId);
      setProfile(prev => ({ ...prev, experiences: p.experiences || [], completeness: p.completeness }));
    } catch {
      setStatus({ msg: 'Failed to delete experience.', type: 'error' });
    }
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  return (
    <div className="text-[#013362] font-inter w-full">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">My Profile</h1>
      
      {status.msg && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce ${
            status.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="bg-white/90 p-7 rounded-2xl shadow border border-blue-100 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-3 group">
                {profilePic ? (
                  <img
                    src={URL.createObjectURL(profilePic)}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow"
                  />
                ) : profile.profile_pic ? (
                  <img
                    src={profile.profile_pic.startsWith('http') ? profile.profile_pic : `${BACKEND_BASE}${profile.profile_pic}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center text-4xl font-semibold text-blue-600">
                    {profile.fullName?.[0]}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-1 right-1 bg-gradient-to-r from-[#005193] to-[#2563eb] text-white rounded-full p-1.5 shadow hover:opacity-90 transition transform hover:scale-105"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Change profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </div>
              <h2 className="font-extrabold text-xl text-[#013362]">@{profile.username}</h2>
              <p className="text-sm text-gray-600 font-medium">{profile.role === 'candidate' ? 'Job Seeker' : profile.role}</p>
              
              {profile.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-left text-gray-500">Profile completeness</span>
                  <span className="text-xs font-semibold text-[#005193]">{profile.completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#005193] to-[#013362] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profile.completeness}%` }}
                  ></div>
                </div>
              </div>

              <label className="mt-5 bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-90 text-white px-6 py-2 rounded-md text-sm font-semibold shadow-lg transition cursor-pointer flex items-center gap-2">
                <Download className="w-4 h-4" /> Upload Resume
                <input type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
              </label>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 p-6 rounded-2xl shadow border border-blue-100">
              <h3 className="font-semibold text-xl mb-4 text-[#013362]">Quick Actions</h3>
              <ul className="space-y-3 text-base text-[#013362]">
                <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer font-semibold" onClick={handlePreviewProfile}>
                  <Eye className="w-5 h-5" /> Preview Public Profile
                </li>
                {profile.resume && (
                  <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer font-semibold">
                    <Download className="w-5 h-5" />
                    <a href={profile.resume.startsWith('http') ? profile.resume : `${BACKEND_BASE}${profile.resume}`} target="_blank" rel="noopener noreferrer">Download Resume</a>
                  </li>
                )}
                <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer font-semibold" onClick={handleShareProfile}>
                  <Link2 className="w-5 h-5" /> Share Profile
                </li>
              </ul>
            </div>
          </div>

          {/* ---------- RIGHT COLUMN ---------- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info */}
            <div className="bg-white/90 p-8 rounded-2xl shadow border border-blue-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-[#013362]">Personal Information</h3>
                <button 
                  onClick={handleSaveChanges} 
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#005193] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:bg-[#013362] transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={profile.fullName} 
                        readOnly 
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="email" 
                        value={profile.email} 
                        readOnly 
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={profile.phone}
                        onChange={e => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                        placeholder="+1 234 567 890"
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#013362] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={profile.location}
                        onChange={e => handleInputChange('location', e.target.value)}
                        placeholder="e.g. New York, USA"
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#013362] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <label className="text-sm font-semibold text-gray-700">Professional Summary</label>
                <textarea
                  rows="4"
                  value={profile.summary}
                  placeholder="Briefly describe your professional background..."
                  className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#013362] focus:border-transparent outline-none transition resize-none"
                  onChange={e => handleInputChange('summary', e.target.value)}
                ></textarea>
              </div>
            </div>
            
            {/* Education */}
            <div className="bg-white/90 p-8 rounded-2xl shadow border border-blue-100">
              <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#013362]">Education Background</h3>
              <button 
                  onClick={() => setShowEduModal(true)}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-90 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition"
              >
                  <Plus className="w-4 h-4" /> Add Education
              </button>
              </div>
              <div className="space-y-5">
              {profile.educations.map((edu, idx) => (
                  <div
                  key={idx}
                  className="bg-white border border-blue-100 rounded-xl px-5 py-4 hover:bg-[#F7F8FF] transition relative group"
                  >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteEducation(edu.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-full transition">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="flex flex-wrap justify-between items-center">
                      <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold rounded-lg">
                          <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                          <h4 className="font-bold text-[#013362]">{edu.degree}</h4>
                          <p className="text-sm text-gray-500 font-medium">{edu.institution}</p>
                      </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 md:mt-0 font-medium bg-gray-100 px-2 py-1 rounded">{formatDate(edu.start_date)} - {formatDate(edu.end_date)}</p>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed">{edu.description}</p>
                  </div>
              ))}
              {profile.educations.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">No education details added yet.</p>}
              </div>
            </div>

            {/* Work Experience */}
            <div className="bg-white/90 p-8 rounded-2xl shadow border border-blue-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#013362]">Work Experience</h3>
                <button 
                  onClick={() => setShowExpModal(true)}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#005193] to-[#013362] hover:opacity-90 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition"
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>
              <div className="space-y-5">
                {profile.experiences.map((exp, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-blue-100 rounded-xl px-5 py-4 hover:bg-[#F7F8FF] transition relative group"
                  >
                    <button 
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1.5 rounded-full"
                        title="Delete Experience"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex flex-wrap justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center font-semibold rounded-lg text-lg">
                          {exp.company?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#013362]">{exp.title}</h4>
                          <p className="text-sm text-gray-500 font-medium">{exp.company}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 md:mt-0 font-medium bg-gray-100 px-2 py-1 rounded">{formatDate(exp.start_date)} - {formatDate(exp.end_date)}</p>
                    </div>

                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">{exp.description}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {(exp.tags || []).map((tag, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {profile.experiences.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">No work experience added yet.</p>}
              </div>
            </div>
          </div>
      </div>
      {showEduModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-[#013362]">Add Education</h3>
                    <button onClick={() => setShowEduModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleAddEducation} className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Degree / Title</label>
                        <input required type="text" placeholder="e.g. Bachelor of Science" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            value={newEdu.degree} onChange={e => setNewEdu({...newEdu, degree: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Institution</label>
                        <input required type="text" placeholder="e.g. IIT Madras" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            value={newEdu.institution} onChange={e => setNewEdu({...newEdu, institution: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Start Date</label>
                            <input required type="date" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                                value={newEdu.start_date} onChange={e => setNewEdu({...newEdu, start_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">End Date</label>
                            <input type="date" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                                value={newEdu.end_date} onChange={e => setNewEdu({...newEdu, end_date: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                        <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none resize-none" rows="3"
                            placeholder="Major, Honors, etc."
                            value={newEdu.description} onChange={e => setNewEdu({...newEdu, description: e.target.value})}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-[#005193] text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition">
                        Save Education
                    </button>
                </form>
            </div>
        </div>
      )}
      {showExpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-[#013362]">Add Work Experience</h3>
                    <button onClick={() => setShowExpModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleAddExperience} className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Job Title</label>
                        <input required type="text" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Company</label>
                        <input required type="text" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            value={newExp.company} onChange={e => setNewExp({...newExp, company: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Start Date</label>
                            <input required type="date" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                                value={newExp.start_date} onChange={e => setNewExp({...newExp, start_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">End Date</label>
                            <input type="date" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                                value={newExp.end_date} onChange={e => setNewExp({...newExp, end_date: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                        <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#005193] outline-none resize-none" rows="3"
                            value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-[#005193] text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition">
                        Add Experience
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default ProfileApplicant;