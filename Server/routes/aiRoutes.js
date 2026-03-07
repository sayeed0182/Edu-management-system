// routes/aiRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All AI routes require authentication — prevents abuse of your API key
router.use(protect);

// ─────────────────────────────────────────────
// POST /api/ai/chat
// Proxy to Google Gemini API
//
// Request body: { prompt: string, context?: string }
// ─────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI service is not configured on the server.' });
    }

    // Build the message for Gemini
    const systemContext = context ||
      'You are EduBot, an intelligent assistant for Edu-Smart, an Educational Management System. ' +
      'You help students understand their academic performance, attendance, and study guidance. ' +
      'Be concise, friendly, and helpful.';

    const fullPrompt = `${systemContext}\n\nUser: ${prompt}`;

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API Error:', errorData);
      return res.status(geminiResponse.status).json({
        success: false,
        message: 'Failed to get response from AI service.',
        error:   errorData?.error?.message,
      });
    }

    const geminiData = await geminiResponse.json();

    // Extract the text from Gemini's response
    const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return res.status(500).json({ success: false, message: 'AI returned an empty response.' });
    }

    res.status(200).json({
      success:  true,
      response: aiText,
      model:    'gemini-pro',
    });
  } catch (err) {
    console.error('AI Route Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error in AI proxy.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/analyze-performance
// Sends a student's data to Gemini for AI analysis
// ─────────────────────────────────────────────
router.post('/analyze-performance', async (req, res) => {
  try {
    const { studentData } = req.body;

    if (!studentData) {
      return res.status(400).json({ success: false, message: 'Student data is required.' });
    }

    const prompt =
      `Analyze the following student's academic performance and provide actionable insights:\n\n` +
      `Student: ${studentData.name}\n` +
      `Attendance: ${studentData.attendancePercentage}%\n` +
      `Marks: ${JSON.stringify(studentData.marks, null, 2)}\n\n` +
      `Please provide:\n1. Overall performance assessment\n2. Subjects needing improvement\n3. Specific study recommendations\n4. Attendance impact analysis`;

    // Reuse the same Gemini call
    req.body.prompt  = prompt;
    req.body.context = 'You are an academic performance analyst for Edu-Smart. Provide detailed, constructive feedback.';

    // Forward to the /chat handler logic
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
    });

    const geminiData = await geminiResponse.json();
    const aiText     = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.status(200).json({ success: true, analysis: aiText });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
