import React, { useState, useRef, useEffect } from "react";
import { getProfileMe, updateProfileMe, uploadProfilePic, getCurrentUser } from '../services/api';
import { Camera, Eye, Link2, MapPin, Mail, Phone, User, Save, Building } from "lucide-react";

// Adjust base URL based on environment/proxy
const API_BASE_URL = "/api"; 

const ProfileHR = () => {
  const [profile, setProfile] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    profile_pic: "",
    role: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });
  const fileInputRef = useRef();

  // Load Profile Data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const p = await getProfileMe();
        // Also fetch user details to get company_name
        const user = await getCurrentUser();
        
        setProfile({
          user_id: p.user_id,
          first_name: p.first_name,
          last_name: p.last_name,
          full_name: p.full_name || `${p.first_name} ${p.last_name}`,
          company_name: user.company_name || "",
          email: p.email,
          phone: p.phone || "",
          location: p.location || "",
          summary: p.summary || "",
          profile_pic: p.profile_pic_url || p.profile_pic || "",
          role: p.role === 'hr' ? 'HR Professional' : p.role
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setStatus({ msg: 'Failed to load profile.', type: 'error' });
      }
    }
    fetchProfile();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Save Profile Changes
  const handleSave = async () => {
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      // Sending null as userId allows backend to identify user via token
      await updateProfileMe(null, { 
        phone: profile.phone,
        location: profile.location,
        summary: profile.summary,
        company_name: profile.company_name // Send company_name to be updated
      });
      setStatus({ msg: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatus({ msg: 'Failed to update profile.', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  // Handle Profile Picture Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadProfilePic(null, file);
      // Update local state with new URL
      setProfile(prev => ({ ...prev, profile_pic: res.profile_pic_url }));
      setStatus({ msg: 'Profile photo updated!', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatus({ msg: 'Failed to upload photo.', type: 'error' });
    }
    setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
  };

  // Preview Public Profile
  const handlePreview = () => {
    if (profile.user_id) {
        window.open(`/profile/${profile.user_id}`, '_blank');
    }
  };

  // Share Profile Link
  const handleShare = () => {
    if (profile.user_id) {
        const url = `${window.location.origin}/profile/${profile.user_id}`;
        navigator.clipboard.writeText(url);
        setStatus({ msg: 'Public link copied to clipboard!', type: 'success' });
        setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
    }
  };

  return (
    <div className="font-inter relative">
        
      {/* Pill Notification - Fixed Layout & Centering */}
      {status.msg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100]">
            <div className={`px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce ${
                status.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {status.msg}
            </div>
        </div>
      )}

      {/* Main Content - Wrapped to prevent space-y shift */}
      <div className="space-y-8">
          {/* Header */}
          <h1 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
            <User className="h-6 w-6 text-[#005193]" /> My Profile
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Photo & Actions */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4 group">
                        {profile.profile_pic ? (
                            <img 
                                src={profile.profile_pic.startsWith("http") ? profile.profile_pic : `${API_BASE_URL}${profile.profile_pic}`} 
                                alt="Profile" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-blue-50 shadow-md"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-[#005193] border-4 border-blue-50">
                                {profile.first_name?.[0]}
                            </div>
                        )}
                        
                        {/* Camera Overlay */}
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="absolute bottom-0 right-0 bg-[#005193] text-white p-2 rounded-full shadow-lg hover:bg-[#013362] transition transform hover:scale-105"
                            title="Change Photo"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                        />
                    </div>

                    <h2 className="text-xl font-bold text-[#013362]">{profile.full_name}</h2>
                    <p className="text-sm text-gray-500 font-medium mb-1">{profile.role}</p>
                    {profile.company_name && (
                        <p className="text-sm text-[#005193] font-semibold mb-1">{profile.company_name}</p>
                    )}
                    {profile.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" /> {profile.location}
                        </div>
                    )}
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-[#013362] uppercase tracking-wide mb-4">Profile Actions</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={handlePreview}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition"
                        >
                            <div className="bg-blue-100 p-2 rounded-lg text-[#005193]"><Eye className="w-4 h-4" /></div>
                            Preview Public Profile
                        </button>
                        <button 
                            onClick={handleShare}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition"
                        >
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-700"><Link2 className="w-4 h-4" /></div>
                            Share Profile Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-[#013362]">Edit Information</h3>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-[#005193] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">First Name</label>
                                <input 
                                    type="text" 
                                    value={profile.first_name} 
                                    disabled 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                                <input 
                                    type="text" 
                                    value={profile.last_name} 
                                    disabled 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm"
                                />
                            </div>
                        </div>

                        {/* Company Name Field */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Company Name</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="company_name"
                                    value={profile.company_name} 
                                    onChange={handleChange}
                                    placeholder="Enter company name"
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="email" 
                                        value={profile.email} 
                                        disabled 
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
                                        name="phone"
                                        value={profile.phone} 
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="location"
                                    value={profile.location} 
                                    onChange={handleChange}
                                    placeholder="e.g. Bangalore, India"
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Professional Summary</label>
                            <textarea 
                                name="summary"
                                value={profile.summary}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Briefly describe your role and expertise..."
                                className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none transition resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProfileHR;