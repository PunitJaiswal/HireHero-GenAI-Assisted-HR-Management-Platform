import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, BarChart2, CheckCircle, Sparkles, User, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F8FF] via-[#e3e9ff] to-[#dbeafe] font-inter text-[#013362]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-[#013362] to-[#005193] text-white rounded-xl p-2 shadow-md flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">HireHero</h2>
          </Link>
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
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-[#005193] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              <Sparkles className="h-4 w-4" /> The Future of Hiring is Here
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005193] to-blue-500">
                Recruitment
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Streamline your hiring process or job search with Generative AI. HireHero empowers HR teams to find talent faster and helps Job Seekers land their dream jobs with AI-assisted tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl bg-[#013362] text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition flex items-center justify-center gap-2"
              >
                Start Hiring Now <Briefcase className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl bg-white text-[#013362] text-lg font-bold shadow-md border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                Log In <User className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Free forever</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-30 blur-3xl animate-pulse"></div>
            <div className="relative bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl grid gap-6">
               <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="bg-blue-100 p-3 rounded-full text-[#005193]"><FileText className="h-6 w-6" /></div>
                  <div>
                     <h3 className="font-bold text-gray-800">AI Resume Parsing</h3>
                     <p className="text-xs text-gray-500">Automatically extract skills & experience</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="bg-green-100 p-3 rounded-full text-green-700"><BarChart2 className="h-6 w-6" /></div>
                  <div>
                     <h3 className="font-bold text-gray-800">Smart Matching</h3>
                     <p className="text-xs text-gray-500">Rank candidates by job description fit</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-700"><Shield className="h-6 w-6" /></div>
                  <div>
                     <h3 className="font-bold text-gray-800">Unbiased Screening</h3>
                     <p className="text-xs text-gray-500">Fair and consistent candidate evaluation</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-extrabold mb-4">Why Choose HireHero?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform combines traditional ATS capabilities with cutting-edge Generative AI to revolutionize how you hire.
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {[
                { icon: FileText, title: "For Recruiters", desc: "Generate JDs, screen resumes, and get interview guides instantly with AI." },
                { icon: Users, title: "For Job Seekers", desc: "AI-powered resume optimization, cover letter generation, and smart job matching." },
                { icon: Sparkles, title: "Unbiased Matching", desc: "Our AI connects the right talent to the right role, ensuring a fair process." },
            ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-gray-50 hover:bg-blue-50 transition border border-gray-100">
                    <feature.icon className="h-10 w-10 text-[#005193] mb-4" />
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#013362] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-xl font-bold">HireHero</span>
            </div>
            <p className="text-blue-200 text-sm">© 2025 HireHero Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
