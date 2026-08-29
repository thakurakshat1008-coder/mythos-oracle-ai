# Push Mythos to GitHub with a rich README

## What you need to do (one click, on your side)

I can't create the GitHub repo myself — the connection is authorized from your account. In this project:

1. Open the **Plus (+) menu** in the chat input (bottom left) → **GitHub** → **Connect project**
2. Authorize the Lovable GitHub App
3. Pick your GitHub account/organization
4. Click **Create Repository**

That creates a repo with all of the Mythos code and turns on two-way sync: anything I change here lands in the repo, and anything you push lands back here.

Repeat the same four steps inside your other project ([Pixel Perfect FPS](/projects/abce8bb4-00f7-4d99-b6a7-97ea3c36bf05), if that's the second website you meant) to give it its own repo — one repo per project, as you chose.

## What I'll do once you confirm

### 1. Capture real screenshots
Run the live app and capture:
- Landing screen with the hero, personas, and prompt starters
- An active chat with a markdown answer rendered
- The model selector open, showing GPT / Gemini / Claude / Grok / Manus entries
- Image-generation mode and the exported PDF page
- A mobile-width view

Saved into `docs/screenshots/` so GitHub renders them inline.

### 2. Write a long, polished README.md
Sections:
- Hero banner + badges (TanStack Start, React 19, Tailwind v4, Vite 7)
- What Mythos is, and a live demo link
- Screenshot gallery with captions
- Feature list: multi-model routing, 6 personas, streaming chat, file/photo attachments, voice transcription, image generation, vector PDF export, chat-history sidebar, PWA install, responsive layout
- Supported models table (provider, model id, routing path, status)
- Architecture diagram (ASCII) and a project file-structure map
- Getting started: clone, install, run, and the env vars (`LOVABLE_API_KEY`, `OPENROUTER_API_KEY`)
- API route reference: `/api/chat`, `/api/generate-image`, `/api/transcribe`
- Deployment notes, roadmap, license

### 3. Sanity pass
Verify every image path resolves, links work, and the code blocks match the real commands in `package.json`.

## Technical notes

- Screenshots are captured headless against the local dev server at 1280px and 420px widths, committed as JPEGs under `docs/screenshots/`.
- README references images with relative repo paths so they render on GitHub without external hosting.
- No app code changes — this is documentation plus assets only.
- Lovable's GitHub sync pushes the whole working tree, so the README and screenshots land in the repo automatically after the connection exists.

## Open question

You mentioned two websites but didn't name the second one. If it isn't Pixel Perfect FPS, tell me which project it is and I'll do the same README work there.
