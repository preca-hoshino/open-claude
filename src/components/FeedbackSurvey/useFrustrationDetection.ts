// Stub: components/FeedbackSurvey/useFrustrationDetection.ts
export function useFrustrationDetection(
  _messages: any[],
  _isLoading: boolean,
  _hasActivePrompt: boolean,
  _surveyClosed: boolean,
): { frustrated: boolean; state: 'open' | 'closed' | 'submitting' | 'thanks' | 'transcript_prompt' | 'submitted'; handleTranscriptSelect: () => void } {
  return { frustrated: false, state: 'closed', handleTranscriptSelect: () => {} }
}
