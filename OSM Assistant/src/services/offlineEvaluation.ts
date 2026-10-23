
export function getOfflineEvaluation(teacherMarks: number) {
  const aiSuggestedMarks = Math.min(
    Math.max(teacherMarks + 1, 0),
    5
  );

  return {
    ai_suggested_marks: aiSuggestedMarks,
    teacher_marks: teacherMarks,
    flagged: Math.abs(aiSuggestedMarks - teacherMarks) >= 1,
    manual_read_required: false,
    reasoning:
      "OFFLINE DEMO: This is a sample result, not a live AI evaluation.",
    semantic_mapping: [],
    ncert_reference:
      "Demo reference only — verify against the official NCERT textbook.",
    offline_demo: true
  };
}
