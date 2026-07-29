import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || typeof prompt !== "string") {
          return new Response("Prompt required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });
        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        const json = (await upstream.json()) as {
          choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
          data?: Array<{ b64_json?: string; url?: string }>;
        };
        const fromChoices = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        const fromData = json.data?.[0]?.b64_json
          ? `data:image/png;base64,${json.data[0].b64_json}`
          : json.data?.[0]?.url;
        const url = fromChoices || fromData;
        if (!url) return new Response("No image returned", { status: 502 });
        return Response.json({ url });
      },
    },
  },
});
