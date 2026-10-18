/**
 * Whether an AI service is connected. Milestone 1 has none, so every feature that needs a model (the tutor,
 * automatic scoring, better handwriting transcription) shows what it needs instead of pretending. Milestone 2
 * replaces this with real connection state from Settings.
 */
export interface AiStatus {
  connected: boolean;
  /** True while connecting is not possible yet, so messages can say "coming soon" instead of "in Settings". */
  comingSoon: boolean;
}

const STATUS: AiStatus = { connected: false, comingSoon: true };

export const useAi = (): AiStatus => STATUS;
