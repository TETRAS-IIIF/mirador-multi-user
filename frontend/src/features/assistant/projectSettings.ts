/**
 * The assistant's settings for one project, stored in the project's metadata,
 * where mmu-agents-backend reads them: `assistantEnabled` (used when the
 * instance only serves opted-in projects) and `assistantInstructions`.
 */
export type AssistantProjectSettings = {
  enabled: boolean;
  instructions: string;
};

/** The assistant reads at most this many characters of instructions. */
export const MAX_ASSISTANT_INSTRUCTIONS = 8000;

export function readAssistantSettings(
  metadata: Record<string, unknown> | null | undefined,
): AssistantProjectSettings {
  const instructions = metadata?.assistantInstructions;
  return {
    enabled: metadata?.assistantEnabled === true,
    instructions: typeof instructions === 'string' ? instructions : '',
  };
}

/** The project's metadata with these settings; every other key is kept. */
export function withAssistantSettings<T extends Record<string, unknown>>(
  metadata: T | null | undefined,
  settings: AssistantProjectSettings,
): T & { assistantEnabled: boolean; assistantInstructions: string } {
  return {
    ...((metadata ?? {}) as T),
    assistantEnabled: settings.enabled,
    assistantInstructions: settings.instructions
      .trim()
      .slice(0, MAX_ASSISTANT_INSTRUCTIONS),
  };
}
