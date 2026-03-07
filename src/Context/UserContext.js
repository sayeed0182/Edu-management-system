// UserContext.js
// Global state management for EduSmart App
// Provides userRole, studentData, facultyData, and auth actions via Context API

import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Context Definition ────────────────────────────────────────────────────────
export const UserContext = createContext(null);

// ─── Static Mock Data ──────────────────────────────────────────────────────────
const STUDENT_DATA = {
  name: "Alex Johnson",
  id: "STU-88291",
  attendance: 84,
  major: "Computer Science",
  semester: "4th Semester",
  feeAmount: 112000,
  attendanceTrend: [
    { month: "Aug", attendance: 78 },
    { month: "Sep", attendance: 82 },
    { month: "Oct", attendance: 80 },
    { month: "Nov", attendance: 88 },
    { month: "Dec", attendance: 84 },
    { month: "Jan", attendance: 91 },
  ],
  gradeDistribution: [
    { name: "A", value: 4, color: "#6366f1" },
    { name: "A-", value: 2, color: "#818cf8" },
    { name: "B+", value: 2, color: "#a5b4fc" },
    { name: "B", value: 1, color: "#c7d2fe" },
  ],
  results: [
    {
      sem: "Semester 1",
      gpa: "3.75",
      status: "Pass",
      subjects: [
        { name: "Mathematics I", grade: "A", credits: 4, marks: 92 },
        { name: "Introduction to Programming", grade: "A-", credits: 3, marks: 88 },
        { name: "Physics", grade: "B+", credits: 4, marks: 82 },
      ],
    },
    {
      sem: "Semester 2",
      gpa: "3.85",
      status: "Pass",
      subjects: [
        { name: "Mathematics II", grade: "A", credits: 4, marks: 90 },
        { name: "Data Structures", grade: "A", credits: 4, marks: 94 },
        { name: "Digital Logic", grade: "A-", credits: 3, marks: 87 },
      ],
    },
  ],
  assessments: [
    { id: 1, name: "Quiz 1", subject: "Data Structures", status: "Completed", score: "18/20", date: "Jan 15, 2026" },
    { id: 2, name: "Quiz 2", subject: "Algorithms", status: "Pending", score: "-", date: "Feb 10, 2026" },
  ],
};

const FACULTY_DATA = {
  name: "Dr. Sarah Williams",
  id: "FAC-1029",
  department: "CSE Department",
  managedStudents: [
    { id: "S001", name: "John Doe",        email: "john@uni.edu",    attendance: "88%", performance: "Excellent" },
    { id: "S002", name: "Jane Smith",      email: "jane@uni.edu",    attendance: "92%", performance: "Good" },
    { id: "S003", name: "Mike Ross",       email: "mike@uni.edu",    attendance: "74%", performance: "Average" },
    { id: "S004", name: "Rachel Zane",     email: "rachel@uni.edu",  attendance: "98%", performance: "Excellent" },
    { id: "S005", name: "Harvey Specter",  email: "harvey@uni.edu",  attendance: "85%", performance: "Excellent" },
    { id: "S006", name: "Louis Litt",      email: "louis@uni.edu",   attendance: "99%", performance: "Good" },
    { id: "S007", name: "Donna Paulsen",   email: "donna@uni.edu",   attendance: "100%",performance: "Excellent" },
    { id: "S008", name: "Jessica Pearson", email: "jessica@uni.edu", attendance: "95%", performance: "Excellent" },
    { id: "S009", name: "Robert Zane",     email: "robert@uni.edu",  attendance: "82%", performance: "Average" },
  ],
  syllabusTracking: [
    { subject: "Human Computer Interaction",    completed: 85, totalModules: 5  },
    { subject: "Data Structures & Algorithms",  completed: 60, totalModules: 8  },
    { subject: "AI & Machine Learning",         completed: 40, totalModules: 10 },
  ],
  marksData: [
    { id: "S001", name: "John Doe",    ca1: 18, ca2: 20, ca3: 17, midterm: 45, endterm: 88 },
    { id: "S002", name: "Jane Smith",  ca1: 19, ca2: 18, ca3: 20, midterm: 48, endterm: 90 },
    { id: "S003", name: "Mike Ross",   ca1: 15, ca2: 16, ca3: 14, midterm: 38, endterm: 75 },
    { id: "S004", name: "Rachel Zane", ca1: 20, ca2: 20, ca3: 19, midterm: 50, endterm: 95 },
  ],
  attendanceTrend: [
    { month: "Aug", avg: 82 },
    { month: "Sep", avg: 87 },
    { month: "Oct", avg: 85 },
    { month: "Nov", avg: 91 },
    { month: "Dec", avg: 88 },
    { month: "Jan", avg: 93 },
  ],
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // 'student' | 'faculty' | null
  const [marksData, setMarksData] = useState(FACULTY_DATA.marksData);

  // Derived data with live marksData
  const facultyData = { ...FACULTY_DATA, marksData };

  // Auth helpers
  const login = useCallback((role) => {
    setUserRole(role);
  }, []);

  const logout = useCallback(() => {
    setUserRole(null);
    setMarksData(FACULTY_DATA.marksData); // reset
  }, []);

  // Marks mutation
  const updateMark = useCallback((studentId, field, value) => {
    setMarksData((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, [field]: value === '' ? 0 : parseInt(value) || 0 }
          : s
      )
    );
  }, []);

  const value = {
    userRole,
    studentData: STUDENT_DATA,
    facultyData,
    login,
    logout,
    updateMark,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// ─── Custom Hook ───────────────────────────────────────────────────────────────
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
};
