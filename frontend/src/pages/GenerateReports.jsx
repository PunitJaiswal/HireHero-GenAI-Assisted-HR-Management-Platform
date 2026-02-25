import React, { useState, useEffect } from "react";
import { getDepartments, getEmployees, getCompanyApplications, getMyJobs, getCurrentUser } from "../services/api";
import { generateCSV, generatePDF } from "../utils/reportGenerator";
import { Users, BarChart2, Briefcase, FileText, Download, Loader, CheckCircle, Clock, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SidebarHR from "../components/SidebarHR";
import TopNavbarHR from "../components/TopNavbarHR";

const GenerateReports = () => {
    const [reportType, setReportType] = useState("Employee Report");
    const [department, setDepartment] = useState("");
    
    // Date Range State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [outputFormat, setOutputFormat] = useState("pdf");
    const [deliveryEmail, setDeliveryEmail] = useState("");
    const [departmentOptions, setDepartmentOptions] = useState([]);
    
    // -- Sections --
    const [availableSections] = useState(["Key Metrics", "Full Data Table"]);
    const [selectedSections, setSelectedSections] = useState(["Key Metrics", "Full Data Table"]);
    
    const [reportHistory, setReportHistory] = useState([]);
    const [companyName, setCompanyName] = useState("HireHero"); // Default

    // Status states
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [msgType, setMsgType] = useState("success"); // 'success' or 'error'

    const navigate = useNavigate();
    const tabConfig = [
      { tab: "dashboard", icon: BarChart2 },
      { tab: "employees", icon: Users },
      { tab: "recruitment", icon: Briefcase },
      { tab: "performance", icon: FileText },
      { tab: "analytics", icon: BarChart2 },
    ];
    
    const [activeTab, setActiveTab] = useState("generateReport");

    // --- Helpers ---

    // Format Date to DD/MM/YYYY (Indian Standard)
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Capitalize First Letter & Remove Underscores
    const formatStatus = (status) => {
        if (!status) return '';
        const text = status.replace(/_/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    // Get unique history key for current user
    const getHistoryKey = () => {
        const userId = localStorage.getItem("user_id");
        return `report_history_${userId || 'guest'}`;
    };

    useEffect(() => {
        // Load Current User Info
        getCurrentUser()
            .then(data => {
                if (data.company_name) setCompanyName(data.company_name);
            })
            .catch(err => console.error("Failed to load user info", err));

        // Load Departments
        getDepartments()
            .then(data => setDepartmentOptions(data))
            .catch(err => console.error(err));

        // Load History
        const historyKey = getHistoryKey();
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
            setReportHistory(JSON.parse(storedHistory));
        }
    }, []);

    const handleTabClick = (tab) => {
      navigate("/dashboard-hr", { state: { activeTab: tab } });
    };

    const toggleSection = (section) => {
        if (selectedSections.includes(section)) {
            setSelectedSections(prev => prev.filter(s => s !== section));
        } else {
            setSelectedSections(prev => [...prev, section]);
        }
    };

    const clearHistory = () => {
        if(window.confirm("Are you sure you want to clear the report history?")) {
            const historyKey = getHistoryKey();
            localStorage.removeItem(historyKey);
            setReportHistory([]);
        }
    };

    const addToHistory = (type, format) => {
        const newEntry = {
            id: Date.now(),
            type: type,
            date: new Date().toLocaleString('en-IN'),
            format: format.toUpperCase(),
            filter: department || "All Departments"
        };
        const updatedHistory = [newEntry, ...reportHistory].slice(0, 10); // Keep last 10
        setReportHistory(updatedHistory);
        
        const historyKey = getHistoryKey();
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    };

    const isDateFilteredReport = () => {
        return reportType === "Employee Report" || reportType === "Recruitment Report";
    };

    // --- Report Generation Logic ---
    const handleGenerate = async () => {
        setIsGenerating(true);
        setStatusMsg("");
        setMsgType("success");

        // VALIDATION: Check if sections are selected (only for PDF)
        if (outputFormat === 'pdf' && selectedSections.length === 0) {
            setMsgType("error");
            setStatusMsg("Select at least one section (Key Metrics or Full Data Table).");
            setTimeout(() => setStatusMsg(""), 3000);
            setIsGenerating(false);
            return;
        }

        try {
            let processedData = [];
            let columns = [];
            let rawData = [];
            
            // Filename
            const safeCompany = companyName.replace(/[^a-zA-Z0-9]/g, "_");
            let filename = `${safeCompany}_${reportType.replace(" ", "_")}_${new Date().toISOString().split('T')[0]}`;

            // 1. Fetch Raw Data
            if (reportType === "Employee Report") {
                rawData = await getEmployees();
            } else if (reportType === "Recruitment Report") {
                rawData = await getCompanyApplications();
            } else if (reportType === "Performance Report") {
                rawData = await getEmployees();
            } else if (reportType === "Payroll Report") {
                rawData = await getEmployees();
            }

            // 2. Filter Data (Department & Date)
            let filteredData = rawData;

            if (department) {
                filteredData = filteredData.filter(item => (item.department || item.job_department) === department);
            }

            if (isDateFilteredReport() && startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                filteredData = filteredData.filter(item => {
                    let itemDateStr = null;
                    if (reportType === "Employee Report") itemDateStr = item.hired_at;
                    if (reportType === "Recruitment Report") itemDateStr = item.applied_at;
                    
                    if (!itemDateStr) return false;
                    const itemDate = new Date(itemDateStr);
                    return itemDate >= start && itemDate <= end;
                });
            }

            // --- SORTING LOGIC (Newest First) ---
            if (reportType === "Employee Report") {
                filteredData.sort((a, b) => {
                    const dateA = a.hired_at ? new Date(a.hired_at) : new Date(0);
                    const dateB = b.hired_at ? new Date(b.hired_at) : new Date(0);
                    return dateB - dateA;
                });
            } else if (reportType === "Recruitment Report") {
                filteredData.sort((a, b) => {
                    const dateA = new Date(a.applied_at);
                    const dateB = new Date(b.applied_at);
                    return dateB - dateA;
                });
            }

            if (filteredData.length === 0) {
                setMsgType("error");
                setStatusMsg("No data found matching your filters.");
                setTimeout(() => setStatusMsg(""), 3000);
                setIsGenerating(false);
                return;
            }

            // 3. Map to Display Format
            if (reportType === "Employee Report") {
                processedData = filteredData.map(emp => ({
                    Name: emp.name,
                    Role: emp.job_title,
                    Department: emp.department,
                    Location: emp.job_location,
                    Email: emp.email,
                    Joined: formatDate(emp.hired_at)
                }));
                columns = [
                    { header: 'Name', dataKey: 'Name' },
                    { header: 'Role', dataKey: 'Role' },
                    { header: 'Department', dataKey: 'Department' },
                    { header: 'Location', dataKey: 'Location' },
                    { header: 'Joined', dataKey: 'Joined' }
                ];

            } else if (reportType === "Recruitment Report") {
                processedData = filteredData.map(app => ({
                    Candidate: app.candidate_name,
                    Job: app.job_title,
                    Status: formatStatus(app.status),
                    Score: app.match_score ? `${Math.round(app.match_score)}%` : '0%',
                    Applied: formatDate(app.applied_at)
                }));
                columns = [
                    { header: 'Candidate', dataKey: 'Candidate' },
                    { header: 'Job Applied', dataKey: 'Job' },
                    { header: 'Status', dataKey: 'Status' },
                    { header: 'Match', dataKey: 'Score' },
                    { header: 'Date', dataKey: 'Applied' }
                ];

            } else if (reportType === "Performance Report") {
                processedData = filteredData.map(emp => ({
                    Name: emp.name,
                    Department: emp.department,
                    AvgRating: emp.performance_avg || "N/A",
                    Reviews: emp.performances ? emp.performances.length : 0
                }));
                columns = [
                    { header: 'Employee', dataKey: 'Name' },
                    { header: 'Department', dataKey: 'Department' },
                    { header: 'Avg Rating', dataKey: 'AvgRating' },
                    { header: 'Total Reviews', dataKey: 'Reviews' }
                ];

            } else if (reportType === "Payroll Report") {
                processedData = filteredData.map(emp => ({
                    Name: emp.name,
                    Role: emp.job_title,
                    Department: emp.department,
                    Salary: emp.salary || "0"
                }));
                columns = [
                    { header: 'Employee', dataKey: 'Name' },
                    { header: 'Role', dataKey: 'Role' },
                    { header: 'Department', dataKey: 'Department' },
                    { header: 'Salary', dataKey: 'Salary' }
                ];
            }

            // 4. Generate File
            if (outputFormat === 'csv') {
                generateCSV(processedData, filename);
            } else {
                generatePDF(
                    processedData, 
                    columns, 
                    `${reportType} - ${department || 'All Departments'}`, 
                    filename, 
                    selectedSections,
                    companyName
                );
            }

            // 5. Update History
            addToHistory(reportType, outputFormat);

            setMsgType("success");
            setStatusMsg("Download started!");
            setTimeout(() => setStatusMsg(""), 3000);

        } catch (err) {
            console.error("Report generation failed:", err);
            setMsgType("error");
            setStatusMsg("Failed to generate report. Please try again.");
            setTimeout(() => setStatusMsg(""), 3000);
        } finally {
            setIsGenerating(false);
        }
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
          
          {/* Status Notification - Centering Fix Applied */}
          {statusMsg && (
            <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50">
                <div className={`px-6 py-3 rounded-full font-bold shadow-lg text-sm flex items-center gap-2 animate-bounce transition-all ${
                    msgType === 'error' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                    {msgType === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="whitespace-nowrap">{statusMsg}</span>
                </div>
            </div>
          )}

          <div className="p-8 flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-[#013362]">Generate Reports</h2>
              <div className="flex gap-3">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[#013362] to-[#005193] text-white shadow-md hover:opacity-90 transition disabled:opacity-70"
                >
                  {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isGenerating ? "Processing..." : "Generate Now"}
                </button>
              </div>
            </div>

            {/* Report Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Employee Report", icon: Users },
                { label: "Performance Report", icon: BarChart2 },
                { label: "Recruitment Report", icon: Briefcase },
                { label: "Payroll Report", icon: FileText },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={`flex flex-col items-center justify-center border rounded-lg p-4 gap-2 transition-all shadow-sm ${reportType === label ? "border-[#005193] bg-blue-100 shadow-md text-[#005193]" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setReportType(label)}
                >
                  <Icon className={`h-7 w-7 ${reportType === label ? "text-[#005193]" : "text-gray-400"}`} />
                  <span className="font-semibold text-md">{label}</span>
                </button>
              ))}
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-inner space-y-4">
              <h2 className="text-lg font-bold text-[#013362] flex items-center gap-2">
                  Report Configuration <span className="text-sm font-normal text-gray-500">({reportType})</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-[#005193] outline-none">
                    <option value="">All Departments</option>
                    {departmentOptions.map((dept, i) => (
                        <option key={i} value={dept}>{dept}</option>
                    ))}
                    </select>
                </div>
                
                {/* Date Filter - Conditional */}
                {isDateFilteredReport() && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                max={endDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                min={startDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-[#005193] outline-none" 
                            />
                        </div>
                    </div>
                )}
                
                {/* Format Selection (Shifted if date filter is hidden) */}
                <div className={!isDateFilteredReport() ? "" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
                    <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-[#005193] outline-none">
                    <option value="pdf">PDF Document</option>
                    <option value="csv">CSV Spreadsheet</option>
                    </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                <h3 className="font-medium mb-3 text-gray-700">Include Sections (PDF Only)</h3>
                <div className="flex gap-4 flex-wrap">
                  {availableSections.map((section) => (
                    <label key={section} className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                      <input 
                        type="checkbox" 
                        checked={selectedSections.includes(section)}
                        onChange={() => toggleSection(section)}
                        className="accent-[#005193] w-4 h-4" 
                      />
                      <span className="text-gray-700 text-sm font-medium">{section}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution (Removed) & History */}
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Recent Reports (History) - Now Full Width */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#013362]">Recent Reports (History)</h2>
                    {reportHistory.length > 0 && (
                        <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>
                
                {reportHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No reports generated yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {reportHistory.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                            <div>
                                <p className="font-bold text-[#013362] text-sm">{item.type}</p>
                                <p className="text-xs text-gray-500">{item.date} • {item.filter}</p>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-white border rounded text-gray-600 uppercase">
                                {item.format}
                            </span>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </section>
    );
}

export default GenerateReports;