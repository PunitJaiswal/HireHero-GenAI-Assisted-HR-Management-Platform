import React, { useState } from 'react';
import { login, setToken } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Users } from "lucide-react";

export default function Login() {
  const [activeTab, setActiveTab] = useState('hr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      // Check role match
      if ((activeTab === 'hr' && res.role !== 'hr') || (activeTab === 'job' && res.role !== 'candidate')) {
        setError('You are trying to login from the wrong tab.');
        return;
      }
      if (res.token) setToken(res.token);
      if (res.id) localStorage.setItem('user_id', res.id); // numeric user id for backend
      if (res.user_id) localStorage.setItem('display_user_id', res.user_id); // display user id for profile
      if (res.role === 'hr') {
        navigate('/dashboard-hr');
      } else if (res.role === 'candidate') {
        navigate('/dashboard-applicant');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google login endpoint
    window.location.href = `/api/auth/google-login?role=${activeTab === 'hr' ? 'hr' : 'candidate'}`;
  };

  return (
    <>
      <header className="sticky max-w-7xl mx-auto top-5 z-50">
        <div className="flex items-center justify-between h-20 rounded-3xl bg-white shadow px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-[#013362] to-[#005193] text-white rounded-xl p-3 shadow-md flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#013362] tracking-tight ml-2">HireHero</h2>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-[#013362] font-semibold border border-transparent hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#013362] text-white font-semibold shadow-md hover:opacity-90 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="min-h-[calc(100vh-5rem)] bg-[#F7F8FF] flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto grid md:grid-cols-2 rounded-3xl shadow-sm border border-gray-200 bg-white overflow-hidden">
          {/* ===== Left: Login Form ===== */}
          <section className="p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="flex items-center gap-2 mb-10">
              <div className="bg-gradient-to-r from-[#013362] to-[#005193] text-white rounded-xl p-3 shadow-md flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#013362] tracking-tight ml-2">Login to HireHero</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-8">
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition ${activeTab === 'hr' ? 'bg-[#013362] text-white' : 'border border-gray-300 text-gray-600 hover:border-[#013362] hover:text-[#013362]'}`}
                onClick={() => setActiveTab('hr')}
              >
                HR Professionals
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition ${activeTab === 'job' ? 'bg-[#013362] text-white' : 'border border-gray-300 text-gray-600 hover:border-[#013362] hover:text-[#013362]'}`}
                onClick={() => setActiveTab('job')}
              >
                Job Seekers
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-gray-700">{activeTab === 'hr' ? 'Email ID (HR)' : 'Email ID (Job Seeker)'}</label>
                <input
                  type="email"
                  placeholder='Enter your email'
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#013362]" />
                  Remember me
                </label>
                <a href="#" className="text-[#013362] hover:underline">
                  Forgot password?
                </a>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#013362] to-[#005193] text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Sign in →
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300" />
              <span className="px-2 text-gray-400 text-sm">or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Social Buttons */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 text-title-l font-medium hover:bg-gray-50"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sign in with Google
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don’t have an account?{" "}
              <a href="/register" className="text-[#005193] font-semibold hover:underline">
                Create account
              </a>
            </p>
          </section>

          {/* ===== Right: Info Section ===== */}
          <section
            className="relative bg-[#013362] text-white p-10 flex flex-col justify-center overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full z-0">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/background.jpg')" }}>
                <div className="w-full h-full bg-[#013362] bg-opacity-60"></div>
              </div>
            </div>
            <div className="relative z-10">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold mb-6 leading-snug">
                  AI Powered HR Management
                </h2>
                <ul className="space-y-4 text-md">
                  <li className="flex items-center gap-2">
                    <img src="/check.svg" alt="check" className="w-10 h-8" /> Automated resume screening
                  </li>
                  <li className="flex items-center gap-2">
                    <img src="/check.svg" alt="check" className="w-10 h-8" /> Intelligent performance insights
                  </li>
                  <li className="flex items-center gap-2">
                    <img src="/check.svg" alt="check" className="w-10 h-8" /> Smart employee matching
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}