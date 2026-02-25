import React, { useState } from 'react';
import { register } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Users } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    role: 'hr' // Default role selected
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ message: "", type: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setStatus({ message: "", type: "" });

    // Compose registration payload
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      password: form.password,
      role: form.role,
      companyName: form.role === 'hr' ? form.companyName : '', // Only send company name if HR
    };

    try {
      const res = await register(payload);
      if (res.user_id) localStorage.setItem('user_id', res.user_id);
      
      // Show Success Pill
      setStatus({ message: "Registration successful! Redirecting...", type: "success" });
      
      // Redirect after 1 second
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
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
            {/* Sign In or My Account */}
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

      {/* Success/Status Pill */}
      {status.message && (
        <div className={`fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-lg text-sm animate-bounce ${
            status.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {status.message}
        </div>
      )}

      <section className="min-h-[calc(100vh-5rem)] bg-[#F7F8FF] flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto grid md:grid-cols-2 rounded-3xl shadow-sm border border-gray-200 bg-white overflow-hidden">
          {/* ===== Left: Register Form ===== */}
          <section className="p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="flex items-center gap-2 mb-10">
              <div className="bg-gradient-to-r from-[#013362] to-[#005193] text-white rounded-xl p-3 shadow-md flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#013362] tracking-tight ml-2">Join HireHero</h2>
            </div>

            {/* Signup Form */}
            <form className="space-y-5" onSubmit={handleRegister}>
              {/* Role Selection - Moved to top */}
              <div>
                <label className="text-sm text-gray-700">Select Your Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                >
                  <option value="hr">HR Professional</option>
                  <option value="candidate">Job Seeker</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  />
                </div>
              </div>

              <div className={`grid ${form.role === 'hr' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                {form.role === 'hr' && (
                  <div>
                    <label className="text-sm text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Enter company name"
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-700">
                    {form.role === 'candidate' ? 'Personal Email' : 'Work Email'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#005193]"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="accent-[#013362] mt-1 mr-2"
                  required
                />
                <p>
                  I agree to the{" "}
                  <a href="#" className="text-[#005193] font-semibold hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#005193] font-semibold hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              {/* Error Messages */}
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#013362] to-[#005193] text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Create Account 🡢
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <a href="/login" className="text-[#005193] font-semibold hover:underline">
                Login
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