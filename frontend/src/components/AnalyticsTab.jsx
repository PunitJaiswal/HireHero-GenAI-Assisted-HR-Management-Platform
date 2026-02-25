import React, { useState, useEffect } from "react";
import { getEmployees, getCompanyApplications, getMyJobs } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users,
  Briefcase,
  TrendingUp,
  Award,
  IndianRupee,
  Activity,
  Loader
} from "lucide-react";

// Colors for Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- Reusable Metric Card Component ---
const MetricCard = ({ title, value, icon: Icon, color, bg, sub }) => {
    const ValidIcon = Icon || Activity; 
    
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h4 className="text-2xl font-extrabold text-gray-800">{value}</h4>
                {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
            </div>
            <div className={`p-3 rounded-xl ${bg}`}>
                <ValidIcon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    );
};

const AnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgMatchScore: 0,
    conversionRate: 0,
    avgSalary: 0,
    totalApplications: 0
  });
  
  const [funnelData, setFunnelData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [deptData, setDeptData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [employees, allApplications, jobs] = await Promise.all([
          getEmployees(),
          getCompanyApplications(),
          getMyJobs()
        ]);

        // --- FILTER: Only use applications for jobs created by this HR ---
        const myJobIds = new Set(jobs.map(j => j.id));
        const applications = allApplications.filter(app => myJobIds.has(app.job_id));

        // --- 1. Process Core Metrics ---
        
        // Average Match Score
        const totalScore = applications.reduce((sum, app) => sum + (app.match_score || 0), 0);
        const avgMatchScore = applications.length ? Math.round(totalScore / applications.length) : 0;

        // Conversion Rate (Hired / Total Apps)
        const hiredCount = applications.filter(app => ['hired', 'accepted'].includes(app.status)).length;
        const conversionRate = applications.length ? ((hiredCount / applications.length) * 100).toFixed(1) : 0;

        // Average Employee Salary (Filtered: Full-Time or Part-Time only)
        let totalSalary = 0;
        let salaryCount = 0;
        employees.forEach(emp => {
            const type = (emp.employment_type || "").toLowerCase();
            if (type === 'full-time' || type === 'part-time') {
                if (emp.salary) {
                    const cleanSal = emp.salary.toString().replace(/[^0-9.]/g, '');
                    const val = parseFloat(cleanSal);
                    if (!isNaN(val) && val > 0) {
                        totalSalary += val;
                        salaryCount++;
                    }
                }
            }
        });
        
        let avgSalaryDisplay = "0";
        if (salaryCount > 0) {
            const avg = totalSalary / salaryCount;
            if (avg > 100000) avgSalaryDisplay = `₹${(avg / 100000).toFixed(1)} LPA`; 
            else avgSalaryDisplay = `₹${(avg / 1000).toFixed(0)}k`; 
        }

        setMetrics({
            avgMatchScore,
            conversionRate,
            avgSalary: avgSalaryDisplay,
            totalApplications: applications.length
        });

        // --- 2. Process Funnel Data ---
        const stages = {
            'Applied': 0,
            'Interviewing': 0,
            'Offer': 0,
            'Hired': 0
        };

        applications.forEach(app => {
            const s = app.status;
            if (s === 'applied') stages['Applied']++;
            else if (['interviewing', 'under_review'].includes(s)) stages['Interviewing']++;
            else if (['offer_extended'].includes(s)) stages['Offer']++;
            else if (['hired', 'accepted'].includes(s)) stages['Hired']++;
        });

        const processedFunnel = Object.keys(stages).map(key => ({
            name: key,
            value: stages[key]
        }));
        setFunnelData(processedFunnel);

        // --- 3. Process Trend Data (Applications per Month) ---
        const monthCounts = {};
        applications.forEach(app => {
            if (app.applied_at) {
                const date = new Date(app.applied_at);
                const month = date.toLocaleString('default', { month: 'short' }); // "Jan", "Feb"
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            }
        });
        
        const processedTrend = Object.keys(monthCounts).map(m => ({
            name: m,
            applications: monthCounts[m]
        }));

        // *** FIX: Sort Months Chronologically ***
        const monthOrder = {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
        };
        processedTrend.sort((a, b) => monthOrder[a.name] - monthOrder[b.name]);

        setTrendData(processedTrend);

        // --- 4. Process Department Distribution ---
        const depts = {};
        employees.forEach(emp => {
            const d = emp.department || "Unassigned";
            depts[d] = (depts[d] || 0) + 1;
        });

        const processedDept = Object.keys(depts).map(key => ({
            name: key,
            value: depts[key]
        }));
        setDeptData(processedDept);

        setLoading(false);

      } catch (err) {
        console.error("Failed to load analytics data", err);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex h-96 items-center justify-center">
              <Loader className="w-8 h-8 text-[#005193] animate-spin" />
              <span className="ml-3 text-gray-500 font-medium">Gathering insights...</span>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-[#013362] flex items-center gap-2">
          <Activity className="h-6 w-6 text-[#005193]" /> HR Analytics
        </h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
            title="Avg Match Score" 
            value={`${metrics.avgMatchScore}%`} 
            icon={Award} 
            color="text-purple-600" 
            bg="bg-purple-50"
            sub="Candidate Quality"
        />
        <MetricCard 
            title="Conversion Rate" 
            value={`${metrics.conversionRate}%`} 
            icon={TrendingUp} 
            color="text-green-600" 
            bg="bg-green-50"
            sub="Application to Hire"
        />
        <MetricCard 
            title="Avg Salary (Full-time/Part-time)" 
            value={metrics.avgSalary} 
            icon={IndianRupee} 
            color="text-blue-600" 
            bg="bg-blue-50"
            sub="Current Workforce"
        />
        <MetricCard 
            title="Total Volume" 
            value={metrics.totalApplications} 
            icon={Briefcase} 
            color="text-orange-600" 
            bg="bg-orange-50"
            sub="Applications Received"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recruitment Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#013362] mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#005193]" /> Recruitment Funnel
            </h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px'}} />
                        <Bar dataKey="value" fill="#005193" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#666' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Workforce Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#013362] mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#005193]" /> Workforce by Department
            </h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={deptData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px'}} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Application Trends (Full Width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#013362] mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#005193]" /> Application Volume Trends
            </h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#005193" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#005193" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip contentStyle={{borderRadius: '8px'}} />
                        <Area type="monotone" dataKey="applications" stroke="#005193" fillOpacity={1} fill="url(#colorApps)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsTab;