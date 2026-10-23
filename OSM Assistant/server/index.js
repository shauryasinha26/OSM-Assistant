import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT || 8000);
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);

app.use(cors({ origin(origin, callback) {
  // Local hackathon demo default. Configure FRONTEND_ORIGIN for deployment.
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'));
} }));
app.use(express.json({ limit: '64kb', strict: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true, modelConfigured: Boolean(process.env.GEMINI_API_KEY), model: MODEL }));

app.post('/api/evaluate-live', async (req, res) => {
  const body = req.body ?? {};
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const answer = typeof body.student_answer === 'string' ? body.student_answer.trim() : '';
  const teacherMarks = Number(body.teacher_marks);
  const maxMarks = Number(body.max_marks);
  let confidence = body.ocr_confidence == null ? 1 : Number(body.ocr_confidence);
  if (confidence > 1 && confidence <= 100) confidence /= 100;

  if (!question || question.length > 3000 || !answer || answer.length > 12000) {
    return res.status(400).json({ error: 'Provide a question and student answer within the allowed length.' });
  }
  if (!isFiniteNumber(teacherMarks) || !isFiniteNumber(maxMarks) || maxMarks <= 0 || maxMarks > 100 || teacherMarks < 0 || teacherMarks > maxMarks) {
    return res.status(400).json({ error: 'Marks must be valid numbers and teacher_marks must be between 0 and max_marks.' });
  }
  if (!isFiniteNumber(confidence) || confidence < 0 || confidence > 1) {
    return res.status(400).json({ error: 'ocr_confidence must be between 0 and 1, or 0 and 100.' });
  }
  // Playbook safety rule: low OCR confidence means no marks may be suggested.
  if (confidence < 0.75) {
    return res.json({ manual_read_required: true, ocr_confidence: confidence, ai_suggested_marks: null, max_marks: maxMarks, flagged: false, source: 'safety-rule', reasoning: 'OCR confidence is below 0.75. No mark suggestion was generated; route this answer for manual reading.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to the project root .env file.' });
  }

  const ncertReference = typeof body.ncert_reference === 'string' ? body.ncert_reference.slice(0, 500) : '';
  const ncertQuote = typeof body.ncert_quote === 'string' ? body.ncert_quote.slice(0, 2500) : '';
  const rubric = typeof body.rubric === 'string' ? body.rubric.slice(0, 3000) : '';
  const prompt = `You are a cautious CBSE Class 10 Science second-opinion assistant. You advise a human moderator; you never change official marks.
Evaluate the answer against the question, max marks, and rubric. Award partial credit for scientifically correct meaning expressed in a student's own words. Do not reward keyword stuffing when causal logic is wrong. Use the NCERT Class 10 Science textbook (CBSE) as the reference for concepts and terminology; if no rubric is supplied, first derive a step-wise CBSE-style marking scheme for this question and the maximum marks, then grade against it. Do not invent NCERT citations or quotes. If supplied NCERT evidence is absent or insufficient, say so plainly.
Return ONLY one valid JSON object with these keys and value types. Example structure (use values appropriate to this answer):
{"ai_suggested_marks": 1, "reasoning": "Brief evidence-based explanation", "semantic_mapping": [{"rubric_step": "Required concept", "student_phrase": "Relevant phrase or empty string", "keywords": ["concept"], "match_score": "Not quantified", "verdict": "Moderator review required"}], "ncert_reference": "", "ncert_quote": "", "evidence_status": "insufficient"}
evidence_status must be exactly one of: provided_demo_reference, not_provided, insufficient.
Rules: score must be between 0 and max marks; reasoning must be concise and evidence-based; do not claim a quote is verified unless verification was supplied; never change teacher_marks. OCR below 0.75 must not be graded.
Question: ${question}
Student answer: ${answer}
Teacher marks (read-only): ${teacherMarks}/${maxMarks}
Maximum marks: ${maxMarks}
OCR confidence: ${confidence}
Rubric/context: ${rubric || 'No detailed rubric supplied; use only the question and standard Class 10 Science concepts.'}
NCERT reference supplied by app: ${ncertReference || 'None'}
NCERT quote supplied by app (may be demo data; do not assume independently verified): ${ncertQuote || 'None'}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const t0 = Date.now();
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 700, thinkingConfig: { thinkingBudget: 0 } } });
    console.log(`Gemini answered in ${Date.now() - t0} ms`);
    if (!response.text) throw new Error('The model returned an empty response.');
    const parsed = JSON.parse(response.text);
    if (!isFiniteNumber(parsed.ai_suggested_marks) || typeof parsed.reasoning !== 'string') throw new Error('The model response did not match the expected schema.');
    const marks = Math.round(clamp(parsed.ai_suggested_marks, 0, maxMarks) * 100) / 100;
    const semanticMapping = Array.isArray(parsed.semantic_mapping) ? parsed.semantic_mapping.slice(0, 8).map(m => ({
      rubric_step: String(m?.rubric_step ?? '').slice(0, 500),
      student_phrase: String(m?.student_phrase ?? '').slice(0, 500),
      keywords: Array.isArray(m?.keywords) ? m.keywords.slice(0, 8).map(String) : [],
      match_score: String(m?.match_score ?? 'Not quantified').slice(0, 80),
      verdict: String(m?.verdict ?? 'Moderator review required').slice(0, 250)
    })) : [];
    return res.json({
      ai_suggested_marks: marks, max_marks: maxMarks, flagged: Math.abs(marks - teacherMarks) >= 1,
      reasoning: parsed.reasoning.slice(0, 2500), semantic_mapping: semanticMapping,
      ncert_reference: String(parsed.ncert_reference ?? ncertReference ?? '').slice(0, 500),
      ncert_quote: String(parsed.ncert_quote ?? '').slice(0, 2500),
      evidence_status: ['provided_demo_reference', 'not_provided', 'insufficient'].includes(parsed.evidence_status) ? parsed.evidence_status : 'insufficient',
      manual_read_required: false, ocr_confidence: confidence, source: 'gemini', model: MODEL
    });
  } catch (error) {
    console.error('Evaluation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(502).json({ error: 'Live AI evaluation failed. Retry or use the clearly labelled offline demo mode.', detail: process.env.NODE_ENV === 'development' ? String(error) : undefined });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request body.' });
  if (err?.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'Frontend origin is not allowed.' });
  console.error('Server error:', err?.message || err);
  return res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => console.log(`OSM API listening on http://localhost:${PORT} (${MODEL})`));