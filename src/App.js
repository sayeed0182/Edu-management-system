import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Scan, MapPin, User, Award, Target, TrendingUp, 
  Calendar, BookOpen, Target as TargetIcon, CheckCircle2, 
  Clock, Sparkles, Moon, Sun, QrCode, BarChart3, 
  AlertTriangle, Users, BookMarked, ChevronRight,
  Zap, Trophy, Star, ArrowUp, ArrowDown
} from 'lucide-react';

const EduManagementSystem = () => {
  const [activeView, setActiveView] = useState('student');
  const [scanningQR, setScanningQR] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [student] = useState({
    name: 'Alex Rivera',
    id: 'STU2024001',
    level: 12,
    xp: 2850,
    nextLevelXP: 3000,
    engagementScore: 87,
    attendanceStreak: 15
  });

  // Simulated QR scanning
  const handleQRScan = () => {
    setScanningQR(true);
    setTimeout(() => setScanningQR(false), 3000);
  };

  // 12-week productivity heatmap data
  const heatmapData = Array.from({ length: 84 }, (_, i) => ({
    day: i,
    value: Math.floor(Math.random() * 5)
  }));

  // AI Productivity Tasks
  const productivityTasks = [
    { id: 1, task: 'Complete React Hooks Tutorial', xp: 50, category: 'Web Development', time: '45 min' },
    { id: 2, task: 'Practice DSA - Binary Trees', xp: 75, category: 'Algorithms', time: '60 min' },
    { id: 3, task: 'Review Yesterday\'s Lecture Notes', xp: 30, category: 'Academics', time: '20 min' },
    { id: 4, task: 'Mock Interview Prep - Behavioral', xp: 100, category: 'Career', time: '90 min' }
  ];

  // Career paths for onboarding
  const careerPaths = [
    { id: 'webdev', name: 'Web Development', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { id: 'ai', name: 'AI/ML Engineer', icon: '🤖', color: 'from-purple-500 to-pink-500' },
    { id: 'finance', name: 'Finance/Quant', icon: '📊', color: 'from-green-500 to-emerald-500' },
    { id: 'product', name: 'Product Manager', icon: '🎯', color: 'from-orange-500 to-red-500' },
    { id: 'research', name: 'Research Scientist', icon: '🔬', color: 'from-indigo-500 to-violet-500' },
    { id: 'designer', name: 'UX Designer', icon: '🎨', color: 'from-pink-500 to-rose-500' }
  ];

  // Faculty Analytics Data
  const atRiskStudents = [
    { name: 'John Doe', score: 34, trend: 'down', attendance: '45%', lastActive: '5 days ago' },
    { name: 'Sarah Chen', score: 42, trend: 'down', attendance: '58%', lastActive: '3 days ago' },
    { name: 'Mike Johnson', score: 51, trend: 'stable', attendance: '62%', lastActive: '2 days ago' }
  ];

  const classPerformance = [
    { class: 'CS101', attendance: 85, completion: 92 },
    { class: 'CS202', attendance: 78, completion: 85 },
    { class: 'MATH301', attendance: 72, completion: 78 },
    { class: 'ENG101', attendance: 90, completion: 95 }
  ];

  const sixMonthTrends = [
    { month: 'Sep', attendance: 78, engagement: 65 },
    { month: 'Oct', attendance: 82, engagement: 72 },
    { month: 'Nov', attendance: 85, engagement: 78 },
    { month: 'Dec', attendance: 80, engagement: 75 },
    { month: 'Jan', attendance: 88, engagement: 85 },
    { month: 'Feb', attendance: 90, engagement: 87 }
  ];

  // Onboarding Flow
  const OnboardingWizard = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full p-8 shadow-2xl`}>
        {onboardingStep === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome to EduManage AI! 🎓</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 text-lg`}>
              Let's personalize your learning journey based on your career goals
            </p>
            <button
              onClick={() => setOnboardingStep(1)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Get Started
            </button>
          </div>
        )}

        {onboardingStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">What's your career interest?</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {careerPaths.map(career => (
                <button
                  key={career.id}
                  onClick={() => setSelectedCareer(career.id)}
                  className={`p-6 rounded-xl border-2 transition ${
                    selectedCareer === career.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-4xl mb-2 bg-gradient-to-r ${career.color} bg-clip-text text-transparent`}>
                    {career.icon}
                  </div>
                  <div className="font-semibold">{career.name}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setOnboardingStep(0)}
                className={`px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                Back
              </button>
              <button
                onClick={() => setOnboardingStep(2)}
                disabled={!selectedCareer}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">You're All Set! ✨</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Your AI learning assistant will now curate personalized tasks for your {careerPaths.find(c => c.id === selectedCareer)?.name} journey
            </p>
            <button
              onClick={() => setOnboardingStep(-1)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Student Dashboard
  const StudentDashboard = () => (
    <div className="space-y-6">
      {/* QR Scanner Section */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Mark Attendance</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Scan QR code to check-in</p>
          </div>
          <button
            onClick={handleQRScan}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition"
          >
            <QrCode className="w-5 h-5" />
            Scan QR
          </button>
        </div>

        {scanningQR && (
          <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-64 h-64 border-4 border-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Scan className="w-32 h-32 text-blue-500 animate-spin" style={{animationDuration: '3s'}} />
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center gap-2 justify-center text-green-500">
                  <MapPin className="w-5 h-5" />
                  <span className="font-mono">GPS Verified: Campus Block A</span>
                </div>
                <div className="flex items-center gap-2 justify-center text-blue-500">
                  <User className="w-5 h-5" />
                  <span className="font-mono">Face Identity: Match 98.7%</span>
                </div>
                <div className="text-lg font-semibold text-green-600 mt-4">✓ Attendance Marked Successfully!</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gamification Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8" />
            <div>
              <div className="text-sm opacity-90">Current Level</div>
              <div className="text-3xl font-bold font-mono">{student.level}</div>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2 mb-2">
            <div className="bg-white rounded-full h-2" style={{width: `${(student.xp / student.nextLevelXP) * 100}%`}}></div>
          </div>
          <div className="text-xs opacity-80">{student.xp} / {student.nextLevelXP} XP to Level {student.level + 1}</div>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8" />
            <div>
              <div className="text-sm opacity-90">Engagement Score</div>
              <div className="text-3xl font-bold font-mono">{student.engagementScore}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+5% from last week</span>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8" />
            <div>
              <div className="text-sm opacity-90">Attendance Streak</div>
              <div className="text-3xl font-bold font-mono">{student.attendanceStreak}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            <span>days in a row 🔥</span>
          </div>
        </div>
      </div>

      {/* AI Productivity Hub */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Productivity Hub</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Personalized micro-tasks for your career goal</p>
          </div>
        </div>

        <div className="space-y-3">
          {productivityTasks.map(task => (
            <div key={task.id} className={`p-4 rounded-xl border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500/50' : 'border-gray-100 hover:border-purple-300'} transition cursor-pointer`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{task.task}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {task.time}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                      {task.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-green-600">+{task.xp} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub-style Productivity Heatmap */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <h2 className="text-xl font-bold mb-4">12-Week Activity Heatmap</h2>
        <div className="grid grid-cols-12 gap-1">
          {heatmapData.map((day, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${
                day.value === 0 ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') :
                day.value === 1 ? 'bg-green-200 dark:bg-green-900' :
                day.value === 2 ? 'bg-green-300 dark:bg-green-700' :
                day.value === 3 ? 'bg-green-400 dark:bg-green-600' :
                'bg-green-500 dark:bg-green-500'
              }`}
              title={`Day ${i + 1}: ${day.value} activities`}
            ></div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className={`w-4 h-4 rounded-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
            <div className="w-4 h-4 bg-green-200 dark:bg-green-900 rounded-sm"></div>
            <div className="w-4 h-4 bg-green-300 dark:bg-green-700 rounded-sm"></div>
            <div className="w-4 h-4 bg-green-400 dark:bg-green-600 rounded-sm"></div>
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );

  // Faculty Analytics View
  const FacultyAnalytics = () => (
    <div className="space-y-6">
      {/* Early Warning System */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Early Warning System</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Students at risk of falling behind</p>
          </div>
        </div>

        <div className="space-y-3">
          {atRiskStudents.map((student, i) => (
            <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{student.name}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last active: {student.lastActive}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold font-mono text-red-600">{student.score}</span>
                    {student.trend === 'down' && <ArrowDown className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="text-sm text-gray-500">Risk Score</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Attendance: <span className="font-semibold">{student.attendance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Performance Heatmap */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <h2 className="text-xl font-bold mb-6">Class Performance Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="class" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="attendance" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completion" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Attendance %</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Syllabus Completion %</span>
          </div>
        </div>
      </div>

      {/* 6-Month Trend Analysis */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <h2 className="text-xl font-bold mb-6">6-Month Trend Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sixMonthTrends}>
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="month" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Area type="monotone" dataKey="attendance" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAttendance)" />
            <Area type="monotone" dataKey="engagement" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorEngagement)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Attendance Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm">Engagement Trend</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
      {onboardingStep >= 0 && <OnboardingWizard />}
      
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EduManage AI</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Smart Education Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('student')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    activeView === 'student' 
                      ? 'bg-white dark:bg-gray-600 shadow' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => setActiveView('faculty')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    activeView === 'faculty' 
                      ? 'bg-white dark:bg-gray-600 shadow' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'student' ? <StudentDashboard /> : <FacultyAnalytics />}
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Powered by AI • Built with React & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EduManagementSystem;
