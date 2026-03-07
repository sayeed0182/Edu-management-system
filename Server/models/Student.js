// models/Student.js
const mongoose = require('mongoose');

// --- Sub-schema for academic marks per subject ---
const subjectMarksSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    ca1:     { type: Number, min: 0, max: 20, default: 0 },  // Max 20 marks
    ca2:     { type: Number, min: 0, max: 20, default: 0 },  // Max 20 marks
    midterm: { type: Number, min: 0, max: 30, default: 0 },  // Max 30 marks
    endterm: { type: Number, min: 0, max: 50, default: 0 },  // Max 50 marks
  },
  { _id: false } // Don't create a separate _id for each sub-document
);

// --- Sub-schema for individual attendance records ---
const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId:   { type: String, required: true },
    subject:     { type: String, required: true, trim: true },
    date:        { type: Date,   required: true },
    status:      { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    markedViaQR: { type: Boolean, default: false },
    timestamp:   { type: Date,   default: Date.now },
  },
  { _id: false }
);

// --- Main Student Schema ---
const studentSchema = new mongoose.Schema(
  {
    // Personal Info
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // Example format: STU-2024-001
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // Academic Info
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    batch: {
      type: String, // e.g., "2022-2026"
      trim: true,
    },

    // Attendance
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    attendanceRecords: [attendanceRecordSchema],

    // Academic Marks (array of subjects)
    marks: [subjectMarksSchema],

    // Reference back to the User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    // Add a virtual field for total marks calculation
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- VIRTUAL: Calculate total marks for each subject ---
studentSchema.virtual('subjectTotals').get(function () {
  return this.marks.map((m) => ({
    subject: m.subject,
    total:   m.ca1 + m.ca2 + m.midterm + m.endterm,
    grade:   calculateGrade(m.ca1 + m.ca2 + m.midterm + m.endterm),
  }));
});

// --- HELPER: Grade calculator ---
function calculateGrade(total) {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

// --- METHOD: Recalculate attendance percentage ---
studentSchema.methods.recalculateAttendance = function () {
  const records = this.attendanceRecords;
  if (records.length === 0) {
    this.attendancePercentage = 0;
    return;
  }
  const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  this.attendancePercentage = Math.round((present / records.length) * 100);
};

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
