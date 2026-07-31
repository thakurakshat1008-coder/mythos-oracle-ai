import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Models served through OpenRouter (Claude, Manus-style agent, Grok, Llama, DeepSeek, Mistral). */
export const OPENROUTER_MODELS: Record<string, string> = {
  "anthropic/claude-opus-4.1": "anthropic/claude-opus-4.1",
  "anthropic/claude-sonnet-4.5": "anthropic/claude-sonnet-4.5",
  "anthropic/claude-3.7-sonnet": "anthropic/claude-3.7-sonnet",
  "x-ai/grok-4": "x-ai/grok-4",
  "meta-llama/llama-3.3-70b-instruct": "meta-llama/llama-3.3-70b-instruct",
  "deepseek/deepseek-r1": "deepseek/deepseek-r1",
  "mistralai/mistral-large": "mistralai/mistral-large",
  // Manus has no public inference API; route its agentic persona to Claude Sonnet.
  "manus/manus-agent": "anthropic/claude-sonnet-4.5",
};

export function createOpenRouterProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mythos-oracle-ai.lovable.app",
      "X-Title": "Mythos",
    },
  });
}
