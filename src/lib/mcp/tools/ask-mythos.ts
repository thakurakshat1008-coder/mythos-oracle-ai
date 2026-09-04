import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MCP_MODELS, MCP_PERSONAS } from "../catalog";

const OPENROUTER_MAP: Record<string, string> = {
  "manus/manus-agent": "anthropic/claude-sonnet-4.5",
};

function envVar(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name]?.trim() || undefined;
}

export default defineTool({
  name: "ask_mythos",
  title: "Ask Mythos",
  description:
    "Ask a question through Mythos using a specific model and persona. Returns the model's full answer as markdown.",
  inputSchema: {
    prompt: z.string().trim().min(1).describe("The question or instruction for Mythos."),
    model: z
      .string()
      .optional()
      .describe("Exact model id from list_models. Defaults to openai/gpt-5.6-sol."),
    persona: z
      .string()
      .optional()
      .describe("Persona id from list_personas. Defaults to oracle."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ prompt, model, persona }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const modelId = model?.trim() || "openai/gpt-5.6-sol";
    const entry = MCP_MODELS.find((m) => m.id === modelId);
    if (!entry) {
      throw new ToolError(`Unknown model "${modelId}". Call list_models for valid ids.`);
    }

    const personaId = persona?.trim() || "oracle";
    const personaEntry = MCP_PERSONAS.find((p) => p.id === personaId);
    if (!personaEntry) {
      throw new ToolError(`Unknown persona "${personaId}". Call list_personas for valid ids.`);
    }

    let url: string;
    let headers: Record<string, string>;
    let upstreamModel = modelId;

    if (entry.route === "openrouter") {
      const key = envVar("OPENROUTER_API_KEY");
      if (!key?.startsWith("sk-or-")) {
        throw new ToolError(
          `${entry.label} needs a valid OPENROUTER_API_KEY on the server. Pick a GPT or Gemini model instead.`,
        );
      }
      upstreamModel = OPENROUTER_MAP[modelId] ?? modelId;
      url = "https://openrouter.ai/api/v1/chat/completions";
      headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    } else {
      const key = envVar("LOVABLE_API_KEY");
      if (!key) throw new ToolError("LOVABLE_API_KEY is not configured on the server.");
      url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      headers = { "Lovable-API-Key": key, "Content-Type": "application/json" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: upstreamModel,
        messages: [
          { role: "system", content: personaEntry.system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new ToolError(`${entry.label} failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new ToolError(`${entry.label} returned an empty answer.`);

    return {
      content: [{ type: "text", text: answer }],
      structuredContent: { answer, model: entry.id, persona: personaEntry.id },
    };
  },
});
