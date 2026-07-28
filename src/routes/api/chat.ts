import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; model?: unknown; system?: unknown };

const ALLOWED_MODELS = new Set([
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-terra",
  "openai/gpt-5.6-luna",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.6-flash",
  "google/gemini-3.1-flash-lite",
]);

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const modelId =
          typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
            ? body.model
            : "openai/gpt-5.6-sol";

        const system =
          typeof body.system === "string" && body.system.trim().length > 0
            ? body.system
            : "You are Mythos — a wise, imaginative, and precise AI oracle. Answer with clarity, warmth, and a touch of poetic craft. Use markdown when helpful.";

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(modelId);

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            providerOptions: { lovable: { reasoningEffort: "none" } },
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (err) {
          console.error("chat error", err);
          return new Response("AI gateway error", { status: 500 });
        }
      },
    },
  },
});
