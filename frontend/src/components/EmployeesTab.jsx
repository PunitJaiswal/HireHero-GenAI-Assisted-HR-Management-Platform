import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEmployees, deleteEmployee, updateEmployee, getDepartments, addPerformanceReview } from "../services/api";
import {
  Users,
  Briefcase,
  BarChart2,
  User,
  Plus,
  X,
  ExternalLink,
  Star,
  ChevronUp,
  ChevronDown
} from "lucide-react";

const EmployeesTab = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    
    // Filters State
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [jobTypeFilter, setJobTypeFilter] = useState(""); 

    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    // Edit Modal State
    const [selectedEmp, setSelectedEmp] = useState(null); 
    const [editForm, setEditForm] = useState({});

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comments: "", date: "" });

    // Pill Message State
    const [pillMessage, setPillMessage] = useState("");
    const [pillType, setPillType] = useState(""); 

    const showPill = (message, type) => {
        setPillMessage(message);
        setPillType(type);
        setTimeout(() => {
            setPillMessage("");
            setPillType("");
        }, 3000);
    };

    // Helper: Salary Formatter
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

    // Fetch employee data
    const fetchEmployees = async () => {
      try {
        const [empData, deptData] = await Promise.all([
            getEmployees(),
            getDepartments()
        ]);
        
        setEmployees(empData);
        setFilteredEmployees(empData);
        setDepartmentOptions(deptData); 
        
        const locations = Array.from(new Set(empData.map(e => e.job_location).filter(Boolean)));
        setLocationOptions(locations);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    useEffect(() => {
      fetchEmployees();
    }, []);

    const handleDelete = async (id) => {
      if (!confirm("Are you sure you want to delete this employee?")) return;
      try {
        await deleteEmployee(id);
        showPill("Employee deleted successfully", "success");
        fetchEmployees();
      } catch (err) {
        showPill("Failed to delete employee", "error");
      }
    };

    const handleEditClick = (emp) => {
      setSelectedEmp(emp);
      setEditForm({
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        email: emp.email || "",
        phone: emp.phone || "",
        job_title: emp.job_title || "",
        department: emp.department || "",
        job_location: emp.job_location || "",
        employment_type: emp.employment_type || "",
        salary: emp.salary || "",
        hired_at: emp.hired_at ? new Date(emp.hired_at).toISOString().split('T')[0] : ""
      });
    };

    const handleSaveEdit = async () => {
      if (!selectedEmp) return;
      try {
        const payload = {
            job_title: editForm.job_title,
            department: editForm.department,
            job_location: editForm.job_location,
            employment_type: editForm.employment_type,
            salary: editForm.salary
        };
        await updateEmployee(selectedEmp.id, payload);
        setSelectedEmp(null);
        showPill("Employee details updated successfully", "success");
        fetchEmployees();
      } catch (err) {
        showPill("Failed to update employee", "error");
      }
    };

    const handleOpenReview = (emp) => {
        setReviewTarget(emp);
        setReviewForm({ rating: 5, comments: "", date: new Date().toISOString().split('T')[0] });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if(!reviewTarget) return;
        try {
            await addPerformanceReview(reviewTarget.id, reviewForm);
            setShowReviewModal(false);
            showPill("Review submitted successfully!", "success");
            fetchEmployees();
        } catch (err) {
            showPill("Failed to submit review", "error");
        }
    };

    // Sorting Handler
    const requestSort = (key) => {
      let direction = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
    };

    // Combined Filter & Sort Logic
    useEffect(() => {
      let filtered = employees.filter((emp) =>
        (emp.name || `${emp.first_name} ${emp.last_name}` || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (departmentFilter)
        filtered = filtered.filter((emp) => emp.department === departmentFilter);
      if (locationFilter)
        filtered = filtered.filter((emp) => emp.job_location === locationFilter);
      if (jobTypeFilter)
        filtered = filtered.filter((emp) => emp.employment_type === jobTypeFilter);
        
      // Sort Logic
      if (sortConfig.key) {
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch(sortConfig.key) {
                case 'name':
                    aValue = (a.first_name ? `${a.first_name} ${a.last_name}` : a.name || '').toLowerCase();
                    bValue = (b.first_name ? `${b.first_name} ${b.last_name}` : b.name || '').toLowerCase();
                    break;
                case 'salary':
                    aValue = parseFloat((a.salary || "0").toString().replace(/[^0-9.-]+/g,""));
                    bValue = parseFloat((b.salary || "0").toString().replace(/[^0-9.-]+/g,""));
                    break;
                case 'hired_at':
                    aValue = new Date(a.hired_at || 0);
                    bValue = new Date(b.hired_at || 0);
                    break;
                default:
                    aValue = (a[sortConfig.key] || "").toString().toLowerCase();
                    bValue = (b[sortConfig.key] || "").toString().toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
      }

      setFilteredEmployees(filtered);
    }, [searchTerm, departmentFilter, locationFilter, jobTypeFilter, employees, sortConfig]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30"><ChevronDown className="w-4 h-4" /></div>;
        return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    };

    const SortableHeader = ({ label, sortKey }) => (
        <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 -ml-1 rounded transition group select-none"
            onClick={() => requestSort(sortKey)}
        >
            {label}
            <SortIcon columnKey={sortKey} />
        </div>
    );

    return (
        <div className="relative">
          
          {pillMessage && (
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce ${
                pillType === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {pillMessage}
            </div>
          )}

          <div className="space-y-8">
              {/* Header Section */}
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#005193]" />
                  Employees
                </h1>
                <div className="flex justify-between gap-3">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#005193] focus:border-[#005193]"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute left-3 top-2.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
                    </svg>
                  </div>
                  <Link to="/add-employee" state={{ activeTab: "addEmployee", reset: true }} className="flex items-center gap-2 bg-[#005193] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                    <Plus className="h-4 w-4" /> Add Employee
                  </Link>
                </div>
              </div>

              {/* Stats - Maintained as Location Stats */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
                  {[
                    { label: "Total Employees", value: employees.length, icon: Users },
                    { label: "Remote Workers", value: employees.filter(e => (e.job_location || '').toLowerCase().includes('remote')).length, icon: User },
                    { label: "On-site Workers", value: employees.filter(e => {
                        const loc = (e.job_location || '').toLowerCase();
                        return !loc.includes('remote') && !loc.includes('hybrid');
                    }).length, icon: Briefcase },
                    { label: "Hybrid Workers", value: employees.filter(e => (e.job_location || '').toLowerCase().includes('hybrid')).length, icon: BarChart2 },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center hover:shadow-md transition flex flex-col items-center"
                    >
                      <stat.icon className="h-6 w-6 mb-1 text-[#005193]" />
                      <h3 className="text-xl font-extrabold text-[#013362]">{stat.value}</h3>
                      <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Directory */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#013362] flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#005193]" /> Employee Directory
                  </h2>
                  <div className="flex justify-end items-center">
                    <div className="flex gap-2">
                      {/* Job Type Filter */}
                      <select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#005193] focus:border-[#005193]"
                      >
                        <option value="">All Job Types</option>
                        {["Full-Time", "Part-Time", "Contract", "Internship"].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>

                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#005193] focus:border-[#005193]"
                      >
                        <option value="">All Departments</option>
                        {departmentOptions.map((dept, i) => (
                          <option key={i} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#005193] focus:border-[#005193]"
                      >
                        <option value="">All Locations</option>
                        {locationOptions.map((loc, i) => (
                          <option key={i} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table Header with Sorting */}
                <div className="grid grid-cols-8 text-sm font-semibold text-[#013362] border-b border-gray-200 pb-2 items-center">
                  <SortableHeader label="Employee" sortKey="name" />
                  <SortableHeader label="Department" sortKey="department" />
                  <SortableHeader label="Location" sortKey="job_location" />
                  <SortableHeader label="Job Type" sortKey="employment_type" />
                  <SortableHeader label="Start Date" sortKey="hired_at" />
                  <SortableHeader label="Job Title" sortKey="job_title" />
                  <SortableHeader label="Salary" sortKey="salary" />
                  <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-100 mt-2">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-8 items-center text-sm py-1.5 hover:bg-[#F7F8FF] transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#005193] font-bold text-xs">
                            {emp.first_name ? emp.first_name[0] : (emp.name ? emp.name[0] : 'U')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{emp.first_name ? `${emp.first_name} ${emp.last_name}` : emp.name}</span>
                            <span className="text-xs text-gray-500">{emp.email}</span>
                          </div>
                        </div>
                        <div className="text-gray-600">{emp.department}</div>
                        <div className="text-gray-600">{emp.job_location}</div>
                        
                        <div className="text-gray-600">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                (emp.employment_type === 'Full-Time') ? 'bg-green-100 text-green-700' :
                                (emp.employment_type === 'Contract') ? 'bg-orange-100 text-orange-700' :
                                (emp.employment_type === 'Internship') ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {emp.employment_type}
                            </span>
                        </div>
                        <div className="text-gray-600">{emp.hired_at ? new Date(emp.hired_at).toLocaleDateString() : "-"}</div>
                        <div className="text-gray-600">{emp.job_title}</div>
                        {/* Formatted Salary */}
                        <div className="text-gray-600 font-medium text-xs whitespace-nowrap">
                            {formatSalary(emp.salary, emp.employment_type)}
                        </div>
                        <div className="text-right flex gap-2 justify-end">
                          
                          <button
                            className="border border-yellow-300 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-yellow-100 transition flex items-center justify-center"
                            onClick={() => handleOpenReview(emp)}
                            title="Rate Performance"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          {emp.user_id && (
                            <a
                              href={`/profile/${emp.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1"
                              title="View Profile"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          
                          <button
                            className="border border-gray-300 text-[#005193] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                            onClick={() => handleEditClick(emp)}
                          >
                            Edit
                          </button>
                          <button
                            className="border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition"
                            onClick={() => handleDelete(emp.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-6">No employees found.</div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </p>
              </div>
          </div>

          {/* Edit Modal */}
          {selectedEmp && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-extrabold text-[#013362]">Edit Employee Details</h3>
                        <p className="text-sm text-gray-500">Update job details for {editForm.first_name} {editForm.last_name}</p>
                    </div>
                    <button onClick={() => setSelectedEmp(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Read-Only */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#005193] uppercase tracking-wide border-b pb-2">Personal Information</h4>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">First Name</label>
                        <input className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed" value={editForm.first_name} disabled />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                        <input className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed" value={editForm.last_name} disabled />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                        <input className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed" value={editForm.email} disabled />
                    </div>
                    {/* Phone Number Field Preserved */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                        <input
                            className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                            value={editForm.phone}
                            disabled
                        />
                    </div>
                  </div>

                  {/* Right Column: Editable */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#005193] uppercase tracking-wide border-b pb-2">Job Details</h4>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none"
                            value={editForm.job_title}
                            onChange={e => setEditForm({...editForm, job_title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Job Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none"
                            value={editForm.employment_type}
                            onChange={e => setEditForm({...editForm, employment_type: e.target.value})}
                        >
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none"
                            value={editForm.department}
                            onChange={e => setEditForm({...editForm, department: e.target.value})}
                        >
                            <option value="">Select Department...</option>
                            {departmentOptions.map((dept, i) => (
                                <option key={i} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none"
                            value={editForm.job_location}
                            onChange={e => setEditForm({...editForm, job_location: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Salary</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005193] focus:border-transparent outline-none"
                            value={editForm.salary}
                            onChange={e => setEditForm({...editForm, salary: e.target.value})}
                        />
                    </div>
                    {/* Start Date Field (Read-only) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                            value={editForm.hired_at}
                            disabled
                        />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedEmp(null)} 
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#013362] to-[#005193] rounded-lg hover:opacity-90 transition shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {showReviewModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[#013362]">Add Performance Review</h3>
                        <button onClick={() => setShowReviewModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Reviewing: <span className="font-bold">{reviewTarget?.name || reviewTarget?.first_name}</span></p>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                            <input 
                                type="number" min="1" max="5" step="0.1" 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                value={reviewForm.rating}
                                onChange={e => setReviewForm({...reviewForm, rating: parseFloat(e.target.value)})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                value={reviewForm.date}
                                onChange={e => setReviewForm({...reviewForm, date: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Comments</label>
                            <textarea 
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#005193] outline-none"
                                value={reviewForm.comments}
                                onChange={e => setReviewForm({...reviewForm, comments: e.target.value})}
                                placeholder="E.g. Excellent performance in the last sprint..."
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="w-full bg-[#005193] text-white py-2 rounded-lg font-bold hover:opacity-90 transition">
                            Submit Review
                        </button>
                    </form>
                </div>
            </div>
          )}
        </div>  
    );
};

export default EmployeesTab;