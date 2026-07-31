import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createOpenRouterProvider, OPENROUTER_MODELS } from "@/lib/openrouter.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; model?: unknown; system?: unknown };

const GATEWAY_MODELS = new Set([
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-terra",
  "openai/gpt-5.6-luna",
  "openai/gpt-5.5",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.6-flash",
  "google/gemini-3.1-flash-lite",
]);

const DEFAULT_MODEL = "openai/gpt-5.6-sol";

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
        const orKey = process.env.OPENROUTER_API_KEY?.trim();

        const requested = typeof body.model === "string" ? body.model : DEFAULT_MODEL;

        const system =
          typeof body.system === "string" && body.system.trim().length > 0
            ? body.system
            : "You are Mythos — a wise, imaginative, and precise AI oracle. Answer with clarity, warmth, and a touch of poetic craft. Use markdown when helpful.";

        const messages = await convertToModelMessages(body.messages as UIMessage[]);

        // Route: OpenRouter for Claude/Manus/Grok/Llama/DeepSeek/Mistral, Lovable AI Gateway otherwise.
        // Route: OpenRouter for Claude/Manus/Grok/Llama/DeepSeek/Mistral, Lovable AI Gateway otherwise.
        // A malformed key would fail mid-stream, so fall back to the gateway up front.
        const useOpenRouter =
          Boolean(OPENROUTER_MODELS[requested]) && Boolean(orKey?.startsWith("sk-or-"));


        const runGateway = (modelId: string) => {
          const gateway = createLovableAiGatewayProvider(key);
          return streamText({
            model: gateway(modelId),
            system,
            messages,
            providerOptions: { lovable: { reasoningEffort: "none" } },
          });
        };

        try {
          if (useOpenRouter) {
            const openrouter = createOpenRouterProvider(orKey!);
            try {
              const result = streamText({
                model: openrouter(OPENROUTER_MODELS[requested]),
                system,
                messages,
              });
              return result.toUIMessageStreamResponse({
                originalMessages: body.messages as UIMessage[],
              });
            } catch (err) {
              // Fallback to the gateway default if OpenRouter rejects the model/key.
              console.error("openrouter error, falling back", err);
            }
          }

          const modelId = GATEWAY_MODELS.has(requested) ? requested : DEFAULT_MODEL;
          const result = runGateway(modelId);
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
