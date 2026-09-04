import { defineTool } from "@lovable.dev/mcp-js";
import { MCP_PERSONAS } from "../catalog";

export default defineTool({
  name: "list_personas",
  title: "List Mythos personas",
  description:
    "List the Mythos personas (Oracle, Code Sage, Muse, Tutor, Strategist, Dreamer) that shape how answers are written.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const personas = MCP_PERSONAS.map((p) => ({ id: p.id, label: p.label, tagline: p.tagline }));
    return {
      content: [{ type: "text", text: JSON.stringify(personas, null, 2) }],
      structuredContent: { personas },
    };
  },
});
