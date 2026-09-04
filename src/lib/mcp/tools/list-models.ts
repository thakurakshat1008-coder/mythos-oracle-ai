import { defineTool } from "@lovable.dev/mcp-js";
import { MCP_MODELS } from "../catalog";

export default defineTool({
  name: "list_models",
  title: "List Mythos models",
  description:
    "List every AI model Mythos can route to, with its exact model id, family, and routing path.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(MCP_MODELS, null, 2) }],
    structuredContent: { models: MCP_MODELS },
  }),
});
