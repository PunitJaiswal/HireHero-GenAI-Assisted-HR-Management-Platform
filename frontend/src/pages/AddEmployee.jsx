import React, { useState, useEffect } from "react";
import axios from "axios";
import { createEmployee, axiosAuth, updateApplicationStatus, getDepartments } from "../services/api";
import { getProfileByUserId } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarHR from "../components/SidebarHR";
import TopNavbarHR from "../components/TopNavbarHR";
import { Users, Briefcase, FileText, BarChart2 } from "lucide-react";

const AddEmployee = () => {
  const navigate = useNavigate(); 
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("addEmployee"); 
  
  const [status, setStatus] = useState({ message: "", type: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    employmentType: "",
    salary: "",
    manager: "",
    startDate: "",
    photo: null,
    photoUrl: "",
    locationType: "",
    specificLocation: ""
  });

  const [selectedUserId, setSelectedUserId] = useState("");
  const [applicationId, setApplicationId] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const showPill = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), 3000);
  };

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      if(location.state.activeTab === 'addEmployee') {
          setActiveTab("addEmployee");
      } else {
          navigate("/dashboard-hr", { state: { activeTab: location.state.activeTab } });
      }
    }
    
    if (location.state && location.state.candidate_id) {
      setActiveTab("addEmployee"); 
      setSelectedUserId(String(location.state.candidate_id));
      if (location.state.application_id) {
        setApplicationId(location.state.application_id);
      }
      
      setFormData(prev => ({
        ...prev,
        jobTitle: location.state.job_title || "",
        department: location.state.department || "",
        salary: location.state.salary || "",
        employmentType: location.state.employment_type || "",
        locationType: location.state.location_type || "",
        specificLocation: location.state.specific_location || ""
      }));
    }
  }, [location.state, navigate]);

  useEffect(() => {
    getDepartments()
      .then(data => setDepartmentOptions(data))
      .catch(err => console.error("Failed to fetch departments", err));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      getProfileByUserId(selectedUserId).then(profile => {
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          photo: null, 
          photoUrl: profile.profile_pic_url || profile.profile_pic || ""
        }));
      });
    } else {
        setFormData(prev => ({ ...prev, photoUrl: "" }));
    }
  }, [selectedUserId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "photo") {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
    } else if (name === "phone" || name === "salary") {
      // Restriction: Allow only numbers
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // --- VALIDATION START ---
    
    // 1. Mandatory Fields Check
    if (!selectedUserId) {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            showPill("Please fill in all personal information fields.", "error");
            return;
        }
    }

    // Include employmentType in validation
    if (!formData.jobTitle || !formData.department || !formData.employmentType || !formData.startDate || !formData.locationType || !formData.salary) {
        showPill("Please fill in all job details.", "error");
        return;
    }

    if ((formData.locationType === "On-site" || formData.locationType === "Hybrid") && !formData.specificLocation.trim()) {
        showPill("Please specify the location name.", "error");
        return;
    }

    // 2. Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showPill("Please enter a valid email address.", "error");
        return;
    }

    // 3. Phone Number Validation
    if (formData.phone.length < 10) {
        showPill("Please enter a valid phone number (at least 10 digits).", "error");
        return;
    }

    // --- VALIDATION END ---

    try {
      let photoPath = formData.photoUrl || "";
      if (formData.photo) {
        const uploadData = new FormData();
        const baseName = formData.email || (formData.firstName + formData.lastName) || "employee";
        const ext = formData.photo.name.split('.').pop();
        const filename = `employee_${baseName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.${ext}`;
        uploadData.append("photo", formData.photo, filename);
        const uploadRes = await axiosAuth.post("/hr/employees/upload_photo", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoPath = uploadRes.data.photo;
      }

      let finalLocation = "Remote";
      if (formData.locationType === "On-site") {
          finalLocation = formData.specificLocation;
      } else if (formData.locationType === "Hybrid") {
          finalLocation = `Hybrid (${formData.specificLocation})`;
      }

      let payload = {
        job_title: formData.jobTitle,
        department: formData.department,
        employment_type: formData.employmentType, // Send Job Type
        manager: formData.manager,
        start_date: formData.startDate,
        photo: photoPath,
        job_location: finalLocation,
        salary: formData.salary
      };

      if (selectedUserId) {
        payload.user_id = selectedUserId;
      } else {
        payload.first_name = formData.firstName;
        payload.last_name = formData.lastName;
        payload.email = formData.email;
        payload.phone = formData.phone;
      }

      await createEmployee(payload);

      if (applicationId) {
        try {
          await updateApplicationStatus(applicationId, 'hired');
        } catch (statusErr) {
          console.error("Failed to update status", statusErr);
        }
      }

      showPill("Employee added successfully!", "success");
      
      // Clear Form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
        employmentType: "",
        salary: "",
        manager: "",
        startDate: "",
        photo: null,
        photoUrl: "",
        locationType: "",
        specificLocation: ""
      });
      setSelectedUserId("");
      setApplicationId(null);

      // Redirect after 1 second
      setTimeout(() => {
        navigate("/dashboard-hr", { state: { activeTab: "employees" } });
      }, 1000);
      
    } catch (err) {
      showPill("Failed to add employee. Please try again.", "error");
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      department: "",
      employmentType: "",
      salary: "",
      manager: "",
      startDate: "",
      photo: null,
      photoUrl: "",
      locationType: "",
      specificLocation: ""
    });
    setSelectedUserId("");
    setApplicationId(null);
  };

  const tabConfig = [
    { tab: "dashboard", icon: BarChart2 },
    { tab: "employees", icon: Users },
    { tab: "recruitment", icon: Briefcase },
    { tab: "performance", icon: FileText },
    { tab: "analytics", icon: BarChart2 },
  ];

  const handleTabClick = (tab) => {
    navigate("/dashboard-hr", { state: { activeTab: tab } });
  };

  const getPhotoSrc = () => {
    if (formData.photo) {
      return URL.createObjectURL(formData.photo);
    }
    if (formData.photoUrl) {
      if (formData.photoUrl.startsWith("http")) {
        return formData.photoUrl;
      }
      return `http://localhost:5000/api${formData.photoUrl}`;
    }
    return null;
  };

  // Helper to determine if fields should be disabled (Autofill mode)
  const isAutofillMode = !!selectedUserId;

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
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce ${
                status.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {status.message}
            </div>
        )}

        <div className="p-8 flex flex-col gap-6">
          {activeTab === "addEmployee" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-[#013362]">Add New Employee</h2>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 shadow-md hover:opacity-90"
                  >
                    Clear Form
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#013362] to-[#005193] text-white shadow-md hover:opacity-90"
                  >
                    Save Employee
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleSave}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-inner w-full"
              >
                <div className="grid md:grid-cols-3 gap-6 items-start mb-8">
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                    {selectedUserId && (
                      <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100">
                        <strong>Note:</strong> You are adding a registered candidate as an employee. Personal details are locked.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isAutofillMode} />
                      <InputField label="Last Name *" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isAutofillMode} />
                      <InputField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isAutofillMode} />
                      <InputField label="Phone *" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isAutofillMode} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2">Profile Photo</h2>
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-3">
                      {getPhotoSrc() ? (
                        <img src={getPhotoSrc()} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </div>
                    <input type="file" name="photo" accept="image/*" onChange={handleChange} className="text-sm" disabled={isAutofillMode} />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Job Details</h2>
                  
                  {/* Updated Grid for Job Details: 2 columns to accommodate 4 items gracefully */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <InputField label="Job Title *" name="jobTitle" value={formData.jobTitle} onChange={handleChange} disabled={isAutofillMode} />
                    
                    {/* New Job Type Dropdown */}
                    <SelectField 
                        label="Job Type *" 
                        name="employmentType" 
                        value={formData.employmentType} 
                        onChange={handleChange} 
                        options={["Full-Time", "Part-Time", "Contract", "Internship"]} 
                    />

                    <SelectField 
                        label="Select Department *" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        options={departmentOptions} 
                        disabled={isAutofillMode}
                    />
                    
                    <InputField 
                        label="Salary *" 
                        name="salary" 
                        type="number" 
                        value={formData.salary} 
                        onChange={handleChange} 
                        placeholder="e.g. 1200000"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <SelectField 
                                label="Job Location Type *" 
                                name="locationType" 
                                value={formData.locationType} 
                                onChange={handleChange} 
                                options={["Remote", "On-site", "Hybrid"]} 
                            />
                        </div>
                        {(formData.locationType === "On-site" || formData.locationType === "Hybrid") && (
                            <div className="flex-1">
                                <InputField 
                                    label={formData.locationType === "Hybrid" ? "Office Location (Hybrid) *" : "Office Location *"} 
                                    name="specificLocation" 
                                    value={formData.specificLocation} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Bangalore"
                                />
                            </div>
                        )}
                    </div>

                    <InputField label="Start Date *" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
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

const InputField = ({ label, name, value, onChange, type = "text", placeholder, disabled = false }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full ${
        disabled ? "opacity-60 cursor-not-allowed bg-gray-200" : ""
      }`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options = [], disabled = false }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm font-medium mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full ${
        disabled ? "opacity-60 cursor-not-allowed bg-gray-200" : ""
      }`}
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

export default AddEmployee;