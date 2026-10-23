import { getOfflineEvaluation } from "./offlineEvaluation";
const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000').replace(/\/$/, '');

export interface LiveEvaluation {
  ai_suggested_marks: number | null;
  max_marks: number;
  flagged: boolean;
  reasoning: string;
  semantic_mapping?: Array<{ rubric_step: string; student_phrase: string; keywords: string[]; match_score: string; verdict: string }>;
  manual_read_required?: boolean;
  ocr_confidence?: number;
  source?: 'gemini' | 'offline-demo' | 'safety-rule';
  model?: string;
  evidence_status?: 'provided_demo_reference' | 'not_provided' | 'insufficient';
}

export interface LiveOptions { question?: string; maxMarks?: number; rubric?: string; ncertText?: string }

export const DEFAULT_QUESTION = 'Why does the colour of copper sulphate solution change when an iron nail is dipped in it? Write the balanced equation.';
export const DEFAULT_RUBRIC = 'Up to 1 mark: iron is more reactive than copper and displaces copper from copper sulphate. Up to 1 mark: blue solution turns pale green due to iron sulphate. Up to 1 mark: balanced equation Fe + CuSO4 → FeSO4 + Cu.';

// Throws an Error with a short, readable message when no result can be produced.
export async function evaluateLive(answer: string, teacherMarks: number, opts: LiveOptions = {}): Promise<LiveEvaluation> {
  const question = (opts.question || '').trim() || DEFAULT_QUESTION;
  const max = Math.max(1, Math.min(20, Number.isFinite(opts.maxMarks) ? Number(opts.maxMarks) : 3));
  const isDefault = question === DEFAULT_QUESTION && max === 3;
  const safeTeacherMarks = Math.max(0, Math.min(max, Number.isFinite(teacherMarks) ? teacherMarks : 0));
  const rubric = (opts.rubric || '').trim() || (isDefault ? DEFAULT_RUBRIC : '');
  const ncertText = (opts.ncertText || '').trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${API_BASE}/api/evaluate-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question, student_answer: answer, teacher_marks: safeTeacherMarks, max_marks: max, ocr_confidence: 1, rubric,
        ncert_reference: ncertText ? 'NCERT excerpt supplied by moderator' : '', ncert_quote: ncertText
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      let msg = '';
      try { const j = await response.json(); msg = `${j.error || ''} ${j.detail || ''}`.trim(); } catch { /* ignore */ }
      throw new Error(`The AI service returned an error (${response.status}). ${msg}`.trim());
    }
    return await response.json() as LiveEvaluation;
  } catch (e) {
  console.error("Live evaluation failed:", e);

  // Only use demo fallback for API/server failures.
  return {
    ...getOfflineEvaluation(teacherMarks),
    max_marks: max,
    offline_demo: true,
    source: 'offline-demo' as const,
  } as LiveEvaluation;
  } finally {
    clearTimeout(timer);
  } 
}
