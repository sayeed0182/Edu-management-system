import React, { useState, useEffect, useRef } from 'react';

import { 
  User, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  ClipboardCheck, 
  BarChart3, 
  LogOut, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  Menu, 
  X,
  Bell,
  Search,
  CheckCircle2,
  Users,
  Clock,
  ShieldCheck,
  Smartphone,
  CreditCard as CardIcon,
  Download,
  Eye,
  Upload,
  FileText,
  PlusCircle,
  MoreVertical,
  Zap,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

// --- Configuration & API Logic ---
const apiKey = "";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const EduSmartApp = () => {
  const [userRole, setUserRole] = useState(null); 
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [activeTab, setActiveTab] = useState('Home');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Academic Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loginStep, setLoginStep] = useState(1); // Step 1: Role Selection, Step 2: Credentials
  const [selectedRole, setSelectedRole] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const chatEndRef = useRef(null);

  // --- Mock Data ---
  const studentData = {
    name: "Alex Johnson",
    id: "STU-88291",
    attendance: 84,
    major: "Computer Science",
    semester: "4th Semester",
    feeAmount: 112000, // Updated to 1,12,000
    results: [
      { 
        sem: "Semester 1", 
        gpa: "3.75", 
        status: "Pass", 
        subjects: [
          {name: "Mathematics I", grade: "A", credits: 4, marks: 92},
          {name: "Introduction to Programming", grade: "A-", credits: 3, marks: 88},
          {name: "Physics", grade: "B+", credits: 4, marks: 82}
        ] 
      },
      { 
        sem: "Semester 2", 
        gpa: "3.85", 
        status: "Pass", 
        subjects: [
          {name: "Mathematics II", grade: "A", credits: 4, marks: 90},
          {name: "Data Structures", grade: "A", credits: 4, marks: 94},
          {name: "Digital Logic", grade: "A-", credits: 3, marks: 87}
        ] 
      }
    ],
    assessments: [
      { id: 1, name: "Quiz 1", subject: "Data Structures", status: "Completed", score: "18/20", date: "Jan 15, 2026" },
      { id: 2, name: "Quiz 2", subject: "Algorithms", status: "Pending", score: "-", date: "Feb 10, 2026" }
    ]
  };

  const facultyData = {
    name: "Dr. Sarah Williams",
    id: "FAC-1029",
    department: "CSE Department",
    managedStudents: [
      { id: "S001", name: "John Doe", email: "john@uni.edu", attendance: "88%", performance: "Excellent" },
      { id: "S002", name: "Jane Smith", email: "jane@uni.edu", attendance: "92%", performance: "Good" },
      { id: "S003", name: "Mike Ross", email: "mike@uni.edu", attendance: "74%", performance: "Average" },
      { id: "S004", name: "Rachel Zane", email: "rachel@uni.edu", attendance: "98%", performance: "Excellent" },
      { id: "S005", name: "Harvey Specter", email: "harvey@uni.edu", attendance: "85%", performance: "Excellent" },
      { id: "S006", name: "Louis Litt", email: "louis@uni.edu", attendance: "99%", performance: "Good" },
      { id: "S007", name: "Donna Paulsen", email: "donna@uni.edu", attendance: "100%", performance: "Excellent" },
      { id: "S008", name: "Jessica Pearson", email: "jessica@uni.edu", attendance: "95%", performance: "Excellent" },
      { id: "S009", name: "Robert Zane", email: "robert@uni.edu", attendance: "82%", performance: "Average" }
    ],
    syllabusTracking: [
      { subject: "Human Computer Interaction", completed: 85, totalModules: 5 },
      { subject: "Data Structures & Algorithms", completed: 60, totalModules: 8 },
      { subject: "AI & Machine Learning", completed: 40, totalModules: 10 }
    ]
  };

  const syllabus = [
    { name: "Human Computer Interaction", code: "CS401", modules: 5, description: "Focuses on design and evaluation of UI/UX." },
    { name: "Data Structures & Algorithms", code: "CS202", modules: 6, description: "Core logic and complexity analysis." },
    { name: "Cloud Computing", code: "CS505", modules: 4, description: "AWS, Azure, and distributed systems." },
    { name: "AI & Machine Learning", code: "CS601", modules: 8, description: "Neural networks and Deep Learning." },
    { name: "Python Programming", code: "CS105", modules: 4, description: "Scripting and advanced data processing." },
    { name: "Java Development", code: "CS205", modules: 6, description: "OOP principles and Enterprise apps." },
    { name: "Computer Networks", code: "CS301", modules: 5, description: "TCP/IP, Routing, and Security fundamentals." },
    { name: "Operating Systems", code: "CS208", modules: 7, description: "Kernels, threads, and memory management." },
    { name: "Discrete Mathematics", code: "CS102", modules: 6, description: "Set theory, logic, and graph theory." }
  ];

  const timetableSlots = [
    { time: "09:00 - 10:00", period: "1" },
    { time: "10:00 - 11:00", period: "2" },
    { time: "11:00 - 12:00", period: "3" },
    { time: "12:00 - 01:00", period: "LUNCH", isBreak: true },
    { time: "01:00 - 02:00", period: "4" },
    { time: "02:00 - 03:00", period: "5" },
    { time: "03:00 - 04:00", period: "6" }
  ];

  // --- AI Chat Logic ---
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          systemInstruction: { 
            parts: [{ text: "You are EduAI. Be professional and concise. Help with university syllabus, doubts, and academic planning. Provide clear formatting." }] 
          }
        })
      });
      const result = await response.json();
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "AI Assistant is temporarily unavailable.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Multi-Step Login Logic ---
  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setLoginStep(2);
    setLoginError('');
  };

  const handleBackToRoleSelection = () => {
    setLoginStep(1);
    setSelectedRole(null);
    setLoginForm({ email: '', password: '' });
    setLoginError('');
  };

  const handleLogin = () => {
    // Validate email contains @gmail.com
    if (!loginForm.email.includes('@gmail.com')) {
      setLoginError('Please use a valid Gmail address (@gmail.com)');
      return;
    }
    
    if (!loginForm.password) {
      setLoginError('Please enter your password');
      return;
    }

    // Login successful
    setUserRole(selectedRole);
    setActiveTab('Home');
    setLoginError('');
  };

  // --- Filtered Student List ---
  const filteredStudents = facultyData.managedStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.id.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Close sidebar on mobile when navigating
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-200 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          {/* Step 1: Role Selection */}
          {loginStep === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <BookOpen className="text-white w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">EduSmart</h1>
                <p className="text-sm text-slate-500">Select your role to continue</p>
              </div>

              <div className="space-y-4">
                {/* Student Role Card */}
                <button 
                  onClick={() => handleRoleSelection('student')}
                  className="w-full bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 p-8 rounded-[2rem] transition-all shadow-xl shadow-indigo-600/20 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap size={32} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-white mb-1">Student Portal</h3>
                      <p className="text-sm text-indigo-100 opacity-90">Access your courses, grades, and more</p>
                    </div>
                    <ChevronRight size={24} className="text-white/60 group-hover:text-white transition-colors" />
                  </div>
                </button>

                {/* Faculty Role Card */}
                <button 
                  onClick={() => handleRoleSelection('faculty')}
                  className="w-full bg-slate-800 hover:bg-slate-700 p-8 rounded-[2rem] transition-all border-2 border-slate-700 hover:border-slate-600 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase size={32} className="text-slate-300" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-white mb-1">Faculty Portal</h3>
                      <p className="text-sm text-slate-400">Manage students and track progress</p>
                    </div>
                    <ChevronRight size={24} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Login Credentials */}
          {loginStep === 2 && (
            <div className="space-y-6">
              <button 
                onClick={handleBackToRoleSelection}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4"
              >
                <ArrowLeft size={16} />
                Back to role selection
              </button>

              <div className="text-center mb-8">
                <div className={`w-14 h-14 ${selectedRole === 'student' ? 'bg-indigo-600' : 'bg-slate-700'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  {selectedRole === 'student' ? <GraduationCap className="text-white w-7 h-7" /> : <Briefcase className="text-white w-7 h-7" />}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                  {selectedRole === 'student' ? 'Student' : 'Faculty'} Login
                </h1>
                <p className="text-sm text-slate-500">Enter your credentials to continue</p>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{loginError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gmail Address</label>
                  <input 
                    type="email" 
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                    value={loginForm.email}
                    onChange={(e) => {
                      setLoginForm({...loginForm, email: e.target.value});
                      setLoginError('');
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({...loginForm, password: e.target.value});
                      setLoginError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              <button 
                onClick={handleLogin}
                className={`w-full ${selectedRole === 'student' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'} text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg mt-6`}
              >
                Sign In
              </button>

              <div className="text-center">
                <button className="text-[13px] text-slate-500 hover:text-indigo-400 transition-colors">Forgot your password?</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Sub-View Components ---

  const CircularProgress = ({ percentage }) => {
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-indigo-500 transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white leading-none">{percentage}%</span>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Attendance</span>
        </div>
      </div>
    );
  };

  const TimetableUI = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="py-4 border-r border-slate-800">Time / Period</th>
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => <th key={d} className="py-4 px-4">{d}</th>)}
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {timetableSlots.map((slot, idx) => (
              <tr key={idx} className={`border-t border-slate-800 ${slot.isBreak ? 'bg-amber-500/5' : ''}`}>
                <td className="py-5 border-r border-slate-800 bg-slate-900/50">
                  <p className="font-bold text-slate-300">{slot.time}</p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold">P{slot.period}</p>
                </td>
                {[1,2,3,4,5].map(d => (
                  <td key={d} className="py-4 px-3">
                    {slot.isBreak ? <span className="text-[10px] font-black text-amber-600/80 tracking-widest">LUNCH</span> : 
                    <div className="bg-slate-800/30 p-2 rounded-lg border border-slate-800 group hover:border-indigo-500/40 transition-colors cursor-pointer">
                       <p className="text-indigo-400 font-bold text-[11px]">CS-{100 + Math.floor(Math.random()*400)}</p>
                       <p className="text-slate-600 text-[10px]">Room 30{d}</p>
                    </div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans antialiased">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Drawer */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 fixed lg:static inset-y-0 left-0 z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-64 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">EduSmart</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 mt-6 overflow-y-auto">
          <SidebarBtn icon={BarChart3} label="Home" active={activeTab === 'Home'} onClick={() => handleTabChange('Home')} />
          <SidebarBtn icon={Calendar} label="Timetable" active={activeTab === 'Timetable'} onClick={() => handleTabChange('Timetable')} />
          <SidebarBtn icon={BookOpen} label="Syllabus" active={activeTab === 'Syllabus'} onClick={() => handleTabChange('Syllabus')} />
          
          {userRole === 'student' ? (
            <>
              <SidebarBtn icon={CreditCard} label="Pay Fee" active={activeTab === 'Pay Fee'} onClick={() => handleTabChange('Pay Fee')} />
              <SidebarBtn icon={ClipboardCheck} label="Assessments" active={activeTab === 'Assessments'} onClick={() => handleTabChange('Assessments')} />
              <SidebarBtn icon={ShieldCheck} label="Results" active={activeTab === 'Results'} onClick={() => handleTabChange('Results')} />
            </>
          ) : (
            <>
              <div className="h-px bg-slate-800 mx-4 my-4 opacity-50"></div>
              <p className="text-[10px] uppercase font-black text-slate-600 ml-4 mb-2 tracking-widest">Faculty Controls</p>
              <SidebarBtn icon={CheckCircle2} label="Take Attendance" active={activeTab === 'Take Attendance'} onClick={() => handleTabChange('Take Attendance')} />
              <SidebarBtn icon={Upload} label="Upload Notes" active={activeTab === 'Upload Notes'} onClick={() => handleTabChange('Upload Notes')} />
              <SidebarBtn icon={Users} label="Student Lists" active={activeTab === 'Student Lists'} onClick={() => handleTabChange('Student Lists')} />
              <SidebarBtn icon={BarChart3} label="Completion Tracking" active={activeTab === 'Completion Tracking'} onClick={() => handleTabChange('Completion Tracking')} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setUserRole(null)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto relative bg-slate-950 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="h-16 lg:h-20 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-10 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30 w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">{activeTab}</h2>
              <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-widest font-black hidden sm:block">
                {userRole === 'student' ? studentData.id : facultyData.id} • {userRole === 'student' ? studentData.name : facultyData.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-5">
            <button className="p-2 lg:p-2.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 relative hover:text-white transition-all shadow-inner">
              <Bell size={16} className="lg:w-[18px] lg:h-[18px]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-slate-900"></span>
            </button>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-[10px] lg:text-xs text-white">
                {userRole === 'student' ? 'AJ' : 'SW'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content - FULL WIDTH with max-width container */}
        <div className="p-4 lg:p-10 w-full max-w-7xl mx-auto flex flex-col min-h-screen">
          {activeTab === 'Home' ? (
            userRole === 'student' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                  {/* Attendance Circle Highlight - REBALANCED */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mt-20 group-hover:bg-indigo-600/10 transition-colors"></div>
                    <CircularProgress percentage={studentData.attendance} />
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Academic Overview</h3>
                      <p className="text-slate-400 leading-relaxed text-sm lg:text-[13.5px]">Your attendance is solid. You've been consistently active in the last 4 weeks. Keep it up!</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-800/50">
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Semester GPA</p>
                          <p className="text-xl lg:text-2xl font-black text-white">3.85</p>
                        </div>
                        <div className="bg-slate-800/30 p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-800/50">
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Current Rank</p>
                          <p className="text-xl lg:text-2xl font-black text-indigo-400">#12</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 shadow-xl">
                      <h4 className="font-bold text-xs lg:text-sm mb-4 lg:mb-6 uppercase tracking-widest text-slate-500">Next Class</h4>
                      <div className="flex items-center gap-4 lg:gap-5">
                        <div className="p-3 lg:p-4 bg-indigo-500/10 rounded-xl lg:rounded-2xl text-indigo-400">
                          <Clock size={20} className="lg:w-6 lg:h-6" />
                        </div>
                        <div>
                           <p className="text-white font-bold text-base lg:text-lg">HCI: Design Lab</p>
                           <p className="text-xs lg:text-sm text-slate-500">Starts in 45m • Lab 202</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 shadow-xl">
                       <h4 className="font-bold text-xs lg:text-sm mb-4 lg:mb-6 uppercase tracking-widest text-slate-500">Assignments</h4>
                       <div className="flex items-center justify-between bg-slate-800/30 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-800">
                          <span className="text-sm font-bold text-white">DSA Quiz #4</span>
                          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 lg:px-3 py-1 rounded-full font-black">2 Days Left</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 lg:space-y-6">
                   <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-6 lg:p-7 flex items-center gap-4 group hover:border-indigo-500/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl lg:rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Today's Progress</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">3 Classes remaining</p>
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                      <div className="relative z-10">
                        <h4 className="text-base lg:text-lg font-bold mb-1">Account Balance</h4>
                        <p className="text-indigo-200 text-sm opacity-80 mb-6 lg:mb-8">Tuition Fees 2024</p>
                        <p className="text-3xl lg:text-4xl font-black tracking-tighter mb-6 lg:mb-8">₹{studentData.feeAmount.toLocaleString()}</p>
                        <button onClick={() => handleTabChange('Pay Fee')} className="w-full bg-white text-indigo-700 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg">Make Payment</button>
                      </div>
                   </div>

                   <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 shadow-xl">
                      <h4 className="font-bold text-xs lg:text-sm mb-4 lg:mb-6 uppercase tracking-widest text-slate-500">Notices</h4>
                      <div className="space-y-4 lg:space-y-6">
                         <div className="flex gap-3 lg:gap-4 pb-4 lg:pb-6 border-b border-slate-800/50">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-lg shadow-indigo-500/50"></div>
                            <div>
                               <p className="text-xs lg:text-[13px] text-white font-medium leading-relaxed">Exam registration deadline extended until Feb 15</p>
                               <p className="text-[10px] text-slate-600 font-bold uppercase mt-1.5">2 hours ago</p>
                            </div>
                         </div>
                         <div className="flex gap-3 lg:gap-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-lg shadow-emerald-500/50"></div>
                            <div>
                               <p className="text-xs lg:text-[13px] text-white font-medium leading-relaxed">New digital marksheet available for Sem 3</p>
                               <p className="text-[10px] text-slate-600 font-bold uppercase mt-1.5">Yesterday</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              /* Faculty Home Dashboard */
              <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[{label: "Assigned Students", value: "482", icon: Users, color: "text-blue-400"}, {label: "Avg. Presence", value: "91%", icon: BarChart3, color: "text-emerald-400"}, {label: "Live Courses", value: "3", icon: BookOpen, color: "text-indigo-400"}, {label: "System Alerts", value: "05", icon: Bell, color: "text-amber-400"}].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-[1.25rem] lg:rounded-[1.5rem] p-5 lg:p-7 shadow-sm hover:border-slate-700 transition-colors">
                      <stat.icon size={20} className={`${stat.color} mb-3 lg:mb-5 lg:w-[22px] lg:h-[22px]`} />
                      <p className="text-[9px] lg:text-[10px] font-black uppercase text-slate-600 tracking-widest">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white mt-1 lg:mt-1.5">{stat.value}</p>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 shadow-xl">
                    <h3 className="font-bold text-white text-base lg:text-lg mb-6 lg:mb-8">Today's Class Queue</h3>
                    <div className="space-y-3 lg:space-y-4">
                      {["CS202: Algorithms (09:00 AM)", "CS401: HCI Lab (02:00 PM)", "CS601: AI/ML Seminar (04:00 PM)"].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-4 lg:p-5 bg-slate-800/40 rounded-xl lg:rounded-2xl border border-slate-800 group hover:border-indigo-500/40 transition-all cursor-pointer">
                          <span className="text-sm font-bold text-slate-300">{c}</span>
                          <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 shadow-xl">
                    <h3 className="font-bold text-white text-base lg:text-lg mb-6 lg:mb-8">Course Progress</h3>
                    <div className="space-y-4 lg:space-y-6">
                      {facultyData.syllabusTracking.map((s, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span className="text-[10px] lg:text-xs">{s.subject}</span>
                            <span>{s.completed}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/20" style={{ width: `${s.completed}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full flex flex-col">
              {activeTab === 'Timetable' && <TimetableUI />}
              
              {activeTab === 'Syllabus' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                  {syllabus.map(sub => (
                    <div key={sub.code} className="bg-slate-900 border border-slate-800 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] hover:border-indigo-500/50 transition-all group shadow-xl">
                      <div className="flex justify-between items-start mb-4 lg:mb-6">
                        <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">{sub.code}</div>
                        <MoreVertical size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                      <h4 className="text-base lg:text-lg font-bold text-white mb-2 lg:mb-3 tracking-tight">{sub.name}</h4>
                      <p className="text-sm text-slate-500 mb-6 lg:mb-8 leading-relaxed h-12 overflow-hidden">{sub.description}</p>
                      <div className="flex items-center justify-between pt-4 lg:pt-6 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">{sub.modules} Modules</span>
                        <button className="text-indigo-400 text-xs lg:text-sm font-bold hover:underline flex items-center gap-2">Download <Download size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAY FEE MODULE - Updated with payment options */}
              {activeTab === 'Pay Fee' && (
                <div className="max-w-2xl mx-auto w-full space-y-6 lg:space-y-8">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6 lg:mb-8">
                        <div>
                          <h3 className="text-lg lg:text-xl font-bold mb-1">Pending Balance</h3>
                          <p className="text-indigo-200 text-xs lg:text-sm opacity-80">Semester Fee 2024</p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                          <CreditCard size={24} className="lg:w-7 lg:h-7" />
                        </div>
                      </div>
                      <p className="text-4xl lg:text-5xl font-black tracking-tighter mb-2">₹{studentData.feeAmount.toLocaleString()}</p>
                      <p className="text-indigo-200 text-xs lg:text-sm opacity-70">Due Date: March 15, 2026</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 shadow-xl">
                    <h4 className="font-bold text-white text-base lg:text-lg mb-6 lg:mb-8">Select Payment Method</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      {/* UPI Payment Option */}
                      <button className="group bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] transition-all text-left">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-700/50 group-hover:bg-indigo-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors">
                            <Smartphone size={24} className="text-slate-400 group-hover:text-indigo-400 transition-colors lg:w-7 lg:h-7" />
                          </div>
                          <div>
                            <h5 className="text-white font-bold text-base lg:text-lg">UPI Payment</h5>
                            <p className="text-slate-500 text-xs lg:text-sm">Google Pay, PhonePe, Paytm</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] lg:text-xs text-slate-600 uppercase font-black tracking-widest">Instant</span>
                          <ChevronRight size={20} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </button>

                      {/* Card Payment Option */}
                      <button className="group bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] transition-all text-left">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-700/50 group-hover:bg-indigo-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors">
                            <CardIcon size={24} className="text-slate-400 group-hover:text-indigo-400 transition-colors lg:w-7 lg:h-7" />
                          </div>
                          <div>
                            <h5 className="text-white font-bold text-base lg:text-lg">Card Payment</h5>
                            <p className="text-slate-500 text-xs lg:text-sm">Credit or Debit Card</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] lg:text-xs text-slate-600 uppercase font-black tracking-widest">Secure</span>
                          <ChevronRight size={20} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </button>
                    </div>

                    <div className="mt-6 lg:mt-8 p-4 lg:p-6 bg-slate-800/30 rounded-xl lg:rounded-2xl border border-slate-800">
                      <div className="flex items-start gap-3">
                        <ShieldCheck size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm lg:text-base font-bold text-white mb-1">Secure Payment</p>
                          <p className="text-xs lg:text-sm text-slate-400 leading-relaxed">All transactions are encrypted and processed through our secure payment gateway.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSESSMENTS MODULE - Updated with Quiz List */}
              {activeTab === 'Assessments' && (
                <div className="max-w-4xl mx-auto w-full">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-xl">
                    <div className="p-6 lg:p-8 border-b border-slate-800 bg-slate-800/20">
                      <h3 className="font-bold text-white text-base lg:text-lg">Your Assessments</h3>
                      <p className="text-xs lg:text-sm text-slate-500 mt-1">Track your quizzes and assignments</p>
                    </div>
                    <div className="p-4 lg:p-6 space-y-4">
                      {studentData.assessments.map((assessment) => (
                        <div key={assessment.id} className="bg-slate-800/40 border border-slate-800 rounded-[1.5rem] lg:rounded-2xl p-5 lg:p-6 hover:bg-slate-800/60 transition-colors group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 ${
                                assessment.status === 'Completed' 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                <ClipboardCheck size={24} className="lg:w-7 lg:h-7" />
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-base lg:text-lg mb-1">{assessment.name}</h4>
                                <p className="text-xs lg:text-sm text-slate-500">{assessment.subject}</p>
                                <p className="text-[10px] lg:text-xs text-slate-600 mt-1 uppercase font-bold tracking-widest">{assessment.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 md:flex-col md:items-end">
                              <span className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider ${
                                assessment.status === 'Completed' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {assessment.status}
                              </span>
                              {assessment.status === 'Completed' && (
                                <div className="text-right">
                                  <p className="text-xs lg:text-sm text-slate-500 uppercase font-bold tracking-widest mb-1">Score</p>
                                  <p className="text-lg lg:text-xl font-black text-white">{assessment.score}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESULTS MODULE - Updated with Marksheet View */}
              {activeTab === 'Results' && (
                <div className="max-w-5xl mx-auto w-full space-y-6 lg:space-y-8">
                  {studentData.results.map((result, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-xl">
                      <div className="p-6 lg:p-8 border-b border-slate-800 bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-white text-base lg:text-lg mb-1">{result.sem}</h3>
                          <p className="text-xs lg:text-sm text-slate-500">Academic Performance Report</p>
                        </div>
                        <div className="flex items-center gap-4 lg:gap-6">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] lg:text-xs text-slate-500 uppercase font-black tracking-widest mb-1">GPA</p>
                            <p className="text-2xl lg:text-3xl font-black text-indigo-400">{result.gpa}</p>
                          </div>
                          <span className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {result.status}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead className="bg-slate-800/50 text-[10px] lg:text-xs uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
                            <tr>
                              <th className="px-6 lg:px-8 py-4 lg:py-5">Subject</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-5 text-center">Credits</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-5 text-center">Marks</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-5 text-center">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-sm lg:text-base">
                            {result.subjects.map((subject, subIdx) => (
                              <tr key={subIdx} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 lg:px-8 py-4 lg:py-5 font-bold text-white">{subject.name}</td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5 text-center text-slate-400 font-medium">{subject.credits}</td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5 text-center text-slate-300 font-bold">{subject.marks}</td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5 text-center">
                                  <span className={`px-3 py-1.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider ${
                                    subject.grade.includes('A') 
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                      : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                  }`}>
                                    {subject.grade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Take Attendance' && <div className="w-full max-w-3xl mx-auto"><FacultyAttendance /></div>}
              
              {activeTab === 'Upload Notes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl mx-auto items-stretch">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 flex flex-col items-center justify-center border-dashed border-2 hover:border-indigo-500/50 transition-colors cursor-pointer group shadow-xl">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-300">
                      <Upload size={28} className="lg:w-8 lg:h-8" />
                    </div>
                    <h4 className="text-lg lg:text-xl font-bold text-white text-center">Upload Materials</h4>
                    <p className="text-sm text-slate-500 text-center mt-3 px-4 lg:px-8 leading-relaxed">Drag and drop academic files (PDF, PPT, Word) for student access.</p>
                    <button className="mt-6 lg:mt-8 text-indigo-400 text-xs font-black uppercase tracking-widest bg-indigo-500/10 px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all">Browse Files</button>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 shadow-xl">
                    <h4 className="font-bold text-white text-base lg:text-lg mb-6 lg:mb-8">Recent Uploads</h4>
                    <div className="space-y-3 lg:space-y-4">
                      {["HCI_Design_Principals.pdf", "DSA_Complexities.pptx", "Intro_to_ML.docx", "Python_Labs_01.pdf"].map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-800/40 rounded-xl lg:rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors group">
                          <div className="flex items-center gap-3 lg:gap-4">
                            <FileText size={18} className="text-indigo-400 lg:w-5 lg:h-5" />
                            <span className="text-sm text-slate-300 font-bold">{file}</span>
                          </div>
                          <button className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><X size={18} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Student Lists' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-5xl mx-auto">
                   <div className="p-6 lg:p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 bg-slate-800/20">
                      <h3 className="text-base lg:text-xl font-bold text-white tracking-tight">Active Student Roster</h3>
                      <div className="relative w-full md:w-72 lg:w-80">
                         <Search className="absolute left-4 top-3 text-slate-500" size={18} />
                         <input 
                           type="text" 
                           placeholder="Search by name or ID..."
                           className="w-full bg-slate-950 border border-slate-700 rounded-xl lg:rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                           value={studentSearch}
                           onChange={(e) => setStudentSearch(e.target.value)}
                         />
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
                          <tr>
                            <th className="px-6 lg:px-8 py-4 lg:py-5">Full Name</th>
                            <th className="px-6 lg:px-8 py-4 lg:py-5">ID Number</th>
                            <th className="px-6 lg:px-8 py-4 lg:py-5">Attendance %</th>
                            <th className="px-6 lg:px-8 py-4 lg:py-5">Status</th>
                            <th className="px-6 lg:px-8 py-4 lg:py-5 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map(s => (
                              <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 lg:px-8 py-4 lg:py-5 font-bold text-white">{s.name}</td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5 text-slate-500 font-medium">{s.id}</td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500" style={{ width: s.attendance }}></div>
                                    </div>
                                    <span className="text-indigo-400 font-black">{s.attendance}</span>
                                  </div>
                                </td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5">
                                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                    s.performance === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                    s.performance === 'Good' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 
                                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  }`}>
                                    {s.performance}
                                  </span>
                                </td>
                                <td className="px-6 lg:px-8 py-4 lg:py-5 text-center">
                                  <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                                    <Eye size={18}/>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-6 lg:px-8 py-16 lg:py-20 text-center text-slate-600 font-medium italic">No students found matching your search.</td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                   </div>
                </div>
              )}

              {activeTab === 'Completion Tracking' && <div className="w-full max-w-4xl mx-auto"><SyllabusProgress /></div>}

            </div>
          )}
        </div>

        {/* AI Assistant FAB - ENLARGED TO 600x800 */}
        <div className="fixed bottom-4 right-4 lg:bottom-10 lg:right-10 z-50">
          {!showChat ? (
            <button onClick={() => setShowChat(true)} className="group bg-indigo-600 hover:bg-indigo-500 text-white p-4 lg:p-5 rounded-full shadow-2xl shadow-indigo-600/40 flex items-center gap-3 lg:gap-4 transition-all duration-300 active:scale-95">
              <span className="font-black text-xs uppercase tracking-widest pl-0 lg:pl-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap hidden lg:inline">Ask EduAI</span>
              <MessageSquare size={20} className="lg:w-6 lg:h-6" />
            </button>
          ) : (
            <div className="w-[90vw] h-[80vh] md:w-[600px] md:h-[800px] bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 origin-bottom-right">
              <div className="p-5 md:p-7 bg-indigo-600 flex items-center justify-between text-white shadow-xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                  <div className="w-10 h-10 md:w-11 md:h-11 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                    <MessageSquare size={20} className="md:w-[22px] md:h-[22px]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm md:text-base tracking-tight leading-none">EduAI Agent</h4>
                    <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-black mt-1 opacity-80">Online & Ready</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all relative z-10">
                  <X size={20} className="md:w-[22px] md:h-[22px]" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-7 space-y-4 md:space-y-5 bg-slate-950/20 custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[90%] px-4 md:px-5 py-3 md:py-4 rounded-2xl md:rounded-3xl text-base md:text-lg leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-500 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl md:rounded-3xl rounded-tl-none text-xs font-bold animate-pulse">
                      Assistant is typing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl md:rounded-[1.5rem] px-4 md:px-5 py-2 md:py-2.5 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                  <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                    placeholder="Ask about your syllabus..." 
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg py-1 md:py-1.5 text-slate-100" 
                  />
                  <button onClick={handleSendMessage} className="text-indigo-400 hover:text-indigo-300 p-1 transition-all">
                    <Send size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Shared Helper Components ---
const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 md:py-4 rounded-[1.25rem] transition-all duration-300 mb-1.5 group ${
    active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
  }`}>
    <Icon size={20} className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
    <span className="font-bold text-[13px] tracking-tight">{label}</span>
  </button>
);

const FacultyAttendance = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl w-full">
    <div className="p-6 lg:p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 bg-slate-800/20">
      <div>
        <h3 className="font-bold text-white text-base lg:text-lg">Mark Attendance</h3>
        <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">DS & Algorithms • Session A • Today</p>
      </div>
      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl transition-all shadow-lg shadow-indigo-600/10">Submit Roll Call</button>
    </div>
    <div className="p-4 lg:p-6 space-y-3">
      {["S001 - John Doe", "S002 - Jane Smith", "S003 - Mike Ross", "S004 - Rachel Zane"].map((name, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[1.5rem] bg-slate-800/20 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-950 flex items-center justify-center font-black text-slate-600 text-xs border border-slate-800">{name.split(' - ')[1].charAt(0)}</div>
            <div>
              <p className="text-sm font-bold text-white">{name.split(' - ')[1]}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{name.split(' - ')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 sm:flex-none px-4 lg:px-5 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 border border-emerald-400/20">Present</button>
            <button className="flex-1 sm:flex-none px-4 lg:px-5 py-2 rounded-xl bg-slate-950 text-slate-600 text-[11px] font-black uppercase tracking-widest border border-slate-800 hover:border-red-500/50 hover:text-red-500 transition-all">Absent</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SyllabusProgress = () => {
  const syllabusTracking = [
    { subject: "Human Computer Interaction", completed: 85, totalModules: 5 },
    { subject: "Data Structures & Algorithms", completed: 60, totalModules: 8 },
    { subject: "AI & Machine Learning", completed: 40, totalModules: 10 }
  ];

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
      {syllabusTracking.map((track, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 shadow-xl group hover:border-indigo-500/30 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 lg:mb-6">
            <div>
              <h4 className="font-bold text-white text-base lg:text-lg tracking-tight">{track.subject}</h4>
              <p className="text-xs text-slate-500 mt-2 uppercase font-black tracking-widest">{track.totalModules} Total Modules</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-indigo-400 leading-none">{track.completed}%</p>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1.5">Coverage</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-600/30" style={{ width: `${track.completed}%` }}></div>
          </div>
          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row justify-between gap-3">
             <button className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors justify-center sm:justify-start"><PlusCircle size={16}/> Add Lesson Node</button>
             <button className="text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:underline text-center sm:text-right">Update Curriculum</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() { return <EduSmartApp />; }
