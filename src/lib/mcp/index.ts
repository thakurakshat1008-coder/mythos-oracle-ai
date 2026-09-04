import { auth, defineMcp } from "@lovable.dev/mcp-js";
import askMythos from "./tools/ask-mythos";
import listModels from "./tools/list-models";
import listPersonas from "./tools/list-personas";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "mythos-ai-hub",
  title: "Mythos AI Hub",
  version: "0.1.0",
  instructions:
    "Tools for Mythos, a multi-model AI console. Use `list_models` and `list_personas` to discover options, then `ask_mythos` to get an answer from a specific model and persona.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listModels, listPersonas, askMythos],
});
