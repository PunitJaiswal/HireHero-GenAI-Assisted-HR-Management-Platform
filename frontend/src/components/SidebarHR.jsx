import { Users, Briefcase, Plus, Megaphone, BarChart2, Sparkles } from "lucide-react";

const SidebarHR = () => (
  <aside className="w-64 bg-white shadow-lg border-r border-gray-200 p-6 flex flex-col justify-between relative z-10">
    <div>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-gradient-to-r from-[#013362] to-[#005193] text-white rounded-xl p-3 shadow-md">
          <Users className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#013362] tracking-tight">HireHero</h2>
      </div>

      {/* AI Assistant */}
      <div>
        <h3 className="text-s font-semibold text-[#005193] uppercase mb-2 tracking-wide flex items-center gap-1 pl-2">
          <Sparkles className="h-4 w-4 text-[#005193]" /> AI Assistant
        </h3>
        <ul className="space-y-2 mb-6 pl-6">
          <li>
            <a href="/hr-genai" className="flex items-center gap-2 text-gray-700 hover:text-[#005193] cursor-pointer font-medium"><Sparkles className="h-4 w-4" /> Ask HR GenAI</a>
          </li>
        </ul>

        {/* Quick Actions */}
        <h3 className="text-s font-semibold text-[#013362] uppercase mb-2 tracking-wide flex items-center gap-1 pl-2 mt-6">
          <Briefcase className="h-4 w-4 text-[#005193]" /> Quick Actions
        </h3>
        <ul className="space-y-2 pl-6 text-gray-700">
          <li className="flex items-center gap-2 cursor-pointer hover:text-[#013362] font-medium">
            <a href="/add-employee" className="flex items-center gap-2 text-gray-700 hover:text-[#005193] cursor-pointer font-medium"><Plus className="h-4 w-4 text-[#005193]" /> Add Employee</a>
          </li>
          <li className="flex items-center gap-2 cursor-pointer hover:text-[#013362] font-medium">
            <a href="/post-job" className="flex items-center gap-2 text-gray-700 hover:text-[#005193] cursor-pointer font-medium"><Megaphone className="h-4 w-4 text-[#005193]" /> Post Job</a>
          </li>
          <li className="flex items-center gap-2 cursor-pointer hover:text-[#013362] font-medium">
            <a href="/generate-report" className="flex items-center gap-2 text-gray-700 hover:text-[#005193] cursor-pointer font-medium"><BarChart2 className="h-4 w-4 text-[#005193]" /> Generate Report</a>
          </li>
        </ul>
      </div>
    </div>
    <div className="text-xs text-gray-400 mt-10">© 2025 HireHero | All Rights Reserved</div>
  </aside>
);

export default SidebarHR;
