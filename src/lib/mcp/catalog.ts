export type McpModel = {
  id: string;
  label: string;
  family: string;
  hint: string;
  route: "lovable-gateway" | "openrouter";
};

export const MCP_MODELS: McpModel[] = [
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol", family: "GPT", hint: "Flagship reasoning", route: "lovable-gateway" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", family: "GPT", hint: "Balanced everyday", route: "lovable-gateway" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna", family: "GPT", hint: "Fast & lightweight", route: "lovable-gateway" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", family: "GPT", hint: "Frontier complex tasks", route: "lovable-gateway" },
  { id: "openai/gpt-5.4", label: "GPT-5.4", family: "GPT", hint: "Deep analysis", route: "lovable-gateway" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", family: "GPT", hint: "Quick reasoning", route: "lovable-gateway" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", family: "Gemini", hint: "Multimodal power", route: "lovable-gateway" },
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", family: "Gemini", hint: "Fast multimodal", route: "lovable-gateway" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini Flash Lite", family: "Gemini", hint: "Highest throughput", route: "lovable-gateway" },
  { id: "anthropic/claude-opus-4.1", label: "Claude Opus 4.1", family: "Claude", hint: "Deepest reasoning", route: "openrouter" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", family: "Claude", hint: "Best coding balance", route: "openrouter" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", family: "Claude", hint: "Reliable all-rounder", route: "openrouter" },
  { id: "x-ai/grok-4", label: "Grok 4", family: "Grok", hint: "Realtime wit", route: "openrouter" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", family: "Llama", hint: "Open weights", route: "openrouter" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", family: "DeepSeek", hint: "Chain-of-thought", route: "openrouter" },
  { id: "mistralai/mistral-large", label: "Mistral Large", family: "Mistral", hint: "European frontier", route: "openrouter" },
  { id: "manus/manus-agent", label: "Manus Agent", family: "Manus", hint: "Agentic mode (Claude Sonnet backend)", route: "openrouter" },
];

export const MCP_PERSONAS = [
  {
    id: "oracle",
    label: "The Oracle",
    tagline: "Wise, poetic, all-knowing",
    system:
      "You are Mythos, an ancient oracle reborn in silicon. Answer with clarity, warmth and a hint of poetic craft. Use markdown when useful.",
  },
  {
    id: "coder",
    label: "Code Sage",
    tagline: "Precise, senior engineer",
    system:
      "You are Mythos in Code Sage mode. Act as a senior software engineer. Give precise, minimal, correct code with brief rationale. Use markdown code blocks.",
  },
  {
    id: "muse",
    label: "The Muse",
    tagline: "Creative writing & storytelling",
    system:
      "You are Mythos, a creative muse. Craft vivid stories, verse, and imagery. Rich sensory language, tight prose.",
  },
  {
    id: "tutor",
    label: "The Tutor",
    tagline: "Patient, step-by-step teacher",
    system:
      "You are Mythos, a patient tutor. Explain step-by-step, check understanding, use analogies. Adapt to the learner's level.",
  },
  {
    id: "strategist",
    label: "The Strategist",
    tagline: "Analytical, decisive",
    system:
      "You are Mythos, a strategic advisor. Structure answers with clear frameworks, trade-offs, and a recommended path.",
  },
  {
    id: "dreamer",
    label: "The Dreamer",
    tagline: "Wild ideas, brainstorms",
    system:
      "You are Mythos, an unbounded ideator. Generate many bold, unusual ideas, then flag the top three worth pursuing.",
  },
] as const;
