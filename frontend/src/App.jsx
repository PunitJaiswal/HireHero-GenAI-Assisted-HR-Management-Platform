import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import { AuthProvider } from './context/AuthContext'
import DashboardHR from './pages/DashboardHR';
import DashboardApplicant from './pages/DashboardApplicant';
import PublicProfile from './pages/PublicProfile'
import HRGenAI from './pages/HRGenAI'
import AddEmployee from './pages/AddEmployee'
import PostJob from './pages/PostJob'
import GenerateReports from './pages/GenerateReports'
import axios from 'axios'

export default function App() {
  const navigate = useNavigate();

  // --- Automatic Cleanup on Server Restart ---
  useEffect(() => {
    const checkServerIdentity = async () => {
      try {
        const res = await axios.get('/api/system/status');
        const serverId = res.data.instance_id;
        const localId = localStorage.getItem('server_instance_id');

        // If local ID is missing OR doesn't match server, wipe everything
        if (!localId || localId !== serverId) {
            console.log("♻️ Server restart detected. Clearing client storage for a fresh start.");
            
            // 1. Clear Data
            localStorage.clear();
            sessionStorage.clear();
            
            // 2. Save new Server ID
            localStorage.setItem('server_instance_id', serverId);
            
            // 3. Force Login (if not already on public pages)
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
      } catch (err) {
        console.warn("Could not verify server status (Backend might be down).");
      }
    };
    
    checkServerIdentity();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard-hr" element={<DashboardHR />} />
            <Route path="/dashboard-applicant" element={<DashboardApplicant />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/register" element={<Register />} />
            <Route path="/hr-genai" element={<HRGenAI />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/generate-report" element={<GenerateReports />} />
          </Routes>
      </div>
    </AuthProvider>
  )
}