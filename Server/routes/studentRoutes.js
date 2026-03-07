// routes/studentRoutes.js
const express = require('express');
const Student = require('../models/Student');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(protect);

// ─────────────────────────────────────────────
// GET /api/students
// Faculty can get all students; Students get only their own profile
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let students;

    if (req.user.role === 'Faculty') {
      // Faculty: return all students, optionally filtered by department
      const filter = {};
      if (req.query.department) filter.department = req.query.department;
      students = await Student.find(filter).select('-attendanceRecords');
    } else {
      // Student: return only their own profile
      students = await Student.find({ userId: req.user._id });
    }

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/students/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Students can only view their own profile
    if (req.user.role === 'Student' && student.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/students  (Faculty only)
// ─────────────────────────────────────────────
router.post('/', restrictTo('Faculty'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student ID or email already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/students/:id/marks  (Faculty only)
// Update a student's marks for a subject
// ─────────────────────────────────────────────
router.put('/:id/marks', restrictTo('Faculty'), async (req, res) => {
  try {
    const { subject, ca1, ca2, midterm, endterm } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Find existing subject entry or add new one
    const existingIdx = student.marks.findIndex((m) => m.subject === subject);
    if (existingIdx >= 0) {
      student.marks[existingIdx] = { subject, ca1, ca2, midterm, endterm };
    } else {
      student.marks.push({ subject, ca1, ca2, midterm, endterm });
    }

    await student.save();
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/students/:id  (Faculty only)
// ─────────────────────────────────────────────
router.delete('/:id', restrictTo('Faculty'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.status(200).json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
