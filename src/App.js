import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';

// 1. Icons from lucide-react
import { 
  BookOpen, GraduationCap, ChevronRight, Briefcase, ArrowLeft, 
  AlertCircle, Send, Clock, Users, BarChart3, Bell, 
  ClipboardCheck, CreditCard, Smartphone, ShieldCheck, 
  MoreVertical, Download, Save, Search, Eye, PlusCircle, 
  Upload, Settings, MessageSquare, X, FileText, Menu, LogOut 
} from 'lucide-react';

// 2. Charts and Utilities
import { 
  ResponsiveContainer, LineChart, Line, CartesianGrid, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import QRCode from 'react-qr-code';
import axios from 'axios';

// 3. Your Context (Using capital 'C' to match your disk folder)
import { UserProvider, useUser } from './Context/UserContext';

// 4. Internal Components (From your src/components folder)
import Sidebar from './components/Sidebar';
import AttendanceGuard from './components/AttendanceGuard';

// 5. Constants & Helper Components
const MODEL_NAME = "gemini-2.5-flash";

// This fixes the 'CardIcon is not defined' error
const CardIcon = ({ icon: Icon, color }) => (
  <div className={`p-2 rounded-lg ${color}`}>
    <Icon size={20} />
  </div>
);
// --- Configuration & API Logic ---
const apiKey = process.env.REACT_APP_GEMINI_KEY;


const SYSTEM_PROMPT = `
You are EduAI, the AI Academic Assistant for EduSmart university portal.
Be professional and concise. Help with university syllabus, doubts, academic planning,
exam preparation, and career guidance.

LANGUAGE POLICY:
- Detect the language of each user message automatically.
- If the user writes in Hindi, Hinglish (Hindi-English mix), Kannada, Tamil, Telugu,
  or any other Indian regional language, reply fluently in the SAME language/mix.
- For Hinglish, use natural conversational mixing like "Aapka assignment kal tak submit
  karna hai, so please complete it on time."
- For pure English queries, reply in clear professional English.
- Never switch to English when the user is clearly writing in a regional language.

FORMATTING:
- Use clear markdown headings and bullet points.
- Keep responses under 200 words unless a detailed explanation is required.
`.trim();

// ─── Utilities ─────────────────────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const calcTotal = (s) =>
  (s.ca1 || 0) + (s.ca2 || 0) + (s.ca3 || 0) + (s.midterm || 0) + (s.endterm || 0);

// ─── Static Data ───────────────────────────────────────────────────────────────
const SYLLABUS = [
  { name: "Human Computer Interaction",   code: "CS401", modules: 5,  description: "Focuses on design and evaluation of UI/UX." },
  { name: "Data Structures & Algorithms", code: "CS202", modules: 6,  description: "Core logic and complexity analysis." },
  { name: "Cloud Computing",              code: "CS505", modules: 4,  description: "AWS, Azure, and distributed systems." },
  { name: "AI & Machine Learning",        code: "CS601", modules: 8,  description: "Neural networks and Deep Learning." },
  { name: "Python Programming",           code: "CS105", modules: 4,  description: "Scripting and advanced data processing." },
  { name: "Java Development",             code: "CS205", modules: 6,  description: "OOP principles and Enterprise apps." },
  { name: "Computer Networks",            code: "CS301", modules: 5,  description: "TCP/IP, Routing, and Security fundamentals." },
  { name: "Operating Systems",            code: "CS208", modules: 7,  description: "Kernels, threads, and memory management." },
  { name: "Discrete Mathematics",         code: "CS102", modules: 6,  description: "Set theory, logic, and graph theory." },
];

const TIMETABLE_SLOTS = [
  { time: "09:00 - 10:00", period: "1" },
  { time: "10:00 - 11:00", period: "2" },
  { time: "11:00 - 12:00", period: "3" },
  { time: "12:00 - 01:00", period: "LUNCH", isBreak: true },
  { time: "01:00 - 02:00", period: "4" },
  { time: "02:00 - 03:00", period: "5" },
  { time: "03:00 - 04:00", period: "6" },
];

// ─── Login Screen ──────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const { login } = useUser();
  const navigate   = useNavigate();

  const [step,      setStep]      = useState(1);
  const [role,      setRole]      = useState(null);
  const [form,      setForm]      = useState({ email: '', password: '' });
  const [error,     setError]     = useState('');

  const selectRole = (r) => { setRole(r); setStep(2); setError(''); };
  const back       = ()  => { setStep(1); setRole(null); setForm({ email: '', password: '' }); setError(''); };

 const handleLogin = async () => {
    // Keep your existing validation
  // if (!form.email.includes('@gmail.com')) { 
    //  setError('Please use a valid Gmail address (@gmail.com)'); 
      //return; 
    //}
    if (!form.password) { 
      setError('Please enter your password'); 
      return; 
    }

    try {
      // Use axios to talk to the 'AuthroutesJS.js' on your server
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        email: form.email,
        password: form.password,
        role: role 
      });

      // Destructure data from the server response
      const { token, user } = response.data;

      // Store the JWT so the user stays logged in
      localStorage.setItem('token', token);
      
      // Update your global state and redirect
      login(user); 
      navigate('/home');

    } catch (err) {
      // Show the actual error from the server (like "User not found")
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-200 antialiased">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <BookOpen className="text-white w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">EduSmart</h1>
              <p className="text-sm text-slate-500">Select your role to continue</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => selectRole('student')} className="w-full bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 p-8 rounded-[2rem] transition-all shadow-xl shadow-indigo-600/20 group">
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

              <button onClick={() => selectRole('faculty')} className="w-full bg-slate-800 hover:bg-slate-700 p-8 rounded-[2rem] transition-all border-2 border-slate-700 hover:border-slate-600 group">
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

        {step === 2 && (
          <div className="space-y-6">
            <button onClick={back} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4">
              <ArrowLeft size={16} /> Back to role selection
            </button>
            <div className="text-center mb-8">
              <div className={`w-14 h-14 ${role === 'student' ? 'bg-indigo-600' : 'bg-slate-700'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                {role === 'student' ? <GraduationCap className="text-white w-7 h-7" /> : <Briefcase className="text-white w-7 h-7" />}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{role === 'student' ? 'Student' : 'Faculty'} Login</h1>
              <p className="text-sm text-slate-500">Enter your credentials to continue</p>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gmail Address</label>
                <input type="email" placeholder="yourname@gmail.com"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            <button onClick={handleLogin}
              className={`w-full ${role === 'student' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'} text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg mt-6`}>
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
};

// ─── Circular Progress (Attendance) ───────────────────────────────────────────
const CircularProgress = ({ percentage }) => {
  const radius = 65;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (percentage / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg className="w-40 h-40 transform -rotate-90">
        <circle cx="80" cy="80" r={radius} strokeWidth="10" fill="transparent" className="stroke-slate-800" />
        <circle cx="80" cy="80" r={radius} strokeWidth="10" fill="transparent"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="stroke-indigo-500 transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">{percentage}%</span>
        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Attendance</span>
      </div>
    </div>
  );
};

// ─── Timetable ─────────────────────────────────────────────────────────────────
const TimetableUI = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full">
    <div className="overflow-x-auto">
      <table className="w-full text-center border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <th className="py-4 border-r border-slate-800">Time / Period</th>
            {["Mon","Tue","Wed","Thu","Fri"].map(d => <th key={d} className="py-4 px-4">{d}</th>)}
          </tr>
        </thead>
        <tbody className="text-[13px]">
          {TIMETABLE_SLOTS.map((slot, idx) => (
            <tr key={idx} className={`border-t border-slate-800 ${slot.isBreak ? 'bg-amber-500/5' : ''}`}>
              <td className="py-5 border-r border-slate-800 bg-slate-900/50">
                <p className="font-bold text-slate-300">{slot.time}</p>
                <p className="text-[10px] text-slate-600 uppercase font-bold">P{slot.period}</p>
              </td>
              {[1,2,3,4,5].map(d => (
                <td key={d} className="py-4 px-3">
                  {slot.isBreak
                    ? <span className="text-[10px] font-black text-amber-600/80 tracking-widest">LUNCH</span>
                    : <div className="bg-slate-800/30 p-2 rounded-lg border border-slate-800 group hover:border-indigo-500/40 transition-colors cursor-pointer">
                        <p className="text-indigo-400 font-bold text-[11px]">CS-{100 + (idx * d * 37) % 400}</p>
                        <p className="text-slate-600 text-[10px]">Room 30{d}</p>
                      </div>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Marks Row (memoised) ──────────────────────────────────────────────────────
const MarkInput = memo(({ value, max, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  const debouncedVal = useDebounce(localVal, 500);

  useEffect(() => { onChange(debouncedVal); }, [debouncedVal]); // eslint-disable-line
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <input type="number" min="0" max={max} value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      className="w-16 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-2 text-center outline-none
        focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm font-bold text-white"
    />
  );
});

const MarksRow = memo(({ student, onUpdate }) => {
  const total = calcTotal(student);
  return (
    <tr className="hover:bg-slate-800/20 transition-colors">
      <td className="px-6 lg:px-8 py-4 lg:py-5 sticky left-0 bg-slate-900 z-10">
        <p className="font-bold text-white">{student.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{student.id}</p>
      </td>
      {['ca1','ca2','ca3'].map(f => (
        <td key={f} className="px-4 py-4 text-center">
          <MarkInput value={student[f]} max={20} onChange={(v) => onUpdate(student.id, f, v)} />
        </td>
      ))}
      <td className="px-4 py-4 text-center">
        <MarkInput value={student.midterm} max={50} onChange={(v) => onUpdate(student.id, 'midterm', v)} />
      </td>
      <td className="px-4 py-4 text-center">
        <MarkInput value={student.endterm} max={100} onChange={(v) => onUpdate(student.id, 'endterm', v)} />
      </td>
      <td className="px-6 lg:px-8 py-4 text-center bg-indigo-500/5">
        <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
          <span className="text-lg font-black text-indigo-400">{total}</span>
        </div>
      </td>
    </tr>
  );
});

// ─── QR Code Generator ─────────────────────────────────────────────────────────
const QRGenerator = ({ session }) => {
  // Create the data string
  const payload = JSON.stringify({ 
    session, 
    timestamp: Date.now(), 
    campus: 'BLR-MAIN' 
  });

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-4 rounded-2xl">
      {/* This is the correct way to use react-qr-code */}
      <QRCode 
        value={payload} 
        size={220}
        level="H" 
      />
      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
        Scan to mark attendance
      </p>
    </div>
  );
};

// ─── XLSX export helpers ───────────────────────────────────────────────────────
const exportStudentList = (students) => {
  const rows = students.map(s => ({
    'Student ID':  s.id,
    'Full Name':   s.name,
    'Email':       s.email,
    'Attendance':  s.attendance,
    'Performance': s.performance,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'student_list.xlsx');
};

const exportMarks = (marks) => {
  const rows = marks.map(s => ({
    'Student ID': s.id,
    'Name':       s.name,
    'CA1 (/20)':  s.ca1,
    'CA2 (/20)':  s.ca2,
    'CA3 (/20)':  s.ca3,
    'Midterm (/50)': s.midterm,
    'Endterm (/100)': s.endterm,
    'Total (/210)':  calcTotal(s),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marks');
  XLSX.writeFile(wb, 'student_marks.xlsx');
};

// ─── AI Chat FAB ───────────────────────────────────────────────────────────────
const AIChatFAB = () => {
  // 1. These define your variables (State)
  const [open, setOpen]      = useState(false);
  const [messages, setMsgs]  = useState([
    { role: 'assistant', content: 'Namaste! Main aapka EduAI Academic Assistant hoon. Aap koi bhi question pooch sakte hain — English, Hindi, Hinglish, Kannada, ya kisi bhi language mein! 🎓' }
  ]);
  const [input, setInput]    = useState('');
  const [typing, setTyping]  = useState(false);
  const endRef               = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // 2. The send function MUST be inside these curly braces to see the variables above
  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${input}` }]
          }]
        }),
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI Assistant unavailable.';
      
      setMsgs(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setTyping(false);
    }
  };

  // 3. The return (UI) stays at the bottom of the component
  return (
    <div className="fixed bottom-4 right-4 lg:bottom-10 lg:right-10 z-50">
      {/* ... the rest of your AIChatFAB UI code ... */}
    </div>
  );
}; 

// ─── Page: Student Home ────────────────────────────────────────────────────────
const StudentHome = () => {
  const { studentData } = useUser();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-2 space-y-6 lg:space-y-8">
        {/* Attendance + GPA */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10
          flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mt-20" />
          <CircularProgress percentage={studentData.attendance} />
          <div className="flex-1 space-y-4">
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Academic Overview</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Your attendance is solid. Keep it up to maintain academic standing!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Semester GPA</p>
                <p className="text-2xl font-black text-white">3.85</p>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Current Rank</p>
                <p className="text-2xl font-black text-indigo-400">#12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-xl">
          <h4 className="font-bold text-white text-sm mb-6 uppercase tracking-widest text-slate-400">
            Attendance Trend
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={studentData.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Next Class + Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-6 shadow-xl">
            <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-slate-500">Next Class</h4>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Clock size={20} /></div>
              <div>
                <p className="text-white font-bold">HCI: Design Lab</p>
                <p className="text-xs text-slate-500">Starts in 45m • Lab 202</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-6 shadow-xl">
            <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-slate-500">Assignments</h4>
            <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              <span className="text-sm font-bold text-white">DSA Quiz #4</span>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-black">2 Days Left</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:space-y-6">
        {/* Grade Distribution Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
          <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-slate-500">Grade Distribution</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={studentData.gradeDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name }) => name}>
                {studentData.gradeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fee card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 lg:p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-base font-bold mb-1"></h4>
            <p className="text-indigo-200 text-sm opacity-80 mb-6">Tuition Fees 2024</p>
            <p className="text-3xl font-black tracking-tighter mb-6">₹{studentData.feeAmount.toLocaleString()}</p>
            <button onClick={() => navigate('/pay-fee')}
              className="w-full bg-white text-indigo-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg">
              Make Payment
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-6 shadow-xl">
          <h4 className="font-bold text-xs mb-6 uppercase tracking-widest text-slate-500">Notices</h4>
          <div className="space-y-6">
            <div className="flex gap-4 pb-6 border-b border-slate-800/50">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-lg shadow-indigo-500/50" />
              <div>
                <p className="text-xs text-white font-medium">Exam registration deadline extended until Feb 15</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1.5">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-lg shadow-emerald-500/50" />
              <div>
                <p className="text-xs text-white font-medium">New digital marksheet available for Sem 3</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1.5">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page: Faculty Home ────────────────────────────────────────────────────────
const FacultyHome = () => {
  const { facultyData } = useUser();
  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Assigned Students", value: "482", icon: Users,    color: "text-blue-400"   },
          { label: "Avg. Presence",     value: "91%", icon: BarChart3, color: "text-emerald-400" },
          { label: "Live Courses",      value: "3",   icon: BookOpen,  color: "text-indigo-400"  },
          { label: "System Alerts",     value: "05",  icon: Bell,      color: "text-amber-400"   },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-5 lg:p-7 hover:border-slate-700 transition-colors">
            <stat.icon size={20} className={`${stat.color} mb-3 lg:mb-5`} />
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{stat.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Avg Attendance Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-xl">
          <h3 className="font-bold text-white mb-6">Class Avg. Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={facultyData.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Course progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-xl">
          <h3 className="font-bold text-white mb-6">Course Progress</h3>
          <div className="space-y-5">
            {facultyData.syllabusTracking.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>{s.subject}</span><span>{s.completed}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all duration-700" style={{ width: `${s.completed}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page: Results ─────────────────────────────────────────────────────────────
const ResultsPage = () => {
  const { studentData } = useUser();
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 lg:space-y-8">
      {studentData.results.map((result, idx) => (
        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="p-6 lg:p-8 border-b border-slate-800 bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">{result.sem}</h3>
              <p className="text-xs text-slate-500">Academic Performance Report</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">GPA</p>
                <p className="text-3xl font-black text-indigo-400">{result.gpa}</p>
              </div>
              <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {result.status}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 lg:px-8 py-4">Subject</th>
                  <th className="px-6 lg:px-8 py-4 text-center">Credits</th>
                  <th className="px-6 lg:px-8 py-4 text-center">Marks</th>
                  <th className="px-6 lg:px-8 py-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.subjects.map((s, si) => (
                  <tr key={si} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 lg:px-8 py-4 font-bold text-white">{s.name}</td>
                    <td className="px-6 lg:px-8 py-4 text-center text-slate-400">{s.credits}</td>
                    <td className="px-6 lg:px-8 py-4 text-center text-slate-300 font-bold">{s.marks}</td>
                    <td className="px-6 lg:px-8 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${s.grade.includes('A') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>
                        {s.grade}
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
  );
};

// ─── Page: Assessments ─────────────────────────────────────────────────────────
const AssessmentsPage = () => {
  const { studentData } = useUser();
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-800/20">
          <h3 className="font-bold text-white text-lg">Your Assessments</h3>
          <p className="text-xs text-slate-500 mt-1">Track your quizzes and assignments</p>
        </div>
        <div className="p-4 space-y-4">
          {studentData.assessments.map((a) => (
            <div key={a.id} className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 group hover:bg-slate-800/60 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <ClipboardCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{a.name}</h4>
                    <p className="text-sm text-slate-500">{a.subject}</p>
                    <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-widest">{a.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    {a.status}
                  </span>
                  {a.status === 'Completed' && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-1">Score</p>
                      <p className="text-xl font-black text-white">{a.score}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Page: Pay Fee ─────────────────────────────────────────────────────────────
const PayFeePage = () => {
  const { studentData } = useUser();
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 lg:space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold mb-1">Pending Balance</h3>
              <p className="text-indigo-200 text-sm opacity-80">Semester Fee 2024</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="text-5xl font-black tracking-tighter mb-2">₹{studentData.feeAmount.toLocaleString()}</p>
          <p className="text-indigo-200 text-sm opacity-70">Due Date: March 15, 2026</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-xl">
        <h4 className="font-bold text-white text-lg mb-8">Select Payment Method</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Smartphone, title: "UPI Payment",  sub: "Google Pay, PhonePe, Paytm", badge: "Instant" },
            { icon: CreditCard,   title: "Card Payment", sub: "Credit or Debit Card",        badge: "Secure"  },
          ].map((m, i) => (
            <button key={i} className="group bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-[2rem] transition-all text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-700/50 group-hover:bg-indigo-500/10 rounded-2xl flex items-center justify-center transition-colors">
                  <m.icon size={24} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div>
                  <h5 className="text-white font-bold text-lg">{m.title}</h5>
                  <p className="text-slate-500 text-sm">{m.sub}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 uppercase font-black tracking-widest">{m.badge}</span>
                <ChevronRight size={20} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-8 p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Secure Payment</p>
              <p className="text-sm text-slate-400 leading-relaxed">All transactions are encrypted and processed through our secure payment gateway.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page: Syllabus ────────────────────────────────────────────────────────────
const SyllabusPage = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
    {SYLLABUS.map(sub => (
      <div key={sub.code} className="bg-slate-900 border border-slate-800 p-6 lg:p-8 rounded-[2rem] hover:border-indigo-500/50 transition-all group shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">{sub.code}</div>
          <MoreVertical size={16} className="text-slate-600" />
        </div>
        <h4 className="text-lg font-bold text-white mb-3 tracking-tight">{sub.name}</h4>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed h-12 overflow-hidden">{sub.description}</p>
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/60">
          <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">{sub.modules} Modules</span>
          <button className="text-indigo-400 text-sm font-bold hover:underline flex items-center gap-2">Download <Download size={14}/></button>
        </div>
      </div>
    ))}
  </div>
);

// ─── Page: Faculty Attendance ──────────────────────────────────────────────────
const AttendancePage = () => {
  const SESSION = `DSA-Session-${new Date().toISOString().slice(0, 10)}`;
  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* QR for faculty */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="font-bold text-white text-lg mb-6 text-center">Today's Attendance QR</h3>
        <QRGenerator session={SESSION} />
      </div>

      {/* Roll call */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/20">
          <div>
            <h3 className="font-bold text-white text-lg">Mark Attendance</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">DS & Algorithms • Session A • Today</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/10">
            Submit Roll Call
          </button>
        </div>
        <div className="p-4 space-y-3">
          {["S001 - John Doe","S002 - Jane Smith","S003 - Mike Ross","S004 - Rachel Zane"].map((name, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[1.5rem] bg-slate-800/20 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-slate-600 text-xs border border-slate-800">
                  {name.split(' - ')[1].charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{name.split(' - ')[1]}</p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{name.split(' - ')[0]}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 border border-emerald-400/20">Present</button>
                <button className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-950 text-slate-600 text-[11px] font-black uppercase tracking-widest border border-slate-800 hover:border-red-500/50 hover:text-red-500 transition-all">Absent</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student geo-verification section */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="font-bold text-white text-lg mb-2">Student Self-Check-In</h3>
        <p className="text-slate-500 text-sm mb-6">Students use this flow on their own devices to verify campus presence.</p>
        <AttendanceGuard
          onVerified={() => console.log('Student verified on campus')}
          onDenied={() => console.log('Student outside campus')}
        />
      </div>
    </div>
  );
};

// ─── Page: Upload Marks ────────────────────────────────────────────────────────
const UploadMarksPage = () => {
  const { facultyData, updateMark } = useUser();
  const marks = facultyData.marksData;

  return (
    <div className="w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 lg:p-8 border-b border-slate-800 bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-lg mb-1">Upload Student Marks</h3>
            <p className="text-sm text-slate-500">Data Structures & Algorithms • Semester 4</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportMarks(marks)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2">
              <Download size={16} /> Export Excel
            </button>
            <button onClick={() => alert('Marks saved!')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2">
              <Save size={16} /> Save All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-6 lg:px-8 py-5 sticky left-0 bg-slate-800/50 z-10">Student Details</th>
                <th className="px-4 py-5 text-center">CA1<br/><span className="text-[8px] text-slate-600">(Max 20)</span></th>
                <th className="px-4 py-5 text-center">CA2<br/><span className="text-[8px] text-slate-600">(Max 20)</span></th>
                <th className="px-4 py-5 text-center">CA3<br/><span className="text-[8px] text-slate-600">(Max 20)</span></th>
                <th className="px-4 py-5 text-center">Midterm<br/><span className="text-[8px] text-slate-600">(Max 50)</span></th>
                <th className="px-4 py-5 text-center">Endterm<br/><span className="text-[8px] text-slate-600">(Max 100)</span></th>
                <th className="px-6 lg:px-8 py-5 text-center bg-indigo-500/5">Total<br/><span className="text-[8px] text-slate-600">(210)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {marks.map((student) => (
                <MarksRow key={student.id} student={student} onUpdate={updateMark} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 lg:p-8 border-t border-slate-800 bg-slate-800/10">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Debounced Auto-Save (500ms)</p>
              <p className="text-sm text-slate-400 leading-relaxed">Input updates are debounced for 500ms to prevent lag. Click "Save All" to finalize.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page: Student Lists ───────────────────────────────────────────────────────
const StudentListsPage = () => {
  const { facultyData } = useUser();
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => facultyData.managedStudents.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    ),
    [search, facultyData.managedStudents]
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-5xl mx-auto">
      <div className="p-6 lg:p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/20">
        <h3 className="text-xl font-bold text-white">Active Student Roster</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3 text-slate-500" size={18} />
            <input type="text" placeholder="Search by name or ID..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => exportStudentList(facultyData.managedStudents)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 lg:px-8 py-5">Full Name</th>
              <th className="px-6 lg:px-8 py-5">ID Number</th>
              <th className="px-6 lg:px-8 py-5">Attendance %</th>
              <th className="px-6 lg:px-8 py-5">Status</th>
              <th className="px-6 lg:px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filtered.length > 0 ? filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 lg:px-8 py-5 font-bold text-white">{s.name}</td>
                <td className="px-6 lg:px-8 py-5 text-slate-500">{s.id}</td>
                <td className="px-6 lg:px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: s.attendance }} />
                    </div>
                    <span className="text-indigo-400 font-black">{s.attendance}</span>
                  </div>
                </td>
                <td className="px-6 lg:px-8 py-5">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                    ${s.performance === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : s.performance === 'Good' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    {s.performance}
                  </span>
                </td>
                <td className="px-6 lg:px-8 py-5 text-center">
                  <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center text-slate-600 font-medium italic">
                  No students found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Page: Completion Tracking ─────────────────────────────────────────────────
const CompletionTrackingPage = () => {
  const { facultyData } = useUser();
  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {facultyData.syllabusTracking.map((track, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-xl group hover:border-indigo-500/30 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div>
              <h4 className="font-bold text-white text-lg tracking-tight">{track.subject}</h4>
              <p className="text-xs text-slate-500 mt-2 uppercase font-black tracking-widest">{track.totalModules} Total Modules</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-indigo-400 leading-none">{track.completed}%</p>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1.5">Coverage</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-600/30"
              style={{ width: `${track.completed}%` }} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <button className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
              <PlusCircle size={16} /> Add Lesson Node
            </button>
            <button className="text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:underline">
              Update Curriculum
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Page: Upload Notes ────────────────────────────────────────────────────────
const UploadNotesPage = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl mx-auto items-stretch">
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center border-dashed border-2 hover:border-indigo-500/50 transition-colors cursor-pointer group shadow-xl">
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-300">
        <Upload size={28} />
      </div>
      <h4 className="text-xl font-bold text-white text-center">Upload Materials</h4>
      <p className="text-sm text-slate-500 text-center mt-3 px-8 leading-relaxed">Drag and drop academic files (PDF, PPT, Word) for student access.</p>
      <button className="mt-8 text-indigo-400 text-xs font-black uppercase tracking-widest bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all">
        Browse Files
      </button>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
      <h4 className="font-bold text-white text-lg mb-8">Recent Uploads</h4>
      <div className="space-y-4">
        {["HCI_Design_Principals.pdf","DSA_Complexities.pptx","Intro_to_ML.docx","Python_Labs_01.pdf"].map((file, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors group">
            <div className="flex items-center gap-4">
              <FileText size={18} className="text-indigo-400" />
              <span className="text-sm text-slate-300 font-bold">{file}</span>
            </div>
            <button className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><X size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Dashboard Shell ───────────────────────────────────────────────────────────
// Maps current URL pathname → page title shown in header
const PAGE_TITLES = {
  '/home':                'Home',
  '/timetable':           'Timetable',
  '/syllabus':            'Syllabus',
  '/pay-fee':             'Pay Fee',
  '/assessments':         'Assessments',
  '/results':             'Results',
  '/attendance':          'Take Attendance',
  '/upload-marks':        'Upload Marks',
  '/upload-notes':        'Upload Notes',
  '/student-lists':       'Student Lists',
  '/completion-tracking': 'Completion Tracking',
};

const DashboardShell = () => {
  const { userRole, studentData, facultyData, logout } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const dropRef    = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';
  const name      = userRole === 'student' ? studentData.name  : facultyData.name;
  const uid       = userRole === 'student' ? studentData.id    : facultyData.id;
  const initials  = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    const handle = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowProfileDrop(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleSignOut = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans antialiased">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto relative bg-slate-950 flex flex-col">
        {/* Header */}
        <header className="h-16 lg:h-20 border-b border-slate-800/60 flex items-center justify-between
          px-4 lg:px-10 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">{pageTitle}</h2>
              <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-widest font-black hidden sm:block">
                {uid} • {name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <button className="p-2 lg:p-2.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 relative hover:text-white transition-all">
              <Bell size={16} className="lg:w-[18px] lg:h-[18px]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-slate-900" />
            </button>

            <div className="relative" ref={dropRef}>
              <button onClick={() => setShowProfileDrop(p => !p)}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[2px] hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-[10px] lg:text-xs text-white">
                  {initials}
                </div>
              </button>

              {showProfileDrop && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{uid}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition-all text-sm font-medium">
                      <Settings size={18} /> <span>Edit Profile</span>
                    </button>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                      <LogOut size={18} /> <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-10 w-full max-w-7xl mx-auto flex flex-col">
          <Routes>
            {/* Shared routes */}
            <Route path="/home"      element={userRole === 'student' ? <StudentHome /> : <FacultyHome />} />
            <Route path="/timetable" element={<TimetableUI />} />
            <Route path="/syllabus"  element={<SyllabusPage />} />

            {/* Student routes */}
            <Route path="/pay-fee"    element={<PayFeePage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/results"    element={<ResultsPage />} />

            {/* Faculty routes */}
            <Route path="/attendance"          element={<AttendancePage />} />
            <Route path="/upload-marks"        element={<UploadMarksPage />} />
            <Route path="/upload-notes"        element={<UploadNotesPage />} />
            <Route path="/student-lists"       element={<StudentListsPage />} />
            <Route path="/completion-tracking" element={<CompletionTrackingPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>

        <AIChatFAB />
      </main>
    </div>
  );
};

// ─── Protected Route Wrapper ───────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { userRole } = useUser();
  if (!userRole) return <Navigate to="/" replace />;
  return children;
};

// ─── Root App ──────────────────────────────────────────────────────────────────
const App = () => (
  <UserProvider>
    <Router>
      <Routes>
        <Route path="/"  element={<LoginScreen />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  </UserProvider>
);

export default App;
